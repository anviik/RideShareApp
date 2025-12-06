// src/components/DriverForm.jsx
import { useState } from "react";

function DriverForm({ onSubmit }) {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    time: "",
    seats: 1,
    price: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    // optional: reset
    // setForm({ ...form, price: "", seats: 1 });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 bg-slate-900 border border-slate-800 rounded-lg p-4"
    >
      <h2 className="font-semibold mb-1 text-sm">Post a trip as a driver</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs mb-1">Leaving from</label>
          <input
            name="origin"
            value={form.origin}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
            placeholder="UC Merced campus"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Going to</label>
          <input
            name="destination"
            value={form.destination}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
            placeholder="Bay Area, LA, etc."
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
          <label className="block text-xs mb-1">Time</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Available seats</label>
          <input
            type="number"
            min="1"
            name="seats"
            value={form.seats}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Price per seat ($)</label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
            placeholder="10"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-sm font-semibold px-3 py-2 rounded-md"
      >
        Post trip
      </button>
    </form>
  );
}

export default DriverForm;
