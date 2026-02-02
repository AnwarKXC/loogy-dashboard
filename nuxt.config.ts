// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'motion-v/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/seo'
  ],

  devtools: {
    enabled: true
  },
  css: ['~/assets/css/main.css'],

  // ==========================================
  // Site Configuration (Used by all SEO modules)
  // ==========================================
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://loogy.store',
    name: 'Loogy Store',
    description: 'Shop the best products at competitive prices. Fast shipping to all locations.',
    defaultLocale: 'en'
  },
  runtimeConfig: {
    s3AccessKey: process.env.S3_ACCESS_KEY,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    s3Bucket: process.env.S3_BUCKET_NAME,
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    whatsappApiVersion: process.env.WHATSAPP_API_VERSION,
    adminWhatsappNumber: process.env.ADMIN_WHATSAPP_NUMBER,
    // AI API Keys
    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://loogy.store'
    }
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  i18n: {
    locales: [
      {
        code: 'en',
        name: 'English',
        dir: 'ltr',
        file: 'en.json'
      },
      {
        code: 'ar',
        name: 'Arabic',
        dir: 'rtl',
        file: 'ar.json'
      }
    ],
    langDir: 'locales',
    defaultLocale: 'ar',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root'
    },
    vueI18n: './i18n.config.ts'
  },

  // ==========================================
  // Link Checker (dev only)
  // ==========================================
  linkChecker: {
    enabled: process.env.NODE_ENV === 'development'
  },

  // ==========================================
  // OG Image Configuration
  // ==========================================
  ogImage: {
    enabled: true,
    defaults: {
      cacheMaxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
    }
  },

  // ==========================================
  // Robots Configuration
  // ==========================================
  robots: {
    // Block admin and private routes from indexing
    disallow: ['/admin/**', '/api/**'],
    sitemap: '/sitemap.xml',
    // Allow all storefront pages by default
    allow: ['/'],
    // Block specific private pages
    groups: [
      {
        userAgent: '*',
        disallow: ['/cart', '/checkout', '/wishlist', '/admin/']
      }
    ]
  },

  // ==========================================
  // Schema.org Configuration
  // ==========================================
  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Loogy Store',
      url: process.env.NUXT_PUBLIC_SITE_URL || 'loogy-dashboard.vercel.app',
      logo: '/logo.png'
    }
  },

  // ==========================================
  // Sitemap Configuration
  // ==========================================
  sitemap: {
    // Dynamic sources for products and categories
    sources: [
      '/api/__sitemap__/products',
      '/api/__sitemap__/categories'
    ],
    // Exclude non-indexable routes
    exclude: ['/admin/**', '/cart', '/checkout', '/wishlist']
  }
})
