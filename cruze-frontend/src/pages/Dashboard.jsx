import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const readStoredUser = () => {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const persistUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
  window.__USER__ = user;
};

function Dashboard() {
  const [userState, setUserState] = useState({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      const stored = readStoredUser();
      if (stored && !cancelled) {
        setUserState({ status: "ready", user: stored });
        return;
      }

      if (!supabase) {
        if (!cancelled) setUserState({ status: "guest", user: null });
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;

      if (error || !data?.user) {
        setUserState({ status: "guest", user: null });
        return;
      }

      const shaped = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || null,
        guest: false,
      };
      persistUser(shaped);
      setUserState({ status: "ready", user: shaped });
    };

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRoleSelect = (role) => {
    const baseUser = userState.user || { id: "guest", guest: true };
    const updated = { ...baseUser, role, guest: baseUser.guest || false };
    persistUser(updated);
    setUserState({ status: "ready", user: updated });
  };

  if (userState.status === "loading") {
    return (
      <div className="text-sm text-slate-600">Loading your dashboard...</div>
    );
  }

  const needsRole =
    !userState.user || !userState.user.role || userState.user.role === "guest";

  if (needsRole) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">
          Choose your role
        </h1>
        <p className="text-sm text-slate-600">
          Select how you want to use Cruze. We’ll tailor the dashboard for that
          role.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => handleRoleSelect("rider")}
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-left hover:border-slate-400"
          >
            <div className="text-sm font-semibold text-slate-900">Rider</div>
            <div className="text-xs text-slate-600">
              Request rides and track matches.
            </div>
          </button>
          <button
            onClick={() => handleRoleSelect("driver")}
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-left hover:border-slate-400"
          >
            <div className="text-sm font-semibold text-slate-900">Driver</div>
            <div className="text-xs text-slate-600">
              Post trips and manage seats.
            </div>
          </button>
        </div>
        <div className="flex justify-between items-center pt-2">
          <Link
            to="/home"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Back to Home
          </Link>
          <div className="text-xs text-slate-500">
            Guests must pick a role to continue.
          </div>
        </div>
      </div>
    );
  }

  const isDriver = userState.user.role === "driver";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isDriver ? "Driver dashboard" : "Rider dashboard"}
          </h1>
          <p className="text-sm text-slate-600">
            {isDriver
              ? "Manage your trips and seat availability."
              : "Track rides, requests, and matches."}
          </p>
        </div>
        <Link
          to="/home"
          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          Home
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            {isDriver ? "Your trips" : "Your requests"}
          </h2>
          <p className="text-sm text-slate-600">
            {isDriver
              ? "Post new trips, edit routes, and confirm riders."
              : "View your ride requests and status updates."}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            {isDriver ? "Incoming rider requests" : "Matched drivers"}
          </h2>
          <p className="text-sm text-slate-600">
            {isDriver
              ? "Approve or decline rider requests for your trips."
              : "See drivers matched to your requested routes."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
