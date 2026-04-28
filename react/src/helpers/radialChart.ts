/* ── geometry helpers ────────────────────────────────────────── */

export const ptc = (cx: number, cy: number, r: number, a: number): [number, number] => [
  cx + r * Math.cos(a),
  cy + r * Math.sin(a),
];

export const arcPath = (
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  a1: number,
  a2: number
): string => {
  if (Math.abs(a2 - a1) < 0.0005 || r1 >= r2) return "";
  const large = a2 - a1 > Math.PI ? 1 : 0;
  const [x1, y1] = ptc(cx, cy, r1, a1),
    [x2, y2] = ptc(cx, cy, r2, a1);
  const [x3, y3] = ptc(cx, cy, r2, a2),
    [x4, y4] = ptc(cx, cy, r1, a2);
  return `M${x1},${y1}L${x2},${y2}A${r2},${r2},0,${large},1,${x3},${y3}L${x4},${y4}A${r1},${r1},0,${large},0,${x1},${y1}Z`;
};
