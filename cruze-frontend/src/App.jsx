// src/App.jsx
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="text-xl font-bold">
          Cruze
        </Link>

        <nav className="flex gap-4 text-sm text-slate-600">
          <Link to="/" className="hover:text-slate-900">
            Home
          </Link>
          <Link to="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <Link to="/profile" className="hover:text-slate-900">
            Profile
          </Link>
          <Link to="/login" className="hover:text-slate-900">
            Login
          </Link>
        </nav>

        <div className="text-xs text-slate-500">
          UC Merced riders & drivers
        </div>
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
