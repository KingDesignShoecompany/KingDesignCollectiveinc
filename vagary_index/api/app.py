#!/usr/bin/env python3
"""VagaryIndex API — stdlib only, zero external deps."""

from http.server import HTTPServer, ThreadingHTTPServer, BaseHTTPRequestHandler
from json import dumps, loads
from pathlib import Path
import re
import urllib.parse
import os

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
SCHEMA = BASE.parent / "schema" / "vagary_index_country_schema.json"
BATCH = BASE.parent / "batch_output"
VISITED_PATH = DATA / "visited.json"
POIS_PATH = DATA / "pois.json"

# Cache
_countries = []
_schema_text = ""


# --- Mutable stores (always read fresh from disk — they are tiny) -----------


def load_visited() -> dict:
    return _read_json(VISITED_PATH, {})


def save_visited(store: dict) -> dict:
    tmp = VISITED_PATH.with_suffix(".json.tmp")
    tmp.write_text(dumps(store, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, VISITED_PATH)
    return store


def load_pois() -> dict:
    return _read_json(POIS_PATH, {})


def _sanitize_code(code) -> str:
    """Uppercase 3-letter ISO3 only. Returns "" for anything unsafe."""
    if not isinstance(code, str):
        return ""
    code = code.strip()
    if not re.match(r"^[A-Za-z]{3}$", code):
        return ""
    return code.upper()


def _roster_names() -> dict:
    """CODE -> country name from the master roster (used when data/<CODE>.json
    is absent — e.g. JPN/PHL/USA only live in batch_output/<CODE>/)."""
    if _roster_names.cache is None:
        _roster_names.cache = {}
        roster_path = BASE.parent / "country_roster_master.json"
        if roster_path.exists():
            try:
                raw = loads(roster_path.read_text(encoding="utf-8-sig"))
                for c in raw.get("countries", []):
                    code = (c.get("iso3") or c.get("code") or "").upper()
                    if code:
                        _roster_names.cache[code] = str(c.get("name") or "").strip()
            except Exception:
                pass
    return _roster_names.cache


_roster_names.cache = None


def _country_name(code: str) -> str:
    country = _read_json(DATA / f"{code}.json", None)
    if isinstance(country, dict):
        name = str(country.get("country_name") or "").strip()
        if name:
            return name
    return _roster_names().get(code, "")


def _find_raster(code: str, bio: str):
    """Locate the heat raster PNG for a country. Returns a safe Path or None.

    Resolution order: exact "<CountryName>_thermal_bio<N>.png" across every
    *_rasters folder, then a case-insensitive match on the country name, then
    a token match (first word of the name). Never a blanket "first file in
    folder wins" fallback — that would serve the wrong country's raster.
    """
    name = _country_name(code)
    if not BATCH.exists():
        return None
    folders = [p for p in sorted(BATCH.glob("*_rasters")) if p.is_dir()]
    suffix = f"_thermal_bio{bio}.png"

    candidates = []
    if name:
        candidates.append(name)
        low = name.lower()
        candidates.append(low)
        # token fallback e.g. "United States of America" -> "united"
        for tok in re.split(r"[\s_]+", low):
            if len(tok) >= 4:
                candidates.append(tok)
                break

    for cand in candidates:
        for p in folders:
            f = p / f"{cand}{suffix}"
            if f.is_file():
                return f
    # case-insensitive scan restricted to the candidate names
    lows = {c.lower() for c in candidates}
    for p in folders:
        for f in p.glob("*_thermal_bio*.png"):
            if f.name.lower() in {c + suffix for c in lows}:
                return f
    return None


def _cors_headers(self):
    self.send_header("Access-Control-Allow-Origin", "*")
    self.send_header("Access-Control-Allow-Headers", "Content-Type")
    self.send_header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")


def _binary(self, code: int, body: bytes, content_type: str):
    self.send_response(code)
    self.send_header("Content-Type", content_type)
    self.send_header("Content-Length", str(len(body)))
    _cors_headers(self)
    self.end_headers()
    if self.command != "HEAD":
        self.wfile.write(body)


def _bad_request(self, message: str):
    self._json(400, {"error": message})


def _read_body_json(self) -> dict:
    try:
        length = int(self.headers.get("Content-Length") or 0)
    except ValueError:
        length = 0
    if length <= 0 or length > 1_000_000:
        return {}
    try:
        payload = loads(self.rfile.read(length).decode("utf-8"))
    except Exception:
        return {}
    return payload if isinstance(payload, dict) else {}


def _query_params(self) -> dict:
    if "?" not in self.path:
        return {}
    return urllib.parse.parse_qs(self.path.split("?", 1)[1])


def load_countries():
    global _countries
    if _countries:
        return _countries
    _countries = []
    seen = set()
    # Unified cached payloads
    for p in sorted(DATA.glob("*.json")):
        try:
            data = loads(p.read_text(encoding="utf-8"))
            item = {
                "code": data.get("country_code"),
                "name": data.get("country_name"),
                "region": data.get("region"),
                "source": "unified",
            }
            _countries.append(item)
            if item["code"]:
                seen.add(item["code"].upper())
        except Exception:
            pass
    # Fallback batch_output folders
    BATCH = BASE.parent / "batch_output"
    ROSTER_PATH = BASE.parent / "country_roster_master.json"
    roster = {}
    if ROSTER_PATH.exists():
        try:
            raw = loads(ROSTER_PATH.read_text(encoding="utf-8-sig"))
            for c in raw.get("countries", []):
                code = (c.get("iso3") or c.get("code") or "").upper()
                if code:
                    roster[code] = {
                        "name": c.get("name") or code,
                        "region": c.get("region") or "",
                    }
        except Exception:
            pass
    for p in sorted(BATCH.iterdir()):
        if p.is_dir() and re.match(r"^[A-Z]{3}$", p.name):
            code = p.name.upper()
            if code in seen:
                continue
            meta = roster.get(code, {})
            _countries.append({
                "code": code,
                "name": meta.get("name", code),
                "region": meta.get("region", ""),
                "source": "stub",
            })
    return _countries


def load_country(code: str):
    # First try cached unified JSON
    p = DATA / f"{code.upper()}.json"
    if p.exists():
        try:
            return loads(p.read_text(encoding="utf-8"))
        except Exception:
            pass

    # Fallback: assemble unified payload from canonical batch_output assets
    BATCH = BASE.parent / "batch_output"
    folder = BATCH / code.upper()
    if not folder.exists():
        return None
    out = {"country_code": code.upper()}
    # name from sources or entry_requirements stub
    out.setdefault("country_name", code.upper())
    out["entry_requirements"] = _read_json(folder / f"{code.upper()}_entry_requirements.json", default={"visa_required": None, "visa_free_duration_days": 0, "passport_validity": "6 months beyond stay", "notes": []})
    out["attractions"] = _read_json(folder / f"{code.upper()}_attractions.json", default=[])
    out["fun_facts"] = _read_json(folder / f"{code.upper()}_fun_facts.json", default=[])
    out["history_culture"] = _read_text(folder / f"{code.upper()}_history_culture.md", default="") or ""
    out["itineraries_couples"] = _read_json(folder / f"{code.upper()}_itineraries_couples.json", default={"days": []})
    out["itineraries_solo"] = _read_json(folder / f"{code.upper()}_itineraries_solo.json", default={"days": []})
    out["phrase_cards"] = _read_json(folder / f"{code.upper()}_phrase_cards.json", default={})
    out["top10_experiences"] = _read_json(folder / f"{code.upper()}_top10_experiences.json", default=[])
    out["sources"] = _read_json(folder / f"{code.upper()}_sources.json", default={"primary": [], "secondary": []})
    out["climate"] = _build_climate_from_md(
        _read_text(folder / f"{code.upper()}_climate.md", default="")
    )
    out["food_culture"] = _read_text(folder / f"{code.upper()}_food_culture.md", default="")
    out["logistics"] = _read_text(folder / f"{code.upper()}_logistics.md", default="")
    out["safety"] = _read_text(folder / f"{code.upper()}_safety.md", default="")
    out.setdefault("region", "")
    out.setdefault("capitalCity", "")
    out.setdefault("latitude", None)
    out.setdefault("longitude", None)
    return out


def _read_json(path: Path, default):
    if path.exists():
        try:
            return loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return default


def _read_text(path: Path, default: str) -> str:
    if path.exists():
        try:
            return path.read_text(encoding="utf-8")
        except Exception:
            pass
    return default


def _build_climate_from_md(md: str) -> dict:
    out = {"best_travel_months": "", "beach_season": "", "mountain_season": "", "avoid": ""}
    if not md:
        return out
    for key in out:
        needle = f"{key.replace('_', ' ').title()}: "
        if needle in md:
            out[key] = md.split(needle, 1)[1].split("\n", 1)[0].strip()
    return out


def load_schema():
    global _schema_text
    if _schema_text:
        return _schema_text
    if SCHEMA.exists():
        _schema_text = SCHEMA.read_text(encoding="utf-8")
    else:
        _schema_text = ""
    return _schema_text


class VagaryHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(fmt % args)

    def _json(self, code: int, payload):
        body = dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        _cors_headers(self)
        self.end_headers()
        self.wfile.write(body)

    # Delegating method shims (logic lives in module-level helpers so it can
    # be unit-tested without an HTTP request in hand)
    def _binary(self, code: int, body: bytes, content_type: str):
        _binary(self, code, body, content_type)

    def _read_body_json(self) -> dict:
        return _read_body_json(self)

    def _query_params(self) -> dict:
        return _query_params(self)

    def _bad_request(self, message: str):
        self._json(400, {"error": message})

    def do_HEAD(self):
        self.do_GET()

    def do_OPTIONS(self):
        self._json(200, {"ok": True, "methods": ["GET", "POST", "DELETE", "OPTIONS"]})

    def do_POST(self):
        path = self.path.split("?")[0]

        if path == "/visited":
            payload = self._read_body_json()
            code = _sanitize_code(payload.get("code"))
            if not code:
                return self._bad_request("code must be 3 letters")
            state = payload.get("state", None)
            if state is not None:
                state = str(state).strip().lower()
                if state not in ("visited", "want"):
                    return self._bad_request("state must be 'visited', 'want', or null")
            store = load_visited()
            if state is None:
                store.pop(code, None)
            else:
                store[code] = state
            save_visited(store)
            return self._json(200, {"code": code, "state": state, "store": store})

        return self._json(404, {"error": "not found", "path": path})

    def do_DELETE(self):
        path = self.path.split("?")[0]

        if path == "/visited":
            code = _sanitize_code((self._query_params().get("code") or [""])[0])
            if not code:
                return self._bad_request("code must be 3 letters")
            store = load_visited()
            store.pop(code, None)
            save_visited(store)
            return self._json(200, {"code": code, "state": None, "store": store})

        return self._json(404, {"error": "not found", "path": path})

    def do_GET(self):
        path = self.path.split("?")[0]

        # Health
        if path == "/health":
            return self._json(200, {"status": "ok"})

        # Schema
        if path == "/schema":
            txt = load_schema()
            if not txt:
                return self._json(404, {"error": "schema not found"})
            return self._json(200, loads(txt))

        # List countries
        if path == "/countries":
            return self._json(200, {"count": len(load_countries()), "items": load_countries()})

        # Single country unified
        m = re.match(r"^/countries/([A-Za-z]{3})$", path)
        if m:
            code = m.group(1).upper()
            data = load_country(code)
            if data is None:
                return self._json(404, {"error": f"country {code} not found"})
            return self._json(200, data)

        # Scoped endpoints
        m = re.match(r"^/countries/([A-Za-z]{3})/(climate|attractions|phrases|itineraries|funfacts|entry|safety|logistics|food|history|sources|top10)$", path)
        if m:
            code, key = m.group(1).upper(), m.group(2)
            data = load_country(code)
            if not data:
                return self._json(404, {"error": f"country {code} not found"})
            aliases = {
                "climate": "climate",
                "attractions": "attractions",
                "phrases": "phrase_cards",
                "itineraries": "itineraries_couples",
                "funfacts": "fun_facts",
                "entry": "entry_requirements",
                "safety": "safety",
                "logistics": "logistics",
                "food": "food_culture",
                "history": "history_culture",
                "sources": "sources",
                "top10": "top10_experiences",
            }
            field = aliases.get(key)
            if not field:
                return self._json(404, {"error": f"unknown field {key}"})
            payload = data.get(field)
            if payload is None:
                # Fallbacks for legacy stubs
                if key == "itineraries":
                    payload = {
                        "couples": data.get("itineraries_couples"),
                        "solo": data.get("itineraries_solo"),
                        "families": data.get("itineraries_families"),
                    }
            return self._json(200, {key: payload})

        # Regions listing
        if path == "/regions":
            items = load_countries()
            regions = {}
            for it in items:
                r = (it.get("region") or "Unknown").strip()
                regions.setdefault(r, []).append(it)
            return self._json(200, {"count": len(regions), "regions": regions})

        # Region by name
        m = re.match(r"^/regions/([^/]+)$", path)
        if m:
            raw = urllib.parse.unquote(m.group(1))
            items = load_countries()
            matched = [it for it in items if (it.get("region") or "").strip().lower() == raw.lower()]
            return self._json(200, {"region": raw, "count": len(matched), "items": matched})

        # Search
        if path == "/search":
            query = ""
            if "?" in self.path:
                qs = urllib.parse.parse_qs(self.path.split("?", 1)[1])
                query = (qs.get("q") or [""])[0].strip().lower()
            if not query:
                return self._json(200, {"count": 0, "items": []})
            items = load_countries()
            matched = []
            for it in items:
                hay = f"{it.get('code','')} {it.get('name','')} {it.get('region','')}".lower()
                if query in hay:
                    matched.append(it)
            return self._json(200, {"count": len(matched), "query": query, "items": matched})

        # Asset search
        m = re.match(r"^/search/(climate|attractions|phrases|itineraries|funfacts|entry|safety|logistics|food|history|sources|top10)$", path)
        if m:
            key = m.group(1)
            query = ""
            if "?" in self.path:
                qs = urllib.parse.parse_qs(self.path.split("?", 1)[1])
                query = (qs.get("q") or [""])[0].strip().lower()
            aliases = {
                "climate": "climate",
                "attractions": "attractions",
                "phrases": "phrase_cards",
                "itineraries": "itineraries_couples",
                "funfacts": "fun_facts",
                "entry": "entry_requirements",
                "safety": "safety",
                "logistics": "logistics",
                "food": "food_culture",
                "history": "history_culture",
                "sources": "sources",
                "top10": "top10_experiences",
            }
            field = aliases.get(key)
            matched = []
            for it in load_countries():
                code = it.get("code")
                if not code:
                    continue
                data = load_country(code)
                if not data:
                    continue
                value = data.get(field)
                if value is None:
                    continue
                text = ""
                if isinstance(value, str):
                    text = value
                elif isinstance(value, list):
                    text = " ".join(str(x) for x in value)
                elif isinstance(value, dict):
                    text = " ".join(f"{k}: {v}" for k, v in value.items())
                if query in text.lower():
                    matched.append({"code": code, "name": it.get("name"), "match": text[:220]})
            return self._json(200, {"count": len(matched), "query": query, "field": field, "items": matched})

        # Ingestion hook stub
        m = re.match(r"^/ingest/([A-Za-z]{3})$", path)
        if m:
            code = m.group(1).upper()
            return self._json(202, {"queued": True, "code": code, "note": "Run scripts/ingest_country.py --code " + code})

        # Visited-state store
        if path == "/visited":
            return self._json(200, load_visited())

        # Heat raster PNG
        m = re.match(r"^/raster/([A-Za-z]{3})/([156])$", path)
        if m:
            code = _sanitize_code(m.group(1))
            bio = m.group(2)
            if not code:
                return self._bad_request("code must be 3 letters")
            raster = _find_raster(code, bio)
            if raster is None:
                return self._json(404, {"error": f"raster {code}/bio{bio} not found"})
            return self._binary(200, raster.read_bytes(), "image/png")

        # Points of interest (SAMPLE data, local only)
        m = re.match(r"^/pois/([A-Za-z]{3})$", path)
        if m:
            code = _sanitize_code(m.group(1))
            if not code:
                return self._bad_request("code must be 3 letters")
            pois = load_pois()
            if code not in pois:
                return self._json(404, {"error": f"no POI data for {code}", "sample": True})
            return self._json(200, {"code": code, **pois[code]})

        return self._json(404, {"error": "not found", "path": path})


def run(host="0.0.0.0", port=8080):
    # ThreadingHTTPServer: handle requests concurrently. The single-threaded
    # HTTPServer blocks on one request (e.g. a slow raster or kept-alive conn),
    # which wedges the healthcheck and times out every other request.
    server = ThreadingHTTPServer((host, port), VagaryHandler)
    server.daemon_threads = True
    print(f"VagaryIndex API running at http://{host}:{port}")
    print("Endpoints:")
    print("  GET /health")
    print("  GET /schema")
    print("  GET /countries")
    print("  GET /countries/{ISO3}")
    print("  GET /countries/{ISO3}/{climate|attractions|phrases|itineraries|funfacts|entry|safety|logistics|food|history|sources|top10}")
    print("  GET /regions")
    print("  GET /regions/{region}")
    print("  GET /search?q=")
    print("  GET /search/{field}?q=")
    print("  GET /ingest/{ISO3}")
    print("  GET|POST|DELETE /visited")
    print("  GET /raster/{ISO3}/{bio1|bio5|bio6}")
    print("  GET /pois/{ISO3}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
