<template>
  <div class="wrap">
    <div class="card card--auth">
      <h1>Login</h1>

      <label>Username</label>
      <input v-model="username" placeholder="studentX" />

      <label>Password</label>
      <input v-model="password" type="password" placeholder="pass1234" />

      <button class="login-btn" @click="onLogin" :disabled="loading">{{ loading ? "..." : "Login" }}</button>

      <p v-if="error" class="err">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>

// To create reactive variables
import { ref } from "vue";

// To change the page
import { useRouter } from "vue-router";

// To call the backend
import api, { setAuthToken } from "../api";

const router = useRouter();

// Values from the form
const username = ref("");
const password = ref("");

// User interface states
const error = ref("");
const loading = ref(false);

async function onLogin() {
  // Rest messages dislayed to the user
  error.value = "";
  loading.value = true;
  try {
    // Call backend to log with username/password
    const { data } = await api.post("/api/auth/login", {
      username: username.value,
      password: password.value
    });

    // Save token and user in browser storage so refresh does not log out
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    
    // Add token to all future API requests 
    setAuthToken(data.token);

    // Decide where to go depending on role
    const role = data.user.role;
    if (role === "admin") await router.push("/admin");
    else await router.push("/dashboard");

  } catch (e) {
    // If login fails, show error message
    error.value = e?.response?.data?.error || e.message || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>
