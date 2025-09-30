# Trent Concept to Catwalk — Multi‑Agent PoC (MVP)

This is a self‑contained **proof‑of‑concept** you can clone into a repo and run locally. It implements the MVP slice:

- **Seeds → Brief** for **Web (lookbooks/news)** + **Owned IG placeholder**
- **Agents**: Orchestrator, Web Search Curator, Fetcher, Parser, Vision Featurizer (basic), Trend Clusterer, Brief Writer, Policy Guard, API, and minimal **React UI**
- **Storage**: Postgres (+ pgvector), Redis, MinIO (for blobs)
- **Ops**: Rate‑limit, retries, audit logs, robots.txt compliance switch

> ⚠️ **Compliance First**: This PoC ships with *public‑web demo mode* and **sample fixtures**. Keep `CRAWL_ENABLE_EXTERNAL=false` unless you have approvals. For IG, we include a Graph API stub that only activates when real credentials are supplied.

---

## 0) Repo Layout

```
trent-ctc-poc/
├─ backend/
│  ├─ app/
│  │  ├─ api/               # FastAPI routers
│  │  ├─ agents/            # Agent implementations
│  │  ├─ core/              # config, logging, policy, rate-limit
│  │  ├─ db/                # SQL models, migrations, pgvector utils
│  │  ├─ services/          # orchestration, brief writer, exporters
│  │  └─ main.py            # FastAPI entry
│  ├─ celery_worker.py      # Celery worker entry
│  ├─ requirements.txt
│  └─ Dockerfile
├─ frontend/
│  ├─ src/
│  │  ├─ App.tsx            # React/Tailwind dashboard
│  │  ├─ api.ts             # client
│  │  └─ components/*
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.ts
├─ docker-compose.yml
├─ .env.example
├─ README.md
└─ fixtures/
   ├─ seed.json             # sample seeds
   ├─ lookbook1.html        # sample public pages
   ├─ lookbook2.html
   └─ images/*              # sample thumbs
```

---

## 1) Docker Compose (Postgres + Redis + MinIO + API + UI)

```yaml
version: "3.9"
services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: trent
    ports: ["5432:5432"]
    healthcheck: { test: ["CMD", "pg_isready", "-U", "postgres"], interval: 5s, timeout: 5s, retries: 20 }

  redis:
    image: redis:7
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123
    ports: ["9000:9000", "9001:9001"]

  backend:
    build: ./backend
    env_file: .env
    depends_on: [db, redis, minio]
    ports: ["8000:8000"]

  worker:
    build: ./backend
    command: sh -c "celery -A celery_worker.celery worker -l info"
    env_file: .env
    depends_on: [backend]

  frontend:
    build: ./frontend
    environment:
      VITE_API_BASE: http://localhost:8000
    ports: ["5173:5173"]
    depends_on: [backend]
```

`.env.example`
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/trent
REDIS_URL=redis://redis:6379/0
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
MINIO_BUCKET=trent-blobs
CRAWL_ENABLE_EXTERNAL=false
RESPECT_ROBOTS=true
MAX_QPS_PER_DOMAIN=0.5
IG_APP_ID=
IG_APP_SECRET=
IG_ACCESS_TOKEN=
JWT_SECRET=change-me
```

---

## 2) Backend — `requirements.txt`

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic==2.8.2
SQLAlchemy==2.0.34
psycopg[binary]==3.2.1
pgvector==0.2.5
alembic==1.13.2
redis==5.0.8
celery[redis]==5.4.0
httpx==0.27.2
readability-lxml==0.8.1
selectolax==0.3.24
beautifulsoup4==4.12.3
playwright==1.47.0
Pillow==10.4.0
scikit-learn==1.5.1
hdbscan==0.8.38
sentence-transformers==3.0.1
python-dotenv==1.0.1
minio==7.2.9
tiktoken==0.7.0
```

`Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    playwright install --with-deps chromium
COPY backend /app
EXPOSE 8000
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]
```

---

## 3) DB Models & Schema (Postgres + pgvector)

