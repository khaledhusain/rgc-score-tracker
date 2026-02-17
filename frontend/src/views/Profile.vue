<template>
  <div class="page-container">
    <Navbar />
    
    <main class="content">
      <div v-if="loading" class="loading">Loading profile...</div>
      
      <div v-else class="profile-grid">
        <!-- 1. LEFT SIDEBAR (Identity) -->
        <div class="profile-sidebar">
            <!-- Header Identity -->
            <div class="profile-identity">
                <div class="profile-badge-large">{{ userInitials }}</div>
                <div class="profile-identity-text">
                    <div class="profile-label">Handicap Index</div>
                    <div class="profile-level">{{ handicap || '-' }}</div>
                    <div class="profile-last-seen">Last round: {{ formatDate(lastPlayed) }}</div>
                </div>
            </div>

            <!-- Rows (30/90/Life) -->
            <div class="profile-season-block">
                <div class="profile-season-header">LAST 30 DAYS</div>
                <div class="profile-stat-row">
                    <div class="profile-mini-stat">
                        <div class="profile-mini-label">Avg Score</div>
                        <div class="profile-mini-val">{{ sidebar.last30.avgScore || '-' }}</div>
                    </div>
                    <div class="profile-mini-stat">
                        <div class="profile-mini-label">Best Round</div>
                        <div class="profile-mini-val">{{ sidebar.last30.bestRound || '-' }}</div>
                    </div>
                    <div class="profile-mini-stat">
                        <div class="profile-mini-label">Rounds</div>
                        <div class="profile-mini-val">{{ sidebar.last30.roundsPlayed || '-' }}</div>
                    </div>
                </div>
            </div>

            <div class="profile-season-block">
                <div class="profile-season-header">LAST 90 DAYS</div>
                <div class="profile-stat-row">
                    <div class="profile-mini-stat">
                        <div class="profile-mini-label">Avg Score</div>
                        <div class="profile-mini-val">{{ sidebar.last90.avgScore || '-' }}</div>
                    </div>
                    <div class="profile-mini-stat">
                        <div class="profile-mini-label">Best Round</div>
                        <div class="profile-mini-val">{{ sidebar.last90.bestRound || '-' }}</div>
                    </div>
                    <div class="profile-mini-stat">
                        <div class="profile-mini-label">Rounds</div>
                        <div class="profile-mini-val">{{ sidebar.last90.roundsPlayed || '-' }}</div>
                    </div>
                </div>
            </div>

            <div class="profile-season-block">
                <div class="profile-season-header">LIFETIME</div>
                <div class="profile-stat-row">
                    <div class="profile-mini-stat">
                        <div class="profile-mini-label">Avg Score</div>
                        <div class="profile-mini-val">{{ sidebar.lifetime.avgScore || '-' }}</div>
                    </div>
                    <div class="profile-mini-stat">
                        <div class="profile-mini-label">Best Round</div>
                        <div class="profile-mini-val">{{ sidebar.lifetime.bestRound || '-' }}</div>
                    </div>
                    <div class="profile-mini-stat">
                        <div class="profile-mini-label">Rounds</div>
                        <div class="profile-mini-val">{{ sidebar.lifetime.roundsPlayed || '-' }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. MAIN CONTENT-->
        <div class="profile-main">
            <!-- Tabs -->
            <div class="profile-tabs">
                <button 
                    v-for="key in ['all', 'black', 'gold', 'blue', 'white', 'red']"
                    :key="key"
                    class="profile-tab"
                    :class="{ active: activeTab === key }"
                    @click="activeTab = key"
                >
                    {{ key.toUpperCase() }}
                </button>
            </div>

            <!-- Big 3 Header -->
            <div class="profile-big-stats">
                <div class="profile-big-box">
                    <div class="profile-big-val">{{ activeData.careerBirdies || 0 }}</div>
                    <div class="profile-big-label">CAREER BIRDIES</div>
                </div>
                <div class="profile-big-box">
                    <div class="profile-big-val">{{ activeData.careerPars || 0 }}</div>
                    <div class="profile-big-label">CAREER PARS</div>
                </div>
                <div class="profile-big-box">
                    <div class="profile-big-val">{{ activeData.roundsPlayed || 0 }}</div>
                    <div class="profile-big-label">TOTAL ROUNDS</div>
                </div>
            </div>

            <!-- Deep Dive List -->
            <div class="profile-list">
                <div class="profile-list-row">
                    <span class="profile-list-label">Total Holes Played</span>
                    <span class="profile-list-val">{{ activeData.totalHoles || 0 }}</span>
                </div>
                <div class="profile-list-row alt">
                    <span class="profile-list-label">Completed Rounds</span>
                    <span class="profile-list-val">{{ activeData.roundsPlayed || 0 }}</span>
                </div>
                <div class="profile-list-row">
                    <span class="profile-list-label">Avg Putts per 18</span>
                    <span class="profile-list-val">{{ activeData.avgPutts || '-' }}</span>
                </div>
                <div class="profile-list-row alt">
                    <span class="profile-list-label">Scoring Average</span>
                    <span class="profile-list-val">{{ activeData.scoringAvg || '-' }}</span>
                </div>
                <div class="profile-list-row">
                    <span class="profile-list-label">GIR %</span>
                    <span class="profile-list-val">{{ activeData.gir || 0 }}%</span>
                </div>
                <div class="profile-list-row alt">
                    <span class="profile-list-label">FIR %</span>
                    <span class="profile-list-val">{{ activeData.fir || 0 }}%</span>
                </div>
            </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Navbar from '../components/Navbar.vue';
import { rounds, user } from '../services/api';

const loading = ref(true);
const activeTab = ref('all');
const handicap = ref('-');
const lastPlayed = ref(null);
const sidebar = ref({ last30: {}, last90: {}, lifetime: {} });
const tabData = ref({});
const userInitials = ref('G');

const activeData = computed(() => {
    return tabData.value[activeTab.value] || {};
});

const formatDate = (d) => {
    if(!d) return '--';
    const date = new Date(d);
    // Returns "Jan 20 2026"
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const fetchData = async () => {
    try {
        const [prof, hc, info] = await Promise.all([
            rounds.getProfileV2(),
            user.getHandicap(),
            user.getInfo()
        ]);

        sidebar.value = prof.sidebar || { last30: {}, last90: {}, lifetime: {} };
        tabData.value = prof.tabs || {};
        lastPlayed.value = prof.lastPlayed ?? null;
        handicap.value = hc?.handicap ?? '-';
        const first = info?.first_name?.[0] || '';
        const last = info?.last_name?.[0] || '';
        userInitials.value = (first + last).toUpperCase() || '?';
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchData);
</script>