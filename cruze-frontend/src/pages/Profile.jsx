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
  
  const [userTrips, setUserTrips] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
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
  
  useEffect(() => {
    const loadUserData = async () => {
      if (state.status !== "ready" || !supabase) return;
      
      setLoadingData(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          setLoadingData(false);
          return;
        }
        
        const tripsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (tripsRes.ok) {
          const trips = await tripsRes.json();
          setUserTrips(trips);
        }
        
        const requestsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/requests/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (requestsRes.ok) {
          const requests = await requestsRes.json();
          setUserRequests(requests);
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    
    loadUserData();
  }, [state.status]);

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
      
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          My Activity
        </h2>
        
        {loadingData ? (
          <p className="text-sm text-slate-600">Loading your trips and requests...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                My Trips ({userTrips.length})
              </h3>
              {userTrips.length === 0 ? (
                <p className="text-sm text-slate-600">No trips created yet.</p>
              ) : (
                <div className="space-y-2">
                  {userTrips.map((trip) => (
                    <div key={trip.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                      <div className="font-medium text-slate-900">
                        {trip.origin} → {trip.destination}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {trip.date} • {trip.seats} seats • ${trip.price}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                My Ride Requests ({userRequests.length})
              </h3>
              {userRequests.length === 0 ? (
                <p className="text-sm text-slate-600">No ride requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {userRequests.map((request) => (
                    <div key={request.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                      <div className="font-medium text-slate-900">
                        {request.origin} → {request.destination}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {request.date} • {request.seats_needed} seats needed
                      </div>
                      <div className="text-xs font-medium mt-1">
                        <span className={`px-2 py-0.5 rounded ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'matched' ? 'bg-green-100 text-green-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
