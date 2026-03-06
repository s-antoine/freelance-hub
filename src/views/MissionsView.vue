<template>
  <div class="p-4 md:p-8">

    <!-- Header -->
    <div class="flex items-start justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Missions 🎯</h1>
        <p class="text-gray-500 mt-0.5 text-sm">
          <span v-if="store.newCount > 0" class="text-indigo-600 font-medium">{{ store.newCount }} nouvelle(s)</span>
          <span v-else>Veille des appels d'offres</span>
        </p>
      </div>
      <button @click="handleRefreshAll" :disabled="store.fetchingFeed" class="btn-primary shrink-0">
        <span :class="store.fetchingFeed ? 'animate-spin' : ''">↻</span>
        <span class="hidden sm:inline">{{ store.fetchingFeed ? 'Chargement…' : 'Actualiser' }}</span>
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        class="flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
        :class="activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">
        {{ tab.emoji }} <span class="hidden sm:inline">{{ tab.label }}</span><span class="sm:hidden">{{ tab.short }}</span>
        <span v-if="tab.id === 'missions' && store.newCount > 0"
          class="bg-indigo-500 text-white text-[10px] rounded-full px-1.5 leading-5">{{ store.newCount }}</span>
      </button>
    </div>

    <!-- Erreur -->
    <div v-if="store.lastError" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4 flex justify-between">
      <span>⚠️ {{ store.lastError }}</span>
      <button @click="store.lastError = ''" class="text-red-400 hover:text-red-600">✕</button>
    </div>

    <!-- Toast -->
    <Transition name="slide-up">
      <div v-if="toast" class="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-gray-900 text-white text-sm rounded-xl p-3 z-50 shadow-lg">
        {{ toast }}
      </div>
    </Transition>

    <!-- ══ TAB MISSIONS ══ -->
    <div v-show="activeTab === 'missions'">
      <div class="flex flex-wrap gap-2 mb-4">
        <button v-for="f in statusFilters" :key="f.value" @click="filterStatus = f.value"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
          :class="filterStatus === f.value ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200'">
          {{ f.label }} ({{ f.count }})
        </button>
        <input v-model="searchQuery" placeholder="🔍 Filtrer…" class="form-input text-sm py-1.5 min-w-0 flex-1 sm:flex-none sm:w-48 ml-auto" />
      </div>

      <div v-if="store.loading" class="flex justify-center py-16">
        <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="filteredMissions.length === 0" class="bg-white rounded-2xl border border-gray-200 text-center py-16 px-4">
        <p class="text-4xl mb-3">🔍</p>
        <p class="font-semibold text-gray-900 mb-1">Aucune mission</p>
        <p class="text-sm text-gray-500 mb-4">Configure une source et clique sur Actualiser</p>
        <button @click="activeTab = 'sources'" class="btn-primary">Configurer les sources</button>
      </div>

      <div v-else class="space-y-3">
        <div v-for="mission in filteredMissions" :key="mission.id"
          class="bg-white rounded-2xl border p-4"
          :class="mission.status === 'new' ? 'border-indigo-100 shadow-sm' : 'border-gray-200'">
          <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span :class="`text-xs font-medium px-2 py-0.5 rounded-full ${platformColor(mission.platform)}`">{{ platformLabel(mission.platform) }}</span>
            <span v-if="mission.remote" class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">🌍 Remote</span>
            <span v-if="mission.status === 'new'" class="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Nouveau</span>
            <span v-if="mission.status === 'saved'" class="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">🔖</span>
            <span class="text-xs text-gray-400 ml-auto">{{ formatDate(mission.published_at) }}</span>
          </div>
          <h3 class="font-semibold text-gray-900 text-sm mb-1 leading-snug">{{ mission.title }}</h3>
          <p v-if="mission.description" class="text-xs text-gray-500 line-clamp-2 mb-2">{{ stripHtml(mission.description) }}</p>
          <div v-if="mission.skills?.length" class="flex flex-wrap gap-1 mb-2">
            <span v-for="s in mission.skills.slice(0, 5)" :key="s" class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ s }}</span>
          </div>
          <div v-if="mission.budget_min" class="text-xs text-gray-400 mb-2">💰 ~{{ Math.round(mission.budget_min) }}–{{ Math.round(mission.budget_max || mission.budget_min) }}€/j</div>
          <div class="flex items-center gap-2 pt-2.5 border-t border-gray-100">
            <a v-if="mission.url" :href="mission.url" target="_blank" rel="noopener"
              @click="store.setStatus(mission.id, 'seen')"
              class="btn-primary text-xs py-1.5 flex-1 text-center">Voir ↗</a>
            <button @click="store.setStatus(mission.id, mission.status === 'saved' ? 'seen' : 'saved')"
              class="btn-secondary text-xs py-1.5 px-3" :class="mission.status === 'saved' ? 'text-amber-600' : ''">🔖</button>
            <button @click="store.setStatus(mission.id, 'dismissed')" class="p-2 text-gray-300 hover:text-red-400">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ TAB SOURCES ══ -->
    <div v-show="activeTab === 'sources'" class="space-y-4">

      <!-- Sources existantes -->
      <div v-if="store.sources.length" class="space-y-3">
        <div v-for="src in store.sources" :key="src.id" class="bg-white rounded-2xl border border-gray-200 p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span :class="`text-xs px-2 py-0.5 rounded-full font-medium ${platformColor(src.platform)}`">{{ platformLabel(src.platform) }}</span>
                <span v-if="!src.active" class="text-xs text-gray-400">Inactif</span>
              </div>
              <p class="font-medium text-sm text-gray-900">{{ src.name }}</p>
              <p v-if="src.keywords?.length" class="text-xs text-gray-400 mt-0.5">Mots-clés: {{ src.keywords.join(', ') }}</p>
              <p v-if="src.last_fetched_at" class="text-xs text-gray-400 mt-0.5">Synchro: {{ formatDate(src.last_fetched_at) }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button @click="refreshOne(src)" :disabled="store.fetchingFeed" class="p-2 text-gray-400 hover:text-indigo-600 text-base" title="Actualiser">↻</button>
              <button @click="store.toggleSource(src.id)"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                :class="src.active ? 'bg-indigo-600' : 'bg-gray-200'">
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"
                  :class="src.active ? 'translate-x-4' : 'translate-x-0.5'"></span>
              </button>
              <button @click="editSource(src)" class="p-1.5 text-gray-400 hover:text-indigo-600">✏️</button>
              <button @click="confirmDeleteSource(src.id)" class="p-1.5 text-gray-400 hover:text-red-500">🗑</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Templates -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-3">⚡ Ajouter en 1 clic</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button v-for="tpl in sourceTemplates" :key="tpl.name" @click="addFromTemplate(tpl)"
            :disabled="sourceAlreadyExists(tpl.name)"
            class="flex items-center gap-3 p-3 border rounded-xl text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="sourceAlreadyExists(tpl.name) ? 'border-gray-100 bg-gray-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'">
            <span class="text-2xl shrink-0">{{ tpl.emoji }}</span>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900">{{ tpl.name }}</p>
              <p class="text-xs text-gray-400">{{ tpl.desc }}</p>
              <span v-if="tpl.needsKey" class="text-xs text-amber-600">🔑 Clé API requise</span>
              <span v-else class="text-xs text-green-600">✅ Gratuit, sans clé</span>
            </div>
          </button>
        </div>
      </div>

      <button @click="openSourceModal()" class="btn-secondary w-full justify-center">+ Source personnalisée</button>
    </div>

    <!-- ══ TAB PRÉFÉRENCES ══ -->
    <div v-show="activeTab === 'preferences'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
        <div>
          <p class="text-sm font-semibold text-gray-700 mb-2">🛠 Ta stack (pour trier les missions)</p>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <span v-for="(s, i) in prefForm.tech_stack" :key="s" class="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              {{ s }} <button @click="prefForm.tech_stack.splice(i, 1)" class="hover:text-red-500">×</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input v-model="newSkill" @keyup.enter="addSkill" placeholder="Vue.js, React, Node…" class="form-input flex-1 text-sm" />
            <button @click="addSkill" class="btn-secondary text-sm px-3">+</button>
          </div>
        </div>
        <div>
          <p class="text-sm font-semibold text-gray-700 mb-2">🚫 Mots-clés exclus</p>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <span v-for="(kw, i) in prefForm.excluded_keywords" :key="kw" class="bg-red-100 text-red-600 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              {{ kw }} <button @click="prefForm.excluded_keywords.splice(i, 1)" class="hover:text-red-800">×</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input v-model="newExcluded" @keyup.enter="addExcluded" placeholder="Java, Senior, 10 ans…" class="form-input flex-1 text-sm" />
            <button @click="addExcluded" class="btn-secondary text-sm px-3">+</button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Budget min (€/j)</label><input v-model.number="prefForm.min_budget" type="number" step="50" class="form-input" /></div>
          <div><label class="form-label">Budget max (€/j)</label><input v-model.number="prefForm.max_budget" type="number" step="50" class="form-input" /></div>
        </div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" v-model="prefForm.remote_only" class="rounded" />
          <span class="text-sm text-gray-700">Remote uniquement</span>
        </label>
        <button @click="savePreferences" class="btn-primary w-full justify-center">💾 Sauvegarder</button>
      </div>
    </div>

    <!-- ══ MODAL SOURCE ══ -->
    <div v-if="showSourceModal" class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div class="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
        <h2 class="text-base font-semibold text-gray-900 mb-4">{{ editingSource?.id ? 'Modifier' : 'Nouvelle source' }}</h2>
        <div class="space-y-3">
          <div><label class="form-label">Nom</label><input v-model="sourceForm.name" class="form-input" /></div>
          <div>
            <label class="form-label">Type de source</label>
            <select v-model="sourceForm.platform" class="form-input">
              <option value="remotive">Remotive (gratuit)</option>
              <option value="arbeitnow">Arbeitnow (gratuit, Europe)</option>
              <option value="adzuna">Adzuna (clé gratuite)</option>
              <option value="jsearch">JSearch / RapidAPI (LinkedIn, Indeed…)</option>
              <option value="scrape">Scraping HTML (URL + sélecteurs)</option>
            </select>
          </div>

          <!-- Config selon plateforme -->
          <div v-if="sourceForm.platform === 'remotive'">
            <label class="form-label">Catégorie</label>
            <select v-model="sourceForm.api_config.category" class="form-input">
              <option value="software-dev">Software Dev</option>
              <option value="design">Design</option>
              <option value="devops">DevOps / SysAdmin</option>
              <option value="product">Product</option>
              <option value="all-others">Autres</option>
            </select>
          </div>

          <div v-if="sourceForm.platform === 'arbeitnow'">
            <label class="form-label">Tag de recherche</label>
            <input v-model="sourceForm.api_config.tag" class="form-input" placeholder="javascript, python, php…" />
          </div>

          <div v-if="sourceForm.platform === 'adzuna'">
            <label class="form-label">Clé API Adzuna <span class="text-xs text-gray-400">(app_id:app_key depuis developer.adzuna.com)</span></label>
            <input v-model="sourceForm.api_key" class="form-input" placeholder="abc123:def456" />
            <label class="form-label mt-3">Pays <span class="text-xs text-gray-400">(be, fr, gb, de…)</span></label>
            <input v-model="sourceForm.api_config.country" class="form-input" placeholder="be" />
            <label class="form-label mt-3">Requête</label>
            <input v-model="sourceForm.api_config.query" class="form-input" placeholder="freelance developer" />
          </div>

          <div v-if="sourceForm.platform === 'jsearch'">
            <label class="form-label">Clé RapidAPI <span class="text-xs text-gray-400">(rapidapi.com → JSearch)</span></label>
            <input v-model="sourceForm.api_key" type="password" class="form-input" placeholder="••••••••" />
            <label class="form-label mt-3">Requête de recherche</label>
            <input v-model="sourceForm.api_config.query" class="form-input" placeholder="freelance developer Belgium" />
          </div>

          <div v-if="sourceForm.platform === 'scrape'">
            <label class="form-label">URL à scraper</label>
            <input v-model="sourceForm.feed_url" type="url" class="form-input" placeholder="https://www.freelance-info.fr/missions/" />
            <label class="form-label mt-3">Sélecteur des annonces <span class="text-xs text-gray-400">(CSS)</span></label>
            <input v-model="sourceForm.api_config.item_selector" class="form-input" placeholder="article, .mission-item, li.result" />
            <label class="form-label mt-3">Sélecteur du titre</label>
            <input v-model="sourceForm.api_config.title_selector" class="form-input" placeholder="h2, .job-title" />
          </div>

          <div>
            <label class="form-label">Mots-clés filtrants <span class="text-xs text-gray-400">(virgule)</span></label>
            <input v-model="sourceForm.keywordsStr" class="form-input" placeholder="Vue.js, React, freelance" />
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
  name: '', platform: 'remotive', feed_url: '', keywordsStr: '', api_key: '',
  api_config: { category: 'software-dev', tag: 'javascript', country: 'be', query: 'freelance developer', item_selector: '', title_selector: '' }
})

