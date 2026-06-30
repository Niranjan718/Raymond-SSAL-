import { normalizeOperation } from "./helpers";

export function isSameOperation(skillOperation, obOperation) {
  const skill = normalizeOperation(skillOperation);
  const ob = normalizeOperation(obOperation);

  return skill === ob || skill.includes(ob) || ob.includes(skill);
}