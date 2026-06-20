import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../Background";
import { MessageBubble } from "../components/MessageBubble";
import { mono, c } from "../theme";

export const Hook: React.FC<{ line: string }> = ({ line }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background glow={0.65} />
      <AbsoluteFill style={{ padding: "120px 70px 0", alignItems: "center" }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 24,
            letterSpacing: 6,
            color: c.lilac,
            opacity: interpolate(f, [0, 18], [0, 0.8], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          GENÈVE · 21:14
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 70px" }}>
        <MessageBubble text={line} side="out" startFrame={6} typeFrames={30} time="21:14" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