const prefForm = reactive({ tech_stack: [], excluded_keywords: [], min_budget: null, max_budget: null, remote_only: true })

const sourceTemplates = [
  { name: 'Remotive', emoji: '🌍', platform: 'remotive', needsKey: false,
    desc: 'Remote tech jobs (dev, design, devops)',
    api_config: { category: 'software-dev' }, keywords: [] },
  { name: 'Arbeitnow', emoji: '🇪🇺', platform: 'arbeitnow', needsKey: false,
    desc: 'Jobs tech en Europe (BE, FR, DE…)',
    api_config: { tag: 'javascript' }, keywords: [] },
  { name: 'Adzuna Belgique', emoji: '🇧🇪', platform: 'adzuna', needsKey: true,
    desc: 'Agrège Indeed, LinkedIn, Monster BE',
    api_config: { country: 'be', query: 'freelance developer' }, keywords: [] },
  { name: 'LinkedIn / Indeed via JSearch', emoji: '💼', platform: 'jsearch', needsKey: true,
    desc: 'Recherche directe LinkedIn + Indeed',
    api_config: { query: 'freelance developer Belgium' }, keywords: [] },
  { name: 'Freelance.info (scraping)', emoji: '🕷️', platform: 'scrape', needsKey: false,
    desc: 'Scraping des missions freelance IT',
    feed_url: 'https://www.freelance-info.fr/missions/',
    api_config: { item_selector: '.mission', title_selector: 'h2, h3' }, keywords: [] },
  { name: 'Malt (scraping)', emoji: '🥗', platform: 'scrape', needsKey: false,
    desc: 'Scraping des missions Malt (expérimental)',
    feed_url: 'https://www.malt.fr/s/missions',
    api_config: { item_selector: '[data-test="mission-card"]', title_selector: 'h2' }, keywords: [] },
]

