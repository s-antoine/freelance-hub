<template>
  <div class="p-4 md:p-8">

    <!-- Header -->
    <div class="flex items-start justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Missions 🎯</h1>
        <p class="text-gray-500 mt-0.5">
          <span v-if="store.newCount > 0" class="text-indigo-600 font-medium">{{ store.newCount }} nouvelle(s)</span>
          <span v-else>Veille des appels d'offres</span>
        </p>
      </div>
      <button
        @click="handleRefreshAll"
        :disabled="store.fetchingFeed"
        class="btn-primary shrink-0"
      >
        <span v-if="store.fetchingFeed" class="animate-spin inline-block">↻</span>
        <span v-else>↻</span>
        <span class="hidden sm:inline">Actualiser</span>
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        class="flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
        :class="activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">
        {{ tab.emoji }}
        <span class="hidden sm:inline">{{ tab.label }}</span>
        <span class="sm:hidden text-[10px]">{{ tab.short }}</span>
        <span v-if="tab.id === 'missions' && store.newCount > 0"
          class="bg-indigo-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
          {{ store.newCount }}
        </span>
      </button>
    </div>

    <!-- Toast -->
    <Transition name="slide-up">
      <div v-if="toast" class="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-gray-900 text-white text-sm rounded-xl p-3 z-50 shadow-lg">
        {{ toast }}
      </div>
    </Transition>

    <!-- ═══════════════════════════════
         TAB 1 : MISSIONS
    ═══════════════════════════════ -->
    <div v-show="activeTab === 'missions'">

      <!-- Filtres -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button v-for="f in statusFilters" :key="f.value"
          @click="filterStatus = f.value"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
          :class="filterStatus === f.value ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200'">
          {{ f.label }} ({{ f.count }})
        </button>
        <input v-model="searchQuery" placeholder="🔍 Filtrer..." class="form-input text-sm py-1.5 max-w-xs ml-auto" />
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="flex justify-center py-16">
        <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredMissions.length === 0" class="bg-white rounded-2xl border border-gray-200 text-center py-16 px-4">
        <p class="text-4xl mb-3">🔍</p>
        <p class="font-semibold text-gray-900 mb-1">Aucune mission trouvée</p>
        <p class="text-sm text-gray-500 mb-4">Configure des sources et clique sur Actualiser</p>
        <button @click="activeTab = 'sources'" class="btn-primary">Configurer les sources</button>
      </div>

      <!-- Mission cards -->
      <div v-else class="space-y-3">
        <div v-for="mission in filteredMissions" :key="mission.id"
          class="bg-white rounded-2xl border transition-colors"
          :class="mission.status === 'new' ? 'border-indigo-100 shadow-sm' : 'border-gray-200'">

          <!-- Corps de la card -->
          <div class="p-4">
            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <!-- Titre + badges -->
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <span :class="`text-xs font-medium px-2 py-0.5 rounded-full ${platformColor(mission.platform)}`">
                    {{ platformLabel(mission.platform) }}
                  </span>
                  <span v-if="mission.remote" class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">🌍 Remote</span>
                  <span v-if="mission.status === 'new'" class="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Nouveau</span>
                  <span v-if="mission.status === 'saved'" class="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">🔖 Sauvegardé</span>
                </div>

                <h3 class="font-semibold text-gray-900 text-sm leading-snug mb-1">{{ mission.title }}</h3>

                <p v-if="mission.description" class="text-xs text-gray-500 line-clamp-2 mb-2">
                  {{ stripHtml(mission.description) }}
                </p>

                <!-- Skills -->
                <div v-if="mission.skills?.length" class="flex flex-wrap gap-1 mb-2">
                  <span v-for="skill in mission.skills.slice(0, 6)" :key="skill"
                    class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {{ skill }}
                  </span>
                </div>

                <!-- Budget + date -->
                <div class="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span v-if="mission.budget_min">
                    💰 ~{{ Math.round(mission.budget_min) }}–{{ Math.round(mission.budget_max || mission.budget_min) }}€/j
                  </span>
                  <span>{{ formatDate(mission.published_at) }}</span>
                  <span v-if="mission.source?.name">via {{ mission.source.name }}</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <a v-if="mission.url" :href="mission.url" target="_blank" rel="noopener"
                @click="store.setStatus(mission.id, 'seen')"
                class="btn-primary text-xs py-1.5 flex-1 text-center">
                Voir la mission ↗
              </a>
              <button v-if="mission.status !== 'saved'"
                @click="store.setStatus(mission.id, 'saved')"
                class="btn-secondary text-xs py-1.5 px-3">🔖</button>
              <button v-else
                @click="store.setStatus(mission.id, 'seen')"
                class="btn-secondary text-xs py-1.5 px-3 text-amber-600">🔖</button>
              <button @click="store.setStatus(mission.id, 'dismissed')"
                class="p-2 text-gray-300 hover:text-red-400 transition-colors">✕</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════
         TAB 2 : SOURCES
    ═══════════════════════════════ -->
    <div v-show="activeTab === 'sources'" class="space-y-4">

      <!-- Sources list -->
      <div v-if="store.sources.length === 0" class="bg-white rounded-2xl border border-gray-200 text-center py-12">
        <p class="text-3xl mb-2">📡</p>
        <p class="font-semibold text-gray-900 mb-1">Aucune source configurée</p>
        <p class="text-sm text-gray-500 mb-4">Ajoute des flux RSS de plateformes freelance</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="src in store.sources" :key="src.id"
          class="bg-white rounded-2xl border border-gray-200 p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span :class="`text-xs px-2 py-0.5 rounded-full font-medium ${platformColor(src.platform)}`">
                  {{ platformLabel(src.platform) }}
                </span>
                <span v-if="!src.active" class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inactif</span>
              </div>
              <p class="font-medium text-sm text-gray-900">{{ src.name }}</p>
              <p class="text-xs text-gray-400 truncate">{{ src.feed_url }}</p>
              <div v-if="src.keywords?.length" class="flex flex-wrap gap-1 mt-1">
                <span v-for="kw in src.keywords" :key="kw" class="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{{ kw }}</span>
              </div>
              <p v-if="src.last_fetched_at" class="text-xs text-gray-400 mt-1">
                Dernière synchro : {{ formatDate(src.last_fetched_at) }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button @click="refreshOne(src)" :disabled="store.fetchingFeed"
                class="p-2 text-gray-400 hover:text-indigo-600 transition-colors text-sm"
                title="Actualiser">↻</button>
              <button @click="store.toggleSource(src.id)"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                :class="src.active ? 'bg-indigo-600' : 'bg-gray-200'">
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="src.active ? 'translate-x-4' : 'translate-x-0.5'"></span>
              </button>
              <button @click="editSource(src)" class="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors">✏️</button>
              <button @click="confirmDeleteSource(src.id)" class="p-1.5 text-gray-400 hover:text-red-500 transition-colors">🗑</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Templates rapides -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-3">⚡ Sources prêtes à l'emploi</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button v-for="tpl in sourceTemplates" :key="tpl.name"
            @click="addFromTemplate(tpl)"
            class="flex items-center gap-2 p-2.5 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left">
            <span class="text-xl">{{ tpl.emoji }}</span>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ tpl.name }}</p>
              <p class="text-xs text-gray-400">{{ tpl.desc }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Bouton ajouter -->
      <button @click="openSourceModal()" class="btn-primary w-full justify-center">
        + Ajouter une source RSS personnalisée
      </button>
    </div>

    <!-- ═══════════════════════════════
         TAB 3 : PRÉFÉRENCES
    ═══════════════════════════════ -->
    <div v-show="activeTab === 'preferences'" class="space-y-4">

      <div class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <p class="text-sm font-semibold text-gray-700">🛠 Ta stack technique</p>
        <div>
          <p class="text-xs text-gray-500 mb-2">Tes compétences principales (pour le scoring des missions)</p>
          <div class="flex flex-wrap gap-2 mb-2">
            <span v-for="(skill, i) in prefForm.tech_stack" :key="skill"
              class="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              {{ skill }}
              <button @click="prefForm.tech_stack.splice(i, 1)" class="hover:text-red-500">×</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input v-model="newSkill" @keyup.enter="addSkill" placeholder="Vue.js, React, Node…"
              class="form-input flex-1 text-sm" />
            <button @click="addSkill" class="btn-secondary text-sm">Ajouter</button>
          </div>
        </div>

        <div>
          <p class="text-sm font-semibold text-gray-700 mb-2">🚫 Mots clés à exclure</p>
          <div class="flex flex-wrap gap-2 mb-2">
            <span v-for="(kw, i) in prefForm.excluded_keywords" :key="kw"
              class="bg-red-100 text-red-600 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              {{ kw }}
              <button @click="prefForm.excluded_keywords.splice(i, 1)" class="hover:text-red-800">×</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input v-model="newExcluded" @keyup.enter="addExcluded" placeholder="Senior, 10 ans, Java…"
              class="form-input flex-1 text-sm" />
            <button @click="addExcluded" class="btn-secondary text-sm">Exclure</button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Budget min (€/j)</label>
            <input v-model.number="prefForm.min_budget" type="number" step="50" class="form-input" placeholder="300" />
          </div>
          <div>
            <label class="form-label">Budget max (€/j)</label>
            <input v-model.number="prefForm.max_budget" type="number" step="50" class="form-input" placeholder="800" />
          </div>
        </div>

        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" v-model="prefForm.remote_only" class="rounded" />
          <span class="text-sm text-gray-700">Remote uniquement</span>
        </label>

        <button @click="savePreferences" class="btn-primary w-full justify-center">
          💾 Sauvegarder les préférences
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════
         MODAL SOURCE
    ═══════════════════════════════ -->
    <div v-if="showSourceModal" class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div class="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
        <h2 class="text-base font-semibold text-gray-900 mb-4">
          {{ editingSource?.id ? 'Modifier la source' : 'Nouvelle source' }}
        </h2>
        <div class="space-y-4">
          <div>
            <label class="form-label">Nom</label>
            <input v-model="sourceForm.name" type="text" class="form-input" placeholder="Indeed Belgique" />
          </div>
          <div>
            <label class="form-label">Plateforme</label>
            <select v-model="sourceForm.platform" class="form-input">
              <option value="rss">RSS</option>
              <option value="indeed">Indeed</option>
              <option value="freelance-info">Freelance.info</option>
              <option value="linkedin">LinkedIn</option>
              <option value="malt">Malt</option>
              <option value="upwork">Upwork</option>
              <option value="custom">Autre</option>
            </select>
          </div>
          <div>
            <label class="form-label">URL du flux RSS</label>
            <input v-model="sourceForm.feed_url" type="url" class="form-input" placeholder="https://..." />
            <p class="text-xs text-gray-400 mt-1">URL du flux RSS de la plateforme</p>
          </div>
          <div>
            <label class="form-label">Mots-clés de recherche</label>
            <input v-model="sourceForm.keywordsStr" type="text" class="form-input" placeholder="Vue.js, freelance, remote" />
            <p class="text-xs text-gray-400 mt-1">Séparés par des virgules — filtrage côté client</p>
          </div>
          <div>
            <label class="form-label">Clé API (optionnel)</label>
            <input v-model="sourceForm.api_key" type="password" class="form-input" placeholder="••••••••" />
            <p class="text-xs text-gray-400 mt-1">Stockée de manière sécurisée en base</p>
          </div>
        </div>
        <div class="flex gap-3 mt-5">
          <button @click="showSourceModal = false" class="btn-secondary flex-1">Annuler</button>
          <button @click="submitSource" class="btn-primary flex-1">Sauvegarder</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useMissionsStore } from '@/stores/missions'

