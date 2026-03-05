import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref([])
  const loading = ref(false)

  async function fetchProjects() {
    loading.value = true
    const { data, error } = await supabase
      .from('projects')
      .select('*, client:clients(name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    projects.value = data
    loading.value = false
    return data
  }

  async function createProject(project) {
    const { data, error } = await supabase.from('projects').insert(project).select('*, client:clients(name)').single()
    if (error) throw error
    projects.value.unshift(data)
    return data
  }

  async function updateProject(id, updates) {
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select('*, client:clients(name)').single()
    if (error) throw error
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx !== -1) projects.value[idx] = data
    return data
  }

  async function deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    projects.value = projects.value.filter(p => p.id !== id)
  }

  return { projects, loading, fetchProjects, createProject, updateProject, deleteProject }
})
