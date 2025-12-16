/**
 * ITSM Service Catalog - Core Application Logic
 * Architecture: Vanilla JS Class-based
 */

// --- UTILS ---
const uuid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// --- DEFAULTS ---
const DEFAULT_SETTINGS = {
    criticalities: ["Alta", "Media", "Baja", "Crítica", "Extrema"],
    statuses: ["En Desarrollo", "Activo", "Inactivo", "Retirado"],
    ci_types: ["Servidor", "Aplicación", "Red", "Base de Datos", "Hardware"],
    ci_statuses: ["Operativo", "En Mantenimiento", "Fuera de Servicio"],
    request_types: ["Solicitud de Servicio", "Info", "Acceso"],
    assignment_groups: ["Mesa de Ayuda", "Infraestructura", "Desarrollo", "Seguridad"],
    contacts: ["Admin", "Soporte", "Gerente IT"]
};

// --- SCHEMAS (Data Models) ---
// Now a function to get dynamic options from store
const getSchemas = (store) => {
    const s = store.getSettings();
    return {
        services: {
            label: "Servicio de Negocio",
            icon: "💼",
            fields: [
                { name: "name", label: "Nombre del Servicio", type: "text", required: true },
                { name: "description", label: "Descripción", type: "textarea", required: true },
                { name: "owner", label: "Propietario (Service Owner)", type: "select", options: s.contacts, required: true },
                { name: "manager", label: "Gestor (Service Manager)", type: "select", options: s.contacts },
                { name: "criticality", label: "Criticidad", type: "select", options: s.criticalities, required: true },
                { name: "availability", label: "Horario Disponibilidad", type: "text", placeholder: "Ej. 24/7, Lun-Vie 9-6" },
                { name: "sla_response", label: "SLA Respuesta (Horas)", type: "number" },
                { name: "cost", label: "Costo Mensual ($)", type: "number" },
                { name: "status", label: "Estado", type: "select", options: s.statuses, required: true },
                { name: "customers", label: "Clientes/Usuarios", type: "text" }
            ],
            relations: [
                { name: "linked_cis", label: "CIs Relacionados", target: "components", multiple: true },
                { name: "linked_requests", label: "Peticiones Asociadas", target: "requests", multiple: true }
            ]
        },
        components: {
            label: "Componente (CI)",
            icon: "🧩",
            fields: [
                { name: "name", label: "Nombre del CI", type: "text", required: true },
                { name: "type", label: "Tipo de CI", type: "select", options: s.ci_types, required: true },
                { name: "status", label: "Estado", type: "select", options: s.ci_statuses, required: true },
                { name: "tech_owner", label: "Propietario Técnico", type: "select", options: s.contacts },
                { name: "location", label: "Ubicación Física/Lógica", type: "text" },
                { name: "version", label: "Versión/Modelo", type: "text" }
            ],
            relations: [
                { name: "parent_service", label: "Servicio Padre", target: "services", multiple: false }
            ]
        },
        requests: {
            label: "Catálogo de Peticiones",
            icon: "📋",
            fields: [
                { name: "name", label: "Nombre Solicitud", type: "text", required: true },
                { name: "type", label: "Tipo", type: "select", options: s.request_types, required: true },
                { name: "category", label: "Categoría", type: "text" },
                { name: "tat", label: "Tiempo Cumplimiento (Días)", type: "number" },
                { name: "approvals", label: "Aprobaciones Requeridas", type: "select", options: ["Ninguna", "Manager", "Owner", "Director"] },
                { name: "cost", label: "Costo ($)", type: "number" }
            ],
            relations: [
                { name: "related_service", label: "Servicio Asociado", target: "services", multiple: false }
            ]
        },
        technical: {
            label: "Información Técnica",
            icon: "🔧",
            fields: [
                { name: "category", label: "Categoría Incidente", type: "text", required: true },
                { name: "subcategory", label: "Subcategoría", type: "text" },
                { name: "L1_group", label: "Grupo Asignación L1", type: "select", options: s.assignment_groups, required: true },
                { name: "L2_group", label: "Grupo Asignación L2", type: "select", options: s.assignment_groups },
                { name: "escalation", label: "Procedimiento Escalado", type: "textarea" },
                { name: "priority", label: "Prioridad Técnica", type: "select", options: ["P1", "P2", "P3", "P4"] },
                { name: "kb_articles", label: "Artículos KB Relacionados", type: "textarea" }
            ],
            relations: [
                { name: "related_service_tech", label: "Aplica al Servicio", target: "services", multiple: true }
            ]
        }
    };
};

