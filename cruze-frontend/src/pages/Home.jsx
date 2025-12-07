// src/pages/Home.jsx
import { useState, useEffect } from "react";
import RoleSelector from "../components/RoleSelector";
import DriverForm from "../components/DriverForm";
import RiderForm from "../components/RiderForm";
import RideList from "../components/RideList";
import MapView from "../components/MapView";

function Home() {
  const [role, setRole] = useState("rider"); // "driver" | "rider"
  const [rides, setRides] = useState([]);

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
    <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Find or share rides with Cruze</h1>
        <p className="text-sm text-slate-300">
          Choose whether you are driving or looking for a ride, then fill out
          the details. Cruze will help match UC Merced students going the same
          way.
        </p>

        <RoleSelector role={role} onChange={setRole} />

        {role === "driver" ? (
          <DriverForm onSubmit={handleDriverSubmit} />
        ) : (
          <RiderForm onSubmit={handleRiderSubmit} />
        )}

        <RideList rides={rides} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Map view</h2>
        <MapView rides={rides} />
      </section>
    </div>
  );
}

export default Home;
