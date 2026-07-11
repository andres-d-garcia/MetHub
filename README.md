# MetHub — Explorador de la Colección del Met Museum

MetHub es una aplicación web de página única (SPA) construida con HTML, CSS y JavaScript vanilla. Consume la [API pública del Metropolitan Museum of Art](https://metmuseum.github.io/) para permitir a los usuarios explorar, buscar y comparar las obras de arte de su vasta colección.

Este proyecto fue desarrollado como parte de un ejercicio académico, poniendo énfasis en el manejo de operaciones asíncronas, la creación de una interfaz fluida sin el uso de frameworks y el trabajo colaborativo.

## Integrantes y División del Trabajo

El proyecto fue desarrollado por dos integrantes, con una división de responsabilidades sugerida para equilibrar la carga de trabajo y fomentar la colaboración en áreas clave.

*   **Estudiante A - Foco en Exploración y Detalle:**
    *   Implementación de la vista **`#explore`**, incluyendo el panel de filtros avanzados (búsqueda, departamento, rango de años, checkboxes) y el panel de agregados en vivo.
    *   Desarrollo de la vista de detalle de obra **`#detail/:id`**, mostrando la ficha técnica completa, imágenes y enlaces relacionados.
    *   Lógica de paginación y carga de resultados en la vista de exploración.

*   **Estudiante B - Foco en Comparación y Vistas Secundarias:**
    *   Implementación de la vista **`#departments`** y **`#artist/:name`**.
    *   Desarrollo de la compleja vista de **`#compare`**, incluyendo los buscadores internos por panel, la lógica de selección y la tabla comparativa con resaltado de diferencias.
    *   Creación de los componentes base reutilizables (`createCard`, `createState`).

*   **Responsabilidades Conjuntas:**
    *   Diseño de la arquitectura inicial (router, estructura de archivos).
    *   Implementación de la vista principal **`#home`**.
    *   Creación de la barra de navegación y el footer.
    *   Definición de los estilos globales y la paleta de colores para asegurar una identidad visual coherente.
    *   Desarrollo y depuración de la capa de comunicación con la API (`api.js`).

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
![alt text](https://cdn.discordapp.com/attachments/1466517733909729312/1525544968976990359/image.png?ex=6a53c5f7&is=6a527477&hm=b1fd025572025dd910f49d851120aea5dd9b59b4a44fc40d019e1d153440de0b&)


**2. Explorar (`#explore`)**
![alt text](https://cdn.discordapp.com/attachments/1466517733909729312/1525545130084536350/image.png?ex=6a53c61e&is=6a52749e&hm=a537db05675bf7a607c2f8cf379c5417be7e6e5948d8658f1b9bbdf18090f84d&)

**3. Detalle de Obra (`#detail/:id`)**
![alt text](https://cdn.discordapp.com/attachments/1466517733909729312/1525545658302333029/image.png?ex=6a53c69c&is=6a52751c&hm=449819bf5085cb0f4285d22b2a46c666296421fa1819285001703447c9649151&)

**4. Departamentos (`#departments`)**
![alt text](https://cdn.discordapp.com/attachments/1466517733909729312/1525545377011339415/image.png?ex=6a53c659&is=6a5274d9&hm=45408534978b45244dbb05c3654c0902393833a155fd554f5c505e31b9a34be3&)

**5. Obras del Artista (`#artist/:name`)**
![alt text](https://cdn.discordapp.com/attachments/1466517733909729312/1525549908793491473/image.png?ex=6a53ca91&is=6a527911&hm=1c0862e91fb10d60a3cd9f5517131090b85964f6008c169fc2e2d97ac95d017e&)

**6. Comparador (`#compare`)**
![alt text](https://cdn.discordapp.com/attachments/1466517733909729312/1525546001815961690/image.png?ex=6a53c6ee&is=6a52756e&hm=7d796b2713e3b68a27901580371b3c4e8646281373b69c77a927954183479947&)

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