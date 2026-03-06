<template>
  <div class="p-4 md:p-8">
    <div class="flex items-start justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Comptabilité</h1>
        <p class="text-gray-500 mt-1">Revenus, dépenses et rentabilité</p>
      </div>
      <button @click="showExpenseModal = true" class="btn-primary shrink-0">
        <PlusIcon class="w-4 h-4" />
        <span class="hidden sm:inline">Nouvelle dépense</span>
        <span class="sm:hidden">Dépense</span>
      </button>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm text-gray-500 mb-1">Revenus (factures payées)</p>
        <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totalRevenue) }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm text-gray-500 mb-1">Dépenses</p>
        <p class="text-2xl font-bold text-red-500">{{ formatCurrency(totalExpenses) }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm text-gray-500 mb-1">Bénéfice net</p>
        <p class="text-2xl font-bold" :class="profit >= 0 ? 'text-indigo-600' : 'text-red-600'">
          {{ formatCurrency(profit) }}
        </p>
      </div>
    </div>

    <!-- Expenses -->
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-200">
        <h2 class="font-semibold text-gray-900">Dépenses</h2>
      </div>

      <div v-if="expensesStore.loading" class="flex items-center justify-center py-12">
        <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
      <div v-else-if="expensesStore.expenses.length === 0" class="text-center py-12 text-gray-400">
        <CurrencyEuroIcon class="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Aucune dépense enregistrée</p>
      </div>

      <!-- Vue mobile : cards -->
      <div v-else class="md:hidden divide-y divide-gray-100">
        <div
          v-for="exp in expensesStore.expenses"
          :key="exp.id"
          class="flex items-center gap-3 px-4 py-3"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ exp.description }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-gray-400">{{ formatDate(exp.date) }}</span>
              <span v-if="exp.category" class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ exp.category }}</span>
            </div>
          </div>
          <span class="text-sm font-bold text-red-600 shrink-0">-{{ formatCurrency(exp.amount) }}</span>
          <button @click="expensesStore.deleteExpense(exp.id)" class="p-1.5 text-gray-400 hover:text-red-600 shrink-0">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Vue desktop : table -->
      <table v-if="expensesStore.expenses.length > 0" class="hidden md:table w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Catégorie</th>
            <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Montant</th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="exp in expensesStore.expenses" :key="exp.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(exp.date) }}</td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ exp.description }}</td>
            <td class="px-6 py-4">
              <span class="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{{ exp.category || '—' }}</span>
            </td>
            <td class="px-6 py-4 text-sm font-semibold text-red-600 text-right">{{ formatCurrency(exp.amount) }}</td>
            <td class="px-6 py-4">
              <button @click="expensesStore.deleteExpense(exp.id)" class="p-1.5 text-gray-400 hover:text-red-600">
                <TrashIcon class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Expense Modal -->
    <div v-if="showExpenseModal" class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div class="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Nouvelle dépense</h2>
        <form @submit.prevent="handleExpense" class="space-y-4">
          <div>
            <label class="form-label">Description *</label>
            <input v-model="expForm.description" type="text" required class="form-input" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Montant (€) *</label>
              <input v-model.number="expForm.amount" type="number" min="0" step="0.01" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Date *</label>
              <input v-model="expForm.date" type="date" required class="form-input" />
            </div>
          </div>
          <div>
            <label class="form-label">Catégorie</label>
            <select v-model="expForm.category" class="form-input">
              <option value="">Sélectionner</option>
              <option>Matériel</option>
              <option>Logiciels & SaaS</option>
              <option>Formation</option>
              <option>Marketing</option>
              <option>Bureau & fournitures</option>
              <option>Transport</option>
              <option>Comptable</option>
              <option>Autre</option>
            </select>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="showExpenseModal = false" class="btn-secondary flex-1">Annuler</button>
            <button type="submit" :disabled="savingExp" class="btn-primary flex-1">
              {{ savingExp ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useExpensesStore } from '@/stores/expenses'
import { useInvoicesStore } from '@/stores/invoices'
import { PlusIcon, CurrencyEuroIcon, TrashIcon } from '@heroicons/vue/24/outline'

const expensesStore = useExpensesStore()
const invoicesStore = useInvoicesStore()
const showExpenseModal = ref(false)
const savingExp = ref(false)

const expForm = reactive({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: '' })

onMounted(async () => {
  await Promise.all([expensesStore.fetchExpenses(), invoicesStore.fetchInvoices()])
})

const totalRevenue = computed(() =>
  invoicesStore.invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0)
)
const totalExpenses = computed(() => expensesStore.expenses.reduce((sum, e) => sum + (e.amount || 0), 0))
const profit = computed(() => totalRevenue.value - totalExpenses.value)

async function handleExpense() {
  savingExp.value = true
  try {
    await expensesStore.createExpense(expForm)
    showExpenseModal.value = false
    Object.assign(expForm, { description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: '' })
  } finally {
    savingExp.value = false
  }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR')
}
</script>
