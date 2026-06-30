import { isSameOperation } from "./allocationLogic";

export function autoAssignOperators(operationBulletin, skillMatrix) {
  if (!skillMatrix.length) return operationBulletin;

  const assignedOperatorIds = new Set();

  // First pass — collect operators already assigned from OB
  operationBulletin.forEach((row) => {
    if (row.assignedOperatorId) {
      assignedOperatorIds.add(String(row.assignedOperatorId).trim());
    }
  });

  // Second pass — fill in missing operators from skill matrix
  return operationBulletin.map((row) => {
    // Already has operator — keep it
    if (row.assignedOperatorId) return row;

    // Skip checkpoints
    if (String(row.machine).trim().toUpperCase() === "CHECK POINT") return row;

    // Find best available operator from skill matrix for this operation
    const candidates = skillMatrix
      .filter((skill) =>
        isSameOperation(skill.operation, row.operation) &&
        !assignedOperatorIds.has(String(skill.operatorId).trim())
      )
      .sort((a, b) => b.efficiency - a.efficiency);

    const best = candidates[0];

    if (best) {
      assignedOperatorIds.add(String(best.operatorId).trim());

      return {
        ...row,
        assignedOperator: best.operatorName,
        assignedOperatorRaw: `${best.operatorName}(${best.operatorId})`,
        assignedOperatorId: String(best.operatorId).trim(),
        autoAssigned: true,
      };
    }

    return row;
  });
}