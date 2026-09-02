import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "../../assets/logo.png";
import { useAuth, type Permission } from "../../auth/AuthContext";
import clsx from "clsx";

type NavItem = {
  to: string;
  label: string;
  description: string;
  permission?: Permission;
};

const navItems: NavItem[] = [
  {
    to: "/gestion-actas",
    label: "Gestion de Actas",
    description: "Consulta y filtra las actas registradas",
    permission: "ver",
  },
  {
    to: "/administracion",
    label: "Administracion",
    description: "Registra usuarios y verifica la conexión SAP",
    permission: "administrar",
  },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const visibleNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "??";

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--ds-bg)]">
      {/* ======================================================
          NAVBAR SUPERIOR
      ====================================================== */}
      <header className="sticky top-0 z-50 w-full border-b border-[#DCEBE3] bg-white/90 py-4 md:py-3 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex w-full max-w-[1900px] items-center justify-between px-4 md:px-8">
          {/* LOGO */}
          <div className="flex items-center gap-4">
            <img src={logo} alt="BAP" className="h-10 md:h-12 w-auto object-contain drop-shadow-sm" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight text-[var(--ds-text-strong)]">
                Banco de Alimentos Peru
              </p>
              <p className="text-[11px] leading-tight text-[var(--ds-muted)]">
                Sistema de Actas
              </p>
            </div>
          </div>

          {/* NAVEGACIÓN */}
          <nav className="hidden flex-1 items-center justify-center md:flex">
            <div
              className="
                flex items-center gap-1
                rounded-full
                border border-[var(--ds-line)]
                bg-[var(--ds-green-soft)]
                p-1
                shadow-soft
              "
            >
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      `
                        relative rounded-full
                        px-4 py-1.5
                        text-sm font-medium
                        transition-colors duration-300
                      `,
                      isActive
                        ? "text-[var(--ds-green-dark)]"
                        : "text-[var(--ds-muted)] hover:text-[var(--ds-text-strong)]"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="navbar-pill"
                          className="
                            absolute inset-0
                            rounded-full
                            bg-white
                            shadow-soft
                          "
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                          }}
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* USUARIO */}
          <div className="flex items-center gap-2">
            <div
              className="
                hidden items-center gap-3
                rounded-full
                border border-[var(--ds-line)]
                bg-white
                py-1 pl-1 pr-3
                shadow-soft
                md:flex
              "
            >
              <div
                className="
                  flex h-8 w-8 items-center justify-center
                  rounded-full
                  bg-[var(--ds-green-soft)]
                  text-xs font-semibold
                  text-[var(--ds-green-dark)]
                "
              >
                {initials}
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-semibold text-[var(--ds-text-strong)]">
                  {user?.fullName ?? "Sin sesion"}
                </p>
                <p className="text-[11px] text-[var(--ds-muted)]">
                  {user?.role ?? "Invitado"}
                </p>
              </div>
            </div>

            {/* LOGOUT */}
            <button
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              title="Cerrar sesion"
              className="
                group hidden
                rounded-full p-2
                text-[var(--ds-muted)]
                transition-all duration-300
                hover:bg-[var(--ds-red-soft)]
                hover:text-rojo-bap-dark
                hover:shadow-soft
                active:scale-95
                disabled:cursor-not-allowed
                disabled:opacity-50
                md:inline-flex
              "
            >
              <LogOut
                className="
                  h-4 w-4
                  transition-transform duration-400 ease-bounce-in
                  group-hover:translate-x-0.5
                "
              />
            </button>

            {/* MENU MOBILE */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="
                rounded-md p-2
                text-[var(--ds-muted)]
                transition-all duration-300
                hover:bg-[var(--ds-green-soft)]
                hover:text-[var(--ds-green-dark)]
                md:hidden
              "
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE OVERLAY */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="
                overflow-hidden
                border-t border-[var(--ds-line)]
                bg-white/95
                backdrop-blur-xl
                md:hidden
              "
            >
              <nav className="mx-auto flex max-w-[1900px] flex-col gap-1 px-4 py-3">
                {visibleNavItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={clsx(
                        `
                          flex flex-col
                          rounded-xl
                          px-3 py-2.5
                          text-sm
                          transition-all duration-300
                        `,
                        isActive
                          ? "bg-[var(--ds-green-soft)] text-[var(--ds-green-dark)] shadow-soft"
                          : "text-[var(--ds-muted)] hover:bg-[var(--ds-bg)]"
                      )}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs opacity-70">
                        {item.description}
                      </span>
                    </NavLink>
                  );
                })}

                <div
                  className="
                    mt-2 flex items-center justify-between
                    rounded-xl
                    border border-[var(--ds-line)]
                    bg-[var(--ds-bg)]
                    px-3 py-2
                  "
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex h-9 w-9 items-center justify-center
                        rounded-full
                        bg-[var(--ds-green-soft)]
                        text-sm font-semibold
                        text-[var(--ds-green-dark)]
                      "
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ds-text-strong)]">
                        {user?.fullName ?? "Sin sesion"}
                      </p>
                      <p className="text-xs text-[var(--ds-muted)]">
                        {user?.role ?? "Invitado"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => void handleLogout()}
                    disabled={isLoggingOut}
                    className="
                      rounded-md p-1.5
                      text-[var(--ds-muted)]
                      transition-all duration-300
                      hover:bg-[var(--ds-red-soft)]
                      hover:text-rojo-bap-dark
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ======================================================
          CONTENIDO
      ====================================================== */}
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          ease: "easeOut",
        }}
        className="
          mx-auto w-full max-w-[1900px] flex-1
          px-4 py-6
          md:px-8 md:py-8
        "
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
