<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tickets</h1>
        <p class="text-gray-500 mt-1">Suivi des demandes clients</p>
      </div>
      <button @click="showModal = true" class="btn-primary">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nouveau ticket
      </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-6">
      <button
        v-for="f in filters"
        :key="f.value"
        @click="activeFilter = f.value"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="activeFilter === f.value
          ? 'bg-indigo-600 text-white'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
      >
        {{ f.label }}
        <span class="ml-1 text-xs opacity-70">({{ countByStatus(f.value) }})</span>
      </button>
    </div>

    <!-- Tickets list -->
    <div class="space-y-3">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="spinner"></div>
      </div>
      <div v-else-if="filteredTickets.length === 0" class="card text-center py-12 text-gray-400">
        <svg class="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
        </svg>
        <p class="text-sm">Aucun ticket</p>
      </div>
      <div
        v-else
        v-for="ticket in filteredTickets"
        :key="ticket.id"
        class="card hover:shadow-sm transition-shadow cursor-pointer"
        @click="openTicket(ticket)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-1">
              <span class="text-xs font-mono text-gray-400">#{{ ticket.id.slice(0, 8) }}</span>
              <span :class="`badge badge-${ticket.status}`">{{ statusLabel(ticket.status) }}</span>
              <span :class="`badge badge-${priorityClass(ticket.priority)}`">{{ ticket.priority }}</span>
            </div>
            <h3 class="font-semibold text-gray-900 truncate">{{ ticket.title }}</h3>
            <p class="text-sm text-gray-500 mt-0.5 line-clamp-1">{{ ticket.description }}</p>
          </div>
          <div class="ml-4 text-right flex-shrink-0">
            <p class="text-sm text-gray-500">{{ ticket.client?.name || '—' }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(ticket.created_at) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Nouveau ticket</h2>
        <form @submit.prevent="createTicket" class="space-y-4">
          <div>
            <label class="form-label">Titre *</label>
            <input v-model="form.title" type="text" required class="form-input" placeholder="Résumé du problème" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Client</label>
              <select v-model="form.client_id" class="form-input">
                <option value="">Sans client</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Priorité</label>
              <select v-model="form.priority" class="form-input">
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label class="form-label">Description</label>
            <textarea v-model="form.description" rows="3" class="form-input" placeholder="Description détaillée..."></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeModal" class="btn-secondary flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn-primary flex-1">
              {{ saving ? 'Création...' : 'Créer le ticket' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedTicket" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div class="flex items-start justify-between mb-6">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-mono text-gray-400">#{{ selectedTicket.id.slice(0, 8) }}</span>
              <span :class="`badge badge-${selectedTicket.status}`">{{ statusLabel(selectedTicket.status) }}</span>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">{{ selectedTicket.title }}</h2>
          </div>
          <button @click="selectedTicket = null" class="p-2 hover:bg-gray-100 rounded-lg">
            <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p class="text-gray-600 mb-6">{{ selectedTicket.description || 'Aucune description.' }}</p>
        <div class="flex items-center gap-3 mb-6">
          <label class="form-label mb-0">Statut :</label>
          <select
            :value="selectedTicket.status"
            @change="updateStatus(selectedTicket.id, $event.target.value)"
            class="form-input w-auto"
          >
            <option value="open">Ouvert</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>
        </div>
        <!-- Comments -->
        <div class="border-t border-gray-200 pt-4">
          <h3 class="font-semibold text-gray-900 mb-3">Commentaires ({{ selectedTicket.comments?.length || 0 }})</h3>
          <div class="space-y-3 mb-4">
            <div v-for="comment in selectedTicket.comments" :key="comment.id" class="bg-gray-50 rounded-xl p-3">
              <p class="text-sm text-gray-700">{{ comment.content }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ formatDate(comment.created_at) }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <input v-model="newComment" type="text" placeholder="Ajouter un commentaire..." class="form-input flex-1" @keyup.enter="addComment" />
            <button @click="addComment" class="btn-primary">Envoyer</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const tickets = ref([])
const clients = ref([])
const loading = ref(false)
const showModal = ref(false)
const saving = ref(false)
const selectedTicket = ref(null)
const newComment = ref('')
const activeFilter = ref('all')

const form = reactive({ title: '', description: '', client_id: '', priority: 'medium' })

const filters = [
  { value: 'all', label: 'Tous' },
  { value: 'open', label: 'Ouverts' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'resolved', label: 'Résolus' },
  { value: 'closed', label: 'Fermés' },
]

const filteredTickets = computed(() =>
  activeFilter.value === 'all' ? tickets.value : tickets.value.filter(t => t.status === activeFilter.value)
)

function countByStatus(status) {
  if (status === 'all') return tickets.value.length
  return tickets.value.filter(t => t.status === status).length
}

onMounted(async () => {
  loading.value = true
  const [{ data: t }, { data: c }] = await Promise.all([
    supabase.from('tickets').select('*, client:clients(name)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').order('name')
  ])
  tickets.value = t || []
  clients.value = c || []
  loading.value = false
})

async function createTicket() {
  saving.value = true
  const { data, error } = await supabase.from('tickets').insert({
    ...form,
    status: 'open'
  }).select('*, client:clients(name)').single()
  if (!error) {
    tickets.value.unshift(data)
    closeModal()
  }
  saving.value = false
}

function closeModal() {
  showModal.value = false
  Object.assign(form, { title: '', description: '', client_id: '', priority: 'medium' })
}

async function openTicket(ticket) {
  const { data } = await supabase.from('ticket_comments').select('*').eq('ticket_id', ticket.id).order('created_at')
  selectedTicket.value = { ...ticket, comments: data || [] }
}

async function updateStatus(id, status) {
  await supabase.from('tickets').update({ status }).eq('id', id)
  const idx = tickets.value.findIndex(t => t.id === id)
  if (idx !== -1) tickets.value[idx].status = status
  if (selectedTicket.value?.id === id) selectedTicket.value.status = status
}

async function addComment() {
  if (!newComment.value.trim()) return
  const { data } = await supabase.from('ticket_comments').insert({
    ticket_id: selectedTicket.value.id,
    content: newComment.value
  }).select().single()
  if (data) {
    selectedTicket.value.comments.push(data)
    newComment.value = ''
  }
}

function statusLabel(s) {
  return { open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé' }[s] || s
}

function priorityClass(p) {
  return { low: 'completed', medium: 'sent', high: 'draft', urgent: 'cancelled' }[p] || 'draft'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '—'
}
</script>
