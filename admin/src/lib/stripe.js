import { loadStripe } from '@stripe/stripe-js';

// Gọi 1 lần duy nhất bên ngoài component tree để không re-initialize nhiều lần
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
