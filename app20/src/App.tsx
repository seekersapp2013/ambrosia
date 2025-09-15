"use client";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";

import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import axios from "axios";
import SmartContracts from "./SmartContracts";

// Types for wallet management
interface WalletData {
  testnet: {
    address: string;
    privateKey: string;
    mnemonic: string;
  };
  mainnet: {
    address: string;
    privateKey: string;
    mnemonic: string;
  };
}

type NetworkType = "testnet" | "mainnet";

// Main App Entry
function App() {
  const [currentView, setCurrentView] = useState<"dashboard" | "codepen">("dashboard");
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>("testnet");

  return (
    <>
      <header className="sticky top-0 z-10 bg-light dark:bg-dark p-3 sm:p-4 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-4">
          {/* Top row: Title and Sign Out */}
          <div className="flex justify-between items-center">
            <span className="text-lg sm:text-xl font-semibold">📧 Oathstone Codepen Dashboard</span>
            <SignOutButton />
          </div>
          
          {/* Bottom row: Navigation and Network Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            {/* Navigation Buttons */}
            <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`flex-1 sm:flex-none px-2 sm:px-3 lg:px-4 py-2 rounded-md text-xs sm:text-sm lg:text-base transition-all ${ 
                  currentView === "dashboard"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-200 dark:bg-slate-700 text-dark dark:text-light hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                💰 Dashboard
              </button>
              
              <button
                onClick={() => setCurrentView("codepen")}
                className={`flex-1 sm:flex-none px-2 sm:px-3 lg:px-4 py-2 rounded-md text-xs sm:text-sm lg:text-base transition-all ${ 
                  currentView === "codepen"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-200 dark:bg-slate-700 text-dark dark:text-light hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                ⚒️ Smart Contracts
              </button>
              
            </div>

            {/* Network Toggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <NetworkToggle currentNetwork={currentNetwork} setCurrentNetwork={setCurrentNetwork} />
            </div>
          </div>
        </div>
      </header>

      <main className="p-3 sm:p-4 lg:p-6 xl:p-8 flex flex-col gap-6 sm:gap-8 lg:gap-12 xl:gap-16">
        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-center">Oathstone Codepen Dashboard</h1>
        <Authenticated>
          {currentView === "dashboard" && <Content currentNetwork={currentNetwork} />}
          {currentView === "codepen" && <SmartContracts currentNetwork={currentNetwork} />}
        </Authenticated>
      
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

// Network Toggle Component
function NetworkToggle({
  currentNetwork,
  setCurrentNetwork
}: {
  currentNetwork: NetworkType;
  setCurrentNetwork: (network: NetworkType) => void;
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-slate-200 dark:bg-slate-700 rounded-lg p-1 w-full sm:w-auto">
      <button
        onClick={() => setCurrentNetwork("testnet")}
        className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${ 
          currentNetwork === "testnet"
            ? "bg-blue-600 text-white shadow-md"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        🧪 Testnet
      </button>
      <button
        onClick={() => setCurrentNetwork("mainnet")}
        className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${ 
          currentNetwork === "mainnet"
            ? "bg-green-600 text-white shadow-md"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        🌐 Mainnet
      </button>
    </div>
  );
}

// Sign Out Button
function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  return isAuthenticated ? (
    <button
      onClick={() => void signOut()}
      className="flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-3 sm:px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
    >
      <span className="text-lg">🚪</span>
      <span className="hidden sm:inline">Sign out</span>
      <span className="sm:hidden">Sign out</span>
    </button>
  ) : null;
}

// Sign In / Sign Up Form with Dual Wallet Creation
function SignInForm() {
  const { signIn } = useAuthActions();
  const sendEmail = useMutation(api.emails.sendEmail);
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [createdWallets, setCreatedWallets] = useState<WalletData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    localStorage.setItem("userEmail", email);
    formData.set("flow", flow);

    try {
      await signIn("password", formData);

      if (flow === "signUp") {
        setIsCreatingWallet(true);
        try {
          // Create both testnet and mainnet wallets
          const testnetWalletResponse = await axios.get("/api/createWallet");
          const mainnetWalletResponse = await axios.get("/api/createWallet");

          const walletData: WalletData = {
            testnet: testnetWalletResponse.data.wallet,
            mainnet: mainnetWalletResponse.data.wallet
          };

          // Store both wallets in localStorage
          localStorage.setItem("wallet", JSON.stringify(walletData));
          localStorage.setItem("currentNetwork", "testnet"); // Set testnet as default
          
          // Set created wallets for display
          setCreatedWallets(walletData);

          // Send email with wallet details (excluding private keys)
          try {
            console.log("Attempting to send email to:", email);
            console.log("User authenticated, proceeding with email...");
            
            const emailResult = await sendEmail({
              to: email,
              subject: "🎉 Your Oathstone Wallets Have Been Created!",
              body: `
🎉 **Welcome to Oathstone Wallet!**

Your wallets have been successfully created for both Testnet and Mainnet. Please **save the following information** securely:

---

🧪 **TESTNET WALLET:**
🔐 **Address:** \
`${walletData.testnet.address}\
`
🧠 **Recovery Phrase (Mnemonic):** \
`${walletData.testnet.mnemonic}\
`

🌐 **MAINNET WALLET:**
🔐 **Address:** \
`${walletData.mainnet.address}\
`
🧠 **Recovery Phrase (Mnemonic):** \
`${walletData.mainnet.mnemonic}\
`

---

⚠️ **Important Security Notes:**
- Your **Private Keys are NOT included in this email** for security reasons
- Private keys are stored locally in your browser
- Do **NOT** share your recovery phrases with anyone
- Store recovery phrases in a password manager or offline
- Anyone with access to your keys can control your wallets

---

🔧 **Getting Started:**
- Testnet is enabled by default for safe testing
- Use the network toggle to switch between Testnet and Mainnet
- Fund your testnet wallet at: https://faucet.celo.org/alfajores
- For mainnet funding, contact: graderng@gmail.com

---

Thank you for choosing **Oathstone Wallet**.  
If you have any questions, feel free to reach out.

Warm regards,  
**The Oathstone Team**
              `,
            });
            console.log("Email sent successfully:", emailResult);
          } catch (emailError: any) {
            console.error("Failed to send email:", emailError);
            console.error("Email error details:", {
              message: emailError.message,
              stack: emailError.stack,
              error: emailError
            });
            // Don't fail the wallet creation if email fails
            setError("Wallets created successfully! However, there was an issue sending the confirmation email. Your wallets are still saved locally.");
          }
        } catch (err) {
          console.error("Wallet error:", err);
          setError("Wallets created but error sending email. Please check support.");
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
    <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-sm sm:max-w-md mx-auto">
      <form className="flex flex-col gap-4 sm:gap-6" onSubmit={handleSubmit}>
        <label htmlFor="email" className="text-sm sm:text-base">
         Please enter an email that ends with @oathstone.cloud e.g. yourname@oathstone.cloud
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder="yourname@oathstone.cloud"
          className="p-3 sm:p-4 rounded-md border-2 bg-light dark:bg-dark text-dark dark:text-light border-slate-300 dark:border-slate-700 text-sm sm:text-base"
        />
        <input
          type="text"
          name="name"
          required
          placeholder="Name"
          className="p-3 sm:p-4 rounded-md border-2 bg-light dark:bg-dark text-dark dark:text-light border-slate-300 dark:border-slate-700 text-sm sm:text-base"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password"
          className="p-3 sm:p-4 rounded-md border-2 bg-light dark:bg-dark text-dark dark:text-light border-slate-300 dark:border-slate-700 text-sm sm:text-base"
        />
        <button
          type="submit"
          disabled={isCreatingWallet}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 sm:py-4 px-6 rounded-md shadow-lg disabled:opacity-50 text-sm sm:text-base font-medium"
        >
          {isCreatingWallet ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
              {flow === "signIn" ? "Signing in..." : "Creating account & wallets..."}
            </div>
          ) : flow === "signIn" ? "Sign in" : "Sign up"}
        </button>

        <div className="flex flex-col sm:flex-row gap-2 text-center sm:text-left">
          <span className="text-sm sm:text-base">
            {flow === "signIn" ? "Don't have an account?" : "Already have an account?"}
          </span>
          <span
            className="underline cursor-pointer text-sm sm:text-base"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </span>
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-3 sm:p-4">
            <p className="text-dark dark:text-light font-mono text-xs sm:text-sm">Error: {error}</p>
          </div>
        )}
        {isCreatingWallet && (
          <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-md p-3 sm:p-4">
            <p className="text-dark dark:text-light font-mono text-xs sm:text-sm">
              Creating your wallets and sending details to your email...
            </p>
          </div>
        )}
        
        {/* Success Message */}
        {!isCreatingWallet && !error && flow === "signUp" && createdWallets && (
          <div className="bg-green-500/20 border-2 border-green-500/50 rounded-md p-3 sm:p-4">
            <p className="text-dark dark:text-light font-mono text-xs sm:text-sm">
              ✅ Account and wallets created successfully! Check your email for wallet details.
            </p>
          </div>
        )}
        
        {/* Created Wallets Display */}
        {createdWallets && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-md p-4 mt-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">🎉 Wallets Created Successfully!</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">🧪 Testnet Wallet:</p>
                <p className="font-mono text-xs bg-blue-100 dark:bg-blue-800 p-2 rounded break-all">
                  {createdWallets.testnet.address}
                </p>
              </div>
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">🌐 Mainnet Wallet:</p>
                <p className="font-mono text-xs bg-blue-100 dark:bg-blue-800 p-2 rounded break-all">
                  {createdWallets.mainnet.address}
                </p>
              </div>
              <p className="text-blue-600 dark:text-blue-400 text-xs">
                💡 Check your email for recovery phrases. Private keys are stored locally in your browser.
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

// Main Dashboard Content
function Content({
  currentNetwork
}: {
  currentNetwork: NetworkType;
}) {
  const emails = useQuery(api.emails.listMyEmailsAndStatuses);
  const sendEmail = useMutation(api.emails.sendEmail);

  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [subject, setSubject] = useState("Hello");
  const [message, setMessage] = useState("World");
  const [isSending, setIsSending] = useState(false);
  const [storedWallet, setStoredWallet] = useState<WalletData | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [transferStatus, setTransferStatus] = useState<"loading" | "success" | "error" | string | null>(null);
  const [transferResponse, setTransferResponse] = useState<any>(null);

  // Load wallet data from localStorage
  useEffect(() => {
    const wallet = localStorage.getItem("wallet");
    if (wallet) {
      setStoredWallet(JSON.parse(wallet));
    }
  }, []);

  // Fetch balance for current network
  useEffect(() => {
    const fetchBalance = async () => {
      if (!storedWallet) return;

      try {
        const privateKey = storedWallet[currentNetwork].privateKey;
        const endpoint = currentNetwork === "testnet" ? "/api/getBalance" : "/api/getBalance";

        const response = await axios.post(endpoint, {
          privateKey,
          network: currentNetwork
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
  }, [currentNetwork, storedWallet]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient || !subject || !message) return;
    setIsSending(true);
    try {
      await sendEmail({
        to: selectedRecipient,
        subject,
        body: message
      });
      setSelectedRecipient("");
    } catch (err) {
      alert("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const getCurrentWallet = () => {
    if (!storedWallet) return null;
    return storedWallet[currentNetwork];
  };

  const currentWallet = getCurrentWallet();

  return (
    <div className="flex flex-col gap-8 sm:gap-12 lg:gap-16">
      {/* Network Status Banner */}
      <div className={`p-4 rounded-xl shadow-md transition-all duration-300 ${ 
        currentNetwork === "testnet" ? "bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700" : "bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700"
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {currentNetwork === "testnet" ? "🧪" : "🌐"}
          </span>
          <div>
            <h3 className="font-semibold text-lg">
              {currentNetwork === "testnet" ? "Testnet Mode" : "Mainnet Mode"}
            </h3>
            <p className="text-sm opacity-80">
              {currentNetwork === "testnet" ? "Safe testing environment - Use test tokens only" : "Live network - Real funds at risk"}
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Balance Section */}
      <section className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">💰 Wallet Balance - {currentNetwork === "testnet" ? "Testnet" : "Mainnet"}</h2>
          <button
            onClick={() => {
              const wallet = localStorage.getItem("wallet");
              if (wallet) {
                setStoredWallet(JSON.parse(wallet));
                console.log("Wallet refreshed manually");
              }
            }}
            className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded transition-all"
          >
            🔄 Refresh
          </button>
        </div>
        
        {/* Wallet Information Display */}
        {storedWallet && currentWallet && (
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <h3 className="font-semibold mb-3 text-lg">🔐 Current Wallet Info</h3>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-sm"><strong>Address:</strong></p>
                <span className="font-mono text-xs break-all bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                  {currentWallet.address}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(currentWallet.address)}
                  className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded transition-all"
                >
                  Copy
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-sm"><strong>Private Key:</strong></p>
                <span className="font-mono text-xs break-all bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                  {currentWallet.privateKey.substring(0, 10)}...{currentWallet.privateKey.substring(currentWallet.privateKey.length - 10)}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(currentWallet.privateKey)}
                  className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded transition-all"
                >
                  Copy Full Key
                </button>
              </div>
            </div>
          </div>
        )}

        {balanceError ? (
          <p className="text-red-500 text-sm sm:text-base">{balanceError}</p>
        ) : balance ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p className="text-sm sm:text-base">
                <strong>Address:</strong>
                <span className="font-mono text-xs sm:text-sm break-all ml-2">{balance.celo.address}</span>
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(balance.celo.address)}
                className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm rounded-md transition-all"
              >
                Copy Address
              </button>
            </div>

            <p className="text-sm sm:text-base">
              <strong>Native Balance (CELO):</strong> {balance.celo.native}
            </p>
            <p className="text-sm sm:text-base">
              <strong>USD Token:</strong> {balance.celo.tokens?.USD ?? "N/A"}
            </p>

            {currentNetwork === "testnet" && (
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                <p>🧪 <strong>Testnet Funding:</strong> Get test CELO at <a href="https://faucet.celo.org/alfajores" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://faucet.celo.org/alfajores</a></p>
                <p>💡 <strong>Note:</strong> Testnet tokens have no real value and are for testing only</p>
              </div>
            )}

            {currentNetwork === "mainnet" && (
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                <p>🌐 <strong>Mainnet Funding:</strong> Contact graderng@gmail.com for USD Token funding</p>
                <p>⚠️ <strong>Warning:</strong> Mainnet uses real funds - be careful with transactions</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
              {storedWallet ? "Loading balance..." : "No wallet found. Please sign up to create wallets."}
            </p>
            {!storedWallet && (
              <div className="text-xs text-slate-500">
                <p>• Sign up to create both testnet and mainnet wallets</p>
                <p>• Wallets will be automatically created and stored locally</p>
                <p>• You'll receive an email with wallet addresses and recovery phrases</p>
              </div>
            )}
          </div>
        )}
      </section>



      {/* Transfer Funds Section */}
      <section className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">💸 Transfer Funds - {currentNetwork === "testnet" ? "Testnet" : "Mainnet"}</h2>
        <form
          className="flex flex-col gap-3 sm:gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setTransferStatus("loading");

            const form = e.target as HTMLFormElement;
            const address = (form.elements.namedItem("address") as HTMLInputElement).value;
            const amount = (form.elements.namedItem("amount") as HTMLInputElement).value;
            const type = (form.elements.namedItem("type") as HTMLSelectElement).value;

            try {
              if (!currentWallet) {
                setTransferStatus("No wallet found for current network.");
                return;
              }

              const res = await axios.post("/api/transfer", {
                privateKey: currentWallet.privateKey,
                address,
                amount,
                type,
                network: currentNetwork
              });

              setTransferResponse(res.data);
              setTransferStatus("success");
            } catch (err) {
              console.error("Transfer error:", err);
              setTransferStatus("error");
            }
          }}
        >
          <input
            name="address"
            type="text"
            placeholder="Recipient Address"
            required
            className="p-3 border rounded-md bg-slate-100 dark:bg-slate-700 text-sm sm:text-base"
          />
          <input
            name="amount"
            type="number"
            step="any"
            placeholder="Amount"
            required
            className="p-3 border rounded-md bg-slate-100 dark:bg-slate-700 text-sm sm:text-base"
          />
          <select
            name="type"
            className="p-3 border rounded-md bg-slate-100 dark:bg-slate-700 text-sm sm:text-base"
            defaultValue="native"
          >
            <option value="native">Native (CELO)</option>
            <option value="token">USD Token</option>
          </select>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-md shadow-lg disabled:opacity-50 text-sm sm:text-base font-medium"
          >
            Send Funds
          </button>
        </form>

        {/* Transfer Status Message */}
        {transferStatus === "loading" && <p className="mt-4 text-blue-500 text-sm sm:text-base">Sending...</p>}
        {transferStatus === "success" && transferResponse && (
          <pre className="mt-4 bg-slate-100 dark:bg-slate-700 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto">
            {JSON.stringify(transferResponse, null, 2)}
          </pre>
        )}
        {transferStatus === "error" && (
          <p className="mt-4 text-red-500 text-sm sm:text-base">❌ Transfer failed. Check console.</p>
        )}
      </section>

      {/* Email History */}
      <section className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">📊 Email History</h2>
        {emails === undefined ? (
          <div className="text-center text-sm sm:text-base">Loading...</div>
        ) : emails.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 text-sm sm:text-base">No emails yet.</p>
        ) : (
          <ul className="space-y-3 sm:space-y-4">
            {emails.map((email) => (
              <li key={email.emailId} className="border p-3 sm:p-4 rounded-md bg-slate-100 dark:bg-slate-700">
                <p className="text-sm sm:text-base"><strong>To:</strong> {email.to}</p>
                <p className="text-sm sm:text-base"><strong>Subject:</strong> {email.subject}</p>
                <p className="text-sm sm:text-base"><strong>Status:</strong> {email.status || "Unknown"}</p>
                <p className="text-xs sm:text-sm text-slate-400">
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
