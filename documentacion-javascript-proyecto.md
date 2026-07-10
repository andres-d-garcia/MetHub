# Documentación del JavaScript del proyecto MetHub

## 1. ¿Qué hace este proyecto?

Este proyecto es una web interactiva que permite explorar obras de arte de la colección del Museo Metropolitano de Arte de Nueva York. La aplicación consume datos reales de la API pública del Met, muestra obras destacadas, permite filtrar búsquedas, ver detalles de cada pieza, consultar obras de un artista, comparar dos obras y guardar información de navegación para mejorar la experiencia del usuario.

La parte de JavaScript del proyecto está organizada de forma modular para que cada archivo tenga una responsabilidad concreta.

---

## 2. Estructura general del JavaScript

Los archivos principales son:

- `docs/js/app.js`: inicia la aplicación y controla la navegación por rutas.
- `docs/js/router.js`: gestiona el hash de la URL y las rutas internas.
- `docs/js/views.js`: contiene la mayor parte de la lógica visual y de renderizado.
- `docs/js/api.js`: gestiona peticiones HTTP y caché.
- `docs/js/metApiService.js`: encapsula la comunicación con la API del Met en forma de servicio.
- `docs/js/components.js`: crea elementos reutilizables del DOM como tarjetas y estados vacíos.
- `docs/js/localCollection.js`: aporta una colección local de respaldo cuando la API falla.

---

## 3. Flujo general de funcionamiento

El funcionamiento básico de la app es este:

1. El usuario entra a la página.
2. El archivo `app.js` se ejecuta y llama a la función `init()`.
3. `init()` escucha cambios en el hash de la URL.
4. Cada vez que cambia la ruta, se llama a `renderRoute()`.
5. `renderRoute()` decide qué vista mostrar según la URL:
   - inicio
   - explorar
   - departamentos
   - detalle
   - artista
   - comparador
6. Cada vista se renderiza dinámicamente con JavaScript, creando nodos del DOM y mostrando contenido desde la API o desde datos locales.

En resumen: la app no depende de muchas páginas HTML estáticas; casi toda la interfaz se construye en tiempo de ejecución con JavaScript.

---

## 4. Archivo por archivo

### 4.1 `docs/js/app.js`

Este archivo es el punto de entrada de la aplicación.

#### Función principal
- `init()`: configura listeners de eventos y llama a la primera renderización.
- `renderRoute()`: identifica la ruta actual según el hash y delega la carga a la vista correspondiente.
- `showRouteTransition()`: añade una pequeña animación de transición entre vistas.

#### ¿Por qué es importante?
Porque actúa como el controlador principal de la app. Coordina qué vista se debe mostrar según la URL.

#### Ejemplo de lógica
Si la URL es:
- `#home` → muestra la vista de inicio.
- `#explore` → muestra la vista de exploración.
- `#detail/123` → muestra el detalle de una obra concreta.
- `#artist/Leonardo%20da%20Vinci` → muestra obras del artista.

---

### 4.2 `docs/js/router.js`

Este archivo gestiona la navegación de la aplicación a través del hash de la URL.

#### Funciones clave
- `getRoute()`: devuelve la ruta actual sin los parámetros de consulta.
- `getHashParams()`: obtiene la ruta y los parámetros de la URL en formato `URLSearchParams`.
- `navigateTo(hash)`: cambia la URL a una nueva ruta.
- `updateActiveNav(navLinks)`: marca como activa la opción del menú que coincide con la ruta actual.

#### Importancia
Permite que la aplicación se comporte como una SPA (Single Page Application), aunque la URL cambie sin recargar la página entera.

#### Ejemplo práctico
Cuando el usuario hace clic en “Explorar obras”, se llama a `navigateTo('#explore')`. El cambio del hash provoca que la vista correspondiente se actualice.

---

### 4.3 `docs/js/components.js`

Aquí se crean componentes reutilizables para construir la interfaz.

#### Funciones principales
- `getImageFallbackSrc(title)`: genera una imagen SVG de respaldo cuando la obra no tiene una imagen válida.
- `createCard({ ... })`: crea una tarjeta visual con título, subtítulo, metadatos e imagen.
- `createState(message, options)`: crea un estado de carga o error reutilizable.

#### Valor del archivo
Este archivo evita duplicar código para crear tarjetas y estados de carga. Hace la interfaz más consistente y mantenible.

