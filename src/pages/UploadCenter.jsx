import { useState } from "react";
import {
  readExcelFile,
  parseSkillMatrix,
  parseOperationBulletin,
} from "../utils/excelParser";
import { STORAGE_KEYS } from "../utils/constants";

function notify(message) {
  window.dispatchEvent(new CustomEvent("app-notify", { detail: { message } }));
}

function UploadCenter({
  setSkillMatrix,
  setOperationBulletin,
  operationBulletin,
  criticalityMap,
  setCriticalityMap,
  skillPool,
  setSkillPool,
}) {
  const [styleName, setStyleName] = useState(
    localStorage.getItem("currentStyle") || ""
  );
  const [localCriticality, setLocalCriticality] = useState(() => {
    const saved = localStorage.getItem("criticalityMap");
    return saved ? JSON.parse(saved) : {};
  });
  const [criticalitySearch, setCriticalitySearch] = useState("");
  const [newPoolOp, setNewPoolOp] = useState({
    operatorId: "", operatorName: "", grade: "B",
  });
  const [selectedPoolOpIdx, setSelectedPoolOpIdx] = useState(null);
  const [newSkill, setNewSkill] = useState({ operation: "", efficiency: 80 });

  const savedSkill = localStorage.getItem(STORAGE_KEYS.SKILL_MATRIX);
  const savedOB = localStorage.getItem(STORAGE_KEYS.OPERATION_BULLETIN);
  const skillCount = savedSkill ? JSON.parse(savedSkill).length : 0;
  const obCount = savedOB ? JSON.parse(savedOB).length : 0;

  function handleSkillMatrixUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    readExcelFile(file, (rows) => {
      const parsed = parseSkillMatrix(rows);
      setSkillMatrix(parsed);
      localStorage.setItem(STORAGE_KEYS.SKILL_MATRIX, JSON.stringify(parsed));
      notify(`Skill Matrix uploaded successfully. ${parsed.length} records loaded.`);
    });
  }

  function handleOBUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    readExcelFile(file, (rows) => {
      const parsed = parseOperationBulletin(rows);
      setOperationBulletin(parsed);
      localStorage.setItem(STORAGE_KEYS.OPERATION_BULLETIN, JSON.stringify(parsed));
      notify(`Operation Bulletin uploaded successfully. ${parsed.length} operations loaded.`);
    });
  }

  function handleStyleLoad() {
    if (!styleName.trim()) { alert("Please enter a style name."); return; }
    localStorage.setItem("currentStyle", styleName);
    notify(`Style "${styleName}" loaded successfully.`);
  }

  function clearUploadedData() {
    localStorage.removeItem(STORAGE_KEYS.SKILL_MATRIX);
    localStorage.removeItem(STORAGE_KEYS.OPERATION_BULLETIN);
    setSkillMatrix([]);
    setOperationBulletin([]);
    notify("Uploaded data cleared.");
  }

  function handleCriticalityChange(operation, value) {
    setLocalCriticality((prev) => ({ ...prev, [operation]: value }));
  }

  function saveCriticality() {
    localStorage.setItem("criticalityMap", JSON.stringify(localCriticality));
    setCriticalityMap(localCriticality);
    notify("Criticality settings saved successfully.");
  }

  function clearCriticality() {
    setLocalCriticality({});
    localStorage.removeItem("criticalityMap");
    setCriticalityMap({});
    notify("Criticality settings cleared.");
  }

  function autoDetectSkillPool() {
    const saved = localStorage.getItem(STORAGE_KEYS.SKILL_MATRIX);
    if (!saved) {
      alert("Please upload Skill Matrix first.");
      return;
    }

    const skillMatrixData = JSON.parse(saved);

    // Count unique operations per operator
    const operatorMap = {};
    skillMatrixData.forEach((entry) => {
      const id = String(entry.operatorId).trim();
      if (!operatorMap[id]) {
        operatorMap[id] = {
          operatorId: id,
          operatorName: entry.operatorName,
          grade: entry.grade,
          skills: [],
        };
      }
      // Avoid duplicate operations
      const exists = operatorMap[id].skills.find(
        (s) => s.operation === entry.operation
      );
      if (!exists) {
        operatorMap[id].skills.push({
          operation: entry.operation,
          efficiency: entry.efficiency,
        });
      }
    });

    // Sort by skill count descending, take top 5
    const top5 = Object.values(operatorMap)
      .sort((a, b) => b.skills.length - a.skills.length)
      .slice(0, 5);

    setSkillPool(top5);
    localStorage.setItem("skillPool", JSON.stringify(top5));
    notify(
      `Auto-detected ${top5.length} skill pool operators: ${top5
        .map((op) => op.operatorName)
        .join(", ")}`
    );
  }

  function addPoolOperator() {
    if (!newPoolOp.operatorId.trim() || !newPoolOp.operatorName.trim()) {
      alert("Please enter both EMP ID and Operator Name.");
      return;
    }
    const exists = skillPool.find(
      (op) => op.operatorId === newPoolOp.operatorId.trim()
    );
    if (exists) { alert("Operator ID already exists in pool."); return; }

    const updated = [
      ...skillPool,
      {
        ...newPoolOp,
        operatorId: newPoolOp.operatorId.trim(),
        operatorName: newPoolOp.operatorName.trim(),
        skills: [],
      },
    ];
    setSkillPool(updated);
    localStorage.setItem("skillPool", JSON.stringify(updated));
    setNewPoolOp({ operatorId: "", operatorName: "", grade: "B" });
    notify(`Pool operator ${newPoolOp.operatorName} added to skill pool.`);
  }

  function removePoolOperator(idx) {
    const updated = skillPool.filter((_, i) => i !== idx);
    setSkillPool(updated);
    localStorage.setItem("skillPool", JSON.stringify(updated));
    if (selectedPoolOpIdx === idx) setSelectedPoolOpIdx(null);
    notify("Pool operator removed.");
  }

  function addSkillToOperator(opIdx) {
    if (!newSkill.operation) { alert("Please select an operation."); return; }
    const updated = skillPool.map((op, i) => {
      if (i !== opIdx) return op;
      const exists = op.skills.find((s) => s.operation === newSkill.operation);
      if (exists) return op;
      return { ...op, skills: [...op.skills, { ...newSkill }] };
    });
    setSkillPool(updated);
    localStorage.setItem("skillPool", JSON.stringify(updated));
    setNewSkill({ operation: "", efficiency: 80 });
  }

  function removeSkill(opIdx, skillIdx) {
    const updated = skillPool.map((op, i) => {
      if (i !== opIdx) return op;
      return { ...op, skills: op.skills.filter((_, si) => si !== skillIdx) };
    });
    setSkillPool(updated);
    localStorage.setItem("skillPool", JSON.stringify(updated));
  }

  function clearSkillPool() {
    setSkillPool([]);
    localStorage.removeItem("skillPool");
    localStorage.removeItem("skillPoolAttendance");
    notify("Skill pool cleared.");
  }

  // Unique operations from OB
  const uniqueOperations = [];
  const seen = new Set();
  operationBulletin.forEach((row) => {
    if (
      !seen.has(row.operation) &&
      String(row.machine).trim().toUpperCase() !== "CHECK POINT"
    ) {
      seen.add(row.operation);
      uniqueOperations.push({
        operation: row.operation,
        machine: row.machine,
        section: row.section,
      });
    }
  });

  const filteredOperations = uniqueOperations.filter((op) =>
    op.operation.toLowerCase().includes(criticalitySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl border p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Data Upload Center</h1>
        <p className="text-slate-500 mt-2">
          Upload Style Skill Matrix and Operation Bulletin.
        </p>
      </div>

      {/* Style */}
      <div className="bg-white rounded-2xl border p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-5">Current Style</h2>
        <input
          type="text"
          placeholder="Enter Style Name (Example: TRS247)"
          value={styleName}
          onChange={(e) => setStyleName(e.target.value)}
          className="border rounded-xl w-full p-4"
        />
        <button
          onClick={handleStyleLoad}
          className="mt-5 bg-[#001B44] text-white px-6 py-3 rounded-xl font-semibold"
        >
          Load Style
        </button>
      </div>

      {/* Upload boxes */}
      <div className="grid grid-cols-2 gap-6">
        <UploadBox
          title="Skill Matrix"
          desc="Operator skills and efficiency data"
          count={skillCount}
          onChange={handleSkillMatrixUpload}
        />
        <UploadBox
          title="Operation Bulletin"
          desc="Style operations, machines and assigned operators"
          count={obCount}
          onChange={handleOBUpload}
        />
      </div>

      <button
        onClick={clearUploadedData}
        className="bg-red-600 text-white px-5 py-3 rounded-xl font-semibold"
      >
        Clear Uploaded Data
      </button>

      {/* Criticality Settings */}
      {uniqueOperations.length > 0 && (
        <div className="bg-white rounded-2xl border p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                Operation Criticality Settings
              </h2>
              <p className="text-slate-500 mt-1">
                Manually set criticality. Critical operators will not be used as
                substitutes.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearCriticality}
                className="bg-red-600 text-white px-5 py-3 rounded-xl font-semibold"
              >
                Clear
              </button>
              <button
                onClick={saveCriticality}
                className="bg-teal-600 text-white px-5 py-3 rounded-xl font-semibold"
              >
                Save
              </button>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search operation..."
              value={criticalitySearch}
              onChange={(e) => setCriticalitySearch(e.target.value)}
              className="border rounded-xl px-4 py-3 w-full"
            />
          </div>

          <p className="text-sm text-slate-500 mb-3">
            Showing {filteredOperations.length} of {uniqueOperations.length}{" "}
            operations
          </p>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left p-4 text-slate-500">#</th>
                  <th className="text-left p-4">Section</th>
                  <th className="text-left p-4">Operation</th>
                  <th className="text-left p-4">Machine</th>
                  <th className="text-left p-4">Criticality</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperations.map((op, index) => {
                  const value = localCriticality[op.operation] || "Easy";
                  return (
                    <tr key={index} className="border-t hover:bg-slate-50">
                      <td className="p-4 text-slate-400">{index + 1}</td>
                      <td className="p-4 text-slate-600">{op.section}</td>
                      <td className="p-4 font-semibold">{op.operation}</td>
                      <td className="p-4 text-slate-600">{op.machine}</td>
                      <td className="p-4">
                        <select
                          value={value}
                          onChange={(e) =>
                            handleCriticalityChange(op.operation, e.target.value)
                          }
                          className={`border rounded-xl px-4 py-2 font-semibold cursor-pointer ${
                            value === "Critical"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : value === "Medium"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {filteredOperations.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-8 text-center text-slate-500"
                    >
                      No operations found matching "{criticalitySearch}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skill Pool Management */}
      <div className="bg-white rounded-2xl border p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Skill Pool Management</h2>
            <p className="text-slate-500 mt-1">
              Extra/helper operators who substitute when line operators are
              absent. Click Auto-Detect to pick top 5 most skilled operators
              from your Skill Matrix automatically.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={autoDetectSkillPool}
              className="bg-[#001B44] text-white px-5 py-3 rounded-xl font-semibold"
            >
              Auto-Detect Top 5
            </button>
            {skillPool.length > 0 && (
              <button
                onClick={clearSkillPool}
                className="bg-red-600 text-white px-5 py-3 rounded-xl font-semibold"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Manual Add Operator Form */}
        <div className="bg-slate-50 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-slate-700 mb-3">
            Add Pool Operator Manually
          </h3>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="EMP ID (e.g. SP001)"
              value={newPoolOp.operatorId}
              onChange={(e) =>
                setNewPoolOp((prev) => ({
                  ...prev,
                  operatorId: e.target.value,
                }))
              }
              className="border rounded-xl px-4 py-2 w-36"
            />
            <input
              type="text"
              placeholder="Operator Name"
              value={newPoolOp.operatorName}
              onChange={(e) =>
                setNewPoolOp((prev) => ({
                  ...prev,
                  operatorName: e.target.value,
                }))
              }
              className="border rounded-xl px-4 py-2 flex-1 min-w-48"
            />
            <select
              value={newPoolOp.grade}
              onChange={(e) =>
                setNewPoolOp((prev) => ({ ...prev, grade: e.target.value }))
              }
              className="border rounded-xl px-4 py-2"
            >
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
            <button
              onClick={addPoolOperator}
              className="bg-teal-600 text-white px-5 py-2 rounded-xl font-semibold"
            >
              Add Operator
            </button>
          </div>
        </div>

        {/* Pool Operators List */}
        {skillPool.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8 border rounded-xl">
            No pool operators added yet. Click "Auto-Detect Top 5" or add
            manually above.
          </p>
        ) : (
          <div className="space-y-3">
            {skillPool.map((op, opIdx) => (
              <div
                key={op.operatorId}
                className="border rounded-xl overflow-hidden"
              >
                {/* Operator header */}
                <div className="flex items-center justify-between p-4 bg-slate-50">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-slate-800">
                      {op.operatorName}
                    </span>
                    <span className="text-sm text-slate-500">
                      ID: {op.operatorId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        op.grade === "A+"
                          ? "bg-emerald-100 text-emerald-700"
                          : op.grade === "A"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {op.grade}
                    </span>
                    <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                      {op.skills.length} skill(s)
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setSelectedPoolOpIdx(
                          selectedPoolOpIdx === opIdx ? null : opIdx
                        )
                      }
                      className="text-sm text-blue-600 font-semibold hover:underline"
                    >
                      {selectedPoolOpIdx === opIdx ? "Close" : "Add Skills"}
                    </button>
                    <button
                      onClick={() => removePoolOperator(opIdx)}
                      className="text-sm text-red-600 font-semibold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Skills list */}
                {op.skills.length > 0 && (
                  <div className="px-4 py-3 flex flex-wrap gap-2 border-t bg-white">
                    {op.skills.map((skill, skillIdx) => (
                      <div
                        key={skillIdx}
                        className="flex items-center gap-1 bg-teal-50 border border-teal-200 rounded-full px-3 py-1 text-sm"
                      >
                        <span className="text-teal-800 font-medium">
                          {skill.operation}
                        </span>
                        <span className="text-teal-600">
                          · {skill.efficiency}%
                        </span>
                        <button
                          onClick={() => removeSkill(opIdx, skillIdx)}
                          className="text-red-400 ml-1 hover:text-red-600 font-bold text-base leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add skill form */}
                {selectedPoolOpIdx === opIdx && (
                  <div className="px-4 pb-4 pt-3 flex gap-3 flex-wrap border-t bg-slate-50">
                    <select
                      value={newSkill.operation}
                      onChange={(e) =>
                        setNewSkill((prev) => ({
                          ...prev,
                          operation: e.target.value,
                        }))
                      }
                      className="border rounded-xl px-3 py-2 flex-1 min-w-48"
                    >
                      <option value="">Select Operation</option>
                      {uniqueOperations.map((uop, i) => (
                        <option key={i} value={uop.operation}>
                          {uop.operation}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newSkill.efficiency}
                        onChange={(e) =>
                          setNewSkill((prev) => ({
                            ...prev,
                            efficiency: Number(e.target.value),
                          }))
                        }
                        className="border rounded-xl px-3 py-2 w-24"
                        placeholder="Eff %"
                      />
                      <span className="text-slate-500 text-sm">%</span>
                    </div>
                    <button
                      onClick={() => addSkillToOperator(opIdx)}
                      className="bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
                    >
                      Add Skill
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadBox({ title, desc, count, onChange }) {
  return (
    <div className="bg-white rounded-2xl border p-8 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-slate-500 mt-2">{desc}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            count > 0
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {count > 0 ? "Uploaded" : "Pending"}
        </span>
      </div>
      <div className="mt-6 bg-slate-50 rounded-xl p-5">
        <p className="text-slate-500">Records Loaded</p>
        <h3 className="text-4xl font-bold mt-2">{count}</h3>
      </div>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={onChange}
        className="block w-full border rounded-lg p-3 mt-6"
      />
    </div>
  );
}

export default UploadCenter;