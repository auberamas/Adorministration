import { createRouter, createWebHistory } from "vue-router";
import Login from "../components/Login.vue";
import Dashboard from "../components/Dashboard.vue";
import AdminDashboard from "../components/AdminDashboard.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/login" },
    { path: "/login", component: Login },
    { path: "/admin", name: "admin", component: AdminDashboard },
    { path: "/dashboard", component: Dashboard }
  ]
});
