/**
 * The skill factory, as an isometric machine built with the Anatomy kit (MIT, wheresryan22/anatomy).
 *
 * A stamping press presses each skill onto a tile at the head of an indexing conveyor. The belt
 * moves one pitch at a time; at station 5 a gantry classifier reads the tile and shows its group on
 * a small display. At the end of the belt a transfer belt carries the tile sideways to its lane, and
 * that lane's pusher shoves it into one of three crates, one per skill group.
 *
 * World units are about 1 px; x runs along the main belt, y along the transfer belt, z is up.
 * Static parts are built once here as SVG strings in painter's order; the moving parts (ram, rods,
 * pusher heads, tiles, belt slats) are rebuilt or translated by the live component each frame.
 */
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";

export const WIDTH = 920;
export const HEIGHT = 520;

// Heights.
export const BELT_TOP = 40;
const FRAME_Z = 28;
const LEG_TOP = FRAME_Z;

// Main belt along x, transfer belt along y.
const MAIN = { x: -214, y: -14, w: 334, d: 28, r: 2 };
const TRANS = { x: 121, y: -16, w: 28, d: 150, r: 2 };

// Tiles.
export const TILE = { w: 30, d: 14, h: 5 };

// Stations on the indexing belt.
export const PITCH = 40;
export const SPAWN_X = -183;
export const SCAN_STATION = 5;
export const LAST_STATION = 8;
export const SCAN_X = SPAWN_X + SCAN_STATION * PITCH; // 17
export const HANDOFF_X = SPAWN_X + LAST_STATION * PITCH; // 137

// Press.
const PRESS_X = SPAWN_X;
const CROSS_Z = 96;
export const RAM_REST = 66;
export const RAM_DOWN = BELT_TOP + TILE.h;
const RAM_H = 10;

// Lanes, pushers and crates.
export const LANES = [38, 78, 118];
const HOUSING_FRONT = 118;
export const HEAD_REST = 118.2;
export const HEAD_PUSH = 138.2;
const ROD_Z = 46;
export const CRATE_X = 156;
export const CRATE_W = 44;
export const CRATE_D = 36;
export const CRATE_WALL = 28;
export const CRATE_CENTER_X = CRATE_X + CRATE_W / 2;

// Gantry classifier.
const GANTRY_X = SCAN_X;

// Base plate under everything: L-shaped, a long arm under the main belt and a wide foot under the sorter.
const BASE = { x: -234, y: -46, w: 452, d: 198, r: 10 };
const ARM_Y = 62;
const FOOT_X = 84;
const BASE_RING = [[-234, -46], [218, -46], [218, 152], [FOOT_X, 152], [FOOT_X, ARM_Y], [-234, ARM_Y]];
const insetRing = (by) => [[-234 + by, -46 + by], [218 - by, -46 + by], [218 - by, 152 - by], [FOOT_X + by, 152 - by], [FOOT_X + by, ARM_Y - by], [-234 + by, ARM_Y - by]];
const BASE_H = 6;
const FOOT_H = 5;

export const P = k.fitProjection(
  [
    ...k.boxCorners(BASE, -BASE_H - FOOT_H, 0),
    [PRESS_X, 0, 124],
    [GANTRY_X, -30, 86],
    [GANTRY_X, 30, 86],
    ...k.boxCorners({ x: CRATE_X, y: LANES[2] - 18, w: CRATE_W, d: CRATE_D }, 0, CRATE_WALL),
  ],
  WIDTH,
  HEIGHT,
  { pad: 10, azimuth: 42 }
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const slab = (plan, z, h, steps = 4, bevel = 0.5) => k.slabOf(plan, z, h, P, steps, bevel);
const post = (x, y, r, z, h, steps = 24) => k.cylinder(x, y, r, z, h, P, steps);
export const depth = (point) => k.depthOf(point, P);
export const move = (offset) => k.translateAlong(P, offset);

/* ------------------------------------------------------------------ */
/* Static layers, painter's order                                      */
/* ------------------------------------------------------------------ */

function base() {
  const plate = k.extrude(BASE_RING, -BASE_H, BASE_H, P, { convex: false, bevel: 1.4 });
  const out = [`<path class="iso-halo" d="${k.extrude(BASE_RING, -BASE_H - FOOT_H, BASE_H, P, { convex: false }).fill}"/>`];
  for (const [x, y] of byDepth(insetRing(22))) {
    out.push(S(post(x, y, 8, -BASE_H - FOOT_H, 1.6, 28), { tone: "lo" }));
    out.push(S(post(x, y, 6, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, 28), { tone: "mid" }));
  }
  out.push(S(plate, { tone: "mid", inner: L(k.ringSeam(BASE_RING, -BASE_H / 2, P), { tone: "faint" }) }));
  out.push(L(k.onTop(insetRing(6), 0, P, true), { tone: "faint" }));
  const screws = insetRing(11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));

  // Ruler strip along the near side of the main belt, ticked every 5 with a major every pitch.
  const strip = { x: SPAWN_X - 6, y: 18, w: HANDOFF_X - SPAWN_X - 24, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(SPAWN_X, SPAWN_X + 7 * PITCH, 5, 8, strip.y + 0.6, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));

  // Label plate on the near corner of the base.
  const label = { x: -222, y: 30, w: 46, d: 22, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.8), 0.8, P), { tone: "faint" }));
  [30, 22, 26].forEach((len, i) => out.push(L(k.lineOnTop([label.x + 5, label.y + 6 + i * 4.5], [label.x + 5 + len, label.y + 6 + i * 4.5], 0.8, P), { tone: "lo", free: true })));
  out.push(D([at([label.x + 3, label.y + 3, 0.8]), at([label.x + label.w - 3, label.y + label.d - 3, 0.8])], { size: 0.45 }));
  return out.join("");
}

