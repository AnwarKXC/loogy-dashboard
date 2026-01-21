export default defineAppConfig({

  ui: {

    colors: {
      primary: 'indigo',
      neutral: 'slate'
    },
    button: {
      slots: {
        base: 'group relative inline-flex items-center justify-center rounded-none font-semibold cursor-pointer overflow-hidden transition-all duration-700 ease-out hover:-translate-y-0.5   hover:saturate-[1.50] hover:brightness-[1.1] hover:shadow-[0_28px_60px_-30px_rgba(15,23,42,0.8)] active:translate-y-0 active:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:cursor-not-allowed  aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 before:absolute before:content-[\'\'] before:inset-y-[-45%] before:left-[-45%] before:w-1/2 before:bg-[conic-gradient(from_120deg,rgba(255,255,255,0.05),rgba(255,255,255,0.85),rgba(255,255,255,0.15))] before:opacity-0 before:blur before:transition-all before:duration-700 before:ease-out before:mix-blend-screen hover:before:opacity-100 hover:before:left-[135%] hover:before:scale-[1.35] hover:before:duration-700 after:absolute after:content-[\'\'] after:inset-[-35%] after:bg-[conic-gradient(from_35deg,rgba(255,255,255,0.18)_0deg,rgba(98,91,246,0.25)_110deg,rgba(45,212,191,0.28)_185deg,rgba(244,114,182,0.32)_255deg,rgba(255,255,255,0.2)_320deg)] after:[mask-image:radial-gradient(circle_at_center,rgba(255,255,255,0.95)_0%,transparent_70%)] after:opacity-0 after:transition-all after:duration-[900ms] after:ease-out after:mix-blend-screen hover:after:opacity-100 hover:after:scale-[1.2] hover:after:blur-[10px] hover:after:animate-[spin_2.6s_linear_infinite]'
      }
    },
    input: {
      slots: {
        root: 'w-full text-lg flex-grow',
        base: '!py-2.5 !text-base'

      }
    },
    navigationMenu: {
      slots: {
        root: 'scroll-x-auto'
      }
    },
    textarea: {
      slots: {
        root: 'w-full',
        base: '!py-2.5 !text-base'

      }
    },
    pagination: {
      slots: {
        root: '',
        list: 'flex items-center gap-1',
        ellipsis: 'pointer-events-none',
        label: 'min-w-5 text-center',
        first: 'rtl:rotate-180',
        prev: 'rtl:rotate-180',
        next: 'rtl:rotate-180',
        last: 'rtl:rotate-180 '
      }
    },
    select: {
      slots: {
        base: ' !py-2.5 !text-base max-sm:w-full',
        // Ensure Select dropdown (ported to body by default) appears above modals
        // when opened from within a modal.
        content:
          'max-h-60 w-(--reka-select-trigger-width) bg-default shadow-lg rounded-none ring ring-default overflow-hidden data-[state=open]:animate-[scale-in_100ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in] origin-(--reka-select-content-transform-origin) pointer-events-auto flex flex-col !z-[200]'
      }
    },
    selectMenu: {
      slots: {
        base: ' !py-2.5 !text-base max-sm:w-full',
        // Ensure Select dropdown (ported to body by default) appears above modals
        // when opened from within a modal.
        content:
          'max-h-60 w-(--reka-select-trigger-width) bg-default shadow-lg rounded-none ring ring-default overflow-hidden data-[state=open]:animate-[scale-in_100ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in] origin-(--reka-select-content-transform-origin) pointer-events-auto flex flex-col !z-[200]'
      }
    },
    card: {
      slots: {
        body: 'px-2 py-3 '
      }
    }
  }
})
