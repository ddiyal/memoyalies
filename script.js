function initializeVisitorCounter() {
    const displayElement = document.getElementById('total-visitors-display');
    const sourceElement = document.getElementById('Stats1_totalCount');

    if (!displayElement || !sourceElement) {
        console.log('Elemen statistik tidak ditemukan.');
        return;
    }

    const updateCounter = () => {
        const rawValue = sourceElement.textContent;
        if (rawValue && rawValue.trim() !== '') {
            const numericValue = parseInt(rawValue.replace(/[,.]/g, ''), 10);
            if (!isNaN(numericValue)) {
                displayElement.textContent = numericValue.toLocaleString('id-ID');
            } else {
               displayElement.textContent = rawValue;
            }
        }
    };

    const observer = new MutationObserver(() => {
        updateCounter();
    });

    observer.observe(sourceElement, {
        childList: true,
        characterData: true,
        subtree: true
    });

    updateCounter();
}

document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;
    const desktopBreakpoint = 1024;

    // --- Menu & Overlay Mobile ---
    const menuToggle = document.getElementById('menuToggle');
    const slideMenu = document.getElementById('slideMenu');
    const overlayMobile = document.getElementById('overlayMobile');
    if (menuToggle && slideMenu && overlayMobile) {
        const toggleMenu = () => {
            slideMenu.classList.toggle('open');
            overlayMobile.classList.toggle('active');
            body.classList.toggle('no-scroll-mobile');
        };
        menuToggle.addEventListener('click', toggleMenu);
        overlayMobile.addEventListener('click', toggleMenu);
    }
    
    // --- Update Footer & Status Bar ---
    const currentYearSidebar = document.getElementById('currentYearSidebar');
    if (currentYearSidebar) {
        currentYearSidebar.textContent = new Date().getFullYear();
    }
    function updateStatusBar() {
        const now = new Date();
        const timeElement = document.getElementById('statusBarTime');
        const dateElement = document.getElementById('statusBarDate');
        if (timeElement) {
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            timeElement.textContent = `${hours}:${minutes}`;
        }
        if (dateElement) {
            if (window.innerWidth >= 768) {
                const options = { weekday: 'short', month: 'short', day: 'numeric' };
                dateElement.textContent = now.toLocaleDateString('id-ID', options);
                dateElement.style.display = 'inline';
            } else {
                dateElement.style.display = 'none';
            }
        }
    }

    // --- Progress Bar & Scroll Handling ---
    const backToTopButton = document.getElementById('backToTopBtn');
    const mainContent = document.querySelector('.ios-main-content');
    const scrollableElement = window.innerWidth < desktopBreakpoint ? window : mainContent;

    function updateProgressBar() {
        const progressBar = document.getElementById("progressBar");
        if (!progressBar) return;

        const scrollElementForProgress = window.innerWidth < desktopBreakpoint ? document.documentElement : mainContent;
        if (!scrollElementForProgress) return;

        const winScroll = scrollElementForProgress.scrollTop;
        const height = scrollElementForProgress.scrollHeight - scrollElementForProgress.clientHeight;
        const scrolled = (height > 0) ? (winScroll / height) * 100 : 0;
        progressBar.style.width = Math.min(100, Math.max(0, scrolled)) + "%";
    }
    function handleScroll() {
        updateProgressBar();
        const scrollElementForBtn = window.innerWidth < desktopBreakpoint ? document.documentElement : mainContent;
        if (backToTopButton && scrollElementForBtn) {
            backToTopButton.style.display = (scrollElementForBtn.scrollTop > 200) ? "flex" : "none";
        }
    }
    function scrollToTop() {
        if (scrollableElement) {
            scrollableElement.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    function updateBackToTopPosition() {
        const mainWrapper = document.querySelector('.main-layout-wrapper');
        if (window.innerWidth < 1024 || !mainWrapper || !backToTopButton) {
            if(backToTopButton) backToTopButton.style.right = '20px'; // Reset for mobile
            return;
        }
        const rect = mainWrapper.getBoundingClientRect();
        const spaceRight = (document.documentElement.clientWidth - rect.right) + 20;
        backToTopButton.style.right = `${spaceRight}px`;
    }

    // --- THEME MANAGEMENT (DARK MODE) ---
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
    }
    
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme || (prefersDark.matches ? 'dark' : 'light'));
    
    themeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
    
    prefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // --- Live Search ---
    function initLiveSearch(searchInput, resultsContainer) {
        if (!searchInput || !resultsContainer) return;
        let searchTimeout;
        searchInput.addEventListener('keyup', (e) => {
            const query = e.target.value.trim();
            clearTimeout(searchTimeout);

            if (query.length < 3) {
                resultsContainer.style.display = 'none';
                resultsContainer.innerHTML = '';
                return;
            }

            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `<div class="search-loader">Mencari...</div>`;

            searchTimeout = setTimeout(() => {
                fetch(`/feeds/posts/default?alt=json&q=${encodeURIComponent(query)}&max-results=5`)
                    .then(response => response.json())
                    .then(data => {
                        let resultsHTML = '';
                        if (data.feed.entry && data.feed.entry.length > 0) {
                            resultsHTML += '<ul>';
                            data.feed.entry.forEach(entry => {
                                const postTitle = entry.title.$t;
                                const postUrl = (entry.link.find(link => link.rel === 'alternate') || {}).href;
                                if(postUrl) {
                                  resultsHTML += `<li><a href="${postUrl}">${postTitle}</a></li>`;
                                }
                            });
                            resultsHTML += '</ul>';
                        } else {
                            resultsHTML = '<div class="no-results">Tidak ada hasil ditemukan.</div>';
                        }
                        resultsContainer.innerHTML = resultsHTML;
                    })
                    .catch(error => {
                        console.error('Error fetching search results:', error);
                        resultsContainer.innerHTML = '<div class="no-results">Gagal memuat hasil.</div>';
                    });
            }, 300);
        });
    }

    // --- Social Sharing (XML SAFE) ---
    function initSocialSharing() {
        const rawUrl = window.location.href;
        const rawTitle = document.title.split(' - ')[0];

        const whatsappLink = document.getElementById('social-whatsapp');
        const twitterLink = document.getElementById('social-twitter');
        const facebookLink = document.getElementById('social-facebook');
        const telegramLink = document.getElementById('social-telegram');

        if (whatsappLink) {
            const url = new URL('https://api.whatsapp.com/send');
            url.searchParams.set('text', rawTitle + ' ' + rawUrl);
            whatsappLink.href = url.toString();
        }
        if (twitterLink) {
            const url = new URL('https://twitter.com/intent/tweet');
            url.searchParams.set('text', rawTitle);
            url.searchParams.set('url', rawUrl);
            twitterLink.href = url.toString();
        }
        if (facebookLink) {
            const url = new URL('https://www.facebook.com/sharer/sharer.php');
            url.searchParams.set('u', rawUrl);
            facebookLink.href = url.toString();
        }
        if (telegramLink) {
            const url = new URL('https://t.me/share/url');
            url.searchParams.set('url', rawUrl);
            url.searchParams.set('text', rawTitle);
            telegramLink.href = url.toString();
        }
    }

    // --- Navigasi Bawah Mobile ---
    function initBottomNav() {
        if (window.innerWidth >= desktopBreakpoint) return;

        const bottomNav = document.getElementById('mobileBottomNav');
        bottomNav.style.display = 'flex';
        
        if (body.classList.contains('index-page') && !body.classList.contains('label-page') && !body.classList.contains('search-results-page')) {
            document.getElementById('nav-home').classList.add('active');
        }

        const catBtn = document.getElementById('nav-categories');
        const catModalOverlay = document.getElementById('categoriesModalOverlay');
        const catModalBody = document.getElementById('categoriesModalBody');
        const originalCatList = document.querySelector('.widget.Label .widget-content');
        if (catBtn && catModalOverlay && originalCatList) {
            catModalBody.innerHTML = originalCatList.innerHTML;
            catBtn.addEventListener('click', () => catModalOverlay.classList.add('active'));
            catModalOverlay.addEventListener('click', (e) => {
                if (e.target === catModalOverlay) {
                    catModalOverlay.classList.remove('active');
                }
            });
        }

        const searchBtn = document.getElementById('nav-search');
        const searchOverlay = document.getElementById('searchOverlayMobile');
        const closeSearchBtn = document.getElementById('closeSearchOverlayBtn');
        const searchFormContainer = searchOverlay.querySelector('.search-form-container');
        const originalSearchForm = document.querySelector('.sidebar-search-form');
        if(searchBtn && searchOverlay && searchFormContainer && originalSearchForm) {
            searchFormContainer.appendChild(originalSearchForm);
            const searchInputMobile = searchFormContainer.querySelector('.sidebar-search-input');
            const searchResultsMobile = searchFormContainer.querySelector('#live-search-results');
            initLiveSearch(searchInputMobile, searchResultsMobile);
            
            searchBtn.addEventListener('click', () => {
                searchOverlay.classList.add('active');
                searchInputMobile.focus();
            });
            closeSearchBtn.addEventListener('click', () => searchOverlay.classList.remove('active'));
        }

        const menuBtn = document.getElementById('nav-menu');
        if (menuBtn && slideMenu && overlayMobile) {
            menuBtn.addEventListener('click', () => {
                slideMenu.classList.add('open');
                overlayMobile.classList.add('active');
                body.classList.add('no-scroll-mobile');
            });
        }
    }
    
    // --- Panggilan Fungsi & Event Listeners ---
    initializeVisitorCounter();
    updateStatusBar();
    setInterval(updateStatusBar, 60000);
    initSocialSharing();
    initBottomNav();
    updateBackToTopPosition();

    if (window.innerWidth >= desktopBreakpoint) {
        const searchInputDesktop = document.querySelector('.sidebar-search-input');
        const searchResultsDesktop = document.querySelector('#live-search-results');
        initLiveSearch(searchInputDesktop, searchResultsDesktop);
        if(mainContent) mainContent.addEventListener('scroll', handleScroll);
    } else {
        window.addEventListener('scroll', handleScroll);
    }
    
    if (backToTopButton) backToTopButton.addEventListener('click', scrollToTop);
    document.getElementById('statusBarTime').addEventListener('click', scrollToTop);
    
    window.addEventListener('resize', () => {
        updateStatusBar();
        updateBackToTopPosition();
    });
    handleScroll();
});

