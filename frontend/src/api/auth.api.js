import { axiosPublic } from '@/lib/axios';

export const forgotPassword = (email) =>
  axiosPublic.post('/auth/forgot-password', { email });

export const resetPassword = (token, newPassword) =>
  axiosPublic.post('/auth/reset-password', { token, newPassword });
