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
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow"
    >
      <h2 className="font-semibold mb-1 text-sm text-slate-800">
        Post a trip as a driver
      </h2>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs mb-1">Leaving from</label>
          <input
            name="origin"
            value={form.origin}
            onChange={handleChange}
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="UC Merced campus"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Going to</label>
          <input
            name="destination"
            value={form.destination}
            onChange={handleChange}
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
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
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Time</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
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
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Price per seat ($)</label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="10"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 bg-slate-900 hover:bg-slate-800 text-sm font-semibold px-3 py-2 rounded-md text-white"
      >
        Post trip
      </button>
    </form>
  );
}

export default DriverForm;
