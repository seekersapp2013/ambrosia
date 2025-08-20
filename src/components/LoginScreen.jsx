export default function LoginScreen({ isActive, login, goReset, goSignup }) {
    if (!isActive) return null;
    return (
      <div id="login-screen" className="fixed inset-0 bg-ambrosia-50 z-50 flex flex-col items-center justify-center p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-accent mb-2">Ambrosia</h1>
          <p className="text-gray-600">Your health community</p>
        </div>
        <form className="w-full max-w-xs">
          <div className="mb-4">
            <input type="text" placeholder="Username" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"/>
          </div>
          <div className="mb-6">
            <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"/>
          </div>
          <button type="button" onClick={login} className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 mb-4">Log In</button>
          <div className="text-center">
            <a href="#" onClick={goReset} className="text-accent text-sm">Forgot password?</a>
          </div>
        </form>
        <div className="mt-8 text-center">
          <p className="text-gray-600">Don't have an account? <a href="#" onClick={goSignup} className="text-accent font-medium">Sign Up</a></p>
        </div>
      </div>
    );
  }
  