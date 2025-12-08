// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'motion-v/nuxt'
  ],

  devtools: {
    enabled: true
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    s3AccessKey: process.env.S3_ACCESS_KEY,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    s3Bucket: process.env.S3_BUCKET_NAME,
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    whatsappApiVersion: process.env.WHATSAPP_API_VERSION,
    adminWhatsappNumber: process.env.ADMIN_WHATSAPP_NUMBER,
    public: {
      // Prefer Nuxt public env, fall back to legacy SOCKET_URL
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || process.env.SOCKET_URL || 'http://localhost:3000'
    }
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    websocket: {
      enabled: true
    },
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
  }
})
