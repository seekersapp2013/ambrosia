import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface PaywallProps {
  contentType: "article" | "reel";
  contentId: Id<"articles"> | Id<"reels">;
  title: string;
  price: number;
  token: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function Paywall({ 
  contentType, 
  contentId, 
  title, 
  price, 
  token, 
  onBack, 
  onSuccess 
}: PaywallProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState("");
  
  const purchaseContent = useMutation(api.payments.purchaseContent);

  const handlePurchase = async () => {
    if (!txHash.trim()) {
      alert("Please enter a transaction hash");
      return;
    }

    setIsProcessing(true);
    try {
      await purchaseContent({
        contentType,
        contentId,
        priceToken: token,
        priceAmount: price,
        txHash: txHash.trim(),
        network: "celo", // Default network
      });
      
      onSuccess();
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Purchase failed. Please check your transaction hash and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onBack} className="text-gray-600">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-lg font-semibold">Premium Content</h1>
        <div></div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-lock text-white text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold mb-2">Unlock Premium Content</h2>
          <p className="text-gray-600">
            {contentType === "article" ? "Read this exclusive article" : "Watch this exclusive reel"}
          </p>
        </div>

        {/* Content Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">{title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {contentType === "article" ? "Article" : "Reel"}
            </span>
            <span className="text-accent font-bold text-lg">
              {price} {token}
            </span>
          </div>
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Hash
            </label>
            <input
              type="text"
              placeholder="Enter your blockchain transaction hash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-gray-500 mt-1">
              After making the payment on the blockchain, paste the transaction hash here
            </p>
          </div>

          <button
            onClick={handlePurchase}
            disabled={!txHash.trim() || isProcessing}
            className={`w-full py-3 rounded-lg font-medium ${
              txHash.trim() && !isProcessing
                ? 'bg-accent text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Unlock Content'}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">How to pay:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Send {price} {token} to the creator's wallet address</li>
            <li>Copy the transaction hash from your wallet</li>
            <li>Paste it above and click "Unlock Content"</li>
            <li>Your payment will be verified and content unlocked</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
