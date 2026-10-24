/* ============================================================================
   affeStats — MODÜL 4: Sezgisel Bayes Teoremi ve Koşullu Olasılık
   4.1 Tıbbi Test Paradoksu (1000 kişilik matris)
   4.2 Sürekli Bayesçi Güncelleme (Beta Prior → Posterior)
   4.3 Monty Hall (3 Kapı) Paradoksu
   ============================================================================ */
(function () {
  'use strict';

  const { dist, mulberry32, fitCanvas, formatNum, makeScale } = window.StatsCore;
  const $ = (id) => document.getElementById(id);
  const rand = mulberry32(555);

  const state = {
    activeSub: '4_1',
    med: { prevalence: 0.01, sensitivity: 0.99, specificity: 0.95 },
    bayes: { a0: 1, b0: 1, successes: 0, failures: 0, trueP: 0.5 },
    monty: { doorCar: 0, picked: null, revealed: null, phase: 'pick', stayWins: 0, stayTotal: 0, switchWins: 0, switchTotal: 0 }
  };

  /* ------------------------------------------------------------------------
     4.1 TIBBİ TEST PARADOKSU
     ------------------------------------------------------------------------ */
  function medCounts() {
    const N = 1000;
    const { prevalence, sensitivity, specificity } = state.med;
    const diseased = Math.round(N * prevalence);
    const healthy = N - diseased;
    const tp = Math.round(diseased * sensitivity);
    const fn = diseased - tp;
    const tn = Math.round(healthy * specificity);
    const fp = healthy - tn;
    const pAgivenB = tp / Math.max(1, tp + fp);
    return { N, diseased, healthy, tp, fn, tn, fp, pAgivenB };
  }

  function drawMed() {
    const info = fitCanvas($('statsStageCanvas_4'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const c = medCounts();
    const cols = 40, rows = 25;
    const cellW = (w - 40) / cols, cellH = (h - 80) / rows;
    const order = [];
    for (let i = 0; i < c.tp; i++) order.push('#10b981');
    for (let i = 0; i < c.fn; i++) order.push('#f59e0b');
    for (let i = 0; i < c.fp; i++) order.push('#f43f5e');
    for (let i = 0; i < c.tn; i++) order.push('#334155');
    order.forEach((color, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = 20 + col * cellW, y = 56 + row * cellH;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x + cellW / 2, y + cellH / 2, Math.min(cellW, cellH) * 0.36, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = '#e2e8f0'; ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText(`1000 Kişi: ${c.diseased} Hasta, ${c.healthy} Sağlıklı`, 20, 24);
    ctx.font = '600 11px monospace';
    ctx.fillStyle = '#10b981'; ctx.fillText(`● Doğru Pozitif: ${c.tp}`, 20, 42);
    ctx.fillStyle = '#f59e0b'; ctx.fillText(`● Yanlış Negatif: ${c.fn}`, 230, 42);
    ctx.fillStyle = '#f43f5e'; ctx.fillText(`● Yanlış Pozitif: ${c.fp}`, 430, 42);
    ctx.fillStyle = '#334155'; ctx.fillStyle = '#94a3b8'; ctx.fillText(`● Doğru Negatif: ${c.tn}`, 650, 42);

    if ($('medResultVal')) $('medResultVal').textContent = `P(Hasta | Pozitif) = ${formatNum(c.pAgivenB * 100, 1)}%`;
    if ($('medTpFpVal')) $('medTpFpVal').textContent = `${c.tp} / (${c.tp} + ${c.fp})`;
  }

  /* ------------------------------------------------------------------------
     4.2 SÜREKLİ BAYESÇİ GÜNCELLEME
     ------------------------------------------------------------------------ */
  function drawBayesUpdate() {
    const info = fitCanvas($('statsStageCanvas_4'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const b = state.bayes;
    const a1 = b.a0 + b.successes, b1 = b.b0 + b.failures;
    const padX = 40, padTop = 20, padBot = 28;
    const plotW = w - padX * 2, plotH = h - padTop - padBot;
    const xScale = makeScale([0, 1], [padX, padX + plotW]);
    let maxY = 0;
    for (let i = 1; i < 200; i++) {
      maxY = Math.max(maxY, dist.beta.pdf(i / 200, b.a0, b.b0), dist.beta.pdf(i / 200, a1, b1));
    }
    const yScale = makeScale([0, maxY * 1.1 || 1], [padTop + plotH, padTop]);

    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.beginPath(); ctx.moveTo(padX, padTop); ctx.lineTo(padX, padTop + plotH); ctx.lineTo(padX + plotW, padTop + plotH); ctx.stroke();

    drawLine(ctx, xScale, yScale, (x) => dist.beta.pdf(clampEps(x), b.a0, b.b0), '#64748b');
    drawLine(ctx, xScale, yScale, (x) => dist.beta.pdf(clampEps(x), a1, b1), '#00f2fe');

    ctx.strokeStyle = 'rgba(244,63,94,0.6)'; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(xScale.toPx(b.trueP), padTop); ctx.lineTo(xScale.toPx(b.trueP), padTop + plotH); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64748b'; ctx.font = '700 11px monospace';
    ctx.fillText(`Önsel: Beta(${b.a0}, ${b.b0})`, padX, padTop - 6);
    ctx.fillStyle = '#00f2fe';
    ctx.fillText(`Sonsal: Beta(${a1}, ${b1})  [${b.successes} başarı / ${b.failures} başarısızlık]`, padX + 200, padTop - 6);

    const mean = a1 / (a1 + b1);
    if ($('bayesPostMeanVal')) $('bayesPostMeanVal').textContent = formatNum(mean, 4);
  }
  function clampEps(x) { return Math.min(0.999, Math.max(0.001, x)); }
  function drawLine(ctx, xScale, yScale, fn, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2.3;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = i / 200, px = xScale.toPx(x), py = yScale.toPx(fn(x));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  /* ------------------------------------------------------------------------
     4.3 MONTY HALL
     ------------------------------------------------------------------------ */
  function newMontyRound() {
    state.monty.doorCar = Math.floor(rand() * 3);
    state.monty.picked = null;
    state.monty.revealed = null;
    state.monty.phase = 'pick';
  }
  function montyPick(door) {
    const m = state.monty;
    if (m.phase !== 'pick') return;
    m.picked = door;
    const options = [0, 1, 2].filter((d) => d !== door && d !== m.doorCar);
    m.revealed = options[Math.floor(rand() * options.length)];
    m.phase = 'choose';
  }
  function montyFinish(strategy) {
    const m = state.monty;
    if (m.phase !== 'choose') return;
    let finalDoor = m.picked;
    if (strategy === 'switch') finalDoor = [0, 1, 2].find((d) => d !== m.picked && d !== m.revealed);
    const win = finalDoor === m.doorCar;
    if (strategy === 'stay') { m.stayTotal++; if (win) m.stayWins++; }
    else { m.switchTotal++; if (win) m.switchWins++; }
    m.phase = 'done';
    m.win = win;
    m.finalDoor = finalDoor;
    renderMontyUI();
  }
  function montyAutoplay(rounds) {
    for (let i = 0; i < rounds; i++) {
      const car = Math.floor(rand() * 3);
      const pick = Math.floor(rand() * 3);
      const openOptions = [0, 1, 2].filter((d) => d !== pick && d !== car);
      const revealed = openOptions[Math.floor(rand() * openOptions.length)];
      const switchDoor = [0, 1, 2].find((d) => d !== pick && d !== revealed);
      state.monty.stayTotal++; if (pick === car) state.monty.stayWins++;
      state.monty.switchTotal++; if (switchDoor === car) state.monty.switchWins++;
    }
    renderMontyUI();
  }

  function renderMontyUI() {
    const m = state.monty;
    const box = $('montyDoors');
    if (box) {
      box.innerHTML = [0, 1, 2].map((d) => {
        let label = '🚪';
        let cls = 'lab-tool-btn';
        if (m.phase === 'done' || m.revealed === d) {
          if (d === m.revealed) { label = '🐐'; }
          else if (m.phase === 'done' && d === m.doorCar) { label = '🚗'; }
          else if (m.phase === 'done') { label = '🐐'; }
        }
        if (d === m.picked) cls += ' active';
        return `<button class="${cls}" data-door="${d}" style="font-size:22px;padding:14px 22px;" ${m.phase === 'done' ? 'disabled' : ''}>${label}</button>`;
      }).join('');
    }
    if ($('montyStayRate')) $('montyStayRate').textContent = m.stayTotal ? `%${formatNum((m.stayWins / m.stayTotal) * 100, 1)} (${m.stayWins}/${m.stayTotal})` : '—';
    if ($('montySwitchRate')) $('montySwitchRate').textContent = m.switchTotal ? `%${formatNum((m.switchWins / m.switchTotal) * 100, 1)} (${m.switchWins}/${m.switchTotal})` : '—';
    if ($('montyStatus')) {
      if (m.phase === 'pick') $('montyStatus').textContent = 'Bir kapı seçin.';
      else if (m.phase === 'choose') $('montyStatus').textContent = `Kapı ${m.revealed + 1} açıldı (keçi). Kalmak mı, değiştirmek mi?`;
      else $('montyStatus').textContent = m.win ? '🎉 Kazandınız!' : '😢 Kaybettiniz.';
    }
  }

  /* ------------------------------------------------------------------------
     ANA DÖNGÜ & UI
     ------------------------------------------------------------------------ */
  let running = true;
  function loop() {
    requestAnimationFrame(loop);
    const el = $('mod4');
    if (!running || !el || !el.classList.contains('active')) return;
    if (state.activeSub === '4_1') drawMed();
    else if (state.activeSub === '4_2') drawBayesUpdate();
    else {
      // 4.3 (Monty Hall) kanvas yerine HTML kapı arayüzünü kullanır — önceki
      // alt sekmeden kalan çizimin "donmuş" görünmesini önlemek için temizle.
      const info = fitCanvas($('statsStageCanvas_4'));
      if (info) info.ctx.clearRect(0, 0, info.w, info.h);
    }
  }
  requestAnimationFrame(loop);

  function renderMedControls() {
    if ($('medPrevVal')) $('medPrevVal').textContent = `%${formatNum(state.med.prevalence * 100, 2)}`;
    if ($('medSensVal')) $('medSensVal').textContent = `%${formatNum(state.med.sensitivity * 100, 1)}`;
    if ($('medSpecVal')) $('medSpecVal').textContent = `%${formatNum(state.med.specificity * 100, 1)}`;
  }

  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod4 .subtab-btn').forEach((b) => b.classList.toggle('active', b.dataset.sub === subId));
    ['4_1', '4_2', '4_3'].forEach((id) => {
      const pane = $(`mod4_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
    if (subId === '4_3') renderMontyUI();
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.prevalence != null) { state.med.prevalence = preset.prevalence; if ($('medPrevSlider')) $('medPrevSlider').value = preset.prevalence; renderMedControls(); }
    if (preset.autoplay) montyAutoplay(preset.autoplay);
  }

  function init() {
    renderMedControls();
    $('medPrevSlider')?.addEventListener('input', (e) => { state.med.prevalence = +e.target.value; renderMedControls(); });
    $('medSensSlider')?.addEventListener('input', (e) => { state.med.sensitivity = +e.target.value; renderMedControls(); });
    $('medSpecSlider')?.addEventListener('input', (e) => { state.med.specificity = +e.target.value; renderMedControls(); });

    document.querySelectorAll('[data-prior]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [a0, b0] = btn.dataset.prior.split(',').map(Number);
        state.bayes.a0 = a0; state.bayes.b0 = b0; state.bayes.successes = 0; state.bayes.failures = 0;
        document.querySelectorAll('[data-prior]').forEach((b) => b.classList.toggle('active', b === btn));
      });
    });
    $('bayesSuccessBtn')?.addEventListener('click', () => { state.bayes.successes++; });
    $('bayesFailBtn')?.addEventListener('click', () => { state.bayes.failures++; });
    $('bayesReset20Btn')?.addEventListener('click', () => {
      for (let i = 0; i < 20; i++) { if (rand() < state.bayes.trueP) state.bayes.successes++; else state.bayes.failures++; }
    });
    $('bayesResetBtn')?.addEventListener('click', () => { state.bayes.successes = 0; state.bayes.failures = 0; });

    newMontyRound();
    $('montyDoors')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-door]');
      if (!btn) return;
      montyPick(+btn.dataset.door);
      renderMontyUI();
    });
    $('montyStayBtn')?.addEventListener('click', () => montyFinish('stay'));
    $('montySwitchBtn')?.addEventListener('click', () => montyFinish('switch'));
    $('montyNewRoundBtn')?.addEventListener('click', () => { newMontyRound(); renderMontyUI(); });
    $('montyAuto10kBtn')?.addEventListener('click', () => montyAutoplay(10000));

    document.querySelectorAll('#mod4 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => { switchSubtab(btn.dataset.sub); window.AffeStats?.onSubtabChanged(); });
    });
    switchSubtab('4_1');
  }

  window.Mod4Bayes = {
    init, switchSubtab, applyPreset,
    getActiveSub: () => `stats4_${state.activeSub.split('_')[1]}`,
    setRunning: (r) => { running = r; }
  };
})();
