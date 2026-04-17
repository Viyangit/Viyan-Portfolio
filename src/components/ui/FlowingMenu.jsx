import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";

import "./FlowingMenu.css";

function FlowingMenu({
  items = [],
  speed = 15,
  textColor = "#fff",
  bgColor = "#120F17",
  marqueeBgColor = "#fff",
  marqueeTextColor = "#120F17",
  borderColor = "#fff",
  activeItemId = null,
  onItemToggle,
}) {
  const isAccordion = typeof onItemToggle === "function";

  return (
    <div className="menu-wrap" style={{ backgroundColor: bgColor }}>
      <nav className={`menu ${isAccordion ? "menu--accordion" : ""}`}>
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            speed={speed}
            textColor={textColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
            isOpen={activeItemId === item.itemId}
            onItemToggle={onItemToggle}
            isAccordion={isAccordion}
          />
        ))}
      </nav>
    </div>
  );
}

function MenuItem({
  link,
  text,
  image,
  speed,
  textColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
  itemId,
  isOpen,
  onItemToggle,
  isAccordion,
  year,
  client,
  desc,
  gh,
}) {
  const itemRef = useRef(null);
  const marqueeRef = useRef(null);
  const marqueeInnerRef = useRef(null);
  const animationRef = useRef(null);
  const [repetitions, setRepetitions] = useState(4);

  const animationDefaults = { duration: 0.6, ease: "expo" };

  const findClosestEdge = (mouseX, mouseY, width, height) => {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  const distMetric = (x, y, x2, y2) => {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff;
  };

  useEffect(() => {
    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return;

      const marqueeContent = marqueeInnerRef.current.querySelector(".marquee__part");
      if (!marqueeContent) return;

      const contentWidth = marqueeContent.offsetWidth;
      const viewportWidth = window.innerWidth;

      const needed = Math.ceil(viewportWidth / contentWidth) + 2;
      setRepetitions(Math.max(4, needed));
    };

    calculateRepetitions();
    window.addEventListener("resize", calculateRepetitions);
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [text, image]);

  useEffect(() => {
    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return;

      const marqueeContent = marqueeInnerRef.current.querySelector(".marquee__part");
      if (!marqueeContent) return;

      const contentWidth = marqueeContent.offsetWidth;
      if (contentWidth === 0) return;

      if (animationRef.current) {
        animationRef.current.kill();
      }

      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -contentWidth,
        duration: speed,
        ease: "none",
        repeat: -1,
      });
    };

    const timer = setTimeout(setupMarquee, 50);

    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [text, image, repetitions, speed]);

  const handleMouseEnter = (ev) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const handleMouseLeave = (ev) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap
      .timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  const isExternal = typeof link === "string" && /^https?:\/\//i.test(link);

  return (
    <div className={`menu__item ${isOpen ? "menu__item--open" : ""}`} ref={itemRef} style={{ borderColor }}>
      {isAccordion ? (
        <button
          type="button"
          className="menu__item-link menu__item-link--button"
          onClick={() => onItemToggle?.(itemId)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ color: textColor }}
          aria-expanded={isOpen}
        >
          {text}
        </button>
      ) : (
        <a
          className="menu__item-link"
          href={link}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ color: textColor }}
          {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
          data-barba-prevent={isExternal ? "all" : undefined}
        >
          {text}
        </a>
      )}
      <div className="marquee" ref={marqueeRef} style={{ backgroundColor: marqueeBgColor }}>
        <div className="marquee__inner-wrap">
          <div className="marquee__inner" ref={marqueeInnerRef} aria-hidden="true">
            {[...Array(repetitions)].map((_, idx) => (
              <div className="marquee__part" key={idx} style={{ color: marqueeTextColor }}>
                <span>{text}</span>
                <div className="marquee__img" style={{ backgroundImage: `url(${image})` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {isAccordion ? (
        <div className={`menu__item-dropdown ${isOpen ? "menu__item-dropdown--open" : ""}`}>
          <div className="menu__item-dropdown-grid">
            <div className="menu__photo-slot">
              <p className="menu__meta-label font-sub">Photo Space</p>
              <div className="menu__photo-placeholder">Add project photo here</div>
            </div>
            <div className="menu__project-meta">
              <p className="menu__meta-label font-sub">Client</p>
              <p className="menu__meta-value font-body">{client}</p>
              <p className="menu__meta-label font-sub">Year</p>
              <p className="menu__meta-value font-body">{year}</p>
              <p className="menu__meta-label font-sub">Project Description</p>
              <p className="menu__meta-value font-body">{desc}</p>
              <p className="menu__meta-label font-sub">GitHub</p>
              <a
                href={`https://${gh || link?.replace(/^https?:\/\//i, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                className="menu__meta-link font-body"
                onClick={(e) => e.stopPropagation()}
              >
                {gh || link?.replace(/^https?:\/\//i, "")}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default FlowingMenu;
