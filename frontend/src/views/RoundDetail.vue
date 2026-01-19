<template>
  <div class="rounds-container">
    <nav class="navbar">
      <h1>Royal Golf Club</h1>
      <router-link to="/" class="btn btn-secondary">Back</router-link>
    </nav>

    <main class="content">
      <div v-if="loading" class="loading">Loading round...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="round-detail">
        <div class="round-detail-header">
          <div>
            <h2>{{ round.course_name }}</h2>
            <p class="round-date">{{ formatDate(round.date) }} • {{ selectedTee }} Tees</p>
          </div>
          <span class="round-status" :class="round.status">{{ formatStatus(round.status) }}</span>
        </div>

        <!-- SCORECARD TABLE STYLE -->
        <div class="scorecard-wrapper">
            <div class="scorecard-header-row">
                <div class="col-hole">Hole</div>
                <div class="col-data">Par</div>
                <div class="col-data">Index</div>
                <div class="col-data">Dist</div>
                <div class="col-input">Score</div>
            </div>
            
            <div v-for="hole in holes" :key="hole.hole_number" class="score-row">
                <div class="col-hole">{{ hole.hole_number }}</div>
                <div class="col-data">{{ getHoleData(hole.hole_number).par }}</div>
                <div class="col-data">{{ getHoleData(hole.hole_number).index }}</div>
                <div class="col-data">{{ getHoleData(hole.hole_number).dist }}</div>
                <div class="col-input">
                    <input 
                        v-model.number="hole.strokes" 
                        type="number" 
                        min="1" 
                        :disabled="round.status === 'completed'"
                        @change="updateHole(hole)"
                        class="score-input"
                    />
                </div>
            </div>
             <div class="score-row total-row">
                <div class="col-hole">TOT</div>
                <div class="col-data">{{ getTotalPar() }}</div>
                <div class="col-data">-</div>
                <div class="col-data">-</div>
                <div class="col-input">{{ getCurrentScore() }}</div>
            </div>
        </div>

        <div class="form-group" v-if="round.status === 'in_progress'">
          <label>Notes</label>
          <textarea v-model="notes" placeholder="Round notes..."></textarea>
        </div>

        <div v-if="round.status === 'in_progress'" class="actions">
          <button @click="handleFinalize" :disabled="!allHolesFilled" class="btn btn-primary">Finish Round</button>
          <button @click="handleDelete" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { rounds } from '../services/api';

// COURSE DATA FROM IMAGE
const COURSE_DATA = {
    // Hole: [Par, Index, Black, Gold, Blue, White, Red]
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

// Tee Index mapping based on COURSE_DATA array structure
const TEE_INDEX = { 'Black': 2, 'Gold': 3, 'Blue': 4, 'White': 5, 'Red': 6 };

const route = useRoute();
const router = useRouter();
const round = ref({});
const holes = ref([]);
const notes = ref('');
const loading = ref(false);
const error = ref('');
const selectedTee = ref(route.query.tee || 'Blue'); // Default to Blue if not passed

const roundId = route.params.roundId;

// Helper to get static data
const getHoleData = (num) => {
    const data = COURSE_DATA[num];
    const idx = TEE_INDEX[selectedTee.value] || 4; // Default Blue
    return { par: data[0], index: data[1], dist: data[idx] };
};

const getTotalPar = () => {
    return holes.value.reduce((sum, h) => sum + getHoleData(h.hole_number).par, 0);
};

const getCurrentScore = () => {
    return holes.value.reduce((sum, h) => sum + (h.strokes || 0), 0);
};

const allHolesFilled = computed(() => {
  return holes.value.every(hole => hole.strokes && hole.strokes > 0);
});

const fetchRound = async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await rounds.getById(roundId);
    round.value = data;
    notes.value = data.notes || '';
    
    // Setup Holes
    const holesCount = data.holes_played || 18;
    holes.value = data.holes || [];

    // Fill missing
    for (let i = 1; i <= holesCount; i++) {
      if (!holes.value.find(h => h.hole_number === i)) {
        holes.value.push({ hole_number: i, strokes: null });
      }
    }
    holes.value.sort((a, b) => a.hole_number - b.hole_number);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const updateHole = async (hole) => {
  if (!hole.strokes) return;
  try {
    const par = getHoleData(hole.hole_number).par;
    await rounds.updateHoleScore(roundId, hole.hole_number, hole.strokes, par);
  } catch (err) { error.value = err.message; }
};

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
.scorecard-wrapper {
    background: white;
    border: 1px solid #eee;
    margin-bottom: 2rem;
    font-size: 0.9rem;
}
.scorecard-header-row, .score-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1.5fr;
    text-align: center;
    border-bottom: 1px solid #eee;
    padding: 8px 0;
    align-items: center;
}
.scorecard-header-row {
    background: #1e3c72;
    color: white;
    font-weight: bold;
}
.col-hole { font-weight: bold; color: #1e3c72; }
.col-input { padding: 0 5px; }
.score-input {
    width: 100%;
    text-align: center;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: bold;
}
.total-row {
    background: #f9f9f9;
    font-weight: bold;
    border-top: 2px solid #ddd;
}
</style>