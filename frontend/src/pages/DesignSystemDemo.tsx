import { useState } from "react";

/* ============================================================
   PEQUEÑOS COMPONENTES DE APOYO
   No agregan estilos nuevos.
   Solamente agrupan clases de Tailwind / index.css existentes.
============================================================ */

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-verde-bap-dark">
        {eyebrow}
      </span>

      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gris-bap-dark">
        {title}
      </h2>

      {description && (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gris-bap">
          {description}
        </p>
      )}
    </div>
  );
}

function ClassName({ children }: { children: React.ReactNode }) {
  return (
    <code className="mt-3 block w-fit rounded-lg border border-[#DCEBE3] bg-verde-bap-extralight px-2.5 py-1.5 text-[10px] font-semibold text-verde-bap-dark">
      {children}
    </code>
  );
}

function IconBox({
  children,
  color = "green",
}: {
  children: React.ReactNode;
  color?: "green" | "blue" | "orange" | "red" | "yellow";
}) {
  const variants = {
    green:
      "bg-verde-bap-light text-verde-bap-dark group-hover:bg-verde-bap group-hover:text-white",
    blue:
      "bg-azul-bap-light text-azul-bap-dark group-hover:bg-azul-bap group-hover:text-white",
    orange:
      "bg-naranja-bap-light text-naranja-bap-dark group-hover:bg-naranja-bap group-hover:text-white",
    red:
      "bg-rojo-bap-light text-rojo-bap-dark group-hover:bg-rojo-bap group-hover:text-white",
    yellow:
      "bg-amarillo-bap-light text-[#9A7310] group-hover:bg-amarillo-bap group-hover:text-gris-bap-dark",
  };

  return (
    <span
      className={`
        flex h-14 w-14 shrink-0 items-center justify-center
        rounded-2xl text-xl font-black
        transition-all duration-400 ease-smooth
        group-hover:scale-110
        group-hover:-rotate-3
        ${variants[color]}
      `}
    >
      <span className="transition-transform duration-400 ease-bounce-in group-hover:scale-125 group-hover:rotate-6">
        {children}
      </span>
    </span>
  );
}

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
    gray: "bg-gris-bap-light text-gris-bap",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full
        px-3 py-1.5 text-[10px] font-black uppercase tracking-wide
        ${styles[variant]}
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/* ============================================================
   DEMO
============================================================ */

