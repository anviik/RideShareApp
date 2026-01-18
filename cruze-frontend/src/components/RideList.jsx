function RideList({ rides }) {
  if (!rides || rides.length === 0) {
    return (
      <div className="mt-2 text-sm text-slate-500">
        No trips posted yet. Once drivers start posting trips, they’ll appear
        here.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold mb-2 text-slate-800">
        Current trips
      </h2>
      <div className="space-y-2">
        {rides.map((trip) => (
          <div
            key={trip.id}
            className="bg-white border border-slate-200 rounded-md px-4 py-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between shadow"
          >
            <div>
              <div className="font-medium text-slate-900">
                {trip.origin} → {trip.destination}
              </div>
              <div className="text-xs text-slate-500">
                {trip.date || "date tbd"}{" "}
                {trip.time ? `at ${trip.time}` : ""}
              </div>
              {typeof trip.distance_miles === "number" && (
                <div className="text-xs text-slate-500">
                  {trip.distance_miles.toFixed(1)} mi from your destination
                </div>
              )}
            </div>
            {trip.price && (
              <div className="mt-2 md:mt-0 text-xs text-slate-700">
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
