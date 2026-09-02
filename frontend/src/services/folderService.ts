import { ApiError, apiRequest, type ApiEnvelope } from "./apiClient";

export type FolderItem = {
  id: string | number | null;
  publicId: string;
  code: string;
  abbreviation: string;
  name: string;
};

export type FolderOption = {
  id: string | number;
  publicId: string;
  code: string;
  name: string;
  description: string;
};

export type SaveFolderRequest = {
  code: string;
  abbreviation: string;
  name: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function unwrapResponse(value: unknown, fallbackMessage: string): unknown {
  const record = asRecord(value);
  if (record && typeof record.success === "boolean") {
    const envelope = record as unknown as ApiEnvelope<unknown>;
    if (!envelope.success) {
      throw new ApiError(envelope.message || fallbackMessage, {
        status: envelope.statusCode || 200,
        errors: envelope.errors,
        payload: envelope,
      });
    }
    return envelope.data;
  }
  return value;
}

function findArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];

  for (const key of ["folders", "items", "results", "data"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function normalizeFolder(value: unknown): FolderItem | null {
  const record = asRecord(value);
  if (!record) return null;

  const rawId = record.id ?? record.folderId ?? record.value;
  const id =
    typeof rawId === "string" || typeof rawId === "number" ? rawId : null;
  const publicId = stringValue(record.publicId ?? record.publicID ?? record.uuid);
  const code = stringValue(record.code ?? record.codigo);
  const abbreviation = stringValue(
    record.abreviatura ?? record.abbreviation ?? record.abbreviationName
  );
  const name = stringValue(
    record.name ?? record.nombre ?? record.description ?? record.descripcion ?? record.label
  );

  if (id === null && !publicId && !code && !name) return null;
  return { id, publicId, code, abbreviation, name };
}

function normalizeOption(value: unknown): FolderOption | null {
  const folder = normalizeFolder(value);
  if (!folder || folder.id === null || String(folder.id).trim() === "") return null;

  const description =
    [folder.code, folder.name].filter(Boolean).join(" - ") ||
    folder.abbreviation ||
    `Carpeta ${String(folder.id)}`;

  return {
    id: folder.id,
    publicId: folder.publicId,
    code: folder.code,
    name: folder.name,
    description,
  };
}

async function acceptOptionalEnvelope(
  path: string,
  options: RequestInit,
  fallbackMessage: string
): Promise<void> {
  const response = await apiRequest<unknown>(path, options);
  unwrapResponse(response, fallbackMessage);
}

export async function listFolders(signal?: AbortSignal): Promise<FolderItem[]> {
  const response = await apiRequest<unknown>("/Folder/Folder", {
    method: "GET",
    signal,
  });
  return findArray(unwrapResponse(response, "No se pudieron cargar las carpetas."))
    .map(normalizeFolder)
    .filter((folder): folder is FolderItem => folder !== null);
}

export async function listFolderOptions(
  signal?: AbortSignal
): Promise<FolderOption[]> {
  const response = await apiRequest<unknown>("/Folder/Folder/Combo", {
    method: "GET",
    signal,
  });
  return findArray(
    unwrapResponse(response, "No se pudieron cargar las carpetas disponibles.")
  )
    .map(normalizeOption)
    .filter((folder): folder is FolderOption => folder !== null);
}

export async function createFolder(request: SaveFolderRequest): Promise<void> {
  await acceptOptionalEnvelope(
    "/Folder/Folder",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: request.code,
        abreviatura: request.abbreviation,
        name: request.name,
      }),
    },
    "No se pudo crear la carpeta."
  );
}

export async function updateFolder(
  publicId: string,
  request: SaveFolderRequest
): Promise<void> {
  await acceptOptionalEnvelope(
    "/Folder/Folder",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicId,
        code: request.code,
        abreviatura: request.abbreviation,
        name: request.name,
      }),
    },
    "No se pudo actualizar la carpeta."
  );
}

export async function deleteFolder(publicId: string): Promise<void> {
  await acceptOptionalEnvelope(
    `/Folder/Folder/${encodeURIComponent(publicId)}`,
    { method: "DELETE" },
    "No se pudo eliminar la carpeta."
  );
}
