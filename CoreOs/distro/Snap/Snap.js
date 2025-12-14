const isFunction = (value) => typeof value === 'function';
//-------------- Subroutines --------------------
class ValidadorBackground {
    static #PATRONES = {
        // Patrones para paths/URLs
        BLOB: {
            regex: /^blob:.+$/i,
            tipo: 'path',
            subtipo: 'blob',
            descripcion: 'URL Blob'
        },
        DATA_URL: {
            regex: /^data:.+;base64,.+$/i,
            tipo: 'path',
            subtipo: 'data_url',
            descripcion: 'Data URL Base64'
        },
        HTTP_URL: {
            regex: /^https?:\/\/.+/i,
            tipo: 'path',
            subtipo: 'http_url',
            descripcion: 'URL HTTP/HTTPS'
        },
        FILE_PATH: {
            regex: /^file:\/\/.+/i,
            tipo: 'path',
            subtipo: 'file_path',
            descripcion: 'Ruta de archivo local'
        },
        RELATIVE_PATH: {
            regex: /^[^.:].*\.(png|jpg|jpeg|gif|svg|webp|txt|json|xml)$/i,
            tipo: 'path',
            subtipo: 'relative_path',
            descripcion: 'Ruta relativa de archivo'
        },

        // Patrones para colores
        HEX: {
            regex: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i,
            tipo: 'color',
            subtipo: 'hex',
            descripcion: 'Color HEX'
        },
        HEX_ALPHA: {
            regex: /^#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/i,
            tipo: 'color',
            subtipo: 'hex_alpha',
            descripcion: 'Color HEX con alpha'
        },
        RGB: {
            regex: /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
            tipo: 'color',
            subtipo: 'rgb',
            descripcion: 'Color RGB'
        },
        RGBA: {
            regex: /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/i,
            tipo: 'color',
            subtipo: 'rgba',
            descripcion: 'Color RGBA'
        },
        HSL: {
            regex: /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i,
            tipo: 'color',
            subtipo: 'hsl',
            descripcion: 'Color HSL'
        },
        HSLA: {
            regex: /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(0|1|0?\.\d+)\s*\)$/i,
            tipo: 'color',
            subtipo: 'hsla',
            descripcion: 'Color HSLA'
        }
    };

    static validar(input) {
        const resultado = {
            input: input,
            esValido: false,
            tipo: null,
            subtipo: null,
            descripcion: null,
            datos: null
        };

        for (const [nombrePatron, config] of Object.entries(this.#PATRONES)) {
            const match = input.match(config.regex);
            if (match) {
                resultado.esValido = true;
                resultado.tipo = config.tipo;
                resultado.subtipo = config.subtipo;
                resultado.descripcion = config.descripcion;
                resultado.datos = this.#extraerDatos(config.subtipo, match, input);
                break;
            }
        }

        return resultado;
    }

    static #extraerDatos(subtipo, match, input) {
        switch (subtipo) {
            case 'hex':
            case 'hex_alpha':
                return {
                    valor: input
                };

            case 'rgb':
                return {
                    r: parseInt(match[1]),
                        g: parseInt(match[2]),
                        b: parseInt(match[3])
                };

            case 'rgba':
                return {
                    r: parseInt(match[1]),
                        g: parseInt(match[2]),
                        b: parseInt(match[3]),
                        a: parseFloat(match[4])
                };

            case 'hsl':
                return {
                    h: parseInt(match[1]),
                        s: parseInt(match[2]),
                        l: parseInt(match[3])
                };

            case 'hsla':
                return {
                    h: parseInt(match[1]),
                        s: parseInt(match[2]),
                        l: parseInt(match[3]),
                        a: parseFloat(match[4])
                };

            default:
                return {
                    valor: input
                };
        }
    }

    static esPath(input) {
        const resultado = this.validar(input);
        return resultado.tipo === 'path';
    }

    static esColor(input) {
        const resultado = this.validar(input);
        return resultado.tipo === 'color';
    }

    static getTipo(input) {
        return this.validar(input).tipo;
    }

    static getSubtipo(input) {
        return this.validar(input).subtipo;
    }

    // Métodos de utilidad
    static esBlob(input) {
        return this.#PATRONES.BLOB.regex.test(input);
    }

    static esHex(input) {
        return this.#PATRONES.HEX.regex.test(input) || this.#PATRONES.HEX_ALPHA.regex.test(input);
    }

    static esRgba(input) {
        return this.#PATRONES.RGBA.regex.test(input);
    }

    static getTiposDisponibles() {
        return Object.values(this.#PATRONES).map(p => p.subtipo);
    }
}

//--------------- Public API --------------------------------
class DisplayUtils {
    static setBrightness(val) {
        if (!val) return;

        // Validar que el valor esté entre 0.1 y 1
        const brightnessValue = Math.max(0.1, Math.min(1, parseFloat(val)));
        document.body.style.filter = `brightness(${brightnessValue})`;
        InternalNandStorage.set("Dspbr", brightnessValue);
    }

    static getBrightness() {
        return InternalNandStorage.get('Dspbr') || 1; // Valor por defecto: 1
    }

    static setBackground(source) {
        if (!source) return;

        const validationResult = ValidadorBackground.validar(source);
        console.log('Resultado validación fondo:', validationResult);

        if (!validationResult.esValido) {
            console.error('Fuente de fondo no válida:', source);
            return;
        }

        // Aplicar el fondo según el tipo
        if (validationResult.tipo === 'color') {
            this.#aplicarColorFondo(validationResult);
        } else if (validationResult.tipo === 'path') {
            this.#aplicarImagenFondo(validationResult);
        }

        // Guardar en almacenamiento
        InternalNandStorage.set('DspBg', {
            source: source,
            tipo: validationResult.tipo,
            subtipo: validationResult.subtipo,
            datos: validationResult.datos,
            timestamp: Date.now()
        });
    }

    static getBackground() {
        return InternalNandStorage.get('DspBg');
    }

    static ApplySavedBackground() {
        const fondoGuardado = this.getBackground();
        if (fondoGuardado && fondoGuardado.source) {
            this.setBackground(fondoGuardado.source);
        }
    }

    static resetBackground() {
        document.body.style.background = '';
        document.body.style.backgroundColor = '';
        InternalNandStorage.remove('DspBg');
    }

    static resetBrightness() {
        document.body.style.filter = 'brightness(1)';
        InternalNandStorage.remove('Dspbr');
    }

    // Métodos privados
    static #aplicarColorFondo(validationResult) {
        document.body.style.background = '';
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = validationResult.input;

        console.log(`Fondo de color aplicado: ${validationResult.input}`);
    }

    static #aplicarImagenFondo(validationResult) {
        const source = validationResult.input;

        // Para URLs de datos (base64)
        if (validationResult.subtipo === 'data_url') {
            document.body.style.backgroundImage = `url(${source})`;
        }
        // Para blobs
        else if (validationResult.subtipo === 'blob') {
            document.body.style.backgroundImage = `url(${source})`;
        }
        // Para URLs HTTP y rutas de archivo
        else if (validationResult.subtipo === 'http_url' ||
            validationResult.subtipo === 'file_path' ||
            validationResult.subtipo === 'relative_path') {
            document.body.style.backgroundImage = `url(${source})`;
        }

        // Estilos CSS para que la imagen de fondo se vea bien
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundColor = ''; // Limpiar color de fondo

        console.log(`Fondo de imagen aplicado: ${source}`);
    }

    // Métodos de utilidad adicionales
    static getEstiloFondoActual() {
        return {
            backgroundImage: document.body.style.backgroundImage,
            backgroundColor: document.body.style.backgroundColor,
            backgroundSize: document.body.style.backgroundSize,
            filter: document.body.style.filter
        };
    }

    static esFondoOscuro() {
        const fondo = this.getBackground();
        if (!fondo || fondo.tipo !== 'color') return false;

        // Para colores HEX
        if (fondo.subtipo === 'hex' || fondo.subtipo === 'hex_alpha') {
            const hex = fondo.source.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);

            // Fórmula de luminosidad
            const luminosidad = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminosidad < 0.5;
        }

        // Para RGB/RGBA
        if (fondo.subtipo === 'rgb' || fondo.subtipo === 'rgba') {
            const {
                r,
                g,
                b
            } = fondo.datos;
            const luminosidad = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminosidad < 0.5;
        }

        return false;
    }

    // Método para aplicar gradientes (extensión futura)
    static setGradientBackground(color1, color2, direction = 'to right') {
        const val1 = ValidadorBackground.validar(color1);
        const val2 = ValidadorBackground.validar(color2);

        if (val1.tipo === 'color' && val2.tipo === 'color') {
            const gradient = `linear-gradient(${direction}, ${color1}, ${color2})`;
            document.body.style.background = gradient;
            document.body.style.backgroundImage = gradient;

            InternalNandStorage.set('DspBg', {
                source: gradient,
                tipo: 'gradient',
                subtipo: 'linear',
                colors: [color1, color2],
                direction: direction,
                timestamp: Date.now()
            });
        }
    }
}

class SWDM {
    // static z-index manager
    static zIndexBase = 1000;
    static instances = new Set();

    constructor(selectorOrElement, opts = {}) {
        this.container =
            typeof selectorOrElement === "string" ?
            document.querySelector(selectorOrElement) :
            selectorOrElement;

        if (!this.container) throw new Error("Container no encontrado");

        // Options
        this.noMaximize = !!opts.noMaximize;
        this.minWidth = opts.minWidth || 220;
        this.minHeight = opts.minHeight || 120;
        this.snapThreshold = opts.snapThreshold || 12;
        this.onStateChange = opts.onStateChange || null;
        this.className = opts.className || "";

        // State
        this.isDragging = false;
        this.isResizing = false;
        this.isMinimized = false;
        this.maximized = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.prevSize = null;
        this.prevPos = null;

        // resize observer / fallback
        this._resizeObserver = null;
        this._boundWindowResize = this.adjustContent.bind(this);

        // events/emitter
        this._events = {};
        this._raf = null;

        // handlers (bound so we can remove them later)
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onResizePointerDown = this._onResizePointerDown.bind(this);
        this._onDblClick = this._onDblClick.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onMinimizeClick = () => this.minimize();
        this._onMaximizeClick = () => this.toggleMaximize();
        this._onCloseClick = () => this.close();
        this._onContainerPointerDown = () => this.bringToFront();

        // Ensure class names for styling
        this.container.classList.add("window-container");
        if (this.className) this.container.classList.add(this.className);
        this.container.setAttribute("role", "dialog");
        this.container.setAttribute("aria-hidden", "false");

        this.init();
        SWDM.instances.add(this);
    }

    // --- init DOM + listeners
    init() {
        // build titlebar/buttons if not present
        this.titleBar =
            this.container.querySelector(".window-titlebar") ||
            this._createTitlebarFromOptions();

        this.minimizeButton =
            this.container.querySelector(".minimize") || this._createButton("minimize", "_");
        this.maximizeButton =
            this.container.querySelector(".maximize") || this._createButton("maximize", "□");
        this.closeButton =
            this.container.querySelector(".close") || this._createButton("close", "×");

        // content wrapper
        this.contentEl =
            this.container.querySelector(".window-content") ||
            (function(c) {
                const d = document.createElement("div");
                d.className = "window-content";
                c.appendChild(d);
                return d;
            })(this.container);

        // resize handle
        this.resizeHandle =
            this.container.querySelector(".resize-handle") ||
            (function(c) {
                const r = document.createElement("div");
                r.className = "resize-handle";
                c.appendChild(r);
                return r;
            })(this.container);

        // keyboard focus
        if (!this.container.hasAttribute("tabindex")) this.container.tabIndex = 0;

        this.addEventListeners();

        // ResizeObserver or fallback
        if (window.ResizeObserver) {
            this._resizeObserver = new ResizeObserver(() => this.adjustContent());
            this._resizeObserver.observe(this.container);
        } else {
            // fallback con referencia removible
            window.addEventListener('resize', this._boundWindowResize);
        }

        // ajustar inicialmente
        this.adjustContent();
    }

    _createTitlebarFromOptions() {
        const tb = document.createElement("div");
        tb.className = "window-titlebar";
        tb.innerHTML = `<span class="window-title">Nueva Ventana</span>
      <div class="window-buttons">
        <button class="minimize" title="Minimizar" aria-label="Minimizar">_</button>
        <button class="maximize" title="Maximizar" aria-label="Maximizar">□</button>
        <button class="close" title="Cerrar" aria-label="Cerrar">×</button>
      </div>`;
        this.container.prepend(tb);
        return tb;
    }

    _createButton(cls, text) {
        const btn = this.container.querySelector(`.${cls}`) || document.createElement("button");
        btn.className = btn.className || cls;
        btn.innerText = text;
        btn.setAttribute("aria-label", cls);
        btn.type = "button";
        const wrap = this.container.querySelector(".window-buttons") || (this.titleBar && this.titleBar.querySelector(".window-buttons"));
        if (wrap && !wrap.contains(btn)) wrap.appendChild(btn);
        return btn;
    }

    addEventListeners() {
        // buttons (use bound handlers so can be removed later)
        if (this.minimizeButton) this.minimizeButton.addEventListener("click", this._onMinimizeClick);
        if (this.maximizeButton && !this.noMaximize) this.maximizeButton.addEventListener("click", this._onMaximizeClick);
        else if (this.maximizeButton) this.maximizeButton.style.pointerEvents = "none";
        if (this.closeButton) this.closeButton.addEventListener("click", this._onCloseClick);

        // pointer events on titlebar
        if (this.titleBar) {
            this.titleBar.addEventListener("pointerdown", this._onPointerDown);
            this.titleBar.addEventListener("dblclick", this._onDblClick);
        }

        // resize handle
        if (this.resizeHandle) this.resizeHandle.addEventListener("pointerdown", this._onResizePointerDown);

        // keyboard
        this.container.addEventListener("keydown", this._onKeyDown);

        // focus -> bring to front
        this.container.addEventListener("pointerdown", this._onContainerPointerDown);
    }

    removeEventListeners() {
        // buttons
        if (this.minimizeButton) this.minimizeButton.removeEventListener("click", this._onMinimizeClick);
        if (this.maximizeButton && !this.noMaximize) this.maximizeButton.removeEventListener("click", this._onMaximizeClick);
        if (this.closeButton) this.closeButton.removeEventListener("click", this._onCloseClick);

        // titlebar
        if (this.titleBar) {
            this.titleBar.removeEventListener("pointerdown", this._onPointerDown);
            this.titleBar.removeEventListener("dblclick", this._onDblClick);
        }

        // resize handle
        if (this.resizeHandle) this.resizeHandle.removeEventListener("pointerdown", this._onResizePointerDown);

        // keyboard
        this.container.removeEventListener("keydown", this._onKeyDown);

        // bring to front pointer
        this.container.removeEventListener("pointerdown", this._onContainerPointerDown);

        // document-level pointers (in case left attached)
        document.removeEventListener("pointermove", this._onPointerMove);
        document.removeEventListener("pointerup", this._onPointerUp);

        // if a resize move handler was attached store ref, remove it
        if (this._onResizePointerMoveRef) {
            document.removeEventListener("pointermove", this._onResizePointerMoveRef);
            document.removeEventListener("pointerup", this._onPointerUp);
            this._onResizePointerMoveRef = null;
        }
    }

    // --- pointer handlers (drag)
    _onPointerDown(e) {
        // only primary pointer
        if (e.button && e.button !== 0) return;
        if (this.maximized) return; // no drag when maximized

        this.isDragging = true;
        const rect = this.container.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        document.addEventListener("pointermove", this._onPointerMove);
        document.addEventListener("pointerup", this._onPointerUp);

        this.bringToFront();
        e.preventDefault();
    }

    _onPointerMove(e) {
        if (!this.isDragging) return;
        // schedule via rAF to be smooth
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = requestAnimationFrame(() => {
            let left = e.clientX - this.offsetX;
            let top = e.clientY - this.offsetY;

            // constrain to viewport
            const vw = document.documentElement.clientWidth;
            const vh = document.documentElement.clientHeight;
            const rect = this.container.getBoundingClientRect();

            // prevent moving off-screen completely
            left = Math.min(Math.max(left, -rect.width + 40), vw - 40);
            top = Math.min(Math.max(top, 0), vh - 20);

            // snap to edges
            if (Math.abs(left) < this.snapThreshold) left = 0;
            if (Math.abs(top) < this.snapThreshold) top = 0;
            if (Math.abs(vw - (left + rect.width)) < this.snapThreshold) left = vw - rect.width;
            if (Math.abs(vh - (top + rect.height)) < this.snapThreshold) top = vh - rect.height;

            this.container.style.left = `${left}px`;
            this.container.style.top = `${top}px`;
        });
    }

    _onPointerUp() {
        if (this._raf) {
            cancelAnimationFrame(this._raf);
            this._raf = null;
        }
        this.isDragging = false;
        document.removeEventListener("pointermove", this._onPointerMove);
        document.removeEventListener("pointerup", this._onPointerUp);
    }

    // --- resize handlers
    _onResizePointerDown(e) {
        if (e.button && e.button !== 0) return;
        this.isResizing = true;
        const rect = this.container.getBoundingClientRect();
        this._resizeStart = {
            startX: e.clientX,
            startY: e.clientY,
            startW: rect.width,
            startH: rect.height,
            startLeft: rect.left,
            startTop: rect.top
        };

        // create a named ref so we can remove it later
        this._onResizePointerMoveRef = (ev) => {
            if (!this.isResizing) return;
            if (this._raf) cancelAnimationFrame(this._raf);
            this._raf = requestAnimationFrame(() => {
                let newW = this._resizeStart.startW + (ev.clientX - this._resizeStart.startX);
                let newH = this._resizeStart.startH + (ev.clientY - this._resizeStart.startY);

                // enforce min sizes
                newW = Math.max(this.minWidth, newW);
                newH = Math.max(this.minHeight, newH);

                // constrain to viewport max
                const vw = document.documentElement.clientWidth;
                const vh = document.documentElement.clientHeight;
                const maxW = vw - this._resizeStart.startLeft - 8;
                const maxH = vh - this._resizeStart.startTop - 8;
                newW = Math.min(newW, maxW);
                newH = Math.min(newH, maxH);

                this.container.style.width = `${Math.round(newW)}px`;
                this.container.style.height = `${Math.round(newH)}px`;
            });
        };

        document.addEventListener("pointermove", this._onResizePointerMoveRef);
        document.addEventListener("pointerup", this._onPointerUp);
        e.preventDefault();
    }

