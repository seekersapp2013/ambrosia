import { useState } from "react";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import axios from "axios";
import { api } from "../../convex/_generated/api";

export function AuthForm() {
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
          const walletResponse = await axios.get("/api/createWallet");
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
    <div className="fixed inset-0 bg-ambrosia-50 z-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-accent mb-2">Oathstone Wallet</h1>
        <p className="text-gray-600">Your crypto wallet dashboard</p>
      </div>
      
      <form className="w-full max-w-xs" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-2">
            You must use a verified domain for your email to send correctly
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="email@your-verified-domain.com"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            name="name"
            required
            placeholder="Name"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            name="password"
            required
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={isCreatingWallet}
          className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 mb-4 disabled:opacity-50"
        >
          {isCreatingWallet ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
              {flow === "signIn" ? "Signing in..." : "Creating account & wallet..."}
            </div>
          ) : flow === "signIn" ? "Sign in" : "Sign up"}
        </button>

        <div className="text-center mb-4">
          <span className="text-gray-600">
            {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-accent font-medium"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">Error: {error}</p>
          </div>
        )}
        {isCreatingWallet && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
            <p className="text-blue-700 text-sm">
              Creating your wallet and sending details to your email...
            </p>
          </div>
        )}
      </form>
    </div>
  );
}