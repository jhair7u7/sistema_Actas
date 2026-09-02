import {
  ApiError,
  apiRequest,
  assertSuccessfulEnvelope,
  type ApiEnvelope,
} from "./apiClient";

export type CatalogValue = {
  id: string | number;
  descripcion: string;
};

export type MinutesFilters = {
  months: CatalogValue[];
  years: CatalogValue[];
  statuses: CatalogValue[];
  sapStatuses: CatalogValue[];
  channels: CatalogValue[];
};

export type Minute = {
  id: string;
  canal?: string | null;
  fecha?: string | null;
  mes?: string | null;
  numeroActa?: string | null;
  numeroActaConsolidado?: string | null;
  statusSAP?: string | null;
  status?: string | null;
  codOrg?: string | null;
  nameOrg?: string | null;
  codAcopio?: string | null;
  nameACopio?: string | null;
  folder?: string | null;
};

export type UpdateMinuteRequest = {
  publicId: string;
  statusId?: string | number;
  folderId?: string | number;
};

export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type MinutesListResponse = ApiEnvelope<Minute[]> & {
  pagination: Pagination;
};

export type MinutesQuery = {
  acta?: string;
  channelId?: string | number;
  month?: string | number;
  year?: string | number;
  sapStatusId?: string | number;
  statusId?: string | number;
  organization?: string;
  folderId?: string | number;
  page: number;
  pageSize: number;
};

function appendIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined
): void {
  if (value === undefined) return;
  const normalized = String(value).trim();
  if (!normalized) return;
  params.set(key, normalized);
}

export async function getMinutesFilters(
  signal?: AbortSignal
): Promise<MinutesFilters> {
  const response = await apiRequest<ApiEnvelope<MinutesFilters | null>>(
    "/Minutes/Filters",
    {
      method: "GET",
      signal,
    }
  );

  const data = assertSuccessfulEnvelope(
    response,
    "No se pudieron cargar los filtros de actas."
  );

  if (!data) {
    throw new Error("La API no devolvió los catálogos de filtros.");
  }

  return {
    months: data.months ?? [],
    years: data.years ?? [],
    statuses: data.statuses ?? [],
    sapStatuses: data.sapStatuses ?? [],
    channels: data.channels ?? [],
  };
}

export async function getMinutes(
  query: MinutesQuery,
  signal?: AbortSignal
): Promise<{ data: Minute[]; pagination: Pagination }> {
  const params = new URLSearchParams();
  appendIfPresent(params, "Acta", query.acta);
  appendIfPresent(params, "ChannelId", query.channelId);
  appendIfPresent(params, "Month", query.month);
  appendIfPresent(params, "Year", query.year);
  appendIfPresent(params, "SapStatusId", query.sapStatusId);
  appendIfPresent(params, "StatusId", query.statusId);
  appendIfPresent(params, "Organization", query.organization);
  appendIfPresent(params, "folderId", query.folderId);
  appendIfPresent(params, "Page", query.page);
  appendIfPresent(params, "PageSize", query.pageSize);

  const response = await apiRequest<MinutesListResponse>(
    `/Minutes/Minutes?${params.toString()}`,
    {
      method: "GET",
      signal,
    }
  );

  const data = assertSuccessfulEnvelope(
    response,
    "No se pudo obtener el listado de actas."
  );

  if (!response.pagination) {
    throw new Error("La API no devolvió la información de paginación.");
  }
    return{
    data: data ?? [],
    pagination: response.pagination,
  };
}

export async function getMinutePdf(
  publicId: string,
  signal?: AbortSignal
): Promise<Blob> {
  const retryDelays = [0, 800, 1_600];
  let blob: Blob | null = null;
  let lastError: unknown;

  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt] > 0) {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(resolve, retryDelays[attempt]);
        signal?.addEventListener(
          "abort",
          () => {
            window.clearTimeout(timeout);
            reject(new DOMException("La descarga fue cancelada.", "AbortError"));
          },
          { once: true }
        );
      });
    }

    try {
      blob = await apiRequest<Blob>(
        `/Minutes/${encodeURIComponent(publicId)}/pdf`,
        {
          method: "GET",
          signal,
          parseAs: "blob",
          headers: {
            Accept: "application/pdf",
          },
        }
      );
      break;
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof ApiError &&
        (error.status === 0 || error.status === 429 || error.status >= 502);
      if (!retryable || attempt === retryDelays.length - 1) throw error;
    }
  }

  if (!blob) throw lastError;

  if (blob.size === 0) {
    throw new Error("La API devolvió un archivo PDF vacío.");
  }

  if (blob.type.toLowerCase().includes("json")) {
    const text = await blob.text();
    try {
      const payload = JSON.parse(text) as Record<string, unknown>;
      const message =
        typeof payload.message === "string" && payload.message.trim()
          ? payload.message
          : "La API devolvió JSON en lugar del PDF solicitado.";
      throw new Error(message);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("La API devolvió JSON no válido en lugar del PDF solicitado.");
      }
      throw error;
    }
  }

  return blob;
}

export async function updateMinute(request: UpdateMinuteRequest): Promise<void> {
  try {
    const response = await apiRequest<ApiEnvelope<boolean | null>>(
      "/Minutes/MinuteUpdated",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    assertSuccessfulEnvelope(
      response,
      "No se pudo actualizar el acta."
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Error(
        "El servidor ZeroBAP todavía no tiene publicado PUT /api/Minutes/MinuteUpdated."
      );
    }
    throw error;
  }
}

export async function uploadMinutePdf(
  publicId: string,
  file: File
): Promise<void> {
  const formData = new FormData();
  formData.append("File", file);

  await apiRequest<void>(`/Minutes/${encodeURIComponent(publicId)}/pdf`, {
    method: "POST",
    body: formData,
    parseAs: "none",
  });
}
