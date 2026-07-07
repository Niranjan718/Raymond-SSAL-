import * as XLSX from "xlsx";
import { cleanOperatorName, extractOperatorId } from "./helpers";
import { CRITICALITY } from "./constants";

export function readExcelFile(file, callback) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const workbook = XLSX.read(e.target.result, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    callback(rows);
  };

  reader.readAsArrayBuffer(file);
}

// ─── Format detector ────────────────────────────────────────────────────────
function detectSkillMatrixFormat(rows) {
  // Format A: rows[4] contains "EMP ID" or "OPERATOR NAME" (original complex format)
  if (rows[4] && rows[4].some(cell =>
    String(cell).trim().toUpperCase() === "EMP ID" ||
    String(cell).trim().toUpperCase() === "OPERATOR NAME"
  )) {
    return "A";
  }
  // Format B: simple wide format — first non-empty row has operation names as headers
  return "B";
}

export function parseSkillMatrix(rows) {
  const format = detectSkillMatrixFormat(rows);
  if (format === "A") {
    return parseSkillMatrixFormatA(rows);
  } else {
    return parseSkillMatrixFormatB(rows);
  }
}

// ─── Format A: original complex format ──────────────────────────────────────
// Row 3 (index 2): operation names starting from col index 6+
// Row 5 (index 4): headers — EMP ID, OPERATOR NAME, GRADE
// Row 6+: data rows
function parseSkillMatrixFormatA(rows) {
  const operationRow = rows[2];
  const headerRow = rows[4];
  const dataRows = rows.slice(5);

  const empIdIndex = headerRow.findIndex(
    (cell) => String(cell).trim().toUpperCase() === "EMP ID"
  );

  const operatorNameIndex = headerRow.findIndex(
    (cell) => String(cell).trim().toUpperCase() === "OPERATOR NAME"
  );

  const gradeIndex = headerRow.findIndex(
    (cell) => String(cell).trim().toUpperCase() === "GRADE"
  );

  const parsed = [];

  dataRows.forEach((row) => {
    const operatorId = row[empIdIndex];
    const operatorName = row[operatorNameIndex];
    const grade = row[gradeIndex];

    if (!operatorId || !operatorName) return;

    operationRow.forEach((operation, index) => {
      const efficiency = row[index];

      if (
        index >= 6 &&
        operation &&
        typeof efficiency === "number" &&
        efficiency > 0
      ) {
        parsed.push({
          operatorId: String(operatorId).trim(),
          operatorName: String(operatorName).trim(),
          operatorNameKey: cleanOperatorName(operatorName),
          grade: String(grade).trim(),
          operation: String(operation).trim(),
          efficiency,
        });
      }
    });
  });

  return parsed;
}

// ─── Format B: simple wide format ───────────────────────────────────────────
// First non-empty row: "Operator Name" (col 0), optional "Grade" (col 1), then operation names
// Data rows: operator name, optional grade, then 1/0 efficiency values
function parseSkillMatrixFormatB(rows) {
  // Find first non-empty row as header
  const headerRowIndex = rows.findIndex(row =>
    row.some(cell => cell !== "" && cell !== null && cell !== undefined)
  );

  if (headerRowIndex === -1) return [];

  const headerRow = rows[headerRowIndex];

  // Detect grade column
  const gradeIndex = headerRow.findIndex(cell =>
    String(cell).trim().toUpperCase() === "GRADE"
  );

  // Operations start after operator name col (index 0) and optional grade col
  const opStartIndex = gradeIndex !== -1 ? Math.max(gradeIndex + 1, 2) : 1;

  // Get operation names from header row
  const operations = headerRow
    .slice(opStartIndex)
    .map(op => String(op || "").trim())
    .filter(op => op !== "");

  const dataRows = rows.slice(headerRowIndex + 1);
  const parsed = [];
  let empCounter = 1;

  dataRows.forEach((row) => {
    const operatorName = row[0];
    if (!operatorName || !String(operatorName).trim()) return;

    const grade = gradeIndex !== -1
      ? String(row[gradeIndex] || "B").trim()
      : "B";

    const empId = `EMP${String(empCounter++).padStart(3, "0")}`;

    operations.forEach((operation, i) => {
      const efficiency = row[opStartIndex + i];

      if (operation && typeof efficiency === "number" && efficiency > 0) {
        parsed.push({
          operatorId: empId,
          operatorName: String(operatorName).trim(),
          operatorNameKey: cleanOperatorName(operatorName),
          grade,
          operation,
          efficiency,
        });
      }
    });
  });

  return parsed;
}

// ─── Normalize header cell ───────────────────────────────────────────────────
function normalizeHeader(cell) {
  return String(cell)
    .trim()
    .toUpperCase()
    .replace(/[\n\r]+/g, " ")
    .replace(/\s+/g, " ");
}

function findColumn(headerRow, ...keywords) {
  return headerRow.findIndex((cell) => {
    const normalized = normalizeHeader(cell);
    return keywords.every((kw) => normalized.includes(kw));
  });
}

