const RAW_API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

export const AUTH_UNAUTHORIZED_EVENT = "zerobap:auth-unauthorized";

export type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors: unknown;
  timestamp: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly errors: unknown;
  readonly payload: unknown;

  constructor(
    message: string,
    options: { status: number; errors?: unknown; payload?: unknown }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.errors = options.errors ?? null;
    this.payload = options.payload ?? null;
  }
}

type ParseMode = "json" | "text" | "blob" | "none";

type ApiRequestOptions = Omit<RequestInit, "credentials"> & {
  parseAs?: ParseMode;
  retryOnUnauthorized?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function mergeHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  return headers;
}

async function rawFetch(path: string, options: ApiRequestOptions): Promise<Response> {
  const { parseAs: _parseAs, retryOnUnauthorized: _retry, ...requestInit } = options;

  return fetch(buildUrl(path), {
    ...requestInit,
    headers: mergeHeaders(requestInit.headers),
    credentials: "include",
  });
}

async function fetchWithNetworkHandling(
  path: string,
  options: ApiRequestOptions
): Promise<Response> {
  try {
    return await rawFetch(path, options);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "No se pudo conectar con la API ZeroBAP. Verifica la red y la configuración del proxy.",
      { status: 0, payload: error }
    );
  }
}

async function parseErrorPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function collectErrorMessages(value: unknown, output: string[] = []): string[] {
  if (typeof value === "string" && value.trim()) {
    output.push(value.trim());
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectErrorMessages(item, output);
    return output;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectErrorMessages(item, output);
    }
  }

  return output;
}

function uniqueErrorDetail(value: unknown): string {
  const messages = [...new Set(collectErrorMessages(value))].slice(0, 5);
  return messages.join(" ");
}

function getErrorMessage(response: Response, payload: unknown): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const detail = uniqueErrorDetail(record.errors);

    if (typeof record.message === "string" && record.message.trim()) {
      return detail ? `${record.message.trim()} ${detail}` : record.message.trim();
    }

    if (typeof record.title === "string" && record.title.trim()) {
      return detail ? `${record.title.trim()} ${detail}` : record.title.trim();
    }

    if (detail) return detail;
  }

  if (typeof payload === "string" && payload.trim()) {
    if (/^\s*(?:<!doctype\s+html|<html)/i.test(payload)) {
      return `El servidor ZeroBAP no pudo responder correctamente (HTTP ${response.status}).`;
    }
    return payload;
  }

  if (response.status === 401) {
    return "La sesión no es válida o ha expirado.";
  }

  if (response.status === 403) {
    return "No tienes permisos para realizar esta operación.";
  }

  if (response.status === 404) {
    return "El recurso solicitado no fue encontrado.";
  }

  return `La API respondió con el estado ${response.status}.`;
}

function notifyUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
  }
}

async function refreshAccessSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = rawFetch("/Auth/refresh", {
      method: "POST",
      retryOnUnauthorized: false,
      parseAs: "none",
    })
      .then(async (response) => {
        if (!response.ok) return false;

        const text = await response.text();
        if (!text.trim()) return true;

        try {
          const payload = JSON.parse(text) as Record<string, unknown>;
          return typeof payload.success === "boolean" ? payload.success : true;
        } catch {
          return true;
        }
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function parseSuccessfulResponse<T>(
  response: Response,
  parseAs: ParseMode
): Promise<T> {
  if (parseAs === "none" || response.status === 204) {
    return undefined as T;
  }

  if (parseAs === "blob") {
    return (await response.blob()) as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  if (parseAs === "text") {
    return text as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("La API devolvió una respuesta que no es JSON válido.", {
      status: response.status,
      payload: text,
    });
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const parseAs = options.parseAs ?? "json";
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;

  let response = await fetchWithNetworkHandling(path, options);

  const isAuthEndpoint =
    path.includes("/Auth/login") || path.includes("/Auth/refresh");

  if (response.status === 401 && retryOnUnauthorized && !isAuthEndpoint) {
    const refreshed = await refreshAccessSession();
    if (refreshed) {
      response = await fetchWithNetworkHandling(path, {
        ...options,
        retryOnUnauthorized: false,
      });
    }
  }

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    const record =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : null;

    if (response.status === 401) {
      notifyUnauthorized();
    }

    throw new ApiError(getErrorMessage(response, payload), {
      status: response.status,
      errors: record?.errors,
      payload,
    });
  }

  return parseSuccessfulResponse<T>(response, parseAs);
}

export function assertSuccessfulEnvelope<T>(
  envelope: ApiEnvelope<T> | null | undefined,
  fallbackMessage: string
): T {
  if (!envelope) {
    throw new ApiError(fallbackMessage, { status: 200 });
  }

  if (!envelope.success) {
    throw new ApiError(envelope.message || fallbackMessage, {
      status: envelope.statusCode,
      errors: envelope.errors,
      payload: envelope,
    });
  }

  return envelope.data;
}
