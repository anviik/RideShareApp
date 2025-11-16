export default function RideList({ rides, onSelect }) {
  return (
    <div className="space-y-3">
      {rides.map((r) => (
        <div key={r.id} className="p-3 rounded bg-white/5">
          <div>{r.origin} → {r.destination}</div>
          <div>{r.date} {r.time} • ${r.price}</div>
          <button onClick={() => onSelect(r)} className="bg-blue-500 text-white px-3 py-1 rounded">Book</button>
        </div>
      ))}
    </div>
  );
}
