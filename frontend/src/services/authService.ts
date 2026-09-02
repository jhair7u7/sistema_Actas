import {
  ApiError,
  apiRequest,
  assertSuccessfulEnvelope,
  type ApiEnvelope,
} from "./apiClient";

export type LoginUser = {
  publicId: string;
  username: string;
  fullName: string;
  email: string | null;
};

export type LoginData = {
  expiresAt: string;
  user: LoginUser;
};

export type CurrentUser = {
  userId: string;
  publicId: string;
  username: string;
  fullName: string;
  roles: string[];
  permissionIds: Array<string | number>;
  permissions: string[];
  permissionsAvailable: boolean;
};

export type RegisterUserRequest = {
  username: string;
  password: string;
  fullName: string;
  email: string | null;
  documentNumber: string | null;
  phone: string | null;
  businessPartnerId: string | number | null;
  userTypeId: string | number;
  roleIds?: Array<string | number>;
  permissionIds?: Array<string | number>;
};

export type RegisterResult = {
  message: string;
};

export type UpdateUserRequest = {
  publicId: string;
  password: string | null;
  fullName: string;
  documentNumber: string;
  phone: string;
  permissionIds: Array<string | number> | null;
};

export type UserListQuery = {
  infoUser?: string;
  status?: boolean;
  roleId?: string | number;
  page?: number;
  pageSize?: number;
};

export type UserListItem = {
  publicId: string;
  username: string;
  fullName: string;
  email: string | null;
  documentNumber: string | null;
  phone: string | null;
  status: boolean;
  roleIds: Array<string | number>;
  roles: string[];
  permissionIds: Array<string | number>;
  permissions: string[];
  permissionsAvailable: boolean;
};

export type UserListResult = {
  users: UserListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

function parseJsonIfPossible(text: string | undefined): unknown {
  if (!text?.trim()) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text.trim();
  }
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.success === "boolean" &&
    typeof record.statusCode === "number" &&
    typeof record.message === "string"
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function booleanValue(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "activo", "active"].includes(normalized)) return true;
    if (["false", "0", "inactivo", "inactive"].includes(normalized)) return false;
  }
  return fallback;
}

function arrayValues(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function collectIds(value: unknown): Array<string | number> {
  return arrayValues(value).flatMap((item) => {
    if (typeof item === "string" || typeof item === "number") return [item];
    const record = asRecord(item);
    const id = record?.id ?? record?.roleId ?? record?.permissionId;
    return typeof id === "string" || typeof id === "number" ? [id] : [];
  });
}

function collectNames(value: unknown): string[] {
  return arrayValues(value).flatMap((item) => {
    if (typeof item === "string") return [item];
    const record = asRecord(item);
    const name =
      record?.code ?? record?.name ?? record?.description ?? record?.descripcion;
    return typeof name === "string" ? [name] : [];
  });
}

function normalizeCurrentUser(value: unknown): CurrentUser | null {
  const record = asRecord(value);
  if (!record) return null;

  const publicId = stringValue(record.publicId ?? record.id);
  const username = stringValue(record.username ?? record.userName ?? record.email);
  if (!publicId || !username) return null;

  const rolesSource = record.roles ?? record.roleNames ?? record.role;
  const permissionsSource =
    record.permissions ?? record.permissionNames ?? record.permission;
  const rawPermissionIds = record.permissionIds ?? record.permissionId;

  return {
    userId: stringValue(record.userId),
    publicId,
    username,
    fullName: stringValue(record.fullName ?? record.name) || username,
    roles: collectNames(rolesSource),
    permissionIds: collectIds(rawPermissionIds ?? permissionsSource),
    permissions: collectNames(permissionsSource),
    permissionsAvailable:
      rawPermissionIds !== undefined || permissionsSource !== undefined,
  };
}

function normalizeListUser(value: unknown): UserListItem | null {
  const record = asRecord(value);
  if (!record) return null;

  const publicId = stringValue(record.publicId ?? record.id);
  if (!publicId) return null;

  const username = stringValue(record.username ?? record.userName ?? record.email);
  const rolesSource = record.roles ?? record.roleNames ?? record.role;
  const permissionsSource =
    record.permissions ?? record.permissionNames ?? record.permission;
  const rawPermissionIds = record.permissionIds ?? record.permissionId;

  return {
    publicId,
    username,
    fullName: stringValue(record.fullName ?? record.name),
    email: stringValue(record.email) || null,
    documentNumber: stringValue(record.documentNumber ?? record.document) || null,
    phone: stringValue(record.phone) || null,
    status: booleanValue(record.status ?? record.isActive ?? record.active),
    roleIds: collectIds(record.roleIds ?? record.roleId ?? rolesSource),
    roles: collectNames(rolesSource),
    permissionIds: collectIds(rawPermissionIds ?? permissionsSource),
    permissions: collectNames(permissionsSource),
    permissionsAvailable:
      rawPermissionIds !== undefined || permissionsSource !== undefined,
  };
}

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function loginUser(
  login: string,
  password: string
): Promise<LoginData> {
  const response = await apiRequest<ApiEnvelope<LoginData | null>>(
    "/Auth/login",
    {
      method: "POST",
      retryOnUnauthorized: false,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login, password }),
    }
  );

  const data = assertSuccessfulEnvelope(response, "No se pudo iniciar sesión.");

  if (!data) {
    throw new ApiError(
      "La API confirmó el acceso, pero no devolvió los datos de sesión.",
      { status: response.statusCode, payload: response }
    );
  }

  return data;
}

