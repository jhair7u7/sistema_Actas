# Integración de APIs ZeroBAP — Sistema de Actas

## 1. Alcance implementado

El frontend dejó de utilizar datos simulados para autenticación, actas y administración. La integración toma como fuente `Documentacion_APIs_ZeroBAP (1).docx`, versión 1.0 del 14 de agosto de 2026, con API base:

```text
https://zerobap.bap.net.pe/api
```

Se implementaron únicamente los endpoints presentes en esa documentación. No se inventaron rutas para operaciones que el documento no define.

## 2. Endpoints consumidos

| Módulo | Método y ruta | Uso en el sistema |
|---|---|---|
| Auth | `POST /api/Auth/login` | Inicio de sesión real. |
| Auth | `POST /api/Auth/refresh` | Reintento automático una vez cuando una solicitud autenticada responde `401`. |
| Auth | `GET /api/Auth/me` | Validación de sesión y obtención del usuario y sus roles. |
| Auth | `POST /api/Auth/logout` | Cierre de la sesión en el backend y limpieza local. |
| Auth | `POST /api/Auth/register` | Formulario real de creación de usuarios. |
| Auth | `GET /api/Auth/test-sap` | Comprobación manual de la conexión con SAP. |
| Minutes | `GET /api/Minutes/Filters` | Catálogos de mes, año, canal, estado de acta y estado SAP. |
| Minutes | `GET /api/Minutes/Minutes` | Listado real, filtros y paginación del lado del servidor. |
| Minutes | `PUT /api/Minutes/MinuteUpdated` | Guarda el estado y la carpeta asignada de un acta. |
| Folder | `GET /api/Folder/Folder` | Lista las carpetas administrables. |
| Folder | `POST /api/Folder/Folder` | Crea una carpeta. |
| Folder | `PUT /api/Folder/Folder` | Actualiza una carpeta existente. |
| Folder | `GET /api/Folder/Folder/Combo` | Alimenta el combo de carpetas al editar un acta. |
| Folder | `DELETE /api/Folder/Folder/{publicId}` | Elimina una carpeta. |
| Minutes | `GET /api/Minutes/{publicId}/pdf` | Visualización y descarga del PDF de cada acta. |
| Minutes | `POST /api/Minutes/{publicId}/pdf` | Carga real del PDF mediante `multipart/form-data`. |

## 3. Archivos principales

```text
src/services/apiClient.ts
src/services/authService.ts
src/services/minutesService.ts
src/auth/AuthContext.tsx
src/pages/LoginPage.tsx
src/pages/GestionActas/GestionActasPage.tsx
src/pages/Administracion/AdministracionPage.tsx
vite.config.ts
```

### Cliente HTTP

`apiClient.ts` centraliza:

- URL base configurada mediante `VITE_API_URL`.
- Envío de credenciales del navegador con `credentials: "include"`.
- Errores HTTP con mensaje y estado.
- Refresco de sesión una sola vez ante `401`, evitando ciclos infinitos.
- Cierre local de sesión cuando el backend continúa respondiendo `401`.
- Lectura de respuestas JSON, texto, archivo binario o respuesta vacía.

### Autenticación y permisos

La respuesta de ejemplo de `POST /Auth/login` no contiene un token de acceso en el cuerpo. Por esa razón el frontend no inventa un encabezado `Authorization` ni guarda un token inexistente. Conserva solamente los datos no sensibles del usuario y la fecha `expiresAt`, y valida la sesión real mediante `GET /Auth/me`.

Para que este mecanismo funcione, el backend debe conservar la sesión mediante la respuesta HTTP —por ejemplo, una cookie de sesión— y admitir las solicitudes posteriores. El proxy mantiene las llamadas en el mismo origen del frontend durante desarrollo y vista previa.

`GET /Auth/me` es también la fuente de los permisos del usuario autenticado. El frontend reconoce los IDs y códigos definidos por ZeroBAP (`minutes.view`, `minutes.download`, `minutes.upload` y `minutes.edit`) y oculta el módulo o las acciones que no correspondan. El rol Administrador conserva el acceso al módulo de Administración.

### Actas

Los parámetros enviados a `GET /Minutes/Minutes` conservan exactamente los nombres documentados:

```text
Acta
ChannelId
Month
Year
SapStatusId
StatusId
Organization
folderId
Page
PageSize
```

La tabla muestra los campos documentados de cada elemento: canal, fecha, mes, número de acta, acta consolidada, estado SAP, organización, centro de acopio, estado y carpeta. La paginación utiliza la estructura `pagination` del backend.

La ruta de PDF recibe el UUID retornado como `id` por el listado de actas. El archivo se obtiene como `Blob`, se comprueba que no esté vacío y se descarga o abre sin construir una URL falsa.

Las casillas permiten seleccionar actas individuales o todas las actas visibles en la página actual. El botón **Descargar seleccionadas (1 PDF)** obtiene cada documento desde esa misma ruta, conserva el orden de selección y une todas sus páginas en un único archivo `actas_consolidadas_FECHA.pdf`. Las selecciones hechas en otras páginas se mantienen.