export default function DesignSystemDemo() {
  const [activeTab, setActiveTab] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [switchActive, setSwitchActive] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);

  const replayAnimations = () => {
    setAnimationKey((current) => current + 1);
  };

  const launchToast = () => {
    setShowToast(true);

    window.setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-verde-bap-extralight font-sans text-gris-bap-dark">
      {/* ========================================================
          HERO PRINCIPAL
      ======================================================== */}

      <header className="relative overflow-hidden border-b border-[#DCEBE3] bg-white">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-verde-bap/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-azul-bap/10 blur-3xl" />
        <div className="absolute bottom-[-100px] left-1/2 h-56 w-56 rounded-full bg-amarillo-bap/20 blur-3xl" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-verde-bap/30 bg-verde-bap-light px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-verde-bap-dark">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-verde-bap-dark" />
              Sistema de Actas
            </span>

            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] text-gris-bap-dark md:text-6xl">
              Laboratorio visual{" "}
              <span className="text-verde-bap-dark">BAP</span>
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-gris-bap md:text-base">
              Catálogo generado exclusivamente con las clases existentes
              actualmente en tu index.css y las extensiones configuradas en
              tailwind.config.js.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#cards" className="btn-primary">
                Ver cards
                <span>↓</span>
              </a>

              <a href="#animations" className="btn-secondary">
                Ver animaciones
              </a>

              <button className="btn-ghost" onClick={replayAnimations}>
                ↻ Repetir animaciones
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          NAV
      ======================================================== */}

      <div className="sticky top-0 z-40 border-b border-[#DCEBE3] bg-white/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-6 py-3 lg:px-10">
          {[
            ["#colors", "Colores"],
            ["#gradients", "Gradientes"],
            ["#buttons", "Botones"],
            ["#cards", "Cards"],
            ["#shadows", "Sombras"],
            ["#animations", "Animaciones"],
            ["#glass", "Glass"],
            ["#forms", "Campos"],
            ["#badges", "Estados"],
            ["#table", "Tabla"],
            ["#feedback", "Modal"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="
                whitespace-nowrap rounded-lg px-3 py-2
                text-xs font-bold text-gris-bap
                transition-all duration-300
                hover:bg-verde-bap-light
                hover:text-verde-bap-dark
              "
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <main className="mx-auto max-w-[1500px] space-y-16 px-6 py-10 lg:px-10 lg:py-14">
        {/* ======================================================
            PALETA BAP
        ====================================================== */}

        <section id="colors" className="scroll-mt-24">
          <SectionTitle
            eyebrow="01 · Tailwind Config"
            title="Paleta de colores BAP"
            description="Todos estos colores provienen directamente de theme.extend.colors de tu tailwind.config.js."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* VERDE */}

            <article className="group overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white shadow-soft transition-all duration-400 hover:-translate-y-1 hover:shadow-medium">
              <div className="h-28 bg-verde-bap transition-transform duration-400 group-hover:scale-105" />

              <div className="p-4">
                <strong className="text-sm">Verde BAP</strong>
                <span className="mt-1 block text-xs text-gris-bap">
                  #73C59C
                </span>

                <div className="mt-3 flex gap-1">
                  <div className="h-5 flex-1 rounded bg-verde-bap-dark" />
                  <div className="h-5 flex-1 rounded bg-verde-bap" />
                  <div className="h-5 flex-1 rounded bg-verde-bap-light" />
                  <div className="h-5 flex-1 rounded bg-verde-bap-extralight" />
                </div>
              </div>
            </article>

            {/* AMARILLO */}

            <article className="group overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white shadow-soft transition-all duration-400 hover:-translate-y-1 hover:shadow-medium">
              <div className="h-28 bg-amarillo-bap transition-transform duration-400 group-hover:scale-105" />

              <div className="p-4">
                <strong className="text-sm">Amarillo BAP</strong>
                <span className="mt-1 block text-xs text-gris-bap">
                  #FFDF69
                </span>

                <div className="mt-3 flex gap-1">
                  <div className="h-5 flex-1 rounded bg-amarillo-bap-dark" />
                  <div className="h-5 flex-1 rounded bg-amarillo-bap" />
                  <div className="h-5 flex-1 rounded bg-amarillo-bap-light" />
                </div>
              </div>
            </article>

            {/* ROJO */}

            <article className="group overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white shadow-soft transition-all duration-400 hover:-translate-y-1 hover:shadow-medium">
              <div className="h-28 bg-rojo-bap transition-transform duration-400 group-hover:scale-105" />

              <div className="p-4">
                <strong className="text-sm">Rojo BAP</strong>
                <span className="mt-1 block text-xs text-gris-bap">
                  #F0555F
                </span>

                <div className="mt-3 flex gap-1">
                  <div className="h-5 flex-1 rounded bg-rojo-bap-dark" />
                  <div className="h-5 flex-1 rounded bg-rojo-bap" />
                  <div className="h-5 flex-1 rounded bg-rojo-bap-light" />
                </div>
              </div>
            </article>

            {/* NARANJA */}

            <article className="group overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white shadow-soft transition-all duration-400 hover:-translate-y-1 hover:shadow-medium">
              <div className="h-28 bg-naranja-bap transition-transform duration-400 group-hover:scale-105" />

              <div className="p-4">
                <strong className="text-sm">Naranja BAP</strong>
                <span className="mt-1 block text-xs text-gris-bap">
                  #F9A755
                </span>

                <div className="mt-3 flex gap-1">
                  <div className="h-5 flex-1 rounded bg-naranja-bap-dark" />
                  <div className="h-5 flex-1 rounded bg-naranja-bap" />
                  <div className="h-5 flex-1 rounded bg-naranja-bap-light" />
                </div>
              </div>
            </article>

            {/* AZUL */}

            <article className="group overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white shadow-soft transition-all duration-400 hover:-translate-y-1 hover:shadow-medium">
              <div className="h-28 bg-azul-bap transition-transform duration-400 group-hover:scale-105" />

              <div className="p-4">
                <strong className="text-sm">Azul BAP</strong>
                <span className="mt-1 block text-xs text-gris-bap">
                  #0089C6
                </span>

                <div className="mt-3 flex gap-1">
                  <div className="h-5 flex-1 rounded bg-azul-bap-dark" />
                  <div className="h-5 flex-1 rounded bg-azul-bap" />
                  <div className="h-5 flex-1 rounded bg-azul-bap-light" />
                </div>
              </div>
            </article>
          </div>

          {/* GRISES */}

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-gris-bap-dark p-5 text-white shadow-soft">
              <strong className="block text-sm">Gris oscuro</strong>
              <small className="opacity-70">#2B2C2E</small>
            </div>

            <div className="rounded-xl bg-gris-bap p-5 text-white shadow-soft">
              <strong className="block text-sm">Gris BAP</strong>
              <small className="opacity-70">#808284</small>
            </div>

            <div className="rounded-xl border border-[#DCEBE3] bg-gris-bap-light p-5 text-gris-bap-dark shadow-soft">
              <strong className="block text-sm">Gris claro</strong>
              <small className="text-gris-bap">#F0EFEF</small>
            </div>
          </div>
        </section>

        {/* ======================================================
            GRADIENTES
        ====================================================== */}

        <section id="gradients" className="scroll-mt-24">
          <SectionTitle
            eyebrow="02 · Background Images"
            title="Gradientes"
            description="Aquí comprobamos gradient-bap, glass-gradient y shimmer-gradient definidos en Tailwind."
          />

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="group flex min-h-48 flex-col justify-end overflow-hidden rounded-4xl bg-gradient-bap p-6 text-white shadow-medium transition-all duration-400 hover:-translate-y-2 hover:shadow-strong">
              <span className="text-xs font-black uppercase tracking-widest opacity-70">
                bg-gradient-bap
              </span>

              <h3 className="mt-2 text-2xl font-extrabold">
                Gradiente institucional
              </h3>
            </div>

            <div className="relative flex min-h-48 flex-col justify-end overflow-hidden rounded-4xl bg-azul-bap p-6 text-white shadow-medium">
              <div className="absolute inset-0 bg-glass-gradient" />

              <div className="relative">
                <span className="text-xs font-black uppercase tracking-widest opacity-70">
                  bg-glass-gradient
                </span>

                <h3 className="mt-2 text-2xl font-extrabold">
                  Glass Gradient
                </h3>
              </div>
            </div>

            <div className="relative flex min-h-48 flex-col justify-end overflow-hidden rounded-4xl bg-gris-bap-dark p-6 text-white shadow-medium">
              <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />

              <div className="relative">
                <span className="text-xs font-black uppercase tracking-widest opacity-70">
                  animate-shimmer
                </span>

                <h3 className="mt-2 text-2xl font-extrabold">
                  Shimmer continuo
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            BOTONES
        ====================================================== */}

        <section id="buttons" className="scroll-mt-24">
          <SectionTitle
            eyebrow="03 · Index CSS"
            title="Botones globales"
            description="Estos tres primeros botones usan exactamente btn-primary, btn-secondary y btn-ghost de tu index.css."
          />

          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-primary">
                <span>＋</span>
                Acción principal
              </button>

              <button className="btn-secondary">
                <span>✎</span>
                Secundario
              </button>

              <button className="btn-ghost">
                <span>◉</span>
                Ghost
              </button>

              <button className="btn-primary" disabled>
                Deshabilitado
              </button>
            </div>

            <ClassName>
              btn-primary · btn-secondary · btn-ghost
            </ClassName>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <button className="group rounded-xl bg-verde-bap px-5 py-4 text-sm font-bold text-white shadow-soft transition-all duration-400 ease-smooth hover:-translate-y-1 hover:bg-verde-bap-dark hover:shadow-medium active:scale-95">
              Tailwind + duration-400
            </button>

            <button className="group rounded-xl bg-azul-bap px-5 py-4 text-sm font-bold text-white shadow-soft transition-all duration-600 ease-bounce-in hover:-translate-y-2 hover:scale-105 hover:bg-azul-bap-dark hover:shadow-strong active:scale-95">
              ease-bounce-in
            </button>

            <button className="relative overflow-hidden rounded-xl bg-gris-bap-dark px-5 py-4 text-sm font-bold text-white shadow-soft transition-all duration-300 hover:shadow-strong">
              <span className="absolute inset-0 -translate-x-full bg-shimmer-gradient transition-transform duration-1000 hover:translate-x-full" />
              <span className="relative">Shimmer Hover</span>
            </button>
          </div>
        </section>

        {/* ======================================================
            CARDS DE MÉTRICAS
        ====================================================== */}

        <section id="cards" className="scroll-mt-24">
          <SectionTitle
            eyebrow="04 · Cards"
            title="Cards y efectos hover"
            description="Aquí comprobamos card, card-float y también el efecto que buscabas: elevar card, aumentar sombra, ampliar el círculo e incrementar/mover el icono."
          />

          {/* CARD-FLOAT DEL INDEX.CSS */}

          <div className="mb-5">
            <h3 className="mb-3 text-sm font-extrabold text-gris-bap-dark">
              card + card-float de index.css
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="card card-float p-5">
                <span className="text-xs font-black uppercase text-verde-bap-dark">
                  Card float
                </span>

                <h3 className="mt-2 text-lg font-extrabold">
                  Hover original
                </h3>

                <p className="mt-2 text-xs leading-5 text-gris-bap">
                  Esta tarjeta utiliza exactamente las clases globales
                  definidas en index.css.
                </p>

                <ClassName>card card-float</ClassName>
              </article>

              <article className="card card-float p-5">
                <span className="text-xs font-black uppercase text-azul-bap-dark">
                  Card float
                </span>

                <h3 className="mt-2 text-lg font-extrabold">
                  Segunda prueba
                </h3>

                <p className="mt-2 text-xs leading-5 text-gris-bap">
                  Comprueba elevación y cambio de sombra.
                </p>
              </article>

              <article className="card card-float p-5">
                <span className="text-xs font-black uppercase text-naranja-bap-dark">
                  Card float
                </span>

                <h3 className="mt-2 text-lg font-extrabold">
                  Tercera prueba
                </h3>

                <p className="mt-2 text-xs leading-5 text-gris-bap">
                  La transición está declarada directamente en tu CSS.
                </p>
              </article>
            </div>
          </div>

          {/* METRIC CARDS */}

          <h3 className="mb-3 mt-8 text-sm font-extrabold text-gris-bap-dark">
            Metric cards con interacción completa
          </h3>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* GREEN */}

            <article
              className="
                group relative overflow-hidden
                rounded-2xl border border-[#DCEBE3]
                bg-white p-5 shadow-soft
                transition-all duration-400 ease-smooth
                hover:-translate-y-2
                hover:border-verde-bap/60
                hover:shadow-medium
              "
            >
              <div className="absolute -bottom-20 -right-20 h-40 w-40 scale-50 rounded-full bg-verde-bap/10 opacity-0 transition-all duration-600 group-hover:scale-100 group-hover:opacity-100" />

              <div className="relative flex items-center gap-4">
                <IconBox color="green">✓</IconBox>

                <div>
                  <span className="text-xs font-semibold text-gris-bap">
                    Actas procesadas
                  </span>

                  <strong className="mt-1 block text-3xl font-black tracking-tight text-gris-bap-dark">
                    3,216
                  </strong>

                  <small className="text-[10px] font-bold text-verde-bap-dark">
                    +12.4% este mes
                  </small>
                </div>
              </div>
            </article>

            {/* BLUE */}

            <article
              className="
                group relative overflow-hidden
                rounded-2xl border border-[#DCEBE3]
                bg-white p-5 shadow-soft
                transition-all duration-400 ease-smooth
                hover:-translate-y-2
                hover:border-azul-bap/50
                hover:shadow-medium
              "
            >
              <div className="absolute -bottom-20 -right-20 h-40 w-40 scale-50 rounded-full bg-azul-bap/10 opacity-0 transition-all duration-600 group-hover:scale-100 group-hover:opacity-100" />

              <div className="relative flex items-center gap-4">
                <IconBox color="blue">◉</IconBox>

                <div>
                  <span className="text-xs font-semibold text-gris-bap">
                    Actas activas
                  </span>

                  <strong className="mt-1 block text-3xl font-black tracking-tight text-gris-bap-dark">
                    2,984
                  </strong>

                  <small className="text-[10px] font-bold text-azul-bap-dark">
                    Estado ACTIVO
                  </small>
                </div>
              </div>
            </article>

            {/* ORANGE */}

            <article
              className="
                group relative overflow-hidden
                rounded-2xl border border-[#DCEBE3]
                bg-white p-5 shadow-soft
                transition-all duration-400 ease-smooth
                hover:-translate-y-2
                hover:border-naranja-bap/60
                hover:shadow-medium
              "
            >
              <div className="absolute -bottom-20 -right-20 h-40 w-40 scale-50 rounded-full bg-naranja-bap/10 opacity-0 transition-all duration-600 group-hover:scale-100 group-hover:opacity-100" />

              <div className="relative flex items-center gap-4">
                <IconBox color="orange">!</IconBox>

                <div>
                  <span className="text-xs font-semibold text-gris-bap">
                    En revisión
                  </span>

                  <strong className="mt-1 block text-3xl font-black tracking-tight text-gris-bap-dark">
                    148
                  </strong>

                  <small className="text-[10px] font-bold text-naranja-bap-dark">
                    Requieren seguimiento
                  </small>
                </div>
              </div>
            </article>

            {/* RED */}

            <article
              className="
                group relative overflow-hidden
                rounded-2xl border border-[#DCEBE3]
                bg-white p-5 shadow-soft
                transition-all duration-400 ease-smooth
                hover:-translate-y-2
                hover:border-rojo-bap/60
                hover:shadow-medium
              "
            >
              <div className="absolute -bottom-20 -right-20 h-40 w-40 scale-50 rounded-full bg-rojo-bap/10 opacity-0 transition-all duration-600 group-hover:scale-100 group-hover:opacity-100" />

              <div className="relative flex items-center gap-4">
                <IconBox color="red">×</IconBox>

                <div>
                  <span className="text-xs font-semibold text-gris-bap">
                    Con error
                  </span>

                  <strong className="mt-1 block text-3xl font-black tracking-tight text-gris-bap-dark">
                    84
                  </strong>

                  <small className="text-[10px] font-bold text-rojo-bap-dark">
                    Revisión necesaria
                  </small>
                </div>
              </div>
            </article>
          </div>

          <div className="mt-4 rounded-xl border border-verde-bap/30 bg-verde-bap-light/60 px-4 py-3 text-xs leading-5 text-verde-bap-dark">
            <strong>Prueba:</strong> pasa el mouse por las cuatro cards. Debe
            subir la tarjeta, aumentar la sombra, crecer el bloque del icono,
            rotar ligeramente y aparecer el círculo decorativo de fondo.
          </div>
        </section>

        {/* ======================================================
            SOMBRAS
        ====================================================== */}

        <section id="shadows" className="scroll-mt-24">
          <SectionTitle
            eyebrow="05 · Box Shadow"
            title="Sombras configuradas"
            description="Comparación directa de todas las sombras personalizadas declaradas en tailwind.config.js."
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-white p-6 shadow-soft">
              <strong className="text-sm">Soft</strong>
              <ClassName>shadow-soft</ClassName>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-medium">
              <strong className="text-sm">Medium</strong>
              <ClassName>shadow-medium</ClassName>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-strong">
              <strong className="text-sm">Strong</strong>
              <ClassName>shadow-strong</ClassName>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-modal">
              <strong className="text-sm">Modal</strong>
              <ClassName>shadow-modal</ClassName>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-card-modern">
              <strong className="text-sm">Card Modern</strong>
              <ClassName>shadow-card-modern</ClassName>
            </div>
          </div>

          {/* GLOWS */}

          <h3 className="mb-4 mt-8 text-sm font-extrabold">
            Glow shadows
          </h3>

          <div className="grid gap-7 py-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-verde-bap p-6 text-center font-bold text-white shadow-glow-verde">
              Verde
            </div>

            <div className="rounded-2xl bg-amarillo-bap p-6 text-center font-bold text-gris-bap-dark shadow-glow-amarillo">
              Amarillo
            </div>

            <div className="rounded-2xl bg-rojo-bap p-6 text-center font-bold text-white shadow-glow-rojo">
              Rojo
            </div>

            <div className="rounded-2xl bg-azul-bap p-6 text-center font-bold text-white shadow-glow-azul">
              Azul
            </div>
          </div>
        </section>

        {/* ======================================================
            BORDER RADIUS
        ====================================================== */}

        <section>
          <SectionTitle
            eyebrow="06 · Border Radius"
            title="Radios"
            description="Incluye los radios personalizados 4xl y 5xl de Tailwind."
          />

          <div className="grid gap-5 md:grid-cols-3">
            <div className="h-36 rounded-xl bg-verde-bap p-5 font-bold text-white shadow-soft">
              rounded-xl
            </div>

            <div className="h-36 rounded-4xl bg-azul-bap p-5 font-bold text-white shadow-soft">
              rounded-4xl
            </div>

            <div className="h-36 rounded-5xl bg-naranja-bap p-5 font-bold text-white shadow-soft">
              rounded-5xl
            </div>
          </div>
        </section>

        {/* ======================================================
            ANIMACIONES
        ====================================================== */}

        <section id="animations" className="scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              eyebrow="07 · Keyframes"
              title="Animaciones Tailwind"
              description="Las animaciones se renderizan directamente desde theme.extend.animation."
            />

            <button className="btn-secondary mb-6" onClick={replayAnimations}>
              ↻ Repetir entrada
            </button>
          </div>

          <div
            key={animationKey}
            className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
          >
            {/* FADE IN */}

            <div className="card flex min-h-44 flex-col items-center justify-center p-5 text-center animate-fade-in">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verde-bap text-xl font-black text-white">
                A
              </div>

              <strong className="mt-4 text-xs">Fade In</strong>
              <ClassName>animate-fade-in</ClassName>
            </div>

            {/* FADE UP */}

            <div className="card flex min-h-44 flex-col items-center justify-center p-5 text-center animate-fade-in-up">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verde-bap text-xl font-black text-white">
                ↑
              </div>

              <strong className="mt-4 text-xs">Fade In Up</strong>
              <ClassName>animate-fade-in-up</ClassName>
            </div>

            {/* FADE DOWN */}

            <div className="card flex min-h-44 flex-col items-center justify-center p-5 text-center animate-fade-in-down">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amarillo-bap text-xl font-black text-gris-bap-dark">
                ↓
              </div>

              <strong className="mt-4 text-xs">Fade In Down</strong>
              <ClassName>animate-fade-in-down</ClassName>
            </div>

            {/* LEFT */}

            <div className="card flex min-h-44 flex-col items-center justify-center p-5 text-center animate-slide-in-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-azul-bap text-xl font-black text-white">
                →
              </div>

              <strong className="mt-4 text-xs">Slide Left</strong>
              <ClassName>animate-slide-in-left</ClassName>
            </div>

            {/* RIGHT */}

            <div className="card flex min-h-44 flex-col items-center justify-center p-5 text-center animate-slide-in-right">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-azul-bap text-xl font-black text-white">
                ←
              </div>

              <strong className="mt-4 text-xs">Slide Right</strong>
              <ClassName>animate-slide-in-right</ClassName>
            </div>

            {/* SCALE */}

            <div className="card flex min-h-44 flex-col items-center justify-center p-5 text-center animate-scale-in">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-naranja-bap text-xl font-black text-white">
                +
              </div>

              <strong className="mt-4 text-xs">Scale In</strong>
              <ClassName>animate-scale-in</ClassName>
            </div>

            {/* FLOAT */}

            <div className="card flex min-h-44 flex-col items-center justify-center p-5 text-center">
              <div className="flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-verde-bap text-xl font-black text-white shadow-medium">
                ↑
              </div>

              <strong className="mt-4 text-xs">Float</strong>
              <ClassName>animate-float</ClassName>
            </div>

            {/* PULSE */}

            <div className="card flex min-h-44 flex-col items-center justify-center p-5 text-center">
              <div className="flex h-14 w-14 animate-pulse-soft items-center justify-center rounded-full bg-rojo-bap text-xl font-black text-white shadow-glow-rojo">
                ●
              </div>

              <strong className="mt-4 text-xs">Pulse Soft</strong>
              <ClassName>animate-pulse-soft</ClassName>
            </div>

            {/* BOUNCE */}

            <div className="card flex min-h-44 flex-col items-center justify-center p-5 text-center">
              <div className="flex h-14 w-14 animate-bounce-gentle items-center justify-center rounded-2xl bg-amarillo-bap text-xl font-black text-gris-bap-dark">
                ↓
              </div>

              <strong className="mt-4 text-xs">Bounce Gentle</strong>
              <ClassName>animate-bounce-gentle</ClassName>
            </div>

            {/* SHIMMER */}

            <div className="card flex min-h-44 flex-col items-center justify-center p-5 text-center">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-gris-bap-dark">
                <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
              </div>

              <strong className="mt-4 text-xs">Shimmer</strong>
              <ClassName>animate-shimmer</ClassName>
            </div>
          </div>

          {/* CARD CLICK */}

          <div className="mt-5 card p-6">
            <h3 className="text-sm font-extrabold">Card Click</h3>

            <p className="mt-1 text-xs text-gris-bap">
              Mantén presionada la tarjeta para comprobar la respuesta
              visual.
            </p>

            <button
              className="
                mt-4 w-full rounded-xl border border-verde-bap/30
                bg-verde-bap-light p-5 text-left
                transition-all hover:bg-verde-bap-extralight
                active:animate-card-click
              "
            >
              <strong className="text-sm text-verde-bap-dark">
                Presiona aquí
              </strong>

              <span className="mt-1 block text-xs text-gris-bap">
                active:animate-card-click
              </span>
            </button>
          </div>
        </section>

        {/* ======================================================
            DURACIONES Y EASING
        ====================================================== */}

        <section>
          <SectionTitle
            eyebrow="08 · Transitions"
            title="Duración y easing"
            description="Prueba visual de duration-400/600/800/1000 y los easing smooth/bounce-in."
          />

          <div className="grid gap-4 md:grid-cols-4">
            <div className="group card cursor-pointer p-5">
              <div className="h-12 w-12 rounded-xl bg-verde-bap transition-transform duration-400 group-hover:translate-x-16" />
              <strong className="mt-4 block text-xs">400ms</strong>
            </div>

            <div className="group card cursor-pointer p-5">
              <div className="h-12 w-12 rounded-xl bg-azul-bap transition-transform duration-600 group-hover:translate-x-16" />
              <strong className="mt-4 block text-xs">600ms</strong>
            </div>

            <div className="group card cursor-pointer p-5">
              <div className="h-12 w-12 rounded-xl bg-naranja-bap transition-transform duration-800 group-hover:translate-x-16" />
              <strong className="mt-4 block text-xs">800ms</strong>
            </div>

            <div className="group card cursor-pointer p-5">
              <div className="h-12 w-12 rounded-xl bg-rojo-bap transition-transform duration-1000 group-hover:translate-x-16" />
              <strong className="mt-4 block text-xs">1000ms</strong>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="group card cursor-pointer p-5">
              <div className="h-12 w-12 rounded-xl bg-verde-bap transition-transform duration-600 ease-smooth group-hover:translate-x-24" />

              <strong className="mt-4 block text-xs">
                ease-smooth
              </strong>
            </div>

            <div className="group card cursor-pointer p-5">
              <div className="h-12 w-12 rounded-xl bg-azul-bap transition-transform duration-600 ease-bounce-in group-hover:translate-x-24" />

              <strong className="mt-4 block text-xs">
                ease-bounce-in
              </strong>
            </div>
          </div>
        </section>

        {/* ======================================================
            GLASSMORPHISM
        ====================================================== */}

        <section id="glass" className="scroll-mt-24">
          <SectionTitle
            eyebrow="09 · Index CSS"
            title="Glassmorphism"
            description="glass y glass-modal ya están definidos en index.css. Colocamos objetos detrás para comprobar realmente el backdrop-filter."
          />

          <div className="relative min-h-[360px] overflow-hidden rounded-4xl bg-gradient-bap p-8 shadow-medium">
            <div className="absolute -left-12 top-10 h-52 w-52 rounded-full bg-amarillo-bap/80 blur-2xl" />

            <div className="absolute right-10 top-3 h-44 w-44 rounded-full bg-azul-bap/80 blur-2xl" />

            <div className="absolute bottom-[-40px] left-[45%] h-52 w-52 rounded-full bg-rojo-bap/50 blur-3xl" />

            <div className="relative grid gap-6 md:grid-cols-2">
              <article className="glass rounded-4xl p-7 shadow-soft">
                <span className="text-[10px] font-black uppercase tracking-wider text-verde-bap-dark">
                  .glass
                </span>

                <h3 className="mt-2 text-xl font-extrabold">
                  Panel translúcido
                </h3>

                <p className="mt-2 text-xs leading-6 text-gris-bap">
                  background rgba, blur de 20px, saturación y borde
                  translúcido.
                </p>
              </article>

              <article className="glass-modal rounded-4xl p-7">
                <span className="text-[10px] font-black uppercase tracking-wider text-verde-bap-dark">
                  .glass-modal
                </span>

                <h3 className="mt-2 text-xl font-extrabold">
                  Glass para modal
                </h3>

                <p className="mt-2 text-xs leading-6 text-gris-bap">
                  Variante con una sombra más intensa para componentes
                  flotantes.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ======================================================
            SEGMENTED
        ====================================================== */}

        <section>
          <SectionTitle
            eyebrow="10 · Interacción"
            title="Control segmentado"
          />

          <div className="card p-5">
            <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-gris-bap-light p-1">
              {["Todos", "Nuevos", "Generados", "Error"].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item)}
                  className={`
                    whitespace-nowrap rounded-lg px-4 py-2
                    text-xs font-bold
                    transition-all duration-300
                    ${
                      activeTab === item
                        ? "bg-white text-verde-bap-dark shadow-soft"
                        : "text-gris-bap hover:bg-white/60"
                    }
                  `}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-xl bg-verde-bap-extralight p-4">
              <span className="text-xs text-gris-bap">
                Filtro seleccionado:
              </span>

              <strong className="ml-2 text-xs text-verde-bap-dark">
                {activeTab}
              </strong>
            </div>
          </div>
        </section>

        {/* ======================================================
            FORMULARIOS
        ====================================================== */}

        <section id="forms" className="scroll-mt-24">
          <SectionTitle
            eyebrow="11 · Index CSS"
            title="Inputs y formularios"
            description="input-field y label-field se consumen directamente desde index.css."
          />

          <div className="card p-6">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label-field">Número de acta</label>

                <input
                  className="input-field"
                  placeholder="Ej. ACT-2026-001"
                />
              </div>

              <div>
                <label className="label-field">Organización</label>

                <input
                  className="input-field"
                  placeholder="Nombre de organización"
                />
              </div>

              <div>
                <label className="label-field">Estado</label>

                <select className="input-field" defaultValue="activo">
                  <option value="activo">Activo</option>
                  <option value="revision">En revisión</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="label-field">Observación</label>

                <textarea
                  className="input-field min-h-28 resize-y"
                  placeholder="Escriba una observación..."
                />
              </div>

              <div>
                <label className="label-field">Deshabilitado</label>

                <input
                  className="input-field cursor-not-allowed bg-gris-bap-light opacity-60"
                  value="No editable"
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-5">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gris-bap">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 accent-verde-bap"
                />
                Selección activa
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Cambiar switch"
                  onClick={() => setSwitchActive((value) => !value)}
                  className={`
                    relative h-6 w-11 rounded-full
                    transition-colors duration-300
                    ${
                      switchActive
                        ? "bg-verde-bap"
                        : "bg-gris-bap-light"
                    }
                  `}
                >
                  <span
                    className={`
                      absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm
                      transition-transform duration-400 ease-bounce-in
                      ${
                        switchActive
                          ? "translate-x-1"
                          : "-translate-x-4"
                      }
                    `}
                  />
                </button>

                <span className="text-xs font-semibold text-gris-bap">
                  {switchActive ? "Activado" : "Desactivado"}
                </span>
              </div>
            </div>

            <ClassName>label-field · input-field</ClassName>
          </div>
        </section>

        {/* ======================================================
            BADGES
        ====================================================== */}

        <section id="badges" className="scroll-mt-24">
          <SectionTitle
            eyebrow="12 · Estados"
            title="Badges con paleta BAP"
            description="No requieren CSS adicional; utilizan directamente la paleta configurada."
          />

          <div className="card flex flex-wrap gap-3 p-6">
            <StatusBadge variant="green">Activo</StatusBadge>
            <StatusBadge variant="blue">Generado</StatusBadge>
            <StatusBadge variant="yellow">Pendiente</StatusBadge>
            <StatusBadge variant="orange">Revisión</StatusBadge>
            <StatusBadge variant="red">Error</StatusBadge>
            <StatusBadge variant="gray">Archivado</StatusBadge>
          </div>
        </section>

        {/* ======================================================
            SKELETON + SHIMMER
        ====================================================== */}

        <section>
          <SectionTitle
            eyebrow="13 · Loading"
            title="Skeleton y shimmer"
          />

          <div className="card max-w-3xl p-6">
            <div className="flex gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gris-bap-light">
                <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
              </div>

              <div className="flex-1 space-y-3">
                <div className="relative h-3 w-1/3 overflow-hidden rounded-full bg-gris-bap-light">
                  <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
                </div>

                <div className="relative h-2.5 overflow-hidden rounded-full bg-gris-bap-light">
                  <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
                </div>

                <div className="relative h-2.5 w-3/4 overflow-hidden rounded-full bg-gris-bap-light">
                  <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            TABLA
        ====================================================== */}

        <section id="table" className="scroll-mt-24">
          <SectionTitle
            eyebrow="14 · Datos"
            title="Tabla administrativa"
          />

          <div className="overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCEBE3] px-5 py-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-verde-bap-dark">
                  Registros
                </span>

                <h3 className="mt-1 text-lg font-extrabold">
                  Actas recientes
                </h3>
              </div>

              <StatusBadge variant="green">
                3,216 registros
              </StatusBadge>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse">
                <thead className="bg-verde-bap-extralight">
                  <tr className="text-left">
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-verde-bap-dark">
                      Acta
                    </th>

                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-verde-bap-dark">
                      Organización
                    </th>

                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-verde-bap-dark">
                      Estado
                    </th>

                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-verde-bap-dark">
                      Actualización
                    </th>

                    <th className="px-5 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {[
                    {
                      id: "ACT-2026-0316",
                      empresa: "Empresa Demo Norte",
                      status: "Activo",
                      type: "green" as const,
                      date: "18/08/2026",
                    },
                    {
                      id: "ACT-2026-0315",
                      empresa: "Servicios Centrales",
                      status: "Revisión",
                      type: "orange" as const,
                      date: "18/08/2026",
                    },
                    {
                      id: "ACT-2026-0314",
                      empresa: "Operaciones Lima",
                      status: "Generado",
                      type: "blue" as const,
                      date: "17/08/2026",
                    },
                    {
                      id: "ACT-2026-0313",
                      empresa: "Unidad Administrativa",
                      status: "Error",
                      type: "red" as const,
                      date: "17/08/2026",
                    },
                  ].map((row) => (
                    <tr
                      key={row.id}
                      className="
                        border-t border-[#EEF4F0]
                        transition-colors duration-300
                        hover:bg-verde-bap-extralight
                      "
                    >
                      <td className="px-5 py-4">
                        <strong className="text-xs text-gris-bap-dark">
                          {row.id}
                        </strong>
                      </td>

                      <td className="px-5 py-4 text-xs text-gris-bap">
                        {row.empresa}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge variant={row.type}>
                          {row.status}
                        </StatusBadge>
                      </td>

                      <td className="px-5 py-4 text-xs text-gris-bap">
                        {row.date}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button className="btn-ghost">
                          •••
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ======================================================
            FEEDBACK
        ====================================================== */}

        <section id="feedback" className="scroll-mt-24">
          <SectionTitle
            eyebrow="15 · Feedback"
            title="Modal, backdrop y notificación"
            description="Esta sección prueba animate-modal-scale, animate-modal-backdrop y glass-modal."
          />

          <div className="card p-6">
            <div className="flex flex-wrap gap-3">
              <button
                className="btn-primary"
                onClick={() => setShowModal(true)}
              >
                Abrir modal
              </button>

              <button className="btn-secondary" onClick={launchToast}>
                Mostrar notificación
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================
            TEXTO / TIPOGRAFÍA
        ====================================================== */}

        <section>
          <SectionTitle
            eyebrow="16 · Typography"
            title="Montserrat"
            description="Tu fontFamily.sans está configurada como Montserrat, Arial, sans-serif."
          />

          <div className="card space-y-4 p-6">
            <h1 className="text-4xl font-black tracking-tight">
              Heading principal
            </h1>

            <h2 className="text-2xl font-extrabold">
              Heading secundario
            </h2>

            <h3 className="text-lg font-bold">
              Título de componente
            </h3>

            <p className="max-w-3xl text-sm leading-7 text-gris-bap">
              Texto de lectura utilizado para contenido administrativo,
              descripciones, observaciones y elementos informativos.
            </p>

            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-verde-bap-dark">
              Label administrativo
            </span>

            <p className="text-2xl font-black text-gris-bap-dark text-shadow-soft">
              Texto con .text-shadow-soft
            </p>
          </div>
        </section>
      </main>

      {/* ========================================================
          FOOTER
      ======================================================== */}

      <footer className="border-t border-[#DCEBE3] bg-white">
        <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">
          <span className="text-xs font-bold text-gris-bap-dark">
            Sistema de Actas · Laboratorio Visual BAP
          </span>

          <p className="mt-1 text-[10px] text-gris-bap">
            index.css + tailwind.config.js
          </p>
        </div>
      </footer>

      {/* ========================================================
          MODAL
      ======================================================== */}

      {showModal && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            bg-backdrop-dark p-5
            backdrop-blur-xs
            animate-modal-backdrop
          "
          onMouseDown={() => setShowModal(false)}
        >
          <div
            className="
              glass-modal
              w-full max-w-md
              rounded-4xl p-7
              animate-modal-scale
            "
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verde-bap-light text-2xl font-black text-verde-bap-dark">
              ✓
            </div>

            <h3 className="mt-5 text-xl font-extrabold text-gris-bap-dark">
              Animación de modal
            </h3>

            <p className="mt-2 text-xs leading-6 text-gris-bap">
              Este modal está utilizando las animaciones y el
              glassmorphism que actualmente existen en tus archivos.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>

              <button
                className="btn-primary"
                onClick={() => setShowModal(false)}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TOAST
      ======================================================== */}

      {showToast && (
        <div
          className="
            fixed bottom-6 right-6 z-[110]
            flex w-[calc(100%-3rem)] max-w-sm items-center gap-3
            rounded-2xl border border-verde-bap/30
            bg-white/95 p-4
            shadow-strong backdrop-blur-xl
            animate-slide-in-right
          "
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-verde-bap-light font-black text-verde-bap-dark">
            ✓
          </div>

          <div className="min-w-0 flex-1">
            <strong className="block text-xs text-gris-bap-dark">
              Componente correcto
            </strong>

            <span className="mt-1 block text-[10px] text-gris-bap">
              La notificación utiliza tu sistema visual actual.
            </span>
          </div>

          <button
            className="btn-ghost !px-2"
            onClick={() => setShowToast(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}