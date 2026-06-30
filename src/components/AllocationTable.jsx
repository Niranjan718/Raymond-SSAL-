import { useState } from "react";

function badgeColor(value) {
  if (value === "Critical") return "bg-red-50 text-red-700 ring-red-200";
  if (value === "Medium") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function riskColor(efficiency, required) {
  if (!efficiency) return "text-red-700 bg-red-50";
  if (efficiency < required) return "text-red-700 bg-red-50";
  if (efficiency < required + 10) return "text-amber-700 bg-amber-50";
  return "text-emerald-700 bg-emerald-50";
}

function AllocationTable({ rows }) {
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [criticalityFilter, setCriticalityFilter] = useState("All");

  const sections = ["All", ...new Set(rows.map((row) => row.section))];
  const criticalities = ["All", "Critical", "Medium", "Easy"];

  const filteredRows = rows.filter((row) => {
    const matchesSearch = `${row.section} ${row.machine} ${row.operation} ${row.originalOperator} ${row.substitute}`
      .toLowerCase()
      .includes(search.toLowerCase());

    return (
      matchesSearch &&
      (sectionFilter === "All" || row.section === sectionFilter) &&
      (criticalityFilter === "All" || row.criticality === criticalityFilter)
    );
  });

  return (
    <div className="card-enter bg-white/95 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white flex justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Smart Substitute Allocation
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Includes takt time, required efficiency and bottleneck risk.
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="border rounded-2xl px-4 py-3 bg-white"
          >
            {sections.map((section) => (
              <option key={section}>{section}</option>
            ))}
          </select>

          <select
            value={criticalityFilter}
            onChange={(e) => setCriticalityFilter(e.target.value)}
            className="border rounded-2xl px-4 py-3 bg-white"
          >
            {criticalities.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search allocation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-2xl px-4 py-3 w-80 bg-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-4">Section</th>
              <th className="text-left p-4">Machine</th>
              <th className="text-left p-4">Operation</th>
              <th className="text-left p-4">Criticality</th>
              <th className="text-left p-4">Absent Operator</th>
              <th className="text-left p-4">Substitute</th>
              <th className="text-left p-4">Efficiency</th>
              <th className="text-left p-4">Takt Time</th>
              <th className="text-left p-4">Target Eff. Required</th>
              <th className="text-left p-4">Confidence</th>
              <th className="text-left p-4">Alternatives</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan="11" className="p-10 text-center text-slate-500">
                  No allocation records found.
                </td>
              </tr>
            )}

            {filteredRows.map((row, index) => (
              <tr key={index} className="border-t hover:bg-slate-50/80">
                <td className="p-4">{row.section}</td>
                <td className="p-4">{row.machine}</td>
                <td className="p-4 font-bold text-slate-900">{row.operation}</td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full font-bold ring-1 ${badgeColor(
                      row.criticality
                    )}`}
                  >
                    {row.criticality}
                  </span>
                </td>

                <td className="p-4">{row.originalOperator}</td>

                <td className="p-4">
                  <span
                    className={`px-3 py-2 rounded-xl font-black ${riskColor(
                      row.efficiency,
                      row.targetEfficiencyRequired
                    )}`}
                  >
                    {row.substitute || "No match found"}
                  </span>

                  {row.substitute && (
                    <p className="text-xs text-slate-500 mt-1">
                      Currently:{" "}
                      <span className="font-semibold text-slate-700">
                        {row.substituteCurrentJob || "Not assigned / Free"}
                      </span>
                    </p>
                  )}
                </td>

                <td className="p-4">
                  {row.efficiency ? `${row.efficiency}%` : "-"}
                </td>

                <td className="p-4 font-semibold">{row.taktTime} min</td>

                <td className="p-4 font-semibold">
                  {row.targetEfficiencyRequired}%
                </td>

                <td className="p-4 font-bold">
                  {row.confidence ? `${row.confidence}%` : "-"}
                </td>

                <td className="p-4">
                  {row.alternatives?.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {row.alternatives.map((alt, i) => (
                        <div key={i}>
                          <span className="bg-slate-100 px-3 py-1 rounded-full inline-block">
                            {alt.name} · {alt.efficiency}%
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5 ml-1">
                            Currently:{" "}
                            <span className="font-semibold text-slate-700">
                              {alt.currentJob || "Not assigned / Free"}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AllocationTable;