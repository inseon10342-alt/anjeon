// 화면 파일을 휴대폰에 저장해 두고 바로 열기 (데이터·사진은 매번 서버로)
const VER = '20261114-1218';
const CACHE = 'hyunjang-' + VER;
const SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hyunjang-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;          // 서버 요청은 그대로
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key, { ignoreSearch: true });
    if (hit && /\/(lib|fonts)\//.test(url.pathname)) return hit;          // 큰 도구 파일은 한 번 받으면 다시 안 받음 (새 버전이 나오면 새로)
    const net = fetch(req, { cache: 'no-cache' }).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }                                // 저장본 먼저 (신호 없어도 열림), 뒤에서 최신으로 갱신
    return (await net) || new Response('오프라인입니다', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
