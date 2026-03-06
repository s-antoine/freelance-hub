import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// URL du proxy Vercel (évite CORS pour scraping)
const PROXY_URL = '/api/fetch-feed'

export const useMissionsStore = defineStore('missions', () => {
  const missions = ref([])
  const sources = ref([])
  const preferences = ref(null)
  const loading = ref(false)
  const fetchingFeed = ref(false)
  const lastError = ref('')

  // ── Sources ──────────────────────────────────────────
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
        .insert({ ...source, user_id: user.id }).select().single()
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

  // ── Missions ─────────────────────────────────────────
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

  // ── Adaptateurs par plateforme ────────────────────────
  async function refreshSource(source) {
    fetchingFeed.value = true
    lastError.value = ''
    try {
      let items = []
      switch (source.platform) {
        case 'remotive':   items = await fetchRemotive(source); break
        case 'arbeitnow':  items = await fetchArbeitnow(source); break
        case 'adzuna':     items = await fetchAdzuna(source); break
        case 'jsearch':    items = await fetchJSearch(source); break
        case 'scrape':     items = await fetchScrape(source); break
        default:           lastError.value = `Plateforme inconnue : ${source.platform}`; return 0
      }

      const { data: { user } } = await supabase.auth.getUser()
      const toInsert = items.map(item => ({ ...item, user_id: user.id, source_id: source.id, platform: source.platform, status: 'new' }))

      let inserted = 0
      for (const item of toInsert) {
        const { error } = await supabase.from('missions').upsert(item, { onConflict: 'user_id,url', ignoreDuplicates: true })
        if (!error) inserted++
      }

      await supabase.from('mission_sources').update({ last_fetched_at: new Date().toISOString() }).eq('id', source.id)
      const src = sources.value.find(s => s.id === source.id)
      if (src) src.last_fetched_at = new Date().toISOString()

      await fetchMissions()
      return inserted
    } catch (e) {
      lastError.value = e.message
      return 0
    } finally {
      fetchingFeed.value = false
    }
  }

  async function refreshAll() {
    const active = sources.value.filter(s => s.active)
    let total = 0
    for (const src of active) total += await refreshSource(src)
    return total
  }

  // ── Remotive (gratuit, sans clé) ─────────────────────
  async function fetchRemotive(source) {
    const cfg = source.api_config || {}
    const category = cfg.category || 'software-dev'
    const url = `https://remotive.com/api/remote-jobs?category=${category}&limit=50`
    const resp = await fetch(url)
    const data = await resp.json()
    return (data.jobs || []).map(j => ({
      title: j.title,
      description: j.description?.slice(0, 2000),
      url: j.url,
      skills: extractSkills(j.title + ' ' + (j.candidate_required_location || '') + ' ' + (j.tags?.join(' ') || '')),
      remote: true,
      published_at: j.publication_date,
      budget_min: j.salary ? parseSalary(j.salary) * 0.9 : null,
      budget_max: j.salary ? parseSalary(j.salary) * 1.1 : null,
    }))
  }

  // ── Arbeitnow (gratuit, focus Europe) ────────────────
  async function fetchArbeitnow(source) {
    const cfg = source.api_config || {}
    const tag = cfg.tag || 'javascript'
    const url = `https://arbeitnow.com/api/job-board-api?tag=${tag}`
    const resp = await fetch(url)
    const data = await resp.json()
    return (data.data || []).map(j => ({
      title: j.title,
      description: j.description?.slice(0, 2000),
      url: j.url,
      location: j.location,
      skills: extractSkills(j.title + ' ' + (j.tags?.join(' ') || '')),
      remote: j.remote,
      published_at: new Date(j.created_at * 1000).toISOString(),
      budget_min: null, budget_max: null,
    }))
  }

  // ── Adzuna (clé gratuite sur adzuna.com/api) ─────────
  async function fetchAdzuna(source) {
    if (!source.api_key) throw new Error('Clé API Adzuna manquante (app_id:app_key)')
    const [appId, appKey] = source.api_key.split(':')
    const cfg = source.api_config || {}
    const country = cfg.country || 'be'
    const q = encodeURIComponent(cfg.query || (source.keywords || ['freelance developer']).join(' '))
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${q}&content-type=application/json`

    // Via proxy (CORS bloqué côté client)
    const resp = await fetch(PROXY_URL + '?url=' + encodeURIComponent(url))
    const proxy = await resp.json()
    const data = JSON.parse(proxy.content)

    return (data.results || []).map(j => ({
      title: j.title,
      description: j.description?.slice(0, 2000),
      url: j.redirect_url || j.__CLASS__,
      location: j.location?.display_name,
      skills: extractSkills(j.title + ' ' + j.description),
      remote: j.title.toLowerCase().includes('remote') || j.description?.toLowerCase().includes('remote'),
      published_at: j.created,
      budget_min: j.salary_min || null,
      budget_max: j.salary_max || null,
    }))
  }

  // ── JSearch via RapidAPI (LinkedIn, Indeed, Glassdoor…) ─
  async function fetchJSearch(source) {
    if (!source.api_key) throw new Error('Clé RapidAPI manquante')
    const cfg = source.api_config || {}
    const query = encodeURIComponent(cfg.query || (source.keywords || ['freelance developer']).join(' '))
    const url = `https://jsearch.p.rapidapi.com/search?query=${query}&num_pages=2&date_posted=week`
    const resp = await fetch(url, {
      headers: { 'X-RapidAPI-Key': source.api_key, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' }
    })
    const data = await resp.json()
    return (data.data || []).map(j => ({
      title: j.job_title,
      description: j.job_description?.slice(0, 2000),
      url: j.job_apply_link || j.job_google_link,
      location: j.job_city || j.job_country,
      skills: extractSkills((j.job_required_skills || []).join(' ') + ' ' + j.job_title),
      remote: j.job_is_remote,
      published_at: new Date(j.job_posted_at_timestamp * 1000).toISOString(),
      budget_min: j.job_min_salary || null,
      budget_max: j.job_max_salary || null,
    }))
  }

  // ── Scraping HTML via proxy Vercel ───────────────────
  async function fetchScrape(source) {
    if (!source.feed_url) throw new Error('URL manquante')
    const resp = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: source.feed_url })
    })
    const proxy = await resp.json()
    if (!proxy.content) throw new Error('Scraping échoué')

    const cfg = source.api_config || {}
    return parseHTML(proxy.content, source.feed_url, cfg)
  }

  function parseHTML(html, baseUrl, cfg) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const itemSel = cfg.item_selector || 'article, .job, .mission, .offer, li.result'
    const items = Array.from(doc.querySelectorAll(itemSel)).slice(0, 30)

    return items.map(el => {
      const titleEl = el.querySelector(cfg.title_selector || 'h2, h3, h1, .title, .job-title')
      const linkEl = el.querySelector(cfg.url_selector || 'a')
      const descEl = el.querySelector(cfg.description_selector || 'p, .description, .summary')
      const title = titleEl?.textContent?.trim()
      let url = linkEl?.href || linkEl?.getAttribute('href')
      if (url && url.startsWith('/')) url = new URL(url, baseUrl).href
      const description = descEl?.textContent?.trim()
      if (!title || !url) return null
      return {
        title: title.slice(0, 200),
        description: description?.slice(0, 2000),
        url,
        skills: extractSkills(title + ' ' + (description || '')),
        remote: (title + description).toLowerCase().includes('remote') || (title + description).toLowerCase().includes('télétravail'),
        published_at: new Date().toISOString(),
        budget_min: null, budget_max: null,
      }
    }).filter(Boolean)
  }

  // ── Utilitaires ───────────────────────────────────────
  function extractSkills(text) {
    const t = text.toLowerCase()
    return ['Vue', 'React', 'Angular', 'Node', 'Python', 'Laravel', 'PHP', 'TypeScript',
      'JavaScript', 'Java', 'C#', '.NET', 'DevOps', 'Docker', 'AWS', 'SQL', 'PostgreSQL',
      'MongoDB', 'GraphQL', 'Flutter', 'Swift', 'Kotlin', 'Nuxt', 'Next', 'Symfony',
      'WordPress', 'Shopify', 'Figma', 'UI/UX', 'Data', 'IA', 'ML'].filter(k => t.includes(k.toLowerCase()))
  }

  function parseSalary(str) {
    const m = String(str).match(/(\d[\d,. ]+)/)
    return m ? parseFloat(m[1].replace(/[, ]/g, '')) : 0
  }

  // ── Préférences ───────────────────────────────────────
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

  const newCount = computed(() => missions.value.filter(m => m.status === 'new').length)
  const savedMissions = computed(() => missions.value.filter(m => m.status === 'saved'))

  return {
    missions, sources, preferences, loading, fetchingFeed, lastError, newCount, savedMissions,
    fetchSources, saveSource, deleteSource, toggleSource,
    fetchMissions, setStatus,
    refreshSource, refreshAll,
    fetchPreferences, savePreferences
  }
})
