// ============================================================
//  app.js — Tech&Life 블로그 화면 로직
//  이 파일은 blogPosts 데이터를 건드리지 않습니다.
//  posts-data.js 가 먼저 로드되어 blogPosts 배열을 만들어 둡니다.
// ============================================================

// ── 페이지네이션 & 필터 상태 ──
let currentCategory = 'all';
let currentPage = 1;
const POSTS_PER_PAGE = 8; // 한 페이지에 보여줄 글 개수. 원하는 숫자로 바꾸세요.

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
function renderPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    container.innerHTML = "";

    const filtered = getFilteredPosts();
    const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * POSTS_PER_PAGE;
    const pagePosts = filtered.slice(startIdx, startIdx + POSTS_PER_PAGE);

    if (pagePosts.length === 0) {
        container.innerHTML = `<p class="col-span-2 text-center text-sm text-gray-400 py-10">해당 카테고리에 글이 없습니다.</p>`;
    }

    pagePosts.forEach(post => {
        container.innerHTML += `
            <div onclick="viewDetail(${post.id})" class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex flex-col justify-between">
                <div>
                    <span class="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">${post.categoryKo}</span>
                    <h3 class="font-bold text-gray-900 text-sm md:text-base mt-2 line-clamp-2">${post.title}</h3>
                    <p class="text-xs text-gray-500 mt-1.5 line-clamp-2">${post.summary}</p>
                </div>
                <div class="text-[11px] text-gray-400 mt-4 flex justify-between items-center border-t pt-2">
                    <span>${post.date}</span>
                    <span>${post.readTime}</span>
                </div>
            </div>
        `;
    });

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
    const titleEl = document.getElementById('category-title');
    if (category === 'tech') titleEl.innerText = "생활정보";
    if (category === 'life') titleEl.innerText = "건강정보";
    if (category === 'finance') titleEl.innerText = "경제정보";

    // 목록으로 이동할 때는 상세글 URL(?id=)을 지워줍니다.
    const url = new URL(window.location);
    url.searchParams.delete('id');
    history.pushState({}, '', url);

    showPage('home');
    renderPosts();
}

// ── 로고/홈 버튼: 필터 초기화 후 홈으로 ──
function goHome() {
    currentCategory = 'all';
    currentPage = 1;
    document.getElementById('category-title').innerText = "최신 정보 포스트";

    const url = new URL(window.location);
    url.searchParams.delete('id');
    history.pushState({}, '', url);

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
    window.open('https://x.com/intent/tweet?' + params.toString(), '_blank', 'width=600,height=450');
}

// ── 탭(홈/소개/개인정보처리방침/상세) 전환 ──
function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.remove('hidden');
    window.scrollTo(0, 0);

    // '목록으로 돌아가기' 등으로 홈에 왔을 때도 상세글 URL을 정리합니다.
    if (pageId === 'home') {
        const url = new URL(window.location);
        if (url.searchParams.has('id')) {
            url.searchParams.delete('id');
            history.replaceState({}, '', url);
        }
    }
}

// ── 상세 페이지 렌더링 + 실제 URL(?id=) 부여 ──
function viewDetail(id, skipPushState) {
    const post = blogPosts.find(p => p.id === id);
    if (!post) return;

    // 애드센스/구글 크롤링을 위해 글마다 실제 주소창 URL을 부여합니다.
    if (!skipPushState) {
        const url = new URL(window.location);
        url.searchParams.set('id', id);
        history.pushState({ postId: id }, '', url);
    }

    // SEO용 title 태그도 함께 변경
    document.title = post.title + ' | Tech&Life';

    const detailContainer = document.getElementById('post-detail-content');
    detailContainer.innerHTML = `
        <div class="mb-4">
            <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">${post.categoryKo}</span>
        </div>
        <h1 class="text-xl md:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">${post.title}</h1>
        <div class="flex gap-3 text-xs text-gray-400 border-b pb-4 mb-6">
            <span>작성자: ${post.author}</span>
            <span>|</span>
            <span>날짜: ${post.date}</span>
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
    `;
    showPageRaw('detail');

    // 광고 스크립트 동적 재로드
    if (!document.querySelector('script[src*="ba.min.js"][data-loaded="mid"]')) {
        const adScript = document.createElement('script');
        adScript.src = '//t1.kakaocdn.net/kas/static/ba.min.js';
        adScript.async = true;
        adScript.setAttribute('data-loaded', 'mid');
        document.body.appendChild(adScript);
    } else if (window.kakao && window.kakao.ad) {
        try { window.kakao.ad.init(); } catch (e) {}
    }
}

// showPage와 동일하지만 상세페이지 진입 시 URL(id)을 지우지 않는 내부용 함수
function showPageRaw(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.remove('hidden');
    window.scrollTo(0, 0);
}

// ── 본문 중간 광고 삽입 ──
function injectMidAd(content) {
    const adHtml = `
        <div class="my-8 text-center not-prose">
            <span class="text-[10px] text-gray-400 block mb-1">ADVERTISEMENT</span>
            <div class="flex justify-center">
                <ins class="kakao_ad_area" style="display:none;"
                    data-ad-unit="DAN-FkPNnJnYvpHfHGjF"
                    data-ad-width="320"
                    data-ad-height="100"></ins>
            </div>
        </div>`;

    const paragraphs = content.split(/(?<=<\/p>)/i);
    if (paragraphs.length < 2) return content + adHtml;

    const midIndex = Math.ceil(paragraphs.length / 2);
    paragraphs.splice(midIndex, 0, adHtml);
    return paragraphs.join('');
}

// ── 뒤로가기/앞으로가기 버튼 대응 ──
window.onpopstate = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (postId) {
        viewDetail(Number(postId), true);
    } else {
        showPage('home');
    }
};

// ── 최초 진입 시: URL에 ?id= 가 있으면 해당 글을 바로 열어줌 ──
window.onload = function () {
    renderPosts();

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (postId && blogPosts.some(p => p.id === Number(postId))) {
        viewDetail(Number(postId), true);
    }
};
