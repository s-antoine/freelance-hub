<template>
  <div class="p-4 md:p-8">

    <!-- Header -->
    <div class="flex items-start justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Finance 💹</h1>
        <p class="text-gray-500 mt-1">Pilotage financier de ta SRL</p>
      </div>
      <button @click="showSettings = true" class="btn-secondary shrink-0 text-sm">
        ⚙️ <span class="hidden sm:inline">Réglages</span>
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors"
        :class="activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'"
      >
        {{ tab.emoji }}<span class="hidden sm:inline"> {{ tab.label }}</span>
        <span class="sm:hidden block text-[10px]">{{ tab.short }}</span>
      </button>
    </div>

    <!-- Bandeau "données manquantes" -->
    <div v-if="hasNoData" class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-700">
      💡 Ajoute des factures et dépenses dans l'app — les modules Finance se rempliront automatiquement.
    </div>

    <!-- ══════════════════════════════════
         TAB 1 : TRÉSORERIE
    ══════════════════════════════════ -->
    <div v-show="activeTab === 'tresorerie'" class="space-y-3">

      <!-- Seul champ manuel -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <label class="text-xs font-medium text-gray-400 uppercase tracking-wide">Solde bancaire actuel</label>
        <div class="flex items-baseline gap-2 mt-1">
          <input
            v-model.number="financeStore.settings.bankBalance"
            @change="financeStore.saveSettings()"
            type="number" step="100"
            class="text-3xl font-bold text-gray-900 w-full border-0 outline-none bg-transparent p-0"
            placeholder="0"
          />
          <span class="text-xl text-gray-400 font-medium">€</span>
        </div>
      </div>

      <!-- Provisions auto -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-gray-700">À provisionner</p>
          <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">📊 données réelles</span>
        </div>
        <div class="space-y-2.5">
          <div class="flex justify-between items-center">
            <div>
              <span class="text-sm text-gray-700">TVA à reverser</span>
              <p class="text-xs text-gray-400">{{ invoicesSent.length }} facture(s) envoyée(s) non payée(s)</p>
            </div>
            <span class="font-semibold text-amber-600">{{ fmt(tvaProvision) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <div>
              <span class="text-sm text-gray-700">Provision ISoc</span>
              <p class="text-xs text-gray-400">20% sur bénéfice estimé {{ fmt(beneficeYTD) }}</p>
            </div>
            <span class="font-semibold text-red-600">{{ fmt(isocProvision) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <div>
              <span class="text-sm text-gray-700">Cotisations sociales</span>
              <p class="text-xs text-gray-400">{{ financeStore.settings.cotisationsRate }}% sur salaire annuel</p>
            </div>
            <span class="font-semibold text-purple-600">{{ fmt(cotisationsProvision) }}</span>
          </div>
          <div class="border-t border-gray-100 pt-2 flex justify-between items-center font-semibold">
            <span class="text-sm text-gray-800">Total provisions</span>
            <span>{{ fmt(totalProvisions) }}</span>
          </div>
        </div>
      </div>

      <!-- Barre de répartition -->
      <div v-if="financeStore.settings.bankBalance > 0" class="bg-white rounded-2xl border border-gray-200 p-4">
        <p class="text-xs text-gray-400 mb-2">Répartition du solde</p>
        <div class="h-5 rounded-full overflow-hidden flex gap-px bg-gray-100">
          <div class="bg-amber-400" :style="`width:${tvaP}%`"></div>
          <div class="bg-red-400" :style="`width:${isocP}%`"></div>
          <div class="bg-purple-400" :style="`width:${cotisP}%`"></div>
          <div class="bg-green-400 flex-1"></div>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
          <span>🟡 TVA {{ tvaP.toFixed(0) }}%</span>
          <span>🔴 ISoc {{ isocP.toFixed(0) }}%</span>
          <span>🟣 Cotis. {{ cotisP.toFixed(0) }}%</span>
          <span>🟢 Dispo {{ Math.max(0, 100-tvaP-isocP-cotisP).toFixed(0) }}%</span>
        </div>
      </div>

      <!-- Disponible net -->
      <div class="rounded-2xl border-2 p-5 text-center"
           :class="disponibleNet >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Disponible net</p>
        <p class="text-4xl font-bold" :class="disponibleNet >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ fmt(disponibleNet) }}
        </p>
        <p class="text-xs text-gray-400 mt-2">
          {{ disponibleNet >= 0 ? '✅ Provisions couvertes' : '⚠️ Solde insuffisant pour couvrir les provisions' }}
        </p>
      </div>
    </div>

    <!-- ══════════════════════════════════
         TAB 2 : RÉMUNÉRATION
    ══════════════════════════════════ -->
    <div v-show="activeTab === 'remuneration'" class="space-y-4">

      <!-- Données source -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-gray-700">Base de calcul</p>
          <button @click="remOverride = !remOverride" class="text-xs text-indigo-600 hover:text-indigo-800">
            {{ remOverride ? 'Utiliser données réelles' : '✏️ Ajuster' }}
          </button>
        </div>
        <div v-if="!remOverride" class="space-y-1.5 text-sm">
          <div class="flex justify-between text-gray-600">
            <span>CA annuel HT (factures payées)</span>
            <span class="font-semibold text-gray-900">{{ fmt(caAnnée) }}</span>
          </div>
          <div class="flex justify-between text-gray-600">
            <span>Dépenses déductibles</span>
            <span class="font-semibold text-gray-900">{{ fmt(dépensesAnnée) }}</span>
          </div>
          <div class="flex justify-between text-gray-600">
            <span>Salaire mensuel brut</span>
            <span class="font-semibold text-gray-900">{{ fmt(financeStore.settings.salaryMonthly) }}/mois</span>
          </div>
          <p class="text-xs text-gray-400 pt-1">📊 Calculé depuis tes factures et dépenses de l'année en cours</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <label class="form-label">CA annuel HT (€)</label>
            <input v-model.number="remCAManuel" type="number" step="1000" class="form-input" />
          </div>
          <div>
            <label class="form-label">Dépenses (€)</label>
            <input v-model.number="remDépensesManuel" type="number" step="500" class="form-input" />
          </div>
          <div>
            <label class="form-label">Salaire mensuel brut (€)</label>
            <input v-model.number="financeStore.settings.salaryMonthly" @change="financeStore.saveSettings()" type="number" step="100" class="form-input" />
          </div>
        </div>
      </div>

      <p class="text-xs text-gray-400 px-1">Barèmes belges 2024 simplifiés — à titre indicatif. Consulte ton comptable.</p>

      <!-- 3 scénarios : scroll horizontal mobile, grid desktop -->
      <div class="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:overflow-visible md:snap-none -mx-4 px-4 md:mx-0 md:px-0">

        <!-- Scénario A -->
        <div class="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col min-w-[260px] md:min-w-0 snap-start shrink-0 md:shrink">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-gray-900">Tout en salaire</span>
            <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Simple</span>
          </div>
          <div class="space-y-1.5 text-xs text-gray-500 flex-1">
            <div class="flex justify-between"><span>Salaire brut</span><span class="text-gray-900">{{ fmt(scenA.salaryGross) }}</span></div>
            <div class="flex justify-between text-red-500"><span>Cotisations</span><span>-{{ fmt(scenA.cotisations) }}</span></div>
            <div class="flex justify-between text-red-500"><span>IPP estimé</span><span>-{{ fmt(scenA.ipp) }}</span></div>
            <div class="flex justify-between text-gray-300"><span>ISoc</span><span>0 €</span></div>
          </div>
          <div class="border-t border-gray-100 mt-3 pt-3">
            <p class="text-2xl font-bold text-gray-900">{{ fmt(scenA.netAnnuel) }}</p>
            <p class="text-xs text-gray-400">≈ {{ fmt(scenA.netAnnuel / 12) }}/mois</p>
          </div>
        </div>

        <!-- Scénario B -->
        <div class="bg-white rounded-2xl border-2 border-indigo-200 p-4 flex flex-col min-w-[260px] md:min-w-0 snap-start shrink-0 md:shrink relative">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-gray-900">Salaire + Dividendes</span>
            <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">⭐ Court terme</span>
          </div>
          <div class="space-y-1.5 text-xs text-gray-500 flex-1">
            <div class="flex justify-between"><span>Salaire (45k min.)</span><span class="text-gray-900">45 000 €</span></div>
            <div class="flex justify-between text-red-500"><span>Cotisations</span><span>-{{ fmt(scenB.cotisations) }}</span></div>
            <div class="flex justify-between text-red-500"><span>IPP</span><span>-{{ fmt(scenB.ipp) }}</span></div>
            <div class="flex justify-between text-red-500"><span>ISoc 20%</span><span>-{{ fmt(scenB.isoc) }}</span></div>
            <div class="flex justify-between"><span>Dividendes bruts</span><span class="text-gray-900">{{ fmt(scenB.dividendes) }}</span></div>
            <div class="flex justify-between text-red-500"><span>Précompte 30%</span><span>-{{ fmt(scenB.precompte) }}</span></div>
          </div>
          <div class="border-t border-gray-100 mt-3 pt-3">
            <p class="text-2xl font-bold text-indigo-600">{{ fmt(scenB.netAnnuel) }}</p>
            <p class="text-xs text-gray-400">≈ {{ fmt(scenB.netAnnuel / 12) }}/mois</p>
            <p v-if="scenB.netAnnuel > scenA.netAnnuel" class="text-xs text-green-600 mt-1 font-medium">
              +{{ fmt(scenB.netAnnuel - scenA.netAnnuel) }} vs tout salaire
            </p>
          </div>
        </div>

        <!-- Scénario C -->
        <div class="bg-white rounded-2xl border-2 border-emerald-200 p-4 flex flex-col min-w-[260px] md:min-w-0 snap-start shrink-0 md:shrink">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-gray-900">Réserve liquidation</span>
            <span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">🌿 Long terme</span>
          </div>
          <div class="space-y-1.5 text-xs text-gray-500 flex-1">
            <div class="flex justify-between"><span>Salaire (45k min.)</span><span class="text-gray-900">45 000 €</span></div>
            <div class="flex justify-between text-red-500"><span>Cotisations</span><span>-{{ fmt(scenC.cotisations) }}</span></div>
            <div class="flex justify-between text-red-500"><span>IPP</span><span>-{{ fmt(scenC.ipp) }}</span></div>
            <div class="flex justify-between text-red-500"><span>ISoc 20%</span><span>-{{ fmt(scenC.isoc) }}</span></div>
            <div class="flex justify-between"><span>Réserve brute</span><span class="text-gray-900">{{ fmt(scenC.dividendes) }}</span></div>
            <div class="flex justify-between text-amber-600"><span>Contribution 10%</span><span>-{{ fmt(scenC.contribution) }}</span></div>
            <div class="bg-emerald-50 rounded-lg p-2 text-emerald-700 text-xs mt-1">
              🔒 Bloqué 5 ans · 0% à la liquidation<br>
              Économie : <strong>{{ fmt(scenC.gainVsB) }}</strong>
            </div>
          </div>
          <div class="border-t border-gray-100 mt-3 pt-3">
            <p class="text-2xl font-bold text-emerald-600">{{ fmt(scenC.netImmédiat) }}</p>
            <p class="text-xs text-gray-400">+ {{ fmt(scenC.réserveBloquée) }} en réserve</p>
            <p class="text-xs text-emerald-600 mt-1 font-medium">Net total in fine : {{ fmt(scenC.netFutur) }}/an</p>
          </div>
        </div>
      </div>

      <!-- Indicateur swipe mobile -->
      <p class="text-center text-xs text-gray-400 md:hidden">← Fais défiler pour voir les 3 scénarios →</p>
    </div>

    <!-- ══════════════════════════════════
         TAB 3 : TJM RÉEL
    ══════════════════════════════════ -->
    <div v-show="activeTab === 'tjm'" class="space-y-3">

      <!-- TJM réel (big) -->
      <div class="bg-white rounded-2xl border-2 border-indigo-200 p-5 text-center">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-2">TJM réel</p>
        <p class="text-5xl font-bold text-indigo-600">{{ tjmRéel > 0 ? Math.round(tjmRéel) + '€' : '—' }}</p>
        <p class="text-xs text-gray-400 mt-1">par jour facturé</p>
        <div v-if="loading" class="text-xs text-gray-400 mt-2">Chargement des données…</div>
        <div v-else-if="tjmRéel > 0" class="mt-3 text-xs text-gray-500">
          {{ fmt(caAnnée) }} CA ÷ {{ joursFacturés }} jours facturés
        </div>
      </div>

      <!-- Données source -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4 space-y-2.5">
        <div class="flex items-center justify-between mb-1">
          <p class="text-sm font-semibold text-gray-700">Décomposition</p>
          <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">📊 données réelles</span>
        </div>

        <div class="flex justify-between text-sm">
          <span class="text-gray-500">CA année (factures payées)</span>
          <span class="font-semibold">{{ fmt(caAnnée) }}</span>
        </div>

        <div v-if="hoursFromTimeTracking > 0" class="flex justify-between text-sm">
          <span class="text-gray-500">Heures loguées (time tracking)</span>
          <span class="font-semibold">{{ hoursFromTimeTracking }}h = {{ joursDepuisHeures }} jours</span>
        </div>

        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Jours facturables (config)</span>
          <span class="font-semibold">{{ joursFacturables }} j</span>
        </div>

        <div class="border-t border-gray-100 pt-2 text-xs text-gray-400">
          {{ financeStore.settings.workingDaysYear }} jours ouvrables
          − {{ financeStore.settings.vacationDays }} congés
          − {{ financeStore.settings.sickDays }} maladie
          − {{ financeStore.settings.nonBillableDays }} non facturables
        </div>
      </div>

      <!-- Objectif -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-gray-700">🎯 Objectif</p>
        </div>
        <div class="mb-3">
          <label class="form-label">Revenu net mensuel cible (€)</label>
          <input v-model.number="financeStore.settings.targetMonthlyNet"
                 @change="financeStore.saveSettings()"
                 type="number" step="100" class="form-input max-w-xs" />
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between p-3 bg-gray-50 rounded-xl">
            <span class="text-gray-600">CA annuel nécessaire</span>
            <span class="font-semibold">{{ fmt(caObjectif) }}</span>
          </div>
          <div class="flex justify-between p-3 bg-indigo-50 rounded-xl">
            <span class="text-gray-600">TJM nécessaire</span>
            <span class="font-bold text-indigo-600">{{ Math.round(tjmNécessaire) }}€/j</span>
          </div>
          <div class="flex justify-between p-3 rounded-xl"
               :class="joursÀFacturer <= joursFacturables ? 'bg-green-50' : 'bg-amber-50'">
            <span class="text-gray-600">Jours à facturer (TJM actuel)</span>
            <span class="font-semibold"
                  :class="joursÀFacturer <= joursFacturables ? 'text-green-700' : 'text-amber-700'">
              {{ tjmRéel > 0 ? Math.ceil(joursÀFacturer) + ' j' : '—' }}
              {{ joursÀFacturer > joursFacturables ? '⚠️' : joursÀFacturer > 0 ? '✅' : '' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════
         TAB 4 : BURN RATE
    ══════════════════════════════════ -->
    <div v-show="activeTab === 'burnrate'" class="space-y-3">

      <!-- Sélecteur période -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-3">Période de calcul</p>
        <div class="flex gap-2 flex-wrap">
          <button v-for="m in [1,3,6,12]" :key="m"
            @click="financeStore.settings.burnRateMonths = m; financeStore.saveSettings()"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="financeStore.settings.burnRateMonths === m
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >{{ m }} mois</button>
        </div>
      </div>

      <!-- Burn rate auto -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-1">
          <p class="text-sm font-semibold text-gray-700">Dépenses moyennes</p>
          <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">📊 données réelles</span>
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ fmt(burnRate) }}<span class="text-lg font-normal text-gray-400">/mois</span></p>
        <p class="text-xs text-gray-400 mt-1">
          Moyenne sur {{ financeStore.settings.burnRateMonths }} mois ·
          {{ expensesStore.expenses.length }} dépenses enregistrées
        </p>
        <p v-if="expensesStore.expenses.length === 0" class="text-xs text-amber-600 mt-2">
          Aucune dépense — ajoute-les dans Comptabilité.
        </p>
      </div>

      <!-- RUNWAY -->
      <div class="rounded-2xl border-2 p-5 text-center" :class="runwayColor.border">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Runway</p>
        <p class="text-6xl font-bold" :class="runwayColor.text">
          {{ financeStore.formatMonths(runway) }}
        </p>
        <p class="text-base text-gray-400 mt-1">mois de survie</p>

        <!-- Jauge -->
        <div class="mt-4 h-4 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700"
               :class="runwayColor.bar"
               :style="`width: ${Math.min(runway / 12 * 100, 100)}%`">
          </div>
        </div>
        <div class="flex justify-between text-xs text-gray-300 mt-1 px-1">
          <span>0</span><span>3 m</span><span>6 m</span><span>12 m</span>
        </div>

        <p class="text-sm font-medium mt-4" :class="runwayColor.text">
          <template v-if="!isFinite(runway) || runway > 99">🟢 Trésorerie non renseignée</template>
          <template v-else-if="runway < 3">🔴 Danger — décroche un contrat maintenant.</template>
          <template v-else-if="runway < 6">🟠 Attention — commence à prospecter.</template>
          <template v-else>🟢 Tu peux survivre {{ financeStore.formatMonths(runway) }} mois sans travailler.</template>
        </p>
      </div>

      <!-- Trésorerie (reprise depuis onglet tréso) -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <label class="text-xs text-gray-400 font-medium uppercase tracking-wide">Trésorerie disponible (€)</label>
        <input v-model.number="financeStore.settings.bankBalance"
               @change="financeStore.saveSettings()"
               type="number" step="100"
               class="text-2xl font-bold text-gray-900 w-full border-0 outline-none bg-transparent p-0 mt-1"
               placeholder="0" />
        <p class="text-xs text-gray-400 mt-1">Partagé avec l'onglet Trésorerie</p>
      </div>
    </div>

    <!-- ══════════════════════════════════
         MODAL RÉGLAGES
    ══════════════════════════════════ -->
    <div v-if="showSettings" class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div class="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[85vh] overflow-y-auto">
        <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
        <h2 class="text-base font-semibold text-gray-900 mb-1">⚙️ Réglages financiers</h2>
        <p class="text-xs text-gray-400 mb-4">Stockés localement — jamais envoyés au serveur.</p>

        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="form-label">Solde bancaire (€)</label>
            <input v-model.number="financeStore.settings.bankBalance" type="number" class="form-input" />
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
            <label class="form-label">Taux TVA (%)</label>
            <input v-model.number="financeStore.settings.tvaRate" type="number" step="0.5" class="form-input" />
          </div>
          <div>
            <label class="form-label">Taux cotisations (%)</label>
            <input v-model.number="financeStore.settings.cotisationsRate" type="number" step="0.5" class="form-input" />
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
            <p class="text-xs text-gray-400 mt-0.5">Admin, prospection…</p>
          </div>
        </div>

        <div class="flex gap-3 mt-5">
          <button @click="showSettings = false" class="btn-secondary flex-1">Annuler</button>
          <button @click="financeStore.saveSettings(); showSettings = false" class="btn-primary flex-1">Sauvegarder</button>
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
import { supabase } from '@/lib/supabase'

const financeStore = useFinanceStore()
const invoicesStore = useInvoicesStore()
const expensesStore = useExpensesStore()

const activeTab = ref('tresorerie')
const showSettings = ref(false)
const loading = ref(true)
const timeEntries = ref([])

// Mode override rémunération
const remOverride = ref(false)
const remCAManuel = ref(80000)
const remDépensesManuel = ref(10000)

const tabs = [
  { id: 'tresorerie', emoji: '💰', label: 'Trésorerie', short: 'Tréso' },
  { id: 'remuneration', emoji: '📊', label: 'Rémunération', short: 'Rémuné.' },
  { id: 'tjm', emoji: '⏱️', label: 'TJM réel', short: 'TJM' },
  { id: 'burnrate', emoji: '🔥', label: 'Burn Rate', short: 'Burn' },
]

onMounted(async () => {
  await Promise.all([
    invoicesStore.fetchInvoices(),
    expensesStore.fetchExpenses(),
  ])
  // Charger le time tracking pour TJM précis
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  const { data } = await supabase
    .from('time_entries')
    .select('hours, date')
    .gte('date', yearStart)
  timeEntries.value = data || []
  loading.value = false
})

const fmt = (val) => financeStore.formatCurrency(val)

const yearStart = new Date(new Date().getFullYear(), 0, 1)
const hasNoData = computed(() =>
  invoicesStore.invoices.length === 0 && expensesStore.expenses.length === 0
)

// ── Données agrégées ────────────────────────────────────────
const invoicesSent = computed(() => invoicesStore.invoices.filter(i => i.status === 'sent'))

const caAnnée = computed(() =>
  invoicesStore.invoices
    .filter(i => i.status === 'paid' && new Date(i.issue_date) >= yearStart)
    .reduce((s, i) => s + (i.subtotal || 0), 0)
)

const dépensesAnnée = computed(() =>
  expensesStore.expenses
    .filter(e => new Date(e.date) >= yearStart)
    .reduce((s, e) => s + (e.amount || 0), 0)
)

// ── TRÉSORERIE ──────────────────────────────────────────────
const tvaProvision = computed(() =>
  invoicesSent.value.reduce((s, i) => s + (i.tax_amount || 0), 0)
)

const beneficeYTD = computed(() =>
  Math.max(0, caAnnée.value - dépensesAnnée.value - financeStore.settings.salaryMonthly * 12)
)

const isocProvision = computed(() => financeStore.calculateISoc(beneficeYTD.value))

const cotisationsProvision = computed(() =>
  financeStore.calculateCotisations(financeStore.settings.salaryMonthly * 12)
)

const totalProvisions = computed(() => tvaProvision.value + isocProvision.value + cotisationsProvision.value)
const disponibleNet = computed(() => financeStore.settings.bankBalance - totalProvisions.value)

const safe = (v) => Math.max(0, Math.min(v, 100))
const tvaP = computed(() => financeStore.settings.bankBalance > 0 ? safe(tvaProvision.value / financeStore.settings.bankBalance * 100) : 0)
const isocP = computed(() => financeStore.settings.bankBalance > 0 ? safe(isocProvision.value / financeStore.settings.bankBalance * 100) : 0)
const cotisP = computed(() => financeStore.settings.bankBalance > 0 ? safe(cotisationsProvision.value / financeStore.settings.bankBalance * 100) : 0)

// ── RÉMUNÉRATION ────────────────────────────────────────────
const remCA = computed(() => remOverride.value ? remCAManuel.value : caAnnée.value)
const remDépenses = computed(() => remOverride.value ? remDépensesManuel.value : dépensesAnnée.value)

const scenA = computed(() => {
  const salaryGross = Math.max(0, remCA.value - remDépenses.value)
  const cotisations = financeStore.calculateCotisations(salaryGross)
  const ipp = financeStore.calculateIPP(salaryGross)
  return { salaryGross, cotisations, ipp, netAnnuel: Math.max(0, salaryGross - cotisations - ipp) }
})

const scenB = computed(() => {
  const cotisations = financeStore.calculateCotisations(45000)
  const ipp = financeStore.calculateIPP(45000)
  const benefice = Math.max(0, remCA.value - remDépenses.value - 45000)
  const isoc = financeStore.calculateISoc(benefice)
  const dividendes = Math.max(0, benefice - isoc)
  const precompte = dividendes * 0.30
  return { cotisations, ipp, isoc, dividendes, precompte, netAnnuel: Math.max(0, (45000 - cotisations - ipp) + dividendes - precompte) }
})

const scenC = computed(() => {
  const cotisations = financeStore.calculateCotisations(45000)
  const ipp = financeStore.calculateIPP(45000)
  const benefice = Math.max(0, remCA.value - remDépenses.value - 45000)
  const isoc = financeStore.calculateISoc(benefice)
  const dividendes = Math.max(0, benefice - isoc)
  const contribution = dividendes * 0.10
  const réserveBloquée = dividendes - contribution
  const netImmédiat = Math.max(0, 45000 - cotisations - ipp)
  return {
    cotisations, ipp, isoc, dividendes, contribution, réserveBloquée,
    netImmédiat,
    gainVsB: dividendes * 0.20,
    netFutur: netImmédiat + dividendes
  }
})

// ── TJM ─────────────────────────────────────────────────────
const hoursFromTimeTracking = computed(() => timeEntries.value.reduce((s, e) => s + (e.hours || 0), 0))
const joursDepuisHeures = computed(() => Math.round(hoursFromTimeTracking.value / 8 * 10) / 10)

const joursFacturables = computed(() =>
  Math.max(1,
    financeStore.settings.workingDaysYear
    - financeStore.settings.vacationDays
    - financeStore.settings.sickDays
    - financeStore.settings.nonBillableDays
  )
)

// Préférence: si heures loguées → jours réels ; sinon → config
const joursFacturés = computed(() =>
  hoursFromTimeTracking.value > 0 ? joursDepuisHeures.value : joursFacturables.value
)

const tjmRéel = computed(() =>
  caAnnée.value > 0 && joursFacturés.value > 0 ? caAnnée.value / joursFacturés.value : 0
)

const caObjectif = computed(() => financeStore.settings.targetMonthlyNet * 12 / 0.58)
const tjmNécessaire = computed(() => caObjectif.value / joursFacturables.value)
const joursÀFacturer = computed(() => tjmRéel.value > 0 ? caObjectif.value / tjmRéel.value : Infinity)

// ── BURN RATE ────────────────────────────────────────────────
const burnRate = computed(() => {
  const months = financeStore.settings.burnRateMonths
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const total = expensesStore.expenses
    .filter(e => new Date(e.date) >= cutoff)
    .reduce((s, e) => s + (e.amount || 0), 0)
  return months > 0 ? total / months : 0
})

const runway = computed(() =>
  burnRate.value > 0 ? financeStore.settings.bankBalance / burnRate.value : Infinity
)

const runwayColor = computed(() => {
  if (!isFinite(runway.value) || runway.value > 99) return { border: 'border-gray-200', text: 'text-gray-400', bar: 'bg-gray-300' }
  if (runway.value < 3) return { border: 'border-red-200', text: 'text-red-600', bar: 'bg-red-500' }
  if (runway.value < 6) return { border: 'border-amber-200', text: 'text-amber-600', bar: 'bg-amber-500' }
  return { border: 'border-green-200', text: 'text-green-600', bar: 'bg-green-500' }
})
</script>
