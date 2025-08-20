export default function ResetPasswordScreen({ isActive, resetPassword, goLogin }) {
    if (!isActive) return null;
    return (
      <div id="reset-password-screen" className="fixed inset-0 bg-ambrosia-50 z-50 flex flex-col items-center justify-center p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-accent mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your email to receive a reset link</p>
        </div>
        <form className="w-full max-w-xs">
          <div className="mb-6">
            <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"/>
          </div>
          <button type="button" onClick={resetPassword} className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 mb-4">Send Reset Link</button>
        </form>
        <div className="mt-4 text-center">
          <a href="#" onClick={goLogin} className="text-accent text-sm">Back to Login</a>
        </div>
      </div>
    );
  }
  