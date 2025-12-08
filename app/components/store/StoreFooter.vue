<template>
  <UFooter class="border-t border-default/60 bg-white/80 backdrop-blur">
    <template #left>
      <p class="text-sm text-muted">
        © {{ new Date().getFullYear() }} Loogy. All rights reserved.
      </p>
    </template>

    <UNavigationMenu
      variant="link"
      :items="[
        { label: 'Privacy', to: '/privacy' },
        { label: 'Terms', to: '/terms' },
        { label: 'Support', to: '/support' }
      ] "
    >
      <template #right>
        <div
          class="
      flex
      items-center
      gap-2"
        >
          <UButton icon="i-lucide-facebook" variant="ghost" aria-label="Facebook" />
          <UButton icon="i-lucide-instagram" variant="ghost" aria-label="Instagram" />
          <UButton icon="i-lucide-youtube" variant="ghost" aria-label="YouTube" />
        </div>
      </template>
    </UNavigationMenu>
  </UFooter>
</template>
