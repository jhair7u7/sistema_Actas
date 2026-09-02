import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  PenLine,
  X,
  Users,
  UserCheck,
  UserX,
  Shield,
  Check,
  RefreshCcw,
  Eye,
  Download,
  UploadCloud,
  Edit3,
  FolderCog,
  FolderOpen,
  Trash2
} from "lucide-react";
import clsx from "clsx";
import {
  listUsers,
  registerUser,
  updateUser,
  type UserListItem,
} from "../../services/authService";
import {
  createFolder,
  deleteFolder,
  listFolders,
  updateFolder,
  type FolderItem,
  type SaveFolderRequest,
} from "../../services/folderService";

// ============================================================
// TIPOS Y MAPEO DE LA API (ZeroBAP)
// ============================================================

type Permission = "ver" | "subir" | "descargar" | "editar";

type UserRole = "Administrador" | "Usuario BAP";

type UserFormData = {
  fullName: string;
  username: string;
  password: string;
  documentNumber: string;
  phone: string;
  role: UserRole;
  permissions: Permission[];
};

const DEFAULT_PERMISSIONS: Permission[] = [];

const ROLE_IDS: Record<UserRole, number> = {
  Administrador: 1,
  "Usuario BAP": 2,
};

const PERMISSION_IDS: Record<Permission, number> = {
  ver: 1,
  descargar: 2,
  subir: 3,
  editar: 4,
};

function createEmptyUserForm(): UserFormData {
  return {
    fullName: "",
    username: "",
    password: "",
    documentNumber: "",
    phone: "",
    role: "Usuario BAP",
    permissions: [...DEFAULT_PERMISSIONS],
  };
}

function createEmptyFolderForm(): SaveFolderRequest {
  return { code: "", abbreviation: "", name: "" };
}

type User = {
  publicId: string;
  username: string;
  fullName: string;
  email: string;
  documentNumber: string;
  phone: string;
  role: UserRole;
  permissions: Permission[];
  status: "Activo" | "Inactivo";
};

