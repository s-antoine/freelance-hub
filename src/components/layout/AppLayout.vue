<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span class="text-white text-sm font-bold">F</span>
          </div>
          <span class="font-bold text-gray-900 text-lg">FreelanceHub</span>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span class="text-indigo-700 text-sm font-bold">
              {{ userInitial }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ userEmail }}</p>
          </div>
        </div>
        <button
          @click="handleSignOut"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon class="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 ml-64 min-h-screen">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon },
  { to: '/clients', label: 'Clients', icon: UsersIcon },
  { to: '/projects', label: 'Projets', icon: FolderIcon },
  { to: '/invoices', label: 'Factures', icon: DocumentTextIcon },
  { to: '/accounting', label: 'Comptabilité', icon: CurrencyEuroIcon },
  { to: '/time-tracking', label: 'Time Tracking', icon: ClockIcon },
  { to: '/settings', label: 'Paramètres', icon: Cog6ToothIcon },
]

const userEmail = computed(() => authStore.user?.email ?? '')
const userInitial = computed(() => userEmail.value.charAt(0).toUpperCase())

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleSignOut() {
  await authStore.signOut()
  router.push('/auth')
}
</script>
