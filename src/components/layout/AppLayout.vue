<template>
  <div class="min-h-screen bg-gray-50 flex">

    <!-- Backdrop mobile -->
    <Transition name="fade">
      <div
        v-if="mobileMenuOpen"
        @click="mobileMenuOpen = false"
        class="fixed inset-0 bg-black/50 z-20 md:hidden"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed h-full z-30 flex flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out"
      :class="[
        'w-64',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0'
      ]"
    >
      <!-- Logo + close button -->
      <div class="p-5 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="text-white text-sm font-bold">F</span>
          </div>
          <span class="font-bold text-gray-900 text-lg">FreelanceHub</span>
        </div>
        <button
          @click="mobileMenuOpen = false"
          class="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Fermer le menu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          @click="mobileMenuOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
        >
          <span class="text-base w-5 text-center">{{ item.emoji }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- User + logout -->
      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span class="text-indigo-700 text-sm font-bold">{{ userInitial }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ userEmail }}</p>
          </div>
        </div>
        <button
          @click="handleSignOut"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span>🚪</span>
          Se déconnecter
        </button>
      </div>
    </aside>

    <!-- Contenu principal -->
    <div class="flex-1 flex flex-col md:ml-64 min-h-screen">

      <!-- Header mobile -->
      <header class="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between flex-shrink-0">
        <button
          @click="mobileMenuOpen = true"
          class="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
            <span class="text-white text-xs font-bold">F</span>
          </div>
          <span class="font-bold text-gray-900">{{ currentPageLabel }}</span>
        </div>

        <!-- Avatar -->
        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span class="text-indigo-700 text-sm font-bold">{{ userInitial }}</span>
        </div>
      </header>

      <!-- Vue principale -->
      <main class="flex-1 pb-20 md:pb-0">
        <RouterView />
      </main>
    </div>

    <!-- Bottom nav mobile -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 safe-bottom">
      <div class="flex items-stretch">
        <RouterLink
          v-for="item in bottomNavItems"
          :key="item.to"
          :to="item.to"
          class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors min-h-[56px]"
          :class="isActive(item.to)
            ? 'text-indigo-600'
            : 'text-gray-400'"
        >
          <span class="text-xl leading-none">{{ item.emoji }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>

        <!-- Bouton "Plus" -->
        <button
          @click="mobileMenuOpen = true"
          class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium text-gray-400 min-h-[56px]"
        >
          <span class="text-xl leading-none">⋯</span>
          <span>Plus</span>
        </button>
      </div>
    </nav>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const mobileMenuOpen = ref(false)

// Fermer le menu au changement de route
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

const navItems = [
  { to: '/', label: 'Dashboard', emoji: '📊' },
  { to: '/clients', label: 'Clients', emoji: '👥' },
  { to: '/projects', label: 'Projets', emoji: '📁' },
  { to: '/invoices', label: 'Factures', emoji: '🧾' },
  { to: '/accounting', label: 'Comptabilité', emoji: '💰' },
  { to: '/time-tracking', label: 'Time Tracking', emoji: '⏱️' },
  { to: '/tickets', label: 'Tickets', emoji: '🎫' },
  { to: '/settings', label: 'Paramètres', emoji: '⚙️' },
]

// 4 onglets principaux dans la barre basse
const bottomNavItems = [
  { to: '/', label: 'Dashboard', emoji: '📊' },
  { to: '/clients', label: 'Clients', emoji: '👥' },
  { to: '/invoices', label: 'Factures', emoji: '🧾' },
  { to: '/projects', label: 'Projets', emoji: '📁' },
]

const userEmail = computed(() => authStore.user?.email ?? '')
const userInitial = computed(() => userEmail.value.charAt(0).toUpperCase())

const currentPageLabel = computed(() => {
  const item = navItems.find(i => isActive(i.to))
  return item?.label ?? 'FreelanceHub'
})

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleSignOut() {
  await authStore.signOut()
  router.push('/auth')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Safe area pour iPhone (encoche, home bar) */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
