# Bisogno — opener concept

A 26-second, 9:16 brand opener for the Bisogno app. Motion-graphics (kinetic
type + animated chat), no live action required — so it's fully reproducible and
cheap to localize. The spine: **Bisogno means "need" in Italian.** The whole film
turns that one fact into the brand.

## Why it holds attention to the end

Vertical retention is won in the first 2 seconds and kept with a question the
viewer needs answered. The structure is built for that:

1. **Hook (0–2s)** — a half-finished, slightly funny need types into a chat
   bubble: *"Besoin de quelqu'un. Maintenant."* Relatable + urgent + a wink. No
   logo yet → curiosity.
2. **Needs montage (2–8s)** — needs pile up across the city, alternating sides
   like a network lighting up. Escalating, a little absurd (the IKEA gag, the dog
   "encore", ski bindings before the slope). Tension: who answers all this?
3. **Reveal (8–14s)** — everything collapses into the glowing **Bisogno**
   wordmark, then the definition: *ça veut dire — ( italien ) besoin.* This is the
   payoff to the curiosity AND it teaches the name. Luxurious, slow, mysterious.
4. **Mechanic (14–20s)** — the simple truth: *Un besoin ? Un message.* One bubble
   out, one answer back: *En route.* Closes on *Vous écrivez. Genève répond.*
5. **Payoff (20–23s)** — the funny callback lands: *Le meuble suédois ?* → stamp:
   **Monté ✓.** This is the "like it even if you never use it" beat.
6. **End card (23–26s)** — wordmark + *Dis ton besoin.* + *Bientôt à Genève.*

The humor does the sharing; the reveal does the understanding; the simplicity
does the trust. People who'll never sell a service still learn what Bisogno is
and smile — which is exactly the awareness goal in the run-up to launch.

## Look

- **Palette** — a purple *range*, not one swatch: void `#07030D` → plum
  `#2D1153` → core `#7A2FB8` → bright `#9D4EDD` → lilac `#C77DFF` → glow
  `#E0AAFF`. Dark base, layered bloom, breathing glow, fine grain, vignette.
- **Type** — Alice ONLY on the "Bisogno" wordmark. Everything else is Inter
  Tight (Swiss-neutral, elegant) with JetBrains Mono for small kicker labels —
  that mono tick gives the "app / on-the-go" texture and a bit of mystery.
- **Motion** — slow luxe focus-pulls and glow blooms for the brand beats; quick
  rhythmic bubble pops for the needs; a satisfying collapse into the logo.

## Swiss / market notes

- French-first (Geneva). Copy is plain, warm, unhurried.
- "Bisogno" being Italian is a feature here — it nods to Switzerland's Italian
  side and gives the reveal its little teaching moment.
- All on-screen copy lives in `defaultProps` (see `Root.tsx`). Duplicate the
  composition with EN or IT props for multilingual cuts — same animation.

## Audio

Layout uses **VO + music bed** (see `SCRIPT_VO.md`). The VO carries warmth and
the jokes; the music carries luxe and pace. Audio is wired but OFF by default so
the visuals render before you have tracks — add the two files and flip
`withAudio: true`.

## Honest limits

- This is motion graphics; it does not include filmed footage. If you later want
  real Geneva b-roll or a Higgsfield shot, it can be dropped into any scene as a
  background layer.
- The final MP4 renders in your environment (or via Claude Code) — Remotion
  fetches a headless Chromium on first render.
