// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: [
      'prisma/generated/**',
      'server/generated/**',
      'app/generated/**',
      'shared/generated/**'
    ]
  },
  {
    rules: {
      'vue/no-multiple-template-root': 'off',
      'vue/max-attributes-per-line': ['error', { singleline: 3 }]
    }
  }
)
