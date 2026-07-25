/* hero-scroll.js — Optimized 240-frame scroll-linked canvas hero for Webore */
(function () {
  'use strict';

  /* ===== Configuration ===== */
  var TOTAL_FRAMES = 240;
  var BATCH_SIZE = 30;
  var FRAME_BASE = '/assets/frames/';
  var FRAME_EXT = '.png';

  var BEATS = [
    { at: 0.00, eyebrow: 'Web Studio',    headline: ['Your stack.', 'Elevated.'],           sub: 'Premium digital experiences that convert.', explore: 'Explore Now →' },
    { at: 0.20, eyebrow: 'Design',        headline: ['Every pixel,', 'designed with intent.'], sub: 'Conversion-first. Always beautiful.' },
    { at: 0.45, eyebrow: 'Craft',         headline: ['Hardware meets', 'artistry.'],          sub: 'Where precision becomes performance.' },
    { at: 0.65, eyebrow: 'Cloud',         headline: ['Built in the', 'cloud. Literally.'],   sub: 'Scalable, fast, and future-ready.' },
    { at: 0.82, eyebrow: 'Studio',        headline: ['Where the', 'work begins.'],            sub: 'Strategy. Design. Launch.' },
    { at: 0.96, eyebrow: 'Launch Ready',  headline: ['Project', 'complete.'],                 sub: 'Ready to start yours?', cta: { text: 'Start a Project →', href: '/contact' } },
  ];

  /* ===== Elements ===== */
  var track      = document.getElementById('heroTrack');
  var canvas     = document.getElementById('hsCanvas');
  var loader     = document.getElementById('hsLoader');
  var loaderBar  = document.getElementById('hsLoaderBar');
  var captionsEl = document.getElementById('hsCaptions');
  var dotsEl     = document.getElementById('hsDots');

  if (!track || !canvas || !loader) return;

  var ctx = canvas.getContext('2d', { alpha: false });

  /* ===== prefers-reduced-motion fallback ===== */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var img0 = new Image();
    img0.onload = function () { resizeCanvas(); drawFrame(img0); loader.classList.add('hidden'); };
    img0.src = FRAME_BASE + padNum(1) + FRAME_EXT;
    return;
  }

  /* ===== State ===== */
  var frames       = new Array(TOTAL_FRAMES);
  var loadedCount  = 0;
  var currentFrame = -1;
  var rafId        = null;
  var pendingDraw  = false;
  var targetFrame  = 0;
  var initialized  = false;

  /* ===== Helpers ===== */
  function padNum(n) { return String(n).padStart(5, '0'); }

  function resizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function drawFrame(img) {
    if (!img || !img.complete || !img.naturalWidth) return;
    var cw = window.innerWidth;
    var ch = window.innerHeight;
    var iw = img.naturalWidth;
    var ih = img.naturalHeight;
    var scale = Math.min(cw / iw, ch / ih);
    var dw = iw * scale;
    var dh = ih * scale;
    var dx = (cw - dw) / 2;
    var dy = (ch - dh) / 2;
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ===== Batch preloader — loads frames in waves to avoid memory/thrashing ===== */
  function preloadFrames(onComplete) {
    var startTime = Date.now();
    var batch = 0;

    function loadBatch() {
      var start = batch * BATCH_SIZE;
      var end = Math.min(start + BATCH_SIZE, TOTAL_FRAMES);
      var batchLoaded = 0;
      var batchTotal = end - start;

      if (batchTotal <= 0) {
        var delay = Math.max(0, 150 - (Date.now() - startTime));
        setTimeout(onComplete, delay);
        return;
      }

      for (var i = start; i < end; i++) {
        (function (idx) {
          var img = new Image();
          img.onload = img.onerror = function () {
            loadedCount++;
            batchLoaded++;
            var pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
            if (loaderBar) loaderBar.style.width = pct + '%';

            /* Draw first frame as soon as it loads */
            if (idx === 0 && currentFrame < 0) {
              currentFrame = 0;
              drawFrame(img);
            }

            if (batchLoaded === batchTotal) {
              batch++;
              /* Small yield between batches to let paint happen */
              setTimeout(loadBatch, 0);
            }
          };
          img.src = FRAME_BASE + padNum(idx + 1) + FRAME_EXT;
          frames[idx] = img;
        })(i);
      }
    }

    loadBatch();
  }

  /* ===== Scroll → frame index ===== */
  function getScrollProgress() {
    var trackRect  = track.getBoundingClientRect();
    var trackHeight = track.offsetHeight - window.innerHeight;
    if (trackHeight <= 0) return 0;
    return Math.max(0, Math.min(1, -trackRect.top / trackHeight));
  }

  /* ===== Caption & dot state ===== */
  var activeCaptionIdx = -1;

  function updateCaptions(progress) {
    var idx = 0;
    for (var i = BEATS.length - 1; i >= 0; i--) {
      if (progress >= BEATS[i].at) { idx = i; break; }
    }
    if (idx === activeCaptionIdx) return;
    activeCaptionIdx = idx;

    var caps = captionsEl ? captionsEl.querySelectorAll('.hs-caption') : [];
    caps.forEach(function (c, i) {
      if (i === idx) {
        c.classList.remove('exit');
        c.classList.add('active');
        animateCaption(c);
      } else {
        if (c.classList.contains('active')) {
          c.classList.add('exit');
          setTimeout(function () { c.classList.remove('active', 'exit'); }, 600);
        }
      }
    });

    var dots = dotsEl ? dotsEl.querySelectorAll('.hs-dot') : [];
    dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
  }

  /* ===== Animate caption words in ===== */
  function animateCaption(captionEl) {
    var eyebrow = captionEl.querySelector('.hs-caption__eyebrow');
    if (eyebrow) {
      eyebrow.style.cssText = 'opacity:0;transform:translateY(10px);';
      requestAnimationFrame(function () {
        eyebrow.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)';
        eyebrow.style.opacity = '1';
        eyebrow.style.transform = 'translateY(0)';
      });
    }

    var words = captionEl.querySelectorAll('.hs-word-outer');
    words.forEach(function (outer, i) {
      var inner = outer.querySelector('.hs-word-inner');
      if (!inner) return;
      inner.style.transform = 'translateY(105%) skewY(3deg)';
      var delay = 120 + i * 90;
      setTimeout(function () {
        inner.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        inner.style.transform  = 'translateY(0) skewY(0deg)';
      }, delay);
    });

    var sub = captionEl.querySelector('.hs-caption__sub');
    if (sub) {
      sub.style.cssText = 'opacity:0;transform:translateY(12px);';
      setTimeout(function () {
        sub.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)';
        sub.style.opacity = '1';
        sub.style.transform = 'translateY(0)';
      }, 480);
    }

    var cta = captionEl.querySelector('.hs-caption__cta, .hs-caption__explore');
    if (cta) {
      cta.style.cssText = 'opacity:0;transform:scale(0.88) translateY(8px);';
      setTimeout(function () {
        cta.style.transition = 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.56,0.64,1)';
        cta.style.opacity = '1';
        cta.style.transform = 'scale(1) translateY(0)';
      }, 680);
    }
  }

  /* ===== RAF draw loop with frame skipping ===== */
  function scheduleFrame(frameIdx) {
    targetFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIdx));
    if (!pendingDraw) {
      pendingDraw = true;
      rafId = requestAnimationFrame(renderLoop);
    }
  }

  function renderLoop() {
    pendingDraw = false;
    if (targetFrame !== currentFrame) {
      currentFrame = targetFrame;
      var img = frames[currentFrame];
      if (img && img.complete && img.naturalWidth) {
        drawFrame(img);
      }
    }
  }

  /* ===== Optimized scroll listener — single RAF throttle, skip duplicate frames ===== */
  var scrollScheduled = false;
  var lastProgress = -1;
  function onScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(function () {
      scrollScheduled = false;
      var progress = getScrollProgress();
      var frameIdx = Math.round(progress * (TOTAL_FRAMES - 1));
      /* Skip if same frame — avoids unnecessary canvas redraws */
      if (frameIdx !== lastProgress) {
        lastProgress = frameIdx;
        scheduleFrame(frameIdx);
      }
      updateCaptions(progress);
    });
  }

  /* ===== Debounced resize ===== */
  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeCanvas();
      if (currentFrame >= 0 && frames[currentFrame]) drawFrame(frames[currentFrame]);
    }, 200);
  }

  /* ===== Dot click → scroll to beat ===== */
  function initDotNavigation() {
    if (!dotsEl) return;
    dotsEl.querySelectorAll('.hs-dot').forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        var trackHeight = track.offsetHeight - window.innerHeight;
        var scrollTo = track.offsetTop + BEATS[i].at * trackHeight;
        window.scrollTo({ top: scrollTo, behavior: 'smooth' });
      });
    });
  }

  /* ===== Build DOM: captions + dots ===== */
  function wrapHeadlineWords(lines) {
    return lines.map(function (line) {
      var words = line.split(' ');
      return '<div class="hs-caption__headline-line">' +
        words.map(function (word) {
          return '<span class="hs-word-outer"><span class="hs-word-inner">' + word + '</span></span>';
        }).join(' ') +
        '</div>';
    }).join('');
  }

  function buildCaptions() {
    if (!captionsEl) return;
    captionsEl.innerHTML = '';
    BEATS.forEach(function (beat, i) {
      var div = document.createElement('div');
      div.className = 'hs-caption';
      div.setAttribute('data-index', i);

      div.innerHTML =
        '<span class="hs-caption__eyebrow">' + beat.eyebrow + '</span>' +
        '<h2 class="hs-caption__headline">' + wrapHeadlineWords(beat.headline) + '</h2>' +
        '<p class="hs-caption__sub">' + beat.sub + '</p>' +
        (beat.explore ? '<a class="hs-caption__explore" href="#">' + beat.explore + '</a>' : '') +
        (beat.cta     ? '<a class="hs-caption__cta" href="' + beat.cta.href + '">' + beat.cta.text + '</a>' : '');

      var exploreLink = div.querySelector('.hs-caption__explore');
      if (exploreLink) {
        exploreLink.addEventListener('click', function (e) {
          e.preventDefault();
          window.scrollTo({ top: track.offsetTop + window.innerHeight, behavior: 'smooth' });
        });
      }

      captionsEl.appendChild(div);
    });
  }

  function buildDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    BEATS.forEach(function (beat, i) {
      var dot = document.createElement('button');
      dot.className = 'hs-dot';
      dot.setAttribute('aria-label', 'Go to: ' + beat.headline.join(' '));
      dotsEl.appendChild(dot);
    });
  }

  /* ===== Init ===== */
  function init() {
    if (initialized) return;
    initialized = true;

    resizeCanvas();
    buildCaptions();
    buildDots();
    initDotNavigation();

    preloadFrames(function () {
      if (currentFrame < 0) currentFrame = 0;
      drawFrame(frames[currentFrame]);
      updateCaptions(0);
      if (loader) loader.classList.add('hidden');
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      onScroll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
