<template>
  <div class="p-4 md:p-8">
    <div class="flex items-start justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Clients</h1>
        <p class="text-gray-500 mt-1">{{ clientsStore.clients.length }} client(s)</p>
      </div>
      <button @click="showModal = true" class="btn-primary shrink-0">
        <PlusIcon class="w-4 h-4" />
        <span class="hidden sm:inline">Nouveau client</span>
        <span class="sm:hidden">Nouveau</span>
      </button>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <input
        v-model="search"
        type="text"
        placeholder="Rechercher un client..."
        class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <!-- État vide/chargement -->
    <div v-if="clientsStore.loading" class="flex items-center justify-center py-12">
      <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
    <div v-else-if="filtered.length === 0" class="bg-white rounded-2xl border border-gray-200 text-center py-12 text-gray-400">
      <UsersIcon class="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p>Aucun client trouvé</p>
    </div>

    <!-- Vue mobile : cards -->
    <div v-else class="md:hidden space-y-3">
      <div
        v-for="client in filtered"
        :key="client.id"
        class="bg-white rounded-2xl border border-gray-200 p-4"
      >
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span class="text-indigo-700 font-bold">{{ client.name.charAt(0) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900">{{ client.name }}</p>
            <p class="text-sm text-gray-500 truncate">{{ client.company || client.email }}</p>
          </div>
          <div class="flex items-center gap-1">
            <button @click="editClient(client)" class="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
              <PencilIcon class="w-4 h-4" />
            </button>
            <button @click="confirmDelete(client)" class="p-2 text-gray-400 hover:text-red-600 transition-colors">
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
          <span v-if="client.email" class="truncate col-span-2">📧 {{ client.email }}</span>
          <span v-if="client.phone">📞 {{ client.phone }}</span>
          <span v-if="client.city">📍 {{ client.city }}</span>
        </div>
      </div>
    </div>

    <!-- Vue desktop : table -->
    <div v-if="!clientsStore.loading && filtered.length > 0" class="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="client in filtered" :key="client.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span class="text-indigo-700 text-sm font-bold">{{ client.name.charAt(0) }}</span>
                </div>
                <span class="font-medium text-gray-900">{{ client.name }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ client.email }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ client.phone || '—' }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ client.company || '—' }}</td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2 justify-end">
                <button @click="editClient(client)" class="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors">
                  <PencilIcon class="w-4 h-4" />
                </button>
                <button @click="confirmDelete(client)" class="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div class="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
        <h2 class="text-lg font-semibold text-gray-900 mb-6">
          {{ editing ? 'Modifier le client' : 'Nouveau client' }}
        </h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="form-label">Nom complet *</label>
              <input v-model="form.name" type="text" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Email *</label>
              <input v-model="form.email" type="email" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Téléphone</label>
              <input v-model="form.phone" type="tel" class="form-input" />
            </div>
            <div class="sm:col-span-2">
              <label class="form-label">Entreprise</label>
              <input v-model="form.company" type="text" class="form-input" />
            </div>
            <div class="sm:col-span-2">
              <label class="form-label">Adresse</label>
              <textarea v-model="form.address" rows="2" class="form-input"></textarea>
            </div>
            <div>
              <label class="form-label">Ville</label>
              <input v-model="form.city" type="text" class="form-input" />
            </div>
            <div>
              <label class="form-label">Pays</label>
              <input v-model="form.country" type="text" class="form-input" />
            </div>
          </div>
          <div v-if="error" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{{ error }}</div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeModal" class="btn-secondary flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn-primary flex-1">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useClientsStore } from '@/stores/clients'
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from '@heroicons/vue/24/outline'

const clientsStore = useClientsStore()
const search = ref('')
const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)
const error = ref('')

const form = reactive({ name: '', email: '', phone: '', company: '', address: '', city: '', country: '' })

const filtered = computed(() =>
  clientsStore.clients.filter(c =>
    c.name.toLowerCase().includes(search.value.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.value.toLowerCase())
  )
)

onMounted(() => clientsStore.fetchClients())

function editClient(client) {
  editing.value = client
  Object.assign(form, client)
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
  Object.assign(form, { name: '', email: '', phone: '', company: '', address: '', city: '', country: '' })
  error.value = ''
}

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    if (editing.value) {
      await clientsStore.updateClient(editing.value.id, form)
    } else {
      await clientsStore.createClient(form)
    }
    closeModal()
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

async function confirmDelete(client) {
  if (confirm(`Supprimer ${client.name} ?`)) {
    await clientsStore.deleteClient(client.id)
  }
}
</script>
