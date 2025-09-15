import { useState, useEffect } from "react";
import axios from "axios";

interface WalletBalanceProps {
  onNavigate?: (screen: string) => void;
}

export function WalletBalance({ onNavigate }: WalletBalanceProps = {}) {
  const [balance, setBalance] = useState<any>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

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

        const response = await axios.post("/api/getBalance", {
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

  return (
    <section className="bg-white p-6 rounded-xl border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-accent flex items-center">
        <i className="fas fa-wallet mr-2"></i>
        Wallet Balance
      </h2>
      {balanceError ? (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <p className="text-red-700">{balanceError}</p>
        </div>
      ) : balance ? (
        <div className="space-y-3">
          <div className="bg-ambrosia-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-mono text-sm break-all">{balance.celo.address}</p>
          </div>
          <div className="bg-ambrosia-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Native Balance (CELO)</p>
            <p className="text-xl font-bold text-accent">{balance.celo.native}</p>
          </div>
          <div className="bg-ambrosia-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">USD Token</p>
            <p className="text-xl font-bold text-accent">{balance.celo.tokens?.USD ?? "N/A"}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mr-3"></div>
          <p className="text-gray-500">Loading balance...</p>
        </div>
      )}
      
      {/* Wallet Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate?.('transfer-funds')}
          className="bg-accent text-white py-3 px-4 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 flex items-center justify-center"
        >
          <i className="fas fa-exchange-alt mr-2"></i>
          Transfer
        </button>
        <button
          onClick={() => onNavigate?.('send-email')}
          className="bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 flex items-center justify-center"
        >
          <i className="fas fa-envelope mr-2"></i>
          Email
        </button>
        <button
          onClick={() => onNavigate?.('generate-wallet')}
          className="bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 flex items-center justify-center"
        >
          <i className="fas fa-plus-circle mr-2"></i>
          Generate
        </button>
        <button
          onClick={() => onNavigate?.('email-history')}
          className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 flex items-center justify-center"
        >
          <i className="fas fa-history mr-2"></i>
          History
        </button>
      </div>
    </section>
  );
}