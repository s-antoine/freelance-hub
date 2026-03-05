<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span class="text-white text-xl font-bold">F</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">FreelanceHub</h1>
        <p class="text-gray-500 mt-1">Gérez votre activité freelance</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div class="flex gap-2 mb-6">
          <button
            @click="mode = 'login'"
            class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="mode === 'login' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'"
          >
            Connexion
          </button>
          <button
            @click="mode = 'register'"
            class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="mode === 'register' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'"
          >
            Inscription
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="mode === 'register'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input
              v-model="form.fullName"
              type="text"
              required
              placeholder="Jean Dupont"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="jean@example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              v-model="form.password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <div v-if="success" class="bg-green-50 border border-green-200 rounded-lg p-3">
            <p class="text-sm text-green-600">{{ success }}</p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : "S'inscrire") }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const mode = ref('login')
const loading = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({ email: '', password: '', fullName: '' })

async function handleSubmit() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await authStore.signIn(form.email, form.password)
      router.push('/')
    } else {
      await authStore.signUp(form.email, form.password, form.fullName)
      success.value = 'Compte créé ! Vérifiez votre email pour confirmer votre inscription.'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
