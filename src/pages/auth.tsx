import { useState } from "react";
import { useRouter } from "next/router";
import { authService, RegisterPayload, LoginPayload } from "@/services/authService";

function IconUser() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A8.966 8.966 0 0112 15c2.21 0 4.241.805 5.879 2.117M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
    </svg>
  );
}

export default function Auth() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", email: "", password: "", confirmPassword: "", user_type: "customer" });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!loginData.username || !loginData.password) return setError("Please fill all fields");
    setLoading(true);
    try {
      const payload: LoginPayload = { username: loginData.username, password: loginData.password };
      const response = await authService.login(payload);
      if (response.success) {
        console.log("Login successful:", response);
        setSuccess("Welcome back!");
        if (response.user?.user_type == "customer") {
          setTimeout(() => router.push("/"), 800);
        }
        else if (response.user?.user_type == "store") {
          setTimeout(() => router.push("/dashboard"), 800);
        }
      } else setError(response.message || "Login failed");
    } catch (err) {
      setError("Login error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!registerData.username || !registerData.email || !registerData.password || !registerData.confirmPassword) return setError("Please fill all fields");
    if (registerData.password !== registerData.confirmPassword) return setError("Passwords do not match");
    if (registerData.password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const payload: RegisterPayload = { username: registerData.username, email: registerData.email, password: registerData.password, user_type: registerData.user_type };
      const response = await authService.register(payload);
      if (response.success) {
        setSuccess("Account created. Please login.");
        setRegisterData({ username: "", email: "", password: "", confirmPassword: "", user_type: "customer" });
        setTimeout(() => setActiveTab("login"), 1200);
      } else setError(response.message || "Registration failed");
    } catch (err) {
      setError("Registration error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-600 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: Illustration / promo */}
        <div className="hidden md:flex flex-col justify-center p-8 text-white">
          <div className="mb-6">
            <h2 className="text-4xl font-extrabold tracking-tight">Fast, simple authentication</h2>
            <p className="mt-3 text-lg text-indigo-100/90">Sign up as a Customer or Store and get started in seconds. Secure, token-based login.</p>
          </div>

          <div className="mt-6 bg-white/5 p-6 rounded-xl backdrop-blur-sm border border-white/10">
            <svg viewBox="0 0 88 88" className="w-48 h-48 mx-auto opacity-95">
              <defs>
                <linearGradient id="g1" x1="0%" x2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
              <rect width="88" height="88" rx="20" fill="url(#g1)" />
            </svg>
            <p className="text-center mt-4 text-sm text-indigo-100/80">Modern UI · Responsive · Built with Tailwind</p>
          </div>
        </div>

        {/* Right: Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Welcome</h3>
              <p className="text-sm text-gray-500">Login or create an account to continue</p>
            </div>
            <div className="flex gap-2">
              <button className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'login' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}>Login</button>
              <button className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'register' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}>Register</button>
            </div>
          </div>

          {/* Alerts */}
          {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-100">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 border border-green-100">{success}</div>}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="flex items-center gap-3 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-300">
                  <IconUser />
                  <input name="username" value={loginData.username} onChange={handleLoginChange} placeholder="your.username" className="w-full outline-none text-gray-700" disabled={loading} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="flex items-center gap-3 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-300">
                  <IconLock />
                  <input name="password" type="password" value={loginData.password} onChange={handleLoginChange} placeholder="********" className="w-full outline-none text-gray-700" disabled={loading} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold shadow-md hover:opacity-95 disabled:opacity-60 transition">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="flex items-center gap-3 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-300">
                  <IconUser />
                  <input name="username" value={registerData.username} onChange={handleRegisterChange} placeholder="choose a username" className="w-full outline-none text-gray-700" disabled={loading} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="flex items-center gap-3 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-300">
                  <IconMail />
                  <input name="email" type="email" value={registerData.email} onChange={handleRegisterChange} placeholder="you@example.com" className="w-full outline-none text-gray-700" disabled={loading} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="flex items-center gap-3 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-300">
                    <IconLock />
                    <input name="password" type="password" value={registerData.password} onChange={handleRegisterChange} placeholder="min. 6 characters" className="w-full outline-none text-gray-700" disabled={loading} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm</label>
                  <div className="flex items-center gap-3 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-300">
                    <IconLock />
                    <input name="confirmPassword" type="password" value={registerData.confirmPassword} onChange={handleRegisterChange} placeholder="confirm password" className="w-full outline-none text-gray-700" disabled={loading} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User type</label>
                <select name="user_type" value={registerData.user_type} onChange={handleRegisterChange} className="w-full border rounded-lg px-3 py-2" disabled={loading}>
                  <option value="customer">Customer</option>
                  <option value="store">Store</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold shadow-md hover:opacity-95 disabled:opacity-60 transition">
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