/** Legs under both belts and posts under the pushers, with pads, drawn back to front. */
function legs() {
  const spots = [];
  for (const x of [-196, -110, -30, 60, 108]) for (const y of [-11, 11]) spots.push({ x, y, r: 2.2, top: LEG_TOP });
  for (const y of [-6, 48, 96, 128]) for (const x of [126, 144]) spots.push({ x, y, r: 2.2, top: LEG_TOP });
  for (const y of LANES) spots.push({ x: 106, y, r: 2.6, top: 40 });
  const out = [];
  for (const s of spots.sort((a, b) => depth([a.x, a.y, 0]) - depth([b.x, b.y, 0]))) {
    out.push(S(post(s.x, s.y, s.r + 2, 0, 1.2, 20), { tone: "lo" }));
    out.push(S(post(s.x, s.y, s.r, 1.2, s.top - 1.2, 16), { tone: "mid", crease: "none" }));
    out.push(L(k.sideArc(s.x, s.y, s.r, s.top - 4, P, 12), { tone: "faint" }));
  }
  return out.join("");
}

/** The far press post and the far gantry post sit behind the belt. */
function farUprights() {
  const out = [];
  out.push(S(post(PRESS_X, -24, 6, 0, 4, 24), { tone: "mid" }));
  out.push(S(post(PRESS_X, -24, 3.6, 4, CROSS_Z - 4, 24), { tone: "mid", crease: "none" }));
  out.push(L([30, 60].map((z) => k.sideArc(PRESS_X, -24, 3.6, z, P, 14)).join(""), { tone: "faint" }));
  out.push(S(post(GANTRY_X, -24, 5, 0, 3, 24), { tone: "mid" }));
  out.push(S(post(GANTRY_X, -24, 3, 3, 74 - 3, 20), { tone: "mid", crease: "none" }));
  return out.join("");
}

/** Motor box beside the main belt, standing on the base, with a knurled speed knob and vents. */
function motor() {
  const box = { x: -134, y: 28, w: 36, d: 16, r: 2 };
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(box, 2), 0, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(box, 0, 20, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(box, 6, P, 4), { tone: "faint" }) }));
  for (let i = 0; i < 4; i++) {
    const slot = { x: box.x + 5 + i * 5.5, y: box.y + 3, w: 2.4, d: 10, r: 1.2 };
    out.push(L(k.planOutline(slot, 20, P, 4), { tone: "lo" }));
  }
  const knob = [box.x + box.w - 7, box.y + 8];
  out.push(S(post(knob[0], knob[1], 4.4, 20, 4, 28), { tone: "mid" }));
  out.push(L(k.knurl(knob[0], knob[1], 4.4, 20, 24, 28, P), { tone: "lo" }));
  out.push(L(k.lineOnTop(knob, [knob[0] + 4, knob[1]], 24, P), { tone: "hi" }));
  out.push(D([at([box.x + 2.5, box.y + 2.5, 20]), at([box.x + box.w - 2.5, box.y + box.d - 2.5, 20])], { size: 0.45 }));
  return out.join("");
}

