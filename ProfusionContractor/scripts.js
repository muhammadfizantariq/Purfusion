// === Load the shared header partial ===
function ensureIncludePlaceholder() {
  var el = document.querySelector('[data-include]');
  if (!el) {
    el = document.createElement('div');
    el.setAttribute('data-include', 'partials/header.html');
    document.body.insertBefore(el, document.body.firstChild);
  }
  return el;
}

function initInclude() {
  var include = ensureIncludePlaceholder();
  var url = include.getAttribute('data-include') || 'partials/header.html';
  return fetch(url)
    .then(function (r) {
      if (!r.ok) throw new Error('Failed to load partial');
      return r.text();
    })
    .then(function (html) { include.outerHTML = html; })
    .catch(function () {
      // Fallback for file:// or serverless preview – inline the header
  include.outerHTML = '\n<!-- /partials/header.html (fallback) -->\n<header id="site-header" class="site-header minimalist overlay">\n  <div class="container header-inner">\n    <a href="index.html" class="brand" aria-label="Profusion General Contractor – Home">\n      <img class="logo" src="logo_.png" alt="Profusion General Contractor logo" height="36" />\n      <span class="brand-text">PROFUSION<span style="font-weight:500; font-size:.65rem; letter-spacing:2px; margin-left:.55rem; opacity:.75; vertical-align:middle;">DFW</span></span>\n    </a>\n    <input id="menu-toggle" class="menu-toggle" type="checkbox" aria-label="Toggle navigation" />\n    <label for="menu-toggle" class="hamburger" aria-hidden="true">\n      <span></span><span></span><span></span>\n    </label>\n    <nav class="nav" role="navigation" aria-label="Primary">\n      <a class="nav-link" href="index.html">Home</a>\n      <a class="nav-link" href="about.html">About</a>\n      <a class="nav-link" href="services.html">Services</a>\n      <a class="nav-link" href="contact.html">Contact</a>\n    </nav>\n  </div>\n</header>\n';
    });
}

// === Scroll behavior: turn navbar into colored bar ===
function initHeaderScrollBehavior() {
  var header = document.getElementById('site-header');
  if (!header) return;
  var ticking = false;
  function update() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (y > 0) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    ticking = false;
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// === Active-link highlighting (kept) ===
function setActiveNavLink() {
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(function (a) {
    var href = a.getAttribute('href');
    a.classList.toggle('active', href === path);
  });
}

// Smooth scrolling for in-page anchors
function initSmoothScroll(){
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if (id.length > 1){
        var target = document.querySelector(id);
        if (target){
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          var toggle = document.getElementById('menu-toggle');
          if (toggle) toggle.checked = false;
        }
      }
    });
  });
}

// Counters
function initCounters(){
  var counters = Array.from(document.querySelectorAll('.counter'));
  if (!counters.length) return;
  var started = false;
  var statsEl = document.getElementById('stats');
  if (!statsEl) return;
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting && !started){
        started = true;
        counters.forEach(function(el){
          var to = parseInt(el.getAttribute('data-to') || '0', 10);
          if (isMobileScreen()) { el.textContent = to.toString(); return; }
          var cur = 0;
          var step = Math.max(1, Math.floor(to/120));
          var interval = setInterval(function(){
            cur += step;
            if (cur >= to){ cur = to; clearInterval(interval); }
            el.textContent = cur.toString();
          }, 16);
        });
        obs.disconnect();
      }
    });
  }, { threshold: 0.2 });
  obs.observe(statsEl);
}

// Portfolio filter
function initPortfolioFilter(){
  var buttons = document.querySelectorAll('.filter-btn');
  var items = document.querySelectorAll('.portfolio-item');
  if (!buttons.length) return;
  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      buttons.forEach(function(b){ b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var cat = btn.getAttribute('data-filter');
      items.forEach(function(it){
        var show = cat === 'all' || it.getAttribute('data-cat') === cat;
        it.style.display = show ? '' : 'none';
      });
    });
  });
}

