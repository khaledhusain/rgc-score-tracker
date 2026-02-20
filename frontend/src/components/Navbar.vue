<template>
  <nav class="navbar">
    <!-- 1. Logo Section -->
    <div class="nav-left">
      <router-link to="/" class="nav-logo">
        Royal Golf Club
      </router-link>
    </div>

    <!-- 2. Center Links -->
    <div class="nav-center">
      <router-link to="/" class="nav-link" active-class="active">Dashboard</router-link>
      <div class="nav-dropdown" ref="courseDropdownRef" @click.stop="toggleCourseDropdown">
        <button type="button" class="nav-link nav-link-trigger" :class="{ active: isCourseActive }">
          Course
          <span class="nav-arrow">▼</span>
        </button>
        <div class="nav-dropdown-content" v-show="courseOpen">
          <router-link to="/course/hole-by-hole" class="nav-dd-item" @click="courseOpen = false">Hole by Hole</router-link>
          <router-link to="/course/scorecard" class="nav-dd-item" @click="courseOpen = false">Scorecard</router-link>
        </div>
      </div>
      <router-link to="/profile" class="nav-link" active-class="active">Profile</router-link>
    </div>

    <!-- 3. Profile Dropdown -->
    <div class="nav-right">
      <div class="profile-menu" @click="toggleDropdown" ref="dropdownRef">
        <div class="avatar-circle">
          {{ initials }}
        </div>
        <span class="profile-name">{{ firstName }}</span>
        
        <!-- Dropdown Content -->
        <div class="dropdown-content" v-if="isOpen">
          <router-link to="/profile" class="dd-item">My Career</router-link>
          <div class="dd-divider"></div>
          <button @click="handleLogout" class="dd-item logout">Logout</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, user } from '../services/api';

const router = useRouter();
const isOpen = ref(false);
const dropdownRef = ref(null);
const courseOpen = ref(false);
const courseDropdownRef = ref(null);
const firstName = ref('Golfer');
const lastName = ref('');

const initials = computed(() => {
  const f = firstName.value[0] || '';
  const l = lastName.value[0] || '';
  return (f + l).toUpperCase();
});

const toggleDropdown = () => isOpen.value = !isOpen.value;
const toggleCourseDropdown = () => courseOpen.value = !courseOpen.value;

const isCourseActive = computed(() => {
  const name = router.currentRoute.value?.name;
  return name === 'CourseHoleByHole' || name === 'CourseScorecard';
});

const closeDropdown = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false;
  }
  if (courseDropdownRef.value && !courseDropdownRef.value.contains(e.target)) {
    courseOpen.value = false;
  }
};

const handleLogout = async () => {
  try {
    await auth.logout();
    auth.clearToken();
    router.push('/login');
  } catch (err) {
    console.error('Logout failed', err);
  }
};

const fetchUser = async () => {
  try {
    const data = await user.getInfo();
    firstName.value = data.first_name;
    lastName.value = data.last_name;
  } catch (e) {
    console.log("Could not load user info");
  }
};

onMounted(() => {
  document.addEventListener('click', closeDropdown);
  fetchUser();
});

onUnmounted(() => document.removeEventListener('click', closeDropdown));
</script>