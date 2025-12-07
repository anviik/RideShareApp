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
      className="mt-4 space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow"
    >
      <h2 className="font-semibold mb-1 text-sm text-slate-800">
        Request a ride as a rider
      </h2>

      <div className="grid gap-3 md:grid-cols-2 text-slate-800">
        <div>
          <label className="block text-xs mb-1">Leaving from</label>
          <input
            name="origin"
            value={form.origin}
            onChange={handleChange}
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="UC Merced or your current location"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Going to</label>
          <input
            name="destination"
            value={form.destination}
            onChange={handleChange}
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Time window</label>
          <input
            name="timeWindow"
            value={form.timeWindow}
            onChange={handleChange}
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 bg-slate-900 hover:bg-slate-800 text-sm font-semibold px-3 py-2 rounded-md text-white"
      >
        Request ride
      </button>
    </form>
  );
}

export default RiderForm;