#### Ejemplo de uso
Cada vez que se muestran obras en la home, en explorar o en el comparador, se usa `createCard()` para generar la tarjeta de forma automática.

---

### 4.4 `docs/js/api.js`

Este archivo se encarga de realizar peticiones a la API del Met y de gestionar un sistema de caché local.

#### Funciones clave
- `getCacheKey(url)`: genera una clave única para guardar datos en almacenamiento local.
- `readCache(key)`: lee datos guardados en `localStorage`.
- `writeCache(key, value)`: guarda respuestas en `localStorage`.
- `fetchJson(url, options = {})`: realiza la petición, reutiliza caché y reintenta si falla.

#### ¿Qué hace bien?
- Evita repetir peticiones innecesarias.
- Mejora el rendimiento.
- Hace que la app sea más resistente a fallos temporales de red.
- Implementa reintentos con espera progresiva.

#### Importancia para defender el proyecto
Es una muestra de buena práctica de desarrollo: la app no depende solo de la API, sino que añade capas de robustez.

---

### 4.5 `docs/js/metApiService.js`

Este archivo encapsula la comunicación con la API en una clase llamada `MetApiService`.

#### Clase principal
`MetApiService` tiene métodos como:
- `buildUrl(endpoint, params)`: arma la URL completa.
- `request(endpoint, params, options)`: hace la llamada HTTP.
- `getDepartments()`: obtiene los departamentos del museo.
- `searchObjects(...)`: realiza búsquedas con filtros.
- `getObjectById(id)`: obtiene una obra concreta por su ID.

#### Ventaja
Separa la lógica de acceso a datos del resto de la interfaz. Si la API cambia, solo habría que ajustar este archivo.

---

### 4.6 `docs/js/localCollection.js`

Este archivo define una colección local de obras de ejemplo para que la aplicación siga funcionando incluso si la API del Met no responde o devuelve datos incompletos.

#### ¿Qué contiene?
Una lista de objetos con datos como:
- `objectID`
- `title`
- `artistDisplayName`
- `objectDate`
- `department`
- `medium`
- `culture`
- `classification`
- `isHighlight`

#### ¿Por qué es útil?
Porque el proyecto no se rompe si falla la API. La aplicación puede mostrar contenido de respaldo y seguir siendo útil en la presentación.

---

### 4.7 `docs/js/views.js`

Este es el archivo más importante del proyecto, porque contiene casi todo el comportamiento visible de la aplicación.

Se encarga de:
- mostrar la vista de inicio
- mostrar la vista de exploración
- mostrar los detalles de cada obra
- mostrar departamentos
- mostrar obras de un artista
- mostrar el comparador
- cargar datos de la API
- gestionar estados de carga y errores
- trabajar con caché de sesión y localStorage

---

## 5. Cómo funciona la vista de inicio

La vista de inicio (`renderHomeView`) hace varias cosas:

1. Muestra un estado de carga inicial.
2. Solicita datos a la API del Met sobre:
   - departamentos
   - obras destacadas
   - el total de la colección
3. Si la API responde correctamente, construye una vista con:
   - hero principal
   - estadísticas
   - búsquedas rápidas
   - departamentos destacados
   - obras destacadas recientes
4. Si falla la API, muestra contenido de respaldo.

#### Elementos que aparecen en la home
- Título principal: “Explora la colección del Met”
- Botones para ir a explorar o a departamentos
- Tarjetas con obras destacadas
- Sección de “Visto recientemente”
- Sección de “Departamentos destacados”

---

## 6. Cómo funciona la vista de exploración

La vista de exploración es una de las más completas.

### Qué ofrece
- buscar por texto
- filtrar por departamento
- filtrar por rango de años
- filtrar solo destacadas
- filtrar solo obras con imagen
- paginación
- resumen de agregados

### Proceso interno
1. Se crea un panel con filtros.
2. El usuario escribe o selecciona opciones.
3. El sistema actualiza la URL con los parámetros del filtro.
4. Se hace una búsqueda a la API.
5. Se cargan las obras correspondientes.
6. Se muestran en tarjetas y se calculan métricas como:
   - total de resultados
   - número de obras cargadas
   - departamento dominante
   - siglo más frecuente
   - cultura más frecuente

### Valor pedagógico
Es una demostración clara de cómo se puede combinar JavaScript, formularios y peticiones asíncronas para construir una experiencia interactiva.

