# Documento de Requerimientos de Software
## MetHub — Explorador de la Colección del Met Museum (Edición en Pareja)
---

## 1. Introducción

### 1.1 Propósito
Este documento describe los requerimientos funcionales, las vistas y el flujo de navegación de la aplicación web **MetHub**. Está dirigido a la pareja de estudiantes desarrolladores como guía de construcción del sistema.

### 1.2 Alcance
MetHub es una aplicación web de página única (SPA) construida con HTML, CSS y JavaScript vanilla, que consume la API pública del **Metropolitan Museum of Art** (`https://collectionapi.metmuseum.org/public/collection/v1`) para permitir a los usuarios explorar las aproximadamente 470,000 obras de arte de la colección del museo. La aplicación pone énfasis en el manejo robusto de operaciones asíncronas con peticiones en paralelo, el diseño de componentes reutilizables y la coordinación de dos desarrolladores trabajando sobre la misma base de código.

### 1.3 Recursos de Documentación de la API

La API del Met Museum es open source y cuenta con documentación pública. **Es responsabilidad de los estudiantes leer la documentación oficial** antes de implementar cada vista — el documento de requerimientos no enumera todos los campos disponibles, solo los mínimos exigidos.

| Recurso | URL |
|---|---|
| Documentación oficial de la API | https://metmuseum.github.io/ |
| Repositorio del proyecto | https://github.com/metmuseum/openaccess |
| Sitio web del museo (para verificar obras) | https://www.metmuseum.org/art/collection |

### 1.4 Definiciones
| Término | Definición |
|---|---|
| SPA | Single Page Application — aplicación de una sola página que cambia su contenido dinámicamente sin recargar el navegador |
| Vista | Sección de la interfaz que se muestra al usuario según su contexto de navegación |
| Componente | Sección reutilizable de la interfaz implementada como `Custom Element` |
| Endpoint | URL específica de la API del Met Museum que devuelve un conjunto de datos |
| `objectID` | Identificador único de una obra en la colección del museo |
| Obra destacada (`isHighlight`) | Obra que el museo ha marcado como representativa de su colección |
| Búsqueda con resolución | Patrón en el que el endpoint de búsqueda devuelve solo IDs y se requiere resolver cada uno con una petición adicional |
| Estado de carga | Indicador visual que se muestra mientras se espera respuesta de la API |
| Estado de error | Indicador visual que se muestra cuando la API falla o no devuelve datos |

---

## 2. Descripción General del Sistema

MetHub funciona como una SPA: existe un único archivo `index.html` que actúa como contenedor. Las vistas se intercambian dinámicamente mediante JavaScript, sin redirigir a otros archivos HTML. La navegación se gestiona internamente a través del fragmento de la URL (`#home`, `#explore`, etc.).

### 2.1 Vistas del sistema

El sistema cuenta con **seis vistas principales**:

| ID | Vista | Ruta | Descripción |
|---|---|---|---|
| V-01 | Página Principal | `#home` | Hero con obras destacadas y estadísticas generales del museo |
| V-02 | Explorar | `#explore` | Búsqueda con filtros avanzados, panel de agregados en vivo y paginación |
| V-03 | Detalle de Obra | `#detail/:id` | Información completa de una obra con imágenes adicionales y enlace al artista |
| V-04 | Departamentos | `#departments` | Catálogo de las 19 áreas curatoriales del museo |
| V-05 | Obras del Artista | `#artist/:name` | Obras del mismo artista, con info biográfica si está disponible |
| V-06 | Comparador | `#compare` | Comparador interactivo lado a lado de dos obras con buscador interno |

### 2.2 Flujo de navegación

```
                              ┌──────────────────────────┐
                              │           #home          │
                              │   (Destacados + Stats)   │
                              └──┬─────┬─────┬─────┬─────┘
                                 │     │     │     │
              ┌──────────────────┘     │     │     └──────────────────┐
              ▼                        ▼     ▼                        ▼
   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
   │     #explore     │   │   #departments   │   │     #compare     │
   │  (Filtros+Agg)   │   │   (19 áreas)     │   │ (Buscador A vs B)│
   └────────┬─────────┘   └────────┬─────────┘   └──────────────────┘
            │                      │
            │ Clic en              │ Clic en
            │ obra                 │ depto. (filtra
            ▼                      │ explore)
   ┌──────────────────┐            │
   │   #detail/:id    │◄───────────┘
   │ (Obra + Imágenes)│
   └────────┬─────────┘
            │ Clic en "Ver más
            │ obras del artista"
            ▼
   ┌──────────────────┐
   │  #artist/:name   │
   │ (Obras del autor)│
   └──────────────────┘
```