/** Main belt frame, belt and the far roller. The slats are a separate live layer. */
function mainBelt() {
  const out = [];
  // Far end roller on its axle, showing past the frame's start.
  const roll = G.frameAlong([MAIN.x, -15.5, 35], [0, 1, 0]);
  out.push(S(G.disc(0, 31, 5.4, roll, P), { tone: "mid" }));
  out.push(S(k.slabOf(MAIN, FRAME_Z, BELT_TOP - 2 - FRAME_Z, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(MAIN, FRAME_Z + 4, P, 3), { tone: "faint" }) }));
  // Rivets along the frame's near face, every pitch.
  out.push(D(Array.from({ length: 9 }, (_, i) => at([SPAWN_X + i * PITCH, MAIN.y + MAIN.d, FRAME_Z + 2.2])), { size: 0.45, tone: "lo" }));
  out.push(S(k.slabOf(k.insetPlan(MAIN, 1.5), BELT_TOP - 2, 2, P, 3), { tone: "lo", crease: "lo" }));
  return out.join("");
}

/** Clip path (screen space) for slats on the main belt top. */
export const MAIN_TOP = k.slabOf(k.insetPlan(MAIN, 1.5), BELT_TOP - 0.01, 0.01, P, 3).top;
export const TRANS_TOP = k.slabOf(k.insetPlan(TRANS, 1.5), BELT_TOP - 0.01, 0.01, P, 3).top;

const SLAT = 8;
/** Slats across the main belt, one spacing longer than the belt so a moving copy never shows a gap. */
export const MAIN_SLATS = L(
  Array.from({ length: Math.ceil(MAIN.w / SLAT) + 2 }, (_, i) => MAIN.x - SLAT + i * SLAT)
    .map((x) => k.lineOnTop([x, MAIN.y + 1.5], [x, MAIN.y + MAIN.d - 1.5], BELT_TOP, P))
    .join(""),
  { tone: "faint" }
);
export const TRANS_SLATS = L(
  Array.from({ length: Math.ceil(TRANS.d / SLAT) + 2 }, (_, i) => TRANS.y - SLAT + i * SLAT)
    .map((y) => k.lineOnTop([TRANS.x + 1.5, y], [TRANS.x + TRANS.w - 1.5, y], BELT_TOP, P))
    .join(""),
  { tone: "faint" }
);
export const SLAT_STEP = SLAT;

function transferBelt() {
  const out = [];
  out.push(S(k.slabOf(TRANS, FRAME_Z, BELT_TOP - 2 - FRAME_Z, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(TRANS, FRAME_Z + 4, P, 3), { tone: "faint" }) }));
  out.push(D(LANES.map((y) => at([TRANS.x + TRANS.w, y, FRAME_Z + 2.2])), { size: 0.45, tone: "lo" }));
  out.push(S(k.slabOf(k.insetPlan(TRANS, 1.5), BELT_TOP - 2, 2, P, 3), { tone: "lo", crease: "lo" }));
  // End roller at the far end of the transfer belt, showing past the frame's end.
  const roll = G.frameAlong([TRANS.x - 1.5, TRANS.y + TRANS.d, 35], [1, 0, 0]);
  out.push(S(G.disc(0, TRANS.w + 3, 5.4, roll, P), { tone: "mid" }));
  return out.join("");
}

/** Pusher housings on their posts (the rod and head are live). */
function pusherHousings() {
  const out = [];
  for (const y of [...LANES].sort((a, b) => a - b)) {
    const box = { x: 94, y: y - 6, w: HOUSING_FRONT - 94, d: 12, r: 2 };
    out.push(S(k.slabOf(box, 40, 12, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(box, 44, P, 4), { tone: "faint" }) }));
    out.push(L(k.planOutline(k.insetPlan(box, 2.4), 52, P, 4), { tone: "faint" }));
    out.push(D([at([box.x + 3, box.y + 3, 52]), at([box.x + box.w - 3, box.y + box.d - 3, 52])], { size: 0.45 }));
  }
  return out.join("");
}

