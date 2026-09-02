import { access, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sourceFiles = {
  apiClient: "src/services/apiClient.ts",
  authService: "src/services/authService.ts",
  minutesService: "src/services/minutesService.ts",
  folderService: "src/services/folderService.ts",
  authContext: "src/auth/AuthContext.tsx",
  minutesPage: "src/pages/GestionActas/GestionActasPage.tsx",
  adminPage: "src/pages/Administracion/AdministracionPage.tsx",
  viteConfig: "vite.config.ts",
};

const contents = Object.fromEntries(
  await Promise.all(
    Object.entries(sourceFiles).map(async ([key, relativePath]) => [
      key,
      await readFile(path.join(root, relativePath), "utf8"),
    ])
  )
);

const assertions = [
  [contents.authService.includes('"/Auth/login"'), "POST /Auth/login"],
  [contents.apiClient.includes('"/Auth/refresh"'), "POST /Auth/refresh"],
  [contents.authService.includes('"/Auth/me"'), "GET /Auth/me"],
  [contents.authService.includes('"/Auth/logout"'), "POST /Auth/logout"],
  [contents.authService.includes('"/Auth/register"'), "POST /Auth/register"],
  [contents.authService.includes('"/Auth/updateuser"'), "PUT /Auth/updateuser"],
  [contents.authService.includes('`/Auth/listusers?${params.toString()}`'), "GET /Auth/listusers"],
  [contents.authService.includes('"/Auth/test-sap"'), "GET /Auth/test-sap"],
  [contents.minutesService.includes('"/Minutes/Filters"'), "GET /Minutes/Filters"],
  [contents.minutesService.includes("/Minutes/Minutes?"), "GET /Minutes/Minutes"],
  [
    contents.minutesService.includes('"/Minutes/MinuteUpdated"') &&
      contents.minutesService.includes('method: "PUT"'),
    "PUT /Minutes/MinuteUpdated",
  ],
  [
    contents.minutesService.includes("/Minutes/${encodeURIComponent(publicId)}/pdf"),
    "GET /Minutes/{publicId}/pdf",
  ],
  [
    contents.minutesService.includes('formData.append("File", file)') &&
      contents.minutesService.includes('method: "POST"'),
    "POST /Minutes/{publicId}/pdf",
  ],
  [contents.apiClient.includes('credentials: "include"'), "credenciales de sesión"],
  [contents.viteConfig.includes("https://zerobap.bap.net.pe"), "proxy ZeroBAP"],
  [
    contents.folderService.includes('"/Folder/Folder"') &&
      contents.folderService.includes('method: "POST"') &&
      contents.folderService.includes('method: "PUT"'),
    "creación y actualización de carpetas",
  ],
  [
    contents.folderService.includes('"/Folder/Folder/Combo"') &&
      contents.folderService.includes('method: "DELETE"'),
    "combo y eliminación de carpetas",
  ],
  [
    contents.folderService.includes("record?.descripcion") &&
      contents.minutesPage.includes("folderDisplayLabel(folderOptions, minute.folder)"),
    "nombre visible de carpetas aunque la API entregue descripcion o un ID",
  ],
  [
    contents.minutesPage.includes("getMinutesFilters") &&
      contents.minutesPage.includes("getMinutes"),
    "pantalla de actas conectada",
  ],
  [contents.adminPage.includes("registerUser"), "registro de usuarios conectado"],
  [
    contents.adminPage.includes("listUsers(") &&
      contents.adminPage.includes("updateUser({"),
    "listado y actualización de usuarios conectados",
  ],
  [
    contents.adminPage.includes('filters.status === "true"') &&
      contents.authService.includes('params.set("status", String(query.status))'),
    "estado booleano aplicado al filtro de usuarios",
  ],
  [
    contents.adminPage.includes("permissionIds:") &&
      contents.authService.includes("permissionIds?:"),
    "permisos enviados al registrar usuarios",
  ],
  [
    contents.adminPage.includes("Email (Username)") &&
      contents.adminPage.includes("email,"),
    "correo replicado como username y email",
  ],
  [
    contents.adminPage.includes('key="register-loading"') &&
      contents.adminPage.includes('key="register-success"') &&
      !contents.adminPage.includes("window.alert"),
    "confirmación animada de registro sin alertas nativas",
  ],
  [contents.authContext.includes("getCurrentUser"), "sesión validada con /Auth/me"],
  [
    contents.authContext.includes("current.permissionIds") &&
      contents.authContext.includes("current.permissions") &&
      contents.minutesPage.includes('hasPermission("editar")'),
    "permisos de sesión aplicados a las acciones de actas",
  ],
  [
      contents.minutesPage.includes("publicId: activeMinute.id") &&
      contents.minutesPage.includes("statusId,") &&
      contents.minutesPage.includes("folderId,") &&
      contents.minutesService.includes("statusId: number") &&
      contents.minutesService.includes("folderId: number") &&
      contents.minutesPage.includes("Guardar cambios") &&
      contents.minutesPage.includes('setSaveFeedback("Cambios guardados correctamente.")') &&
      contents.minutesPage.includes("setReloadKey((value) => value + 1)"),
    "guardado completo de publicId, statusId y folderId con resincronización",
  ],
  [
    contents.minutesPage.includes("values={catalogs.statuses}") &&
      !contents.minutesPage.includes("ESTADOS_ACTA"),
    "estados de actas obtenidos desde /Minutes/Filters",
  ],
  [
    contents.minutesPage.includes('await import("pdf-lib")') &&
      contents.minutesPage.includes("copyPages(") &&
      contents.minutesPage.includes("actas_consolidadas_"),
    "descarga de actas seleccionadas consolidada en un solo PDF",
  ],
  [
    contents.minutesPage.includes("const next = new Map(previous)") &&
      contents.minutesPage.includes("for (const minute of minutes) next.set"),
    "selección de toda la página sin perder actas de otras páginas",
  ],
  [
    contents.minutesService.includes("retryDelays = [0, 800, 1_600]") &&
      contents.apiClient.includes("El servidor ZeroBAP no pudo responder correctamente"),
    "reintentos y mensaje legible para errores transitorios de PDF",
  ],
  [
    contents.minutesPage.includes('import("pdfjs-dist")') &&
      contents.minutesPage.includes("canvasToPng") &&
      contents.minutesPage.includes("attempt < 3"),
    "recuperación y nueva descarga de PDFs truncados o malformados",
  ],
  [
    contents.minutesPage.includes("preparePdfPreview") &&
      contents.minutesPage.includes("previewRequestRef.current?.controller.abort()") &&
      contents.minutesPage.includes("normalizedPdf.save()"),
    "vista previa normalizada y cancelación de solicitudes PDF anteriores",
  ],
  [
    contents.minutesPage.includes("activeMinute?.id === minute.id") &&
      contents.minutesPage.includes("closeSidePanel();"),
    "cierre del visualizador al pulsar nuevamente la fila activa",
  ],
  [
    contents.adminPage.includes("Gestionar Carpetas") &&
      contents.adminPage.includes("handleSaveFolder") &&
      contents.adminPage.includes("await createFolder(request)") &&
      contents.adminPage.includes("await refreshFolders()") &&
      contents.adminPage.includes("handleDeleteFolder"),
    "creación de carpetas con actualización inmediata del listado",
  ],
  [
    contents.minutesPage.includes("listFolderOptions") &&
      contents.minutesPage.includes("Seleccione una carpeta") &&
      contents.minutesPage.includes('value={String(folder.id)}') &&
      !contents.minutesPage.includes("handleTablePointerDown") &&
      contents.minutesPage.includes('"cursor-pointer group"'),
    "combo de carpetas enlazado al ID interno y clic directo sobre las filas",
  ],
];

const failures = assertions.filter(([passed]) => !passed);
if (failures.length > 0) {
  for (const [, label] of failures) {
    console.error(`FALLO: no se encontró ${label}.`);
  }
  process.exitCode = 1;
} else {
  console.log(`OK: ${assertions.length} comprobaciones de integración aprobadas.`);
}

const removedMockFiles = [
  "src/pages/GestionActas/data.ts",
  "src/pages/Administracion/data.ts",
];

for (const relativePath of removedMockFiles) {
  try {
    await access(path.join(root, relativePath), fsConstants.F_OK);
    console.error(`FALLO: todavía existe el archivo simulado ${relativePath}.`);
    process.exitCode = 1;
  } catch {
    console.log(`OK: eliminado ${relativePath}.`);
  }
}
