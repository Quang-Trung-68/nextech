import { CardElement } from '@stripe/react-stripe-js';

export function StripeCardInput({ error }) {
  // Config style for Stripe matches our Tailwind input styling
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1d1d1f',    // text-apple-dark
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#86868b',  // text-muted-foreground
        },
      },
      invalid: {
        color: '#ef4444',    // text-red-500
      },
    },
    hidePostalCode: true,
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-apple-blue shadow-[0_4px_14px_0_rgba(0,102,204,0.15)] mt-4 animate-in slide-in-from-top-2">
      <label className="text-sm font-semibold text-apple-dark block mb-3">
        Nhập thông tin thẻ <span className="text-destructive">*</span>
      </label>
      <div className={`p-4 border rounded-xl bg-muted/20 ${error ? 'border-destructive' : 'border-[#d2d2d7]'}`}>
        <CardElement options={cardElementOptions} />
      </div>
      {error && (
        <p className="text-sm font-medium text-destructive mt-3 flex items-center">
           <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-2"></span> {error}
        </p>
      )}
    </div>
  );
}
