## NexiraCopilot

NexiraCopilot is a monorepo containing:

- frontend: React + Vite (TailwindCSS)
- backend: FastAPI (Python 3.11.3, uv)

---

## System Requirements

- Node.js >= 18 and npm
- Python 3.11.3 and uv (Astral)

---

## Repository Structure

```
NexiraCopilot/
  backend/
    pyproject.toml
    uv.lock
    .env_example
    src/
      main.py
      app_config.py
      db_handler.py
      prompt_lib.py
      routers/
        game_dev_routes.py
        prompt_optimizer_routes.py
        qa_qc_routes.py
        login_routes.py
      schemas/
        game_dev_schema.py
        prompt_optimizer_schema.py
        qa_qc_schema.py
        login_schema.py
      tools/
        game_dev_tools.py
        prompt_optimizer_tools.py
        qa_qc_tools.py
        user_login.py
      factory/
        __init__.py
      tests/
        __init__.py
      workflows/
  frontend/
    package.json
    vite.config.ts
    index.html
    tailwind.config.js
    src/
      App.tsx
      components/
        ...
      contexts/
        ...
      data/
        ...
    public/
      ...
  Button effect (Community)/
    App.tsx
    components/
      ...
    styles/
      globals.css
  Dockerfile
  builder.config.json
```

---

## Backend (FastAPI)

### Environment setup (uv, Python 3.11.3)

```
cd /home/miphu2804/Projects/NexiraCopilot/backend
uv venv --python=3.11.3
uv sync
cp .env_example .env
```

Environment variables supported in `src/app_config.py`:

- OPENAI_API_KEY=
- LLM_MODEL_NAME=
- GOOGLE_CLIENT_ID=
- GOOGLE_CLIENT_SECRET=
- GOOGLE_REDIRECT_URI=
- MONGODB_URI=
- MONGODB_USERNAME=
- MONGODB_PASSWORD=

Run dev server:

```
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

Swagger UI: `http://localhost:8000/docs`

### MongoDB (Docker quick start)

```
docker volume create mongodb_data
docker run -d --name mongodb-local \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=<USER> \
  -e MONGO_INITDB_ROOT_PASSWORD=<PASS> \
  -v mongodb_data:/data/db \
  mongo:latest
```

Connect using Compass/GUI:

- URI: `mongodb://<USER>:<PASS>@localhost:27017`

Set `MONGODB_URI`, `MONGODB_USERNAME`, `MONGODB_PASSWORD` in `backend/.env` accordingly.

### Run backend in Docker (mount source)

```
docker run -it --rm \
  -p 8000:8000 \
  -v /home/miphu2804/Projects/NexiraCopilot/backend:/app \
  -w /app \
  --env-file /home/miphu2804/Projects/NexiraCopilot/backend/.env \
  ghcr.io/astral-sh/uv:python3.11-bookworm-slim \
  sh -lc "uv sync && uv run uvicorn src.main:app --host 0.0.0.0 --port 8000"
```

---

## Frontend (React + Vite)

### Install & run dev

```
cd ../NexiraCopilot/frontend
npm ci
npm run dev
```


### Run frontend in Docker (dev, no build)

```
docker run -it --rm \
  -p 5173:5173 \
  -v /home/miphu2804/Projects/NexiraCopilot/frontend:/app \
  -w /app \
  node:20 \
  bash -lc "npm ci && npm run dev -- --host 0.0.0.0"
```

---

## Troubleshooting

- Import error in backend: `export PYTHONPATH=$(pwd)` inside `backend/`
- CORS: Already allowed via `CORSMiddleware`
- Mongo auth changed but volume reused: remove the old volume and re-init `mongodb_data`
- Port already in use: pick a different port or stop the process holding it

---

## Quick test

Backend:

```
cd /home/miphu2804/Projects/NexiraCopilot/backend
uv venv --python=3.11.3
uv sync
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:

```
cd /home/miphu2804/Projects/NexiraCopilot/frontend
npm ci
npm run dev
```

Open `http://localhost:5173` and `http://localhost:8000/docs`.

 