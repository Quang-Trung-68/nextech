import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // { id, name, email, role, isEmailVerified }
      isAuthenticated: false,

      setAuth: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      /** Update isEmailVerified flag in-place after successful verification */
      updateEmailVerified: (verified = true) =>
        set((state) => ({
          user: state.user ? { ...state.user, isEmailVerified: verified } : state.user,
        })),
    }),
    {
      name: 'auth-storage',
      // Chỉ lưu trữ user và isAuthenticated vào localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
