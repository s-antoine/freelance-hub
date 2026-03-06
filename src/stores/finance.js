import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFinanceStore = defineStore('finance', () => {
  const defaults = {
    bankBalance: 0,
    tvaRate: 21,
    isocRate: 20,
    cotisationsRate: 20.5,
    salaryMonthly: 1500,
    workingDaysYear: 230,
    vacationDays: 20,
    sickDays: 5,
    nonBillableDays: 20,
    targetMonthlyNet: 4000,
    burnRateMonths: 6
  }

  const settings = ref(
    JSON.parse(localStorage.getItem('finance_settings') || JSON.stringify(defaults))
  )

  function saveSettings() {
    localStorage.setItem('finance_settings', JSON.stringify(settings.value))
  }

  // Barèmes IPP belges 2024, déductions forfaitaires, centimes additionnels ~7.1%
  function calculateIPP(grossAnnual) {
    if (grossAnnual <= 0) return 0
    const profExpenses = Math.min(grossAnnual * 0.30, 5520)
    const netTaxable = grossAnnual - profExpenses
    const exemption = 10160
    let taxable = Math.max(0, netTaxable - exemption)
    let tax = 0
    const brackets = [[15200, 0.25], [11630, 0.40], [19610, 0.45], [Infinity, 0.50]]
    for (const [slice, rate] of brackets) {
      const amount = Math.min(taxable, slice)
      tax += amount * rate
      taxable -= amount
      if (taxable <= 0) break
    }
    return tax * 1.071
  }

  // ISoc belge: 20% sur 100k (taux réduit), 25% au-delà
  function calculateISoc(profit) {
    if (profit <= 0) return 0
    const reduced = Math.min(profit, 100000)
    const normal = Math.max(0, profit - 100000)
    return reduced * (settings.value.isocRate / 100) + normal * 0.25
  }

  // Cotisations sociales indépendant belge (~20.5%, minimum ~3600€/an)
  function calculateCotisations(grossAnnual) {
    return Math.max(grossAnnual * (settings.value.cotisationsRate / 100), 3600)
  }

  function formatCurrency(val) {
    return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(val || 0)
  }

  function formatMonths(months) {
    if (!isFinite(months) || months > 999) return '∞'
    return Math.floor(months).toString()
  }

  return {
    settings,
    saveSettings,
    calculateIPP,
    calculateISoc,
    calculateCotisations,
    formatCurrency,
    formatMonths
  }
})
