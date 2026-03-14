import { create } from 'zustand'

const useAuthStore = create((set) => ({
  accessToken: null,
  user: null, // { id, name, email, role }
  isAuthenticated: false,

  setAuth: (accessToken, user) => set({
    accessToken,
    user,
    isAuthenticated: true
  }),

  clearAuth: () => set({
    accessToken: null,
    user: null,
    isAuthenticated: false
  }),

  updateToken: (accessToken) => set({
    accessToken
  })
}))

export default useAuthStore;