`app/db/models.py`
```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, Boolean, ForeignKey, JSON, BigInteger
from sqlalchemy.dialects.postgresql import ARRAY
from pgvector.sqlalchemy import Vector
import uuid, datetime as dt

class Base(DeclarativeBase):
    pass

def _uuid():
    return str(uuid.uuid4())

class Source(Base):
    __tablename__ = "sources"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    platform: Mapped[str] = mapped_column(String)
    url: Mapped[str] = mapped_column(String)
    handle_or_tag: Mapped[str | None] = mapped_column(String, nullable=True)
    ownership: Mapped[str] = mapped_column(String, default="public")
    last_seen_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    robots_allowed: Mapped[bool] = mapped_column(Boolean, default=True)
    posts = relationship("Post", back_populates="source")

class Post(Base):
    __tablename__ = "posts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))
    posted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    caption: Mapped[str | None] = mapped_column(String)
    hashtags: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    mentions: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    url: Mapped[str] = mapped_column(String)
    media_type: Mapped[str | None] = mapped_column(String)
    thumbnail_path: Mapped[str | None] = mapped_column(String)
    lang: Mapped[str | None] = mapped_column(String)
    country_guess: Mapped[str | None] = mapped_column(String)
    source = relationship("Source", back_populates="posts")
    metrics = relationship("Metric", back_populates="post", uselist=False)
    vision = relationship("VisionFeature", back_populates="post", uselist=False)

class Metric(Base):
    __tablename__ = "metrics"
    post_id: Mapped[str] = mapped_column(ForeignKey("posts.id"), primary_key=True)
    likes: Mapped[int | None] = mapped_column(BigInteger)
    comments: Mapped[int | None] = mapped_column(BigInteger)
    views: Mapped[int | None] = mapped_column(BigInteger)
    saves: Mapped[int | None] = mapped_column(BigInteger)
    followers_at_post: Mapped[int | None] = mapped_column(BigInteger)
    calc_engagement_rate: Mapped[float | None] = mapped_column()
    post = relationship("Post", back_populates="metrics")

class VisionFeature(Base):
    __tablename__ = "vision_features"
    post_id: Mapped[str] = mapped_column(ForeignKey("posts.id"), primary_key=True)
    clip_vec: Mapped[list[float] | None] = mapped_column(Vector(384))
    palette_hex: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    dominant_shapes: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    materials: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    post = relationship("Post", back_populates="vision")

class Cluster(Base):
    __tablename__ = "clusters"
    cluster_id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    label: Mapped[str] = mapped_column(String)
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    top_colors: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    support_n: Mapped[int] = mapped_column(BigInteger, default=0)
    first_seen: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    last_seen: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
```

`app/db/init.py`
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base
import os

engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

def init_db():
    with engine.begin() as conn:
        conn.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS vector;")
        Base.metadata.create_all(bind=conn)
```

---

## 4) Core: Config, Logging, Policy Guard, Rate Limiter

`app/core/config.py`
```python
from pydantic import BaseModel
import os

class Settings(BaseModel):
    database_url: str = os.getenv("DATABASE_URL")
    redis_url: str = os.getenv("REDIS_URL")
    minio_endpoint: str = os.getenv("MINIO_ENDPOINT")
    minio_access_key: str = os.getenv("MINIO_ACCESS_KEY")
    minio_secret_key: str = os.getenv("MINIO_SECRET_KEY")
    minio_bucket: str = os.getenv("MINIO_BUCKET", "trent-blobs")
    crawl_enable_external: bool = os.getenv("CRAWL_ENABLE_EXTERNAL","false").lower()=="true"
    respect_robots: bool = os.getenv("RESPECT_ROBOTS","true").lower()=="true"
    max_qps_per_domain: float = float(os.getenv("MAX_QPS_PER_DOMAIN", "0.5"))
    jwt_secret: str = os.getenv("JWT_SECRET","change-me")

settings = Settings()
```

`app/core/policy.py`
```python
from functools import wraps
from datetime import datetime

AUDIT_LOG: list[dict] = []

ALLOW_PLATFORMS = {"web","instagram","youtube"}
DENY_PATTERNS = ["/login","/checkout","/account"]

def policy_guard(fn):
    @wraps(fn)
    async def wrapper(*args, **kwargs):
        ctx = {"ts": datetime.utcnow().isoformat(), "fn": fn.__name__}
        AUDIT_LOG.append(ctx)
        # strip sensitive fields if present in kwargs
        if "raw_user" in kwargs:
            kwargs.pop("raw_user")
        res = await fn(*args, **kwargs)
        return res
    return wrapper
