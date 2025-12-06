// src/components/RiderForm.jsx
import { useState } from "react";

function RiderForm({ onSubmit }) {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    timeWindow: "",
    seatsNeeded: 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 bg-slate-900 border border-slate-800 rounded-lg p-4"
    >
      <h2 className="font-semibold mb-1 text-sm">
        Request a ride as a rider
      </h2>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs mb-1">Leaving from</label>
          <input
            name="origin"
            value={form.origin}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
            placeholder="UC Merced or your current location"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Going to</label>
          <input
            name="destination"
            value={form.destination}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
            placeholder="City / neighborhood"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Time window</label>
          <input
            name="timeWindow"
            value={form.timeWindow}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
            placeholder="e.g. 3–6 PM"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Seats needed</label>
          <input
            type="number"
            min="1"
            name="seatsNeeded"
            value={form.seatsNeeded}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-sm font-semibold px-3 py-2 rounded-md"
      >
        Request ride
      </button>
    </form>
  );
}

export default RiderForm;