    // _onPointerUp handles cleanup for resize as well
    // ensure we call adjustContent after resize ends
    stopResize() {
        if (this._raf) {
            cancelAnimationFrame(this._raf);
            this._raf = null;
        }
        this.isResizing = false;
        if (this._onResizePointerMoveRef) {
            document.removeEventListener("pointermove", this._onResizePointerMoveRef);
            document.removeEventListener("pointerup", this._onPointerUp);
            this._onResizePointerMoveRef = null;
        }
        this.adjustContent();
    }

    // --- double click on titlebar => maximize/restore
    _onDblClick() {
        if (this.noMaximize) return;
        this.toggleMaximize();
    }

    // --- keyboard
    _onKeyDown(e) {
        // Esc to close, Ctrl+M to minimize, Ctrl+F to maximize
        if (e.key === "Escape") {
            this.close();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
            this.minimize();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
            this.toggleMaximize();
        }
    }

    // --- state methods
    maximize() {
        if (this.noMaximize) return;
        if (this.maximized) return;

        // store previous
        const rect = this.container.getBoundingClientRect();
        this.prevSize = {
            width: rect.width + "px",
            height: rect.height + "px"
        };
        this.prevPos = {
            left: rect.left + "px",
            top: rect.top + "px"
        };

        // apply maximize
        this.container.classList.add("maximized");
        this.container.style.left = "0px";
        this.container.style.top = "0px";
        this.container.style.width = "100vw";
        this.container.style.height = "100vh";
        this.container.style.borderRadius = "0px";
        this.maximized = true;
        this.emit("state", "maximized");
        if (this.onStateChange) this.onStateChange("maximized");
        this._updateAria();
        this.adjustContent();
    }

    restore() {
        if (!this.maximized && !this.isMinimized && !this.prevSize) return;

        if (this.prevSize && this.prevPos) {
            this.container.style.width = this.prevSize.width;
            this.container.style.height = this.prevSize.height;
            this.container.style.left = this.prevPos.left;
            this.container.style.top = this.prevPos.top;
        }

        this.container.classList.remove("maximized");
        this.maximized = false;
        this.isMinimized = false;
        this.container.style.borderRadius = ""; // rely on CSS
        this.container.style.display = "block";
        this.bringToFront();
        this.emit("state", "restored");
        if (this.onStateChange) this.onStateChange("open");
        this._updateAria();
        this.adjustContent();
    }

    toggleMaximize() {
        if (this.maximized) this.restore();
        else this.maximize();
    }

    minimize() {
        this.container.style.display = "none";
        this.isMinimized = true;
        this.emit("state", "minimized");
        if (this.onStateChange) this.onStateChange("minimized");
        this._updateAria();
    }

    show() {
        this.container.style.display = "flex";
        this.isMinimized = false;
        this.bringToFront();
        this.emit("state", "open");
        this._updateAria();
        this.adjustContent();
    }

    hide() {
        this.container.style.display = "none";
        this.emit("state", "hidden");
        this._updateAria();
    }

    close() {
        this.hide();
        this.emit("state", "closed");
        if (this.onStateChange) this.onStateChange("closed");
    }

    setContent(content) {
        if (typeof content === "function") {
            const result = content(this.container);
            if (result instanceof HTMLElement) {
                this.contentEl.innerHTML = "";
                this.contentEl.appendChild(result);
            }
        } else if (content instanceof HTMLElement) {
            this.contentEl.innerHTML = "";
            this.contentEl.appendChild(content);
        } else {
            this.contentEl.innerHTML = String(content);
        }
        // adaptar tras cambiar contenido
        this.adjustContent();
    }

    setTitle(text) {
        const span = this.titleBar.querySelector(".window-title") || this.titleBar.querySelector("span");
        if (span) span.innerText = text;
    }

    bringToFront() {
        // calculate highest z among SWDM instances
        let maxZ = SWDM.zIndexBase;
        SWDM.instances.forEach((inst) => {
            const z = Number(inst.container.dataset.zIndex || inst.container.style.zIndex) || 0;
            maxZ = Math.max(maxZ, z);
        });
        const newZ = maxZ + 1;
        this.container.style.zIndex = newZ;
        this.container.dataset.zIndex = newZ;
    }

    // simple events
    on(eventName, fn) {
        this._events[eventName] = this._events[eventName] || new Set();
        this._events[eventName].add(fn);
    }
    off(eventName, fn) {
        if (!this._events[eventName]) return;
        this._events[eventName].delete(fn);
    }
    emit(eventName, payload) {
        if (!this._events[eventName]) return;
        this._events[eventName].forEach((fn) => {
            try {
                fn(payload);
            } catch (err) {
                console.error("SWDM event handler error:", err);
            }
        });
    }

    _updateAria() {
        this.container.setAttribute("aria-hidden", String(this.isMinimized));
        this.container.setAttribute("aria-expanded", String(!this.isMinimized && !this.maximized));
    }

    // Ajuste del contenido al tamaño del contenedor (ResizeObserver)
    adjustContent() {
        // calcula altura disponible restando la titlebar si hiciera falta
        const rect = this.container.getBoundingClientRect();
        const titlebarHeight = this.titleBar ? this.titleBar.getBoundingClientRect().height : 0;
        const contentBox = this.contentEl;

        // disponible por fuera del if para que siempre exista la variable
        const availableHeight = Math.max(0, rect.height - titlebarHeight);

        // fuerza que el content tenga la altura correcta (útil si usas absolute children)
        if (contentBox) {
            // preferimos flex y 100% pero ponemos minHeight por compat
            contentBox.style.minHeight = availableHeight + "px";
            contentBox.style.height = "100%";
        }

        // forzar a iframes / imgs / videos hijos a 100% (por si alguien los puso con px)
        if (contentBox) {
            const mediaEls = contentBox.querySelectorAll("iframe, video, img, webview");
            mediaEls.forEach(el => {
                if (!el.dataset.fixedSize) {
                    el.style.width = "100%";
                    el.style.height = "100%";
                    el.style.maxWidth = "100%";
                    if (el.tagName.toLowerCase() === "iframe") el.style.display = "block";
                }
            });
        }

        // emitir evento internal para que listeners hagan cosas si lo desean
        this.emit("resize", {
            width: rect.width,
            height: rect.height,
            contentHeight: availableHeight
        });

        // si el contenido es un iframe y quieres notificarle (solo si controlas la página dentro)
        if (contentBox) {
            const firstIframe = contentBox.querySelector("iframe");
            if (firstIframe && firstIframe.contentWindow) {
                try {
                    firstIframe.contentWindow.postMessage({
                        type: "swmd-resize",
                        w: rect.width,
                        h: rect.height
                    }, "*");
                } catch (err) {
                    /* no crítico */ }
            }
        }
    }

    run() {
        this.show();
        this.bringToFront();
    }

    // remove everything
    destroy() {
        this.removeEventListeners();
        // disconnect resize observer or remove fallback
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        } else {
            window.removeEventListener('resize', this._boundWindowResize);
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        SWDM.instances.delete(this);
        this.emit("destroy");
        this._events = {};
    }

    // --- static factory (mejorada)
    static createWindow({
        id,
        title = "Nueva Ventana",
        content = "",
        noMaximize = false,
        width = "400px",
        height = "300px",
        top = "100px",
        left = "100px",
        parent = document.body,
        minWidth = 220,
        minHeight = 120,
        className = "",
        onStateChange = null,
    } = {}) {
        if (!id) id = `window_${Date.now()}`;

        if (document.getElementById(id)) {
            console.warn(`La ventana con id "${id}" ya existe.`);
            return new SWDM(`#${id}`, {
                noMaximize,
                minWidth,
                minHeight,
                onStateChange,
                className
            });
        }

        const container = document.createElement("div");
        container.className = `window-container ${className}`.trim();
        container.id = id;
        container.style.position = "absolute";
        container.style.top = top;
        container.style.left = left;
        container.style.width = width;
        container.style.height = height;
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.innerHTML = `
      <div class="window-titlebar" role="presentation">
        <span class="window-title">${title}</span>
        <div class="window-buttons">
          <button class="minimize" aria-label="Minimizar" title="Minimizar">_</button>
          <button class="maximize" aria-label="Maximizar" title="Maximizar">□</button>
          <button class="close" aria-label="Cerrar" title="Cerrar">×</button>
        </div>
      </div>
      <div class="window-content"></div>
    `;

        // append and create instance
        parent.appendChild(container);
        const win = new SWDM(container, {
            noMaximize,
            minWidth,
            minHeight,
            onStateChange,
            className
        });
        // set content
        if (typeof content === "function") {
            const result = content(container);
            if (result instanceof HTMLElement) win.contentEl.appendChild(result);
        } else {
            win.contentEl.innerHTML = content;
        }

        win.run();
        return win;
    }
}

class SnapNotifications {
    constructor() {
        this.createNotificationPanel()
    }

    createNotificationPanel() {
        this.panel = document.querySelector(".notification-panel")
        if (!this.panel) {
            this.panel = document.createElement("div")
            this.panel.className = "notification-panel"
            document.body.appendChild(this.panel)
        }
    }

    showNotification(title, message, iconPath = "System/Icons/notification.png", duration = 5000) {
        const notification = document.createElement("div")
        notification.className = "notification fade-in"
        const BuildNotification = `
            <div class="notification-icon">
                <img src="${iconPath}" alt="icon">
            </div>
            <div class="notification-content">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
            <button class="notification-close">×</button>
        `
        notification.innerHTML = BuildNotification
        notification.querySelector(".notification-close").addEventListener("click", () => {
            this.closeNotification(notification)
        })
        this.panel.appendChild(notification)
        setTimeout(() => this.closeNotification(notification), duration)
    }

    closeNotification(notification) {
        notification.classList.add("fade-out")
        setTimeout(() => {
            notification.remove()
        }, 300)
    }
}

class NetworkManager {
    static async get(url, callback) {
        try {
            const res = await fetch(url);
            const ct = res.headers.get("content-type") || "";
            let out;
            if (ct.includes("application/json")) out = await res.json();
            else if (ct.startsWith("text/")) out = await res.text();
            else out = new Uint8Array(await res.arrayBuffer());
            if (isFunction(callback)) callback(out);
            return out;
        } catch (e) {
            console.error("GET failed:", e);
            if (isFunction(callback)) callback(1001);
            return 1001;
        }
    }

    static async post(url, data, callback, headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }) {
        try {
            const res = await fetch(url, {
                method: "POST",
                headers,
                body: data
            });
            const ct = res.headers.get("content-type") || "";
            const out = ct.includes("application/json") ? await res.json() : await res.text();
            if (isFunction(callback)) callback(out);
            return out;
        } catch (e) {
            console.error("POST failed:", e);
            if (isFunction(callback)) callback(null);
            return null;
        }
    }
}

class Fetch {
    static defaultOptions = {
        timeoutMs: 8000,
        retries: 1,
        allowProxy: false,
        proxyOrigin: (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '',
        proxyPath: '/DataCenter/proxy?uri=',
        fetchInit: {},
        backoffBaseMs: 200,
        attachRequestId: true,
    };

    static _sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    static _now() {
        return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    }
    static _mergeHeaders(base = {}, extra = {}) {
        const h = new Headers(base);
        if (extra instanceof Headers) {
            extra.forEach((v, k) => h.set(k, v));
        } else Object.entries(extra || {}).forEach(([k, v]) => h.set(k, v));
        return h;
    }
    static _createTimeoutController(timeoutMs, externalSignal) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        if (externalSignal) {
            if (externalSignal.aborted) {
                clearTimeout(timer);
                controller.abort();
            } else {
                const onAbort = () => {
                    clearTimeout(timer);
                    controller.abort();
                    externalSignal.removeEventListener?.('abort', onAbort);
                };
                externalSignal.addEventListener?.('abort', onAbort);
            }
        }
        return {
            controller,
            clear: () => clearTimeout(timer)
        };
    }

    static async _fetchOnce(fullUrl, init = {}, timeoutMs) {
        const externalSignal = init.signal;
        const initClone = {
            ...init
        };
        delete initClone.signal;
        const {
            controller,
            clear
        } = this._createTimeoutController(timeoutMs, externalSignal);
        initClone.signal = controller.signal;
        try {
            const resp = await fetch(fullUrl, initClone);
            clear();
            return resp;
        } catch (err) {
            clear();
            if (err instanceof TypeError && /failed to fetch/i.test(err.message || '')) {
                const e = new Error(`Network/Fetch failure for ${fullUrl}: ${err.message}`);
                e.code = 'FETCH_TYPEERROR';
                throw e;
            }
            throw err;
        }
    }

    static async _parseResponse(resp, url) {
        if (!resp) throw new Error(`No response from ${url}`);
        if (resp.type === 'opaque') {
            const e = new Error(`Opaque response from ${url} (probable CORS)`);
            e.code = 'OPAQUE_RESPONSE';
            throw e;
        }
        if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            const e = new Error(`HTTP ${resp.status} from ${url} - ${txt}`);
            e.status = resp.status;
            e.rawText = txt;
            throw e;
        }
        const text = await resp.text().catch(() => null);
        if (text === null) throw new Error(`Failed to read body from ${url}`);
        try {
            return JSON.parse(text);
        } catch (err) {
            const e = new Error(`Invalid JSON from ${url} — snippet: ${text.slice(0,300)}`);
            e.raw = text;
            throw e;
        }
    }

    static async fetchJson(url, opts = {}) {
        const o = {
            ...this.defaultOptions,
            ...opts
        };
        const start = this._now();
        const meta = {
            via: null,
            latencyMs: null,
            attempts: {
                direct: 0,
                proxy: 0
            },
            errors: {
                direct: null,
                proxy: null
            }
        };

        // prepare headers
        let fetchInit = {
            ...(o.fetchInit || {})
        };
        const headers = this._mergeHeaders(fetchInit.headers || {}, {});
        if (o.attachRequestId && o.useRequestId !== false) {
            // attachRequestId defaults true; caller can pass useRequestId:false in opts to disable
            const rid = 'rid-' + Math.random().toString(36).slice(2, 10);
            // Only attach for same-origin direct requests; we'll avoid adding header for cross-origin direct
            fetchInit._requestId = rid;
        }
        fetchInit.headers = headers;

        const attemptDirect = async () => {
            for (let attempt = 0; attempt <= o.retries; attempt++) {
                meta.attempts.direct = attempt + 1;
                try {
                    // decide whether to include X-Request-ID for direct: only if same-origin
                    const targetOrigin = (() => {
                        try {
                            return new URL(url).origin
                        } catch {
                            return null
                        }
                    })();
                    const isSame = targetOrigin && targetOrigin === (typeof window !== 'undefined' ? window.location.origin : targetOrigin);
                    const headersClone = this._mergeHeaders(fetchInit.headers || {}, {});
                    if (fetchInit._requestId && isSame && o.attachRequestId && o.useRequestId !== false) headersClone.set('X-Request-ID', fetchInit._requestId);
                    const initForThis = {
                        ...fetchInit,
                        headers: headersClone
                    };
                    const resp = await this._fetchOnce(url, initForThis, o.timeoutMs);
                    const data = await this._parseResponse(resp, url);
                    meta.via = 'direct';
                    meta.latencyMs = Math.round(this._now() - start);
                    return {
                        data,
                        meta
                    };
                } catch (err) {
                    meta.errors.direct = err;
                    if (attempt >= o.retries) throw err;
                    const backoff = o.backoffBaseMs * (2 ** attempt);
                    await this._sleep(backoff);
                }
            }
        };

        const attemptProxy = async () => {
            if (!o.allowProxy) {
                const e = new Error('Proxy disabled and direct fetch failed.');
                e.code = 'PROXY_DISABLED';
                throw e;
            }
            const origin = o.proxyOrigin || (typeof window !== 'undefined' && window.location?.origin) || '';
            const proxied = `${origin}${o.proxyPath}${encodeURIComponent(url)}`;
            for (let attempt = 0; attempt <= o.retries; attempt++) {
                meta.attempts.proxy = attempt + 1;
                try {
                    // when calling proxy, attach X-Request-ID if one exists
                    const headersClone = this._mergeHeaders(fetchInit.headers || {}, {});
                    if (fetchInit._requestId && o.attachRequestId && o.useRequestId !== false) headersClone.set('X-Request-ID', fetchInit._requestId);
                    const initForThis = {
                        ...fetchInit,
                        headers: headersClone
                    };
                    const resp = await this._fetchOnce(proxied, initForThis, o.timeoutMs);
                    const data = await this._parseResponse(resp, proxied);
                    meta.via = 'proxy';
                    meta.latencyMs = Math.round(this._now() - start);
                    return {
                        data,
                        meta
                    };
                } catch (err) {
                    meta.errors.proxy = err;
                    if (attempt >= o.retries) throw err;
                    const backoff = o.backoffBaseMs * (2 ** attempt);
                    await this._sleep(backoff);
                }
            }
        };

        try {
            return await attemptDirect();
        } catch (directErr) {
            try {
                return await attemptProxy();
            } catch (proxyErr) {
                const e = new Error(`Fetch failed. Direct: ${directErr.message}; Proxy: ${proxyErr.message}`);
                e.directError = directErr;
                e.proxyError = proxyErr;
                e.meta = meta;
                throw e;
            }
        }
    }

    // alias y conveniencia
    static Json(url, opts = {}) {
        return this.fetchJson(url, opts);
    }
    static async fetchData(url, opts = {}) {
        const r = await this.fetchJson(url, opts);
        return r.data;
    }
}

