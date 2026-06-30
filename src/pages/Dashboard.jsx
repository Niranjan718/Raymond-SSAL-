import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import MetricCard from "../components/MetricCard";
import AllocationTable from "../components/AllocationTable";
import DashboardHeader from "../components/DashboardHeader";
import { getAllocationRows } from "../services/allocationEngine";
import { getLineBalancingPlan } from "../services/lineBalancingEngine";
import {
  getCapacityPlan,
  getTargetEfficiencyRequired,
} from "../services/capacityOptimizer";

function Dashboard({
  skillMatrix,
  operationBulletin,
  attendance,
  operatorAssignments,
  currentUser,
  skillPool,
  skillPoolAttendance,
}) {
  const [targetInput, setTargetInput] = useState(() => {
    return Number(localStorage.getItem("productionTarget") || 450);
  });
  const [appliedTarget, setAppliedTarget] = useState(() => {
    return Number(localStorage.getItem("productionTarget") || 450);
  });
  const [plannedCapacity, setPlannedCapacity] = useState(() => {
    return Number(localStorage.getItem("plannedCapacity") || 600);
  });
  const [calculatedTargetInfo, setCalculatedTargetInfo] = useState("");

  useEffect(() => {
    function handleAiTarget() {
      const value = localStorage.getItem("aiTarget");
      if (value) {
        setTargetInput(Number(value));
        setAppliedTarget(Number(value));
      }
    }
    window.addEventListener("ai-set-target", handleAiTarget);
    return () => window.removeEventListener("ai-set-target", handleAiTarget);
  }, []);

  if (skillMatrix.length === 0 || operationBulletin.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-8">
        <h2 className="text-2xl font-bold">Smart Allocation Dashboard</h2>
        <p className="text-slate-500 mt-3">
          Please upload the Skill Matrix and Operation Bulletin first.
        </p>
      </div>
    );
  }

  function applyTarget() {
    const target = Number(targetInput);
    setAppliedTarget(target);
    localStorage.setItem("productionTarget", target);
    window.dispatchEvent(
      new CustomEvent("app-notify", {
        detail: {
          message: `Target applied: ${target} pieces/day. You'll get progress updates every 2.5 hours during the shift (8:30 AM–5:00 PM, excludes 30 min lunch break).`,
        },
      })
    );
  }

  const capacityPlan = getCapacityPlan({
    targetOutput: appliedTarget,
    operationBulletin,
    skillMatrix,
    attendance,
  });

  const lineBalancingPlan = getLineBalancingPlan({
    targetOutput: appliedTarget,
    operationBulletin,
    skillMatrix,
    attendance,
  });

  const targetEfficiencyRequired = getTargetEfficiencyRequired(appliedTarget);

  const allocationRows = getAllocationRows({
    skillMatrix,
    operationBulletin,
    attendance,
    operatorAssignments,
    skillPool: skillPool || [],
    skillPoolAttendance: skillPoolAttendance || {},
  }).map((row) => ({
    ...row,
    taktTime: capacityPlan.taktTime,
    targetEfficiencyRequired,
  }));

  const obOperatorIds = operationBulletin
    .filter((ob) => ob.assignedOperatorId)
    .map((ob) => ob.assignedOperatorId);

  const totalOperators = new Set(obOperatorIds).size;

  const absentIds = Object.keys(attendance).filter(
    (id) => attendance[id] === "Absent"
  );

  const totalAbsent = absentIds.length;
  const totalPresent = Math.max(0, totalOperators - totalAbsent);

  const successfulAllocations = allocationRows.filter(
    (row) => row.substitute
  ).length;

  const allocationSuccess =
    totalAbsent === 0
      ? 100
      : Math.round((successfulAllocations / totalAbsent) * 100);

  const totalOperatorsRequired = lineBalancingPlan.reduce(
    (sum, row) => sum + row.operatorsNeeded,
    0
  );

  const surplusOperators = Math.max(0, totalPresent - totalOperatorsRequired);
  const shortageOperators = Math.max(0, totalOperatorsRequired - totalPresent);

  function calculateTarget() {
    if (totalOperators === 0) {
      setCalculatedTargetInfo(
        "No operators found. Please upload OB and Skill Matrix first."
      );
      return;
    }
    const absentPct = Math.round((totalAbsent / totalOperators) * 100);
    const suggested = Math.round(
      plannedCapacity * (totalPresent / totalOperators)
    );
    setTargetInput(suggested);
    setCalculatedTargetInfo(
      `📊 Absenteeism today: ${totalAbsent} out of ${totalOperators} operators (${absentPct}%). ` +
        `Adjusted target: ${suggested} pieces/day (down from planned ${plannedCapacity}). ` +
        `Click Apply Target to confirm.`
    );
  }

  function statusClass(status) {
    if (status === "Over-Capacitated") return "bg-red-100 text-red-700";
    if (status === "Under-Capacitated") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  }

  function exportAllocation() {
    const exportData = allocationRows.map((row) => ({
      Section: row.section,
      Machine: row.machine,
      Operation: row.operation,
      Criticality: row.criticality,
      "Original Operator": row.originalOperator,
      "Assigned Substitute": row.substitute || "No match found",
      "Substitute Type": row.isPoolSubstitute ? "Skill Pool" : "Line Operator",
      Efficiency: row.efficiency ? `${row.efficiency}%` : "-",
      "Takt Time": `${row.taktTime} min`,
      "Target Efficiency Required": `${row.targetEfficiencyRequired}%`,
      Confidence: row.confidence ? `${row.confidence}%` : "-",
      Alternatives: row.alternatives
        .map((alt) => `${alt.name} (${alt.efficiency}%)`)
        .join(", "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Allocation");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(file, "smart-allocation-output.xlsx");
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        operationBulletin={operationBulletin}
        skillMatrix={skillMatrix}
        currentUser={currentUser}
      />

      <div className="bg-white rounded-3xl border p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900">
            Dynamic Target & Capacity Optimizer
          </h2>
          <p className="text-slate-500 mt-1">
            Set planned capacity, then calculate adjusted target based on
            today's attendance.
          </p>
        </div>

        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="text-sm font-semibold text-slate-600">
              Planned Capacity (Pcs/Day)
            </label>
            <input
              type="number"
              value={plannedCapacity}
              onChange={(e) => {
                setPlannedCapacity(Number(e.target.value));
                localStorage.setItem("plannedCapacity", e.target.value);
              }}
              className="block mt-2 border rounded-2xl px-4 py-3 w-44 bg-slate-50"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600">
              Target Output (Pcs/Day)
            </label>
            <input
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="block mt-2 border rounded-2xl px-4 py-3 w-44"
            />
          </div>

          <button
            onClick={calculateTarget}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold"
          >
            Calculate Target
          </button>

          <button
            onClick={applyTarget}
            className="bg-[#071b33] text-white px-6 py-3 rounded-2xl font-bold"
          >
            Apply Target
          </button>

          <span
            className={`px-5 py-3 rounded-2xl font-black ${statusClass(
              capacityPlan.capacityStatus
            )}`}
          >
            {capacityPlan.capacityStatus}
          </span>

          <button
            onClick={exportAllocation}
            className="bg-teal-600 text-white px-5 py-3 rounded-xl font-semibold"
          >
            Export Excel
          </button>
        </div>

        {calculatedTargetInfo && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800 font-medium">
            {calculatedTargetInfo}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-6">
        <MetricCard title="Applied Target" value={appliedTarget} />
        <MetricCard title="Present Operators" value={totalPresent} />
        <MetricCard title="Operators Required" value={totalOperatorsRequired} />
        <MetricCard title="Surplus Operators" value={surplusOperators} />
        <MetricCard title="Shortage Operators" value={shortageOperators} />
        <MetricCard title="Takt Time" value={`${capacityPlan.taktTime}m`} />
        <MetricCard
          title="Required Efficiency"
          value={`${targetEfficiencyRequired}%`}
        />
        <MetricCard
          title="Allocation Success"
          value={`${allocationSuccess}%`}
        />
      </div>

      <LineBalancingTable rows={lineBalancingPlan} />

      <AllocationTable rows={allocationRows} />
    </div>
  );
}

function LineBalancingTable({ rows }) {
  return (
    <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-black">
          Target-Based Line Balancing Plan
        </h2>
        <p className="text-slate-500 mt-1">
          Includes certified operators, deskilled operators, combined operations
          and split operations.
        </p>
      </div>

      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="text-left p-4">Section</th>
              <th className="text-left p-4">Machine</th>
              <th className="text-left p-4">Operation</th>
              <th className="text-left p-4">SAM</th>
              <th className="text-left p-4">Takt Time</th>
              <th className="text-left p-4">Operators Needed</th>
              <th className="text-left p-4">Recommended Operators</th>
              <th className="text-left p-4">Combined With</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t hover:bg-slate-50">
                <td className="p-4">{row.section}</td>
                <td className="p-4">{row.machine}</td>
                <td className="p-4 font-bold">{row.operation}</td>
                <td className="p-4">{row.sam}</td>
                <td className="p-4">{row.taktTime} min</td>
                <td className="p-4 font-black">{row.operatorsNeeded}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {row.assignedOperators.map((op) => (
                      <span
                        key={op.id}
                        className={`px-3 py-1 rounded-full ${
                          op.allocationType === "Certified"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {op.name} · {op.efficiency}% · {op.allocationType}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  {row.combinedWith ? (
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      {row.combinedWith}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full font-bold ${
                      row.status === "Split Operation"
                        ? "bg-red-100 text-red-700"
                        : row.status === "Can Combine / Multi-machine"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;