```

`app/core/ratelimit.py`
```python
import asyncio, time
from collections import defaultdict
from .config import settings

_last: dict[str,float] = defaultdict(lambda: 0.0)

async def throttle(domain: str):
    if settings.max_qps_per_domain <= 0: return
    min_gap = 1.0 / settings.max_qps_per_domain
    now = time.monotonic()
    gap = now - _last[domain]
    if gap < min_gap:
        await asyncio.sleep(min_gap - gap)
    _last[domain] = time.monotonic()
```

---

## 5) Agents (MVP)

### 5.1 Orchestrator (Celery + Services)

`backend/celery_worker.py`
```python
from celery import Celery
import os

celery = Celery(
    "trent",
    broker=os.environ["REDIS_URL"],
    backend=os.environ["REDIS_URL"],
)
celery.conf.task_default_queue = "default"
```

`app/services/orchestrator.py`
```python
from celery_worker import celery
from .pipeline import run_pipeline

@celery.task
def task_run_trend_job(seed: dict):
    return run_pipeline(seed)
```

`app/services/pipeline.py`
```python
from ..agents.discovery import web_search_curator
from ..agents.fetcher import fetch_pages
from ..agents.parser import parse_items
from ..agents.vision import featurize_items
from ..agents.cluster import cluster_items
from ..services.brief import write_brief

def run_pipeline(seed: dict):
    # 1) discovery (web only for PoC)
    sources = web_search_curator(seed)
    # 2) fetch
    pages = fetch_pages(sources)
    # 3) parse
    items = parse_items(pages)
    # 4) enrich / vision
    enriched = featurize_items(items)
    # 5) cluster
    clusters = cluster_items(enriched)
    # 6) brief
    brief_md = write_brief(seed, clusters)
    return {"sources": sources, "clusters": clusters, "brief_md": brief_md}
```

### 5.2 Discovery — Web Search Curator (fixture‑first)

`app/agents/discovery.py`
```python
import json, os
from pathlib import Path

FIXTURE = Path(os.getcwd()).parent / "fixtures/seed.json"

def web_search_curator(seed: dict) -> list[dict]:
    """Returns candidate sources with freshness scores (fixture‑based)."""
    if FIXTURE.exists():
        return json.loads(FIXTURE.read_text())
    # Fallback: trivial seed passthrough
    return [{"platform":"web","url":u,"score":0.8} for u in seed.get("urls",[])]
```

Sample `fixtures/seed.json`
```json
[
  {"platform":"web","url":"https://example.com/lookbook1","score":0.9},
  {"platform":"web","url":"https://example.com/lookbook2","score":0.8}
]
```

### 5.3 Fetcher — Playwright Headless (with compliance switches)

`app/agents/fetcher.py`
```python
from playwright.sync_api import sync_playwright
from ..core.config import settings
from ..core.ratelimit import throttle
from urllib.parse import urlparse


def fetch_pages(sources: list[dict]) -> list[dict]:
    results = []
    if not settings.crawl_enable_external:
        # Demo mode: read fixtures
        from pathlib import Path
        fx = Path(__file__).resolve().parents[2] / "fixtures"
        for i in (fx/"lookbook1.html", fx/"lookbook2.html"):
            results.append({"url": i.name, "html": i.read_text()})
        return results

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context()
        for s in sources:
            url = s["url"]
            domain = urlparse(url).netloc
            ctx.set_default_timeout(20000)
            # robots.txt respect — left as exercise to check robots before fetch
            throttle(domain)
            page = ctx.new_page()
            try:
                page.goto(url)
                page.wait_for_load_state("networkidle")
                html = page.content()
                results.append({"url": url, "html": html})
            except Exception as e:
                results.append({"url": url, "error": str(e)})
        browser.close()
    return results
```

### 5.4 Parser — Extract items (title, images, colors from HTML)

`app/agents/parser.py`
```python
from selectolax.parser import HTMLParser
from bs4 import BeautifulSoup
import re

HASHTAG = re.compile(r"#(\w+)")
MENTION = re.compile(r"@(\w+)")


