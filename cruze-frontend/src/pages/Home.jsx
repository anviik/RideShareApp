// src/pages/Home.jsx
import { useState, useEffect } from "react";
import RoleSelector from "../components/RoleSelector";
import DriverForm from "../components/DriverForm";
import RiderForm from "../components/RiderForm";
import RideList from "../components/RideList";
import MapView from "../components/MapView";

function Home() {
  const [role, setRole] = useState("rider");
  const [rides, setRides] = useState([]);

  // Prefer a previously chosen role if available
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.role && parsed.role !== "guest") {
        setRole(parsed.role);
      }
    } catch (_) {
      /* ignore malformed local storage */
    }
  }, []);

  // When role changes on Home, persist it to keep dashboard consistent
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const updated = { ...parsed, role };
      localStorage.setItem("user", JSON.stringify(updated));
      window.__USER__ = updated;
    } catch (_) {
      /* ignore persistence errors */
    }
  }, [role]);

  // Fetch trips from backend on mount
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
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
      if (res.ok) {
        const newTrip = await res.json();
        setRides(prev => [newTrip, ...prev]);
        console.log("Driver posted trip:", newTrip);
      } else {
        console.error('Failed to post trip');
      }
    } catch (err) {
      console.error('Failed to post trip:', err);
    }
  };

  const handleRiderSubmit = async (requestData) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (res.ok) {
        console.log("Rider requested ride:", requestData);
        alert('Ride request submitted successfully!');
      } else {
        console.error('Failed to submit ride request');
      }
    } catch (err) {
      console.error('Failed to submit ride request:', err);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl p-6 grid gap-10 lg:grid-cols-[2fr,1.5fr]">

        {/* Left Column */}
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

        {/* Right Column */}
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