// ─── Operation Bulletin parser (unchanged) ───────────────────────────────────
export function parseOperationBulletin(rows) {
  const headerRowIndex = rows.findIndex((row) =>
    row.some((cell) =>
      normalizeHeader(cell).includes("OPERATION DESCRIPTION")
    )
  );

  if (headerRowIndex === -1) {
    alert("Could not find OB header row.");
    return [];
  }

  const headerRow = rows[headerRowIndex];
  const dataRows = rows.slice(headerRowIndex + 1);

  const slNoIndex = findColumn(headerRow, "SL");
  const operationIndex = findColumn(headerRow, "OPERATION DESCRIPTION");
  const machineIndex = findColumn(headerRow, "MACHINE", "TYPE");
  const samIndex = headerRow.findIndex((c) => {
    const n = normalizeHeader(c);
    return n === "SAM" || n === "S.A.M" || n === "S.A.M.";
  });
  const sectionIndex = findColumn(headerRow, "SEC");
  const operatorIndex = findColumn(headerRow, "OPERATOR NAME");

  const preHeaderSections = [];
  if (headerRowIndex > 0) {
    const preHeaderRow = rows[headerRowIndex - 1];
    preHeaderRow.forEach((cell) => {
      const text = String(cell).trim();
      if (
        text &&
        (text.toUpperCase().includes("SECTION") ||
          text.toUpperCase().includes("ASSEMBLY") ||
          text.toUpperCase().includes("PREPARATORY") ||
          text.toUpperCase().includes("FINISHING"))
      ) {
        if (!preHeaderSections.includes(text)) {
          preHeaderSections.push(text);
        }
      }
    });
  }

  const checkpointPositions = [];
  let realOpCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowText = row.map((c) => String(c).trim().toUpperCase());

    if (
      rowText.includes("MACHINE SUMMARY") ||
      rowText.includes("TOTAL SAM") ||
      (rowText[0] === "TOTAL" && !row[operationIndex])
    ) break;

    const slVal = String(row[slNoIndex !== -1 ? slNoIndex : 0] || "").trim();
    const opVal = String(row[operationIndex] || "").trim();

    if (slVal && !opVal && isNaN(Number(slVal))) {
      checkpointPositions.push({ index: i, name: slVal });
      continue;
    }

    if (opVal) realOpCount++;
  }

  const sectionAssignments = new Map();

  if (sectionIndex !== -1) {
    // handled row by row below
  } else if (preHeaderSections.length > 0) {
    if (
      checkpointPositions.length > 0 &&
      preHeaderSections.length >= checkpointPositions.length + 1
    ) {
      let sectionIdx = 0;
      let currentBoundary = checkpointPositions[0]?.index ?? dataRows.length;

      for (let i = 0; i < dataRows.length; i++) {
        if (i >= currentBoundary) {
          sectionIdx++;
          currentBoundary =
            checkpointPositions[sectionIdx]?.index ?? dataRows.length;
        }
        sectionAssignments.set(
          i,
          preHeaderSections[sectionIdx] ||
            preHeaderSections[preHeaderSections.length - 1]
        );
      }
    } else {
      const rowsPerSection = Math.ceil(realOpCount / preHeaderSections.length);
      let opCounter = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const opVal = String(dataRows[i][operationIndex] || "").trim();
        if (opVal) {
          const sectionIdx = Math.min(
            Math.floor(opCounter / rowsPerSection),
            preHeaderSections.length - 1
          );
          sectionAssignments.set(i, preHeaderSections[sectionIdx]);
          opCounter++;
        }
      }
    }
  }

  const parsed = [];
  let currentSection = preHeaderSections[0] || "";

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    const rowTextUpper = row.map((c) => String(c).trim().toUpperCase());
    if (
      rowTextUpper.includes("MACHINE SUMMARY") ||
      rowTextUpper.includes("TOTAL SAM") ||
      (rowTextUpper[0] === "TOTAL" && !row[operationIndex])
    ) break;

    if (sectionIndex !== -1 && row[sectionIndex]) {
      currentSection = String(row[sectionIndex]).trim();
    }

    if (sectionAssignments.has(i)) {
      currentSection = sectionAssignments.get(i);
    }

    const slText = String(row[slNoIndex !== -1 ? slNoIndex : 0] || "").trim();
    const slIsCheckpoint =
      slText.toUpperCase().includes("INSPECTION") ||
      slText.toUpperCase().includes("CHECK POINT") ||
      slText.toUpperCase().includes("CHECKING");

    const operation = row[operationIndex] || (slIsCheckpoint ? slText : "");
    if (!operation) continue;

    const opStr = String(operation).trim();

    const samRaw = row[samIndex];
    const sam = Number(samRaw);

    if (samRaw === "" || (isNaN(sam) && samRaw !== 0)) {
      if (
        isNaN(Number(row[slNoIndex !== -1 ? slNoIndex : 0])) &&
        !opStr.toUpperCase().includes("INSPECTION") &&
        !opStr.toUpperCase().includes("CHECKING")
      ) {
        currentSection = opStr;
        continue;
      }
    }

    if (samRaw !== "" && samRaw !== 0 && isNaN(sam)) continue;

    const machineVal = String(row[machineIndex] || "").trim().toUpperCase();
    const isCheckpoint =
      machineVal === "CHECK POINT" ||
      opStr.toUpperCase().includes("INSPECTION") ||
      opStr.toUpperCase() === "CHECKING" ||
      slIsCheckpoint;

    const operatorNameRaw = operatorIndex !== -1 ? row[operatorIndex] : "";
    const hasOperator =
      operatorNameRaw && String(operatorNameRaw).trim() !== "";

    parsed.push({
      section: currentSection || "GENERAL",
      slNo: row[slNoIndex],
      operation: opStr,
      machine: isCheckpoint ? "CHECK POINT" : row[machineIndex] || "",
      sam: isCheckpoint ? 0 : isNaN(sam) ? 0 : sam,
      criticality: CRITICALITY.EASY,
      assignedOperatorRaw: String(operatorNameRaw || "").trim(),
      assignedOperator: hasOperator
        ? cleanOperatorName(operatorNameRaw)
        : "No Operator",
      assignedOperatorId: hasOperator
        ? extractOperatorId(operatorNameRaw)
        : "",
      autoAssigned: false,
    });
  }

  return parsed;
}