class ExtraTools {
    static formatBytes(bytes, decimals = 2) {
        if (!bytes) return "0 Bytes"
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
    }

    static getMemoryUsage() {
        if (window.performance && performance.memory) {
            const memory = performance.memory
            const usedJSHeapSizeMB = (memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)
            const totalJSHeapSizeMB = (memory.totalJSHeapSize / (1024 * 1024)).toFixed(2)
            const jsHeapSizeLimitMB = (memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)
            return {
                usedMB: usedJSHeapSizeMB,
                totalMB: totalJSHeapSizeMB,
                limitMB: jsHeapSizeLimitMB,
            }
        }
        return null
    }

    static getTimestampString() {
        return new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").split("Z")[0]
    }

    static getMimeTypeFromExtension(path) {
        const extension = path.split(".").pop().toLowerCase()
        const mimeTypes = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            mp3: "audio/mpeg",
            wav: "audio/wav",
            ogg: "audio/ogg",
            mp4: "video/mp4",
            webm: "video/webm",
            mkv: "video/x-matroska",
            pdf: "application/pdf",
            json: "application/json",
            txt: "text/plain",
            zip: "application/zip",
            rar: "application/vnd.rar",
        }
        return mimeTypes[extension] || "application/octet-stream"
    }

    static SendNotifications(content = {}) {
        if (!("Notification" in window)) return;
        Notification.requestPermission().then((perm) => {
            if (perm !== "granted") return;
            const n = new Notification(content.title, {
                body: content.message,
                icon: content.icon
            });
            n.onclick = (event) => {
                if (content.preventDefault) event.preventDefault();
                if (isFunction(content.callback)) content.callback();
                else {
                    window.focus();
                    n.close();
                }
            };
        });
    }

    static FullScreenToggle() {
        const doc = document;
        const el = doc.documentElement;
        if (!doc.fullscreenElement) {
            (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el);
        } else {
            (doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen)?.call(doc);
        }
    }
}

class PasswordHasher {
    constructor(saltLength = 16) {
        this.saltLength = saltLength
    }

    #generateSalt() {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        let salt = ""
        for (let i = 0; i < this.saltLength; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length)
            salt += characters[randomIndex]
        }
        return salt
    }

    hash(password) {
        const salt = this.#generateSalt()
        const hash = this.#simpleHash(password + salt)
        return {
            hash,
            salt
        }
    }

    verify(password, storedHash, storedSalt) {
        const hash = this.#simpleHash(password + storedSalt)
        return hash === storedHash
    }

    #simpleHash(data) {
        let hash = 0,
            i,
            chr
        for (i = 0; i < data.length; i++) {
            chr = data.charCodeAt(i)
            hash = (hash << 5) - hash + chr
            hash |= 0
        }
        return hash.toString(16)
    }
}

//-------------------- Tools -------------------
class Zip {
    constructor() {
        this.files = new Map()
    }

    async addFile(name, data) {
        if (typeof data === "string") {
            data = new TextEncoder().encode(data)
        } else if (data instanceof Blob) {
            data = new Uint8Array(await data.arrayBuffer())
        }
        this.files.set(name, data)
    }

    async generateZip() {
        const encoder = new TextEncoder()
        const fileData = []
        const directoryEntries = []
        let offset = 0

        function crc32(buffer) {
            const table = new Uint32Array(256)
            for (let i = 0; i < 256; i++) {
                let c = i
                for (let j = 0; j < 8; j++) {
                    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
                }
                table[i] = c
            }
            let crc = 0xffffffff
            for (let i = 0; i < buffer.length; i++) {
                crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xff]
            }
            return (crc ^ 0xffffffff) >>> 0
        }

        for (const [name, data] of this.files.entries()) {
            const nameBytes = encoder.encode(name)
            const crc = crc32(data)
            const size = data.length
            const header = new Uint8Array(30 + nameBytes.length)
            header.set([0x50, 0x4b, 0x03, 0x04])
            header.set([20, 0], 4)
            header.set([0, 0], 6)
            header.set([0, 0], 8)
            header.set([0, 0, 0, 0], 10)
            header.set([crc & 0xff, (crc >> 8) & 0xff, (crc >> 16) & 0xff, (crc >> 24) & 0xff], 14)
            header.set([size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff], 18)
            header.set([size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff], 22)
            header.set([nameBytes.length & 0xff, (nameBytes.length >> 8) & 0xff], 26)
            header.set(nameBytes, 30)
            fileData.push(header, data)
            const fileOffset = offset
            offset += header.length + data.length
            const centralHeader = new Uint8Array(46 + nameBytes.length)
            centralHeader.set([0x50, 0x4b, 0x01, 0x02])
            centralHeader.set([20, 0], 4)
            centralHeader.set([20, 0], 6)
            centralHeader.set([0, 0], 8)
            centralHeader.set([0, 0], 10)
            centralHeader.set([0, 0, 0, 0], 12)
            centralHeader.set([crc & 0xff, (crc >> 8) & 0xff, (crc >> 16) & 0xff, (crc >> 24) & 0xff], 16)
            centralHeader.set([size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff], 20)
            centralHeader.set([size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff], 24)
            centralHeader.set([nameBytes.length & 0xff, (nameBytes.length >> 8) & 0xff], 28)
            centralHeader.set([0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 30)
            centralHeader.set(
                [fileOffset & 0xff, (fileOffset >> 8) & 0xff, (fileOffset >> 16) & 0xff, (fileOffset >> 24) & 0xff],
                42,
            )
            centralHeader.set(nameBytes, 46)
            directoryEntries.push(centralHeader)
        }

        const directoryOffset = offset
        const directorySize = directoryEntries.reduce((sum, entry) => sum + entry.length, 0)
        const endOfCentralDir = new Uint8Array(22)
        endOfCentralDir.set([0x50, 0x4b, 0x05, 0x06])
        endOfCentralDir.set([0, 0], 4)
        endOfCentralDir.set([0, 0], 6)
        endOfCentralDir.set([this.files.size & 0xff, (this.files.size >> 8) & 0xff], 8)
        endOfCentralDir.set([this.files.size & 0xff, (this.files.size >> 8) & 0xff], 10)
        endOfCentralDir.set(
            [directorySize & 0xff, (directorySize >> 8) & 0xff, (directorySize >> 16) & 0xff, (directorySize >> 24) & 0xff],
            12,
        )
        endOfCentralDir.set(
            [
                directoryOffset & 0xff,
                (directoryOffset >> 8) & 0xff,
                (directoryOffset >> 16) & 0xff,
                (directoryOffset >> 24) & 0xff,
            ],
            16,
        )
        const zipBlob = new Blob([...fileData, ...directoryEntries, endOfCentralDir], {
            type: "application/zip"
        })
        return zipBlob
    }

    getFile(name) {
        const data = this.files.get(name)
        if (!data) return null
        return new Blob([data], {
            type: "application/octet-stream"
        })
    }
}

class Scheduler {
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static delay(fn, ms) {
        return setTimeout(fn, ms);
    }

    static loop(fn, ms) {
        return setInterval(fn, ms);
    }

    static cancel(id) {
        clearTimeout(id);
        clearInterval(id);
    }
}

class PublicApis {
    static async NekoImg() {
        const url = "https://nekos.best/api/v2/neko";

        try {
            const {
                data,
                meta
            } = await Fetch.fetchJson(url, {
                timeoutMs: 7000,
                retries: 0,
                allowProxy: true,
                useRequestId: false
            });

            //console.log("Meta del fetch:", meta);
            return data.results[0] ?? data; // según la API
        } catch (err) {
            console.error("Error final en NekoImg:", err);
            return null;
        }
    }

    static async AnimeQuote() {
        const url = "https://api.animechan.io/v1/quotes/random";

        try {
            const {
                data,
                meta
            } = await Fetch.fetchJson(url, {
                timeoutMs: 7000,
                retries: 0,
                allowProxy: true,
                useRequestId: false
            });

            console.log("Meta del fetch:", meta);
            return data.results ?? data; // según la API
        } catch (err) {
            console.error("Error final en AnimeQuote:", err);
            return null;
        }
    }

    static async Affirmation() {
        const url = "https://www.affirmations.dev/";

        try {
            const {
                data,
                meta
            } = await Fetch.fetchJson(url, {
                timeoutMs: 7000,
                retries: 0,
                allowProxy: true,
                useRequestId: false
            });

            //console.log("Meta del fetch:", meta);
            return data.results ?? data; // según la API
        } catch (err) {
            console.error("Error final en AnimeQuote:", err);
            return null;
        }
    }

    static async PokeIndex(pokemon = "pikachu") {
        const url = "https://pokeapi.co/api/v2/pokemon";
        const pokemonLower = String(pokemon).toLowerCase()
        const xServr = `${url}/${pokemonLower}`;

        try {
            const {
                data,
                meta
            } = await Fetch.fetchJson(xServr, {
                timeoutMs: 7000,
                retries: 0,
                allowProxy: true,
                useRequestId: false
            });

            //console.log("Meta del fetch:", meta);
            return data.results ?? data; // según la API
        } catch (err) {
            console.error("Error final en AnimeQuote:", err);
            return null;
        }
    }
}

class ForeIndex{
    static _Server(id){
        if(!id) return;

        if(id === 'Curr'){
            return "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";
        }else if(id === 'Index'){
            return "https://query1.finance.yahoo.com/v8/finance/chart/";
        }
    }

    static async listCurrencies(){
        const url = `${ForeIndex._Server('Curr')}.json`;

        try {
            const {
                data,
                meta
            } = await Fetch.fetchJson(url, {
                timeoutMs: 7000,
                retries: 0,
                allowProxy: true,
                useRequestId: false
            });

            //console.log("Meta del fetch:", meta);
            return data.results ?? data; // según la API
        } catch (err) {
            console.error("Error final en List currency:", err);
            return null;
        }
    }

    static async currencieRates(currency = "usd"){
        const currencyLower = currency.toLowerCase()
        const url = `${ForeIndex._Server('Curr')}/${currency}.json`;

        try {
            const {
                data,
                meta
            } = await Fetch.fetchJson(url, {
                timeoutMs: 7000,
                retries: 0,
                allowProxy: true,
                useRequestId: false
            });

            //console.log("Meta del fetch:", meta);
            return data.results ?? data; // según la API
        } catch (err) {
            console.error("Error final en Currency Rates:", err);
            return null;
        }
    }

    static async convertCurrency(content = {}){
        const data = await ForeIndex.currencieRates(content.from.toLowerCase())
        const rate = data[content.from.toLowerCase()][content.to.toLowerCase()]

        if (!rate) {
            throw new Error(`No se encontró la tasa de cambio para ${content.to.toUpperCase()}`)
        }
        return {
            amount: content.amount,
            from: content.from.toUpperCase(),
            to: content.to.toUpperCase(),
            result: (content.amount * rate).toFixed(2),
            rate: rate.toFixed(4),
        }
    }

    static async MarketShare(content = {}){
        const index = content.index.toUpperCase();
        const range = content.range ?? '5d';
        const interval = content.interval ?? '5m';
        const details  = `${index}?range=${range}&interval=${interval}`;
        const Xprobe = `${ForeIndex._Server('Index')}${details}`;
        const serverX = `${window.origin}/DataCenter/proxy?uri=${Xprobe}`

        try {
            const {
                data,
                meta
            } = await Fetch.fetchJson(serverX, {
                timeoutMs: 7000,
                retries: 0,
                allowProxy: true,
                useRequestId: true
            });

            //console.log("Meta del fetch:", meta);
            return data.chart.result[0];// según la API
        } catch (err) {
            console.error("Error final en MarketShare:", err);
            return null;
        }
    }
}

