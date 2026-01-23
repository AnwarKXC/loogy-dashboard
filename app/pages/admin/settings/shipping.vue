<script setup lang="ts">
import { FetchError } from 'ofetch'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'default'
})

const toast = useToast()

// Types
interface Governorate {
  id: number
  slug: string
  nameEn: string
  nameAr: string
  isActive: boolean
  shippingZoneId: number | null
  shippingZone: { id: number, name: string, price: number } | null
  areasCount: number
}

interface ShippingZone {
  id: number
  name: string
  price: number
  freeShippingThreshold: number | null
  estimatedDays: string | null
  isActive: boolean
  displayOrder: number
  governorates: Array<{ id: number, nameEn: string, nameAr: string, slug: string }>
}

// Fetch data
const { data: zonesData, pending: zonesPending, refresh: refreshZones } = await useFetch<{ zones: ShippingZone[] }>('/api/superadmin/shipping/zones')
const { data: governoratesData, refresh: refreshGovernorates } = await useFetch<{ governorates: Governorate[] }>('/api/superadmin/shipping/governorates')

const zones = computed(() => zonesData.value?.zones || [])
const allGovernorates = computed(() => governoratesData.value?.governorates || [])

// Get governorates that are not assigned to any zone
const unassignedGovernorates = computed(() => {
  return allGovernorates.value.filter(g => !g.shippingZoneId)
})

