import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { alice, c } from "../theme";

export const LogoBisogno: React.FC<{ size?: number; startFrame?: number }> = ({
  size = 150,
  startFrame = 0,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - startFrame, fps, config: { damping: 200 } });

  const blur = interpolate(s, [0, 1], [26, 0]); // focus pull
  const ls = interpolate(s, [0, 1], [26, 2]); // letter-spacing settle
  const glow = interpolate(Math.sin(f / 18), [-1, 1], [0.55, 1]);

  return (
    <div
      style={{
        fontFamily: alice,
        fontSize: size,
        color: c.text,
        opacity: s,
        letterSpacing: ls,
        filter: `blur(${blur}px)`,
        textShadow: `0 0 ${28 * glow}px ${c.bright}, 0 0 ${72 * glow}px ${c.core}`,
      }}
    >
      Bisogno
    </div>
  );
};
