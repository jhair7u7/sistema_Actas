import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, BarChart3, Users, TrendingUp, AlertCircle } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import clsx from "clsx";

// Registrar componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  // =========================================================
  // 1. ESTADOS PARA LA DATA REAL
  // Aquí almacenarás la data proveniente de tu backend
  // =========================================================
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // =========================================================
  // 2. SIMULACIÓN DE LLAMADA A LA API (Reemplaza esto con tu fetch real)
  // =========================================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Simula el tiempo de red
        await new Promise((resolve) => setTimeout(resolve, 800));

        // MOCK DATA: Estructura recomendada para tu backend
        const realApiData = {
          metrics: {
            totalActas: 1245,
            conformesMes: 342,
            pendientes: 45,
            organizaciones: 89,
          },
          actasPorTipo: {
            anios: ["2024", "2025", "2026"],
            empresa: [150, 230, 180],
            compras: [90, 120, 150],
            supermercados: [200, 310, 290],
          },
          estatusPorAnio: {
            anios: ["2024", "2025", "2026"],
            conformes: [380, 560, 480],
            pendientes: [60, 100, 140],
          },
          rankingOSPendientes: {
            organizaciones: [
              "OS Comedor Santa Maria", "OS Casa de Refugio", "OS Albergue Niño Jesus",
              "OS Manos Unidas", "OS Esperanza Viva", "OS Comedor Popular 12",
              "OS Corazón de Madre", "OS Vecinos Solidarios", "OS Centro de Apoyo",
              "OS Vida Nueva", "OS Ayuda Mutua", "OS Sonrisas Felices",
              "OS El Buen Samaritano", "OS Ángeles de la Calle", "OS Juntos Podemos",
              "OS Refugio de Paz", "OS Luz del Mundo", "OS Pan de Vida",
              "OS Familias Fuertes", "OS Semillas de Amor"
            ],
            actasPendientes: [45, 42, 38, 35, 33, 30, 28, 25, 22, 20, 18, 16, 15, 13, 11, 9, 8, 5, 3, 1],
          }
        };

        setDashboardData(realApiData);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // =========================================================
  // 3. CONFIGURACIÓN DE LOS GRÁFICOS (Colores Pasteles BAP)
  // =========================================================
  const globalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { family: "Montserrat", size: 11 }, color: "#808284", usePointStyle: true },
      },
      tooltip: {
        backgroundColor: "#2B2C2E",
        titleFont: { family: "Montserrat", size: 12 },
        bodyFont: { family: "Montserrat", size: 12 },
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#808284", font: { family: "Montserrat", size: 10 } } },
      y: { border: { display: false }, grid: { color: "#F0EFEF" }, ticks: { color: "#808284", font: { family: "Montserrat", size: 10 } } },
    },
  };

  const chartDataActasTipo = {
    labels: dashboardData?.actasPorTipo.anios || [],
    datasets: [
      {
        label: "Empresa",
        data: dashboardData?.actasPorTipo.empresa || [],
        backgroundColor: "#F0555F", // azul-bap-light
        hoverBackgroundColor: "#a5323a", // azul-bap
        borderRadius: 4,
        maxBarThickness: 35,
      },
      {
        label: "Compras",
        data: dashboardData?.actasPorTipo.compras || [],
        backgroundColor: "#73C59C", // verde-bap
        hoverBackgroundColor: "#477E63", // verde-bap-dark
        borderRadius: 4,
        maxBarThickness: 35,
      },
      {
        label: "Supermercados",
        data: dashboardData?.actasPorTipo.supermercados || [],
        backgroundColor: "#FFDF69", // amarillo-bap
        hoverBackgroundColor: "#EEC11A", // amarillo-bap-dark
        borderRadius: 4,
        maxBarThickness: 35,
      },
    ],
  };

  const chartDataEstatus = {
    labels: dashboardData?.estatusPorAnio.anios || [],
    datasets: [
      {
        label: "Conformes",
        data: dashboardData?.estatusPorAnio.conformes || [],
        hoverBackgroundColor: "#477E63", // verde-bap-dark
        backgroundColor: "#73C59C", // verde-bap
        borderRadius: 4,
        maxBarThickness: 45,
      },
      {
        label: "Pendientes",
        data: dashboardData?.estatusPorAnio.pendientes || [],
        backgroundColor: "#F0555F", // rojo-bap-light
        hoverBackgroundColor: "#a5323a", // rojo-bap
        borderRadius: 4,
        maxBarThickness: 45,
      },
    ],
  };

  const chartDataRanking = {
    labels: dashboardData?.rankingOSPendientes.organizaciones || [],
    datasets: [
      {
        label: "Actas Pendientes",
        data: dashboardData?.rankingOSPendientes.actasPendientes || [],
        backgroundColor: "#FFF0E1", // naranja-bap-light
        hoverBackgroundColor: "#F9A755", // naranja-bap
        borderColor: "#F9A755",
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 20, // Barras más delgadas y ordenadas
      },
    ],
  };

  const rankingOptions = {
    ...globalChartOptions,
    indexAxis: "y" as const,
    plugins: {
      ...globalChartOptions.plugins,
      legend: { display: false },
    },
    scales: {
      x: { grid: { color: "#F0EFEF" }, border: { display: false }, ticks: { color: "#808284", font: { family: "Montserrat", size: 10 } } },
      y: { grid: { display: false }, border: { display: false }, ticks: { color: "#2B2C2E", font: { family: "Montserrat", size: 10 } } },
    },
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-verde-bap-light border-t-verde-bap-dark" />
        <p className="text-sm font-medium text-gris-bap">Cargando métricas del Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 font-sans text-gris-bap-dark pb-10">
      
      {/* HEADER */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-fade-in-up">
        <div>
          <span className="block text-[11px] font-black uppercase tracking-[0.20em] text-verde-bap-dark mb-2">
            Módulo BAP
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gris-bap-dark">
            Dashboard Operativo
          </h1>
          <p className="mt-3 text-base font-medium text-gris-bap">
            Visualiza las métricas clave, control de actas y alertas de firmas pendientes.
          </p>
        </div>
      </header>

      {/* ========================================================
          METRICS CARDS (Estilo Administración)
      ======================================================== */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 w-full mb-8">
        {/* TOTAL ACTAS - VERDE */}
        <article className="group relative overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft transition-all duration-400 ease-smooth hover:-translate-y-2 hover:border-verde-bap/60 hover:shadow-medium">
          <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-verde-bap/15 opacity-40 transition-all duration-500 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:bg-verde-bap/25" />
          <div className="relative flex items-center justify-between z-10">
            <div>
              <span className="text-sm font-semibold text-gris-bap">Total Actas</span>
              <strong className="mt-1 block text-4xl font-black tracking-tight text-gris-bap-dark">
                {dashboardData?.metrics.totalActas}
              </strong>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verde-bap-light text-verde-bap-dark transition-transform duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <Activity className="h-7 w-7" />
            </div>
          </div>
        </article>

        {/* CONFORMES - AZUL */}
        <article className="group relative overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft transition-all duration-400 ease-smooth hover:-translate-y-2 hover:border-azul-bap/60 hover:shadow-medium">
          <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-azul-bap/15 opacity-40 transition-all duration-500 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:bg-azul-bap/25" />
          <div className="relative flex items-center justify-between z-10">
            <div>
              <span className="text-sm font-semibold text-gris-bap">Conformes (Mes)</span>
              <strong className="mt-1 block text-4xl font-black tracking-tight text-gris-bap-dark">
                {dashboardData?.metrics.conformesMes}
              </strong>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-azul-bap-light text-azul-bap-dark transition-transform duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <BarChart3 className="h-7 w-7" />
            </div>
          </div>
        </article>

        {/* ORGANIZACIONES - NARANJA */}
        <article className="group relative overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft transition-all duration-400 ease-smooth hover:-translate-y-2 hover:border-naranja-bap/60 hover:shadow-medium">
          <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-naranja-bap/20 opacity-50 transition-all duration-500 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:bg-naranja-bap/35" />
          <div className="relative flex items-center justify-between z-10">
            <div>
              <span className="text-sm font-semibold text-gris-bap">Organizaciones</span>
              <strong className="mt-1 block text-4xl font-black tracking-tight text-gris-bap-dark">
                {dashboardData?.metrics.organizaciones}
              </strong>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-naranja-bap-light text-naranja-bap-dark transition-transform duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <Users className="h-7 w-7" />
            </div>
          </div>
        </article>

        {/* PENDIENTES - ROJO */}
        <article className="group relative overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft transition-all duration-400 ease-smooth hover:-translate-y-2 hover:border-rojo-bap/60 hover:shadow-medium">
          <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-rojo-bap/15 opacity-40 transition-all duration-500 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:bg-rojo-bap/25" />
          <div className="relative flex items-center justify-between z-10">
            <div>
              <span className="text-sm font-semibold text-gris-bap">Actas Pendientes</span>
              <strong className="mt-1 block text-4xl font-black tracking-tight text-rojo-bap">
                {dashboardData?.metrics.pendientes}
              </strong>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rojo-bap-light text-rojo-bap-dark transition-transform duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <AlertCircle className="h-7 w-7" />
            </div>
          </div>
        </article>
      </div>

      {/* ========================================================
          GRÁFICOS
      ======================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* GRÁFICO 1: Actas por Año y Tipo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft"
        >
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-gris-bap-dark uppercase tracking-wide">Actas por Tipo (Anual)</h3>
            <p className="text-xs font-medium text-gris-bap mt-1">Comparativa de volúmenes por categoría</p>
          </div>
          {/* Contenedor con altura controlada */}
          <div className="relative h-[260px] w-full">
            <Bar data={chartDataActasTipo} options={globalChartOptions} />
          </div>
        </motion.div>

        {/* GRÁFICO 2: Estatus de Actas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft"
        >
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-gris-bap-dark uppercase tracking-wide">Estatus de Actas (Anual)</h3>
            <p className="text-xs font-medium text-gris-bap mt-1">Relación Conformes vs. Pendientes</p>
          </div>
          <div className="relative h-[260px] w-full">
            <Bar data={chartDataEstatus} options={globalChartOptions} />
          </div>
        </motion.div>
      </div>

      {/* GRÁFICO 3: RANKING TOP 20 OS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="overflow-hidden rounded-2xl border border-[#DCEBE3] bg-white p-6 shadow-soft flex flex-col"
      >
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#DCEBE3] pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-rojo-bap-dark uppercase tracking-wide">Atención Inmediata: Top 20 OS</h3>
            <p className="text-xs font-medium text-gris-bap mt-1">Organizaciones con mayor cantidad de firmas pendientes</p>
          </div>
          <div className="mt-3 sm:mt-0 px-4 py-1.5 bg-rojo-bap-light/40 text-rojo-bap-dark rounded-full text-[10px] font-black uppercase tracking-widest border border-rojo-bap-light">
            Alerta de Firmas
          </div>
        </div>
        
        {/* Usamos un contenedor con overflow-y para que si la pantalla es chica, 
            el gráfico interno mantenga una altura de 500px y sea escrolleable */}
        <div className="w-full overflow-y-auto [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-[#f4fbf7] [&::-webkit-scrollbar-thumb]:bg-[#F9A755] [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="relative h-[500px] min-w-[600px] w-full mt-2 pr-2">
            <Bar data={chartDataRanking} options={rankingOptions} />
          </div>
        </div>
      </motion.div>

    </div>
  );
}   