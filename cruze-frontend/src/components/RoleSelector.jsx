// src/components/RoleSelector.jsx
function RoleSelector({ role, onChange }) {
  const base =
    "px-3 py-2 rounded-md text-sm border border-slate-700 cursor-pointer";
  const active = "bg-indigo-500 text-white border-indigo-500";
  const inactive = "bg-slate-900 text-slate-300 hover:bg-slate-800";

  return (
    <div className="inline-flex gap-2">
      <button
        type="button"
        className={`${base} ${role === "rider" ? active : inactive}`}
        onClick={() => onChange("rider")}
      >
        I need a ride
      </button>
      <button
        type="button"
        className={`${base} ${role === "driver" ? active : inactive}`}
        onClick={() => onChange("driver")}
      >
        I am driving
      </button>
    </div>
  );
}

export default RoleSelector;