// --- DATA STORE MANAGER ---
class ITSMStore {
    constructor() {
        this.STORAGE_KEY = "ITSM_CATALOG_DATA_V1";
        this.data = this.load();
    }

    getEmptyState() {
        return {
            services: [],
            components: [],
            requests: [],
            technical: [],
            settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
        };
    }

    load() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Ensure settings exist if migration from older version
            if (!parsed.settings) {
                parsed.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
            }
            return parsed;
        }
        return this.getEmptyState();
    }

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }

    getSettings() {
        return this.data.settings;
    }

    updateSettingList(key, list) {
        if (this.data.settings[key]) {
            this.data.settings[key] = list;
            this.save();
        }
    }

    add(collection, item) {
        item.id = uuid();
        item.createdAt = new Date().toISOString();
        this.data[collection].push(item);
        this.save();
        return item;
    }

    update(collection, id, updates) {
        const index = this.data[collection].findIndex(i => i.id === id);
        if (index > -1) {
            this.data[collection][index] = { ...this.data[collection][index], ...updates };
            this.save();
            return true;
        }
        return false;
    }

    delete(collection, id) {
        this.data[collection] = this.data[collection].filter(i => i.id !== id);
        this.save();
    }

    get(collection, id) {
        return this.data[collection].find(i => i.id === id);
    }

    getAll(collection) {
        return this.data[collection] || [];
    }

    importData(jsonData) {
        try {
            const parsed = JSON.parse(jsonData);
            if (parsed.services && Array.isArray(parsed.services)) {
                // Ensure settings exist on import
                if (!parsed.settings) {
                    parsed.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
                }
                this.data = parsed;
                this.save();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    }
}

// --- UI RENDERER ---
class UI {
    constructor(store, eventBus) {
        this.store = store;
        this.events = eventBus;
        this.container = document.getElementById('view-container');
        this.modal = document.getElementById('modal-overlay');
        this.form = document.getElementById('dynamic-form');
        this.modalTitle = document.getElementById('modal-title');
    }

    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✔' : 'ℹ'}</span> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    renderSettings() {
        this.container.innerHTML = '';
        const settings = this.store.getSettings();
        const grid = document.createElement('div');
        grid.className = 'data-grid';

        const mapLabels = {
            criticalities: "Niveles de Criticidad",
            statuses: "Estados de Servicio",
            ci_types: "Tipos de CI",
            ci_statuses: "Estados de CI",
            request_types: "Tipos de Solicitud",
            assignment_groups: "Grupos de Asignación",
            contacts: "Contactos / Personas"
        };

        Object.keys(settings).forEach(key => {
            const card = document.createElement('div');
            card.className = 'card';

            const listHtml = settings[key].map((item, idx) =>
                `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #334155;">
                    <span>${item}</span>
                    <button class="small-btn danger-btn remove-setting" data-key="${key}" data-idx="${idx}" style="padding:2px 6px;">×</button>
                 </div>`
            ).join('');

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${mapLabels[key] || key}</div>
                </div>
                <div class="card-body" style="max-height: 200px; overflow-y: auto;">
                    ${listHtml}
                </div>
                <div class="card-actions" style="display:flex; gap:5px;">
                    <input type="text" id="new-${key}" placeholder="Nuevo valor..." style="flex:1; padding:5px; border-radius:4px; border:1px solid #334155; background:#0f172a; color:white;">
                    <button class="primary-btn small-btn add-setting" data-key="${key}">+</button>
                </div>
            `;

            // Bind Add Event
            card.querySelector('.add-setting').addEventListener('click', (e) => {
                const input = document.getElementById(`new-${key}`);
                const val = input.value.trim();
                console.log(val);
                if (val) {
                    this.events.emit('setting-add', { key, value: val });
                }
            });

            // Bind Remove Events
            card.querySelectorAll('.remove-setting').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    this.events.emit('setting-remove', { key, idx });
                });
            });

            grid.appendChild(card);
        });

        this.container.appendChild(grid);
    }

    renderCard(schema, item, collection) {
        // Build card HTML
        const statusClass = item.status ? `status-${item.status.toLowerCase().replace(' ', '-')}` : '';
        const badge = item.status ? `<span class="status-badge ${statusClass}">${item.status}</span>` : '';
        // Visual cue for inactive
        const cardStyle = item.status === 'Inactivo' ? 'opacity: 0.6; border: 1px dashed #475569;' : '';

        let metaHtml = '';
        schema.fields.slice(1, 4).forEach(field => {
            if (item[field.name]) {
                const val = typeof item[field.name] === 'object' ? '...' : item[field.name];
                metaHtml += `
                    <div class="field-group">
                        <span class="field-label">${field.label}</span>
                        <div class="field-value">${val}</div>
                    </div>
                `;
            }
        });

        let relationsHtml = '';
        if (schema.relations) {
            schema.relations.forEach(rel => {
                const relatedIds = item[rel.name];
                if (relatedIds && (Array.isArray(relatedIds) ? relatedIds.length > 0 : relatedIds)) {
                    const count = Array.isArray(relatedIds) ? relatedIds.length : 1;
                    relationsHtml += `<span style="font-size:0.75rem; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; margin-right:4px;">${rel.label}: ${count}</span>`;
                }
            });
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.style = cardStyle;

        // Conditional buttons based on collection/status
        let actionButtons = `
            <button class="card-action-btn view" data-id="${item.id}" data-collection="${collection}">👁 Visualizar</button>
            <button class="card-action-btn edit" data-id="${item.id}" data-collection="${collection}">✎ Editar</button>
        `;

        if (item.status !== 'Inactivo' && item.status !== 'Retirado') {
            actionButtons += `<button class="card-action-btn danger deactivate" data-id="${item.id}" data-collection="${collection}">🚫 Inactivar</button>`;
        } else {
            actionButtons += `<button class="card-action-btn delete" data-id="${item.id}" data-collection="${collection}">🗑 Eliminar</button>`;
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${item.name || item.category || 'Sin Nombre'}</div>
                ${badge}
            </div>
            <div class="card-body">
                ${metaHtml}
                <div style="margin-top:0.5rem">${relationsHtml}</div>
            </div>
            <div class="card-actions">
                ${actionButtons}
            </div>
        `;

        card.querySelector('.view').addEventListener('click', () => this.events.emit('view', { collection, id: item.id }));
        card.querySelector('.edit').addEventListener('click', () => this.events.emit('edit', { collection, id: item.id }));

        const deactivateBtn = card.querySelector('.deactivate');
        if (deactivateBtn) {
            deactivateBtn.addEventListener('click', () => {
                if (confirm('¿Inactivar este registro?')) {
                    this.events.emit('deactivate', { collection, id: item.id });
                }
            });
        }

        const deleteBtn = card.querySelector('.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('¿Eliminar permanentemente?')) {
                    this.events.emit('delete', { collection, id: item.id });
                }
            });
        }

        return card;
    }

    renderGrid(collection, filterText = '') {
        this.container.innerHTML = '';
        const items = this.store.getAll(collection);
        // Important: Get Dynamic Schemas
        const schemas = getSchemas(this.store);
        const schema = schemas[collection];

        const grid = document.createElement('div');
        grid.className = 'data-grid';

        const filtered = items.filter(item => {
            const searchStr = JSON.stringify(item).toLowerCase();
            return searchStr.includes(filterText.toLowerCase());
        });

        if (filtered.length === 0) {
            this.container.innerHTML = `<div class="empty-state" style="text-align:center; padding:3rem; color: #64748b;">
                <h3>No hay registros</h3>
                <p>Crea un nuevo ${schema.label} para comenzar.</p>
            </div>`;
            return;
        }

        filtered.forEach(item => {
            grid.appendChild(this.renderCard(schema, item, collection));
        });

        this.container.appendChild(grid);
    }

    openModal(collection, itemId = null) {
        // Important: Get Dynamic Schemas
        const schemas = getSchemas(this.store);
        const schema = schemas[collection];
        const item = itemId ? this.store.get(collection, itemId) : {};

        this.modalTitle.textContent = itemId ? `Editar ${schema.label}` : `Crear ${schema.label}`;
        this.form.innerHTML = '';
        this.form.dataset.collection = collection;
        this.form.dataset.itemId = itemId || '';

        schema.fields.forEach(field => {
            const wrapper = document.createElement('div');
            wrapper.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = field.label;
            wrapper.appendChild(label);

            let input;
            const value = item[field.name] || '';

            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 3;
            } else if (field.type === 'select') {
                input = document.createElement('select');
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (value === opt) option.selected = true;
                    input.appendChild(option);
                });
            } else {
                input = document.createElement('input');
                input.type = field.type;
            }

            input.name = field.name;
            if (field.required) input.required = true;
            if (value && field.type !== 'select') input.value = value;
            if (field.placeholder) input.placeholder = field.placeholder;

            wrapper.appendChild(input);
            this.form.appendChild(wrapper);
        });

        if (schema.relations) {
            schema.relations.forEach(rel => {
                const wrapper = document.createElement('div');
                wrapper.className = 'form-group';
                wrapper.innerHTML = `<label>${rel.label}</label>`;

                const select = document.createElement('select');
                select.name = rel.name;
                if (rel.multiple) select.multiple = true;
                select.style.height = rel.multiple ? '100px' : 'auto';

                const targets = this.store.getAll(rel.target);

                if (!rel.multiple) {
                    const defaultOpt = document.createElement('option');
                    defaultOpt.value = "";
                    defaultOpt.textContent = "-- Seleccionar --";
                    select.appendChild(defaultOpt);
                }

                targets.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.name || t.category || 'Unnamed';

                    const savedVal = item[rel.name];
                    if (rel.multiple) {
                        if (savedVal && savedVal.includes(t.id)) opt.selected = true;
                    } else {
                        if (savedVal === t.id) opt.selected = true;
                    }

                    select.appendChild(opt);
                });

                wrapper.appendChild(select);
                this.form.appendChild(wrapper);
            });
        }

        // Remove read-only attributes if present (reset)
        this.form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);
        // Show footer listeners
        document.querySelector('.modal-footer').style.display = 'flex';

        this.modal.classList.remove('hidden');
    }

    openViewModal(collection, itemId) {
        // Reuse openModal but disable everything
        this.openModal(collection, itemId);
        this.modalTitle.textContent = `Visualizar Detalle`;
        this.form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);
        // Hide standard save buttons
        document.querySelector('.modal-footer').style.display = 'none';
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.form.reset();
        document.querySelector('.modal-footer').style.display = 'flex'; // Reset visibility
    }
}

