const authToken = {
  setToken: (accessToken = null) => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }
  },
  getToken: () => {
    return {
      accessToken: localStorage.getItem("accessToken"),
    };
  },
  removeToken: () => {
    // clear local store
    localStorage.clear();
  },
};
export default authToken;
