import { useState } from "react";

export default function RiderForm({ onSearch }) {
  const [query, setQuery] = useState({ origin: "", destination: "", date: "" });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(query);
      }}
      className="flex flex-col gap-3"
    >
      <input placeholder="From" onChange={(e) => setQuery({ ...query, origin: e.target.value })} />
      <input placeholder="To" onChange={(e) => setQuery({ ...query, destination: e.target.value })} />
      <input type="date" onChange={(e) => setQuery({ ...query, date: e.target.value })} />
      <button className="bg-green-600 text-white rounded p-2">Search Rides</button>
    </form>
  );
}