def parse_items(pages: list[dict]) -> list[dict]:
    items = []
    for p in pages:
        if "html" not in p: continue
        html = p["html"]
        tree = HTMLParser(html)
        title = (tree.css_first("title").text() if tree.css_first("title") else "")
        # naive caption from meta
        desc = ""
        meta = tree.css_first('meta[name="description"]')
        if meta and meta.attributes.get("content"): desc = meta.attributes["content"]
        text = " ".join([title, desc])
        hashtags = HASHTAG.findall(text)
        mentions = MENTION.findall(text)
        # images
        soup = BeautifulSoup(html, "html.parser")
        imgs = [img.get("src") for img in soup.find_all("img") if img.get("src")]
        items.append({
            "url": p["url"],
            "caption": text.strip(),
            "hashtags": hashtags,
            "mentions": mentions,
            "images": imgs[:6]
        })
    return items
```

### 5.5 Vision Featurizer — Text embeddings + palette (fast)

`app/agents/vision.py`
```python
from sentence_transformers import SentenceTransformer
from PIL import Image
import io, requests, numpy as np
from sklearn.cluster import KMeans

_model = SentenceTransformer("all-MiniLM-L6-v2")


def _extract_palette(img: Image.Image, k: int = 5):
    img = img.convert("RGB").resize((128,128))
    arr = np.array(img).reshape(-1,3)
    kmeans = KMeans(n_clusters=k, n_init="auto").fit(arr)
    centers = kmeans.cluster_centers_.astype(int)
    hexes = ["#%02x%02x%02x"%tuple(c) for c in centers]
    return hexes


def featurize_items(items: list[dict]) -> list[dict]:
    out = []
    for it in items:
        text = " ".join([it.get("caption",""), " ".join(it.get("hashtags",[]))])
        vec = _model.encode(text).tolist()
        palettes = []
        for u in it.get("images",[])[:2]:
            try:
                if u.startswith("http"):
                    im = Image.open(io.BytesIO(requests.get(u, timeout=5).content))
                    palettes.extend(_extract_palette(im))
            except Exception:
                pass
        out.append({**it, "clip_vec": vec, "palette_hex": list(dict.fromkeys(palettes))[:6]})
    return out
```

### 5.6 Clusterer — HDBSCAN (fallback KMeans)

`app/agents/cluster.py`
```python
import numpy as np

try:
    import hdbscan
    HAS_HDB = True
except Exception:
    from sklearn.cluster import KMeans
    HAS_HDB = False

from collections import defaultdict


