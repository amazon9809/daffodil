(function () {
  'use strict';

  // 데이터: posts-data.js 의 `const blogPosts = [...]`
  var list = (typeof blogPosts !== 'undefined' && Array.isArray(blogPosts)) ? blogPosts.slice() : [];
  // 최신순 정렬 (날짜 내림차순, 같으면 id 내림차순)
  list.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.id - a.id;
  });

  var PAGE_SIZE = 12;
  var shown = PAGE_SIZE;
  var currentCategory = 'all';

  var CATEGORIES = {
    tech:    { label: '기술·IT',        badge: 'bg-blue-50 text-blue-600',     icon: 'fa-laptop-code' },
    life:    { label: '생활·건강정보',  badge: 'bg-red-50 text-red-500',       icon: 'fa-heart-pulse' },
    finance: { label: '경제·금융정보',  badge: 'bg-yellow-50 text-yellow-700', icon: 'fa-coins' }
  };
  var FALLBACK = { label: '기타', badge: 'bg-gray-100 text-gray-600', icon: 'fa-file-lines' };

  function $(id) { return document.getElementById(id); }
  function cat(p) { return CATEGORIES[p.category] || FALLBACK; }

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function filtered() {
    return currentCategory === 'all'
      ? list
      : list.filter(function (p) { return p.category === currentCategory; });
  }

  function setActiveNav(key) {
    var map = { home: 0, tech: 1, life: 2, finance: 3, about: 4, privacy: 5 };
    document.querySelectorAll('.nav-btn').forEach(function (b, i) {
      var on = i === map[key];
      b.classList.toggle('text-blue-600', on);
      b.classList.toggle('bg-blue-50', on);
      b.classList.toggle('text-gray-600', !on);
    });
  }

  function renderCounts() {
    Object.keys(CATEGORIES).forEach(function (key) {
      var el = $('count-' + key);
      if (el) el.textContent = list.filter(function (p) { return p.category === key; }).length;
    });
  }

  function cardHtml(p) {
    var c = cat(p);
    var label = p.categoryKo ? String(p.categoryKo).trim() : c.label;
    var thumb = p.thumbnail
      ? '<img src="' + esc(p.thumbnail) + '" alt="" loading="lazy" class="w-full h-full object-cover" onerror="this.parentNode.innerHTML=\'<i class=&quot;fa-solid ' + c.icon + '&quot;></i>\'">'
      : '<i class="fa-solid ' + c.icon + '"></i>';
    return '' +
      '<article class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition flex flex-col" data-id="' + p.id + '">' +
        '<div class="h-24 md:h-32 bg-gradient-to-tr from-blue-50 to-indigo-100 flex items-center justify-center text-blue-400 text-3xl overflow-hidden">' + thumb + '</div>' +
        '<div class="p-4 flex flex-col flex-grow">' +
          '<span class="self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ' + c.badge + '">' + esc(label) + '</span>' +
          '<h3 class="mt-2 font-bold text-sm md:text-base text-gray-900 leading-snug">' + esc(p.title) + '</h3>' +
          '<p class="mt-1 text-xs text-gray-500 leading-relaxed flex-grow line-clamp-3">' + esc(p.summary) + '</p>' +
          '<div class="mt-3 text-[11px] text-gray-400 flex justify-between"><time>' + esc(p.date) + '</time><span>' + esc(p.readTime || '') + '</span></div>' +
        '</div>' +
      '</article>';
  }

  function renderPosts() {
    var box = $('posts-container');
    var items = filtered();
    if (!items.length) {
      box.innerHTML = '<p class="col-span-2 text-sm text-gray-500 py-10 text-center">아직 등록된 글이 없습니다.</p>';
      updateMore(0, 0);
      return;
    }
    box.innerHTML = items.slice(0, shown).map(cardHtml).join('');
    box.querySelectorAll('article').forEach(function (card) {
      card.addEventListener('click', function () {
        location.href = 'post/' + card.getAttribute('data-id') + '.html';
      });
    });
    updateMore(Math.min(shown, items.length), items.length);
  }

  function updateMore(visible, total) {
    var btn = $('more-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'more-btn';
      btn.className = 'w-full py-3 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition';
      btn.addEventListener('click', function () { shown += PAGE_SIZE; renderPosts(); });
      $('posts-container').insertAdjacentElement('afterend', btn);
    }
    btn.style.display = visible < total ? 'block' : 'none';
    btn.textContent = '더보기 (' + visible + ' / ' + total + ')';
  }

  function showPage(name, noHash) {
    document.querySelectorAll('.page-content').forEach(function (el) { el.classList.add('hidden'); });
    var target = $('page-' + name);
    if (target) target.classList.remove('hidden');
    if (name === 'home') setActiveNav(currentCategory === 'all' ? 'home' : currentCategory);
    else if (name === 'about' || name === 'privacy') setActiveNav(name);
    if (!noHash && name !== 'detail' && location.hash) history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return false;
  }

  function goHome() {
    currentCategory = 'all';
    shown = PAGE_SIZE;
    $('category-title').textContent = '최신 정보 포스트';
    document.title = '건강정보-생활정보';
    renderPosts();
    return showPage('home');
  }

  function filterCategory(key) {
    currentCategory = key;
    shown = PAGE_SIZE;
    $('category-title').textContent = CATEGORIES[key].label + ' 포스트';
    renderPosts();
    showPage('home');
    setActiveNav(key);
    return false;
  }

  function openPost(id, pushHash) {
    var p = list.find(function (x) { return x.id === id; });
    if (!p) return;
    var c = cat(p);
    var label = p.categoryKo ? String(p.categoryKo).trim() : c.label;

    $('post-detail-content').innerHTML = '' +
      '<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ' + c.badge + '">' + esc(label) + '</span>' +
      '<h1 class="mt-3 text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">' + esc(p.title) + '</h1>' +
      '<div class="mt-2 text-xs text-gray-400 flex flex-wrap gap-x-3">' +
        '<time>' + esc(p.date) + '</time>' +
        (p.author ? '<span>' + esc(p.author) + '</span>' : '') +
        (p.readTime ? '<span>' + esc(p.readTime) + '</span>' : '') +
      '</div>' +
      '<div class="post-body mt-6">' + p.content + '</div>';

    document.title = p.title + ' - Tech&Life';
    if (pushHash) location.hash = 'post-' + id;
    showPage('detail', true);
  }

  function route() {
    var m = /^#post-(\d+)$/.exec(location.hash);
    if (m) openPost(Number(m[1]), false);
    else if ($('page-detail') && !$('page-detail').classList.contains('hidden')) goHome();
  }

  // 본문 스타일 (Tailwind reset 보정 + 글 안의 표/이미지/목록)
  var style = document.createElement('style');
  style.textContent =
    '.post-body{color:#374151;line-height:1.8;font-size:15px}' +
    '.post-body p{margin-bottom:1rem}' +
    '.post-body h2{font-size:1.4rem;font-weight:800;color:#111827;margin:2rem 0 1rem}' +
    '.post-body h3{font-size:1.15rem;font-weight:700;color:#111827;margin:1.6rem 0 .6rem}' +
    '.post-body h4{font-size:1rem;font-weight:600;color:#1f2937;margin:1.1rem 0 .4rem}' +
    '.post-body ul{list-style:disc;padding-left:1.4rem;margin-bottom:1rem}' +
    '.post-body ol{list-style:decimal;padding-left:1.4rem;margin-bottom:1rem}' +
    '.post-body li{margin:.3rem 0}' +
    '.post-body img{max-width:100%;height:auto;border-radius:.5rem}' +
    '.post-body table{width:100%;border-collapse:collapse;font-size:.875rem}' +
    '.post-body th,.post-body td{border:1px solid #e5e7eb;padding:.5rem .75rem;text-align:left;vertical-align:top}' +
    '.post-body blockquote{border-left:4px solid #9ca3af;padding-left:1rem;color:#4b5563;margin:1rem 0}' +
    '.post-body code{background:#f3f4f6;padding:0 .25rem;border-radius:.25rem}' +
    '.post-body hr{margin:1.5rem 0;border-color:#e5e7eb}' +
    '.line-clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}';
  document.head.appendChild(style);

  window.goHome = goHome;
  window.filterCategory = filterCategory;
  window.showPage = showPage;
  window.openPost = openPost;
  window.addEventListener('hashchange', route);

  renderCounts();
  renderPosts();
  route();
})();
