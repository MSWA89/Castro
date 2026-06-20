import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../Background";
import { LogoBisogno } from "../components/LogoBisogno";
import { Kicker } from "../components/Kicker";
import { sans, c } from "../theme";

export const Reveal: React.FC<{ label: string; word: string }> = ({ label, word }) => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [0, 8, 24], [0, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fade = (a: number, b: number) =>
    interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Background glow={1} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 30,
          padding: "0 60px",
          textAlign: "center",
        }}
      >
        <Kicker opacity={fade(40, 60)}>{label}</Kicker>
        <LogoBisogno size={148} startFrame={16} />
        <div
          style={{
            fontFamily: sans,
            fontWeight: 300,
            fontSize: 42,
            color: c.textDim,
            opacity: fade(58, 84),
          }}
        >
          {word}
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: c.glow, opacity: flash, mixBlendMode: "screen" }}
      />
    </AbsoluteFill>
  );
};
