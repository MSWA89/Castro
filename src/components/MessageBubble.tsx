import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { sans, mono, c } from "../theme";

type Props = {
  text: string;
  side?: "out" | "in";
  startFrame?: number;
  typeFrames?: number;
  time?: string;
  status?: "sent" | "typing" | "done";
};

export const MessageBubble: React.FC<Props> = ({
  text,
  side = "out",
  startFrame = 0,
  typeFrames = 24,
  time = "21:14",
  status = "sent",
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = f - startFrame;
  const pop = spring({ frame: local, fps, config: { damping: 14, mass: 0.5 } });

  const chars = Math.max(
    0,
    Math.min(
      text.length,
      Math.floor(
        interpolate(local, [6, 6 + typeFrames], [0, text.length], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      )
    )
  );
  const shown = text.slice(0, chars);
  const typing = chars < text.length;
  const caret = typing && Math.floor(local / 8) % 2 === 0 ? "\u258D" : "";
  const out = side === "out";

  return (
    <div
      style={{
        alignSelf: out ? "flex-end" : "flex-start",
        maxWidth: 780,
        opacity: pop,
        transform: `scale(${interpolate(pop, [0, 1], [0.82, 1])})`,
        transformOrigin: out ? "right bottom" : "left bottom",
      }}
    >
      <div
        style={{
          background: out ? `linear-gradient(135deg, ${c.core}, ${c.bright})` : c.plum,
          color: c.text,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 42,
          lineHeight: 1.25,
          padding: "26px 34px",
          borderRadius: 36,
          borderBottomRightRadius: out ? 10 : 36,
          borderBottomLeftRadius: out ? 36 : 10,
          boxShadow: `0 24px 70px ${c.core}55`,
          border: `1px solid ${c.lilac}33`,
        }}
      >
        {shown}
        {caret}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 12,
            fontFamily: mono,
            fontSize: 22,
            color: out ? c.glow : c.textDim,
          }}
        >
          <span>{time}</span>
          {out && <span>{status === "typing" ? "\u2026" : "\u2713\u2713"}</span>}
        </div>
      </div>
    </div>
  );
};
