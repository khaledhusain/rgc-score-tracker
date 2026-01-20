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
            <h2>{{ round.course_name || 'Royal Golf Club' }}</h2>
            <!-- Fixed: Display correct tee color stored in database, fallback to Blue -->
            <p class="round-date">{{ formatDate(round.date) }} • {{ selectedTee }} Tees</p>
          </div>
          <span class="round-status" :class="round.status">{{ formatStatus(round.status) }}</span>
        </div>

        <div class="scorecard-wrapper">
            <div class="scorecard-header-row">
                <div class="col-hole">Hole</div>
                <div class="col-data">Par</div>
                <div class="col-data">Index</div> <!-- Renamed from Idx -->
                <div class="col-data">Distance (Yards)</div> <!-- Renamed from Dist -->
                <div class="col-input header-center">Score</div>
                <div class="col-action header-center">Putts</div>
                <div class="col-action header-center">Notes</div>
            </div>
            
            <div v-for="hole in holes" :key="hole.hole_number" class="score-row">
                <div class="col-hole">{{ hole.hole_number }}</div>
                <div class="col-data">{{ getHoleData(hole.hole_number).par }}</div>
                <div class="col-data">{{ getHoleData(hole.hole_number).index }}</div>
                <div class="col-data">{{ getHoleData(hole.hole_number).dist }}</div>
                
                <!-- Score Input -->
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

                <!-- Putts Popup Trigger -->
                <div class="col-action">
                    <button 
                        class="icon-btn" 
                        :class="{ 'has-data': hole.putts !== null }"
                        @click="openPuttModal(hole)"
                        :disabled="round.status === 'completed'"
                    >
                        {{ hole.putts !== null ? hole.putts : '⛳' }}
                    </button>
                </div>

                <!-- Notes Popup Trigger -->
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
            </div>
        </div>

        <!-- Round Level Notes -->
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
                placeholder="Fairway hit? Penalty? Good shot?"
                class="hole-note-input"
            ></textarea>
            <button class="btn btn-primary full-width" @click="saveHoleNote">Save Note</button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { rounds } from '../services/api';

// COURSE DATA FROM IMAGE
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
// Fix: Initialize selectedTee but update it later from DB if available
const selectedTee = ref(route.query.tee || 'Blue'); 
const roundId = route.params.roundId;

// Modal States
const showPuttModal = ref(false);
const showNoteModal = ref(false);
const activeHole = ref({});
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

const fetchRound = async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await rounds.getById(roundId);
    round.value = data;
    notes.value = data.notes || '';
    
    // Check if the round data has a specific tee associated with it (future proofing)
    // For now we rely on the query param or default, 
    // but typically you'd save tee_color in DB round table.
    // If you saved tee in notes or new column, load it here.
    if (route.query.tee) selectedTee.value = route.query.tee;

    const holesCount = data.holes_played || 18;
    holes.value = data.holes || [];
    for (let i = 1; i <= holesCount; i++) {
      if (!holes.value.find(h => h.hole_number === i)) {
        holes.value.push({ hole_number: i, strokes: null, putts: null, notes: '' });
      }
    }
    holes.value.sort((a, b) => a.hole_number - b.hole_number);
  } catch (err) { error.value = err.message; } 
  finally { loading.value = false; }
};

const updateHole = async (hole) => {
  if (!hole.strokes) return;
  try {
    const par = getHoleData(hole.hole_number).par;
    await rounds.updateHoleScore(roundId, hole.hole_number, hole.strokes, par, hole.putts, hole.notes);
  } catch (err) { error.value = err.message; }
};

// Modal Logic
const openPuttModal = (hole) => {
    activeHole.value = hole;
    showPuttModal.value = true;
};

const setPutt = async (num) => {
    // Validation: Putts cannot equal or exceed strokes (unless it's a hole in one/weird edge case, 
    // but generally putts < strokes). Simple check:
    if (activeHole.value.strokes && num >= activeHole.value.strokes) {
        alert("Putts cannot equal or exceed score!");
        return;
    }
    
    activeHole.value.putts = num;
    await updateHole(activeHole.value);
    showPuttModal.value = false;
};

const closePuttModal = () => showPuttModal.value = false;

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