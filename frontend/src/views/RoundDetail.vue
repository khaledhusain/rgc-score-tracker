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
            <p class="round-date">{{ formatDate(round.date) }}</p>
          </div>
          <span class="round-status" :class="round.status">
            {{ formatStatus(round.status) }}
          </span>
        </div>

        <div class="scorecard">
          <div class="scorecard-header">
            <h3>Scorecard</h3>
            <p v-if="round.total_score" class="total-score">
              Total: {{ round.total_score }}
            </p>
          </div>

          <div class="holes-grid">
            <div
              v-for="hole in holes"
              :key="hole.hole_number"
              class="hole-entry"
            >
              <label>Hole {{ hole.hole_number }}</label>
              <div class="hole-input-group">
                <input
                  v-model.number="hole.strokes"
                  type="number"
                  min="1"
                  max="15"
                  :disabled="round.status === 'completed'"
                  @change="updateHole(hole)"
                  class="strokes-input"
                  placeholder="Strokes"
                />
                <span v-if="hole.par" class="par-display">Par {{ hole.par }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group" v-if="round.status === 'in_progress'">
          <label>Round Notes</label>
          <textarea
            v-model="notes"
            placeholder="Add notes about your round..."
          ></textarea>
        </div>

        <div v-if="round.status === 'completed'" class="form-group">
          <label>Round Notes</label>
          <p>{{ round.notes || 'No notes' }}</p>
        </div>

        <div v-if="round.status === 'in_progress'" class="actions">
          <button @click="handleFinalize" :disabled="!allHolesFilled" class="btn btn-primary">
            Finish Round
          </button>
          <button @click="handleDelete" class="btn btn-danger">
            Delete Round
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { rounds } from '../services/api';

const route = useRoute();
const router = useRouter();
const round = ref({});
const holes = ref([]);
const notes = ref('');
const loading = ref(false);
const error = ref('');

const roundId = route.params.roundId;

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

    const holesCount = data.holes_played || 18;
    holes.value = data.holes || [];

    for (let i = 1; i <= holesCount; i++) {
      if (!holes.value.find(h => h.hole_number === i)) {
        holes.value.push({
          hole_number: i,
          strokes: null,
          par: i <= 9 ? 4 : 4,
        });
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
  if (!hole.strokes || hole.strokes < 1) return;

  try {
    await rounds.updateHoleScore(
      roundId,
      hole.hole_number,
      hole.strokes,
      hole.par || 4 // Default to 4 if null to satisfy "required"
    );
  } catch (err) {
    error.value = err.message;
  }
};

const handleFinalize = async () => {
  if (!allHolesFilled.value) {
    error.value = 'All holes must have scores';
    return;
  }

  const totalScore = holes.value.reduce(
    (sum, hole) => sum + (hole.strokes || 0),
    0
  );

  try {
    await rounds.finalize(roundId, totalScore, notes.value);
    round.value.status = 'completed';
    round.value.total_score = totalScore;
    round.value.notes = notes.value;
  } catch (err) {
    error.value = err.message;
  }
};

const handleDelete = async () => {
  if (!confirm('Delete this round?')) return;

  try {
    await rounds.delete(roundId);
    router.push('/');
  } catch (err) {
    error.value = err.message;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatStatus = (status) => {
  const statusMap = {
    in_progress: 'In Progress',
    completed: 'Completed',
  };
  return statusMap[status] || status;
};

onMounted(fetchRound);
</script>