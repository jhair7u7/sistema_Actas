import { useState, type FormEvent } from "react";
import logo from "../assets/logo.png";
import boyPhone from "../assets/boy-phone.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            login: email,
            password,
          }),
        }
      )

      console.log("Intento de inicio de sesión:", {
        email,
        password,
      });
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen font-sans">
      <div className="flex min-h-screen w-full">
        {/* ================= LADO IZQUIERDO ================= */}
        <section
          className="
            flex min-h-screen w-full
            items-center justify-center
            bg-[#f2f7f3]
            px-6 py-10
            sm:px-10
            lg:w-1/2
            lg:px-16
            xl:px-24
          "
        >
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="mb-10">
              <img
                src={logo}
                alt="Banco de Alimentos Perú"
                className="h-auto w-[220px] object-contain"
              />
            </div>

            {/* Título */}
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Iniciar sesión
            </h1>

            <p className="mb-8 text-sm text-gray-500 sm:text-base">
              Ingresa tus credenciales para acceder al sistema
            </p>

            {/* Formulario */}
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-5"
            >
              {/* Correo */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-800"
                >
                  Correo electrónico
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full rounded-lg
                    border border-gray-300
                    bg-white
                    px-4 py-3
                    text-sm text-gray-800
                    placeholder:text-gray-400
                    transition-all duration-200
                    focus:border-[#5cb89a]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#5cb89a]/20
                  "
                  required
                />
              </div>

              {/* Contraseña */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-800"
                >
                  Contraseña
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="
                      w-full rounded-lg
                      border border-gray-300
                      bg-white
                      px-4 py-3 pr-12
                      text-sm text-gray-800
                      placeholder:text-gray-400
                      transition-all duration-200
                      focus:border-[#5cb89a]
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#5cb89a]/20
                    "
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="
                      absolute right-3 top-1/2
                      -translate-y-1/2
                      rounded-md p-1
                      text-gray-400
                      transition-colors
                      hover:bg-gray-100
                      hover:text-gray-600
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#5cb89a]/30
                    "
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18M10.584 10.587a2 2 0 002.829 2.829M9.88 4.24A9.77 9.77 0 0112 4c4.478 0 8.268 2.943 9.542 7a9.77 9.77 0 01-2.042 3.592M6.61 6.61A9.69 9.69 0 002.458 11c1.274 4.057 5.064 7 9.542 7a9.74 9.74 0 004.39-1.03"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de inicio */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  mt-2 flex w-full
                  items-center justify-center
                  rounded-lg
                  py-3.5
                  text-sm font-semibold
                  text-white
                  shadow-sm
                  transition-all duration-200
                  hover:brightness-105
                  hover:shadow-md
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-70
                "
                style={{
                  background:
                    "linear-gradient(90deg, #5cb89a 0%, #7dc8ad 50%, #a0d8c0 100%)",
                }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="mr-2 h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>

                    Ingresando...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>
            </form>

            {/* Olvidó contraseña */}
            <p className="mt-8 text-center text-sm text-gray-500">
              ¿Olvidaste tu contraseña?{" "}
              <button
                type="button"
                className="
                  font-medium text-[#5cb89a]
                  underline underline-offset-2
                  transition-colors
                  hover:text-[#4aa386]
                "
              >
                Comunícate con el administrador
              </button>
            </p>
          </div>
        </section>

        {/* ================= LADO DERECHO ================= */}
        <section className="relative hidden min-h-screen w-1/2 overflow-hidden lg:block">
          {/* Imagen */}
          <img
            src={boyPhone}
            alt="Niño sonriendo sosteniendo un celular"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Sombreado negro inferior original */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Texto sobre la imagen */}
          <div className="absolute bottom-0 left-0 right-0 p-10 xl:p-14">
            <h2 className="mb-3 text-2xl font-bold leading-snug text-white drop-shadow-lg xl:text-3xl">
              Alimentando esperanza, construyendo futuro.
            </h2>

            <p className="max-w-lg text-sm leading-relaxed text-white/90 drop-shadow xl:text-base">
              Juntos podemos reducir el desperdicio de alimentos y llevar
              nutrición a quienes más lo necesitan.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}