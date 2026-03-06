<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
        <ArrowLeftIcon class="w-5 h-5 text-gray-600" />
      </button>
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-gray-900">
          {{ isNew ? 'Nouvelle facture' : `Facture ${invoice.number}` }}
        </h1>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-gray-200 p-4 md:p-8">
      <!-- Infos client + dates -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="form-label">Client *</label>
          <select v-model="form.client_id" required class="form-input">
            <option value="">Sélectionner un client</option>
            <option v-for="c in clientsStore.clients" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Numéro de facture</label>
          <input v-model="form.number" type="text" class="form-input" />
        </div>
        <div>
          <label class="form-label">Date d'émission</label>
          <input v-model="form.issue_date" type="date" class="form-input" />
        </div>
        <div>
          <label class="form-label">Date d'échéance</label>
          <input v-model="form.due_date" type="date" class="form-input" />
        </div>
      </div>

      <!-- Prestations -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-900">Prestations</h3>
          <button @click="addItem" class="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <PlusIcon class="w-4 h-4" /> Ajouter
          </button>
        </div>

        <!-- Table items avec scroll horizontal sur mobile -->
        <div class="border border-gray-200 rounded-xl overflow-x-auto">
          <table class="w-full min-w-[480px]">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-3 text-xs text-gray-500 font-medium">Description</th>
                <th class="text-right px-4 py-3 text-xs text-gray-500 font-medium w-20">Qté</th>
                <th class="text-right px-4 py-3 text-xs text-gray-500 font-medium w-28">Prix unit.</th>
                <th class="text-right px-4 py-3 text-xs text-gray-500 font-medium w-28">Total</th>
                <th class="w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, i) in items" :key="i">
                <td class="px-4 py-2">
                  <input v-model="item.description" type="text" placeholder="Description" class="w-full text-sm border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1.5" />
                </td>
                <td class="px-4 py-2">
                  <input v-model.number="item.quantity" type="number" min="0" step="0.5" class="w-full text-sm text-right border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1.5" />
                </td>
                <td class="px-4 py-2">
                  <input v-model.number="item.unit_price" type="number" min="0" step="0.01" class="w-full text-sm text-right border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1.5" />
                </td>
                <td class="px-4 py-2 text-sm text-right font-medium whitespace-nowrap">
                  {{ formatCurrency(item.quantity * item.unit_price) }}
                </td>
                <td class="px-4 py-2">
                  <button @click="items.splice(i, 1)" class="text-gray-400 hover:text-red-600">
                    <XMarkIcon class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Totaux -->
      <div class="flex justify-end mb-6">
        <div class="w-full sm:w-64 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Sous-total HT</span>
            <span class="font-medium">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm gap-3">
            <span class="text-gray-500">TVA (%)</span>
            <input v-model.number="form.tax_rate" type="number" min="0" max="100" step="0.5" class="w-20 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">TVA</span>
            <span>{{ formatCurrency(taxAmount) }}</span>
          </div>
          <div class="flex justify-between font-semibold text-base border-t border-gray-200 pt-2">
            <span>Total TTC</span>
            <span>{{ formatCurrency(total) }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="mb-6">
        <label class="form-label">Notes / Conditions de paiement</label>
        <textarea v-model="form.notes" rows="3" placeholder="Ex: Paiement à 30 jours..." class="form-input"></textarea>
      </div>

      <div v-if="error" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{{ error }}</div>

      <!-- Boutons -->
      <div class="flex flex-wrap gap-3">
        <button @click="router.back()" class="btn-secondary">Annuler</button>
        <button @click="save('draft')" :disabled="saving" class="btn-secondary">
          Brouillon
        </button>
        <button @click="save('sent')" :disabled="saving" class="btn-primary sm:ml-auto">
          {{ saving ? 'Enregistrement...' : 'Créer & Envoyer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInvoicesStore } from '@/stores/invoices'
import { useClientsStore } from '@/stores/clients'
import { PlusIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const invoicesStore = useInvoicesStore()
const clientsStore = useClientsStore()

const isNew = computed(() => route.params.id === 'new')
const invoice = ref({})
const saving = ref(false)
const error = ref('')

const form = reactive({
  client_id: '',
  number: generateInvoiceNumber(),
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  tax_rate: 20,
  notes: ''
})

const items = ref([{ description: '', quantity: 1, unit_price: 0 }])

const subtotal = computed(() => items.value.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0))
const taxAmount = computed(() => subtotal.value * (form.tax_rate / 100))
const total = computed(() => subtotal.value + taxAmount.value)

function generateInvoiceNumber() {
  const now = new Date()
  return `FAC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`
}

function addItem() {
  items.value.push({ description: '', quantity: 1, unit_price: 0 })
}

function formatCurrency(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

onMounted(async () => {
  await clientsStore.fetchClients()
  if (!isNew.value) {
    invoice.value = await invoicesStore.fetchInvoice(route.params.id)
    Object.assign(form, invoice.value)
    items.value = invoice.value.items || []
  }
  if (!form.due_date) {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    form.due_date = d.toISOString().split('T')[0]
  }
})

async function save(status) {
  if (!form.client_id) { error.value = 'Veuillez sélectionner un client'; return }
  saving.value = true
  error.value = ''
  try {
    await invoicesStore.createInvoice({
      ...form,
      status,
      subtotal: subtotal.value,
      tax_amount: taxAmount.value,
      total: total.value
    }, items.value)
    router.push('/invoices')
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
