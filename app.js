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

    // 카테고리별 기본 그라데이션 (썸네일이 없을 때 대체용)
    const fallbackGradient = {
        tech: 'from-blue-400 to-indigo-500',
        life: 'from-rose-400 to-orange-400',
        finance: 'from-emerald-400 to-teal-500'
    };
    const fallbackIcon = {
        tech: 'fa-laptop-code',
        life: 'fa-heart-pulse',
        finance: 'fa-coins'
    };

    pagePosts.forEach(post => {
        const gradient = fallbackGradient[post.category] || 'from-gray-300 to-gray-400';
        const icon = fallbackIcon[post.category] || 'fa-newspaper';

        // 썸네일 이미지가 있으면 이미지, 없으면 그라데이션 + 아이콘으로 대체
        const thumbnailHtml = post.thumbnail
            ? `<img src="${post.thumbnail}" alt="${post.title}" loading="lazy"
                   class="w-full h-full object-cover"
                   onerror="this.onerror=null; this.parentElement.innerHTML='<div class=&quot;w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}&quot;><i class=&quot;fa-solid ${icon} text-white text-3xl opacity-80&quot;></i></div>';">`
            : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}">
                   <i class="fa-solid ${icon} text-white text-3xl opacity-80"></i>
               </div>`;

        container.innerHTML += `
            <div onclick="viewDetail(${post.id})" class="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex flex-col justify-between overflow-hidden">
                <div class="aspect-video w-full overflow-hidden bg-gray-100">
                    ${thumbnailHtml}
                </div>
                <div class="p-4 md:p-5 flex flex-col justify-between flex-grow">
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
            </div>
        `;
    });

    renderPagination(totalPages);
    updateCategoryCounts();
}
