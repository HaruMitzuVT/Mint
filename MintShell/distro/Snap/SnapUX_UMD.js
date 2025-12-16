// UI Kit (Progessbar, Range, ColorPicker, UserControlAccess, Form, Dropdown, FileSelector)
class Prompt {
    constructor(model) {
        if (!model || typeof model !== 'object') {
            throw new Error('Prompt model must be an object');
        }
        this.promptBox = model;
        this.element = null; // Referencia al DOM creado
    }

    execute() {
        this.#validateModel();
        this.#resolvePrompt();
    }

    kill(){
        this.#close();
    }

    #validateModel() {
        const requiredFields = ['type', 'title'];
        for (const field of requiredFields) {
            if (!this.promptBox[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }

    #resolvePrompt() {
        const PromptType = this.promptBox['type'];
        this.element = this.#CreateView();

        // Animación inicial
        this.element.style.transform = 'translate(-50%, 100%)';
        this.element.style.opacity = '0';
        document.body.appendChild(this.element);
        void this.element.offsetWidth;
        this.element.classList.add('slide-up');

        switch (PromptType) {
            // Casos existentes...
            case 'UAC':
                this.#buildUAC();
                break;
            case 'File':
                this.#buildFilePicker();
                break;
            case 'Actions':
                this.#buildActions();
                break;
            case 'Form':
                this.#buildForm();
                break;
            case 'Dropdown':
                this.#buildDropdown();
                break;
            case 'Progress':
                this.#buildProgress();
                break;
            case 'Range':
                this.#buildRangeInput();
                break;
            case 'ColorPicker':
                this.#buildColorPicker();
                break;

                // Nuevos tipos de inputs
            case 'Currency':
                this.#buildCurrencyInput();
                break;
            case 'Date':
                this.#buildDateInput();
                break;
            case 'Phone':
                this.#buildPhoneInput();
                break;
            case 'Card':
                this.#buildCardInput();
                break;
            case 'Search':
                this.#buildSearchInput();
                break;
            case 'Checkbox':
                this.#buildCheckboxGroup();
                break;
            case 'Users':
                this.#buildUserSelection();
                break;

            default:
                throw new Error(`Unknown prompt type: ${PromptType}`);
        }

        document.body.appendChild(this.element);
    }

    // ========== NUEVOS MÉTODOS PARA INPUTS ESPECIALIZADOS ==========

    #buildCurrencyInput() {
        const form = document.createElement('form');
        form.className = 'Prompt-form currency-form';

        form.innerHTML = `
      <div class="input-container">
        <span class="currency-symbol">${this.promptBox.currency || '$'}</span>
        <input 
          type="text" 
          inputmode="decimal"
          pattern="[0-9]+(\\.[0-9]{1,2})?"
          placeholder="${this.promptBox.placeholder || '0.00'}"
          class="currency-input"
          ${this.promptBox.required ? 'required' : ''}
        >
      </div>
      <button type="submit">${this.promptBox.submitText || 'Aceptar'}</button>
    `;

        const input = form.querySelector('.currency-input');
        input.addEventListener('input', this.#formatCurrency.bind(this));

        form.onsubmit = (e) => {
            e.preventDefault();
            if (this.promptBox.handler?.submit) {
                this.promptBox.handler.submit(input.value);
            }
            this.#close();
        };

        this.element.appendChild(form);
    }

    #formatCurrency(e) {
        let value = e.target.value.replace(/[^0-9.]/g, '');
        const decimalPos = value.indexOf('.');

        if (decimalPos >= 0) {
            value = value.substring(0, decimalPos + 3);
        }

        e.target.value = value;
    }

    #buildDateInput() {
        const form = document.createElement('form');
        form.className = 'Prompt-form date-form';

        form.innerHTML = `
      <input 
        type="date"
        min="${this.promptBox.minDate || ''}"
        max="${this.promptBox.maxDate || ''}"
        class="date-input"
        ${this.promptBox.required ? 'required' : ''}
      >
      <button type="submit">${this.promptBox.submitText || 'Seleccionar'}</button>
    `;

        form.onsubmit = (e) => {
            e.preventDefault();
            const date = form.querySelector('.date-input').value;
            if (this.promptBox.handler?.submit) {
                this.promptBox.handler.submit(date);
            }
            this.#close();
        };

