import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Sora } from "next/font/google";

import Header from "@/components/Header";
import { authService } from "@/services/authService";

const sora = Sora({ subsets: ["latin"] });

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState<ContactPayload>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    const user = authService.getUser();
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.username || "",
        email: user.email || "",
      }));
    }

    setLoading(false);
  }, [router]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setErrorMessage("Please fill all fields before sending your message.");
      return;
    }

    const token = authService.getToken();
    if (!token) {
      router.push("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("https://django-restframework-products-backend.onrender.com/api/contacts/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit contact form");
      }

      setSuccessMessage("Your message was sent successfully.");
      setFormData((prev) => ({
        ...prev,
        subject: "",
        message: "",
      }));
    } catch (error) {
      console.error("Error sending contact message:", error);
      setErrorMessage("Could not send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#dad6c7] bg-white/90 p-8 text-center shadow-[0_16px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d6ccb2] border-t-[#486f3d]" />
          <p className={`mt-5 text-xl font-semibold text-slate-800 ${sora.className}`}>Loading contact page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f7f4ec] text-slate-900">
      <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-[#f4d8a8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-56 h-72 w-72 rounded-full bg-[#b4d2ad]/40 blur-3xl" />

      <Header />

      <main className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="mb-7 overflow-hidden rounded-3xl border border-[#cfc8b0] bg-gradient-to-br from-[#f5e7cb] via-[#f8f3e7] to-[#dfead8] p-6 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.4)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">Contact</p>
          <h1 className={`mt-3 text-4xl leading-tight text-slate-900 sm:text-5xl ${sora.className}`}>
            Send Us A Message
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700 sm:text-base">
            Share your question, feedback, or issue and our team will get back to you as soon as possible.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[#d8d3c3] bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur sm:p-7"
          >
            <h2 className={`text-2xl font-semibold text-slate-900 ${sora.className}`}>Contact Form</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#345a2a]"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#345a2a]"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="subject" className="text-sm font-semibold text-slate-700">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#345a2a]"
                placeholder="Message subject"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#345a2a]"
                placeholder="Write your message here..."
              />
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send message"}
            </button>
          </form>

          <aside className="rounded-3xl border border-[#d8d3c3] bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur sm:p-7">
            <h2 className={`text-2xl font-semibold text-slate-900 ${sora.className}`}>Need Quick Help?</h2>
            <p className="mt-3 text-sm text-slate-700">
              For order status, wishlist, or cart questions, include your username and short issue details for faster support.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Response Time</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Usually within 24 hours</p>
              </div>
              <div className="rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Support Scope</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Orders, account and store support</p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}