export default function SignupScreen({ isActive, signUp, goLogin }) {
  if (!isActive) return null;

  return (
    <div
      id="signup-screen"
      className="fixed inset-0 bg-ambrosia-50 z-50 flex flex-col items-center justify-center p-6"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-accent mb-2">Sign Up</h1>
        <p className="text-gray-600">Join our health community</p>
      </div>

      {/* Uncontrolled form — App.signUp() reads values via querySelector */}
      <form className="w-full max-w-xs" onSubmit={(e) => e.preventDefault()}>
        <div className="mb-4">
          {/* App looks for this ID first */}
          <input
            id="signupusername"
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            autoComplete="username"
            required
          />
        </div>

        <div className="mb-4">
          {/* App selects input[type="email"] */}
          <input
            id="signup-email"
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-6">
          {/* App selects input[type="password"] */}
          <input
            id="signup-password"
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            autoComplete="new-password"
            required
          />
        </div>

        <button
          type="button"
          onClick={signUp}
          className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 mb-4"
        >
          Sign Up
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <a href="#" onClick={goLogin} className="text-accent font-medium">
            Log In
          </a>
        </p>
      </div>
    </div>
  );
}
