export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc'
    },
    button: {
      slots: {
        base: 'group relative inline-flex items-center justify-center rounded-md font-semibold cursor-pointer overflow-hidden transition-all duration-700 ease-out hover:-translate-y-0.5   hover:saturate-[1.50] hover:brightness-[1.1] hover:shadow-[0_28px_60px_-30px_rgba(15,23,42,0.8)] active:translate-y-0 active:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:cursor-not-allowed  aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 before:absolute before:content-[\'\'] before:inset-y-[-45%] before:left-[-45%] before:w-1/2 before:bg-[conic-gradient(from_120deg,rgba(255,255,255,0.05),rgba(255,255,255,0.85),rgba(255,255,255,0.15))] before:opacity-0 before:blur before:transition-all before:duration-700 before:ease-out before:mix-blend-screen hover:before:opacity-100 hover:before:left-[135%] hover:before:scale-[1.35] hover:before:duration-700 after:absolute after:content-[\'\'] after:inset-[-35%] after:bg-[conic-gradient(from_35deg,rgba(255,255,255,0.18)_0deg,rgba(98,91,246,0.25)_110deg,rgba(45,212,191,0.28)_185deg,rgba(244,114,182,0.32)_255deg,rgba(255,255,255,0.2)_320deg)] after:[mask-image:radial-gradient(circle_at_center,rgba(255,255,255,0.95)_0%,transparent_70%)] after:opacity-0 after:transition-all after:duration-[900ms] after:ease-out after:mix-blend-screen hover:after:opacity-100 hover:after:scale-[1.2] hover:after:blur-[10px] hover:after:animate-[spin_2.6s_linear_infinite]'
      }
    }
  }
})
