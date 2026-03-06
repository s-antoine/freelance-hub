<template>
  <div class="p-4 md:p-8">
    <div class="flex items-center gap-4 mb-8">
      <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <ArrowLeftIcon class="w-5 h-5 text-gray-600" />
      </button>
      <h1 class="text-2xl font-bold text-gray-900">{{ client?.name }}</h1>
    </div>
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 class="font-semibold text-gray-900 mb-4">Informations</h2>
        <dl class="space-y-3 text-sm">
          <div><dt class="text-gray-500">Email</dt><dd class="font-medium">{{ client?.email }}</dd></div>
          <div><dt class="text-gray-500">Téléphone</dt><dd class="font-medium">{{ client?.phone || '—' }}</dd></div>
          <div><dt class="text-gray-500">Entreprise</dt><dd class="font-medium">{{ client?.company || '—' }}</dd></div>
          <div><dt class="text-gray-500">Adresse</dt><dd class="font-medium">{{ client?.address || '—' }}</dd></div>
        </dl>
      </div>
      <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
        <h2 class="font-semibold text-gray-900 mb-4">Factures</h2>
        <p class="text-gray-400 text-sm">Aucune facture pour ce client.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const client = ref(null)
const loading = ref(true)

onMounted(async () => {
  const { data } = await supabase.from('clients').select('*').eq('id', route.params.id).single()
  client.value = data
  loading.value = false
})
</script>
