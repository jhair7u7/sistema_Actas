import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";
import boyPhone from "../assets/boy-phone.jpg";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginField, setLoginField] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      await login(loginField, password);
      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrio un error al iniciar sesion.";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen font-sans">
      <div className="flex min-h-screen w-full">
        <motion.section
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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
            <div className="mb-10">
              <img
                src={logo}
                alt="Banco de Alimentos Peru"
                className="h-auto w-[220px] object-contain"
              />
            </div>

            <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Iniciar sesion
            </h1>

            <p className="mb-8 text-sm text-gray-500 sm:text-base">
              Ingresa tus credenciales para acceder al sistema
            </p>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login"
                  className="text-sm font-medium text-gray-800"
                >
                  Usuario o correo electronico
                </label>

                <input
                  id="login"
                  name="login"
                  type="text"
                  autoComplete="username"
                  placeholder="usuario o correo@ejemplo.com"
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  className="
                    w-full rounded-lg
                    border border-gray-300
                    bg-white
                    px-4 py-3
                    text-sm text-gray-800
                    placeholder:text-gray-400
                    transition-all duration-200
                    focus:border-brand-500
                    focus:outline-none
                    focus:ring-2
                    focus:ring-brand-500/20
                  "
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-800"
                >
                  Contrasena
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="********"
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
                      focus:border-brand-500
                      focus:outline-none
                      focus:ring-2
                      focus:ring-brand-500/20
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
                      focus:ring-brand-500/30
                    "
                    aria-label={
                      showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
                    }
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}

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
                {isLoading ? "Ingresando..." : "Iniciar sesion"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              Olvidaste tu contrasena?{" "}
              <button
                type="button"
                className="
                  font-medium text-brand-500
                  underline underline-offset-2
                  transition-colors
                  hover:text-brand-600
                "
              >
                Comunicate con el administrador
              </button>
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative hidden min-h-screen w-1/2 overflow-hidden lg:block"
        >
          <img
            src={boyPhone}
            alt="Nino sonriendo sosteniendo un celular"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-10 xl:p-14">
            <h2 className="mb-3 text-2xl font-bold leading-snug text-white drop-shadow-lg xl:text-3xl">
              Alimentando esperanza, construyendo futuro.
            </h2>

            <p className="max-w-lg text-sm leading-relaxed text-white/90 drop-shadow xl:text-base">
              Juntos podemos reducir el desperdicio de alimentos y llevar
              nutricion a quienes mas lo necesitan.
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}