// Zone form schema
const zoneSchema = z.object({
  name: z.string().min(1, 'Zone name is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  freeShippingThreshold: z.coerce.number().min(0).nullable().optional(),
  estimatedDays: z.string().nullable().optional(),
  governorateIds: z.array(z.number()).default([])
})

type ZoneFormData = z.infer<typeof zoneSchema>

// Modal state
const showZoneModal = ref(false)
const editingZone = ref<ShippingZone | null>(null)
const saving = ref(false)

const zoneForm = reactive<ZoneFormData>({
  name: '',
  price: 0,
  freeShippingThreshold: null,
  estimatedDays: '',
  governorateIds: []
})

// Selected governorates for display
const selectedNewGov = ref<number | undefined>(undefined)

function openAddZone() {
  editingZone.value = null
  Object.assign(zoneForm, {
    name: '',
    price: 0,
    freeShippingThreshold: null,
    estimatedDays: '',
    governorateIds: []
  })
  showZoneModal.value = true
}

function openEditZone(zone: ShippingZone) {
  editingZone.value = zone
  Object.assign(zoneForm, {
    name: zone.name,
    price: zone.price,
    freeShippingThreshold: zone.freeShippingThreshold,
    estimatedDays: zone.estimatedDays || '',
    governorateIds: zone.governorates.map(g => g.id)
  })
  showZoneModal.value = true
}

function addGovernorateToZone() {
  if (selectedNewGov.value !== undefined && !zoneForm.governorateIds.includes(selectedNewGov.value)) {
    zoneForm.governorateIds.push(selectedNewGov.value)
    selectedNewGov.value = undefined
  }
}

function removeGovernorateFromZone(govId: number) {
  const idx = zoneForm.governorateIds.indexOf(govId)
  if (idx > -1) {
    zoneForm.governorateIds.splice(idx, 1)
  }
}

function getGovernorateName(id: number) {
  const gov = allGovernorates.value.find(g => g.id === id)
  return gov ? `${gov.nameEn} (${gov.nameAr})` : `ID: ${id}`
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof FetchError) {
    return error.data?.statusMessage || error.data?.message || error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong'
}

async function handleSaveZone(event: FormSubmitEvent<ZoneFormData>) {
  saving.value = true

  try {
    const payload = {
      name: event.data.name,
      price: event.data.price,
      freeShippingThreshold: event.data.freeShippingThreshold || null,
      estimatedDays: event.data.estimatedDays || null,
      governorateIds: event.data.governorateIds
    }

    if (editingZone.value) {
      // Update existing zone
      await $fetch(`/api/superadmin/shipping/zones/${editingZone.value.id}`, {
        method: 'PATCH',
        body: payload
      })
      toast.add({ title: 'Shipping zone updated', color: 'success' })
    } else {
      // Create new zone
      await $fetch('/api/superadmin/shipping/zones', {
        method: 'POST',
        body: payload
      })
      toast.add({ title: 'Shipping zone created', color: 'success' })
    }

    showZoneModal.value = false
    await Promise.all([refreshZones(), refreshGovernorates()])
  } catch (error) {
    toast.add({
      title: 'Operation failed',
      description: resolveErrorMessage(error),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function deleteZone(zone: ShippingZone) {
  if (!confirm(`Are you sure you want to delete "${zone.name}"? All governorates will be unassigned.`)) {
    return
  }

  try {
    await $fetch(`/api/superadmin/shipping/zones/${zone.id}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Shipping zone deleted', color: 'success' })
    await Promise.all([refreshZones(), refreshGovernorates()])
  } catch (error) {
    toast.add({
      title: 'Delete failed',
      description: resolveErrorMessage(error),
      color: 'error'
    })
  }
}

// Available governorates for adding (exclude already selected)
const availableGovsForSelect = computed(() => {
  const assignedToThis = editingZone.value?.governorates.map(g => g.id) || []
  return allGovernorates.value
    .filter((g) => {
      // Include if: not assigned to any zone, OR already assigned to this zone but not yet in form
      const canAdd = !g.shippingZoneId || assignedToThis.includes(g.id)
      const notAlreadySelected = !zoneForm.governorateIds.includes(g.id)
      return canAdd && notAlreadySelected
    })
    .map(g => ({
      label: `${g.nameEn} (${g.nameAr})`,
      value: g.id
    }))
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Add Button -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Shipping Zones
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure shipping prices for different governorates. Group governorates into zones with the same shipping cost.
        </p>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-plus"
        @click="openAddZone"
      >
        Add Shipping Zone
      </UButton>
    </div>

    <UPageCard variant="subtle">
      <UAlert
        v-if="zonesPending"
        color="neutral"
        icon="i-lucide-loader"
        title="Loading shipping zones..."
        class="mb-4"
      />

      <!-- Zones List -->
      <div v-if="zones.length === 0 && !zonesPending" class="text-center py-12">
        <UIcon name="i-lucide-package" class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <p class="text-neutral-500">
          No shipping zones configured.
        </p>
        <p class="text-sm text-neutral-400 mt-1">
          Click "Add Shipping Zone" to create your first zone.
        </p>
      </div>

      <div class="space-y-4">
        <div
          v-for="zone in zones"
          :key="zone.id"
          class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="font-semibold text-lg flex items-center gap-2">
                {{ zone.name }}
                <UBadge color="success" variant="subtle" class="text-sm">
                  {{ zone.price }} EGP
                </UBadge>
              </h3>
              <div class="text-sm text-neutral-500 mt-1 space-x-4">
                <span v-if="zone.estimatedDays">
                  <UIcon name="i-lucide-clock" class="w-4 h-4 inline" />
                  {{ zone.estimatedDays }}
                </span>
                <span v-if="zone.freeShippingThreshold">
                  <UIcon name="i-lucide-gift" class="w-4 h-4 inline" />
                  Free over {{ zone.freeShippingThreshold }} EGP
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-pencil"
                @click="openEditZone(zone)"
              />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="deleteZone(zone)"
              />
            </div>
          </div>

          <!-- Governorates in this zone -->
          <div v-if="zone.governorates.length === 0" class="text-sm text-neutral-400 italic">
            No governorates assigned to this zone.
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <UBadge
              v-for="gov in zone.governorates"
              :key="gov.id"
              color="primary"
              variant="subtle"
              class="text-sm"
            >
              {{ gov.nameEn }} ({{ gov.nameAr }})
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Unassigned Governorates Warning -->
      <UAlert
        v-if="unassignedGovernorates.length > 0"
        color="warning"
        icon="i-lucide-alert-triangle"
        class="mt-6"
      >
        <template #title>
          {{ unassignedGovernorates.length }} governorate(s) without shipping zone
        </template>
        <template #description>
          <div class="flex flex-wrap gap-1 mt-2">
            <UBadge
              v-for="gov in unassignedGovernorates"
              :key="gov.id"
              color="warning"
              variant="subtle"
              size="sm"
            >
              {{ gov.nameEn }}
            </UBadge>
          </div>
        </template>
      </UAlert>
    </UPageCard>

    <!-- Zone Modal -->
    <UModal v-model:open="showZoneModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ editingZone ? 'Edit Shipping Zone' : 'Add Shipping Zone' }}
              </h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="showZoneModal = false"
              />
            </div>
          </template>

          <UForm
            :state="zoneForm"
            :schema="zoneSchema"
            class="space-y-4"
            @submit="handleSaveZone"
          >
            <UFormField label="Zone Name" name="name" required>
              <UInput
                v-model="zoneForm.name"
                placeholder="e.g., Cairo & Giza, Remote Areas"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Shipping Price (EGP)" name="price" required>
                <UInput
                  v-model.number="zoneForm.price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50"
                />
              </UFormField>

              <UFormField label="Free Shipping Threshold (EGP)" name="freeShippingThreshold">
                <UInput
                  v-model.number="zoneForm.freeShippingThreshold"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                />
              </UFormField>
            </div>

            <UFormField label="Estimated Delivery Time" name="estimatedDays">
              <UInput
                v-model="zoneForm.estimatedDays"
                placeholder="e.g., 2-3 days"
              />
            </UFormField>

            <!-- Governorates Selection -->
            <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <legend class="text-sm font-semibold px-2">
                Governorates
              </legend>
              <p class="text-sm text-neutral-500 mb-3">
                Select which governorates belong to this shipping zone.
              </p>

              <div class="flex items-center gap-3 mb-3">
                <USelectMenu
                  v-model="selectedNewGov"
                  :items="availableGovsForSelect"
                  value-key="value"
                  placeholder="Select governorate to add..."
                  searchable
                  class="flex-1"
                />
                <UButton
                  color="primary"
                  variant="soft"
                  icon="i-lucide-plus"
                  :disabled="!selectedNewGov"
                  @click="addGovernorateToZone"
                >
                  Add
                </UButton>
              </div>

              <div v-if="zoneForm.governorateIds.length === 0" class="text-sm text-neutral-500 italic text-center py-3">
                No governorates selected.
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="govId in zoneForm.governorateIds"
                  :key="govId"
                  color="primary"
                  variant="subtle"
                  class="text-sm"
                >
                  {{ getGovernorateName(govId) }}
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-x"
                    class="ml-1 -mr-1"
                    @click="removeGovernorateFromZone(govId)"
                  />
                </UBadge>
              </div>
            </fieldset>

            <div class="flex justify-end gap-3 pt-4">
              <UButton
                color="neutral"
                variant="ghost"
                @click="showZoneModal = false"
              >
                Cancel
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="saving"
                icon="i-lucide-save"
              >
                {{ editingZone ? 'Update Zone' : 'Create Zone' }}
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