class GeoLocationService {
    static #DEFAULT_CONFIG = {
        timeout: 7000,
        cacheTTL: 1000 * 60 * 60 * 6, // 6 horas
        forceRefresh: false
    };

    static #CACHE_KEY = 'geo_ip_cache_v1';

    static #ENDPOINTS = [{
            url: 'https://ipapi.co/json/',
            mapper: r => ({
                lat: r.latitude,
                lon: r.longitude,
                city: r.city,
                region: r.region,
                country: r.country_name,
                ip: r.ip,
                source: 'ipapi.co'
            })
        },
        {
            url: 'https://ipinfo.io/json',
            mapper: r => {
                const loc = (r.loc || '').split(',');
                return {
                    lat: loc[0],
                    lon: loc[1],
                    city: r.city,
                    region: r.region,
                    country: r.country,
                    ip: r.ip,
                    source: 'ipinfo.io'
                };
            }
        },
        {
            url: 'https://ipwho.is/',
            mapper: r => {
                if (!r.success) return null;
                return {
                    lat: r.latitude,
                    lon: r.longitude,
                    city: r.city,
                    region: r.region,
                    country: r.country,
                    ip: r.ip,
                    source: 'ipwho.is'
                };
            }
        }
    ];

    static async getUserLocation(config = {}) {
        const {
            timeout = this.#DEFAULT_CONFIG.timeout,
                cacheTTL = this.#DEFAULT_CONFIG.cacheTTL,
                forceRefresh = this.#DEFAULT_CONFIG.forceRefresh
        } = config;

        try {
            // Verificar cache primero
            const cachedData = this.#getCachedLocation(forceRefresh, cacheTTL);
            if (cachedData) return cachedData;
        } catch (e) {
            // Ignorar errores de localStorage
            console.debug('Cache error:', e.message);
        }

        // Intentar obtener ubicación de los endpoints
        const location = await this.#fetchLocationFromEndpoints(timeout);

        // Guardar en cache si se obtuvo una ubicación válida
        if (location) {
            this.#cacheLocation(location);
        }

        return location;
    }

    static #getCachedLocation(forceRefresh, cacheTTL) {
        if (forceRefresh) return null;

        const cached = localStorage.getItem(this.#CACHE_KEY);
        if (!cached) return null;

        const data = JSON.parse(cached);
        if (Date.now() - data.ts < cacheTTL) {
            return data.val;
        }

        return null;
    }

    static #cacheLocation(location) {
        try {
            const cacheData = {
                val: location,
                ts: Date.now()
            };
            localStorage.setItem(this.#CACHE_KEY, JSON.stringify(cacheData));
        } catch (e) {
            console.debug('Cache save error:', e.message);
        }
    }

    static async #fetchLocationFromEndpoints(timeout) {
        for (const endpoint of this.#ENDPOINTS) {
            try {
                const json = await this.#fetchWithTimeout(endpoint.url, timeout);
                const mapped = endpoint.mapper(json);

                if (mapped && mapped.lat && mapped.lon) {
                    mapped.lat = Number(mapped.lat);
                    mapped.lon = Number(mapped.lon);
                    return mapped;
                }
            } catch (err) {
                console.debug('IP geo fail', endpoint.url, err?.message || err);
            }
        }
        return null;
    }

    static async #fetchWithTimeout(url, ms) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ms);

        try {
            const response = await fetch(url, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} from ${url}`);
            }

            return await response.json();
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }

    // Métodos adicionales de utilidad
    static clearCache() {
        try {
            localStorage.removeItem(this.#CACHE_KEY);
            return true;
        } catch (e) {
            console.debug('Cache clear error:', e.message);
            return false;
        }
    }

    static getCacheInfo() {
        try {
            const cached = localStorage.getItem(this.#CACHE_KEY);
            if (!cached) return {
                exists: false
            };

            const data = JSON.parse(cached);
            return {
                exists: true,
                timestamp: data.ts,
                age: Date.now() - data.ts,
                data: data.val
            };
        } catch (e) {
            return {
                exists: false,
                error: e.message
            };
        }
    }

    static getEndpoints() {
        return this.#ENDPOINTS.map(ep => ({
            url: ep.url,
            source: ep.mapper({}).source // Obtener el nombre del source
        }));
    }

    static getDefaultConfig() {
        return {
            ...this.#DEFAULT_CONFIG
        };
    }
}

class DateTime {
    static Clock(format) {
        const tm = new Date();
        let H = tm.getHours();
        let M = tm.getMinutes();
        let S = tm.getSeconds();

        const pad = (n) => (n < 10 ? "0" + n : String(n));

        if (format === 12 || format === "12") {
            const et = H >= 12 ? "PM" : "AM";
            H = H % 12 || 12;
            return `${pad(H)}:${pad(M)} ${et}`;
        }
        if (format === "12S") {
            const et = H >= 12 ? "PM" : "AM";
            H = H % 12 || 12;
            return `${pad(H)}:${pad(M)}:${pad(S)} ${et}`;
        }
        if (format === "24S") {
            return `${pad(H)}:${pad(M)}:${pad(S)}`;
        }
        if (format === "raw") {
            return "0x" + $.Components.Tools.NumberToHEX(+tm, 2);
        }
        return `${pad(H)}:${pad(M)}`;
    }

    static Date(format) {
        if (!format) return;
        const now = new Date();
        const dd = now.getDate();
        const mm = now.getMonth(); // 0-11
        const yyyy = now.getFullYear();

        const pad = (n) => (n < 10 ? "0" + n : String(n));

        if (format === "ddd-dd-mm-yyyy_es") {
            const Dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
            const Mes = [
                "Ene",
                "Feb",
                "Mar",
                "Abr",
                "May",
                "Jun",
                "Jul",
                "Ago",
                "Sep",
                "Oct",
                "Nov",
                "Dic",
            ];
            return `${Dias[now.getDay()]} ${pad(dd)} de ${Mes[mm]} del ${yyyy}`;
        }

        if (format === "ddd-dd-mm-yyyy_en") {
            const Days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const Mon = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ];
            return `${Days[now.getDay()]} ${Mon[mm]} ${pad(dd)}, ${yyyy}`;
        }

        if (format === "dd-mm-yyyy") return `${pad(dd)}-${pad(mm + 1)}-${yyyy}`;
        if (format === "dd/mm/yyyy") return `${pad(dd)}/${pad(mm + 1)}/${yyyy}`;
        if (format === "mm-dd-yyyy") return `${pad(mm + 1)}-${pad(dd)}-${yyyy}`;
        if (format === "mm/dd/yyyy") return `${pad(mm + 1)}/${pad(dd)}/${yyyy}`;
    }

    static DayPercent() {
        const now = new Date();
        const passed = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400 * 100;
        const remain = 100 - passed;
        return {
            Day_Time_Passed: `${passed.toFixed(2)}%`,
            Day_Time_Left: `${remain.toFixed(2)}%`
        };
    }

    static YearPercent() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear() + 1, 0, 1);
        const totalDays = (end - start) / 86400000; // 365 o 366
        const elapsed = (now - start) / 86400000;
        const pct = (elapsed / totalDays) * 100;
        return {
            Year_Time_Passed: `${pct.toFixed(2)}%`,
            Year_Time_Left: `${(100 - pct).toFixed(2)}%`
        };
    }
}

class CacheControl {
    constructor(initial = {}) {
        // Snapshot inicial
        this.cache = {
            ...initial
        };
        // Puedes llevar un "hash" o firma rápida también
        this.signature = this.#makeSignature(initial);
    }

    // Genera una firma simple de los datos (string)
    #makeSignature(obj) {
        try {
            return JSON.stringify(obj);
        } catch {
            return String(obj);
        }
    }

    /**
     * Revisa si los datos nuevos son distintos de los que ya hay en cache
     * @param {object} data - Objeto nuevo
     * @returns {boolean} true si hay cambios, false si es igual
     */
    hasChanged(data) {
        const sig = this.#makeSignature(data);
        if (sig !== this.signature) {
            return true;
        }
        return false;
    }

    /**
     * Actualiza el cache si cambió y devuelve true si hubo update
     */
    update(data) {
        const sig = this.#makeSignature(data);
        if (sig !== this.signature) {
            this.cache = {
                ...data
            };
            this.signature = sig;
            return true; // hubo cambio
        }
        return false; // no hubo cambio
    }

    /**
     * Obtén un valor del cache
     */
    get(key) {
        return this.cache[key];
    }

    /**
     * Sobreescribe o agrega un valor en cache
     */
    set(key, value) {
        this.cache[key] = value;
        this.signature = this.#makeSignature(this.cache);
    }

    /**
     * Devuelve snapshot completo
     */
    snapshot() {
        return {
            ...this.cache
        };
    }
}

class UUID {
    static #PATTERNS = {
        V4: '4xxx', // Versión 4
        V3: '3xxx', // Versión 3
        V5: '5xxx', // Versión 5
        V7: '7xxx' // Versión 7
    };

    static #TEMPLATE = 'xxxxxxxx-xxxx-VERSION-yxxx-xxxxxxxxxxxx';

    static generate(version = 'V4') {
        if (!this.#PATTERNS[version]) {
            throw new Error(`Versión UUID no soportada: ${version}. Use: ${this.getSupportedVersions().join(', ')}`);
        }

        const versionPattern = this.#PATTERNS[version];
        const template = this.#TEMPLATE.replace('VERSION', versionPattern);

        return template.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const n = c === 'x' ? r : (r & 0x3) | 0x8;
            return n.toString(16);
        });
    }

    // Métodos específicos por versión
    static V4() {
        return this.generate('V4');
    }

    static V3() {
        return this.generate('V3');
    }

    static V5() {
        return this.generate('V5');
    }

    static V7() {
        return this.generate('V7');
    }

    // Métodos de utilidad
    static getSupportedVersions() {
        return Object.keys(this.#PATTERNS);
    }

    static isValidVersion(version) {
        return this.#PATTERNS.hasOwnProperty(version);
    }

    static getPattern(version) {
        return this.#PATTERNS[version] || null;
    }

    // Generar múltiples UUIDs
    static generateMultiple(count = 1, version = 'V4') {
        if (count <= 0) return [];

        const uuids = [];
        for (let i = 0; i < count; i++) {
            uuids.push(this.generate(version));
        }
        return uuids;
    }

    // Validar formato UUID (básico)
    static isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    // Obtener versión de un UUID existente
    static getVersion(uuid) {
        if (!this.isValidUUID(uuid)) return null;

        const versionChar = uuid.charAt(14);
        const versionMap = {
            '3': 'V3',
            '4': 'V4',
            '5': 'V5',
            '7': 'V7'
        };

        return versionMap[versionChar] || null;
    }
}

class Crypto {
    static B64Encode(str) {
        return (str == null ? undefined : btoa(str))
    }

    static B64Decode(str) {
        return (str == null ? undefined : atob(str))
    }

    static SnapLock(str) {
        return Array.from(str, (ch) => String.fromCharCode(ch.charCodeAt(0) + 123) + "$").join("")
    }

    static SnapUnlock(str) {
        return str.split("$").slice(0, -1).map((s) => String.fromCharCode(s.charCodeAt(0) - 123)).join("")
    }

    static AetherLock(str) {
        return Array.from(str, (c) => ("0" + c.charCodeAt(0).toString(16).toUpperCase()).slice(-2) + "‌‌ ").join("").trim()
    }

    static AetherUnlock(str) {
        return str.split("‌‌ ").map((h) => String.fromCharCode(parseInt(h, 16))).join("")
    }
}

class WebSpeech {
    static Text({
        message = "",
        voiceID = 0,
        volume = 1,
        pitch = 1,
        rate = 1
    } = {}) {
        if (!("speechSynthesis" in window)) return "Not supported";
        const speak = () => {
            const utt = new SpeechSynthesisUtterance(message);
            const voices = window.speechSynthesis.getVoices();
            utt.voice = voices[voiceID] || voices[0];
            utt.volume = volume;
            utt.pitch = pitch;
            utt.rate = rate;
            window.speechSynthesis.speak(utt);
        };
        if (window.speechSynthesis.getVoices().length) speak();
        else window.speechSynthesis.onvoiceschanged = speak;
    }

    static Speak(continuous, callback) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            console.error("SpeechRecognition not supported");
            return;
        }
        const rec = new SR();
        rec.lang = navigator.language || (navigator.languages && navigator.languages[0]) || "en";
        rec.continuous = !!continuous;
        rec.onresult = (e) => {
            const transcript = Array.from(e.results).map((r) => r[0].transcript).join(" ");
            if (isFunction(callback)) callback(transcript);
            else $.env.ts = transcript;
        };
        rec.start();
    }
}

class TaskUtils {
    static nextTick(fn) {
        return Promise.resolve().then(fn);
    }

    static raf(fn) {
        return requestAnimationFrame(fn);
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static throttle(fn, wait = 100) {
        let lastTime = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastTime >= wait) {
                lastTime = now;
                fn(...args);
            }
        };
    }

    static debounce(fn, wait = 120) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), wait);
        };
    }

    static async retry(operation, maxAttempts = 3, delayMs = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (attempt < maxAttempts) {
                    await this.delay(delayMs * attempt);
                }
            }
        }
        throw lastError;
    }
}

class Bind {
    static #subscriptions = new WeakMap();

    static observable(obj) {
        const subs = new Map();
        const proxy = new Proxy(obj, {
            set(target, key, value) {
                target[key] = value;
                subs.get(key)?.forEach(fn => fn(value, key));
                return true;
            },
            get(target, key) {
                if (key === '__subs') return subs;
                return target[key];
            }
        });

        this.#subscriptions.set(proxy, subs);
        return proxy;
    }

    static watch(model, key, callback) {
        const subs = this.#subscriptions.get(model);
        if (!subs) throw new Error('Model is not observable');

        const keySubs = subs.get(key) || new Set();
        keySubs.add(callback);
        subs.set(key, keySubs);

        return () => this.unwatch(model, key, callback);
    }

    static unwatch(model, key, callback) {
        const subs = this.#subscriptions.get(model);
        subs?.get(key)?.delete(callback);
    }

    static mountBindings(root = document) {
        const elements = root.querySelectorAll('[data-bind]');

        elements.forEach(element => {
            this.#bindElement(element);
        });
    }

    static #bindElement(element) {
        const rules = element.getAttribute('data-bind')
            .split(';')
            .map(s => s.trim())
            .filter(Boolean);

        const unsubs = [];

        rules.forEach(rule => {
            const [directive, path] = rule.split(':').map(s => s.trim());
            const [modelName, property] = path.split('.');

            const model = window.$.store?.get(modelName) || {};
            const observableModel = this.observable(model);

            // Initial binding
            this.#applyBinding(element, directive, observableModel, property);

            // Subscribe to changes
            const unsub = this.watch(observableModel, property, (value) => {
                this.#applyBinding(element, directive, {
                    [property]: value
                }, property);
            });

            unsubs.push(unsub);

            // Two-way binding for inputs
            if (directive === 'value' && element.tagName === 'INPUT') {
                element.addEventListener('input', (e) => {
                    observableModel[property] = e.target.value;
                    if (window.$.store) {
                        window.$.store.set(modelName, observableModel);
                    }
                });
            }
        });

        // Store unsubscribe functions
        element.__bindingUnsubs = unsubs;
    }

    static #applyBinding(element, directive, model, property) {
        const value = model[property] ?? '';

        switch (directive) {
            case 'text':
                element.textContent = value;
                break;
            case 'value':
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.value = value;
                }
                break;
            case 'html':
                element.innerHTML = value;
                break;
            case 'show':
                element.style.display = value ? '' : 'none';
                break;
            case 'hide':
                element.style.display = value ? 'none' : '';
                break;
        }
    }

    static unmountBindings(root = document) {
        const elements = root.querySelectorAll('[data-bind]');
        elements.forEach(element => {
            if (element.__bindingUnsubs) {
                element.__bindingUnsubs.forEach(unsub => unsub());
                delete element.__bindingUnsubs;
            }
        });
    }
}

//------------ Multimedia -------------
// Colorize V2
// Colorize
class ColorizeV2 {
    constructor(options = {}) {
        this.colorLimit = options.colorLimit || 5; // Número de colores dominantes
        this.precision = options.precision || 50; // Precisión de agrupación de color
    }

    // Método principal para extraer colores dominantes de una imagen
    extractColors(imageSource, callback, isUrl = false) {
        if (isUrl) {
            this.loadImageFromUrl(imageSource)
                .then((img) => this.processImage(img, callback))
                .catch((error) => {
                    console.error("Error al cargar la imagen desde URL:", error);
                });
        } else {
            this.loadImage(imageSource)
                .then((img) => this.processImage(img, callback))
                .catch((error) => {
                    console.error("Error al cargar la imagen:", error);
                });
        }
    }

    // Cargar imagen desde un archivo
    loadImage(imageFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => resolve(img);
                img.onerror = reject;
            };
            reader.readAsDataURL(imageFile);
        });
    }

    // Cargar imagen desde una URL
    loadImageFromUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    }

    // Procesar la imagen y extraer los colores
    processImage(img, callback) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;
        const colorCount = {};

        // Recorrer los píxeles y contar los colores
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // Redondear para agrupar colores similares
            const color = `${Math.round(r / this.precision) * this.precision},${Math.round(g / this.precision) * this.precision},${Math.round(b / this.precision) * this.precision}`;

            colorCount[color] = (colorCount[color] || 0) + 1;
        }

        // Ordenar colores por frecuencia y obtener los más comunes
        const sortedColors = Object.entries(colorCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.colorLimit)
            .map(([color]) => color.split(',').map(Number));

        // Ejecutar callback con los colores obtenidos
        if (callback && typeof callback === 'function') {
            const UI = {
                "Colors": sortedColors,
                "TextColor": this.#ColorizeText(sortedColors[0])
            };

            callback(UI);
        }
    }

    // Colorize Text Algorithm
    #ColorizeText = (r, g, b) => {
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        return luma > 128 ? '#000000' : '#FFFFFF';
    }
}

class ColorizeV3 {
    constructor(options = {}) {
        this.colorLimit = options.colorLimit || 5; // Número de colores dominantes
        this.precision = options.precision || 50; // Precisión de agrupación de color
        this.paletteSize = options.paletteSize || 5; // Tamaño de la paleta para cada color
    }

    // Método principal para extraer colores dominantes de una imagen
    extractColors(imageFile, callback) {
        this.loadImage(imageFile)
            .then((img) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);

                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const pixels = imageData.data;
                const colorCount = {};

                // Recorrer los píxeles y contar los colores
                for (let i = 0; i < pixels.length; i += 4) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];

                    // Redondear para agrupar colores similares
                    const color = `${Math.round(r / this.precision) * this.precision},${Math.round(g / this.precision) * this.precision},${Math.round(b / this.precision) * this.precision}`;

                    colorCount[color] = (colorCount[color] || 0) + 1;
                }

                // Ordenar colores por frecuencia y obtener los más comunes
                const sortedColors = Object.entries(colorCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, this.colorLimit)
                    .map(([color]) => color.split(',').map(Number));

                // Generar paletas y determinar el color del texto para cada color
                const results = sortedColors.map((color) => {
                    const palette = this.generatePalette(color, this.paletteSize);
                    const textColor = this.#ColorizeText(...color); // Decidir el color del texto
                    return {
                        color, // Color dominante
                        palette, // Paleta generada
                        textColor // Color del texto basado en el color dominante
                    };
                });

                // Ejecutar callback con los resultados
                if (callback && typeof callback === 'function') {
                    let UI = {
                        Colors: results
                    };

                    callback(UI);
                }
            })
            .catch((error) => {
                console.error("Error al cargar la imagen:", error);
            });
    }

    // Colorize Text Algorithm
    #ColorizeText = (r, g, b) => {
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        return luma > 128 ? '#000000' : '#FFFFFF';
    }

    // Método para cargar la imagen desde un archivo
    loadImage(imageFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => resolve(img);
                img.onerror = reject;
            };
            reader.readAsDataURL(imageFile);
        });
    }

    // Generar una paleta de colores basados en el color original
    generatePalette(baseColor, size) {
        const [r, g, b] = baseColor;
        const palette = [];

        for (let i = 1; i <= size; i++) {
            const factor = i / (size + 1); // Fracción para variar los colores
            palette.push([
                Math.min(255, Math.max(0, r + factor * 50)), // Ajuste en el rango 0-255
                Math.min(255, Math.max(0, g + factor * 50)),
                Math.min(255, Math.max(0, b + factor * 50))
            ]);
        }

        return palette;
    }
}

class ColorizeV4 {
    constructor(options = {}) {
        // Configuración
        this.colorLimit = options.colorLimit ?? 5;
        this.paletteSize = options.paletteSize ?? 5;
        this.sampleStep = options.sampleStep ?? 4;
        this.maxDimension = options.maxDimension ?? 800;
        this.quantizeBits = options.quantizeBits ?? 5;
        this.refineIterations = options.refineIterations ?? 2;
        this.debug = options.debug ?? false;
        this.defaultMime = options.defaultMime ?? 'image/png'; // usado si base64 no tiene prefijo
    }

    // Public: acepta File/Blob, ArrayBuffer, base64 string (con/sin data:), URL string, o <img> element
    async extractColors(input) {
        const img = (input instanceof HTMLImageElement) ? input : await this.loadImage(input);
        const { canvas, ctx, width, height } = this._prepareCanvas(img);
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        // Muestreo + conteo con cuantización
        const buckets = new Map();
        const sampled = [];
        for (let i = 0; i < pixels.length; i += 4 * this.sampleStep) {
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
            if (a === 0) continue;
            const q = this._quantize(r, g, b);
            buckets.set(q.key, (buckets.get(q.key) || 0) + 1);
            sampled.push({ r, g, b, key: q.key });
        }

        let candidates = Array.from(buckets.entries())
            .map(([key, count]) => ({ key, count, rgb: this._dequantize(key) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, Math.max(this.colorLimit * 3, 10));

        for (let iter = 0; iter < this.refineIterations; iter++) {
            const groups = candidates.map(c => ({ sumR: 0, sumG: 0, sumB: 0, n: 0, key: c.key }));
            for (const s of sampled) {
                let bestIdx = 0;
                let bestDist = Infinity;
                for (let i = 0; i < candidates.length; i++) {
                    const cr = candidates[i].rgb[0], cg = candidates[i].rgb[1], cb = candidates[i].rgb[2];
                    const d = (s.r - cr) ** 2 + (s.g - cg) ** 2 + (s.b - cb) ** 2;
                    if (d < bestDist) { bestDist = d; bestIdx = i; }
                }
                groups[bestIdx].sumR += s.r;
                groups[bestIdx].sumG += s.g;
                groups[bestIdx].sumB += s.b;
                groups[bestIdx].n += 1;
            }
            candidates = groups
                .filter(g => g.n > 0)
                .map(g => ({
                    key: g.key,
                    count: g.n,
                    rgb: [
                        Math.round(g.sumR / g.n),
                        Math.round(g.sumG / g.n),
                        Math.round(g.sumB / g.n)
                    ]
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, this.colorLimit);
        }

        const results = candidates.map(c => {
            const rgb = c.rgb;
            const hex = this._rgbToHex(...rgb);
            const palette = this._generatePaletteHSL(rgb, this.paletteSize);
            const textColor = this.#bestTextColor(...rgb);
            return {
                rgb,
                hex,
                population: c.count,
                palette,
                textColor
            };
        });

        if (this.debug) console.log('ColorizeV4 results', results);
        return { Colors: results, meta: { width: img.width, height: img.height } };
    }

    // ------------------------
    // Cargar imagen desde múltiples fuentes
    // ------------------------
    async loadImage(source) {
        // 1) HTMLImageElement
        if (source instanceof HTMLImageElement) {
            if (source.complete && source.naturalWidth !== 0) return source;
            return new Promise((resolve, reject) => {
                source.onload = () => resolve(source);
                source.onerror = reject;
            });
        }

        // 2) File or Blob
        if (source instanceof Blob || (typeof File !== 'undefined' && source instanceof File)) {
            return this._imageFromBlob(source);
        }

        // 3) ArrayBuffer or typed array
        if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
            const buffer = source instanceof ArrayBuffer ? source : source.buffer;
            const blob = new Blob([buffer], { type: this.defaultMime });
            return this._imageFromObjectUrl(blob);
        }

        // 4) String: could be URL, data:, or raw base64
        if (typeof source === 'string') {
            const s = source.trim();

            // a) data URL (data:image/...)
            if (s.startsWith('data:')) {
                return this._imageFromDataUrl(s);
            }

            // b) http/https URL
            if (/^https?:\/\//i.test(s)) {
                return this._imageFromUrl(s);
            }

            // c) probable bare base64 (no data: prefix) => build data URL with defaultMime
            // Detect base64 using regex: base64 chars and optional padding
            const base64Regex = /^[A-Za-z0-9+/=\s]+$/;
            const maybeBase64 = s.replace(/\s+/g, ''); // remove whitespace
            if (base64Regex.test(maybeBase64) && maybeBase64.length % 4 === 0) {
                const dataUrl = `data:${this.defaultMime};base64,${maybeBase64}`;
                return this._imageFromDataUrl(dataUrl);
            }

            // Otherwise assume it's a relative URL/path; attempt to load it
            return this._imageFromUrl(s);
        }

        throw new Error('Unsupported image source type');
    }

    // Helpers for loadImage
    _imageFromBlob(blob) {
        // Use FileReader to get DataURL (works cross-origin-safe for canvas)
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this._imageFromDataUrl(e.target.result).then(resolve).catch(reject);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    _imageFromDataUrl(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    _imageFromObjectUrl(blob) {
        const url = URL.createObjectURL(blob);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = (err) => {
                URL.revokeObjectURL(url);
                reject(err);
            };
            img.src = url;
        });
    }

    _imageFromUrl(url) {
        // Try to set crossOrigin; if server forbids CORS, getting imageData will fail.
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = (err) => {
                // Fallback: try again without crossOrigin (may taint canvas)
                const img2 = new Image();
                img2.onload = () => resolve(img2);
                img2.onerror = () => reject(err);
                img2.src = url;
            };
            img.src = url;
        });
    }

    // ------------------------
    // Resto de helpers (mismo que antes)
    // ------------------------
    _prepareCanvas(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let width = img.width, height = img.height;
        const max = this.maxDimension;
        if (Math.max(width, height) > max) {
            const scale = max / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        return { canvas, ctx, width, height };
    }

    _quantize(r, g, b) {
        const bits = Math.max(1, Math.min(8, this.quantizeBits));
        const shift = 8 - bits;
        const qr = r >> shift;
        const qg = g >> shift;
        const qb = b >> shift;
        const key = (qr << (bits * 2)) | (qg << bits) | qb;
        return { key: key.toString(), qr, qg, qb };
    }

    _dequantize(keyStr) {
        const key = parseInt(keyStr, 10);
        const bits = Math.max(1, Math.min(8, this.quantizeBits));
        const mask = (1 << bits) - 1;
        const qb = key & mask;
        const qg = (key >> bits) & mask;
        const qr = (key >> (bits * 2)) & mask;
        const shift = 8 - bits;
        const r = Math.min(255, (qr << shift) + (1 << (shift - 1) || 0));
        const g = Math.min(255, (qg << shift) + (1 << (shift - 1) || 0));
        const b = Math.min(255, (qb << shift) + (1 << (shift - 1) || 0));
        return [r, g, b];
    }

    _generatePaletteHSL([r, g, b], size) {
        const [h, s, l] = this._rgbToHsl(r, g, b);
        const palette = [];
        const steps = Math.ceil(size / 2);
        for (let i = 1; i <= steps; i++) {
            const factor = i / (steps + 1);
            const lLight = Math.min(1, l + factor * (1 - l));
            const rgbLight = this._hslToRgb(h, s, lLight);
            palette.push({ rgb: rgbLight, hex: this._rgbToHex(...rgbLight) });
            if (palette.length < size) {
                const lDark = Math.max(0, l - factor * l);
                const rgbDark = this._hslToRgb(h, s, lDark);
                palette.push({ rgb: rgbDark, hex: this._rgbToHex(...rgbDark) });
            }
        }
        return palette.slice(0, size);
    }

    _rgbToHex(r, g, b) {
        const toHex = n => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    }

    _rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    }

    _hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    #relativeLuminance = (r, g, b) => {
        const srgb = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    }

    #contrastRatio = (rgbA, rgbB) => {
        const L1 = this.#relativeLuminance(...rgbA);
        const L2 = this.#relativeLuminance(...rgbB);
        const lighter = Math.max(L1, L2);
        const darker = Math.min(L1, L2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    #bestTextColor = (r, g, b) => {
        const black = [0, 0, 0], white = [255, 255, 255];
        const ratioBlack = this.#contrastRatio([r, g, b], black);
        const ratioWhite = this.#contrastRatio([r, g, b], white);
        const target = 4.5;
        if (ratioBlack >= target || ratioWhite >= target) {
            return (ratioBlack > ratioWhite) ? '#000000' : '#FFFFFF';
        }
        return (ratioBlack > ratioWhite) ? '#000000' : '#FFFFFF';
    }
}
// Audio Metadata ID3v2
class AudioMetadataReader {
    constructor(file) {
        this.file = file;
    }

    async readMetadata() {
        return new Promise((resolve, reject) => {
            if (!this.file) {
                reject("No file provided");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const arrayBuffer = event.target.result;
                const dataView = new DataView(arrayBuffer);

                if (this.isID3v2Tag(dataView)) {
                    resolve({
                        version: "ID3v2",
                        metadata: this.extractID3v2Tags(dataView),
                    });
                } else if (this.isID3v1Tag(dataView)) {
                    resolve({
                        version: "ID3v1",
                        metadata: this.extractID3v1Tags(dataView),
                    });
                } else {
                    reject("No ID3 metadata found");
                }
            };

            reader.onerror = () => reject("Error reading file");
            reader.readAsArrayBuffer(this.file);
        });
    }

    isID3v2Tag(dataView) {
        return (
            dataView.getUint8(0) === 0x49 &&
            dataView.getUint8(1) === 0x44 &&
            dataView.getUint8(2) === 0x33
        );
    }

    isID3v1Tag(dataView) {
        const tagOffset = dataView.byteLength - 128;
        return (
            dataView.getUint8(tagOffset) === 0x54 &&
            dataView.getUint8(tagOffset + 1) === 0x41 &&
            dataView.getUint8(tagOffset + 2) === 0x47
        );
    }

    extractID3v2Tags(dataView) {
        let tags = {
            title: "Unknown",
            artist: "Unknown",
            album: "Unknown",
            year: "Unknown",
            cover: null
        };
        let position = 10;

        while (position < dataView.byteLength) {
            const frameID = this.readString(dataView, position, 4);
            if (!/^[A-Z0-9]{3,4}$/.test(frameID)) break; // Evita leer basura

            let frameSize = dataView.getUint32(position + 4, false);
            if (frameSize & 0x80808080) {
                frameSize = ((frameSize & 0x7F000000) >> 3) |
                    ((frameSize & 0x007F0000) >> 2) |
                    ((frameSize & 0x00007F00) >> 1) |
                    (frameSize & 0x0000007F);
            }

            const frameDataStart = position + 10;
            if (frameSize <= 0 || frameDataStart + frameSize > dataView.byteLength) break;

            switch (frameID) {
                case "TIT2":
                    tags.title = this.readTextFrame(dataView, frameDataStart, frameSize);
                    break;
                case "TPE1":
                    tags.artist = this.readTextFrame(dataView, frameDataStart, frameSize);
                    break;
                case "TALB":
                    tags.album = this.readTextFrame(dataView, frameDataStart, frameSize);
                    break;
                case "TYER":
                    tags.year = this.readTextFrame(dataView, frameDataStart, frameSize);
                    break;
                case "APIC":
                    tags.cover = this.readPictureFrame(dataView, frameDataStart, frameSize);
                    break;
            }
            position += 10 + frameSize;
        }
        return tags;
    }


    isID3v1Tag(dataView) {
        const tagOffset = dataView.byteLength - 128;
        if (tagOffset < 0) return false;

        return (
            dataView.getUint8(tagOffset) === 0x54 && // T
            dataView.getUint8(tagOffset + 1) === 0x41 && // A
            dataView.getUint8(tagOffset + 2) === 0x47 // G
        );
    }


    readTextFrame(dataView, offset, length) {
        const encoding = dataView.getUint8(offset);
        let textBuffer = new Uint8Array(dataView.buffer, offset + 1, length - 1);
        let decoder;

        switch (encoding) {
            case 0: // ISO-8859-1
                decoder = new TextDecoder("iso-8859-1");
                break;
            case 1: // UTF-16 (con posible BOM)
                if (textBuffer[0] === 0xFF && textBuffer[1] === 0xFE) {
                    decoder = new TextDecoder("utf-16le");
                    textBuffer = textBuffer.subarray(2); // Omitir BOM
                } else if (textBuffer[0] === 0xFE && textBuffer[1] === 0xFF) {
                    decoder = new TextDecoder("utf-16be");
                    textBuffer = textBuffer.subarray(2); // Omitir BOM
                } else {
                    decoder = new TextDecoder("utf-16le"); // Asumimos little-endian por defecto
                }
                break;
            case 3: // UTF-8
                decoder = new TextDecoder("utf-8");
                break;
            default:
                decoder = new TextDecoder("utf-8"); // Fallback a UTF-8
        }

        return decoder.decode(textBuffer).replace(/\0/g, "").trim();
    }


    readString(dataView, offset, length) {
        let text = "";
        for (let i = 0; i < length; i++) {
            const char = dataView.getUint8(offset + i);
            if (char === 0) break;
            text += String.fromCharCode(char);
        }
        return text;
    }

    readPictureFrame(dataView, offset, length) {
        let position = offset;

        // Leer el encoding
        const encoding = dataView.getUint8(position++);

        // Leer el MIME type
        let mimeType = "";
        while (dataView.getUint8(position) !== 0) mimeType += String.fromCharCode(dataView.getUint8(position++));
        position++; // Saltar el null terminator

        // Saltar la descripción (ignorarla)
        while (dataView.getUint8(position) !== 0) position++;
        position++; // Saltar el null terminator

        // Calcular tamaño real de la imagen
        let imageSize = length - (position - offset);
        if (imageSize <= 0 || position + imageSize > dataView.byteLength) {
            console.error("❌ Error: Tamaño de imagen inválido o fuera de rango.");
            return null;
        }

        // Leer los bytes de la imagen correctamente
        let imageData = new Uint8Array(dataView.buffer.slice(position, position + imageSize));

        // Detectar tipo real de imagen (por cabecera)
        if (imageData[0] === 0xFF && imageData[1] === 0xD8) {
            mimeType = "image/jpeg"; // JPEG
        } else if (imageData[0] === 0x89 && imageData[1] === 0x50) {
            mimeType = "image/png"; // PNG
        } else if (imageData[0] === 0x47 && imageData[1] === 0x49) {
            mimeType = "image/gif"; // GIF
        } else if (imageData[0] === 0x42 && imageData[1] === 0x4D) {
            mimeType = "image/bmp"; // BMP
        } else {
            console.warn("⚠️ Tipo de imagen desconocido, usando image/jpeg por defecto.");
            mimeType = "image/jpeg";
        }

        //console.log("✅ Extracción Correcta:", { mimeType, position, imageSize, finalPosition: position + imageSize });

        // Crear la URL del Blob
        return URL.createObjectURL(new Blob([imageData], {
            type: mimeType
        }));
    }
}

class AudioMetadataReaderBlob extends AudioMetadataReader {
    constructor(blob) {
        super(blob);
        if (!(blob instanceof Blob)) {
            throw new Error("Input must be a Blob");
        }
        this.blob = blob;
    }

    async readMetadata() {
        return new Promise((resolve, reject) => {
            if (!this.blob) {
                reject("No blob provided");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const arrayBuffer = event.target.result;
                const dataView = new DataView(arrayBuffer);

                if (this.isID3v2Tag(dataView)) {
                    const metadata = this.extractID3v2Tags(dataView);
                    resolve(metadata);
                } else {
                    reject("No ID3v2 metadata found");
                }
            };

            reader.onerror = () => reject("Error reading blob");
            reader.readAsArrayBuffer(this.blob); // Leemos el Blob directamente
        });
    }

    // Método para verificar si es un tag ID3v2
    isID3v2Tag(dataView) {
        return (
            dataView.getUint8(0) === 0x49 &&
            dataView.getUint8(1) === 0x44 &&
            dataView.getUint8(2) === 0x33
        );
    }

    // Método para extraer los metadatos ID3v2
    extractID3v2Tags(dataView) {
        let tags = {
            title: "Unknown Title",
            artist: "Unknown Artist",
            album: "Unknown Album",
            year: "Unknown Year",
            cover: null,
        };

        let position = 10; // Saltamos la cabecera ID3v2
        while (position < dataView.byteLength) {
            const frameID = this.readString(dataView, position, 4);
            const frameSize = dataView.getUint32(position + 4, false);
            const frameDataStart = position + 10;

            if (frameSize <= 0 || frameSize + frameDataStart > dataView.byteLength) break;

            switch (frameID) {
                case "TIT2":
                    tags.title = this.readTextFrame(dataView, frameDataStart, frameSize);
                    break;
                case "TPE1":
                    tags.artist = this.readTextFrame(dataView, frameDataStart, frameSize);
                    break;
                case "TALB":
                    tags.album = this.readTextFrame(dataView, frameDataStart, frameSize);
                    break;
                case "TYER":
                    tags.year = this.readTextFrame(dataView, frameDataStart, frameSize);
                    break;
                case "APIC":
                    tags.cover = this.readPictureFrame(dataView, frameDataStart, frameSize);
                    break;
            }

            position += 10 + frameSize;
        }

        return tags;
    }

    // Método auxiliar para leer frames de texto
    readTextFrame(dataView, offset, length) {
        const encoding = dataView.getUint8(offset);
        let text = "";

        if (encoding === 0) {
            text = this.readString(dataView, offset + 1, length - 1);
        } else {
            text = new TextDecoder("utf-16").decode(
                new Uint8Array(dataView.buffer, offset + 1, length - 1)
            );
        }

        return text.replace(/\0/g, "").trim();
    }

    // Método para leer una cadena de bytes
    readString(dataView, offset, length) {
        let text = "";
        for (let i = 0; i < length; i++) {
            const char = dataView.getUint8(offset + i);
            if (char === 0) break;
            text += String.fromCharCode(char);
        }
        return text;
    }

    // Método para leer el frame de la imagen (portada)
    readPictureFrame(dataView, offset, length) {
        let position = offset;
        const encoding = dataView.getUint8(position++);

        // Leer MIME Type
        let mimeType = "";
        while (dataView.getUint8(position) !== 0) {
            mimeType += String.fromCharCode(dataView.getUint8(position++));
        }
        position++; // Saltar byte nulo

        // Forzar tipo MIME válido si es incorrecto
        const validMimeType = mimeType.startsWith("image/") ? mimeType : "image/jpeg";

        // Saltar descripción (cadena terminada en 0x00)
        while (dataView.getUint8(position) !== 0) position++;
        position++;

        // Calcular tamaño de imagen
        const imageSize = length - (position - offset);

        // Validar si la imagen tiene un tamaño correcto
        if (imageSize <= 0 || position + imageSize > dataView.byteLength) {
            console.warn("Imagen inválida o tamaño incorrecto.");
            return null;
        }



        // Extraer imagen correctamente
        const imageData = new Uint8Array(dataView.buffer.slice(position, position + imageSize));

        // Prueba crear la imagen como un Blob
        const testBlob = new Blob([imageData], {
            type: validMimeType
        });

        // Prueba mostrar la imagen directamente en la página
        const testURL = URL.createObjectURL(testBlob);

        return URL.createObjectURL(new Blob([imageData], {
            type: validMimeType
        }));
    }
}

// Video Metadata
class VideoMetadataReader {
    constructor(videotag) {
        this.videoplayer = document.querySelector(videotag);
    }

    async read(file) {
        return new Promise((resolve, reject) => {
            if (!this.videoplayer) return reject("No se encontró el elemento de video.");

            this.videoplayer.onloadedmetadata = () => {
                const metadata = {
                    title: file.name,
                    duration: this.videoplayer.duration.toFixed(2) + " s",
                    resolution: this.videoplayer.videoWidth + "x" + this.videoplayer.videoHeight,
                    fps: this.videoplayer.frameRate || "Desconocido"
                };
                resolve(metadata);
            };

            this.videoplayer.onerror = () => reject("Error al cargar el video.");
        });
    }
}

// Image Metadata
class ImageMetadataReader {
    constructor(file) {
        this.file = file;
    }

    async readMetadata() {
        return new Promise((resolve, reject) => {
            if (!this.file) {
                reject("No file provided");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const arrayBuffer = event.target.result;
                const dataView = new DataView(arrayBuffer);

                const metadata = {
                    format: this.getFormat(),
                    size: this.file.size,
                    width: 0,
                    height: 0,
                    colorDepth: 24, // Estimado
                    EXIF: "Not Found",
                    exifData: {}
                };

                // Extraer dimensiones usando Image
                const img = new Image();
                img.onload = () => {
                    metadata.width = img.width;
                    metadata.height = img.height;

                    // Intentar extraer EXIF si es JPEG
                    if (metadata.format === "JPEG") {
                        const exif = this.extractEXIF(dataView);
                        if (exif) {
                            metadata.EXIF = "Found";
                            metadata.exifData = exif;
                        }
                    }

                    resolve(metadata);
                };
                img.onerror = () => reject("Error loading image.");
                img.src = URL.createObjectURL(this.file);
            };

            reader.onerror = () => reject("Error reading file");
            reader.readAsArrayBuffer(this.file);
        });
    }

    getFormat() {
        const type = this.file.type.toLowerCase();
        if (type.includes("jpeg")) return "JPEG";
        if (type.includes("png")) return "PNG";
        if (type.includes("gif")) return "GIF";
        if (type.includes("bmp")) return "BMP";
        if (type.includes("webp")) return "WebP";
        return "Unknown";
    }

    extractEXIF(dataView) {
        if (dataView.getUint16(0, false) !== 0xFFD8) return null; // No es JPEG

        let offset = 2;
        while (offset < dataView.byteLength) {
            if (dataView.getUint16(offset, false) === 0xFFE1) { // APP1 Marker (EXIF)
                return this.parseEXIF(dataView, offset + 4);
            }
            offset += 2 + dataView.getUint16(offset + 2, false);
        }
        return null;
    }

    parseEXIF(dataView, start) {
        const exifData = {};
        const littleEndian = dataView.getUint16(start) === 0x4949;
        const offset = start + 8;

        for (let i = 0; i < 12; i++) {
            const tag = dataView.getUint16(offset + i * 12, littleEndian);
            const valueOffset = offset + i * 12 + 8;

            switch (tag) {
                case 0x010F:
                    exifData["Camera Brand"] = this.readString(dataView, valueOffset, 20);
                    break;
                case 0x0110:
                    exifData["Camera Model"] = this.readString(dataView, valueOffset, 20);
                    break;
                case 0x9003:
                    exifData["Date Taken"] = this.readString(dataView, valueOffset, 20);
                    break;
                case 0x0112:
                    exifData["Orientation"] = dataView.getUint16(valueOffset, littleEndian);
                    break;
                case 0x8827:
                    exifData["ISO"] = dataView.getUint16(valueOffset, littleEndian);
                    break;
                case 0x829A:
                    exifData["Shutter Speed"] = dataView.getFloat32(valueOffset, littleEndian).toFixed(3);
                    break;
                case 0x829D:
                    exifData["Aperture"] = dataView.getFloat32(valueOffset, littleEndian).toFixed(3);
                    break;
            }
        }

        return exifData;
    }

    readString(dataView, offset, length) {
        let result = "";
        for (let i = 0; i < length; i++) {
            const char = dataView.getUint8(offset + i);
            if (char === 0) break;
            result += String.fromCharCode(char);
        }
        return result.trim();
    }
}

// Check if image is corrupted or not
class ImageValidator {
    static async isValidImage(blobUrl) {
        try {
            const response = await fetch(blobUrl);
            if (!response.ok) throw new Error("No se pudo obtener el Blob");

            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);

            return bitmap.width > 0 && bitmap.height > 0;
        } catch (error) {
            return false; // Si hay un error, la imagen es inválida o está corrupta
        }
    }
}

class VideoThumbnailGenerator {
    static async generateThumbnail(videoUrl, timeInSeconds = 1) {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.src = videoUrl;
            video.crossOrigin = "anonymous"; // Evita problemas con CORS
            video.muted = true; // Evita advertencias en algunos navegadores
            video.playsInline = true;

            video.addEventListener("loadeddata", () => {
                video.currentTime = Math.min(timeInSeconds, video.duration - 0.1);
            });

            video.addEventListener("seeked", () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                video.pause();

                resolve(canvas.toDataURL("image/png"));
            });

            video.onerror = () => reject("Error al cargar el video");
        });
    }
}

class AudioMixer {
    static #instances = new Map();

    static create(contextOptions = {}) {
        const context = new(window.AudioContext || window.webkitAudioContext)(contextOptions);
        const instance = new this(context);
        this.#instances.set(context, instance);
        return instance;
    }

    static getInstance(context) {
        return this.#instances.get(context);
    }

    constructor(context) {
        this.context = context;
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.tracks = new Map();
        this.effects = new Map();
        this.isSuspended = this.context.state === 'suspended';
    }

    async addTrack(name, source, options = {}) {
        if (this.tracks.has(name)) {
            throw new Error(`Track already exists: ${name}`);
        }

        const {
            loop = false, volume = 1.0, pan = 0
        } = options;
        const ctx = this.context;

        let sourceNode;
        let isMediaElement = false;

        if (source instanceof AudioBuffer) {
            sourceNode = ctx.createBufferSource();
            sourceNode.buffer = source;
            sourceNode.loop = loop;
        } else if (source instanceof HTMLMediaElement) {
            sourceNode = ctx.createMediaElementSource(source);
            isMediaElement = true;
        } else if (source instanceof MediaStream) {
            sourceNode = ctx.createMediaStreamSource(source);
        } else {
            throw new Error('Unsupported audio source type');
        }

        const gainNode = ctx.createGain();
        const panNode = ctx.createStereoPanner();

        gainNode.gain.value = volume;
        panNode.pan.value = pan;

        sourceNode.connect(panNode).connect(gainNode).connect(this.masterGain);

        const track = {
            name,
            source: sourceNode,
            gain: gainNode,
            pan: panNode,
            isMediaElement,
            isPlaying: false,
            startTime: 0,
            options
        };

        this.tracks.set(name, track);
        return track;
    }

    play(name, when = 0) {
        const track = this.tracks.get(name);
        if (!track) return false;

        if (track.isMediaElement) {
            track.source.mediaElement.play();
        } else if (track.source.start && !track.isPlaying) {
            track.source.start(this.context.currentTime + when);
        }

        track.isPlaying = true;
        track.startTime = this.context.currentTime + when;
        return true;
    }

    stop(name, when = 0) {
        const track = this.tracks.get(name);
        if (!track) return false;

        if (track.isMediaElement) {
            track.source.mediaElement.pause();
        } else if (track.source.stop) {
            try {
                track.source.stop(this.context.currentTime + when);
            } catch (e) {
                // Ignore stop errors
            }
        }

        track.isPlaying = false;
        return true;
    }

    setVolume(name, volume) {
        const track = this.tracks.get(name);
        if (track) {
            track.gain.gain.value = volume;
        }
    }

    setPan(name, pan) {
        const track = this.tracks.get(name);
        if (track) {
            track.pan.pan.value = Math.max(-1, Math.min(1, pan));
        }
    }

    fadeIn(name, duration = 1.0) {
        const track = this.tracks.get(name);
        if (!track) return;

        const now = this.context.currentTime;
        track.gain.gain.cancelScheduledValues(now);
        track.gain.gain.setValueAtTime(0, now);
        track.gain.gain.linearRampToValueAtTime(track.gain.gain.value, now + duration);
    }

    fadeOut(name, duration = 1.0) {
        const track = this.tracks.get(name);
        if (!track) return;

        const now = this.context.currentTime;
        track.gain.gain.cancelScheduledValues(now);
        track.gain.gain.setValueAtTime(track.gain.gain.value, now);
        track.gain.gain.linearRampToValueAtTime(0, now + duration);
    }

    crossfade(fromTrack, toTrack, duration = 2.0) {
        const trackA = this.tracks.get(fromTrack);
        const trackB = this.tracks.get(toTrack);
        if (!trackA || !trackB) return;

        const now = this.context.currentTime;

        trackA.gain.gain.cancelScheduledValues(now);
        trackB.gain.gain.cancelScheduledValues(now);

        trackA.gain.gain.setValueAtTime(trackA.gain.gain.value, now);
        trackB.gain.gain.setValueAtTime(trackB.gain.gain.value, now);

        trackA.gain.gain.linearRampToValueAtTime(0, now + duration);
        trackB.gain.gain.linearRampToValueAtTime(1, now + duration);
    }

    setMasterVolume(volume) {
        this.masterGain.gain.value = volume;
    }

    async suspend() {
        await this.context.suspend();
        this.isSuspended = true;
    }

    async resume() {
        await this.context.resume();
        this.isSuspended = false;
    }

    disconnect() {
        this.masterGain.disconnect();
    }

    getTrack(name) {
        return this.tracks.get(name);
    }

    removeTrack(name) {
        const track = this.tracks.get(name);
        if (track) {
            this.stop(name);
            track.source.disconnect();
            track.gain.disconnect();
            track.pan.disconnect();
            this.tracks.delete(name);
        }
    }

    static get supported() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }
}

class MediaCapture {
    static async camera(constraints = {
        video: true,
        audio: false
    }) {
        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            throw new Error(`Camera access failed: ${error.message}`);
        }
    }

    static async screen(options = {
        audio: false
    }) {
        if (!navigator.mediaDevices.getDisplayMedia) {
            throw new Error('Screen capture not supported');
        }

        try {
            return await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always'
                },
                audio: options.audio
            });
        } catch (error) {
            throw new Error(`Screen capture failed: ${error.message}`);
        }
    }

    static async snapshot(stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) {
            throw new Error('No video track available');
        }

        // Try ImageCapture API first
        if ('ImageCapture' in window) {
            try {
                const imageCapture = new ImageCapture(videoTrack);
                return await imageCapture.takePhoto();
            } catch (error) {
                console.warn('ImageCapture failed, falling back to canvas:', error);
            }
        }

        // Canvas fallback
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.onloadeddata = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);

                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                }, 'image/png');
            };

            video.onerror = () => reject(new Error('Video element error'));
            video.play().catch(reject);
        });
    }

    static recorder(stream, options = {}) {
        const {
            mimeType = 'video/webm;codecs=vp9,opus', bitsPerSecond
        } = options;

        const supportedTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/mp4;codecs=avc1',
            'video/mp4'
        ];

        let finalMimeType = mimeType;
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            finalMimeType = supported.find(type => MediaRecorder.isTypeSupported(type)) || '';
        }

        if (!finalMimeType) {
            throw new Error('No supported recording format found');
        }

        const recorderOptions = {
            mimeType: finalMimeType
        };
        if (bitsPerSecond) recorderOptions.bitsPerSecond = bitsPerSecond;

        const recorder = new MediaRecorder(stream, recorderOptions);
        const chunks = [];

        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        return {
            recorder,
            start: (timeslice) => recorder.start(timeslice),
            pause: () => recorder.pause(),
            resume: () => recorder.resume(),
            stop: () => new Promise((resolve) => {
                recorder.onstop = () => {
                    const blob = new Blob(chunks, {
                        type: finalMimeType
                    });
                    resolve(blob);
                };
                recorder.stop();
            }),
            get state() {
                return recorder.state;
            },
            get mimeType() {
                return finalMimeType;
            }
        };
    }

    static async takePicture(constraints = {
        video: true
    }) {
        const stream = await this.camera(constraints);
        try {
            return await this.snapshot(stream);
        } finally {
            stream.getTracks().forEach(track => track.stop());
        }
    }

    static get supported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    static get screenCaptureSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    }
}

class VideoUtils {
    static async extractFrames(video, options = {}) {
        const {
            every = 0.5,
                maxFrames = Infinity,
                as = 'bitmap',
                quality = 0.8
        } = options;

        if (!(video instanceof HTMLVideoElement)) {
            throw new Error('First argument must be an HTMLVideoElement');
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true
        });
        const frames = [];

        const duration = video.duration || 0;
        const step = Math.max(0.01, every);
        const wasPaused = video.paused;
        const wasMuted = video.muted;
        const currentTime = video.currentTime;

        // Ensure video can seek
        video.muted = true;

        if (wasPaused) {
            await video.play().catch(() => {});
        }

        try {
            for (let time = 0; time <= duration && frames.length < maxFrames; time += step) {
                await new Promise((resolve) => {
                    video.currentTime = Math.min(time, duration);
                    video.onseeked = () => resolve();
                    video.onerror = () => resolve(); // Continue on seek errors
                });

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                let frame;
                if (as === 'bitmap' && 'createImageBitmap' in window) {
                    frame = await createImageBitmap(canvas);
                } else if (as === 'dataURL') {
                    frame = canvas.toDataURL('image/jpeg', quality);
                } else if (as === 'blob') {
                    frame = await new Promise(resolve =>
                        canvas.toBlob(resolve, 'image/jpeg', quality)
                    );
                } else {
                    frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                }

                frames.push({
                    time,
                    data: frame,
                    width: canvas.width,
                    height: canvas.height
                });
            }
        } finally {
            // Restore original state
            video.currentTime = currentTime;
            video.muted = wasMuted;
            if (wasPaused) {
                video.pause();
            }
        }

        return frames;
    }

    static parseSubtitles(text, format = 'auto') {
        if (!text || typeof text !== 'string') {
            throw new Error('Subtitle text must be a non-empty string');
        }

        const entries = [];
        const lines = text.trim().split('\n');

        // Auto-detect format
        let detectedFormat = format;
        if (format === 'auto') {
            if (text.includes('-->') && text.includes('WEBVTT')) {
                detectedFormat = 'vtt';
            } else if (text.includes('-->') && text.includes(',')) {
                detectedFormat = 'srt';
            }
        }

        if (detectedFormat === 'vtt') {
            return this.#parseVTT(lines);
        } else {
            return this.#parseSRT(lines);
        }
    }

    static #parseVTT(lines) {
        const entries = [];
        let currentEntry = null;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed || trimmed === 'WEBVTT') continue;

            // Time range line: "00:00:01.000 --> 00:00:04.000"
            const timeMatch = trimmed.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
            if (timeMatch) {
                if (currentEntry) {
                    entries.push(currentEntry);
                }
                currentEntry = {
                    start: this.#timeToSeconds(timeMatch[1]),
                    end: this.#timeToSeconds(timeMatch[2]),
                    text: ''
                };
            } else if (currentEntry && trimmed) {
                if (currentEntry.text) {
                    currentEntry.text += '\n' + trimmed;
                } else {
                    currentEntry.text = trimmed;
                }
            }
        }

        if (currentEntry) {
            entries.push(currentEntry);
        }

        return entries;
    }

    static #parseSRT(lines) {
        const entries = [];
        let currentEntry = null;
        let lineNumber = 0;

        while (lineNumber < lines.length) {
            const line = lines[lineNumber++].trim();

            if (!line) continue;

            // Entry number
            if (/^\d+$/.test(line)) {
                if (currentEntry) {
                    entries.push(currentEntry);
                }
                currentEntry = {
                    text: ''
                };
            }
            // Time range line: "00:00:01,000 --> 00:00:04,000"
            else if (currentEntry && line.includes('-->')) {
                const timeMatch = line.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
                if (timeMatch) {
                    currentEntry.start = this.#timeToSeconds(timeMatch[1].replace(',', '.'));
                    currentEntry.end = this.#timeToSeconds(timeMatch[2].replace(',', '.'));
                }
            }
            // Text line
            else if (currentEntry && line) {
                if (currentEntry.text) {
                    currentEntry.text += '\n' + line;
                } else {
                    currentEntry.text = line;
                }
            }
        }

        if (currentEntry) {
            entries.push(currentEntry);
        }

        return entries;
    }

    static #timeToSeconds(timeString) {
        const parts = timeString.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);
            const seconds = parseFloat(parts[2].replace(',', '.'));
            return hours * 3600 + minutes * 60 + seconds;
        }
        return 0;
    }

    static histogram(imageElement) {
        if (!(imageElement instanceof HTMLImageElement) &&
            !(imageElement instanceof HTMLVideoElement) &&
            !(imageElement instanceof ImageBitmap)) {
            throw new Error('Input must be an image, video, or ImageBitmap');
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true
        });

        canvas.width = imageElement.width || imageElement.videoWidth;
        canvas.height = imageElement.height || imageElement.videoHeight;

        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const bins = new Uint32Array(16 * 16 * 16); // 16x16x16 color histogram

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] >> 4; // 0-15
            const g = data[i + 1] >> 4; // 0-15
            const b = data[i + 2] >> 4; // 0-15
            const index = (r << 8) | (g << 4) | b;
            bins[index]++;
        }

        return {
            bins,
            totalPixels: data.length / 4,
            getDominantColor: () => {
                let maxCount = 0;
                let dominantIndex = 0;

                for (let i = 0; i < bins.length; i++) {
                    if (bins[i] > maxCount) {
                        maxCount = bins[i];
                        dominantIndex = i;
                    }
                }

                const r = (dominantIndex >> 8) & 0xF;
                const g = (dominantIndex >> 4) & 0xF;
                const b = dominantIndex & 0xF;

                return {
                    r: r * 16 + 8,
                    g: g * 16 + 8,
                    b: b * 16 + 8,
                    count: maxCount
                };
            }
        };
    }

    static async sceneCuts(video, options = {}) {
        const {
            every = 0.25,
                threshold = 0.3,
                minCutDuration = 1.0
        } = options;

        const frames = await this.extractFrames(video, {
            every,
            as: 'dataURL'
        });
        const cuts = [];
        let lastCutTime = -minCutDuration;
        let prevHistogram = null;

        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const img = new Image();
            img.src = frame.data;

            await new Promise(resolve => {
                img.onload = resolve;
            });

            const currentHistogram = this.histogram(img);

            if (prevHistogram) {
                let difference = 0;
                let total = 0;

                for (let j = 0; j < currentHistogram.bins.length; j++) {
                    const diff = Math.abs(currentHistogram.bins[j] - prevHistogram.bins[j]);
                    difference += diff;
                    total += currentHistogram.bins[j] + prevHistogram.bins[j];
                }

                const similarity = total > 0 ? difference / total : 0;

                if (similarity > threshold && (frame.time - lastCutTime) >= minCutDuration) {
                    cuts.push({
                        time: frame.time,
                        similarity,
                        frameIndex: i
                    });
                    lastCutTime = frame.time;
                }
            }

            prevHistogram = currentHistogram;
        }

        return cuts;
    }

    static createThumbnail(video, time = 0) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const wasPaused = video.paused;
            const currentTime = video.currentTime;

            video.currentTime = time;

            const onSeeked = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);

                canvas.toBlob(blob => {
                    video.currentTime = currentTime;
                    if (wasPaused) {
                        video.pause();
                    }
                    video.removeEventListener('seeked', onSeeked);
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            };

            video.addEventListener('seeked', onSeeked);
            video.addEventListener('error', reject);
        });
    }
}

//----------- Controls & Gamepads ---------
// Swipe Controls
class SwipeControls {
    constructor(elements, options = {}) {
        this.elements = Array.from(elements);
        this.options = {
            threshold: 30, // píxeles mínimos para swipe
            tapMaxDistance: 10, // tolerancia de movimiento para considerar tap
            tapMaxTime: 250, // tiempo máximo en ms para tap
            doubleTapDelay: 300, // intervalo para doble tap
            ...options
        };
        this._state = new WeakMap();
        this._handlers = new Map();
        this._lastTap = new WeakMap(); // por elemento: {time, x, y}
        this._bound = false;
        this._bindListeners();
    }

    static bind(target, options) {
        const els = typeof target === 'string' ?
            document.querySelectorAll(target) :
            (target instanceof Element ? [target] : target);
        return new SwipeControls(els, options);
    }

    swipeEvent(directions, callback) {
        this._addHandler(directions, callback, 'swipe');
        return this;
    }

    tapEvent(callback, type = 'tap') {
        for (const el of this.elements) {
            if (!this._handlers.has(el)) {
                this._handlers.set(el, {
                    swipe: {},
                    tap: [],
                    doubletap: []
                });
            }
            this._handlers.get(el)[type].push(callback);
        }
        return this;
    }

    off(directions, callback) {
        const dirs = this._parseDirections(directions);
        for (const el of this.elements) {
            const bucket = this._handlers.get(el);
            if (!bucket) continue;
            for (const dir of dirs) {
                bucket[dir] = callback ?
                    bucket[dir].filter(fn => fn !== callback) : [];
            }
        }
        return this;
    }

    destroy() {
        if (!this._bound) return;
        for (const el of this.elements) {
            el.removeEventListener('pointerdown', this._onDown, this.options.capture);
            el.removeEventListener('pointermove', this._onMove, this.options.capture);
            el.removeEventListener('pointerup', this._onUp, this.options.capture);
            el.removeEventListener('pointercancel', this._onCancel, this.options.capture);
            el.style.touchAction = ''; // restaurar
        }
        this._bound = false;
        this._handlers.clear();
        this._state = new WeakMap();
    }

    // -------------------- internos --------------------
    _addHandler(directions, callback, kind) {
        const dirs = this._parseDirections(directions);
        for (const el of this.elements) {
            if (!this._handlers.has(el)) {
                this._handlers.set(el, {
                    swipe: {},
                    tap: [],
                    doubletap: []
                });
            }
            const bucket = this._handlers.get(el).swipe;
            for (const dir of dirs) {
                if (!bucket[dir]) bucket[dir] = [];
                bucket[dir].push(callback);
            }
        }
    }

    _parseDirections(directions) {
        if (!directions) return ['any'];
        if (Array.isArray(directions)) return directions.map(d => d.toLowerCase());
        const str = String(directions).toLowerCase().trim();
        if (str === 'any' || str === '*') return ['any'];
        return str.split(/[,&| ]+/).filter(Boolean).map(s => s.trim());
    }

    _bindListeners() {
        if (this._bound) return;
        this._onDown = this._handleDown.bind(this);
        this._onUp = this._handleUp.bind(this);
        for (const el of this.elements) {
            el.addEventListener('pointerdown', this._onDown);
            el.addEventListener('pointerup', this._onUp);
            this._state.set(el, {});
        }
        this._bound = true;
    }

    _handleDown(ev) {
        const el = ev.currentTarget;
        this._state.set(el, {
            startX: ev.clientX,
            startY: ev.clientY,
            startT: performance.now()
        });
    }

    _handleUp(ev) {
        const el = ev.currentTarget;
        const st = this._state.get(el);
        if (!st) return;

        const dx = ev.clientX - st.startX;
        const dy = ev.clientY - st.startY;
        const dt = performance.now() - st.startT;
        const adx = Math.abs(dx),
            ady = Math.abs(dy);

        let emittedSwipe = false;

        // --- swipe ---
        if (adx > this.options.threshold || ady > this.options.threshold) {
            let dir = (adx > ady) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            this._emit(el, 'swipe', dir, {
                dx,
                dy,
                dt
            });
            emittedSwipe = true;
        }

        // --- tap ---
        if (!emittedSwipe && adx <= this.options.tapMaxDistance && ady <= this.options.tapMaxDistance && dt <= this.options.tapMaxTime) {
            const now = performance.now();
            const last = this._lastTap.get(el);
            if (last && (now - last.time) <= this.options.doubleTapDelay) {
                this._emit(el, 'doubletap', null, {
                    dx,
                    dy,
                    dt
                });
                this._lastTap.set(el, null); // reset
            } else {
                this._emit(el, 'tap', null, {
                    dx,
                    dy,
                    dt
                });
                this._lastTap.set(el, {
                    time: now,
                    x: ev.clientX,
                    y: ev.clientY
                });
            }
        }
    }

    _emit(el, kind, dir, detail) {
        const bucket = this._handlers.get(el);
        if (!bucket) return;
        if (kind === 'swipe') {
            const list = (bucket.swipe[dir] || []).concat(bucket.swipe['any'] || []);
            list.forEach(cb => cb({
                direction: dir,
                ...detail
            }));
        }
        if (kind === 'tap') {
            bucket.tap.forEach(cb => cb({
                type: 'tap',
                ...detail
            }));
        }
        if (kind === 'doubletap') {
            bucket.doubletap.forEach(cb => cb({
                type: 'doubletap',
                ...detail
            }));
        }
    }
}

// RemoteServices (HID + teclado fallback)
class RemoteServices extends EventTarget {
    constructor(opts = {}) {
        super();
        this.opts = {
            // WebHID filters (ajusta vendorId/productId si los conoces)
            hidFilters: opts.hidFilters || [],
            // Captura teclas por teclado/HID
            captureKeyboard: opts.captureKeyboard !== false,
            // Bloquear comportamiento por defecto (útil en modo kiosk)
            preventDefault: opts.preventDefault ?? true,
        };
        this._kbOn = false;
        this._hidDevice = null;
        this._hidOpened = false;

        // Map de teclado → acción semántica
        this.keymap = {
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right',
            Enter: 'ok',
            NumpadEnter: 'ok',
            Escape: 'back',
            Backspace: 'back',
            Home: 'home',
            // Media keys (cuando el SO las deja pasar)
            MediaPlayPause: 'playpause',
            MediaTrackNext: 'next',
            MediaTrackPrevious: 'prev',
            AudioVolumeUp: 'vol_up',
            AudioVolumeDown: 'vol_down',
            AudioVolumeMute: 'mute',
        };
    }

    /* ---------- Público ---------- */

    /** Inicia el fallback de teclado y se prepara para HID si hay HTTPS */
    start() {
        if (this.opts.captureKeyboard) this._attachKeyboard();
        if (this._supportsHID()) {
            this.dispatchEvent(new CustomEvent('hidavailable'));
            // Nota: HID requiere gesto del usuario → se hace luego via connectHID()
        }
        this.dispatchEvent(new Event('connected'));
    }

    /** Detiene listeners y cierra HID si estaba abierto */
    async stop() {
        this._detachKeyboard();
        await this._closeHID();
        this.dispatchEvent(new Event('disconnected'));
    }

    /** Botón de usuario debe llamar esto para abrir HID (HTTPS + Chromium) */
    async connectHID() {
        if (!this._supportsHID()) {
            throw new Error('WebHID no disponible (requiere HTTPS + Chromium).');
        }
        const devices = await navigator.hid.requestDevice({
            filters: this.opts.hidFilters.length ? this.opts.hidFilters : [{}], // sin filtros: picker general
        });
        if (!devices?.length) return;

        this._hidDevice = devices[0];
        this._hidDevice.addEventListener('inputreport', (e) => this._onHIDReport(e));
        await this._hidDevice.open();
        this._hidOpened = this._hidDevice.opened;
        this._hidDevice.addEventListener('disconnect', () => this._onHIDDisconnect());
        this.dispatchEvent(new Event('hidconnected'));
    }

    on(evt, fn) {
        this.addEventListener(evt, fn);
        return this;
    }
    off(evt, fn) {
        this.removeEventListener(evt, fn);
        return this;
    }

    /* ---------- Internos: Keyboard ---------- */

    _attachKeyboard() {
        if (this._kbOn) return;
        this._onKeyDown = (e) => {
            const action = this.keymap[e.code] || this.keymap[e.key];
            if (!action) return;
            if (this.opts.preventDefault) e.preventDefault();
            this._emit('down', action);
        };
        this._onKeyUp = (e) => {
            const action = this.keymap[e.code] || this.keymap[e.key];
            if (!action) return;
            this._emit('up', action);
        };
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        this._kbOn = true;
    }

    _detachKeyboard() {
        if (!this._kbOn) return;
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        this._kbOn = false;
    }

    /* ---------- Internos: WebHID ---------- */

    _supportsHID() {
        return location.protocol === 'https:' && 'hid' in navigator;
    }

    async _closeHID() {
        try {
            if (this._hidDevice?.opened) await this._hidDevice.close();
        } catch {}
        this._hidOpened = false;
        this._hidDevice = null;
    }

    _onHIDDisconnect() {
        this._hidOpened = false;
        this._hidDevice = null;
        this.dispatchEvent(new Event('hiddisconnected'));
    }

    _onHIDReport(e) {
        // Decodifica tu reporte HID aquí.
        // Ejemplo: primer byte = keycode, segundo = 1(down)/0(up).
        const {
            data /* DataView */ ,
            reportId
        } = e;
        if (!data || data.byteLength === 0) return;
        const code = data.getUint8(0);
        const act = data.byteLength > 1 ? (data.getUint8(1) ? 'down' : 'up') : 'down';
        const action = this._mapHIDCode(code);
        if (action) this._emit(act, action);
        else this.dispatchEvent(new CustomEvent('hidraw', {
            detail: {
                reportId,
                bytes: this._dvToArray(data)
            }
        }));
    }

    _mapHIDCode(code) {
        // Ajusta a tu layout real del control.
        const map = {
            0x01: 'up',
            0x02: 'down',
            0x03: 'left',
            0x04: 'right',
            0x05: 'ok',
            0x06: 'back',
            0x07: 'home',
            0x10: 'vol_up',
            0x11: 'vol_down',
            0x12: 'mute',
            0x20: 'playpause',
            0x21: 'next',
            0x22: 'prev',
        };
        return map[code] || null;
    }

    _dvToArray(dv) {
        const arr = new Uint8Array(dv.buffer.slice(dv.byteOffset, dv.byteOffset + dv.byteLength));
        return Array.from(arr);
    }

    /* ---------- Emisión común ---------- */
    _emit(type, action) {
        this.dispatchEvent(new CustomEvent('remote', {
            detail: {
                type,
                action
            }
        }));
    }
}

// GameControlServices (Gamepad API)

class GameControlServices extends EventTarget {
    constructor(opts = {}) {
        super();
        this.opts = {
            deadzone: opts.deadzone ?? 0.25, // para sticks analógicos si los usas
            pollEachFrame: opts.pollEachFrame !== false,
        };
        this._raf = null;
        this._pressed = new Set();
        this._index = 0; // primer gamepad por defecto
    }

    start() {
        window.addEventListener('gamepadconnected', this._onConnect);
        window.addEventListener('gamepaddisconnected', this._onDisconnect);
        if (this.opts.pollEachFrame) this._loop();
    }

    stop() {
        window.removeEventListener('gamepadconnected', this._onConnect);
        window.removeEventListener('gamepaddisconnected', this._onDisconnect);
        cancelAnimationFrame(this._raf);
        this._pressed.clear();
    }

    on(evt, fn) {
        this.addEventListener(evt, fn);
        return this;
    }
    off(evt, fn) {
        this.removeEventListener(evt, fn);
        return this;
    }

    /* ---------- Internos ---------- */

    _onConnect = (e) => {
        this.dispatchEvent(new Event('connected'));
    }
    _onDisconnect = (e) => {
        this.dispatchEvent(new Event('disconnected'));
    }

    _loop = () => {
        this._poll();
        this._raf = requestAnimationFrame(this._loop);
    }

    _poll() {
        const pads = navigator.getGamepads?.();
        if (!pads) return;
        const gp = pads[this._index];
        if (!gp) return;

        // Botones
        gp.buttons.forEach((b, i) => {
            const name = this._btnName(gp, i);
            if (!name) return;
            const pressed = !!b.pressed;

            if (pressed && !this._pressed.has(name)) {
                this._pressed.add(name);
                this._emit('down', name);
            } else if (!pressed && this._pressed.has(name)) {
                this._pressed.delete(name);
                this._emit('up', name);
            }
        });

        // D-pad en gamepads que lo exponen como ejes (algunos hacen eso)
        // (muchos ya vienen como botones 12..15; los mapeamos arriba)
    }

    _btnName(gp, i) {
        // Standard mapping indices:
        // 12 Up, 13 Down, 14 Left, 15 Right
        // 0 A, 1 B, 2 X, 3 Y, 8 Back, 9 Start
        const map = {
            12: 'up',
            13: 'down',
            14: 'left',
            15: 'right',
            0: 'ok', // A → “ok/select”
            1: 'back', // B → back (ajústalo a tu UX)
            8: 'menu', // back/start alternativos
            9: 'start',
            4: 'l1',
            5: 'r1',
            6: 'l2',
            7: 'r2',
            10: 'l3',
            11: 'r3',
            16: 'home', // algunos mandos lo tienen
        };
        return map[i] || null;
    }

    _emit(type, action) {
        this.dispatchEvent(new CustomEvent('gamecontrol', {
            detail: {
                type,
                action
            }
        }));
    }
}


//----------- Dev Tools -----------

class Dev {
    static getEngineInfo() {
        const mem = (performance && performance.memory) || null;
        const info = {
            Memory: {
                UsedMemory: mem,
                AvailableMemory: mem ? mem.totalJSHeapSize : 0,
            },
            ProcessorCores: navigator.hardwareConcurrency || 0,
            DeviceLang: navigator.language,
            WebEngine: navigator.userAgent,
        };
        return info;
    }

    static Bytesconv(bytes) {
        if (bytes == null) return;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        if (bytes === 0) return "0 Byte";
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
    }

    static DeviceInfo() {
        return (/Android|WebOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? "0xFFFFFF" : "0x000000");
    }

    static getUserAgent() {
        const ua = navigator.userAgent;
        if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "crx";
        if (/Firefox\//.test(ua)) return "moz";
        if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "apple-webkit";
        if (/Edg\//.test(ua)) return "ms-edge";
        if (/OPR\//.test(ua)) return "opr";
        return "unknown";
    }

    static int2hex(d, padding) {
        let hex = Number(d).toString(16);
        const pad = padding == null ? 2 : padding;
        while (hex.length < pad) hex = "0" + hex;
        return hex;
    }

    static RandomNumber() {
        return Math.round(Math.random() * 100)
    }

    static SerialNumberGenerator(len) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return Array.from({
            length: len
        }, () => chars[(Math.random() * chars.length) | 0]).join("");
    }
}

class AnimationUtils {
    static #easings = {
        linear: t => t,
        easeIn: t => t * t,
        easeOut: t => t * (2 - t),
        easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        cubic: t => (--t) * t * t + 1,
        bounce: t => {
            if (t < (1 / 2.75)) {
                return 7.5625 * t * t;
            } else if (t < (2 / 2.75)) {
                return 7.5625 * (t -= (1.5 / 2.75)) * t + 0.75;
            } else if (t < (2.5 / 2.75)) {
                return 7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375;
            } else {
                return 7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375;
            }
        },
        elastic: t => Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1
    };

    static animate(options = {}) {
        const {
            duration = 300,
                easing = 'easeInOut',
                update,
                complete
        } = options;

        const startTime = performance.now();
        const easeFunc = typeof easing === 'function' ? easing : this.#easings[easing] || this.#easings.easeInOut;

        let animationId;

        const frame = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = easeFunc(progress);

            if (update) {
                update(value, progress);
            }

            if (progress < 1) {
                animationId = requestAnimationFrame(frame);
            } else {
                if (complete) complete();
            }
        };

        animationId = requestAnimationFrame(frame);

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }

    static pulse(element, options = {}) {
        const {
            from = 1,
                to = 1.06,
                duration = 600,
                easing = 'easeInOut'
        } = options;

        const initialTransform = element.style.transform;

        return this.animate({
            duration,
            easing,
            update: (value) => {
                const scale = from + (to - from) * value;
                element.style.transform = `${initialTransform} scale(${scale})`;
            },
            complete: () => {
                element.style.transform = initialTransform;
            }
        });
    }

    static glow(element, options = {}) {
        const {
            color = 'var(--primary, #007bff)',
                blur = '18px',
                duration = 500,
                easing = 'easeInOut'
        } = options;

        const initialBoxShadow = element.style.boxShadow;
        const colorValue = this.#parseColor(color);

        return this.animate({
            duration,
            easing,
            update: (value) => {
                const alpha = value * 0.4;
                element.style.boxShadow = `0 0 ${blur} ${colorValue}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
            },
            complete: () => {
                element.style.boxShadow = initialBoxShadow;
            }
        });
    }

    static shimmer(element, options = {}) {
        const {
            duration = 2000,
                angle = 110,
                color = 'rgba(255, 255, 255, 0.06)'
        } = options;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';

        const shimmer = document.createElement('div');
        Object.assign(shimmer.style, {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(${angle}deg, transparent 0%, ${color} 40%, transparent 80%)`,
            transform: 'translateX(-100%)',
            pointerEvents: 'none'
        });

        element.appendChild(shimmer);

        let isRunning = true;
        const startTime = performance.now();

        const animateShimmer = () => {
            if (!isRunning || !element.isConnected) {
                shimmer.remove();
                return;
            }

            const elapsed = performance.now() - startTime;
            const progress = (elapsed % duration) / duration;
            const x = -100 + progress * 200;

            shimmer.style.transform = `translateX(${x}%)`;
            requestAnimationFrame(animateShimmer);
        };

        animateShimmer();

        return () => {
            isRunning = false;
            shimmer.remove();
        };
    }

    static stagger(elements, options = {}) {
        const {
            delay = 50,
                animation,
                ...animationOptions
        } = options;

        const controllers = [];

        elements.forEach((element, index) => {
            const controller = this.animate({
                ...animationOptions,
                update: (value, progress) => {
                    if (animation) {
                        animation(element, value, progress, index);
                    }
                }
            });

            controllers.push(controller);
        });

        return () => controllers.forEach(controller => controller());
    }

    static #parseColor(color) {
        if (color.startsWith('var(')) {
            return color; // Use CSS variable as is
        }
        if (color.startsWith('#')) {
            return color;
        }
        if (color.startsWith('rgb')) {
            return color;
        }
        return color;
    }

    static geteasings() {
        return {
            ...this.#easings
        };
    }

    static addEasing(name, easingFunction) {
        this.#easings[name] = easingFunction;
    }
}


//------------ FileSystems ---------
class SFS {
    constructor(dbName = "LFS", version = 1, options = {}) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        this.logs = [];
        this.cache = new Map();
        this.batchQueue = [];
        this.fsType = options.fsType || "standard";
        this.verbose = options.verbose || false;
        this.maxCacheSize = options.maxCacheSize || 1000;
        this.compressionEnabled = options.compression || false;

        // Performance metrics
        this.metrics = {
            operations: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalTime: 0,
        };

        this.#logInfo("Starting LFS+", {
            dbName: this.dbName,
            fsType: this.fsType,
            level: 0x9a10,
        });
    }

    // 🔧 MÉTODOS PRIVADOS CORREGIDOS

    #logInfo(message, args = {}) {
        this.#addLog("INFO", message, args);
    }

    #logWarning(message, args = {}) {
        this.#addLog("WARNING", message, args);
    }

    #logError(message, args = {}) {
        this.#addLog("ERROR", message, args);
    }

    #addLog(level, message, args, user = "system") {
        const logEntry = {
            level,
            message,
            args,
            user,
            timestamp: Date.now(),
            date: new Date().toISOString(),
        };

        this.logs.push(logEntry);

        // Keep only last 1000 logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }

        if (this.verbose) {
            const color = level === "ERROR" ? "color: red" : level === "WARNING" ? "color: orange" : "color: blue";
            console.log(`%c[${logEntry.date}] [${level}] ${message}`, color, args);
        }
    }

    #isValidPath(path) {
        return (
            typeof path === "string" &&
            path.length > 0 &&
            !path.includes("..") &&
            !path.includes("//") &&
            path.length < 4096
        );
    }

    #calculateSize(content) {
        if (!content) return 0;
        if (typeof content === "string") return new Blob([content]).size;
        if (content instanceof ArrayBuffer) return content.byteLength;
        if (content instanceof Blob) return content.size;
        return JSON.stringify(content).length;
    }

    #getCached(key) {
        if (this.cache.has(key)) {
            this.metrics.cacheHits++;
            const cached = this.cache.get(key);
            // Move to end (LRU)
            this.cache.delete(key);
            this.cache.set(key, cached);
            return cached;
        }
        this.metrics.cacheMisses++;
        return null;
    }

    #setCache(key, value) {
        // LRU eviction
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, {
            ...value,
            cachedAt: Date.now()
        });
    }

    #invalidateCache(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    async #calculateChecksum(content) {
        if (!content) return 0;

        const encoder = new TextEncoder();
        const data = typeof content === "string" ? encoder.encode(content) : new Uint8Array(content);

        let checksum = 0;
        for (let i = 0; i < data.length; i++) {
            checksum = (checksum + data[i]) % 0xffffffff;
        }
        return checksum;
    }

    // 🗄️ INICIALIZACIÓN CORREGIDA

    async init() {
        const startTime = performance.now();

        try {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);

                this.#logInfo("Mounting FileSystem", {
                    fs: this.dbName,
                    type: this.fsType,
                    level: 0x9a11,
                });

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    this.#createObjectStores(db);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.#setupErrorHandling();

                    const initTime = performance.now() - startTime;
                    this.metrics.totalTime += initTime;

                    this.#logInfo("FileSystem mounted successfully", {
                        fs: this.dbName,
                        initTime: `${initTime.toFixed(2)}ms`,
                        level: 0x9a11,
                    });

                    resolve(this);
                };

                request.onerror = (event) => {
                    this.#logError("Failed to mount FileSystem", {
                        error: event.target.error,
                        level: 0x9a09,
                    });
                    reject(new Error(`Database error: ${event.target.error}`));
                };

                request.onblocked = () => {
                    this.#logError("Database blocked - please close other tabs", {
                        level: 0x9a09,
                    });
                    reject(new Error("Database blocked by other tabs"));
                };
            });
        } catch (error) {
            this.#logError("Initialization failed", {
                error: error.message
            });
            throw error;
        }
    }

    #createObjectStores(db) {
        // Standard file store
        if (!db.objectStoreNames.contains("files")) {
            const fileStore = db.createObjectStore("files", {
                keyPath: "path"
            });
            fileStore.createIndex("parent", "parent", {
                unique: false
            });
            fileStore.createIndex("type", "type", {
                unique: false
            });
            fileStore.createIndex("createdAt", "createdAt", {
                unique: false
            });
            fileStore.createIndex("size", "size", {
                unique: false
            });
        }

        // Metadata store
        if (!db.objectStoreNames.contains("metadata")) {
            const metaStore = db.createObjectStore("metadata", {
                keyPath: "key"
            });
            metaStore.createIndex("category", "category", {
                unique: false
            });
        }

        // Journal store
        if (!db.objectStoreNames.contains("journal")) {
            const journalStore = db.createObjectStore("journal", {
                keyPath: "id",
                autoIncrement: true,
            });
            journalStore.createIndex("timestamp", "timestamp", {
                unique: false
            });
            journalStore.createIndex("operation", "operation", {
                unique: false
            });
        }
    }

    #setupErrorHandling() {
        if (!this.db) return;

        this.db.onerror = (event) => {
            this.#logError("Database error", {
                error: event.target.error
            });
        };

        this.db.onversionchange = () => {
            this.#logWarning("Database version changed, closing connection");
            this.db.close();
            this.db = null;
        };
    }

    // 💾 OPERACIONES BÁSICAS CORREGIDAS

    async #runTransaction(stores, mode, operation) {
        if (!this.db) {
            throw new Error("FileSystem not initialized. Call init() first.");
        }

        const startTime = performance.now();
        this.metrics.operations++;

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(stores, mode);

                // Timeout más conservador
                const timeout = setTimeout(() => {
                    if (transaction.state !== 'finished') {
                        transaction.abort();
                        reject(new Error("Transaction timeout after 30s"));
                    }
                }, 30000);

                transaction.oncomplete = () => {
                    clearTimeout(timeout);
                    const duration = performance.now() - startTime;
                    this.metrics.totalTime += duration;
                };

                transaction.onerror = (event) => {
                    clearTimeout(timeout);
                    this.#logError("Transaction failed", {
                        error: event.target.error?.message || "Unknown error",
                        level: 0x9a17,
                    });
                    reject(new Error(`Transaction error: ${event.target.error?.message}`));
                };

                transaction.onabort = () => {
                    clearTimeout(timeout);
                    reject(new Error("Transaction aborted"));
                };

                // Ejecutar la operación
                const storeObjects = {};
                stores.forEach((storeName) => {
                    storeObjects[storeName] = transaction.objectStore(storeName);
                });

                const result = operation(storeObjects);

                // Manejar tanto promesas como valores directos
                if (result && typeof result.then === 'function') {
                    result.then(resolve).catch(reject);
                } else {
                    resolve(result);
                }

            } catch (error) {
                reject(error);
            }
        });
    }

    async exists(path) {
        if (!this.#isValidPath(path)) {
            return false;
        }

        const cached = this.#getCached(`exists:${path}`);
        if (cached) return cached.exists;

        try {
            const result = await this.#runTransaction(["files"], "readonly", (stores) => {
                return new Promise((resolve) => {
                    const request = stores.files.get(path);
                    request.onsuccess = () => {
                        const exists = request.result !== undefined;
                        this.#setCache(`exists:${path}`, {
                            exists
                        });
                        resolve(exists);
                    };
                    request.onerror = () => resolve(false);
                });
            });
            return result;
        } catch (error) {
            this.#logError("Exists check failed", {
                path,
                error: error.message
            });
            return false;
        }
    }

    async writeFile(path, content, type = "text", permissions = "rw", options = {}) {
        const startTime = performance.now();

        try {
            if (!this.#isValidPath(path)) {
                throw new Error(`Invalid path: ${path}`);
            }

            const parent = path.substring(0, path.lastIndexOf("/")) || "/";
            const size = this.#calculateSize(content);

            const file = {
                path,
                content,
                type,
                permissions,
                parent,
                size,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                checksum: await this.#calculateChecksum(content),
            };

            const result = await this.#runTransaction(["files"], "readwrite", (stores) => {
                return new Promise((resolve, reject) => {
                    const request = stores.files.put(file);
                    request.onsuccess = () => {
                        this.#setCache(`file:${path}`, file);
                        this.#invalidateCache(parent);

                        const duration = performance.now() - startTime;
                        this.#logInfo("File written", {
                            path,
                            size,
                            duration: `${duration.toFixed(2)}ms`,
                        });

                        resolve(`File saved: ${path}`);
                    };
                    request.onerror = (event) => reject(event.target.error);
                });
            });

            return result;
        } catch (error) {
            this.#logError("Write operation failed", {
                path,
                error: error.message
            });
            throw error;
        }
    }

    async readFile(path, options = {}) {
        if (!this.#isValidPath(path)) {
            throw new Error(`Invalid path: ${path}`);
        }

        const cached = this.#getCached(`file:${path}`);
        if (cached && !options.bypassCache) {
            return cached;
        }

        try {
            const result = await this.#runTransaction(["files"], "readonly", (stores) => {
                return new Promise((resolve, reject) => {
                    const request = stores.files.get(path);
                    request.onsuccess = () => {
                        if (request.result) {
                            const file = request.result;
                            this.#setCache(`file:${path}`, file);
                            resolve(file);
                        } else {
                            reject(new Error(`File not found: ${path}`));
                        }
                    };
                    request.onerror = (event) => reject(event.target.error);
                });
            });
            return result;
        } catch (error) {
            this.#logError("Read operation failed", {
                path,
                error: error.message
            });
            throw error;
        }
    }

    async deleteFile(path) {
        try {
            if (!this.#isValidPath(path)) {
                throw new Error(`Invalid path: ${path}`);
            }

            const exists = await this.exists(path);
            if (!exists) {
                throw new Error(`File not found: ${path}`);
            }

            const result = await this.#runTransaction(["files"], "readwrite", (stores) => {
                return new Promise((resolve, reject) => {
                    const request = stores.files.delete(path);
                    request.onsuccess = () => {
                        this.cache.delete(`file:${path}`);
                        this.cache.delete(`exists:${path}`);
                        this.#invalidateCache(path.substring(0, path.lastIndexOf("/")));

                        this.#logInfo("File deleted", {
                            path
                        });
                        resolve(`File deleted: ${path}`);
                    };
                    request.onerror = (event) => reject(event.target.error);
                });
            });

            return result;
        } catch (error) {
            this.#logError("Delete operation failed", {
                path,
                error: error.message
            });
            throw error;
        }
    }

    // 📁 OPERACIONES DE CARPETA CORREGIDAS

    async createFolder(path, permissions = "rwx") {
        try {
            if (!this.#isValidPath(path)) {
                throw new Error(`Invalid folder path: ${path}`);
            }

            await this.#ensureParentDirectories(path);

            const folder = {
                path,
                content: null,
                type: "folder",
                permissions,
                parent: path.substring(0, path.lastIndexOf("/")) || "/",
                size: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                checksum: 0,
            };

            const result = await this.#runTransaction(["files"], "readwrite", (stores) => {
                return new Promise((resolve, reject) => {
                    const request = stores.files.put(folder);
                    request.onsuccess = () => {
                        this.#setCache(`file:${path}`, folder);
                        this.#setCache(`exists:${path}`, {
                            exists: true
                        });
                        this.#invalidateCache(folder.parent);

                        this.#logInfo("Folder created", {
                            path,
                            permissions
                        });
                        resolve(`Folder created: ${path}`);
                    };
                    request.onerror = (event) => reject(event.target.error);
                });
            });

            return result;
        } catch (error) {
            this.#logError("Create folder failed", {
                path,
                error: error.message
            });
            throw error;
        }
    }

    async #ensureParentDirectories(path) {
        const parts = path.split("/").filter((part) => part.length > 0);
        let currentPath = "";

        for (let i = 0; i < parts.length - 1; i++) {
            currentPath += "/" + parts[i];
            const exists = await this.exists(currentPath);

            if (!exists) {
                await this.createFolder(currentPath);
            }
        }
    }

    async listFiles(directory = "/", options = {}) {
        const {
            includeHidden = false, sortBy = "name", sortOrder = "asc", fileTypes = null
        } = options;

        try {
            const cacheKey = `list:${directory}:${JSON.stringify(options)}`;
            const cached = this.#getCached(cacheKey);
            if (cached && !options.bypassCache) {
                return cached.files;
            }

            const files = await this.#runTransaction(["files"], "readonly", (stores) => {
                return new Promise((resolve) => {
                    const index = stores.files.index("parent");
                    const request = index.getAll(directory);

                    request.onsuccess = () => {
                        let files = request.result || [];

                        // Filter hidden files
                        if (!includeHidden) {
                            files = files.filter((file) => !file.path.split("/").pop().startsWith("."));
                        }

                        // Filter by file types
                        if (fileTypes && Array.isArray(fileTypes)) {
                            files = files.filter((file) => fileTypes.includes(file.type));
                        }

                        // Sort files
                        files.sort((a, b) => {
                            let aVal, bVal;

                            switch (sortBy) {
                                case "name":
                                    aVal = a.path.split("/").pop().toLowerCase();
                                    bVal = b.path.split("/").pop().toLowerCase();
                                    break;
                                case "size":
                                    aVal = a.size || 0;
                                    bVal = b.size || 0;
                                    break;
                                case "date":
                                    aVal = a.createdAt;
                                    bVal = b.createdAt;
                                    break;
                                case "type":
                                    aVal = a.type;
                                    bVal = b.type;
                                    break;
                                default:
                                    aVal = a.path;
                                    bVal = b.path;
                            }

                            if (sortOrder === "desc") {
                                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                            }
                            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                        });

                        // Map to enhanced format
                        const enhancedFiles = files.map((file) => ({
                            path: file.path,
                            name: file.path.split("/").pop(),
                            type: file.type,
                            size: file.size || 0,
                            permissions: file.permissions,
                            createdAt: file.createdAt,
                            updatedAt: file.updatedAt || file.createdAt,
                            parent: file.parent,
                            isFolder: file.type === "folder",
                            extension: file.type !== "folder" ? file.path.split(".").pop() : null,
                            checksum: file.checksum,
                        }));

                        resolve(enhancedFiles);
                    };

                    request.onerror = () => resolve([]);
                });
            });

            this.#setCache(cacheKey, {
                files
            });
            return files;
        } catch (error) {
            this.#logError("List files failed", {
                directory,
                error: error.message
            });
            return [];
        }
    }

    // 🛠️ MÉTODOS UTILITARIOS

    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            cacheHitRate: (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 || 0,
            averageOperationTime: this.metrics.operations > 0 ? this.metrics.totalTime / this.metrics.operations : 0,
        };
    }

    clearCache() {
        this.cache.clear();
        this.#logInfo("Cache cleared");
    }

    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.#logInfo("Database connection closed");
        }
    }

    async destroy() {
        await this.close();
        this.cache.clear();
        this.logs = [];
        this.metrics = {
            operations: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalTime: 0,
        };
        this.#logInfo("SFS instance destroyed");
    }
}

//------------ Config ----------

function SDK_Worker(reg) {
    if (!reg) return;

    const SDK = {
        "About": "Nova Snap SDK 1.0.3, SDK Level: 1, Codename: Proyect X",
        "SDK": {
            Build: "22",
            Retail_Version: "1.0",
            Main_Version: 1.0,
            Current_Level: 1,
            Min_Level: 1,
            Target_Level: 1
        }
    }

    return SDK[reg];
}

function version(){
        let SDK_Banner = 
`
 ∧ ,,, ∧        Nova Snap Framework UI    
(  ̳• · • ̳)      Core UI Framework 1.0.3
/    づ♡       ©️Copyright (C) 2025 Nova,LLC 

`;

console.log(SDK_Banner);
}

const API_RUNTIME_VER = `<pre>
 ∧ ,,, ∧        Nova Snap Framework UI    
(  ̳• · • ̳)      Core UI Framework 1.0.3
/    づ♡       ©️Copyright (C) 2025 Nova,LLC 

</pre>
`;

//Fixture
const Colorize = [ColorizeV2, ColorizeV3, ColorizeV4];

export {
    API_RUNTIME_VER,
    version,
    SDK_Worker,
    Fetch,
    PublicApis,
    ForeIndex,
    DisplayUtils,
    SWDM,
    SnapNotifications,
    NetworkManager,
    ExtraTools,
    PasswordHasher,
    Zip,
    GeoLocationService,
    DateTime,
    Scheduler,
    Colorize,
    AudioMixer,
    MediaCapture,
    AudioMetadataReader,
    AudioMetadataReaderBlob,
    VideoMetadataReader,
    ImageMetadataReader,
    ImageValidator,
    VideoThumbnailGenerator,
    VideoUtils,
    SwipeControls,
    CacheControl,
    UUID,
    Crypto,
    WebSpeech,
    Dev,
    TaskUtils,
    Bind,
    AnimationUtils,
    SFS,
};