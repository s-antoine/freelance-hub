import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

const routes = [
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/AuthView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue')
      },
      {
        path: 'clients',
        name: 'Clients',
        component: () => import('@/views/ClientsView.vue')
      },
      {
        path: 'clients/:id',
        name: 'ClientDetail',
        component: () => import('@/views/ClientDetailView.vue')
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/ProjectsView.vue')
      },
      {
        path: 'invoices',
        name: 'Invoices',
        component: () => import('@/views/InvoicesView.vue')
      },
      {
        path: 'invoices/:id',
        name: 'InvoiceDetail',
        component: () => import('@/views/InvoiceDetailView.vue')
      },
      {
        path: 'accounting',
        name: 'Accounting',
        component: () => import('@/views/AccountingView.vue')
      },
      {
        path: 'time-tracking',
        name: 'TimeTracking',
        component: () => import('@/views/TimeTrackingView.vue')
      },
      {
        path: 'tickets',
        name: 'Tickets',
        component: () => import('@/views/TicketsView.vue')
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/FinanceView.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (to.meta.requiresAuth && !session) return '/auth'
  if (to.path === '/auth' && session) return '/'
})

export default router
