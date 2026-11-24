(() => {
  const hosts = ['ruyujun.github.io', 'ruyujun.edgeone.dev'];
  if (!hosts.includes(location.hostname) || navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  const endpoint = 'https://ruyujun-work-counts.glazedeel3.chatgpt.site/event';
  const idKey = 'capture-light.visitor.v1';
  const sourceKey = 'capture-light.source';
  function getVisitor() {
    const now = Date.now();
    try {
      const stored = JSON.parse(localStorage.getItem(idKey) || 'null');
      if (stored?.expires > now && typeof stored.id === 'string') return stored.id;
      const id = crypto.randomUUID();
      localStorage.setItem(idKey,JSON.stringify({id,expires:now + 30 * 86400000}));
      return id;
    } catch { return null; }
  }
  const id = getVisitor();
  if (!id) return;
  const tag = new URLSearchParams(location.search).get('utm_source');
  let source = ['boss','email'].includes(tag) ? tag : 'direct';
  try {
    if (source !== 'direct' || !document.referrer.startsWith(location.origin + '/')) sessionStorage.setItem(sourceKey,source);
    else source = sessionStorage.getItem(sourceKey) || 'direct';
  } catch {}
  const seen = new Set();
  const pending = new Map();
  let retryTimer;
  function submit(work) {
    if (document.visibilityState !== 'visible') return;
    const date = new Date(Date.now()+28800000).toISOString().slice(0,10);
    const key = date + '/' + work;
    if (seen.has(key)) return;
    seen.add(key);
    fetch(endpoint,{
      method:'POST',credentials:'omit',keepalive:true,referrerPolicy:'no-referrer',
      headers:{'Content-Type':'text/plain;charset=UTF-8'},
      body:JSON.stringify({id,source,work})
    }).then(r=>{if (!r.ok) throw Error(); pending.delete(key);}).catch(()=>{
      seen.delete(key);
      if (!pending.has(key)) {
        pending.set(key,work);
        clearTimeout(retryTimer);
        retryTimer = setTimeout(retry,15000);
      }
    });
  }
  function retry() {
    const today = new Date(Date.now()+28800000).toISOString().slice(0,10);
    for (const [key,work] of pending) {
      if (key.startsWith(today+'/')) submit(work); else pending.delete(key);
    }
  }
  function slug() { return /^\/works\/([a-zA-Z0-9_-]+)\/?$/.exec(location.pathname)?.[1]; }
  function videoEvent(e) {
    if (e.target.matches?.('.player-shell video[controls]') && !e.target.paused && slug()) submit(slug());
  }
  const images = '.artwork-view img, .case-album .work-album img';
  function visibleImage(img) {
    if (!img.complete || !img.naturalWidth || !img.getClientRects().length) return;
    const r=img.getBoundingClientRect();
    if (r.width && r.height && r.bottom>0 && r.top<innerHeight && r.right>0 && r.left<innerWidth && slug()
        && !document.querySelector('.player-shell, .external-player')) submit(slug());
  }
  const observer = new IntersectionObserver(entries=>entries.forEach(e=>{ if (e.isIntersecting) visibleImage(e.target); }));
  function observe(node) {
    if (node.nodeType !== 1) return;
    if (node.matches(images)) observer.observe(node);
    for (const img of node.querySelectorAll(images)) observer.observe(img);
  }
  new MutationObserver(changes=>{
    for (const change of changes) for (const node of change.addedNodes) observe(node);
  }).observe(document.documentElement,{subtree:true,childList:true});
  observe(document.documentElement);
  document.addEventListener('load',e=>{if(e.target.matches?.(images)) visibleImage(e.target);},true);
  document.addEventListener('playing',videoEvent,true);
  function active() {
    if (document.visibilityState !== 'visible') return;
    submit('');
    for (const img of document.querySelectorAll(images)) visibleImage(img);
    for (const video of document.querySelectorAll('.player-shell video[controls]')) if (!video.paused && video.currentTime>0 && slug()) submit(slug());
    retry();
  }
  document.addEventListener('visibilitychange',active);
  window.addEventListener('online',active);
  window.addEventListener('pageshow',active);
  active();
})();
