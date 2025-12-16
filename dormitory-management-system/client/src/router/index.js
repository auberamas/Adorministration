import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import AdminDashboardView from "../views/AdminDashboardView.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/login" },
    { path: "/login", component: LoginView },
    { path: "/admin", name: "admin", component: AdminDashboardView },
    { path: "/dashboard", component: DashboardView }
  ]
});
