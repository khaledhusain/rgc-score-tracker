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
const firstName = ref('Golfer');
const lastName = ref('');

const initials = computed(() => {
  const f = firstName.value[0] || '';
  const l = lastName.value[0] || '';
  return (f + l).toUpperCase();
});

const toggleDropdown = () => isOpen.value = !isOpen.value;

const closeDropdown = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false;
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