/** The near press post, the crosshead and its motor; the ram and rod are live and drawn before these. */
function pressFront() {
  const out = [];
  out.push(S(post(PRESS_X, 24, 6, 0, 4, 24), { tone: "mid" }));
  out.push(S(post(PRESS_X, 24, 3.6, 4, CROSS_Z - 4, 24), { tone: "mid", crease: "none" }));
  out.push(L([30, 60].map((z) => k.sideArc(PRESS_X, 24, 3.6, z, P, 14)).join(""), { tone: "faint" }));
  const head = { x: PRESS_X - 16, y: -30, w: 32, d: 60, r: 3 };
  out.push(S(k.slabOf(head, CROSS_Z, 10, P, 5, 0.8), { tone: "mid", inner: L(k.sideSeam(head, CROSS_Z + 3, P, 5), { tone: "faint" }) }));
  out.push(D([[-12, -26], [12, -26], [-12, 26], [12, 26]].map(([dx, dy]) => at([PRESS_X + dx, dy, CROSS_Z + 10])), { size: 0.5 }));
  out.push(L(k.ring(PRESS_X, -24, 5.6, CROSS_Z + 10, P, 20) + k.ring(PRESS_X, 24, 5.6, CROSS_Z + 10, P, 20), { tone: "lo" }));
  // Drive motor on top, with a knurled cap.
  out.push(S(post(PRESS_X, 0, 10, CROSS_Z + 10, 12, 48), { tone: "hi", crease: "lo", inner: L(k.sideArc(PRESS_X, 0, 10, CROSS_Z + 14, P, 30), { tone: "faint" }) }));
  out.push(S(post(PRESS_X, 0, 7, CROSS_Z + 22, 3, 40), { tone: "mid" }));
  out.push(L(k.knurl(PRESS_X, 0, 7, CROSS_Z + 22, CROSS_Z + 25, 36, P), { tone: "lo" }));
  out.push(L(k.ring(PRESS_X, 0, 2, CROSS_Z + 25, P, 12), { tone: "mid" }));
  return out.join("");
}

/** The near gantry post, the beam with its display, and the sensor head. The lens and beam are live. */
function gantryFront() {
  const out = [];
  out.push(S(post(GANTRY_X, 24, 5, 0, 3, 24), { tone: "mid" }));
  out.push(S(post(GANTRY_X, 24, 3, 3, 74 - 3, 20), { tone: "mid", crease: "none" }));
  const head = { x: GANTRY_X - 6, y: -7, w: 12, d: 14, r: 2 };
  out.push(S(k.slabOf(head, 64, 10, P, 4, 0.6), { tone: "mid" }));
  const beam = { x: GANTRY_X - 10, y: -30, w: 20, d: 60, r: 2 };
  out.push(S(k.slabOf(beam, 74, 8, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(beam, 77, P, 4), { tone: "faint" }) }));
  out.push(D([at([beam.x + 3, beam.y + 3, 82]), at([beam.x + beam.w - 3, beam.y + 3, 82]), at([beam.x + 3, beam.y + beam.d - 3, 82]), at([beam.x + beam.w - 3, beam.y + beam.d - 3, 82])], { size: 0.45 }));
  out.push(L(k.ring(GANTRY_X, -24, 4, 74, P, 16) + k.ring(GANTRY_X, 24, 4, 74, P, 16), { tone: "lo" }));
  return out.join("");
}

/** Display window on the beam's near face: the frame now; the text is live. */
export const DISPLAY = { transform: k.sideMatrix([GANTRY_X - 8, 30], 82, P, "left"), w: 16, h: 6 };

/* Crates: back (floor and the two far walls) and front (the two near walls with a label). */
function crateBack(y) {
  const plan = { x: CRATE_X, y: y - CRATE_D / 2, w: CRATE_W, d: CRATE_D, r: 2 };
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 2), 0, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(plan, 0, 2, P, 4, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: plan.x, y: plan.y, w: 2.5, d: plan.d, r: 1 }, 2, CRATE_WALL - 2, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: plan.x, y: plan.y, w: plan.w, d: 2.5, r: 1 }, 2, CRATE_WALL - 2, P, 3, 0.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 4), 2, P, 3), { tone: "faint" }));
  return out.join("");
}

function crateFront(y, name) {
  const plan = { x: CRATE_X, y: y - CRATE_D / 2, w: CRATE_W, d: CRATE_D, r: 2 };
  const near = { x: plan.x, y: plan.y + plan.d - 2.5, w: plan.w, d: 2.5, r: 1 };
  const front = { x: plan.x + plan.w - 2.5, y: plan.y, w: 2.5, d: plan.d, r: 1 };
  const out = [];
  out.push(S(k.slabOf(near, 2, CRATE_WALL - 2, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(near, 10, P, 3), { tone: "faint" }) }));
  out.push(S(k.slabOf(front, 2, CRATE_WALL - 2, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(front, 10, P, 3), { tone: "faint" }) }));
  // Hand slot on the front wall and a label plate on the near wall, with the group engraved.
  const face = k.sideMatrix([plan.x + plan.w, plan.y + plan.d - 4], CRATE_WALL - 4, P, "right");
  out.push(`<g transform="${face}"><rect class="fx-label" x="0" y="0" width="${plan.d - 8}" height="9" rx="1"/><text class="fx-label-text" x="${(plan.d - 8) / 2}" y="6.3" text-anchor="middle">${name}</text></g>`);
  const slotFace = k.sideMatrix([plan.x + 8, plan.y + plan.d], CRATE_WALL - 7, P, "left");
  out.push(`<g transform="${slotFace}"><rect class="fx-slot" x="0" y="0" width="${plan.w - 16}" height="3.4" rx="1.7"/></g>`);
  out.push(D([at([near.x + 2, near.y + 1.2, CRATE_WALL]), at([near.x + near.w - 2, near.y + 1.2, CRATE_WALL])], { size: 0.45 }));
  return out.join("");
}

