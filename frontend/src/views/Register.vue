<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Royal Golf Club</h1>
      <h2>Create Account</h2>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>First Name</label>
          <input
            v-model="first_name"
            type="text"
            placeholder="John"
            required
          />
        </div>

        <div class="form-group">
          <label>Last Name</label>
          <input
            v-model="last_name"
            type="text"
            placeholder="Doe"
            required
          />
        </div>

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
          <p class="password-hint">
            Min 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
          </p>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Register' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <p class="auth-link">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../services/api';

const first_name = ref('');
const last_name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();

const handleRegister = async () => {
  error.value = '';
  loading.value = true;

  try {
    await auth.register(
      first_name.value,
      last_name.value,
      email.value,
      password.value
    );
    const loginResponse = await auth.login(email.value, password.value);
    auth.setToken(loginResponse.session_token);
    router.push('/');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>