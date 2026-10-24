/* ============================================================================
   affeStats — Ana SPA Yönlendirici, Tema Yöneticisi
   ve scienceWiki "Akademik Bilgi & Teori" Çekmecesi Denetleyicisi
   ============================================================================ */
(function () {
  'use strict';

  const { SCIENCE_WIKI } = window.StatsData;
  const $ = (id) => document.getElementById(id);

  const appState = {
    activeModule: 'mod1',
    activeTheoryTab: 'intuitive'
  };

  const MODS = {
    mod1: 'Mod1Galton', mod2: 'Mod2Distributions', mod3: 'Mod3Inference',
    mod4: 'Mod4Bayes', mod5: 'Mod5Regression', mod6: 'Mod6MonteCarlo', mod7: 'Mod7Multivariate',
    mod8: 'Mod8Basics'
  };

  function getActiveSubKey() {
    const api = window[MODS[appState.activeModule]];
    return api ? api.getActiveSub() : `stats${appState.activeModule.replace('mod', '')}_1`;
  }

  function switchModule(modId) {
    appState.activeModule = modId;
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mod === modId);
    });
    document.querySelectorAll('.module-section').forEach((sec) => {
      sec.classList.toggle('active', sec.id === modId);
    });
    Object.keys(MODS).forEach((m) => {
      const api = window[MODS[m]];
      if (api && api.setRunning) api.setRunning(m === modId);
    });
    renderTheoryDrawer();
  }

  function renderMath(tex) {
    if (window.katex) {
      try { return window.katex.renderToString(tex, { displayMode: true, throwOnError: false }); } catch (_) {}
    }
    return `<code>${tex}</code>`;
  }

  function renderInlineMathInText(html) {
    if (!window.katex) return html;
    return html.replace(/\$([^$]+)\$/g, (_, tex) => {
      try { return window.katex.renderToString(tex, { displayMode: false, throwOnError: false }); } catch (_) { return tex; }
    });
  }

  function renderTheoryDrawer() {
    const key = getActiveSubKey();
    const entry = SCIENCE_WIKI[key] || SCIENCE_WIKI.stats1_1;

    const titleEl = $('theoryDrawerTitle');
    if (titleEl) titleEl.textContent = entry.title;

    document.querySelectorAll('.theory-tab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.ttab === appState.activeTheoryTab);
    });

    const bodyEl = $('theoryDrawerBody');
    if (!bodyEl) return;

    if (appState.activeTheoryTab === 'intuitive') {
      bodyEl.innerHTML = `<div class="theory-card"><h4>💡 Sezgisel Mantık (Nedir & Neden Önemli?)</h4><p>${renderInlineMathInText(entry.intuitive)}</p></div>`;
    } else if (appState.activeTheoryTab === 'history') {
      bodyEl.innerHTML = `<div class="theory-card"><h4>🏛️ Keşif Tarihi & Bilim İnsanları</h4><p>${renderInlineMathInText(entry.history)}</p></div>`;
    } else if (appState.activeTheoryTab === 'formulas') {
      bodyEl.innerHTML = entry.formulas.map((f, i) => `
        <div class="theory-card">
          <h4>📐 Denklem ${i + 1}</h4>
          <div class="formula-box">${renderMath(f.tex)}</div>
          <p style="font-size:12.5px;color:var(--muted);">${f.desc}</p>
        </div>`).join('');
    } else if (appState.activeTheoryTab === 'tasks') {
      bodyEl.innerHTML = entry.tasks.map((t, idx) => `
        <div class="task-step">
          <div class="task-num">${idx + 1}</div>
          <div style="flex:1;">
            <p style="margin-bottom:8px;">${t.step}</p>
            <button class="action-btn" data-task-idx="${idx}" style="padding:5px 11px;font-size:11.5px;">🎯 Bu Kurulumu Simülasyona Uygula</button>
          </div>
        </div>`).join('');
      bodyEl.querySelectorAll('[data-task-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = +btn.dataset.taskIdx;
          const task = entry.tasks[idx];
          if (task && task.preset) {
            runTaskPreset(task.preset);
            $('theoryDrawerBackdrop').hidden = true;
          }
        });
      });
    }
  }

  function runTaskPreset(preset) {
    const modNum = preset.sub ? preset.sub.split('_')[0] : '1';
    switchModule(`mod${modNum}`);
    const api = window[MODS[`mod${modNum}`]];
    if (api && api.applyPreset) api.applyPreset(preset);
  }

  function initThemeAndFullscreen() {
    const themeBtn = $('themeToggleBtn');
    const updateThemeLabel = () => {
      const isLight = document.documentElement.dataset.theme === 'light';
      if (themeBtn) themeBtn.textContent = isLight ? '🌙 Karanlık Lab' : '☀️ Aydınlık Tema';
    };
    updateThemeLabel();
    themeBtn?.addEventListener('click', () => {
      const isLight = document.documentElement.dataset.theme === 'light';
      if (isLight) {
        delete document.documentElement.dataset.theme;
        try { localStorage.setItem('affestats_theme', 'dark'); } catch (_) {}
      } else {
        document.documentElement.dataset.theme = 'light';
        try { localStorage.setItem('affestats_theme', 'light'); } catch (_) {}
      }
      updateThemeLabel();
    });
    $('fullscreenBtn')?.addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });
  }

  function init() {
    initThemeAndFullscreen();

    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchModule(btn.dataset.mod));
    });

    const backdrop = $('theoryDrawerBackdrop');
    $('openTheoryDrawerBtn')?.addEventListener('click', () => {
      renderTheoryDrawer();
      if (backdrop) backdrop.hidden = false;
    });
    $('closeTheoryDrawerBtn')?.addEventListener('click', () => { if (backdrop) backdrop.hidden = true; });
    backdrop?.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.hidden = true; });

    document.querySelectorAll('.theory-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.activeTheoryTab = btn.dataset.ttab;
        renderTheoryDrawer();
      });
    });

    Object.values(MODS).forEach((name) => { window[name]?.init(); });

    renderTheoryDrawer();
  }

  window.AffeStats = { switchModule, onSubtabChanged: renderTheoryDrawer };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
