<script setup lang="ts">
const { locale, setLocale } = useI18n()

const languages = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'ar', label: 'عربي', flag: '🇪🇬' }
]

const currentLang = computed(() => languages.find(l => l.code === locale.value) || languages[0])
const otherLang = computed(() => languages.find(l => l.code !== locale.value) || languages[1])

const toggleLanguage = () => {
  setLocale(otherLang.value.code)
}
</script>

<template>
  <button
    class="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
    @click="toggleLanguage"
  >
    <!-- Current Language -->
    <span class="text-lg">{{ currentLang.flag }}</span>
    <span class="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
      {{ currentLang.label }}
    </span>

    <!-- Switch indicator -->
    <UIcon
      name="i-lucide-repeat-2"
      class="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 transition-colors"
    />

    <!-- Tooltip showing target language -->
    <span class="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {{ locale === 'ar' ? 'Switch to English' : 'التبديل للعربية' }}
    </span>
  </button>
</template>
