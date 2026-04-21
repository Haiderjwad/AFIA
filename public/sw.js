// ==============================================================
// public/sw.js — Service Worker ⚡ PWA Offline-First
// يحفظ الـ assets في Cache ويخدمها فوراً حتى بدون إنترنت
// ==============================================================

const CACHE_NAME = 'golden-pos-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
];

// ─── Install: تخزين الـ assets الأساسية ─────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    // تفعيل Service Worker فوراً بدون انتظار
    self.skipWaiting();
});

// ─── Activate: حذف الـ caches القديمة ───────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ─── Fetch: استراتيجية Cache-First ──────────────────────────
self.addEventListener('fetch', (event) => {
    // تجاهل طلبات الـ API والـ chrome-extension
    const url = new URL(event.request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (url.hostname.includes('googleapis.com') || url.hostname.includes('google.com')) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                // تخزين فقط الاستجابات الناجحة من نفس الـ origin
                if (response.ok && url.origin === self.location.origin) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback للصفحات HTML
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
