import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getAllocationRows } from "../services/allocationEngine";

function Reports({ skillMatrix, operationBulletin, attendance, operatorAssignments }) {
  const allocationRows = getAllocationRows({
    skillMatrix,
    operationBulletin,
    attendance,
    operatorAssignments,
  });

  function downloadExcel(data, fileName, sheetName) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(file, fileName);
  }

  function exportAllocationReport() {
    const data = allocationRows.map((row) => ({
      Section: row.section,
      Machine: row.machine,
      Operation: row.operation,
      Criticality: row.criticality,
      "Original Operator": row.originalOperator,
      "Assigned Substitute": row.substitute || "No match found",
      Efficiency: row.efficiency ? `${row.efficiency}%` : "-",
      Confidence: row.confidence ? `${row.confidence}%` : "-",
    }));

    downloadExcel(data, "allocation-report.xlsx", "Allocation Report");
  }

  function exportSkillMatrixReport() {
    const data = skillMatrix.map((row) => ({
      "Operator ID": row.operatorId,
      "Operator Name": row.operatorName,
      Grade: row.grade,
      Operation: row.operation,
      Efficiency: row.efficiency,
    }));

    downloadExcel(data, "skill-matrix-report.xlsx", "Skill Matrix");
  }

  function exportOBReport() {
    const data = operationBulletin.map((row) => ({
      Section: row.section,
      "SL No": row.slNo,
      Operation: row.operation,
      Machine: row.machine,
      SAM: row.sam,
      Criticality: row.criticality,
      "Assigned Operator": row.assignedOperatorRaw,
    }));

    downloadExcel(data, "operation-bulletin-report.xlsx", "OB Report");
  }

  function exportAttendanceReport() {
    const data = operationBulletin
      .filter((row) => row.assignedOperatorId)
      .map((row) => ({
        "Operator ID": row.assignedOperatorId,
        "Operator Name": row.assignedOperatorRaw,
        Section: row.section,
        Machine: row.machine,
        Operation: row.operation,
        Attendance: attendance[row.assignedOperatorId] || "Present",
      }));

    downloadExcel(data, "attendance-report.xlsx", "Attendance");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8">
        <h1 className="text-3xl font-bold text-slate-900">Reports Center</h1>
        <p className="text-slate-500 mt-2">
          Export allocation, attendance, skill matrix and OB reports.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ReportCard
          title="Daily Allocation Report"
          desc="Export substitute allocation results with confidence scores."
          onClick={exportAllocationReport}
        />

        <ReportCard
          title="Attendance Report"
          desc="Export present and absent status for assigned OB operators."
          onClick={exportAttendanceReport}
        />

        <ReportCard
          title="Skill Matrix Report"
          desc="Export uploaded operator skills and efficiencies."
          onClick={exportSkillMatrixReport}
        />

        <ReportCard
          title="Operation Bulletin Report"
          desc="Export uploaded OB operations, machines and assigned operators."
          onClick={exportOBReport}
        />
      </div>
    </div>
  );
}

function ReportCard({ title, desc, onClick }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="text-slate-500 mt-2 mb-6">{desc}</p>

      <button
        onClick={onClick}
        className="bg-teal-600 text-white px-5 py-3 rounded-xl font-semibold"
      >
        Export Excel
      </button>
    </div>
  );
}

export default Reports;