        this.element.appendChild(form);
    }

    #buildPhoneInput() {
        const form = document.createElement('form');
        form.className = 'Prompt-form phone-form';

        form.innerHTML = `
      <input 
        type="tel"
        inputmode="tel"
        pattern="[0-9+\\-\\s]+"
        placeholder="${this.promptBox.placeholder || '+1 (___) ___-____'}"
        class="phone-input"
        ${this.promptBox.required ? 'required' : ''}
      >
      <button type="submit">${this.promptBox.submitText || 'Enviar'}</button>
    `;

        const input = form.querySelector('.phone-input');
        input.addEventListener('input', this.#formatPhoneNumber.bind(this));

        form.onsubmit = (e) => {
            e.preventDefault();
            if (this.promptBox.handler?.submit) {
                this.promptBox.handler.submit(input.value);
            }
            this.#close();
        };

        this.element.appendChild(form);
    }

    #formatPhoneNumber(e) {
        const value = e.target.value.replace(/[^0-9+-\s]/g, '');
        e.target.value = value;
    }

    #buildCardInput() {
        const form = document.createElement('form');
        form.className = 'Prompt-form card-form';

        form.innerHTML = `
      <div class="input-container">
        <span class="card-icon">💳</span>
        <input 
          type="text"
          inputmode="numeric"
          pattern="[0-9\\s]{13,19}"
          placeholder="____ ____ ____ ____"
          class="card-input"
          ${this.promptBox.required ? 'required' : ''}
        >
      </div>
      <button type="submit">${this.promptBox.submitText || 'Continuar'}</button>
    `;

        const input = form.querySelector('.card-input');
        input.addEventListener('input', this.#formatCardNumber.bind(this));

        form.onsubmit = (e) => {
            e.preventDefault();
            if (this.promptBox.handler?.submit) {
                const cardNumber = input.value.replace(/\s/g, '');
                this.promptBox.handler.submit(cardNumber);
            }
            this.#close();
        };

        this.element.appendChild(form);
    }

    #formatCardNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 16) value = value.substring(0, 16);

        // Agregar espacios cada 4 dígitos
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = value;
    }

    #buildSearchInput() {
        const form = document.createElement('form');
        form.className = 'Prompt-form search-form';

        form.innerHTML = `
      <div class="search-container">
        <input 
          type="search"
          placeholder="${this.promptBox.placeholder || 'Buscar...'}"
          class="search-input"
        >
        <button type="submit" class="search-btn">🔍</button>
      </div>
    `;

        const input = form.querySelector('.search-input');

        form.onsubmit = (e) => {
            e.preventDefault();
            if (this.promptBox.handler?.submit) {
                this.promptBox.handler.submit(input.value);
            }
            this.#close();
        };

        // Búsqueda en tiempo real si se especifica
        if (this.promptBox.handler?.onInput) {
            input.addEventListener('input', (e) => {
                this.promptBox.handler.onInput(e.target.value);
            });
        }

        this.element.appendChild(form);
    }

    #buildCheckboxGroup() {
        const container = document.createElement('div');
        container.className = 'checkbox-group-container';

        if (this.promptBox.title) {
            const title = document.createElement('h3');
            title.textContent = this.promptBox.title;
            container.appendChild(title);
        }

        const options = this.promptBox.options || [];
        options.forEach(option => {
            const wrapper = document.createElement('div');
            wrapper.className = 'checkbox-wrapper';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${option.value}`;
            checkbox.value = option.value;
            checkbox.checked = option.checked || false;

            const label = document.createElement('label');
            label.htmlFor = `checkbox-${option.value}`;
            label.textContent = option.label || option.value;

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });

        const submitBtn = document.createElement('button');
        submitBtn.textContent = this.promptBox.submitText || 'Confirmar';
        submitBtn.onclick = () => {
            const selected = Array.from(container.querySelectorAll('input:checked'))
                .map(el => el.value);

            if (this.promptBox.handler?.submit) {
                this.promptBox.handler.submit(selected);
            }
            this.#close();
        };

        container.appendChild(submitBtn);
        this.element.appendChild(container);
    }

    #buildUserSelection() {
        const container = document.createElement('div');
        container.className = 'user-selection-container';

        container.innerHTML = `
      <h3>${this.promptBox.title || 'Seleccionar usuarios'}</h3>
      <input 
        type="text" 
        class="user-search" 
        placeholder="Buscar usuarios..."
      >
      <div class="user-list">
        ${(this.promptBox.users || []).map(user => `
          <div class="user-item" data-id="${user.id}">
            <input 
              type="${this.promptBox.multiSelect ? 'checkbox' : 'radio'}" 
              name="user-selection"
              value="${user.id}"
            >
            <img src="${user.avatar}" alt="${user.name}">
            <span>${user.name}</span>
          </div>
        `).join('')}
      </div>
      <button class="confirm-btn">${this.promptBox.submitText || 'Confirmar'}</button>
    `;

        // Búsqueda en tiempo real
        const searchInput = container.querySelector('.user-search');
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase();
            container.querySelectorAll('.user-item').forEach(item => {
                const matches = item.textContent.toLowerCase().includes(term);
                item.style.display = matches ? 'flex' : 'none';
            });
        });

        // Confirmación
        container.querySelector('.confirm-btn').onclick = () => {
            const selected = Array.from(container.querySelectorAll('input:checked'))
                .map(input => {
                    const item = input.closest('.user-item');
                    return {
                        id: item.dataset.id,
                        name: item.querySelector('span').textContent,
                        avatar: item.querySelector('img').src
                    };
                });

            if (this.promptBox.handler?.submit) {
                this.promptBox.handler.submit(
                    this.promptBox.multiSelect ? selected : selected[0]
                );
            }
            this.#close();
        };

        this.element.appendChild(container);
    }

    #CreateView() {
        const card = document.createElement('div');
        card.className = 'Prompt glass';

        const Container = document.createElement('div');
        Container.className = 'Meta';

        const header = document.createElement('h2');
        header.textContent = this.promptBox.title;

        const message = document.createElement('p');
        message.textContent =
            typeof this.promptBox.msg === 'number' ?
            this.#resolveMsgCode(this.promptBox.msg) :
            this.promptBox.msg;

        Container.appendChild(header);
        Container.appendChild(message);

        card.appendChild(Container);

        return card;
    }

    #resolveMsgCode(code) {
        const messages = {
            0xDFF: 'Do you want to allow this action?',
            0xDFE: 'Select a file to upload',
            // ...otros códigos
        };
        return messages[code] || 'Unknown message code';
    }

    #buildUAC() {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'Actions'

        const acceptBtn = document.createElement('button');
        acceptBtn.textContent = 'Accept';
        acceptBtn.onclick = () => {
            this.promptBox.handler?.accept?.();
            this.#close();
        };

        const declineBtn = document.createElement('button');
        declineBtn.textContent = 'Decline';
        declineBtn.onclick = () => {
            this.promptBox.handler?.declined?.();
            this.#close();
        };

        buttonsDiv.appendChild(acceptBtn);
        buttonsDiv.appendChild(declineBtn);
        this.element.appendChild(buttonsDiv);
    }

    #buildDropdown() {
        const {
            Options,
            SubmitButton,
            handler
        } = this.promptBox;

        if (!Options || typeof Options !== 'object') {
            throw new Error('Dropdown requires an Options object');
        }

        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'Prompt-dropdown';

        // Crear select element
        const select = document.createElement('select');
        select.className = 'Prompt-select';

        // Añadir opciones
        for (const [value, text] of Object.entries(Options)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            select.appendChild(option);
        }

        // Crear botón de submit
        const submitBtn = document.createElement('button');
        submitBtn.className = 'Prompt-submit';
        submitBtn.textContent = SubmitButton?.Default || 'Submit';

        // Eventos
        if (handler?.resolve) {
            select.addEventListener('change', (e) => {
                handler.resolve(e.target.value);
            });
        }

        submitBtn.onclick = () => {
            if (handler?.submit) {
                handler.submit(select.value);
            }
            this.#close();
        };

        dropdownContainer.appendChild(select);
        dropdownContainer.appendChild(submitBtn);
        this.element.appendChild(dropdownContainer);
    }

    #buildProgress() {
        const {
            Options
        } = this.promptBox;
        const progressContainer = document.createElement('div');
        progressContainer.className = 'Prompt-progress';

        // Determinar tipo de progress
        const barType = Options?.BarType || 'static';
        const isDynamic = Options?.isDynamicBar || false;

        if (barType === 'infinite') {
            this.#buildInfiniteProgress(progressContainer, Options);
        } else if (barType === 'static') {
            this.#buildStaticProgress(progressContainer, Options);
        } else if (barType === 'node') {
            this.#buildNodeProgress(progressContainer, Options);
        } else if (barType === 'circle') {
            this.#buildCircleLoader(progressContainer, Options);
        }

        this.element.appendChild(progressContainer);
    }

    #buildInfiniteProgress(container, options) {
        const infiniteBar = document.createElement('div');
        infiniteBar.className = 'Progress-infinite';
        infiniteBar.style.backgroundColor = options.BarColor || '#4a90e2';
        container.appendChild(infiniteBar);

        // Añadir animación CSS via JavaScript
        infiniteBar.style.animation = 'infiniteProgress 2s linear infinite';
    }

    #buildStaticProgress(container, options) {
        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'Progress-static-wrapper';

        const progressBar = document.createElement('div');
        progressBar.className = 'Progress-static-bar';
        progressBar.style.backgroundColor = options.BarColor || '#4a90e2';
        progressBar.style.width = '0%'; // Inicialmente vacío

        // Si hay handler, exponemos métodos para controlar la barra
        if (this.promptBox.handler) {
            this.promptBox.handler.setProgress = (percentage) => {
                progressBar.style.width = `${percentage}%`;
            };

            this.promptBox.handler.finish = () => {
                progressBar.style.width = '100%';
                setTimeout(() => this.#close(), 500);
            };
        }

        progressWrapper.appendChild(progressBar);
        container.appendChild(progressWrapper);
    }

    #buildCircleLoader(container, options) {
        const circleLoader = document.createElement('div');
        circleLoader.className = 'Progress-circle';
        circleLoader.style.borderColor = options.BarColor || '#4a90e2';

        // Control para progreso determinado (0-100)
        if (this.promptBox.handler) {
            this.promptBox.handler.setProgress = (percentage) => {
                const deg = (percentage / 100) * 360;
                circleLoader.style.background =
                    `conic-gradient(${options.BarColor || '#4a90e2'} ${deg}deg, transparent ${deg}deg)`;
            };
        }

        container.appendChild(circleLoader);
    }

    #buildNodeProgress(container, options) {
        const nodeProgress = document.createElement('div');
        nodeProgress.className = 'Progress-node';

        // Crear la barra base
        const progressBar = document.createElement('div');
        progressBar.className = 'Progress-node-bar';
        progressBar.style.backgroundColor = options.BarColor ? `${options.BarColor}20` : '#4a90e220'; // Color con transparencia

        // Crear los nodos
        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'Progress-node-container';

        // Determinar nodos (si no se especifican, usamos 3 por defecto)
        const nodeCount = options.NodeCount || 3;
        const nodes = [];

        for (let i = 0; i < nodeCount; i++) {
            const node = document.createElement('div');
            node.className = 'Progress-node-point';
            node.dataset.step = i + 1;
            node.style.backgroundColor = options.BarColor || '#4a90e2';

            // Añadir tooltip si hay labels
            if (options.NodeLabels && options.NodeLabels[i]) {
                const tooltip = document.createElement('span');
                tooltip.className = 'Progress-node-tooltip';
                tooltip.textContent = options.NodeLabels[i];
                node.appendChild(tooltip);
            }

            nodes.push(node);
            nodesContainer.appendChild(node);
        }

        // Barra de progreso activa (que se llena)
        const activeProgress = document.createElement('div');
        activeProgress.className = 'Progress-node-active';
        activeProgress.style.backgroundColor = options.BarColor || '#4a90e2';
        activeProgress.style.width = '0%';

        // Configurar handlers para control externo
        if (this.promptBox.handler) {
            this.promptBox.handler = {
                ...this.promptBox.handler,
                setNode: (nodeIndex) => {
                    const percentage = (nodeIndex / (nodeCount - 1)) * 100;
                    activeProgress.style.width = `${percentage}%`;

                    // Actualizar estado de los nodos
                    nodes.forEach((node, idx) => {
                        node.classList.toggle('active', idx <= nodeIndex);
                        node.classList.toggle('completed', idx < nodeIndex);
                    });
                },
                nextNode: () => {
                    const current = parseInt(activeProgress.style.width) || 0;
                    const nextNode = Math.min(
                        Math.ceil((current / 100) * (nodeCount - 1) + 1),
                        nodeCount - 1
                    );
                    this.promptBox.handler.setNode(nextNode);
                },
                getCurrentNode: () => {
                    const current = parseInt(activeProgress.style.width) || 0;
                    return Math.round((current / 100) * (nodeCount - 1));
                }
            };
        }

        progressBar.appendChild(activeProgress);
        nodeProgress.appendChild(progressBar);
        nodeProgress.appendChild(nodesContainer);
        container.appendChild(nodeProgress);
    }

    #buildRangeInput() {
        const {
            min = 0, max = 100, value = 50, step = 1, unit = ''
        } = this.promptBox;

        const rangeContainer = document.createElement('div');
        rangeContainer.className = 'Prompt-range';

        // Input de tipo range
        const rangeInput = document.createElement('input');
        rangeInput.type = 'range';
        rangeInput.min = min;
        rangeInput.max = max;
        rangeInput.value = value;
        rangeInput.step = step;
        rangeInput.className = 'Prompt-range-input';

        // Display del valor
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'Prompt-range-value';
        valueDisplay.textContent = `${value}${unit}`;

        // Botón de confirmación
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'Prompt-confirm';
        confirmBtn.textContent = this.promptBox.confirmText || 'Confirmar';

        // Eventos
        rangeInput.addEventListener('input', (e) => {
            valueDisplay.textContent = `${e.target.value}${unit}`;
            this.promptBox.handler?.onChange?.(parseFloat(e.target.value));
        });

        confirmBtn.addEventListener('click', () => {
            this.promptBox.handler?.onConfirm?.(parseFloat(rangeInput.value));
            this.#close();
        });

        rangeContainer.appendChild(rangeInput);
        rangeContainer.appendChild(valueDisplay);
        rangeContainer.appendChild(confirmBtn);
        this.element.appendChild(rangeContainer);
    }

    #buildColorPicker() {
        const {
            defaultColor = '#3a7bd5', showPreview = true
        } = this.promptBox;

        const colorContainer = document.createElement('div');
        colorContainer.className = 'Prompt-color';

        // Input de tipo color
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = defaultColor;
        colorInput.className = 'Prompt-color-input';

        // Preview del color
        const colorPreview = document.createElement('div');
        colorPreview.className = 'Prompt-color-preview';
        colorPreview.style.backgroundColor = defaultColor;

        // Display del valor HEX
        const hexDisplay = document.createElement('span');
        hexDisplay.className = 'Prompt-color-hex';
        hexDisplay.textContent = defaultColor;

        // Botón de confirmación
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'Prompt-confirm';
        confirmBtn.textContent = this.promptBox.confirmText || 'Seleccionar';

        // Eventos
        colorInput.addEventListener('input', (e) => {
            const color = e.target.value;
            colorPreview.style.backgroundColor = color;
            hexDisplay.textContent = color;
            this.promptBox.handler?.onChange?.(color);
        });

        confirmBtn.addEventListener('click', () => {
            this.promptBox.handler?.onConfirm?.(colorInput.value);
            this.#close();
        });

        colorContainer.appendChild(colorInput);
        if (showPreview) {
            colorContainer.appendChild(colorPreview);
            colorContainer.appendChild(hexDisplay);
        }
        colorContainer.appendChild(confirmBtn);
        this.element.appendChild(colorContainer);
    }

    #buildFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.promptBox.handler?.resolve?.(file);
            } else {
                this.promptBox.handler?.reject?.();
            }
            this.#close();
        };
        this.element.appendChild(input);
    }

    #buildActions() {
        const {
            Actions,
            handler
        } = this.promptBox;

        if (!Actions || typeof Actions !== 'object') {
            throw new Error('Actions must be an object with { "Button Text": "actionKey" }');
        }

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'Prompt-actions';

        // Crear un botón por cada acción definida
        for (const [buttonText, actionKey] of Object.entries(Actions)) {
            const button = document.createElement('button');
            button.textContent = buttonText;
            button.onclick = () => {
                if (handler && typeof handler[actionKey] === 'function') {
                    handler[actionKey]();
                }
                this.#close();
            };
            buttonsDiv.appendChild(button);
        }

        this.element.appendChild(buttonsDiv);
    }

    #buildForm() {
        const {
            Input,
            handler
        } = this.promptBox;

        if (!Input || typeof Input !== 'object') {
            throw new Error('Input must be an object with { label, type }');
        }

        const form = document.createElement('form');
        form.className = 'Prompt-form';

        // Input principal
        const input = document.createElement('input');
        input.type = this.#resolveInputType(Input.type); // 0xA00 -> 'text', 0xA01 -> 'password'
        input.placeholder = Input.label || '';
        input.required = true;

        // Botón de submit
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = Input['btnLabel'] || 'Submit';

        // Eventos
        form.onsubmit = (e) => {
            e.preventDefault();
            if (handler?.submit) {
                handler.submit(input.value);
            }
            this.#close();
        };

        if (handler?.resolve) {
            input.addEventListener('input', (e) => {
                handler.resolve(e.target.value);
            });
        }

        form.appendChild(input);
        form.appendChild(submitBtn);
        this.element.appendChild(form);
    }

    #resolveInputType(typeCode) {
        const types = {
            0xA00: 'text',
            0xA01: 'password',
            // ...otros códigos
        };
        return types[typeCode] || 'text'; // Default a texto
    }

    #close() {
        return new Promise((resolve) => {
            if (!this.element || !this.element.parentNode) {
                resolve();
                return;
            }

            // Reemplazar clase de slide-up por slide-down
            this.element.classList.remove('slide-up');
            this.element.classList.add('slide-down');

            // Esperar a que termine la animación antes de remover el elemento
            this.element.addEventListener('animationend', () => {
                this.element.parentNode.removeChild(this.element);
                resolve();
            }, {
                once: true
            }); // El evento se autoremueve después de ejecutarse
        });
    }
}

// UI Kit (App View)
class DynamicView {
    constructor(config) {
        this.config = {
            model: 'ListView',
            layout: 'portrait',
            startOrientation: 'top',
            Content: [],
            ...config
        };
        this.element = null;
        this.#validateConfig();
    }

    #validateConfig() {
        const validModels = ['ListView', 'CardView', 'GridView', 'Flexbox'];
        if (!validModels.includes(this.config.model)) {
            throw new Error(`Invalid model: ${this.config.model}. Valid options are ${validModels.join(', ')}`);
        }

        const validLayouts = ['landscape', 'portrait'];
        if (!validLayouts.includes(this.config.layout)) {
            throw new Error(`Invalid layout: ${this.config.layout}. Valid options are ${validLayouts.join(', ')}`);
        }

        const validOrientations = this.config.layout === 'landscape' ?
            ['left', 'right'] :
            ['top', 'bottom'];

        if (!validOrientations.includes(this.config.startOrientation)) {
            throw new Error(`Invalid startOrientation for ${this.config.layout} layout: ${this.config.startOrientation}`);
        }
    }

    render(container = document.body) {
        this.element = document.createElement('div');
        this.element.className = `dynamic-view ${this.config.model.toLowerCase()} ${this.config.layout}`;

        // Aplicar dirección basada en orientación
        const flexDirection = this.#getFlexDirection();
        this.element.style.display = 'flex';
        this.element.style.flexDirection = flexDirection;
        this.element.style.gap = '10px';

        // Configuración específica por modelo
        switch (this.config.model) {
            case 'ListView':
                this.#setupListView();
                break;
            case 'CardView':
                this.#setupCardView();
                break;
            case 'GridView':
                this.#setupGridView();
                break;
            case 'Flexbox':
                this.#setupFlexbox();
                break;
        }

        // Añadir contenido
        this.config.Content.forEach(item => {
            const itemElement = this.#createItemElement(item);
            this.element.appendChild(itemElement);
        });

        container.appendChild(this.element);
        return this.element;
    }

    #getFlexDirection() {
        const orientationMap = {
            landscape: {
                left: 'row',
                right: 'row-reverse'
            },
            portrait: {
                top: 'column',
                bottom: 'column-reverse'
            }
        };
        return orientationMap[this.config.layout][this.config.startOrientation];
    }

    #createItemElement(content) {
        const item = document.createElement('div');
        item.className = 'dynamic-view-item';

        if (typeof content === 'string') {
            item.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            item.appendChild(content);
        } else if (typeof content === 'object') {
            // Asumimos que es un objeto con propiedades para el elemento
            Object.assign(item, content);
        }

        // Manejar eventos
        if (this.config.ContentHandler?.click) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                this.config.ContentHandler.click(content);
            });
        }

        return item;
    }

    #setupListView() {
        this.element.style.overflow = this.config.layout === 'landscape' ? 'auto hidden' : 'hidden auto';
        this.element.style.whiteSpace = this.config.layout === 'landscape' ? 'nowrap' : 'normal';

        const items = this.element.querySelectorAll('.dynamic-view-item');
        items.forEach(item => {
            item.style.display = this.config.layout === 'landscape' ? 'inline-block' : 'block';
            item.style.width = this.config.layout === 'landscape' ? '200px' : '100%';
        });
    }

    #setupCardView() {
        this.element.style.flexWrap = 'wrap';
        this.element.style.justifyContent = 'center';

        const items = this.element.querySelectorAll('.dynamic-view-item');
        items.forEach(item => {
            item.style.width = '250px';
            item.style.height = '300px';
            item.style.border = '1px solid #ddd';
            item.style.borderRadius = '8px';
            item.style.padding = '15px';
            item.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        });
    }

    #setupGridView() {
        this.element.style.display = 'grid';
        this.element.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        this.element.style.gap = '15px';
        this.element.style.width = '100%';
    }

    #setupFlexbox() {
        this.element.style.flexWrap = 'wrap';
        this.element.style.justifyContent = 'flex-start';
        this.element.style.alignItems = 'stretch';

        const items = this.element.querySelectorAll('.dynamic-view-item');
        items.forEach(item => {
            item.style.flex = '1 1 200px';
            item.style.minWidth = '200px';
            item.style.maxWidth = '100%';
        });
    }

    updateContent(newContent) {
        this.config.Content = newContent;
        this.element.innerHTML = '';
        this.config.Content.forEach(item => {
            this.element.appendChild(this.#createItemElement(item));
        });
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// UI Kit Webview
class WebView {
    constructor(config = {}) {
        this.config = {
            initialUrl: 'about:blank',
            showControls: true,
            allowNavigation: true,
            userAgent: null,
            ...config
        };

        this.history = [];
        this.historyPosition = -1;
        this.element = null;
        this.iframe = null;
        this.controlsElement = null;
        this.loading = false;
    }

    render(container = document.body) {
        // Crear contenedor principal
        this.element = document.createElement('div');
        this.element.className = 'webview-container';

        // Crear controles de navegación si están habilitados
        if (this.config.showControls) {
            this.#createControls();
        }

        // Crear iframe
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'webview-frame';
        this.iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-modals';

        if (this.config.userAgent) {
            this.iframe.setAttribute('useragent', this.config.userAgent);
        }

        // Configurar eventos
        this.iframe.addEventListener('load', () => this.#handleLoad());
        this.iframe.addEventListener('error', () => this.#handleError());

        this.element.appendChild(this.iframe);
        container.appendChild(this.element);

        // Cargar URL inicial
        this.loadUrl(this.config.initialUrl);

        return this.element;
    }

    #createControls() {
        this.controlsElement = document.createElement('div');
        this.controlsElement.className = 'webview-controls';

        const backBtn = document.createElement('button');
        backBtn.innerHTML = '&larr;';
        backBtn.title = 'Atrás';
        backBtn.addEventListener('click', () => this.goBack());

        const forwardBtn = document.createElement('button');
        forwardBtn.innerHTML = '&rarr;';
        forwardBtn.title = 'Adelante';
        forwardBtn.addEventListener('click', () => this.goForward());

        const reloadBtn = document.createElement('button');
        reloadBtn.innerHTML = '&#x21bb;';
        reloadBtn.title = 'Recargar';
        reloadBtn.addEventListener('click', () => this.reload());

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.className = 'webview-url';
        urlInput.placeholder = 'Ingrese URL';
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.loadUrl(e.target.value);
            }
        });

        const spinner = document.createElement('div');
        spinner.className = 'webview-spinner';

        this.controlsElement.append(backBtn, forwardBtn, reloadBtn, urlInput, spinner);
        this.element.appendChild(this.controlsElement);
    }

    loadUrl(url) {
        if (!url) return;

        // Asegurar que la URL tenga protocolo
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
            url = 'https://' + url;
        }

        this.loading = true;
        this.#updateControls();

        try {
            this.iframe.src = url;
            this.#addToHistory(url);
        } catch (error) {
            console.error('Error loading URL:', error);
            this.loading = false;
            this.#updateControls();
        }
    }

    #handleLoad() {
        this.loading = false;
        this.#updateControls();

        if (this.config.onLoad) {
            this.config.onLoad(this.iframe.contentWindow.location.href);
        }
    }

    #handleError() {
        this.loading = false;
        this.#updateControls();

        if (this.config.onError) {
            this.config.onError();
        }
    }

    #addToHistory(url) {
        // No añadir la misma URL consecutiva
        if (this.history[this.historyPosition] === url) return;

        // Si estamos en medio del historial, cortar el futuro
        this.history = this.history.slice(0, this.historyPosition + 1);

        this.history.push(url);
        this.historyPosition = this.history.length - 1;
    }

    goBack() {
        if (this.historyPosition > 0) {
            this.historyPosition--;
            this.loadUrl(this.history[this.historyPosition], true);
        }
    }

    goForward() {
        if (this.historyPosition < this.history.length - 1) {
            this.historyPosition++;
            this.loadUrl(this.history[this.historyPosition], true);
        }
    }

    reload() {
        if (this.historyPosition >= 0) {
            this.loadUrl(this.history[this.historyPosition]);
        }
    }

    #updateControls() {
        if (!this.controlsElement) return;

        const backBtn = this.controlsElement.querySelector('button:nth-child(1)');
        const forwardBtn = this.controlsElement.querySelector('button:nth-child(2)');
        const reloadBtn = this.controlsElement.querySelector('button:nth-child(3)');
        const urlInput = this.controlsElement.querySelector('input');
        const spinner = this.controlsElement.querySelector('.webview-spinner');

        if (backBtn) backBtn.disabled = this.historyPosition <= 0;
        if (forwardBtn) forwardBtn.disabled = this.historyPosition >= this.history.length - 1;

        if (urlInput && this.historyPosition >= 0) {
            urlInput.value = this.history[this.historyPosition];
        }

        if (spinner) {
            spinner.style.display = this.loading ? 'block' : 'none';
        }

        if (reloadBtn) {
            reloadBtn.innerHTML = this.loading ? '×' : '&#x21bb;';
            reloadBtn.title = this.loading ? 'Detener' : 'Recargar';
        }
    }

    executeScript(code) {
        if (!this.iframe.contentWindow) return null;

        try {
            return this.iframe.contentWindow.eval(code);
        } catch (error) {
            console.error('Error executing script:', error);
            return null;
        }
    }

    injectCSS(css) {
        if (!this.iframe.contentDocument) return;

        const style = document.createElement('style');
        style.textContent = css;
        this.iframe.contentDocument.head.appendChild(style);
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.iframe = null;
        this.element = null;
    }
}

// UI Kit Toast
class Toast {
    static show(config) {
        const toast = document.createElement('div');
        toast.className = `skye-toast ${config.type || 'info'}`;
        toast.innerHTML = `
      <div class="skye-toast-content">${config.message}</div>
      <button class="skye-toast-close">&times;</button>
    `;

        document.body.appendChild(toast);

        // Animación de entrada
        setTimeout(() => toast.classList.add('show'), 10);

        // Cierre automático
        const duration = config.duration || 3000;
        let timeout = setTimeout(() => this.close(toast), duration);

        // Cierre manual
        toast.querySelector('.skye-toast-close').onclick = () => {
            clearTimeout(timeout);
            this.close(toast);
        };
    }

    static close(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }
}

// UI Kit InfoBar
class InfoBar {
    constructor(config) {
        this.bar = document.createElement('div');
        this.bar.className = `skye-info-bar ${config.type || 'info'}`;
        this.bar.innerHTML = `
      <div class="skye-info-content">${config.message}</div>
      ${config.dismissible ? '<button class="skye-info-close">&times;</button>' : ''}
    `;

        if (config.dismissible) {
            this.bar.querySelector('.skye-info-close').onclick = () => this.dismiss();
        }

        document.body.insertBefore(this.bar, document.body.firstChild);
    }

    dismiss() {
        this.bar.classList.add('dismissing');
        setTimeout(() => this.bar.remove(), 300);
    }

    update(message) {
        this.bar.querySelector('.skye-info-content').textContent = message;
    }
}

// UI Kit Music Player
class MusicPlayer {
    constructor(config) {
        this.audio = new Audio();
        this.config = config;
        this.element = this.#createPlayer();
    }

    #createPlayer() {
        const player = document.createElement('div');
        player.className = 'skye-music-player';
        player.innerHTML = `
      <button class="skye-play-btn">▶</button>
      <div class="skye-progress-container">
        <div class="skye-progress-bar"></div>
      </div>
      <div class="skye-track-info">${this.config.trackName || 'Unknown Track'}</div>
      <input type="range" class="skye-volume" min="0" max="1" step="0.01" value="0.7">
    `;

        // Controles
        player.querySelector('.skye-play-btn').onclick = () => this.togglePlay();
        player.querySelector('.skye-volume').oninput = (e) => {
            this.audio.volume = e.target.value;
        };

        // Cargar audio
        this.audio.src = this.config.src;
        this.audio.load();

        // Actualizar progreso
        this.audio.ontimeupdate = () => {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            player.querySelector('.skye-progress-bar').style.width = `${percent}%`;
        };

        return player;
    }

    togglePlay() {
        if (this.audio.paused) {
            this.audio.play();
            this.element.querySelector('.skye-play-btn').textContent = '❚❚';
        } else {
            this.audio.pause();
            this.element.querySelector('.skye-play-btn').textContent = '▶';
        }
    }

    render(target = document.body) {
        target.appendChild(this.element);
    }
}

// UI Kit Video Player
class VideoPlayer {
    constructor(config) {
        this.config = config;
        this.element = this.#createPlayer();
    }

    #createPlayer() {
        const player = document.createElement('div');
        player.className = 'skye-video-player';
        player.innerHTML = `
      <video class="skye-video"></video>
      <div class="skye-video-controls">
        <button class="skye-play-btn">▶</button>
        <input type="range" class="skye-seek" value="0">
        <span class="skye-time">00:00 / 00:00</span>
      </div>
    `;

        this.video = player.querySelector('.skye-video');
        this.seek = player.querySelector('.skye-seek');
        this.timeDisplay = player.querySelector('.skye-time');

        this.video.src = this.config.src;


        // Eventos
        this.video.onplay = () => player.querySelector('.skye-play-btn').textContent = '❚❚';
        this.video.onpause = () => player.querySelector('.skye-play-btn').textContent = '▶';
        this.video.ontimeupdate = this.#updateSeek.bind(this);

        this.seek.oninput = (e) => {
            this.video.currentTime = (e.target.value / 100) * this.video.duration;
        };

        player.querySelector('.skye-play-btn').onclick = () => {
            this.video.paused ? this.video.play() : this.video.pause();
        };

        return player;
    }

    #updateSeek() {
        const percent = (this.video.currentTime / this.video.duration) * 100;
        this.seek.value = percent;

        const formatTime = (time) => {
            const mins = Math.floor(time / 60);
            const secs = Math.floor(time % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };

        this.timeDisplay.textContent = `${formatTime(this.video.currentTime)} / ${formatTime(this.video.duration)}`;
    }

    render(target = document.body) {
        target.appendChild(this.element);
    }
}

// UI Kit Image Viewer
class ImageViewer {
    constructor(config) {
        this.images = config.images || [];
        this.currentIndex = 0;
        this.element = this.#createViewer();
    }

    #createViewer() {
        const viewer = document.createElement('div');
        viewer.className = 'skye-image-viewer';
        viewer.innerHTML = `
      <div class="skye-image-container">
        <img src="${this.images[0]?.src || ''}" alt="${this.images[0]?.alt || ''}">
      </div>
      <button class="skye-prev-btn">‹</button>
      <button class="skye-next-btn">›</button>
      <div class="skye-thumbnails"></div>
    `;

        // Navegación
        viewer.querySelector('.skye-prev-btn').onclick = () => this.navigate(-1);
        viewer.querySelector('.skye-next-btn').onclick = () => this.navigate(1);

        // Miniaturas
        const thumbnails = viewer.querySelector('.skye-thumbnails');
        this.images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = img.src;
            thumb.onclick = () => this.goTo(index);
            thumbnails.appendChild(thumb);
        });

        return viewer;
    }

    navigate(direction) {
        this.currentIndex = (this.currentIndex + direction + this.images.length) % this.images.length;
        this.updateView();
    }

    goTo(index) {
        this.currentIndex = index;
        this.updateView();
    }

    updateView() {
        const img = this.element.querySelector('.skye-image-container img');
        img.src = this.images[this.currentIndex].src;
        img.alt = this.images[this.currentIndex].alt;
    }

    render(target = document.body) {
        target.appendChild(this.element);
    }
}

// UI Kit Hamburger Menu
class HamburgerMenu {
    constructor(config) {
        this.config = config;
        this.isOpen = false;
        this.element = null;
        this.menu = null;
        this.#init();
    }

    #init() {
        // Configuración predeterminada
        this.config = {
            position: 'right', // 'left' | 'right'
            animationSpeed: 300, // ms
            closeOnOutsideClick: true,
            closeOnItemClick: true,
            ...this.config
        };
    }

    render(target = document.body) {
        // Crear botón hamburguesa
        this.element = document.createElement('button');
        this.element.className = 'skye-hamburger';
        this.element.setAttribute('aria-label', 'Menú');
        this.element.setAttribute('aria-expanded', 'false');
        this.element.innerHTML = `
      <span class="line"></span>
      <span class="line"></span>
      <span class="line"></span>
    `;

        // Crear menú desplegable
        this.menu = document.createElement('div');
        this.menu.className = `skye-hamburger-menu ${this.config.position}`;
        this.menu.setAttribute('aria-hidden', 'true');

        // Añadir items al menú
        this.config.items.forEach(item => {
            const itemEl = this.#createMenuItem(item);
            this.menu.appendChild(itemEl);
        });

        // Eventos
        this.element.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se propague y cierre inmediatamente
            this.toggle();
        });

        if (this.config.closeOnOutsideClick) {
            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.element.contains(e.target) && !this.menu.contains(e.target)) {
                    this.close();
                }
            });
        }

        // Añadir al DOM
        if (target) {
            target.appendChild(this.element);
            target.appendChild(this.menu);
        }

        return {
            button: this.element,
            menu: this.menu
        };
    }

    #createMenuItem(item) {
        const itemEl = document.createElement(item.href ? 'a' : 'button');
        itemEl.className = 'menu-item';

        if (item.href) {
            itemEl.href = item.href;
        } else {
            itemEl.type = 'button';
        }

        itemEl.textContent = item.label;

        if (item.onClick) {
            itemEl.addEventListener('click', (e) => {
                if (item.href) e.preventDefault();
                item.onClick();
                if (this.config.closeOnItemClick) this.close();
            });
        }

        return itemEl;
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.element.classList.add('open');
        this.element.setAttribute('aria-expanded', 'true');
        this.menu.classList.add('open');
        this.menu.setAttribute('aria-hidden', 'false');
        this.config.onOpen?.();
    }

    close() {
        this.isOpen = false;
        this.element.classList.remove('open');
        this.element.setAttribute('aria-expanded', 'false');
        this.menu.classList.remove('open');
        this.menu.setAttribute('aria-hidden', 'true');
        this.config.onClose?.();
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        if (this.menu && this.menu.parentNode) {
            this.menu.parentNode.removeChild(this.menu);
        }
        document.removeEventListener('click', this.close);
    }
}

// UI Kit TabBar
class TabBar {
    constructor(config) {
        this.config = {
            tabs: [],
            initialTab: 0,
            position: 'top', // 'top' | 'bottom'
            style: 'default', // 'default' | 'compact' | 'pill'
            onChange: null,
            ...config
        };
        this.activeTab = this.config.initialTab;
        this.element = null;
    }

    render(target = document.body) {
        this.element = document.createElement('div');
        this.element.className = `skye-tabbar ${this.config.position} ${this.config.style}`;

        // Crear pestañas
        this.config.tabs.forEach((tab, index) => {
            const tabElement = document.createElement('button');
            tabElement.className = `tab ${index === this.activeTab ? 'active' : ''}`;
            tabElement.textContent = tab.label;
            tabElement.addEventListener('click', () => this.#switchTab(index));

            if (tab.icon) {
                const icon = document.createElement('span');
                icon.className = `tab-icon ${tab.icon}`;
                tabElement.prepend(icon);
            }

            this.element.appendChild(tabElement);
        });

        if (target) {
            target.appendChild(this.element);
        }

        return this.element;
    }

    #switchTab(index) {
        if (index === this.activeTab) return;

        // Actualizar estado
        const prevTab = this.activeTab;
        this.activeTab = index;

        // Actualizar UI
        this.element.querySelectorAll('.tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === index);
        });

        // Disparar evento
        this.config.onChange?.({
            previous: prevTab,
            current: index,
            tabData: this.config.tabs[index]
        });
    }

    setActiveTab(index) {
        if (index >= 0 && index < this.config.tabs.length) {
            this.#switchTab(index);
        }
    }

    updateTabLabel(index, newLabel) {
        const tab = this.element.querySelector(`.tab:nth-child(${index + 1})`);
        if (tab) {
            tab.textContent = newLabel;
            if (this.config.tabs[index].icon) {
                const icon = document.createElement('span');
                icon.className = `tab-icon ${this.config.tabs[index].icon}`;
                tab.prepend(icon);
            }
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// UI Kit W3BHeader
class WebsiteHeader {
    constructor(config) {
        this.config = {
            logo: '',
            title: '',
            navItems: [],
            fixed: true,
            showHamburger: false,
            hamburgerConfig: {},
            ...config
        };
        this.element = null;
        this.hamburgerMenu = null;
        this._navElMap = new Map(); // id -> <a>
        this._handleResize = null;
    }

    render(target = document.body) {
        this.element = document.createElement('header');
        this.element.className = `skye-website-header ${this.config.fixed ? 'fixed' : ''}`;

        // Logo y título
        const brand = document.createElement('div');
        brand.className = 'header-brand';

        if (this.config.logo) {
            const logo = document.createElement('img');
            logo.src = this.config.logo;
            logo.alt = this.config.title || 'Logo';
            brand.appendChild(logo);
        }

        if (this.config.title) {
            const title = document.createElement('h1');
            title.textContent = this.config.title;
            brand.appendChild(title);
        }
        this.element.appendChild(brand);

        // Menú de navegación (desktop)
        const nav = document.createElement('nav');
        nav.className = 'header-nav';
        this._navElMap.clear();

        this.config.navItems.forEach(item => {
            const navItem = this.#createNavItemEl(item);
            nav.appendChild(navItem);
        });
        this.element.appendChild(nav);

        // Menú hamburguesa (mobile)
        if (this.config.showHamburger) {
            const hamburgerContainer = document.createElement('div');
            hamburgerContainer.className = 'hamburger-container';

            this.hamburgerMenu = new HamburgerMenu({
                items: this.config.navItems,
                position: 'right',
                ...this.config.hamburgerConfig
            });

            this.hamburgerMenu.render(hamburgerContainer);
            this.element.appendChild(hamburgerContainer);
        }

        if (target) target.prepend(this.element);
        this.#setupResponsive();
        return this.element;
    }

    #createNavItemEl(item) {
        const navItem = document.createElement('a');
        navItem.href = item.href || '#';
        navItem.textContent = item.label;
        navItem.className = 'nav-item';

        // soporta atributos arbitrarios (por ejemplo id, data-*)
        if (item.attrs && typeof item.attrs === 'object') {
            Object.entries(item.attrs).forEach(([k, v]) => {
                try {
                    navItem.setAttribute(k, v);
                } catch {}
            });
        }
        // si trae id, lo guardamos y registramos en el mapa
        const id = item.id || item.attrs?.id;
        if (id) {
            navItem.dataset.navId = id;
            this._navElMap.set(id, navItem);
        }

        if (item.onClick) {
            navItem.addEventListener('click', (e) => {
                e.preventDefault();
                item.onClick();
            });
        }
        return navItem;
    }

    #setupResponsive() {
        this._handleResize = () => {
            const nav = this.element.querySelector('.header-nav');
            if (this.config.showHamburger) {
                const isMobile = window.innerWidth < 768;
                nav.style.display = isMobile ? 'none' : 'flex';
            }
        };
        window.addEventListener('resize', this._handleResize);
        this._handleResize();
    }

    // Reemplaza todo el menú (sigue disponible)
    updateNavItems(newItems) {
        this.config.navItems = newItems;
        this._navElMap.clear();

        const nav = this.element.querySelector('.header-nav');
        nav.innerHTML = '';
        newItems.forEach(item => {
            nav.appendChild(this.#createNavItemEl(item));
        });

        if (this.hamburgerMenu) {
            this.hamburgerMenu.destroy();
            const hamburgerContainer = document.createElement('div');
            hamburgerContainer.className = 'hamburger-container';
            this.hamburgerMenu = new HamburgerMenu({
                items: newItems,
                position: 'right',
                ...this.config.hamburgerConfig
            });
            this.hamburgerMenu.render(hamburgerContainer);
            // Reemplaza el contenedor anterior (por si existe)
            const prev = this.element.querySelector('.hamburger-container');
            if (prev) this.element.replaceChild(hamburgerContainer, prev);
            else this.element.appendChild(hamburgerContainer);
        }
    }

    // 🔥 Nuevo: actualiza un item por id SIN reconstruir todo
    updateNavItem(id, patch = {}) {
        // actualiza el modelo
        const arr = this.config.navItems;
        const idx = arr.findIndex(i => i.id === id || i?.attrs?.id === id);
        if (idx >= 0) {
            this.config.navItems[idx] = {
                ...arr[idx],
                ...patch
            };
        }

        // actualiza el DOM si el <a> existe
        const el = this._navElMap.get(id);
        if (el) {
            if (typeof patch.label === 'string') el.textContent = patch.label;
            if (typeof patch.href === 'string') el.href = patch.href;
            if (patch.attrs && typeof patch.attrs === 'object') {
                Object.entries(patch.attrs).forEach(([k, v]) => {
                    try {
                        el.setAttribute(k, v);
                    } catch {}
                });
            }
        }

        // sync hamburguesa si existe
        if (this.hamburgerMenu && typeof this.hamburgerMenu.updateItem === 'function') {
            this.hamburgerMenu.updateItem(id, this.config.navItems[idx]);
        }
    }

    destroy() {
        if (this._handleResize) {
            window.removeEventListener('resize', this._handleResize);
            this._handleResize = null;
        }
        if (this.hamburgerMenu) this.hamburgerMenu.destroy();
        if (this.element?.parentNode) this.element.parentNode.removeChild(this.element);
        this._navElMap.clear();
    }
}


// UI Kit W3BFooter
class WebsiteFooter {
    constructor(config) {
        this.config = {
            title: '', // Título principal del footer
            text: '', // Texto adicional opcional
            logo: '', // URL del logo
            navItems: [], // Enlaces de navegación
            showBackToTop: false, // Mostrar botón "Volver arriba" opcional
            ...config
        };
        this.element = null;
    }

    render(target = document.body) {
        this.element = document.createElement('footer');
        this.element.className = 'skye-website-footer';

        // Logo, título y texto
        const brand = document.createElement('div');
        brand.className = 'footer-brand';

        if (this.config.logo) {
            const logo = document.createElement('img');
            logo.src = this.config.logo;
            logo.alt = this.config.title || 'Logo';
            brand.appendChild(logo);
        }

        if (this.config.title) {
            const titleEl = document.createElement('h2');
            titleEl.textContent = this.config.title;
            titleEl.style.margin = '0';
            brand.appendChild(titleEl);
        }

        if (this.config.text) {
            const textEl = document.createElement('span');
            textEl.textContent = this.config.text;
            brand.appendChild(textEl);
        }

        this.element.appendChild(brand);

        // Navegación
        if (this.config.navItems.length > 0) {
            const nav = document.createElement('nav');
            nav.className = 'footer-nav';

            this.config.navItems.forEach(item => {
                const navItem = document.createElement('a');
                navItem.href = item.href || '#';
                navItem.textContent = item.label;
                navItem.className = 'footer-nav-item';

                if (item.onClick) {
                    navItem.addEventListener('click', e => {
                        e.preventDefault();
                        item.onClick();
                    });
                }

                nav.appendChild(navItem);
            });

            this.element.appendChild(nav);
        }

        // Botón "Back to Top" opcional
        if (this.config.showBackToTop) {
            const backToTop = document.createElement('button');
            backToTop.className = 'footer-back-to-top';
            backToTop.textContent = '↑ Volver arriba';
            backToTop.onclick = () => window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            this.element.appendChild(backToTop);
        }

        if (target) {
            target.appendChild(this.element);
        }

        return this.element;
    }

    updateNavItems(newItems) {
        this.config.navItems = newItems;
        const nav = this.element.querySelector('.footer-nav');
        if (!nav) return;

        nav.innerHTML = '';
        newItems.forEach(item => {
            const navItem = document.createElement('a');
            navItem.href = item.href || '#';
            navItem.textContent = item.label;
            navItem.className = 'footer-nav-item';

            if (item.onClick) {
                navItem.addEventListener('click', e => {
                    e.preventDefault();
                    item.onClick();
                });
            }

            nav.appendChild(navItem);
        });
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Slideshow
class Slideshow {
    constructor(config = {}) {
        this.config = {
            slides: [], // [{src, alt, title, desc}]
            interval: 5000,
            showControls: true,
            autoPlay: true,
            ...config
        };
        this.current = 0;
        this.element = null;
        this.timer = null;
    }

    render(container = document.body) {
        this.element = document.createElement("div");
        this.element.className = "skye-slideshow";

        // Contenedor de slides
        this.slideContainer = document.createElement("div");
        this.slideContainer.className = "skye-slides";

        this.config.slides.forEach((slide, i) => {
            const slideEl = document.createElement("div");
            slideEl.className = "skye-slide";
            slideEl.style.display = i === 0 ? "block" : "none";
            if (i === 0) slideEl.classList.add("active");

            slideEl.innerHTML = `
        <img src="${slide.src}" alt="${slide.alt || ""}">
        <div class="skye-slide-caption">
          <h2>${slide.title || ""}</h2>
          <p>${slide.desc || ""}</p>
        </div>
      `;

            this.slideContainer.appendChild(slideEl);
        });

        this.element.appendChild(this.slideContainer);

        // Controles
        if (this.config.showControls) {
            const prev = document.createElement("button");
            prev.className = "skye-slide-prev";
            prev.innerHTML = "‹";
            prev.onclick = () => this.prev();

            const next = document.createElement("button");
            next.className = "skye-slide-next";
            next.innerHTML = "›";
            next.onclick = () => this.next();

            this.element.append(prev, next);
        }

        container.appendChild(this.element);

        if (this.config.autoPlay) this.start();
        return this.element;
    }

    show(index) {
        const slides = this.slideContainer.querySelectorAll(".skye-slide");
        slides.forEach((s, i) => {
            if (i === index) {
                s.style.display = "block";
                s.classList.add("active");
            } else {
                s.style.display = "none";
                s.classList.remove("active");
            }
        });
        this.current = index;
    }

    next() {
        this.show((this.current + 1) % this.config.slides.length);
    }

    prev() {
        this.show((this.current - 1 + this.config.slides.length) % this.config.slides.length);
    }

    start() {
        this.stop();
        this.timer = setInterval(() => this.next(), this.config.interval);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
    }
}

// Modal/Dialog
class Modal {
    constructor(config) {
        this.config = {
            title: config.title || "Modal Title",
            content: config.content || "Contenido del modal...",
            actions: config.actions || [{
                label: "Cerrar",
                role: "close"
            }],
            closeOnBackdrop: config.closeOnBackdrop ?? true,
            onClose: config.onClose || null
        };
        this.element = null;
    }

    open() {
        // Crear overlay
        const overlay = document.createElement("div");
        overlay.className = "skye-modal-overlay";

        // Crear modal
        const modal = document.createElement("div");
        modal.className = "skye-modal";

        // Header
        const header = document.createElement("div");
        header.className = "skye-modal-header";
        header.innerHTML = `<h3>${this.config.title}</h3>`;

        // Body
        const body = document.createElement("div");
        body.className = "skye-modal-body";
        body.innerHTML = this.config.content;

        // Footer (acciones)
        const footer = document.createElement("div");
        footer.className = "skye-modal-footer";

        this.config.actions.forEach(action => {
            const btn = document.createElement("button");
            btn.textContent = action.label;
            btn.className = "skye-btn";
            btn.onclick = () => {
                if (action.role === "close") {
                    this.close();
                }
                if (action.onClick) action.onClick();
            };
            footer.appendChild(btn);
        });

        // Cerrar con click en backdrop
        if (this.config.closeOnBackdrop) {
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) this.close();
            });
        }

        modal.append(header, body, footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        this.element = overlay;
        setTimeout(() => overlay.classList.add("show"), 10);
    }

    close() {
        if (this.element) {
            this.element.classList.remove("show");
            setTimeout(() => {
                this.element.remove();
                if (this.config.onClose) this.config.onClose();
            }, 300);
        }
    }
}

//  Accordion/Collapse
class Accordion {
    constructor(config) {
        this.config = {
            items: config.items || [], // [{title: "...", content: "..."}]
            multiOpen: config.multiOpen ?? false
        };
        this.element = null;
    }

    render(container = document.body) {
        const acc = document.createElement("div");
        acc.className = "skye-accordion";

        this.config.items.forEach((item, index) => {
            const accItem = document.createElement("div");
            accItem.className = "skye-accordion-item";

            const header = document.createElement("button");
            header.className = "skye-accordion-header";
            header.innerHTML = `<span>${item.title}</span><span class="arrow">›</span>`;

            const panel = document.createElement("div");
            panel.className = "skye-accordion-panel";
            panel.innerHTML = item.content;

            header.addEventListener("click", () => {
                const isOpen = accItem.classList.contains("open");

                if (!this.config.multiOpen) {
                    acc.querySelectorAll(".skye-accordion-item").forEach(i => i.classList.remove("open"));
                }

                if (!isOpen) {
                    accItem.classList.add("open");
                } else {
                    accItem.classList.remove("open");
                }
            });

            accItem.appendChild(header);
            accItem.appendChild(panel);
            acc.appendChild(accItem);
        });

        container.appendChild(acc);
        this.element = acc;
        return acc;
    }
}

// Stepper / Wizard
class Stepper {
    constructor(config) {
        this.config = {
            steps: config.steps || [], // [{title, content}]
            onFinish: config.onFinish || (() => {}),
            startStep: config.startStep || 0
        };
        this.currentStep = this.config.startStep;
        this.element = null;
    }

    render(container = document.body) {
        const wrapper = document.createElement("div");
        wrapper.className = "skye-stepper";

        // --- Header (indicadores de pasos) ---
        const header = document.createElement("div");
        header.className = "skye-stepper-header";

        this.config.steps.forEach((step, i) => {
            const stepEl = document.createElement("div");
            stepEl.className = "skye-step";
            stepEl.innerHTML = `
        <div class="circle">${i + 1}</div>
        <span class="label">${step.title}</span>
      `;
            header.appendChild(stepEl);
        });

        // --- Body (contenido dinámico) ---
        const body = document.createElement("div");
        body.className = "skye-stepper-body";
        body.innerHTML = this.config.steps[this.currentStep].content;

        // --- Footer (botones de control) ---
        const footer = document.createElement("div");
        footer.className = "skye-stepper-footer";

        const prevBtn = document.createElement("button");
        prevBtn.textContent = "Atrás";
        prevBtn.className = "skye-btn secondary";
        prevBtn.onclick = () => this.prev();

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Siguiente";
        nextBtn.className = "skye-btn";
        nextBtn.onclick = () => this.next();

        footer.append(prevBtn, nextBtn);

        wrapper.append(header, body, footer);
        container.appendChild(wrapper);

        this.element = {
            wrapper,
            header,
            body,
            prevBtn,
            nextBtn
        };
        this.#updateUI();
        return wrapper;
    }

    #updateUI() {
        const {
            header,
            body,
            prevBtn,
            nextBtn
        } = this.element;

        // Actualizar estado de los pasos
        header.querySelectorAll(".skye-step").forEach((el, i) => {
            el.classList.toggle("active", i === this.currentStep);
            el.classList.toggle("completed", i < this.currentStep);
        });

        // Actualizar contenido
        body.innerHTML = this.config.steps[this.currentStep].content;

        // Botones
        prevBtn.style.display = this.currentStep === 0 ? "none" : "inline-block";
        if (this.currentStep === this.config.steps.length - 1) {
            nextBtn.textContent = "Finalizar";
        } else {
            nextBtn.textContent = "Siguiente";
        }
    }

    next() {
        if (this.currentStep < this.config.steps.length - 1) {
            this.currentStep++;
            this.#updateUI();
        } else {
            this.config.onFinish();
        }
    }

    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.#updateUI();
        }
    }
}

// Carousel / Slider
class Carousel {
    constructor(config) {
        this.config = {
            items: config.items || [], // [{content: "<h2>Slide</h2>"}]
            autoPlay: config.autoPlay ?? true,
            interval: config.interval || 3000,
            showIndicators: config.showIndicators ?? true,
            showArrows: config.showArrows ?? true,
            loop: config.loop ?? true
        };
        this.currentIndex = 0;
        this.timer = null;
        this.element = null;
    }

    render(container = document.body) {
        const carousel = document.createElement("div");
        carousel.className = "skye-carousel";

        // Wrapper
        const track = document.createElement("div");
        track.className = "skye-carousel-track";

        this.config.items.forEach((item) => {
            const slide = document.createElement("div");
            slide.className = "skye-carousel-slide";
            slide.innerHTML = item.content;
            track.appendChild(slide);
        });

        carousel.appendChild(track);

        // Arrows
        if (this.config.showArrows) {
            const prev = document.createElement("button");
            prev.className = "skye-carousel-prev";
            prev.textContent = "‹";
            prev.onclick = () => this.prev();

            const next = document.createElement("button");
            next.className = "skye-carousel-next";
            next.textContent = "›";
            next.onclick = () => this.next();

            carousel.append(prev, next);
        }

        // Indicators
        if (this.config.showIndicators) {
            const indicators = document.createElement("div");
            indicators.className = "skye-carousel-indicators";

            this.config.items.forEach((_, i) => {
                const dot = document.createElement("span");
                dot.className = "dot";
                dot.onclick = () => this.goTo(i);
                indicators.appendChild(dot);
            });

            carousel.appendChild(indicators);
        }

        container.appendChild(carousel);
        this.element = {
            carousel,
            track
        };

        // Inicializar
        this.#updateUI();

        // Autoplay
        if (this.config.autoPlay) this.start();

        return carousel;
    }

    #updateUI() {
        const {
            track
        } = this.element;
        track.style.transform = `translateX(-${this.currentIndex * 100}%)`;

        const dots = this.element.carousel.querySelectorAll(".dot");
        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === this.currentIndex);
        });
    }

    next() {
        if (this.currentIndex < this.config.items.length - 1) {
            this.currentIndex++;
        } else if (this.config.loop) {
            this.currentIndex = 0;
        }
        this.#updateUI();
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else if (this.config.loop) {
            this.currentIndex = this.config.items.length - 1;
        }
        this.#updateUI();
    }

    goTo(index) {
        this.currentIndex = index;
        this.#updateUI();
    }

    start() {
        this.stop();
        this.timer = setInterval(() => this.next(), this.config.interval);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
    }
}

// Floating Action Button (FAB)
class FAB {
    constructor(config) {
        this.config = {
            icon: config.icon || "+",
            position: config.position || "bottom-right", // bottom-right | bottom-left | top-right | top-left
            actions: config.actions || [] // [{icon, label, onClick}]
        };
        this.isOpen = false;
        this.element = null;
    }

    render(container = document.body) {
        const fabWrapper = document.createElement("div");
        fabWrapper.className = `skye-fab ${this.config.position}`;

        // Botón principal
        const fabBtn = document.createElement("button");
        fabBtn.className = "fab-btn";
        fabBtn.innerHTML = this.config.icon;

        fabBtn.onclick = () => {
            this.isOpen = !this.isOpen;
            fabWrapper.classList.toggle("open", this.isOpen);
        };

        fabWrapper.appendChild(fabBtn);

        // Mini-actions
        if (this.config.actions.length) {
            const actionsContainer = document.createElement("div");
            actionsContainer.className = "fab-actions";

            this.config.actions.forEach(action => {
                const actionBtn = document.createElement("button");
                actionBtn.className = "fab-action";
                actionBtn.innerHTML = action.icon || "•";
                actionBtn.title = action.label || "";

                actionBtn.onclick = () => {
                    if (action.onClick) action.onClick();
                    this.close();
                };

                actionsContainer.appendChild(actionBtn);
            });

            fabWrapper.appendChild(actionsContainer);
        }

        container.appendChild(fabWrapper);
        this.element = fabWrapper;
        return fabWrapper;
    }

    close() {
        if (this.isOpen) {
            this.isOpen = false;
            this.element.classList.remove("open");
        }
    }
}

// Snackbar
class Snackbar {
    static show(config) {
        const bar = document.createElement("div");
        bar.className = `skye-snackbar glass ${config.type || "info"}`;
        bar.innerHTML = `
      <span class="msg">${config.message}</span>
      ${config.actionText ? `<button class="action">${config.actionText}</button>` : ""}
    `;

        document.body.appendChild(bar);

        // Acción opcional
        if (config.actionText && config.onAction) {
            bar.querySelector(".action").onclick = () => {
                config.onAction();
                Snackbar.close(bar);
            };
        }

        // Mostrar
        setTimeout(() => bar.classList.add("show"), 10);

        // Auto cerrar
        const duration = config.duration || 4000;
        setTimeout(() => Snackbar.close(bar), duration);
    }

    static close(bar) {
        if (!bar) return;
        bar.classList.remove("show");
        setTimeout(() => bar.remove(), 300);
    }
}

// Skeleton Loader
class Skeleton {
    constructor(config) {
        this.config = {
            type: config.type || "rect", // rect | circle | text
            width: config.width || "100%",
            height: config.height || "20px",
            count: config.count || 1
        };
        this.element = null;
    }

    render(container = document.body) {
        const wrapper = document.createElement("div");
        wrapper.className = "skye-skeleton-wrapper";

        for (let i = 0; i < this.config.count; i++) {
            const skel = document.createElement("div");
            skel.className = `skye-skeleton ${this.config.type}`;
            skel.style.width = this.config.width;
            skel.style.height = this.config.height;
            wrapper.appendChild(skel);
        }

        container.appendChild(wrapper);
        this.element = wrapper;
        return wrapper;
    }

    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }
}
// UAC Authorize Screen
class Authorize {
    constructor(config) {
        this.config = {
            appName: config.appName || "Mi Aplicación",
            appLogo: config.appLogo || "🔑",
            permissions: config.permissions || [{
                    icon: "👤",
                    text: "Ver tu perfil básico"
                },
                {
                    icon: "📧",
                    text: "Acceder a tu dirección de correo"
                }
            ],
            onAccept: config.onAccept || (() => {}),
            onDeny: config.onDeny || (() => {})
        };
        this.element = null;
    }

    open() {
        const overlay = document.createElement("div");
        overlay.className = "skye-modal-overlay show";

        const box = document.createElement("div");
        box.className = "skye-authorize-box glass";

        box.innerHTML = `
      <div class="auth-header">
        <div class="logo">${this.config.appLogo}</div>
        <h2>Autorizar ${this.config.appName}</h2>
        <p>Esta aplicación solicita los siguientes permisos:</p>
      </div>
      <ul class="auth-permissions">
        ${this.config.permissions
          .map(p => `<li><span class="icon">${p.icon}</span>${p.text}</li>`)
          .join("")}
      </ul>
      <div class="auth-footer">
        <button class="deny">Denegar</button>
        <button class="accept">Aceptar</button>
      </div>
    `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // Eventos
        box.querySelector(".accept").onclick = () => {
            this.close();
            this.config.onAccept();
        };
        box.querySelector(".deny").onclick = () => {
            this.close();
            this.config.onDeny();
        };

        this.element = overlay;
    }

    close() {
        if (this.element) {
            this.element.remove();
        }
    }
}

// Modal
class DetailBox {
    constructor(config) {
        this.config = {
            appName: config.appName || "Mi Aplicación",
            appLogo: config.appLogo || "🔑",
            permissions: config.permissions || [{
                    icon: "👤",
                    text: "Ver tu perfil básico"
                },
                {
                    icon: "📧",
                    text: "Acceder a tu dirección de correo"
                }
            ],
            onAccept: config.onAccept || (() => {}),
            onDeny: config.onDeny || (() => {})
        };
        this.element = null;
    }

    open() {
        const overlay = document.createElement("div");
        overlay.className = "skye-modal-overlay show";

        const box = document.createElement("div");
        box.className = "skye-authorize-box";

        box.innerHTML = `
      <div class="auth-header">
        <div class="logo">${this.config.appLogo}</div>
        <h2>${this.config.appName}</h2>
        <p></p>
      </div>
      <ul class="auth-permissions">
        ${this.config.permissions
          .map(p => `<li><span class="icon">${p.icon}</span>${p.text}</li>`)
          .join("")}
      </ul>
      <div class="auth-footer">
        <button class="deny">Denegar</button>
        <button class="accept">Aceptar</button>
      </div>
    `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // Eventos
        box.querySelector(".accept").onclick = () => {
            this.close();
            this.config.onAccept();
        };
        box.querySelector(".deny").onclick = () => {
            this.close();
            this.config.onDeny();
        };

        this.element = overlay;
    }

    close() {
        if (this.element) {
            this.element.remove();
        }
    }
}

// Login/Register Form
class AuthForm {
    constructor(config) {
        this.config = {
            mode: config.mode || "login", // login | register
            onSubmit: config.onSubmit || ((data) => console.log(data))
        };
        this.element = null;
    }

    render(container = document.body) {
        const box = document.createElement("div");
        box.className = "skye-auth-box";

        box.innerHTML = `
      <div class="auth-tabs">
        <button class="tab-btn login ${this.config.mode === "login" ? "active" : ""}">Login</button>
        <button class="tab-btn register ${this.config.mode === "register" ? "active" : ""}">Register</button>
      </div>
      <form class="auth-form">
        <div class="auth-field">
          <label>Email</label>
          <input type="email" name="email" required placeholder="tu@email.com">
        </div>
        <div class="auth-field">
          <label>Password</label>
          <input type="password" name="password" required placeholder="••••••••">
        </div>
        <div class="extra-fields"></div>
        <button type="submit" class="skye-btn">Continuar</button>
      </form>
    `;

        container.appendChild(box);
        this.element = box;

        // Tabs toggle
        const loginBtn = box.querySelector(".tab-btn.login");
        const regBtn = box.querySelector(".tab-btn.register");
        const extraFields = box.querySelector(".extra-fields");

        const switchMode = (mode) => {
            this.config.mode = mode;
            loginBtn.classList.toggle("active", mode === "login");
            regBtn.classList.toggle("active", mode === "register");

            // extra field para registro
            extraFields.innerHTML = "";
            if (mode === "register") {
                extraFields.innerHTML = `
          <div class="auth-field">
            <label>Confirm Password</label>
            <input type="password" name="confirm" required placeholder="••••••••">
          </div>
        `;
            }
        };

        loginBtn.onclick = () => switchMode("login");
        regBtn.onclick = () => switchMode("register");

        switchMode(this.config.mode);

        // Submit handler
        box.querySelector(".auth-form").onsubmit = (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(e.target));
            if (this.config.mode === "register" && formData.password !== formData.confirm) {
                alert("Passwords do not match ❌");
                return;
            }
            this.config.onSubmit({
                mode: this.config.mode,
                ...formData
            });
        };

        return box;
    }
}

// Setup Wizard (Onboarding)
class SetupWizard {
    constructor(config) {
        this.config = {
            title: config.title || "Configuración inicial",
            steps: config.steps || [
                // Cada paso: { key, title, render(container, data), validate(data)?, onEnter?(data), onLeave?(data) }
            ],
            startStep: config.startStep || 0,
            persistKey: config.persistKey || null, // p.ej. "mui.setup.state"
            onFinish: config.onFinish || ((data) => console.log("Setup done:", data)),
            onSkip: config.onSkip || (() => {}),
            showProgress: config.showProgress ?? true,
            allowSkip: config.allowSkip ?? true
        };
        this.state = this.#loadState() || {};
        this.current = this.config.startStep;
        this.el = null;
    }

    render(container = document.body) {
        // overlay + caja (reutiliza estilos del modal de v2)
        const overlay = document.createElement("div");
        overlay.className = "skye-modal-overlay show";

        const box = document.createElement("div");
        box.className = "skye-setup-box";

        // header
        const header = document.createElement("div");
        header.className = "setup-header";
        header.innerHTML = `
      <div class="titles">
        <h3>${this.config.title}</h3>
        <p class="step-title"></p>
      </div>
      ${this.config.allowSkip ? '<button class="ghost-btn setup-skip">Saltar</button>' : ""}
    `;

        // progress
        const progress = document.createElement("div");
        progress.className = "setup-progress";
        if (!this.config.showProgress) progress.style.display = "none";
        progress.innerHTML = `
      <div class="bar"><div class="bar-fill" style="width:0%"></div></div>
      <div class="dots"></div>
    `;

        // body
        const body = document.createElement("div");
        body.className = "setup-body";

        // footer
        const footer = document.createElement("div");
        footer.className = "setup-footer";
        footer.innerHTML = `
      <button class="skye-btn secondary setup-prev">Atrás</button>
      <button class="skye-btn setup-next">Siguiente</button>
    `;

        box.append(header, progress, body, footer);
        overlay.appendChild(box);
        container.appendChild(overlay);

        // refs
        this.el = {
            overlay,
            box,
            header,
            progress,
            dots: progress.querySelector(".dots"),
            fill: progress.querySelector(".bar-fill"),
            stepTitle: header.querySelector(".step-title"),
            body,
            prev: footer.querySelector(".setup-prev"),
            next: footer.querySelector(".setup-next"),
            skip: header.querySelector(".setup-skip"),
        };

        // dots
        this.config.steps.forEach((s, i) => {
            const d = document.createElement("span");
            d.className = "dot";
            d.title = s.title || `Paso ${i + 1}`;
            this.el.dots.appendChild(d);
        });

        // events
        this.el.prev.onclick = () => this.prev();
        this.el.next.onclick = () => this.next();
        if (this.el.skip) this.el.skip.onclick = () => this.#skip();

        // first paint
        this.#renderStep();
        return overlay;
    }

    async next() {
        const step = this.config.steps[this.current];
        // validación opcional
        if (step.validate) {
            const ok = await step.validate(this.state);
            if (!ok) return; // el paso decide cómo avisar (snackbar/alert/etc.)
        }
        // onLeave opcional
        step.onLeave?.(this.state);

        if (this.current < this.config.steps.length - 1) {
            this.current++;
            this.#renderStep();
        } else {
            this.#persist();
            this.close();
            this.config.onFinish(this.state);
        }
    }

    prev() {
        if (this.current === 0) return;
        const step = this.config.steps[this.current];
        step.onLeave?.(this.state);
        this.current--;
        this.#renderStep();
    }

    close() {
        this.el?.overlay?.remove();
    }

    // ---- helpers ----
    #renderStep() {
        const step = this.config.steps[this.current];
        // título y progreso
        this.el.stepTitle.textContent = step.title || `Paso ${this.current + 1}`;
        const pct = ((this.current) / (this.config.steps.length - 1)) * 100;
        this.el.fill.style.width = `${isFinite(pct) ? pct : 100}%`;
        this.el.prev.style.display = this.current === 0 ? "none" : "inline-flex";
        this.el.next.textContent = this.current === this.config.steps.length - 1 ? "Finalizar" : "Siguiente";

        // dots
        this.el.dots.querySelectorAll(".dot").forEach((dot, i) => {
            dot.classList.toggle("active", i === this.current);
            dot.classList.toggle("done", i < this.current);
        });

        // render contenido del paso
        this.el.body.innerHTML = "";
        const contentHost = document.createElement("div");
        contentHost.className = "setup-content";
        this.el.body.appendChild(contentHost);
        step.render(contentHost, this.state);

        // onEnter opcional
        step.onEnter?.(this.state);

        // persist
        this.#persist();
    }

    #skip() {
        this.close();
        this.config.onSkip();
    }

    #persist() {
        if (!this.config.persistKey) return;
        try {
            localStorage.setItem(this.config.persistKey, JSON.stringify({
                current: this.current,
                state: this.state
            }));
        } catch {}
    }

    #loadState() {
        if (!this.config.persistKey) return null;
        try {
            const raw = localStorage.getItem(this.config.persistKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                this.current = parsed.current ?? this.current;
                return parsed.state ?? {};
            }
        } catch {}
        return null;
    }
}

class Toggle {
    constructor({
        checked = false,
        label = '',
        onChange = null
    } = {}) {
        this.checked = checked;
        this.label = label;
        this.onChange = onChange;
        this.element = null;
    }
    render(target = document.body) {
        const wrap = document.createElement('label');
        wrap.className = 'skye-toggle';
        wrap.innerHTML = `
      <input type="checkbox" ${this.checked ? 'checked' : ''} />
      <span class="track"><span class="thumb"></span></span>
      ${this.label ? `<span class="text">${this.label}</span>` : ''}
    `;
        const input = wrap.querySelector('input');
        input.addEventListener('change', () => {
            this.checked = input.checked;
            this.onChange?.(this.checked);
        });
        target.appendChild(wrap);
        this.element = wrap;
        return wrap;
    }
}

class Badge {
    constructor({
        text = '',
        appearance = 'neutral'
    } = {}) {
        this.text = text;
        this.appearance = appearance; // neutral | info | success | warning | danger
    }
    render(target = document.body) {
        const el = document.createElement('span');
        el.className = `skye-badge ${this.appearance}`;
        el.textContent = this.text;
        target.appendChild(el);
        this.element = el;
        return el;
    }
}

class Tag {
    constructor({
        text = '',
        removable = false,
        onRemove = null
    } = {}) {
        this.text = text;
        this.removable = removable;
        this.onRemove = onRemove;
    }
    render(target = document.body) {
        const el = document.createElement('span');
        el.className = 'skye-tag';
        el.textContent = this.text;
        if (this.removable) {
            const x = document.createElement('button');
            x.className = 'skye-tag-x';
            x.type = 'button';
            x.textContent = '×';
            x.onclick = () => {
                this.onRemove?.();
                el.remove();
            };
            el.appendChild(x);
        }
        target.appendChild(el);
        this.element = el;
        return el;
    }
}

class ProgressRing {
    constructor({
        value = 0,
        size = 36,
        stroke = 4
    } = {}) {
        this.value = value;
        this.size = size;
        this.stroke = stroke;
        this.element = null;
    }
    render(target = document.body) {
        const radius = (this.size - this.stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', this.size);
        svg.setAttribute('height', this.size);
        svg.classList.add('skye-progress-ring');
        svg.innerHTML = `
      <circle class="bg" cx="${this.size/2}" cy="${this.size/2}" r="${radius}" stroke-width="${this.stroke}" fill="none"/>
      <circle class="fg" cx="${this.size/2}" cy="${this.size/2}" r="${radius}" stroke-width="${this.stroke}" fill="none"
        stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"/>
    `;
        this.element = svg;
        target.appendChild(svg);
        this.setValue(this.value);
        return svg;
    }
    setValue(v) {
        this.value = Math.max(0, Math.min(100, v));
        const radius = (this.size - this.stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (this.value / 100) * circumference;
        const fg = this.element?.querySelector('.fg');
        if (fg) fg.style.strokeDashoffset = offset;
    }
}

class Tooltip {
    constructor({
        text = '',
        position = 'top'
    } = {}) {
        this.text = text;
        this.position = position;
    }
    attachTo(el) {
        el.classList.add('skye-tooltip-host');
        const tip = document.createElement('span');
        tip.className = `skye-tooltip ${this.position}`;
        tip.textContent = this.text;
        el.appendChild(tip);
    }
}

class ConsentComponent {
  constructor({ auth = null, cert = "", icon = "", appName = "App", publisher = "Publisher", origin = "Origin", callback = null } = {}) {
    this.oAuth = auth;
    this.cert = cert;
    this.icon = icon;
    this.appName = appName;
    this.publisher = publisher;
    this.origin = origin;
    this.callback = typeof callback === "function" ? callback : null;

    this._mounted = false;
    this._nodes = {};
    this._previousTitle = typeof document !== "undefined" ? document.title : "";
    this._resolve = null;

    // bound handlers
    this._onAccept = this._onAccept.bind(this);
    this._onDeny = this._onDeny.bind(this);
    this._onKey = this._onKey.bind(this);

    // quick terminal auth check (synchronous hook)
    if (!this._terminalRequest(this.oAuth)) {
      throw new Error("Invalid Password Aborting!");
    }
  }

  /* ---------- Public API ---------- */
  open() {
    if (this._mounted) return Promise.reject(new Error("Consent open already"));
    this._render();
    return new Promise((resolve) => { this._resolve = resolve; });
  }

  destroy() {
    if (!this._mounted) return;
    try {
      if (this._nodes.accept) this._nodes.accept.removeEventListener("click", this._onAccept);
      if (this._nodes.deny) this._nodes.deny.removeEventListener("click", this._onDeny);
      document.removeEventListener("keydown", this._onKey);
    } catch (e) { /* ignore */ }

    if (this._nodes.overlay && this._nodes.overlay.parentNode) {
      this._nodes.overlay.parentNode.removeChild(this._nodes.overlay);
    }
    if (typeof document !== "undefined") document.title = this._previousTitle || document.title;
    this._mounted = false;
    this._nodes = {};
    this._resolve = null;
  }

  /* ---------- Internal / protected ---------- */
  _terminalRequest(token) { return this._termLogin(token); }
  _termLogin() { return true; }

  _validateAppCert(cert) {
    if (!cert || typeof cert !== "string") return false;
    const regex = /^\d{6}\-XFS\-(\d{2}\-){2}\d{5}\-\d{49}\-JTFS\-\d{6}$/i;
    return regex.test(cert);
  }

  _generateCLSID() {
    const r4 = () => (Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1).toUpperCase());
    return `{${r4()}${r4()}-${r4()}-${r4()}-${r4()}-${r4()}${r4()}${r4()}}`;
  }

  _finish(result) {
    try { this.destroy(); } catch (e) {}
    if (this._resolve) this._resolve(result);
    if (this.callback) {
      try { this.callback(result); } catch (e) { /* ignore user callback errors */ }
    }
  }

  _onAccept(e) {
    if (e) e.preventDefault();
    this._finish({ granted: this._generateCLSID() });
  }

  _onDeny(e) {
    if (e) e.preventDefault();
    this._finish({ granted: false });
  }

  _onKey(e) {
    if (!this._mounted) return;
    if (e.key === "Escape") this._onDeny();
    if (e.key === "Enter") this._onAccept();
  }

  _render() {
    const ok = this._validateAppCert(this.cert);
    const headClass = ok ? "snap-card head-ok" : "snap-card head-err";

    const html = `
      <div class="snap-overlay consent-overlay" role="dialog" aria-modal="true" aria-label="Consent dialog">
        <div class="${headClass}" role="document">
          <div class="snap-header">
            <img alt="${this.appName}" src="${this.icon || ""}" onerror="this.style.display='none'">
            <div class="snap-header-text">
              <div class="snap-title">${this.appName}</div>
              <div class="snap-small">Publisher: ${this.publisher}</div>
            </div>
          </div>
          <div class="snap-body">
            <div class="meta">File Origin: <strong>${this.origin}</strong></div>
            <div class="meta">This app requests permission to make changes to this device.</div>
            <div class="snap-small">Certificate: ${ok ? "Valid" : "Invalid"}</div>
          </div>
          <div class="snap-actions">
            <button class="snap-btn deny" type="button">No</button>
            <button class="snap-btn primary accept" type="button">Yes</button>
          </div>
        </div>
      </div>
    `;
    const node = ConsentComponent._createNodeFromHTML(html);
    if (!node) throw new Error("Failed to create Consent DOM");

    document.body.appendChild(node);

    this._nodes.overlay = node;
    this._nodes.accept = node.querySelector("button.accept");
    this._nodes.deny = node.querySelector("button.deny");

    // attach listeners (bound handlers)
    if (this._nodes.accept) this._nodes.accept.addEventListener("click", this._onAccept);
    if (this._nodes.deny) this._nodes.deny.addEventListener("click", this._onDeny);
    document.addEventListener("keydown", this._onKey);

    // focus + title
    (this._nodes.accept || this._nodes.deny || document.body).focus();
    this._previousTitle = typeof document !== "undefined" ? document.title : this._previousTitle;
    if (typeof document !== "undefined") document.title = `Snap Control Center - ${this.appName} requires attention`;

    this._mounted = true;
  }

  /* static helper encapsulated INSIDE the class (no external functions) */
  static _createNodeFromHTML(html) {
    if (typeof document === "undefined") return null;
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
  }
}

/* --- Clase DialogBox mejorada --- */
class DialogBox {
  constructor({
    title = "Dialog",
    content = "",
    type = "info",
    iconUrl = null,
    handlers = {},
    labels = {},
    allowOverlayCancel = true
  } = {}) {
    this.title = String(title);
    this.type = String(type).toLowerCase();
    this.iconUrl = iconUrl || null;
    this.handlers = handlers || {};
    this._defaults = { DB_1: "Yes", DB_2: "No", DB_3: "Cancel" };
    this.labels = Object.assign({}, this._defaults, labels || {});
    this._mounted = false;
    this.allowOverlayCancel = !!allowOverlayCancel;

    // bound methods
    this._onKey = this._onKey.bind(this);
    this._onBtn = this._onBtn.bind(this);
    this._onFocusIn = this._onFocusIn.bind(this);
    this._onOverlayClick = this._onOverlayClick.bind(this);

    // render and wire
    this._render(content);
    this._setupListeners();
  }

  /* Public */
  closeDialog(result = null) {
    if (!this._mounted) return;
    // optional onClose handler
    try {
      const h = this.handlers.onClose;
      if (typeof h === "function") h(result);
    } catch (err) { console.error("onClose handler failed", err); }

    // remove button listeners safely
    try {
      if (this._btn1) this._btn1.removeEventListener("click", this._boundBtn1);
      if (this._btn2) this._btn2.removeEventListener("click", this._boundBtn2);
      if (this._btn3) this._btn3.removeEventListener("click", this._boundBtn3);
    } catch (err) {}

    // remove global listeners
    document.removeEventListener("keydown", this._onKey);
    document.removeEventListener("focusin", this._onFocusIn);

    // restore body scroll
    document.body.classList.remove("dialog-open");

    // remove DOM
    try {
      if (this._node && this._node.parentNode) this._node.parentNode.removeChild(this._node);
    } catch (e) {}

    // restore focus
    if (this._previousActive && typeof this._previousActive.focus === "function") {
      try { this._previousActive.focus(); } catch (e) {}
    }

    this._mounted = false;
    // clear refs
    this._node = null;
    this._btn1 = this._btn2 = this._btn3 = null;
  }

  labelsAction(action) {
    return this.labels[action] ?? this._defaults[action] ?? action;
  }

  /* create an img element but provide fallback inline SVG if load fails */
  static _createIconNode(iconUrl, type, size = 40) {
    const wrapper = document.createElement('div');
    wrapper.style.width = `${size}px`;
    wrapper.style.height = `${size}px`;
    wrapper.style.display = 'inline-block';
    wrapper.style.lineHeight = '0';
    wrapper.style.flex = `0 0 ${size}px`;

    if (!iconUrl) {
      wrapper.innerHTML = DialogBox._inlineSVGFor(type, size);
      return wrapper;
    }

    const img = document.createElement('img');
    img.src = iconUrl;
    img.alt = '';
    img.width = size;
    img.height = size;
    img.style.objectFit = 'contain';
    img.style.display = 'inline-block';
    img.addEventListener('error', () => {
      // replace with inline svg fallback so browser doesn't show broken image icon
      wrapper.innerHTML = DialogBox._inlineSVGFor(type, size);
    }, { once: true });

    wrapper.appendChild(img);
    return wrapper;
  }

  static _inlineSVGFor(type, size = 40) {
    const common = `width="${size}" height="${size}" viewBox="0 0 24 24"`;
    if (type === 'error') {
      return `<svg ${common} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#b00020"/><text x="12" y="16" font-size="12" text-anchor="middle" font-family="Arial" fill="#fff">!</text></svg>`;
    } else if (type === 'warning') {
      return `<svg ${common} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#ff9800"/><text x="12" y="16" font-size="12" text-anchor="middle" font-family="Arial" fill="#000">!</text></svg>`;
    } else {
      return `<svg ${common} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#1077c9"/><text x="12" y="16" font-size="12" text-anchor="middle" font-family="Arial" fill="#fff">i</text></svg>`;
    }
  }

  _render(content) {
    const id = `dialog-${Math.random().toString(36).slice(2,9)}`;
    const titleId = `${id}-title`;
    const descId = `${id}-desc`;

    // build overlay
    const overlay = document.createElement('div');
    overlay.className = 'snap-overlay dialog-overlay';
    overlay.setAttribute('role', 'presentation');
    overlay.tabIndex = -1;

    // click overlay to cancel?
    if (this.allowOverlayCancel) overlay.addEventListener('click', this._onOverlayClick);

    // card
    const card = document.createElement('div');
    card.className = 'snap-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', titleId);
    card.setAttribute('aria-describedby', descId);
    card.tabIndex = 0; // allow focus

    // header
    const header = document.createElement('div');
    header.className = 'snap-header';

    const iconWrapper = DialogBox._createIconNode(this.iconUrl, this.type, 40);
    iconWrapper.classList.add('dialog-header-icon');
    header.appendChild(iconWrapper);

    const headerText = document.createElement('div');
    headerText.className = 'snap-header-text';
    const title = document.createElement('div');
    title.className = 'snap-title';
    title.id = titleId;
    title.textContent = this.title;
    headerText.appendChild(title);
    header.appendChild(headerText);

    // body
    const body = document.createElement('div');
    body.className = 'snap-body';
    const inner = document.createElement('div');
    inner.className = 'dialog-body-inner';

    // dialog icon (larger) - we will only produce a decorative element, but avoid broken img by using same fallback
    const bigIconWrapper = DialogBox._createIconNode(this.iconUrl, this.type, 56);
    bigIconWrapper.classList.add('dialog-icon');

    inner.appendChild(bigIconWrapper);

    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-text';
    contentContainer.id = descId;
    // content can be Node or string
    if (content instanceof Node) contentContainer.appendChild(content);
    else contentContainer.innerHTML = String(content || '');

    inner.appendChild(contentContainer);
    body.appendChild(inner);

    // actions
    const actions = document.createElement('div');
    actions.className = 'snap-actions';

    const btn3 = document.createElement('button');
    btn3.className = 'snap-btn DB_3';
    btn3.type = 'button';
    btn3.setAttribute('aria-label', this.labelsAction('DB_3'));
    btn3.textContent = this.labelsAction('DB_3');

    const btn2 = document.createElement('button');
    btn2.className = 'snap-btn DB_2';
    btn2.type = 'button';
    btn2.setAttribute('aria-label', this.labelsAction('DB_2'));
    btn2.textContent = this.labelsAction('DB_2');

    const btn1 = document.createElement('button');
    btn1.className = 'snap-btn primary DB_1';
    btn1.type = 'button';
    btn1.setAttribute('aria-label', this.labelsAction('DB_1'));
    btn1.textContent = this.labelsAction('DB_1');

    actions.appendChild(btn3);
    actions.appendChild(btn2);
    actions.appendChild(btn1);

    // assemble
    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);
    overlay.appendChild(card);

    // attach
    this._node = overlay;
    document.body.appendChild(this._node);
    document.body.classList.add('dialog-open');
    this._mounted = true;

    // cache
    this._btn1 = btn1;
    this._btn2 = btn2;
    this._btn3 = btn3;

    // store previous active element
    this._previousActive = document.activeElement;

    // add button listeners
    this._boundBtn1 = (e) => this._onBtn(e, 'DB_1');
    this._boundBtn2 = (e) => this._onBtn(e, 'DB_2');
    this._boundBtn3 = (e) => this._onBtn(e, 'DB_3');

    this._btn1.addEventListener('click', this._boundBtn1);
    this._btn2.addEventListener('click', this._boundBtn2);
    this._btn3.addEventListener('click', this._boundBtn3);

    // focus first meaningful control
    const toFocus = this._btn1 || this._btn2 || this._btn3 || card;
    try { toFocus.focus(); } catch (e) {}

    // keep refs for focus trapping
    this._focusable = [this._btn1, this._btn2, this._btn3].filter(Boolean);
  }

  _setupListeners() {
    document.addEventListener('keydown', this._onKey);
    document.addEventListener('focusin', this._onFocusIn);
  }

  _onOverlayClick(e) {
    // only close if click on overlay background, not inside card
    if (e.target === this._node && this.allowOverlayCancel) {
      this._onBtn(null, 'DB_3');
    }
  }

  _onBtn(e, action) {
    if (e) e.preventDefault();
    // call specific handler (DB_1/DB_2/DB_3) or generic onAction
    const handler = this.handlers[action] || this.handlers[action.toLowerCase()] || this.handlers.onAction;
    try {
      if (typeof handler === 'function') {
        // pass action and a close function so caller can close manually
        handler(action, (...args) => this.closeDialog(...args));
      }
    } catch (err) {
      console.error('Dialog handler error', err);
    }
    // default close behavior
    const preventClose = this.handlers && this.handlers.preventClose === true;
    if (!preventClose) this.closeDialog(action);
  }

  _onKey(e) {
    if (!this._mounted) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this._onBtn(null, 'DB_3');
      return;
    }

    // Tab focus trap
    if (e.key === 'Tab') {
      const f = this._focusable;
      if (!f || f.length === 0) return;
      const current = document.activeElement;
      const idx = f.indexOf(current);
      if (e.shiftKey) {
        // shift+tab: go previous
        if (idx === -1 || idx === 0) {
          e.preventDefault();
          f[f.length - 1].focus();
        } // else allow default
      } else {
        // tab forward
        if (idx === -1 || idx === f.length - 1) {
          e.preventDefault();
          f[0].focus();
        } // else allow default
      }
    }

    // Enter: if a button focused, activate it; otherwise activate primary
    if (e.key === 'Enter') {
      const active = document.activeElement;
      if (active && active.tagName === 'BUTTON') {
        active.click();
      } else {
        this._onBtn(null, 'DB_1');
      }
    }
  }

  _onFocusIn(e) {
    if (!this._mounted || !this._node) return;
    if (!this._node.contains(e.target)) {
      // bring focus back to first focusable element
      const fallback = (this._focusable && this._focusable[0]) || this._node.querySelector('.snap-card') || this._node;
      try { fallback.focus(); } catch (err) {}
    }
  }
}

