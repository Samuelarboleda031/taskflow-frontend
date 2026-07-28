/**
 * TaskFlow // JavaScript Application Logic (Impeccable & Robust)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- CONFIGURACIÓN & VARIABLES DE ENTORNO ---
  // Buscamos la URL de la API. Puede estar definida en window.API_URL (inyectada por el despliegue)
  // o utilizar el valor local por defecto.
  const API_URL = window.API_URL || "https://taskflow-backend-production-bda5.up.railway.app";

  // Estado global de la aplicación
  let tasks = [];
  let activeFilter = 'Todas';
  let isApiOnline = false;

  // --- ELEMENTOS DEL DOM ---
  // Header & Status
  const connectionStatusBadge = document.getElementById('connection-status');
  const pendingCounter = document.getElementById('pending-counter');
  
  // Formulario
  const taskForm = document.getElementById('task-form');
  const taskTitleInput = document.getElementById('task-title');
  const taskDescInput = document.getElementById('task-desc');
  const taskPriorityInput = document.getElementById('task-priority');
  const priorityChips = document.querySelectorAll('.priority-chip');
  const submitBtn = document.getElementById('submit-btn');
  const formErrorAlert = document.getElementById('form-error-alert');
  
  // Validaciones
  const titleValidationMsg = document.getElementById('title-validation-msg');
  const priorityValidationMsg = document.getElementById('priority-validation-msg');

  // Listado & Estados
  const taskListContainer = document.getElementById('task-list');
  const listLoader = document.getElementById('list-loader');
  const listErrorContainer = document.getElementById('list-error');
  const listErrorMsg = document.getElementById('list-error-msg');
  const emptyStateContainer = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptyDescription = document.getElementById('empty-description');
  const retryBtn = document.getElementById('retry-btn');
  const priorityFilterBtns = document.querySelectorAll('.filter-btn');
  
  // Toast container
  const toastContainer = document.getElementById('toast-container');

  // --- VERIFICACIÓN DE CONFIGURACIÓN ---
  // Si la URL de la API no está definida o está vacía (por ejemplo, configurada incorrectamente),
  // mostramos un error de configuración claro en la pantalla principal.
  if (!API_URL || API_URL.trim() === "" || API_URL.includes("API_URL_PLACEHOLDER")) {
    showConfigurationError("La variable de configuración de la URL de la API no está definida o tiene un formato incorrecto. Por favor, revisa el archivo de configuración o inyecta window.API_URL.");
    return;
  }

  // --- INICIALIZACIÓN ---
  initApp();

  function initApp() {
    setupThemeToggle();
    setupEventListeners();
    checkApiConnection();
  }

  // --- TEMA CLARO / OSCURO ---
  function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('tf-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('tf-theme', 'light');
      }
    });
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Manejo de clicks en chips de prioridad
    priorityChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const selectedPriority = chip.getAttribute('data-priority');
        selectPriority(selectedPriority);
      });
    });

    // Envío del formulario de tareas
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit();
    });

    // Validación interactiva en tiempo real al escribir
    taskTitleInput.addEventListener('input', () => {
      validateTitle();
    });

    // Filtros de prioridad
    priorityFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        setActiveFilter(filter);
      });
    });

    // Botón de reintento ante fallos de conexión
    retryBtn.addEventListener('click', () => {
      checkApiConnection();
    });
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-eliminar después de 3.5 segundos
    setTimeout(() => {
      toast.classList.add('exit');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3500);
  }

  // --- MUESTRA UN ERROR DE CONFIGURACIÓN CRÍTICO ---
  function showConfigurationError(message) {
    document.body.innerHTML = `
      <div class="ambient-glow"></div>
      <div class="app-container" style="justify-content: center; align-items: center; min-height: 100vh;">
        <div class="glass-card" style="max-width: 500px; width: 100%; text-align: center; border-color: var(--color-high);">
          <div style="font-size: 3.5rem; color: var(--color-high); margin-bottom: 1.5rem;">
            <i class="fa-solid fa-gears"></i>
          </div>
          <h2 style="font-family: 'Outfit', sans-serif; color: var(--text-title); margin-bottom: 1rem; font-weight: 700;">Error de Configuración</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem;">
            ${message}
          </p>
          <div style="font-size: 0.8rem; color: var(--text-dimmed); background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 8px;">
            Define <code style="color: #c084fc; font-family: monospace;">window.API_URL</code> con el dominio de tu Backend en Railway.
          </div>
        </div>
      </div>
    `;
  }

  // --- ESTADOS DE CONEXIÓN API ---
  async function checkApiConnection() {
    setConnectionState('checking');
    showLoader(true);
    showErrorState(false);
    showEmptyState(false);
    taskListContainer.classList.add('hidden');

    try {
      // Intentamos llamar a la API
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        tasks = data;
        isApiOnline = true;
        setConnectionState('connected');
        showLoader(false);
        
        // Renderizar el listado
        renderTasks();
        updatePendingCounter();
        showToast('Conectado a la API exitosamente', 'success');
      } else {
        throw new Error(`API respondió con estado: ${response.status}`);
      }
    } catch (error) {
      console.error("Fallo de conexión API:", error);
      isApiOnline = false;
      setConnectionState('error');
      showLoader(false);
      showErrorState(true, `No se pudo conectar al servidor de la API (${API_URL}). Verifica que el servidor backend esté corriendo.`);
      showToast('Error de conexión con el servidor', 'error');
    }
  }

  function setConnectionState(state) {
    connectionStatusBadge.className = `status-badge ${state}`;
    const dot = connectionStatusBadge.querySelector('.status-dot');
    const text = connectionStatusBadge.querySelector('.status-text');
    
    if (state === 'checking') {
      text.textContent = 'Conectando...';
    } else if (state === 'connected') {
      text.textContent = 'API Conectada';
    } else {
      text.textContent = 'API Desconectada';
    }
  }

  // --- SELECCIONAR PRIORIDAD EN FORMULARIO ---
  function selectPriority(priority) {
    // Remover clase activa de todos los chips
    priorityChips.forEach(c => c.classList.remove('active'));
    
    // Buscar el chip correspondiente y activarlo
    const activeChip = Array.from(priorityChips).find(c => c.getAttribute('data-priority') === priority);
    if (activeChip) {
      activeChip.classList.add('active');
      activeChip.setAttribute('aria-checked', 'true');
    }
    
    // Sincronizar el input oculto
    taskPriorityInput.value = priority;
    
    // Limpiar mensaje de validación si existe
    validatePriority();
  }

  // --- VALIDACIÓN DE FORMULARIO EN CLIENTE ---
  function validateTitle() {
    const titleVal = taskTitleInput.value.trim();
    if (!titleVal) {
      titleValidationMsg.textContent = 'El título de la tarea es obligatorio.';
      titleValidationMsg.classList.add('visible');
      taskTitleInput.style.borderColor = 'var(--color-high)';
      return false;
    } else if (titleVal.length < 3) {
      titleValidationMsg.textContent = 'El título debe tener al menos 3 caracteres.';
      titleValidationMsg.classList.add('visible');
      taskTitleInput.style.borderColor = 'var(--color-high)';
      return false;
    } else {
      titleValidationMsg.textContent = '';
      titleValidationMsg.classList.remove('visible');
      taskTitleInput.style.borderColor = 'var(--color-low)';
      return true;
    }
  }

  function validatePriority() {
    const priorityVal = taskPriorityInput.value;
    if (!priorityVal) {
      priorityValidationMsg.textContent = 'Debes seleccionar un nivel de prioridad.';
      priorityValidationMsg.classList.add('visible');
      return false;
    } else {
      priorityValidationMsg.textContent = '';
      priorityValidationMsg.classList.remove('visible');
      return true;
    }
  }

  // --- CONTROL DEL ENVÍO DE FORMULARIO ---
  async function handleFormSubmit() {
    formErrorAlert.classList.add('hidden');

    // Validar en el cliente antes de enviar
    const isTitleValid = validateTitle();
    const isPriorityValid = validatePriority();

    if (!isTitleValid || !isPriorityValid) {
      showToast('Por favor, corrige los campos del formulario', 'warning');
      return;
    }

    if (!isApiOnline) {
      showToast('No puedes agregar tareas sin conexión a la API', 'error');
      formErrorAlert.querySelector('.alert-text').textContent = 'Error de conexión: El backend está desconectado.';
      formErrorAlert.classList.remove('hidden');
      return;
    }

    // Preparar los datos
    const taskData = {
      title: taskTitleInput.value.trim(),
      description: taskDescInput.value.trim(),
      priority: taskPriorityInput.value
    };

    // Desactivar botón temporalmente para evitar doble envío
    setFormLoading(true);

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      const result = await response.json();

      if (response.ok) {
        // Tarea agregada con éxito
        tasks.unshift(result); // Agregar al inicio de nuestro arreglo local
        
        // Limpiar formulario y estilos de validación
        resetForm();
        
        // Renderizar la lista actualizada
        renderTasks();
        updatePendingCounter(true); // Efecto bump
        showToast('Tarea agregada correctamente', 'success');
      } else {
        // Error de la API (ejemplo 400 Bad Request)
        throw new Error(result.error || 'No se pudo crear la tarea');
      }
    } catch (error) {
      console.error('Error al crear tarea:', error);
      formErrorAlert.querySelector('.alert-text').textContent = error.message || 'Error inesperado al conectar con la API.';
      formErrorAlert.classList.remove('hidden');
      showToast('No se pudo crear la tarea', 'error');
    } finally {
      setFormLoading(false);
    }
  }

  function setFormLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Guardando...';
      submitBtn.querySelector('.btn-icon').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    } else {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').textContent = 'Agregar Tarea';
      submitBtn.querySelector('.btn-icon').innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
    }
  }

  function resetForm() {
    taskForm.reset();
    taskPriorityInput.value = "";
    priorityChips.forEach(c => {
      c.classList.remove('active');
      c.setAttribute('aria-checked', 'false');
    });
    taskTitleInput.style.borderColor = 'var(--border-light)';
  }

  // --- FILTROS DE LISTADO ---
  function setActiveFilter(filter) {
    // Actualizar botones de filtro
    priorityFilterBtns.forEach(btn => {
      if (btn.getAttribute('data-filter') === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    activeFilter = filter;
    renderTasks();
  }

  // --- CONTADORES ---
  function updatePendingCounter(shouldBump = false) {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    pendingCounter.textContent = pendingTasks.length;

    if (shouldBump) {
      pendingCounter.classList.add('bump');
      setTimeout(() => {
        pendingCounter.classList.remove('bump');
      }, 300);
    }
  }

  // --- RENDERIZADO DEL LISTADO ---
  function renderTasks() {
    taskListContainer.innerHTML = '';
    
    // Filtrar tareas locales
    const filteredTasks = tasks.filter(task => {
      if (activeFilter === 'Todas') return true;
      return task.priority.toLowerCase() === activeFilter.toLowerCase();
    });

    if (filteredTasks.length === 0) {
      taskListContainer.classList.add('hidden');
      showEmptyState(true);
      return;
    }

    showEmptyState(false);
    taskListContainer.classList.remove('hidden');

    filteredTasks.forEach(task => {
      const card = createTaskCardElement(task);
      taskListContainer.appendChild(card);
    });
  }

  function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.status === 'completed' ? 'completed' : ''}`;
    card.setAttribute('data-id', task.id);

    // Formatear texto de prioridad para CSS
    const priorityClass = task.priority.toLowerCase();

    card.innerHTML = `
      <div class="task-card-left">
        <div class="custom-checkbox" role="checkbox" aria-checked="${task.status === 'completed'}" tabindex="0" title="Marcar como completada">
          <i class="fa-solid fa-check"></i>
        </div>
        <div class="task-info">
          <span class="task-title">${escapeHTML(task.title)}</span>
          ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
        </div>
      </div>
      <div class="task-card-right">
        <span class="priority-tag ${priorityClass}">
          <span class="chip-indicator"></span>
          ${task.priority}
        </span>
        <button class="action-btn delete-btn" title="Eliminar tarea">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    // Evento de marcar como completado/pendiente al hacer click en el checkbox o en el texto
    const checkbox = card.querySelector('.custom-checkbox');
    const handleToggle = () => toggleTaskStatus(task.id, task.status);
    
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      handleToggle();
    });
    
    // Accesibilidad por teclado en el checkbox
    checkbox.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    });

    // Evento de eliminación
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmAndDeleteTask(task.id);
    });

    return card;
  }

  // --- LOGICA DE ACTUALIZACIÓN (PATCH) ---
  async function toggleTaskStatus(id, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    // Modificar localmente para un feedback visual instantáneo (optimistic UI)
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const oldStatus = tasks[taskIndex].status;
    tasks[taskIndex].status = newStatus;

    // Actualizar visualmente la tarjeta de inmediato
    const card = document.querySelector(`.task-card[data-id="${id}"]`);
    if (card) {
      if (newStatus === 'completed') {
        card.classList.add('completed');
        card.querySelector('.custom-checkbox').setAttribute('aria-checked', 'true');
      } else {
        card.classList.remove('completed');
        card.querySelector('.custom-checkbox').setAttribute('aria-checked', 'false');
      }
    }
    updatePendingCounter(true);

    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Fallo al actualizar el estado de la tarea en la base de datos');
      }

      const updatedTask = await response.json();
      // Asegurar que el estado local esté alineado con el servidor
      tasks[taskIndex] = updatedTask;
      showToast(newStatus === 'completed' ? 'Tarea completada' : 'Tarea reabierta', 'info');
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      // Revertir en caso de fallo
      tasks[taskIndex].status = oldStatus;
      if (card) {
        if (oldStatus === 'completed') {
          card.classList.add('completed');
          card.querySelector('.custom-checkbox').setAttribute('aria-checked', 'true');
        } else {
          card.classList.remove('completed');
          card.querySelector('.custom-checkbox').setAttribute('aria-checked', 'false');
        }
      }
      updatePendingCounter();
      showToast('Error al actualizar la tarea en la API', 'error');
    }
  }

  // --- LOGICA DE ELIMINACIÓN (DELETE) ---
  async function confirmAndDeleteTask(id) {
    // Si queremos confirmación para mayor robustez
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Animación de salida antes de eliminar del DOM
        const card = document.querySelector(`.task-card[data-id="${id}"]`);
        if (card) {
          card.classList.add('slide-out');
          card.addEventListener('animationend', () => {
            // Eliminar del arreglo local
            tasks = tasks.filter(t => t.id !== id);
            card.remove();
            
            // Si el filtro activo se queda vacío
            renderTasks();
            updatePendingCounter();
            showToast('Tarea eliminada correctamente', 'success');
          });
        }
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'No se pudo eliminar la tarea');
      }
    } catch (error) {
      console.error('Error al eliminar la tarea:', error);
      showToast('Error al eliminar la tarea de la base de datos', 'error');
    }
  }

  // --- MANEJO DE ESTADOS DE LA UI ---
  function showLoader(show) {
    if (show) {
      listLoader.classList.remove('hidden');
    } else {
      listLoader.classList.add('hidden');
    }
  }

  function showErrorState(show, message = "") {
    if (show) {
      listErrorMsg.textContent = message;
      listErrorContainer.classList.remove('hidden');
    } else {
      listErrorContainer.classList.add('hidden');
    }
  }

  function showEmptyState(show) {
    if (show) {
      if (activeFilter === 'Todas') {
        emptyTitle.textContent = '¡Todo al día!';
        emptyDescription.textContent = 'No tienes tareas registradas. Comienza agregando una en el formulario lateral.';
      } else {
        emptyTitle.textContent = 'Sin tareas';
        emptyDescription.textContent = `No hay tareas registradas con prioridad "${activeFilter}".`;
      }
      emptyStateContainer.classList.remove('hidden');
    } else {
      emptyStateContainer.classList.add('hidden');
    }
  }

  // --- UTILERIAS ---
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
