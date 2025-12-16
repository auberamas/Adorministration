<template>
  <div class="page">
    <div class="topbar">
      <h1 class="title">Dashboard</h1>

      <div class="topbarActions">
        <span class="pill">{{ user?.role }}</span>
        <button class="btn" @click="logout">Logout</button>
      </div>
    </div>

    <div class="grid">
      <!-- STUDENT: PAYMENT REQUIRED -->
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

      <!-- MY PROFILE (NOT for receptionist) -->
      <div class="card" v-if="user?.role !== 'receptionist'">
        <div class="cardHeader">
          <h2>My profile</h2>
          <button class="btn" @click="loadMe">Refresh</button>
        </div>

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
              placeholder="10 digits"
              inputmode="numeric"
              maxlength="10"
              @input="editPhone = editPhone.replace(/\\D/g,'').slice(0,10)"
            />
          </div>

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

      <!-- STUDENT: ROOMS -->
      <div class="card" v-if="user?.role==='student' && !me?.room_id && !me?.requested_room_id">
        <h2>Choose a room</h2>
        <p class="muted">You currently don’t have a room. Click an available room to request it.</p>

        <button class="btn" @click="loadAvailableRooms">Refresh rooms</button>

        <ul class="list">
          <li
            v-for="r in availableRooms"
            :key="r.id"
            class="clickRow"
            @click="requestRoom(r.id)"
            title="Click to request this room"
          >
            {{ r.building ? r.building + " - " : "" }}{{ r.room_number }}
          </li>
        </ul>
      </div>

      <!-- STUDENT: PENDING REQUEST -->
      <div class="card" v-if="user?.role==='student' && !me?.room_id && me?.requested_room_id">
        <h2>Room request pending</h2>
        <p class="muted">Your request is pending administrator decision.</p>
      </div>

      <!-- INTERVENTIONS -->
      <div class="card" v-if="user?.role !== 'admin'">
        <div class="cardHeader">
          <h2>Interventions</h2>
          <button class="btn" @click="loadInterventions">Refresh</button>
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
            <input v-else v-model="newRoomId" placeholder="roomId" />
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

      <!-- RECEPTIONIST: BEHAVIOR -->
      <div class="card" v-if="user?.role==='receptionist'">
        <h2>Record behavior</h2>

        <button class="btn" @click="loadStudents" :disabled="loadingStudents">
          {{ loadingStudents ? "..." : "Refresh students" }}
        </button>

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

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api, { setAuthToken } from "../api";

const router = useRouter();
const user = ref(null);
const me = ref(null);

const availableRooms = ref([]);
const interventions = ref([]);
const error = ref("");

const newType = ref("cleaning");
const newRoomId = ref("");
const newDesc = ref("");

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

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setAuthToken(null);
  router.push("/login");
}

async function loadMe() {
  const { data } = await api.get("/api/me");
  me.value = data;
}

async function loadAvailableRooms() {
  const { data } = await api.get("/api/rooms/available");
  availableRooms.value = data;
}

async function requestRoom(roomId) {
  await api.post("/api/rooms/request", { roomId });
  await loadMe();
}

async function loadInterventions() {
  const { data } = await api.get("/api/interventions");
  interventions.value = data;

  if (user.value?.role === "service") {
    interventions.value = interventions.value.filter(i => ["pending", "accepted"].includes(i.status));
  }
}

async function createIntervention() {
  const payload = { type: newType.value, description: newDesc.value };

  if (user.value?.role !== "student") {
    payload.roomId = Number(newRoomId.value);
  }

  await api.post("/api/interventions", payload);
  newDesc.value = "";
  await loadInterventions();
}

async function setStatus(id, status) {
  await api.post(`/api/interventions/${id}/status`, { status });
  await loadInterventions();
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

async function loadStudents() {
  loadingStudents.value = true;
  behError.value = "";
  try {
    const { data } = await api.get("/api/students");
    students.value = data;

    // If current selection is missing or not in the list, select the first student
    const exists = students.value.some(s => String(s.id) === String(selectedStudentId.value));
    if (!exists) {
      selectedStudentId.value = students.value.length ? String(students.value[0].id) : "";
    }
  } catch (e) {
    behError.value = e?.response?.data?.error || e.message || "Failed to load students";
  } finally {
    loadingStudents.value = false;
  }
}


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

async function init() {
  const token = localStorage.getItem("token");
  if (!token) return router.push("/login");
  setAuthToken(token);

  user.value = JSON.parse(localStorage.getItem("user") || "null");
  if (user.value?.role === "admin") return router.push("/admin");

  try {
    await loadMe();

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

onMounted(init);
</script>
<!-- 
<style scoped>
/* CONTAIN EVERYTHING */
.wrap {
  min-height: 100vh;
  padding: 24px;
  background: #0b1220;
  color: #eaf0ff;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

* { box-sizing: border-box; }

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.topbarActions { display:flex; align-items:center; gap:10px; }

.title { font-size: 34px; margin: 0; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.card {
  background: rgba(20, 30, 60, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 16px;
  overflow: hidden; /* prevents overflow visuals */
}

.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 10px;
}

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
}

.btn {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.btn:disabled { opacity: 0.6; cursor: not-allowed; }

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

input, select, textarea {
  width: 100%;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #263a62;
  background: #0b152b;
  color: #e7eefc;
  box-sizing: border-box;
}

textarea { min-height: 90px; resize: vertical; }

.row { display:flex; gap:10px; align-items: stretch; }
.row > * { flex: 1; }

.list { padding-left: 18px; margin: 10px 0 0; }
.list li { margin: 8px 0; }

.muted { opacity: 0.75; }

.profile { margin-top: 8px; display:flex; flex-direction:column; gap:10px; }
.kv {
  display:flex;
  justify-content:space-between;
  gap:14px;
  background:#0b152b;
  border:1px solid #263a62;
  padding:10px 12px;
  border-radius:12px;
}
.k { opacity: .75; }
.v { font-weight: 600; }
.actions { display:flex; gap:10px; margin-top: 10px; flex-wrap: wrap; }

.box { margin-top: 10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08); }

.clickRow { cursor:pointer; padding:6px 6px; border-radius:10px; }
.clickRow:hover { background: rgba(255,255,255,0.06); }

.error { margin-top: 12px; color: #ff7b7b; }
</style> -->
