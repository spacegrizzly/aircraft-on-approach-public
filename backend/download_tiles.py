import os
import math
import time
import hashlib
import random
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# Known SHA256 hashes of invalid placeholder / rate-limit images
INVALID_TILE_HASHES = {
    "b02c44252dac5a5e820ecef1e9bf9200e9407c042df668a466a1aa81a9ecca7a",  # OSM "Access blocked" tile (6,987 bytes)
    "69be4aecf9f814ba45d585801a5aa41e79b16fc88eafec5b1954a9f06a69e6be",  # 2,049-byte dummy tile
}

# Reliable OSM tile mirrors for Central Europe (Austria / Vienna)
TILE_MIRRORS = [
    "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    "https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    "https://b.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
]


def deg2num(lat_deg: float, lon_deg: float, zoom: int):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return xtile, ytile


def is_valid_tile_file(file_path: Path) -> bool:
    """Checks if file exists, is non-empty, and is a valid map tile."""
    if not file_path.exists() or file_path.stat().st_size < 1000:
        return False
    if file_path.stat().st_size in (6987, 2049):
        return False
    try:
        content = file_path.read_bytes()
        h = hashlib.sha256(content).hexdigest().lower()
        if h in INVALID_TILE_HASHES:
            return False
        # Basic PNG header validation: \x89PNG\r\n\x1a\n
        if not content.startswith(b"\x89PNG\r\n\x1a\n"):
            return False
        return True
    except Exception:
        return False


def fetch_single_tile(item):
    z, x, y, base_dir = item
    tile_file = base_dir / str(z) / str(x) / f"{y}.png"

    if is_valid_tile_file(tile_file):
        return "skipped"

    # Remove corrupted / blocked file if it existed
    if tile_file.exists():
        try:
            tile_file.unlink()
        except Exception:
            pass

    tile_file.parent.mkdir(parents=True, exist_ok=True)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }

    for mirror in TILE_MIRRORS:
        url = mirror.format(z=z, x=x, y=y)
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                content = resp.read()
                if len(content) < 1000 or len(content) in (6987, 2049):
                    continue
                h = hashlib.sha256(content).hexdigest().lower()
                if h in INVALID_TILE_HASHES or not content.startswith(b"\x89PNG\r\n\x1a\n"):
                    continue

                with open(tile_file, "wb") as f:
                    f.write(content)
                return "downloaded"
        except Exception:
            time.sleep(0.3)
            continue

    return "failed"


def download_region_tiles(
    min_lat: float = 47.75,
    max_lat: float = 48.55,
    min_lon: float = 15.90,
    max_lon: float = 17.10,
    zooms: list = [10, 11, 12, 13],
    output_dir: str = "public/tiles",
    max_workers: int = 8,
):
    """
    Downloads authentic OpenStreetMap raster tiles for the Vienna airspace bounding box.
    Automatically purges corrupt/blocked placeholder tiles and populates the local cache.
    """
    base_dir = Path(output_dir)
    tasks = []

    for z in zooms:
        x_min, y_max = deg2num(min_lat, min_lon, z)
        x_max, y_min = deg2num(max_lat, max_lon, z)

        x_start, x_end = min(x_min, x_max), max(x_min, x_max)
        y_start, y_end = min(y_min, y_max), max(y_min, y_max)

        for x in range(x_start, x_end + 1):
            for y in range(y_start, y_end + 1):
                tasks.append((z, x, y, base_dir))

    total = len(tasks)
    print(f"Total tiles in bounding box: {total}", flush=True)

    downloaded = 0
    skipped = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(fetch_single_tile, item) for item in tasks]
        for future in as_completed(futures):
            res = future.result()
            if res == "downloaded":
                downloaded += 1
            elif res == "skipped":
                skipped += 1
            else:
                failed += 1

    print(
        f"Finished! Total: {total} | Downloaded: {downloaded}, Skipped (Already cached): {skipped}, Failed: {failed}",
        flush=True,
    )


if __name__ == "__main__":
    download_region_tiles()