**Reglas de navegación:**
- La barra de navegación está siempre visible en todas las vistas.
- El botón "← Volver" en las vistas de detalle y artista regresa a la vista anterior conservando filtros y scroll cuando sea posible.
- El logo de MetHub siempre retorna a la vista `#home`.
- La navegación se realiza mediante el fragmento de la URL (hash routing). Los botones "Atrás" y "Adelante" del navegador deben funcionar correctamente.

---

## 3. Componentes Globales

Estos elementos son persistentes y se mantienen visibles en todas las vistas.

### 3.1 Barra de Navegación
**Ubicación:** Parte superior de la pantalla, fija al hacer scroll.

Debe contener:
- Logo o nombre "MetHub" (actúa como enlace a `#home`).
- Enlaces hacia `#explore`, `#departments` y `#compare`.
- Indicador visual de la vista activa (el enlace actual debe estar resaltado).

### 3.2 Footer
**Ubicación:** Parte inferior de la página.

Debe contener:
- Texto de créditos: nombres de los dos integrantes y año.
- Mención a la fuente de datos: "Datos provistos por la Open Access API del Metropolitan Museum of Art. Esta aplicación no está afiliada al museo."

---

## 4. Especificación de Vistas

### Requerimientos Funcionales (resumen)

La siguiente lista es un resumen directo y accionable de lo que la aplicación debe permitir al usuario. Sirve como checklist mínimo para la entrega.

- Navegar entre las seis vistas sin recargar la página.
- Visualizar obras destacadas y estadísticas generales del museo en `#home`.
- Explorar la colección en `#explore` con **búsqueda por texto**, **filtros avanzados** (departamento, rango de años, destacadas, con imagen) y un **panel de agregados en vivo** que se recalcula con cada cambio de filtro.
- Listar los departamentos curatoriales en `#departments` y, al hacer clic en uno, navegar a `#explore` filtrado por ese departamento.
- Ver el detalle completo de una obra en `#detail/:id` con su imagen principal, imágenes adicionales, ficha técnica completa, tags y enlace a `#artist/:name`.
- Ver el listado de obras del mismo artista en `#artist/:name`.
- **Comparar dos obras** en `#compare` mediante un buscador interno por panel, tabla comparativa de atributos y visualización de diferencias.
- Mostrar estados de carga (`LoadingState`) y error (`ErrorState`) en todas las operaciones asíncronas relevantes.

---

### V-01 — Página Principal (`#home`)

**Propósito:** Ser la puerta de entrada a MetHub. Muestra obras destacadas del museo y estadísticas generales.

#### 4.1.1 Sección: Hero
Área visual destacada en la parte superior de la vista.

- Debe mostrar un título de bienvenida ("Explora la colección del Met") o similar.
- Debe incluir una breve descripción del museo.
- Estilo visual coherente con la identidad del museo (paleta sobria, tipografía con serifas o mezcla).

#### 4.1.2 Sección: Estadísticas Generales
Bloque con estadísticas obtenidas de la API:

- Número total de departamentos (obtenido de `/departments`).
- Número total de obras destacadas con imagen (obtenido del total devuelto por `/search?isHighlight=true&hasImages=true`).
- Otras estadísticas a discreción de la pareja (siempre que se calculen con datos reales de la API).

#### 4.1.3 Sección: Galería de Obras Destacadas
Galería de **8 a 12 obras destacadas** del museo.

**Endpoint:** `GET /search?q={término}&isHighlight=true&hasImages=true`

**Comportamiento de carga:**
1. Hacer una petición al endpoint de búsqueda para obtener los IDs.
2. Tomar los primeros 8-12 IDs.
3. Resolver cada uno mediante `GET /objects/:id` en **paralelo con `Promise.allSettled`**.
4. Renderizar las obras que cargaron correctamente y omitir las que fallaron.
5. Si **todas** fallan, mostrar `ErrorState` con opción de reintentar.