onMounted(async () => {
  await Promise.all([store.fetchSources(), store.fetchMissions(), store.fetchPreferences()])
  if (store.preferences) Object.assign(prefForm, store.preferences)
})

const statusFilters = computed(() => [
  { value: 'new', label: '🆕 Nouveaux', count: store.missions.filter(m => m.status === 'new').length },
  { value: 'seen', label: '👁 Vus', count: store.missions.filter(m => m.status === 'seen').length },
  { value: 'saved', label: '🔖 Sauvés', count: store.missions.filter(m => m.status === 'saved').length },
  { value: 'all', label: 'Tous', count: store.missions.length },
])

const filteredMissions = computed(() => {
  let list = filterStatus.value === 'all' ? store.missions : store.missions.filter(m => m.status === filterStatus.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(m => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q) || m.skills?.some(s => s.toLowerCase().includes(q)))
  }
  if (prefForm.excluded_keywords?.length)
    list = list.filter(m => !prefForm.excluded_keywords.some(kw => (m.title + ' ' + (m.description || '')).toLowerCase().includes(kw.toLowerCase())))
  if (prefForm.min_budget)
    list = list.filter(m => !m.budget_max || m.budget_max >= prefForm.min_budget)
  if (prefForm.tech_stack?.length)
    list = [...list].sort((a, b) => {
      const sa = (a.skills || []).filter(s => prefForm.tech_stack.includes(s)).length
      const sb = (b.skills || []).filter(s => prefForm.tech_stack.includes(s)).length
      return sb - sa
    })
  return list
})