// ................carousal animation...........................
// Projects coverflow (loop + mouse/touch/keyboard + ARIA)
// Guarded for non-home pages so it doesn't crash if #projectsCarousel is missing.
(function initProjectsCarousel(){
  const carousel = document.getElementById('projectsCarousel');
  if (!carousel) return; // <-- critical fix: don't run on pages without the carousel

  const items = Array.from(carousel.querySelectorAll('.portfolio-item'));
  const prevBtn = carousel.querySelector('.carousel-nav.prev');
  const nextBtn = carousel.querySelector('.carousel-nav.next');

  // If markup is incomplete, bail safely.
  if (!items.length || !prevBtn || !nextBtn) return;

  let index = 0;
  const N = items.length;
  const AUTOPLAY_DELAY = 2500; // 2–3 seconds, tweak as needed
  let timer = null;

  const setClasses = (active) => {
    const prev = (active - 1 + N) % N;
    const next = (active + 1) % N;

    items.forEach(el => el.classList.remove('is-active', 'is-prev', 'is-next'));

    items[active].classList.add('is-active');
    items[prev].classList.add('is-prev');
    items[next].classList.add('is-next');
  };

  const goTo = (i) => {
    index = (i + N) % N;
    setClasses(index);
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const start = () => {
    if (document.hidden) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (timer) return;
    timer = setInterval(next, AUTOPLAY_DELAY);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  // Init
  setClasses(index);
  if (!isMobileScreen()) start();

  // Pause when tab is hidden, resume when visible
  function onVisChange(){ if (document.hidden) stop(); else start(); }
  document.addEventListener('visibilitychange', onVisChange);

  // Controls
  nextBtn.addEventListener('click', () => { stop(); next(); start(); });
  prevBtn.addEventListener('click', () => { stop(); prev(); start(); });

  // Click a side card to bring it to center
  items.forEach((el, i) => {
    el.addEventListener('click', () => {
      if (i === index) return;
      stop();
      goTo(i);
      if (!isMobileScreen()) start();
    });
  });

  // Pause on hover / focus; resume on leave / blur
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);

  // Pause when not visible
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  // Arrow keys
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next(); start(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); stop(); prev(); start(); }
  });
})(); // end guarded projects carousel

//.............................................end.....................


// Back to top
function initBackToTop(){
  var btn = document.getElementById('backToTop');
  if (!btn) return;
  function onScroll(){ btn.classList.toggle('show', window.scrollY>300); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  btn.addEventListener('click', function(){ window.scrollTo({ top:0, behavior:'smooth' }); });
}

// Testimonials coverflow (independent; no HTML changes needed)
(function initTestimonialsCoverflow(){
  const root = document.querySelector('.testimonials-carousel');
  if (!root) return;
  const slides = Array.from(root.querySelectorAll('.testimonial'));
  if (!slides.length) return;

  let i = 0, n = slides.length, timer = null;
  const INTERVAL = 6000;

  function setTabIndexes(activeIdx){
    slides.forEach((s, idx) => s.setAttribute('tabindex', idx === activeIdx ? '0' : '-1'));
  }
  function setAria(){
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', 'Testimonials coverflow');
    root.setAttribute('aria-live', 'off');
    slides.forEach((s, idx) => {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'slide');
      const label = s.querySelector('figcaption')?.textContent?.trim() || ('Testimonial ' + (idx+1));
      s.setAttribute('aria-label', 'Slide ' + (idx+1) + ' of ' + n + ': ' + label);
    });
  }
  function setStates(idx){
    slides.forEach(s => s.className = 'testimonial boxed');
    const prev2 = slides[(idx - 2 + n) % n];
    const prev  = slides[(idx - 1 + n) % n];
    const curr  = slides[idx % n];
    const next  = slides[(idx + 1) % n];
    const next2 = slides[(idx + 2) % n];
    prev2.classList.add('is-prev2');
    prev.classList.add('is-prev');
    curr.classList.add('is-active');
    next.classList.add('is-next');
    next2.classList.add('is-next2');
    setTabIndexes(idx);
  }
  function go(delta){ i = (i + delta + n) % n; setStates(i); }
  function start(){
      if (document.hidden) return;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      stop(); timer = setInterval(() => go(1), INTERVAL);
    }
  function stop(){ if (timer) { clearInterval(timer); timer = null; } }

  setAria();
  setStates(i);
  if (!isMobileScreen()) start();

  // Pause/resume on tab visibility
  document.addEventListener('visibilitychange', ()=>{ if (document.hidden) stop(); else start(); });

  // Pause on hover
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);

  // Pointer swipe
  let startX = null, tracking = false;
  root.addEventListener('pointerdown', e => { tracking = true; startX = e.clientX; root.setPointerCapture(e.pointerId); });
  root.addEventListener('pointerup', e => {
    if (!tracking) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    tracking = false; startX = null;
  });

  // Keyboard arrows
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
  });

  // Click side slides to activate
  slides.forEach((s, idx) => s.addEventListener('click', () => { if (idx !== i) go(idx - i); }));
})();


