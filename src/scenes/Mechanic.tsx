import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../Background";
import { BigLine } from "../components/BigLine";
import { MessageBubble } from "../components/MessageBubble";
import { sans, c } from "../theme";

export const Mechanic: React.FC<{ l1: string; l2: string; close: string }> = ({
  l1,
  l2,
  close,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background glow={0.7} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 64px", gap: 46 }}>
        <div>
          <BigLine text={l1} startFrame={4} size={86} />
          <BigLine text={l2} startFrame={16} accent size={86} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <MessageBubble
            text="Un coup de main \uD83D\uDEE0\uFE0F"
            side="out"
            startFrame={48}
            typeFrames={16}
            time="21:20"
          />
          <MessageBubble
            text="En route."
            side="in"
            startFrame={92}
            typeFrames={12}
            time="21:20"
          />
        </div>
        <div
          style={{
            fontFamily: sans,
            fontWeight: 300,
            fontSize: 36,
            color: c.textDim,
            opacity: interpolate(f, [120, 144], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {close}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
