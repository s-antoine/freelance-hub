<template>
  <div class="p-4 md:p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Factures</h1>
        <p class="text-gray-500 mt-1">{{ invoicesStore.invoices.length }} facture(s)</p>
      </div>
      <RouterLink to="/invoices/new" class="btn-primary">
        <PlusIcon class="w-4 h-4" />
        Nouvelle facture
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-6">
      <button
        v-for="f in filters"
        :key="f.value"
        @click="activeFilter = f.value"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="activeFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
      >
        {{ f.label }}
        <span class="ml-1.5 text-xs opacity-75">({{ f.count.value }})</span>
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div v-if="invoicesStore.loading" class="flex items-center justify-center py-12">
        <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
      <div v-else-if="filtered.length === 0" class="text-center py-12 text-gray-400">
        <DocumentTextIcon class="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Aucune facture</p>
      </div>
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Numéro</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Échéance</th>
            <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Montant</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="inv in filtered" :key="inv.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 font-medium text-indigo-600">{{ inv.number }}</td>
            <td class="px-6 py-4 text-sm text-gray-900">{{ inv.client?.name }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(inv.issue_date) }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(inv.due_date) }}</td>
            <td class="px-6 py-4 text-sm font-semibold text-gray-900 text-right">{{ formatCurrency(inv.total) }}</td>
            <td class="px-6 py-4">
              <span :class="`text-xs px-2.5 py-1 rounded-full font-medium ${statusClass(inv.status)}`">
                {{ statusLabel(inv.status) }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2 justify-end">
                <select
                  :value="inv.status"
                  @change="updateStatus(inv.id, $event.target.value)"
                  class="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="draft">Brouillon</option>
                  <option value="sent">Envoyée</option>
                  <option value="paid">Payée</option>
                  <option value="cancelled">Annulée</option>
                </select>
                <button @click="invoicesStore.deleteInvoice(inv.id)" class="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useInvoicesStore } from '@/stores/invoices'
import { PlusIcon, DocumentTextIcon, TrashIcon } from '@heroicons/vue/24/outline'

const invoicesStore = useInvoicesStore()
const activeFilter = ref('all')

onMounted(() => invoicesStore.fetchInvoices())

const filters = [
  { value: 'all', label: 'Toutes', count: computed(() => invoicesStore.invoices.length) },
  { value: 'draft', label: 'Brouillons', count: computed(() => invoicesStore.invoices.filter(i => i.status === 'draft').length) },
  { value: 'sent', label: 'Envoyées', count: computed(() => invoicesStore.invoices.filter(i => i.status === 'sent').length) },
  { value: 'paid', label: 'Payées', count: computed(() => invoicesStore.invoices.filter(i => i.status === 'paid').length) },
]

const filtered = computed(() =>
  activeFilter.value === 'all'
    ? invoicesStore.invoices
    : invoicesStore.invoices.filter(i => i.status === activeFilter.value)
)

async function updateStatus(id, status) {
  await invoicesStore.updateInvoiceStatus(id, status)
}

function formatCurrency(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR')
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
