import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Background } from "../Background";
import { BigLine } from "../components/BigLine";
import { mono, c } from "../theme";

export const Payoff: React.FC<{ q: string; stamp: string }> = ({ q, stamp }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 38, fps, config: { damping: 9, mass: 0.5 } });
  const rot = interpolate(s, [0, 1], [-14, -6]);
  return (
    <AbsoluteFill>
      <Background glow={0.85} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 64px",
          textAlign: "center",
          gap: 44,
        }}
      >
        <BigLine text={q} startFrame={4} size={78} />
        <div
          style={{
            opacity: s,
            transform: `scale(${interpolate(s, [0, 1], [1.7, 1])}) rotate(${rot}deg)`,
            border: `5px solid ${c.lilac}`,
            color: c.lilac,
            fontFamily: mono,
            fontWeight: 700,
            fontSize: 58,
            letterSpacing: 4,
            padding: "14px 30px",
            borderRadius: 14,
            textTransform: "uppercase",
          }}
        >
          {stamp}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