**Cada tarjeta de obra debe mostrar:**
- Imagen primaria (`primaryImageSmall`).
- Título (`title`).
- Artista (`artistDisplayName`) o "Artista desconocido" si está vacío.
- Fecha (`objectDate`) y departamento (`department`).
- Al hacer clic, navega a `#detail/:id`.

---

### V-02 — Explorar (`#explore`)

**Propósito:** Permitir al usuario explorar y filtrar la colección mediante un sistema de filtros avanzados con un panel de agregados que se recalcula en tiempo real.

#### 4.2.1 Sección: Panel de Filtros Avanzados
El panel de filtros debe contener los siguientes controles:

- Filtro por **departamento** (selector con los 19 departamentos obtenidos de `/departments`).
- **Slider de rango de años**: un control de doble cabeza que permita acotar el periodo histórico. Debe admitir años negativos (antes de Cristo) hasta el año en curso. Debe mostrar visualmente los años seleccionados a cada lado.
- **Checkbox "Solo obras destacadas"** (mapea al parámetro `isHighlight=true`).
- **Checkbox "Solo con imagen"** (mapea al parámetro `hasImages=true`).
- Botón "Limpiar filtros" que restablece todos los controles a su estado inicial.

**Comportamiento de los filtros:**
- Cada cambio de filtro reinicia la página a 1 y dispara una nueva búsqueda.
- Si la combinación de filtros no devuelve resultados, se muestra un mensaje "No se encontraron obras con los filtros aplicados".

#### 4.2.2 Sección: Panel de Agregados en Vivo
Junto al panel de filtros, debe existir un panel que muestre **estadísticas calculadas** sobre los resultados.

Debe mostrar como mínimo:
- **Total de resultados** (el `total` devuelto por el endpoint de búsqueda).
- **Cargados** (cantidad de obras visibles en la página actual, tras la resolución con `Promise.allSettled`).
- **Departamento dominante** entre las obras cargadas.
- **Siglo más frecuente** entre las obras cargadas (calculado a partir de `objectBeginDate`/`objectEndDate`).
- **Cultura más frecuente** entre las obras cargadas (campo `culture`).

**Nota pedagógica importante:** Como el endpoint de búsqueda solo devuelve IDs (no objetos completos), los agregados se calculan **sobre los resultados de la página actual** (12 obras), no sobre el total. El panel debe indicar esta limitación con una nota discreta (ej: "Agregados calculados sobre los visibles. Total se refiere al search completo.").

**Comportamiento:**
- Estos valores se recalculan automáticamente cada vez que cambia la página o cualquier filtro.
- Si el filtro deja 0 resultados, el panel muestra "—" en cada métrica.

#### 4.2.3 Sección: Galería paginada
**Endpoint:** `GET /search?q={término}&{filtros}` → devuelve `{ total, objectIDs }`.

**Resolución de los IDs:**
- Se obtiene el arreglo de IDs filtrado.
- Se paginan **del lado del cliente** a 12 por página.
- Los IDs de la página actual se resuelven con `Promise.allSettled` en paralelo: `GET /objects/:id` por cada uno.
- Las obras que cargaron correctamente se renderizan; las que fallaron se omiten y se muestra una nota discreta debajo si hubo errores.
- Controles de paginación: Anterior, Siguiente, indicador de página actual y total.
- Cada tarjeta tiene la misma estructura que en `#home`.
- Al hacer clic en una tarjeta se navega a `#detail/:id`.
- Al cambiar cualquier filtro, la paginación se reinicia a la página 1.

---

### V-03 — Detalle de Obra (`#detail/:id`)

**Propósito:** Mostrar toda la información de una obra de la colección.

#### 4.3.1 Carga de datos

**Endpoint principal:** `GET /objects/:id`.

Al entrar a la vista:
- Se muestra `LoadingState` mientras se resuelve la petición.
- Si la petición falla, se muestra `ErrorState` con opción de reintentar.
- Si la obra no existe (HTTP 404), se muestra mensaje claro: "La obra solicitada no existe".

#### 4.3.2 Información a mostrar

La vista se divide en dos columnas (en pantallas grandes) o se apila (en móviles).

**Columna izquierda — Imagen:**
- Imagen principal (`primaryImage` o `primaryImageSmall` si la grande no carga).
- Si no hay imagen, mostrar un placeholder con texto "Sin imagen disponible".
- Si existen `additionalImages`, mostrar una galería pequeña debajo de la imagen principal (máximo 8).

