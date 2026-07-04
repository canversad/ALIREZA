#!/usr/bin/env python3
"""YouTube discovery probe for the SPH Auto Parts test case.

Uses yt-dlp (no API key) against YouTube search with the filter
sp=CAMSBAgEEAE= (protobuf: sort=view_count, upload_date=this_month, type=video),
then fully extracts metadata for top hits to get views/likes/comments/date.
"""
import json, subprocess, sys, datetime, pathlib

OUT = pathlib.Path(__file__).parent / "research-data"
OUT.mkdir(exist_ok=True)
YTDLP = str(pathlib.Path(__file__).parent / "venv/bin/yt-dlp")

QUERIES = [
    "auto parts",
    "car parts",
    "brake replacement",
    "mechanic",
    "auto repair",
    "engine rebuild",
    "toronto mechanic",
    "car maintenance tips",
]

SP = "CAMSBAgEEAE%3D"  # sort: view count, uploaded: this month, type: video

def run(cmd, timeout=180):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)

def flat_search(query, limit=15):
    url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}&sp={SP}"
    r = run([YTDLP, "--flat-playlist", "--playlist-end", str(limit), "-J", url])
    if r.returncode != 0:
        return {"query": query, "error": r.stderr[-500:]}
    data = json.loads(r.stdout)
    entries = []
    for e in (data.get("entries") or []):
        entries.append({
            "id": e.get("id"), "title": e.get("title"),
            "channel": e.get("channel") or e.get("uploader"),
            "view_count": e.get("view_count"), "url": e.get("url"),
            "duration": e.get("duration"),
        })
    return {"query": query, "entries": entries}

def full_meta(video_id):
    r = run([YTDLP, "--skip-download", "-J", f"https://www.youtube.com/watch?v={video_id}"], timeout=90)
    if r.returncode != 0:
        return {"id": video_id, "error": r.stderr[-300:]}
    d = json.loads(r.stdout)
    return {
        "id": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "title": d.get("title"),
        "channel": d.get("channel"),
        "channel_follower_count": d.get("channel_follower_count"),
        "upload_date": d.get("upload_date"),
        "view_count": d.get("view_count"),
        "like_count": d.get("like_count"),
        "comment_count": d.get("comment_count"),
        "duration": d.get("duration"),
        "categories": d.get("categories"),
        "tags": (d.get("tags") or [])[:10],
    }

def main():
    searches = []
    seen = set()
    for q in QUERIES:
        res = flat_search(q)
        searches.append(res)
        n = len(res.get("entries", []))
        print(f"search '{q}': {n} results", flush=True)
    (OUT / "youtube_flat_search.json").write_text(json.dumps(searches, indent=2))

    # candidates: top by view_count across queries
    cands = []
    for s in searches:
        for e in s.get("entries", []):
            if e["id"] and e["id"] not in seen and e.get("view_count"):
                seen.add(e["id"])
                cands.append(e)
    cands.sort(key=lambda x: -(x["view_count"] or 0))
    top = cands[:30]
    print(f"fetching full metadata for {len(top)} candidates", flush=True)

    metas = []
    cutoff = (datetime.date.today() - datetime.timedelta(days=30)).strftime("%Y%m%d")
    for c in top:
        m = full_meta(c["id"])
        m["within_30d"] = bool(m.get("upload_date") and m["upload_date"] >= cutoff)
        metas.append(m)
        print(f"  {m.get('upload_date')} {m.get('view_count')} {str(m.get('title'))[:60]}", flush=True)
    (OUT / "youtube_top_videos.json").write_text(json.dumps(metas, indent=2))
    ok = [m for m in metas if m.get("within_30d")]
    print(f"DONE: {len(metas)} extracted, {len(ok)} within 30 days")

if __name__ == "__main__":
    main()
