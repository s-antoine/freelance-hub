import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useInvoicesStore = defineStore('invoices', () => {
  const invoices = ref([])
  const loading = ref(false)

  async function fetchInvoices() {
    loading.value = true
    const { data, error } = await supabase
      .from('invoices')
      .select('*, client:clients(name, email)')
      .order('created_at', { ascending: false })
    if (error) throw error
    invoices.value = data
    loading.value = false
    return data
  }

  async function fetchInvoice(id) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async function createInvoice(invoice, items) {
    const { data: inv, error } = await supabase.from('invoices').insert(invoice).select().single()
    if (error) throw error
    if (items?.length) {
      const { error: itemsError } = await supabase.from('invoice_items').insert(
        items.map(i => ({ ...i, invoice_id: inv.id }))
      )
      if (itemsError) throw itemsError
    }
    invoices.value.unshift(inv)
    return inv
  }

  async function updateInvoiceStatus(id, status) {
    const { data, error } = await supabase.from('invoices').update({ status }).eq('id', id).select().single()
    if (error) throw error
    const idx = invoices.value.findIndex(i => i.id === id)
    if (idx !== -1) invoices.value[idx] = { ...invoices.value[idx], ...data }
    return data
  }

  async function deleteInvoice(id) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
    invoices.value = invoices.value.filter(i => i.id !== id)
  }

  return { invoices, loading, fetchInvoices, fetchInvoice, createInvoice, updateInvoiceStatus, deleteInvoice }
})
