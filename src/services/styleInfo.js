export function getStyleInfo(operationBulletin, skillMatrix) {
  const operators = new Set(
    operationBulletin
      .map((row) => row.assignedOperatorId)
      .filter(Boolean)
  );

  const machines = new Set(
    operationBulletin
      .map((row) => row.machine)
      .filter(Boolean)
  );

  const sections = new Set(
    operationBulletin
      .map((row) => row.section)
      .filter(Boolean)
  );

  return {
    styleName: "Current Uploaded Style",
    product:
      operationBulletin.length > 0 &&
      operationBulletin[0].operation.toLowerCase().includes("fly")
        ? "Trouser"
        : "Jacket",

    line: "Auto",

    operators: operators.size,

    operations: operationBulletin.length,

    machines: machines.size,

    sections: sections.size,

    uploadTime: new Date().toLocaleString(),
  };
}