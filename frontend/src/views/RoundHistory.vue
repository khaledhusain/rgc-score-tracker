<template>
  <div class="rounds-container">
    <nav class="navbar">
      <h1>Royal Golf Club</h1>
      <div class="nav-actions">
        <button @click="generateMockData" class="btn btn-secondary small">
          + Add 5 Mock Rounds
        </button>
        <button @click="handleLogout" class="btn btn-secondary">Logout</button>
      </div>
    </nav>

    <main class="content">
      <div class="dashboard-header">
        <h2>Dashboard</h2>
        
        <div class="time-filters">
            <button 
                v-for="d in [30, 90, 365]" 
                :key="d"
                class="filter-btn"
                :class="{ active: daysFilter === d }"
                @click="changeFilter(d)"
            >
                {{ d === 365 ? 'All Time' : `Last ${d} days` }}
            </button>
        </div>
      </div>

      <!-- TOP ROW: STAT CARDS -->
      <div class="stats-grid">
        <div class="stat-card">
            <div class="card-label">Handicap</div>
            <div class="card-value large">{{ handicap || '-' }}</div>
            <div class="card-sub">{{ roundsCount < 10 ? 'Provisional' : 'Official' }}</div>
        </div>
        <div class="stat-card">
            <div class="card-label">Avg Score</div>
            <div class="card-value">{{ stats.avgScore || '-' }}</div>
            <div class="card-sub">Last {{ stats.totalRounds }} rounds</div>
        </div>
        <div class="stat-card">
            <div class="card-label">Putts / Round</div>
            <div class="card-value">{{ stats.avgPutts || '-' }}</div>
             <div class="card-sub">Avg per 18</div>
        </div>
      </div>

      <!-- CHART PLACEHOLDER -->
      <div class="chart-container">
          <div class="chart-header">
              <h3>Score Trend</h3>
          </div>
          <div class="chart-box">
              <p class="chart-placeholder-text">Chart coming soon...</p>
          </div>
      </div>

      <!-- RECENT ROUNDS GRID -->
      <div class="rounds-section">
        <div class="section-header">
            <h3>Recent Rounds</h3>
            <router-link to="/new-round" class="btn btn-primary">+ New Round</router-link>
        </div>

        <div v-if="loading" class="loading">Loading data...</div>
        
        <div v-else-if="rounds_data.length === 0" class="empty-state">
             <p>No rounds found for this period.</p>
        </div>






        <div class="rounds-grid-layout">
            <div 
                v-for="round in rounds_data" 
                :key="round.id" 
                class="round-grid-card"
                @click="goToRound(round.id)"
            >
                <div class="rg-header">
                    <span class="rg-course">Royal Golf Club</span>
                    <span class="rg-date">{{ formatDate(round.date) }}</span>
                </div>
                
                <div class="rg-main">
                    <div class="rg-score-box">
                        <!-- Show total score -->
                        <span class="rg-score">{{ round.total_score }}</span>
                        <!-- Show (9) or (18) -->
                        <span class="rg-holes-sub">({{ round.holes_played }})</span>
                        
                        <!-- Show Pace if 9 holes -->
                        <span v-if="round.holes_played === 9" class="rg-pace">
                            Pace: {{ round.total_score * 2 }}
                        </span>
                    </div>
                    <div class="rg-meta">
                        <div v-if="round.total_putts">{{ round.total_putts }} Putts</div>
                    </div>
                </div>

                <div class="rg-footer">
                    <!-- Tee Color from DB -->
                    <span class="rg-tee" :class="getTeeClass(round.tee_name)">
                        {{ round.tee_name || 'Standard' }} Tees
                    </span>
                    
                    <!-- Status check -->
                    <span class="rg-status" :class="round.status">
                        {{ round.status === 'completed' ? 'Final' : 'Active' }}
                    </span>
                </div>
            </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { auth, rounds, user } from '../services/api';

const router = useRouter();
const daysFilter = ref(30);
const loading = ref(false);
const stats = ref({ avgScore: 0, avgPutts: 0, totalRounds: 0 });
const rounds_data = ref([]);
const handicap = ref(null);
const roundsCount = ref(0);

