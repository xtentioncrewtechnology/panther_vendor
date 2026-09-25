import DefaultLayout from "@/layouts/default.vue";
import AuthLayout from "@/layouts/auth.vue";

const routes = [
  {
    path: "/",
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/pages/dashboard/Dashboard.vue"),
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/pages/dashboard/Profile.vue"),
      },
      {
        path: "vendor/transfers",
        name: "VendorTransfers",
        component: () => import("@/pages/dashboard/VendorTransfers.vue"),
      },
      {
        path: "",
        redirect: "/vendor/transfers",
      },
    ],
  },
  {
    path: "/auth",
    component: AuthLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: "login",
        name: "Login",
        component: () => import("@/pages/auth/Login.vue"),
      },
      {
        path: "dev-login",
        name: "DevLogin",
        component: () => import("@/pages/auth/dev-login.vue"),
      },
    ],
  },
];

export default routes;
