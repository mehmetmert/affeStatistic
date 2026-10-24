/* ============================================================================
   affeStats — Çekirdek Motor
   İçerik:
   1. Mulberry32 tohumlu RNG + Box-Muller Gauss örnekleyici
   2. jStat sarmalayıcıları (PDF/CDF/Quantile — gerçek matematiksel hassasiyet)
   3. Çevrimiçi (Welford) tanımlayıcı istatistik biriktiricisi
   4. 2B Kanvas Çizim Yardımcıları (eksenler, dağılım eğrisi, alan boyama, histogram)
   ============================================================================ */
(function () {
  'use strict';

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ------------------------------------------------------------------------
     1. RASTGELE SAYI ÜRETEÇİ
     ------------------------------------------------------------------------ */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeGaussian(rand) {
    let spare = null;
    return function (mean, std) {
      mean = mean == null ? 0 : mean;
      std = std == null ? 1 : std;
      if (spare != null) {
        const v = spare; spare = null;
        return mean + std * v;
      }
      let u, v, s;
      do {
        u = rand() * 2 - 1;
        v = rand() * 2 - 1;
        s = u * u + v * v;
      } while (s === 0 || s >= 1);
      const mul = Math.sqrt(-2 * Math.log(s) / s);
      spare = v * mul;
      return mean + std * (u * mul);
    };
  }

  /* ------------------------------------------------------------------------
     2. DAĞILIM FONKSİYONLARI (jStat sarmalayıcıları — yaklaşık/sahte YASAK)
     ------------------------------------------------------------------------ */
  function requireJStat() {
    if (!window.jStat) throw new Error('jStat yüklenemedi — dağılım hesapları için gereklidir.');
    return window.jStat;
  }

  const dist = {
    normal: {
      pdf: (x, mean, std) => requireJStat().normal.pdf(x, mean, std),
      cdf: (x, mean, std) => requireJStat().normal.cdf(x, mean, std),
      inv: (p, mean, std) => requireJStat().normal.inv(p, mean, std)
    },
    t: {
      pdf: (x, dof) => requireJStat().studentt.pdf(x, dof),
      cdf: (x, dof) => requireJStat().studentt.cdf(x, dof),
      inv: (p, dof) => requireJStat().studentt.inv(p, dof)
    },
    chisq: {
      pdf: (x, dof) => requireJStat().chisquare.pdf(x, dof),
      cdf: (x, dof) => requireJStat().chisquare.cdf(x, dof),
      inv: (p, dof) => requireJStat().chisquare.inv(p, dof)
    },
    f: {
      pdf: (x, d1, d2) => requireJStat().centralF.pdf(x, d1, d2),
      cdf: (x, d1, d2) => requireJStat().centralF.cdf(x, d1, d2),
      inv: (p, d1, d2) => requireJStat().centralF.inv(p, d1, d2)
    },
    beta: {
      pdf: (x, a, b) => requireJStat().beta.pdf(x, a, b),
      cdf: (x, a, b) => requireJStat().beta.cdf(x, a, b),
      inv: (p, a, b) => requireJStat().beta.inv(p, a, b)
    },
    binomial: {
      pdf: (k, n, p) => requireJStat().binomial.pdf(k, n, p),
      cdf: (k, n, p) => requireJStat().binomial.cdf(k, n, p)
    },
    poisson: {
      pdf: (k, lambda) => requireJStat().poisson.pdf(k, lambda),
      cdf: (k, lambda) => requireJStat().poisson.cdf(k, lambda)
    },
    exponential: {
      pdf: (x, rate) => requireJStat().exponential.pdf(x, rate),
      cdf: (x, rate) => requireJStat().exponential.cdf(x, rate),
      inv: (p, rate) => requireJStat().exponential.inv(p, rate)
    },
    geometric: {
      // jStat'ta yok: P(X=k) = (1-p)^(k-1) p,  k = 1,2,3...
      pdf: (k, p) => (k < 1 ? 0 : Math.pow(1 - p, k - 1) * p),
      cdf: (k, p) => (k < 1 ? 0 : 1 - Math.pow(1 - p, Math.floor(k)))
    },
    hypergeometric: {
      // P(X=k): N nüfus, K başarı, n çekiliş
      pdf: (k, N, K, n) => {
        const C = (a, b) => requireJStat().combination(a, b);
        if (k < 0 || k > n || k > K || n - k > N - K) return 0;
        return (C(K, k) * C(N - K, n - k)) / C(N, n);
      }
    }
  };

  /* ------------------------------------------------------------------------
     3. ÇEVRİMİÇİ TANIMLAYICI İSTATİSTİK (Welford algoritması)
     ------------------------------------------------------------------------ */
  function RunningStats() {
    this.n = 0; this.mean = 0; this.M2 = 0; this.M3 = 0; this.M4 = 0;
    this.min = Infinity; this.max = -Infinity;
  }
  RunningStats.prototype.add = function (x) {
    const n1 = this.n;
    this.n += 1;
    const delta = x - this.mean;
    const deltaN = delta / this.n;
    const deltaN2 = deltaN * deltaN;
    const term1 = delta * deltaN * n1;
    this.mean += deltaN;
    this.M4 += term1 * deltaN2 * (this.n * this.n - 3 * this.n + 3) + 6 * deltaN2 * this.M2 - 4 * deltaN * this.M3;
    this.M3 += term1 * deltaN * (this.n - 2) - 3 * deltaN * this.M2;
    this.M2 += term1;
    if (x < this.min) this.min = x;
    if (x > this.max) this.max = x;
  };
  RunningStats.prototype.variance = function () { return this.n > 1 ? this.M2 / (this.n - 1) : 0; };
  RunningStats.prototype.popVariance = function () { return this.n > 0 ? this.M2 / this.n : 0; };
  RunningStats.prototype.std = function () { return Math.sqrt(this.variance()); };
  RunningStats.prototype.skewness = function () {
    if (this.n < 2) return 0;
    const m2 = this.M2 / this.n, m3 = this.M3 / this.n;
    return m2 > 0 ? m3 / Math.pow(m2, 1.5) : 0;
  };
  RunningStats.prototype.kurtosis = function () {
    if (this.n < 2) return 0;
    const m2 = this.M2 / this.n, m4 = this.M4 / this.n;
    return m2 > 0 ? m4 / (m2 * m2) - 3 : 0;
  };

  function median(arr) {
    if (!arr.length) return NaN;
    const s = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }
  function quantile(arr, p) {
    if (!arr.length) return NaN;
    const s = arr.slice().sort((a, b) => a - b);
    const idx = clamp(p, 0, 1) * (s.length - 1);
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return s[lo];
    return s[lo] + (s[hi] - s[lo]) * (idx - lo);
  }

  /* ------------------------------------------------------------------------
     4. KANVAS YARDIMCILARI
     ------------------------------------------------------------------------ */
  function fitCanvas(canvas) {
    if (!canvas) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(200, Math.floor(rect.width));
    const h = Math.max(120, Math.floor(rect.height));
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h, dpr };
  }

  function linspace(a, b, n) {
    const out = new Array(n);
    const step = (b - a) / (n - 1);
    for (let i = 0; i < n; i++) out[i] = a + step * i;
    return out;
  }

  function formatNum(x, digits) {
    if (!isFinite(x)) return '—';
    digits = digits == null ? 3 : digits;
    return Number(x.toFixed(digits)).toString();
  }

  function makeScale(domain, rangePx) {
    const [d0, d1] = domain, [r0, r1] = rangePx;
    const toPx = (v) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
    const toVal = (px) => d0 + ((px - r0) / (r1 - r0 || 1)) * (d1 - d0);
    return { toPx, toVal };
  }

  function drawAxes(ctx, plotArea, opts) {
    opts = opts || {};
    const { x0, y0, w, h } = plotArea;
    ctx.strokeStyle = opts.axisColor || 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h);
    ctx.moveTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h);
    ctx.stroke();
    if (opts.gridLines) {
      ctx.strokeStyle = 'rgba(148,163,184,0.1)';
      for (let i = 1; i < opts.gridLines; i++) {
        const gy = y0 + (h * i) / opts.gridLines;
        ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x0 + w, gy); ctx.stroke();
      }
    }
  }

  function drawCurve(ctx, xScale, yScale, fn, x0, x1, color, lineWidth, samples) {
    samples = samples || 200;
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const x = x0 + ((x1 - x0) * i) / samples;
      const y = fn(x);
      const px = xScale.toPx(x), py = yScale.toPx(y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 2;
    ctx.stroke();
  }

  function fillArea(ctx, xScale, yScale, fn, a, b, baselineY, color, samples) {
    samples = samples || 140;
    ctx.beginPath();
    ctx.moveTo(xScale.toPx(a), baselineY);
    for (let i = 0; i <= samples; i++) {
      const x = a + ((b - a) * i) / samples;
      ctx.lineTo(xScale.toPx(x), yScale.toPx(fn(x)));
    }
    ctx.lineTo(xScale.toPx(b), baselineY);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawHistogram(ctx, xScale, yScale, bins, binW, baselineY, color) {
    bins.forEach((count, i) => {
      if (!count) return;
      const xL = xScale.toPx(i * binW);
      const xR = xScale.toPx((i + 1) * binW);
      const yT = yScale.toPx(count);
      ctx.fillStyle = color;
      ctx.fillRect(xL + 0.5, yT, Math.max(1, xR - xL - 1), baselineY - yT);
    });
  }

  /* ------------------------------------------------------------------------
     5. DOĞRUSAL CEBİR / REGRESYON YARDIMCILARI
     ------------------------------------------------------------------------ */
  // Basit doğrusal regresyon y = b0 + b1 x (en küçük kareler, kapalı form).
  function linreg(xs, ys) {
    const n = xs.length;
    const xbar = jStatMean(xs), ybar = jStatMean(ys);
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (xs[i] - xbar) * (ys[i] - ybar); sxx += (xs[i] - xbar) * (xs[i] - xbar); }
    const b1 = sxx !== 0 ? sxy / sxx : 0;
    const b0 = ybar - b1 * xbar;
    return { b0, b1, predict: (x) => b0 + b1 * x };
  }
  function jStatMean(arr) { let s = 0; for (let i = 0; i < arr.length; i++) s += arr[i]; return s / arr.length; }

  // Polinom regresyon (derece d): normal denklemler + jStat.lstsq (QR) ile çöz.
  function polyfit(xs, ys, degree) {
    const n = xs.length;
    const A = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let p = 0; p <= degree; p++) row.push(Math.pow(xs[i], p));
      A.push(row);
    }
    const b = ys.map((y) => [y]);
    const js = requireJStat();
    let coeffs;
    try {
      const sol = js.lstsq ? js.lstsq(A, ys) : null;
      coeffs = sol && sol.length ? sol : null;
    } catch (_) { coeffs = null; }
    if (!coeffs) {
      // Yedek: normal denklemler (A^T A) c = A^T y, Gauss eliminasyonu ile.
      coeffs = solveNormalEquations(A, ys, degree + 1);
    }
    return {
      coeffs,
      predict: (x) => {
        let y = 0;
        for (let p = 0; p <= degree; p++) y += coeffs[p] * Math.pow(x, p);
        return y;
      }
    };
  }
  function solveNormalEquations(A, y, k) {
    const AT_A = Array.from({ length: k }, () => new Array(k).fill(0));
    const AT_y = new Array(k).fill(0);
    for (let i = 0; i < A.length; i++) {
      for (let r = 0; r < k; r++) {
        AT_y[r] += A[i][r] * y[i];
        for (let c = 0; c < k; c++) AT_A[r][c] += A[i][r] * A[i][c];
      }
    }
    // Gauss-Jordan
    for (let col = 0; col < k; col++) {
      let piv = col;
      for (let r = col + 1; r < k; r++) if (Math.abs(AT_A[r][col]) > Math.abs(AT_A[piv][col])) piv = r;
      [AT_A[col], AT_A[piv]] = [AT_A[piv], AT_A[col]];
      [AT_y[col], AT_y[piv]] = [AT_y[piv], AT_y[col]];
      const d = AT_A[col][col] || 1e-9;
      for (let c = 0; c < k; c++) AT_A[col][c] /= d;
      AT_y[col] /= d;
      for (let r = 0; r < k; r++) {
        if (r === col) continue;
        const f = AT_A[r][col];
        for (let c = 0; c < k; c++) AT_A[r][c] -= f * AT_A[col][c];
        AT_y[r] -= f * AT_y[col];
      }
    }
    return AT_y;
  }

  /* ------------------------------------------------------------------------
     6. 3x3 SİMETRİK ÖZDEĞER AYRIŞIMI (Jacobi yöntemi) — PCA için
     ------------------------------------------------------------------------ */
  function jacobiEigen3(Ain) {
    const A = [Ain[0].slice(), Ain[1].slice(), Ain[2].slice()];
    const V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let sweep = 0; sweep < 60; sweep++) {
      let off = Math.abs(A[0][1]) + Math.abs(A[0][2]) + Math.abs(A[1][2]);
      if (off < 1e-12) break;
      for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
        if (Math.abs(A[p][q]) < 1e-14) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        const App = A[p][p], Aqq = A[q][q], Apq = A[p][q];
        A[p][p] = c * c * App - 2 * s * c * Apq + s * s * Aqq;
        A[q][q] = s * s * App + 2 * s * c * Apq + c * c * Aqq;
        A[p][q] = 0; A[q][p] = 0;
        for (let i = 0; i < 3; i++) {
          if (i !== p && i !== q) {
            const Aip = A[i][p], Aiq = A[i][q];
            A[i][p] = c * Aip - s * Aiq; A[p][i] = A[i][p];
            A[i][q] = s * Aip + c * Aiq; A[q][i] = A[i][q];
          }
          const Vip = V[i][p], Viq = V[i][q];
          V[i][p] = c * Vip - s * Viq;
          V[i][q] = s * Vip + c * Viq;
        }
      }
    }
    const vals = [A[0][0], A[1][1], A[2][2]];
    const order = [0, 1, 2].sort((a, b) => vals[b] - vals[a]);
    return {
      values: order.map((i) => vals[i]),
      vectors: order.map((i) => [V[0][i], V[1][i], V[2][i]])
    };
  }

  /* ------------------------------------------------------------------------
     7. THREE.JS 3B SAHNE YÖNETİCİSİ (sadece PCA modülü için — affePhysics/affeBio
        ile aynı kanıtlanmış orbit/pinch-zoom çekirdeği)
     ------------------------------------------------------------------------ */
  function createViewer3D(container, opts = {}) {
    if (!window.THREE || !container) return null;
    container.innerHTML = '';
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      container.innerHTML = '<div style="padding:24px;color:#94a3b8;">WebGL başlatılamadı.</div>';
      return null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
    let targetDist = opts.distance || 16;
    let curDist = targetDist;
    const minD = opts.minDistance || 3.5, maxD = opts.maxDistance || 65;
    camera.position.set(0, 0, curDist);

    scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x0b0f17, 0.95));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.95); dir1.position.set(10, 14, 16); scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x00f2fe, 0.5); dir2.position.set(-12, -10, -10); scene.add(dir2);

    const root = new THREE.Group();
    scene.add(root);

    const st = { rotX: opts.tilt ?? 0.35, rotY: opts.spin ?? -0.45, velX: 0, velY: 0, autoRotate: opts.autoRotate !== false, dragging: false, lx: 0, ly: 0, running: true, pinchDist: 0, pointers: new Map() };
    const dom = renderer.domElement;
    dom.style.touchAction = 'none'; dom.style.cursor = 'grab';

    dom.addEventListener('pointerdown', (e) => {
      st.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dom.setPointerCapture(e.pointerId);
      if (st.pointers.size === 1) { st.dragging = true; st.lx = e.clientX; st.ly = e.clientY; dom.style.cursor = 'grabbing'; }
      else if (st.pointers.size === 2) { const pts = Array.from(st.pointers.values()); st.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y); }
    });
    dom.addEventListener('pointermove', (e) => {
      if (!st.pointers.has(e.pointerId)) return;
      st.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (st.pointers.size === 2) {
        const pts = Array.from(st.pointers.values());
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (st.pinchDist > 10) { const ratio = st.pinchDist / Math.max(10, d); targetDist = clamp(targetDist * ratio, minD, maxD); }
        st.pinchDist = d; return;
      }
      if (!st.dragging) return;
      st.velY = (e.clientX - st.lx) * 0.0075; st.velX = (e.clientY - st.ly) * 0.0075;
      st.rotY += st.velY; st.rotX = clamp(st.rotX + st.velX, -1.52, 1.52);
      st.lx = e.clientX; st.ly = e.clientY;
    });
    const endPtr = (e) => { st.pointers.delete(e.pointerId); if (st.pointers.size === 0) { st.dragging = false; dom.style.cursor = 'grab'; } };
    dom.addEventListener('pointerup', endPtr);
    dom.addEventListener('pointercancel', endPtr);
    dom.addEventListener('wheel', (e) => { e.preventDefault(); targetDist = clamp(targetDist * (e.deltaY > 0 ? 1.09 : 0.91), minD, maxD); }, { passive: false });

    function resize() {
      const w = container.clientWidth || 600, h = container.clientHeight || 480;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(container);
    resize();

    const frameCallbacks = [];
    const clock = new THREE.Clock();
    let elapsed = 0;
    function animate() {
      requestAnimationFrame(animate);
      if (!st.running) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      if (!st.dragging) {
        st.velX *= 0.92; st.velY *= 0.92; st.rotY += st.velY; st.rotX = clamp(st.rotX + st.velX, -1.52, 1.52);
        if (st.autoRotate) st.rotY += dt * 0.2;
      }
      curDist += (targetDist - curDist) * 0.12;
      camera.position.z = curDist;
      root.rotation.set(st.rotX, st.rotY, 0);
      for (let i = 0; i < frameCallbacks.length; i++) frameCallbacks[i](dt, elapsed);
      renderer.render(scene, camera);
    }
    animate();

    function clear() {
      frameCallbacks.length = 0;
      while (root.children.length > 0) {
        const child = root.children[0];
        root.remove(child);
        child.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) { const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }
        });
      }
    }

    return {
      scene, camera, renderer, root, clear,
      onFrame(fn) { frameCallbacks.push(fn); },
      setDistance(d) { targetDist = clamp(d, minD, maxD); },
      setAutoRotate(v) { st.autoRotate = v; },
      setRunning(v) { st.running = v; if (v) { clock.getDelta(); resize(); } },
      resize
    };
  }

  function makeSpriteLabel(text, color, scale) {
    color = color || '#00f2fe'; scale = scale == null ? 0.8 : scale;
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.font = '800 54px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = 'rgba(7, 9, 14, 0.9)'; g.strokeText(text, 128, 64);
    g.fillStyle = color; g.fillText(text, 128, 64);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(scale * 2, scale, 1);
    sp.renderOrder = 20;
    return sp;
  }

  window.StatsCore = {
    clamp, mulberry32, makeGaussian,
    dist,
    RunningStats, median, quantile,
    fitCanvas, linspace, formatNum, makeScale, drawAxes, drawCurve, fillArea, drawHistogram,
    linreg, polyfit, jacobiEigen3,
    createViewer3D, makeSpriteLabel
  };
})();
