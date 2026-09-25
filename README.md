# Karigar Setu — Full Stack

Backend, AI cataloguing, search/recommendation, database, and admin dashboard for the Karigar Setu
brief. Your existing frontend prototype (the Vercel-deployed one) is the artisan/buyer mobile UI —
this repo is everything *behind* it. Point that frontend at `http://localhost:4000` (or your
deployed backend URL) and it has a real API to talk to.

## Architecture

```
                        ┌─────────────────────┐
   Your frontend  ───▶  │   backend-api        │  Node.js / Fastify — single API gateway
   (mobile/buyer app)   │   :4000               │  Prisma ORM → Postgres
                        └──────────┬───────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 ▼                                    ▼
       ┌───────────────────┐               ┌───────────────────────┐
       │ ai-cataloguing      │               │ search-recommendation   │
       │ :8001  (Python/     │               │ :8002  (Python/FastAPI) │
       │  FastAPI)            │               │  embeddings + pgvector   │
       │  CV category detect  │               │  search + "more like     │
       │  + LLM listing draft │               │  this" recommendations   │
       │  + price suggestion  │               └───────────────────────┘
       └───────────────────────┘
                 │                                    │
                 └──────────────────┬─────────────────┘
                                     ▼
                          ┌───────────────────────┐
                          │ postgres + pgvector     │  :5432
                          │ (also serves as vector  │
                          │  DB — no separate        │
                          │  service needed)          │
                          └───────────────────────┘

                          ┌───────────────────────┐
                          │ admin-dashboard          │  React (Vite) — :5173
                          │ NGO / scheme-admin view   │  reads backend-api
                          └───────────────────────┘
```

## Why these choices

- **One real adapter, four mocked** (`backend-api/src/lib/adapters/`): per the brief's Phase 1/3
  split, the native marketplace is real; India Handmade, Etsy, Unfade, Kreate are stubbed behind
  the same `publish(product)` interface so swapping in a real Etsy adapter later touches one file.
- **pgvector instead of a standalone vector DB**: the brief's own stack already includes Postgres.
  Adding the `vector` extension gets you a real vector DB with one less service to run, deploy, and
  pay for — same capability, one less moving part.
- **AI cataloguing has a working offline fallback at every step**: image classification is a
  documented-but-honest heuristic (not a trained model — see `cv_classifier.py` for the exact swap-in
  point for a real TFLite model), listing generation calls Claude if `ANTHROPIC_API_KEY` is set and
  falls back to a template generator if not (this matches the brief's explicit Phase 1 allowance).
  Nothing in the demo breaks if you don't have an API key yet.
- **Fee transparency is enforced in code, not just UI**: `computeNet()` in `channels.js` computes
  the actual payout after fees for every channel, including Etsy's stacked % + flat fee, so the
  publish-preview screen can show real numbers, not placeholders.

## Running it

```bash
cp .env.example .env        # add your ANTHROPIC_API_KEY if you have one (optional)
docker compose up --build
```

- Backend API: http://localhost:4000  (health check: `/health`)
- AI cataloguing service: http://localhost:8001/health
- Search/recommendation service: http://localhost:8002/health
- Admin dashboard: http://localhost:5173
- Postgres: localhost:5432 (user `karigar` / pass `karigar_dev_pw` / db `karigarsetu`)

First run: the `postgres` container auto-runs `db/init.sql` (creates all tables + seeds the five
channels with their real fee structures from the brief). `backend-api`'s Dockerfile then runs
`prisma migrate deploy` on boot — since the SQL is already applied via init.sql, generate a baseline
migration once with `npx prisma migrate dev --name init` from inside `backend-api/` if you want
Prisma to manage schema changes going forward; until then the raw SQL is the source of truth.

## Wiring your existing frontend to this backend

1. Set your frontend's API base URL to `http://localhost:4000` (or wherever you deploy this).
2. The 6 core flows map to these endpoints:

| Frontend flow | Endpoint |
|---|---|
| Onboarding | `POST /api/artisans` |
| Home dashboard | `GET /api/products?artisanId=...`, `GET /api/orders?artisanId=...` |
| AI cataloguing capture | `POST /api/products` (runs the full CV+voice+LLM pipeline server-side) |
| AI draft review/edit | `PATCH /api/products/:id` |
| Publish everywhere | `GET /api/products/:id/publish-preview` then `POST /api/products/:id/publish` |
| Buyer-side search | `GET /api/search?q=...&craftType=...&region=...` |
| Certificate verification (QR target) | `GET /api/certificates/:id/verify` |

Send me your frontend's source (zip, GitHub link, or paste the key files) and I'll wire these
calls into the actual screens instead of leaving it as an integration table.

## What's stubbed vs. real, honestly

| Piece | Status |
|---|---|
| Native marketplace publish | Real |
| India Handmade / Etsy / Unfade / Kreate publish | Mocked (same interface, swap later) |
| CV category/material detection | Heuristic placeholder, not a trained model |
| LLM listing + price generation | Real (Claude) if `ANTHROPIC_API_KEY` set, else template |
| Voice transcription | Stubbed — returns placeholder text unless `ASR_SERVICE_URL` is configured |
| Search embeddings | Real, offline (HashingVectorizer) — swap for a multilingual sentence model later |
| Authenticity certificate (hash + QR) | Real, tamper-evident, publicly verifiable |
| Fee computation / net-to-artisan | Real, per each channel's actual fee shape |
| Bank details encryption at rest | Real (AES-256-GCM) |
| Admin dashboard | Real, reads live data from backend-api |

## Next steps toward the brief's Phase 2/3

- Swap `cv_classifier.py` for a trained TFLite model (MobileNetV3 fine-tuned on Indian handicrafts).
- Swap `voice_transcribe.py`'s stub for a real Indic ASR (IndicWhisper) service.
- Swap `embeddings.py`'s HashingVectorizer for a multilingual sentence encoder (LaBSE).
- Build the real Etsy adapter using Etsy's Open API v3 (OAuth2 + listings endpoint) — same
  `publish(product)` interface as `nativeAdapter.js`, drop it into `adapters/index.js`.
