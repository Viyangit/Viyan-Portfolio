/** Deterministic decorative barcode generated from a string. */
export default function Barcode({ value, className = "" }) {
  const bars = [];
  let x = 0;
  let seed = 7;
  for (const ch of value.toUpperCase()) {
    seed = (seed * 33 + ch.charCodeAt(0)) % 9973;
    for (let k = 0; k < 3; k++) {
      const w = 1 + ((seed >> (k * 2)) & 3);
      const gap = 1 + ((seed >> (k + 3)) & 1);
      bars.push({ x, w });
      x += w + gap;
    }
  }
  return (
    <svg
      className={`barcode ${className}`}
      viewBox={`0 0 ${x} 40`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height="40" />
      ))}
    </svg>
  );
}
