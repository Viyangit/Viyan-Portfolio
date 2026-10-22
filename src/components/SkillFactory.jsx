import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { SKILLS, SKILL_GROUPS } from "../data.js";
import * as F from "./factory/scene.js";
import "./factory/kit/iso.css";
import { isLite, onLite } from "../lite.js";

const GROUP_KEYS = ["ai", "code", "tools"];
const SHORT = { ai: "AI · DATA", code: "CODE", tools: "TOOLS" };
const DISPLAY_TEXT = { ai: "AI", code: "CODE", tools: "TOOLS" };

// Timing of one belt index: move one pitch, then dwell while the press stamps and the gantry reads.
const MOVE = 1.0;
const DWELL = 0.9;
const RAM_DOWN_AT = 0.28;
const RAM_UP_AT = 0.62;
const PUSH = 0.35;
const FLY = 0.45;
const HOLD_END = 4;
const ZOOM_IN = 3.2; // camera zoom on the first tile at the press; it eases out to 1 as that tile travels

/** The viewBox for a zoom about a screen point, kept inside the full drawing. */
function viewAt(zoom, [cx, cy]) {
  const w = F.WIDTH / zoom;
  const h = F.HEIGHT / zoom;
  const x = Math.max(0, Math.min(F.WIDTH - w, cx - w / 2));
  const y = Math.max(0, Math.min(F.HEIGHT - h, cy - h / 2));
  return `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));

/** Where the n-th tile in a crate rests: two columns, stacked in layers. */
function slotOf(lane, n) {
  const layer = Math.floor(n / 2);
  const col = n % 2 ? 7.5 : -7.5;
  return [F.CRATE_CENTER_X, F.LANES[lane] + col, 2 + layer * F.TILE.h];
}

/**
 * Skills, as a factory line. A press stamps each skill onto a tile, an indexing conveyor carries it
 * under a classifier that reads its group, and a transfer belt and three pushers sort it into one of
 * three crates. The figure is an Anatomy-kit isometric machine; the order of skills and their groups
 * come straight from SKILLS in data.js.
 */
export default function SkillFactory() {
  const groups = GROUP_KEYS.map((key) => ({ key, title: SKILL_GROUPS[key], skills: SKILLS.filter((s) => s.group === key) }));
  // Interleave the groups so the sorter visibly sends tiles to different crates.
  const order = useMemo(() => {
    const queues = groups.map((g) => [...g.skills]);
    const out = [];
    while (queues.some((q) => q.length)) queues.forEach((q) => q.length && out.push(q.shift()));
    return out;
  }, []);
  const layers = useMemo(() => F.staticLayers(GROUP_KEYS.map((k) => SHORT[k])), []);

  const stageRef = useRef(null);
  const [landed, setLanded] = useState(() => new Set());
  const [readout, setReadout] = useState(`0 / ${SKILLS.length} sorted`);
  const [hot, setHot] = useState(null);

  useEffect(() => {
    const svg = stageRef.current.querySelector("svg");
    const $ = (sel) => svg.querySelector(sel);
    const mainTiles = $("[data-layer='main-tiles']");
    const transTiles = $("[data-layer='trans-tiles']");
    const crateTiles = F.LANES.map((_, i) => $(`[data-layer='crate-tiles-${i}']`));
    const ram = $("[data-part='ram']");
    const lens = $("[data-part='lens']");
    const display = $("[data-part='display']");
    const pushers = F.LANES.map((_, i) => $(`[data-part='pusher-${i}']`));
    const mainSlats = $("[data-part='main-slats']");
    const transSlats = $("[data-part='trans-slats']");
    // The crate lists stay hidden while the camera is zoomed in on the first tile.
    const plate = stageRef.current.parentElement;
    const setZoomed = (on) => plate.classList.toggle("is-zoomed", on);
    const laneOf = (skill) => GROUP_KEYS.indexOf(skill.group);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const makeTile = (skill) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "fx-tile");
      g.innerHTML = F.tileSvg(skill.name);
      return g;
    };
    const place = (tile) => tile.el.setAttribute("transform", F.move([tile.x, tile.y, tile.z - F.BELT_TOP]));
    const sortLayer = (layer, tiles) => {
      const sorted = [...tiles].sort((a, b) => F.depth([a.x, a.y, a.z]) - F.depth([b.x, b.y, b.z]));
      sorted.forEach((t, i) => {
        if (layer.children[i] !== t.el) layer.insertBefore(t.el, layer.children[i] || null);
      });
    };

    let sim;
    const reset = () => {
      [mainTiles, transTiles, ...crateTiles].forEach((g) => g.replaceChildren());
      svg.setAttribute("viewBox", viewAt(ZOOM_IN, F.screen([F.SPAWN_X, 0, F.BELT_TOP + 20])));
      setZoomed(true);
      sim = { first: null, wide: false, phase: "dwell", t: 0, spawned: 0, spawnedThisDwell: false, main: [], jobs: [], crates: F.LANES.map(() => []), belt: 0, trans: 0, done: 0, end: 0, scanning: null };
      setLanded(new Set());
      setReadout(`0 / ${SKILLS.length} sorted`);
      ram.innerHTML = F.ramSvg(F.RAM_REST, false);
      lens.innerHTML = F.lensSvg(false);
      display.textContent = "READY";
      pushers.forEach((p, i) => (p.innerHTML = F.pusherSvg(F.LANES[i], F.HEAD_REST, false)));
    };

    // Reduced motion and lite mode: every tile already in its crate, nothing moving.
    const showSorted = () => {
      reset();
      svg.setAttribute("viewBox", `0 0 ${F.WIDTH} ${F.HEIGHT}`);
      setZoomed(false);
      order.forEach((skill) => {
        const lane = laneOf(skill);
        const [x, y, z] = slotOf(lane, sim.crates[lane].length);
        const tile = { skill, x, y, z, el: makeTile(skill) };
        sim.crates[lane].push(tile);
        crateTiles[lane].appendChild(tile.el);
        place(tile);
      });
      sim.crates.forEach((c, i) => sortLayer(crateTiles[i], c));
      setLanded(new Set(order.map((s) => s.name)));
      setReadout(`${SKILLS.length} / ${SKILLS.length} sorted`);
    };
    if (reduce || isLite()) {
      showSorted();
      return undefined;
    }

    reset();
    let lastRam = null;

    const startJob = (tile) => {
      const lane = laneOf(tile.skill);
      sim.jobs.push({ tile, lane, t: 0, travel: 0.15 + F.LANES[lane] / 120, slot: sim.crates[lane].length + sim.jobs.filter((j) => j.lane === lane).length, stage: "belt" });
      transTiles.appendChild(tile.el);
    };

    const step = (dt) => {
      sim.t += dt;

      // Belt: index one pitch, then dwell.
      if (sim.phase === "move") {
        const u = ease(clamp01(sim.t / MOVE));
        sim.main.forEach((tile) => (tile.x = F.SPAWN_X + (tile.station + u) * F.PITCH));
        mainSlats.setAttribute("transform", F.move([(sim.belt + u * F.PITCH) % F.SLAT_STEP, 0, 0]));
        if (sim.t >= MOVE) {
          sim.belt = (sim.belt + F.PITCH) % F.SLAT_STEP;
          sim.main.forEach((tile) => tile.station++);
          // Tiles at the end of the belt pass to the transfer belt.
          sim.main.filter((t) => t.station >= F.LAST_STATION).forEach(startJob);
          sim.main = sim.main.filter((t) => t.station < F.LAST_STATION);
          sim.phase = "dwell";
          sim.t = 0;
          sim.spawnedThisDwell = false;
          const scanned = sim.main.find((t) => t.station === F.SCAN_STATION);
          sim.scanning = scanned || null;
          if (scanned) {
            scanned.el.querySelector(".iso-solid").setAttribute("data-lit", "");
            lens.innerHTML = F.lensSvg(true);
            display.textContent = DISPLAY_TEXT[scanned.skill.group];
            setReadout(`${sim.done} / ${SKILLS.length} sorted · reading ${scanned.skill.name}`);
          }
        }
      } else {
        // Press: ram comes down, stamps a tile at the stroke's bottom, and lifts.
        let z = F.RAM_REST;
        if (sim.spawned < order.length || sim.t < RAM_UP_AT) {
          if (sim.t < RAM_DOWN_AT) z = F.RAM_REST + (F.RAM_DOWN - F.RAM_REST) * easeIn(sim.t / RAM_DOWN_AT);
          else if (sim.t < RAM_UP_AT) z = F.RAM_DOWN + (F.RAM_REST - F.RAM_DOWN) * easeOut((sim.t - RAM_DOWN_AT) / (RAM_UP_AT - RAM_DOWN_AT));
        }
        if (sim.spawned >= order.length && !sim.spawnedThisDwell) z = F.RAM_REST;
        if (sim.t >= RAM_DOWN_AT && !sim.spawnedThisDwell) {
          sim.spawnedThisDwell = true;
          if (sim.spawned < order.length) {
            const skill = order[sim.spawned++];
            const tile = { skill, station: 0, x: F.SPAWN_X, y: 0, z: F.BELT_TOP, el: makeTile(skill) };
            mainTiles.appendChild(tile.el);
            sim.main.push(tile);
            if (!sim.first) sim.first = tile;
            gsap.fromTo(tile.el, { opacity: 0 }, { opacity: 1, duration: 0.25 });
          }
        }
        const zr = Math.round(z * 4) / 4;
        if (zr !== lastRam) {
          ram.innerHTML = F.ramSvg(zr, zr < F.RAM_REST - 0.5);
          lastRam = zr;
        }
        if (sim.t >= DWELL) {
          if (sim.scanning) {
            sim.scanning.el.querySelector(".iso-solid")?.removeAttribute("data-lit");
            lens.innerHTML = F.lensSvg(false);
            sim.scanning = null;
          }
          sim.phase = "move";
          sim.t = 0;
        }
      }

      // Transfer belt, pushers and crates.
      let beltSpeed = 0;
      sim.jobs.forEach((job) => {
        job.t += dt;
        const { tile, lane } = job;
        const y = F.LANES[lane];
        const pusher = pushers[lane];
        if (job.t < job.travel) {
          const u = ease(job.t / job.travel);
          const prev = tile.y;
          tile.x = F.HANDOFF_X;
          tile.y = y * u;
          beltSpeed = Math.max(beltSpeed, tile.y - prev);
        } else if (job.t < job.travel + PUSH) {
          const u = easeOut((job.t - job.travel) / PUSH);
          tile.y = y;
          tile.x = F.HANDOFF_X + (F.HEAD_PUSH - F.HEAD_REST) * u;
          pusher.innerHTML = F.pusherSvg(y, F.HEAD_REST + (F.HEAD_PUSH - F.HEAD_REST) * u, true);
        } else if (job.t < job.travel + PUSH + FLY) {
          if (job.stage !== "fly") {
            job.stage = "fly";
            crateTiles[lane].appendChild(tile.el);
            sim.crates[lane].push(tile);
          }
          const u = (job.t - job.travel - PUSH) / FLY;
          const [sx, sy, sz] = slotOf(lane, job.slot);
          const from = F.HANDOFF_X + (F.HEAD_PUSH - F.HEAD_REST);
          tile.x = from + (sx - from) * easeOut(u);
          tile.y = y + (sy - y) * u;
          tile.z = F.BELT_TOP + (sz - F.BELT_TOP) * easeIn(u);
          pusher.innerHTML = F.pusherSvg(y, F.HEAD_PUSH - (F.HEAD_PUSH - F.HEAD_REST) * easeOut(clamp01(u * 1.4)), false);
        } else if (job.stage !== "done") {
          job.stage = "done";
          const [sx, sy, sz] = slotOf(lane, job.slot);
          Object.assign(tile, { x: sx, y: sy, z: sz });
          pusher.innerHTML = F.pusherSvg(y, F.HEAD_REST, false);
          sim.done++;
          if (tile === sim.first) {
            sim.wide = true;
            setZoomed(false);
            svg.setAttribute("viewBox", `0 0 ${F.WIDTH} ${F.HEIGHT}`);
          }
          setLanded((prev) => new Set(prev).add(tile.skill.name));
          setReadout(`${sim.done} / ${SKILLS.length} sorted · ${tile.skill.name} → ${SHORT[tile.skill.group].toLowerCase()}`);
        }
        place(tile);
      });
      sim.jobs = sim.jobs.filter((j) => j.stage !== "done");
      if (beltSpeed > 0) {
        sim.trans = (sim.trans + beltSpeed) % F.SLAT_STEP;
        transSlats.setAttribute("transform", F.move([0, sim.trans, 0]));
      }

      sim.main.forEach(place);

      // Camera: follow the first tile from the press, zooming out as it travels; once it lands, the
      // whole line is in view.
      if (!sim.wide) {
        const first = sim.first;
        let zoom = ZOOM_IN;
        let focus = F.screen([F.SPAWN_X, 0, F.BELT_TOP + 20]);
        if (first) {
          const job = sim.jobs.find((j) => j.tile === first);
          const along = job ? 1 + clamp01(job.t / (job.travel + PUSH + FLY)) * 0.25 : (first.x - F.SPAWN_X) / (F.HANDOFF_X - F.SPAWN_X);
          const u = ease(clamp01(along / 1.25));
          zoom = ZOOM_IN + (1 - ZOOM_IN) * u;
          const tilePt = F.screen([first.x, first.y, first.z]);
          const mid = [F.WIDTH / 2, F.HEIGHT / 2];
          focus = [tilePt[0] + (mid[0] - tilePt[0]) * u, tilePt[1] + (mid[1] - tilePt[1]) * u];
          if (u >= 1) sim.wide = true;
        }
        if (sim.wide) setZoomed(false);
        svg.setAttribute("viewBox", sim.wide ? `0 0 ${F.WIDTH} ${F.HEIGHT}` : viewAt(zoom, focus));
      }
      sortLayer(mainTiles, sim.main);
      sortLayer(transTiles, sim.jobs.filter((j) => j.stage === "belt").map((j) => j.tile));
      sim.crates.forEach((c, i) => sortLayer(crateTiles[i], c));

      // Finished: hold, then empty the crates and run again.
      if (sim.done === order.length) {
        sim.end += dt;
        if (!sim.announced) {
          sim.announced = true;
          display.textContent = "DONE";
          setReadout(`${SKILLS.length} / ${SKILLS.length} sorted · line complete`);
        }
        if (sim.end > HOLD_END) {
          gsap.to(crateTiles.flatMap((g) => [...g.children]), { opacity: 0, duration: 0.6, onComplete: reset });
          sim.done = -1; // wait for the fade
        }
      }
    };

    const tick = (time, deltaMs) => step(Math.min(deltaMs, 50) / 1000);
    let running = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          gsap.ticker.add(tick);
          running = true;
        } else if (!entry.isIntersecting && running) {
          gsap.ticker.remove(tick);
          running = false;
        }
      },
      { threshold: 0.15 }
    );
    io.observe(stageRef.current);
    const offLite = onLite(() => {
      io.disconnect();
      gsap.ticker.remove(tick);
      running = false;
      gsap.killTweensOf(crateTiles.flatMap((g) => [...g.children]));
      showSorted();
    });
    return () => {
      offLite();
      io.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [order]);

  // The SVG markup never changes after the first render, so React never replaces it and the live
  // parts the effect draws into it survive re-renders.
  const svgHtml = useMemo(() => [
    layers.base,
    layers.mainBelt,
    `<defs><clipPath id="fx-main-top"><path d="${F.MAIN_TOP}"/></clipPath><clipPath id="fx-trans-top"><path d="${F.TRANS_TOP}"/></clipPath></defs>`,
    `<g clip-path="url(#fx-main-top)"><g data-part="main-slats">${F.MAIN_SLATS}</g></g>`,
    `<g data-layer="main-tiles"></g>`,
    `<g data-part="ram"></g>`,
    layers.pressFront,
    `<g data-part="lens"></g>`,
    layers.gantryFront,
    `<g transform="${F.DISPLAY.transform}"><rect class="fx-display" x="0" y="1" width="${F.DISPLAY.w}" height="${F.DISPLAY.h}" rx="0.8"/><text class="fx-display-text" data-part="display" x="${F.DISPLAY.w / 2}" y="5.6" text-anchor="middle">READY</text></g>`,
    layers.transfer,
    `<g clip-path="url(#fx-trans-top)"><g data-part="trans-slats">${F.TRANS_SLATS}</g></g>`,
    layers.housings,
    F.LANES.map((_, i) => `<g data-part="pusher-${i}"></g>`).join(""),
    `<g data-layer="trans-tiles"></g>`,
    ...layers.crates.map((c, i) => `<g data-crate="${i}">${c.back}<g data-layer="crate-tiles-${i}"></g>${c.front}</g>`),
  ].join(""), [layers]);

  useEffect(() => {
    stageRef.current.querySelectorAll("[data-crate]").forEach((g) => g.classList.toggle("is-hot", Number(g.dataset.crate) === hot));
  }, [hot]);

  return (
    <section id="skills" className="fx-section" aria-labelledby="fx-title">
      <div className="fx-head">
        <p className="fx-kicker">Skills / {SKILLS.length} parts</p>
        <h2 id="fx-title" className="section-title">
          The skill factory
        </h2>
        <p className="fx-lede">
          Every skill is stamped onto a tile, read by the classifier and sorted into its crate. Hover a crate or a group to
          see what's inside.
        </p>
      </div>

      <figure className="fx-figure iso" data-theme="light">
        <div className="fx-plate">
          <div className="fx-corners" aria-hidden="true">
            <span data-corner="hint">Hover a crate</span>
            <span data-corner="readout">{readout}</span>
          </div>
          <div
            ref={stageRef}
            className="fx-stage"
            onPointerOver={(e) => {
              const c = e.target.closest?.("[data-crate]");
              setHot(c ? Number(c.dataset.crate) : null);
            }}
            onPointerLeave={() => setHot(null)}
          >
            <svg
              className="iso-svg"
              viewBox={`0 0 ${F.WIDTH} ${F.HEIGHT}`}
              role="img"
              aria-label={`A small factory line. A press stamps each of ${SKILLS.length} skills onto a tile, a conveyor carries the tiles under a classifier, and pushers sort them into three crates: ${groups.map((g) => `${g.title}, ${g.skills.length}`).join("; ")}.`}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>

        {/* Crate lists sit beside the machine, two on the left and one on the right. */}
        <div className="fx-legend">
          {groups.map((g, i) => (
            <div
              key={g.key}
              className={`fx-group ${hot === i ? "is-hot" : ""}`}
              onPointerEnter={() => setHot(i)}
              onPointerLeave={() => setHot(null)}
            >
              <p className="fx-group-title">
                <span>Crate {String(i + 1).padStart(2, "0")}</span>
                {g.title}
                <b>
                  {g.skills.filter((s) => landed.has(s.name)).length}/{g.skills.length}
                </b>
              </p>
              <ul>
                {g.skills.map((s) => (
                  <li key={s.name} className={landed.has(s.name) ? "is-in" : ""}>
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        </div>
      </figure>
    </section>
  );
}
