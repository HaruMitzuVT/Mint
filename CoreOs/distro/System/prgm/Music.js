// SnapMusic.WebView.min.js
import { WDM } from "../CloudBase.js"; // igual que en Terminal
import { CommandManager } from "./Terminal.js"

const PWA = {
  id: 'snap-music',
  title: 'Snap Music',
  url: `https://192.168.1.254/Online/SMusic/`,
  width: 1550,
  height: 850,
  icon: 'Assets/Beta/music.png'
};

function createSnapMusicAPI() {
  return Object.freeze({
    Mixer: {
      getMasterVol: CORE.Mixer.getMasterVol,
      setMasterVol: CORE.Mixer.setMasterVol,
      getDeviceVol: CORE.Mixer.getDeviceVol,
      setDeviceVol: CORE.Mixer.setDeviceVol
    },

    MixerTray: {
      show: CORE.MixerTray.show,
      hide: CORE.MixerTray.hide,
      updateIcon: CORE.MixerTray.updateIcon
    },

    Journal: {
      add: CORE.Jounal.add,
      load: CORE.Jounal.load
    }
  });
}


let _win = null;      // WDM-like window
let _webview = null;  // CORE.SnapSDK.WebView instance or iframe element

function _createWindow(cfg = {}) {
  const conf = Object.assign({
    id: cfg.id || `${PWA.id}-${Date.now()}`,
    name: cfg.name || PWA.title,
    left: cfg.left || 160,
    top: cfg.top || 120,
    width: cfg.width || PWA.width,
    height: cfg.height || PWA.height,
    icon: cfg.icon || PWA.icon,
    startMinimized: !!cfg.startMinimized
  }, cfg);

  if (typeof WDM !== 'undefined') {
    return new WDM({
      id: conf.id,
      name: conf.name,
      left: conf.left,
      top: conf.top,
      width: conf.width,
      height: conf.height,
      icon: conf.icon,
      startMinimized: conf.startMinimized
    });
  }

  // fallback minimal window (DOM)
  const el = document.createElement('div');
  el.className = 'window fallback-window';
  el.id = conf.id;
  Object.assign(el.style, {
    position: 'absolute',
    left: `${conf.left}px`,
    top: `${conf.top}px`,
    width: `${conf.width}px`,
    height: `${conf.height}px`,
    zIndex: 1000,
    background: '#000',
    color: '#fff',
    overflow: 'hidden'
  });
  el.innerHTML = `<div class="window-titlebar" style="padding:6px;background:#111;color:#fff;">${conf.name}</div><div class="window-content" style="height:calc(100% - 34px);"></div>`;
  (document.querySelector('.appContainer') || document.body).appendChild(el);

  const inst = {
    container: el,
    setContent(htmlOrNode) {
      const content = el.querySelector('.window-content');
      if (!content) return;
      if (typeof htmlOrNode === 'string') content.innerHTML = htmlOrNode;
      else { content.innerHTML = ''; content.appendChild(htmlOrNode); }
    },
    minimizeWindow() { try { this.container.style.display = 'none'; this.isMinimized = true; } catch (e) {} },
    restoreWindow() { try { this.container.style.display = 'block'; this.isMinimized = false; } catch (e) {} },
    closeWindow({ destroy = false } = {}) { try { this.container.style.display = 'none'; if (destroy) this.container.remove(); } catch (e) {} },
    bringToFront() { try { const all = document.querySelectorAll('.window, .fallback-window'); let max = 0; all.forEach(n=>max=Math.max(max, parseInt(n.style.zIndex)||0)); this.container.style.zIndex = max+1; } catch(e){} },
    destroy() { try { this.container.remove(); } catch(e){} },
    isMinimized: conf.startMinimized
  };
  return inst;
}

function _createWebViewInside(hostEl) {
  // Prefer CORE.SnapSDK.WebView
  try {
    if (typeof CORE !== 'undefined' && CORE.SnapSDK && typeof CORE.SnapSDK.WebView === 'function') {
      const cfg = { initialUrl: PWA.url, showControls: false, allowNavigation: true };
      const wv = new CORE.SnapSDK.WebView(cfg);
      wv.executeScript(`window.Core = ${CORE};`)
      // Some WebView implementations expect a container element for render()
      try { wv.render(hostEl); } catch (e) {
        // If render appends elsewhere, try to move the element into hostEl
        try {
          if (wv.element && hostEl) {
            hostEl.innerHTML = '';
            hostEl.appendChild(wv.element);
          }
        } catch (_) {}
      }
      return { webview: wv, type: 'webview' };
    }
  } catch (e) {
    // continue to iframe fallback
  }

  // fallback iframe
  const iframe = document.createElement('iframe');
  window.sMusic= iframe;
  iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups';
  iframe.style.cssText = 'width:100%;height:100%;border:0;background:#000;';
  iframe.src = PWA.url;
  hostEl.innerHTML = '';
  hostEl.appendChild(iframe);
  return { webview: iframe, type: 'iframe' };
}

/**
 * initSnapMusicMinimal()
 * - idempotente: si ya existe retorna la ventana existente
 * - solo pone un WebView/iframe en la ventana
 */
function initSnapMusicMinimal() {
  if (_win) return _win;

  _win = _createWindow({ id: PWA.id, name: PWA.title, width: PWA.width, height: PWA.height, icon: PWA.icon });
  // prepare host container inside window
  const contentEl = (_win.container && _win.container.querySelector('.window-content')) || (function(){
    // create if missing
    const c = document.createElement('div'); c.className = 'window-content'; c.style.height = '100%';
    if (_win.container) { _win.container.appendChild(c); }
    return c;
  })();

  // create webview/iframe inside content
  const wvObj = _createWebViewInside(contentEl);
  _webview = wvObj.webview;

  // expose minimal helpers
  try { window.SnapMusicPlayer = { win: _win, webview: _webview }; } catch(e){}

  _win.minimizeWindow();
  CORE.CORE_DOCK.addApp(PWA.id, PWA.icon, _win)

  CommandManager.register('music', 'Run Snap Music', SnapMusicConsole)

  document.querySelector('#snap-music').style.width = '1550px !important';
  document.querySelector('#snap-music').style.height = '850px !important';
  return _win;
}

/* show/open helper */
function SnapMusicOpenMinimal() {
  const w = initSnapMusicMinimal();
  if (!w) return;
  try {
    if (typeof w.restoreWindow === 'function') w.restoreWindow();
    if (typeof w.bringToFront === 'function') w.bringToFront();
    // Neo/WDM render step if exists
    if (typeof w.render === 'function') {
      try { w.render(document.querySelector('#desktop') || document.querySelector('.desktop') || document.body); } catch (e) { /* ignore */ }
    }
  } catch (e) {}
}

function SnapMusicConsole(args){
    let JounalLog = '[SMusic] Executing in console (Beta)';
    document.querySelector('.snap-music').click();
    CommandManager.executeCommand('echo', JounalLog);
    CORE.Jounal.add(JounalLog, 5);
    CORE.Jounal.load();
}

/* exports */
export { initSnapMusicMinimal, SnapMusicOpenMinimal };
export default { initSnapMusicMinimal, SnapMusicOpenMinimal };