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
        <button class="btnBlue" @click="payRoom" :disabled="loadingPay">
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
            <button class="btnBlue" v-else @click="saveProfile" :disabled="savingProfile">
              {{ savingProfile ? "..." : "Save" }}
            </button>
            <button class="btnRed" v-if="editProfile" @click="cancelEdit">Cancel</button>
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
            <button class="btnBlue" @click="confirmRoomRequest" :disabled="confirmingRoom">
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
      <div class="card intervention-block" v-if="user?.role !== 'admin'">
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
          <button class="btnBlue" @click="createIntervention">Create</button>
        </div>

        <ul class="list">
          <li v-for="it in interventions" :key="it.id">
            <div>
              <span>
                #{{ it.id }} ({{ it.room_id ? `room ${it.room_id}` : 'reception' }}) {{ it.type }} - {{ it.status }}
              </span>

                <template v-if="user?.role === 'service'">

                  <!-- DESCRIPTION TOGGLE -->
                  <button class="toggle service-btn" @click="toggle(it.id)"> {{ expanded === it.id ? '▲' : '▼' }} </button>

                  <!-- PENDING -->
                  <button class="btnBlue service-btn" v-if="it.status === 'pending'" @click="setStatus(it.id, 'accepted')"> Accept </button>
                  <button class="btnRed service-btn" v-if="it.status === 'pending'" @click="setStatus(it.id, 'rejected')" > Reject </button>
              
                  <!-- ACCEPTED -->
                  <button class="btnBlue service-btn" v-if="it.status === 'accepted'" @click="setStatus(it.id, 'completed')"> Complete </button>

                </template>
            </div>

            <!-- DESCRIPTION -->
            <transition name="slide">
              <div v-if="expanded === it.id" class="description">
                <strong>Description:</strong>
                <p>{{ it.description }}</p>
              </div>
            </transition>

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

        <button class="btnBlue service-btn" @click="recordBehavior" :disabled="loadingBehavior">
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

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api, { setAuthToken } from "../api";

const router = useRouter();

// user's basics info are saved in localStorage after login
const user = ref(null);

// full user profile returned by backend (/api/me)
const me = ref(null);

// // lists used in user's interface
const availableRooms = ref([]);
const interventions = ref([]);

// Error message
const error = ref("");

const newType = ref("cleaning");
const newDesc = ref("");
const expanded = ref(null)

// student room request confirmation
const showRoomConfirm = ref(false);
const selectedRoom = ref(null);
const confirmingRoom = ref(false);
const roomConfirmError = ref("");

const editProfile = ref(false);
const editEmail = ref("");
const editPhone = ref("");
const savingProfile = ref(false);
const profileError = ref("");

const loadingPay = ref(false);
const payError = ref("");

// receptionist students dropdown
const students = ref([]);
const selectedStudentId = ref(""); // IMPORTANT: keep string
const loadingStudents = ref(false);

// behavior inputs
const behDeduct = ref(1);
const behDesc = ref("");
const behError = ref("");
const loadingBehavior = ref(false);

// Logout
function logout() {
  // Remove saved login data
  localStorage.removeItem("token");

  localStorage.removeItem("user");
  // Remove token from API requests
  setAuthToken(null);

  // Go back to login page
  router.push("/login");
}

// Load current user profile
async function loadMe() {
  const { data } = await api.get("/api/me");
  me.value = data;
}

// Load available rooms 
async function loadAvailableRooms() {
  const { data } = await api.get("/api/rooms/available");
  availableRooms.value = data;
}

async function requestRoom(roomId) {
  await api.post("/api/rooms/request", { roomId });
  await loadMe();
}

function openRoomConfirm(room) {
  roomConfirmError.value = "";
  selectedRoom.value = room;
  showRoomConfirm.value = true;
}

function closeRoomConfirm() {
  showRoomConfirm.value = false;
  selectedRoom.value = null;
  confirmingRoom.value = false;
  roomConfirmError.value = "";
}

// Confirm button inside the modal
async function confirmRoomRequest() {
  if (!selectedRoom.value?.id) return;
  confirmingRoom.value = true;
  roomConfirmError.value = "";
  try {
    await requestRoom(selectedRoom.value.id);
    closeRoomConfirm();

    // Force disconnection
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);

    // Redirect to login
    await router.push("/login");
  } catch (e) {
    roomConfirmError.value = e?.response?.data?.error || e.message || "Request failed";
  } finally {
    confirmingRoom.value = false;
  }
}

