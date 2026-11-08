import json
import logging
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Live Flight Tracker API (OpenSky Network)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration center point (Vienna Area Airspace)
DEFAULT_CENTER_LAT = 48.15
DEFAULT_CENTER_LON = 16.50
DEFAULT_LAT_RADIUS = 0.8
DEFAULT_LON_RADIUS = 1.2

CACHE_TTL_SECONDS = 8.0
_cached_flights: List["FlightState"] = []
_last_fetch_time: float = 0.0
_aircraft_type_cache: Dict[str, Optional[str]] = {}
_route_cache: Dict[str, Optional[Dict[str, Optional[str]]]] = {}


class FlightState(BaseModel):
    icao24: str
    callsign: str
    origin_country: str
    longitude: float
    latitude: float
    altitude: Optional[float]
    on_ground: bool
    velocity: Optional[float]
    heading: Optional[float]
    vertical_rate: Optional[float] = None
    aircraft_type: Optional[str] = None
    origin_iata: Optional[str] = None
    origin_icao: Optional[str] = None
    origin_name: Optional[str] = None
    origin_city: Optional[str] = None
    destination_iata: Optional[str] = None
    destination_icao: Optional[str] = None
    destination_name: Optional[str] = None
    destination_city: Optional[str] = None


def lookup_aircraft_type(icao: str) -> Optional[str]:
    """Look up aircraft type and model from public aviation metadata APIs with fallback."""
    icao_lower = icao.lower()
    if icao_lower in _aircraft_type_cache:
        return _aircraft_type_cache[icao_lower]

    # Primary lookup via adsbdb
    try:
        url = f"https://api.adsbdb.com/v0/aircraft/{icao_lower}"
        req = urllib.request.Request(url, headers={"User-Agent": "FlightTrackerApp/1.0"})
        with urllib.request.urlopen(req, timeout=1.8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            ac = data.get("response", {}).get("aircraft", {})
            model = ac.get("type") or ac.get("model") or ac.get("icao_type")
            if model:
                _aircraft_type_cache[icao_lower] = model
                return model
    except Exception:
        pass

    # Secondary fallback via hexdb
    try:
        url = f"https://hexdb.io/api/v1/aircraft/{icao_lower}"
        req = urllib.request.Request(url, headers={"User-Agent": "FlightTrackerApp/1.0"})
        with urllib.request.urlopen(req, timeout=1.8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            model = data.get("Type") or data.get("ICAOTypeCode")
            if model:
                _aircraft_type_cache[icao_lower] = model
                return model
    except Exception:
        pass

    _aircraft_type_cache[icao_lower] = None
    return None


def lookup_flight_route(callsign: str) -> Optional[Dict[str, Optional[str]]]:
    """Look up flight origin and destination airport from adsbdb API with caching."""
    cs_clean = callsign.strip().upper()
    if not cs_clean or len(cs_clean) < 3:
        return None
    if cs_clean in _route_cache:
        return _route_cache[cs_clean]

    try:
        url = f"https://api.adsbdb.com/v0/callsign/{cs_clean}"
        req = urllib.request.Request(url, headers={"User-Agent": "FlightTrackerApp/1.0"})
        with urllib.request.urlopen(req, timeout=1.8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            route = data.get("response", {}).get("flightroute", {})
            origin_info = route.get("origin", {})
            dest_info = route.get("destination", {})

            orig_iata = origin_info.get("iata_code")
            orig_icao = origin_info.get("icao_code")
            orig_name = origin_info.get("name")
            orig_city = origin_info.get("municipality")

            dest_iata = dest_info.get("iata_code")
            dest_icao = dest_info.get("icao_code")
            dest_name = dest_info.get("name")
            dest_city = dest_info.get("municipality")

            if orig_iata or orig_icao or dest_iata or dest_icao:
                route_res = {
                    "origin_iata": orig_iata,
                    "origin_icao": orig_icao,
                    "origin_name": orig_name,
                    "origin_city": orig_city,
                    "destination_iata": dest_iata,
                    "destination_icao": dest_icao,
                    "destination_name": dest_name,
                    "destination_city": dest_city,
                }
                _route_cache[cs_clean] = route_res
                return route_res
    except Exception:
        pass

    _route_cache[cs_clean] = None
    return None


def fetch_opensky_flights(lamin: float, lomin: float, lamax: float, lomax: float) -> List[FlightState]:
    url = (
        f"https://opensky-network.org/api/states/all"
        f"?lamin={lamin:.4f}&lomin={lomin:.4f}&lamax={lamax:.4f}&lomax={lomax:.4f}"
    )
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "FlightTrackerDashboard/1.0"}
    )

    with urllib.request.urlopen(req, timeout=6) as response:
        data = json.loads(response.read().decode("utf-8"))

    raw_states = data.get("states") or []
    flights: List[FlightState] = []
    uncached_icaos = []
    uncached_callsigns = []

    for state in raw_states:
        # State vector indices per OpenSky Network API:
        # 0: icao24, 1: callsign, 2: origin_country, 5: longitude, 6: latitude,
        # 7: baro_altitude (m), 8: on_ground, 9: velocity (m/s), 10: true_track (deg), 13: geo_altitude (m)
        lon = state[5]
        lat = state[6]
        if lon is None or lat is None:
            continue

        raw_icao = str(state[0] or "UNKNOWN").lower()
        raw_callsign = state[1]
        callsign = raw_callsign.strip() if isinstance(raw_callsign, str) and raw_callsign.strip() else raw_icao.upper()
        country = state[2] or "Unknown"

        # Convert altitude from meters to feet
        baro_alt = state[7] if state[7] is not None else state[13]
        altitude_ft = round(baro_alt * 3.28084, 1) if baro_alt is not None else None

        on_ground = bool(state[8])

        # Convert velocity from m/s to knots
        raw_velocity = state[9]
        velocity_kts = round(raw_velocity * 1.94384, 1) if raw_velocity is not None else None

        heading = round(state[10], 1) if state[10] is not None else None

        # Convert vertical rate from m/s to ft/min
        raw_vert_rate = state[11]
        vertical_rate_fpm = round(raw_vert_rate * 196.85, 1) if raw_vert_rate is not None else None

        if raw_icao not in _aircraft_type_cache:
            uncached_icaos.append(raw_icao)

        route_info = _route_cache.get(callsign)
        if route_info is None and callsign not in _route_cache:
            uncached_callsigns.append(callsign)

        flights.append(
            FlightState(
                icao24=raw_icao,
                callsign=callsign,
                origin_country=country,
                longitude=float(lon),
                latitude=float(lat),
                altitude=altitude_ft,
                on_ground=on_ground,
                velocity=velocity_kts,
                heading=heading,
                vertical_rate=vertical_rate_fpm,
                aircraft_type=_aircraft_type_cache.get(raw_icao),
                origin_iata=route_info.get("origin_iata") if route_info else None,
                origin_icao=route_info.get("origin_icao") if route_info else None,
                origin_name=route_info.get("origin_name") if route_info else None,
                origin_city=route_info.get("origin_city") if route_info else None,
                destination_iata=route_info.get("destination_iata") if route_info else None,
                destination_icao=route_info.get("destination_icao") if route_info else None,
                destination_name=route_info.get("destination_name") if route_info else None,
                destination_city=route_info.get("destination_city") if route_info else None,
            )
        )

    # Resolve any uncached aircraft types in parallel
    if uncached_icaos:
        with ThreadPoolExecutor(max_workers=min(12, len(uncached_icaos))) as executor:
            resolved_types = list(executor.map(lookup_aircraft_type, uncached_icaos))
        type_mapping = dict(zip(uncached_icaos, resolved_types))
        for flight in flights:
            if flight.aircraft_type is None and flight.icao24 in type_mapping:
                flight.aircraft_type = type_mapping[flight.icao24]

    # Resolve any uncached flight routes in parallel
    if uncached_callsigns:
        unique_callsigns = list(dict.fromkeys(uncached_callsigns))
        with ThreadPoolExecutor(max_workers=min(12, len(unique_callsigns))) as executor:
            resolved_routes = list(executor.map(lookup_flight_route, unique_callsigns))
        route_mapping = dict(zip(unique_callsigns, resolved_routes))
        for flight in flights:
            if flight.callsign in route_mapping:
                r = route_mapping[flight.callsign]
                if r:
                    flight.origin_iata = r.get("origin_iata")
                    flight.origin_icao = r.get("origin_icao")
                    flight.origin_name = r.get("origin_name")
                    flight.origin_city = r.get("origin_city")
                    flight.destination_iata = r.get("destination_iata")
                    flight.destination_icao = r.get("destination_icao")
                    flight.destination_name = r.get("destination_name")
                    flight.destination_city = r.get("destination_city")

    return flights


@app.get("/api/flights", response_model=List[FlightState])
def get_local_flights(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius: Optional[float] = None,
):
    global _cached_flights, _last_fetch_time

    center_lat = lat if isinstance(lat, (int, float)) else DEFAULT_CENTER_LAT
    center_lon = lon if isinstance(lon, (int, float)) else DEFAULT_CENTER_LON
    lat_radius = radius if isinstance(radius, (int, float)) else DEFAULT_LAT_RADIUS
    lon_radius = (lat_radius * 1.5) if isinstance(radius, (int, float)) else DEFAULT_LON_RADIUS

    now = time.time()
    # Serve cached response if within TTL and cache is populated
    if now - _last_fetch_time < CACHE_TTL_SECONDS and _cached_flights:
        return _cached_flights

    try:
        flights = fetch_opensky_flights(
            lamin=center_lat - lat_radius,
            lomin=center_lon - lon_radius,
            lamax=center_lat + lat_radius,
            lomax=center_lon + lon_radius,
        )
        _cached_flights = flights
        _last_fetch_time = now
        return flights
    except Exception as exc:
        logger.warning(f"OpenSky Network fetch error: {exc}. Returning cached flight data.")
        if _cached_flights:
            return _cached_flights
        return []


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
