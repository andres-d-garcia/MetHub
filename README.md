# MetHub — Explorador de la Colección del Met

Proyecto SPA (vanilla JS) para explorar la colección del Metropolitan Museum of Art usando su Open Access API.

## Ejecutar localmente
- Abrir `docs/index.html` en el navegador (no requiere servidor). Si usas Live Server/Five Server, sirve desde la carpeta `docs`.

## Qué está implementado
- Navegación SPA por hash: `#home`, `#explore`, `#departments`, `#detail/:id`, `#artist/:name`, `#compare`.
- `#home`: Hero, estadísticas (departamentos, obras destacadas, total de obras) y galería (8 obras destacadas).
- `#explore`: Búsqueda por texto, filtros (departamento, rango de años, destacadas, con imagen), agregados en vivo y paginación a 12 por página.
- `#departments`: Lista de departamentos (solo emoji + nombre, sin imágenes); clic va a `#explore` filtrado.
- `#detail/:id`: Vista de detalle con imagen principal, ficha técnica y enlaces.
- `#artist/:name`: Listado paginado de obras por artista.
- `#compare`: Comparador A vs B con buscador por panel y tabla comparativa.
- Manejo de estados de carga y error en vistas principales.
- Paleta visual actualizada y pequeñas mejoras de UX (búsquedas rápidas en home).

## Archivos relevantes
- `docs/index.html` — shell de la app.
- `docs/css/styles.css` — estilos y paleta.
- `docs/js/app.js` — bootstrap y router.
- `docs/js/views.js` — lógica de las vistas.
- `docs/js/api.js` y `docs/js/metApiService.js` — capa de acceso a la API.

## Recomendaciones y próximos pasos (pendientes)
- Probar la app en el navegador y validar carga de la API pública desde `docs/index.html` (CORS puede variar según origen local).
- Añadir tests básicos o script de comprobación (opcional).
- Completar documentación de créditos: reemplazar el placeholder de autores en el `footer` y en este `README`.

## Aviso
Los datos son provistos por la Open Access API del Metropolitan Museum of Art. Esta aplicación no está afiliada al museo.
