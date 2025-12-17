import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import RoleSelector from "../components/RoleSelector";
import DriverForm from "../components/DriverForm";
import RiderForm from "../components/RiderForm";
import RideList from "../components/RideList";
import MapView from "../components/MapView";

function Home() {
  const [user, setUser] = useState(null);
  const [viewRole, setViewRole] = useState("rider");
  const [status, setStatus] = useState("loading");
  const [rides, setRides] = useState([]);

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
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips`);
        if (res.ok) {
          const data = await res.json();
          setRides(data);
        }
      } catch (err) {
        console.error('Failed to load trips:', err);
      }
    };
    fetchTrips();
  }, []);

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

    try {
      let token = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }
      
      if (!token) {
        alert('Please log in to create a trip');
        return;
      }
      
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tripData)
      });
      
      if (res.ok) {
        const newTrip = await res.json();
        setRides(prev => [newTrip, ...prev]);
        console.log("Driver posted trip:", newTrip);
        alert('Trip created successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to post trip');
        console.error('Failed to post trip:', error);
      }
    } catch (err) {
      console.error('Failed to post trip:', err);
      alert('Network error: Could not create trip');
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
      
      if (!token) {
        alert('Please log in to request a ride');
        return;
      }
      
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
                <RideList rides={rides} />
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
