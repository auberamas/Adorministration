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

<script>
// To create reactive variables
import api, { setAuthToken } from "../api";

export default {
  name: "Login",

  data() {
    return {
      // Values from the form
      username: "",
      password: "",

      // User interface states
      error: "",
      loading: false,
    };
  },

  methods: {
    async onLogin() {
      // Rest messages dislayed to the user
      this.error = "";
      this.loading = true;

      try {
        // Call backend to log with username/password
        const { data } = await api.post("/api/auth/login", {
          username: this.username,
          password: this.password,
        });

        // Save token and user in browser storage so refresh does not log out
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Add token to all future API requests 
        setAuthToken(data.token);

        // Decide where to go depending on role
        const role = data.user.role;
        if (role === "admin") await this.$router.push("/admin");
        else await this.$router.push("/dashboard");

      } catch (e) {
        // If login fails, show error message
        this.error = e?.response?.data?.error || e.message || "Login failed";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
