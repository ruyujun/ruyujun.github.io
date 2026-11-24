from pathlib import Path
import hashlib
from shutil import copyfileobj
root=Path(__file__).resolve().parent
video=root/'site/api/builtin/studio-hd.mp4'
video.parent.mkdir(parents=True,exist_ok=True)
with video.open('wb') as target:
    for part in sorted((root/'video-parts').glob('reel-hd-*.bin')):
        with part.open('rb') as source: copyfileobj(source,target)
with video.open('rb') as source:
    digest=hashlib.sha256()
    for block in iter(lambda:source.read(1024*1024),b''): digest.update(block)
    checksum=digest.hexdigest()
if checksum != 'ad664b8da6485a68457d619e7419143d8776d469360297c0cd0a58a3f90c8188': raise ValueError('Incomplete background video')

# Include anonymous view counting on every static entry point.
tag = '<script defer src="/portfolio-analytics.js"></script>'
for entry in (root / "site").rglob("*.html"):
    html = entry.read_text(encoding="utf-8")
    if tag not in html and '<div id="root">' in html:
        if "</head>" not in html:
            raise ValueError(f"Missing head in {entry.name}")
        entry.write_text(html.replace("</head>", tag + "</head>", 1), encoding="utf-8")
