import { useEffect, useState } from "react";

function getGreeting(date) {
  const hour = date.getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function DashboardHeader({ operationBulletin, skillMatrix, currentUser }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentStyle = localStorage.getItem("currentStyle") || "No Style Loaded";

  const fullName = currentUser?.name || currentUser?.email || "";
  const firstName = fullName.trim().split(" ")[0];

  const totalOperators = new Set(skillMatrix.map((x) => x.operatorId)).size;

  const totalOperations = operationBulletin.filter(
    (x) => String(x.machine).trim().toUpperCase() !== "CHECK POINT"
  ).length;

  const totalMachines = operationBulletin.filter(
    (x) => x.machine && String(x.machine).trim().toUpperCase() !== "CHECK POINT"
  ).length;

  const totalCheckpoints = operationBulletin.filter(
    (x) => x.machine && String(x.machine).trim().toUpperCase() === "CHECK POINT"
  ).length;

  return (
    <div className="card-enter relative overflow-hidden bg-gradient-to-br from-[#071b33] via-[#0b2a4d] to-[#0f766e] rounded-3xl shadow-xl p-8 text-white">
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full" />
      <div className="absolute right-20 bottom-0 w-40 h-40 bg-teal-300/10 rounded-full" />

      <div className="relative flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">
            {getGreeting(now)}{firstName ? `, ${firstName}` : ""} 👋
          </h1>

          <p className="text-slate-200 mt-2">
            Smart Substitute Operator Allocation Dashboard
          </p>

          <div className="mt-4 inline-flex bg-white/15 border border-white/20 rounded-full px-5 py-2 font-semibold">
            Current Style: {currentStyle}
          </div>
        </div>

        <div className="text-right">
          <div className="inline-flex bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 px-4 py-2 rounded-full font-bold">
            ● System Ready
          </div>

          
        </div>
      </div>

      <div className="relative grid grid-cols-4 gap-5 mt-8">
        <Info title="Operators" value={totalOperators} />
        <Info title="Operations" value={totalOperations} />
        <Info title="Machines" value={totalMachines} />
        <Info title="Checking Table" value={totalCheckpoints} />
      </div>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div className="bg-white/15 backdrop-blur border border-white/20 rounded-2xl p-5">
      <p className="text-slate-200 text-sm">{title}</p>
      <h3 className="font-black text-3xl mt-2">{value}</h3>
    </div>
  );
}

export default DashboardHeader;