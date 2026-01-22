<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

useSeoMeta({
  title: 'Collections',
  description: 'Discover our carefully curated collections for every occasion and taste. Seasonal selections at competitive prices.',
  ogTitle: 'Collections',
  ogDescription: 'Discover our carefully curated collections for every occasion and taste.',
  twitterCard: 'summary_large_image',
  robots: 'index, follow'
})

// Dynamic OG Image
defineOgImageComponent('Default', {
  title: 'Collections',
  description: 'Discover our carefully curated collections'
})

// Schema.org
useSchemaOrg([
  defineWebPage({
    '@type': 'CollectionPage',
    'name': 'Collections',
    'description': 'Discover our carefully curated collections for every occasion and taste.'
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Collections' }
    ]
  })
])

const collections = [
  {
    id: 1,
    title: 'Summer 2024',
    subtitle: 'Sun-kissed Aesthetics',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop',
    count: 42
  },
  {
    id: 2,
    title: 'Winter Essentials',
    subtitle: 'Cold Wave Layers',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
    count: 35
  },
  {
    id: 3,
    title: 'Street Edit',
    subtitle: 'Urban Landscapes',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1887&auto=format&fit=crop',
    count: 28
  },
  {
    id: 4,
    title: 'Formal Wear',
    subtitle: 'Evening Elegance',
    image: 'https://images.unsplash.com/photo-1594938633033-9bc733ae6327?q=80&w=1974&auto=format&fit=crop',
    count: 15
  },
  {
    id: 5,
    title: 'Footwear',
    subtitle: 'Sneaker Culture',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
    count: 64
  },
  {
    id: 6,
    title: 'Accessories',
    subtitle: 'Finishing Touches',
    image: 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?q=80&w=2070&auto=format&fit=crop',
    count: 89
  }
]
</script>

<template>
  <div class="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
    <main class="flex-grow pt-20 pb-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-5xl lg:text-7xl font-serif font-black uppercase leading-none mb-4">
          Curated<br>Collections
        </h1>
        <p class="text-neutral-500 max-w-xl mb-16 text-lg">
          Explore our seasonally curated edits, designed to bring a modern edge to your wardrobe staples.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <NuxtLink
            v-for="collection in collections"
            :key="collection.id"
            to="/products"
            class="group relative block aspect-[4/3] overflow-hidden rounded-sm"
          >
            <img :src="collection.image" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" :alt="collection.title">
            <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

            <div class="absolute bottom-0 left-0 p-8 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div class="border-l-2 border-white pl-4 mb-2">
                <h2 class="text-3xl lg:text-4xl text-white font-serif font-bold">{{ collection.title }}</h2>
                <p class="text-white/80 text-sm font-medium uppercase tracking-widest mt-1">{{ collection.subtitle }}</p>
              </div>
              <div class="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                <span class="text-xs font-bold uppercase tracking-wider">Explore {{ collection.count }} Products</span>
                <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>
