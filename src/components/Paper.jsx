import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { PROFILE } from "../data.js";

const ARXIV = "https://arxiv.org/abs/1706.03762";

/**
 * "Reading" section: the first page of a paper I've read, as an annotated printout.
 * Body text is my own summary, not the paper's text. Highlights sweep in as you scroll.
 */
export default function Paper() {
  const rootRef = useRef(null);
  const sheetRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".paper-stack",
          { rotate: -7, yPercent: 14 },
          {
            rotate: -1.5,
            yPercent: -4,
            ease: "none",
            scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
        gsap.utils.toArray(".sheet mark").forEach((m) => {
          gsap.fromTo(
            m,
            { backgroundSize: "0% 100%" },
            {
              backgroundSize: "100% 100%",
              ease: "none",
              scrollTrigger: { trigger: m, start: "top 80%", end: "top 55%", scrub: true },
            }
          );
        });
        gsap.from(".sheet__note", {
          opacity: 0,
          x: 16,
          stagger: 0.12,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: { trigger: ".sheet__body", start: "top 65%", once: true },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // The sheet lifts and tilts toward the pointer, like paper picked up off a desk.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const sheet = sheetRef.current;
    const rx = gsap.quickTo(sheet, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(sheet, "rotationY", { duration: 0.6, ease: "power3.out" });
    const onMove = (e) => {
      const r = sheet.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 7);
      rx(-py * 5);
    };
    const onLeave = () => {
      rx(0);
      ry(0);
    };
    sheet.addEventListener("pointermove", onMove);
    sheet.addEventListener("pointerleave", onLeave);
    return () => {
      sheet.removeEventListener("pointermove", onMove);
      sheet.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section ref={rootRef} id="reading" className="reading" aria-labelledby="reading-title">
      <div className="reading__intro">
        <h2 id="reading-title" className="section-title">
          On my desk
        </h2>
        <p>
          The paper that every model I ship is built on. I've read it end to end; these are the ideas I keep
          coming back to.
        </p>
        <a className="reading__link" href={ARXIV} target="_blank" rel="noreferrer" data-detect="arxiv">
          Read the paper on arXiv
        </a>
      </div>

      <div className="paper-stack">
        <div className="paper-stack__under" aria-hidden="true" />
        <div className="paper-stack__under paper-stack__under--2" aria-hidden="true" />
        <article ref={sheetRef} className="sheet" data-detect="paper">
          <p className="sheet__arxiv" aria-hidden="true">
            arXiv:1706.03762 [cs.CL]
          </p>

          <header className="sheet__head">
            <h3 className="sheet__title">Attention Is All You Need</h3>
            <p className="sheet__authors">
              Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz
              Kaiser, Illia Polosukhin
            </p>
            <p className="sheet__venue">NeurIPS 2017</p>
            <p className="sheet__reader">Reader's notes: {PROFILE.name}</p>
          </header>

          <div className="sheet__body">
            <section className="sheet__abstract">
              <h4>In short</h4>
              <p>
                The paper drops recurrence and convolution entirely. A network built only from{" "}
                <mark>attention layers</mark>, the Transformer, trains in parallel across a whole sequence and set
                new state-of-the-art scores on machine translation.
              </p>
            </section>

            <section>
              <h4>1&nbsp;&nbsp;Scaled dot-product attention</h4>
              <p>
                Every token produces a query, a key and a value. Queries are compared with all keys, the scores
                pass through a softmax, and the result weights the values.
              </p>
              <p className="sheet__eq" aria-label="Attention of Q, K, V equals softmax of Q K transpose over root d k, times V">
                Attention(Q, K, V) = softmax(QK<sup>T</sup> / √d<sub>k</sub>) V
              </p>
              <p>
                Dividing by <mark>√d<sub>k</sub></mark> keeps large dot products from pushing the softmax into
                regions with tiny gradients.
              </p>
              <span className="sheet__note sheet__note--1" aria-hidden="true">
                scale, or softmax saturates
              </span>
            </section>

            <section>
              <h4>2&nbsp;&nbsp;Multi-head attention</h4>
              <p>
                Instead of one attention over 512 dimensions, the model runs <mark>8 heads of 64</mark> in
                parallel, each free to focus on a different relationship, then concatenates them.
              </p>
              <span className="sheet__note sheet__note--2" aria-hidden="true">
                heads = different views
              </span>
            </section>

            <section>
              <h4>3&nbsp;&nbsp;Positional encoding</h4>
              <p>
                With no recurrence, word order has to be injected. Sine and cosine waves of different
                frequencies are <mark>added to the embeddings</mark>, so position becomes part of the input.
              </p>
            </section>

            <section>
              <h4>4&nbsp;&nbsp;Why it matters to my work</h4>
              <p>
                It's the architecture under the OpenAI and Ollama models I put into BVS and Farm Easy, and it
                explains why every token attending to every other token makes{" "}
                <mark>long inputs expensive</mark>.
              </p>
              <span className="sheet__note sheet__note--3" aria-hidden="true">
                cost grows with n²
              </span>
            </section>
          </div>

          <footer className="sheet__foot" aria-hidden="true">
            <span>31st Conference on Neural Information Processing Systems</span>
            <span>1</span>
          </footer>
        </article>
      </div>
    </section>
  );
}
