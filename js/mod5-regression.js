/* ============================================================================
   affeStats — MODÜL 5: Regresyon, Korelasyon, ANOVA ve Aşırı Öğrenme
   5.1 Canlı OLS & Hata Kareleri   5.2 Anscombe Dörtlüsü   5.3 Polinom & Overfitting
   ============================================================================ */
(function () {
  'use strict';

  const { dist, mulberry32, makeGaussian, fitCanvas, formatNum, makeScale, linreg, polyfit, clamp } = window.StatsCore;
  const { ANSCOMBE } = window.StatsData;
  const $ = (id) => document.getElementById(id);
  const rand = mulberry32(333);
  const gauss = makeGaussian(rand);

  const state = {
    activeSub: '5_1',
    ols: { points: [], dragIdx: -1 },
    ans: { key: 'I' },
    poly: { degree: 3, trainX: [], trainY: [], testX: [], testY: [], history: [] }
  };

  function seedOlsPoints() {
    state.ols.points = [];
    for (let i = 0; i < 10; i++) {
      const x = 1 + i * 0.8 + (rand() - 0.5) * 0.3;
      const y = 2 + 1.3 * x + gauss(0, 1.4);
      state.ols.points.push({ x, y });
    }
  }
  seedOlsPoints();

  function pearson(xs, ys) {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sx2 = 0, sy2 = 0;
    for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sx2 += dx * dx; sy2 += dy * dy; }
    return sxy / Math.sqrt(sx2 * sy2 || 1e-12);
  }
  function spearman(xs, ys) {
    const rankOf = (arr) => {
      const idx = arr.map((v, i) => i).sort((a, b) => arr[a] - arr[b]);
      const ranks = new Array(arr.length);
      idx.forEach((orig, r) => { ranks[orig] = r + 1; });
      return ranks;
    };
    return pearson(rankOf(xs), rankOf(ys));
  }

  function olsStats(points) {
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    const n = xs.length;
    if (n < 2) return null;
    const reg = linreg(xs, ys);
    const r = pearson(xs, ys);
    const rho = spearman(xs, ys);
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    let ssTot = 0, ssRes = 0;
    points.forEach((p) => { const yhat = reg.predict(p.x); ssTot += (p.y - yMean) ** 2; ssRes += (p.y - yhat) ** 2; });
    const ssReg = ssTot - ssRes;
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    const dfReg = 1, dfRes = n - 2;
    const msReg = ssReg / dfReg, msRes = dfRes > 0 ? ssRes / dfRes : NaN;
    const F = msRes > 0 ? msReg / msRes : NaN;
    const pValue = isFinite(F) && dfRes > 0 ? 1 - dist.f.cdf(F, dfReg, dfRes) : NaN;
    return { reg, r, rho, r2, ssTot, ssReg, ssRes, dfReg, dfRes, msReg, msRes, F, pValue, n };
  }

  function drawOLS() {
    const info = fitCanvas($('statsStageCanvas_5'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const pts = state.ols.points;
    const padX = 46, padTop = 20, padBot = 30;
    const plotW = w - padX * 2, plotH = h - padTop - padBot;

    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const xMin = Math.min(0, ...xs) - 1, xMax = Math.max(10, ...xs) + 1;
    const yMin = Math.min(0, ...ys) - 1, yMax = Math.max(10, ...ys) + 1;
    const xScale = makeScale([xMin, xMax], [padX, padX + plotW]);
    const yScale = makeScale([yMin, yMax], [padTop + plotH, padTop]);

    ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, padTop); ctx.lineTo(padX, padTop + plotH); ctx.lineTo(padX + plotW, padTop + plotH); ctx.stroke();

    const st = olsStats(pts);
    if (st) {
      // regresyon doğrusu
      ctx.strokeStyle = '#00f2fe'; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(xScale.toPx(xMin), yScale.toPx(st.reg.predict(xMin)));
      ctx.lineTo(xScale.toPx(xMax), yScale.toPx(st.reg.predict(xMax)));
      ctx.stroke();

      // artıklar (residual) + hata kareleri
      pts.forEach((p) => {
        const yhat = st.reg.predict(p.x);
        const resid = p.y - yhat;
        const px = xScale.toPx(p.x), py = yScale.toPx(p.y), pyhat = yScale.toPx(yhat);
        ctx.strokeStyle = 'rgba(251,191,36,0.75)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, pyhat); ctx.stroke();
        const sidePx = Math.abs(py - pyhat);
        if (sidePx > 1) {
          ctx.fillStyle = 'rgba(244,63,94,0.22)';
          const sqX = resid >= 0 ? px : px - sidePx;
          const sqY = resid >= 0 ? pyhat : py;
          ctx.fillRect(sqX, sqY, sidePx, sidePx);
        }
      });
    }

    // noktalar
    pts.forEach((p, i) => {
      ctx.fillStyle = i === state.ols.dragIdx ? '#fbbf24' : '#a855f7';
      ctx.beginPath(); ctx.arc(xScale.toPx(p.x), yScale.toPx(p.y), 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0b0f17'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    ctx.fillStyle = '#94a3b8'; ctx.font = '600 10.5px monospace';
    ctx.fillText('Tuvale tıklayarak nokta ekleyin · Mevcut noktayı sürükleyin', padX, padTop + plotH + 20);

    if (st) {
      if ($('olsEqVal')) $('olsEqVal').textContent = `ŷ = ${formatNum(st.reg.b0, 3)} + ${formatNum(st.reg.b1, 3)}x`;
      if ($('olsRVal')) $('olsRVal').textContent = formatNum(st.r, 4);
      if ($('olsRhoVal')) $('olsRhoVal').textContent = formatNum(st.rho, 4);
      if ($('olsR2Val')) $('olsR2Val').textContent = formatNum(st.r2, 4);
      if ($('olsAnovaTable')) {
        $('olsAnovaTable').innerHTML = `
          <div style="overflow-x:auto;">
          <table class="lab-compare-table" style="font-size:10.5px;white-space:nowrap;">
            <thead><tr><th style="width:auto;padding:5px 6px;">Kaynak</th><th style="padding:5px 6px;">SS</th><th style="padding:5px 6px;">df</th><th style="padding:5px 6px;">MS</th><th style="padding:5px 6px;">F</th><th style="padding:5px 6px;">p</th></tr></thead>
            <tbody>
              <tr><td style="padding:5px 6px;">Regresyon</td><td style="padding:5px 6px;">${formatNum(st.ssReg, 2)}</td><td style="padding:5px 6px;">${st.dfReg}</td><td style="padding:5px 6px;">${formatNum(st.msReg, 2)}</td><td style="padding:5px 6px;">${formatNum(st.F, 3)}</td><td style="padding:5px 6px;">${formatNum(st.pValue, 4)}</td></tr>
              <tr><td style="padding:5px 6px;">Artık</td><td style="padding:5px 6px;">${formatNum(st.ssRes, 2)}</td><td style="padding:5px 6px;">${st.dfRes}</td><td style="padding:5px 6px;">${formatNum(st.msRes, 2)}</td><td style="padding:5px 6px;">—</td><td style="padding:5px 6px;">—</td></tr>
              <tr><td style="padding:5px 6px;">Toplam</td><td style="padding:5px 6px;">${formatNum(st.ssTot, 2)}</td><td style="padding:5px 6px;">${st.n - 1}</td><td style="padding:5px 6px;">—</td><td style="padding:5px 6px;">—</td><td style="padding:5px 6px;">—</td></tr>
            </tbody>
          </table>
          </div>`;
      }
    }

    state.ols._xScale = xScale; state.ols._yScale = yScale;
  }

  function initOlsCanvas() {
    const canvas = $('statsStageCanvas_5');
    if (!canvas) return;
    let downInfo = null;
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const { _xScale, _yScale } = state.ols;
      if (!_xScale) return;
      let hitIdx = -1, hitDist = 14;
      state.ols.points.forEach((p, i) => {
        const d = Math.hypot(_xScale.toPx(p.x) - px, _yScale.toPx(p.y) - py);
        if (d < hitDist) { hitDist = d; hitIdx = i; }
      });
      downInfo = { px, py, hitIdx, moved: false };
      state.ols.dragIdx = hitIdx;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!downInfo) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      if (Math.hypot(px - downInfo.px, py - downInfo.py) > 3) downInfo.moved = true;
      if (downInfo.hitIdx >= 0 && state.ols._xScale) {
        state.ols.points[downInfo.hitIdx].x = state.ols._xScale.toVal(px);
        state.ols.points[downInfo.hitIdx].y = state.ols._yScale.toVal(py);
      }
    });
    canvas.addEventListener('pointerup', (e) => {
      if (!downInfo) return;
      if (downInfo.hitIdx < 0 && !downInfo.moved && state.ols._xScale) {
        state.ols.points.push({ x: state.ols._xScale.toVal(downInfo.px), y: state.ols._yScale.toVal(downInfo.py) });
      } else if (downInfo.hitIdx >= 0 && !downInfo.moved && e.shiftKey) {
        state.ols.points.splice(downInfo.hitIdx, 1);
      }
      state.ols.dragIdx = -1;
      downInfo = null;
    });
    canvas.addEventListener('dblclick', (e) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const { _xScale, _yScale } = state.ols;
      if (!_xScale) return;
      let hitIdx = -1, hitDist = 16;
      state.ols.points.forEach((p, i) => {
        const d = Math.hypot(_xScale.toPx(p.x) - px, _yScale.toPx(p.y) - py);
        if (d < hitDist) { hitDist = d; hitIdx = i; }
      });
      if (hitIdx >= 0) state.ols.points.splice(hitIdx, 1);
    });
  }

  /* ------------------------------------------------------------------------
     5.2 ANSCOMBE DÖRTLÜSÜ
     ------------------------------------------------------------------------ */
  function drawAnscombe() {
    const info = fitCanvas($('statsStageCanvas_5'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const set = ANSCOMBE[state.ans.key];
    const padX = 46, padTop = 20, padBot = 30;
    const plotW = w - padX * 2, plotH = h - padTop - padBot;
    const xScale = makeScale([Math.min(...set.x) - 2, Math.max(...set.x) + 2], [padX, padX + plotW]);
    const yScale = makeScale([Math.min(...set.y) - 2, Math.max(...set.y) + 2], [padTop + plotH, padTop]);

    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.beginPath(); ctx.moveTo(padX, padTop); ctx.lineTo(padX, padTop + plotH); ctx.lineTo(padX + plotW, padTop + plotH); ctx.stroke();

    const st = olsStats(set.x.map((x, i) => ({ x, y: set.y[i] })));
    ctx.strokeStyle = '#00f2fe'; ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(xScale.toPx(xScale.toVal(padX)), yScale.toPx(st.reg.predict(xScale.toVal(padX))));
    ctx.lineTo(xScale.toPx(xScale.toVal(padX + plotW)), yScale.toPx(st.reg.predict(xScale.toVal(padX + plotW))));
    ctx.stroke();

    set.x.forEach((x, i) => {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath(); ctx.arc(xScale.toPx(x), yScale.toPx(set.y[i]), 6, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = '#e2e8f0'; ctx.font = '700 12px monospace';
    ctx.fillText(`Anscombe Seti ${state.ans.key}`, padX, padTop - 4);

    if ($('ansDesc')) $('ansDesc').textContent = set.desc;
    if ($('ansStatsTable')) {
      const mx = set.x.reduce((a, b) => a + b, 0) / set.x.length;
      const my = set.y.reduce((a, b) => a + b, 0) / set.y.length;
      const sx = Math.sqrt(set.x.reduce((a, v) => a + (v - mx) ** 2, 0) / (set.x.length - 1));
      const sy = Math.sqrt(set.y.reduce((a, v) => a + (v - my) ** 2, 0) / (set.y.length - 1));
      $('ansStatsTable').innerHTML = `
        <table class="lab-compare-table">
          <tbody>
            <tr><th>x̄</th><td>${formatNum(mx, 2)}</td></tr>
            <tr><th>ȳ</th><td>${formatNum(my, 2)}</td></tr>
            <tr><th>s_x</th><td>${formatNum(sx, 3)}</td></tr>
            <tr><th>s_y</th><td>${formatNum(sy, 3)}</td></tr>
            <tr><th>r (Pearson)</th><td>${formatNum(st.r, 4)}</td></tr>
            <tr><th>Regresyon</th><td>ŷ=${formatNum(st.reg.b0, 2)}+${formatNum(st.reg.b1, 2)}x</td></tr>
          </tbody>
        </table>`;
    }
  }

  /* ------------------------------------------------------------------------
     5.3 POLİNOM REGRESYON & OVERFITTING
     ------------------------------------------------------------------------ */
  function trueFn(x) { return 2.5 * Math.sin(x * 0.9) + 0.15 * x; }
  function seedPolyData() {
    state.poly.trainX = []; state.poly.trainY = [];
    state.poly.testX = []; state.poly.testY = [];
    for (let i = 0; i < 22; i++) {
      const x = rand() * 10 - 1;
      state.poly.trainX.push(x); state.poly.trainY.push(trueFn(x) + gauss(0, 0.6));
    }
    for (let i = 0; i < 22; i++) {
      const x = rand() * 10 - 1;
      state.poly.testX.push(x); state.poly.testY.push(trueFn(x) + gauss(0, 0.6));
    }
    state.poly.history = [];
  }
  seedPolyData();

  function mse(xs, ys, predict) {
    let s = 0;
    for (let i = 0; i < xs.length; i++) s += (ys[i] - predict(xs[i])) ** 2;
    return s / xs.length;
  }

  function drawPoly() {
    const info = fitCanvas($('statsStageCanvas_5'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const p = state.poly;
    const padX = 46, padTop = 20, padBot = 30;
    const topH = h * 0.62, botH = h * 0.22, gap = 20;
    const plotW = w - padX * 2;

    const fit = polyfit(p.trainX, p.trainY, p.degree);
    const trainMSE = mse(p.trainX, p.trainY, fit.predict);
    const testMSE = mse(p.testX, p.testY, fit.predict);

    const xScale = makeScale([-1.5, 9.5], [padX, padX + plotW]);
    const yScale = makeScale([-5, 6], [padTop + topH, padTop]);
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.beginPath(); ctx.moveTo(padX, padTop); ctx.lineTo(padX, padTop + topH); ctx.lineTo(padX + plotW, padTop + topH); ctx.stroke();

    ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i <= 150; i++) { const x = -1.5 + (11 * i) / 150; const px = xScale.toPx(x), py = yScale.toPx(trueFn(x)); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();

    ctx.strokeStyle = '#00f2fe'; ctx.lineWidth = 2.3;
    ctx.beginPath();
    for (let i = 0; i <= 150; i++) { const x = -1.5 + (11 * i) / 150; const px = xScale.toPx(x), py = yScale.toPx(clamp(fit.predict(x), -8, 9)); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();

    p.trainX.forEach((x, i) => { ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(xScale.toPx(x), yScale.toPx(p.trainY[i]), 4.2, 0, Math.PI * 2); ctx.fill(); });
    p.testX.forEach((x, i) => { ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(xScale.toPx(x), yScale.toPx(p.testY[i]), 4.2, 0, Math.PI * 2); ctx.fill(); });

    ctx.fillStyle = '#94a3b8'; ctx.font = '600 10.5px monospace';
    ctx.fillText('— Gerçek fonksiyon   ● Eğitim   ● Test/Doğrulama   — Uydurulan model', padX, padTop - 4);

    // Alt: derece arttıkça MSE geçmişi
    const botY = padTop + topH + gap;
    ctx.fillStyle = '#94a3b8'; ctx.font = '700 11px monospace';
    ctx.fillText('MSE vs Polinom Derecesi', padX, botY - 4);
    const hx = state.poly.history;
    const existing = hx.find((e) => e.degree === p.degree);
    if (!existing) hx.push({ degree: p.degree, trainMSE, testMSE });
    hx.sort((a, b) => a.degree - b.degree);
    const maxMSE = Math.max(1, ...hx.map((e) => Math.min(e.testMSE, 30)));
    const xs2 = makeScale([1, 15], [padX, padX + plotW]);
    const ys2 = makeScale([0, maxMSE], [botY + botH, botY]);
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.beginPath(); ctx.moveTo(padX, botY); ctx.lineTo(padX, botY + botH); ctx.lineTo(padX + plotW, botY + botH); ctx.stroke();
    drawSeries(ctx, xs2, ys2, hx, 'trainMSE', '#00f2fe');
    drawSeries(ctx, xs2, ys2, hx, 'testMSE', '#f43f5e');

    if ($('polyTrainMSE')) $('polyTrainMSE').textContent = formatNum(trainMSE, 3);
    if ($('polyTestMSE')) $('polyTestMSE').textContent = formatNum(testMSE, 3);
    if ($('polyDegreeVal')) $('polyDegreeVal').textContent = p.degree;
  }
  function drawSeries(ctx, xs, ys, hx, key, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    hx.forEach((e, i) => {
      const px = xs.toPx(e.degree), py = ys.toPx(Math.min(e[key], 30));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  /* ------------------------------------------------------------------------
     ANA DÖNGÜ & UI
     ------------------------------------------------------------------------ */
  let running = true;
  function loop() {
    requestAnimationFrame(loop);
    const el = $('mod5');
    if (!running || !el || !el.classList.contains('active')) return;
    if (state.activeSub === '5_1') drawOLS();
    else if (state.activeSub === '5_2') drawAnscombe();
    else if (state.activeSub === '5_3') drawPoly();
  }
  requestAnimationFrame(loop);

  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod5 .subtab-btn').forEach((b) => b.classList.toggle('active', b.dataset.sub === subId));
    ['5_1', '5_2', '5_3'].forEach((id) => {
      const pane = $(`mod5_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.set) { state.ans.key = preset.set; renderAnsButtons(); }
    if (preset.degree != null) { state.poly.degree = preset.degree; if ($('polyDegreeSlider')) $('polyDegreeSlider').value = preset.degree; }
  }

  function renderAnsButtons() {
    document.querySelectorAll('[data-ansset]').forEach((b) => b.classList.toggle('active', b.dataset.ansset === state.ans.key));
  }

  function init() {
    initOlsCanvas();
    $('olsClearBtn')?.addEventListener('click', () => { state.ols.points = []; });
    $('olsReseedBtn')?.addEventListener('click', seedOlsPoints);
    $('olsOutlierBtn')?.addEventListener('click', () => { state.ols.points.push({ x: 14, y: 2 }); });

    document.querySelectorAll('[data-ansset]').forEach((btn) => {
      btn.addEventListener('click', () => { state.ans.key = btn.dataset.ansset; renderAnsButtons(); });
    });
    renderAnsButtons();

    $('polyDegreeSlider')?.addEventListener('input', (e) => { state.poly.degree = +e.target.value; });
    $('polyReseedBtn')?.addEventListener('click', seedPolyData);

    document.querySelectorAll('#mod5 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => { switchSubtab(btn.dataset.sub); window.AffeStats?.onSubtabChanged(); });
    });
    switchSubtab('5_1');
  }

  window.Mod5Regression = {
    init, switchSubtab, applyPreset,
    getActiveSub: () => `stats5_${state.activeSub.split('_')[1]}`,
    setRunning: (r) => { running = r; }
  };
})();
