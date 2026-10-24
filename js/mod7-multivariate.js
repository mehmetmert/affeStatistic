/* ============================================================================
   affeStats — MODÜL 7: Çok Değişkenli İstatistik, PCA ve Kümeleme
   7.1 3B Temel Bileşenler Analizi (PCA)   7.2 Canlı K-Means Kümeleme
   ============================================================================ */
(function () {
  'use strict';

  const { mulberry32, makeGaussian, fitCanvas, formatNum, jacobiEigen3, createViewer3D, makeSpriteLabel } = window.StatsCore;
  const $ = (id) => document.getElementById(id);
  const rand = mulberry32(2468);
  const gauss = makeGaussian(rand);

  const state = {
    activeSub: '7_1',
    pca: { points: [] },
    kmeans: { k: 3, points: [], centroids: [], assign: [], running: false, iter: 0 }
  };

  /* ------------------------------------------------------------------------
     7.1 PCA
     ------------------------------------------------------------------------ */
  function seedPcaPoints() {
    // Korelasyonlu, uzun bir yöne doğru yayılmış 3B bulut (anizotropik kovaryans).
    const A = [[2.2, 1.1, 0.3], [0.4, 1.0, -0.2], [0.1, 0.3, 0.6]];
    state.pca.points = [];
    for (let i = 0; i < 400; i++) {
      const z = [gauss(0, 1), gauss(0, 1), gauss(0, 1)];
      const v = [
        A[0][0] * z[0] + A[0][1] * z[1] + A[0][2] * z[2],
        A[1][0] * z[0] + A[1][1] * z[1] + A[1][2] * z[2],
        A[2][0] * z[0] + A[2][1] * z[1] + A[2][2] * z[2]
      ];
      state.pca.points.push(v);
    }
  }
  seedPcaPoints();

  function pcaCompute() {
    const pts = state.pca.points;
    const n = pts.length;
    const mean = [0, 0, 0];
    pts.forEach((p) => { mean[0] += p[0]; mean[1] += p[1]; mean[2] += p[2]; });
    mean[0] /= n; mean[1] /= n; mean[2] /= n;
    const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    pts.forEach((p) => {
      const d = [p[0] - mean[0], p[1] - mean[1], p[2] - mean[2]];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i][j] += d[i] * d[j];
    });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i][j] /= (n - 1);
    return { mean, cov, eig: jacobiEigen3(cov) };
  }

  let pcaViewer = null, pcaGroup = null;
  function rebuildPcaScene() {
    if (!pcaViewer) return;
    pcaViewer.clear();
    const root = pcaViewer.root;
    const { mean, eig } = pcaCompute();

    const mat = new THREE.PointsMaterial({ size: 0.09, color: 0x00f2fe, transparent: true, opacity: 0.85 });
    const pos = new Float32Array(state.pca.points.length * 3);
    state.pca.points.forEach((p, i) => { pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2]; });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    root.add(new THREE.Points(geo, mat));

    const colors = [0xf59e0b, 0xa855f7, 0xf43f5e];
    const names = ['PC1', 'PC2', 'PC3'];
    eig.values.forEach((val, i) => {
      const len = Math.sqrt(Math.max(0, val)) * 1.8;
      const v = eig.vectors[i];
      const a = new THREE.Vector3(mean[0] - v[0] * len, mean[1] - v[1] * len, mean[2] - v[2] * len);
      const b = new THREE.Vector3(mean[0] + v[0] * len, mean[1] + v[1] * len, mean[2] + v[2] * len);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([a, b]);
      const lineMat = new THREE.LineBasicMaterial({ color: colors[i], linewidth: 2 });
      root.add(new THREE.Line(lineGeo, lineMat));
      const lbl = makeSpriteLabel(names[i], '#' + colors[i].toString(16).padStart(6, '0'), 0.6);
      lbl.position.copy(b);
      root.add(lbl);
    });

    pcaViewer.setDistance(13);
    if ($('pcaVarTable')) {
      const totalVar = eig.values.reduce((a, b) => a + b, 0);
      $('pcaVarTable').innerHTML = `
        <table class="lab-compare-table">
          <thead><tr><th>Bileşen</th><th>Özdeğer (λ)</th><th>Açıklanan Varyans</th></tr></thead>
          <tbody>${eig.values.map((v, i) => `<tr><td>PC${i + 1}</td><td>${formatNum(v, 3)}</td><td>%${formatNum((v / totalVar) * 100, 1)}</td></tr>`).join('')}</tbody>
        </table>`;
    }
  }

  /* ------------------------------------------------------------------------
     7.2 K-MEANS
     ------------------------------------------------------------------------ */
  function seedKmeansPoints() {
    const centers = [[-5, -3], [5, -3], [0, 5]];
    state.kmeans.points = [];
    for (let i = 0; i < 180; i++) {
      const c = centers[i % 3];
      state.kmeans.points.push([c[0] + gauss(0, 1.5), c[1] + gauss(0, 1.5)]);
    }
    initCentroids();
  }
  function initCentroids() {
    const k = state.kmeans.k;
    const pts = state.kmeans.points;
    state.kmeans.centroids = [];
    for (let i = 0; i < k; i++) state.kmeans.centroids.push(pts[Math.floor(rand() * pts.length)].slice());
    state.kmeans.assign = new Array(pts.length).fill(0);
    state.kmeans.iter = 0;
  }
  seedKmeansPoints();

  function kmeansStep() {
    const { points, centroids } = state.kmeans;
    const assign = points.map((p) => {
      let best = 0, bestD = Infinity;
      centroids.forEach((c, ci) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2; if (d < bestD) { bestD = d; best = ci; } });
      return best;
    });
    const sums = centroids.map(() => [0, 0, 0]);
    points.forEach((p, i) => { const c = assign[i]; sums[c][0] += p[0]; sums[c][1] += p[1]; sums[c][2]++; });
    const newCentroids = centroids.map((c, i) => (sums[i][2] > 0 ? [sums[i][0] / sums[i][2], sums[i][1] / sums[i][2]] : c));
    state.kmeans.assign = assign;
    state.kmeans.centroids = newCentroids;
    state.kmeans.iter++;
  }

  const CLUSTER_COLORS = ['#00f2fe', '#a855f7', '#f59e0b', '#f43f5e', '#10b981', '#38bdf8'];
  function drawKmeans() {
    const info = fitCanvas($('statsStageCanvas_7'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const span = 12;
    const toPx = (x, y) => [w / 2 + (x / span) * (w / 2 - 20), h / 2 - (y / span) * (h / 2 - 20)];

    // Voronoi (kaba ızgara dolgusu)
    const grid = 56;
    for (let gx = 0; gx < grid; gx++) {
      for (let gy = 0; gy < grid; gy++) {
        const x = ((gx / grid) * 2 - 1) * span, y = ((gy / grid) * 2 - 1) * span;
        let best = 0, bestD = Infinity;
        state.kmeans.centroids.forEach((c, ci) => { const d = (x - c[0]) ** 2 + (y - c[1]) ** 2; if (d < bestD) { bestD = d; best = ci; } });
        const [px, py] = toPx(x, y);
        ctx.fillStyle = CLUSTER_COLORS[best] + '14';
        ctx.fillRect(px - (w / grid) / 2, py - (h / grid) / 2, w / grid + 1, h / grid + 1);
      }
    }

    state.kmeans.points.forEach((p, i) => {
      const [px, py] = toPx(p[0], p[1]);
      ctx.fillStyle = CLUSTER_COLORS[state.kmeans.assign[i] || 0];
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    });
    state.kmeans.centroids.forEach((c, i) => {
      const [px, py] = toPx(c[0], c[1]);
      ctx.fillStyle = CLUSTER_COLORS[i];
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.lineTo(px + 9, py); ctx.moveTo(px, py - 9); ctx.lineTo(px, py + 9); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.stroke();
    });

    if ($('kmeansIterVal')) $('kmeansIterVal').textContent = state.kmeans.iter;
  }

  /* ------------------------------------------------------------------------
     ANA DÖNGÜ & UI
     ------------------------------------------------------------------------ */
  let running = true;
  function loop() {
    requestAnimationFrame(loop);
    const el = $('mod7');
    if (!running || !el || !el.classList.contains('active')) return;
    if (state.activeSub === '7_2') {
      if (state.kmeans.running) kmeansStep();
      drawKmeans();
    }
  }
  requestAnimationFrame(loop);

  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod7 .subtab-btn').forEach((b) => b.classList.toggle('active', b.dataset.sub === subId));
    ['7_1', '7_2'].forEach((id) => {
      const pane = $(`mod7_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
    // 7.1 (PCA) 3B konteyneri ile 7.2 (K-Means) 2B kanvası aynı sahne alanını paylaşır;
    // ikisi de DOM'da kalıcıdır (createViewer3D kendi canvas'ını bir kez oluşturur), sadece görünürlük değişir.
    if ($('statsStage3D_7')) $('statsStage3D_7').hidden = subId !== '7_1';
    if ($('statsStageCanvas_7')) $('statsStageCanvas_7').hidden = subId !== '7_2';
    if (pcaViewer) pcaViewer.setRunning(subId === '7_1');
    if (subId === '7_1') rebuildPcaScene();
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.k != null) { state.kmeans.k = preset.k; initCentroids(); if ($('kmeansKSlider')) $('kmeansKSlider').value = preset.k; }
  }

  function init() {
    pcaViewer = createViewer3D($('statsStage3D_7'), { distance: 13, tilt: 0.25, spin: -0.4, minDistance: 4, maxDistance: 30 });
    rebuildPcaScene();
    $('pcaReseedBtn')?.addEventListener('click', () => { seedPcaPoints(); rebuildPcaScene(); });

    $('kmeansKSlider')?.addEventListener('input', (e) => {
      state.kmeans.k = +e.target.value;
      if ($('kmeansKVal')) $('kmeansKVal').textContent = e.target.value;
      initCentroids();
    });
    $('kmeansStepBtn')?.addEventListener('click', () => { kmeansStep(); drawKmeans(); });
    $('kmeansAutoBtn')?.addEventListener('click', (e) => {
      state.kmeans.running = !state.kmeans.running;
      e.currentTarget.textContent = state.kmeans.running ? '⏸ Duraklat' : '▶ Otomatik Çalıştır';
      e.currentTarget.classList.toggle('active', state.kmeans.running);
    });
    $('kmeansResetBtn')?.addEventListener('click', () => { seedKmeansPoints(); state.kmeans.running = false; });

    document.querySelectorAll('#mod7 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => { switchSubtab(btn.dataset.sub); window.AffeStats?.onSubtabChanged(); });
    });
    switchSubtab('7_1');
  }

  window.Mod7Multivariate = {
    init, switchSubtab, applyPreset,
    getActiveSub: () => `stats7_${state.activeSub.split('_')[1]}`,
    setRunning: (r) => { running = r; if (pcaViewer) pcaViewer.setRunning(r && state.activeSub === '7_1'); }
  };
})();