async function handleRefreshAll() {
  if (!store.sources.filter(s => s.active).length) { showToast('Configure d\'abord des sources 👆'); activeTab.value = 'sources'; return }
  const count = await store.refreshAll()
  showToast(count > 0 ? `✅ ${count} nouvelle(s) mission(s)` : 'Aucune nouvelle mission')
  filterStatus.value = 'new'
}

async function refreshOne(src) {
  const count = await store.refreshSource(src)
  showToast(count > 0 ? `✅ ${count} mission(s) depuis ${src.name}` : `Rien de nouveau depuis ${src.name}`)
}

function showToast(msg) { toast.value = msg; setTimeout(() => { toast.value = '' }, 3500) }
function sourceAlreadyExists(name) { return store.sources.some(s => s.name === name) }

function openSourceModal(src = null) {
  editingSource.value = src
  if (src) {
    Object.assign(sourceForm, { ...src, keywordsStr: (src.keywords || []).join(', '), api_config: { ...{ category: 'software-dev', tag: 'javascript', country: 'be', query: '', item_selector: '', title_selector: '' }, ...(src.api_config || {}) } })
  } else {
    Object.assign(sourceForm, { name: '', platform: 'remotive', feed_url: '', keywordsStr: '', api_key: '', api_config: { category: 'software-dev', tag: 'javascript', country: 'be', query: 'freelance developer', item_selector: '', title_selector: '' } })
  }
  showSourceModal.value = true
}

