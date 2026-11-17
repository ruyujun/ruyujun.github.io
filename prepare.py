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
    checksum=hashlib.file_digest(source,'sha256').hexdigest()
if checksum != 'ad664b8da6485a68457d619e7419143d8776d469360297c0cd0a58a3f90c8188': raise ValueError('Incomplete background video')
