<template>
  <div class="rounds-container">
    <Navbar />

    <main class="content">
      <div v-if="loading" class="loading">Loading round...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="round-detail">
        <div class="round-detail-header">
          <div>
            <h2>{{ round.course_name || 'Royal Golf Club' }}</h2>
            <p class="round-date">{{ formatDate(round.date) }} • {{ selectedTee }} Tees</p>
          </div>
          <span class="round-status" :class="round.status">{{ formatStatus(round.status) }}</span>
        </div>

        <!-- STATS SUMMARY CARD -->
        <div class="stats-summary" v-if="holes.length > 0">
            <div class="stat-box">
                <div class="stat-value">{{ getCurrentScore() }}</div>
                <div class="stat-label">Total Score</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{{ getStats().gir }}%</div>
                <div class="stat-label">GIR</div>
            </div>
             <div class="stat-box">
                <div class="stat-value">{{ getStats().fir }}%</div>
                <div class="stat-label">FIR</div>
            </div>
             <div class="stat-box">
                <div class="stat-value">{{ getCurrentPutts() }}</div>
                <div class="stat-label">Total Putts</div>
            </div>
        </div>

        <div class="scorecard-wrapper">
            <div class="scorecard-header-row">
                <div class="col-hole">Hole</div>
                <div class="col-data">Par</div>
                <div class="col-data">Index</div>
                <div class="col-data">Dist</div>
                <div class="col-input header-center">Score</div>
                <div class="col-action header-center">Putts</div>
                <div class="col-action header-center">FIR</div>
                <div class="col-action header-center">Notes</div>
            </div>
            
            <div v-for="(hole, idx) in holes" :key="hole.hole_number" class="score-row">
                <div class="col-hole">{{ hole.hole_number }}</div>
                <div class="col-data">{{ getHoleData(hole.hole_number).par }}</div>
                <div class="col-data">{{ getHoleData(hole.hole_number).index }}</div>
                <div class="col-data">{{ getHoleData(hole.hole_number).dist }}</div>
                
                <!-- Score Input -->
                <div class="col-input">
                    <div class="score-wrapper">
                        <input 
                            :id="'score-' + idx"
                            v-model.number="hole.strokes" 
                            type="number" 
                            min="1" 
                            :disabled="round.status === 'completed'"
                            @change="updateHole(hole)"
                            @keyup.enter="focusPutt(idx)"
                            class="score-input"
                            :class="getScoreClass(hole)"
                        />
                    </div>
                </div>

                <!-- Putts -->
                <div class="col-action">
                    <button 
                        :id="'putt-btn-' + idx"
                        class="icon-btn" 
                        :class="{ 'has-data': hole.putts !== null }"
                        @click="openPuttModal(hole, idx)"
                        :disabled="round.status === 'completed'"
                    >
                        {{ hole.putts !== null ? hole.putts : '⛳' }}
                    </button>
                </div>

                <!-- FIR Toggle -->
                <div class="col-action">
                    <div v-if="getHoleData(hole.hole_number).par > 3">
                        <button 
                            class="fir-btn"
                            :class="{ 
                                'hit': hole.fairway_hit === 1,
                                'miss': hole.fairway_hit === 0 
                            }"
                            @click="toggleFIR(hole)"
                            :disabled="round.status === 'completed'"
                        >
                            {{ hole.fairway_hit === 1 ? '✓' : (hole.fairway_hit === 0 ? '✗' : '-') }}
                        </button>
                    </div>
                    <div v-else class="fir-placeholder">•</div>
                </div>

                <!-- Notes -->
                <div class="col-action">
                    <button 
                        class="icon-btn" 
                        :class="{ 'has-data': hole.notes }"
                        @click="openNoteModal(hole)"
                        :disabled="round.status === 'completed'"
                    >
                        📝
                    </button>
                </div>
            </div>
            
             <div class="score-row total-row">
                <div class="col-hole">TOT</div>
                <div class="col-data">{{ getTotalPar() }}</div>
                <div class="col-data">-</div>
                <div class="col-data">-</div>
                <div class="col-input total-center">{{ getCurrentScore() }}</div>
                <div class="col-action">{{ getCurrentPutts() }}</div>
                <div class="col-action">-</div>
                <div class="col-action">-</div>
            </div>
        </div>

        <div class="form-group" v-if="round.status === 'in_progress'">
          <label>Overall Round Notes</label>
          <textarea v-model="notes" placeholder="Summary of your round..."></textarea>
        </div>
        <div class="form-group" v-else-if="round.notes">
          <label>Overall Round Notes</label>
          <p class="notes-display">{{ round.notes }}</p>
        </div>

        <div v-if="round.status === 'in_progress'" class="actions">
          <button @click="handleFinalize" :disabled="!allHolesFilled" class="btn btn-primary">Finish Round</button>
          <button @click="handleDelete" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </main>

    <!-- PUTTS MODAL -->
    <div v-if="showPuttModal" class="modal-overlay" @click.self="closePuttModal">
        <div class="modal-content">
            <h3>Putts - Hole {{ activeHole.hole_number }}</h3>
            <div class="putt-options">
                <button v-for="n in 5" :key="n-1" 
                    class="putt-btn" 
                    :class="{ 'selected': activeHole.putts === n-1 }"
                    @click="setPutt(n-1)">
                    {{ n-1 }}
                </button>
            </div>
            <p class="modal-hint" v-if="activeHole.strokes">Max putts: {{ activeHole.strokes - 1 }}</p>
            <button class="btn btn-secondary full-width" @click="closePuttModal">Close</button>
        </div>
    </div>

    <!-- HOLE NOTES MODAL -->
    <div v-if="showNoteModal" class="modal-overlay" @click.self="closeNoteModal">
        <div class="modal-content">
            <h3>Notes - Hole {{ activeHole.hole_number }}</h3>
            <textarea 
                v-model="activeHoleNote" 
                placeholder="Details..."
                class="hole-note-input"
            ></textarea>
            <button class="btn btn-primary full-width" @click="saveHoleNote">Save Note</button>
        </div>
    </div>
  </div>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { rounds } from '../services/api';

