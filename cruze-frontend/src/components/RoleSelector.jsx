export default function RoleSelector({ setRole }) {
  return (
    <div className="flex justify-center gap-6 mt-10">
      <button onClick={() => setRole("driver")} className="px-6 py-3 bg-blue-600 text-white rounded">
        I’m a Driver
      </button>
      <button onClick={() => setRole("rider")} className="px-6 py-3 bg-green-600 text-white rounded">
        I’m a Rider
      </button>
    </div>
  );
}
