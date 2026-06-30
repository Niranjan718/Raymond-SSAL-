function Settings({ skillMatrix, operationBulletin }) {
  const totalOperators = new Set(skillMatrix.map((x) => x.operatorId)).size;
  const totalSkills = skillMatrix.length;
  const totalOperations = operationBulletin.length;
  const totalMachines = new Set(operationBulletin.map((x) => x.machine).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border p-8">
        <h1 className="text-3xl font-bold">Settings / Master Database</h1>
        <p className="text-slate-500 mt-2">
          View uploaded Skill Matrix and Operation Bulletin data.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card title="Operators" value={totalOperators} />
        <Card title="Skill Records" value={totalSkills} />
        <Card title="OB Operations" value={totalOperations} />
        <Card title="Machines" value={totalMachines} />
      </div>

      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-2xl font-bold mb-4">Skill Matrix Preview</h2>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="p-3 text-left">Operator ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Grade</th>
                <th className="p-3 text-left">Operation</th>
                <th className="p-3 text-left">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {skillMatrix.slice(0, 150).map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{row.operatorId}</td>
                  <td className="p-3 font-semibold">{row.operatorName}</td>
                  <td className="p-3">{row.grade}</td>
                  <td className="p-3">{row.operation}</td>
                  <td className="p-3">{row.efficiency}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-2xl font-bold mb-4">Operation Bulletin Preview</h2>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="p-3 text-left">Section</th>
                <th className="p-3 text-left">Machine</th>
                <th className="p-3 text-left">Operation</th>
                <th className="p-3 text-left">SAM</th>
                <th className="p-3 text-left">Criticality</th>
                <th className="p-3 text-left">Assigned Operator</th>
              </tr>
            </thead>
            <tbody>
              {operationBulletin.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{row.section}</td>
                  <td className="p-3">{row.machine}</td>
                  <td className="p-3 font-semibold">{row.operation}</td>
                  <td className="p-3">{row.sam}</td>
                  <td className="p-3">{row.criticality}</td>
                  <td className="p-3">{row.assignedOperatorRaw}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl border p-6">
      <p className="text-slate-500">{title}</p>
      <h2 className="text-4xl font-bold mt-2">{value}</h2>
    </div>
  );
}

export default Settings;