// --- APP CONTROLLER ---
class ITSMApp {
    constructor() {
        this.store = new ITSMStore();
        this.currentView = 'services';

        this.events = {
            listeners: {},
            on(event, callback) {
                if (!this.listeners[event]) this.listeners[event] = [];
                this.listeners[event].push(callback);
            },
            emit(event, data) {
                if (this.listeners[event]) this.listeners[event].forEach(cb => cb(data));
            }
        };

        this.ui = new UI(this.store, this.events);
        this.init();
    }

    init() {
        this.bindEvents();
        this.switchView('services');
        console.log("ITSM App Initialized");
    }

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        document.getElementById('btn-create').addEventListener('click', () => {
            this.ui.openModal(this.currentView);
        });

        document.getElementById('global-search').addEventListener('input', (e) => {
            if (this.currentView === 'settings') return;
            this.ui.renderGrid(this.currentView, e.target.value);
        });

        document.getElementById('btn-close-modal').addEventListener('click', () => this.ui.closeModal());
        document.getElementById('btn-cancel-modal').addEventListener('click', () => this.ui.closeModal());

        document.getElementById('dynamic-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e.target);
        });

        this.events.on('edit', (data) => {
            this.ui.openModal(data.collection, data.id);
        });

        this.events.on('view', (data) => {
            this.ui.openViewModal(data.collection, data.id);
        });

        this.events.on('deactivate', (data) => {
            this.store.update(data.collection, data.id, { status: 'Inactivo' });
            this.ui.showToast('Registro inactivado', 'info');
            this.refresh();
        });

        this.events.on('delete', (data) => {
            this.store.delete(data.collection, data.id);
            this.ui.showToast('Registro eliminado', 'success');
            this.refresh();
        });

        // Settings Events
        this.events.on('setting-add', ({ key, value }) => {
            const list = this.store.getSettings()[key];
            if (!list.includes(value)) {
                list.push(value);
                this.store.updateSettingList(key, list);
                this.ui.renderSettings();
                this.ui.showToast('Opción agregada', 'success');
            }
        });

        this.events.on('setting-remove', ({ key, idx }) => {
            const list = this.store.getSettings()[key];
            list.splice(idx, 1);
            this.store.updateSettingList(key, list);
            this.ui.renderSettings();
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (confirm('ATENCIÓN: Esto borrará todos los datos. ¿Estás seguro?')) {
                localStorage.removeItem(this.store.STORAGE_KEY);
                location.reload();
            }
        });

        document.getElementById('btn-export').addEventListener('click', () => {
            const dataStr = JSON.stringify(this.store.data, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `itsm-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
        });

        document.getElementById('file-import').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                if (this.store.importData(event.target.result)) {
                    this.ui.showToast('Datos importados correctamente', 'success');
                    location.reload(); // Reload to refresh schemas
                } else {
                    this.ui.showToast('Error al importar datos', 'error');
                }
            };
            reader.readAsText(file);
        });
    }

    switchView(viewName) {
        this.currentView = viewName;

        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        if (viewName === 'settings') {
            document.getElementById('page-title').textContent = "Configuración del Sistema";
            document.getElementById('btn-create').style.display = 'none';
            document.getElementById('global-search').style.display = 'none';
            this.ui.renderSettings();
        } else {
            // Restore standard view elements
            const schemas = getSchemas(this.store);
            if (schemas[viewName]) {
                document.getElementById('page-title').textContent = schemas[viewName].label;
            }
            document.getElementById('btn-create').style.display = 'block';
            document.getElementById('global-search').style.display = 'block';
            this.refresh();
        }
    }

    refresh() {
        if (this.currentView !== 'settings') {
            this.ui.renderGrid(this.currentView, document.getElementById('global-search').value);
        }
    }

    handleFormSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const schemas = getSchemas(this.store);
        const schema = schemas[this.currentView];

        if (schema.relations) {
            schema.relations.forEach(rel => {
                if (rel.multiple) {
                    const select = form.querySelector(`select[name="${rel.name}"]`);
                    const values = Array.from(select.selectedOptions).map(opt => opt.value);
                    data[rel.name] = values;
                }
            });
        }

        const id = form.dataset.itemId;

        if (id) {
            this.store.update(this.currentView, id, data);
            this.ui.showToast('Registro actualizado', 'success');
        } else {
            this.store.add(this.currentView, data);
            this.ui.showToast('Registro creado', 'success');
        }

        this.ui.closeModal();
        this.refresh();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ITSMApp();
});
