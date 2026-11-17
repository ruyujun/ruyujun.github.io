from pathlib import Path
from shutil import copy2
root = Path(__file__).resolve().parent
output = root / 'site'
parts = output / 'background'
parts.mkdir(exist_ok=True)
for part in sorted((root/'video-parts').glob('reel-hd-*.bin')):
    copy2(part, parts/part.name)
big = [str(p.relative_to(output)) for p in output.rglob('*') if p.is_file() and p.stat().st_size > 25*1024*1024]
if big:
    raise RuntimeError('Build from a clean checkout for EdgeOne: '+', '.join(big))
