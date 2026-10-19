// ============================================================
//  app.js — Tech&Life 블로그 화면 로직
//  이 파일은 blogPosts 데이터를 건드리지 않습니다.
//  posts-data.js 가 먼저 로드되어 blogPosts 배열을 만들어 둡니다.
// ============================================================

// index.html 의 <title> 을 기본 사이트 제목으로 사용 (오타/불일치 방지)
const SITE_TITLE = document.title;
const SITE_NAME = 'Tech&Life';
const DEFAULT_DESC = '건강정보, 경제정보, 생활정보를 쉽고 정확하게 정리하는 블로그';

// ── 광고 단위 (카카오 애드핏) ──
const AD_MID = { unit: 'DAN-Qp3syfpkwwNTp8Sx', width: 320, height: 100 };   // 본문 중간
const AD_BOTTOM = { unit: 'DAN-n7FG9S9Ns4MwP5Ku', width: 300, height: 250 }; // 본문 하단
const ADFIT_SRC = 'https://t1.kakaocdn.net/kas/static/ba.min.js';

// ── 페이지네이션 & 필터 상태 ──
let currentCategory = 'all';
let currentPage = 1;
const POSTS_PER_PAGE = 8; // 한 페이지에 보여줄 글 개수

// ── 내비게이션 활성 표시 (index.html 의 .nav-btn 순서와 동일) ──
const NAV_ORDER = ['home', 'tech', 'life', 'finance', 'about', 'privacy'];
function setActiveNav(key) {
    const idx = NAV_ORDER.indexOf(key);
    document.querySelectorAll('.nav-btn').forEach((btn, i) => {
        const on = i === idx;
        btn.classList.toggle('text-blue-600', on);
        btn.classList.toggle('bg-blue-50', on);
        btn.classList.toggle('text-gray-600', !on);
        btn.classList.toggle('hover:bg-gray-100', !on);
    });
}

// ── 메타 태그 갱신 (없으면 생성) ──
function setMeta(selector, createTag, attrs) {
    let el = document.head.querySelector(selector);
    if (!el) {
        el = document.createElement(createTag);
        document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
}
function updateSeo(title, desc, url) {
    document.title = title;
    setMeta('meta[name="description"]', 'meta', { name: 'description', content: desc });
    setMeta('meta[property="og:title"]', 'meta', { property: 'og:title', content: title });
    setMeta('meta[property="og:description"]', 'meta', { property: 'og:description', content: desc });
    setMeta('meta[property="og:url"]', 'meta', { property: 'og:url', content: url });
    setMeta('link[rel="canonical"]', 'link', { rel: 'canonical', href: url });
}
function baseUrl() {
    return location.origin + location.pathname;
}

// ── 상세글 URL(?id=) 제거 ──
function clearIdParam(usePush) {
    const url = new URL(window.location);
    if (!url.searchParams.has('id')) return;
    url.searchParams.delete('id');
    usePush ? history.pushState({}, '', url) : history.replaceState({}, '', url);
}

// ── 카테고리별 필터링 ──
function getFilteredPosts() {
    if (currentCategory === 'all') return blogPosts;
    return blogPosts.filter(p => p.category === currentCategory);
}

// ── 사이드바 카테고리 개수 자동 계산 ──
function updateCategoryCounts() {
    const counts = { tech: 0, life: 0, finance: 0 };
    blogPosts.forEach(p => { if (counts[p.category] !== undefined) counts[p.category]++; });
    Object.keys(counts).forEach(cat => {
        const el = document.getElementById('count-' + cat);
        if (el) el.innerText = counts[cat];
    });
}

// ── 목록 페이지 렌더링 (페이지네이션 포함) ──
// 카드를 <a href="?id=..."> 로 만들어 크롤러가 글 링크를 따라갈 수 있게 합니다.
function renderPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    const filtered = getFilteredPosts();
    const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * POSTS_PER_PAGE;
    const pagePosts = filtered.slice(startIdx, startIdx + POSTS_PER_PAGE);

    if (pagePosts.length === 0) {
        container.innerHTML = `<p class="col-span-2 text-center text-sm text-gray-400 py-10">해당 카테고리에 글이 없습니다.</p>`;
    } else {
        container.innerHTML = pagePosts.map(post => `
            <a href="?id=${post.id}" onclick="event.preventDefault(); viewDetail(${post.id});" class="block bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex flex-col justify-between">
                <div>
                    <span class="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">${post.categoryKo || ''}</span>
                    <h3 class="font-bold text-gray-900 text-sm md:text-base mt-2 line-clamp-2">${post.title}</h3>
                    <p class="text-xs text-gray-500 mt-1.5 line-clamp-2">${post.summary || ''}</p>
                </div>
                <div class="text-[11px] text-gray-400 mt-4 flex justify-between items-center border-t pt-2">
                    <span>${post.date || ''}</span>
                    <span>${post.readTime || ''}</span>
                </div>
            </a>
        `).join('');
    }

    renderPagination(totalPages);
    updateCategoryCounts();
}

