"use client";

import { useId } from "react";

export type CrateLogoProps = {
  variant?: "full" | "mark";
  className?: string;
};

const rayPositions = [54, 86, 122, 158, 196, 235, 276, 318, 364, 412, 458, 506];

export function CrateLogo({ variant = "full", className }: CrateLogoProps) {
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const full = variant === "full";
  const viewBox = full ? "0 0 560 250" : "0 0 190 42";
  const textY = full ? 102 : 25;
  const fontSize = full ? 116 : 29;
  const rayTop = full ? 96 : 24;
  const rayWidth = full ? 7 : 2.5;
  const rayScale = full ? 1 : 0.31;

  return (
    <svg
      className={["crate-logo", "crate-logo-" + variant, className].filter(Boolean).join(" ")}
      viewBox={viewBox}
      role="img"
      aria-label="crate"
    >
      <defs>
        <linearGradient id={id + "-ray"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ors-accent)" stopOpacity="1" />
          <stop offset="42%" stopColor="var(--ors-accent)" stopOpacity=".34" />
          <stop offset="100%" stopColor="var(--ors-accent)" stopOpacity="0" />
        </linearGradient>
        <filter id={id + "-blur"} x="-80%" y="-20%" width="260%" height="160%">
          <feGaussianBlur stdDeviation={full ? "5" : "1.4"} />
        </filter>
        <filter id={id + "-text-glow"} x="-40%" y="-70%" width="180%" height="240%">
          <feGaussianBlur stdDeviation={full ? "8" : "2"} result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <mask id={id + "-text-mask"}>
          <rect width="100%" height="100%" fill="black" />
          <text x="8" y={textY} className="crate-logo-type" fontSize={fontSize} fill="white">crate</text>
        </mask>
      </defs>

      <g className="crate-logo-rays" filter={"url(#" + id + "-blur)"}>
        {rayPositions.map((x, index) => {
          const height = full ? 68 + (index % 4) * 24 : 10 + (index % 3) * 3;
          return (
            <rect
              key={x}
              className={"crate-logo-ray ray-" + (index + 1)}
              x={x * rayScale}
              y={rayTop}
              width={rayWidth}
              height={height}
              rx={rayWidth / 2}
              fill={"url(#" + id + "-ray)"}
            />
          );
        })}
      </g>

      <text
        x="8"
        y={textY}
        className="crate-logo-type crate-logo-word"
        fontSize={fontSize}
        fill={full ? "var(--ors-dark-text)" : "var(--ors-black)"}
        filter={full ? "url(#" + id + "-text-glow)" : undefined}
      >
        crate
      </text>
      <rect
        width="100%"
        height={full ? 112 : 31}
        fill="var(--ors-accent)"
        opacity={full ? ".17" : ".08"}
        mask={"url(#" + id + "-text-mask)"}
      />
    </svg>
  );
}
