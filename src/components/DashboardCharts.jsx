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

function DashboardCharts({ totalPresent, totalAbsent, operationBulletin }) {
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

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold mb-4">Attendance Overview</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={attendanceData} dataKey="value" nameKey="name" outerRadius={90} label>
              <Cell fill="#16a34a" />
              <Cell fill="#dc2626" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold mb-4">Section-wise Operations</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sectionData}>
            <XAxis dataKey="section" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="operations" fill="#0f766e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DashboardCharts;