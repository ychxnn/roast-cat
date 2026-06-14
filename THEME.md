# 🍬 Candy Theme

A soft, cute pastel reskin for Roast Cat. The cat keeps all its expressions,
animations, and roast logic — this layer only changes the *look*: a candy speech
bubble, floating candy particles around the cat, and a pastel settings panel.

## Palette

| Token            | Hex       | Used for                                  |
|------------------|-----------|-------------------------------------------|
| Candy pink       | `#ff6b9d` | primary accent (buttons, toggles, links)  |
| Soft pink        | `#ff8fb3` | speech-bubble border + tail               |
| Bubble shadow    | `#ffd3e2` | drop shadow on the speech bubble          |
| Plum text        | `#5a3d5c` | body text                                 |
| Deep candy plum  | `#c2387a` | headings / emphasis                       |
| Muted mauve      | `#a06b88` | labels, secondary text                    |
| Page top         | `#fff0f6` | settings background gradient (top)        |
| Page bottom      | `#f3e8ff` | settings background gradient (bottom)     |
| Card pink        | `#fff5fa` | cat cards / inputs                        |
| Border pink      | `#ffd9e8` / `#ffe0ec` | card + section borders        |

The cat sprite colours are unchanged and still chosen per-cat in Settings
(orange / black / white / grey / pink). Those live in the `COLORS` map in
`renderer/cat.html` and the matching swatches in `renderer/settings.html`.

## What changed

- **`renderer/cat.html`**
  - Speech bubble restyled candy-pink (border, tail, soft shadow), text in plum.
  - Floating **candy particles** (`#particles` layer + `float-up` keyframe) drift
    gently up behind the cat. Spawner lives at the bottom of the `<script>`.
  - Inline roast copy (`R = {…}`) re-synced to match `src/service/roasts.js`.
- **`renderer/settings.html`**
  - Full pastel reskin of the `<style>` block (was dark navy `#1a1a2e`).
  - Inline text colours fixed for the light background.

## Tuning the particles

In the particle block near the bottom of `renderer/cat.html`:

```js
const CANDY = ['🍬','🍭','🧁','🍩','🩷','✨','💕','🌸']; // which emoji rain down
setInterval(spawnParticle, 900);                          // spawn rate (ms) — higher = fewer
const dur = 4 + Math.random() * 3;                        // 4–7s drift time per particle
```

- Fewer particles: raise `900` (e.g. `1500`).
- Calmer drift: increase the base in `const dur`.
- Different sweets: edit the `CANDY` array.

Particles pause automatically while the window is hidden (`document.hidden`),
and each one removes itself after it finishes drifting, so they never pile up
(max ≈ 8 on screen at the default rate).

## Preview it

```bash
npm install      # first time only
npm run demo     # cat cycles through every emotion + roast, no permissions needed
# or
npm start        # normal run
```

Open the settings panel from the menu-bar tray icon to see the pastel UI.
