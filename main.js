/**
 * PROPUESTA B — STONE & INK
 * main.js — AnimeJS Animations + Interactivity
 */

// =============================================
// HEADER SCROLL
// =============================================
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// =============================================
// HAMBURGER & MOBILE MENU (ANIMEJS + FAIL-SAFE)
// =============================================
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
const navCloseBtn = document.getElementById('navCloseBtn');
const navLinks = nav ? nav.querySelectorAll('.nav__links a, a') : [];
let isMenuAnimating = false;
let savedScrollY = 0;

function handleMenuTouchMove(e) {
  if (nav && nav.contains(e.target)) {
    return;
  }
  e.preventDefault();
}

function openMenu() {
  if (!nav || !hamburger) return;

  // Cancel any running animations
  if (typeof anime !== 'undefined') {
    try {
      anime.remove(nav);
      anime.remove(navLinks);
    } catch (e) {}
  }

  savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  document.body.style.top = `-${savedScrollY}px`;
  document.body.classList.add('menu-open');
  document.documentElement.classList.add('menu-open');
  document.addEventListener('touchmove', handleMenuTouchMove, { passive: false });

  nav.classList.add('open');
  hamburger.classList.add('active');
  hamburger.setAttribute('aria-expanded', 'true');

  if (typeof anime !== 'undefined') {
    isMenuAnimating = true;
    try {
      anime.set(nav, { opacity: 0, translateY: -10 });
      anime.set(navLinks, { opacity: 0, translateY: 24 });

      anime({
        targets: nav,
        opacity: [0, 1],
        translateY: [-10, 0],
        duration: 300,
        easing: 'easeOutCubic'
      });

      anime({
        targets: navLinks,
        opacity: [0, 1],
        translateY: [24, 0],
        delay: anime.stagger(55, { start: 100 }),
        duration: 480,
        easing: 'easeOutCubic',
        complete() {
          isMenuAnimating = false;
        }
      });
    } catch (e) {
      console.warn('Anime open menu error:', e);
      isMenuAnimating = false;
      nav.style.opacity = '1';
      nav.style.transform = 'none';
      navLinks.forEach(l => { l.style.opacity = '1'; l.style.transform = 'none'; });
    }
  }
}

function closeMenu(immediate = false) {
  if (!nav || !hamburger || !nav.classList.contains('open')) return;

  hamburger.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  document.documentElement.classList.remove('menu-open');
  document.body.style.top = '';
  window.scrollTo(0, savedScrollY);
  document.removeEventListener('touchmove', handleMenuTouchMove);

  // Cancel any running animations to never block
  if (typeof anime !== 'undefined') {
    try {
      anime.remove(nav);
      anime.remove(navLinks);
    } catch (e) {}
  }

  if (immediate || window.innerWidth > 768 || typeof anime === 'undefined') {
    nav.classList.remove('open');
    nav.style.opacity = '';
    nav.style.transform = '';
    navLinks.forEach(l => { l.style.opacity = ''; l.style.transform = ''; });
    isMenuAnimating = false;
    return;
  }

  isMenuAnimating = true;
  try {
    anime({
      targets: navLinks,
      opacity: [1, 0],
      translateY: [0, -12],
      delay: anime.stagger(25),
      duration: 180,
      easing: 'easeInQuad'
    });

    anime({
      targets: nav,
      opacity: [1, 0],
      translateY: [0, -8],
      duration: 220,
      delay: 50,
      easing: 'easeInQuad',
      complete() {
        nav.classList.remove('open');
        nav.style.opacity = '';
        nav.style.transform = '';
        navLinks.forEach(l => { l.style.opacity = ''; l.style.transform = ''; });
        isMenuAnimating = false;
      }
    });
  } catch (e) {
    console.warn('Anime close menu error:', e);
    nav.classList.remove('open');
    isMenuAnimating = false;
  }
}

function toggleMenu() {
  if (!nav) return;
  if (nav.classList.contains('open')) {
    closeMenu();
  } else {
    openMenu();
  }
}

if (hamburger) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });
}

if (navCloseBtn) {
  navCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenu();
  });
}

// Close when clicking directly on the backdrop (outside nav content)
if (nav) {
  nav.addEventListener('click', (e) => {
    if (e.target === nav) {
      closeMenu();
    }
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    closeMenu();
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav && nav.classList.contains('open')) {
    closeMenu();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 768 && nav && nav.classList.contains('open')) {
    closeMenu(true);
  }
});

