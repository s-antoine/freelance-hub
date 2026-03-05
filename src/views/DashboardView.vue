<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="kpi in kpis" :key="kpi.label" class="bg-white rounded-2xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-medium text-gray-500">{{ kpi.label }}</span>
          <div :class="`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center`">
            <component :is="kpi.icon" :class="`w-5 h-5 ${kpi.color}`" />
          </div>
        </div>
        <div class="text-2xl font-bold text-gray-900">{{ kpi.value }}</div>
        <div class="text-sm text-gray-500 mt-1">{{ kpi.sub }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Dernières factures -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900">Dernières factures</h2>
          <RouterLink to="/invoices" class="text-sm text-indigo-600 hover:text-indigo-700">Voir tout</RouterLink>
        </div>
        <div v-if="recentInvoices.length === 0" class="text-center py-8 text-gray-400">
          <DocumentTextIcon class="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p class="text-sm">Aucune facture</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="inv in recentInvoices"
            :key="inv.id"
            class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div>
              <p class="text-sm font-medium text-gray-900">{{ inv.number }}</p>
              <p class="text-xs text-gray-500">{{ inv.client?.name }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(inv.total) }}</p>
              <span :class="`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(inv.status)}`">
                {{ statusLabel(inv.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Clients actifs -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900">Clients récents</h2>
          <RouterLink to="/clients" class="text-sm text-indigo-600 hover:text-indigo-700">Voir tout</RouterLink>
        </div>
        <div v-if="recentClients.length === 0" class="text-center py-8 text-gray-400">
          <UsersIcon class="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p class="text-sm">Aucun client</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="client in recentClients"
            :key="client.id"
            class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span class="text-indigo-700 text-sm font-bold">{{ client.name.charAt(0) }}</span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ client.name }}</p>
              <p class="text-xs text-gray-500">{{ client.email }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useInvoicesStore } from '@/stores/invoices'
import { useClientsStore } from '@/stores/clients'
import {
  DocumentTextIcon,
  UsersIcon,
  CurrencyEuroIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

const invoicesStore = useInvoicesStore()
const clientsStore = useClientsStore()

onMounted(async () => {
  await Promise.all([invoicesStore.fetchInvoices(), clientsStore.fetchClients()])
})

const recentInvoices = computed(() => invoicesStore.invoices.slice(0, 5))
const recentClients = computed(() => clientsStore.clients.slice(0, 5))

const totalRevenue = computed(() =>
  invoicesStore.invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0)
)
const pendingAmount = computed(() =>
  invoicesStore.invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + (i.total || 0), 0)
)

const kpis = computed(() => [
  {
    label: 'Revenus du mois',
    value: formatCurrency(totalRevenue.value),
    sub: 'Factures payées',
    icon: CurrencyEuroIcon,
    bg: 'bg-green-50',
    color: 'text-green-600'
  },
  {
    label: 'En attente',
    value: formatCurrency(pendingAmount.value),
    sub: `${invoicesStore.invoices.filter(i => i.status === 'sent').length} facture(s)`,
    icon: ClockIcon,
    bg: 'bg-amber-50',
    color: 'text-amber-600'
  },
  {
    label: 'Clients actifs',
    value: clientsStore.clients.length,
    sub: 'Total clients',
    icon: UsersIcon,
    bg: 'bg-blue-50',
    color: 'text-blue-600'
  },
  {
    label: 'Factures totales',
    value: invoicesStore.invoices.length,
    sub: 'Toutes factures',
    icon: DocumentTextIcon,
    bg: 'bg-indigo-50',
    color: 'text-indigo-600'
  }
])

function formatCurrency(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

function statusLabel(s) {
  return { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', cancelled: 'Annulée' }[s] || s
}

function statusClass(s) {
  return {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }[s] || 'bg-gray-100 text-gray-600'
}
</script>
