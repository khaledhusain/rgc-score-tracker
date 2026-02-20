<template>
  <div class="course-hole-page">
    <Navbar />
    <main class="content">
      <div class="page-title">
        <h1 class="course-name">Royal Golf Club</h1>
        <p class="page-subtitle">Hole by Hole</p>
      </div>
      <div class="hole-selector-bar">
        <div class="hole-bar">
          <button
            v-for="n in 18"
            :key="n"
            type="button"
            class="hole-btn"
            :class="{ active: currentHole === n }"
            @click="currentHole = n"
          >
            {{ n }}
          </button>
        </div>
      </div>
      <div class="hole-content two-panel">
        <div class="hole-image-placeholder">
          <span class="hole-label">Hole {{ currentHole }}</span>
          <span class="par-badge">Par {{ getHoleData(currentHole).par }}</span>
        </div>
        <div class="hole-details">
          <h2 class="hole-details-title">Hole {{ currentHole }}</h2>
          <div class="detail-row">
            <span class="detail-label">Par</span>
            <span class="detail-value">{{ getHoleData(currentHole).par }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Handicap Index</span>
            <span class="detail-value">{{ getHoleData(currentHole).index }}</span>
          </div>
          <div class="detail-row yardages">
            <span class="detail-label">Yardages</span>
            <div class="yardage-list">
              <span v-for="tee in teeList" :key="tee.name" class="yardage-item">
                {{ tee.name }}: {{ tee.yd }} yd
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Navbar from '../components/Navbar.vue';

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
  18: [4, 6, 429, 411, 392, 349, 305],
};

const TEE_ORDER = [
  { name: 'Black', idx: 2 },
  { name: 'Gold', idx: 3 },
  { name: 'Blue', idx: 4 },
  { name: 'White', idx: 5 },
  { name: 'Red', idx: 6 },
];

const currentHole = ref(1);

const getHoleData = (num) => {
  const data = COURSE_DATA[num] || [4, 0, 0, 0, 0, 0, 0];
  return { par: data[0], index: data[1] };
};

const teeList = computed(() => {
  const data = COURSE_DATA[currentHole.value] || [];
  return TEE_ORDER.map(({ name, idx }) => ({
    name,
    yd: data[idx] != null ? data[idx] : '–',
  }));
});
</script>