const store = useMissionsStore()
const activeTab = ref('missions')
const filterStatus = ref('new')
const searchQuery = ref('')
const toast = ref('')
const showSourceModal = ref(false)
const editingSource = ref(null)
const newSkill = ref('')
const newExcluded = ref('')

const tabs = [
  { id: 'missions', emoji: '🎯', label: 'Missions', short: 'Missions' },
  { id: 'sources', emoji: '📡', label: 'Sources', short: 'Sources' },
  { id: 'preferences', emoji: '⚙️', label: 'Préférences', short: 'Prefs' },
]

const sourceForm = reactive({
  name: '', platform: 'rss', feed_url: '', keywordsStr: '', api_key: '', api_config: {}
})

const prefForm = reactive({
  tech_stack: [], excluded_keywords: [], min_budget: null, max_budget: null, remote_only: true
})

const sourceTemplates = [
  { name: 'Indeed Belgique', emoji: '🇧🇪', platform: 'indeed', desc: 'Missions freelance en Belgique',
    feed_url: 'https://be.indeed.com/rss?q=freelance+developer&l=Belgique&jt=contract', keywords: ['freelance', 'contrat'] },
  { name: 'Freelance.info', emoji: '🇫🇷', platform: 'freelance-info', desc: 'Missions IT freelance (FR)',
    feed_url: 'https://www.freelance-info.fr/missions/rss/1/', keywords: ['développeur', 'web'] },
  { name: 'RemoteOK', emoji: '🌍', platform: 'rss', desc: 'Jobs remote tech',
    feed_url: 'https://remoteok.com/remote-developer-jobs.rss', keywords: ['remote', 'developer'] },
  { name: 'We Work Remotely', emoji: '💻', platform: 'rss', desc: 'Emplois remote worldwide',
    feed_url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss', keywords: [] },
]

onMounted(async () => {
  await Promise.all([store.fetchSources(), store.fetchMissions(), store.fetchPreferences()])
  if (store.preferences) Object.assign(prefForm, store.preferences)
})

// Filtrage
const statusFilters = computed(() => [
  { value: 'new', label: '🆕 Nouveaux', count: store.missions.filter(m => m.status === 'new').length },
  { value: 'seen', label: '👁 Vus', count: store.missions.filter(m => m.status === 'seen').length },
  { value: 'saved', label: '🔖 Sauvés', count: store.missions.filter(m => m.status === 'saved').length },
  { value: 'all', label: 'Tous', count: store.missions.length },
])

const filteredMissions = computed(() => {
  let list = filterStatus.value === 'all'
    ? store.missions
    : store.missions.filter(m => m.status === filterStatus.value)

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.skills?.some(s => s.toLowerCase().includes(q))
    )
  }

  // Score missions matching preferences
  if (prefForm.tech_stack?.length) {
    list = list.sort((a, b) => {
      const scoreA = (a.skills || []).filter(s => prefForm.tech_stack.includes(s)).length
      const scoreB = (b.skills || []).filter(s => prefForm.tech_stack.includes(s)).length
      return scoreB - scoreA
    })
  }

  // Exclude keywords
  if (prefForm.excluded_keywords?.length) {
    list = list.filter(m => {
      const text = (m.title + ' ' + (m.description || '')).toLowerCase()
      return !prefForm.excluded_keywords.some(kw => text.includes(kw.toLowerCase()))
    })
  }

  // Budget filter
  if (prefForm.min_budget) {
    list = list.filter(m => !m.budget_max || m.budget_max >= prefForm.min_budget)
  }

  return list
})

