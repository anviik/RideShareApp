// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">
          Cruze
        </Link>

        <nav className="flex gap-3 text-sm">
          <Link to="/" className="hover:text-indigo-300">
            Home
          </Link>
          <Link to="/dashboard" className="hover:text-indigo-300">
            Dashboard
          </Link>
        </nav>

        <div className="text-xs text-slate-400">
          UC Merced riders & drivers
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 px-6 py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
