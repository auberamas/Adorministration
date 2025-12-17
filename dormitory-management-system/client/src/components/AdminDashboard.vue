<template>
  <div class="page">
    <!-- Header with refresh and logout -->
    <div class="topbar">
      <h1 class="title">Administrator</h1>

      <div class="topbarActions">
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

      <section class="card">
        <div class="cardHeader">
          <h2>Behavior Requests</h2>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Points to remove</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in behaviorRequests" :key="b.id">
              <td>{{ b.student_name }} ({{ b.student_username }})</td>
              <td>{{ b.points }}</td>
              <td>{{ b.description }}</td>
              <td class="actions">
                <button class="btnPrimary" @click="decideBehaviorRequest(b.id,'approve')" :disabled="loading">
                  Accept
                </button>
                <button class="btnDanger" @click="decideBehaviorRequest(b.id,'reject')" :disabled="loading">
                  Refuse
                </button>
              </td>
            </tr>

            <tr v-if="!behaviorRequests.length">
              <td colspan="4" class="muted">No behavior requests.</td>
            </tr>
          </tbody>
        </table>
      </section>

    </div>
  </div>
</template>

<script>
import api, { setAuthToken } from "../api";

export default {
  name: "AdminDashboard",

  data() {
    return {
      // Data shown in tables
      rooms: [],
      requests: [],
      behaviorRequests: [],

      // User interface state
      loading: false,
      error: "",
    };
  },

  methods: {
    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAuthToken(null);
      this.$router.push("/");
    },

    async loadBehaviorRequests() {
      const { data } = await api.get("/api/admin/behavior-requests");
      this.behaviorRequests = data;
    },

    async decideBehaviorRequest(id, decision) {
      await api.post(`/api/admin/behavior-requests/${id}/decide`, { decision });
      await this.loadBehaviorRequests();
      await this.loadRooms(); // behavior score updates immediately in rooms overview
    },

    async loadRooms() {
      const { data } = await api.get("/api/admin/rooms-overview");
      this.rooms = data;
    },

    // Load pending requests
    async loadRequests() {
      const { data } = await api.get("/api/admin/room-requests");
      this.requests = data;
    },

    // Load both tables together
    async loadAll() {
      this.error = "";
      this.loading = true;
      try {
        await Promise.all([this.loadRooms(), this.loadRequests(), this.loadBehaviorRequests()]);
      } catch (e) {
        this.error = e?.response?.data?.error || e.message || "Failed to load";
      } finally {
        this.loading = false;
      }
    },

    // Approve or reject a request, then reload data
    async decide(userId, decision) {
      this.error = "";
      this.loading = true;
      try {
        await api.post(`/api/admin/room-requests/${userId}/decide`, { decision });
        await this.loadAll();
      } catch (e) {
        this.error = e?.response?.data?.error || e.message || "Action failed";
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    // If the user refreshes the page, set token again so API calls work
    const token = localStorage.getItem("token");
    if (token) setAuthToken(token);

    // Load data automatically when page opens
    this.loadAll();
  },
};
</script>
