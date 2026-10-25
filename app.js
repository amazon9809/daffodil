(function () {
  'use strict';

  var CATEGORIES = {
    tech:    { label: '생활정보', badge: 'bg-blue-50 text-blue-600' },
    life:    { label: '건강정보', badge: 'bg-red-50 text-red-500' },
    finance: { label: '경제정보', badge: 'bg-yellow-50 text-yellow-600' }
  };

  var list = (typeof posts !== 'undefined' && Array.isArray(posts)) ? posts : [];
  var currentCategory = 'all';

  function $(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function setActiveNav(key) {
    var map = { home: 0, tech: 1, life: 2, finance: 3, about: 4, privacy: 5 };
    var btns = document.querySelectorAll('.nav-btn');
    btns.forEach(function (b, i) {
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

  function renderPosts() {
    var box = $('posts-container');
    var items = currentCategory === 'all'
      ? list
      : list.filter(function (p) { return p.category === currentCategory; });

    if (!items.length) {
      box.innerHTML = '<p class="col-span-2 text-sm text-gray-500 py-10 text-center">아직 등록된 글이 없습니다.</p>';
      return;
    }

    box.innerHTML = items.map(function (p) {
      var cat = CATEGORIES[p.category] || { label: '기타', badge: 'bg-gray-100 text-gray-600' };
      return '' +
        '<article class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition flex flex-col" data-id="' + p.id + '">' +
          '<div class="h-24 md:h-32 bg-gradient-to-tr from-blue-50 to-indigo-100 flex items-center justify-center text-blue-400 text-3xl">' +
            '<i class="fa-solid ' + escapeHtml(p.icon || 'fa-file-lines') + '"></i>' +
          '</div>' +
          '<div class="p-4 flex flex-col flex-grow">' +
            '<span class="self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ' + cat.badge + '">' + cat.label + '</span>' +
            '<h3 class="mt-2 font-bold text-sm md:text-base text-gray-900 leading-snug">' + escapeHtml(p.title) + '</h3>' +
            '<p class="mt-1 text-xs text-gray-500 leading-relaxed flex-grow">' + escapeHtml(p.summary) + '</p>' +
            '<time class="mt-3 text-[11px] text-gray-400">' + escapeHtml(p.date) + '</time>' +
          '</div>' +
        '</article>';
    }).join('');

    box.querySelectorAll('article').forEach(function (card) {
      card.addEventListener('click', function () {
        openPost(Number(card.getAttribute('data-id')));
      });
    });
  }

  function showPage(name) {
    document.querySelectorAll('.page-content').forEach(function (el) {
      el.classList.add('hidden');
    });
    var target = $('page-' + name);
    if (target) target.classList.remove('hidden');
    if (name === 'home') setActiveNav(currentCategory === 'all' ? 'home' : currentCategory);
    else if (name === 'about' || name === 'privacy') setActiveNav(name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goHome() {
    currentCategory = 'all';
    $('category-title').textContent = '최신 정보 포스트';
    renderPosts();
    showPage('home');
    return false;
  }

  function filterCategory(key) {
    currentCategory = key;
    $('category-title').textContent = CATEGORIES[key].label + ' 포스트';
    renderPosts();
    showPage('home');
    setActiveNav(key);
    return false;
  }

  function openPost(id) {
    var p = list.find(function (x) { return x.id === id; });
    if (!p) return;
    var cat = CATEGORIES[p.category] || { label: '기타', badge: 'bg-gray-100 text-gray-600' };

    $('post-detail-content').innerHTML = '' +
      '<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ' + cat.badge + '">' + cat.label + '</span>' +
      '<h1 class="mt-3 text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">' + escapeHtml(p.title) + '</h1>' +
      '<time class="block mt-2 text-xs text-gray-400">' + escapeHtml(p.date) + '</time>' +
      '<div class="post-body mt-6 text-gray-700 leading-relaxed space-y-4">' + p.content + '</div>';

    document.title = p.title + ' - Tech&Life';
    showPage('detail');
  }

  // 본문 스타일 (Tailwind 기본 reset 때문에 목록/제목 스타일을 직접 지정)
  var style = document.createElement('style');
  style.textContent =
    '.post-body h3{font-size:1.125rem;font-weight:700;color:#111827;margin-top:1.5rem}' +
    '.post-body ul{list-style:disc;padding-left:1.25rem}' +
    '.post-body ol{list-style:decimal;padding-left:1.25rem}' +
    '.post-body li{margin:.25rem 0}' +
    '.post-body .note{font-size:.8rem;color:#6b7280;background:#f9fafb;border-radius:.5rem;padding:.75rem}';
  document.head.appendChild(style);

  // 인라인 onclick에서 호출할 수 있도록 전역으로 노출
  window.goHome = goHome;
  window.filterCategory = filterCategory;
  window.showPage = showPage;
  window.openPost = openPost;

  renderCounts();
  renderPosts();
})();
