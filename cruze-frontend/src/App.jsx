import { useState } from "react";
import RoleSelector from "./components/RoleSelector";
import DriverForm from "./components/DriverForm";
import RiderForm from "./components/RiderForm";
import MapView from "./components/MapView";
import RideList from "./components/RideList";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function App() {
  const [role, setRole] = useState(null);
  const [rides, setRides] = useState([]);

  async function postTrip(trip) {
    await fetch(`${BACKEND}/api/trips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip),
    });
    alert("Trip posted!");
  }

  async function searchTrips(query) {
    const res = await fetch(`${BACKEND}/api/rides/search?origin=${query.origin}&destination=${query.destination}`);
    const data = await res.json();
    setRides(data);
  }

  return (
    <div className="p-6">
      {!role ? (
        <RoleSelector setRole={setRole} />
      ) : (
        <div className="space-y-6">
          {role === "driver" ? (
            <DriverForm onSubmit={postTrip} />
          ) : (
            <RiderForm onSearch={searchTrips} />
          )}
          <MapView markers={rides.map((r) => ({ lat: r.lat, lng: r.lng, title: r.destination }))} />
          {role === "rider" && <RideList rides={rides} onSelect={(r) => alert(`Booking ${r.id}`)} />}
        </div>
      )}
    </div>
  );
}