type Filters = {
  search: string;
  role: string;
  status: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

const INITIAL_FILTERS: Filters = {
  search: "",
  role: "",
  status: "",
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function resolveRole(user: UserListItem): UserRole {
  const roleNames = user.roles.map(normalizeToken);
  return user.roleIds.some((id) => String(id) === "1") ||
    roleNames.some((role) => role.includes("admin"))
    ? "Administrador"
    : "Usuario BAP";
}

function resolvePermissions(user: UserListItem): Permission[] {
  const resolved = new Set<Permission>();
  const byId: Record<string, Permission> = {
    "1": "ver",
    "2": "descargar",
    "3": "subir",
    "4": "editar",
  };

  const resolveToken = (value: string | number) => {
    const numericPermission = byId[String(value)];
    if (numericPermission) {
      resolved.add(numericPermission);
      return;
    }

    const permission = normalizeToken(String(value));
    if (permission === "minutes.download" || permission.includes("descarg")) {
      resolved.add("descargar");
    } else if (permission === "minutes.upload" || permission.includes("subir") || permission.includes("carg")) {
      resolved.add("subir");
    } else if (permission === "minutes.edit" || permission.includes("editar acta")) {
      resolved.add("editar");
    } else if (permission === "minutes.view" || permission.includes("visualizar acta") || permission === "ver pdf") {
      resolved.add("ver");
    }
  };

  user.permissionIds.forEach(resolveToken);
  user.permissions.forEach(resolveToken);

  return [...resolved];
}

function mapApiUser(user: UserListItem): User {
  return {
    publicId: user.publicId,
    username: user.username,
    fullName: user.fullName || user.username,
    email: user.email || user.username,
    documentNumber: user.documentNumber || "",
    phone: user.phone || "",
    role: resolveRole(user),
    permissions: resolvePermissions(user),
    status: user.status ? "Activo" : "Inactivo",
  };
}

// ============================================================
// COMPONENTES DE DISEÑO BAP
// ============================================================

function StatusBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "green" | "blue" | "orange" | "red" | "yellow" | "gray";
}) {
  const styles = {
    green: "bg-verde-bap-light text-verde-bap-dark",
    blue: "bg-azul-bap-light text-azul-bap-dark",
    orange: "bg-naranja-bap-light text-naranja-bap-dark",
    red: "bg-rojo-bap-light text-rojo-bap-dark",
    yellow: "bg-amarillo-bap-light text-[#8A6710]",
    gray: "bg-gris-bap-light text-gris-bap-dark",
  };
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide", styles[variant])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function BapCheckbox({
  checked,
  onChange,
  label,
  icon: Icon,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  icon?: React.ElementType;
  disabled?: boolean;
}) {
  return (
    <label className={clsx("flex items-center gap-3 group select-none", disabled ? "cursor-default" : "cursor-pointer")}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
      <div
        className={clsx(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-all duration-300",
          checked
            ? "border-verde-bap-dark bg-verde-bap-dark shadow-soft"
            : "border-[#DCEBE3] bg-white group-hover:border-verde-bap"
        )}
      >
        {checked && <Check className="h-3.5 w-3.5 stroke-[3] text-white animate-scale-in" />}
      </div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gris-bap-dark group-hover:text-verde-bap-dark transition-colors">
        {Icon && <Icon className="h-4 w-4 opacity-70" />}
        {label}
      </div>
    </label>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function AdministracionPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Estados del Modal (Registro/Edición)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [formData, setFormData] = useState<UserFormData>(createEmptyUserForm);

  // Estados del modal de carpetas
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [folderForm, setFolderForm] = useState<SaveFolderRequest>(createEmptyFolderForm);
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);
  const [isFolderSaving, setIsFolderSaving] = useState(false);
  const [folderError, setFolderError] = useState("");
  const [folderFeedback, setFolderFeedback] = useState("");

  // ============================================================
  // MÉTRICAS
  // ============================================================
  const totalUsers = pagination.totalItems;
  const activeUsers = users.filter((u) => u.status === "Activo").length;
  const inactiveUsers = users.filter((u) => u.status === "Inactivo").length;
  const adminUsers = users.filter((u) => u.role === "Administrador").length;

  // ============================================================
  // LISTADO Y FILTROS REMOTOS
  // ============================================================
  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearch(filters.search.trim()),
      350
    );
    return () => window.clearTimeout(timeoutId);
  }, [filters.search]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setListError("");

    listUsers(
      {
        infoUser: debouncedSearch,
        status:
          filters.status === "" ? undefined : filters.status === "true",
        roleId: filters.role || undefined,
        page,
        pageSize,
      },
      controller.signal
    )
      .then((result) => {
        setUsers(result.users.map(mapApiUser));
        setPagination(result.pagination);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setUsers([]);
          setPagination((current) => ({ ...current, totalItems: 0 }));
          setListError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el listado de usuarios."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, filters.role, filters.status, page, pageSize, reloadKey]);

  useEffect(() => {
    if (!isFolderModalOpen) return;
    const controller = new AbortController();
    setIsFoldersLoading(true);
    setFolderError("");

    listFolders(controller.signal)
      .then(setFolders)
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setFolderError(
            error instanceof Error ? error.message : "No se pudieron cargar las carpetas."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsFoldersLoading(false);
      });

    return () => controller.abort();
  }, [isFolderModalOpen]);

  // ============================================================
  // ACCIONES
  // ============================================================
  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const openModal = (user: User | null = null) => {
    setSuccessMessage("");
    setSubmitError("");
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        username: user.email,
        password: "", 
        documentNumber: user.documentNumber,
        phone: user.phone,
        role: user.role,
        permissions: [...user.permissions],
      });
    } else {
      setEditingUser(null);
      setFormData(createEmptyUserForm());
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingUser(null);
    setSuccessMessage("");
    setSubmitError("");
  };

  const openFolderModal = () => {
    setFolderForm(createEmptyFolderForm());
    setEditingFolder(null);
    setFolderToDelete(null);
    setFolderError("");
    setFolderFeedback("");
    setIsFolderModalOpen(true);
  };

  const closeFolderModal = () => {
    if (isFolderSaving) return;
    setIsFolderModalOpen(false);
    setEditingFolder(null);
    setFolderToDelete(null);
  };

  const refreshFolders = async () => {
    setIsFoldersLoading(true);
    setFolderError("");
    try {
      setFolders(await listFolders());
    } catch (error) {
      setFolderError(
        error instanceof Error ? error.message : "No se pudieron cargar las carpetas."
      );
    } finally {
      setIsFoldersLoading(false);
    }
  };

  const startEditingFolder = (folder: FolderItem) => {
    setEditingFolder(folder);
    setFolderToDelete(null);
    setFolderError("");
    setFolderFeedback("");
    setFolderForm({
      code: folder.code,
      abbreviation: folder.abbreviation,
      name: folder.name,
    });
  };

  const resetFolderForm = () => {
    setEditingFolder(null);
    setFolderToDelete(null);
    setFolderForm(createEmptyFolderForm());
    setFolderError("");
  };

  const handleSaveFolder = async () => {
    if (!folderForm.code.trim() || !folderForm.abbreviation.trim() || !folderForm.name.trim()) return;
    setIsFolderSaving(true);
    setFolderError("");
    setFolderFeedback("");
    try {
      const request = {
        code: folderForm.code.trim(),
        abbreviation: folderForm.abbreviation.trim(),
        name: folderForm.name.trim(),
      };
      if (editingFolder) {
        if (!editingFolder.publicId) throw new Error("La carpeta no tiene un identificador válido para editarla.");
        await updateFolder(editingFolder.publicId, request);
        setFolderFeedback("Carpeta actualizada correctamente.");
      } else {
        await createFolder(request);
        setFolderFeedback("Carpeta creada correctamente.");
      }
      setFolderForm(createEmptyFolderForm());
      setEditingFolder(null);
      await refreshFolders();
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : "No se pudo guardar la carpeta.");
    } finally {
      setIsFolderSaving(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete?.publicId) return;
    setIsFolderSaving(true);
    setFolderError("");
    setFolderFeedback("");
    try {
      await deleteFolder(folderToDelete.publicId);
      setFolderFeedback("Carpeta eliminada correctamente.");
      setFolderToDelete(null);
      if (editingFolder?.publicId === folderToDelete.publicId) resetFolderForm();
      await refreshFolders();
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : "No se pudo eliminar la carpeta.");
    } finally {
      setIsFolderSaving(false);
    }
  };

  const handleTogglePermission = (perm: Permission) => {
    setFormData((prev) => {
      const has = prev.permissions.includes(perm);
      const newPerms = has 
        ? prev.permissions.filter((p) => p !== perm) 
        : [...prev.permissions, perm];
      return { ...prev, permissions: newPerms };
    });
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role,
      permissions: prev.permissions,
    }));
  };

  const handleSaveUser = async () => {
    const email = formData.username.trim();

    try {
      setSubmitError("");
      setIsSaving(true);

      if (editingUser) {
        const result = await updateUser({
          publicId: editingUser.publicId,
          password: formData.password.trim() || null,
          fullName: formData.fullName.trim(),
          documentNumber: formData.documentNumber.trim(),
          phone: formData.phone.trim(),
          permissionIds: formData.permissions.map(
            (permission) => PERMISSION_IDS[permission]
          ),
        });
        setSuccessMessage(result.message);
        setReloadKey((value) => value + 1);
        return;
      }

      const result = await registerUser({
        username: email,
        email,
        password: formData.password,
        fullName: formData.fullName.trim(),
        documentNumber: formData.documentNumber.trim() || null,
        phone: formData.phone.trim() || null,
        businessPartnerId: null,
        userTypeId: 1,
        roleIds: [ROLE_IDS[formData.role]],
        permissionIds: formData.permissions.map(
          (permission) => PERMISSION_IDS[permission]
        ),
      });
      setSuccessMessage(
        result.message || "Usuario registrado correctamente."
      );
      setReloadKey((value) => value + 1);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : editingUser
            ? "No se pudo actualizar el usuario."
            : "No se pudo registrar el usuario."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    formData.username.trim()
  );
  const canSave = Boolean(
    formData.fullName.trim() &&
      hasValidEmail &&
      (editingUser || formData.password)
  );

  return (
    <div className="w-full space-y-10 font-sans text-gris-bap-dark">
      <div className="animate-fade in-up">
      
      {/* ========================================================
          HEADER MÁS GRANDE E IMPONENTE
      ======================================================== */}
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between animate-fade-in-up mb-4">
        <div>
          <span className="block text-[11px] font-black uppercase tracking-[0.20em] text-verde-bap-dark mb-2">
            Módulo de Configuración
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gris-bap-dark">
            Gestión de Usuarios
          </h1>
          <p className="mt-3 text-base font-medium text-gris-bap">
            Administra los accesos, roles y permisos de los usuarios en el entorno ZeroBAP.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={openFolderModal} className="btn-secondary group flex-shrink-0 py-3 px-6 text-sm">
            <FolderCog className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
            Gestionar Carpetas
          </button>
          <button onClick={() => openModal()} className="btn-primary group flex-shrink-0 shadow-glow-verde py-3 px-6 text-sm">
            <Plus className="h-5 w-5 transition-transform duration-400 group-hover:rotate-90" />
            Registrar Usuario
          </button>
        </div>
      </header>

      {/* ========================================================
          METRICS CARDS (CON CIRCULO VISIBLE)
      ======================================================== */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 w-full mb-8">
        {/* GREEN */}
        <article className="group relative overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft transition-all duration-400 ease-smooth hover:-translate-y-2 hover:border-verde-bap/60 hover:shadow-medium">
          <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-verde-bap/15 opacity-40 transition-all duration-500 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:bg-verde-bap/25" />
          <div className="relative flex items-center justify-between z-10">
            <div>
              <span className="text-sm font-semibold text-gris-bap">Total Usuarios</span>
              <strong className="mt-1 block text-4xl font-black tracking-tight text-gris-bap-dark">{totalUsers}</strong>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verde-bap-light text-verde-bap-dark transition-transform duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <Users className="h-7 w-7" />
            </div>
          </div>
        </article>

        {/* BLUE */}
        <article className="group relative overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft transition-all duration-400 ease-smooth hover:-translate-y-2 hover:border-azul-bap/60 hover:shadow-medium">
          <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-azul-bap/15 opacity-40 transition-all duration-500 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:bg-azul-bap/25" />
          <div className="relative flex items-center justify-between z-10">
            <div>
              <span className="text-sm font-semibold text-gris-bap">Activas en esta página</span>
              <strong className="mt-1 block text-4xl font-black tracking-tight text-gris-bap-dark">{activeUsers}</strong>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-azul-bap-light text-azul-bap-dark transition-transform duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <UserCheck className="h-7 w-7" />
            </div>
          </div>
        </article>

        {/* RED */}
        <article className="group relative overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft transition-all duration-400 ease-smooth hover:-translate-y-2 hover:border-rojo-bap/60 hover:shadow-medium">
          <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-rojo-bap/15 opacity-40 transition-all duration-500 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:bg-rojo-bap/25" />
          <div className="relative flex items-center justify-between z-10">
            <div>
              <span className="text-sm font-semibold text-gris-bap">Inactivas en esta página</span>
              <strong className="mt-1 block text-4xl font-black tracking-tight text-gris-bap-dark">{inactiveUsers}</strong>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rojo-bap-light text-rojo-bap-dark transition-transform duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <UserX className="h-7 w-7" />
            </div>
          </div>
        </article>

        {/* ORANGE (Fondo Naranja Aumentado) */}
        <article className="group relative overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft transition-all duration-400 ease-smooth hover:-translate-y-2 hover:border-naranja-bap/60 hover:shadow-medium">
          <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-naranja-bap/20 opacity-50 transition-all duration-500 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:bg-naranja-bap/35" />
          <div className="relative flex items-center justify-between z-10">
            <div>
              <span className="text-sm font-semibold text-gris-bap">Administradores en página</span>
              <strong className="mt-1 block text-4xl font-black tracking-tight text-gris-bap-dark">{adminUsers}</strong>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-naranja-bap-light text-naranja-bap-dark transition-transform duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <Shield className="h-7 w-7" />
            </div>
          </div>
        </article>
      </div>

      {/* ========================================================
          FILTROS Y TABLA
      ======================================================== */}
      <div className="overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white shadow-soft transition-all duration-400 hover:shadow-medium w-full">
        {/* Barra de Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCEBE3] px-6 py-5 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative min-w-80 group">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris-bap transition-all duration-300 group-focus-within:text-verde-bap-dark group-focus-within:scale-110" />
              <input
                type="search"
                placeholder="Buscar por nombre, usuario, documento..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="input-field pl-9 w-full"
              />
            </div>
            <div className="flex gap-4">
              <select 
                className="input-field font-semibold text-sm cursor-pointer"
                value={filters.role} 
                onChange={(e) => updateFilter("role", e.target.value)}
              >
                <option value="">Todos los Roles</option>
                <option value="1">Administradores</option>
                <option value="2">Usuarios BAP</option>
              </select>
              <select 
                className="input-field font-semibold text-sm cursor-pointer"
                value={filters.status} 
                onChange={(e) => updateFilter("status", e.target.value)}
              >
                <option value="">Todos los Estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="btn-ghost !text-gris-bap hover:!bg-gris-bap-light"
          >
            Limpiar filtros
          </button>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="btn-ghost !text-verde-bap-dark"
            disabled={isLoading}
          >
            <RefreshCcw className={clsx("h-4 w-4", isLoading && "animate-spin")} />
            Actualizar
          </button>
        </div>

        {listError && (
          <div className="border-b border-rojo-bap/20 bg-rojo-bap-light px-6 py-3 text-sm font-semibold text-rojo-bap-dark" role="alert">
            {listError}
          </div>
        )}

        {/* Tabla */}
        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#f4fbf7] [&::-webkit-scrollbar-thumb]:bg-[#73C59C] [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="min-w-[1200px] w-full border-collapse">
            <thead className="bg-verde-bap-extralight border-b border-[#DCEBE3]">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-verde-bap-dark text-left">Usuario</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-verde-bap-dark text-left">Documento / Teléfono</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-verde-bap-dark text-left">Rol Asignado</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-verde-bap-dark text-left">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-verde-bap-dark text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm font-semibold text-gris-bap">
                    Cargando usuarios reales...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm font-medium text-gris-bap">
                    {listError
                      ? "No fue posible mostrar los usuarios."
                      : "No se encontraron usuarios con los filtros aplicados."}
                  </td>
                </tr>
              ) : (
                users.map((u, index) => (
                  <motion.tr 
                    key={u.publicId} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                    className="border-b border-[#EEF4F0] transition-colors hover:bg-verde-bap-extralight group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold shadow-soft transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3",
                          u.status === "Activo" ? "bg-verde-bap text-white" : "bg-gris-bap-light text-gris-bap"
                        )}>
                          {getInitials(u.fullName)}
                        </div>
                        <div>
                          <p className="font-bold text-gris-bap-dark group-hover:text-verde-bap-dark transition-colors">{u.fullName}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gris-bap">
                            <span className="font-semibold">{u.username}</span>
                            <span>•</span>
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gris-bap-dark">
                      <p>DNI: {u.documentNumber || "—"}</p>
                      <p className="text-gris-bap mt-0.5 font-medium">Tel: {u.phone || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        {u.role === "Administrador" ? (
                          <StatusBadge variant="blue">Administrador</StatusBadge>
                        ) : (
                          <StatusBadge variant="orange">Usuario BAP</StatusBadge>
                        )}
                        {u.role === "Usuario BAP" && u.permissions.length > 0 && (
                          <span className="text-[10px] font-bold text-gris-bap flex gap-1">
                            {u.permissions.map(p => p.toUpperCase()).join(", ")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       {u.status === "Activo" ? (
                         <StatusBadge variant="green">Activo</StatusBadge>
                       ) : (
                         <StatusBadge variant="red">Inactivo</StatusBadge>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(u)}
                          className="rounded-lg p-2 text-azul-bap transition-all duration-300 hover:-translate-y-1 hover:bg-azul-bap-light hover:shadow-soft active:scale-95"
                          title="Editar usuario"
                        >
                          <PenLine className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#DCEBE3] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-semibold text-gris-bap">
            {pagination.totalItems === 0
              ? "0 usuarios"
              : `Página ${pagination.page} de ${Math.max(pagination.totalPages, 1)} · ${pagination.totalItems} usuarios`}
          </span>
          <div className="flex items-center gap-3">
            <select
              className="input-field !w-auto text-sm font-semibold"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              aria-label="Usuarios por página"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
            <button
              type="button"
              className="btn-secondary !px-4"
              disabled={!pagination.hasPreviousPage || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn-secondary !px-4"
              disabled={!pagination.hasNextPage || isLoading}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* ========================================================
          MODAL CON BLUR PANTALLA COMPLETA (z-[9999] + fixed inset-0)
      ======================================================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="
      fixed
      top-[-45px]
      left-0
      right-0
      bottom-0
      z-[9999]
      w-screen
      min-w-screen
      flex
      items-center
      justify-center
      bg-[#2B2C2E]/25
      backdrop-blur-xl
      p-4 sm:p-6
      animate-modal-backdrop
  "
            onMouseDown={() => {
              if (!isSaving && !successMessage) closeModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="glass-modal relative w-full max-w-3xl rounded-4xl bg-white shadow-modal flex flex-col max-h-[90vh] overflow-hidden m-auto"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <AnimatePresence>
                {isSaving && (
                  <motion.div
                    key="register-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white px-8 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-verde-bap-light text-verde-bap-dark"
                    >
                      <RefreshCcw className="h-10 w-10" />
                    </motion.div>
                    <h3 className="mt-6 text-2xl font-extrabold text-gris-bap-dark">
                      Registrando usuario
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-gris-bap">
                      Estamos guardando la información y los permisos asignados.
                    </p>
                  </motion.div>
                )}

                {!isSaving && successMessage && (
                  <motion.div
                    key="register-success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white px-8 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 280, damping: 18 }}
                      className="flex h-28 w-28 items-center justify-center rounded-full bg-verde-bap-light text-verde-bap-dark shadow-glow-verde"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.18, type: "spring", stiffness: 360, damping: 16 }}
                      >
                        <Check className="h-16 w-16 stroke-[3]" />
                      </motion.div>
                    </motion.div>
                    <h3 className="mt-7 text-3xl font-extrabold text-gris-bap-dark">
                      {editingUser ? "¡Cambios guardados!" : "¡Registro completado!"}
                    </h3>
                    <p className="mt-3 max-w-md text-base font-semibold text-gris-bap">
                      {successMessage}
                    </p>
                    <button
                      type="button"
                      className="btn-primary mt-8 !px-10 shadow-glow-verde"
                      onClick={closeModal}
                      autoFocus
                    >
                      Aceptar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#DCEBE3] bg-[#fcfdfd] px-8 py-6 shrink-0">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black",
                    editingUser ? "bg-azul-bap-light text-azul-bap-dark" : "bg-verde-bap-light text-verde-bap-dark"
                  )}>
                    {editingUser ? <Edit3 className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-gris-bap-dark">
                      {editingUser ? "Editar Usuario" : "Registrar Nuevo Usuario"}
                    </h3>
                    <p className="text-xs font-semibold text-gris-bap mt-1">
                      {editingUser ? "Modifica los datos y permisos asignados." : "Completa la información para dar acceso a ZeroBAP."}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="btn-ghost !p-2 !rounded-full">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Body (Scrollable) */}
              <div className="p-8 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-[#f4fbf7] [&::-webkit-scrollbar-thumb]:bg-[#73C59C] [&::-webkit-scrollbar-thumb]:rounded-full">
                
                <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-verde-bap-dark mb-4">
                  Datos del Perfil
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="label-field">Email (Username)</label>
                    <input
                      type="email"
                      placeholder="Ej. usuario@bap.com.pe"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={Boolean(editingUser)}
                      className="input-field font-semibold disabled:cursor-not-allowed disabled:bg-gris-bap-light"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="label-field">
                      Contraseña {editingUser && <span className="text-gris-bap font-normal ml-1">(Opcional)</span>}
                    </label>
                    <input
                      type="password"
                      placeholder={editingUser ? "•••••••• (Dejar vacío para no cambiar)" : "••••••••"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="label-field">Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="input-field font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="label-field">Número de Documento (DNI/CE)</label>
                    <input
                      type="text"
                      placeholder="Ej. 72145678"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="input-field font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="label-field">Teléfono</label>
                    <input
                      type="text"
                      placeholder="Ej. 999 888 777"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field font-semibold"
                    />
                  </div>
                </div>

                <div className="my-8 h-[1px] w-full bg-[#DCEBE3]" />

                <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-verde-bap-dark mb-4">
                  Configuración de Accesos
                </span>

                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col gap-2 md:w-1/2">
                    <label className="label-field">Rol del Usuario</label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      disabled={Boolean(editingUser)}
                      className="input-field cursor-pointer font-semibold bg-white disabled:cursor-not-allowed disabled:bg-gris-bap-light"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Usuario BAP">Usuario BAP</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-naranja-bap/30 bg-naranja-bap-light/30 p-6 shadow-inner">
                  <h4 className="text-sm font-extrabold text-naranja-bap-dark mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Permisos Específicos
                  </h4>
                  <div className="flex flex-wrap gap-6">
                    <BapCheckbox
                      label="Ver PDF"
                      icon={Eye}
                      checked={formData.permissions.includes("ver")}
                      onChange={() => handleTogglePermission("ver")}
                    />
                    <BapCheckbox
                      label="Cargar PDF"
                      icon={UploadCloud}
                      checked={formData.permissions.includes("subir")}
                      onChange={() => handleTogglePermission("subir")}
                    />
                    <BapCheckbox
                      label="Descargar"
                      icon={Download}
                      checked={formData.permissions.includes("descargar")}
                      onChange={() => handleTogglePermission("descargar")}
                    />
                    <BapCheckbox
                      label="Editar"
                      icon={PenLine}
                      checked={formData.permissions.includes("editar")}
                      onChange={() => handleTogglePermission("editar")}
                    />
                  </div>
                </div>

                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 rounded-xl border border-rojo-bap/30 bg-rojo-bap-light px-4 py-3 text-sm font-semibold text-rojo-bap-dark"
                    role="alert"
                  >
                    {submitError}
                  </motion.div>
                )}

              </div>

              {/* Footer */}
              <div className="border-t border-[#DCEBE3] bg-[#fcfdfd] px-8 py-5 flex justify-end gap-4 shrink-0">
                <button className="btn-secondary !px-6" onClick={closeModal}>
                  Cancelar
                </button>
                <button 
                  className="btn-primary !px-8 shadow-glow-verde" 
                  onClick={() => void handleSaveUser()}
                  disabled={!canSave || isSaving}
                >
                  {isSaving
                    ? editingUser
                      ? "Guardando..."
                      : "Registrando..."
                    : editingUser
                      ? "Guardar cambios"
                      : "Registrar Usuario"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFolderModalOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#10271d]/35 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeFolderModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="glass-modal flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-4xl bg-white shadow-modal"
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="folder-modal-title"
            >
              <div className="flex items-center justify-between border-b border-[#DCEBE3] bg-[#fcfdfd] px-7 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verde-bap-light text-verde-bap-dark">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 id="folder-modal-title" className="text-xl font-black text-gris-bap-dark">Gestión de Carpetas</h2>
                    <p className="text-sm font-medium text-gris-bap">Crea, edita o elimina las carpetas disponibles para las actas.</p>
                  </div>
                </div>
                <button type="button" onClick={closeFolderModal} className="btn-secondary !p-2" aria-label="Cerrar gestión de carpetas">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
                <section className="border-b border-[#DCEBE3] p-7 lg:border-b-0 lg:border-r">
                  <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.16em] text-verde-bap-dark">
                    {editingFolder ? "Editar carpeta" : "Nueva carpeta"}
                  </span>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="label-field" htmlFor="folder-code">Código</label>
                      <input id="folder-code" className="input-field font-semibold" value={folderForm.code} onChange={(event) => setFolderForm((current) => ({ ...current, code: event.target.value }))} placeholder="Ej. ARCH-01" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="label-field" htmlFor="folder-abbreviation">Abreviatura</label>
                      <input id="folder-abbreviation" className="input-field font-semibold" value={folderForm.abbreviation} onChange={(event) => setFolderForm((current) => ({ ...current, abbreviation: event.target.value }))} placeholder="Ej. ARCH" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="label-field" htmlFor="folder-name">Nombre</label>
                      <input id="folder-name" className="input-field font-semibold" value={folderForm.name} onChange={(event) => setFolderForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Archivo central" />
                    </div>
                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                      {editingFolder && <button type="button" className="btn-secondary" onClick={resetFolderForm}>Cancelar edición</button>}
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => void handleSaveFolder()}
                        disabled={isFolderSaving || !folderForm.code.trim() || !folderForm.abbreviation.trim() || !folderForm.name.trim()}
                      >
                        {isFolderSaving ? "Guardando..." : editingFolder ? "Guardar cambios" : "Crear carpeta"}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="min-h-[360px] p-7">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-verde-bap-dark">Carpetas existentes</span>
                    <button type="button" className="btn-secondary !px-3 !py-2" onClick={() => void refreshFolders()} disabled={isFoldersLoading || isFolderSaving}>
                      <RefreshCcw className={clsx("h-4 w-4", isFoldersLoading && "animate-spin")} />
                      Actualizar
                    </button>
                  </div>

                  {folderError && <p role="alert" className="mb-4 rounded-xl border border-rojo-bap/30 bg-rojo-bap-light px-4 py-3 text-sm font-semibold text-rojo-bap-dark">{folderError}</p>}
                  {folderFeedback && <p role="status" className="mb-4 rounded-xl border border-verde-bap/30 bg-verde-bap-light px-4 py-3 text-sm font-semibold text-verde-bap-dark">{folderFeedback}</p>}

                  {folderToDelete && (
                    <div className="mb-4 rounded-xl border border-rojo-bap/30 bg-rojo-bap-light p-4">
                      <p className="text-sm font-bold text-rojo-bap-dark">¿Eliminar la carpeta “{folderToDelete.name || folderToDelete.code}”?</p>
                      <p className="mt-1 text-xs text-rojo-bap-dark/80">No podrá volver a seleccionarse al editar un acta.</p>
                      <div className="mt-3 flex justify-end gap-2">
                        <button type="button" className="btn-secondary !px-4 !py-2" onClick={() => setFolderToDelete(null)}>Cancelar</button>
                        <button type="button" className="rounded-xl bg-rojo-bap-dark px-4 py-2 text-sm font-bold text-white" onClick={() => void handleDeleteFolder()} disabled={isFolderSaving}>Confirmar eliminación</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {isFoldersLoading && <p className="py-12 text-center text-sm font-semibold text-gris-bap">Cargando carpetas...</p>}
                    {!isFoldersLoading && folders.length === 0 && !folderError && <p className="rounded-xl border border-dashed border-[#DCEBE3] px-4 py-12 text-center text-sm font-semibold text-gris-bap">Aún no hay carpetas registradas.</p>}
                    {!isFoldersLoading && folders.map((folder, index) => (
                      <article key={folder.publicId || `${String(folder.id)}-${folder.code}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-[#DCEBE3] bg-white p-4 shadow-soft">
                        <div className="min-w-0">
                          <strong className="block truncate text-sm font-extrabold text-gris-bap-dark">{folder.name || "Carpeta sin nombre"}</strong>
                          <span className="mt-1 block truncate text-xs font-semibold text-gris-bap">{[folder.code, folder.abbreviation].filter(Boolean).join(" · ") || `ID ${String(folder.id ?? "—")}`}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button type="button" className="btn-secondary !p-2" onClick={() => startEditingFolder(folder)} disabled={!folder.publicId || isFolderSaving} aria-label={`Editar carpeta ${folder.name || folder.code}`}><PenLine className="h-4 w-4" /></button>
                          <button type="button" className="rounded-xl border border-rojo-bap/25 p-2 text-rojo-bap-dark transition hover:bg-rojo-bap-light disabled:opacity-40" onClick={() => { setFolderToDelete(folder); setFolderFeedback(""); }} disabled={!folder.publicId || isFolderSaving} aria-label={`Eliminar carpeta ${folder.name || folder.code}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
