/**
 * Reduce a JSON value to its structural shape — keys + value types, no literal values.
 * Used with Jest snapshot tests so the contract gate triggers when fields are
 * added/removed/retyped, but tolerates timestamps, UUIDs, tokens, etc. drifting.
 *
 * Examples:
 *   keyShape({ id: "abc", n: 5, tags: ["x"] })
 *   // -> { id: "string", n: "number", tags: ["string"] }
 *
 *   keyShape({ user: { id: "abc", roles: ["a", "b"] }, ok: true })
 *   // -> { user: { id: "string", roles: ["string"] }, ok: "boolean" }
 *
 * Arrays collapse to a one-element shape (the merged shape of all elements) so
 * pagination size changes don't pollute the snapshot. An empty array stays empty.
 *
 * Object keys are sorted so the snapshot is stable regardless of property order.
 */
export function keyShape(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    return [mergeShapes(value.map(keyShape))];
  }
  if (typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = keyShape(value[key]);
    }
    return out;
  }
  return typeof value;
}

/**
 * Combine the shapes of every array element into a single shape, so a list of 50
 * notifications snapshots as one notification-shape, not 50 copies.
 *
 * If element shapes diverge (e.g. one has `extraField`, others don't), the union
 * is preserved as an object with all keys present — that's intentional: the
 * snapshot then warns that the element type is polymorphic.
 */
function mergeShapes(shapes) {
  if (!shapes.length) return null;

  // All same primitive? Done.
  const first = shapes[0];
  const allEqual = shapes.every(
    (s) => JSON.stringify(s) === JSON.stringify(first)
  );
  if (allEqual) return first;

  // Mixed objects — union their keys.
  if (shapes.every((s) => s && typeof s === "object" && !Array.isArray(s))) {
    const out = {};
    const keys = new Set();
    for (const s of shapes) for (const k of Object.keys(s)) keys.add(k);
    for (const k of [...keys].sort()) {
      const variants = shapes.map((s) => s[k]).filter((v) => v !== undefined);
      out[k] = mergeShapes(variants);
    }
    return out;
  }

  // Mixed primitives / mixed object-and-primitive — surface the polymorphism.
  return [...new Set(shapes.map((s) => JSON.stringify(s)))].join("|");
}
