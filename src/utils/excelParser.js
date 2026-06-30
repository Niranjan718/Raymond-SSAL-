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

export function parseSkillMatrix(rows) {
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

// Normalize header cell — handles line breaks, extra spaces, different formats
function normalizeHeader(cell) {
  return String(cell)
    .trim()
    .toUpperCase()
    .replace(/[\n\r]+/g, " ")
    .replace(/\s+/g, " ");
}

// Find column index with flexible matching
function findColumn(headerRow, ...keywords) {
  return headerRow.findIndex((cell) => {
    const normalized = normalizeHeader(cell);
    return keywords.every((kw) => normalized.includes(kw));
  });
}

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

  // Extract section names from the row just before the header
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

  // First pass — find checkpoint row positions and count real operations
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

  // Determine section boundaries
  const sectionAssignments = new Map();

  if (sectionIndex !== -1) {
    // Old format — section column exists, handled row by row below
  } else if (preHeaderSections.length > 0) {
    if (
      checkpointPositions.length > 0 &&
      preHeaderSections.length >= checkpointPositions.length + 1
    ) {
      // Use checkpoints as boundaries between sections
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
      // No checkpoints — divide operations equally among sections
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

  // Second pass — parse operations
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

    // Update section from dedicated SEC column
    if (sectionIndex !== -1 && row[sectionIndex]) {
      currentSection = String(row[sectionIndex]).trim();
    }

    // Update section from pre-computed assignment map
    if (sectionAssignments.has(i)) {
      currentSection = sectionAssignments.get(i);
    }

    // Check if SL column has inspection/checkpoint text (new OB format)
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