class CSS {
    static css(selector, styles) {
        if (!selector || !styles) return;
        const nodes = typeof selector === "string" ? document.querySelectorAll(selector) : selector;
        const list = nodes.length != null ? nodes : [nodes];
        list.forEach((el) => {
            if (!el || !el.style) return;
            if (typeof styles === "object") {
                Object.keys(styles).forEach((k) => (el.style[k] = styles[k]));
            } else if (typeof styles === "string") {
                const noSpaces = styles.replace(/\s/g, "");
                const sep = noSpaces.includes(":") ? ":" : ",";
                const [k, v] = noSpaces.split(sep);
                if (el.style[k] !== undefined) el.style[k] = v;
            }
        });
    }

    static select(selector) {
        const elems = document.querySelectorAll(selector);
        elems.html = function(content) {
            this.forEach((e) => (e.innerHTML = content));
            return this;
        };
        elems.click = function(cb) {
            this.forEach((e) => e.addEventListener("click", cb));
            return this;
        };
        elems.keyup = function(cb) {
            this.forEach((e) => e.addEventListener("keyup", (ev) => cb(ev)));
            return this;
        };
        elems.value = function(cb) {
            this.forEach((e) => e.addEventListener("input", (ev) => cb(ev.target.value)));
            return this;
        };
        elems.clicknull = function(cb) {
            this.forEach((e) => e.removeEventListener("click", cb));
            return this;
        };
        elems.draggable = function() {
            this.forEach((el) => {
                let offX, offY;
                const onMove = (e) => {
                    el.style.left = e.clientX - offX - 10 + "px";
                    el.style.top = e.clientY - offY - 10 + "px";
                    Object.assign(el.style, {
                        cursor: "move",
                        margin: "0",
                        transform: "none",
                        transition: "none"
                    });
                };
                const onUp = () => {
                    document.removeEventListener("mousemove", onMove);
                    document.removeEventListener("mouseup", onUp);
                };
                el.addEventListener("mousedown", (e) => {
                    const rect = el.getBoundingClientRect();
                    offX = e.clientX - rect.left;
                    offY = e.clientY - rect.top;
                    document.addEventListener("mousemove", onMove);
                    document.addEventListener("mouseup", onUp);
                    e.preventDefault();
                });
            });
            return this;
        };
        elems.remove = function() {
            this.forEach((e) => e.remove());
            return this;
        };
        elems.css = function(obj) {
            $.Components.DOM.css(elems, obj);
            return this;
        };
        return elems;
    }

    static ready(cb) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cb);
        else cb();
    }

    static createWidget(elemt, setClsOrID, WgName, path) {
        if (!elemt) return;
        const n = document.createElement(elemt);
        n.setAttribute(setClsOrID, WgName);
        document.querySelector(path)?.appendChild(n);
    }

    static cancelDefaultMenu() {
        document.addEventListener("contextmenu", (ev) => ev.preventDefault());
    }
}

//--------- Setup & Configure ---------------
function SDK_Worker(reg) {
    if (!reg) return;
    const SDK = {
        "About": "Nova Snap UX 1.0.3, SDK Level: 1, Codename: Proyect X",
        "SDK": {
            Build: "12",
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
 ∧ ,,, ∧        Nova Snap Devploment Kit    
(  ̳• · • ̳)      Core SDK 1.0.3
/    づ♡       ©️Copyright (C) 2025 Nova,LLC 

`;
console.log(SDK_Banner);
}

