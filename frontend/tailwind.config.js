/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "Arial", "sans-serif"],
      },

      colors: {
        // =====================================================
        // BAP
        // =====================================================

        "verde-bap": "#73C59C",
        "verde-bap-dark": "#477E63",
        "verde-bap-light": "#E4F8EE",
        "verde-bap-extralight": "#F0FDF4",

        "amarillo-bap": "#FFDF69",
        "amarillo-bap-dark": "#EEC11A",
        "amarillo-bap-light": "#FFFBEC",

        "rojo-bap": "#F0555F",
        "rojo-bap-dark": "#DB3D47",
        "rojo-bap-light": "#FABEC2",

        "naranja-bap": "#F9A755",
        "naranja-bap-dark": "#E2882D",
        "naranja-bap-light": "#FFF0E1",

        "azul-bap": "#0089C6",
        "azul-bap-dark": "#034F71",
        "azul-bap-light": "#BFE9FC",

        "gris-bap": "#808284",
        "gris-bap-dark": "#2B2C2E",
        "gris-bap-light": "#F0EFEF",

        "backdrop-dark": "rgba(0,0,0,0.6)",
        "glass-white": "rgba(255,255,255,0.85)",
        "glass-border": "rgba(255,255,255,0.2)",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      boxShadow: {
        soft:
          "0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)",

        medium:
          "0 4px 25px -5px rgba(0,0,0,0.1), 0 10px 30px -5px rgba(0,0,0,0.05)",

        strong:
          "0 10px 40px -10px rgba(0,0,0,0.15), 0 20px 50px -10px rgba(0,0,0,0.1)",

        modal:
          "0 25px 50px -12px rgba(0,0,0,0.25)",

        "card-modern":
          "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)",

        "glow-verde":
          "0 0 20px rgba(115,197,156,0.6), 0 0 30px rgba(115,197,156,0.4)",

        "glow-amarillo":
          "0 0 20px rgba(255,223,105,0.6), 0 0 30px rgba(255,223,105,0.4)",

        "glow-rojo":
          "0 0 20px rgba(240,85,95,0.6), 0 0 30px rgba(240,85,95,0.4)",

        "glow-azul":
          "0 0 20px rgba(0,137,198,0.6), 0 0 30px rgba(0,137,198,0.4)",
      },

      backgroundImage: {
        "gradient-bap":
          "linear-gradient(135deg, #73C59C, #477E63)",

        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))",

        "shimmer-gradient":
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
      },

      keyframes: {
        fadeIn: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },

        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        fadeInDown: {
          "0%": {
            opacity: "0",
            transform: "translateY(-30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        slideInRight: {
          "0%": {
            opacity: "0",
            transform: "translateX(50px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },

        slideInLeft: {
          "0%": {
            opacity: "0",
            transform: "translateX(-50px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },

        scaleIn: {
          "0%": {
            opacity: "0",
            transform: "scale(0.9)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },

        shimmer: {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },

        float: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },

        pulseSoft: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.8",
          },
        },

        cardClick: {
  "0%": {
    transform: "scale(1)",
  },
  "50%": {
    transform: "scale(0.98)",
  },
  "100%": {
    transform: "scale(1)",
  },
},

bounceGentle: {
  "0%, 20%, 50%, 80%, 100%": {
    transform: "translateY(0)",
  },
  "40%": {
    transform: "translateY(-10px)",
  },
  "60%": {
    transform: "translateY(-5px)",
  },
},

pulseSoft: {
  "0%, 100%": {
    opacity: "1",
  },
  "50%": {
    opacity: "0.8",
  },
},

float: {
  "0%, 100%": {
    transform: "translateY(0)",
  },
  "50%": {
    transform: "translateY(-10px)",
  },
},

modalScale: {
  "0%": {
    opacity: "0",
    transform: "scale(0.8) translateY(50px)",
  },
  "100%": {
    opacity: "1",
    transform: "scale(1) translateY(0)",
  },
},

modalScaleOut: {
  "0%": {
    opacity: "1",
    transform: "scale(1) translateY(0)",
  },
  "100%": {
    opacity: "0",
    transform: "scale(0.9) translateY(-20px)",
  },
},

modalBackdrop: {
  "0%": {
    opacity: "0",
    backdropFilter: "blur(0px)",
  },
  "100%": {
    opacity: "1",
    backdropFilter: "blur(8px)",
  },
},

modalBackdropOut: {
  "0%": {
    opacity: "1",
    backdropFilter: "blur(8px)",
  },
  "100%": {
    opacity: "0",
    backdropFilter: "blur(0px)",
  },
},

shimmerSlide: {
  "0%": {
    transform: "translateX(-100%)",
  },
  "100%": {
    transform: "translateX(100%)",
  },
},
      },

      animation: {
        "fade-in":
          "fadeIn 0.5s ease-in-out forwards",

        "fade-in-up":
          "fadeInUp 0.6s ease-out forwards",

        "fade-in-down":
          "fadeInDown 0.6s ease-out forwards",

        "slide-in-right":
          "slideInRight 0.5s ease-out forwards",

        "slide-in-left":
          "slideInLeft 0.5s ease-out forwards",

        "scale-in":
          "scaleIn 0.3s ease-out forwards",

        shimmer:
          "shimmer 2s infinite linear",

        float:
          "float 3s ease-in-out infinite",

        "pulse-soft":
          "pulseSoft 2s infinite ease-in-out",

        "modal-scale":
  "modalScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",

"modal-scale-out":
  "modalScaleOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards",

"modal-backdrop":
  "modalBackdrop 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",

"modal-backdrop-out":
  "modalBackdropOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards",

"card-click":
  "cardClick 0.15s ease-in-out",

"bounce-gentle":
  "bounceGentle 0.6s ease-in-out infinite",

"pulse-soft":
  "pulseSoft 2s infinite ease-in-out",

float:
  "float 3s ease-in-out infinite",

"shimmer-slide":
  "shimmerSlide 1s ease-in-out",
      },
      
      transitionDuration: {
  400: "400ms",
  600: "600ms",
  800: "800ms",
  1000: "1000ms",
},

transitionTimingFunction: {
  "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
},

backdropBlur: {
  xs: "2px",
},

spacing: {
  18: "4.5rem",
  88: "22rem",
  128: "32rem",
},

transitionDuration: {
  400: "400ms",
  600: "600ms",
  800: "800ms",
  1000: "1000ms",
},

transitionTimingFunction: {
  "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
},

backdropBlur: {
  xs: "2px",
},

spacing: {
  18: "4.5rem",
  88: "22rem",
  128: "32rem",
},
    },
  },

  plugins: [],
};

