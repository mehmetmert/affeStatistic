/* ============================================================================
   affeStats — MODÜL 2: İnteraktif Olasılık Dağılımları Atlası
   Sürüklenebilir [a,b] sınırlarıyla canlı P(a≤X≤b) alan hesaplayıcı;
   PDF/PMF ve CDF grafikleri eşzamanlı güncellenir (klasik Z/t tablosu YOK).
   ============================================================================ */
(function () {
  'use strict';

  const { dist, fitCanvas, formatNum, makeScale, clamp } = window.StatsCore;
  const $ = (id) => document.getElementById(id);

  const DISTS = {
    normal: { name: 'Normal (Gauss)', kind: 'c', params: [['mean', 'μ (Ortalama)', -5, 5, 0.1, 0], ['std', 'σ (Std. Sapma)', 0.2, 4, 0.1, 1]], domain: (p) => [p.mean - 4.2 * p.std, p.mean + 4.2 * p.std], pdf: (x, p) => dist.normal.pdf(x, p.mean, p.std), cdf: (x, p) => dist.normal.cdf(x, p.mean, p.std) },
    t: { name: "Student's t", kind: 'c', params: [['dof', 'ν (Serbestlik Derecesi)', 1, 60, 1, 5]], domain: (p) => [-5, 5], pdf: (x, p) => dist.t.pdf(x, p.dof), cdf: (x, p) => dist.t.cdf(x, p.dof) },
    chisq: { name: 'Ki-Kare (χ²)', kind: 'c', params: [['dof', 'k (Serbestlik Derecesi)', 1, 30, 1, 4]], domain: (p) => [0, Math.max(10, p.dof * 3.2)], pdf: (x, p) => dist.chisq.pdf(x, p.dof), cdf: (x, p) => dist.chisq.cdf(x, p.dof) },
    f: { name: 'F-Dağılımı', kind: 'c', params: [['d1', 'd1 (Pay s.d.)', 1, 30, 1, 5], ['d2', 'd2 (Payda s.d.)', 1, 30, 1, 10]], domain: () => [0, 5], pdf: (x, p) => dist.f.pdf(x, p.d1, p.d2), cdf: (x, p) => dist.f.cdf(x, p.d1, p.d2) },
    exponential: { name: 'Üstel (Exponential)', kind: 'c', params: [['rate', 'λ (Oran)', 0.1, 3, 0.1, 1]], domain: (p) => [0, 6 / p.rate], pdf: (x, p) => dist.exponential.pdf(x, p.rate), cdf: (x, p) => dist.exponential.cdf(x, p.rate) },
    beta: { name: 'Beta', kind: 'c', params: [['alpha', 'α', 0.3, 10, 0.1, 2], ['beta', 'β', 0.3, 10, 0.1, 2]], domain: () => [0, 1], pdf: (x, p) => dist.beta.pdf(x, p.alpha, p.beta), cdf: (x, p) => dist.beta.cdf(x, p.alpha, p.beta) },
    binomial: { name: 'Binom', kind: 'd', params: [['n', 'n (Deneme)', 1, 60, 1, 20], ['p', 'p (Başarı)', 0.02, 0.98, 0.02, 0.5]], domain: (p) => [0, p.n], pdf: (k, p) => dist.binomial.pdf(k, p.n, p.p), cdf: (k, p) => dist.binomial.cdf(Math.floor(k), p.n, p.p) },
    poisson: { name: 'Poisson', kind: 'd', params: [['lambda', 'λ (Ortalama Oran)', 0.2, 25, 0.2, 4]], domain: (p) => [0, Math.max(10, p.lambda * 3.2)], pdf: (k, p) => dist.poisson.pdf(k, p.lambda), cdf: (k, p) => dist.poisson.cdf(Math.floor(k), p.lambda) },
    geometric: { name: 'Geometrik', kind: 'd', params: [['p', 'p (Başarı)', 0.02, 0.9, 0.02, 0.3]], domain: (p) => [1, Math.max(10, 4 / p.p)], pdf: (k, p) => dist.geometric.pdf(k, p.p), cdf: (k, p) => dist.geometric.cdf(k, p.p) }
  };

  const state = {
    activeSub: '2_1',
    key: 'normal',
    params: {},
    a: null, b: null,
    dragging: null,
    table: { kind: 'z', lookup: null }
  };

  function currentDist() { return DISTS[state.key]; }

  function ensureParams() {
    const d = currentDist();
    const p = {};
    d.params.forEach(([key, , , , , def]) => { p[key] = state.params[state.key] && state.params[state.key][key] != null ? state.params[state.key][key] : def; });
    state.params[state.key] = p;
    return p;
  }

  function resetBounds() {
    const d = currentDist(), p = ensureParams();
    const [lo, hi] = d.domain(p);
    state.a = lo + (hi - lo) * 0.3;
    state.b = lo + (hi - lo) * 0.7;
  }

  function renderParamControls() {
    const d = currentDist();
    const p = ensureParams();
    const box = $('distParamControls');
    if (!box) return;
    box.innerHTML = d.params.map(([key, label, min, max, step]) => `
      <div class="ctrl-row">
        <div class="ctrl-label"><span>${label}</span><b id="distVal_${key}">${formatNum(p[key], 2)}</b></div>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${p[key]}" data-pk="${key}" />
      </div>
    `).join('');
    box.querySelectorAll('input[type=range]').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const key = e.target.dataset.pk;
        state.params[state.key][key] = +e.target.value;
        $('distVal_' + key).textContent = formatNum(+e.target.value, 2);
        clampBounds();
      });
    });
  }

  function clampBounds() {
    const d = currentDist(), p = ensureParams();
    const [lo, hi] = d.domain(p);
    state.a = clamp(state.a, lo, hi);
    state.b = clamp(state.b, lo, hi);
    if (state.a > state.b) { const t = state.a; state.a = state.b; state.b = t; }
  }

  function renderDistList() {
    const box = $('distList');
    if (!box) return;
    box.innerHTML = Object.keys(DISTS).map((key) => `
      <button class="lab-card${state.key === key ? ' active' : ''}" data-dist="${key}">
        <b>${DISTS[key].name}</b><small>${DISTS[key].kind === 'c' ? 'Sürekli' : 'Kesikli'}</small>
      </button>
    `).join('');
    box.querySelectorAll('[data-dist]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.key = btn.dataset.dist;
        ensureParams();
        resetBounds();
        renderDistList();
        renderParamControls();
      });
    });
  }

  /* ------------------------------------------------------------------------
     ÇİZİM: Üstte PDF/PMF (sürüklenebilir a,b), altta CDF
     ------------------------------------------------------------------------ */
  let handlesPx = { a: 0, b: 0 };

  function draw() {
    const info = fitCanvas($('statsStageCanvas_2'));
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);
    const d = currentDist(), p = ensureParams();
    const [lo, hi] = d.domain(p);
    const padX = 46, padTop = 20, gap = 30;
    const topH = h * 0.52, botH = h * 0.3;
    const plotW = w - padX * 2;
    const xScale = makeScale([lo, hi], [padX, padX + plotW]);

    // ---- PDF / PMF ----
    let maxY = 1e-9;
    const N = 240;
    for (let i = 0; i <= N; i++) { const x = lo + ((hi - lo) * i) / N; maxY = Math.max(maxY, d.pdf(x, p)); }
    const yScaleTop = makeScale([0, maxY * 1.12], [padTop + topH, padTop]);

    ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, padTop); ctx.lineTo(padX, padTop + topH); ctx.lineTo(padX + plotW, padTop + topH); ctx.stroke();

    // alan boyama [a,b]
    ctx.fillStyle = 'rgba(0,242,254,0.28)';
    if (d.kind === 'c') {
      ctx.beginPath();
      ctx.moveTo(xScale.toPx(state.a), padTop + topH);
      for (let i = 0; i <= 100; i++) {
        const x = state.a + ((state.b - state.a) * i) / 100;
        ctx.lineTo(xScale.toPx(x), yScaleTop.toPx(d.pdf(x, p)));
      }
      ctx.lineTo(xScale.toPx(state.b), padTop + topH);
      ctx.closePath(); ctx.fill();
    } else {
      for (let k = Math.ceil(state.a); k <= Math.floor(state.b); k++) {
        const barW = plotW / (hi - lo + 1);
        const x = xScale.toPx(k) - barW / 2;
        const y = yScaleTop.toPx(d.pdf(k, p));
        ctx.fillRect(x, y, barW, padTop + topH - y);
      }
    }

    if (d.kind === 'c') {
      ctx.strokeStyle = '#00f2fe'; ctx.lineWidth = 2.3;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const x = lo + ((hi - lo) * i) / N;
        const px = xScale.toPx(x), py = yScaleTop.toPx(d.pdf(x, p));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(0,242,254,0.85)';
      for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) {
        const barW = plotW / (hi - lo + 1);
        const x = xScale.toPx(k) - barW / 2;
        const y = yScaleTop.toPx(d.pdf(k, p));
        if (k < state.a || k > state.b) ctx.fillRect(x, y, barW, padTop + topH - y);
      }
    }

    // sürükleme tutamaçları
    handlesPx.a = xScale.toPx(state.a);
    handlesPx.b = xScale.toPx(state.b);
    [handlesPx.a, handlesPx.b].forEach((hx) => {
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx, padTop); ctx.lineTo(hx, padTop + topH); ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(hx, padTop + 8, 6, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = '#e2e8f0'; ctx.font = '700 12px "JetBrains Mono", monospace';
    const areaLabel = d.kind === 'c' ? 'f(x)' : 'P(X=k)';
    ctx.fillText(`${areaLabel} — ${d.name}`, padX, padTop - 6);

    // ---- CDF ----
    const botY = padTop + topH + gap;
    ctx.fillStyle = '#94a3b8'; ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('F(x) — Kümülatif Dağılım Fonksiyonu (CDF)', padX, botY - 6);
    const yScaleBot = makeScale([0, 1], [botY + botH, botY]);
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.beginPath(); ctx.moveTo(padX, botY); ctx.lineTo(padX, botY + botH); ctx.lineTo(padX + plotW, botY + botH); ctx.stroke();
    ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const x = lo + ((hi - lo) * i) / N;
      const px = xScale.toPx(x), py = yScaleBot.toPx(d.cdf(x, p));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    [state.a, state.b].forEach((xv) => {
      ctx.strokeStyle = 'rgba(251,191,36,0.6)'; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(xScale.toPx(xv), botY); ctx.lineTo(xScale.toPx(xv), botY + botH); ctx.stroke();
      ctx.setLineDash([]);
    });

    // Sonuç paneli
    const areaProb = d.kind === 'c' ? (d.cdf(state.b, p) - d.cdf(state.a, p)) : (d.cdf(state.b, p) - d.cdf(Math.ceil(state.a) - 1, p));
    if ($('distAreaResult')) $('distAreaResult').textContent = `P(${formatNum(state.a, 2)} ≤ X ≤ ${formatNum(state.b, 2)}) = ${formatNum(Math.max(0, areaProb), 4)}`;
    if ($('distMeanVal')) $('distMeanVal').textContent = formatNum(distMean(d, p), 3);
  }

  function distMean(d, p) {
    // Nümerik beklenen değer (genel amaçlı, her dağılım için)
    const [lo, hi] = d.domain(p);
    let s = 0, wsum = 0;
    const N = 400;
    for (let i = 0; i <= N; i++) {
      const x = lo + ((hi - lo) * i) / N;
      const w = d.pdf(x, p);
      s += x * w; wsum += w;
    }
    return wsum > 0 ? s / wsum : NaN;
  }

  function initDrag() {
    const canvas = $('statsStageCanvas_2');
    if (!canvas) return;
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      state.dragging = Math.abs(px - handlesPx.a) < Math.abs(px - handlesPx.b) ? 'a' : 'b';
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!state.dragging) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const d = currentDist(), p = ensureParams();
      const [lo, hi] = d.domain(p);
      const padX = 46, plotW = rect.width - padX * 2;
      let val = lo + clamp((px - padX) / plotW, 0, 1) * (hi - lo);
      if (d.kind === 'd') val = Math.round(val);
      state[state.dragging] = val;
      clampBounds();
    });
    ['pointerup', 'pointercancel'].forEach((ev) => canvas.addEventListener(ev, () => { state.dragging = null; }));
  }

  /* ==========================================================================
     2.2 KLASİK İSTATİSTİK TABLOLARI (Z / t / χ²) — ders kitabı formatında,
     gerçek jStat değerleriyle hesaplanır (yaklaşık/basılı tablo kopyası DEĞİL).
     ========================================================================== */
  const T_DF_ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 40, 50, 60, 80, 100, 120];
  const T_ALPHA_COLS = [0.10, 0.05, 0.025, 0.01, 0.005, 0.001];
  const CHI_DF_ROWS = Array.from({ length: 30 }, (_, i) => i + 1);
  const CHI_ALPHA_COLS = [0.995, 0.99, 0.975, 0.95, 0.90, 0.10, 0.05, 0.025, 0.01, 0.005];

  function renderZTable() {
    const box = $('statsTableBox_2');
    if (!box) return;
    const lookup = state.table.lookup;
    let rowsHtml = '';
    for (let r = 0; r <= 34; r++) {
      const zRow = r / 10; // 0.0 .. 3.4
      let cells = '';
      for (let c = 0; c <= 9; c++) {
        const z = zRow + c / 100;
        const val = dist.normal.cdf(z, 0, 1);
        const isHit = lookup != null && Math.abs(z - lookup) < 0.0051;
        cells += `<td style="${isHit ? 'background:rgba(0,242,254,0.35);color:#fff;font-weight:800;' : ''}">${val.toFixed(4)}</td>`;
      }
      rowsHtml += `<tr><th>${zRow.toFixed(1)}</th>${cells}</tr>`;
    }
    const head = `<th>z</th>${Array.from({ length: 10 }, (_, c) => `<th>0.0${c}</th>`).join('')}`;
    box.innerHTML = `
      <p style="font-size:11.5px;color:var(--muted);margin-bottom:8px;">
        Tablo, standart normal dağılım için <b>Φ(z) = P(Z ≤ z)</b> kümülatif olasılığını verir. Satır = z'nin birler/onda basamağı, sütun = yüzde basamağı (ör. z=1.23 için satır 1.2, sütun 0.03).
      </p>
      <div style="overflow:auto;max-height:560px;">
        <table class="lab-compare-table" style="font-size:11px;white-space:nowrap;">
          <thead><tr>${head}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>`;
  }

  function renderCriticalTable(kind) {
    const box = $('statsTableBox_2');
    if (!box) return;
    const isT = kind === 't';
    const rows = isT ? T_DF_ROWS : CHI_DF_ROWS;
    const cols = isT ? T_ALPHA_COLS : CHI_ALPHA_COLS;
    const getVal = (df, a) => (isT ? dist.t.inv(1 - a, df) : dist.chisq.inv(1 - a, df));
    const head = `<th>df \\ α</th>${cols.map((a) => `<th>${a}</th>`).join('')}`;
    const rowsHtml = rows.map((df) => {
      const cells = cols.map((a) => `<td>${formatNum(getVal(df, a), 3)}</td>`).join('');
      return `<tr><th>${df}</th>${cells}</tr>`;
    }).join('');
    const title = isT
      ? "Tablo, Student's t dağılımı için <b>sağ kuyruk kritik değerlerini</b> (t öyle ki P(T > t) = α) verir — iki yönlü testlerde α sütununu 2 ile çarpılmış anlamlılık düzeyi olarak okuyun."
      : 'Tablo, Ki-Kare (χ²) dağılımı için <b>sağ kuyruk kritik değerlerini</b> (χ² öyle ki P(X² > χ²) = α) verir — uygunluk/bağımsızlık testlerinde karşılaştırma için kullanılır.';
    box.innerHTML = `
      <p style="font-size:11.5px;color:var(--muted);margin-bottom:8px;">${title}</p>
      <div style="overflow:auto;max-height:560px;">
        <table class="lab-compare-table" style="font-size:11px;white-space:nowrap;">
          <thead><tr>${head}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>`;
  }

  function renderTable() {
    if (state.table.kind === 'z') renderZTable();
    else renderCriticalTable(state.table.kind);
  }

  function syncTableModeButtons() {
    document.querySelectorAll('[data-tablekind]').forEach((b) => b.classList.toggle('active', b.dataset.tablekind === state.table.kind));
  }

  /* ------------------------------------------------------------------------
     ALT SEKME GEÇİŞİ (2.1 Etkileşimli Atlas ↔ 2.2 Klasik Tablolar)
     ------------------------------------------------------------------------ */
  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod2 .subtab-btn').forEach((b) => b.classList.toggle('active', b.dataset.sub === subId));
    if ($('mod2_sub_2_1')) $('mod2_sub_2_1').hidden = subId !== '2_1';
    if ($('mod2_sub_2_2')) $('mod2_sub_2_2').hidden = subId !== '2_2';
    if ($('statsStageCanvas_2')) $('statsStageCanvas_2').parentElement.hidden = subId !== '2_1';
    if ($('statsTableWrap_2')) $('statsTableWrap_2').hidden = subId !== '2_2';
    if (subId === '2_2') renderTable();
  }

  let running = true;
  function loop() {
    requestAnimationFrame(loop);
    const mod2El = $('mod2');
    if (!running || !mod2El || !mod2El.classList.contains('active')) return;
    if (state.activeSub === '2_1') draw();
  }
  requestAnimationFrame(loop);

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.distribution) { state.key = preset.distribution; ensureParams(); resetBounds(); renderDistList(); renderParamControls(); }
    if (preset.dof != null) { state.params[state.key] = state.params[state.key] || {}; state.params[state.key].dof = preset.dof; renderParamControls(); }
    if (preset.a != null) state.a = preset.a;
    if (preset.b != null) state.b = preset.b;
    clampBounds();
    if (preset.tableKind) { state.table.kind = preset.tableKind; syncTableModeButtons(); renderTable(); }
  }

  function init() {
    ensureParams();
    resetBounds();
    renderDistList();
    renderParamControls();
    initDrag();

    document.querySelectorAll('[data-tablekind]').forEach((btn) => {
      btn.addEventListener('click', () => { state.table.kind = btn.dataset.tablekind; syncTableModeButtons(); renderTable(); });
    });
    syncTableModeButtons();
    $('tableLookupInput')?.addEventListener('input', (e) => {
      state.table.lookup = e.target.value === '' ? null : +e.target.value;
      renderTable();
    });

    document.querySelectorAll('#mod2 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => { switchSubtab(btn.dataset.sub); window.AffeStats?.onSubtabChanged(); });
    });
    switchSubtab('2_1');
  }

  window.Mod2Distributions = {
    init,
    switchSubtab,
    applyPreset,
    getActiveSub: () => `stats2_${state.activeSub.split('_')[1]}`,
    setRunning: (r) => { running = r; }
  };
})();
