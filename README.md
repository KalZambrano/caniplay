# RigScan — frontend

Detecta el hardware de tu PC directamente en el navegador y verifica si cumple los requisitos
mínimos o recomendados de cualquier juego, componente por componente (GPU, VRAM, RAM, CPU,
almacenamiento).

Este repo es **solo el frontend**. El backend (proxy de la Steam Store API, parser de requisitos
y caché) vive en un repo aparte y hoy no existe todavía — este proyecto funciona de forma
autónoma contra datos mock mientras tanto (ver [Modo mock](#modo-mock-vs-backend-real) abajo).

## Stack

- React 19 + TypeScript (strict) + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`, tokens en `src/styles/globals.css`)
- React Router 7
- Fuentes self-hosted vía `@fontsource` (Chakra Petch, Inter, JetBrains Mono)
- `oxlint` para linting, `prettier` para formato

## Requisitos

- Node 20+
- npm

## Uso

```bash
npm install
cp .env.example .env   # ya viene con VITE_USE_MOCK_DATA=true
npm run dev
```

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck (`tsc -b`) + build de producción |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint` | `oxlint` sobre todo el proyecto |
| `npm run typecheck` | Solo typecheck, sin build |
| `npm run format` | Formatea con Prettier |

## Modo mock vs. backend real

El servicio `src/features/game-search/services/games.service.ts` abstrae la fuente de datos.
Ninguna UI sabe si los datos vienen de `src/data/mock-games.json` o del backend real — el
switch es puramente de configuración:

```
VITE_USE_MOCK_DATA=true    # usa src/data/mock-games.json (default, no requiere backend)
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=https://tu-worker.workers.dev   # apunta al backend real
```

`mock-games.json` incluye **Dota 2 con datos reales** parseados de la Steam Store API
(`appdetails?appids=570`) — incluyendo el caso real de que ese juego no publica requisitos
recomendados, solo mínimos. El resto son juegos ficticios (`(demo)` en el nombre) pensados para
cubrir todo el rango de veredictos, incluyendo un caso deliberado de CPU no reconocida por la
tabla de benchmarks, para probar el estado "no verificado".

Cuando el repo del backend exista, solo hace falta apuntar `VITE_API_BASE_URL` y poner
`VITE_USE_MOCK_DATA=false` — el contrato esperado es:

- `GET /search?q=<texto>` → `GameSearchResult[]`
- `GET /game/:id` → `GameDetail` (404 si no existe)

Los tipos de ambos están en `src/features/game-search/types/game.types.ts`.

## Decisiones de arquitectura

**Por qué el hardware detectado tiene "confianza", no solo un valor.** Un navegador nunca puede
leer las specs reales de una PC — todo es una inferencia a partir de APIs limitadas
(`navigator.deviceMemory` está capado y solo existe en Chromium; el modelo de GPU sale de
`WEBGL_debug_renderer_info`/WebGPU; el modelo de CPU **no se puede leer** en absoluto). Por eso
`DetectedHardware` guarda un `DetectionConfidence` (`measured` / `estimated` / `unknown`) junto a
cada valor, y la UI lo refleja con un asterisco — nunca se presenta una estimación como un hecho.

**Por qué el modelo de CPU se pide a mano.** No hay ninguna API de navegador que exponga el
modelo de CPU. `HardwareScanPanel` detecta núcleos automáticamente pero deja un campo de texto
para que la persona complete el modelo; hasta que lo hace, cualquier requisito de CPU se marca
como "no verificado" en vez de arriesgar un veredicto falso.

**Por qué el hardware se detecta una sola vez, en contexto.** Si cada página corriera su propio
`useHardwareDetection`, el modelo de CPU escrito a mano en el home se perdería al navegar a un
juego. `HardwareProvider` (`src/features/hardware-detection/context/`) corre el escaneo una sola
vez por sesión y lo comparte vía contexto.

**Por qué el almacenamiento nunca es "pass" o "fail".** `navigator.storage.estimate()` da la
cuota del sitio en el navegador, no el espacio libre real en disco — mostrarlo como si fuera una
verificación real sería engañoso. El componente de almacenamiento siempre se muestra como
informativo ("necesitas X GB libres"), y se excluye del cálculo de veredicto general para no
volver "no verificado" a todos los juegos por default.

**Por qué CPU/GPU se comparan con datasets estáticos, no con nombres exactos.** No existe una
API gratuita con un ranking de rendimiento unificado entre Intel/AMD/Nvidia. La comparación usa
dos tablas propias (`src/data/cpu-benchmarks.json`, `gpu-benchmarks.json`) con un score relativo
por modelo, y una búsqueda por alias/coincidencia parcial (`src/lib/benchmark-lookup.ts`) para
matchear el texto libre de los requisitos de Steam contra la tabla. Si no hay match, el
componente se marca "no verificado" en vez de adivinar — ver `COMPATIBILITY_WARN_THRESHOLD_RATIO`
en `src/config/constants.ts` para el umbral que separa "corre bien" de "corre regular".

> Los datasets de benchmarks son una muestra reducida e ilustrativa (~25 GPUs, ~17 CPUs) para que
> el frontend funcione de punta a punta sin backend. Ampliarlos con datos reales (PassMark,
> TechPowerUp) es trabajo de una fase posterior.

**Dos sistemas de color separados.** La marca (violeta) y los veredictos (verde/ámbar/rojo/gris)
usan tokens distintos en `globals.css` a propósito — así una badge de color siempre significa lo
mismo en toda la app, sin que el acento de marca compita visualmente con el significado de
compatibilidad.

## Estructura

```
src/
  components/ui/        Primitivos presentacionales (Button, Badge, Card, Input, Spinner)
  components/layout/    Header, Footer
  features/
    hardware-detection/ Detección de hardware (servicio, hook, contexto, panel de escaneo)
    game-search/        Búsqueda de juegos (servicio mock/remoto, hooks, UI)
    compatibility/       Motor de comparación y UI del veredicto
  pages/                 Home, detalle de juego, 404
  layouts/               Shell de la app (header + outlet + footer)
  data/                  JSON estático: benchmarks de CPU/GPU, catálogo mock
  lib/                   Utilidades puras compartidas (cn, normalización, lookup)
  config/                env.ts, constants.ts
```

## Qué falta (fuera del alcance de este repo)

- Backend real (Cloudflare Workers + Hono + KV) en un repo separado: proxy de Steam, parser de
  `pc_requirements` (HTML → JSON), caché.
- Ampliar los datasets de benchmarks con datos reales de PassMark/TechPowerUp.
- Deploy a Vercel/Netlify una vez el backend esté disponible.
