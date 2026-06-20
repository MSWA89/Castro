import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../Background";
import { LogoBisogno } from "../components/LogoBisogno";
import { Kicker } from "../components/Kicker";
import { sans, c } from "../theme";

export const EndCard: React.FC<{ tagline: string; cta: string }> = ({ tagline, cta }) => {
  const f = useCurrentFrame();
  const fade = (a: number, b: number) =>
    interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Background glow={1} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 32,
          textAlign: "center",
        }}
      >
        <LogoBisogno size={150} startFrame={4} />
        <div
          style={{
            fontFamily: sans,
            fontWeight: 300,
            fontSize: 46,
            color: c.text,
            opacity: fade(30, 54),
          }}
        >
          {tagline}
        </div>
        <Kicker opacity={fade(52, 76)}>{cta}</Kicker>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
