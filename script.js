((d) => {
    const $ = (s, c) => (c || d).querySelector(s);
    const $$ = (s, c) => (c || d).querySelectorAll(s);

    const nav = $('#nav');
    const hero = $('#hero');
    const navAnchors = $$('.nav-links a');
    const sections = [...navAnchors].map(a => $(a.hash));
    const toggle = $('.menu-toggle');
    const navLinks = $('.nav-links');
    const lightbox = $('#lightbox');
    const lbImg = $('.lightbox-content img', lightbox);
    const lbCaption = $('.lightbox-caption', lightbox);
    const lbDots = $$('.lb-dot', lightbox);
    const galleryItems = $$('.gallery-item');
    const contactForm = $('#contact-form');
    const formStatus = $('#form-status');
    const scrollHint = $('.scroll-hint');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let ticking = false, menuLock = false, navLock = false, submitting = false;
    let currentIndex = 0, lastFocused = null;

    // ─── SCROLL: nav glass + scroll-spy (single rAF-batched handler) ───
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const sy = scrollY;
            nav.classList.toggle('scrolled', sy > 40);
            nav.classList.toggle('on-hero', sy < hero.offsetHeight - 80);
            if (scrollHint) scrollHint.style.opacity = sy > 100 ? '0' : '';
            if (d.body.style.overflow === 'hidden' && !lightbox.classList.contains('active')) d.body.style.overflow = '';
            const threshold = sy + 200;
            let active = -1;
            for (let i = sections.length - 1; i >= 0; i--) {
                if (sections[i] && sections[i].offsetTop <= threshold) { active = i; break; }
            }
            navAnchors.forEach((a, i) => a.classList.toggle('active', i === active));
            ticking = false;
        });
    }
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });

    // ─── MOBILE MENU (debounced toggle) ───
    toggle.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        if (menuLock) return;
        menuLock = true;
        setTimeout(() => menuLock = false, 350);
        const open = navLinks.classList.toggle('open');
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
    d.addEventListener('click', (e) => {
        if (!menuLock && navLinks.classList.contains('open') && !navLinks.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });
    function closeMenu() {
        navLinks.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        if (!lightbox.classList.contains('active')) d.body.style.overflow = '';
    }

    // ─── LIGHTBOX (preload + crossfade + debounced nav) ───
    const originals = [
        'Portfolio/Terrarium/Terrarium I - Oil and Acrylic on Canvas - 72" x 48".jpg',
        'Portfolio/Terrarium/Terrarium II - Oil and Acrylic on Canvas - 72" x 48".jpg',
        'Portfolio/Terrarium/Terrarium III - Oil and Acrylic on Canvas - 72" x 48".jpg'
    ];
    const artworks = [...galleryItems].map((el, i) => ({
        src: el.dataset.full || $('img', el).src,
        original: originals[i],
        title: $('.work-title', el).textContent,
        medium: $('.work-medium', el).textContent
    }));
    let preloaded = false;

    function show(animate) {
        const a = artworks[currentIndex];
        if (animate) { lbImg.style.opacity = '0'; lbImg.style.transform = 'scale(.97)'; }
        const img = new Image();
        img.src = a.src;
        const apply = () => {
            lbImg.src = a.src;
            lbImg.alt = a.title + ': artwork detail view';
            lbCaption.textContent = '';
            const em = d.createElement('em');
            em.textContent = a.title;
            const dl = d.createElement('a');
            dl.href = a.original;
            dl.download = '';
            dl.className = 'lb-download';
            dl.setAttribute('aria-label', 'Download ' + a.title + ' full resolution');
            dl.textContent = 'Download Full Res';
            lbCaption.append(em, ' – ' + a.medium, d.createElement('br'), dl);
            if (animate) requestAnimationFrame(() => { lbImg.style.opacity = '1'; lbImg.style.transform = 'scale(1)'; });
        };
        img.onerror = apply;
        img.complete ? apply() : img.onload = apply;
        lbDots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    }

    function openLB(i) {
        if (!preloaded) { preloaded = true; artworks.forEach(a => { (new Image()).src = a.src; }); }
        lastFocused = d.activeElement;
        currentIndex = i;
        show(false);
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        d.body.style.overflow = 'hidden';
        $('.lightbox-close', lightbox).focus();
    }

    function closeLB() {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        d.body.style.overflow = '';
        if (lastFocused) lastFocused.focus();
    }

    function nav2(dir) {
        if (navLock) return;
        navLock = true;
        currentIndex = (currentIndex + dir + artworks.length) % artworks.length;
        show(true);
        setTimeout(() => navLock = false, 280);
    }

    galleryItems.forEach((el, i) => {
        el.addEventListener('click', () => openLB(i));
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLB(i); } });
    });

    $('.lightbox-close', lightbox).addEventListener('click', closeLB);
    $('.lightbox-prev', lightbox).addEventListener('click', () => nav2(-1));
    $('.lightbox-next', lightbox).addEventListener('click', () => nav2(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target === $('.lightbox-content', lightbox)) closeLB(); });

    let touchStartX = 0;
    lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) nav2(dx < 0 ? 1 : -1);
    });

    d.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        switch (e.key) {
            case 'Escape': closeLB(); break;
            case 'ArrowLeft': nav2(-1); break;
            case 'ArrowRight': nav2(1); break;
            case 'Tab': {
                const f = [...lightbox.querySelectorAll('button, a[href]')];
                if (!f.length) return;
                const [first, last] = [f[0], f[f.length - 1]];
                if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        }
    });

    // ─── FADE-IN (single IntersectionObserver) ───
    const targets = $$('.section-header,.gallery-item,.about-text,.about-images,.statement-content,.cv-content,.ig-header,.ig-grid,.ig-follow,.contact-content,.footer-inner');
    if (reducedMotion) {
        targets.forEach(el => el.classList.add('visible'));
    } else {
        targets.forEach(el => el.classList.add('fade-in'));
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
        }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });
        targets.forEach(el => obs.observe(el));
    }

    // ─── NAV NAME → TOP ───
    $('.nav-name').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

    // ─── CONTACT FORM ───
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (submitting) return;
            submitting = true;
            const btn = $('.form-submit', contactForm);
            btn.disabled = true;
            btn.textContent = 'Sending...';
            formStatus.textContent = '';
            formStatus.className = 'form-status';
            fetch(contactForm.action, { method: 'POST', body: new FormData(contactForm), headers: { Accept: 'application/json' } })
                .then(r => { if (!r.ok) throw 0; formStatus.textContent = '✓ Message sent. Thank you!'; formStatus.className = 'form-status success'; contactForm.reset(); })
                .catch(() => { formStatus.textContent = '✗ Something went wrong. Please try again.'; formStatus.className = 'form-status error'; })
                .finally(() => { btn.disabled = false; btn.textContent = 'Submit'; submitting = false; });
        });
    }


})(document);
