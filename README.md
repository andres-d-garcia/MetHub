# MetHub — Explorador de la Colección del Met Museum

MetHub es una aplicación web de página única (SPA) construida con HTML, CSS y JavaScript vanilla. Consume la [API pública del Metropolitan Museum of Art](https://metmuseum.github.io/) para permitir a los usuarios explorar, buscar y comparar las obras de arte de su vasta colección.

Este proyecto fue desarrollado como parte de un ejercicio académico, poniendo énfasis en el manejo de operaciones asíncronas, la creación de una interfaz fluida sin el uso de frameworks y el trabajo colaborativo.

## Instrucciones para Ejecutar el Proyecto

La aplicación está diseñada para funcionar sin necesidad de un servidor web.

1.  Clona o descarga este repositorio en tu máquina local.
2.  Navega a la carpeta del proyecto.
3.  Abre el archivo `docs/index.html` directamente en un navegador web moderno (como Chrome, Firefox, o Edge).

¡Eso es todo! La aplicación se cargará y podrás empezar a explorar.

## Lista de Componentes Implementados

El proyecto se basa en funciones que actúan como "factorías" de componentes, generando fragmentos de DOM reutilizables.

-   `createCard`: Genera una tarjeta estándar para mostrar una obra de arte. Se utiliza en las galerías de `#home`, `#explore` y `#artist`.
-   `createState`: Crea un bloque de estado para mostrar mensajes de "Cargando...", "Error" (con botón de reintento) o "No se encontraron resultados".
-   `renderPagination`: Construye los controles de paginación (Anterior, Siguiente, indicador de página) para las galerías.
-   `FilterPanel` (en `renderExploreView`): Agrupa todos los controles de filtro de la vista de exploración.
-   `AggregatePanel` (en `renderExploreView`): Muestra las estadísticas calculadas sobre los resultados visibles.
-   `ComparePanel` (en `renderCompareView`): Componente interactivo para la vista de comparación, que incluye su propio buscador con debounce y renderizado de sugerencias.

## Capturas de Pantalla de las Vistas

A continuación se muestran las seis vistas principales de la aplicación.

**1. Página Principal (`#home`)**
*[Inserta aquí una captura de la vista principal]*

**2. Explorar (`#explore`)**
**

**3. Detalle de Obra (`#detail/:id`)**
**

**4. Departamentos (`#departments`)**
**

**5. Obras del Artista (`#artist/:name`)**
**

**6. Comparador (`#compare`)**
**

## Decisiones Técnicas Relevantes

Durante el desarrollo se tomaron varias decisiones clave para cumplir con los requerimientos y asegurar un funcionamiento robusto:

1.  **Arquitectura SPA sin Frameworks (Vanilla JS):** Se optó por no utilizar ningún framework (como React o Vue) para tener un control total sobre el DOM y el manejo de estado, cumpliendo con los requerimientos del proyecto. Esto implica una manipulación directa del DOM a través de `createElement` y `appendChild`.

2.  **Enrutamiento por Hash:** Se implementó un enrutador simple basado en el `hash` de la URL (`window.location.hash`). Esto permite la navegación entre vistas sin recargar la página y mantiene la compatibilidad con los botones de "Atrás" y "Adelante" del navegador.

3.  **Manejo Asíncrono Robusto:**
    *   **`Promise.allSettled`:** Se utiliza de forma extensiva para resolver múltiples IDs de obras en paralelo (por ejemplo, en las galerías). Esto asegura que si una de las peticiones falla, el resto de la vista no se rompe y se renderizan las obras que sí se cargaron.
    *   **`AbortController` y Timeouts:** La capa de API (`api.js`) implementa un sistema de reintentos y timeouts para manejar la inestabilidad de la red o respuestas lentas de la API del Met, mejorando la resiliencia de la aplicación.
    *   **Debounce en Búsquedas:** En los campos de búsqueda (exploración y comparador), se aplica un `debounce` de 400ms para evitar realizar una llamada a la API con cada tecla presionada, optimizando el rendimiento y reduciendo la carga sobre el servicio.

4.  **Actualización de URL "Silenciosa":** En la vista de "Explorar", para evitar el parpadeo que ocurría al cambiar un filtro (lo que provocaba que el router recargara la vista), se adoptó `history.replaceState`. Esto permite actualizar los parámetros en la URL sin disparar un evento `hashchange`, logrando una experiencia de usuario mucho más fluida.

5.  **Datos de Respaldo (Fallback):** El código incluye un conjunto de datos locales (`FALLBACK_OBJECTS`) que se utilizan cuando la API del Met no responde. Esto permite que la aplicación siga siendo funcional y explorable incluso en caso de un fallo total de la API, una decisión clave para la robustez y la experiencia de desarrollo.

6.  **Capa de Caché Simple:** La función `fetchJson` implementa un sistema de caché básico utilizando `localStorage`. Las respuestas exitosas de la API se guardan, de modo que si se solicita el mismo recurso nuevamente (por ejemplo, el listado de departamentos), se devuelve desde el caché local, acelerando la carga y reduciendo peticiones redundantes.

---
*Datos provistos por la Open Access API del Metropolitan Museum of Art. Esta aplicación no está afiliada al museo.*