---

## 7. Cómo funciona el detalle de una obra

La vista de detalle se activa cuando el usuario entra a una ruta como `#detail/123`.

### Proceso
1. Se intenta recuperar la obra desde la caché de sesión.
2. Si no está en caché, se hace una petición a la API.
3. Se guarda la obra en memoria local temporal.
4. Se muestra toda su información:
   - título
   - artista
   - fecha
   - técnica
   - departamento
   - dimensiones
   - cultura
   - clasificación
   - adquisición
   - imagen principal
   - etiquetas
   - enlace externo al museo

### Función clave
`renderDetailContent(app, item)`

Esta función construye la interfaz detallada de forma dinámica y muestra todos los campos importantes de la obra.

---

## 8. Cómo funciona la vista de artista

Cuando el usuario entra desde un detalle de arte, puede ver más obras del mismo artista.

### Proceso
1. Se hace una búsqueda a la API con el nombre del artista.
2. Se obtienen los IDs de las obras asociadas.
3. Se cargan las obras por páginas.
4. Se muestran en tarjetas con la opción de ver el detalle.

### Importancia
Muestra cómo se aprovecha la API para ampliar la experiencia de navegación más allá de una sola obra.

---

## 9. Cómo funciona el comparador

La vista de comparación permite elegir dos obras y compararlas lado a lado.

### Funcionalidad
- El usuario busca una obra.
- Selecciona una obra A y una obra B.
- El sistema muestra una tabla comparativa con atributos como:
  - artista
  - fecha
  - departamento
  - técnica
  - cultura
  - clasificación
  - si es destacada
  - si es dominio público

### Valor del comparador
Es una de las funciones más visuales y útiles del proyecto, porque demuestra cómo se pueden transformar datos crudos en una experiencia interactiva y comprensible.

---

## 10. Gestión de caché y persistencia

El proyecto usa dos tipos de almacenamiento:

### `localStorage`
Se usa para:
- guardar respuestas de la API
- guardar elementos vistos recientemente

### `sessionStorage`
Se usa para:
- guardar el estado de comparación
- guardar objetos consultados temporalmente

#### ¿Por qué esto es importante?
Porque mejora el rendimiento y evita perder contexto cuando el usuario navega entre vistas.

---

## 11. Manejo de errores y fallback

Una de las fortalezas del proyecto es que está preparado para fallos.

### Estrategias implementadas
- Si la API falla, se muestran obras de respaldo.
- Si una imagen no carga, se reemplaza por una imagen generada automáticamente.
- Si no hay resultados, se muestra un estado vacío claro.
- Si hay problemas de red, la app sigue funcionando con datos locales.

Esto demuestra que el proyecto no solo “consigue datos”, sino que también gestiona problemas de forma elegante.

---

## 12. Puntos fuertes para defender el proyecto

Si tienes que defender el proyecto oralmente, puedes mencionar estos puntos:

- La arquitectura está dividida en módulos claros.
- La aplicación es dinámica y reacciona a la interacción del usuario.
- Usa una API real, lo que añade valor y autenticidad al proyecto.
- Implementa buenas prácticas como caché, reintentos y fallback.
- La interfaz está pensada para ser usable y visualmente atractiva.
- El proyecto combina múltiples conceptos de JavaScript moderno: DOM, eventos, promesas, async/await, almacenamiento local y navegación SPA.

---

## 13. Resumen breve para explicar en defensa

El proyecto funciona como una aplicación web SPA que consume datos de la API del Museo Metropolitano. El JavaScript se encarga de cargar obras, filtrar resultados, mostrar detalles, comparar piezas y mantener una navegación fluida entre secciones. Además, incluye mecanismos de caché, respaldo y manejo de errores para que la experiencia sea más robusta. En otras palabras, el proyecto no solo muestra arte: organiza, filtra y convierte los datos en una experiencia interactiva para el usuario.

---

## 14. Guion corto de exposición

Puedes decir algo como:

“Este proyecto está desarrollado en JavaScript modular, separando la lógica de navegación, la obtención de datos y la renderización de interfaces. La aplicación consume la API del Museo Metropolitano, permite explorar obras, filtrar resultados, ver detalles, comparar piezas y mantener un flujo de navegación fluido. Además, incorpora estrategias de caché y fallback para asegurar que la experiencia siga funcionando aunque la API presente problemas.”
