<template>
  <div class="page">
    <div class="topbar">
      <h1 class="title">Administrator</h1>

      <div class="topbarActions">
        <button class="btn" @click="loadAll" :disabled="loading">
          {{ loading ? "..." : "Refresh" }}
        </button>
        <button class="btn" @click="logout">Logout</button>
      </div>
    </div>

    <div class="grid grid--stack">
      <!-- ROOMS SECTION -->
      <section class="card">
        <div class="cardHeader">
          <h2>Rooms</h2>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Status</th>
              <th>Occupied by</th>
              <th>Behavior score (0-20)</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="r in rooms" :key="r.room_id">
              <td>{{ (r.building ? r.building + " - " : "") + r.room_number }}</td>
              <td>
                <span class="pill" :class="r.status === 'occupied' ? 'pillRed' : 'pillGreen'">
                  {{ r.status }}
                </span>
              </td>
              <td>
                <span v-if="r.student_id">
                  {{ r.student_name }} ({{ r.student_username }})
                </span>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <span v-if="r.student_id" class="score">{{ r.behavior_score }}</span>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>

        </table>
      </section>

      <!-- REQUESTS SECTION -->
      <section class="card">
        <div class="cardHeader">
          <h2>Room Requests</h2>
          <button class="btn" @click="loadRequests" :disabled="loading">Refresh</button>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Requested room</th>
              <th>Requested room status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rq in requests" :key="rq.user_id">
              <td>{{ rq.name }}</td>
              <td>{{ (rq.requested_building ? rq.requested_building + " - " : "") + rq.requested_room_number }}</td>

              <td>{{ rq.requested_room_status }}</td>
              <td class="actions">
                <button class="btnPrimary" @click="decide(rq.user_id, 'approve')" :disabled="loading">
                  Accept
                </button>
                <button class="btnDanger" @click="decide(rq.user_id, 'reject')" :disabled="loading">
                  Refuse
                </button>
              </td>
            </tr>

            <tr v-if="!requests.length">
              <td colspan="4" class="muted">No room requests.</td>
            </tr>
          </tbody>
        </table>

        <p v-if="error" class="error">{{ error }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api, { setAuthToken } from "../api";

const router = useRouter();

const rooms = ref([]);
const requests = ref([]);
const loading = ref(false);
const error = ref("");

// ensure token is set when page refreshes
const token = localStorage.getItem("token");
if (token) setAuthToken(token);

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setAuthToken(null);
  router.push("/");
}

async function loadRooms() {
  const { data } = await api.get("/api/admin/rooms-overview");
  rooms.value = data;
}

async function loadRequests() {
  const { data } = await api.get("/api/admin/room-requests");
  requests.value = data;
}

async function loadAll() {
  error.value = "";
  loading.value = true;
  try {
    await Promise.all([loadRooms(), loadRequests()]);
  } catch (e) {
    error.value = e?.response?.data?.error || e.message || "Failed to load";
  } finally {
    loading.value = false;
  }
}

async function decide(userId, decision) {
  error.value = "";
  loading.value = true;
  try {
    await api.post(`/api/admin/room-requests/${userId}/decide`, { decision });
    await loadAll();
  } catch (e) {
    error.value = e?.response?.data?.error || e.message || "Action failed";
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);
</script>
<!-- 
<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  background: #0b1220;
  color: #eaf0ff;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.topbarActions {
  display: flex;
  gap: 10px;
}

.title {
  font-size: 34px;
  margin: 0;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.card {
  background: rgba(20, 30, 60, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 16px;
}

.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

.muted {
  opacity: 0.65;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btnPrimary {
  background: #2f6bff;
  color: #fff;
  border: 0;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.btnDanger {
  background: #d64a4a;
  color: #fff;
  border: 0;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.pill {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  display: inline-block;
}

.pillGreen {
  background: rgba(0, 200, 120, 0.2);
  border: 1px solid rgba(0, 200, 120, 0.35);
}

.pillRed {
  background: rgba(255, 80, 80, 0.2);
  border: 1px solid rgba(255, 80, 80, 0.35);
}

.score {
  font-weight: 700;
}

.error {
  margin-top: 12px;
  color: #ff7b7b;
}
</style> -->
