<template>
  <div class="rounds-container">
    <Navbar />
    <div class="entry-container">
      <div class="entry-card">
        <div class="entry-header">
            <h2>New Round</h2>
            <!-- Subtitle removed -->
        </div>

        <form @submit.prevent="handleCreateRound">
            
            <!-- 1. Tee Selection -->
            <div class="form-section">
                <label class="section-label">Tee Box</label>
                <div class="tee-selector">
                    <div 
                        v-for="color in ['Black', 'Gold', 'Blue', 'White', 'Red']"
                        :key="color"
                        class="tee-dot"
                        :class="[`t-${color.toLowerCase()}`, { selected: teeColor === color }]"
                        @click="teeColor = color"
                        :title="color"
                    ></div>
                </div>
            </div>

            <!-- 2. Holes Selection -->
            <div class="form-section">
                <label class="section-label">Holes</label>
                <div class="hole-selector">
                    <button 
                        type="button"
                        class="hole-option" 
                        :class="{ active: holeSelection === 'Front 9' }"
                        @click="holeSelection = 'Front 9'"
                    >
                        Front 9
                    </button>
                    <button 
                        type="button"
                        class="hole-option" 
                        :class="{ active: holeSelection === 'Back 9' }"
                        @click="holeSelection = 'Back 9'"
                    >
                        Back 9
                    </button>
                    <button 
                        type="button"
                        class="hole-option" 
                        :class="{ active: holeSelection === 'Full 18' }"
                        @click="holeSelection = 'Full 18'"
                    >
                        Full 18
                    </button>
                </div>
            </div>

            <!-- 3. Date -->
            <div class="form-section">
                <label class="section-label">Date</label>
                <input 
                    v-model="date" 
                    type="date" 
                    required 
                    :max="todayDate" 
                    class="clean-date-input"
                />
            </div>

            <!-- 4. Submit -->
            <button type="submit" :disabled="loading" class="action-btn">
                {{ loading ? 'Starting...' : 'Start Round' }}
            </button>

            <p v-if="error" class="error">{{ error }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { rounds } from '../services/api';

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

const courseId = ref(1); 
const teeColor = ref('Blue'); // Default
const holeSelection = ref('Full 18'); // Default text selection
const date = ref(getTodayDate());
const loading = ref(false);
const error = ref('');
const router = useRouter();
const todayDate = getTodayDate();

const handleCreateRound = async () => {
  error.value = '';
  loading.value = true;
  
  // Logic to map selection to number of holes
  // Currently backend only tracks total count, not which 9.
  // We send 9 for Front/Back, and 18 for Full.
  const holesCount = holeSelection.value === 'Full 18' ? 18 : 9;

  try {
    const response = await rounds.create(
      courseId.value,
      date.value,
      holesCount,
      teeColor.value
    );
    router.push(`/round/${response.roundId}?tee=${teeColor.value}`);
  } catch (err) {
    error.value = err.message;
    loading.value = false;
  }
};
</script>