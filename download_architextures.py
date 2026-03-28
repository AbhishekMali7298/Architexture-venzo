import json
import os
import re
from urllib.parse import urlparse
from urllib.request import Request, urlopen

INPUT_FILE = "Pasted text.txt"
OUTPUT_DIR = "architextures_downloads"
TIMEOUT = 30

def load_urls(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read().strip()

    try:
        data = json.loads(text)
        if isinstance(data, list):
            return [str(x).strip() for x in data if str(x).strip()]
    except Exception:
        pass

    return [line.strip().strip('",') for line in text.splitlines() if line.strip().startswith("http")]

def classify_url(url):
    u = url.lower()
    if "/patterns/" in u and u.endswith(".svg"):
        return "patterns"
    if "/materials/" in u:
        return "materials"
    if "/icon/" in u:
        return "icons"
    if "/img/" in u:
        return "images"
    return "other"

def safe_rel_path(url, category):
    parsed = urlparse(url)
    path = parsed.path.lstrip("/")

    if category == "patterns":
        return os.path.join("patterns", os.path.basename(path))

    if category == "materials":
        parts = path.split("/")
        if len(parts) >= 4:
            material_id = parts[1]
            subpath = "_".join(parts[2:])
            return os.path.join("materials", material_id, subpath)
        return os.path.join("materials", os.path.basename(path))

    if category == "icons":
        return os.path.join("icons", os.path.basename(path))

    if category == "images":
        return os.path.join("images", os.path.basename(path))

    cleaned = re.sub(r'[<>:"\\|?*]+', "_", path)
    return os.path.join("other", cleaned)

def download_file(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=TIMEOUT) as response:
        data = response.read()
    with open(dest, "wb") as f:
        f.write(data)
    return len(data)

def main():
    urls = load_urls(INPUT_FILE)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    seen = set()
    manifest = []
    counts = {}

    for url in urls:
        if url in seen:
            continue
        seen.add(url)

        category = classify_url(url)
        rel_path = safe_rel_path(url, category)
        abs_path = os.path.join(OUTPUT_DIR, rel_path)

        try:
            size = download_file(url, abs_path)
            counts[category] = counts.get(category, 0) + 1
            manifest.append({
                "url": url,
                "category": category,
                "saved_to": rel_path,
                "bytes": size,
                "status": "ok"
            })
            print(f"[OK] {category:10} {url}")
        except Exception as e:
            manifest.append({
                "url": url,
                "category": category,
                "saved_to": rel_path,
                "bytes": 0,
                "status": f"error: {e}"
            })
            print(f"[FAIL] {url} -> {e}")

    manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("\nDone.")
    print("Counts:", counts)
    print("Manifest:", manifest_path)

if __name__ == "__main__":
    main()