# AI Industry Chain Cube

Modular 3D industry-chain explorer backed by SQLite.

## Layout

```
ai-chain/
  data/           layers.json, companies.json, ai_chain.db
  server/         db.py (schema + queries), app.py (HTTP API + static)
  web/            index.html, css/, js/ (api, state, scene, ui, main)
  scripts/seed.py refresh DB from JSON
  Open-AI-Chain.command
```

## Run

```bash
./Open-AI-Chain.command
# or
python3 scripts/seed.py && python3 server/app.py
```

Open http://127.0.0.1:8787/

## API

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Liveness |
| `GET /api/meta` | Title + country labels |
| `GET /api/layers` | Slices + company counts |
| `GET /api/companies` | `?layer=&country=us\|intl&supply=1&q=` |
| `GET /api/companies/:id` | One company (ring-normalized) |
| `GET /api/bundle` | Bootstrap payload for the SPA |

Ring positions (`revScore`, `ring`, `x`, `y`) are computed server-side so the browser never embeds the company table.
