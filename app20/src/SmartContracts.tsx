"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Types for Smart Contract components
interface SolidityFile {
  name: string;
  code: string;
}

interface ContractDetails {
  contractAddress: string;
  abi: any;
}

interface FormData {
  platform: string;
  environment: number;
  contractTitle: string;
  solidityFiles: SolidityFile[];
  constructorArgs: (string | number)[];
  userPrivateKey: string;
}

// ABI Interface Component with Ethers integration
function AbiInterface({ contractAddress, abi, platform, userPrivateKey }: {
  contractAddress: string;
  abi: any;
  platform: string;
  userPrivateKey: string;
}) {
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [inputs, setInputs] = useState<Record<string, any[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<Record<string, boolean>>({});

  const providerUrls = {
    Ethereum: "https://sepolia.infura.io/v3/c821007d520e417ba5ae6ee73c417fdd",
    Celo: "https://alfajores-forno.celo-testnet.org",
  };

  const handleInputChange = (funcName: string, index: number, value: any) => {
    setInputs((prev) => {
      const newArr = prev[funcName] ? [...prev[funcName]] : [];
      newArr[index] = value;
      return { ...prev, [funcName]: newArr };
    });
  };

  const handleCallFunction = async (func: any) => {
    const funcName = func.name;
    setIsExecuting(prev => ({ ...prev, [funcName]: true }));
    
    try {
      const args = (inputs[funcName] || []).map((arg) => arg);
      
      // Create provider and wallet
      const provider = new ethers.JsonRpcProvider(providerUrls[platform as keyof typeof providerUrls]);
      const wallet = new ethers.Wallet(userPrivateKey, provider);
      const contract = new ethers.Contract(contractAddress, abi, wallet);
      
      let result;
      if (func.stateMutability === "view" || func.stateMutability === "pure") {
        // Read function
        result = await contract[funcName](...args);
        console.log(`Called ${funcName} with args:`, args, "Result:", result);
      } else {
        // Write function
        const tx = await contract[funcName](...args);
        await tx.wait();
        result = `Transaction successful. Hash: ${tx.hash}`;
        console.log(`Executed ${funcName} with args:`, args, "TX Hash:", tx.hash);
      }
      
      setOutputs((prev) => ({ 
        ...prev, 
        [funcName]: typeof result === 'object' ? JSON.stringify(result, null, 2) : result.toString()
      }));
    } catch (err: any) {
      console.error("Error executing function:", err);
      setOutputs((prev) => ({
        ...prev,
        [funcName]: "Error: " + err.message,
      }));
    } finally {
      setIsExecuting(prev => ({ ...prev, [funcName]: false }));
    }
  };

  if (!abi || abi.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">🔧 Contract Interface</h3>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {abi
        .filter((item: any) => item.type === "function")
        .map((func: any, idx: number) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md mb-4 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">{func.name}</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {func.inputs.map((input: any, i: number) => (
                <div key={i}>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    {input.name || `arg${i}`} ({input.type})
                  </label>
                  <input
                    type="text"
                    value={(inputs[func.name] && inputs[func.name][i]) || ""}
                    onChange={(e) => handleInputChange(func.name, i, e.target.value)}
                    className="w-full p-3 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter ${input.type}`}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => handleCallFunction(func)}
              disabled={isExecuting[func.name]}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 sm:px-6 py-2 rounded-lg transition-all mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting[func.name] ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Executing...
                </div>
              ) : (
                func.stateMutability === "view" || func.stateMutability === "pure"
                  ? "📖 Call"
                  : "📝 Send Transaction"
              )}
            </button>

            {outputs[func.name] && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Output:</p>
                <pre className="text-sm overflow-x-auto text-gray-800 dark:text-gray-200">
                  {outputs[func.name]}
                </pre>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

function SandpackEditor({ value, onChange, fileName }) {
  const files = {
    [fileName]: {
      code: value,
      active: true,
    },
  };

  return (
    <SandpackProvider template="vanilla" files={files} options={{
      showOpenInCodeSandbox: false,
    }}>
      <SandpackCodeEditor
        showLineNumbers
        showTabs
        onCodeUpdate={(newCode) => onChange(newCode)}
      />
    </SandpackProvider>
  );
}

// Smart Contract IDE Component
function SmartContractIDE({ currentNetwork }: { currentNetwork: "testnet" | "mainnet" }) {
  const [formData, setFormData] = useState<FormData>({
    platform: "Celo",
    environment: 0, // Will be updated based on currentNetwork
    contractTitle: "MyToken",
    solidityFiles: [
      {
        name: "index",
        code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Token.sol";
import "./Owned.sol";

contract MyToken is Token, Owned {
    constructor(uint256 initialSupply) Token("MyToken", "MTK", initialSupply) {
        owner = msg.sender;
    }
}`,
      },
      {
        name: "Token",
        code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Token {
    string public name;
    string public symbol;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;
    }

    function transfer(address _to, uint256 _amount) public returns (bool success) {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
        return true;
    }
}`,
      },
      {
        name: "Owned",
        code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Owned {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }
}`,
      },
    ],
    constructorArgs: [1000000],
    userPrivateKey: "",
  });

  const [contractDetails, setContractDetails] = useState<ContractDetails | null>(null);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletInfo, setWalletInfo] = useState<{ address: string; privateKey: string } | null>(null);
  
  // Convex mutation for sending emails
  const sendEmail = useMutation(api.emails.sendEmail);

  // Load wallet info from localStorage on component mount
  useEffect(() => {
    const loadWalletInfo = () => {
      try {
        const walletData = localStorage.getItem("wallet");
        if (walletData) {
          const parsed = JSON.parse(walletData);
          if (parsed[currentNetwork]?.privateKey && parsed[currentNetwork]?.address) {
            const walletInfo = {
              address: parsed[currentNetwork].address,
              privateKey: parsed[currentNetwork].privateKey
            };
            setWalletInfo(walletInfo);
            
            // Auto-fill the private key input
            setFormData(prev => ({
              ...prev,
              userPrivateKey: walletInfo.privateKey
            }));
            
            console.log("Wallet info loaded for", currentNetwork, ":", walletInfo.address);
          } else {
            console.log("No wallet found for network:", currentNetwork);
            setWalletInfo(null);
            // Clear the private key input if no wallet
            setFormData(prev => ({
              ...prev,
              userPrivateKey: ""
            }));
          }
        } else {
          console.log("No wallet data found in localStorage");
          setWalletInfo(null);
        }
      } catch (error) {
        console.error("Error loading wallet info:", error);
        setWalletInfo(null);
      }
    };

    loadWalletInfo();
  }, [currentNetwork]);

  // Initial wallet load on component mount
  useEffect(() => {
    const walletData = localStorage.getItem("wallet");
    if (walletData) {
      try {
        const parsed = JSON.parse(walletData);
        const currentWallet = parsed[currentNetwork];
        if (currentWallet?.privateKey && currentWallet?.address) {
          setWalletInfo({
            address: currentWallet.address,
            privateKey: currentWallet.privateKey
          });
          setFormData(prev => ({
            ...prev,
            userPrivateKey: currentWallet.privateKey
          }));
          console.log("Initial wallet load successful for", currentNetwork);
        }
      } catch (error) {
        console.error("Error in initial wallet load:", error);
      }
    }
  }, []); // Only run once on mount

  // Update environment when network changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      environment: currentNetwork === "testnet" ? 0 : 1
    }));
  }, [currentNetwork]);

  const apiEndpoints = {
    Network: "",
    Celo: "https://oathstone-api.azurewebsites.net/celo",
    Ethereum: "https://oathstone-api.azurewebsites.net/eth",
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (index: number, key: keyof SolidityFile, value: string) => {
    const updatedFiles = [...formData.solidityFiles];
    updatedFiles[index][key] = value;
    setFormData((prev) => ({
      ...prev,
      solidityFiles: updatedFiles,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResponse("Submitting...");

    const apiEndpoint = apiEndpoints[formData.platform as keyof typeof apiEndpoints];
    if (!apiEndpoint) {
      setResponse("Error: Invalid blockchain platform selected.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post(apiEndpoint, formData, {
        headers: { "Content-Type": "application/json" },
      });
      setResponse(JSON.stringify(res.data, null, 2));

      if (res.data.contractAddress && res.data.abi) {
        setContractDetails({
          contractAddress: res.data.contractAddress,
          abi: res.data.abi,
        });
      }

      // Send response to user's email
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const emailBody = `Your smart contract "${formData.contractTitle}" has been deployed successfully to ${currentNetwork === "testnet" ? "Testnet" : "Mainnet"}!

Platform: ${formData.platform}
Environment: ${currentNetwork === "testnet" ? 'Testnet' : 'Mainnet'}

API Response:
${JSON.stringify(res.data, null, 2)}

Contract Details:
Contract Address: ${res.data.contractAddress || 'N/A'}
ABI: ${res.data.abi ? 'Available' : 'Not available'}

Deployed at: ${new Date().toLocaleString()}`;

          // Send email using Convex Resend
          await sendEmail({
            to: userEmail,
            subject: `Smart Contract Deployment to ${currentNetwork === "testnet" ? "Testnet" : "Mainnet"} - ${formData.contractTitle}`,
            body: emailBody
          });
          console.log('Email sent successfully to:', userEmail);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the main operation if email fails
      }
    } catch (error: any) {
      if (error.response) {
        setResponse(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
      } else if (error.message) {
        setResponse(`Error: ${error.message}`);
      } else {
        setResponse("Error: Unknown error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateChange = (value: string) => {
    let newFiles: SolidityFile[] = [];

    if (value === "Token") {
      newFiles = formData.solidityFiles.slice(0, 3);
    } else if (value === "HelloWorld") {
      newFiles = [
        {
          name: "index",
          code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloWorld {
    string public message;

    constructor(string memory initialMessage) {
        message = initialMessage;
    }

    function getMessage() public view returns (string memory) {
        return message;
    }

    function setMessage(string memory newMessage) public {
        message = newMessage;
    }
}`,
        },
      ];
      setFormData((prev) => ({
        ...prev,
        constructorArgs: ["Hello World"],
      }));
    } else if (value === "Blank") {
      newFiles = [
        {
          name: "index",
          code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Empty {
    // Empty contract
}`,
        },
      ];
    }

    setFormData((prev) => ({
      ...prev,
      solidityFiles: newFiles,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              ⚒️ Smart Contract IDE
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Deploy and interact with smart contracts on multiple blockchains
            </p>
            
            {/* Network Indicator */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              currentNetwork === "testnet" 
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
            }`}>
              <span className="text-lg">
                {currentNetwork === "testnet" ? "🧪" : "🌐"}
              </span>
              <span>
                {currentNetwork === "testnet" ? "Testnet Mode" : "Mainnet Mode"}
              </span>
            </div>
          </div>

          {!walletInfo && (
            <div className="mb-8 p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">⚠️ No Wallet Found for {currentNetwork === "testnet" ? "Testnet" : "Mainnet"}</h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Please sign up or sign in to create a wallet first. Your {currentNetwork === "testnet" ? "testnet" : "mainnet"} private key will be automatically loaded.
              </p>
            </div>
          )}


          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Blockchain Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => handleChange("platform", e.target.value)}
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.keys(apiEndpoints).map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Environment</label>
              <select
                value={formData.environment}
                onChange={(e) => handleChange("environment", parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Testnet</option>
                <option value={1}>Mainnet</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Select Template</label>
              <select
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose template...</option>
                <option value="Token">Token</option>
                <option value="HelloWorld">HelloWorld</option>
                <option value="Blank">Blank</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contract Title</label>
              <input
                type="text"
                value={formData.contractTitle}
                onChange={(e) => handleChange("contractTitle", e.target.value)}
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Solidity Files */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">📁 Contract Files</h3>
            {formData.solidityFiles.map((file, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 bg-gray-50 dark:bg-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">File Name</label>
                    <input
                      type="text"
                      value={file.name}
                      onChange={(e) => handleFileChange(index, "name", e.target.value)}
                      className="w-full p-3 border rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const updatedFiles = formData.solidityFiles.filter((_, i) => i !== index);
                        handleChange("solidityFiles", updatedFiles);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-all w-full sm:w-auto"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                
                <SandpackEditor
                  value={file.code}
                  onChange={(value) => handleFileChange(index, "code", value)}
                  fileName={file.name}
                />
              </div>
            ))}
          </div>

          <div className="mb-8">
            <button
              onClick={() => {
                const newFiles: SolidityFile[] = [
                  ...formData.solidityFiles,
                  {
                    name: "NewFile",
                    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NewFile {
    // New file code goes here
}`,
                  },
                ];
                handleChange("solidityFiles", newFiles);
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-all font-medium"
            >
              ➕ Add New File
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Constructor Arguments</label>
              <input
                type="text"
                value={formData.constructorArgs[0] || ""}
                onChange={(e) => handleChange("constructorArgs", [e.target.value])}
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Private Key {walletInfo && <span className="text-green-600">(Auto-loaded from {currentNetwork})</span>}
              </label>
              <input
                type="password"
                value={formData.userPrivateKey}
                placeholder={walletInfo ? `${currentNetwork === "testnet" ? "Testnet" : "Mainnet"} private key loaded from wallet` : "Paste Your Private Key Here"}
                onChange={(e) => handleChange("userPrivateKey", e.target.value)}
                className={`w-full p-3 border rounded-lg text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  walletInfo ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'
                }`}
                readOnly={!!walletInfo}
              />
              {walletInfo && (
                <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                  ✅ Automatically loaded from your {currentNetwork === "testnet" ? "testnet" : "mainnet"} wallet
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !walletInfo}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg mb-8 transition-all transform hover:scale-105"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin w-6 h-6 border-3 border-current border-t-transparent rounded-full"></div>
                Deploying...
              </div>
            ) : !walletInfo ? (
              "🔒 Please Connect Wallet First"
            ) : (
              `🚀 Deploy Contract to ${currentNetwork === "testnet" ? "Testnet" : "Mainnet"}`
            )}
          </button>

          {/* Terminal Output */}
          {response && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">📺 Terminal Output:</h3>
              <pre className="bg-black text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono border border-gray-700">
                {response}
              </pre>
            </div>
          )}

          {/* ABI Interface */}
          {contractDetails && formData.userPrivateKey && (
            <AbiInterface
              contractAddress={contractDetails.contractAddress}
              abi={contractDetails.abi}
              platform={formData.platform}
              userPrivateKey={formData.userPrivateKey}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Main export
export default SmartContractIDE;