const COURSE_DATA = {
    1: [4, 9, 424, 403, 384, 349, 317],
    2: [3, 11, 213, 187, 176, 133, 99],
    3: [5, 7, 578, 522, 513, 489, 439],
    4: [4, 1, 487, 442, 424, 352, 317],
    5: [4, 5, 408, 385, 366, 312, 293],
    6: [4, 15, 402, 387, 372, 325, 298],
    7: [3, 17, 174, 140, 148, 114, 87],
    8: [4, 3, 461, 441, 419, 336, 326],
    9: [5, 13, 541, 517, 464, 412, 360],
    10: [4, 16, 322, 308, 293, 258, 221],
    11: [4, 12, 353, 335, 309, 270, 223],
    12: [3, 18, 146, 136, 120, 109, 95],
    13: [5, 4, 587, 569, 550, 505, 449],
    14: [5, 14, 586, 540, 492, 441, 411],
    15: [4, 2, 474, 452, 421, 363, 333],
    16: [3, 10, 229, 217, 189, 150, 122],
    17: [4, 8, 429, 407, 382, 339, 304],
    18: [4, 6, 429, 411, 392, 349, 305]
};
const TEE_INDEX = { 'Black': 2, 'Gold': 3, 'Blue': 4, 'White': 5, 'Red': 6 };

const route = useRoute();
const router = useRouter();
const round = ref({});
const holes = ref([]);
const notes = ref('');
const loading = ref(false);
const error = ref('');
const selectedTee = ref(route.query.tee || 'Blue');
const roundId = route.params.roundId;
// Modal states
const showPuttModal = ref(false);
const showNoteModal = ref(false);
const activeHole = ref({});
const activeHoleIndex = ref(0);
const activeHoleNote = ref('');

const getHoleData = (num) => {
    const data = COURSE_DATA[num];
    const idx = TEE_INDEX[selectedTee.value] || 4; 
    return { par: data[0], index: data[1], dist: data[idx] };
};

const getTotalPar = () => holes.value.reduce((sum, h) => sum + getHoleData(h.hole_number).par, 0);
const getCurrentScore = () => holes.value.reduce((sum, h) => sum + (h.strokes || 0), 0);
const getCurrentPutts = () => holes.value.reduce((sum, h) => sum + (h.putts || 0), 0);
const allHolesFilled = computed(() => holes.value.every(hole => hole.strokes && hole.strokes > 0));

// Stats Logic
const getStats = () => {
    if (holes.value.length === 0) return { gir: 0, fir: 0 };
    
    // GIR: Green in Regulation. (Strokes - Putts) <= (Par - 2)
    let girCount = 0;
    let girOpp = 0;
    
    // FIR: Fairways Hit. Only Par 4 & 5.
    let firCount = 0;
    let firOpp = 0;

    holes.value.forEach(h => {
        if (!h.strokes || h.putts === null) return;
        
        const par = getHoleData(h.hole_number).par;

        // GIR Calc
        girOpp++;
        if ((h.strokes - h.putts) <= (par - 2)) {
            girCount++;
        }

        // FIR Calc (Par > 3)
        if (par > 3 && h.fairway_hit !== null && h.fairway_hit !== undefined) {
            firOpp++;
            if (h.fairway_hit === 1) firCount++;
        }
    });

    return {
        gir: girOpp > 0 ? Math.round((girCount / girOpp) * 100) : 0,
        fir: firOpp > 0 ? Math.round((firCount / firOpp) * 100) : 0
    };
};

