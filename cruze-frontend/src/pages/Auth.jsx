import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const roleOptions = [
  { value: "rider", label: "Rider" },
  { value: "driver", label: "Driver" },
  { value: "both", label: "Both" },
];

function Auth() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    role: "rider",
  });
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleGuestLogin = () => {
    const guestUser = {
      id: "guest_" + Date.now(),
      email: null,
      username: "Guest",
      role: "guest",
      guest: true,
    };

    localStorage.setItem("user", JSON.stringify(guestUser));
    window.__USER__ = guestUser;

    navigate("/home");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAuthError("");

    if (!supabase) {
      setAuthError("Supabase client is not configured. Add your env keys.");
      return;
    }

    setIsSubmitting(true);

    const doAuth = async () => {
      try {
        if (mode === "login") {
          const { error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { username: form.username, role: form.role } },
          });
          if (error) throw error;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const profile = {
            id: userData.user.id,
            email: userData.user.email,
            username:
              userData.user.user_metadata?.username ||
              userData.user.email?.split("@")[0] ||
              "User",
            role: userData.user.user_metadata?.role || "rider",
            guest: false,
          };

          localStorage.setItem("user", JSON.stringify(profile));
          window.__USER__ = profile;
        }

        navigate("/home");
      } catch (err) {
        setAuthError(err.message || "Authentication failed");
      } finally {
        setIsSubmitting(false);
      }
    };

    doAuth();
  };

  const handleGoogle = () => {
    setAuthError("");

    const redirectTo =
      typeof window !== "undefined" ? window.location.origin + "/" : undefined;

    supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: redirectTo ? { redirectTo } : undefined,
      })
      .catch((err) => setAuthError(err.message || "Google sign-in failed"));
  };

  return (
    <div className="max-w-3xl mx-auto grid gap-8 md:grid-cols-[1.1fr,0.9fr]">
      <section className="space-y-4">

        {/* mode toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              mode === "login"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              mode === "signup"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            }`}
          >
            Create account
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow">
          <h1 className="text-xl font-semibold text-slate-900 mb-4">
            {mode === "login" ? "Welcome back" : "Join Cruze"}
          </h1>

          {/* Auth form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div>
                <label className="block text-xs mb-1 text-slate-600">
                  Username
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Choose a username"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs mb-1 text-slate-600">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-slate-600">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Roles */}
            {mode === "signup" && (
              <div>
                <div className="text-xs mb-2 text-slate-600">I want to use Cruze as:</div>
                <div className="flex gap-2">
                  {roleOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex-1 cursor-pointer border rounded-lg px-3 py-2 text-sm ${
                        form.role === opt.value
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={opt.value}
                        checked={form.role === opt.value}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-60"
            >
              {isSubmitting
                ? "Working..."
                : mode === "login"
                ? "Login"
                : "Create account"}
            </button>
          </form>

          {authError && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {authError}
            </div>
          )}

          {/* Separator */}
          <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
            <div className="flex-1 h-px bg-slate-200" />
            or
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full border border-slate-300 rounded-md px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:border-slate-500"
          >
            Continue with Google
          </button>

          {/* ⭐ NEW: Guest login button */}
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full mt-3 border border-slate-300 rounded-md px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100"
          >
            Continue as Guest
          </button>

        </div>
      </section>

      <aside className="bg-white border border-slate-200 rounded-xl p-5 shadow space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          How roles work
        </h2>
        <ul className="list-disc list-inside text-sm text-slate-700 space-y-2">
          <li>Rider: request rides and get matched with drivers headed your way.</li>
          <li>Driver: post trips, set seat counts and pricing, and receive requests.</li>
          <li>Both: keep one account, switch modes anytime.</li>
        </ul>
      </aside>
    </div>
  );
}

export default Auth;
