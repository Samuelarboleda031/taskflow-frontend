# TaskFlow — Frontend Cliente

Interfaz web estática para la aplicación **TaskFlow**. Construida con HTML5, CSS3 y Vanilla JavaScript puro. Diseño premium con Dark Mode y Glassmorphism.

## 🚀 Producción

| Recurso | URL |
|---------|-----|
| App en Vercel | https://taskflow-frontend-self-sigma.vercel.app |
| Repositorio | https://github.com/Samuelarboleda031/taskflow-frontend |

## ✨ Características

- Dark Mode con efectos Glassmorphism
- Creación de tareas con título, descripción y prioridad
- Filtrado por prioridad (Todas / Alta / Media / Baja)
- Contador dinámico de tareas pendientes
- Marcar tareas como completadas
- Eliminar tareas con animación de salida
- Indicador de estado de conexión con la API en tiempo real
- Notificaciones flotantes (Toasts)
- Diseño responsive (mobile-first)
- Manejo de edge cases: lista vacía, error de conexión, validaciones

## 🛠️ Stack

- **HTML5** semántico
- **CSS3** con variables, Grid, Flexbox, animaciones y Glassmorphism
- **JavaScript** Vanilla ES6+ (sin frameworks)
- **Fuentes:** Outfit + Plus Jakarta Sans (Google Fonts)
- **Iconos:** Font Awesome 6
- **Despliegue:** Vercel

## ⚙️ Configuración de la API

La URL del backend se puede configurar de dos formas:

**1. Variable global (recomendado para producción):**
```javascript
window.API_URL = "https://tu-backend.up.railway.app";
```

**2. Por defecto en el código** (`js/app.js`):
```javascript
const API_URL = window.API_URL || "https://taskflow-backend-production-bda5.up.railway.app";
```

## 💻 Uso Local

No requiere instalación. Abre directamente en el navegador:

```bash
# Opción A: Abrir directamente
# Arrastra index.html al navegador

# Opción B: Servidor estático (recomendado)
npm install -g serve
serve .
```