/*......................FOR WHAT CLIENT SAYS..................*/
// Testimonials Auto-Sliding Animation
function initTestimonialsSlider() {
  const testimonialsGrid = document.querySelector('.testimonials-grid');
  if (!testimonialsGrid) return;

  const cards = testimonialsGrid.querySelectorAll('.t-card');
  if (!cards.length) return;

  let currentIndex = 0;
  let isAutoPlaying = true;
  let autoPlayInterval;

  // Auto-scroll functionality
  function autoScroll() {
    if (!isAutoPlaying) return;
    
    const cardWidth = cards[0].offsetWidth + 32; // card width + gap
    const maxScroll = testimonialsGrid.scrollWidth - testimonialsGrid.clientWidth;
    
    currentIndex++;
    
    if (currentIndex * cardWidth >= maxScroll) {
      // Reset to beginning with smooth transition
      currentIndex = 0;
      testimonialsGrid.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
    } else {
      testimonialsGrid.scrollTo({
        left: currentIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  }

  // Start auto-play
  function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(autoScroll, 4000); // 4 seconds
  }

  // Stop auto-play
  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  // Pause on hover
  testimonialsGrid.addEventListener('mouseenter', () => {
    isAutoPlaying = false;
    stopAutoPlay();
  });

  testimonialsGrid.addEventListener('mouseleave', () => {
    isAutoPlaying = true;
    startAutoPlay();
  });

  // Handle manual scrolling
  let scrollTimeout;
  testimonialsGrid.addEventListener('scroll', () => {
    isAutoPlaying = false;
    stopAutoPlay();
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isAutoPlaying = true;
      startAutoPlay();
    }, 2000); // Resume after 2 seconds of no scrolling
  });

  // Touch/swipe support for mobile
  let startX = 0;
  let scrollLeft = 0;

  testimonialsGrid.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX - testimonialsGrid.offsetLeft;
    scrollLeft = testimonialsGrid.scrollLeft;
    isAutoPlaying = false;
    stopAutoPlay();
  });

  testimonialsGrid.addEventListener('touchmove', (e) => {
    if (!startX) return;
    e.preventDefault();
    const x = e.touches[0].pageX - testimonialsGrid.offsetLeft;
    const walk = (x - startX) * 2;
    testimonialsGrid.scrollLeft = scrollLeft - walk;
  });

  testimonialsGrid.addEventListener('touchend', () => {
    startX = 0;
    setTimeout(() => {
      isAutoPlaying = true;
      startAutoPlay();
    }, 2000);
  });

  // Initialize auto-play
  startAutoPlay();

  // Add smooth momentum scrolling for better UX
  testimonialsGrid.style.scrollSnapType = 'x mandatory';
  cards.forEach(card => {
    card.style.scrollSnapAlign = 'start';
  });
}


// Boot sequence
function isMobileScreen(){ return window.matchMedia && window.matchMedia('(max-width: 720px)').matches; }

document.addEventListener('DOMContentLoaded', function () {
  initInclude().then(function () {
    initHeaderScrollBehavior();
    setActiveNavLink();
    initSmoothScroll();
    initCounters();
    initPortfolioFilter();
    initTestimonialsSlider();
    // Removed call to undefined initCarousel(); the projects carousel self-inits safely.
    initBackToTop();
  });
});

document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('change', () => {
            document.body.style.overflow = menuToggle.checked ? 'hidden' : '';
        });
    }

    // Header scroll effect
    const header = document.querySelector('.site-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
});


// === Custom Cursor ===
function initCustomCursor(){
  const cursor = document.createElement("div");
  cursor.classList.add("cursor");
  document.body.appendChild(cursor);
  document.addEventListener("mousemove", e => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Only enable custom cursor on devices with a fine pointer (desktops)
  if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    initCustomCursor();
  }
});
