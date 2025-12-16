<template>
  <div class="wrap">
    <div class="card card--auth">
      <h1>Login</h1>

      <label>Username</label>
      <input v-model="username" placeholder="student1" />

      <label>Password</label>
      <input v-model="password" type="password" placeholder="pass1234" />

      <button @click="onLogin" :disabled="loading">{{ loading ? "..." : "Login" }}</button>

      <p v-if="error" class="err">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api, { setAuthToken } from "../api";

const router = useRouter();
const username = ref("student1");
const password = ref("pass1234");
const error = ref("");
const loading = ref(false);

async function onLogin() {
  error.value = "";
  loading.value = true;
  try {
    const { data } = await api.post("/api/auth/login", {
      username: username.value,
      password: password.value
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setAuthToken(data.token);

    const role = data.user.role;

    if (role === "admin") await router.push("/admin");
    else await router.push("/dashboard");
  } catch (e) {
    error.value = e?.response?.data?.error || e.message || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>

<!-- <style scoped>
.wrap { min-height: 100vh; display:flex; align-items:center; justify-content:center; background:#0b1220; color:#e7eefc; padding:24px; }
.card { width: 520px; background:#0f1b33; border:1px solid #1f2d4a; border-radius:16px; padding:24px; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
.hint { opacity:.8; margin: 0 0 16px; }
label { display:block; margin-top:12px; opacity:.9; }
input { width:100%; padding:12px 14px; border-radius:12px; border:1px solid #263a62; background:#0b152b; color:#e7eefc; outline:none; }
button { margin-top:16px; width:140px; padding:10px 14px; border-radius:12px; border:none; background:#2f6bff; color:white; cursor:pointer; }
button:disabled { opacity:.6; cursor:not-allowed; }
.err { margin-top:14px; color:#ff6b6b; }
</style> -->
