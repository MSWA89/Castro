import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { c } from "./theme";

export const Background: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const f = useCurrentFrame();
  // Breathing glow — deterministic (function of frame).
  const pulse = interpolate(Math.sin(f / 22), [-1, 1], [0.55, 1]);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${c.void} 0%, ${c.plumDeep} 58%, ${c.void} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 38% at 50% 44%, ${c.core}66 0%, transparent 70%)`,
          opacity: glow * pulse,
        }}
      />
      {/* Film grain — seed = frame, so it moves but stays reproducible. */}
      <AbsoluteFill style={{ opacity: 0.05, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves={2}
              seed={f}
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(82% 60% at 50% 50%, transparent 52%, ${c.void} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
