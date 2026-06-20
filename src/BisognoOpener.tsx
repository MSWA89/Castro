import React from "react";
import {
  AbsoluteFill,
  Series,
  Audio,
  staticFile,
  useVideoConfig,
  interpolate,
} from "remotion";
import { z } from "zod";
import { Hook } from "./scenes/Hook";
import { Needs } from "./scenes/Needs";
import { Reveal } from "./scenes/Reveal";
import { Mechanic } from "./scenes/Mechanic";
import { Payoff } from "./scenes/Payoff";
import { EndCard } from "./scenes/EndCard";
import { c } from "./theme";

// All copy is props → localize (FR / EN / IT) or spin variants without touching code.
export const openerSchema = z.object({
  hookLine: z.string(),
  needs: z.array(z.string()),
  defLabel: z.string(),
  defWord: z.string(),
  mech1: z.string(),
  mech2: z.string(),
  mechClose: z.string(),
  payoffQ: z.string(),
  payoffStamp: z.string(),
  tagline: z.string(),
  cta: z.string(),
  withAudio: z.boolean(),
});

export type OpenerProps = z.infer<typeof openerSchema>;

export const BisognoOpener: React.FC<OpenerProps> = (p) => {
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: c.void }}>
      <Series>
        <Series.Sequence durationInFrames={60}>
          <Hook line={p.hookLine} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <Needs needs={p.needs} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <Reveal label={p.defLabel} word={p.defWord} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <Mechanic l1={p.mech1} l2={p.mech2} close={p.mechClose} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={90}>
          <Payoff q={p.payoffQ} stamp={p.payoffStamp} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={90}>
          <EndCard tagline={p.tagline} cta={p.cta} />
        </Series.Sequence>
      </Series>

      {/* Audio is off by default so the visuals render before you add tracks.
          Drop public/music.mp3 + public/voiceover.mp3, then set withAudio: true. */}
      {p.withAudio && (
        <>
          <Audio
            src={staticFile("music.mp3")}
            volume={(f) =>
              interpolate(
                f,
                [0, 30, durationInFrames - 45, durationInFrames],
                [0, 0.42, 0.42, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )
            }
          />
          <Audio src={staticFile("voiceover.mp3")} volume={0.95} />
        </>
      )}
    </AbsoluteFill>
  );
};