export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const response = await apiRequest<ApiEnvelope<unknown>>("/Auth/me", {
    method: "GET",
    signal,
  });

  const data = assertSuccessfulEnvelope(
    response,
    "No se pudo obtener el usuario autenticado."
  );

  if (!data) {
    throw new ApiError(
      "La API no devolvió los datos del usuario autenticado.",
      { status: response.statusCode, payload: response }
    );
  }

  const currentUser = normalizeCurrentUser(data);
  if (!currentUser) {
    throw new ApiError("La API devolvió datos de usuario incompletos.", {
      status: response.statusCode,
      payload: response,
    });
  }

  return currentUser;
}

export async function registerUser(
  request: RegisterUserRequest
): Promise<RegisterResult> {
  const responseText = await apiRequest<string | undefined>("/Auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    parseAs: "text",
  });

  const payload = parseJsonIfPossible(responseText);

  if (isApiEnvelope(payload)) {
    assertSuccessfulEnvelope(payload, "No se pudo registrar el usuario.");
    return {
      message: payload.message || "Usuario registrado correctamente.",
    };
  }

  if (typeof payload === "string" && payload) {
    return { message: payload };
  }

  return { message: "Usuario registrado correctamente." };
}

export async function updateUser(
  request: UpdateUserRequest
): Promise<RegisterResult> {
  const responseText = await apiRequest<string | undefined>("/Auth/updateuser", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    parseAs: "text",
  });

  const payload = parseJsonIfPossible(responseText);
  if (isApiEnvelope(payload)) {
    assertSuccessfulEnvelope(payload, "No se pudo actualizar el usuario.");
    return { message: payload.message || "Usuario actualizado correctamente." };
  }

  return {
    message:
      typeof payload === "string" && payload
        ? payload
        : "Usuario actualizado correctamente.",
  };
}

export async function listUsers(
  query: UserListQuery,
  signal?: AbortSignal
): Promise<UserListResult> {
  const params = new URLSearchParams();
  if (query.infoUser?.trim()) params.set("InfoUser", query.infoUser.trim());
  if (typeof query.status === "boolean") params.set("status", String(query.status));
  if (query.roleId !== undefined && String(query.roleId).trim()) {
    params.set("roleId", String(query.roleId));
  }
  params.set("Page", String(query.page ?? 1));
  params.set("PageSize", String(query.pageSize ?? 20));

  const payload = await apiRequest<unknown>(`/Auth/listusers?${params.toString()}`, {
    method: "GET",
    signal,
  });
  const envelope = asRecord(payload);
  let data: unknown = payload;
  let paginationSource: Record<string, unknown> | null = envelope;

  if (isApiEnvelope(payload)) {
    data = assertSuccessfulEnvelope(payload, "No se pudo listar los usuarios.");
  }

  const dataRecord = asRecord(data);
  const rawUsers = Array.isArray(data)
    ? data
    : arrayValues(
        dataRecord?.users ?? dataRecord?.items ?? dataRecord?.results ?? dataRecord?.data
      );
  paginationSource =
    asRecord(envelope?.pagination) ??
    asRecord(dataRecord?.pagination) ??
    dataRecord ??
    paginationSource;

  const users = rawUsers
    .map(normalizeListUser)
    .filter((user): user is UserListItem => user !== null);
  const page = positiveInteger(paginationSource?.page, query.page ?? 1) || 1;
  const pageSize = positiveInteger(
    paginationSource?.pageSize,
    query.pageSize ?? 20
  ) || 20;
  const totalItems = positiveInteger(paginationSource?.totalItems, users.length);
  const totalPages = positiveInteger(
    paginationSource?.totalPages,
    Math.ceil(totalItems / pageSize)
  );

  return {
    users,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasPreviousPage: booleanValue(
        paginationSource?.hasPreviousPage,
        page > 1
      ),
      hasNextPage: booleanValue(
        paginationSource?.hasNextPage,
        page < totalPages
      ),
    },
  };
}

export async function logoutUser(): Promise<void> {
  await apiRequest<void>("/Auth/logout", {
    method: "POST",
    parseAs: "none",
    retryOnUnauthorized: false,
  });
}

export async function testSapConnection(): Promise<unknown> {
  const responseText = await apiRequest<string | undefined>("/Auth/test-sap", {
    method: "GET",
    parseAs: "text",
  });

  const payload = parseJsonIfPossible(responseText);
  if (isApiEnvelope(payload)) {
    assertSuccessfulEnvelope(payload, "La API no pudo comprobar la conexión con SAP.");
  }

  return payload ?? null;
}
