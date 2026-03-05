<template>
  <div class="p-8 max-w-2xl">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Paramètres</h1>
      <p class="text-gray-500 mt-1">Informations de votre entreprise</p>
    </div>

    <div class="bg-white rounded-2xl border border-gray-200 p-8">
      <form @submit.prevent="handleSave" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="form-label">Nom / Raison sociale *</label>
            <input v-model="form.company_name" type="text" class="form-input" placeholder="Jean Dupont Consulting" />
          </div>
          <div>
            <label class="form-label">Email professionnel</label>
            <input v-model="form.email" type="email" class="form-input" />
          </div>
          <div>
            <label class="form-label">Téléphone</label>
            <input v-model="form.phone" type="tel" class="form-input" />
          </div>
          <div class="col-span-2">
            <label class="form-label">Adresse</label>
            <textarea v-model="form.address" rows="2" class="form-input"></textarea>
          </div>
          <div>
            <label class="form-label">Numéro SIRET</label>
            <input v-model="form.siret" type="text" class="form-input" placeholder="12345678901234" />
          </div>
          <div>
            <label class="form-label">Numéro TVA</label>
            <input v-model="form.vat_number" type="text" class="form-input" placeholder="FR12345678901" />
          </div>
          <div>
            <label class="form-label">IBAN</label>
            <input v-model="form.iban" type="text" class="form-input" placeholder="FR76..." />
          </div>
          <div>
            <label class="form-label">BIC</label>
            <input v-model="form.bic" type="text" class="form-input" />
          </div>
          <div>
            <label class="form-label">Taux TVA par défaut (%)</label>
            <input v-model.number="form.default_tax_rate" type="number" min="0" max="100" class="form-input" />
          </div>
          <div>
            <label class="form-label">Délai de paiement (jours)</label>
            <input v-model.number="form.payment_terms" type="number" min="0" class="form-input" />
          </div>
        </div>

        <div v-if="saved" class="bg-green-50 border border-green-200 rounded-lg p-3">
          <p class="text-sm text-green-700">✓ Paramètres enregistrés</p>
        </div>

        <button type="submit" :disabled="saving" class="btn-primary">
          {{ saving ? 'Enregistrement...' : 'Sauvegarder' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const saving = ref(false)
const saved = ref(false)

const form = reactive({
  company_name: '', email: '', phone: '', address: '',
  siret: '', vat_number: '', iban: '', bic: '',
  default_tax_rate: 20, payment_terms: 30
})

onMounted(async () => {
  const { data } = await supabase.from('settings').select('*').eq('user_id', authStore.user?.id).single()
  if (data) Object.assign(form, data)
})

async function handleSave() {
  saving.value = true
  const { error } = await supabase.from('settings').upsert({ ...form, user_id: authStore.user?.id })
  if (!error) { saved.value = true; setTimeout(() => saved.value = false, 3000) }
  saving.value = false
}
</script>
