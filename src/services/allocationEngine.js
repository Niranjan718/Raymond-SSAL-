import { isSameOperation } from "../utils/allocationLogic";

function gradeScore(grade) {
  const value = String(grade || "").toUpperCase();
  if (value.includes("A+")) return 10;
  if (value.includes("A")) return 8;
  if (value.includes("B")) return 6;
  if (value.includes("C")) return 4;
  if (value.includes("D")) return 2;
  return 0;
}

export function getAllocationRows({
  skillMatrix,
  operationBulletin,
  attendance,
  operatorAssignments,
  skillPool = [],
  skillPoolAttendance = {},
}) {
  const usedSubstitutes = new Set();

  // Convert skill pool operators to skill matrix format for candidate search
  const poolSkillEntries = skillPool.flatMap((op) =>
    op.skills.map((skill) => ({
      operatorId: op.operatorId,
      operatorName: op.operatorName,
      grade: op.grade,
      operation: skill.operation,
      efficiency: skill.efficiency,
      operatorNameKey: op.operatorName.toLowerCase(),
      isPoolOperator: true,
    }))
  );

  // Combined matrix: regular operators + skill pool operators
  const combinedSkillMatrix = [...skillMatrix, ...poolSkillEntries];

  // Critical operators — locked to their station, cannot substitute
  const criticalOperatorIds = new Set(
    operationBulletin
      .filter((ob) => ob.criticality === "Critical" && ob.assignedOperatorId)
      .map((ob) => String(ob.assignedOperatorId).trim())
  );

  function getCurrentJob(operatorId) {
    if (!operatorId) return null;
    const row = operationBulletin.find(
      (ob) => String(ob.assignedOperatorId).trim() === String(operatorId).trim()
    );
    return row ? row.operation : null;
  }

  function getCandidateScore(skill, operation, ob) {
    let score = 0;
    score += skill.efficiency * 0.45;
    if (isSameOperation(skill.operation, operation)) score += 25;
    if (ob?.machine && String(skill.operation).toLowerCase().includes(
      String(operation).toLowerCase().split(" ")[0]
    )) score += 5;
    score += gradeScore(skill.grade);

    const skillCount = combinedSkillMatrix.filter(
      (item) => item.operatorId === skill.operatorId
    ).length;
    if (skillCount >= 5) score += 10;
    else if (skillCount >= 3) score += 6;
    else score += 3;

    // Bonus for pool operators — they're specifically available for substitution
    if (skill.isPoolOperator) score += 8;

    return Math.round(score);
  }

  function findBestSubstitute(operation, absentOperatorId, ob) {
    const candidates = combinedSkillMatrix
      .filter((skill) => {
        const sameOperation = isSameOperation(skill.operation, operation);
        const notSameOperator =
          String(skill.operatorId).trim() !== String(absentOperatorId).trim();

        // Check attendance — pool operators use skillPoolAttendance, others use attendance
        const notAbsent = skill.isPoolOperator
          ? skillPoolAttendance[skill.operatorId] !== "Absent"
          : attendance[skill.operatorId] !== "Absent";

        const notAlreadyUsed = !usedSubstitutes.has(
          String(skill.operatorId).trim()
        );

        // Critical operators cannot substitute (only for non-pool operators)
        const notCriticalOperator = skill.isPoolOperator
          ? true
          : !criticalOperatorIds.has(String(skill.operatorId).trim());

        return (
          sameOperation &&
          notSameOperator &&
          notAbsent &&
          notAlreadyUsed &&
          notCriticalOperator
        );
      })
      .map((skill) => ({
        ...skill,
        score: getCandidateScore(skill, operation, ob),
      }))
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (best) {
      usedSubstitutes.add(String(best.operatorId).trim());
    }

    return {
      best,
      alternatives: candidates.slice(1, 3),
    };
  }

  const absentIds = Object.keys(attendance).filter(
    (id) => attendance[id] === "Absent"
  );

  return absentIds
    .map((operatorId) => {
      const operation = operatorAssignments[operatorId];
      if (!operation) return null;

      const ob = operationBulletin.find(
        (row) =>
          String(row.assignedOperatorId).trim() === String(operatorId).trim() &&
          String(row.operation).trim() === String(operation).trim()
      );

      const result = findBestSubstitute(operation, operatorId, ob);

      return {
        section: ob?.section || "-",
        machine: ob?.machine || "-",
        operation,
        criticality: ob?.criticality || "Easy",
        originalOperator: ob?.assignedOperatorRaw || operatorId,
        substitute: result.best?.operatorName,
        substituteCurrentJob: result.best
          ? (result.best.isPoolOperator ? "🔵 Skill Pool" : getCurrentJob(result.best.operatorId))
          : null,
        efficiency: result.best?.efficiency,
        confidence: result.best?.score,
        isPoolSubstitute: result.best?.isPoolOperator || false,
        reason: result.best
          ? [
              "Certified for operation",
              "Available today",
              "Highest weighted score",
              "Not already allocated",
              result.best.isPoolOperator ? "Skill Pool operator" : "Not on critical operation",
            ]
          : [],
        alternatives: result.alternatives.map((alt) => ({
          name: alt.operatorName,
          efficiency: alt.efficiency,
          confidence: alt.score,
          currentJob: alt.isPoolOperator ? "🔵 Skill Pool" : getCurrentJob(alt.operatorId),
          isPool: alt.isPoolOperator || false,
        })),
      };
    })
    .filter(Boolean);
}