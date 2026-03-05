<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Time Tracking</h1>
        <p class="text-gray-500 mt-1">Suivez votre temps par projet</p>
      </div>
      <button @click="showModal = true" class="btn-primary">
        <PlusIcon class="w-4 h-4" />
        Ajouter une entrée
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <p class="text-sm text-gray-500 mb-1">Cette semaine</p>
        <p class="text-2xl font-bold text-indigo-600">{{ weeklyHours }}h</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <p class="text-sm text-gray-500 mb-1">Ce mois</p>
        <p class="text-2xl font-bold text-gray-900">{{ monthlyHours }}h</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <p class="text-sm text-gray-500 mb-1">Total heures</p>
        <p class="text-2xl font-bold text-gray-900">{{ totalHours }}h</p>
      </div>
    </div>

    <!-- Entries -->
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
      <div v-else-if="entries.length === 0" class="text-center py-12 text-gray-400">
        <ClockIcon class="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Aucune entrée de temps</p>
      </div>
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Projet</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
            <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Heures</th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="entry in entries" :key="entry.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(entry.date) }}</td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ entry.project?.name || '—' }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ entry.description || '—' }}</td>
            <td class="px-6 py-4 text-sm font-bold text-indigo-600 text-right">{{ entry.hours }}h</td>
            <td class="px-6 py-4">
              <button @click="deleteEntry(entry.id)" class="p-1.5 text-gray-400 hover:text-red-600">
                <TrashIcon class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Nouvelle entrée de temps</h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="form-label">Projet</label>
            <select v-model="form.project_id" class="form-input">
              <option value="">Sans projet</option>
              <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Heures *</label>
              <input v-model.number="form.hours" type="number" min="0.25" step="0.25" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Date *</label>
              <input v-model="form.date" type="date" required class="form-input" />
            </div>
          </div>
          <div>
            <label class="form-label">Description</label>
            <textarea v-model="form.description" rows="2" class="form-input" placeholder="Ce sur quoi vous avez travaillé..."></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="showModal = false" class="btn-secondary flex-1">Annuler</button>
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
import { useProjectsStore } from '@/stores/projects'
import { supabase } from '@/lib/supabase'
import { PlusIcon, ClockIcon, TrashIcon } from '@heroicons/vue/24/outline'

const projectsStore = useProjectsStore()
const entries = ref([])
const loading = ref(false)
const showModal = ref(false)
const saving = ref(false)

const form = reactive({ project_id: '', hours: 1, date: new Date().toISOString().split('T')[0], description: '' })

onMounted(async () => {
  loading.value = true
  await projectsStore.fetchProjects()
  const { data } = await supabase.from('time_entries').select('*, project:projects(name)').order('date', { ascending: false })
  entries.value = data || []
  loading.value = false
})

const now = new Date()
const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

const totalHours = computed(() => entries.value.reduce((s, e) => s + (e.hours || 0), 0))
const weeklyHours = computed(() => entries.value.filter(e => new Date(e.date) >= weekStart).reduce((s, e) => s + (e.hours || 0), 0))
const monthlyHours = computed(() => entries.value.filter(e => new Date(e.date) >= monthStart).reduce((s, e) => s + (e.hours || 0), 0))

async function handleSubmit() {
  saving.value = true
  const { data, error } = await supabase.from('time_entries').insert(form).select('*, project:projects(name)').single()
  if (!error) {
    entries.value.unshift(data)
    showModal.value = false
    Object.assign(form, { project_id: '', hours: 1, date: new Date().toISOString().split('T')[0], description: '' })
  }
  saving.value = false
}

async function deleteEntry(id) {
  await supabase.from('time_entries').delete().eq('id', id)
  entries.value = entries.value.filter(e => e.id !== id)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR')
}
</script>
