import { useState } from "react";
import logo from "../assets/logo.jpg";
import { createAccount, loginUser } from "../auth/authService";

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Line Supervisor");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    if (mode === "signup") {
      if (!name) {
        setError("Please enter your name.");
        return;
      }

      const result = createAccount({
        email,
        password,
        name,
        role,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setError("");
      onLogin(result.user);
      return;
    }

    const result = loginUser(email, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setError("");
    onLogin(result.user);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001B44] to-[#003366] flex items-center justify-center p-8">
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-[460px]">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Silver Spark Logo" className="h-28 object-contain" />
        </div>

        <h1 className="text-3xl font-bold text-center text-slate-900">
          Raymond Silver Spark
        </h1>

        <p className="text-center text-slate-500 mt-2 mb-8">
          Smart Operator Allocation System
        </p>

        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              mode === "login" ? "bg-white shadow text-slate-900" : "text-slate-500"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              mode === "signup" ? "bg-white shadow text-slate-900" : "text-slate-500"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label className="text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full border rounded-xl p-3 mt-2 mb-5"
              />
            </>
          )}

          <label className="text-sm font-semibold text-slate-700">
            Raymond Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@raymond.in"
            className="w-full border rounded-xl p-3 mt-2 mb-5"
          />

          <label className="text-sm font-semibold text-slate-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full border rounded-xl p-3 mt-2 mb-5"
          />

          {mode === "signup" && (
            <>
              <label className="text-sm font-semibold text-slate-700">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border rounded-xl p-3 mt-2 mb-6"
              >
                <option>Line Supervisor</option>
                <option>Industrial Engineer</option>
                <option>Admin</option>
              </select>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-[#001B44] hover:bg-[#003366] text-white font-semibold py-3 rounded-xl transition"
          >
            {mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-8">
          Only @raymond.in email accounts are allowed.
        </p>
      </div>
    </div>
  );
}

export default Login;