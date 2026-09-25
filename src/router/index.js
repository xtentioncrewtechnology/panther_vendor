import { createRouter, createWebHistory } from "vue-router";
import routes from "./routes";
import authToken from "@/common/authToken";

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const { accessToken } = authToken.getToken();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth === true);
  const isAuthPage = to.name === "Login" || to.name === "DevLogin";

  if (requiresAuth && !accessToken) {
    return {
      name: "Login",
      query: { redirect: to.fullPath },
    };
  }

  if (isAuthPage && accessToken) {
    return { path: "/vendor/transfers" };
  }

  return true;
});

export default router;
