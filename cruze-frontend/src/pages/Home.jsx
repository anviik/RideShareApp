// src/pages/Home.jsx
import { useState } from "react";
import RoleSelector from "../components/RoleSelector";
import DriverForm from "../components/DriverForm";
import RiderForm from "../components/RiderForm";
import RideList from "../components/RideList";
import MapView from "../components/MapView";

function Home() {
  const [role, setRole] = useState("rider");
  const [rides, setRides] = useState([]);

  const handleDriverSubmit = async (tripData) => {
    console.log("Driver posted trip:", tripData);
    setRides((prev) => [...prev, { id: prev.length + 1, ...tripData }]);
  };

  const handleRiderSubmit = async (requestData) => {
    console.log("Rider requested ride:", requestData);
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl p-6 grid gap-10 lg:grid-cols-[2fr,1.5fr]">

        {/* Left Column */}
        <section className="space-y-6">
          <h1 className="text-3xl font-semibold text-gray-800 bg-white">
            Find or share rides with Cruze
          </h1>

          <p className="text-sm text-gray-600 leading-relaxed">
            Choose whether you are driving or looking for a ride, then fill out the details.
            Cruze helps match UC Merced students traveling in the same direction.
          </p>

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
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-gray-800">Map view</h2>

          <div className="border rounded-xl bg-white shadow-md shadow-slate-200/70 p-2 h-[500px]">
            <MapView />
          </div>
        </section>

      </div>
    </div>
  );
}

export default Home;
