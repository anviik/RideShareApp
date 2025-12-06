// src/pages/Home.jsx
import { useState } from "react";
import RoleSelector from "../components/RoleSelector";
import DriverForm from "../components/DriverForm";
import RiderForm from "../components/RiderForm";
import RideList from "../components/RideList";
import MapView from "../components/MapView";

function Home() {
  const [role, setRole] = useState("rider"); // "driver" | "rider"
  const [rides, setRides] = useState([]);

  const handleDriverSubmit = async (tripData) => {
    console.log("Driver posted trip:", tripData);
    // TODO: call backend POST /api/trips
    setRides((prev) => [...prev, { id: prev.length + 1, ...tripData }]);
  };

  const handleRiderSubmit = async (requestData) => {
    console.log("Rider requested ride:", requestData);
    // TODO: call backend POST /api/ride-requests
    // could also trigger matching later
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
