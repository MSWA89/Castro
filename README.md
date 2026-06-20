# Bisogno opener (Remotion) — 9:16, 26s

Read `CONCEPT.md` for the creative and `SCRIPT_VO.md` for the audio.

## Files

```
src/
  index.ts                 entry (registerRoot)
  Root.tsx                 composition + all on-screen copy (defaultProps)
  BisognoOpener.tsx        stitches the 6 scenes + audio
  theme.ts                 purple-range palette + fonts (Alice = wordmark only)
  Background.tsx           gradient + breathing glow + grain + vignette
  components/
    LogoBisogno.tsx        Alice wordmark, focus-pull glow reveal
    MessageBubble.tsx      typewriter chat bubble + ticks
    BigLine.tsx            kinetic headline line
    Kicker.tsx             mono label
  scenes/
    Hook · Needs · Reveal · Mechanic · Payoff · EndCard
public/                    drop music.mp3 + voiceover.mp3 here
```

## Setup

Node 18+. Remotion bundles ffmpeg. First render downloads a headless Chromium —
allow it through any firewall.

```bash
npm create video@latest -- bisogno-opener --blank
cd bisogno-opener
npm i @remotion/google-fonts zod
# then replace src/ with the src/ here, and copy in public/
```

## Use

```bash
npx remotion studio                         # live preview; edit copy props live
npx remotion render BisognoOpener out/bisogno-opener.mp4
```

Localized cut (e.g. English) — pass props inline or via a JSON file:

```bash
npx remotion render BisognoOpener out/en.mp4 --props=props.en.json
```

## Audio

Audio is OFF by default so it renders without assets. When ready:

1. Put `music.mp3` and `voiceover.mp3` in `public/`.
2. In `Root.tsx`, set `withAudio: true`.
3. Re-render.

## Tuning

- Length/pacing: each scene's `durationInFrames` is in `BisognoOpener.tsx`
  (sum = 780 = 26s). Shorten Needs/Mechanic to tighten for feeds.
- Copy: all in `Root.tsx` `defaultProps`.
- Palette: `theme.ts`.
- Want real footage in a scene? Add `<Video>`/`<Img>` as a background layer
  inside that scene, under the existing content.
