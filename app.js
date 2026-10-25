/* Eevee — small, dependency-free interaction layer. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const prefersLessMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');
  if (!prefersLessMotion) document.documentElement.classList.add('motion-enabled');

  // Mobile navigation.
  const menu = $('.nav-list');
  const menuButton = $('.nav-toggle');
  const closeMenu = () => {
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  };
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  $$('a', menu).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // Entry reveals: observe only until each item becomes visible.
  const reveals = $$('.reveal');
  if (!prefersLessMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add('is-visible');
        revealObserver.unobserve(target);
      });
    }, { threshold: 0.09, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(el => revealObserver.observe(el));
  } else reveals.forEach(el => el.classList.add('is-visible'));

  // Active nav: an observer avoids scanning every section during scroll.
  const navLinks = $$('.nav-list a');
  const sections = $$('section[id]');
  const onSection = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (!visible.length) return;
    const id = visible[0].target.id === 'jasper' ? 'about' : visible[0].target.id;
    navLinks.forEach(link => {
      const active = link.hash === '#' + id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -50% 0px', threshold: 0 });
  sections.forEach(section => onSection.observe(section));

  // One rAF-scoped scroll effect: progress, image depth, headline ticker, floating orbs.
  const progress = $('.progress');
  const photoFrames = $$('.photo-parallax').map(img => ({img, frame: img.closest('figure')}));
  const marques = $$('.marquee-text');
  const orbs = $$('.hero-float');
  // Cinematic reel: one pinned section, four photo worlds. No scroll hijacking.
  const reel = $('.story-reel');
  const reelScenes = $$('.reel-scene', reel);
  const reelCounter = $('.reel-counter', reel);
  const storySections = $$('.project-section');
  const hero = $('#about');
  const heroHeadline = $('.headline', hero);
  const chapterName = $('.chapter-status-name');
  const chapterCounter = $('.chapter-status-counter');
  const chapterLabels = { about: ['ABOUT', '01 / 05'], jasper: ['JASPER', '01 / 05'],
    kpop: ['K-POP CLUB', '02 / 05'], dance: ['DANCE', '03 / 05'],
    research: ['RESEARCH', '04 / 05'], alpine: ['ALPINE', '05 / 05'] };
  let ticking = false;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function paintScroll() {
    ticking = false;
    const height = window.innerHeight;
    const scrollMax = document.documentElement.scrollHeight - height;
    progress.style.transform = 'scaleX(' + (scrollMax > 0 ? clamp(scrollY / scrollMax, 0, 1) : 0) + ')';
    // Decorative chapter indicator updates without altering the actual page content.
    if (prefersLessMotion) return;
    if (hero) {
      const heroRect = hero.getBoundingClientRect();
      if (heroRect.bottom > 0 && heroRect.top < height) {
        const t = clamp(-heroRect.top / Math.max(1, heroRect.height), 0, 1);
        heroHeadline.style.setProperty('--hero-move', (-t * 92).toFixed(1) + 'px');
        heroHeadline.style.setProperty('--hero-rotate', (-t * 1.1).toFixed(2) + 'deg');
        heroHeadline.style.setProperty('--hero-scale', (1 + t * .025).toFixed(3));
        hero.style.setProperty('--hero-glow-y', (t * 185).toFixed(1) + 'px');
        hero.style.setProperty('--hero-glow-rotate', (t * 48).toFixed(1) + 'deg');
      }
    }
    // Each 1/3 of the reel scroll scrubs between adjacent scenes like a film.
    if (reel) {
      const box = reel.getBoundingClientRect();
      if (box.bottom > 0 && box.top < height) {
        const total = Math.max(1, box.height - height);
        const reelProgress = clamp(-box.top / total, 0, 1);
        const position = reelProgress * (reelScenes.length - 1);
        reel.style.setProperty('--reel-progress', reelProgress.toFixed(4));
        reelScenes.forEach((scene, index) => {
          const delta = index - position;
          const distance = Math.abs(delta);
          const blend = clamp((.72 - distance) / .44, 0, 1);
          scene.style.opacity = (blend * blend * (3 - 2 * blend)).toFixed(3);
          scene.style.transform = `translate3d(${(delta * 120).toFixed(1)}px,${(Math.min(distance,1) * 92).toFixed(1)}px,0) scale(${(1 - Math.min(distance,1) * .14).toFixed(3)}) rotate(${(delta * -7).toFixed(2)}deg)`;
          scene.style.clipPath = `inset(0 ${Math.min(85, Math.max(0, distance-.28)*85).toFixed(1)}% 0 0 round 22px)`;
          scene.style.pointerEvents = distance < .28 ? 'auto' : 'none';
          const art = $('.reel-art img', scene);
          if (art) {
            scene.style.setProperty('--scene-image-scale', (1.09 + Math.min(distance,1)*.15).toFixed(3));
            scene.style.setProperty('--scene-image-y', ((delta * 18).toFixed(1)) + 'px');
          }
        });
        reelCounter.textContent = `${String(Math.round(position)+1).padStart(2,'0')}—04`;
        chapterName.textContent = 'FOUR WORLDS';
        chapterCounter.textContent = `${String(Math.round(position)+1).padStart(2,'0')} / 04`;
      } else {
        // A section in the center of the viewport defines the non-reel chapter.
        const visible = sections.map(section => ({section,rect:section.getBoundingClientRect()}))
          .filter(({rect}) => rect.top < height*.58 && rect.bottom > height*.58);
        const section = visible[0]?.section;
        const label = chapterLabels[section?.id || 'about'];
        chapterName.textContent = label[0];
        chapterCounter.textContent = label[1];
      }
    }
    for (const section of storySections) {
      const box = section.getBoundingClientRect();
      if (box.bottom < -50 || box.top > height + 50) continue;
      const extent = clamp((height - box.top) / (box.height + height), 0, 1);
      section.style.setProperty('--chapter-shift', ((extent - .5)*200).toFixed(1)+'px');
      section.style.setProperty('--title-scrub', ((extent - .37)*45).toFixed(1)+'px');
      const feature = $('.photo-feature', section);
      if (feature) {
        const fbox = feature.getBoundingClientRect();
        const q = clamp((height-fbox.top)/(height+fbox.height),0,1);
        feature.style.setProperty('--feature-rotate', ((.5-q)*6).toFixed(2)+'deg');
        feature.style.setProperty('--feature-scale', (1+Math.abs(q-.5)*.035).toFixed(3));
        feature.style.setProperty('--feature-drift', ((.5-q)*72).toFixed(1)+'px');
      }
      const tape = $('.kinetic-tape>span', section);
      if (tape) tape.style.setProperty('--tape-x', (-extent*450).toFixed(1)+'px');
    }
    for (const {img, frame} of photoFrames) {
      if (!frame) continue;
      const rect = frame.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= height) continue;
      const relative = (rect.top + rect.height / 2 - height / 2) / height;
      img.style.setProperty('--parallax-y', (clamp(-relative * 60, -35, 35)).toFixed(1) + 'px');
    }
    for (const text of marques) {
      const rect = text.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < height)
        text.style.setProperty('--marquee-x', clamp(-rect.top * 0.3, -260, 260).toFixed(1) + 'px');
    }
    // Hero circles drift subtly as the first screen scrolls past.
    if (scrollY < height * 1.8)
      orbs.forEach((orb, index) => orb.style.setProperty('--orb-y', Math.round(scrollY * (index ? -.17 : .25)) + 'px'));
  }
  const scheduleScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(paintScroll); } };
  addEventListener('scroll', scheduleScroll, { passive: true });
  addEventListener('resize', scheduleScroll, { passive: true });
  scheduleScroll();

  // Light-reactive pointer and a single tilt target; disabled for touch / reduced motion.
  if (!prefersLessMotion && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const halo = $('.pointer-halo');
    let pointerX = -500, pointerY = -500, pointerScheduled = false;
    document.addEventListener('pointermove', event => {
      pointerX = event.clientX; pointerY = event.clientY;
      if (!pointerScheduled) {
        pointerScheduled = true;
        requestAnimationFrame(() => {
          pointerScheduled = false;
          halo.style.transform = `translate3d(${(pointerX-170).toFixed(0)}px,${(pointerY-170).toFixed(0)}px,0)`;
        });
      }
    }, {passive:true});
  }

  // Build each album once, only when opened. Album contents live in gallery-data.js.
  $$('details.archive').forEach(album => {
    album.addEventListener('toggle', () => {
      if (!album.open || album.dataset.rendered) return;
      const gallery = $('[data-album]', album);
      const albumData = (window.EEVEE_ALBUMS || {})[album.id];
      if (!albumData) return;
      const fragment = document.createDocumentFragment();
      albumData.captions.forEach((caption, index) => {
        const src = `assets/${albumData.folder}-${String(index).padStart(2, '0')}.webp`;
        const alt = `${albumData.label} photo ${index + 1}`;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'gallery-item';
        button.dataset.lightboxSrc = src;
        button.dataset.lightboxCaption = caption;
        button.setAttribute('aria-label', 'View ' + alt);
        button.style.setProperty('--stagger', Math.min(index, 8));
        const image = document.createElement('img');
        image.className = 'gallery-thumb';
        image.src = src;
        image.alt = alt;
        image.loading = 'lazy';
        image.decoding = 'async';
        button.append(image);
        fragment.append(button);
      });
      gallery.append(fragment);
      album.dataset.rendered = 'true';
    });
  });

  // YouTube embeds are only fetched when clicked; file:// previews open YouTube
  // instead of triggering YouTube Error 153 (missing Referer).
  $$('[data-youtube]').forEach(stage => {
    const thumb = $('img', stage);
    // Try an HD YouTube poster. Some videos return a tiny placeholder for maxresdefault.
    if (thumb) {
      const videoId = stage.dataset.youtube;
      const qualityNames = ['maxresdefault', 'sddefault', 'hqdefault'];
      let qualityIndex = 0;
      const tryNext = () => {
        if (qualityIndex < qualityNames.length - 1) {
          qualityIndex++;
          thumb.src = `https://i.ytimg.com/vi/${videoId}/${qualityNames[qualityIndex]}.jpg`;
        } else if (!thumb.naturalWidth) {
          thumb.hidden = true;
        }
      };
      thumb.addEventListener('error', tryNext);
      thumb.addEventListener('load', () => {
        if (thumb.naturalWidth <= 120 && qualityIndex < qualityNames.length - 1) tryNext();
      });
      if (thumb.complete && thumb.naturalWidth <= 120) tryNext();
    }
    $('.play-trigger', stage).addEventListener('click', () => {
      const id = stage.dataset.youtube;
      if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return;
      if (location.protocol === 'file:') {
        open('https://www.youtube.com/watch?v=' + encodeURIComponent(id), '_blank', 'noopener,noreferrer');
        return;
      }
      const frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      frame.title = stage.dataset.title || 'YouTube video';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      stage.replaceChildren(frame);
    });
  });

  // One delegated listener covers every generated photo, instead of 90 listeners.
  const modal = $('#photo-lightbox');
  const modalImage = $('img', modal);
  const caption = $('p', modal);
  document.addEventListener('click', ({ target }) => {
    const button = target.closest?.('[data-lightbox-src]');
    if (!button) return;
    modalImage.src = button.dataset.lightboxSrc;
    modalImage.alt = button.dataset.lightboxCaption || 'Gallery photo';
    caption.textContent = button.dataset.lightboxCaption || '';
    modal.showModal();
  });
  $('.close-lightbox', modal).addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
})();
