# Bisogno opener — VO script + music brief

26s · French · velvet, calm, unhurried — a touch playful at the payoff.
Target loudness around -14 LUFS. Files go in `public/` as `voiceover.mp3` and
`music.mp3`, then set `withAudio: true` in `Root.tsx` defaults.

## Voiceover (FR) — with timing + EN gloss

| Scene | ~Time | FR line | EN gloss | Delivery |
|------|------|---------|----------|----------|
| Hook | 0–2s | (silence — let the bubble type) | — | hold |
| Needs | 2–8s | « À Genève, tout le monde a un besoin. » | Everyone in Geneva has a need. | warm, low |
| Needs | 6–8s | « Petit. Urgent. Parfois… absurde. » | Small. Urgent. Sometimes… absurd. | a smile on "absurde" |
| Reveal | 9–13s | « Bisogno. En italien : besoin. » | Bisogno. Italian for: need. | slow, reverent |
| Mechanic | 15–19s | « Un besoin, un message. Et quelqu'un s'en occupe. » | A need, a message. And someone takes care of it. | clear, easy |
| Payoff | 21–23s | « Même le meuble suédois. » | Even the Swedish furniture. | dry, deadpan |
| End | 24–26s | « Bisogno. Bientôt à Genève. » | Bisogno. Soon in Geneva. | soft landing |

Total spoken ~ 22s inside the 26s — leave air; the silence is part of the luxe.

A safe lower-register FR voice works best. You can generate this with Higgsfield
TTS (FR) or ElevenLabs; pick a calm male or warm female mid-range, no announcer
energy.

## Music brief

Dark, elegant, minimal — a modern cousin of hotel-noir, but lighter and app-y.

- ~88–92 BPM, sub-bass pulse + a single bright plucked/bell motif in a minor
  key, lots of space.
- Build subtly under the needs montage; small lift into the Reveal; warm,
  resolved chord under the end card (do NOT end cold/tense — end inviting).
- No big drops, no cheesy EDM. Restraint = luxury.
- Duck ~4–5 dB under the VO lines (or just mix the bed low; the composition
  already fades it in over 1s and out over the last 1.5s).

## Notes

- If you'd rather go **music-only** (no VO), it still works — the on-screen copy
  carries meaning on its own. In that case bump music volume in
  `BisognoOpener.tsx` from 0.42 toward ~0.7.
