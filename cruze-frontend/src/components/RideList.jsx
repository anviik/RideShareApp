// src/components/RideList.jsx
function RideList({ rides }) {
  if (!rides || rides.length === 0) {
    return (
      <div className="mt-4 text-sm text-slate-400">
        No trips posted yet. Once drivers start posting trips, they’ll appear
        here.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold mb-2">Current trips</h2>
      <div className="space-y-2">
        {rides.map((trip) => (
          <div
            key={trip.id}
            className="bg-slate-900 border border-slate-800 rounded-md px-4 py-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="font-medium">
                {trip.origin} → {trip.destination}
              </div>
              <div className="text-xs text-slate-400">
                {trip.date || "date tbd"}{" "}
                {trip.time ? `at ${trip.time}` : ""}
              </div>
            </div>
            {trip.price && (
              <div className="mt-2 md:mt-0 text-xs text-slate-300">
                ${trip.price} per seat
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RideList;
