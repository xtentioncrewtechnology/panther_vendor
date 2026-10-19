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
        meta: {
          title: "Vendor Queue",
          section: "Operations",
        },
      },
      {
        path: "vendor/wallet-transactions",
        name: "VendorWalletTransactions",
        component: () => import("@/pages/vendor-wallets/transactions.vue"),
        meta: {
          title: "Wallet Transactions",
          section: "Finance",
        },
      },
      {
        path: "vendor/wallets/transactions",
        redirect: "/vendor/wallet-transactions",
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
