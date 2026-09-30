import DefaultLayout from "@/layouts/default.vue";
import AuthLayout from "@/layouts/auth.vue";

const routes = [
  {
    path: "/",
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [

      {
        path: "profile",
        name: "Profile",
        component: () => import("@/pages/profile/index.vue"),
      },
      {
        path: "vendor/transfers",
        name: "VendorTransfers",
        component: () => import("@/pages/vendor-transfers/index.vue"),
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
