import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useClientsStore = defineStore('clients', () => {
  const clients = ref([])
  const loading = ref(false)

  async function fetchClients() {
    loading.value = true
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    if (error) throw error
    clients.value = data
    loading.value = false
    return data
  }

  async function createClient(client) {
    const { data, error } = await supabase.from('clients').insert(client).select().single()
    if (error) throw error
    clients.value.push(data)
    return data
  }

  async function updateClient(id, updates) {
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
    if (error) throw error
    const idx = clients.value.findIndex(c => c.id === id)
    if (idx !== -1) clients.value[idx] = data
    return data
  }

  async function deleteClient(id) {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
    clients.value = clients.value.filter(c => c.id !== id)
  }

  return { clients, loading, fetchClients, createClient, updateClient, deleteClient }
})
