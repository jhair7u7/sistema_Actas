import React, { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  X,
  PenLine,
  FileText,
  Check,
  UploadCloud
} from "lucide-react";
import clsx from "clsx";
import type { PDFDocument as PdfLibDocument } from "pdf-lib";
import {
  getMinutePdf,
  getMinutes,
  getMinutesFilters,
  updateMinute,
  uploadMinutePdf,
  type CatalogValue,
  type Minute,
  type MinutesFilters,
  type Pagination,
} from "../../services/minutesService";
import {
  listFolderOptions,
  type FolderOption,
} from "../../services/folderService";
import { useAuth } from "../../auth/AuthContext";

// ============================================================
// CONFIGURACIÓN Y ESTADOS CONSTANTES
// ============================================================

const EMPTY_CATALOGS: MinutesFilters = {
  months: [],
  years: [],
  statuses: [],
  sapStatuses: [],
  channels: [],
};

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

type Filters = {
  acta: string;
  organization: string;
  channelId: string;
  month: string;
  year: string;
  sapStatusId: string;
  statusId: string;
  folderId: string;
};

const INITIAL_FILTERS: Filters = {
  acta: "",
  organization: "",
  channelId: "",
  month: "",
  year: "",
  sapStatusId: "",
  statusId: "",
  folderId: "",
};

// ============================================================
// FUNCIONES DE UTILIDAD Y MOCK DE API
// ============================================================

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  if (!match) return fecha;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function safeText(value: string | null | undefined): string {
  return value?.trim() || "—";
}

function sanitizeFileName(value: string): string {
  return value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\s+/g, "_") || "acta";
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("No se pudo convertir una página del PDF en imagen."));
        return;
      }
      resolve(await blob.arrayBuffer());
    }, "image/png");
  });
}

async function appendPdfPages(
  consolidatedPdf: PdfLibDocument,
  sourceBytes: ArrayBuffer
): Promise<void> {
  const { PDFDocument } = await import("pdf-lib");

  try {
    const sourcePdf = await PDFDocument.load(sourceBytes);
    const pages = await consolidatedPdf.copyPages(
      sourcePdf,
      sourcePdf.getPageIndices()
    );
    pages.forEach((pageToAdd) => consolidatedPdf.addPage(pageToAdd));
    return;
  } catch (directMergeError) {
    try {
      const [pdfjs, workerModule] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(sourceBytes),
      });
      const sourcePdf = await loadingTask.promise;
      const renderedPages: Array<{
        png: ArrayBuffer;
        width: number;
        height: number;
      }> = [];

      try {
        for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber += 1) {
          const sourcePage = await sourcePdf.getPage(pageNumber);
          const pageSize = sourcePage.getViewport({ scale: 1 });
          const renderViewport = sourcePage.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(renderViewport.width);
          canvas.height = Math.ceil(renderViewport.height);
          await sourcePage.render({ canvas, viewport: renderViewport }).promise;
          renderedPages.push({
            png: await canvasToPng(canvas),
            width: pageSize.width,
            height: pageSize.height,
          });
          canvas.width = 0;
          canvas.height = 0;
        }
      } finally {
        await loadingTask.destroy();
      }

      for (const renderedPage of renderedPages) {
        const image = await consolidatedPdf.embedPng(renderedPage.png);
        const targetPage = consolidatedPdf.addPage([
          renderedPage.width,
          renderedPage.height,
        ]);
        targetPage.drawImage(image, {
          x: 0,
          y: 0,
          width: renderedPage.width,
          height: renderedPage.height,
        });
      }
    } catch (recoveryError) {
      throw new Error(
        `El PDF está dañado y tampoco pudo recuperarse (${getErrorMessage(
          recoveryError,
          getErrorMessage(directMergeError, "estructura PDF inválida")
        )}).`
      );
    }
  }
}

async function preparePdfPreview(
  publicId: string,
  signal: AbortSignal
): Promise<Blob> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(resolve, attempt * 800);
        signal.addEventListener(
          "abort",
          () => {
            window.clearTimeout(timeout);
            reject(new DOMException("La vista previa fue cancelada.", "AbortError"));
          },
          { once: true }
        );
      });
    }

    try {
      const sourceBlob = await getMinutePdf(publicId, signal);
      const { PDFDocument } = await import("pdf-lib");
      const normalizedPdf = await PDFDocument.create();
      await appendPdfPages(normalizedPdf, await sourceBlob.arrayBuffer());
      if (signal.aborted) {
        throw new DOMException("La vista previa fue cancelada.", "AbortError");
      }
      const normalizedBytes = await normalizedPdf.save();
      return new Blob([normalizedBytes], { type: "application/pdf" });
    } catch (error) {
      if (isAbortError(error)) throw error;
      lastError = error;
    }
  }

  throw lastError ?? new Error("No se pudo preparar el PDF para la vista previa.");
}

// Scrollbar Verde Natural
const flatScrollbarStyles = `
  [&::-webkit-scrollbar]:w-2.5 
  [&::-webkit-scrollbar]:h-2.5 
  [&::-webkit-scrollbar-track]:bg-[#f4fbf7]
  [&::-webkit-scrollbar-thumb]:bg-[#73C59C]
  [&::-webkit-scrollbar-thumb]:rounded-full
`;

