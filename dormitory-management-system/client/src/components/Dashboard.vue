<template>
  <div class="page">
    <!-- Top bar : page title, role and logout button -->
    <div class="topbar">
      <h1 class="title">Dashboard</h1>

      <div class="topbarActions">
        <!-- Shows the current user role -->
        <span class="pill">{{ user?.role }}</span>
        <button class="btn" @click="logout">Logout</button>
      </div>
    </div>

    <div class="grid">
       <!-- for student role : if admin approved a room student have to pay-->
      <div class="card" v-if="user?.role==='student' && me?.room_id && !me?.paid">
        <h2>Payment required</h2>
        <p class="muted">
          Your room has been approved by the administrator. Please pay to confirm your accommodation.
        </p>
        <button class="btnPrimary" @click="payRoom" :disabled="loadingPay">
          {{ loadingPay ? "..." : "Pay" }}
        </button>
        <p v-if="payError" class="error">{{ payError }}</p>
      </div>

      <!-- My profile : only for student -->
      <div class="card" v-if="user?.role == 'student'">
        <div class="cardHeader">
          <h2>My profile</h2>
        </div>

        <!-- Show user data -->
        <div v-if="me" class="profile">
          <div class="kv"><span class="k">Name</span><span class="v">{{ me.name }}</span></div>
          <div class="kv"><span class="k">Username</span><span class="v">{{ me.username }}</span></div>
          <div class="kv"><span class="k">Role</span><span class="v">{{ me.role }}</span></div>

          <div class="kv">
            <span class="k">Room</span>
            <span class="v">
              <template v-if="me.room_number">
                {{ me.building ? me.building + " - " : "" }}{{ me.room_number }}
              </template>
              <template v-else>—</template>
            </span>
          </div>

          <div class="kv"><span class="k">Paid</span><span class="v">{{ me.paid ? "Yes" : "No" }}</span></div>
          <div class="kv">
            <span class="k">Behavior score</span>
            <span class="v">{{ me?.behavior_score ?? "—" }}</span>
          </div>

          <div class="kv">
            <span class="k">Email</span>
            <span class="v" v-if="!editProfile">{{ me.email ?? "—" }}</span>
            <input v-else v-model="editEmail" placeholder="email" />
          </div>

          <div class="kv">
            <span class="k">Phone</span>
            <span class="v" v-if="!editProfile">{{ me.phone ?? "—" }}</span>
            <input
              v-else
              v-model="editPhone"
              placeholder="11 digits"
              inputmode="numeric"
              maxlength="11"
              @input="editPhone = editPhone.replace(/\\D/g,'').slice(0,11)"
            />
          </div>

          <!-- Student can edit email/phone -->
          <div class="actions" v-if="user?.role==='student'">
            <button class="btn" v-if="!editProfile" @click="startEdit">Modify</button>
            <button class="btnPrimary" v-else @click="saveProfile" :disabled="savingProfile">
              {{ savingProfile ? "..." : "Save" }}
            </button>
            <button class="btnDanger" v-if="editProfile" @click="cancelEdit">Cancel</button>
          </div>

          <p v-if="profileError" class="error">{{ profileError }}</p>
        </div>
      </div>

      <!-- Student can choose a room (if has no room already) -->
      <div class="card" v-if="user?.role==='student' && !me?.room_id && !me?.requested_room_id">
        <h2>Choose a room</h2>
        <p class="muted">You currently don’t have a room. Click an available room to request it.</p>
        
        <!-- List of available rooms -->
        <ul class="list">
          <li
            v-for="r in availableRooms"
            :key="r.id"
            class="clickRow"
            @click="openRoomConfirm(r)"
            title="Click to request this room"
          >
            {{ r.building ? r.building + " - " : "" }}{{ r.room_number }}
          </li>
        </ul>
      </div>

      <!-- Student need to confirm room request -->
      <div v-if="user?.role==='student' && showRoomConfirm" class="modalOverlay" @click.self="closeRoomConfirm">
        <div class="modalCard" role="dialog" aria-modal="true">
          <h3 class="modalTitle">Confirm room request</h3>
          <p class="muted" style="margin: 6px 0 12px;">
            You are about to request:
            <strong>
              {{ selectedRoom?.building ? selectedRoom.building + " - " : "" }}{{ selectedRoom?.room_number }}
            </strong>
          </p>

          <div class="modalActions">
            <button class="btn" @click="closeRoomConfirm">Cancel</button>
            <button class="btnPrimary" @click="confirmRoomRequest" :disabled="confirmingRoom">
              {{ confirmingRoom ? "..." : "Confirm" }}
            </button>
          </div>

          <p v-if="roomConfirmError" class="error">{{ roomConfirmError }}</p>
        </div>
      </div>

      <!-- Student: request pending -->
      <div class="card" v-if="user?.role==='student' && !me?.room_id && me?.requested_room_id">
        <h2>Room request pending</h2>
        <p class="muted">Your request is pending administrator decision.</p>
      </div>

      <!-- Interventions visible for everyone except admin -->
      <div class="card" v-if="user?.role !== 'admin'">
        <div class="cardHeader">
          <h2>Interventions</h2>
        </div>

        <div v-if="['student','receptionist'].includes(user?.role)" class="box">
          <div class="row">
            <select v-model="newType">
              <option value="cleaning">cleaning</option>
              <option value="repair">repair</option>
            </select>

            <input
              v-if="user?.role === 'student'"
              :value="me?.room_number ? `Room ${me.room_number}` : 'No room yet'"
              disabled
            />
          </div>

          <textarea v-model="newDesc" placeholder="description"></textarea>
          <button class="btnPrimary" @click="createIntervention">Create</button>
        </div>

        <ul class="list">
          <li v-for="it in interventions" :key="it.id">
            #{{ it.id }} (room {{ it.room_id }}) {{ it.type }} - {{ it.status }}

            <template v-if="user?.role==='service'">
              <button class="btnPrimary" v-if="it.status==='pending'" @click="setStatus(it.id,'accepted')">Accept</button>
              <button class="btnDanger" v-if="it.status==='pending'" @click="setStatus(it.id,'rejected')">Reject</button>
              <button class="btnPrimary" v-if="it.status==='accepted'" @click="setStatus(it.id,'completed')">Complete</button>
            </template>
          </li>
        </ul>
      </div>

      <!-- Receptionist: record behavior (deduct points) -->
      <div class="card" v-if="user?.role==='receptionist'">
        <h2>Record behavior</h2>

        <select v-model="selectedStudentId">
          <option disabled value="">Select a student</option>
          <option v-for="s in students" :key="s.id" :value="String(s.id)">
            {{ s.name }} ({{ s.username }}) — {{ s.building }} {{ s.room_number }}
          </option>
        </select>

        <input
          v-model.number="behDeduct"
          placeholder="points to remove (e.g. 3)"
          inputmode="numeric"
        />
        <input v-model="behDesc" placeholder="description" />

        <button class="btnPrimary" @click="recordBehavior" :disabled="loadingBehavior">
          {{ loadingBehavior ? "..." : "Record" }}
        </button>

        <p v-if="behError" class="error">{{ behError }}</p>
        <p v-if="students.length === 0" class="muted" style="margin-top:10px;">
          No students found (only students with a room are shown).
        </p>
      </div>
    </div>

    <p class="error" v-if="error">{{ error }}</p>
  </div>