La descarga reintenta automáticamente respuestas transitorias de ZeroBAP (`429`, `502`, `503` y `504`) y vuelve a solicitar un archivo cuando llega truncado. Si la unión directa detecta un PDF no estándar, intenta recuperar visualmente sus páginas antes de omitirlo. Solo después de agotar ambos métodos se genera el consolidado con los documentos disponibles y se muestra el número y la causa de las actas que no pudieron incluirse.

La vista previa aplica la misma validación antes de entregar el documento al visor del navegador. Cada PDF se normaliza, se vuelve a solicitar hasta tres veces si llega incompleto y, cuando el usuario cambia rápidamente de fila, se cancela la solicitud anterior. Esto impide que una respuesta atrasada reemplace el acta seleccionada y evita el error interno del visor que ofrecía recargar toda la página.

Una fila activa funciona como interruptor del panel: el primer clic en cualquier parte no interactiva de la fila abre la vista previa y el segundo clic sobre esa misma fila la cierra. Se retiró el desplazamiento por arrastre y el cursor de mano para recuperar este comportamiento directo; el desplazamiento horizontal conserva su barra nativa.

Al guardar una edición se envía a `PUT /Minutes/MinuteUpdated` el cuerpo:

```json
{
  "publicId": "uuid-del-acta",
  "statusId": 1,
  "folderId": 1
}
```

El panel utiliza un único botón para guardar. La solicitud siempre incluye `publicId`, `statusId` y `folderId`, aunque solo se haya modificado uno de los dos campos. El endpoint actual reemplaza ambos valores y enviarlos parcialmente puede convertir la columna omitida en `NULL`; si la API falla, el formulario conserva los valores para que el usuario pueda corregir o reintentar.
La carpeta ya no se escribe como un ID libre: se selecciona desde el catálogo de `/Folder/Folder/Combo`, administrado mediante el modal **Gestionar Carpetas** del módulo de Administración.
El catálogo reconoce tanto `descripcion` como `description` y traduce el ID persistido a la etiqueta visible de la carpeta. Después de una actualización exitosa, el listado se vuelve a consultar para confirmar el valor realmente persistido por el servidor.

## 4. Endpoint pendiente de publicación

La documentación recibida no incluye `PUT /api/Minutes/MinuteUpdated`; esa ruta se incorporó a partir de la captura del backend local. Al 25 de agosto de 2026 el dominio de producción responde `404 Not Found` para dicha operación, por lo que el backend debe publicarla en `https://zerobap.bap.net.pe` antes de que el guardado pueda persistir.

Los endpoints de listado y actualización de usuarios, incluido `permissionIds`, sí están documentados y fueron validados contra el dominio ZeroBAP.

## 5. Configuración y ejecución

El archivo `.env` usa una ruta relativa:

```dotenv
VITE_API_URL=/api
```

En desarrollo y en `vite preview`, `vite.config.ts` redirige `/api` hacia:

```text
https://zerobap.bap.net.pe
```

Comandos:

```bash
npm install
npm run dev
npm run build
npm run preview
npm run validate:integration
```

Prueba real de lectura con credenciales válidas, sin registrar ni modificar datos:

Linux/macOS:

```bash
ZERO_BAP_LOGIN="usuario" ZERO_BAP_PASSWORD="contraseña" npm run smoke:api
```

Windows PowerShell:

```powershell
$env:ZERO_BAP_LOGIN="usuario"
$env:ZERO_BAP_PASSWORD="contraseña"
npm run smoke:api
```

Se recomienda ejecutar `npm install` en el sistema operativo donde se compilará el proyecto. Rollup instala binarios opcionales distintos para Windows, Linux y macOS, por lo que no debe reutilizarse `node_modules` entre sistemas operativos.

## 6. Despliegue de producción

`vite.config.ts` solo aplica cuando se usa el servidor de Vite. Al publicar el contenido de `dist`, el servidor web debe redirigir `/api` al dominio ZeroBAP para conservar el mismo origen y la sesión. Se incluye un ejemplo en:

```text
deploy/nginx.conf.example
```

Debe ajustarse el dominio del frontend, los certificados TLS y las políticas de red del entorno real.

## 7. Verificación realizada

- Compilación estática TypeScript: aprobada con `tsc -b`.
- Configuración Vite: validada con TypeScript de forma independiente.
- Búsqueda de datos mock y de la IP anterior: sin coincidencias en `src`.
- Compilación Vite completa en el entorno de revisión: no se completó porque el ZIP recibido contiene binarios opcionales de Rollup para Windows y el entorno de revisión es Linux. Debe ejecutarse `npm install` en la plataforma de destino antes de `npm run build`.
- Validación estática reproducible: aprobada mediante `npm run validate:integration`.
- Prueba autenticada contra la API real: pendiente de credenciales válidas. Se incluye `npm run smoke:api`; no se usaron ni inventaron usuarios o contraseñas.
