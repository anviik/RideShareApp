// src/components/MapView.jsx
function MapView({ rides }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg h-80 flex items-center justify-center text-sm text-slate-400">
      {/* TODO: hook up Google Maps here using window.google.maps */}
      {rides.length === 0
        ? "Map preview will show routes once trips are posted."
        : "In the future this will show routes and pick-up points for the trips above."}
    </div>
  );
}

export default MapView;
