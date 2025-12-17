import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import { supabase } from "./lib/supabase";

const readStoredUser = () => {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => readStoredUser());

  useEffect(() => {
    // Keep user state in sync with Supabase session changes.
    if (!supabase) return;
    const { data: { subscription } = { subscription: null } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const shaped = {
            id: session.user.id,
            email: session.user.email,
            username:
              session.user.user_metadata?.username ||
              session.user.email?.split("@")[0] ||
              "User",
            role: session.user.user_metadata?.role || "rider",
            guest: false,
          };
          localStorage.setItem("user", JSON.stringify(shaped));
          window.__USER__ = shaped;
          setUser(shaped);
        } else {
          localStorage.removeItem("user");
          window.__USER__ = null;
          setUser(null);
        }
      }
    );
    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      localStorage.removeItem("user");
      window.__USER__ = null;
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="text-xl font-bold">
          Cruze
        </Link>

        <nav className="flex gap-4 text-sm text-slate-600">
          {user ? (
            <>
              <Link to="/home" className="hover:text-slate-900">
                Home
              </Link>
              <Link to="/profile" className="hover:text-slate-900">
                Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-900"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-slate-900">
              Login
            </Link>
          )}
        </nav>

        {user ? (
          <div className="text-xs text-slate-600">
            Signed in as{" "}
            <span className="font-semibold text-slate-900">
              {user.username || user.email}
            </span>{" "}
            · role: {user.role || "rider"}
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            UC Merced riders & drivers
          </div>
        )}
      </header>

      <main className="flex-1 px-6 py-8">
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Auth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
