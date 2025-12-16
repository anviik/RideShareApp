// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const shapeUser = (user) => {
  const name =
    user?.user_metadata?.username ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "User";

  return {
    name,
    email: user?.email || "Not provided",
    role: user?.user_metadata?.role || user?.role || "rider",
    phone: user?.user_metadata?.phone || "Add a phone number",
    bio:
      user?.user_metadata?.bio ||
      "Tell riders and drivers a bit about yourself so they know who you are.",
    avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
      name
    )}&backgroundType=gradientLinear,solid&backgroundColor=ffe6a7,d7e3fc`,
  };
};

function Profile() {
  const [state, setState] = useState({
    status: "loading",
    user: null,
    note: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      // Check for locally persisted profile (set during login/signup)
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.guest) {
            if (!cancelled) setState({ status: "guest", user: null, note: "" });
            return;
          }
          if (!cancelled)
            setState({ status: "ready", user: shapeUser(parsed), note: "" });
          return;
        } catch (_) {
          // fall through to supabase lookup
        }
      }

      if (!supabase) {
        if (!cancelled)
          setState({
            status: "guest",
            user: null,
            note: "Login to view your profile.",
          });
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;

      if (error || !data?.user) {
        setState({
          status: "guest",
          user: null,
          note: "Login to view your profile.",
        });
        return;
      }

      const shaped = shapeUser(data.user);
      localStorage.setItem("user", JSON.stringify(shaped));
      window.__USER__ = shaped;

      setState({ status: "ready", user: shaped, note: "" });
    };

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="max-w-3xl mx-auto text-center text-sm text-slate-600">
        Loading your profile...
      </div>
    );
  }

  if (state.status === "guest") {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center space-y-3">
        <h1 className="text-xl font-semibold text-slate-900">Profile locked</h1>
        <p className="text-sm text-slate-600">
          Sign in or create an account to view your profile. Guests can browse
          rides but do not have personal profiles.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            Go to login
          </Link>
          <Link
            to="/"
            className="px-4 py-2 rounded-md border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-400"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  const user = state.user;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl overflow-hidden shadow border border-slate-200 bg-slate-100">
            <img
              src={user.avatarUrl}
              alt={`${user.name} avatar`}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {user.name}
            </h1>
            <p className="text-sm text-slate-600 capitalize">
              {user.role} account
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
            Edit profile
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            Contact
          </h2>
          <div className="space-y-2 text-sm text-slate-700">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Email
              </div>
              <div>{user.email}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Phone
              </div>
              <div>{user.phone}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            About
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">{user.bio}</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
