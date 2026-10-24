/* ============================================================================
   affeStats — MODÜL 1: Galton Kutusu, Merkezi Limit Teoremi ve Büyük Sayılar Yasası
   1.1 Canlı Galton Kutusu (Binom → Normal yakınsaması)
   1.2 CLT Laboratuvarı (örneklem ortalamaları dağılımı)
   1.3 Büyük Sayılar Yasası (kümülatif ortalama yakınsaması)
   ============================================================================ */
(function () {
  'use strict';

  const { dist, mulberry32, makeGaussian, fitCanvas, formatNum, RunningStats } = window.StatsCore;
  const $ = (id) => document.getElementById(id);
  const rand = mulberry32(2024);
  const gauss = makeGaussian(rand);

  const state = {
    activeSub: '1_1',
    galton: { rows: 16, p: 0.5, counts: null, total: 0, balls: [], spawnAccum: 0 },
    clt: { population: 'uniform', n: 5, means: [], popSample: [] },
    lln: { loaded: false, running: false, samples: [], cumAvg: [], total: 0, sum: 0 }
  };

  function resetGalton() {
    const g = state.galton;
    g.counts = new Array(g.rows + 1).fill(0);
    g.total = 0;
    g.balls = [];
    g.spawnAccum = 0;
  }
  resetGalton();

  function spawnGaltonBall() {
    const g = state.galton;
    let k = 0;
    for (let i = 0; i < g.rows; i++) if (rand() < g.p) k++;
    g.counts[k]++;
    g.total++;
    if (g.balls.length < 140) {
      g.balls.push({ row: 0, k: 0, x: 0.5, bornRow: 0 });
    }
  }

  function stepGaltonBalls(dt) {
    const g = state.galton;
    g.balls.forEach((b) => {
      b.t = (b.t || 0) + dt * 2.4;
      if (b.t >= 1) {
        b.t = 0;
        b.row++;
        if (rand() < g.p) { b.k++; b.x += 0.5 / g.rows; } else { b.x -= 0.5 / g.rows; }
      }
    });
    g.balls = g.balls.filter((b) => b.row < g.rows);
  }

  function drawGalton() {
    const info = fitCanvas($('statsStageCanvas_1'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const g = state.galton;
    const pinH = h * 0.5, histH = h * 0.42, histY = pinH + 14;
    const padX = 24;
    const plotW = w - padX * 2;

    // Çiviler
    ctx.fillStyle = 'rgba(148,163,184,0.55)';
    for (let r = 0; r < g.rows; r++) {
      const n = r + 1;
      const y = 14 + (r / (g.rows - 1 || 1)) * (pinH - 28);
      for (let i = 0; i < n; i++) {
        const x = w / 2 + (i - (n - 1) / 2) * (plotW / (g.rows + 2));
        ctx.beginPath(); ctx.arc(x, y, 2.1, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Düşen toplar
    ctx.fillStyle = '#00f2fe';
    g.balls.forEach((b) => {
      const yFrac = (b.row + (b.t || 0)) / g.rows;
      const y = 14 + yFrac * (pinH - 28);
      const x = w / 2 + (b.x - 0.5) * plotW * 0.92;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });

    // Histogram + Binom PMF + Normal PDF
    const maxCount = Math.max(1, ...g.counts);
    const binW = plotW / (g.rows + 1);
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.beginPath(); ctx.moveTo(padX, histY + histH); ctx.lineTo(w - padX, histY + histH); ctx.stroke();

    for (let k = 0; k <= g.rows; k++) {
      const freq = g.counts[k] / maxCount;
      const x = padX + k * binW;
      const barH = freq * histH;
      ctx.fillStyle = 'rgba(0,242,254,0.55)';
      ctx.fillRect(x + 1, histY + histH - barH, binW - 2, barH);
    }

    const mu = g.rows * g.p;
    const sigma = Math.sqrt(g.rows * g.p * (1 - g.p)) || 0.01;
    let maxPmf = 0;
    for (let k = 0; k <= g.rows; k++) maxPmf = Math.max(maxPmf, dist.binomial.pdf(k, g.rows, g.p));
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k <= g.rows; k++) {
      const x = padX + (k + 0.5) * binW;
      const y = histY + histH - (dist.binomial.pdf(k, g.rows, g.p) / maxPmf) * histH;
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const k = (i / 100) * g.rows;
      const x = padX + k * binW + binW / 2;
      const pdf = dist.normal.pdf(k, mu, sigma);
      const y = histY + histH - (pdf / maxPmf) * histH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10.5px "JetBrains Mono", monospace';
    ctx.fillText(`● Deneysel (n=${g.total})`, padX, histY - 4);
    ctx.fillStyle = '#fbbf24'; ctx.fillText('— Binom PMF', padX + 170, histY - 4);
    ctx.fillStyle = '#a855f7'; ctx.fillText('— Normal Yaklaşım', padX + 300, histY - 4);

    if ($('galtonMeanVal')) $('galtonMeanVal').textContent = formatNum(mu, 2);
    if ($('galtonStdVal')) $('galtonStdVal').textContent = formatNum(sigma, 3);
    if ($('galtonTotalVal')) $('galtonTotalVal').textContent = g.total;
  }

  /* ------------------------------------------------------------------------
     1.2 MERKEZİ LİMİT TEOREMİ
     ------------------------------------------------------------------------ */
  function populationSample(kind) {
    switch (kind) {
      case 'uniform': return rand() * 10;
      case 'exponential': return -Math.log(1 - rand()) * 2.5;
      case 'bimodal': return rand() < 0.5 ? gauss(2, 0.7) : gauss(8, 0.7);
      default: return rand() * 10;
    }
  }

  function drawCLT() {
    const info = fitCanvas($('statsStageCanvas_1'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const c = state.clt;
    const padX = 24, padTop = 14;
    const topH = h * 0.42, botH = h * 0.42, gap = 16;
    const plotW = w - padX * 2;

    // Üst: anakütle histogramı (örnek 4000 çekiliş ile gösterge)
    if (!c.popSample.length) { for (let i = 0; i < 4000; i++) c.popSample.push(populationSample(c.population)); }
    const popMin = Math.min(...c.popSample), popMax = Math.max(...c.popSample);
    const bins1 = 40;
    const hist1 = new Array(bins1).fill(0);
    c.popSample.forEach((v) => { const bi = Math.min(bins1 - 1, Math.floor(((v - popMin) / (popMax - popMin || 1)) * bins1)); hist1[bi]++; });
    const max1 = Math.max(...hist1);
    ctx.fillStyle = '#94a3b8'; ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('ANAKÜTLE (Popülasyon) Dağılımı', padX, padTop + 10);
    for (let i = 0; i < bins1; i++) {
      const x = padX + (i / bins1) * plotW;
      const barH = (hist1[i] / max1) * (topH - 24);
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      ctx.fillRect(x + 1, padTop + topH - barH, plotW / bins1 - 1, barH);
    }

    // Alt: örneklem ortalamaları histogramı + Normal(mu, sigma/sqrt(n)) overlay
    const botY = padTop + topH + gap;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`ÖRNEKLEM ORTALAMALARININ DAĞILIMI (n=${c.n}, k=${c.means.length})`, padX, botY + 10);
    if (c.means.length) {
      const mMin = Math.min(...c.means), mMax = Math.max(...c.means);
      const bins2 = 36;
      const lo = mMin - (mMax - mMin) * 0.08 - 0.3, hi = mMax + (mMax - mMin) * 0.08 + 0.3;
      const hist2 = new Array(bins2).fill(0);
      c.means.forEach((v) => { const bi = Math.min(bins2 - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo)) * bins2))); hist2[bi]++; });
      const max2 = Math.max(...hist2, 1);
      for (let i = 0; i < bins2; i++) {
        const x = padX + (i / bins2) * plotW;
        const barH = (hist2[i] / max2) * (botH - 24);
        ctx.fillStyle = 'rgba(0,242,254,0.55)';
        ctx.fillRect(x + 1, botY + botH - barH, plotW / bins2 - 1, barH);
      }
      const popMean = jMean(c.popSample), popStd = jStd(c.popSample);
      const se = popStd / Math.sqrt(c.n);
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x0 = lo + (i / 100) * (hi - lo);
        const pdf = dist.normal.pdf(x0, popMean, se);
        const maxPdf = dist.normal.pdf(popMean, popMean, se);
        const x = padX + ((x0 - lo) / (hi - lo)) * plotW;
        const y = botY + botH - (pdf / maxPdf) * (botH - 24);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#a855f7'; ctx.font = '600 10.5px "JetBrains Mono", monospace';
      ctx.fillText(`Teorik: N(μ=${formatNum(popMean, 2)}, SE=${formatNum(se, 3)})`, padX, botY + botH + 16);
    }
  }
  function jMean(a) { let s = 0; for (const v of a) s += v; return s / a.length; }
  function jStd(a) { const m = jMean(a); let s = 0; for (const v of a) s += (v - m) * (v - m); return Math.sqrt(s / (a.length - 1)); }

  function drawSample(n) {
    let s = 0;
    for (let i = 0; i < n; i++) s += populationSample(state.clt.population);
    return s / n;
  }

  /* ------------------------------------------------------------------------
     1.3 BÜYÜK SAYILAR YASASI
     ------------------------------------------------------------------------ */
  function dieFace(loaded) {
    if (!loaded) return 1 + Math.floor(rand() * 6);
    const u = rand();
    const weights = [0.08, 0.08, 0.08, 0.08, 0.08, 0.60]; // 6 gelme ihtimali yüksek
    let acc = 0;
    for (let f = 0; f < 6; f++) { acc += weights[f]; if (u <= acc) return f + 1; }
    return 6;
  }

  function drawLLN() {
    const info = fitCanvas($('statsStageCanvas_1'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const l = state.lln;
    const padX = 40, padTop = 16, padBot = 28;
    const plotH = h - padTop - padBot, plotW = w - padX * 2;
    const trueMean = l.loaded ? (1 * 0.08 + 2 * 0.08 + 3 * 0.08 + 4 * 0.08 + 5 * 0.08 + 6 * 0.60) : 3.5;

    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.beginPath(); ctx.moveTo(padX, padTop); ctx.lineTo(padX, padTop + plotH); ctx.lineTo(padX + plotW, padTop + plotH); ctx.stroke();

    ctx.strokeStyle = 'rgba(16,185,129,0.6)'; ctx.setLineDash([5, 4]);
    const yMean = padTop + plotH - ((trueMean - 1) / 5) * plotH;
    ctx.beginPath(); ctx.moveTo(padX, yMean); ctx.lineTo(padX + plotW, yMean); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#34d399'; ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText(`E[X] = ${formatNum(trueMean, 3)}`, padX + plotW - 140, yMean - 6);

    if (l.cumAvg.length > 1) {
      ctx.strokeStyle = '#00f2fe'; ctx.lineWidth = 2;
      ctx.beginPath();
      const maxLogN = Math.log10(Math.max(10, l.cumAvg.length));
      l.cumAvg.forEach((v, i) => {
        const n = i + 1;
        const xFrac = n <= 1 ? 0 : Math.log10(n) / maxLogN;
        const x = padX + xFrac * plotW;
        const y = padTop + plotH - ((clamp01((v - 1) / 5)) * plotH);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    ctx.fillStyle = '#94a3b8'; ctx.font = '600 10px monospace';
    ctx.fillText('N (log ölçek) →', padX + plotW - 90, padTop + plotH + 20);
    ctx.fillText(`N = ${l.total}`, padX, padTop + plotH + 20);
    if ($('lnnCumAvgVal')) $('lnnCumAvgVal').textContent = formatNum(l.cumAvg.length ? l.cumAvg[l.cumAvg.length - 1] : 0, 4);
  }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  /* ------------------------------------------------------------------------
     ANA DÖNGÜ
     ------------------------------------------------------------------------ */
  let running = true, lastT = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    if (!running) return;
    const mod1El = $('mod1');
    if (!mod1El || !mod1El.classList.contains('active')) return;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    if (state.activeSub === '1_1') {
      const g = state.galton;
      g.spawnAccum += dt * 90; // saniyede ~90 top (istatistiksel olarak)
      while (g.spawnAccum >= 1) { spawnGaltonBall(); g.spawnAccum -= 1; }
      stepGaltonBalls(dt);
      drawGalton();
    } else if (state.activeSub === '1_2') {
      drawCLT();
    } else if (state.activeSub === '1_3') {
      if (state.lln.running) {
        for (let i = 0; i < 40; i++) {
          const v = dieFace(state.lln.loaded);
          state.lln.total++;
          state.lln.sum += v;
          state.lln.cumAvg.push(state.lln.sum / state.lln.total);
          if (state.lln.cumAvg.length > 4000) state.lln.cumAvg.shift();
          if (state.lln.total > 100000) { state.lln.running = false; break; }
        }
      }
      drawLLN();
    }
  }
  requestAnimationFrame(loop);

  /* ------------------------------------------------------------------------
     UI BAĞLAMA
     ------------------------------------------------------------------------ */
  function renderGaltonControls() {
    if ($('galtonRowsVal')) $('galtonRowsVal').textContent = state.galton.rows;
    if ($('galtonPVal')) $('galtonPVal').textContent = formatNum(state.galton.p, 2);
  }

  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod1 .subtab-btn').forEach((b) => b.classList.toggle('active', b.dataset.sub === subId));
    ['1_1', '1_2', '1_3'].forEach((id) => {
      const pane = $(`mod1_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.p != null) { state.galton.p = preset.p; resetGalton(); renderGaltonControls(); if ($('galtonPSlider')) $('galtonPSlider').value = preset.p; }
    if (preset.rows != null) { state.galton.rows = preset.rows; resetGalton(); renderGaltonControls(); if ($('galtonRowsSlider')) $('galtonRowsSlider').value = preset.rows; }
    if (preset.population) { state.clt.population = preset.population; state.clt.popSample = []; state.clt.means = []; syncCltButtons(); }
    if (preset.n != null) { state.clt.n = preset.n; if ($('cltNSelect')) $('cltNSelect').value = String(preset.n); }
    if (preset.loaded != null) { state.lln.loaded = preset.loaded; if ($('lnnLoadedChk')) $('lnnLoadedChk').checked = preset.loaded; }
  }

  function syncCltButtons() {
    document.querySelectorAll('[data-population]').forEach((b) => b.classList.toggle('active', b.dataset.population === state.clt.population));
  }

  function init() {
    renderGaltonControls();

    $('galtonRowsSlider')?.addEventListener('input', (e) => { state.galton.rows = +e.target.value; resetGalton(); renderGaltonControls(); });
    $('galtonPSlider')?.addEventListener('input', (e) => { state.galton.p = +e.target.value; resetGalton(); renderGaltonControls(); });
    $('galtonResetBtn')?.addEventListener('click', resetGalton);

    document.querySelectorAll('[data-population]').forEach((btn) => {
      btn.addEventListener('click', () => { state.clt.population = btn.dataset.population; state.clt.popSample = []; state.clt.means = []; syncCltButtons(); });
    });
    syncCltButtons();
    $('cltNSelect')?.addEventListener('change', (e) => { state.clt.n = +e.target.value; });
    $('cltDrawBtn')?.addEventListener('click', () => {
      for (let i = 0; i < 1; i++) state.clt.means.push(drawSample(state.clt.n));
    });
    $('cltDraw100Btn')?.addEventListener('click', () => {
      for (let i = 0; i < 100; i++) state.clt.means.push(drawSample(state.clt.n));
    });
    $('cltResetBtn')?.addEventListener('click', () => { state.clt.means = []; state.clt.popSample = []; });

    $('lnnLoadedChk')?.addEventListener('change', (e) => { state.lln.loaded = e.target.checked; });
    $('lnnStartBtn')?.addEventListener('click', (e) => {
      state.lln.running = !state.lln.running;
      e.currentTarget.textContent = state.lln.running ? '⏸ Duraklat' : '▶ Başlat';
    });
    $('lnnResetBtn')?.addEventListener('click', () => { state.lln.total = 0; state.lln.sum = 0; state.lln.cumAvg = []; state.lln.running = false; });

    document.querySelectorAll('#mod1 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => { switchSubtab(btn.dataset.sub); window.AffeStats?.onSubtabChanged(); });
    });
    switchSubtab('1_1');
  }

  window.Mod1Galton = {
    init, switchSubtab, applyPreset,
    getActiveSub: () => `stats1_${state.activeSub.split('_')[1]}`,
    setRunning: (r) => { running = r; lastT = performance.now(); }
  };
})();
