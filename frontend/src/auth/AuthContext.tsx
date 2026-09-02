import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  type CurrentUser,
  type LoginUser,
} from "../services/authService";
import { AUTH_UNAUTHORIZED_EVENT } from "../services/apiClient";

export type Permission =
  | "ver"
  | "subir_carga"
  | "descargar"
  | "editar"
  | "administrar";

export type AppRole = "Administrador" | "Usuario BAP" | "Consulta";

export type AuthUser = LoginUser & {
  userId: string | null;
  apiRoles: string[];
  permissions: Permission[];
  role: AppRole;
};

type StoredAuth = {
  user: AuthUser;
  expiresAt: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "zeroBap.auth.user";
const EXPIRES_KEY = "zeroBap.auth.expiresAt";

function normalizeRoleName(role: string): string {
  return role.trim().toUpperCase().replace(/[ÁÀÄ]/g, "A");
}

function normalizePermissionName(permission: string): string {
  return permission
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveAssignedPermissions(current: CurrentUser): Permission[] {
  const resolved = new Set<Permission>();
  const byId: Record<string, Permission> = {
    "1": "ver",
    "2": "descargar",
    "3": "subir_carga",
    "4": "editar",
    "5": "administrar",
    "6": "administrar",
  };

  const resolveToken = (value: string | number) => {
    const byNumericId = byId[String(value)];
    if (byNumericId) {
      resolved.add(byNumericId);
      return;
    }

    const permission = normalizePermissionName(String(value));
    if (permission === "minutes.download" || permission.includes("descarg")) {
      resolved.add("descargar");
    } else if (
      permission === "minutes.upload" ||
      permission.includes("subir") ||
      permission.includes("carg")
    ) {
      resolved.add("subir_carga");
    } else if (permission === "minutes.edit" || permission.includes("editar acta")) {
      resolved.add("editar");
    } else if (permission === "minutes.view" || permission.includes("visualizar acta") || permission === "ver pdf") {
      resolved.add("ver");
    }
  };

  current.permissionIds.forEach(resolveToken);
  current.permissions.forEach(resolveToken);

  return [...resolved];
}

function resolveAccess(current: CurrentUser): {
  role: AppRole;
  permissions: Permission[];
} {
  const normalized = current.roles.map(normalizeRoleName);
  const assignedPermissions = current.permissionsAvailable
    ? resolveAssignedPermissions(current)
    : null;

  if (
    normalized.some((role) =>
      ["ADMIN", "ADMINISTRADOR", "ADMINISTRATOR"].includes(role)
    )
  ) {
    return {
      role: "Administrador",
      permissions: assignedPermissions
        ? [...new Set([...assignedPermissions, "administrar" as Permission])]
        : ["ver", "subir_carga", "descargar", "editar", "administrar"],
    };
  }

  if (
    normalized.some((role) =>
      ["BAP_USER", "USUARIO BAP", "OPERADOR", "OPERATOR", "EDITOR"].includes(role)
    )
  ) {
    return {
      role: "Usuario BAP",
      permissions: assignedPermissions ?? ["ver", "subir_carga", "descargar", "editar"],
    };
  }

  return {
    role: "Consulta",
    permissions: assignedPermissions ?? ["ver"],
  };
}

function buildAuthUser(
  current: CurrentUser,
  email: string | null = null
): AuthUser {
  const access = resolveAccess(current);

  return {
    userId: current.userId ?? null,
    publicId: current.publicId,
    username: current.username,
    fullName: current.fullName,
    email,
    apiRoles: current.roles ?? [],
    ...access,
  };
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.publicId === "string" &&
    typeof record.username === "string" &&
    typeof record.fullName === "string" &&
    typeof record.role === "string" &&
    Array.isArray(record.permissions)
  );
}

function readStoredAuth(): StoredAuth | null {
  const rawUser = localStorage.getItem(STORAGE_KEY);
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as unknown;
    if (!isAuthUser(user)) return null;

    return {
      user,
      expiresAt: localStorage.getItem(EXPIRES_KEY),
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = useMemo(() => readStoredAuth(), []);
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(
    stored?.expiresAt ?? null
  );
  const [isInitializing, setIsInitializing] = useState(true);

  const clearLocalSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    setUser(null);
    setExpiresAt(null);
  }, []);

  const persistSession = useCallback(
    (nextUser: AuthUser, expiry: string | null) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      if (expiry) {
        localStorage.setItem(EXPIRES_KEY, expiry);
      } else {
        localStorage.removeItem(EXPIRES_KEY);
      }
      setUser(nextUser);
      setExpiresAt(expiry);
    },
    []
  );

  const refreshUser = useCallback(async () => {
    const current = await getCurrentUser();
    const storedEmail =
      user?.publicId === current.publicId ? user.email : stored?.user.email ?? null;
    const refreshedUser = buildAuthUser(current, storedEmail);
    persistSession(refreshedUser, expiresAt);
  }, [expiresAt, persistSession, stored?.user.email, user]);

  useEffect(() => {
    const controller = new AbortController();

    const hydrate = async () => {
      try {
        const current = await getCurrentUser(controller.signal);
        const storedEmail =
          stored?.user.publicId === current.publicId
            ? stored.user.email
            : null;
        persistSession(buildAuthUser(current, storedEmail), stored?.expiresAt ?? null);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          clearLocalSession();
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsInitializing(false);
        }
      }
    };

    void hydrate();
    return () => controller.abort();
  }, [clearLocalSession, persistSession, stored]);

  useEffect(() => {
    const handleUnauthorized = () => clearLocalSession();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearLocalSession]);

  const login = useCallback(
    async (loginValue: string, password: string) => {
      const session = await loginUser(loginValue, password);

      try {
        const current = await getCurrentUser();
        persistSession(
          buildAuthUser(current, session.user.email ?? null),
          session.expiresAt
        );
      } catch (error) {
        try {
          await logoutUser();
        } catch {
          // La validación de /Auth/me es la fuente de verdad de la sesión local.
        }
        clearLocalSession();
        throw error;
      }
    },
    [clearLocalSession, persistSession]
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // La sesión local siempre se limpia, incluso si el backend ya la invalidó.
    } finally {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  const hasPermission = useCallback(
    (permission: Permission) => user?.permissions.includes(permission) ?? false,
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      expiresAt,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      logout,
      refreshUser,
      hasPermission,
    }),
    [
      user,
      expiresAt,
      isInitializing,
      login,
      logout,
      refreshUser,
      hasPermission,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
