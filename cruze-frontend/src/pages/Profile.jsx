// src/pages/Profile.jsx
// A simple profile home page. Replace the mock user data with real user info from your auth source.
const mockUser = {
  name: "Alex Martinez",
  age: 21,
  email: "alex.merced@example.com",
  phone: "(555) 123-4567",
  bio: "UC Merced student excited to carpool to campus and weekend trips. Happy to help split gas and always on time.",
  avatarUrl:
    "https://api.dicebear.com/8.x/initials/svg?seed=Alex%20Martinez&backgroundType=gradientLinear,solid&backgroundColor=ffe6a7,d7e3fc",
};

function Profile() {
  const user = mockUser;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl overflow-hidden shadow border border-slate-200 bg-slate-100">
            <img
              src={user.avatarUrl}
              alt={`${user.name} avatar`}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {user.name}
            </h1>
            <p className="text-sm text-slate-600">Age {user.age}</p>
          </div>
        </div>
        <button className="self-start sm:self-auto px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
          Edit profile
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            Contact
          </h2>
          <div className="space-y-2 text-sm text-slate-700">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Email
              </div>
              <div>{user.email}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Phone
              </div>
              <div>{user.phone}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            About
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">{user.bio}</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
