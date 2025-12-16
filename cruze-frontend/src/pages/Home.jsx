import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import RoleSelector from "../components/RoleSelector";
import DriverForm from "../components/DriverForm";
import RiderForm from "../components/RiderForm";
import RideList from "../components/RideList";
import MapView from "../components/MapView";

function Home() {
  const [role, setRole] = useState("rider");
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.role && parsed.role !== "guest") {
        setRole(parsed.role);
      }
    } catch (_) {
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const updated = { ...parsed, role };
      localStorage.setItem("user", JSON.stringify(updated));
      window.__USER__ = updated;
    } catch (_) {
    }
  }, [role]);

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

  const handleDriverSubmit = async (tripData) => {
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
          <h1 className="text-3xl font-semibold text-gray-800 bg-gray">
            Find or share rides with Cruze
          </h1>

          <div className="border rounded-xl p-4 bg-white shadow-md shadow-slate-200/70">
            <RoleSelector role={role} onChange={setRole} />

            <div className="mt-4">
              {role === "driver" ? (
                <DriverForm onSubmit={handleDriverSubmit} />
              ) : (
                <RiderForm onSubmit={handleRiderSubmit} />
              )}
            </div>
          </div>

          <div className="border rounded-xl p-4 bg-white shadow-md shadow-slate-200/70">
            <RideList rides={rides} />
          </div>
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
