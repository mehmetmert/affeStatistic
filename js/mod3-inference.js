/* ============================================================================
   affeStats — MODÜL 3: Çıkarımsal İstatistik
   3.1 H0 vs H1 (Tip I/II Hata, Güç)   3.2 Güven Aralığı Yağmuru
   3.3 Bootstrap                        3.4 Ki-Kare (χ²) Testi
   ============================================================================ */
(function () {
  'use strict';

  const { dist, mulberry32, makeGaussian, fitCanvas, formatNum, makeScale, clamp } = window.StatsCore;
  const $ = (id) => document.getElementById(id);
  const rand = mulberry32(777);
  const gauss = makeGaussian(rand);

  const state = {
    activeSub: '3_1',
    nhst: { n: 30, d: 0.5, alpha: 0.05 },
    ci: { level: 0.95, n: 20, bars: [], trueMu: 50, trueSigma: 10 },
    boot: { data: [], B: 0, target: 2000, samples: [], stat: 'mean' },
    chisq: { mode: 'goodness', rolls: 0, observed: [0, 0, 0, 0, 0, 0], table: [[20, 30], [25, 25]] }
  };

  /* ------------------------------------------------------------------------
     3.1 H0 vs H1
     ------------------------------------------------------------------------ */
  function nhstStats() {
    const { n, d, alpha } = state.nhst;
    const se = 1 / Math.sqrt(n);
    const crit = dist.normal.inv(1 - alpha, 0, se);
    const power = 1 - dist.normal.cdf(crit, d, se);
    const beta = 1 - power;
    return { se, crit, power, beta };
  }

  function drawNHST() {
    const info = fitCanvas($('statsStageCanvas_3'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const { n, d, alpha } = state.nhst;
    const { se, crit, power, beta } = nhstStats();
    const padX = 40, padTop = 20, padBot = 30;
    const plotW = w - padX * 2, plotH = h - padTop - padBot;
    const lo = -4 * se, hi = Math.max(d + 4 * se, 4 * se);
    const xScale = makeScale([lo, hi], [padX, padX + plotW]);
    let maxY = Math.max(dist.normal.pdf(0, 0, se), dist.normal.pdf(d, d, se));
    const yScale = makeScale([0, maxY * 1.1], [padTop + plotH, padTop]);

    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.beginPath(); ctx.moveTo(padX, padTop); ctx.lineTo(padX, padTop + plotH); ctx.lineTo(padX + plotW, padTop + plotH); ctx.stroke();

    // Tip I hata alanı (H0'ın kritik değerin sağı) — kırmızı
    fillTail(ctx, xScale, yScale, (x) => dist.normal.pdf(x, 0, se), crit, hi, padTop + plotH, 'rgba(244,63,94,0.45)');
    // Tip II hata alanı (H1'in kritik değerin solu) — mavi
    fillTail(ctx, xScale, yScale, (x) => dist.normal.pdf(x, d, se), lo, crit, padTop + plotH, 'rgba(56,189,248,0.35)');
    // Güç alanı (H1'in kritik değerin sağı) — yeşil
    fillTail(ctx, xScale, yScale, (x) => dist.normal.pdf(x, d, se), crit, hi, padTop + plotH, 'rgba(16,185,129,0.45)');

    drawCurveLine(ctx, xScale, yScale, (x) => dist.normal.pdf(x, 0, se), lo, hi, '#94a3b8');
    drawCurveLine(ctx, xScale, yScale, (x) => dist.normal.pdf(x, d, se), lo, hi, '#fbbf24');

    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(xScale.toPx(crit), padTop); ctx.lineTo(xScale.toPx(crit), padTop + plotH); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#e2e8f0'; ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('H₀ (etki yok)', xScale.toPx(0) - 30, padTop + 14);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('H₁ (gerçek etki)', xScale.toPx(d) - 10, padTop + 14);
    ctx.fillStyle = '#f8fafc'; ctx.font = '600 10px monospace';
    ctx.fillText('kritik değer', xScale.toPx(crit) + 6, padTop + plotH - 8);

    if ($('nhstAlphaVal2')) $('nhstAlphaVal2').textContent = formatNum(alpha, 3);
    if ($('nhstBetaVal')) $('nhstBetaVal').textContent = formatNum(beta, 3);
    if ($('nhstPowerVal')) $('nhstPowerVal').textContent = formatNum(power, 3);
  }
  function drawCurveLine(ctx, xScale, yScale, fn, a, b, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const x = a + ((b - a) * i) / 160;
      const px = xScale.toPx(x), py = yScale.toPx(fn(x));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  function fillTail(ctx, xScale, yScale, fn, a, b, baseY, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(xScale.toPx(a), baseY);
    for (let i = 0; i <= 100; i++) {
      const x = a + ((b - a) * i) / 100;
      ctx.lineTo(xScale.toPx(x), yScale.toPx(fn(x)));
    }
    ctx.lineTo(xScale.toPx(b), baseY);
    ctx.closePath(); ctx.fill();
  }

  /* ------------------------------------------------------------------------
     3.2 GÜVEN ARALIĞI YAĞMURU
     ------------------------------------------------------------------------ */
  function drawOneCI() {
    const { n, trueMu, trueSigma, level } = state.ci;
    const sample = []; for (let i = 0; i < n; i++) sample.push(gauss(trueMu, trueSigma));
    const m = sample.reduce((a, b) => a + b, 0) / n;
    const s = Math.sqrt(sample.reduce((a, v) => a + (v - m) * (v - m), 0) / (n - 1));
    const tcrit = dist.t.inv(1 - (1 - level) / 2, n - 1);
    const half = tcrit * s / Math.sqrt(n);
    const hit = (trueMu >= m - half) && (trueMu <= m + half);
    state.ci.bars.push({ m, half, hit });
    if (state.ci.bars.length > 140) state.ci.bars.shift();
  }

  function drawCI() {
    const info = fitCanvas($('statsStageCanvas_3'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const { trueMu, bars } = state.ci;
    const padX = 40, padTop = 16, padBot = 20;
    const plotW = w - padX * 2, plotH = h - padTop - padBot;
    const span = state.ci.trueSigma * 1.4;
    const xScale = makeScale([trueMu - span, trueMu + span], [padX, padX + plotW]);

    ctx.strokeStyle = 'rgba(16,185,129,0.65)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xScale.toPx(trueMu), padTop); ctx.lineTo(xScale.toPx(trueMu), padTop + plotH); ctx.stroke();
    ctx.fillStyle = '#34d399'; ctx.font = '700 11px monospace';
    ctx.fillText(`gerçek μ = ${trueMu}`, xScale.toPx(trueMu) + 6, padTop + 10);

    const rowH = Math.min(6, plotH / Math.max(1, bars.length));
    let hits = 0;
    bars.forEach((b, i) => {
      const y = padTop + i * rowH;
      const x1 = xScale.toPx(b.m - b.half), x2 = xScale.toPx(b.m + b.half);
      ctx.strokeStyle = b.hit ? 'rgba(16,185,129,0.85)' : 'rgba(244,63,94,0.9)';
      if (b.hit) hits++;
      ctx.lineWidth = Math.max(1.5, rowH - 1);
      ctx.beginPath(); ctx.moveTo(x1, y + rowH / 2); ctx.lineTo(x2, y + rowH / 2); ctx.stroke();
    });

    if ($('ciHitRate')) $('ciHitRate').textContent = bars.length ? `%${formatNum((hits / bars.length) * 100, 1)} (${hits}/${bars.length})` : '—';
  }

  /* ------------------------------------------------------------------------
     3.3 BOOTSTRAP
     ------------------------------------------------------------------------ */
  function statOf(arr, kind) {
    const s = arr.slice().sort((a, b) => a - b);
    if (kind === 'median') { const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function ensureBootData() {
    if (state.boot.data.length) return;
    for (let i = 0; i < 15; i++) state.boot.data.push(gauss(50, 12));
  }

  function bootstrapStep(count) {
    const d = state.boot.data, n = d.length;
    for (let i = 0; i < count && state.boot.samples.length < state.boot.target; i++) {
      const resample = [];
      for (let k = 0; k < n; k++) resample.push(d[Math.floor(rand() * n)]);
      state.boot.samples.push(statOf(resample, state.boot.stat));
    }
  }

  function drawBootstrap() {
    const info = fitCanvas($('statsStageCanvas_3'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const s = state.boot.samples;
    const padX = 40, padTop = 50, padBot = 24;
    const plotW = w - padX * 2, plotH = h - padTop - padBot;

    // orijinal veri noktaları üstte
    ctx.fillStyle = '#94a3b8'; ctx.font = '700 11px monospace';
    ctx.fillText(`Orijinal örneklem (n=${state.boot.data.length})`, padX, 18);
    const dMin = Math.min(...state.boot.data), dMax = Math.max(...state.boot.data);
    const xDataScale = makeScale([dMin - 4, dMax + 4], [padX, padX + plotW]);
    state.boot.data.forEach((v) => {
      ctx.fillStyle = 'rgba(0,242,254,0.8)';
      ctx.beginPath(); ctx.arc(xDataScale.toPx(v), 32, 3.2, 0, Math.PI * 2); ctx.fill();
    });

    if (!s.length) return;
    const mn = Math.min(...s), mx = Math.max(...s);
    const bins = 36;
    const lo = mn - (mx - mn) * 0.08 - 0.1, hi = mx + (mx - mn) * 0.08 + 0.1;
    const hist = new Array(bins).fill(0);
    s.forEach((v) => { const bi = clamp(Math.floor(((v - lo) / (hi - lo || 1)) * bins), 0, bins - 1); hist[bi]++; });
    const maxC = Math.max(...hist, 1);
    const xScale = makeScale([lo, hi], [padX, padX + plotW]);
    for (let i = 0; i < bins; i++) {
      const x = padX + (i / bins) * plotW;
      const barH = (hist[i] / maxC) * plotH;
      ctx.fillStyle = 'rgba(168,85,247,0.6)';
      ctx.fillRect(x + 1, padTop + plotH - barH, plotW / bins - 1, barH);
    }

    const sorted = s.slice().sort((a, b) => a - b);
    const p2 = sorted[Math.floor(0.025 * sorted.length)];
    const p97 = sorted[Math.floor(0.975 * sorted.length)];
    const se = Math.sqrt(s.reduce((a, v) => { const m = s.reduce((x, y) => x + y, 0) / s.length; return a + (v - m) * (v - m); }, 0) / (s.length - 1));
    [p2, p97].forEach((xv) => {
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.moveTo(xScale.toPx(xv), padTop); ctx.lineTo(xScale.toPx(xv), padTop + plotH); ctx.stroke();
      ctx.setLineDash([]);
    });

    if ($('bootSEVal')) $('bootSEVal').textContent = formatNum(se, 3);
    if ($('bootCIVal')) $('bootCIVal').textContent = `[${formatNum(p2, 2)}, ${formatNum(p97, 2)}]`;
    if ($('bootCountVal')) $('bootCountVal').textContent = s.length;
  }

  /* ------------------------------------------------------------------------
     3.4 Kİ-KARE (χ²) TESTİ
     ------------------------------------------------------------------------ */
  function rollDieOnce() {
    const w = [1, 1, 1, 1, 1, 2]; // 6 biraz daha olası (varsayılan hileli örnek)
    const total = w.reduce((a, b) => a + b, 0);
    let u = Math.random() * total, acc = 0;
    for (let f = 0; f < 6; f++) { acc += w[f]; if (u <= acc) return f; }
    return 5;
  }

  function chisqGoodness() {
    const obs = state.chisq.observed;
    const total = obs.reduce((a, b) => a + b, 0) || 1;
    const exp = total / 6;
    let chi2 = 0;
    obs.forEach((o) => { chi2 += Math.pow(o - exp, 2) / exp; });
    const dof = 5;
    const pValue = 1 - dist.chisq.cdf(chi2, dof);
    return { chi2, dof, pValue, exp };
  }

  function chisqIndependence() {
    const t = state.chisq.table;
    const rows = t.length, cols = t[0].length;
    const rowSum = t.map((r) => r.reduce((a, b) => a + b, 0));
    const colSum = new Array(cols).fill(0);
    t.forEach((r) => r.forEach((v, c) => { colSum[c] += v; }));
    const total = rowSum.reduce((a, b) => a + b, 0) || 1;
    let chi2 = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const e = (rowSum[r] * colSum[c]) / total;
        if (e > 0) chi2 += Math.pow(t[r][c] - e, 2) / e;
      }
    }
    const dof = (rows - 1) * (cols - 1);
    const pValue = 1 - dist.chisq.cdf(chi2, dof);
    return { chi2, dof, pValue };
  }

  function drawChisq() {
    const info = fitCanvas($('statsStageCanvas_3'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const padX = 40, padTop = 24, padBot = 34;
    const plotW = w - padX * 2, plotH = h - padTop - padBot;

    if (state.chisq.mode === 'goodness') {
      const { chi2, dof, pValue, exp } = chisqGoodness();
      const obs = state.chisq.observed;
      const maxV = Math.max(exp, ...obs, 1);
      const barW = plotW / 6;
      ctx.fillStyle = '#94a3b8'; ctx.font = '700 11px monospace';
      ctx.fillText(`Zar Yüzleri — Gözlenen (camgöbeği) vs Beklenen (gri kesikli, E=${formatNum(exp, 1)})`, padX, 14);
      for (let f = 0; f < 6; f++) {
        const x = padX + f * barW;
        const barH = (obs[f] / maxV) * plotH;
        ctx.fillStyle = 'rgba(0,242,254,0.6)';
        ctx.fillRect(x + barW * 0.15, padTop + plotH - barH, barW * 0.7, barH);
        const expY = padTop + plotH - (exp / maxV) * plotH;
        ctx.strokeStyle = 'rgba(148,163,184,0.8)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + barW * 0.05, expY); ctx.lineTo(x + barW * 0.95, expY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '600 11px monospace';
        ctx.fillText(String(f + 1), x + barW / 2 - 3, padTop + plotH + 16);
      }
      updateChisqResult(chi2, dof, pValue);
    } else {
      // Bağımsızlık: kontenjans tablosu + χ² dağılımı üzerinde gözlenen değer
      const { chi2, dof, pValue } = chisqIndependence();
      drawChiDistWithMarker(ctx, padX, padTop, plotW, plotH, chi2, dof);
      updateChisqResult(chi2, dof, pValue);
    }
  }

  function drawChiDistWithMarker(ctx, padX, padTop, plotW, plotH, chi2Obs, dof) {
    const hi = Math.max(chi2Obs * 1.3, dof * 3, 10);
    const xScale = makeScale([0, hi], [padX, padX + plotW]);
    let maxY = 1e-9;
    for (let i = 1; i < 200; i++) maxY = Math.max(maxY, dist.chisq.pdf((hi * i) / 200, dof));
    const yScale = makeScale([0, maxY * 1.1], [padTop + plotH, padTop]);
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.beginPath(); ctx.moveTo(padX, padTop); ctx.lineTo(padX, padTop + plotH); ctx.lineTo(padX + plotW, padTop + plotH); ctx.stroke();
    fillTail(ctx, xScale, yScale, (x) => dist.chisq.pdf(x, dof), chi2Obs, hi, padTop + plotH, 'rgba(244,63,94,0.4)');
    drawCurveLine(ctx, xScale, yScale, (x) => dist.chisq.pdf(x, dof), 0.001, hi, '#a855f7');
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(xScale.toPx(chi2Obs), padTop); ctx.lineTo(xScale.toPx(chi2Obs), padTop + plotH); ctx.stroke();
    ctx.fillStyle = '#fbbf24'; ctx.font = '700 11px monospace';
    ctx.fillText(`χ²_gözlenen = ${formatNum(chi2Obs, 2)}`, xScale.toPx(chi2Obs) + 6, padTop + 16);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`χ²(dof=${dof}) dağılımı — kırmızı alan p-değeri`, padX, padTop - 6);
  }

  function updateChisqResult(chi2, dof, pValue) {
    if ($('chisqStatVal')) $('chisqStatVal').textContent = formatNum(chi2, 3);
    if ($('chisqDofVal')) $('chisqDofVal').textContent = dof;
    if ($('chisqPVal')) {
      $('chisqPVal').textContent = formatNum(pValue, 4);
      $('chisqPVal').style.color = pValue < 0.05 ? '#f87171' : '#34d399';
    }
  }

  function renderChisqTableUI() {
    const box = $('chisqTableBox');
    if (!box) return;
    if (state.chisq.mode === 'independence') {
      box.hidden = false;
      box.innerHTML = state.chisq.table.map((row, r) => row.map((v, c) => `
        <input type="number" min="0" class="bio-input" style="width:70px;display:inline-block;margin:2px;" data-r="${r}" data-c="${c}" value="${v}" />
      `).join('')).join('<br/>');
      box.querySelectorAll('input').forEach((inp) => {
        inp.addEventListener('input', (e) => {
          state.chisq.table[+e.target.dataset.r][+e.target.dataset.c] = +e.target.value || 0;
        });
      });
    } else {
      box.hidden = true;
      box.innerHTML = '';
    }
  }

  /* ------------------------------------------------------------------------
     ANA DÖNGÜ & UI
     ------------------------------------------------------------------------ */
  let running = true;
  function loop() {
    requestAnimationFrame(loop);
    const el = $('mod3');
    if (!running || !el || !el.classList.contains('active')) return;
    if (state.activeSub === '3_1') drawNHST();
    else if (state.activeSub === '3_2') drawCI();
    else if (state.activeSub === '3_3') { ensureBootData(); drawBootstrap(); }
    else if (state.activeSub === '3_4') drawChisq();
  }
  requestAnimationFrame(loop);

  function renderNhstControls() {
    if ($('nhstNVal')) $('nhstNVal').textContent = state.nhst.n;
    if ($('nhstDVal')) $('nhstDVal').textContent = formatNum(state.nhst.d, 2);
    if ($('nhstAlphaVal')) $('nhstAlphaVal').textContent = formatNum(state.nhst.alpha, 3);
  }

  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod3 .subtab-btn').forEach((b) => b.classList.toggle('active', b.dataset.sub === subId));
    ['3_1', '3_2', '3_3', '3_4'].forEach((id) => {
      const pane = $(`mod3_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.n != null) { state.nhst.n = preset.n; if ($('nhstNSlider')) $('nhstNSlider').value = preset.n; renderNhstControls(); }
    if (preset.alpha != null) { state.nhst.alpha = preset.alpha; if ($('nhstAlphaSlider')) $('nhstAlphaSlider').value = preset.alpha; renderNhstControls(); }
    if (preset.level != null) { state.ci.level = preset.level; if ($('ciLevelSelect')) $('ciLevelSelect').value = String(preset.level); }
    if (preset.B != null) { state.boot.target = preset.B; }
    if (preset.mode) { state.chisq.mode = preset.mode; syncChisqButtons(); renderChisqTableUI(); }
    if (preset.rolls != null) { for (let i = 0; i < preset.rolls; i++) state.chisq.observed[rollDieOnce()]++; }
  }

  function syncChisqButtons() {
    document.querySelectorAll('[data-chisqmode]').forEach((b) => b.classList.toggle('active', b.dataset.chisqmode === state.chisq.mode));
  }

  function init() {
    renderNhstControls();
    $('nhstNSlider')?.addEventListener('input', (e) => { state.nhst.n = +e.target.value; renderNhstControls(); });
    $('nhstDSlider')?.addEventListener('input', (e) => { state.nhst.d = +e.target.value; renderNhstControls(); });
    $('nhstAlphaSlider')?.addEventListener('input', (e) => { state.nhst.alpha = +e.target.value; renderNhstControls(); });

    $('ciLevelSelect')?.addEventListener('change', (e) => { state.ci.level = +e.target.value; });
    $('ciNSlider')?.addEventListener('input', (e) => { state.ci.n = +e.target.value; if ($('ciNVal')) $('ciNVal').textContent = e.target.value; });
    $('ciDraw100Btn')?.addEventListener('click', () => { for (let i = 0; i < 100; i++) drawOneCI(); });
    $('ciResetBtn')?.addEventListener('click', () => { state.ci.bars = []; });

    $('bootStatSelect')?.addEventListener('change', (e) => { state.boot.stat = e.target.value; state.boot.samples = []; });
    $('bootRunBtn')?.addEventListener('click', () => bootstrapStep(2000));
    $('bootResetBtn')?.addEventListener('click', () => { state.boot.samples = []; state.boot.data = []; ensureBootData(); });

    document.querySelectorAll('[data-chisqmode]').forEach((btn) => {
      btn.addEventListener('click', () => { state.chisq.mode = btn.dataset.chisqmode; syncChisqButtons(); renderChisqTableUI(); });
    });
    syncChisqButtons();
    renderChisqTableUI();
    $('chisqRoll100Btn')?.addEventListener('click', () => { for (let i = 0; i < 100; i++) state.chisq.observed[rollDieOnce()]++; });
    $('chisqResetBtn')?.addEventListener('click', () => { state.chisq.observed = [0, 0, 0, 0, 0, 0]; });

    document.querySelectorAll('#mod3 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => { switchSubtab(btn.dataset.sub); window.AffeStats?.onSubtabChanged(); });
    });
    switchSubtab('3_1');
  }

  window.Mod3Inference = {
    init, switchSubtab, applyPreset,
    getActiveSub: () => `stats3_${state.activeSub.split('_')[1]}`,
    setRunning: (r) => { running = r; }
  };
})();
