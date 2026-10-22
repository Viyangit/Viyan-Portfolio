/**
 * Lite mode for weak devices: no smooth scrolling, a still projects ring, a factory shown already
 * sorted and a still marquee. The rest of the site stays the same.
 *
 * It switches on at once when the device says it is weak (2 GB of memory or less, 2 cores or
 * fewer, or data saver on). Otherwise a short frame-rate check runs once the page has settled; if
 * frames are slow, lite mode switches on for the rest of the visit and is remembered for the next.
 * `?lite=1` or `?lite=0` in the address forces it either way, for testing.
 */
const KEY = "vm-lite";
const root = document.documentElement;

export const isLite = () => root.classList.contains("lite");

/** Runs `fn` when lite mode is on: now if it already is, or when it switches on. Returns a cleanup. */
export function onLite(fn) {
  if (isLite()) {
    fn();
    return () => {};
  }
  window.addEventListener("lite-mode", fn, { once: true });
  return () => window.removeEventListener("lite-mode", fn);
}

function enable(reason, remember = false) {
  if (isLite()) return;
  root.classList.add("lite");
  root.dataset.liteReason = reason;
  if (remember) try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* storage can be unavailable; lite mode still applies for this visit */
  }
  window.dispatchEvent(new Event("lite-mode"));
}

/** Measures frame times for about a second and a half; slow frames mean a weak device. */
function probe() {
  const times = [];
  let last = 0;
  let abandoned = false;
  // A hidden tab pauses frames, which would read as a slow device: give up instead.
  const hide = () => (abandoned = true);
  document.addEventListener("visibilitychange", hide, { once: true });
  const step = (t) => {
    if (abandoned) return;
    if (last) times.push(t - last);
    last = t;
    if (times.length < 90) requestAnimationFrame(step);
    else {
      document.removeEventListener("visibilitychange", hide);
      if (document.hidden) return;
      times.sort((a, b) => a - b);
      const median = times[times.length >> 1];
      const slow = times[Math.floor(times.length * 0.9)];
      // Under ~36 fps typically, or frequent long frames: the animations won't feel smooth.
      if (median > 28 || slow > 50) enable("frame-rate", true);
    }
  };
  requestAnimationFrame(step);
}

export function initLite() {
  const forced = new URLSearchParams(location.search).get("lite");
  if (forced === "0") {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  if (forced === "1") return enable("forced");

  let remembered = null;
  try {
    remembered = localStorage.getItem(KEY);
  } catch {
    /* ignore */
  }
  if (remembered === "1") return enable("remembered");

  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const saveData = navigator.connection?.saveData;
  if (saveData || (memory && memory <= 2) || (cores && cores <= 2)) return enable("device");

  // Check the frame rate once loading has settled and the page is on screen.
  const start = () => setTimeout(() => !document.hidden && probe(), 2500);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