// ============================================================
// COMPONENTES VISUALES
// ============================================================

function statusActaBadge(status: string | null | undefined) {
  const label = safeText(status);
  const normalized = (status ?? "").trim().toUpperCase();
  if (normalized === "ERROR") return <span className="ds-badge ds-badge-red">{label}</span>;
  if (["GENERADO", "FIRMADO", "COMPLETADO"].includes(normalized)) {
    return <span className="ds-badge ds-badge-blue">{label}</span>;
  }
  if (["ENVIADO", "PROCESANDO"].includes(normalized)) {
    return <span className="ds-badge ds-badge-green">{label}</span>;
  }
  if (["REVISIÓN", "OBSERVADO", "PENDIENTE"].includes(normalized)) {
    return <span className="ds-badge ds-badge-orange">{label}</span>;
  }
  return <span className="ds-badge ds-badge-yellow">{label}</span>;
}

function statusSapBadge(status: string | null | undefined) {
  const label = safeText(status);
  const normalized = (status ?? "").trim().toUpperCase();
  if (normalized === "ACTIVO") return <span className="ds-badge ds-badge-green">{label}</span>;
  if (normalized === "ANULADO") return <span className="ds-badge ds-badge-red">{label}</span>;
  if (["REVISIÓN", "OBSERVADO"].includes(normalized)) return <span className="ds-badge ds-badge-orange">{label}</span>;
  return <span className="ds-badge ds-badge-yellow">{label}</span>;
}

// Custom Checkbox con palomita blanca (Usando Lucide Check)
function WhiteCheckCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const activate = () => {
    if (!disabled) onChange();
  };

  return (
    <div
      role="checkbox"
      aria-label={ariaLabel}
      aria-checked={indeterminate ? "mixed" : checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => {
        e.stopPropagation();
        activate();
      }}
      onKeyDown={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        event.stopPropagation();
        activate();
      }}
      className={clsx(
        "flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded border transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        checked || indeterminate
          ? "border-[var(--ds-green-dark)] bg-[var(--ds-green-dark)]"
          : "border-[#c6dece] bg-white hover:border-[var(--ds-green)]"
      )}
    >
      {checked && <Check className="h-3.5 w-3.5 stroke-[3] text-white" />}
      {!checked && indeterminate && <div className="h-0.5 w-2 bg-white rounded-full" />}
    </div>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

