import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import RoleSelector from "../components/RoleSelector";
import DriverForm from "../components/DriverForm";
import RiderForm from "../components/RiderForm";
import RideList from "../components/RideList";
import MapView from "../components/MapView";

const LOCAL_TRIPS_KEY = "cruze_local_trips";
const LOCAL_REQUESTS_KEY = "cruze_local_requests";

const readLocal = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

function Home() {
  const backendBase = import.meta.env.VITE_BACKEND_URL;
  const backendUrl =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    backendBase?.startsWith("http://")
      ? backendBase.replace("http://", "https://")
      : backendBase;

  const [user, setUser] = useState(null);
  const [viewRole, setViewRole] = useState("rider");
  const [status, setStatus] = useState("loading");
  const [rides, setRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchDestination, setSearchDestination] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchNote, setSearchNote] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setViewRole(parsed.role === "both" ? "driver" : parsed.role || "rider");
          setStatus("ready");
          return;
        } catch {
          /* fall through to Supabase fetch */
        }
      }

      if (!supabase) {
        setStatus("guest");
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        setStatus("guest");
        return;
      }

      const shaped = {
        id: data.user.id,
        email: data.user.email,
        username:
          data.user.user_metadata?.username ||
          data.user.email?.split("@")[0] ||
          "User",
        role: data.user.user_metadata?.role || "rider",
        guest: false,
      };
      localStorage.setItem("user", JSON.stringify(shaped));
      window.__USER__ = shaped;
      setUser(shaped);
      setViewRole(shaped.role === "both" ? "driver" : shaped.role || "rider");
      setStatus("ready");
    };

    loadUser();
  }, []);

  useEffect(() => {
    const fetchTrips = async () => {
      // Load local first for instant display.
      const localTrips = readLocal(LOCAL_TRIPS_KEY);
      if (localTrips.length) setRides(localTrips);

      if (!backendUrl) return;

      try {
        const res = await fetch(`${backendUrl}/api/trips`);
        if (res.ok) {
          const data = await res.json();
          setRides((prev) => {
            const locals = prev.filter((t) => t.localOnly);
            const merged = [...locals, ...data];
            writeLocal(LOCAL_TRIPS_KEY, merged);
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load trips:', err);
      }
    };
    fetchTrips();
  }, [backendUrl]);

  if (status === "guest") {
    return <Navigate to="/login" replace />;
  }

  if (status === "loading") {
    return (
      <div className="text-sm text-slate-600">
        Loading your dashboard...
      </div>
    );
  }

  const accountRole = user?.role || "rider";
  const canDrive = accountRole === "driver" || accountRole === "both";
  const canRide = accountRole === "rider" || accountRole === "both";
  const activeRole =
    accountRole === "both" ? viewRole : accountRole === "driver" ? "driver" : "rider";
  const riderRides = searchResults ?? rides;

  if (!canDrive && !canRide) {
    return (
      <div className="text-sm text-slate-600">
        Your account does not have a rider or driver role. Please sign out and
        log in again.
      </div>
    );
  }

  const handleDriverSubmit = async (tripData) => {
    if (!canDrive) {
      alert("Your account is not allowed to post rides.");
      return;
    }

    const optimistic = {
      ...tripData,
      id: `local-${Date.now()}`,
      localOnly: true,
    };
    setRides((prev) => {
      const next = [optimistic, ...prev];
      writeLocal(LOCAL_TRIPS_KEY, next);
      return next;
    });

    let token = null;
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    }

    if (!backendUrl) {
      alert("Trip saved locally (no backend configured).");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/trips`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(tripData)
      });
      
      if (res.ok) {
        const newTrip = await res.json();
        setRides(prev =>
          prev.map((t) => (t.id === optimistic.id ? newTrip : t))
        );
        const updatedLocal = readLocal(LOCAL_TRIPS_KEY).filter((t) => t.id !== optimistic.id);
        writeLocal(LOCAL_TRIPS_KEY, updatedLocal);
        alert('Trip created successfully!');
      } else {
        const error = await res.json();
        console.error('Failed to post trip:', error);
        alert(error.error || 'Failed to post trip; kept locally.');
      }
    } catch (err) {
      console.error('Failed to post trip:', err);
      alert('Backend unreachable. Trip saved locally.');
    }
  };

  const handleRiderSubmit = async (requestData) => {
    if (!canRide) {
      alert("Your account is not allowed to request rides.");
      return;
    }

    try {
      let token = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }
      
      if (!backendUrl) {
        const local = {
          ...requestData,
          id: `local-req-${Date.now()}`,
          localOnly: true,
        };
        setRequests((prev) => {
          const next = [local, ...prev];
          writeLocal(LOCAL_REQUESTS_KEY, next);
          return next;
        });
        alert('Request saved locally (no backend configured).');
        return;
      }
      
      const res = await fetch(`${backendUrl}/api/requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(requestData)
      });
      
      if (res.ok) {
        console.log("Rider requested ride:", requestData);
        alert('Ride request submitted successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit ride request');
        console.error('Failed to submit ride request:', error);
      }
    } catch (err) {
      console.error('Failed to submit ride request:', err);
      alert('Network error: Could not submit request');
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const trimmed = searchDestination.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearchNote("");
      return;
    }

    if (!backendUrl) {
      setSearchResults(null);
      setSearchNote("Backend not configured. Showing all rides.");
      return;
    }

    setSearchNote("Searching within 10 miles...");
    try {
      const res = await fetch(
        `${backendUrl}/api/trips/search?destination=${encodeURIComponent(trimmed)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.trips || []);
        setSearchNote(
          data.count
            ? `Found ${data.count} ride${data.count === 1 ? "" : "s"} within 10 miles.`
            : "No rides found within 10 miles."
        );
      } else {
        const error = await res.json();
        setSearchResults(null);
        setSearchNote(error.error || "Search failed. Showing all rides.");
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults(null);
      setSearchNote("Search failed. Showing all rides.");
    }
  };

  const clearSearch = () => {
    setSearchDestination("");
    setSearchResults(null);
    setSearchNote("");
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl p-6 grid gap-10 lg:grid-cols-[2fr,1.5fr]">

        <section className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-semibold text-gray-800 bg-gray">
              {activeRole === "driver" ? "Driver dashboard" : "Rider dashboard"}
            </h1>
            {accountRole === "both" && (
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-600">
                  Switch mode:
                </div>
                <RoleSelector role={viewRole} onChange={setViewRole} />
              </div>
            )}
          </div>

          <div className="border rounded-xl p-4 bg-white shadow-sm text-sm text-slate-700 flex items-center justify-between">
            <div>
              Logged in as{" "}
              <span className="font-semibold text-slate-900">
                {user?.username || user?.email || "User"}
              </span>{" "}
              · role: {accountRole}
            </div>
            {accountRole !== "both" && (
              <div className="text-xs text-slate-500">
                This view is restricted to your role.
              </div>
            )}
          </div>

          {activeRole === "driver" && canDrive && (
            <div className="space-y-4">
              <div className="border rounded-xl p-4 bg-white shadow-md shadow-slate-200/70">
                <DriverForm onSubmit={handleDriverSubmit} />
              </div>
              <div className="border rounded-xl p-4 bg-white shadow-md shadow-slate-200/70">
                <h2 className="text-lg font-medium text-gray-800 mb-2">
                  Available rides
                </h2>
                <RideList rides={rides} />
              </div>
            </div>
          )}

          {activeRole === "rider" && canRide && (
            <div className="space-y-4">
              <div className="border rounded-xl p-4 bg-white shadow-md shadow-slate-200/70">
                <h2 className="text-lg font-medium text-gray-800 mb-2">
                  Available rides
                </h2>
                <form
                  onSubmit={handleSearchSubmit}
                  className="mb-3 flex flex-col gap-2 md:flex-row md:items-center"
                >
                  <input
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder="Search destination (10-mile radius)"
                    className="w-full md:flex-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-sm font-semibold px-3 py-2 rounded-md text-white"
                    >
                      Find rides
                    </button>
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="text-sm font-semibold px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  </div>
                </form>
                {searchNote && (
                  <div className="text-xs text-slate-500 mb-2">{searchNote}</div>
                )}
                <RideList rides={riderRides} />
              </div>
              <div className="border rounded-xl p-4 bg-white shadow-md shadow-slate-200/70">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">
                  Want to request a ride?
                </h3>
                <RiderForm onSubmit={handleRiderSubmit} />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4 mt-4">
          <h2 className="text-lg font-medium text-gray-800">Map view</h2>
          <div className="border rounded-xl bg-white shadow-md shadow-slate-200/70 p-2 h-[340px]">
            <MapView />
          </div>
</section>

      </div>
    </div>
  );
}

export default Home;