/** Everything static, as named layers in painter's order. */
export function staticLayers(groupNames) {
  return {
    base: base() + legs() + motor() + farUprights(),
    mainBelt: mainBelt(),
    pressFront: pressFront(),
    gantryFront: gantryFront(),
    transfer: transferBelt(),
    housings: pusherHousings(),
    crates: LANES.map((y, i) => ({ back: crateBack(y), front: crateFront(y, groupNames[i]) })),
  };
}

/* ------------------------------------------------------------------ */
/* Live parts                                                          */
/* ------------------------------------------------------------------ */

/** A skill tile, built centred at the origin on the belt top; move it with `move([x, y, z - BELT_TOP])`. */
export function tileSvg(name) {
  const plan = { x: -TILE.w / 2, y: -TILE.d / 2, w: TILE.w, d: TILE.d, r: 1.4 };
  const top = BELT_TOP + TILE.h;
  return (
    `<path class="iso-halo fx-tile-halo" d="${k.haloOf(k.insetPlan(plan, 1), BELT_TOP, 0.1, P)}"/>` +
    S(k.slabOf(plan, BELT_TOP, TILE.h, P, 3, 0.5), { tone: "hi", crease: "lo" }) +
    L(k.planOutline(k.insetPlan(plan, 1.6), top, P, 3), { tone: "faint" }) +
    k.faceTextSvg(k.topMatrix([0, 1.6], top, P, "x"), name, { size: 3.9, tone: "hi", anchor: "middle" })
  );
}

/** The ram block and the rod from its top to the crosshead, at ram bottom height `z`. */
export function ramSvg(z, lit) {
  const plan = { x: PRESS_X - 13, y: -10, w: 26, d: 20, r: 2 };
  return (
    S(post(PRESS_X, 0, 3, z + RAM_H, CROSS_Z - z - RAM_H, 20), { tone: "mid", crease: "none" }) +
    S(k.slabOf(plan, z, RAM_H, P, 4, 0.6), { tone: "hi", crease: "lo", lit, inner: L(k.sideSeam(plan, z + 3, P, 4), { tone: "faint" }) }) +
    L(k.planOutline(k.insetPlan(plan, 2.4), z + RAM_H, P, 4), { tone: "faint" })
  );
}

/** A pusher's rod and head with the head's back face at `hx`. */
export function pusherSvg(y, hx, lit) {
  const F = G.frameAlong([HOUSING_FRONT, y, ROD_Z], [1, 0, 0]);
  const rod = hx - HOUSING_FRONT > 0.3 ? S(G.disc(0, hx - HOUSING_FRONT, 1.6, F, P, { rims: "last" }), { tone: "mid", lit }) : "";
  const head = { x: hx, y: y - 8, w: 3, d: 16, r: 1 };
  return rod + S(k.slabOf(head, 41, 10, P, 3, 0.4), { tone: "hi", crease: "lo", lit });
}

/** The sensor lens under the gantry head, and the reading light that falls on the tile below. */
export function lensSvg(on) {
  const lens = S(post(GANTRY_X, 0, 3.4, 61, 3, 24), { tone: "hi", lit: on });
  if (!on) return lens;
  const top = BELT_TOP + TILE.h + 0.1;
  const cone = [at([GANTRY_X - 2.6, 0, 61]), at([GANTRY_X + 2.6, 0, 61]), at([GANTRY_X + 12, 0, top]), at([GANTRY_X - 12, 0, top])];
  const spot = k.planOutline({ x: GANTRY_X - 12, y: -5, w: 24, d: 10, r: 5 }, top, P, 6);
  return `<path class="fx-beam" d="M${cone.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L")} Z"/><path class="fx-spot" d="${spot}"/>` + lens;
}
export const screen = (point) => k.iso(point, P);