// =============================================
// REVEAL ON SCROLL
// =============================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// =============================================
// ANIMATED COUNTERS
// =============================================
let countersAnimated = false;

const statsObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !countersAnimated) {
    countersAnimated = true;
    document.querySelectorAll('.stat__number').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const obj = { val: 0 };
      anime({
        targets: obj,
        val: target,
        duration: 2200,
        easing: 'easeOutExpo',
        round: 1,
        update() { el.textContent = obj.val; }
      });
    });
    statsObserver.disconnect();
  }
}, { threshold: 0.4 });

const stats = document.querySelector('.stats');
if (stats) statsObserver.observe(stats);

// =============================================
// AREA CARDS — STAGGER
// =============================================
const areasObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    anime({
      targets: '.area-card',
      opacity: [0, 1],
      translateY: [24, 0],
      delay: anime.stagger(90),
      duration: 550,
      easing: 'easeOutCubic'
    });
    areasObserver.disconnect();
  }
}, { threshold: 0.1 });
const areasSection = document.querySelector('.areas');
if (areasSection) areasObserver.observe(areasSection);

// =============================================
// TIMELINE TAB SWITCHER (ANIMEJS ENHANCED)
// =============================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tlItems = document.querySelectorAll('.tl-item');
let isTabAnimating = false;

function switchTab(tabKey, targetBtn = null) {
  if (isTabAnimating) return;
  isTabAnimating = true;

  // Update button states
  tabBtns.forEach(btn => {
    const isActive = btn.dataset.tab === tabKey;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  if (targetBtn) {
    anime({
      targets: targetBtn,
      scale: [0.94, 1],
      duration: 250,
      easing: 'easeOutBack'
    });
  }

  // Determine items to show
  const toShow = [];
  const toHide = [];

  tlItems.forEach(item => {
    const itemTab = item.dataset.tab;
    if (tabKey === 'all' || itemTab === tabKey) {
      toShow.push(item);
    } else {
      toHide.push(item);
    }
  });

  // Fade out items to hide
  anime({
    targets: toHide,
    opacity: [1, 0],
    translateY: [0, -10],
    duration: 180,
    easing: 'easeInQuad',
    complete() {
      toHide.forEach(item => {
        item.classList.add('hidden');
        item.classList.remove('visible');
      });

      // Prepare items to show
      toShow.forEach(item => {
        item.classList.remove('hidden');
        item.classList.add('visible');
      });

      // Stagger items entrance
      anime({
        targets: toShow,
        opacity: [0, 1],
        translateY: [18, 0],
        scale: [0.98, 1],
        delay: anime.stagger(50, { start: 30 }),
        duration: 420,
        easing: 'easeOutCubic',
        complete() {
          isTabAnimating = false;
        }
      });
    }
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabKey = btn.dataset.tab;
    switchTab(tabKey, btn);
  });
});

// Initialize with 'all' to show the complete credentials journey
switchTab('all');

// =============================================
// WHY ITEMS — DESKTOP STAGGER
// =============================================
const whyObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    anime({
      targets: '.why-item',
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(100),
      duration: 500,
      easing: 'easeOutCubic'
    });
    whyObserver.disconnect();
  }
}, { threshold: 0.1 });
const whySection = document.querySelector('.why');
if (whySection) whyObserver.observe(whySection);

// =============================================
// ROUTE PROCESS — DESKTOP STAGGER (ANIMEJS)
// Mobile scroll is handled purely by CSS scroll-snap
// =============================================
const routeObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    if (window.innerWidth > 768 && typeof anime !== 'undefined') {
      anime({
        targets: '.process-step',
        opacity: [0, 1],
        translateY: [24, 0],
        delay: anime.stagger(110, { start: 100 }),
        duration: 550,
        easing: 'easeOutCubic'
      });
    }
    routeObserver.disconnect();
  }
}, { threshold: 0.15 });

const routeProcess = document.querySelector('.route-process');
if (routeProcess) routeObserver.observe(routeProcess);

// =============================================
// CONTACT — SERVICE PILLS
// =============================================
const pills = document.querySelectorAll('.pill');
const asuntoInput = document.getElementById('asunto');
const mensajeInput = document.getElementById('mensaje');

