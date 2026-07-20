import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { ShieldAlert, User as UserIcon, Briefcase, ArrowRight } from "lucide-react";

export function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<"citizen" | "officer">("citizen");
  const [loginType, setLoginType] = useState<"citizen" | "authority">("citizen");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authorityCode, setAuthorityCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        if (!name || !email || !password) {
          setError("Please fill in all required fields");
          setLoading(false);
          return;
        }
        await signup(name, email, password, city, role);
        navigate("/");
      } else {
        if (loginType === "authority") {
          if (authorityCode.trim() !== "GOVT-2026-CP") {
            setError("Invalid Government Authority Access Code. Access Denied.");
            setLoading(false);
            return;
          }
        }
        if (!email || !password) {
          setError("Email and password are required");
          setLoading(false);
          return;
        }
        await login(email, password);
        // Redirect based on role from response
        const token = localStorage.getItem("civicpulse_token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role === "admin") {
              navigate("/admin");
            } else if (payload.role === "officer") {
              navigate("/officer");
            } else {
              navigate("/");
            }
          } catch {
            navigate("/");
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-foreground">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent mb-2">
          CivicPulse
        </h1>
        <h2 className="text-center text-3xl font-extrabold text-foreground">
          {isSignup ? "Create your account" : loginType === "authority" ? "Authority Sign In" : "Citizen Sign In"}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {isSignup 
            ? "Join the civic community and make a difference." 
            : loginType === "authority" 
              ? "Access the administrative and department portal." 
              : "Report issues and make your city better."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-white/5">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {!isSignup && (
            <div className="flex border-b border-white/5 mb-6">
              <button
                type="button"
                onClick={() => { setLoginType("citizen"); setError(""); }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  loginType === "citizen"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Citizen Login
              </button>
              <button
                type="button"
                onClick={() => { setLoginType("authority"); setError(""); }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  loginType === "authority"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Authority Login
              </button>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground"
                    placeholder="e.g. Ahmed Khan" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">City</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-primary focus:border-primary appearance-none">
                    <option value="">Select city</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole("citizen")}
                      className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${role === "citizen" ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"}`}>
                      <UserIcon className="w-4 h-4" /> Citizen
                    </button>
                    <button type="button" onClick={() => setRole("officer")}
                      className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${role === "officer" ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"}`}>
                      <Briefcase className="w-4 h-4" /> Municipal Officer
                    </button>
                  </div>
                </div>
              </>
            )}

            {loginType === "authority" && !isSignup && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Government Authority Access Code *</label>
                <input type="password" required value={authorityCode} onChange={(e) => setAuthorityCode(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground"
                  placeholder="Enter Access Code" />
                <p className="text-[10px] text-primary/80 mt-1 font-semibold">Hint for testing: Use code <strong>GOVT-2026-CP</strong></p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground"
                placeholder={loginType === "authority" ? "authority@civicpulse.com" : "you@example.com"} />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password *</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground"
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-lg shadow-primary/20 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none transition-colors disabled:opacity-50">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignup ? "Create Account" : loginType === "authority" ? "Authority Sign In" : "Citizen Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsSignup(!isSignup); setError(""); }}
              className="text-sm text-primary hover:text-primary/80 transition-colors">
              {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignup && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground text-center mb-2">Demo Credentials:</p>
              {loginType === "authority" ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button onClick={() => { setEmail("admin@civicpulse.com"); setPassword("password"); }}
                    className="p-1.5 bg-red-500/10 text-red-400 rounded border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Admin
                  </button>
                  <button onClick={() => { setEmail("officer@civicpulse.com"); setPassword("password"); }}
                    className="p-1.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20 hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1">
                    <Briefcase className="w-3 h-3" /> Officer
                  </button>
                </div>
              ) : (
                <div className="flex justify-center text-xs">
                  <button onClick={() => { setEmail("aisha@example.com"); setPassword("password"); }}
                    className="w-full max-w-[200px] p-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1">
                    <UserIcon className="w-3 h-3" /> Aisha Khan (Citizen)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