**Columna derecha — Ficha técnica:**
| Sección | Campos a mostrar |
|---|---|
| Encabezado | Título, nombre del artista (clickable hacia `#artist/:name`) |
| Bio del artista | `artistDisplayBio` si está presente |
| Fecha | `objectDate` |
| Técnica | `medium` |
| Dimensiones | `dimensions` |
| Departamento | `department` |
| Cultura | `culture` (si está presente) |
| Periodo | `period` (si está presente) |
| Clasificación | `classification` (si está presente) |
| Adquisición | `creditLine` (si está presente) |
| Tags | Lista de etiquetas (`tags[].term`), máximo 12 |
| Enlace externo | Link a `objectURL` para ver la obra en el sitio del museo |

Todo campo que pueda venir vacío o `null` debe tener un valor de reemplazo visible ("—", "Artista desconocido", "Sin descripción", etc.).

#### 4.3.3 Acciones
- **Botón "← Volver"** que regresa a la vista anterior conservando estado.
- **Botón "Ver más obras del artista"** que navega a `#artist/:name` (solo visible si `artistDisplayName` no está vacío).
- **Botón "Comparar"** que navega a `#compare` con la obra preseleccionada en el panel A.

---

### V-04 — Departamentos (`#departments`)

**Propósito:** Mostrar el catálogo de las áreas curatoriales del museo.

**Endpoint:** `GET /departments` → devuelve `{ departments: [{ departmentId, displayName }] }`.

#### 4.4.1 Galería de Departamentos
- Se muestran los 19 departamentos en formato de tarjetas.
- Cada tarjeta muestra:
    - Nombre del departamento (`displayName`).
    - Detalle visual (icono temático, color asociado, o decoración a discreción de la pareja).
- Al hacer clic en una tarjeta, se navega a `#explore` con el filtro de departamento preaplicado a ese departamento.

---

### V-05 — Obras del Artista (`#artist/:name`)

**Propósito:** Mostrar las obras de un artista específico de la colección.

**Endpoint:** `GET /search?q={name}&artistOrCulture=true` → resolver IDs con `Promise.allSettled`.

#### 4.5.1 Cabecera
- Nombre del artista.
- Si la API devuelve `artistDisplayBio` en alguna obra del artista, mostrar esa bio como descripción.
- Total de obras encontradas asociadas al artista en la colección.

#### 4.5.2 Galería paginada
- Se muestran las obras del artista paginadas a 12 por página.
- Cada tarjeta tiene la misma estructura que en `#home` y `#explore`.
- Al hacer clic en una tarjeta se navega a `#detail/:id`.
- Si no hay obras asociadas (el search devuelve 0), se muestra un mensaje claro.

#### 4.5.3 Botón de navegación
- Botón "← Volver" que regresa a la vista anterior.

---

### V-06 — Comparador (`#compare`)

**Propósito:** Permitir al usuario comparar dos obras lado a lado de forma interactiva, eligiéndolas mediante búsqueda en tiempo real (sin necesidad de conocer IDs).

#### 4.6.1 Disposición de la vista
La vista se divide en **dos paneles iguales lado a lado** (Obra A | Obra B). En pantallas pequeñas (móviles), los paneles se apilan verticalmente.

Cada panel contiene su propio **mini-buscador interno** y muestra el resultado de la obra seleccionada.

#### 4.6.2 Búsqueda interna por panel (la pieza clave de la UX)

Cada panel tiene su propio buscador con el siguiente comportamiento:

1. **Estado inicial:** un campo de texto vacío con placeholder ("Busca una obra por nombre, artista, tema…") y mensaje "Busca y elige una obra para comparar".
2. **Mientras el usuario escribe:**
    - Se aplica **debounce** de 400 ms.
    - Al disparar, se hace `GET /search?q={término}&hasImages=true`.
    - Se toman los primeros **5 a 6 IDs** del resultado y se resuelven con `Promise.allSettled`.
    - Mientras se resuelven, se muestra un mini-indicador de carga.
    - Las obras resueltas se muestran como **mini-tarjetas en cascada** debajo del campo de búsqueda: imagen pequeña + título + artista.
3. **Al hacer clic en una mini-tarjeta:** esa obra queda fijada en el panel; el buscador se oculta o muestra "Cambiar selección".
4. **Cambiar selección:** un botón "Cambiar" vuelve a mostrar el buscador y limpia la selección actual.
5. **Búsqueda sin resultados:** mensaje "No se encontraron obras con ese término".
6. **Error en la búsqueda:** mensaje de error con opción de reintentar la búsqueda.

