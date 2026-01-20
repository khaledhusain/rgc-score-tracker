<template>
  <div class="rounds-container">
    <nav class="navbar">
      <h1>Royal Golf Club</h1>
      <router-link to="/" class="btn btn-secondary">Back</router-link>
    </nav>

    <main class="content">
      <div class="rounds-header">
        <h2>Start New Round</h2>
      </div>

      <form @submit.prevent="handleCreateRound" class="entry-form">
        <!-- Removed Course Selection Dropdown -->
        
        <div class="form-group">
          <label>Tee Box</label>
          <select v-model="teeColor" required>
            <option value="Black">Black (75.9 / 141)</option>
            <option value="Gold">Gold (73.9 / 137)</option>
            <option value="Blue">Blue (72.1 / 133)</option>
            <option value="White">White (73.6 / 132)</option>
            <option value="Red">Red (69.9 / 126)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Date</label>
          <input v-model="date" type="date" required :max="todayDate" />
        </div>

        <div class="form-group">
          <label>Holes to Play</label>
          <div class="radio-group">
            <label class="radio-label">
              <input v-model.number="holesPlayed" type="radio" :value="9" /> Front 9
            </label>
            <label class="radio-label">
              <input v-model.number="holesPlayed" type="radio" :value="18" /> Full 18
            </label>
          </div>
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary">
          {{ loading ? 'Creating...' : 'Start Round' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { rounds } from '../services/api';

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

const courseId = ref(1); // Hardcoded ID
const teeColor = ref('Blue');
const date = ref(getTodayDate());
const holesPlayed = ref(18);
const loading = ref(false);
const error = ref('');
const router = useRouter();
const todayDate = getTodayDate();

const handleCreateRound = async () => {
  error.value = '';
  loading.value = true;
  try {
    const response = await rounds.create(
      courseId.value,
      date.value,
      holesPlayed.value,
      teeColor.value
    );
    router.push(`/round/${response.roundId}?tee=${teeColor.value}`);
  } catch (err) {
    error.value = err.message;
    loading.value = false;
  }
};
</script>