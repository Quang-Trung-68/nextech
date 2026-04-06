import { useState, createElement } from 'react';
import { Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const contactInfo = [
  {
    icon: Phone,
    label: 'Hotline',
    value: '1800 1234 (Miễn phí · 8:00–22:00)',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'support@nextech.vn',
  },
  {
    icon: Clock,
    label: 'Giờ làm việc',
    value: 'Thứ 2 – Thứ 7 · 8:00 – 22:00',
  },
  {
    icon: MessageCircle,
    label: 'Phản hồi',
    value: 'Trong vòng 2 giờ làm việc',
  },
];

const subjectOptions = [
  { value: 'order', label: 'Đơn hàng' },
  { value: 'payment', label: 'Thanh toán' },
  { value: 'product', label: 'Sản phẩm' },
  { value: 'other', label: 'Khác' },
];

export default function SupportContact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Tin nhắn của bạn đã được gửi! Chúng tôi sẽ phản hồi trong vòng 2 giờ.', {
      duration: 5000,
    });
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <section id="contact" className="w-full py-20 bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6">
        {/* Header */}
        <h2 className="text-[36px] font-bold text-[#1d1d1f] text-center mb-3">
          Vẫn cần hỗ trợ?
        </h2>
        <p className="text-[#6e6e73] text-center mb-12">
          Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn trong giờ làm việc
        </p>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {contactInfo.map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex items-start gap-4 bg-white rounded-2xl p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] flex items-center justify-center shrink-0">
                {createElement(icon, { size: 18, className: 'text-[#0071e3]' })}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] text-[#6e6e73] font-medium mb-0.5">
                  {label}
                </span>
                <span className="text-[15px] font-semibold text-[#1d1d1f] leading-snug">
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#e5e5ea]">
          <h3 className="text-[20px] font-semibold text-[#1d1d1f] mb-6">
            Gửi tin nhắn cho chúng tôi
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#1d1d1f]" htmlFor="support-name">
                Họ và tên
              </label>
              <input
                id="support-name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="h-12 w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 text-base text-[#1d1d1f] outline-none placeholder:text-[#86868b] transition-all focus:border-[#0071e3] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)]"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#1d1d1f]" htmlFor="support-email">
                Email
              </label>
              <input
                id="support-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="h-12 w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 text-base text-[#1d1d1f] outline-none placeholder:text-[#86868b] transition-all focus:border-[#0071e3] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)]"
              />
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#1d1d1f]" htmlFor="support-subject">
                Chủ đề
              </label>
              <Select
                value={form.subject || undefined}
                onValueChange={(val) => setForm((prev) => ({ ...prev, subject: val }))}
              >
                <SelectTrigger
                  id="support-subject"
                  className="!h-12 w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 text-base text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)]"
                >
                  <SelectValue placeholder="Chọn chủ đề...">
                    {form.subject
                      ? subjectOptions.find((o) => o.value === form.subject)?.label
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-[#d2d2d7] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1.5 min-w-[160px]">
                  {subjectOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="py-3 px-3 text-base font-medium cursor-pointer rounded-xl hover:bg-slate-50">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#1d1d1f]" htmlFor="support-message">
                Nội dung
              </label>
              <Textarea
                id="support-message"
                name="message"
                required
                rows={4}
                value={form.message}
                onChange={handleChange}
                placeholder="Mô tả vấn đề bạn đang gặp phải..."
                className="w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-3 text-base text-[#1d1d1f] placeholder:text-[#86868b] transition-all focus-visible:border-[#0071e3] focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_rgba(0,113,227,0.12)] focus-visible:ring-0 resize-none min-h-[108px]"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-12 bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006ad4] text-white font-medium text-[15px] rounded-xl transition-colors duration-150 mt-2"
            >
              Gửi tin nhắn
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
