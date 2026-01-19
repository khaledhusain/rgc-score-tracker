<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Royal Golf Club Bahrain</h1>
      <h2>Login</h2>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <p class="auth-link">
        Don't have an account?
        <router-link to="/register">Register here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../services/api';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    const response = await auth.login(email.value, password.value);
    auth.setToken(response.session_token);
    router.push('/');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>