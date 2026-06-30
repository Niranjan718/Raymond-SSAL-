import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

function Analytics({ skillMatrix, operationBulletin, attendance }) {
  const obOperators = new Set(
    operationBulletin.map((ob) => ob.assignedOperatorId).filter(Boolean)
  );

  const totalOperators = obOperators.size;

  const totalAbsent = Object.values(attendance).filter(
    (status) => status === "Absent"
  ).length;

  const totalPresent = Math.max(0, totalOperators - totalAbsent);

  const attendanceData = [
    { name: "Present", value: totalPresent },
    { name: "Absent", value: totalAbsent },
  ];

  const sectionCounts = {};

  operationBulletin.forEach((ob) => {
    const section = ob.section || "Unknown";
    sectionCounts[section] = (sectionCounts[section] || 0) + 1;
  });

  const sectionData = Object.keys(sectionCounts).map((section) => ({
    section,
    operations: sectionCounts[section],
  }));

  const criticalityCounts = {
    Critical: 0,
    Medium: 0,
    Easy: 0,
  };

  operationBulletin.forEach((ob) => {
    criticalityCounts[ob.criticality] =
      (criticalityCounts[ob.criticality] || 0) + 1;
  });

  const criticalityData = Object.keys(criticalityCounts).map((level) => ({
    level,
    count: criticalityCounts[level],
  }));

  const operatorEfficiency = {};

  skillMatrix.forEach((skill) => {
    if (!operatorEfficiency[skill.operatorName]) {
      operatorEfficiency[skill.operatorName] = [];
    }

    operatorEfficiency[skill.operatorName].push(skill.efficiency);
  });

  const topOperators = Object.keys(operatorEfficiency)
    .map((name) => {
      const values = operatorEfficiency[name];
      const avg =
        values.reduce((sum, value) => sum + value, 0) / values.length;

      return {
        name,
        avg: Math.round(avg),
      };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Factory Analytics
        </h1>

        <p className="mt-2 text-slate-500">
          Analytics generated from uploaded Skill Matrix, OB and attendance data.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Attendance Overview</h2>

          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={attendanceData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                <Cell fill="#16a34a" />
                <Cell fill="#dc2626" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Section-wise Operations</h2>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectionData}>
              <XAxis dataKey="section" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="operations" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Criticality Distribution</h2>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={criticalityData}>
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#071b33" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Top 10 Operators</h2>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topOperators}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Analytics;