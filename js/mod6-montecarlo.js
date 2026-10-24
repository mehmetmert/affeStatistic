/* ============================================================================
   affeStats — MODÜL 6: Monte Carlo Simülasyonları ve Stokastik Süreçler
   6.1 Monte Carlo π Tahmini   6.2 Markov Zincirleri   6.3 Rastgele Yürüyüş
   ============================================================================ */
(function () {
  'use strict';

  const { mulberry32, makeGaussian, fitCanvas, formatNum, clamp } = window.StatsCore;
  const $ = (id) => document.getElementById(id);
  const rand = mulberry32(111);
  const gauss = makeGaussian(rand);

  const state = {
    activeSub: '6_1',
    pi: { inside: 0, total: 0, dots: [], targetRate: 400 },
    markov: {
      names: ['A', 'B', 'C'],
      P: [[0.6, 0.3, 0.1], [0.2, 0.6, 0.2], [0.1, 0.3, 0.6]],
      particles: [],
      counts: [0, 0, 0]
    },
    walk: { walkers: 120, paths: [], t: 0, maxT: 400 }
  };

  /* ------------------------------------------------------------------------
     6.1 MONTE CARLO π
     ------------------------------------------------------------------------ */
  function piSpawnAccum() { return state.pi._accum || 0; }
  function piStep(dt) {
    const s = state.pi;
    s._accum = (s._accum || 0) + dt * s.targetRate;
    while (s._accum >= 1) {
      s._accum -= 1;
      const x = rand(), y = rand();
      const inside = x * x + y * y <= 1;
      if (inside) s.inside++;
      s.total++;
      if (s.dots.length < 2500) s.dots.push({ x, y, inside });
    }
  }
  function drawPi() {
    const info = fitCanvas($('statsStageCanvas_6'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const side = Math.min(w, h) - 40;
    const x0 = (w - side) / 2, y0 = (h - side) / 2;
    ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x0, y0, side, side);
    ctx.beginPath(); ctx.arc(x0, y0 + side, side, -Math.PI / 2, 0); ctx.strokeStyle = 'rgba(0,242,254,0.5)'; ctx.stroke();

    state.pi.dots.forEach((d) => {
      ctx.fillStyle = d.inside ? 'rgba(0,242,254,0.75)' : 'rgba(148,163,184,0.5)';
      ctx.beginPath(); ctx.arc(x0 + d.x * side, y0 + (1 - d.y) * side, 1.6, 0, Math.PI * 2); ctx.fill();
    });

    const est = state.pi.total ? (4 * state.pi.inside) / state.pi.total : 0;
    ctx.fillStyle = '#e2e8f0'; ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.fillText(`π ≈ ${est.toFixed(5)}`, x0, y0 - 14);
    if ($('piEstVal')) $('piEstVal').textContent = formatNum(est, 5);
    if ($('piErrVal')) $('piErrVal').textContent = formatNum(Math.abs(est - Math.PI), 5);
    if ($('piNVal')) $('piNVal').textContent = state.pi.total;
  }

  /* ------------------------------------------------------------------------
     6.2 MARKOV ZİNCİRLERİ
     ------------------------------------------------------------------------ */
  function normalizeRow(row) {
    const s = row.reduce((a, b) => a + b, 0) || 1;
    return row.map((v) => v / s);
  }
  function stationaryDist(P) {
    let v = [1 / 3, 1 / 3, 1 / 3];
    for (let iter = 0; iter < 400; iter++) {
      const next = [0, 0, 0];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) next[j] += v[i] * P[i][j];
      v = next;
    }
    return v;
  }
  function spawnMarkovParticle() {
    state.markov.particles.push({ state: Math.floor(rand() * 3), t: 0 });
  }
  function stepMarkov(dt) {
    const m = state.markov;
    m._accum = (m._accum || 0) + dt * 6;
    while (m._accum >= 1 && m.particles.length < 60) { m._accum -= 1; spawnMarkovParticle(); }
    m.particles.forEach((p) => {
      p.t += dt * 0.9;
      if (p.t >= 1) {
        p.t = 0;
        const row = normalizeRow(m.P[p.state]);
        let u = rand(), acc = 0, next = 2;
        for (let j = 0; j < 3; j++) { acc += row[j]; if (u <= acc) { next = j; break; } }
        p.state = next;
        m.counts[next]++;
      }
    });
  }
  const NODE_POS = [[0.5, 0.18], [0.18, 0.78], [0.82, 0.78]];
  function drawMarkov() {
    const info = fitCanvas($('statsStageCanvas_6'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const m = state.markov;
    const pos = NODE_POS.map(([fx, fy]) => [40 + fx * (w - 80), 40 + fy * (h - 90)]);

    // kenarlar
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === j) continue;
        const p = normalizeRow(m.P[i])[j];
        if (p < 0.02) continue;
        ctx.strokeStyle = `rgba(0,242,254,${0.15 + p * 0.6})`;
        ctx.lineWidth = 1 + p * 4;
        ctx.beginPath(); ctx.moveTo(pos[i][0], pos[i][1]); ctx.lineTo(pos[j][0], pos[j][1]); ctx.stroke();
        const mx = (pos[i][0] + pos[j][0]) / 2, my = (pos[i][1] + pos[j][1]) / 2;
        ctx.fillStyle = '#94a3b8'; ctx.font = '600 10px monospace';
        ctx.fillText(formatNum(p, 2), mx, my);
      }
    }
    // düğümler
    pos.forEach(([x, y], i) => {
      ctx.fillStyle = ['#00f2fe', '#a855f7', '#f59e0b'][i];
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#07090e'; ctx.font = '800 14px monospace'; ctx.textAlign = 'center';
      ctx.fillText(m.names[i], x, y + 5);
      ctx.textAlign = 'left';
    });
    // parçacıklar
    m.particles.forEach((p) => {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const jitter = ((p.t || 0) * 6) % 1;
      const ang = jitter * Math.PI * 2;
      ctx.beginPath(); ctx.arc(pos[p.state][0] + Math.cos(ang) * 30, pos[p.state][1] + Math.sin(ang) * 30, 2.4, 0, Math.PI * 2); ctx.fill();
    });

    const stat = stationaryDist(m.P.map(normalizeRow));
    if ($('markovStationaryVal')) $('markovStationaryVal').textContent = `π = [${stat.map((v) => formatNum(v, 3)).join(', ')}]`;
  }

  function renderMarkovMatrixUI() {
    const box = $('markovMatrixBox');
    if (!box) return;
    box.innerHTML = state.markov.P.map((row, i) => `
      <div style="display:flex;gap:4px;align-items:center;margin-bottom:3px;">
        <span style="width:16px;font-family:var(--mono);font-size:11px;color:var(--muted);">${state.markov.names[i]}</span>
        ${row.map((v, j) => `<input type="number" step="0.05" min="0" max="1" class="bio-input" style="width:56px;" data-r="${i}" data-c="${j}" value="${formatNum(v, 2)}" />`).join('')}
      </div>
    `).join('');
    box.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        state.markov.P[+e.target.dataset.r][+e.target.dataset.c] = +e.target.value || 0;
      });
    });
  }

  /* ------------------------------------------------------------------------
     6.3 RASTGELE YÜRÜYÜŞ
     ------------------------------------------------------------------------ */
  function seedWalk() {
    state.walk.paths = [];
    for (let i = 0; i < state.walk.walkers; i++) state.walk.paths.push({ y: 0, history: [0] });
    state.walk.t = 0;
  }
  seedWalk();
  function stepWalk(dt) {
    const w = state.walk;
    w._accum = (w._accum || 0) + dt * 12;
    while (w._accum >= 1 && w.t < w.maxT) {
      w._accum -= 1;
      w.t++;
      w.paths.forEach((p) => {
        p.y += rand() < 0.5 ? -1 : 1;
        p.history.push(p.y);
        if (p.history.length > w.maxT + 1) p.history.shift();
      });
    }
  }
  function drawWalk() {
    const info = fitCanvas($('statsStageCanvas_6'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const padX = 40, padTop = 16, padBot = 24;
    const plotW = w - padX * 2, plotH = h - padTop - padBot;
    const t = state.walk.t || 1;
    const envelope = Math.sqrt(t) * 2.2;
    const yMax = Math.max(envelope, 10);
    const xScale = (tt) => padX + (tt / state.walk.maxT) * plotW;
    const yScale = (yy) => padTop + plotH / 2 - (yy / yMax) * (plotH / 2);

    ctx.strokeStyle = 'rgba(16,185,129,0.4)'; ctx.setLineDash([4, 3]);
    ctx.beginPath();
    for (let tt = 1; tt <= state.walk.maxT; tt++) { const e = Math.sqrt(tt) * 2.2; const px = xScale(tt), py = yScale(e); if (tt === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
    ctx.beginPath();
    for (let tt = 1; tt <= state.walk.maxT; tt++) { const e = -Math.sqrt(tt) * 2.2; const px = xScale(tt), py = yScale(e); if (tt === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.beginPath(); ctx.moveTo(padX, yScale(0)); ctx.lineTo(padX + plotW, yScale(0)); ctx.stroke();

    state.walk.paths.forEach((p, i) => {
      ctx.strokeStyle = `hsla(${(i * 47) % 360}, 80%, 65%, 0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      p.history.forEach((yy, tt) => { const px = xScale(tt), py = yScale(yy); if (tt === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.stroke();
    });

    if ($('walkTVal')) $('walkTVal').textContent = state.walk.t;
    if ($('walkEnvVal')) $('walkEnvVal').textContent = `±${formatNum(envelope, 2)}`;
  }

  /* ------------------------------------------------------------------------
     ANA DÖNGÜ & UI
     ------------------------------------------------------------------------ */
  let running = true;
  function loop(now) {
    requestAnimationFrame(loop);
    const el = $('mod6');
    if (!running || !el || !el.classList.contains('active')) return;
    const dt = 0.016;
    if (state.activeSub === '6_1') { piStep(dt); drawPi(); }
    else if (state.activeSub === '6_2') { stepMarkov(dt); drawMarkov(); }
    else if (state.activeSub === '6_3') { stepWalk(dt); drawWalk(); }
  }
  requestAnimationFrame(loop);

  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod6 .subtab-btn').forEach((b) => b.classList.toggle('active', b.dataset.sub === subId));
    ['6_1', '6_2', '6_3'].forEach((id) => {
      const pane = $(`mod6_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.points != null) { /* hedef örnek sayısı bilgi amaçlı, otomatik hızda devam eder */ }
    if (preset.walkers != null) { state.walk.walkers = preset.walkers; seedWalk(); }
  }

  function init() {
    $('piResetBtn')?.addEventListener('click', () => { state.pi.inside = 0; state.pi.total = 0; state.pi.dots = []; });
    renderMarkovMatrixUI();
    $('markovResetBtn')?.addEventListener('click', () => { state.markov.particles = []; state.markov.counts = [0, 0, 0]; });
    $('walkWalkersSlider')?.addEventListener('input', (e) => { state.walk.walkers = +e.target.value; seedWalk(); if ($('walkWalkersVal')) $('walkWalkersVal').textContent = e.target.value; });
    $('walkResetBtn')?.addEventListener('click', seedWalk);

    document.querySelectorAll('#mod6 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => { switchSubtab(btn.dataset.sub); window.AffeStats?.onSubtabChanged(); });
    });
    switchSubtab('6_1');
  }

  window.Mod6MonteCarlo = {
    init, switchSubtab, applyPreset,
    getActiveSub: () => `stats6_${state.activeSub.split('_')[1]}`,
    setRunning: (r) => { running = r; }
  };
})();
