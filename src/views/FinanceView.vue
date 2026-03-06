<template>
  <div class="p-4 md:p-8">

    <!-- Header -->
    <div class="flex items-start justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Finance 💹</h1>
        <p class="text-gray-500 mt-1">Pilotage et optimisation financière</p>
      </div>
      <button @click="showSettings = true" class="btn-secondary shrink-0">
        ⚙️ <span class="hidden sm:inline">Paramètres</span>
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex-1 min-w-fit px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        :class="activeTab === tab.id
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'"
      >
        {{ tab.emoji }} {{ tab.label }}
      </button>
    </div>

    <!-- ───────────────────────────────────────
         TAB 1 : TRÉSORERIE
    ─────────────────────────────────────── -->
    <div v-show="activeTab === 'tresorerie'" class="space-y-4">

      <!-- Solde bancaire -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm font-medium text-gray-500 mb-2">Solde bancaire actuel</p>
        <div class="flex items-center gap-3">
          <input
            v-model.number="financeStore.settings.bankBalance"
            @change="financeStore.saveSettings()"
            type="number"
            step="100"
            class="form-input text-xl font-bold w-full max-w-xs"
            placeholder="0"
          />
          <span class="text-gray-400 text-sm">€</span>
        </div>
      </div>

      <!-- Provisions -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm font-semibold text-gray-700 mb-4">Provisions à mettre de côté</p>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
              <span class="text-sm text-gray-600">TVA à reverser</span>
              <span class="text-xs text-gray-400">(factures envoyées non payées)</span>
            </div>
            <span class="font-semibold text-amber-600">{{ financeStore.formatCurrency(tvaProvision) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-red-400 shrink-0"></span>
              <span class="text-sm text-gray-600">Provision ISoc</span>
              <span class="text-xs text-gray-400">(estimation annuelle)</span>
            </div>
            <span class="font-semibold text-red-600">{{ financeStore.formatCurrency(isocProvision) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-purple-400 shrink-0"></span>
              <span class="text-sm text-gray-600">Cotisations sociales</span>
              <span class="text-xs text-gray-400">(salaire × taux)</span>
            </div>
            <span class="font-semibold text-purple-600">{{ financeStore.formatCurrency(cotisationsProvision) }}</span>
          </div>
          <div class="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span class="text-sm font-semibold text-gray-700">Total provisions</span>
            <span class="font-bold text-gray-900">{{ financeStore.formatCurrency(totalProvisions) }}</span>
          </div>
        </div>
      </div>

      <!-- Barre de répartition -->
      <div v-if="financeStore.settings.bankBalance > 0" class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm font-medium text-gray-500 mb-3">Répartition du solde</p>
        <div class="flex h-4 rounded-full overflow-hidden gap-px">
          <div class="bg-amber-400 transition-all" :style="`width: ${tvaPercent}%`" :title="`TVA ${tvaPercent.toFixed(0)}%`"></div>
          <div class="bg-red-400 transition-all" :style="`width: ${isocPercent}%`" :title="`ISoc ${isocPercent.toFixed(0)}%`"></div>
          <div class="bg-purple-400 transition-all" :style="`width: ${cotisPercent}%`" :title="`Cotisations ${cotisPercent.toFixed(0)}%`"></div>
          <div class="bg-green-400 flex-1 transition-all" :title="'Disponible'"></div>
        </div>
        <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
          <span>🟡 TVA {{ tvaPercent.toFixed(0) }}%</span>
          <span>🔴 ISoc {{ isocPercent.toFixed(0) }}%</span>
          <span>🟣 Cotis. {{ cotisPercent.toFixed(0) }}%</span>
          <span>🟢 Dispo {{ Math.max(0, 100 - tvaPercent - isocPercent - cotisPercent).toFixed(0) }}%</span>
        </div>
      </div>

      <!-- Disponible net -->
      <div class="bg-white rounded-2xl border-2 p-6 text-center"
           :class="disponibleNet >= 0 ? 'border-green-200' : 'border-red-200'">
        <p class="text-sm font-medium text-gray-500 mb-2">DISPONIBLE NET</p>
        <p class="text-4xl font-bold" :class="disponibleNet >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ financeStore.formatCurrency(disponibleNet) }}
        </p>
        <p class="text-sm text-gray-400 mt-2">
          {{ disponibleNet >= 0 ? '✅ Provisions couvertes' : '⚠️ Solde insuffisant pour couvrir les provisions' }}
        </p>
      </div>
    </div>

    <!-- ───────────────────────────────────────
         TAB 2 : RÉMUNÉRATION OPTIMALE
    ─────────────────────────────────────── -->
    <div v-show="activeTab === 'remuneration'" class="space-y-5">

      <!-- Inputs -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm font-semibold text-gray-700 mb-4">Paramètres du simulateur</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="form-label">CA annuel HT (€)</label>
            <input v-model.number="remCA" type="number" step="1000" min="0" class="form-input" placeholder="80000" />
          </div>
          <div>
            <label class="form-label">Dépenses déductibles (€)</label>
            <input v-model.number="remDépenses" type="number" step="500" min="0" class="form-input" placeholder="10000" />
          </div>
          <div>
            <label class="form-label">Salaire mensuel brut (€)</label>
            <input v-model.number="remSalaireMensuel" type="number" step="100" min="0" class="form-input" placeholder="3000" />
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-3">
          💡 Calculs simplifiés basés sur les barèmes belges 2024. À titre indicatif — consultez votre comptable.
        </p>
      </div>

      <!-- 3 scénarios -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

        <!-- Scénario A: Tout salaire -->
        <div class="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">Tout en salaire</h3>
            <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Simple</span>
          </div>
          <div class="space-y-2 text-sm flex-1">
            <div class="flex justify-between">
              <span class="text-gray-500">Salaire brut</span>
              <span>{{ financeStore.formatCurrency(scenA.salaryGross) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
              <span>Cotisations sociales</span>
              <span>-{{ financeStore.formatCurrency(scenA.cotisations) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
              <span>IPP estimé</span>
              <span>-{{ financeStore.formatCurrency(scenA.ipp) }}</span>
            </div>
            <div class="flex justify-between text-green-600">
              <span>ISoc</span>
              <span>{{ financeStore.formatCurrency(0) }}</span>
            </div>
          </div>
          <div class="border-t border-gray-100 mt-4 pt-4">
            <p class="text-xs text-gray-400 mb-1">Net annuel</p>
            <p class="text-2xl font-bold text-gray-900">{{ financeStore.formatCurrency(scenA.netAnnuel) }}</p>
            <p class="text-sm text-gray-500">≈ {{ financeStore.formatCurrency(scenA.netAnnuel / 12) }}/mois</p>
          </div>
        </div>

        <!-- Scénario B: Salaire + Dividendes -->
        <div class="bg-white rounded-2xl border-2 border-indigo-200 p-5 flex flex-col relative">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">Salaire + Dividendes</h3>
            <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">⭐ Court terme</span>
          </div>
          <div class="space-y-2 text-sm flex-1">
            <div class="flex justify-between">
              <span class="text-gray-500">Salaire (≥45k ISoc réduit)</span>
              <span>{{ financeStore.formatCurrency(45000) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
              <span>Cotisations sociales</span>
              <span>-{{ financeStore.formatCurrency(scenB.cotisations) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
              <span>IPP sur salaire</span>
              <span>-{{ financeStore.formatCurrency(scenB.ipp) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
              <span>ISoc (20%)</span>
              <span>-{{ financeStore.formatCurrency(scenB.isoc) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Dividendes bruts</span>
              <span>{{ financeStore.formatCurrency(scenB.dividendes) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
              <span>Précompte mobilier (30%)</span>
              <span>-{{ financeStore.formatCurrency(scenB.precompte) }}</span>
            </div>
          </div>
          <div class="border-t border-gray-100 mt-4 pt-4">
            <p class="text-xs text-gray-400 mb-1">Net annuel</p>
            <p class="text-2xl font-bold text-indigo-600">{{ financeStore.formatCurrency(scenB.netAnnuel) }}</p>
            <p class="text-sm text-gray-500">≈ {{ financeStore.formatCurrency(scenB.netAnnuel / 12) }}/mois</p>
            <p v-if="scenB.netAnnuel > scenA.netAnnuel" class="text-xs text-green-600 mt-1 font-medium">
              +{{ financeStore.formatCurrency(scenB.netAnnuel - scenA.netAnnuel) }} vs tout salaire
            </p>
          </div>
        </div>

        <!-- Scénario C: Salaire + Réserve liquidation -->
        <div class="bg-white rounded-2xl border-2 border-emerald-200 p-5 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">Réserve liquidation</h3>
            <span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">🌿 Long terme</span>
          </div>
          <div class="space-y-2 text-sm flex-1">
            <div class="flex justify-between">
              <span class="text-gray-500">Salaire (≥45k ISoc réduit)</span>
              <span>{{ financeStore.formatCurrency(45000) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
              <span>Cotisations sociales</span>
              <span>-{{ financeStore.formatCurrency(scenC.cotisations) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
              <span>IPP sur salaire</span>
              <span>-{{ financeStore.formatCurrency(scenC.ipp) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
              <span>ISoc (20%)</span>
              <span>-{{ financeStore.formatCurrency(scenC.isoc) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Réserve brute</span>
              <span>{{ financeStore.formatCurrency(scenC.dividendes) }}</span>
            </div>
            <div class="flex justify-between text-amber-600">
              <span>Contribution réserve (10%)</span>
              <span>-{{ financeStore.formatCurrency(scenC.contribution) }}</span>
            </div>
            <div class="text-xs text-emerald-600 bg-emerald-50 rounded-lg p-2 mt-1">
              🔒 Bloqué 5 ans · 0% à la liquidation<br>
              Économie vs dividendes : <strong>{{ financeStore.formatCurrency(scenC.gainVsB) }}</strong>
            </div>
          </div>
          <div class="border-t border-gray-100 mt-4 pt-4">
            <p class="text-xs text-gray-400 mb-1">Net disponible maintenant</p>
            <p class="text-2xl font-bold text-emerald-600">{{ financeStore.formatCurrency(scenC.netImmédiat) }}</p>
            <p class="text-sm text-gray-500">+ {{ financeStore.formatCurrency(scenC.réserveBloquée) }} en réserve</p>
            <p class="text-xs text-emerald-600 mt-1 font-medium">
              Net futur total: {{ financeStore.formatCurrency(scenC.netFutur) }}/an
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ───────────────────────────────────────
         TAB 3 : TJM RÉEL
    ─────────────────────────────────────── -->
    <div v-show="activeTab === 'tjm'" class="space-y-4">

      <!-- CA source -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm font-semibold text-gray-700 mb-4">Chiffre d'affaires</p>
        <div class="flex items-center gap-3 mb-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="tjmUseReal" class="rounded" />
            <span class="text-sm text-gray-700">Utiliser le CA réel (factures payées cette année)</span>
          </label>
        </div>
        <div v-if="!tjmUseReal">
          <label class="form-label">CA annuel HT (€)</label>
          <input v-model.number="tjmCA" type="number" step="1000" min="0" class="form-input max-w-xs" />
        </div>
        <div v-else class="text-sm text-gray-600">
          CA réel (factures payées) : <strong class="text-gray-900">{{ financeStore.formatCurrency(caRéelAnnée) }}</strong>
        </div>
      </div>

      <!-- Jours -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm font-semibold text-gray-700 mb-4">Répartition des jours</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label class="form-label">Jours ouvrables</label>
            <input v-model.number="financeStore.settings.workingDaysYear" @change="financeStore.saveSettings()" type="number" min="1" max="365" class="form-input" />
          </div>
          <div>
            <label class="form-label">Congés pris</label>
            <input v-model.number="financeStore.settings.vacationDays" @change="financeStore.saveSettings()" type="number" min="0" class="form-input" />
          </div>
          <div>
            <label class="form-label">Jours maladie</label>
            <input v-model.number="financeStore.settings.sickDays" @change="financeStore.saveSettings()" type="number" min="0" class="form-input" />
          </div>
          <div>
            <label class="form-label">Non facturables</label>
            <input v-model.number="financeStore.settings.nonBillableDays" @change="financeStore.saveSettings()" type="number" min="0" class="form-input" />
            <p class="text-xs text-gray-400 mt-1">Admin, prospection…</p>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-4 text-sm">
          <span class="text-gray-500">Jours facturables : <strong class="text-gray-900">{{ joursFacturables }}</strong></span>
          <span class="text-gray-400">= {{ financeStore.settings.workingDaysYear }} - {{ financeStore.settings.vacationDays }} - {{ financeStore.settings.sickDays }} - {{ financeStore.settings.nonBillableDays }}</span>
        </div>
      </div>

      <!-- Résultat TJM -->
      <div class="bg-white rounded-2xl border-2 border-indigo-200 p-6 text-center">
        <p class="text-sm font-medium text-gray-500 mb-2">TJM RÉEL</p>
        <p class="text-5xl font-bold text-indigo-600">{{ tjmRéel > 0 ? Math.round(tjmRéel) : '—' }}€</p>
        <p class="text-sm text-gray-400 mt-1">par jour facturé</p>
        <div v-if="tjmRéel > 0 && tjmAffiché > 0" class="mt-3">
          <span v-if="tjmRéel < tjmAffiché" class="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            ⚠️ En dessous de votre TJM affiché ({{ Math.round(tjmAffiché) }}€)
          </span>
          <span v-else class="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
            ✅ Au-dessus de votre TJM affiché ({{ Math.round(tjmAffiché) }}€)
          </span>
        </div>
      </div>

      <!-- Objectif -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm font-semibold text-gray-700 mb-4">🎯 Simulateur d'objectif</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="form-label">Revenu net mensuel cible (€)</label>
            <input v-model.number="financeStore.settings.targetMonthlyNet" @change="financeStore.saveSettings()" type="number" step="100" min="0" class="form-input" />
          </div>
          <div>
            <label class="form-label">TJM facturé actuel (€)</label>
            <input v-model.number="tjmAffiché" type="number" step="10" min="0" class="form-input" />
          </div>
        </div>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between p-3 bg-gray-50 rounded-xl">
            <span class="text-gray-600">CA annuel nécessaire</span>
            <span class="font-semibold">{{ financeStore.formatCurrency(caObjectif) }}</span>
          </div>
          <div class="flex justify-between p-3 bg-gray-50 rounded-xl">
            <span class="text-gray-600">TJM nécessaire ({{ joursFacturables }} jours)</span>
            <span class="font-semibold text-indigo-600">{{ Math.round(tjmNécessaire) }}€/j</span>
          </div>
          <div class="flex justify-between p-3 rounded-xl" :class="joursÀFacturer <= joursFacturables ? 'bg-green-50' : 'bg-amber-50'">
            <span class="text-gray-600">Jours à facturer au TJM actuel</span>
            <span class="font-semibold" :class="joursÀFacturer <= joursFacturables ? 'text-green-700' : 'text-amber-700'">
              {{ Math.ceil(joursÀFacturer) }} jours
              <span v-if="joursÀFacturer > joursFacturables"> ⚠️</span>
              <span v-else> ✅</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ───────────────────────────────────────
         TAB 4 : BURN RATE & RUNWAY
    ─────────────────────────────────────── -->
    <div v-show="activeTab === 'burnrate'" class="space-y-4">

      <!-- Période -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm font-semibold text-gray-700 mb-3">Période de calcul du burn rate</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="m in [1, 3, 6, 12]"
            :key="m"
            @click="financeStore.settings.burnRateMonths = m; financeStore.saveSettings()"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="financeStore.settings.burnRateMonths === m
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ m }} mois
          </button>
        </div>
      </div>

      <!-- Burn rate -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Dépenses moyennes</p>
            <p class="text-xs text-gray-400">Moyenne sur {{ financeStore.settings.burnRateMonths }} mois</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-gray-900">{{ financeStore.formatCurrency(burnRate) }}</p>
            <p class="text-sm text-gray-400">par mois</p>
          </div>
        </div>
        <div v-if="expensesStore.expenses.length === 0" class="text-xs text-amber-600 mt-2">
          Aucune dépense enregistrée — renseigne tes dépenses dans la Comptabilité.
        </div>
      </div>

      <!-- Trésorerie disponible -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <p class="text-sm font-medium text-gray-500 mb-2">Trésorerie disponible (net des provisions)</p>
        <div class="flex items-center gap-3">
          <input
            v-model.number="financeStore.settings.bankBalance"
            @change="financeStore.saveSettings()"
            type="number"
            step="100"
            class="form-input max-w-xs text-lg font-bold"
          />
          <span class="text-sm text-gray-400">€ (synchro avec onglet Trésorerie)</span>
        </div>
      </div>

      <!-- RUNWAY -->
      <div class="bg-white rounded-2xl border-2 p-6 text-center"
           :class="runwayColor.border">
        <p class="text-sm font-medium text-gray-500 mb-2">RUNWAY</p>
        <p class="text-6xl font-bold" :class="runwayColor.text">
          {{ financeStore.formatMonths(runway) }}
        </p>
        <p class="text-lg text-gray-500 mt-1">mois</p>

        <!-- Jauge -->
        <div class="mt-5 h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="runwayColor.bar"
            :style="`width: ${Math.min(runway / 12 * 100, 100)}%`"
          ></div>
        </div>
        <div class="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span><span>3 mois</span><span>6 mois</span><span>12 mois</span>
        </div>

        <p class="text-sm mt-4 font-medium" :class="runwayColor.text">
          <template v-if="runway < 3">
            🔴 Danger — moins de 3 mois de survie. Priorité : décrocher un contrat.
          </template>
          <template v-else-if="runway < 6">
            🟠 Attention — {{ financeStore.formatMonths(runway) }} mois. Commence à prospecter.
          </template>
          <template v-else>
            🟢 Tu peux survivre {{ financeStore.formatMonths(runway) }} mois sans décrocher un seul contrat.
          </template>
        </p>
      </div>
    </div>

    <!-- ───────────────────────────────────────
         MODAL PARAMÈTRES
    ─────────────────────────────────────── -->
    <div v-if="showSettings" class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div class="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
        <h2 class="text-lg font-semibold text-gray-900 mb-5">⚙️ Paramètres financiers</h2>
        <div class="space-y-4 text-sm">
          <p class="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">Stockés localement dans ton navigateur. Jamais envoyés au serveur.</p>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Solde bancaire (€)</label>
              <input v-model.number="financeStore.settings.bankBalance" type="number" class="form-input" />
            </div>
            <div>
              <label class="form-label">Taux TVA (%)</label>
              <input v-model.number="financeStore.settings.tvaRate" type="number" step="0.5" class="form-input" />
            </div>
            <div>
              <label class="form-label">Taux ISoc réduit (%)</label>
              <input v-model.number="financeStore.settings.isocRate" type="number" step="0.5" class="form-input" />
            </div>
            <div>
              <label class="form-label">Taux cotisations (%)</label>
              <input v-model.number="financeStore.settings.cotisationsRate" type="number" step="0.5" class="form-input" />
            </div>
            <div>
              <label class="form-label">Salaire mensuel brut (€)</label>
              <input v-model.number="financeStore.settings.salaryMonthly" type="number" step="100" class="form-input" />
            </div>
            <div>
              <label class="form-label">Revenu net cible/mois (€)</label>
              <input v-model.number="financeStore.settings.targetMonthlyNet" type="number" step="100" class="form-input" />
            </div>
            <div>
              <label class="form-label">Jours ouvrables/an</label>
              <input v-model.number="financeStore.settings.workingDaysYear" type="number" class="form-input" />
            </div>
            <div>
              <label class="form-label">Jours de congé</label>
              <input v-model.number="financeStore.settings.vacationDays" type="number" class="form-input" />
            </div>
            <div>
              <label class="form-label">Jours maladie</label>
              <input v-model.number="financeStore.settings.sickDays" type="number" class="form-input" />
            </div>
            <div>
              <label class="form-label">Jours non facturables</label>
              <input v-model.number="financeStore.settings.nonBillableDays" type="number" class="form-input" />
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showSettings = false" class="btn-secondary flex-1">Annuler</button>
          <button @click="saveAndClose" class="btn-primary flex-1">Sauvegarder</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useInvoicesStore } from '@/stores/invoices'
import { useExpensesStore } from '@/stores/expenses'

const financeStore = useFinanceStore()
const invoicesStore = useInvoicesStore()
const expensesStore = useExpensesStore()

const activeTab = ref('tresorerie')
const showSettings = ref(false)

const tabs = [
  { id: 'tresorerie', emoji: '💰', label: 'Trésorerie' },
  { id: 'remuneration', emoji: '📊', label: 'Rémunération' },
  { id: 'tjm', emoji: '⏱️', label: 'TJM réel' },
  { id: 'burnrate', emoji: '🔥', label: 'Burn Rate' },
]

onMounted(async () => {
  await Promise.all([
    invoicesStore.fetchInvoices(),
    expensesStore.fetchExpenses()
  ])
})

// ─── TRÉSORERIE ───────────────────────────────────
const now = new Date()
const yearStart = new Date(now.getFullYear(), 0, 1)

// TVA collectée = tax_amount des factures envoyées (non encore payées → non encore reversées)
const tvaProvision = computed(() =>
  invoicesStore.invoices
    .filter(i => i.status === 'sent')
    .reduce((sum, i) => sum + (i.tax_amount || 0), 0)
)

// Estimation ISoc: bénéfice YTD × taux
const beneficeYTD = computed(() => {
  const revenue = invoicesStore.invoices
    .filter(i => i.status === 'paid' && new Date(i.issue_date) >= yearStart)
    .reduce((sum, i) => sum + (i.subtotal || i.total || 0), 0)
  const depenses = expensesStore.expenses
    .filter(e => new Date(e.date) >= yearStart)
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const salairesAnnuels = financeStore.settings.salaryMonthly * 12
  return Math.max(0, revenue - depenses - salairesAnnuels)
})

const isocProvision = computed(() =>
  financeStore.calculateISoc(beneficeYTD.value)
)

const cotisationsProvision = computed(() =>
  financeStore.calculateCotisations(financeStore.settings.salaryMonthly * 12)
)

const totalProvisions = computed(() =>
  tvaProvision.value + isocProvision.value + cotisationsProvision.value
)

const disponibleNet = computed(() =>
  financeStore.settings.bankBalance - totalProvisions.value
)

const tvaPercent = computed(() =>
  financeStore.settings.bankBalance > 0
    ? Math.min(tvaProvision.value / financeStore.settings.bankBalance * 100, 100)
    : 0
)
const isocPercent = computed(() =>
  financeStore.settings.bankBalance > 0
    ? Math.min(isocProvision.value / financeStore.settings.bankBalance * 100, 100 - tvaPercent.value)
    : 0
)
const cotisPercent = computed(() =>
  financeStore.settings.bankBalance > 0
    ? Math.min(cotisationsProvision.value / financeStore.settings.bankBalance * 100, 100 - tvaPercent.value - isocPercent.value)
    : 0
)

// ─── RÉMUNÉRATION ──────────────────────────────────
const remCA = ref(80000)
const remDépenses = ref(10000)
const remSalaireMensuel = ref(financeStore.settings.salaryMonthly)

// Scénario A: tout en salaire
const scenA = computed(() => {
  const salaryGross = Math.max(0, remCA.value - remDépenses.value)
  const cotisations = financeStore.calculateCotisations(salaryGross)
  const ipp = financeStore.calculateIPP(salaryGross)
  const netAnnuel = salaryGross - cotisations - ipp
  return { salaryGross, cotisations, ipp, netAnnuel }
})

// Scénario B: salaire 45k + dividendes
const scenB = computed(() => {
  const salary = 45000
  const cotisations = financeStore.calculateCotisations(salary)
  const ipp = financeStore.calculateIPP(salary)
  const benefice = Math.max(0, remCA.value - remDépenses.value - salary)
  const isoc = financeStore.calculateISoc(benefice)
  const dividendes = Math.max(0, benefice - isoc)
  const precompte = dividendes * 0.30
  const netAnnuel = (salary - cotisations - ipp) + (dividendes - precompte)
  return { cotisations, ipp, isoc, dividendes, precompte, netAnnuel }
})

// Scénario C: salaire 45k + réserve liquidation (10%)
const scenC = computed(() => {
  const salary = 45000
  const cotisations = financeStore.calculateCotisations(salary)
  const ipp = financeStore.calculateIPP(salary)
  const benefice = Math.max(0, remCA.value - remDépenses.value - salary)
  const isoc = financeStore.calculateISoc(benefice)
  const dividendes = Math.max(0, benefice - isoc)
  const contribution = dividendes * 0.10
  const réserveBloquée = dividendes - contribution
  const netImmédiat = (salary - cotisations - ipp)
  const gainVsB = dividendes * 0.20
  const netFutur = netImmédiat + dividendes // 0% tax at liquidation
  return { cotisations, ipp, isoc, dividendes, contribution, réserveBloquée, netImmédiat, gainVsB, netFutur }
})

// ─── TJM ───────────────────────────────────────────
const tjmUseReal = ref(false)
const tjmCA = ref(80000)
const tjmAffiché = ref(400)

const caRéelAnnée = computed(() =>
  invoicesStore.invoices
    .filter(i => i.status === 'paid' && new Date(i.issue_date) >= yearStart)
    .reduce((sum, i) => sum + (i.subtotal || 0), 0)
)

const caEffectif = computed(() =>
  tjmUseReal.value ? caRéelAnnée.value : tjmCA.value
)

const joursFacturables = computed(() =>
  Math.max(0,
    financeStore.settings.workingDaysYear
    - financeStore.settings.vacationDays
    - financeStore.settings.sickDays
    - financeStore.settings.nonBillableDays
  )
)

const tjmRéel = computed(() =>
  joursFacturables.value > 0 ? caEffectif.value / joursFacturables.value : 0
)

// CA annuel nécessaire pour atteindre targetMonthlyNet
// Approximation: net = 60% du gross CA (après ISoc ~20%, cotis ~12%, IPP)
const caObjectif = computed(() => {
  const targetAnnuel = financeStore.settings.targetMonthlyNet * 12
  return targetAnnuel / 0.58 // facteur de conversion net→brut approximatif
})

const tjmNécessaire = computed(() =>
  joursFacturables.value > 0 ? caObjectif.value / joursFacturables.value : 0
)

const joursÀFacturer = computed(() =>
  tjmAffiché.value > 0 ? caObjectif.value / tjmAffiché.value : Infinity
)

// ─── BURN RATE ─────────────────────────────────────
const burnRate = computed(() => {
  const months = financeStore.settings.burnRateMonths
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)

  const total = expensesStore.expenses
    .filter(e => new Date(e.date) >= cutoff)
    .reduce((sum, e) => sum + (e.amount || 0), 0)

  return months > 0 ? total / months : 0
})

const runway = computed(() =>
  burnRate.value > 0 ? financeStore.settings.bankBalance / burnRate.value : Infinity
)

const runwayColor = computed(() => {
  if (runway.value < 3) return { border: 'border-red-200', text: 'text-red-600', bar: 'bg-red-500' }
  if (runway.value < 6) return { border: 'border-amber-200', text: 'text-amber-600', bar: 'bg-amber-500' }
  return { border: 'border-green-200', text: 'text-green-600', bar: 'bg-green-500' }
})

// ─── SETTINGS ──────────────────────────────────────
function saveAndClose() {
  financeStore.saveSettings()
  showSettings.value = false
}
</script>
