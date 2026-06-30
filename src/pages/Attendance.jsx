import { useMemo, useState } from "react";

function cleanName(value) {
  return String(value || "").replace(/\(.*?\)/g, "").trim();
}

function Attendance({
  skillMatrix,
  operationBulletin,
  attendance,
  setAttendance,
  setOperatorAssignments,
  setActivePage,
  skillPool,
  skillPoolAttendance,
  setSkillPoolAttendance,
}) {
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const assignedOperators = useMemo(() => {
    const seen = new Set();
    return operationBulletin
      .filter((ob) => {
        if (!ob.assignedOperatorId) return false;
        if (String(ob.machine).trim().toUpperCase() === "CHECK POINT") return false;
        if (seen.has(String(ob.assignedOperatorId).trim())) return false;
        seen.add(String(ob.assignedOperatorId).trim());
        return true;
      })
      .map((ob) => {
        const skillData = skillMatrix.find(
          (s) => String(s.operatorId).trim() === String(ob.assignedOperatorId).trim()
        );
        return {
          operatorId: ob.assignedOperatorId,
          operatorName: cleanName(ob.assignedOperatorRaw),
          grade: skillData?.grade || "-",
          section: ob.section || "-",
          machine: ob.machine || "-",
          operation: ob.operation,
        };
      });
  }, [operationBulletin, skillMatrix]);

  const sections = ["All", ...new Set(assignedOperators.map((x) => x.section))];
  const grades = ["All", ...new Set(assignedOperators.map((x) => x.grade))];

  const filteredOperators = assignedOperators.filter((op) => {
    const status = attendance[op.operatorId] || "Present";
    const matchesSearch = `${op.operatorId} ${op.operatorName} ${op.operation} ${op.machine}`
      .toLowerCase().includes(search.toLowerCase());
    const matchesSection = sectionFilter === "All" || op.section === sectionFilter;
    const matchesGrade = gradeFilter === "All" || op.grade === gradeFilter;
    const matchesStatus = statusFilter === "All" || status === statusFilter;
    return matchesSearch && matchesSection && matchesGrade && matchesStatus;
  });

  const totalOperators = assignedOperators.length;
  const absentCount = assignedOperators.filter((op) => attendance[op.operatorId] === "Absent").length;
  const presentCount = totalOperators - absentCount;

  // Skill pool counts
  const poolPresentCount = skillPool.filter(
    (op) => skillPoolAttendance[op.operatorId] !== "Absent"
  ).length;
  const poolAbsentCount = skillPool.length - poolPresentCount;

  function toggleAttendance(operatorId) {
    setAttendance((prev) => {
      const updated = {
        ...prev,
        [operatorId]: prev[operatorId] === "Absent" ? "Present" : "Absent",
      };
      localStorage.setItem("attendance", JSON.stringify(updated));
      return updated;
    });
  }

  function togglePoolAttendance(operatorId) {
    setSkillPoolAttendance((prev) => {
      const updated = {
        ...prev,
        [operatorId]: prev[operatorId] === "Absent" ? "Present" : "Absent",
      };
      localStorage.setItem("skillPoolAttendance", JSON.stringify(updated));
      return updated;
    });
  }

  function markAllPresent() {
    const updated = {};
    assignedOperators.forEach((op) => { updated[op.operatorId] = "Present"; });
    setAttendance(updated);
    localStorage.setItem("attendance", JSON.stringify(updated));
  }

  function markAllAbsent() {
    const updated = {};
    assignedOperators.forEach((op) => { updated[op.operatorId] = "Absent"; });
    setAttendance(updated);
    localStorage.setItem("attendance", JSON.stringify(updated));
  }

  function resetAttendance() {
    setAttendance({});
    localStorage.removeItem("attendance");
  }

  function markAllPoolPresent() {
    const updated = {};
    skillPool.forEach((op) => { updated[op.operatorId] = "Present"; });
    setSkillPoolAttendance(updated);
    localStorage.setItem("skillPoolAttendance", JSON.stringify(updated));
  }

  function markAllPoolAbsent() {
    const updated = {};
    skillPool.forEach((op) => { updated[op.operatorId] = "Absent"; });
    setSkillPoolAttendance(updated);
    localStorage.setItem("skillPoolAttendance", JSON.stringify(updated));
  }

  function saveAndProcess() {
    const assignments = {};
    assignedOperators.forEach((op) => { assignments[op.operatorId] = op.operation; });
    setOperatorAssignments(assignments);
    localStorage.setItem("operatorAssignments", JSON.stringify(assignments));
    setActivePage("Dashboard");
  }

  if (assignedOperators.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-8">
        <h2 className="text-2xl font-bold">Daily Attendance</h2>
        <p className="text-slate-500 mt-3">
          Upload OB file first. Attendance will show operators assigned in OB.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h1 className="text-3xl font-bold text-slate-900">Daily Attendance Control</h1>
        <p className="text-slate-500 mt-2">Mark operator presence directly from uploaded OB assignments.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-slate-500 text-sm">Total Operators</p>
          <h2 className="text-3xl font-bold mt-2">{totalOperators}</h2>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-slate-500 text-sm">Present</p>
          <h2 className="text-3xl font-bold mt-2 text-green-600">{presentCount}</h2>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-slate-500 text-sm">Absent</p>
          <h2 className="text-3xl font-bold mt-2 text-red-600">{absentCount}</h2>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-slate-500 text-sm">Pool Present</p>
          <h2 className="text-3xl font-bold mt-2 text-blue-600">{poolPresentCount}</h2>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-slate-500 text-sm">Pool Absent</p>
          <h2 className="text-3xl font-bold mt-2 text-orange-500">{poolAbsentCount}</h2>
        </div>
      </div>

      {/* Line Operators Table */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Line Operators</h2>

        <div className="flex gap-4 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Search operator, operation, machine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-xl px-4 py-3 flex-1 min-w-48"
          />
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="border rounded-xl px-4 py-3">
            {sections.map((section) => (<option key={section}>{section}</option>))}
          </select>
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="border rounded-xl px-4 py-3">
            {grades.map((grade) => (<option key={grade}>{grade}</option>))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-xl px-4 py-3">
            <option>All</option>
            <option>Present</option>
            <option>Absent</option>
          </select>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <button onClick={markAllPresent} className="bg-green-600 text-white px-5 py-3 rounded-xl font-semibold">Mark All Present</button>
          <button onClick={markAllAbsent} className="bg-red-600 text-white px-5 py-3 rounded-xl font-semibold">Mark All Absent</button>
          <button onClick={resetAttendance} className="bg-slate-600 text-white px-5 py-3 rounded-xl font-semibold">Reset</button>
          <button onClick={saveAndProcess} className="ml-auto bg-[#071b33] text-white px-6 py-3 rounded-xl font-semibold">Save & Process Allocation</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4">Operator ID</th>
                <th className="text-left p-4">Operator Name</th>
                <th className="text-left p-4">Grade</th>
                <th className="text-left p-4">Section</th>
                <th className="text-left p-4">Machine</th>
                <th className="text-left p-4">Operation</th>
                <th className="text-left p-4">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredOperators.map((op, index) => {
                const status = attendance[op.operatorId] || "Present";
                return (
                  <tr key={`${op.operatorId}-${index}`} className="border-t">
                    <td className="p-4">{op.operatorId}</td>
                    <td className="p-4 font-semibold">{op.operatorName}</td>
                    <td className="p-4">{op.grade}</td>
                    <td className="p-4">{op.section}</td>
                    <td className="p-4">{op.machine}</td>
                    <td className="p-4">{op.operation}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleAttendance(op.operatorId)}
                        className={`px-4 py-2 rounded-full text-white font-semibold ${
                          status === "Present" ? "bg-green-600" : "bg-red-600"
                        }`}
                      >
                        {status}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Skill Pool Operators Table */}
      {skillPool.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Skill Pool Operators</h2>
              <p className="text-slate-500 text-sm mt-1">
                Extra/helper operators available as substitutes when line operators are absent.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={markAllPoolPresent} className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold text-sm">All Present</button>
              <button onClick={markAllPoolAbsent} className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold text-sm">All Absent</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="text-left p-4">Operator ID</th>
                  <th className="text-left p-4">Operator Name</th>
                  <th className="text-left p-4">Grade</th>
                  <th className="text-left p-4">Skills</th>
                  <th className="text-left p-4">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {skillPool.map((op, index) => {
                  const status = skillPoolAttendance[op.operatorId] !== "Absent" ? "Present" : "Absent";
                  return (
                    <tr key={index} className="border-t">
                      <td className="p-4">{op.operatorId}</td>
                      <td className="p-4 font-semibold">{op.operatorName}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          op.grade === "A+" ? "bg-emerald-100 text-emerald-700"
                          : op.grade === "A" ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                        }`}>{op.grade}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {op.skills.length > 0 ? op.skills.map((skill, si) => (
                            <span key={si} className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full border border-teal-200">
                              {skill.operation} · {skill.efficiency}%
                            </span>
                          )) : (
                            <span className="text-slate-400 text-xs">No skills added</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => togglePoolAttendance(op.operatorId)}
                          className={`px-4 py-2 rounded-full text-white font-semibold ${
                            status === "Present" ? "bg-green-600" : "bg-red-600"
                          }`}
                        >
                          {status}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;