// Tee Helpers
const tees = { 1: 'Black', 2: 'Gold', 3: 'Blue', 4: 'White', 5: 'Red' };
const getTeeName = (id) => tees[id] || 'Standard';
const getTeeClass = (name) => {
    if (!name) return 'tee-blue';
    return `tee-${name.toLowerCase()}`;
};

const getScoreToPar = (score) => {
    if(!score) return '-';
    const diff = score - 72; // Assuming par 72 for summary
    return diff > 0 ? `+${diff}` : diff === 0 ? 'E' : diff;
};

const fetchData = async () => {
    loading.value = true;
    try {
        // 1. Get Stats for selected period
        const statsData = await rounds.getStats(daysFilter.value);
        stats.value = statsData;
        rounds_data.value = statsData.rounds || [];

        // 2. Get Handicap (Always all time usually, or valid rounds)
        const hcData = await user.getHandicap();
        handicap.value = hcData.handicap;
        roundsCount.value = hcData.roundsCount;

    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const changeFilter = (days) => {
    daysFilter.value = days;
    fetchData();
};

const generateMockData = async () => {
    if(!confirm("Generate 5 random rounds?")) return;
    await rounds.seedRounds(5);
    fetchData(); // Refresh
};

const goToRound = (id) => router.push(`/round/${id}`);
const handleLogout = async () => {
    await auth.logout();
    auth.clearToken();
    router.push('/login');
};
const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { month:'short', day:'numeric' });

onMounted(fetchData);
</script>

<style scoped>
/* Dashboard Specific Styles */
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}
.dashboard-header h2 { margin: 0; font-size: 2rem; color: #1e3c72; }

.time-filters {
    background: white;
    padding: 4px;
    border-radius: 8px;
    border: 1px solid #ddd;
    display: flex;
}
.filter-btn {
    background: transparent;
    border: none;
    padding: 6px 16px;
    cursor: pointer;
    font-weight: 600;
    color: #666;
    border-radius: 6px;
    transition: all 0.2s;
}
.filter-btn.active {
    background: #1e3c72;
    color: white;
}

/* Stat Cards */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}
.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border: 1px solid #f0f0f0;
}
.card-label { font-size: 0.9rem; color: #666; font-weight: 600; margin-bottom: 0.5rem; }
.card-value { font-size: 2.5rem; font-weight: 800; color: #1e3c72; line-height: 1; }
.card-sub { font-size: 0.8rem; color: #999; margin-top: 0.5rem; }

/* Chart Area */
.chart-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 1px solid #f0f0f0;
    min-height: 250px;
}
.chart-header h3 { margin: 0 0 1rem 0; color: #333; }
.chart-box {
    height: 200px;
    background: #fafafa;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed #eee;
}
.chart-placeholder-text { color: #ccc; font-weight: bold; }

/* Rounds Grid */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}
.rounds-grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}
.round-grid-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid #eee;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.round-grid-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.08);
    border-color: #1e3c72;
}
.rg-header { display: flex; justify-content: space-between; font-size: 0.85rem; color: #666; }
.rg-date { font-weight: 600; }
.rg-main { display: flex; justify-content: space-between; align-items: center; }
.rg-score-box { display: flex; flex-direction: column; }
.rg-score { font-size: 2.2rem; font-weight: 800; color: #333; line-height: 1; }
.rg-par-rel { font-size: 0.9rem; color: #666; font-weight: 600; }
.rg-meta { text-align: right; font-size: 0.9rem; color: #555; line-height: 1.4; }
.rg-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-top: auto; border-top: 1px solid #f9f9f9; padding-top: 0.5rem; }
.rg-tee { font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.rg-status { background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 12px; font-weight: 600; }

/* Tee Colors */
.tee-black { color: #000; }
.tee-gold { color: #d4a017; }
.tee-blue { color: #1e3c72; }
.tee-white { color: #999; }
.tee-red { color: #d32f2f; }

.rg-holes-sub { font-size: 1rem; color: #777; font-weight: 600; margin-left: 6px; }
.rg-pace { font-size: 0.8rem; color: #999; margin-top: 4px; display: block; }
.rg-status.completed { background: #e8f5e9; color: #2e7d32; }
.rg-status.in_progress { background: #fff3e0; color: #ef6c00; }
</style>