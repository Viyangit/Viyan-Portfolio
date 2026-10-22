import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { PROFILE } from "../data.js";

/**
 * "Reading" section: the first page of each paper I've read, as an annotated printout.
 * Body text is my own summary, not the paper's text. Highlights sweep in as you scroll.
 */
export default function Paper() {
  const rootRef = useRef(null);
  const duoRef = useRef(null);
  // The two papers trade places on top of each other every 4 seconds while the section is on screen.
  const [front, setFront] = useState("attention");
  useEffect(() => {
    const duo = duoRef.current;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(duo);
    const timer = setInterval(() => {
      if (visible) setFront((f) => (f === "attention" ? "lora" : "attention"));
    }, 4000);
    return () => {
      clearInterval(timer);
      io.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".paper-duo",
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


  return (
    <section ref={rootRef} id="reading" className="reading" aria-labelledby="reading-title">
      <div className="reading__intro">
        <p className="reading__word" aria-hidden="true">
          Papers
        </p>
        <h2 id="reading-title" className="section-title">
          On my desk
        </h2>
        <p>
          Two papers my work is built on: the Transformer under every model I ship, and LoRA, the adapters inside
          FedLearn. I've read both end to end; these are the ideas I keep coming back to.
        </p>
      </div>

      <div className="paper-stack paper-duo" ref={duoRef}>
        <article className={`sheet sheet--left ${front === "attention" ? "is-front" : "is-back"}`} data-detect="attention">
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
        <article className={`sheet sheet--right ${front === "lora" ? "is-front" : "is-back"}`} data-detect="lora">
          <p className="sheet__arxiv" aria-hidden="true">
            arXiv:2106.09685 [cs.CL]
          </p>

          <header className="sheet__head">
            <h3 className="sheet__title">LoRA: Low-Rank Adaptation of Large Language Models</h3>
            <p className="sheet__authors">
              Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, Weizhu
              Chen
            </p>
            <p className="sheet__venue">2021</p>
            <p className="sheet__reader">Reader's notes: {PROFILE.name}</p>
          </header>

          <div className="sheet__body">
            <section className="sheet__abstract">
              <h4>In short</h4>
              <p>
                Instead of fine-tuning every weight of a large model, freeze it and train a pair of small{" "}
                <mark>low-rank matrices</mark> beside chosen layers. On GPT-3 175B that cuts trainable parameters by
                about 10,000 times and GPU memory by about 3 times.
              </p>
            </section>

            <section>
              <h4>1&nbsp;&nbsp;The update is low rank</h4>
              <p>
                The change a task needs in a weight matrix can be written as the product of two thin matrices, so
                only those are trained while the original W stays frozen.
              </p>
              <p className="sheet__eq" aria-label="h equals W zero x plus B A x">
                h = W<sub>0</sub>x + <mark>BAx</mark>, &nbsp;rank r ≪ d
              </p>
              <span className="sheet__note sheet__note--1" aria-hidden="true">
                train A and B, freeze W
              </span>
            </section>

            <section>
              <h4>2&nbsp;&nbsp;Starts as a no-op</h4>
              <p>
                A starts random and B starts at zero, so at step one the model behaves exactly like the
                pretrained one; the update is scaled by <mark>α / r</mark>.
              </p>
            </section>

            <section>
              <h4>3&nbsp;&nbsp;No extra latency</h4>
              <p>
                After training, BA can be <mark>merged back into W</mark>, so inference runs at the original
                speed, unlike adapter layers that add depth.
              </p>
              <span className="sheet__note sheet__note--2" aria-hidden="true">
                merge, then ship
              </span>
            </section>

            <section>
              <h4>4&nbsp;&nbsp;Why it matters to my work</h4>
              <p>
                FedLearn gives each user a tiny personal adapter built on this idea, about 150 KB, that learns on
                their device; only <mark>A and B</mark> ever change, never the base model.
              </p>
              <span className="sheet__note sheet__note--3" aria-hidden="true">
                small enough to stay on-device
              </span>
            </section>
          </div>

          <footer className="sheet__foot" aria-hidden="true">
            <span>arXiv preprint, revised October 2021</span>
            <span>1</span>
          </footer>
        </article>
      </div>
    </section>
  );
}
