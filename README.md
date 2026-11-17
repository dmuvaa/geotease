# GeoTease

A geography guessing game played on a satellite globe. Read a clue, drop one pin, and see how close you were.

## Ways to play

- **Where Is It?** — a place is described in stages. Open more clues if you need them, but each one lowers the score multiplier.
- **Find It on the Map** — the instruction *is* the puzzle: a border, a confluence, a direction.
- **Where Did This Happen?** — find where an event, discovery or treaty took place.

Free play is five rounds at the difficulty you choose (Easy, Medium, Hard). Difficulty picks the challenge pool and how many map labels are shown. The **Daily** challenge gives everyone the same three places each UTC day, and scores land on a daily leaderboard.

### Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Spin, zoom, tilt the globe | Drag, scroll or pinch, two-finger twist | Arrow keys, `+` / `-` (when the map is focused) |
| Drop or move your pin | Click / tap, or drag the pin | — |
| Open the next clue | **Next clue** | `C` |
| Submit / continue | **Submit guess** / **Next challenge** | `Enter` |

You can also type coordinates (`48.86, 2.35` or `48.86 N`, `2.35 E`) under **Type coordinates instead**. Map sounds can be muted from the map overlay.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # scoring, proximity and map helper tests
npm run lint
```

Requires Node 22+. `npm install` copies MapLibre's worker files into `public/` (see `postinstall`).

### Environment

| Variable | Purpose |
| --- | --- |
| `GEOTEASE_SECRET` | Signs round tokens. **Set this in production**; without it a dev secret is used and rounds can be forged. |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Optional. When set, results and analytics are written to Supabase (schema in `supabase/migrations`). Otherwise the leaderboard is kept in `data/leaderboard.json`. |

## Project layout

- `app/` — routes (`/`, `/play/*`, `/daily/*`, `/leaderboard`, `/how-to-play`) and server actions.
- `components/game/` — the game shell, clue panel, results and sharing.
- `components/map/` — the MapLibre globe, pins, result line and settlement outlines.
- `lib/challenges/catalog.ts` — the published challenge catalog.
- `lib/game/` — round engine, signed tokens, progress and share text.
- `lib/scoring/` — distance scoring and multipliers.

See `DESIGN.md` for the visual direction.