def cluster_items(items: list[dict]) -> list[dict]:
    if not items: return []
    X = np.array([it["clip_vec"] for it in items])
    if HAS_HDB and len(items) >= 5:
        labels = hdbscan.HDBSCAN(min_cluster_size=3, min_samples=2).fit_predict(X)
    else:
        from sklearn.cluster import KMeans
        k = max(2, min(6, len(items)//2))
        labels = KMeans(n_clusters=k, n_init="auto").fit_predict(X)
    buckets = defaultdict(list)
    for lbl, it in zip(labels, items):
        buckets[int(lbl)].append(it)
    clusters = []
    for lbl, group in buckets.items():
        # keywords = top hashtags
        hashtags = []
        for g in group:
            hashtags.extend(g.get("hashtags",[]))
        top_kw = [k for k,_ in sorted({h:hashtags.count(h) for h in set(hashtags)}.items(), key=lambda x:-x[1])][:6]
        # top colors
        colors = []
        for g in group:
            colors.extend(g.get("palette_hex",[]))
        top_colors = [c for c,_ in sorted({c:colors.count(c) for c in set(colors)}.items(), key=lambda x:-x[1])][:6]
        clusters.append({
            "label": f"cluster_{lbl}",
            "keywords": top_kw,
            "top_colors": top_colors,
            "support_n": len(group),
            "examples": [g["url"] for g in group[:3]]
        })
    return clusters
```

### 5.7 Brief Writer — Slide‑ready bullets (Markdown)

`app/services/brief.py`
```python
from datetime import datetime

def write_brief(seed: dict, clusters: list[dict]) -> str:
    lines = [f"# Trend Brief — {datetime.utcnow().date()}", "", "**Seed**:", f"- Season: {seed.get('season','NA')}", f"- Keywords: {', '.join(seed.get('keywords',[]))}", "", "## Top Clusters"]
    for c in sorted(clusters, key=lambda x: -x["support_n"])[:6]:
        lines += [
          f"### {', '.join(c['keywords']) or c['label']}",
          f"- Support: {c['support_n']}",
          f"- Palette: {' '.join(c['top_colors'])}",
          f"- Exemplars: {', '.join(c['examples'])}",
          ""
        ]
    return "\n".join(lines)
```

---

## 6) FastAPI — Auth, Jobs, Browse & Export

`app/api/routes.py`
```python
from fastapi import APIRouter
from ..services.orchestrator import task_run_trend_job

router = APIRouter()

@router.post("/run")
async def run(seed: dict):
    # fire-and-forget for PoC; in prod, return task id + polling
    res = task_run_trend_job.apply(args=[seed]).get()
    return res
```

`app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.init import init_db
from .api.routes import router

app = FastAPI(title="Trent C2C API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_headers=["*"], allow_methods=["*"])

@app.on_event("startup")
async def _init():
    init_db()

app.include_router(router)
```

---

## 7) Frontend — Minimal React Dashboard (Vite + Tailwind)

`frontend/package.json`
```json
{
  "name": "trent-ui",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "dev": "vite"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "vite": "5.4.1",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0"
  }
}
```

`frontend/src/api.ts`
```ts
export async function run(seed:any){
  const base = (import.meta as any).env.VITE_API_BASE || "http://localhost:8000";
  const res = await fetch(`${base}/run`,{method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(seed)});
  return res.json();
}
```

`frontend/src/App.tsx`
```tsx
import React, { useState } from 'react'
import { run } from './api'

type Cluster = { label:string; keywords:string[]; top_colors:string[]; support_n:number; examples:string[] }

export default function App(){
  const [loading, setLoading] = useState(false)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [brief, setBrief] = useState('')

  async function onRun(){
    setLoading(true)
    const data = await run({ season: 'SS25', keywords:['olive','organza','pleated'] })
    setClusters(data.clusters)
    setBrief(data.brief_md)
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-4">Trent — Concept to Catwalk</h1>
      <button onClick={onRun} className="px-4 py-2 rounded-2xl shadow bg-black text-white">{loading?'Running…':'Run Demo'}</button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="rounded-2xl p-4 shadow bg-white">
          <h2 className="text-xl font-semibold mb-2">Top Clusters</h2>
          <ul className="space-y-3">
            {clusters.map((c,i)=> (
              <li key={i} className="border rounded-xl p-3">
                <div className="font-medium">{c.keywords.join(', ') || c.label}</div>
                <div className="text-sm opacity-70">Support: {c.support_n}</div>
                <div className="flex gap-2 mt-2">
                  {c.top_colors.map((clr,j)=> (
                    <span key={j} className="w-6 h-6 rounded" style={{background:clr}} title={clr}></span>
                  ))}
                </div>
                <div className="text-xs mt-2 break-all">{c.examples.join(', ')}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl p-4 shadow bg-white">
          <h2 className="text-xl font-semibold mb-2">Brief (Markdown)</h2>
          <pre className="text-sm whitespace-pre-wrap">{brief}</pre>
        </div>
      </div>
    </div>
  )
}
```

`frontend/index.html`
```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script type="module" src="/src/App.tsx"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      import React from 'react'
      import { createRoot } from 'react-dom/client'
      import App from '/src/App'
      createRoot(document.getElementById('root')).render(React.createElement(App))
    </script>
  </body>
</html>
```

---

## 8) IG Graph API (Stub) & YouTube (Metadata‑only) — Placeholders

`app/agents/ig_stub.py`
```python
# Outline: when IG credentials are provided, call Graph API for owned accounts.
# Implement /me/accounts -> /{ig-user-id}/media -> fields=caption,media_url,timestamp,permalink,like_count,comments_count
# Store only URLs + derived metrics, avoid PII.
```

`app/agents/video_stub.py`
```python
# Outline: YouTube Data API v3 for public metadata (title, tags, thumbnails, publishedAt)
# Frame sampling is out of scope for the PoC; add in Phase 2.
```

---

## 9) Running the PoC

1. Copy `.env.example` to `.env` and keep `CRAWL_ENABLE_EXTERNAL=false` for demo.
2. `docker compose up --build` (first run installs Playwright Chromium).
3. Open UI at `http://localhost:5173` and click **Run Demo**.

You’ll see clusters derived from the **fixtures** and a generated **brief**. Switch to real crawling by setting `CRAWL_ENABLE_EXTERNAL=true` and ensuring compliance approvals + `RESPECT_ROBOTS=true` logic implemented.

---

## 10) Extending to Full Spec

- **Discovery Agents**: Swap `web_search_curator` to a proper search API wrapper with freshness (site:domain, recency window).
- **Fetcher**: Add robots.txt parser and per‑domain token bucket; rotate fingerprints.
- **Parser**: Site adapters for common fashion lookbooks/retailers; language detection.
- **Vision**: Replace `sentence-transformers` with **OpenCLIP**; add SAM2/DepthAnything V2 for silhouette tags; persist `clip_vec` in `vision_features`.
- **Engagement Normalizer**: Compute per‑follower/time rates where allowed; store in `metrics`.
- **Governance**: Implement removal API: if a source disappears, purge associated derived rows.
- **Exports**: Add `/export.csv` and Parquet endpoints (DuckDB) + signed URLs from MinIO.
- **Orchestration**: Switch to Temporal for durable workflows and budgets.

---

## 11) Notes on Compliance & Data Minimization

- Prefer official APIs for owned assets (IG Graph, YouTube Data).
- For public‑web, store **URLs, timestamps, derived features (embeddings, palettes, cluster labels)**. Avoid raw commenter names, DMs, emails, etc.
- Honor removals; keep audit logs.
- Apply deterministic sampling to minimize collection volume.

---

## 12) Example Seed to Test via cURL

```bash
curl -X POST http://localhost:8000/run \
  -H 'Content-Type: application/json' \
  -d '{"season":"SS25","keywords":["olive","organza","pleated"],"competitors":["brandA","brandB"]}'
```

---

## 13) What You’ll Demo (Semi‑Finals)

- Kick off a **seeded run** live, show **clusters** + **color palettes** + **exemplars**.
- Open the **Brief** and export to Markdown/CSV (simple copy for PoC).
- Talk through **Policy Guard**, **Rate limiting**, **Audit log**, and next steps for full multi‑agent expansion.



---

## Sprint 0 — Project Bootstrap (End‑to‑End “Hello World”)

**Goal:** Get both **backend** (FastAPI) and **frontend** (Vite React + Tailwind) running locally with a working `/run` pipeline stub.

### Prereqs
- **Python 3.10+** (3.11 recommended)
- **Node 18+** (or 20+)
- (Optional) **Postman**/**cURL** for testing API

### Folder layout (you already created)
```
Trent PoC/
├─ backend/
└─ frontend/
```

---

### 1) Backend (FastAPI) — minimal API

**Files to create under `backend/`:**

`backend/requirements.txt`
```txt
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic==2.8.2
```

`backend/app/main.py`
```python
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import date

class Seed(BaseModel):
    season: str | None = None
    keywords: list[str] = []

app = FastAPI(title="Trent PoC API")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/run")
def run(seed: Seed):
    # Minimal deterministic stub — we’ll replace with agents next sprint
    clusters = [
        {
            "label": "cluster_0",
            "keywords": seed.keywords or ["olive", "organza", "pleated"],
            "top_colors": ["#6B8E23", "#708090", "#F5F5DC"],
            "support_n": 3,
            "examples": ["fixture/look1", "fixture/look2", "fixture/look3"],
        }
    ]
    brief = (
        f"# Trend Brief — {date.today()}

"
        f"**Season**: {seed.season or 'NA'}

"
        f"**Keywords**: {', '.join(seed.keywords) if seed.keywords else 'olive, organza, pleated'}

"
        f"## Top Clusters
"
        f"### {', '.join(clusters[0]['keywords'])}
"
        f"- Support: {clusters[0]['support_n']}
"
        f"- Palette: {' '.join(clusters[0]['top_colors'])}
"
        f"- Exemplars: {', '.join(clusters[0]['examples'])}
"
    )
    return {"clusters": clusters, "brief_md": brief}
```

**Run it:**
```bash
cd "Trent PoC/backend"
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Visit: http://localhost:8000/health → `{ "status": "ok" }`

---

### 2) Frontend (Vite + React + Tailwind)

**Files to create under `frontend/`:**

`frontend/package.json`
```json
{
  "name": "trent-poc-ui",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "10.4.20",
    "postcss": "8.4.47",
    "tailwindcss": "3.4.10",
    "typescript": "5.5.4",
    "vite": "5.4.1"
  }
}
```

`frontend/index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trent — Concept to Catwalk (PoC)</title>
  </head>
  <body class="bg-gray-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`frontend/vite.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], server: { port: 5173 } })
```

`frontend/tailwind.config.cjs`
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

`frontend/postcss.config.cjs`
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

`frontend/src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`frontend/src/api.ts`
```ts
export async function run(seed: any){
  const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
  const res = await fetch(`${base}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seed) });
  if(!res.ok) throw new Error(`API error ${res.status}`)
  return res.json();
}
```

`frontend/src/App.tsx`
```tsx
import React, { useState } from 'react'
import { run } from './api'
import './index.css'

type Cluster = { label:string; keywords:string[]; top_colors:string[]; support_n:number; examples:string[] }

export default function App(){
  const [loading, setLoading] = useState(false)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [brief, setBrief] = useState('')
  const [season, setSeason] = useState('SS25')
  const [keywords, setKeywords] = useState('olive, organza, pleated')

  async function onRun(){
    try{
      setLoading(true)
      const seed = { season, keywords: keywords.split(',').map(s=>s.trim()).filter(Boolean) }
      const data = await run(seed)
      setClusters(data.clusters)
      setBrief(data.brief_md)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-2">Trent — Concept to Catwalk</h1>
      <p className="text-sm text-gray-600 mb-4">Sprint 0 demo — end‑to‑end stub</p>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end mb-4">
        <div>
          <label className="text-sm block mb-1">Season</label>
          <input value={season} onChange={e=>setSeason(e.target.value)} className="border rounded-xl px-3 py-2" />
        </div>
        <div className="flex-1">
          <label className="text-sm block mb-1">Keywords (comma‑sep)</label>
          <input value={keywords} onChange={e=>setKeywords(e.target.value)} className="border rounded-xl px-3 py-2 w-full" />
        </div>
        <button onClick={onRun} disabled={loading} className="px-4 py-2 rounded-2xl shadow bg-black text-white">{loading? 'Running…' : 'Run'}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-4 shadow bg-white">
          <h2 className="text-xl font-semibold mb-2">Top Clusters</h2>
          {clusters.length===0 && <div className="text-gray-500 text-sm">No clusters yet.</div>}
          <ul className="space-y-3">
            {clusters.map((c,i)=> (
              <li key={i} className="border rounded-xl p-3">
                <div className="font-medium">{c.keywords?.join(', ') || c.label}</div>
                <div className="text-sm opacity-70">Support: {c.support_n}</div>
                <div className="flex gap-2 mt-2">
                  {c.top_colors?.map((clr,j)=> (
                    <span key={j} className="w-6 h-6 rounded" style={{background:clr}} title={clr}></span>
                  ))}
                </div>
                <div className="text-xs mt-2 break-all">{c.examples?.join(', ')}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl p-4 shadow bg-white">
          <h2 className="text-xl font-semibold mb-2">Brief</h2>
          <pre className="text-sm whitespace-pre-wrap">{brief}</pre>
        </div>
      </div>
    </div>
  )
}
```

`frontend/src/main.tsx`
```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
```

**Run it:**
```bash
cd "Trent PoC/frontend"
npm install
# optional: set API base (defaults to http://localhost:8000)
# echo "VITE_API_BASE=http://localhost:8000" > .env.local
npm run dev
```
Open: http://localhost:5173

---

### 3) Sanity checklist
- Backend `GET /health` returns `{status: "ok"}`
- Frontend loads, click **Run**, clusters & brief render
- If CORS errors: backend must be running on 8000; try hard refresh

---

### 4) Next sprint preview
- Introduce **Agent base class** + **Orchestrator** skeleton
- Add **fixtures** + **parser** + **palette extractor** (no external crawling yet)
- Add **clusterer** + **brief writer** (real logic)
- Wire minimal persistence (SQLite → Postgres/pgvector later)