#### 4.6.3 Carga en paralelo
Cuando **ambos paneles** tengan una obra seleccionada y el usuario cambie uno de los dos:
- La nueva selección se resuelve sola (solo afecta a su panel).
- Si las dos selecciones suceden casi simultáneamente (ambos buscadores activos), las resoluciones deben ocurrir en paralelo sin bloquearse mutuamente.

#### 4.6.4 Restricciones
- No se permite seleccionar **la misma obra en ambos paneles**. Si el usuario intenta seleccionar en B una obra ya elegida en A (o viceversa), la mini-tarjeta correspondiente debe aparecer **deshabilitada** o mostrar un mensaje "Ya está seleccionada en el otro panel".

#### 4.6.5 Tabla comparativa
Debajo de los dos paneles, debe aparecer una **tabla comparativa** que solo se muestra cuando hay dos obras seleccionadas.

La tabla debe comparar como mínimo:
- Artista.
- Año (calculado a partir de `objectEndDate` o `objectBeginDate`).
- Departamento.
- Técnica (`medium`).
- Clasificación (`classification`).
- Cultura.
- ¿Es obra destacada? (`isHighlight`).
- ¿Es de dominio público? (`isPublicDomain`).

Las filas en las que los valores difieran deben mostrarse **visualmente resaltadas** (color distinto o icono) para que el contraste sea inmediato. Las filas con valores iguales no se resaltan.

Debajo de la tabla, mostrar la **diferencia en años** entre las dos obras (si ambos años están disponibles).

#### 4.6.6 Estados de la vista
- **Estado inicial:** ningún panel con selección, ambos buscadores visibles, no aparece la tabla comparativa.
- **Un panel seleccionado:** el panel A o B muestra la obra; el otro sigue en buscador; no aparece la tabla.
- **Dos paneles seleccionados:** ambos paneles llenos, tabla comparativa visible con diferencias resaltadas.
- **Error en una carga:** el panel afectado muestra el error con botón de reintentar, sin tumbar al otro panel.

#### 4.6.7 Entrada desde otra vista
Si el usuario llega a `#compare` desde el botón "Comparar" en `#detail/:id`, la obra de origen debe quedar **preseleccionada en el panel A** automáticamente y el panel B debe quedar en estado inicial esperando búsqueda.

---

## 5. Requerimientos No Funcionales

| ID | Requerimiento | Descripción |
|---|---|---|
| RNF-01 | Tecnología | Solo HTML, CSS y JavaScript vanilla. Sin frameworks ni librerías externas. |
| RNF-02 | Estructura de archivos | Mínimo: `index.html`, `/css/styles.css`, `/js/app.js`. Cada componente en su propio archivo `.js`. |
| RNF-03 | Peticiones asíncronas | Todas las llamadas a la API deben manejarse como promises con `async`/`await` o `.then()`. |
| RNF-04 | Concurrencia | El uso de `Promise.allSettled` es obligatorio cuando se resuelven múltiples IDs en paralelo (galería de `#home`, paginación de `#explore`, búsqueda interna del comparador). |
| RNF-05 | Valores nulos | Todo campo de la API que pueda ser `null` o vacío debe tener un valor de reemplazo visible en la interfaz. |
| RNF-06 | Sin recarga | La navegación entre vistas no debe recargar la página. El contenido se intercambia dinámicamente. |
| RNF-07 | Sin innerHTML para datos externos | El DOM con datos provenientes de la API debe construirse con `createElement`, `textContent` y `appendChild`. |

---

## 6. Requerimientos Técnicos (enfoque: ASINCRONÍA + COMPONENTES)

### 6.1 API y peticiones

- **Cancelación y timeout:** Implementar timeout y cancelación con `AbortController` para evitar que peticiones colgadas afecten la UI. Tiempo recomendado: 8–12 segundos.
- **Resolución masiva con `Promise.allSettled`:** El patrón típico de esta API es que el endpoint `/search` devuelve solo IDs. La resolución posterior de cada ID debe ejecutarse en **paralelo con `Promise.allSettled`**. Cada resultado debe inspeccionarse individualmente: los `fulfilled` se renderizan; los `rejected` se omiten silenciosamente o se reportan con una nota discreta sin romper la vista.
- **Manejo de errores:** Mostrar `ErrorState` con posibilidad de reintentar en errores de red o respuestas no OK. No es obligatorio implementar retries automáticos.

