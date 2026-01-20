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

      <!-- MIDDLE ROW: CHART & LEAKS -->
      <div class="dashboard-mid-row">
          
          <!-- CHART (Left) -->
          <div class="chart-container">
              <div class="chart-header">
                  <h3>Score Trend</h3>
              </div>
              <div class="chart-box">
                  <p class="chart-placeholder-text">Chart coming soon...</p>
              </div>
          </div>

          <!-- LEAKS (Right) -->
          <div class="leaks-container">
              <div class="leaks-header">
                  <h3>Stroke Leaks</h3>
                  <span class="leaks-sub">Avg per round (last {{ daysFilter }} days)</span>
              </div>

              <!-- Leak 1: Doubles -->
              <div class="leak-item">
                  <div class="leak-top">
                      <span class="leak-title">Double Bogeys+</span>
                      <span class="leak-val">~{{ stats.leaks?.doubleBogeys || 0 }}</span>
                  </div>
                  <div class="progress-bar">
                      <div class="fill fill-red" :style="{ width: getWidth(stats.leaks?.doubleBogeys, 5) }"></div>
                  </div>
              </div>

              <!-- Leak 2: 3-Putts -->
              <div class="leak-item">
                  <div class="leak-top">
                      <span class="leak-title">3-Putts</span>
                      <span class="leak-val">~{{ stats.leaks?.threePutts || 0 }}</span>
                  </div>
                  <div class="progress-bar">
                      <div class="fill fill-yellow" :style="{ width: getWidth(stats.leaks?.threePutts, 4) }"></div>
                  </div>
              </div>

              <!-- Leak 3: Missed Fairways -->
              <div class="leak-item">
                  <div class="leak-top">
                      <span class="leak-title">Missed Fairways</span>
                      <span class="leak-val">~{{ stats.leaks?.missedFairways || 0 }}</span>
                  </div>
                    <div class="progress-bar">
                        <div class="fill fill-lime" :style="{ width: getWidth(stats.leaks?.missedFairways, 14) }"></div>
                    </div>
              </div>

                <!-- Updated Tip Box HTML -->
                <div 
                    class="takeaway-box" 
                    @mouseenter="pauseTimer" 
                    @mouseleave="resumeTimer"
                    @click="manualNext"
                >
                    <p :style="{ opacity: fadeOpacity }">{{ currentTip }}</p>
                    
                    <!-- Add the 'resetting' class conditional -->
                    <div 
                        class="takeaway-progress" 
                        :class="{ 'resetting': isResetting }" 
                        :style="{ width: progress + '%' }"
                    ></div>
                </div>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { auth, rounds, user } from '../services/api';

const router = useRouter();
const daysFilter = ref(30);
const loading = ref(false);
const stats = ref({ avgScore: 0, avgPutts: 0, totalRounds: 0 });
const rounds_data = ref([]);
const handicap = ref(null);
const roundsCount = ref(0);

// --- SMOOTH TIP LOGIC ---
const currentTip = ref("");
const fadeOpacity = ref(1);
const progress = ref(0);
const isResetting = ref(false); // New flag for instant bar reset
const tips = [
    "Don't follow a bad shot with a stupid shot.",
    "Aim for the center of the green. Pins are for pros.",
    "Bogeys don't kill rounds. Double bogeys do.",
    "Speed is more important than line. Stop leaving it short.",
    "You are not good enough to get mad at that shot.",
    "Grip it light. Tension is the swing killer.",
    "A 5-foot putt counts the same as a 300-yard drive.",
    "Swing your swing. Don't play the swing thoughts.",
    "When in trouble, get back in play. Hero shots usually fail.",
    "Golf is not a game of perfect. Accept the variance."
];

let tipIndex = 0;
let loopInterval = null;
let isPaused = false;
let isTransitioning = false;

const TICK_RATE = 50;
const DURATION = 5000;
const STEP = (100 / DURATION) * TICK_RATE;

const startTipLoop = () => {
    if (loopInterval) clearInterval(loopInterval);
    
    loopInterval = setInterval(() => {
        if (isPaused || isTransitioning) return;

        progress.value += STEP;

        if (progress.value >= 100) {
            progress.value = 100;
            triggerNextTipSequence();
        }
    }, TICK_RATE);
};

const triggerNextTipSequence = () => {
    if (isTransitioning) return;
    isTransitioning = true; // Stop the timer

    // 1. Fade Out Text
    fadeOpacity.value = 0;

    setTimeout(() => {
        // 2. Switch Text (while invisible)
        tipIndex = (tipIndex + 1) % tips.length;
        currentTip.value = tips[tipIndex];
        
        // 3. Reset Bar Instantly (Invisible switch)
        isResetting.value = true; // Disable CSS transition
        progress.value = 0;       // Snap to 0
        
        setTimeout(() => {
            // 4. Re-enable CSS transition and Fade Text In
            isResetting.value = false;
            fadeOpacity.value = 1;

            // 5. "Breathe" - Wait a moment before bar starts moving again
            setTimeout(() => {
                isTransitioning = false; // Resume timer
            }, 500); // breathing room

        }, 100); // Short delay to let DOM recognize 0% width
        
    }, 500); // 0.5s fade out time
};

// Interaction Handlers
const pauseTimer = () => { isPaused = true; };
const resumeTimer = () => { isPaused = false; };

const manualNext = () => {
    // If clicked, force the sequence immediately
    progress.value = 100;
    triggerNextTipSequence();
};

// Add helper for progress bars
const getWidth = (val, max) => {
    if(!val) return '0%';
    const pct = (val / max) * 100;
    return `${Math.min(pct, 100)}%`;
};

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

onMounted(() => {
    fetchData();
    currentTip.value = tips[0];
    startTipLoop();
});

onUnmounted(() => {
    if (loopInterval) clearInterval(loopInterval);
});
</script>