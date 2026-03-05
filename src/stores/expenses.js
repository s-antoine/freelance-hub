import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useExpensesStore = defineStore('expenses', () => {
  const expenses = ref([])
  const loading = ref(false)

  async function fetchExpenses() {
    loading.value = true
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    if (error) throw error
    expenses.value = data
    loading.value = false
    return data
  }

  async function createExpense(expense) {
    const { data, error } = await supabase.from('expenses').insert(expense).select().single()
    if (error) throw error
    expenses.value.unshift(data)
    return data
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    expenses.value = expenses.value.filter(e => e.id !== id)
  }

  return { expenses, loading, fetchExpenses, createExpense, deleteExpense }
})