### 6.2 Diseño de componentes y organización

- **Componentes como Custom Elements:** Implementar las piezas UI como clases que extienden `HTMLElement` y se registran con `customElements.define`. No se requiere usar los métodos de ciclo de vida; la construcción puede hacerse en el `constructor` y las actualizaciones a través de propiedades o métodos.
- **Sin módulos ES:** No es obligatorio usar `import`/`export`. En su lugar, incluir los scripts en `index.html` en el orden correcto.

### 6.3 Concurrencia y simplicidad

- **Evitar dobles peticiones desde la UI:** Es suficiente deshabilitar un control (o ignorar nuevas solicitudes) mientras una petición crítica está en curso.
---

## 7. Modalidad de Trabajo en Pareja

El proyecto se desarrolla en parejas de **dos integrantes**. Ambos miembros son responsables del producto final en su totalidad, pero deben repartir el trabajo de forma equilibrada y dejar evidencia de ello.

### 7.1 División Sugerida de Responsabilidades

Esta división es **orientativa**; la pareja puede ajustarla siempre que ambos integrantes tengan una carga comparable.

| Estudiante A — Exploración y Detalle | Estudiante B — Comparador y Componentes Base |
| :--- | :--- |
| Vista `#explore` con filtros avanzados y agregados | Vista `#departments` |
| Vista `#detail/:id` | Vista `#artist/:name` |
**Responsabilidades conjuntas (deben construirse en pareja):**
- Vista `#home`.
- Arquitectura general y router de hash.
- `NavBar`, `LoadingState` y `ErrorState` (los usan ambos).
- Estilos globales y diseño visual unificado.


### 7.2 Evidencia de Trabajo Colaborativo

- **Ambos integrantes deben tener commits propios** en el repositorio de forma consistente a lo largo de las 2 semanas. No se aceptarán repositorios donde más del 80% de los commits sean de un solo integrante.
- Se valorará la existencia de **pull requests, branches o commits de integración** que evidencien coordinación entre los dos.
- En la presentación final, **ambos integrantes deben poder explicar cualquier parte del código**, no únicamente la suya. En particular, ambos deben dominar la capa de fetch y presentación

---

## 8. Entrega y Control de Versiones

> **Nota:** Los criterios y la escala de evaluación del proyecto están detallados en el documento de **rúbrica** adjunto, publicado junto a este enunciado en Google Classroom.

### 8.1 Repositorio Git

- El proyecto debe estar alojado en un repositorio de Git (GitHub, GitLab, etc.).
- El repositorio debe tener configurados como colaboradores a **ambos integrantes** desde el inicio del proyecto.
- **Estructura recomendada de commits:**
    - Commit inicial con estructura básica del proyecto.
    - Commits incrementales por funcionalidad (router, capa de fetch, primera vista, componentes base, etc.).
    - Mensajes de commit descriptivos en español o inglés, consistentes en idioma.

### 8.2 Entregables

1. **Código fuente completo** en repositorio Git (link entregado por Google Classroom).
2. Aplicación funcionando localmente abriendo `index.html` (no requiere servidor).
3. **Archivo `README.md`** que incluya:
    - Nombre de los dos integrantes y división del trabajo realizado.
    - Instrucciones para ejecutar el proyecto.
    - Lista de componentes implementados con una línea de descripción cada uno.
    - Capturas de pantalla de las seis vistas.
    - Decisiones técnicas relevantes 

---

## 9. Consideraciones Adicionales

- Se evaluará la **originalidad de la interfaz gráfica**. Proyecto que se determine que no fue realizado por los estudiantes sino por inteligencia artificial sin criterio humano por detrás no será evaluado
- Se valorará la **constancia** del trabajo a lo largo de las semanas a través de los commits, no la concentración del trabajo en los últimos días.
- La aplicación debe funcionar correctamente abriendo el `index.html` directamente en el navegador, sin necesidad de servidor local ni configuraciones adicionales.
- La API del Met Museum es **open access** y los datos del museo son de dominio público en muchos casos, pero las imágenes pueden tener restricciones de uso comercial. Para fines educativos como este proyecto, su uso está permitido. La pareja debe incluir el aviso correspondiente en el footer y en el README.
