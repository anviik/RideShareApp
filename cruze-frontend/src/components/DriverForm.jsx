import { useState } from "react";

export default function DriverForm({ onSubmit }) {
  const [trip, setTrip] = useState({
    origin: "",
    destination: "",
    date: "",
    time: "",
    seats: 1,
    price: 5,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(trip);
      }}
      className="flex flex-col gap-3"
    >
      <input placeholder="Origin" onChange={(e) => setTrip({ ...trip, origin: e.target.value })} />
      <input placeholder="Destination" onChange={(e) => setTrip({ ...trip, destination: e.target.value })} />
      <input type="date" onChange={(e) => setTrip({ ...trip, date: e.target.value })} />
      <input type="time" onChange={(e) => setTrip({ ...trip, time: e.target.value })} />
      <input type="number" placeholder="Seats" onChange={(e) => setTrip({ ...trip, seats: e.target.value })} />
      <input type="number" placeholder="Price" onChange={(e) => setTrip({ ...trip, price: e.target.value })} />
      <button className="bg-blue-600 text-white rounded p-2">Post Ride</button>
    </form>
  );
}
