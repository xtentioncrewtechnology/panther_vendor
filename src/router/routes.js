import DefaultLayout from "@/layouts/default.vue";
import AuthLayout from "@/layouts/auth.vue";

const routes = [
  {
    path: "/",
    component: DefaultLayout,
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/pages/dashboard/Dashboard.vue"),
      },
      {
        path: "vendor/transfers",
        name: "VendorTransfers",
        component: () => import("@/pages/dashboard/VendorTransfers.vue"),
      },
      {
        path: "",
        redirect: "/dashboard",
      },
    ],
  },
  {
    path: "/auth",
    component: AuthLayout,
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