async function loadInterventions() {
  const { data } = await api.get("/api/interventions");
  interventions.value = data;

  // sort newest → oldest
  let sorted = [...data].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  // SERVICE: see only pending and accepted
  if (user.value?.role === "service"){
    { interventions.value = interventions.value.filter(i => ["pending", "accepted"].includes(i.status));}
    return
  }

  // STUDENT / RECEPTION: see only last 7
  interventions.value = sorted.slice(0, 7)
}



async function createIntervention() {
  const payload = { type: newType.value, description: newDesc.value };

  await api.post("/api/interventions", payload);
  newDesc.value = "";
  await loadInterventions();
}

async function setStatus(id, status) {
  await api.post(`/api/interventions/${id}/status`, { status });
  await loadInterventions();
}

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}



function startEdit() {
  profileError.value = "";
  editProfile.value = true;
  editEmail.value = me.value?.email ?? "";
  editPhone.value = me.value?.phone ?? "";
}

function cancelEdit() {
  editProfile.value = false;
  profileError.value = "";
}

async function saveProfile() {
  savingProfile.value = true;
  profileError.value = "";
  try {
    const { data } = await api.patch("/api/me", { email: editEmail.value, phone: editPhone.value });
    me.value = data;
    editProfile.value = false;
  } catch (e) {
    profileError.value = e?.response?.data?.error || e.message || "Update failed";
  } finally {
    savingProfile.value = false;
  }
}

async function payRoom() {
  loadingPay.value = true;
  payError.value = "";
  try {
    await api.post("/api/me/pay");
    await loadMe();
  } catch (e) {
    payError.value = e?.response?.data?.error || e.message || "Payment failed";
  } finally {
    loadingPay.value = false;
  }
}

// Receptionist load students list for behavior dropdown
async function loadStudents() {
  loadingStudents.value = true;
  behError.value = "";
  try {
    const { data } = await api.get("/api/students");
    students.value = data;

    // If current selection is missing or not in the list, select the first student
    const exists = students.value.some(s => String(s.id) === String(selectedStudentId.value));
    if (!exists) {
      selectedStudentId.value = "";
    }
  } catch (e) {
    behError.value = e?.response?.data?.error || e.message || "Failed to load students";
  } finally {
    loadingStudents.value = false;
  }
}

// Receptionist record behavior (deduct points)
async function recordBehavior() {
  behError.value = "";

  if (!selectedStudentId.value) {
    behError.value = "Please select a student";
    return;
  }
  if (!behDesc.value.trim()) {
    behError.value = "Please enter a description";
    return;
  }
  if (!Number.isFinite(Number(behDeduct.value)) || Number(behDeduct.value) <= 0) {
    behError.value = "Points must be a positive number";
    return;
  }

  loadingBehavior.value = true;
  try {
    await api.post("/api/behavior", {
      studentId: Number(selectedStudentId.value),
      description: behDesc.value.trim(),
      points: Number(behDeduct.value)
    });

    // keep the selected student (do NOT reset selectedStudentId)
    behDesc.value = "";
    behDeduct.value = 1;
  } catch (e) {
    behError.value = e?.response?.data?.error || e.message || "Record failed";
  } finally {
    loadingBehavior.value = false;
  }
}

// Main function when dashboard loads
async function init() {

  // Check if token exists (if not, go login)
  const token = localStorage.getItem("token");
  if (!token) return router.push("/login");

  // Attach token to API requests
  setAuthToken(token);

  // Read basic user info from localStorage
  user.value = JSON.parse(localStorage.getItem("user") || "null");
  if (user.value?.role === "admin") return router.push("/admin");

  try {
    // Load data needed for the dashboard
    await loadMe();

    // If admin, redirect to admin page
    if (user.value?.role === "student") {
      if (!me.value?.room_id && !me.value?.requested_room_id) await loadAvailableRooms();
    }

    if (user.value?.role === "receptionist") {
      await loadStudents();
    }

    await loadInterventions();
  } catch (e) {
    error.value = e?.response?.data?.error || e.message;
  }
}

// Run init() automatically when the page opens
onMounted(init);
</script>