// ── 페이지 번호 버튼 렌더링 ──
function renderPagination(totalPages) {
    let paginationEl = document.getElementById('pagination-container');
    if (!paginationEl) {
        paginationEl = document.createElement('div');
        paginationEl.id = 'pagination-container';
        paginationEl.className = 'flex justify-center items-center gap-1 mt-2 flex-wrap';
        document.getElementById('posts-container').insertAdjacentElement('afterend', paginationEl);
    }
    paginationEl.innerHTML = '';
    if (totalPages <= 1) return;

    const makeBtn = (label, page, isActive, disabled) => {
        const btn = document.createElement('button');
        btn.innerText = label;
        btn.disabled = !!disabled;
        btn.className = `min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition
            ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`;
        if (!disabled) {
            btn.onclick = () => {
                currentPage = page;
                renderPosts();
                document.getElementById('page-home').scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
        }
        return btn;
    };

    paginationEl.appendChild(makeBtn('«', currentPage - 1, false, currentPage === 1));

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
        paginationEl.appendChild(makeBtn(String(i), i, i === currentPage, false));
    }

    paginationEl.appendChild(makeBtn('»', currentPage + 1, false, currentPage === totalPages));
}

// ── 카테고리 필터 (내비게이션 / 사이드바 버튼) ──
function filterCategory(category) {
    currentCategory = category;
    currentPage = 1;
    const titles = { tech: '생활정보', life: '건강정보', finance: '경제정보' };
    const titleEl = document.getElementById('category-title');
    if (titles[category]) titleEl.innerText = titles[category];

    clearIdParam(true);
    showPage('home');
    renderPosts();
}

// ── 로고/홈 버튼: 필터 초기화 후 홈으로 ──
function goHome() {
    currentCategory = 'all';
    currentPage = 1;
    document.getElementById('category-title').innerText = '최신 정보 포스트';

    clearIdParam(true);
    showPage('home');
    renderPosts();
}

// ── 공유하기 (X/트위터) ──
function shareToX(id) {
    const post = blogPosts.find(p => p.id === id);
    if (!post) return;
    const params = new URLSearchParams({
        text: post.title,
        url: window.location.href,
    });
    window.open('https://x.com/intent/tweet?' + params.toString(), '_blank', 'noopener,width=600,height=450');
}

// ── 탭(홈/소개/개인정보처리방침) 전환: 상세글 URL 정리 + 기본 SEO 복원 ──
function showPage(pageId) {
    showPageRaw(pageId);
    clearIdParam(false); // 소개/방침 등으로 이동해도 ?id= 가 남지 않도록

    updateSeo(SITE_TITLE, DEFAULT_DESC, baseUrl());
    setActiveNav(pageId === 'home' ? (currentCategory === 'all' ? 'home' : currentCategory) : pageId);
}

// 상세페이지 진입 시에도 쓰는 내부 함수 (URL/SEO는 건드리지 않음)
function showPageRaw(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.remove('hidden');
    window.scrollTo(0, 0);
}

// ── 광고(Kakao AdFit) ──
// ba.min.js는 로드될 때 페이지의 ins를 찾아 광고를 채웁니다.
// 글을 열 때마다 새 ins가 생기므로, 이전 동적 스크립트를 지우고 다시 로드합니다.
function loadAdfitScript() {
    document.querySelectorAll('script[data-adfit-dynamic]').forEach(s => s.remove());
    const s = document.createElement('script');
    s.src = ADFIT_SRC;
    s.async = true;
    s.setAttribute('data-adfit-dynamic', '1');
    document.body.appendChild(s);
}