const servicePlaceholders = {
  'Familia': 'Consulta sobre Derecho de Familia',
  'Derecho de Autor': 'Consulta sobre Propiedad Intelectual / Derecho de Autor',
  'Civil': 'Consulta sobre Derecho Civil',
  'Laboral': 'Consulta sobre Derecho Laboral',
  'Penal': 'Consulta sobre Derecho Penal',
  'Consultoría': 'Consultoría General / Asesoría Legal'
};

const mensajePlaceholders = {
  'Familia': 'Describe tu situación familiar (divorcio, tuición, pensión, etc.)...',
  'Derecho de Autor': 'Describe tu obra y el tipo de protección o problema que enfrentas...',
  'Civil': 'Describe el contrato, la responsabilidad u obligación sobre la que necesitas asesoría...',
  'Laboral': 'Describe tu situación laboral: despido, tutela, negociación, etc...',
  'Penal': 'Describe los hechos brevemente (como imputado o víctima)...',
  'Consultoría': 'Cuéntame sobre el tema que necesitas revisar o consultar...'
};

pills.forEach(pill => {
  pill.addEventListener('click', () => {
    pills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    const service = pill.dataset.service;
    asuntoInput.value = servicePlaceholders[service] || `Consulta sobre ${service}`;
    mensajeInput.placeholder = mensajePlaceholders[service] || 'Cuéntame tu situación...';

    anime({
      targets: pill,
      scale: [0.93, 1],
      duration: 250,
      easing: 'easeOutBack'
    });
  });
});

// Initialize
const activeFirst = document.querySelector('.pill.active');
if (activeFirst) {
  const svc = activeFirst.dataset.service;
  asuntoInput.value = servicePlaceholders[svc] || '';
  mensajeInput.placeholder = mensajePlaceholders[svc] || '';
}

// =============================================
// FORM SUBMIT & VALIDATION
// =============================================
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const nombreInput = document.getElementById('nombre');
const emailInput = document.getElementById('email');

[nombreInput, emailInput, mensajeInput].forEach(input => {
  if (input) {
    input.addEventListener('input', () => {
      input.closest('.form__field')?.classList.remove('has-error');
    });
  }
});

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = nombreInput.value.trim();
  const email = emailInput.value.trim();
  const mensaje = mensajeInput.value.trim();

  let hasError = false;
  if (!nombre) {
    nombreInput.closest('.form__field')?.classList.add('has-error');
    hasError = true;
  }
  if (!email || !email.includes('@')) {
    emailInput.closest('.form__field')?.classList.add('has-error');
    hasError = true;
  }
  if (!mensaje) {
    mensajeInput.closest('.form__field')?.classList.add('has-error');
    hasError = true;
  }

  if (hasError) {
    anime({
      targets: contactForm,
      translateX: [-8, 8, -6, 6, 0],
      duration: 350,
      easing: 'easeInOutSine'
    });
    return;
  }

  const origText = submitBtn.innerHTML;
  submitBtn.innerHTML = '¡Consulta enviada! ✓';
  submitBtn.style.background = '#2A2A2A';
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.innerHTML = origText;
    submitBtn.style.background = '';
    submitBtn.disabled = false;
    contactForm.reset();
    const active = document.querySelector('.pill.active');
    if (active) {
      asuntoInput.value = servicePlaceholders[active.dataset.service] || '';
    }
  }, 4000);
});

// =============================================
// SCROLL PROGRESS
// =============================================
const progress = document.createElement('div');
progress.style.cssText = `
  position: fixed; top: 0; left: 0;
  height: 2px; background: #B85C38; z-index: 9999;
  width: 0%; transition: width 0.1s linear; pointer-events: none;
`;
document.body.appendChild(progress);

window.addEventListener('scroll', () => {
  const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  progress.style.width = pct + '%';
}, { passive: true });

// =============================================
// SMOOTH SCROLL
// =============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// =============================================
// AREA CARD CLICK -> AUTO-SELECT CONTACT SERVICE
// =============================================
document.querySelectorAll('.area-card').forEach(card => {
  const selectArea = () => {
    const service = card.dataset.service;
    if (service) {
      const targetPill = document.querySelector(`.pill[data-service="${service}"]`);
      if (targetPill) {
        targetPill.click();
      }
      const contactSection = document.getElementById('contacto');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          mensajeInput.focus();
        }, 500);
      }
    }
  };

  card.addEventListener('click', selectArea);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectArea();
    }
  });
});
