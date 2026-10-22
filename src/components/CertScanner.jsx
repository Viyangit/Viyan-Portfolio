import { useEffect, useRef, useState } from "react";
import { CERTIFICATES, PROFILE } from "../data.js";

const SCAN_MS = 1100;

function extraction(c) {
  return [
    ["document", "certificate"],
    ["holder", PROFILE.name],
    ["title", c.title],
    ["issuer", c.issuer],
    ["year", c.year],
  ];
}

/**
 * Certificates fed through a document-AI scanner: pick one from the tray, a scan bar passes,
 * fields get boxed, and the extracted record types out beside it.
 */
export default function CertScanner() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle → scanning → done
  const [typed, setTyped] = useState(0);
  const rootRef = useRef(null);
  const seen = useRef(false);
  const reduce = useRef(false);

  const fields = extraction(CERTIFICATES[idx]);
  const fullText = fields.map(([k, v]) => `"${k}": "${v}"`);
  const totalChars = fullText.reduce((a, l) => a + l.length, 0);

  const scan = (i) => {
    setIdx(i);
    if (reduce.current) {
      setPhase("done");
      setTyped(Infinity);
      return;
    }
    setPhase("scanning");
    setTyped(0);
  };

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !seen.current) {
          seen.current = true;
          scan(0);
        }
      },
      { threshold: 0.45 }
    );
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "scanning") return;
    const t = window.setTimeout(() => setPhase("done"), SCAN_MS);
    return () => window.clearTimeout(t);
  }, [phase, idx]);

  useEffect(() => {
    if (phase !== "done" || typed >= totalChars) return;
    const t = window.setTimeout(() => setTyped((n) => n + 3), 16);
    return () => window.clearTimeout(t);
  }, [phase, typed, totalChars]);

  // Reveal typed characters line by line.
  let budget = typed;
  const lines = fullText.map((l) => {
    const take = Math.max(0, Math.min(l.length, budget));
    budget -= l.length;
    return l.slice(0, take);
  });

  const c = CERTIFICATES[idx];
  const boxed = phase === "done";

  return (
    <section ref={rootRef} id="certificates" className="certs" aria-labelledby="certs-title">
      <div className="certs__head">
        <h2 id="certs-title" className="section-title">
          Certified
        </h2>
        <p>Pick a certificate and the scanner reads it the way a document model would.</p>
      </div>

      <div className="certs__layout">
        <ul className="certs__tray" aria-label="Certificates">
          {CERTIFICATES.map((cert, i) => (
            <li key={cert.title}>
              <button
                type="button"
                className={`certs__slip ${i === idx ? "is-active" : ""}`}
                aria-pressed={i === idx}
                onClick={() => scan(i)}
                data-detect={cert.issuer.toLowerCase()}
              >
                <img src={cert.logo} alt="" />
                <span>
                  <strong>{cert.title}</strong>
                  <em>
                    {cert.issuer}, {cert.year}
                  </em>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className={`certs__bed is-${phase}`}>
          <div key={idx} className="paper" aria-label={`${c.title}, ${c.issuer}, ${c.year}`}>
            <div className={`paper__field paper__field--logo ${boxed ? "is-boxed" : ""}`} data-tag="logo">
              <img src={c.logo} alt={`${c.issuer} logo`} />
            </div>
            <p className="paper__kicker">Certificate of completion</p>
            <p className="paper__small">This certifies that</p>
            <p className={`paper__field paper__holder ${boxed ? "is-boxed" : ""}`} data-tag="holder">
              {PROFILE.name}
            </p>
            <p className="paper__small">has completed</p>
            <p className={`paper__field paper__title ${boxed ? "is-boxed" : ""}`} data-tag="title">
              {c.title}
            </p>
            <div className="paper__foot">
              <p className={`paper__field ${boxed ? "is-boxed" : ""}`} data-tag="issuer">
                {c.issuer}
              </p>
              <p className={`paper__field ${boxed ? "is-boxed" : ""}`} data-tag="year">
                {c.year}
              </p>
            </div>
          </div>
          <i className="certs__bar" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
