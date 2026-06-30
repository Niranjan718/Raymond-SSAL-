function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\(#?\d+\)/g, "")
    .replace(/#\d+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function isSimilarOperation(skillOperation, targetOperation) {
  const skill = normalize(skillOperation);
  const target = normalize(targetOperation);

  if (!skill || !target) return false;

  return (
    skill === target ||
    skill.includes(target) ||
    target.includes(skill) ||
    skill.slice(0, 5) === target.slice(0, 5)
  );
}

function getOperatorPool(skillMatrix, attendance) {
  const map = {};

  skillMatrix.forEach((skill) => {
    if (!map[skill.operatorId]) {
      map[skill.operatorId] = {
        operatorId: skill.operatorId,
        operatorName: skill.operatorName,
        grade: skill.grade,
        skills: [],
      };
    }

    map[skill.operatorId].skills.push(skill);
  });

  return Object.values(map).filter(
    (op) => attendance[op.operatorId] !== "Absent"
  );
}

function getBestOperatorsForOperation({
  operation,
  operators,
  usedOperators,
  operatorsNeeded,
}) {
  const candidates = operators
    .map((operator) => {
      const exactSkill = operator.skills.find((skill) =>
        isSimilarOperation(skill.operation, operation.operation)
      );

      const avgEfficiency =
        operator.skills.reduce((sum, s) => sum + s.efficiency, 0) /
        operator.skills.length;

      let score = 0;
      let allocationType = "Deskilled / Trainable";

      if (exactSkill) {
        score += exactSkill.efficiency + 40;
        allocationType = "Certified";
      } else {
        score += avgEfficiency * 0.55;
      }

      if (operator.skills.length >= 5) score += 15;
      else if (operator.skills.length >= 3) score += 10;
      else score += 5;

      if (String(operator.grade || "").toUpperCase().includes("A")) score += 10;
      if (usedOperators.has(operator.operatorId)) score -= 100;

      return {
        operatorId: operator.operatorId,
        operatorName: operator.operatorName,
        grade: operator.grade,
        efficiency: exactSkill ? exactSkill.efficiency : Math.round(avgEfficiency),
        score: Math.round(score),
        allocationType,
      };
    })
    .sort((a, b) => b.score - a.score);

  return candidates.slice(0, operatorsNeeded);
}

export function getLineBalancingPlan({
  targetOutput,
  operationBulletin,
  skillMatrix,
  attendance,
}) {
  const shiftMinutes = 480;
  const taktTime = shiftMinutes / targetOutput;

  const operators = getOperatorPool(skillMatrix, attendance);
  const usedOperators = new Set();

  const lowTargetMode = targetOutput <= 300;
  const highTargetMode = targetOutput >= 600;

  const plan = [];

  for (let i = 0; i < operationBulletin.length; i++) {
    const operation = operationBulletin[i];
    const sam = Number(operation.sam) || 0.5;

    let operatorsNeeded = Math.max(1, Math.ceil(sam / taktTime));

    if (lowTargetMode && operation.criticality !== "Critical") {
      operatorsNeeded = 1;
    }

    if (highTargetMode && operation.criticality === "Critical") {
      operatorsNeeded = Math.max(2, operatorsNeeded);
    }

    const selectedOperators = getBestOperatorsForOperation({
      operation,
      operators,
      usedOperators,
      operatorsNeeded,
    });

    selectedOperators.forEach((op) => {
      usedOperators.add(op.operatorId);
    });

    let status = "Balanced";

    if (lowTargetMode && operation.criticality !== "Critical") {
      status = "Can Combine / Multi-machine";
    }

    if (highTargetMode && operation.criticality === "Critical") {
      status = "Split Operation";
    }

    const nextOperation = operationBulletin[i + 1];

    plan.push({
      section: operation.section,
      machine: operation.machine,
      operation: operation.operation,
      criticality: operation.criticality,
      sam,
      taktTime: taktTime.toFixed(2),
      operatorsNeeded,
      assignedOperators: selectedOperators.map((op) => ({
        id: op.operatorId,
        name: op.operatorName,
        efficiency: op.efficiency,
        score: op.score,
        allocationType: op.allocationType,
      })),
      combinedWith:
        lowTargetMode &&
        nextOperation &&
        operation.criticality !== "Critical" &&
        nextOperation.criticality !== "Critical"
          ? nextOperation.operation
          : "",
      status,
    });
  }

  const surplusOperators = operators.filter(
    (op) => !usedOperators.has(op.operatorId)
  );

  return plan.map((row) => ({
    ...row,
    surplusOperators,
  }));
}