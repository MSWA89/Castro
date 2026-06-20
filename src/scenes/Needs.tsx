import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../Background";
import { MessageBubble } from "../components/MessageBubble";

export const Needs: React.FC<{ needs: string[] }> = ({ needs }) => {
  const f = useCurrentFrame();
  // The whole stack drifts upward as it fills — the chat "filling with needs".
  const drift = interpolate(f, [0, 180], [60, -180]);
  return (
    <AbsoluteFill>
      <Background glow={0.8} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 60px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
            transform: `translateY(${drift}px)`,
          }}
        >
          {needs.map((n, i) => (
            <MessageBubble
              key={i}
              text={n}
              side={i % 2 === 0 ? "out" : "in"}
              startFrame={i * 38 + 6}
              typeFrames={20}
              time={`21:1${(i + 5) % 10}`}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
