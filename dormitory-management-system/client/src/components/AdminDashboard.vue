<template>
  <div class="page">
    <!-- Header with refresh and logout -->
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
      <!-- room section -->
      <section class="card">
        <div class="cardHeader">
          <h2>Rooms</h2>
        </div>

        <!-- Shows room status, who occupies it and behavior score -->
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

      <!-- Room request section -->
      <section class="card">
        <div class="cardHeader">
          <h2>Room Requests</h2>
          <button class="btn" @click="loadRequests" :disabled="loading">Refresh</button>
        </div>

        <!-- Shows all pending room requests -->
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

// Data shown in tables
const rooms = ref([]);
const requests = ref([]);

// User interface state
const loading = ref(false);
const error = ref("");

// If the user refreshes the page, set token again so API calls work
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

// Load pending requests
async function loadRequests() {
  const { data } = await api.get("/api/admin/room-requests");
  requests.value = data;
}

// Load both tables together
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

// Approve or reject a request, then reload data
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

// Load data automatically when page opens
onMounted(loadAll);
</script>