export default function GestionActasPage() {
  const { hasPermission } = useAuth();
  const canUpload = hasPermission("subir_carga");
  const canDownload = hasPermission("descargar");
  const canEdit = hasPermission("editar");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [catalogs, setCatalogs] = useState<MinutesFilters>(EMPTY_CATALOGS);
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<Map<string, Minute>>(new Map());
  const [folderOptions, setFolderOptions] = useState<FolderOption[]>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [foldersError, setFoldersError] = useState("");
  
  // Loading & Errors
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filtersError, setFiltersError] = useState("");
  const [pdfError, setPdfError] = useState("");
  
  // Acciones Descarga/Subida
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [minuteToUpload, setMinuteToUpload] = useState<Minute | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  // Panel Lateral (Vista Compartida: Previsualizar / Editar)
  const [activeMinute, setActiveMinute] = useState<Minute | null>(null);
  const [panelMode, setPanelMode] = useState<"preview" | "edit" | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewPdfUrlRef = useRef<string | null>(null);
  const previewRequestRef = useRef<{
    sequence: number;
    controller: AbortController;
  } | null>(null);
  const [editForm, setEditForm] = useState({ statusId: "", folderId: "" });
  const [initialEditForm, setInitialEditForm] = useState({ statusId: "", folderId: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsFiltersLoading(true);
    setFiltersError("");

    getMinutesFilters(controller.signal)
      .then(setCatalogs)
      .catch((error) => {
        if (!isAbortError(error)) {
          setFiltersError(getErrorMessage(error, "No se pudieron cargar los filtros."));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsFiltersLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    setIsFoldersLoading(true);
    setFoldersError("");

    listFolderOptions(controller.signal)
      .then(setFolderOptions)
      .catch((error) => {
        if (!isAbortError(error)) {
          setFolderOptions([]);
          setFoldersError(
            getErrorMessage(error, "No se pudieron cargar las carpetas disponibles.")
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsFoldersLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    const debounce = window.setTimeout(() => {
      setIsLoading(true);
      setErrorMessage("");

      getMinutes(
        {
          acta: filters.acta,
          organization: filters.organization,
          channelId: filters.channelId,
          month: filters.month,
          year: filters.year,
          sapStatusId: filters.sapStatusId,
          statusId: filters.statusId,
          folderId: filters.folderId,
          page,
          pageSize,
        },
        controller.signal
      )
        .then((result) => {
          setMinutes(result.data);
          setPagination(result.pagination);
          setSelected((previous) => {
            if (previous.size === 0) return previous;
            const next = new Map(previous);
            for (const minute of result.data) {
              if (next.has(minute.id)) next.set(minute.id, minute);
            }
            return next;
          });
        })
        .catch((error) => {
          if (!isAbortError(error)) {
            setMinutes([]);
            setPagination({ ...EMPTY_PAGINATION, page, pageSize });
            setErrorMessage(getErrorMessage(error, "No se pudieron cargar las actas."));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(debounce);
      controller.abort();
    };
  }, [filters, page, pageSize, reloadKey]);

  useEffect(() => {
    return () => {
      previewRequestRef.current?.controller.abort();
      if (previewPdfUrlRef.current) {
        URL.revokeObjectURL(previewPdfUrlRef.current);
        previewPdfUrlRef.current = null;
      }
    };
  }, []);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setPage(1);
    setSelected(new Map());
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
    setSelected(new Map());
  };

  const allCurrentPageSelected = minutes.length > 0 && minutes.every((minute) => selected.has(minute.id));
  const someCurrentPageSelected = !allCurrentPageSelected && minutes.some((minute) => selected.has(minute.id));

  const toggleAll = () => {
    setSelected((previous) => {
      const next = new Map(previous);
      if (allCurrentPageSelected) {
        for (const minute of minutes) next.delete(minute.id);
      } else {
        for (const minute of minutes) next.set(minute.id, minute);
      }
      return next;
    });
  };

  const toggleOne = (minute: Minute) => {
    setSelected((previous) => {
      const next = new Map(previous);
      if (next.has(minute.id)) next.delete(minute.id);
      else next.set(minute.id, minute);
      return next;
    });
  };

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value.trim()).length,
    [filters]
  );

  const markDownloading = (id: string, active: boolean) => {
    setDownloadingIds((previous) => {
      const next = new Set(previous);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const downloadPdf = async (minute: Minute, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canDownload) return;
    setPdfError("");
    markDownloading(minute.id, true);
    try {
      const blob = await getMinutePdf(minute.id);
      triggerDownload(blob, `${sanitizeFileName(minute.numeroActa || minute.id)}.pdf`);
    } catch (error) {
      setPdfError(getErrorMessage(error, `No se pudo descargar el acta ${safeText(minute.numeroActa)}.`));
    } finally {
      markDownloading(minute.id, false);
    }
  };

  const downloadSelected = async () => {
    if (!canDownload || selected.size === 0) return;
    setPdfError("");
    setIsBulkDownloading(true);
    const failures: Array<{ minute: string; reason: string }> = [];
    let includedDocuments = 0;

    try {
      const { PDFDocument } = await import("pdf-lib");
      const consolidatedPdf = await PDFDocument.create();

      for (const minute of selected.values()) {
        markDownloading(minute.id, true);
        try {
          let appended = false;
          let lastPdfError: unknown;

          for (let attempt = 0; attempt < 3 && !appended; attempt += 1) {
            if (attempt > 0) {
              await new Promise((resolve) =>
                window.setTimeout(resolve, attempt * 800)
              );
            }

            try {
              const blob = await getMinutePdf(minute.id);
              await appendPdfPages(consolidatedPdf, await blob.arrayBuffer());
              appended = true;
            } catch (error) {
              lastPdfError = error;
            }
          }

          if (!appended) throw lastPdfError;
          includedDocuments += 1;
        } catch (error) {
          failures.push({
            minute: minute.numeroActa || minute.id,
            reason: getErrorMessage(error, "El archivo recibido no pudo procesarse como PDF."),
          });
        } finally {
          markDownloading(minute.id, false);
        }
      }

      if (includedDocuments === 0) {
        throw new Error("No se pudo incluir ninguna de las actas seleccionadas.");
      }

      const consolidatedBytes = await consolidatedPdf.save();
      const consolidatedBlob = new Blob([consolidatedBytes], {
        type: "application/pdf",
      });
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(consolidatedBlob, `actas_consolidadas_${date}.pdf`);

      if (failures.length > 0) {
        const failuresByReason = new Map<string, string[]>();
        for (const failure of failures) {
          const minutesWithSameReason = failuresByReason.get(failure.reason) ?? [];
          minutesWithSameReason.push(failure.minute);
          failuresByReason.set(failure.reason, minutesWithSameReason);
        }
        const detail = [...failuresByReason.entries()]
          .map(([reason, minutes]) => `${minutes.join(", ")}: ${reason}`)
          .join(" | ");
        setPdfError(
          `El consolidado se descargó, pero no se pudieron incluir ${failures.length} acta(s). ${detail}`
        );
      }
    } catch (error) {
      setPdfError(
        getErrorMessage(error, "No se pudo generar el PDF consolidado.")
      );
    } finally {
      setIsBulkDownloading(false);
    }
  };

  // ----- SUBIR PDF -----

  const triggerUpload = (minute: Minute, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canUpload) return;
    setMinuteToUpload(minute);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !minuteToUpload) return;
    
    setUploadingId(minuteToUpload.id);
    setPdfError("");
    
    try {
      await uploadMinutePdf(minuteToUpload.id, file);
      setReloadKey((value) => value + 1);

    } catch (error) {
      setPdfError(getErrorMessage(error, `Hubo un error al subir el PDF de ${minuteToUpload.numeroActa}.`));
    } finally {
      setUploadingId(null);
      setMinuteToUpload(null);
    }
  };

  // ----- PANEL LATERAL (PREVIEW / EDIT) -----

  const clearPreviewResources = () => {
    previewRequestRef.current?.controller.abort();
    previewRequestRef.current = null;
    setIsPreviewLoading(false);
    if (previewPdfUrlRef.current) {
      URL.revokeObjectURL(previewPdfUrlRef.current);
      previewPdfUrlRef.current = null;
    }
    setPreviewPdfUrl(null);
  };

  const closeSidePanel = () => {
    clearPreviewResources();
    setActiveMinute(null);
    setPanelMode(null);
  };

  const handleRowClick = async (minute: Minute) => {
    if (activeMinute?.id === minute.id && panelMode === "preview") {
      closeSidePanel();
      return;
    }
    previewRequestRef.current?.controller.abort();
    const sequence = (previewRequestRef.current?.sequence ?? 0) + 1;
    const controller = new AbortController();
    previewRequestRef.current = { sequence, controller };

    setActiveMinute(minute);
    setPanelMode("preview");
    setIsPreviewLoading(true);
    setPdfError("");

    if (previewPdfUrlRef.current) {
      URL.revokeObjectURL(previewPdfUrlRef.current);
      previewPdfUrlRef.current = null;
    }
    setPreviewPdfUrl(null);

    try {
      const blob = await preparePdfPreview(minute.id, controller.signal);
      if (
        controller.signal.aborted ||
        previewRequestRef.current?.sequence !== sequence
      ) {
        return;
      }
      const url = URL.createObjectURL(blob);
      previewPdfUrlRef.current = url;
      setPreviewPdfUrl(url);
    } catch (error) {
      if (
        !isAbortError(error) &&
        previewRequestRef.current?.sequence === sequence
      ) {
        setPdfError(getErrorMessage(error, `No se pudo cargar la vista previa del acta ${safeText(minute.numeroActa)}.`));
      }
    } finally {
      if (previewRequestRef.current?.sequence === sequence) {
        setIsPreviewLoading(false);
      }
    }
  };

  const openEditPanel = (minute: Minute, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir el preview accidentalmente
    if (!canEdit) return;
    clearPreviewResources();
    setActiveMinute(minute);
    setPanelMode("edit");
    
    const currentStatus = (minute.status || "").trim();
    const currentStatusItem = catalogs.statuses.find(
      (status) =>
        status.descripcion.trim().toLowerCase() === currentStatus.toLowerCase()
    );
    const currentFolderItem = findFolderOption(folderOptions, minute.folder);

    const nextEditForm = {
      statusId: String(currentStatusItem?.id ?? catalogs.statuses[0]?.id ?? ""),
      folderId: currentFolderItem ? String(currentFolderItem.id) : "",
    };
    setEditForm(nextEditForm);
    setInitialEditForm(nextEditForm);
    setSaveFeedback("");
  };

  const handleSaveEdit = async () => {
    if (!activeMinute) return;
    const statusChanged = editForm.statusId !== initialEditForm.statusId;
    const folderChanged = editForm.folderId !== initialEditForm.folderId;
    const folderId = Number(editForm.folderId);
    if (!statusChanged && !folderChanged) return;
    if (folderChanged && (!Number.isInteger(folderId) || folderId < 1)) return;

    setIsSavingEdit(true);
    setPdfError("");
    setSaveFeedback("");
    try {
      await updateMinute({
        publicId: activeMinute.id,
        ...(statusChanged ? { statusId: Number(editForm.statusId) } : {}),
        ...(folderChanged ? { folderId } : {}),
      });

      const statusLabel = catalogLabel(catalogs.statuses, editForm.statusId);
      const folderLabel = folderOptions.find(
        (folder) => String(folder.id) === editForm.folderId
      )?.description;
      setMinutes((previous) =>
        previous.map((minute) =>
          minute.id === activeMinute.id
            ? {
                ...minute,
                ...(statusChanged ? { status: statusLabel } : {}),
                ...(folderChanged ? { folder: folderLabel || `N° ${folderId}` } : {}),
              }
            : minute
        )
      );
      setActiveMinute((current) =>
        current
          ? {
              ...current,
              ...(statusChanged ? { status: statusLabel } : {}),
              ...(folderChanged ? { folder: folderLabel || `N° ${folderId}` } : {}),
            }
          : current
      );
      setInitialEditForm(editForm);
      setSaveFeedback("Cambios guardados correctamente.");
      setReloadKey((value) => value + 1);
    } catch (error) {
      setPdfError(
        getErrorMessage(error, "No se pudo guardar el estado del acta.")
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const totalPages = Math.max(pagination.totalPages, 1);
  const firstItem = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);
  const parsedFolderId = Number(editForm.folderId);
  const statusChanged = editForm.statusId !== initialEditForm.statusId;
  const folderChanged = editForm.folderId !== initialEditForm.folderId;
  const changedFolderIsValid = Boolean(
    !folderChanged || (Number.isInteger(parsedFolderId) && parsedFolderId > 0)
  );
  const canSaveChanges = Boolean(
    editForm.statusId &&
      (statusChanged || folderChanged) &&
      changedFolderIsValid
  );

  return (
    <div className="w-full space-y-8 animate-fade-in-up font-sans text-[var(--ds-text)]">
      
      {/* Input oculto para subida de PDF */}
      {canUpload && (
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      )}

      {/* HEADER */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-fade-in-up">
        <div>
          <span className="block text-[11px] font-black uppercase tracking-[0.20em] text-verde-bap-dark mb-2">
            Módulo BAP
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gris-bap-dark">
            Gestión de Actas
          </h1>
          <p className="mt-3 text-base font-medium text-gris-bap">
            Consulta actas reales, edita sus estados, sube correcciones PDF y visualiza el consolidado.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-72 group">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ds-muted)] transition-all duration-300 group-focus-within:text-[var(--ds-green-dark)] group-focus-within:scale-110" />
            <div className="ds-field p-0 pl-1">
               <input
                 type="search"
                 value={filters.acta}
                 onChange={(event) => updateFilter("acta", event.target.value)}
                 placeholder="N° o nombre de acta..."
                 className="pl-9 w-full !border-0 focus:!ring-0 bg-transparent h-full"
               />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            disabled={isLoading || isFiltersLoading}
            className="ds-btn ds-btn-secondary group flex-shrink-0"
          >
            <RefreshCw
              className={clsx(
                `h-4 w-4 transition-transform duration-600 ease-bounce-in`,
                isLoading || isFiltersLoading ? "animate-spin" : "group-hover:rotate-180"
              )}
            />
            Actualizar
          </button>
        </div>
      </header>

      {/* ERRORES */}
      {(errorMessage || pdfError) && (
        <div className="animate-fade-in-down rounded-2xl bg-[var(--ds-red-soft)] border border-[var(--ds-red)] p-4 shadow-soft">
          <div className="flex items-start gap-3 text-sm text-[var(--ds-red)]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1 font-bold">
              <p>{pdfError || errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => { setErrorMessage(""); setPdfError(""); }}
              className="ds-btn ds-btn-ghost !p-2 !min-h-[28px] !h-7"
              aria-label="Cerrar mensaje"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="ds-toolbar flex flex-col gap-5 w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ds-line)] pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-[var(--ds-text-strong)]">
              Filtros Avanzados
            </h3>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            className="ds-btn ds-btn-ghost"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        </div>

        <div>
          {filtersError && (
            <p className="mb-5 rounded-xl border border-[var(--ds-yellow)] bg-[var(--ds-yellow-soft)] px-4 py-3 text-xs font-medium text-[#8A6710]">
              {filtersError} El listado todavía puede consultarse sin seleccionar catálogos.
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <div className="flex flex-col gap-1.5 xl:col-span-2">
              <label className="text-[11px] font-bold text-[var(--ds-text-strong)] uppercase tracking-wide">Organización</label>
              <div className="ds-field">
                 <input
                   type="text"
                   placeholder="Nombre de organización..."
                   value={filters.organization}
                   onChange={(event) => updateFilter("organization", event.target.value)}
                 />
              </div>
            </div>

            <CatalogSelect label="Canal" value={filters.channelId} values={catalogs.channels} disabled={isFiltersLoading} onChange={(v) => updateFilter("channelId", v)} />
            <CatalogSelect label="Mes" value={filters.month} values={catalogs.months} disabled={isFiltersLoading} onChange={(v) => updateFilter("month", v)} />
            <CatalogSelect label="Año" value={filters.year} values={catalogs.years} disabled={isFiltersLoading} onChange={(v) => updateFilter("year", v)} />
            <CatalogSelect label="Estado SAP" value={filters.sapStatusId} values={catalogs.sapStatuses} disabled={isFiltersLoading} onChange={(v) => updateFilter("sapStatusId", v)} />
            <CatalogSelect label="Estado del acta" value={filters.statusId} values={catalogs.statuses} disabled={isFiltersLoading} onChange={(v) => updateFilter("statusId", v)} />

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--ds-text-strong)] uppercase tracking-wide">Carpeta (ID)</label>
              <div className="ds-field">
                 <input
                   type="number"
                   min="0"
                   inputMode="numeric"
                   placeholder="Ej. 12"
                   value={filters.folderId}
                   onChange={(event) => updateFilter("folderId", event.target.value)}
                 />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--ds-line)] pt-5 text-xs font-semibold text-[var(--ds-muted)]"
              >
                <Filter className="h-4 w-4 text-[var(--ds-green-dark)] mr-1" />
                Filtros activos:
                {filters.acta && <Chip onClear={() => updateFilter("acta", "")}>Acta: {filters.acta}</Chip>}
                {filters.organization && <Chip onClear={() => updateFilter("organization", "")}>Org: {filters.organization}</Chip>}
                {filters.channelId && <Chip onClear={() => updateFilter("channelId", "")}>Canal: {catalogLabel(catalogs.channels, filters.channelId)}</Chip>}
                {filters.month && <Chip onClear={() => updateFilter("month", "")}>Mes: {catalogLabel(catalogs.months, filters.month)}</Chip>}
                {filters.year && <Chip onClear={() => updateFilter("year", "")}>Año: {catalogLabel(catalogs.years, filters.year)}</Chip>}
                {filters.sapStatusId && <Chip onClear={() => updateFilter("sapStatusId", "")}>SAP: {catalogLabel(catalogs.sapStatuses, filters.sapStatusId)}</Chip>}
                {filters.statusId && <Chip onClear={() => updateFilter("statusId", "")}>Estado: {catalogLabel(catalogs.statuses, filters.statusId)}</Chip>}
                {filters.folderId && <Chip onClear={() => updateFilter("folderId", "")}>Carpeta: {filters.folderId}</Chip>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* DISPOSICIÓN PRINCIPAL: TABLA + PANEL LATERAL */}
      <div className="flex flex-col xl:flex-row items-start gap-6 w-full pb-10">
        
        {/* COLUMNA TABLA */}
        <div className={clsx(
          "transition-all duration-500 ease-in-out flex-1 w-full ds-table-card",
          activeMinute ? "xl:w-[calc(100%-650px)]" : "w-full"
        )}>
          {/* HEADER TABLA */}
          <div className="flex flex-col gap-4 border-b border-[var(--ds-line)] px-6 py-5 lg:flex-row lg:items-center lg:justify-between bg-white">
            <div>
              <h3 className="mt-1 text-xl font-extrabold text-[var(--ds-text-strong)]">
                Tabla administrativa
              </h3>
              <p className="mt-1 text-xs text-[var(--ds-muted)] font-medium" aria-live="polite">
                {isLoading
                  ? "Sincronizando información..."
                  : `Mostrando ${firstItem}-${lastItem} de ${pagination.totalItems} registros`}
                {selected.size > 0 && (
                  <span className="ml-2 text-[var(--ds-green-dark)] font-bold">
                    · {selected.size} seleccionada(s)
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {canDownload && selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => void downloadSelected()}
                  disabled={isBulkDownloading}
                  className="ds-btn ds-btn-primary"
                >
                  {isBulkDownloading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Descargar seleccionadas (1 PDF)
                </button>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--ds-muted)]">Mostrar:</span>
                <div className="ds-field !min-h-[32px] !h-8 !px-2">
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    className="font-bold text-xs cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
              <span className="ds-badge ds-badge-green font-black">
                {pagination.totalItems} REGISTROS
              </span>
            </div>
          </div>

          {/* TABLA HORIZONTAL (SCROLL PLANO VERDE) */}
          <div className={`w-full overflow-x-auto ${flatScrollbarStyles}`}>
            <table className="ds-table min-w-[1900px] relative">
              <thead>
                <tr>
                  <th className="w-14">
                    {canDownload && (
                      <WhiteCheckCheckbox
                        checked={allCurrentPageSelected}
                        indeterminate={someCurrentPageSelected}
                        onChange={toggleAll}
                        disabled={isLoading || minutes.length === 0}
                        ariaLabel="Seleccionar todas las actas de esta página"
                      />
                    )}
                  </th>
                  <th>Canal</th>
                  <th>Fecha</th>
                  <th>Mes</th>
                  <th>N° de acta</th>
                  <th>Acta consolidada</th>
                  <th>Estado SAP</th>
                  <th>Cód. organización</th>
                  <th>Organización</th>
                  <th>Cód. acopio</th>
                  <th>Centro de acopio</th>
                  <th>Estado</th>
                  <th>Carpeta</th>
                  <th className="sticky right-0 bg-[var(--ds-bg)] border-l border-[var(--ds-line)] z-10 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {isLoading && (
                  <tr>
                    <td colSpan={14} className="px-6 py-20 text-center text-sm font-semibold text-[var(--ds-muted)]">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="h-7 w-7 animate-spin text-[var(--ds-green-dark)]" />
                        Cargando registros...
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && minutes.length === 0 && (
                  <tr>
                    <td colSpan={14} className="px-6 py-20 text-center text-sm font-medium text-[var(--ds-muted)]">
                      {errorMessage || "No se encontraron actas con los filtros aplicados."}
                    </td>
                  </tr>
                )}

                {!isLoading && minutes.map((minute, index) => (
                  <motion.tr
                    key={minute.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.02, ease: "easeOut" }}
                    onClick={() => handleRowClick(minute)}
                    className={clsx(
                      "cursor-pointer group",
                      selected.has(minute.id) && "selected",
                      activeMinute?.id === minute.id && "bg-[var(--ds-green-soft)] border-l-4 border-l-[var(--ds-green-dark)]"
                    )}
                  >
                    <td>
                      {canDownload && (
                        <WhiteCheckCheckbox
                          checked={selected.has(minute.id)}
                          onChange={() => toggleOne(minute)}
                          ariaLabel={`Seleccionar acta ${safeText(minute.numeroActa)}`}
                        />
                      )}
                    </td>
                    <td className="font-semibold text-[var(--ds-text-strong)]">
                      {safeText(minute.canal)}
                    </td>
                    <td className="text-[var(--ds-muted)]">
                      {formatFecha(minute.fecha)}
                    </td>
                    <td className="font-medium text-[var(--ds-muted)]">
                      {safeText(minute.mes)}
                    </td>
                    <td className="font-bold text-[var(--ds-text-strong)] group-hover:text-[var(--ds-green-dark)] transition-colors">
                      {safeText(minute.numeroActa)}
                    </td>
                    <td className="font-medium text-[var(--ds-muted)]">
                      {safeText(minute.numeroActaConsolidado)}
                    </td>
                    <td>
                      {statusSapBadge(minute.statusSAP)}
                    </td>
                    <td className="font-medium text-[var(--ds-muted)]">
                      {safeText(minute.codOrg)}
                    </td>
                    <td className="min-w-[280px] font-semibold text-[var(--ds-text-strong)]">
                      {safeText(minute.nameOrg)}
                    </td>
                    <td className="font-medium text-[var(--ds-muted)]">
                      {safeText(minute.codAcopio)}
                    </td>
                    <td className="min-w-[250px] font-medium text-[var(--ds-muted)]">
                      {safeText(minute.nameACopio)}
                    </td>
                    <td>
                      {statusActaBadge(minute.status)}
                    </td>
                    <td className="font-medium text-[var(--ds-muted)]">
                      {folderDisplayLabel(folderOptions, minute.folder)}
                    </td>
                    <td 
                      className="text-right sticky right-0 bg-white group-hover:bg-[#f6fcf8] transition-colors border-l border-[var(--ds-line)] z-10"
                      onClick={(e) => e.stopPropagation()} 
                    >
                      <div className="flex items-center justify-end gap-1">
                        
                        {canUpload && (
                          <ActionButton
                            title="Subir PDF Nuevo"
                            disabled={uploadingId === minute.id}
                            onClick={(e) => triggerUpload(minute, e)}
                          >
                            {uploadingId === minute.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-[var(--ds-green-dark)]" />
                            ) : (
                              <UploadCloud className="h-4 w-4" />
                            )}
                          </ActionButton>
                        )}

                        {canDownload && (
                          <ActionButton
                            title="Descargar PDF"
                            disabled={downloadingIds.has(minute.id)}
                            onClick={(e) => downloadPdf(minute, e)}
                          >
                            {downloadingIds.has(minute.id) ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </ActionButton>
                        )}

                        {canEdit && (
                          <ActionButton
                            title="Editar Registro"
                            onClick={(e) => openEditPanel(minute, e)}
                          >
                            <PenLine className="h-4 w-4" />
                          </ActionButton>
                        )}

                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER PAGINACIÓN */}
          <div className="flex flex-col gap-4 border-t border-[var(--ds-line)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between bg-white">
            <p className="text-xs font-bold text-[var(--ds-muted)]">
              Página {pagination.page || page} de {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <PaginationButton title="Primera página" disabled={isLoading || !pagination.hasPreviousPage} onClick={() => setPage(1)}>
                <ChevronsLeft className="h-4 w-4" />
              </PaginationButton>
              <PaginationButton title="Página anterior" disabled={isLoading || !pagination.hasPreviousPage} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </PaginationButton>
              
              <div className="mx-2 px-4 py-1.5 rounded-lg bg-[var(--ds-bg)] text-xs font-black text-[var(--ds-green-dark)] shadow-inner">
                {pagination.page || page} / {totalPages}
              </div>

              <PaginationButton title="Página siguiente" disabled={isLoading || !pagination.hasNextPage} onClick={() => setPage((value) => value + 1)}>
                <ChevronRight className="h-4 w-4" />
              </PaginationButton>
              <PaginationButton title="Última página" disabled={isLoading || !pagination.hasNextPage} onClick={() => setPage(totalPages)}>
                <ChevronsRight className="h-4 w-4" />
              </PaginationButton>
            </div>
          </div>
        </div>

        {/* COLUMNA PANEL LATERAL (COMPARTIDO: PREVIEW / EDIT) */}
        <AnimatePresence>
          {activeMinute && (
            <motion.div
              initial={{ opacity: 0, width: 0, x: 20 }}
              animate={{ opacity: 1, width: 650, x: 0 }}
              exit={{ opacity: 0, width: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="shrink-0 xl:sticky xl:top-6 w-full xl:w-[650px]"
            >
              <div className={`overflow-hidden rounded-2xl border border-[var(--ds-line)] bg-white shadow-strong h-[calc(100vh-100px)] min-h-[600px] flex flex-col ${flatScrollbarStyles}`}>
                
                {/* Header Panel */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ds-line)] bg-[var(--ds-bg)]">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={clsx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      panelMode === "edit" ? "bg-[var(--ds-blue-soft)] text-[var(--ds-blue)]" : "bg-[var(--ds-green-soft)] text-[var(--ds-green-dark)]"
                    )}>
                      {panelMode === "edit" ? <PenLine className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-sm font-extrabold text-[var(--ds-text-strong)] truncate">
                        {panelMode === "edit" ? "Editando Acta" : activeMinute.numeroActa}
                      </strong>
                      <span className="block text-[10px] text-[var(--ds-muted)] font-semibold uppercase tracking-wider truncate">
                        {panelMode === "edit" ? activeMinute.numeroActa : activeMinute.nameOrg}
                      </span>
                    </div>
                  </div>
                  <button onClick={closeSidePanel} className="ds-btn ds-btn-ghost !p-2" aria-label="Cerrar panel">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body Panel (Condicional) */}
                <div className="flex-1 relative bg-[var(--ds-bg)] overflow-y-auto">
                  
                  {/* MODO PREVIEW PDF */}
                  {panelMode === "preview" && (
                    <>
                      {isPreviewLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                          <RefreshCw className="h-8 w-8 animate-spin text-[var(--ds-green-dark)]" />
                          <span className="text-sm font-semibold text-[var(--ds-muted)]">Cargando documento...</span>
                        </div>
                      ) : previewPdfUrl ? (
                        <iframe
                          src={previewPdfUrl}
                          className="w-full h-full border-0"
                          title={`Preview ${activeMinute.numeroActa}`}
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[var(--ds-muted)]">
                          <AlertCircle className="h-10 w-10 mb-3 text-[var(--ds-red)] opacity-50" />
                          <p className="text-sm">No se pudo mostrar la vista previa del documento.</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* MODO EDICIÓN */}
                  {panelMode === "edit" && (
                    <div className="p-8 space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-[var(--ds-line)] shadow-sm space-y-6">
                        
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-[var(--ds-text-strong)] uppercase tracking-wide">Estado del Acta</label>
                          <div className="ds-field cursor-pointer">
                            <select
                              value={editForm.statusId}
                              onChange={(e) => setEditForm({ ...editForm, statusId: e.target.value })}
                              className="cursor-pointer font-semibold text-sm"
                            >
                              <option value="" disabled>Seleccione un estado</option>
                              {catalogs.statuses.map((est) => (
                                <option key={String(est.id)} value={String(est.id)}>{est.descripcion}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-[var(--ds-text-strong)] uppercase tracking-wide">Carpeta Asignada</label>
                          <div className={clsx("ds-field", isFoldersLoading && "opacity-60 cursor-wait")}>
                            <select
                              value={editForm.folderId}
                              onChange={(e) => setEditForm({ ...editForm, folderId: e.target.value })}
                              disabled={isFoldersLoading}
                              className="cursor-pointer font-semibold text-sm"
                            >
                              <option value="" disabled>
                                {isFoldersLoading ? "Cargando carpetas..." : "Seleccione una carpeta"}
                              </option>
                              {folderOptions.map((folder) => (
                                <option key={`${String(folder.id)}-${folder.publicId}`} value={String(folder.id)}>
                                  {folder.description}
                                </option>
                              ))}
                            </select>
                          </div>
                          {foldersError ? (
                            <span className="mt-1 text-[11px] font-semibold text-[var(--ds-red)]">{foldersError}</span>
                          ) : (
                            <span className="mt-1 text-[11px] font-medium text-[var(--ds-muted)]">
                              Solo se muestran las carpetas creadas desde Administración.
                            </span>
                          )}
                        </div>

                      </div>

                      {saveFeedback && (
                        <p
                          className="rounded-xl border border-[var(--ds-green)] bg-[var(--ds-green-soft)] px-4 py-3 text-sm font-bold text-[var(--ds-green-dark)]"
                          role="status"
                        >
                          {saveFeedback}
                        </p>
                      )}

                      <div className="flex justify-end gap-3 pt-4">
                        <button className="ds-btn ds-btn-secondary" onClick={closeSidePanel}>
                          Cerrar
                        </button>
                        <button
                          type="button"
                          className="ds-btn ds-btn-primary"
                          onClick={() => void handleSaveEdit()}
                          disabled={!canSaveChanges || isSavingEdit}
                        >
                          {isSavingEdit ? "Guardando..." : "Guardar cambios"}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

// ============================================================
// COMPONENTES DE APOYO INTERNOS
// ============================================================

function CatalogSelect({
  label,
  value,
  values,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  values: CatalogValue[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-[var(--ds-text-strong)] uppercase tracking-wide">{label}</label>
      <div className={clsx("ds-field", disabled && "opacity-60 bg-[var(--ds-bg)] cursor-wait")}>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">Todos</option>
          {values.map((item, index) => (
            <option key={`${String(item.id)}-${item.descripcion}-${index}`} value={String(item.id)}>
              {item.descripcion}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function catalogLabel(values: CatalogValue[], id: string): string {
  return values.find((item) => String(item.id) === id)?.descripcion ?? id;
}

function findFolderOption(
  folders: FolderOption[],
  value: string | number | null | undefined
): FolderOption | undefined {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return undefined;

  const exactMatch = folders.find((folder) =>
    [folder.id, folder.publicId, folder.code, folder.name, folder.description]
      .map((candidate) => String(candidate).trim().toLowerCase())
      .includes(normalized)
  );
  if (exactMatch) return exactMatch;

  const numericMatch = /^(?:carpeta\s*|n[°ºo]?\s*)?(\d+)$/i.exec(normalized);
  if (!numericMatch) return undefined;
  return folders.find((folder) => String(folder.id) === numericMatch[1]);
}

function folderDisplayLabel(
  folders: FolderOption[],
  value: string | number | null | undefined
): string {
  return findFolderOption(folders, value)?.description ?? safeText(String(value ?? ""));
}

function ActionButton({
  children,
  title,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="ds-btn ds-btn-ghost !px-2 !min-h-[32px] !h-8"
    >
      {children}
    </button>
  );
}

function PaginationButton({
  children,
  title,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="ds-btn ds-btn-secondary !px-2.5 !min-h-[32px] !h-8"
    >
      {children}
    </button>
  );
}

function Chip({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ds-green-soft)] border border-[#c7e6d3] px-3 py-1 font-bold text-[var(--ds-green-dark)] shadow-soft transition-all duration-300 hover:scale-105">
      {children}
      <button
        type="button"
        onClick={onClear}
        className="flex items-center justify-center rounded-full p-0.5 transition-all duration-300 hover:bg-[var(--ds-green)] hover:text-white"
        aria-label="Quitar filtro"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