</template>

<script>
import api, { setAuthToken } from "../api";

export default {
  name: "Dashboard",

  data() {
    return {
      // user's basics info are saved in localStorage after login
      user: null,

      // full user profile returned by backend (/api/me)
      me: null,

      // // lists used in user's interface
      availableRooms: [],
      interventions: [],

      // Error message
      error: "",

      newType: "cleaning",
      newDesc: "",

      // student room request confirmation
      showRoomConfirm: false,
      selectedRoom: null,
      confirmingRoom: false,
      roomConfirmError: "",

      editProfile: false,
      editEmail: "",
      editPhone: "",
      savingProfile: false,
      profileError: "",

      loadingPay: false,
      payError: "",

      // receptionist students dropdown
      students: [],
      selectedStudentId: "", // IMPORTANT: keep string
      loadingStudents: false,

      // behavior inputs
      behDeduct: 1,
      behDesc: "",
      behError: "",
      loadingBehavior: false,
    };
  },

  methods: {
    // Logout
    logout() {
      // Remove saved login data
      localStorage.removeItem("token");

      localStorage.removeItem("user");
      // Remove token from API requests
      setAuthToken(null);

      // Go back to login page
      this.$router.push("/login");
    },

    // Load current user profile
    async loadMe() {
      const { data } = await api.get("/api/me");
      this.me = data;
    },

    // Load available rooms 
    async loadAvailableRooms() {
      const { data } = await api.get("/api/rooms/available");
      this.availableRooms = data;
    },

    async requestRoom(roomId) {
      await api.post("/api/rooms/request", { roomId });
      await this.loadMe();
    },

    openRoomConfirm(room) {
      this.roomConfirmError = "";
      this.selectedRoom = room;
      this.showRoomConfirm = true;
    },

    closeRoomConfirm() {
      this.showRoomConfirm = false;
      this.selectedRoom = null;
      this.confirmingRoom = false;
      this.roomConfirmError = "";
    },

    // Confirm button inside the modal
    async confirmRoomRequest() {
      if (!this.selectedRoom?.id) return;
      this.confirmingRoom = true;
      this.roomConfirmError = "";
      try {
        await this.requestRoom(this.selectedRoom.id);
        this.closeRoomConfirm();

        // Force disconnection
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuthToken(null);

        // Redirect to login
        await this.$router.push("/login");
      } catch (e) {
        this.roomConfirmError = e?.response?.data?.error || e.message || "Request failed";
      } finally {
        this.confirmingRoom = false;
      }
    },

    async loadInterventions() {
      const { data } = await api.get("/api/interventions");
      let list = data;

      if (this.user?.role === "service") {
        list = list.filter(i => ["pending", "accepted"].includes(i.status));
      }

      this.interventions = list;
    },

    async createIntervention() {
      const payload = { type: this.newType, description: this.newDesc };

      await api.post("/api/interventions", payload);
      this.newDesc = "";
      await this.loadInterventions();
    },

    async setStatus(id, status) {
      await api.post(`/api/interventions/${id}/status`, { status });
      await this.loadInterventions();
    },

    startEdit() {
      this.profileError = "";
      this.editProfile = true;
      this.editEmail = this.me?.email ?? "";
      this.editPhone = this.me?.phone ?? "";
    },

    cancelEdit() {
      this.editProfile = false;
      this.profileError = "";
    },

    async saveProfile() {
      this.savingProfile = true;
      this.profileError = "";
      try {
        const { data } = await api.patch("/api/me", { email: this.editEmail, phone: this.editPhone });
        this.me = data;
        this.editProfile = false;
      } catch (e) {
        this.profileError = e?.response?.data?.error || e.message || "Update failed";
      } finally {
        this.savingProfile = false;
      }
    },

    async payRoom() {
      this.loadingPay = true;
      this.payError = "";
      try {
        await api.post("/api/me/pay");
        await this.loadMe();
      } catch (e) {
        this.payError = e?.response?.data?.error || e.message || "Payment failed";
      } finally {
        this.loadingPay = false;
      }
    },

    // Receptionist load students list for behavior dropdown
    async loadStudents() {
      this.loadingStudents = true;
      this.behError = "";
      try {
        const { data } = await api.get("/api/students");
        this.students = data;

        // If current selection is missing or not in the list, select the first student
        const exists = this.students.some(s => String(s.id) === String(this.selectedStudentId));
        if (!exists) {
          this.selectedStudentId = "";
        }
      } catch (e) {
        this.behError = e?.response?.data?.error || e.message || "Failed to load students";
      } finally {
        this.loadingStudents = false;
      }
    },

    // Receptionist record behavior (deduct points)
    async recordBehavior() {
      this.behError = "";

      if (!this.selectedStudentId) {
        this.behError = "Please select a student";
        return;
      }
      if (!this.behDesc.trim()) {
        this.behError = "Please enter a description";
        return;
      }
      if (!Number.isFinite(Number(this.behDeduct)) || Number(this.behDeduct) <= 0) {
        this.behError = "Points must be a positive number";
        return;
      }

      this.loadingBehavior = true;
      try {
        await api.post("/api/behavior", {
          studentId: Number(this.selectedStudentId),
          description: this.behDesc.trim(),
          points: Number(this.behDeduct)
        });

        // keep the selected student (do NOT reset selectedStudentId)
        this.behDesc = "";
        this.behDeduct = 1;
      } catch (e) {
        this.behError = e?.response?.data?.error || e.message || "Record failed";
      } finally {
        this.loadingBehavior = false;
      }
    },

    // Main function when dashboard loads
    async init() {

      // Check if token exists (if not, go login)
      const token = localStorage.getItem("token");
      if (!token) return this.$router.push("/login");

      // Attach token to API requests
      setAuthToken(token);

      // Read basic user info from localStorage
      this.user = JSON.parse(localStorage.getItem("user") || "null");
      if (this.user?.role === "admin") return this.$router.push("/admin");

      try {
        // Load data needed for the dashboard
        await this.loadMe();

        // If admin, redirect to admin page
        if (this.user?.role === "student") {
          if (!this.me?.room_id && !this.me?.requested_room_id) await this.loadAvailableRooms();
        }

        if (this.user?.role === "receptionist") {
          await this.loadStudents();
        }

        await this.loadInterventions();
      } catch (e) {
        this.error = e?.response?.data?.error || e.message;
      }
    },
  },

  mounted() {
    this.init();
  },
};
</script>
