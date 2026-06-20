import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { sans, c } from "../theme";

export const BigLine: React.FC<{
  text: string;
  startFrame?: number;
  accent?: boolean;
  size?: number;
}> = ({ text, startFrame = 0, accent = false, size = 84 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - startFrame, fps, config: { damping: 18, mass: 0.7 } });
  return (
    <div
      style={{
        fontFamily: sans,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.04,
        color: accent ? c.lilac : c.text,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [38, 0])}px)`,
      }}
    >
      {text}
    </div>
  );
};
