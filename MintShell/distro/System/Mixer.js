class Mixer {
    static #master = 100;
    static #devices = new Map();
    static #subs = new Set();

    static onChange(fn) {
        this.#subs.add(fn);
        fn(this.getState());
        return () => this.#subs.delete(fn);
    }

    static #emit() {
        this.#subs.forEach(fn => fn(this.getState()));
    }

    static getState() {
        return {
            master: this.#master,
            devices: [...this.#devices.entries()].map(
                ([id, v]) => ({ id, volume: v })
            )
        };
    }

    static setMasterVol(v) {
        this.#master = this.#clamp(v);
        this.#emit();
    }

    static setDeviceVol(id, v) {
        if (!this.#devices.has(id)) return;
        this.#devices.set(id, this.#clamp(v));
        this.#emit();
    }

    static mountVolDevice({ id, volume = 100 }) {
        this.#devices.set(id, volume);
        this.#emit();
    }

    static umountVolDevice(id) {
        this.#devices.delete(id);
        this.#emit();
    }

    static #clamp(v) {
        return Math.max(0, Math.min(100, v));
    }
}

class MixerUI {
    static instance = null;

    constructor({
        root = document.body,
        trigger = ".vol",
        trayIcon = ".tray.icon.vol"
    } = {}) {

        // --- BUG FIX: evitar 2 mixers ---
        if (MixerUI.instance) {
            return MixerUI.instance;
        }
        MixerUI.instance = this;

        this.root = root;
        this.trigger = document.querySelector(trigger);
        this.trayIcon = document.querySelector(trayIcon);

        this.container = document.createElement("div");
        this.container.className = "mixer hidden";

        this.root.appendChild(this.container);

        this.unsubscribe = Mixer.onChange(state => {
            this.render(state);
            this.renderTrayIcon(state.master);
        });

        this.#bind();
    }

    /* ============================
       Eventos
    ============================ */
    #bind() {
        // Sliders
        this.container.addEventListener("input", e => {
            const t = e.target;

            if (t.dataset.master !== undefined) {
                Mixer.setMasterVol(+t.value);
                return;
            }

            if (t.dataset.device) {
                Mixer.setDeviceVol(t.dataset.device, +t.value);
            }
        });

        // Toggle mixer con botón .vol
        this.trigger?.addEventListener("click", e => {
            e.preventDefault();
            this.toggle();
        });

        // Scroll sobre tray icon = subir / bajar volumen
        this.trayIcon?.addEventListener("wheel", e => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 5 : -5;
            Mixer.setMasterVol(Mixer.getState().master + delta);
        });

        // Click derecho = mute / unmute
        this.trayIcon?.addEventListener("contextmenu", e => {
            e.preventDefault();
            const { master } = Mixer.getState();
            Mixer.setMasterVol(master === 0 ? 50 : 0);
        });
    }

    /* ============================
       Toggle
    ============================ */
    toggle() {
        this.container.classList.toggle("hidden");
    }

    /* ============================
       Render principal
    ============================ */
    render({ master, devices }) {
        this.container.innerHTML = `
            <section class="mixer-master">
                <span class="mixer-icon">${this.#icon(master)}</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value="${master}"
                    data-master
                />
            </section>

            <section class="mixer-devices">
                ${devices.map(d => this.#renderDevice(d)).join("")}
            </section>
        `;
    }

    /* ============================
       Render tray icon
    ============================ */
    renderTrayIcon(volume) {
        if (!this.trayIcon) return;

        const icon = this.#icon(volume);
        this.trayIcon.textContent = icon;

        // micro-animación (feedback visual)
        this.trayIcon.classList.remove("pulse");
        void this.trayIcon.offsetWidth;
        this.trayIcon.classList.add("pulse");
    }

    /* ============================
       Render device
    ============================ */
    #renderDevice({ id, volume }) {
        return `
            <div class="mixer-device">
                <span>${id}</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value="${volume}"
                    data-device="${id}"
                />
            </div>
        `;
    }

    /* ============================
       Icon mapping
    ============================ */
    #icon(v) {
        if (v === 0) return "volume_mute";
        if (v < 30) return "volume_down";
        if (v < 70) return "volume_off";
        return "volume_up";
    }

    /* ============================
       Cleanup
    ============================ */
    destroy() {
        this.unsubscribe?.();
        this.container.remove();
        MixerUI.instance = null;
    }
}

export{ Mixer, MixerUI}