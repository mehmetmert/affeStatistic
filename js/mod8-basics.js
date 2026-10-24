/* ============================================================================
   affeStats — MODÜL 8: Temel Olasılık ve Ortalamalar
   8.1 Olasılık: Madeni Para & Zar   8.2 Ortalamalar (Aritmetik/Geometrik/Harmonik)
   8.3 Normal Dağılım & Çan Eğrisi (gerçek hayat örnekleri)
   8.4 Korelasyon Galerisi (sezgi — tam araç için Modül 5'e yönlendirir)
   ============================================================================ */
(function () {
  'use strict';

  const { dist, mulberry32, makeGaussian, fitCanvas, formatNum, makeScale, clamp } = window.StatsCore;
  const $ = (id) => document.getElementById(id);
  const rand = mulberry32(909);
  const gauss = makeGaussian(rand);

  const state = {
    activeSub: '8_1',
    prob: { mode: 'coin', heads: 0, tails: 0, coinFace: null, coinSpin: 0, sums: new Array(13).fill(0), diceTotal: 0, lastDice: [1, 1], diceSpin: 0 },
    avg: { data: [12, 15, 18, 22, 25], scenario: 'custom' },
    normal: { scenario: 'height', mu: 170, sigma: 10, value: null },
    corr: { r: 0.8 }
  };

  /* ------------------------------------------------------------------------
     8.1 OLASILIK: MADENİ PARA & ZAR
     ------------------------------------------------------------------------ */
  function flipCoin() {
    const p = state.prob;
    p.coinFace = rand() < 0.5 ? 'Y' : 'T';
    if (p.coinFace === 'Y') p.heads++; else p.tails++;
    p.coinSpin = 1;
  }
  function flipCoinN(n) { for (let i = 0; i < n; i++) flipCoin(); }

  function rollDice() {
    const p = state.prob;
    const a = 1 + Math.floor(rand() * 6), b = 1 + Math.floor(rand() * 6);
    p.lastDice = [a, b];
    p.sums[a + b]++;
    p.diceTotal++;
    p.diceSpin = 1;
  }
  function rollDiceN(n) { for (let i = 0; i < n; i++) rollDice(); }

  function drawProb() {
    const info = fitCanvas($('statsStageCanvas_8'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const p = state.prob;

    if (p.mode === 'coin') {
      // Büyük madeni para
      const cx = w / 2, cy = 110, r = 56;
      const spin = Math.max(0, p.coinSpin);
      p.coinSpin = Math.max(0, p.coinSpin - 0.04);
      const scaleX = Math.abs(Math.cos(spin * Math.PI * 6));
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(Math.max(0.15, scaleX), 1);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = p.coinFace === 'T' ? '#f59e0b' : '#00f2fe';
      ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke();
      if (scaleX > 0.4) {
        ctx.fillStyle = '#07090e'; ctx.font = '800 30px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.coinFace === 'T' ? 'T' : (p.coinFace === 'Y' ? 'Y' : '?'), 0, 2);
      }
      ctx.restore();

      // Yazı/Tura çubukları
      const total = p.heads + p.tails || 1;
      const barY = 220, barH = 220, barW = 140, gap = 60;
      const x1 = w / 2 - gap - barW, x2 = w / 2 + gap;
      [['Yazı', p.heads, x1, '#00f2fe'], ['Tura', p.tails, x2, '#f59e0b']].forEach(([label, count, x, color]) => {
        const hgt = (count / total) * barH;
        ctx.fillStyle = color + '55';
        ctx.fillRect(x, barY + barH - hgt, barW, hgt);
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(x, barY + barH - hgt, barW, hgt);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '700 13px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${label}: ${count}`, x + barW / 2, barY + barH + 20);
        ctx.fillText(`%${formatNum((count / total) * 100, 1)}`, x + barW / 2, barY + barH - hgt - 8);
      });
      ctx.strokeStyle = 'rgba(16,185,129,0.6)'; ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.moveTo(w / 2 - gap - barW, barY + barH / 2); ctx.lineTo(w / 2 + gap + barW, barY + barH / 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#34d399'; ctx.font = '700 11px monospace'; ctx.textAlign = 'left';
      ctx.fillText('Teorik P = 0.5', w / 2 + gap + barW + 8, barY + barH / 2 + 4);

      if ($('coinHeadsVal')) $('coinHeadsVal').textContent = p.heads;
      if ($('coinTailsVal')) $('coinTailsVal').textContent = p.tails;
      if ($('coinTotalVal')) $('coinTotalVal').textContent = total;
      if ($('coinEmpVal')) $('coinEmpVal').textContent = formatNum(p.heads / total, 4);
    } else {
      // Zar: 6x6 örneklem uzayı + toplam histogramı
      const gx0 = 30, gy0 = 20, cell = 26;
      ctx.fillStyle = '#94a3b8'; ctx.font = '700 11px monospace';
      ctx.fillText('Örneklem Uzayı (6×6 = 36 olası sonuç)', gx0, gy0 - 6);
      for (let a = 1; a <= 6; a++) {
        for (let b = 1; b <= 6; b++) {
          const x = gx0 + (a - 1) * cell, y = gy0 + (b - 1) * cell;
          const isLast = p.lastDice[0] === a && p.lastDice[1] === b;
          ctx.fillStyle = isLast ? 'rgba(0,242,254,0.85)' : 'rgba(148,163,184,0.18)';
          ctx.fillRect(x, y, cell - 2, cell - 2);
          ctx.fillStyle = isLast ? '#07090e' : '#64748b';
          ctx.font = '600 9px monospace'; ctx.textAlign = 'center';
          ctx.fillText(`${a}+${b}`, x + cell / 2 - 1, y + cell / 2 + 3);
        }
      }

      const histX = gx0 + 6 * cell + 40, histW = w - histX - 30, histY = gy0, histH = 6 * cell;
      ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'left';
      ctx.fillText(`Toplam Dağılımı (N=${p.diceTotal})`, histX, histY - 6);
      const maxC = Math.max(1, ...p.sums);
      const barW2 = histW / 11;
      for (let s = 2; s <= 12; s++) {
        const bh = (p.sums[s] / maxC) * histH;
        const x = histX + (s - 2) * barW2;
        ctx.fillStyle = 'rgba(168,85,247,0.6)';
        ctx.fillRect(x + 1, histY + histH - bh, barW2 - 2, bh);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '600 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText(String(s), x + barW2 / 2, histY + histH + 14);
      }
      // teorik olasılık eğrisi (üçgen dağılım, 7 en olası)
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let s = 2; s <= 12; s++) {
        const theoP = (6 - Math.abs(s - 7)) / 36;
        const x = histX + (s - 2) * barW2 + barW2 / 2;
        const y = histY + histH - (theoP / (maxC / Math.max(1, p.diceTotal))) * histH;
        if (s === 2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if ($('diceLastVal')) $('diceLastVal').textContent = `${p.lastDice[0]} + ${p.lastDice[1]} = ${p.lastDice[0] + p.lastDice[1]}`;
      if ($('diceTotalVal')) $('diceTotalVal').textContent = p.diceTotal;
      if ($('dice7Val')) $('dice7Val').textContent = p.diceTotal ? `%${formatNum((p.sums[7] / p.diceTotal) * 100, 1)} (teorik %16.7)` : '—';
    }
  }

  /* ------------------------------------------------------------------------
     8.2 ORTALAMALAR
     ------------------------------------------------------------------------ */
  const AVG_SCENARIOS = {
    custom: [12, 15, 18, 22, 25],
    investment: [1.08, 1.12, 0.95, 1.20, 1.03], // yıllık büyüme çarpanları
    speed: [60, 40, 80, 50], // km/s hız değerleri (eşit mesafeler)
    grades: [55, 68, 72, 90, 85, 60, 77]
  };
  function computeAverages(data) {
    const n = data.length;
    const am = data.reduce((a, b) => a + b, 0) / n;
    const allPos = data.every((v) => v > 0);
    const gm = allPos ? Math.pow(data.reduce((a, b) => a * b, 1), 1 / n) : NaN;
    const hm = allPos ? n / data.reduce((a, b) => a + 1 / b, 0) : NaN;
    const sorted = data.slice().sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    const median = n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const freq = {};
    data.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
    let mode = data[0], modeCount = 0;
    Object.keys(freq).forEach((k) => { if (freq[k] > modeCount) { modeCount = freq[k]; mode = +k; } });
    const allSame = Object.values(freq).every((c) => c === modeCount);
    return { am, gm, hm, median, mode: allSame ? NaN : mode, sorted, n };
  }

  function drawAverages() {
    const info = fitCanvas($('statsStageCanvas_8'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const data = state.avg.data;
    if (!data.length) return;
    const st = computeAverages(data);
    const padX = 50, y0 = h / 2;
    const lo = Math.min(...data) - 2, hi = Math.max(...data) + 2;
    const xScale = makeScale([lo, hi], [padX, w - padX]);

    ctx.strokeStyle = 'rgba(148,163,184,0.3)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padX, y0); ctx.lineTo(w - padX, y0); ctx.stroke();

    data.forEach((v) => {
      ctx.fillStyle = 'rgba(148,163,184,0.75)';
      ctx.beginPath(); ctx.arc(xScale.toPx(v), y0, 5, 0, Math.PI * 2); ctx.fill();
    });

    const marks = [
      ['AM', st.am, '#00f2fe', -70],
      ['GM', st.gm, '#a855f7', -30],
      ['HM', st.hm, '#f59e0b', 10],
      ['Medyan', st.median, '#f43f5e', 50],
      [isNaN(st.mode) ? null : 'Mod', st.mode, '#34d399', 90]
    ];
    // Yakın değerlerin etiketleri üst üste binmesin diye her işaretçiye farklı bir
    // dikey seviye ayrılır (marks dizisindeki sabit dy ofseti bu amaçla kullanılır).
    marks.forEach(([label, val, color, dy]) => {
      if (label == null || !isFinite(val)) return;
      const px = xScale.toPx(val);
      const labelY = y0 - 100 + dy;
      ctx.strokeStyle = color; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(px, labelY + 8); ctx.lineTo(px, y0 + 10); ctx.stroke();
      ctx.fillStyle = color; ctx.font = '700 12px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(`${label}=${formatNum(val, 2)}`, px, labelY);
    });

    ctx.fillStyle = '#94a3b8'; ctx.font = '600 11px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`Veri: {${data.map((v) => formatNum(v, 2)).join(', ')}}`, padX, y0 + 50);
    if (isFinite(st.gm) && isFinite(st.hm)) {
      const order = st.am >= st.gm && st.gm >= st.hm ? 'AM ≥ GM ≥ HM doğrulandı ✓' : 'Eşitlik durumu (tüm değerler eşit)';
      ctx.fillStyle = '#34d399';
      ctx.fillText(order, padX, y0 + 72);
    } else {
      ctx.fillStyle = '#f87171';
      ctx.fillText('GM/HM yalnızca tüm değerler pozitifken tanımlıdır.', padX, y0 + 72);
    }

    if ($('avgAMVal')) $('avgAMVal').textContent = formatNum(st.am, 4);
    if ($('avgGMVal')) $('avgGMVal').textContent = isFinite(st.gm) ? formatNum(st.gm, 4) : '—';
    if ($('avgHMVal')) $('avgHMVal').textContent = isFinite(st.hm) ? formatNum(st.hm, 4) : '—';
    if ($('avgMedianVal')) $('avgMedianVal').textContent = formatNum(st.median, 4);
    if ($('avgModeVal')) $('avgModeVal').textContent = isNaN(st.mode) ? 'Yok (tekrar eden değer yok)' : formatNum(st.mode, 4);
  }

  /* ------------------------------------------------------------------------
     8.3 NORMAL DAĞILIM & ÇAN EĞRİSİ
     ------------------------------------------------------------------------ */
  const NORMAL_SCENARIOS = {
    height: { label: 'İnsan Boyu (cm)', mu: 170, sigma: 10, unit: 'cm' },
    iq: { label: 'IQ Puanı', mu: 100, sigma: 15, unit: '' },
    exam: { label: 'Sınav Puanı', mu: 70, sigma: 12, unit: 'puan' },
    custom: { label: 'Özel', mu: 0, sigma: 1, unit: '' }
  };

  function drawNormal() {
    const info = fitCanvas($('statsStageCanvas_8'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const n = state.normal;
    const { mu, sigma } = n;
    const padX = 40, padTop = 24, padBot = 30;
    const plotW = w - padX * 2, plotH = h - padTop - padBot;
    const lo = mu - 4 * sigma, hi = mu + 4 * sigma;
    const xScale = makeScale([lo, hi], [padX, padX + plotW]);
    const maxY = dist.normal.pdf(mu, mu, sigma);
    const yScale = makeScale([0, maxY * 1.1], [padTop + plotH, padTop]);

    const bands = [[1, 'rgba(0,242,254,0.35)'], [2, 'rgba(0,242,254,0.2)'], [3, 'rgba(0,242,254,0.1)']];
    for (let i = bands.length - 1; i >= 0; i--) {
      const [k, color] = bands[i];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(xScale.toPx(mu - k * sigma), padTop + plotH);
      for (let j = 0; j <= 100; j++) {
        const x = mu - k * sigma + (2 * k * sigma * j) / 100;
        ctx.lineTo(xScale.toPx(x), yScale.toPx(dist.normal.pdf(x, mu, sigma)));
      }
      ctx.lineTo(xScale.toPx(mu + k * sigma), padTop + plotH);
      ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = '#00f2fe'; ctx.lineWidth = 2.3;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = lo + ((hi - lo) * i) / 200;
      const px = xScale.toPx(x), py = yScale.toPx(dist.normal.pdf(x, mu, sigma));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ['−3σ', '−2σ', '−1σ', 'μ', '+1σ', '+2σ', '+3σ'].forEach((lbl, i) => {
      const x = mu + (i - 3) * sigma;
      ctx.fillStyle = '#94a3b8'; ctx.font = '600 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(lbl, xScale.toPx(x), padTop + plotH + 16);
    });
    ctx.fillStyle = '#e2e8f0'; ctx.font = '700 11px monospace'; ctx.textAlign = 'left';
    ctx.fillText('%68.3', xScale.toPx(mu) - 20, padTop + 20);
    ctx.fillText('%95.4 (±2σ) · %99.7 (±3σ)', xScale.toPx(mu) - 70, padTop + 38);

    if (n.value != null) {
      const z = (n.value - mu) / sigma;
      const pct = dist.normal.cdf(n.value, mu, sigma);
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(xScale.toPx(n.value), padTop); ctx.lineTo(xScale.toPx(n.value), padTop + plotH); ctx.stroke();
      ctx.fillStyle = '#fbbf24'; ctx.font = '700 11px monospace';
      ctx.fillText(`x=${formatNum(n.value, 1)} → z=${formatNum(z, 2)}, %${formatNum(pct * 100, 1)} persentil`, xScale.toPx(n.value) + 8, padTop + plotH - 10);
    }

    if ($('normalMuVal')) $('normalMuVal').textContent = formatNum(mu, 2);
    if ($('normalSigmaVal')) $('normalSigmaVal').textContent = formatNum(sigma, 2);
  }

  /* ------------------------------------------------------------------------
     8.4 KORELASYON GALERİSİ
     ------------------------------------------------------------------------ */
  const CORR_PRESETS = [1.0, 0.8, 0.5, 0.2, 0, -0.5, -0.8, -1.0];
  function genCorrData(r) {
    const xs = [], ys = [];
    for (let i = 0; i < 80; i++) {
      const x = gauss(0, 1);
      const noise = gauss(0, 1);
      const y = r * x + Math.sqrt(Math.max(0, 1 - r * r)) * noise;
      xs.push(x); ys.push(y);
    }
    return { xs, ys };
  }
  function drawCorrGallery() {
    const info = fitCanvas($('statsStageCanvas_8'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const r = state.corr.r;
    const { xs, ys } = genCorrData(r);
    const padX = 50, padTop = 20, padBot = 24;
    const plotW = w - padX * 2, plotH = h - padTop - padBot;
    const xScale = makeScale([-3.2, 3.2], [padX, padX + plotW]);
    const yScale = makeScale([-3.2, 3.2], [padTop + plotH, padTop]);
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.beginPath(); ctx.moveTo(padX, padTop); ctx.lineTo(padX, padTop + plotH); ctx.lineTo(padX + plotW, padTop + plotH); ctx.stroke();
    xs.forEach((x, i) => {
      ctx.fillStyle = 'rgba(0,242,254,0.75)';
      ctx.beginPath(); ctx.arc(xScale.toPx(x), yScale.toPx(ys[i]), 4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#e2e8f0'; ctx.font = '800 16px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillText(`r ≈ ${formatNum(r, 2)}`, padX, padTop - 2);
  }

  /* ------------------------------------------------------------------------
     ANA DÖNGÜ & UI
     ------------------------------------------------------------------------ */
  let running = true;
  function loop() {
    requestAnimationFrame(loop);
    const el = $('mod8');
    if (!running || !el || !el.classList.contains('active')) return;
    if (state.activeSub === '8_1') drawProb();
    else if (state.activeSub === '8_2') drawAverages();
    else if (state.activeSub === '8_3') drawNormal();
    else if (state.activeSub === '8_4') drawCorrGallery();
  }
  requestAnimationFrame(loop);

  function renderProbMode() {
    document.querySelectorAll('[data-probmode]').forEach((b) => b.classList.toggle('active', b.dataset.probmode === state.prob.mode));
    if ($('probCoinBox')) $('probCoinBox').hidden = state.prob.mode !== 'coin';
    if ($('probDiceBox')) $('probDiceBox').hidden = state.prob.mode !== 'dice';
  }

  function renderAvgInputFromData() {
    if ($('avgDataInput')) $('avgDataInput').value = state.avg.data.join(', ');
  }
  function parseAvgInput(str) {
    return str.split(',').map((s) => parseFloat(s.trim())).filter((v) => !isNaN(v));
  }

  function renderNormalScenarioButtons() {
    document.querySelectorAll('[data-normscenario]').forEach((b) => b.classList.toggle('active', b.dataset.normscenario === state.normal.scenario));
    const customRow = $('normalCustomRow');
    if (customRow) customRow.hidden = state.normal.scenario !== 'custom';
  }

  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod8 .subtab-btn').forEach((b) => b.classList.toggle('active', b.dataset.sub === subId));
    ['8_1', '8_2', '8_3', '8_4'].forEach((id) => {
      const pane = $(`mod8_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.probMode) { state.prob.mode = preset.probMode; renderProbMode(); }
    if (preset.avgScenario) { state.avg.scenario = preset.avgScenario; state.avg.data = AVG_SCENARIOS[preset.avgScenario].slice(); renderAvgInputFromData(); }
    if (preset.normScenario) {
      state.normal.scenario = preset.normScenario;
      const sc = NORMAL_SCENARIOS[preset.normScenario];
      state.normal.mu = sc.mu; state.normal.sigma = sc.sigma;
      renderNormalScenarioButtons();
    }
    if (preset.r != null) { state.corr.r = preset.r; renderCorrButtons(); }
  }

  function renderCorrButtons() {
    document.querySelectorAll('[data-corrr]').forEach((b) => b.classList.toggle('active', +b.dataset.corrr === state.corr.r));
  }

  function init() {
    // 8.1
    document.querySelectorAll('[data-probmode]').forEach((btn) => {
      btn.addEventListener('click', () => { state.prob.mode = btn.dataset.probmode; renderProbMode(); });
    });
    renderProbMode();
    $('coinFlipBtn')?.addEventListener('click', flipCoin);
    $('coinFlip100Btn')?.addEventListener('click', () => flipCoinN(100));
    $('coinResetBtn')?.addEventListener('click', () => { state.prob.heads = 0; state.prob.tails = 0; state.prob.coinFace = null; });
    $('diceRollBtn')?.addEventListener('click', rollDice);
    $('diceRoll100Btn')?.addEventListener('click', () => rollDiceN(100));
    $('diceResetBtn')?.addEventListener('click', () => { state.prob.sums = new Array(13).fill(0); state.prob.diceTotal = 0; state.prob.lastDice = [1, 1]; });

    // 8.2
    renderAvgInputFromData();
    document.querySelectorAll('[data-avgscenario]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.avg.scenario = btn.dataset.avgscenario;
        state.avg.data = AVG_SCENARIOS[state.avg.scenario].slice();
        renderAvgInputFromData();
        document.querySelectorAll('[data-avgscenario]').forEach((b) => b.classList.toggle('active', b === btn));
      });
    });
    $('avgDataInput')?.addEventListener('change', (e) => {
      const parsed = parseAvgInput(e.target.value);
      if (parsed.length) { state.avg.data = parsed; state.avg.scenario = 'custom'; }
    });
    $('avgRandomBtn')?.addEventListener('click', () => {
      state.avg.data = Array.from({ length: 5 + Math.floor(rand() * 4) }, () => Math.round(5 + rand() * 45));
      state.avg.scenario = 'custom';
      renderAvgInputFromData();
    });

    // 8.3
    document.querySelectorAll('[data-normscenario]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.normal.scenario = btn.dataset.normscenario;
        const sc = NORMAL_SCENARIOS[state.normal.scenario];
        state.normal.mu = sc.mu; state.normal.sigma = sc.sigma;
        if ($('normalMuSlider')) $('normalMuSlider').value = sc.mu;
        if ($('normalSigmaSlider')) $('normalSigmaSlider').value = sc.sigma;
        renderNormalScenarioButtons();
      });
    });
    renderNormalScenarioButtons();
    $('normalMuSlider')?.addEventListener('input', (e) => { state.normal.mu = +e.target.value; });
    $('normalSigmaSlider')?.addEventListener('input', (e) => { state.normal.sigma = Math.max(0.5, +e.target.value); });
    $('normalValueInput')?.addEventListener('change', (e) => { state.normal.value = e.target.value === '' ? null : +e.target.value; });

    // 8.4
    const corrBox = $('corrPresetBox');
    if (corrBox) {
      corrBox.innerHTML = CORR_PRESETS.map((r) => `<button class="lab-tool-btn" data-corrr="${r}">${formatNum(r, 1)}</button>`).join('');
      corrBox.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-corrr]');
        if (!btn) return;
        state.corr.r = +btn.dataset.corrr;
        renderCorrButtons();
      });
    }
    renderCorrButtons();
    $('corrGotoM5Btn')?.addEventListener('click', () => {
      window.AffeStats?.switchModule('mod5');
    });

    document.querySelectorAll('#mod8 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => { switchSubtab(btn.dataset.sub); window.AffeStats?.onSubtabChanged(); });
    });
    switchSubtab('8_1');
  }

  window.Mod8Basics = {
    init, switchSubtab, applyPreset,
    getActiveSub: () => `stats8_${state.activeSub.split('_')[1]}`,
    setRunning: (r) => { running = r; }
  };
})();
