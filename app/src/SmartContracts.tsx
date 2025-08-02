"use client";



import { api } from "../convex/_generated/api";
import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";

// Mock auth and Convex hooks for demonstration
const useConvexAuth = () => ({ isAuthenticated: true });
const useQuery = () => [];
const useMutation = () => async (data) => {
  console.log("Mock mutation called with:", data);
  return { success: true };
};
const useAuthActions = () => ({ 
  signIn: async () => {},
  signOut: async () => {}
});

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
function AbiInterface({ contractAddress, abi, platform, userPrivateKey }) {
  const [outputs, setOutputs] = useState({});
  const [inputs, setInputs] = useState({});
  const [error, setError] = useState(null);
  const [isExecuting, setIsExecuting] = useState({});
  const sendEmail = useMutation();

  const providerUrls = {
    Ethereum: "https://sepolia.infura.io/v3/c821007d520e417ba5ae6ee73c417fdd",
    Celo: "https://alfajores-forno.celo-testnet.org",
  };

  const handleInputChange = (funcName, index, value) => {
    setInputs((prev) => {
      const newArr = prev[funcName] ? [...prev[funcName]] : [];
      newArr[index] = value;
      return { ...prev, [funcName]: newArr };
    });
  };

  const handleCallFunction = async (func) => {
    const funcName = func.name;
    setIsExecuting(prev => ({ ...prev, [funcName]: true }));
    
    try {
      const args = (inputs[funcName] || []).map((arg) => arg);
      
      // Create provider and wallet
      const provider = new ethers.JsonRpcProvider(providerUrls[platform]);
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
        
        // Send success email and add to email history
        const walletData = JSON.parse(localStorage.getItem("wallet") || "{}");
        const userEmail = walletData.wallet?.email || "user@example.com";
        
        const emailData = {
          to: userEmail,
          subject: `Smart Contract Function Executed: ${funcName}`,
          body: `
🎉 **Smart Contract Function Executed Successfully!**

**Function:** ${funcName}
**Contract Address:** ${contractAddress}
**Transaction Hash:** ${tx.hash}
**Platform:** ${platform}
**Arguments:** ${JSON.stringify(args)}

**Result:** ${result}

---
Thank you for using Oathstone Wallet!
          `.trim(),
        };

        await sendEmail(emailData);
        
        // Add to email history
        const emailHistory = JSON.parse(localStorage.getItem("emailHistory") || "[]");
        emailHistory.push({
          emailId: Date.now().toString(),
          to: userEmail,
          subject: emailData.subject,
          status: "sent",
          sentAt: new Date().toISOString(),
          type: "contract_execution"
        });
        localStorage.setItem("emailHistory", JSON.stringify(emailHistory));
      }
      
      setOutputs((prev) => ({ 
        ...prev, 
        [funcName]: typeof result === 'object' ? JSON.stringify(result, null, 2) : result.toString()
      }));
    } catch (err) {
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
      <h3 className="text-2xl font-bold mb-6">🔧 Contract Interface</h3>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {abi
        .filter((item) => item.type === "function")
        .map((func, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mb-4">
            <h4 className="text-xl font-semibold mb-4">{func.name}</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {func.inputs.map((input, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium mb-2">
                    {input.name || `arg${i}`} ({input.type})
                  </label>
                  <input
                    type="text"
                    value={(inputs[func.name] && inputs[func.name][i]) || ""}
                    onChange={(e) => handleInputChange(func.name, i, e.target.value)}
                    className="w-full p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
                    placeholder={`Enter ${input.type}`}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => handleCallFunction(func)}
              disabled={isExecuting[func.name]}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-all mr-4 disabled:opacity-50"
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
              <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <p className="text-sm font-medium mb-2">Output:</p>
                <pre className="text-sm overflow-x-auto">
                  {outputs[func.name]}
                </pre>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

// Code Editor Component
function CodeEditor({ value, onChange, language = "solidity" }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-slate-800 text-white p-2 text-sm font-mono">
        {language}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-64 p-4 font-mono text-sm bg-slate-900 text-green-400 border-none resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}

// Smart Contract Codepen Component
function SmartContractCodepen() {
  const [formData, setFormData] = useState({
    platform: "Celo",
    environment: 0,
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

  const [contractDetails, setContractDetails] = useState(null);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiEndpoints = {
    Network: "",
    Celo: "https://oathstone-api.azurewebsites.net/celo",
    Ethereum: "https://oathstone-api.azurewebsites.net/eth",
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (index, key, value) => {
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

    const apiEndpoint = apiEndpoints[formData.platform];
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
    } catch (error) {
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

  const handleTemplateChange = (value) => {
    let newFiles = [];

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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
      <h2 className="text-3xl font-bold mb-6">⚒️ Smart Contract IDE</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Blockchain Platform</label>
          <select
            value={formData.platform}
            onChange={(e) => handleChange("platform", e.target.value)}
            className="w-full p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          >
            {Object.keys(apiEndpoints).map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Environment</label>
          <select
            value={formData.environment}
            onChange={(e) => handleChange("environment", parseInt(e.target.value))}
            className="w-full p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          >
            <option value={0}>Testnet</option>
            <option value={1}>Mainnet</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select Template</label>
          <select
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          >
            <option value="">Choose template...</option>
            <option value="Token">Token</option>
            <option value="HelloWorld">HelloWorld</option>
            <option value="Blank">Blank</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Contract Title</label>
          <input
            type="text"
            value={formData.contractTitle}
            onChange={(e) => handleChange("contractTitle", e.target.value)}
            className="w-full p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          />
        </div>
      </div>

      {/* Solidity Files */}
      <div className="space-y-6 mb-6">
        {formData.solidityFiles.map((file, index) => (
          <div key={index} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">File Name</label>
                <input
                  type="text"
                  value={file.name}
                  onChange={(e) => handleFileChange(index, "name", e.target.value)}
                  className="w-full p-3 border rounded-md bg-white dark:bg-slate-600"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    const updatedFiles = formData.solidityFiles.filter((_, i) => i !== index);
                    handleChange("solidityFiles", updatedFiles);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md transition-all"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
            
            <CodeEditor
              value={file.code}
              onChange={(value) => handleFileChange(index, "code", value)}
              language="solidity"
            />
          </div>
        ))}
      </div>

      <div className="mb-6">
        <button
          onClick={() => {
            const newFiles = [
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
          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-md transition-all"
        >
          ➕ Add New File
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Constructor Arguments</label>
          <input
            type="text"
            value={formData.constructorArgs[0] || ""}
            onChange={(e) => handleChange("constructorArgs", [e.target.value])}
            className="w-full p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Private Key</label>
          <input
            type="password"
            value={formData.userPrivateKey}
            placeholder="Paste Your Private Key Here"
            onChange={(e) => handleChange("userPrivateKey", e.target.value)}
            className="w-full p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-md shadow-lg disabled:opacity-50 mb-6"
      >
        {isSubmitting ? "🔄 Deploying..." : "🚀 Deploy Contract"}
      </button>

      {/* Terminal Output */}
      {response && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">📺 Terminal Output:</h3>
          <pre className="bg-black text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono">
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
  );
}

// Main App Entry
export default function App() {
  const [currentView, setCurrentView] = useState("codepen");

  return (
    <>

    
      <main className="p-8 flex flex-col gap-16 bg-slate-50 dark:bg-slate-900 min-h-screen">
       
        <Authenticated>``
          {currentView === "dashboard" ? <Content /> : <SmartContractCodepen />}
        </Authenticated>

        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

// Sign Out Button
function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  return isAuthenticated ? (
    <button
      onClick={() => void signOut()}
      className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
    >
      <span className="text-lg">🚪</span> Sign out
    </button>
  ) : null;
}

// Authentication wrappers
function Authenticated({ children }) {
  const { isAuthenticated } = useConvexAuth();
  return isAuthenticated ? children : null;
}

function Unauthenticated({ children }) {
  const { isAuthenticated } = useConvexAuth();
  return !isAuthenticated ? children : null;
}
// Sign In / Sign Up Form with Wallet Creation
function SignInForm() {
  const { signIn } = useAuthActions();
  const sendEmail = useMutation(api.emails.sendEmail);
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    formData.set("flow", flow);

    try {
      await signIn("password", formData);

      if (flow === "signUp") {
        setIsCreatingWallet(true);
        try {
          const walletResponse = await axios.get("http://localhost:3001/createWallet");
          localStorage.setItem("wallet", JSON.stringify(walletResponse.data));

          await sendEmail({
            to: email,
            subject: "🎉 Your Oathstone Wallet Has Been Created!",
            body: `
🎉 **Welcome to Oathstone Wallet!**

Your wallet has been successfully created. Please **save the following information** securely:

---

🔐 **Wallet Address:**  
\`${walletResponse.data.wallet.address}\`

🗝️ **Private Key:**  
\`${walletResponse.data.wallet.privateKey}\`

🧠 **Recovery Phrase (Mnemonic):**  
\`${walletResponse.data.wallet.mnemonic}\`

---

⚠️ **Important Security Tips:**
- Do **NOT** share your private key or recovery phrase.
- Store this information in a password manager or offline.
- Anyone with access to your keys can control your wallet.

---

Thank you for choosing **Oathstone Wallet**.  
If you have any questions, feel free to reach out.

Warm regards,  
**The Oathstone Team**
            `.trim(),
          });
        } catch (err) {
          console.error("Wallet error:", err);
          setError("Wallet created but error sending email. Please check support.");
        } finally {
          setIsCreatingWallet(false);
        }
      }
    } catch (authErr: any) {
      setError(authErr.message);
      setIsCreatingWallet(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <label htmlFor="email">
          You must use a verified domain for your email to send correctly
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder="email@your-verified-domain.com"
          className="p-2 rounded-md border-2 bg-light dark:bg-dark text-dark dark:text-light border-slate-300 dark:border-slate-700"
        />
        <input
          type="text"
          name="name"
          required
          placeholder="Name"
          className="p-2 rounded-md border-2 bg-light dark:bg-dark text-dark dark:text-light border-slate-300 dark:border-slate-700"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password"
          className="p-2 rounded-md border-2 bg-light dark:bg-dark text-dark dark:text-light border-slate-300 dark:border-slate-700"
        />
        <button
          type="submit"
          disabled={isCreatingWallet}
          className="bg-dark dark:bg-light text-light dark:text-dark rounded-md p-2 disabled:opacity-50"
        >
          {isCreatingWallet ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
              {flow === "signIn" ? "Signing in..." : "Creating account & wallet..."}
            </div>
          ) : flow === "signIn" ? "Sign in" : "Sign up"}
        </button>

        <div className="flex flex-row gap-2">
          <span>
            {flow === "signIn" ? "Don't have an account?" : "Already have an account?"}
          </span>
          <span
            className="underline cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </span>
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
            <p className="text-dark dark:text-light font-mono text-xs">Error: {error}</p>
          </div>
        )}
        {isCreatingWallet && (
          <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-md p-2">
            <p className="text-dark dark:text-light font-mono text-xs">
              Creating your wallet and sending details to your email...
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

// Main Dashboard Content
function Content() {
const sendEmail = useMutation(api.emails.sendEmail);


  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [subject, setSubject] = useState("Hello");
  const [message, setMessage] = useState("World");
  const [isSending, setIsSending] = useState(false);
  const [storedWallet, setStoredWallet] = useState(null);
  const [generatedWallet, setGeneratedWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [balanceError, setBalanceError] = useState(null);
  const [transferStatus, setTransferStatus] = useState(null);
  const [transferResponse, setTransferResponse] = useState(null);
  const [emailHistory, setEmailHistory] = useState([]);

  useEffect(() => {
    const wallet = localStorage.getItem("wallet");
    if (wallet) {
      setStoredWallet(JSON.parse(wallet));
    }

    // Load email history
    const history = localStorage.getItem("emailHistory");
    if (history) {
      setEmailHistory(JSON.parse(history));
    }
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      const walletData = localStorage.getItem("wallet");
      if (!walletData) return;

      try {
        const parsed = JSON.parse(walletData);
        const privateKey = parsed.wallet?.privateKey;
        if (!privateKey) {
          setBalanceError("No private key found in stored wallet.");
          return;
        }

        const response = await axios.post("http://localhost:3001/getBalance", {
          privateKey,
        });

        if (response.data.success) {
          setBalance(response.data.balances);
        } else {
          setBalanceError("API did not return success.");
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setBalanceError("Failed to fetch balance.");
      }
    };

    fetchBalance();
  }, []);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedRecipient || !subject || !message) return;
    setIsSending(true);
    
    try {
      const emailData = {
        to: selectedRecipient,
        subject: subject,
        body: message
      };

      await sendEmail(emailData);
      
      // Add to email history
      const newEmail = {
        emailId: Date.now().toString(),
        to: selectedRecipient,
        subject: subject,
        status: "sent",
        sentAt: new Date().toISOString(),
        type: "test_email"
      };
      
      const updatedHistory = [...emailHistory, newEmail];
      setEmailHistory(updatedHistory);
      localStorage.setItem("emailHistory", JSON.stringify(updatedHistory));
      
      setSelectedRecipient("");
      setSubject("Hello");
      setMessage("World");
    } catch (err) {
      alert("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferStatus("loading");

    const form = e.target;
    const address = form.elements.namedItem("address").value;
    const amount = form.elements.namedItem("amount").value;
    const type = form.elements.namedItem("type").value;

    try {
      const walletData = localStorage.getItem("wallet");
      if (!walletData) {
        setTransferStatus("No wallet found in localStorage.");
        return;
      }

      const { wallet } = JSON.parse(walletData);
      const res = await axios.post("http://localhost:3001/transfer", {
        privateKey: wallet.privateKey,
        address,
        amount,
        type,
      });

      setTransferResponse(res.data);
      setTransferStatus("success");

      // Send success email
      if (res.data.success && res.data.transactionHash) {
        const transferEmailData = {
          to: wallet.email || "user@example.com",
          subject: `🎉 Transfer Successful - ${amount} ${type === "native" ? "CELO" : "USD"}`,
          body: `
🎉 **Transfer Completed Successfully!**

**Amount:** ${amount} ${type === "native" ? "CELO" : "USD Token"}
**To Address:** ${address}
**Transaction Hash:** ${res.data.transactionHash}
**From:** ${wallet.address}
**Status:** Confirmed

You can view this transaction on the blockchain explorer.

---
Thank you for using Oathstone Wallet!
          `.trim(),
        };

        await sendEmail(transferEmailData);

        // Add transfer email to history
        const newEmail = {
          emailId: (Date.now() + 1).toString(),
          to: wallet.email || "user@example.com",
          subject: transferEmailData.subject,
          status: "sent",
          sentAt: new Date().toISOString(),
          type: "transfer_success"
        };

        const updatedHistory = [...emailHistory, newEmail];
        setEmailHistory(updatedHistory);
        localStorage.setItem("emailHistory", JSON.stringify(updatedHistory));
      }

    } catch (err) {
      console.error("Transfer error:", err);
      setTransferStatus("error");
    }
  };

  return (
    <div className="flex flex-col gap-16">
      {/* Current Wallet Info */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">🔐 Current Wallet</h2>
        {storedWallet ? (
          <div className="space-y-2">
            <p><strong>Address:</strong> <span className="font-mono text-sm">{storedWallet.wallet.address}</span></p>
            <p><strong>Email:</strong> {storedWallet.wallet.email || "Not set"}</p>
            <p><strong>Created:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No wallet found. Please sign up to create one.</p>
        )}
      </section>

      {/* Wallet Balance Section */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">💰 Wallet Balance</h2>
        {balanceError ? (
          <p className="text-red-500">{balanceError}</p>
        ) : balance ? (
          <div className="space-y-2">
            <p><strong>Address:</strong> <span className="font-mono text-sm">{balance.celo.address}</span></p>
            <p><strong>Native Balance (CELO):</strong> {balance.celo.native}</p>
            <p><strong>USD Token:</strong> {balance.celo.tokens?.USD ?? "N/A"}</p>
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">Loading balance...</p>
        )}
      </section>

      {/* Generate New Wallet */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">⚡ Generate New Wallet</h2>
        <button
          onClick={async () => {
            try {
              const res = await axios.get("http://localhost:3001/createWallet");
              setGeneratedWallet(res.data);
            } catch (err) {
              setGeneratedWallet({ error: "Failed to generate wallet" });
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-all"
        >
          Generate Wallet
        </button>
        {generatedWallet && (
          <pre className="text-sm bg-slate-100 dark:bg-slate-700 p-4 rounded-lg mt-4 overflow-x-auto">
            {JSON.stringify(generatedWallet, null, 2)}
          </pre>
        )}
      </section>

      {/* Send Test Email */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">📧 Send Test Email</h2>
        <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Recipient"
            value={selectedRecipient}
            onChange={(e) => setSelectedRecipient(e.target.value)}
            className="p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          />
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          />
          <textarea
            placeholder="Message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          />
          <button
            type="submit"
            disabled={isSending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-md shadow-lg disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Send Test Email"}
          </button>
        </form>
      </section>

      {/* Transfer Funds Section */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">💸 Transfer Funds</h2>
        <form className="flex flex-col gap-4" onSubmit={handleTransfer}>
          <input
            name="address"
            type="text"
            placeholder="Recipient Address"
            required
            className="p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          />
          <input
            name="amount"
            type="number"
            step="any"
            placeholder="Amount"
            required
            className="p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
          />
          <select
            name="type"
            className="p-3 border rounded-md bg-slate-100 dark:bg-slate-700"
            defaultValue="native"
          >
            <option value="native">Native (CELO)</option>
            <option value="token">USD Token</option>
          </select>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-md shadow-lg disabled:opacity-50"
          >
            Send Funds
          </button>
        </form>

        {/* Transfer Status Message */}
        {transferStatus === "loading" && <p className="mt-4 text-blue-500">Sending...</p>}
        {transferStatus === "success" && transferResponse && (
          <pre className="mt-4 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(transferResponse, null, 2)}
          </pre>
        )}
        {transferStatus === "error" && (
          <p className="mt-4 text-red-500">❌ Transfer failed. Check console.</p>
        )}
      </section>

      {/* Email History */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">📊 Email History</h2>
        {emailHistory.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400">No emails yet.</p>
        ) : (
          <ul className="space-y-4">
            {emailHistory.map((email) => (
              <li key={email.emailId} className="border p-4 rounded-md bg-slate-100 dark:bg-slate-700">
                <p><strong>To:</strong> {email.to}</p>
                <p><strong>Subject:</strong> {email.subject}</p>
                <p><strong>Status:</strong> {email.status || "Unknown"}</p>
                <p><strong>Type:</strong> {email.type}</p>
                <p className="text-sm text-slate-400">
                  {new Date(email.sentAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}