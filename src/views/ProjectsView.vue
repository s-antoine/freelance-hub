<template>
  <div class="p-4 md:p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Projets</h1>
        <p class="text-gray-500 mt-1">{{ projectsStore.projects.length }} projet(s)</p>
      </div>
      <button @click="showModal = true" class="btn-primary">
        <PlusIcon class="w-4 h-4" />
        Nouveau projet
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="projectsStore.loading" class="col-span-full text-center py-12 text-gray-400">
        <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
      </div>
      <div v-else-if="projectsStore.projects.length === 0" class="col-span-full text-center py-12 text-gray-400">
        <FolderIcon class="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Aucun projet</p>
      </div>
      <div
        v-else
        v-for="project in projectsStore.projects"
        :key="project.id"
        class="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="font-semibold text-gray-900">{{ project.name }}</h3>
            <p class="text-sm text-gray-500 mt-0.5">{{ project.client?.name }}</p>
          </div>
          <span :class="`text-xs px-2.5 py-1 rounded-full font-medium ${projectStatusClass(project.status)}`">
            {{ projectStatusLabel(project.status) }}
          </span>
        </div>
        <p v-if="project.description" class="text-sm text-gray-600 mb-4 line-clamp-2">{{ project.description }}</p>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">Budget</span>
          <span class="font-medium">{{ project.budget ? formatCurrency(project.budget) : '—' }}</span>
        </div>
        <div class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <button @click="editProject(project)" class="btn-secondary text-xs flex-1">Modifier</button>
          <button @click="confirmDelete(project)" class="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">
          {{ editing ? 'Modifier le projet' : 'Nouveau projet' }}
        </h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="form-label">Nom du projet *</label>
            <input v-model="form.name" type="text" required class="form-input" />
          </div>
          <div>
            <label class="form-label">Client *</label>
            <select v-model="form.client_id" required class="form-input">
              <option value="">Sélectionner un client</option>
              <option v-for="c in clientsStore.clients" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="form-label">Description</label>
            <textarea v-model="form.description" rows="2" class="form-input"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Budget (€)</label>
              <input v-model.number="form.budget" type="number" min="0" class="form-input" />
            </div>
            <div>
              <label class="form-label">Statut</label>
              <select v-model="form.status" class="form-input">
                <option value="active">Actif</option>
                <option value="paused">En pause</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
            <div>
              <label class="form-label">Date de début</label>
              <input v-model="form.start_date" type="date" class="form-input" />
            </div>
            <div>
              <label class="form-label">Date de fin</label>
              <input v-model="form.end_date" type="date" class="form-input" />
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
import { ref, reactive, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useClientsStore } from '@/stores/clients'
import { PlusIcon, FolderIcon, TrashIcon } from '@heroicons/vue/24/outline'

const projectsStore = useProjectsStore()
const clientsStore = useClientsStore()
const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)
const error = ref('')

const form = reactive({ name: '', client_id: '', description: '', budget: null, status: 'active', start_date: '', end_date: '' })

onMounted(async () => {
  await Promise.all([projectsStore.fetchProjects(), clientsStore.fetchClients()])
})

function editProject(p) {
  editing.value = p
  Object.assign(form, p)
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
  Object.assign(form, { name: '', client_id: '', description: '', budget: null, status: 'active', start_date: '', end_date: '' })
  error.value = ''
}

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    if (editing.value) {
      await projectsStore.updateProject(editing.value.id, form)
    } else {
      await projectsStore.createProject(form)
    }
    closeModal()
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

async function confirmDelete(p) {
  if (confirm(`Supprimer ${p.name} ?`)) {
    await projectsStore.deleteProject(p.id)
  }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)
}

function projectStatusLabel(s) {
  return { active: 'Actif', paused: 'En pause', completed: 'Terminé' }[s] || s
}

function projectStatusClass(s) {
  return {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-amber-100 text-amber-700',
    completed: 'bg-gray-100 text-gray-600'
  }[s] || 'bg-gray-100 text-gray-600'
}
</script>
