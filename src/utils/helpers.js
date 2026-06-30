export function cleanOperatorName(value) {
  return String(value || "")
    .replace(/\(.*?\)/g, "")
    .trim()
    .toLowerCase();
}

export function displayOperatorName(value) {
  return String(value || "").replace(/\(.*?\)/g, "").trim();
}

export function extractOperatorId(value) {
  const match = String(value || "").match(/\((.*?)\)/);
  return match ? match[1].trim() : "";
}

export function normalizeOperation(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\(#?\d+\)/g, "")
    .replace(/#\d+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}