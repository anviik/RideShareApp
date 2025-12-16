function RoleSelector({ role, onChange }) {
  const base =
    "px-3 py-2 rounded-md text-sm border cursor-pointer transition-colors";
  const active = "bg-slate-900 text-white border-slate-900 shadow-sm";
  const inactive =
    "bg-white text-slate-700 border-slate-200 hover:border-slate-400";

  return (
    <div className="inline-flex gap-2 bg-slate-100 p-1 rounded-lg">
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