function adBlock(ad, minHeight, extraClass) {
    return `
        <div class="${extraClass} text-center not-prose">
            <span class="text-[10px] text-gray-400 block mb-1">ADVERTISEMENT</span>
            <div class="flex justify-center overflow-hidden" style="min-height:${minHeight}px">
                <ins class="kakao_ad_area" style="display:none;"
                    data-ad-unit="${ad.unit}"
                    data-ad-width="${ad.width}"
                    data-ad-height="${ad.height}"></ins>
            </div>
        </div>`;
}

// ── 본문 중간 광고 삽입 ──
function injectMidAd(content) {
    const adHtml = adBlock(AD_MID, AD_MID.height, 'my-8');

    // lookbehind 정규식은 구형 Safari에서 오류가 나므로 '</p>' 기준으로 직접 나눕니다.
    const parts = String(content || '').split(/<\/p>/i);
    const tail = parts.pop(); // 마지막 </p> 뒤에 남은 내용
    const paragraphs = parts.map(p => p + '</p>');
    if (tail && tail.trim()) paragraphs.push(tail);

    if (paragraphs.length < 2) return paragraphs.join('') + adHtml;

    const midIndex = Math.ceil(paragraphs.length / 2);
    paragraphs.splice(midIndex, 0, adHtml);
    return paragraphs.join('');
}

// ── 상세 페이지 렌더링 + 실제 URL(?id=) 부여 ──
function viewDetail(id, skipPushState) {
    const post = blogPosts.find(p => p.id === id);
    if (!post) return;

    // 글마다 실제 주소창 URL 부여
    if (!skipPushState) {
        const url = new URL(window.location);
        url.searchParams.set('id', id);
        history.pushState({ postId: id }, '', url);
    }

    const detailContainer = document.getElementById('post-detail-content');
    detailContainer.innerHTML = `
        <div class="mb-4">
            <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">${post.categoryKo || ''}</span>
        </div>
        <h1 class="text-xl md:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">${post.title}</h1>
        <div class="flex gap-3 text-xs text-gray-400 border-b pb-4 mb-6">
            <span>작성자: ${post.author || ''}</span>
            <span>|</span>
            <span>날짜: ${post.date || ''}</span>
        </div>
        <div class="mb-6">
            <button onclick="shareToX(${post.id})" class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:opacity-80 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X(트위터)에 공유
            </button>
        </div>
        <div class="prose max-w-none text-sm md:text-base">
            ${injectMidAd(post.content)}
        </div>
        ${adBlock(AD_BOTTOM, AD_BOTTOM.height, 'mt-10')}
    `;
    showPageRaw('detail');
    setActiveNav(post.category);

    // 글별 SEO (제목 / 설명 / canonical)
    updateSeo(
        post.title + ' | ' + SITE_NAME,
        post.summary || DEFAULT_DESC,
        baseUrl() + '?id=' + post.id
    );

    // 본문 중간 + 하단 광고를 한 번의 스크립트 로드로 함께 채웁니다.
    loadAdfitScript();
}

// ── 뒤로가기/앞으로가기 버튼 대응 ──
window.onpopstate = function () {
    const postId = new URLSearchParams(window.location.search).get('id');
    if (postId) {
        viewDetail(Number(postId), true);
    } else {
        showPage('home');
        renderPosts();
    }
};

// ── 최초 진입 ──
// 스크립트가 body 끝에서 로드되므로 DOMContentLoaded 에서 바로 시작합니다.
// (window.onload 는 폰트/외부 스크립트까지 기다려 렌더가 늦어짐)
function init() {
    renderPosts();
    setActiveNav('home');

    const postId = new URLSearchParams(window.location.search).get('id');
    if (!postId) return;

    if (blogPosts.some(p => p.id === Number(postId))) {
        viewDetail(Number(postId), true);
    } else {
        clearIdParam(false); // 존재하지 않는 글 id 는 주소에서 제거
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