// CSS Class for Scores
const getScoreClass = (hole) => {
    if (!hole.strokes) return '';
    const par = getHoleData(hole.hole_number).par;
    const diff = hole.strokes - par;

    if (diff <= -2) return 'score-double-under'; // Eagle+
    if (diff === -1) return 'score-under'; // Birdie
    if (diff === 1) return 'score-over'; // Bogey
    if (diff >= 2) return 'score-double-over'; // Double+
    return ''; // Par
};

const fetchRound = async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await rounds.getById(roundId);
    round.value = data;
    notes.value = data.notes || '';
    if (route.query.tee) selectedTee.value = route.query.tee;

    const holesCount = data.holes_played || 18;
    holes.value = data.holes || [];
    for (let i = 1; i <= holesCount; i++) {
      if (!holes.value.find(h => h.hole_number === i)) {
        holes.value.push({ hole_number: i, strokes: null, putts: null, notes: '', fairway_hit: null });
      }
    }
    holes.value.sort((a, b) => a.hole_number - b.hole_number);
  } catch (err) { error.value = err.message; } 
  finally { loading.value = false; }
};

const updateHole = async (hole) => {
  try {
    const par = getHoleData(hole.hole_number).par;
    await rounds.updateHoleScore(
        roundId, 
        hole.hole_number, 
        hole.strokes, 
        par, 
        hole.putts, 
        hole.notes,
        hole.fairway_hit
    );
  } catch (err) { error.value = err.message; }
};

// Auto Focus Next Step
const focusPutt = (idx) => {
    // Open putt modal for current hole when Enter is pressed on score
    const hole = holes.value[idx];
    openPuttModal(hole, idx);
};

// Modal Logic
const openPuttModal = (hole, idx) => {
    activeHole.value = hole;
    activeHoleIndex.value = idx;
    showPuttModal.value = true;
};

const setPutt = async (num) => {
    if (activeHole.value.strokes && num >= activeHole.value.strokes) {
        alert("Putts must be less than score!");
        return;
    }
    activeHole.value.putts = num;
    await updateHole(activeHole.value);
    showPuttModal.value = false;
    
    // Auto-advance to next hole input? Optional, but nice flow:
    const nextIdx = activeHoleIndex.value + 1;
    if (nextIdx < holes.value.length) {
        setTimeout(() => {
            document.getElementById(`score-${nextIdx}`)?.focus();
        }, 100);
    }
};

const closePuttModal = () => showPuttModal.value = false;

// FIR Logic
const toggleFIR = async (hole) => {
    // Cycle: null -> 1 (Hit) -> 0 (Miss) -> null
    if (hole.fairway_hit === null || hole.fairway_hit === undefined) hole.fairway_hit = 1;
    else if (hole.fairway_hit === 1) hole.fairway_hit = 0;
    else hole.fairway_hit = null;
    
    await updateHole(hole);
};

const openNoteModal = (hole) => {
    activeHole.value = hole;
    activeHoleNote.value = hole.notes || '';
    showNoteModal.value = true;
};

const saveHoleNote = async () => {
    activeHole.value.notes = activeHoleNote.value;
    await updateHole(activeHole.value);
    showNoteModal.value = false;
};

const closeNoteModal = () => showNoteModal.value = false;

const handleFinalize = async () => {
  if (!allHolesFilled.value) { error.value = 'Finish all holes first'; return; }
  try {
    const total = getCurrentScore();
    await rounds.finalize(roundId, total, notes.value);
    round.value.status = 'completed';
    round.value.total_score = total;
  } catch (err) { error.value = err.message; }
};

const handleDelete = async () => {
  if(!confirm('Delete?')) return;
  await rounds.delete(roundId);
  router.push('/');
};

const formatDate = (d) => new Date(d).toLocaleDateString();
const formatStatus = (s) => s === 'in_progress' ? 'In Progress' : 'Completed';

onMounted(fetchRound);
</script>

<style scoped>
/* Stats Summary */
.stats-summary {
    display: flex;
    justify-content: space-between;
    background: white;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.stat-box {
    text-align: center;
    flex: 1;
    border-right: 1px solid #eee;
}

.stat-box:last-child { border-right: none; }

.stat-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: #1e3c72;
}

.stat-label {
    font-size: 0.8rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
</style>