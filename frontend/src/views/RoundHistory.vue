<template>
  <div class="rounds-container">
    <nav class="navbar">
      <h1>Royal Golf Club</h1>
      <div class="nav-actions">
        <router-link to="/new-round" class="btn btn-primary">
          + New Round
        </router-link>
        <button @click="handleLogout" class="btn btn-secondary">Logout</button>
      </div>
    </nav>

    <main class="content">
      <div class="rounds-header">
        <h2>Round History</h2>
      </div>

      <div v-if="loading" class="loading">Loading rounds...</div>

      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else>
        <div class="handicap-display" v-if="handicap !== null">
          <div class="label">Current Handicap</div>
          <div class="value">{{ handicap }}</div>
          <div class="note" v-if="roundsCount < 10">
            Play {{ 10 - roundsCount }} more rounds for accurate handicap
          </div>
        </div>

        <div v-if="rounds.length === 0" class="empty-state">
          <p>No rounds recorded yet.</p>
          <router-link to="/new-round" class="btn btn-primary">
            Start Your First Round
          </router-link>
        </div>

        <div v-else class="rounds-list">
          <div
            v-for="round in rounds"
            :key="round.id"
            class="round-card"
            @click="goToRound(round.id)"
          >
            <div class="round-header">
              <h3>{{ round.course_name }}</h3>
              <span class="round-status" :class="round.status">
                {{ formatStatus(round.status) }}
              </span>
            </div>

            <div class="round-details">
              <p><strong>Date:</strong> {{ formatDate(round.date) }}</p>
              <p><strong>Holes:</strong> {{ round.holes_played }}</p>
              <p v-if="round.total_score">
                <strong>Score:</strong> {{ round.total_score }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, rounds, user } from '../services/api';

const rounds_data = ref([]);
const loading = ref(false);
const error = ref('');
const handicap = ref(null);
const roundsCount = ref(0);
const router = useRouter();

const fetchRounds = async () => {
  loading.value = true;
  error.value = '';

  try {
    const data = await rounds.getAll();
    rounds_data.value = data;
    
    const handicapData = await user.getHandicap();
    handicap.value = handicapData.handicap;
    roundsCount.value = handicapData.roundsCount;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await auth.logout();
    auth.clearToken();
    router.push('/login');
  } catch (err) {
    console.error('Logout failed:', err);
  }
};

const goToRound = (roundId) => {
  router.push(`/round/${roundId}`);
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

onMounted(fetchRounds);
</script>