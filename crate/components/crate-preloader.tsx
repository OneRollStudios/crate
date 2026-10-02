"use client";

import { useEffect, useState } from "react";

/** A brief brand entrance, not a simulated measure of network progress. */
export function CratePreloader() {
  const [phase, setPhase] = useState<"enter" | "leave" | "done">("enter");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) { setPhase("done"); return; }
    let disposed = false;
    const timers: number[] = [];
    const delay = (ms: number) => new Promise<void>(resolve => {
      timers.push(window.setTimeout(resolve, ms));
    });
    const finish = () => { if (!disposed) setPhase("done"); };
    const onMotionChange = () => { if (reduced.matches) finish(); };
    reduced.addEventListener("change", onMotionChange);
    // Start the reveal after fonts are ready, with a strict cap on the entrance.
    Promise.all([
      delay(1350),
      Promise.race([document.fonts.ready.catch(() => undefined), delay(1700)]),
    ]).then(() => {
      if (disposed) return;
      setPhase("leave");
      timers.push(window.setTimeout(finish, 650));
    });
    return () => {
      disposed = true;
      timers.forEach(window.clearTimeout);
      reduced.removeEventListener("change", onMotionChange);
    };
  }, []);

  if (phase === "done") return null;
  return <div className={`crate-preloader ${phase === "leave" ? "is-leaving" : ""}`} aria-hidden="true">
    <div className="preloader-lockup">
      <div className="preloader-mark"><i/><i/><i/><i/></div>
      <div className="preloader-word"><span>crate<span className="preloader-period">.</span></span></div>
    </div>
    <span className="preloader-credit">One Roll Studios</span>
  </div>;
}
