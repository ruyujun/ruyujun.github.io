// Deliver the original reel. Every upstream URL is fixed by this handler.
const TOTAL = 112710042;
const PART = 12 * 1024 * 1024;
const WINDOW = 2 * 1024 * 1024;
const PUBLIC_REEL = 'https://ruyujun.github.io/api/builtin/studio-hd.mp4';

function parseRange(value) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!m || (!m[1] && !m[2])) return null;
  const first = m[1] ? Number(m[1]) : Math.max(0, TOTAL - Number(m[2]));
  const last = m[1] && m[2] ? Math.min(TOTAL - 1, Number(m[2])) : TOTAL - 1;
  return Number.isSafeInteger(first) && Number.isSafeInteger(last) && first <= last ? {first, last, open:!m[2]} : null;
}

function videoHeaders(start, end, partial) {
  const headers = {'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':String(end - start + 1)};
  if (partial) headers['Content-Range'] = 'bytes '+start+'-'+end+'/'+TOTAL;
  return headers;
}

async function partial(url, start, end, size) {
  const r = await fetch(url,{headers:{Range:'bytes='+start+'-'+end},redirect:'error'});
  if (r.status === 206 && r.headers.get('content-range') === 'bytes '+start+'-'+end+'/'+size && r.body) return r.body;
  if (r.body) await r.body.cancel().catch(()=>{});
  throw Error('Invalid range response');
}

export default async function onRequest({request}) {
  if (new URL(request.url).pathname !== '/api/builtin/studio-hd.mp4') return new Response(null,{status:404});
  if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405});
  const range=request.headers.get('Range');
  const parsed=range ? parseRange(range) : {first:0,last:TOTAL-1};
  if (!parsed) return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+TOTAL}});
  const start=parsed.first;
  const index=Math.floor(start/PART);
  const boundary=Math.min(TOTAL,(index+1)*PART);
  const end=parsed.open ? Math.min(parsed.last,start+WINDOW-1,boundary-1) : parsed.last;
  const init={status:range?206:200, headers:videoHeaders(start,end,!!range)};
  if (request.method==='HEAD') return new Response(null,init);
  if (range && end < boundary) {
    // Read only the requested bytes and stream the validated response directly.
    const url=new URL('/background/reel-hd-'+index+'.bin',request.url);
    try {
      const body=await partial(url.href,start-index*PART,end-index*PART,boundary-index*PART);
      return new Response(body,init);
    } catch { /* A protected or unavailable segment can use the public master. */ }
  }
  try {
    if (range) return new Response(await partial(PUBLIC_REEL,start,end,TOTAL),init);
    const r=await fetch(PUBLIC_REEL,{redirect:'error'});
    if (r.status===200 && r.body && r.headers.get('Content-Type')?.includes('video/mp4')) return new Response(r.body,init);
    if(r.body) await r.body.cancel().catch(()=>{});
  } catch { /* Standard players can also read the public master directly. */ }
  return new Response(null,{status:307,headers:{Location:PUBLIC_REEL,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
