import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useMissionsStore = defineStore('missions', () => {
  const missions = ref([])
  const sources = ref([])
  const preferences = ref(null)
  const loading = ref(false)
  const fetchingFeed = ref(false)

  // ── Sources ──────────────────────────────
  async function fetchSources() {
    const { data } = await supabase.from('mission_sources').select('*').order('created_at')
    sources.value = data || []
  }

  async function saveSource(source) {
    const { data: { user } } = await supabase.auth.getUser()
    if (source.id) {
      const { data } = await supabase.from('mission_sources').update(source).eq('id', source.id).select().single()
      const i = sources.value.findIndex(s => s.id === source.id)
      if (i !== -1) sources.value[i] = data
    } else {
      const { data, error } = await supabase.from('mission_sources')
        .insert({ ...source, user_id: user.id })
        .select().single()
      if (error) throw error
      sources.value.push(data)
    }
  }

  async function deleteSource(id) {
    await supabase.from('mission_sources').delete().eq('id', id)
    sources.value = sources.value.filter(s => s.id !== id)
  }

  async function toggleSource(id) {
    const src = sources.value.find(s => s.id === id)
    if (!src) return
    await supabase.from('mission_sources').update({ active: !src.active }).eq('id', id)
    src.active = !src.active
  }

  // ── Missions ─────────────────────────────
  async function fetchMissions() {
    loading.value = true
    const { data } = await supabase
      .from('missions')
      .select('*, source:mission_sources(name, platform)')
      .neq('status', 'dismissed')
      .order('published_at', { ascending: false })
    missions.value = data || []
    loading.value = false
  }

  async function setStatus(id, status) {
    await supabase.from('missions').update({ status }).eq('id', id)
    const m = missions.value.find(m => m.id === id)
    if (m) m.status = status
    if (status === 'dismissed') missions.value = missions.value.filter(m => m.id !== id)
  }

  // ── RSS Fetch via CORS proxy ──────────────
  async function refreshSource(source) {
    if (!source.feed_url) return 0
    fetchingFeed.value = true
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(source.feed_url)}`
      const resp = await fetch(proxyUrl)
      const text = await resp.text()
      const { data: { user } } = await supabase.auth.getUser()
      const items = parseRSS(text, source, user.id)

      // Upsert missions (ignore duplicates via unique constraint)
      let inserted = 0
      for (const item of items) {
        const { error } = await supabase.from('missions').upsert(item, { onConflict: 'user_id,url', ignoreDuplicates: true })
        if (!error) inserted++
      }

      await supabase.from('mission_sources').update({ last_fetched_at: new Date().toISOString() }).eq('id', source.id)
      const src = sources.value.find(s => s.id === source.id)
      if (src) src.last_fetched_at = new Date().toISOString()

      await fetchMissions()
      return inserted
    } catch (e) {
      console.error('RSS fetch error:', e)
      return 0
    } finally {
      fetchingFeed.value = false
    }
  }

  async function refreshAll() {
    const active = sources.value.filter(s => s.active && s.feed_url)
    let total = 0
    for (const src of active) total += await refreshSource(src)
    return total
  }

  function parseRSS(xml, source, userId) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const items = Array.from(doc.querySelectorAll('item, entry'))

    return items.slice(0, 50).map(item => {
      const get = (tag) => item.querySelector(tag)?.textContent?.trim() || ''
      const title = get('title')
      const url = get('link') || item.querySelector('link')?.getAttribute('href') || ''
      const description = get('description') || get('summary') || get('content')
      const pubDate = get('pubDate') || get('published') || get('updated')

      const techKeywords = ['Vue', 'React', 'Angular', 'Node', 'Python', 'Laravel', 'PHP', 'TypeScript',
        'JavaScript', 'Java', 'C#', '.NET', 'DevOps', 'Docker', 'AWS', 'SQL', 'PostgreSQL',
        'MongoDB', 'GraphQL', 'REST', 'API', 'Mobile', 'Flutter', 'Swift', 'Kotlin', 'Nuxt', 'Next']
      const text = (title + ' ' + description).toLowerCase()
      const skills = techKeywords.filter(k => text.includes(k.toLowerCase()))

      const budgetMatch = text.match(/(\d{3,4})\s*[€$]?\s*\/?(?:jour|day|j\.?)/i)
      const budget_min = budgetMatch ? parseInt(budgetMatch[1]) * 0.9 : null
      const budget_max = budgetMatch ? parseInt(budgetMatch[1]) * 1.1 : null

      return {
        user_id: userId,
        source_id: source.id,
        platform: source.platform,
        title: title.slice(0, 200),
        description: description.slice(0, 2000),
        skills,
        budget_min,
        budget_max,
        url: url.slice(0, 500),
        remote: text.includes('remote') || text.includes('télétravail') || text.includes('teletravail'),
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        status: 'new'
      }
    }).filter(m => m.title && m.url)
  }

  // ── Préférences ───────────────────────────
  async function fetchPreferences() {
    const { data } = await supabase.from('mission_preferences').select('*').maybeSingle()
    preferences.value = data || { tech_stack: [], excluded_keywords: [], min_budget: null, max_budget: null, remote_only: true }
  }

  async function savePreferences(prefs) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('mission_preferences')
      .upsert({ ...prefs, user_id: user.id, updated_at: new Date().toISOString() })
      .select().single()
    preferences.value = data
  }

  // ── Computed ──────────────────────────────
  const newCount = computed(() => missions.value.filter(m => m.status === 'new').length)
  const savedMissions = computed(() => missions.value.filter(m => m.status === 'saved'))

  return {
    missions, sources, preferences, loading, fetchingFeed, newCount, savedMissions,
    fetchSources, saveSource, deleteSource, toggleSource,
    fetchMissions, setStatus,
    refreshSource, refreshAll,
    fetchPreferences, savePreferences
  }
})
