# 🌌 Analemma Web Viewer

El **Analemma Web Viewer** es una Progressive Web App (PWA) SSR construida con **Astro 6** y **Tailwind CSS v4** para explorar visualmente los timelapses generados por el orquestador principal.

## 🎯 Características Principales

- **Filtros Dinámicos**: Permite filtrar las capturas por ubicación (`Location`), objeto astronómico (`sun`, `moon`), y tipo de cámara (`north`, `south`).
- **Navegación Fluida**: Implementa transiciones Astro `<ViewTransitions />` para una experiencia similar a una Single Page Application (SPA).
- **Tema Oscuro Persistente**: Tematización `light`/`dark` que respeta la preferencia de SO o persistencia por `localStorage` sin flickering.
- **Reproductor de Timelapse**: Componente personalizado (`Player.astro`) escrito en Vanilla JS que optimiza la carga progresiva de miles de imágenes (buffering) controlando el FPS para que los timelapses se reproduzcan sin saltos.
- **Tipografía**: Fuentes Geist Sans, Geist Mono y Space Grotesk.
- **PWA & SEO Ready**: Manifiestos, iconos dinámicos y meta tags configurados.

---

## 🏗️ Cómo Funciona la Aplicación

### El Generador de Manifiestos

Para que Astro consuma estáticamente los archivos de imágenes capturados fuera de `web/` sin un motor de BBDD, antes de cada compilación corre un script que indexa los archivos de imagen:

```mermaid
graph LR
    A[Node.js (generate-manifest.js)] --> B(Lectura recursiva '../captures/')
    B --> C{Agrupa por id}
    C --> D[Genera 'src/data/manifest.json']
    D -.-> E(Astro build: indexa URLs y params)
```

El objeto de datos es estructurado por `id` (por ejemplo, `sun-usa-arizona-phoenix-north`) para inyectar todas las URLs al reproductor.

### Arquitectura de UI

| Componente | Función |
| --- | --- |
| `Layout.astro` | Skeleton de la app, Navbar, Toggle de temas, PWA Service Worker. |
| `index.astro` | Listado grid (`grid-item`) de capturas con filtros frontend integrados. |
| `[id].astro` | Vista en detalle para cada timelapse. |
| `Player.astro` | El corazón del visor. Lee el buffer del array e intercala los src de un `<img />` interno usando `setInterval` a velocidades variables. |

---

## ⚡ Comandos de Scripts (`web/`)

Desde este directorio (`web/`):

- `npm run dev` - Genera el manifest.json, inicia Astro en `localhost:4321`.
- `npm run build` - Regenera manifest y compila para producción.
- `npm run preview` - Previsualiza los estáticos locales generados.
- `npm run format` / `npm run check` - Asegura consistencia de código JS/Astro mediante Biome.

## 📁 Estructura

```text
web/
├── public/
│   ├── captures/ (symlink a ../captures/)
│   ├── icons/
│   ├── sw.js
│   └── manifest.webmanifest
├── scripts/
│   └── generate-manifest.js
├── src/
│   ├── components/ (Player.astro)
│   ├── data/ (manifest.json generado)
│   ├── layouts/ (Layout.astro)
│   ├── pages/ (index.astro, view/[id].astro)
│   └── styles/ (global.css con Tailwind v4 theme)
├── astro.config.mjs
└── package.json
```