// Actions
async function handleRefreshAll() {
  const count = await store.refreshAll()
  showToast(count > 0 ? `✅ ${count} nouvelle(s) mission(s) trouvée(s)` : 'Aucune nouvelle mission')
  filterStatus.value = 'new'
}

async function refreshOne(src) {
  const count = await store.refreshSource(src)
  showToast(count > 0 ? `✅ ${count} mission(s) depuis ${src.name}` : `Aucune nouvelle depuis ${src.name}`)
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

// Sources
function openSourceModal(src = null) {
  editingSource.value = src
  if (src) {
    Object.assign(sourceForm, { ...src, keywordsStr: (src.keywords || []).join(', ') })
  } else {
    Object.assign(sourceForm, { name: '', platform: 'rss', feed_url: '', keywordsStr: '', api_key: '', api_config: {} })
  }
  showSourceModal.value = true
}

function editSource(src) { openSourceModal(src) }

async function submitSource() {
  const keywords = sourceForm.keywordsStr.split(',').map(k => k.trim()).filter(Boolean)
  await store.saveSource({
    ...(editingSource.value?.id ? { id: editingSource.value.id } : {}),
    name: sourceForm.name,
    platform: sourceForm.platform,
    feed_url: sourceForm.feed_url,
    keywords,
    api_key: sourceForm.api_key || null,
    api_config: sourceForm.api_config,
    active: true
  })
  showSourceModal.value = false
  showToast('✅ Source sauvegardée')
}

async function addFromTemplate(tpl) {
  await store.saveSource({
    name: tpl.name,
    platform: tpl.platform,
    feed_url: tpl.feed_url,
    keywords: tpl.keywords,
    active: true
  })
  showToast(`✅ ${tpl.name} ajouté`)
  activeTab.value = 'sources'
}

async function confirmDeleteSource(id) {
  if (confirm('Supprimer cette source ?')) {
    await store.deleteSource(id)
    showToast('Source supprimée')
  }
}

// Préférences
function addSkill() {
  const s = newSkill.value.trim()
  if (s && !prefForm.tech_stack.includes(s)) prefForm.tech_stack.push(s)
  newSkill.value = ''
}
function addExcluded() {
  const s = newExcluded.value.trim()
  if (s && !prefForm.excluded_keywords.includes(s)) prefForm.excluded_keywords.push(s)
  newExcluded.value = ''
}
async function savePreferences() {
  await store.savePreferences(prefForm)
  showToast('✅ Préférences sauvegardées')
}

// Helpers
function stripHtml(html) {
  return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || ''
}
function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diffDays = Math.floor((now - date) / 86400000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-BE')
}
function platformLabel(p) {
  return { rss: 'RSS', indeed: 'Indeed', 'freelance-info': 'Freelance.info',
    linkedin: 'LinkedIn', malt: 'Malt', upwork: 'Upwork', custom: 'Custom' }[p] || p
}
function platformColor(p) {
  return {
    indeed: 'bg-blue-100 text-blue-700',
    'freelance-info': 'bg-purple-100 text-purple-700',
    linkedin: 'bg-sky-100 text-sky-700',
    malt: 'bg-orange-100 text-orange-700',
    upwork: 'bg-green-100 text-green-700',
    rss: 'bg-gray-100 text-gray-600',
    custom: 'bg-gray-100 text-gray-600',
  }[p] || 'bg-gray-100 text-gray-600'
}
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(10px); }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
