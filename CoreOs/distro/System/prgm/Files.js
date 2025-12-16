// Mint Explorer
import { WDM } from "../CloudBase.js";
import { CommandManager } from "./Terminal.js";
import { Journal } from "../Journal.js";

class MintExplorer {

  constructor(){
    this.window = null;
    this.cwd = '/home/';
    this.entries = [];
    this.selected = null;

    this.clipboard = {
      path: null,
      action: null // 'copy' | 'cut'
    };

    this.config = {
      id: 'Explorer',
      title: 'File Explorer',
      width: 900,
      height: 600,
      icon: 'Assets/Beta/files.png'
    };

    this.init();
  }

  /* ───────── INIT ───────── */
async init(){
    this.window = new WDM(this.config);
    CORE.CORE_DOCK.addApp(this.config.id, this.config.icon, this.window);
    this.window.minimizeWindow();
  this.injectCSS();
  this.createUI();

  // Esperar a que WDM inserte el DOM
  setTimeout(async () => {
    await this.loadDirectory(this.cwd);
  }, 0);
}


  registerCommand(){
    CommandManager.register('files', 'Open File Explorer', () => {
      this.window.restoreWindow();
    });
  }

  /* ───────── ENV ───────── */

  isWebEnvironment(){
    return !(window.process && window.process.type);
  }

getRoot(){
  return (
    this.window?.container ||
    this.window?.root ||
    this.window?.el ||
    null
  );
}



  /* ───────── DIRECTORY ───────── */

async loadDirectory(path){
  this.cwd = path;

  const raw = await CORE.fs.readdir(path);

  this.entries = raw
    .filter(e => e.parent === path)
    .map(e => ({
      name: e.path.split('/').pop(),
      type: e.type === 'folder' ? 'directory' : 'file'
    }));

  this.render();
}




  /* ───────── RENDER ───────── */

render(){
  const root = this.getRoot();
  if(!root) {
    console.warn('[Explorer] DOM not ready');
    return;
  }

  const list = root.querySelector('.fe-list');
  const pathLabel = root.querySelector('.fe-path');

  if(!list || !pathLabel){
    console.warn('[Explorer] UI not ready');
    return;
  }

  pathLabel.textContent = this.cwd;
  list.innerHTML = '';

  if(this.cwd !== '/'){
    list.appendChild(this.createItem({
      name: '..',
      type: 'directory',
      up: true
    }));
  }

  this.entries.forEach(entry => {
    list.appendChild(this.createItem(entry));
  });
}


  createItem(entry){
    const item = document.createElement('div');
    item.className = `fe-item ${entry.type}`;
    item.textContent = entry.name;

    item.onclick = () => {
      this.select(item, entry);
    };

    item.ondblclick = () => {
      if(entry.up){
        const parent = this.cwd.split('/').slice(0, -1).join('/') || '/';
        this.loadDirectory(parent);
      }else if(entry.type === 'directory'){
        this.loadDirectory(`${this.cwd}/${entry.name}`);
      }else{
        this.openEntry(entry);
      }
    };

    return item;
  }

  select(item, entry){
    this.window.window
      .querySelectorAll('.fe-item.selected')
      .forEach(e => e.classList.remove('selected'));

    item.classList.add('selected');
    this.selected = entry;
  }

  /* ───────── OPEN FILE ───────── */

  openEntry(entry){
    const path = `${this.cwd}/${entry.name}`;
    Journal.add(`[Explorer] Open file ${path}`);

    CORE.dispatch('file:open', {
      path,
      entry
    });
  }

  /* ───────── CLIPBOARD ───────── */

  copy(entry){
    if(!entry) return;
    this.clipboard = {
      path: `${this.cwd}/${entry.name}`,
      action: 'copy'
    };
    Journal.add(`[Explorer] Copied ${entry.name}`);
  }

  cut(entry){
    if(!entry) return;
    this.clipboard = {
      path: `${this.cwd}/${entry.name}`,
      action: 'cut'
    };
    Journal.add(`[Explorer] Cut ${entry.name}`);
  }

  async paste(){
    if(!this.clipboard.path) return;

    const name = this.clipboard.path.split('/').pop();
    const target = `${this.cwd}/${name}`;

    if(this.clipboard.action === 'copy'){
      await CORE.fs.copy(this.clipboard.path, target);
    }

    if(this.clipboard.action === 'cut'){
      await CORE.fs.rename(this.clipboard.path, target);
      this.clipboard.path = null;
    }

    Journal.add(`[Explorer] Pasted ${name}`);
    await this.loadDirectory(this.cwd);
  }

  /* ───────── SHORTCUTS ───────── */

  registerShortcuts(){
    window.addEventListener('keydown', e => {
      if(!this.window.window?.contains(document.activeElement)) return;

      if(e.ctrlKey && e.key === 'c') this.copy(this.selected);
      if(e.ctrlKey && e.key === 'x') this.cut(this.selected);
      if(e.ctrlKey && e.key === 'v') this.paste();
    });
  }

  /* ───────── DRAG & DROP ───────── */

  enableDragAndDrop(){
  const root = this.window.window;
  if(!root) return;

  const list = root.querySelector('.fe-list');
  if(!list) return;

  list.addEventListener('dragover', e => {
    e.preventDefault();
    list.classList.add('dragging');
  });

  list.addEventListener('dragleave', () => {
    list.classList.remove('dragging');
  });

  list.addEventListener('drop', async e => {
    e.preventDefault();
    list.classList.remove('dragging');

    const files = [...e.dataTransfer.files];
    for(const file of files){
      const buffer = await file.arrayBuffer();
      await CORE.fs.writeFile(
        `${this.cwd}/${file.name}`,
        new Uint8Array(buffer)
      );
    }

    await this.loadDirectory(this.cwd);
  });
}


  /* ───────── API ───────── */

  exposeAPI(){
    window.ExplorerAPI = {
      open: path => CORE.dispatch('file:open', { path }),
      copy: (src, dst) => CORE.fs.copy(src, dst),
      move: (src, dst) => CORE.fs.rename(src, dst),
      readDir: path => CORE.fs.readdir(path),
      cwd: () => this.cwd
    };
  }

  /* ───────── UI ───────── */

  createUI(){
    const html = `
      <div class="fe-app">
        <div class="fe-header fe-path"></div>
        <div class="fe-list"></div>
      </div>
    `;
    this.window.setContent(html);
  }

  injectCSS(){
    const style = document.createElement('style');
    style.textContent = `
      .fe-app {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #1c1c1c;
        color: #fff;
        font-family: system-ui;
      }

      .fe-header {
        padding: 8px 12px;
        background: #2a2a2a;
        font-size: .85rem;
        opacity: .8;
      }

      .fe-list {
        flex: 1;
        overflow: auto;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .fe-list.dragging {
        outline: 2px dashed #7a7aff;
        background: #ffffff08;
      }

      .fe-item {
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
      }

      .fe-item:hover {
        background: #ffffff14;
      }

      .fe-item.selected {
        background: #7a7aff33;
      }

      .fe-item.directory::before {
        content: "📁 ";
      }

      .fe-item.file::before {
        content: "📄 ";
      }
    `;
    document.head.appendChild(style);
  }
}

export { MintExplorer };