function editSource(src) { openSourceModal(src) }

async function submitSource() {
  const keywords = sourceForm.keywordsStr.split(',').map(k => k.trim()).filter(Boolean)
  await store.saveSource({
    ...(editingSource.value?.id ? { id: editingSource.value.id } : {}),
    name: sourceForm.name, platform: sourceForm.platform, feed_url: sourceForm.feed_url || null,
    keywords, api_key: sourceForm.api_key || null, api_config: sourceForm.api_config, active: true
  })
  showSourceModal.value = false
  showToast('✅ Source sauvegardée')
}

async function addFromTemplate(tpl) {
  await store.saveSource({ name: tpl.name, platform: tpl.platform, feed_url: tpl.feed_url || null, keywords: tpl.keywords, api_config: tpl.api_config, active: true })
  showToast(`✅ ${tpl.name} ajouté`)
  activeTab.value = 'sources'
}

async function confirmDeleteSource(id) {
  if (confirm('Supprimer cette source ?')) { await store.deleteSource(id); showToast('Source supprimée') }
}

function addSkill() { const s = newSkill.value.trim(); if (s && !prefForm.tech_stack.includes(s)) prefForm.tech_stack.push(s); newSkill.value = '' }
function addExcluded() { const s = newExcluded.value.trim(); if (s && !prefForm.excluded_keywords.includes(s)) prefForm.excluded_keywords.push(s); newExcluded.value = '' }
async function savePreferences() { await store.savePreferences(prefForm); showToast('✅ Préférences sauvegardées') }

function stripHtml(html) { return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '' }
function formatDate(d) {
  if (!d) return ''
  const diff = Math.floor((new Date() - new Date(d)) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  if (diff < 7) return `Il y a ${diff}j`
  return new Date(d).toLocaleDateString('fr-BE')
}
function platformLabel(p) {
  return { remotive: 'Remotive', arbeitnow: 'Arbeitnow', adzuna: 'Adzuna', jsearch: 'LinkedIn/Indeed', scrape: 'Scraping', rss: 'RSS', custom: 'Custom' }[p] || p
}
function platformColor(p) {
  return { remotive: 'bg-green-100 text-green-700', arbeitnow: 'bg-blue-100 text-blue-700', adzuna: 'bg-orange-100 text-orange-700', jsearch: 'bg-sky-100 text-sky-700', scrape: 'bg-purple-100 text-purple-700' }[p] || 'bg-gray-100 text-gray-600'
}
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(10px); }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
