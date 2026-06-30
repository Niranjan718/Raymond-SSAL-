export function getCapacityPlan({
  targetOutput,
  operationBulletin,
  skillMatrix,
  attendance,
}) {
  const availableShiftMinutes = 480;
  const taktTime = Number((availableShiftMinutes / targetOutput).toFixed(2));

  let capacityStatus = "Balanced";

  if (targetOutput >= 600) capacityStatus = "Over-Capacitated";
  else if (targetOutput <= 300) capacityStatus = "Under-Capacitated";

  const multiSkilledOperators = Object.values(
    skillMatrix.reduce((acc, skill) => {
      if (!acc[skill.operatorId]) {
        acc[skill.operatorId] = {
          operatorId: skill.operatorId,
          operatorName: skill.operatorName,
          skills: [],
          avgEfficiency: 0,
        };
      }

      acc[skill.operatorId].skills.push(skill.efficiency);
      return acc;
    }, {})
  )
    .map((op) => ({
      ...op,
      avgEfficiency: Math.round(
        op.skills.reduce((sum, value) => sum + value, 0) / op.skills.length
      ),
      skillCount: op.skills.length,
    }))
    .filter((op) => attendance[op.operatorId] !== "Absent")
    .sort((a, b) => b.skillCount - a.skillCount || b.avgEfficiency - a.avgEfficiency);

  const lowTargetSuggestions = [];
  const highTargetSuggestions = [];

  if (targetOutput <= 300) {
    const easyMediumOps = operationBulletin.filter(
      (op) => op.criticality === "Easy" || op.criticality === "Medium"
    );

    for (let i = 0; i < easyMediumOps.length - 1; i += 2) {
      const operator = multiSkilledOperators[i % multiSkilledOperators.length];

      if (operator) {
        lowTargetSuggestions.push({
          mode: "Combine Operations",
          operationA: easyMediumOps[i].operation,
          operationB: easyMediumOps[i + 1].operation,
          recommendedOperator: operator.operatorName,
          reason: "Low target allows multi-machine handling by a multi-skilled operator.",
        });
      }
    }
  }

  if (targetOutput >= 600) {
    const criticalOps = operationBulletin.filter(
      (op) => op.criticality === "Critical"
    );

    criticalOps.forEach((op, index) => {
      const helper = multiSkilledOperators[index % multiSkilledOperators.length];

      if (helper) {
        highTargetSuggestions.push({
          mode: "Add Helper / Split Operation",
          operation: op.operation,
          helperOperator: helper.operatorName,
          reason: "High target may create bottleneck. Add helper or duplicate workstation.",
        });
      }
    });
  }

  return {
    taktTime,
    capacityStatus,
    lowTargetSuggestions,
    highTargetSuggestions,
  };
}

export function getTargetEfficiencyRequired(targetOutput) {
  if (targetOutput >= 700) return 95;
  if (targetOutput >= 600) return 90;
  if (targetOutput >= 500) return 85;
  if (targetOutput >= 400) return 75;
  if (targetOutput >= 300) return 65;
  return 50;
}