function showRelatedPosts(json) {
   const container = document.getElementById('related-posts-container');
   if (!container) return;
   let relatedPostsHTML = '';
   const postUrl = window.location.href;
   let count = 0;
   if (!json.feed.entry) {
     const widget = container.closest('.widget');
     if (widget) widget.style.display = 'none';
     return;
   }
   for (let i = 0; i < json.feed.entry.length; i++) {
       if (count >= 5) break;
       const entry = json.feed.entry[i];
       const postLink = entry.link.find(link => link.rel === 'alternate')?.href;
       if (!postLink || postLink === postUrl) continue;
       const postTitle = entry.title.$t;
       const postDate = new Date(entry.published.$t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
       const thumbnailUrl = ('media$thumbnail' in entry) ? entry.media$thumbnail.url.replace('/s72-c/', '/s100-c/') : "https://placehold.co/60x60/E0E0E0/A0A0A0?text=N/A";

       relatedPostsHTML += `
           <div class='related-post-item'>
               <a href='${postLink}'>
                   <img class='related-post-thumbnail' loading='lazy' src='${thumbnailUrl}'/>
                   <div class='related-post-info'>
                       <h4 class='related-post-title'>${postTitle}</h4>
                       <span class='related-post-date'>${postDate}</span>
                   </div>
               </a>
           </div>`;
       count++;
   }
   if (relatedPostsHTML !== '') {
       container.innerHTML = relatedPostsHTML;
   } else {
       const widget = container.closest('.widget');
       if (widget) widget.style.display = 'none';
   }
}
