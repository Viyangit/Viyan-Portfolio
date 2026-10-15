import { useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INTERNSHIPS } from "../data.js";
import Barcode from "./Barcode.jsx";

/** Internships as a chronological stack of barcodes. Scanning one (click) opens its record. */
export default function ShiftLog() {
  const [open, setOpen] = useState(null);
  const [scanning, setScanning] = useState(null);
  const jobs = [...INTERNSHIPS].sort((a, b) => a.start.localeCompare(b.start));

  // Opening a record changes page height; scroll animations further down need re-measuring.
  const remeasure = () => window.setTimeout(() => ScrollTrigger.refresh(), 600);

  const toggle = (i) => {
    if (open === i) {
      setOpen(null);
      remeasure();
      return;
    }
    setScanning(i);
    setOpen(null);
    window.setTimeout(() => {
      setScanning(null);
      setOpen(i);
      remeasure();
    }, 520);
  };

  return (
    <section id="experience" className="shiftlog" aria-labelledby="shiftlog-title">
      <div className="shiftlog__intro">
        <h2 id="shiftlog-title" className="section-title">
          Four internships, one year
        </h2>
        <p>Each one is a barcode. Scan it to read the record.</p>
      </div>

      <ol className="shiftlog__list">
        {jobs.map((job, i) => {
          const isOpen = open === i;
          return (
            <li key={job.company} className={`job ${isOpen ? "is-open" : ""} ${scanning === i ? "is-scanning" : ""}`}>
              <button
                type="button"
                className="job__scan"
                aria-expanded={isOpen}
                aria-controls={`job-${i}`}
                onClick={() => toggle(i)}
                data-detect={job.company.toLowerCase()}
              >
                <span className="job__dates">{job.dates}</span>
                <span className="job__company">{job.company}</span>
                <span className="job__code">
                  <Barcode value={job.company + job.start} />
                  <i className="job__laser" aria-hidden="true" />
                </span>
              </button>
              <div id={`job-${i}`} className="job__record" role="region" aria-label={`${job.company} details`}>
                <div className="job__record-inner">
                  <p className="job__role">{job.role}</p>
                  <p className="job__desc">{job.desc}</p>
                  <ul className="chips" aria-label="Stack">
                    {job.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
