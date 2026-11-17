// Serve the high-bitrate reel from same-origin static parts without re-encoding.
const PART = 12 * 1024 * 1024;
const SIZE = 112710042;

export default async function onRequest({request}) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/builtin/studio-hd.mp4') return new Response(null,{status:404});
  if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405});
  const range = request.headers.get('range');
  let start = 0, end = SIZE - 1;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    const invalid = () => new Response(null,{status:416,headers:{'Content-Range':'bytes */'+SIZE}});
    if (!m || !(m[1] || m[2])) return invalid();
    start = m[1] ? Number(m[1]) : Math.max(0,SIZE-Number(m[2]));
    end = m[1] && m[2] ? Math.min(SIZE-1,Number(m[2])) : SIZE-1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start>end) return invalid();
  }
  const headers = {'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':String(end-start+1)};
  if (range) headers['Content-Range']=`bytes ${start}-${end}/${SIZE}`;
  const init={status:range?206:200,headers};
  if(request.method==='HEAD') return new Response(null,init);
  let offset=start;
  const body=new ReadableStream({async pull(controller){
    try{
      const index=Math.floor(offset/PART), first=offset%PART, length=Math.min(PART,SIZE-index*PART);
      const last=Math.min(length-1,end-index*PART);
      const part=await fetch(new URL('/background/reel-hd-'+index+'.bin',url).href);
      if(!part.ok) throw Error('Missing video segment');
      const bytes=new Uint8Array(await part.arrayBuffer());
      if(bytes.length!==length) throw Error('Incomplete video segment');
      controller.enqueue(bytes.subarray(first,last+1));
      offset+=last-first+1;
      if(offset>end) controller.close();
    }catch(error){controller.error(error)}
  }});
  return new Response(body,init);
}
