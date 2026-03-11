import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Sora } from "next/font/google";

import Header from "@/components/Header";
import { authService } from "@/services/authService";

const sora = Sora({ subsets: ["latin"] });
const CREATE_ORDER_API_URL = "https://django-restframework-products-backend.onrender.com/api/orders/create-from-cart/";

type PaymentMethod = "card" | "upi" | "cod";

type CheckoutFormData = {
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CheckoutFormData>({
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/auth");
    }
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const createOrder = async () => {
      const token = authService.getToken();

      if (!token) {
        router.push("/auth");
        return;
      }

      const requiredValues = [
        formData.address_line1,
        formData.city,
        formData.state,
        formData.postal_code,
        formData.country,
      ];

      if (requiredValues.some((value) => !value.trim())) {
        setErrorMessage("Please fill all required address fields.");
        return;
      }

      setErrorMessage("");
      setIsSubmitting(true);

      try {
        const response = await fetch(CREATE_ORDER_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address_line1: formData.address_line1.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            postal_code: formData.postal_code.trim(),
            country: formData.country.trim(),
          }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Failed to create order (${response.status})`);
        }

        window.dispatchEvent(new Event("cart-updated"));
        window.alert(`Order confirmed with ${paymentMethod.toUpperCase()} payment.`);
        router.push("/orders");
      } catch (error) {
        console.error("Error creating order:", error);
        setErrorMessage("Could not place order. Please verify address details and try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    event.preventDefault();
    createOrder();
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-[#cfc8b0] bg-gradient-to-br from-[#f5e7cb] via-[#f8f3e7] to-[#dfead8] p-6 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.4)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Checkout</p>
          <h1 className={`mt-2 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl ${sora.className}`}>
            Address and Payment
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-700 sm:text-base">
            Add your delivery address and choose your preferred payment method.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-[#d8d3c3] bg-white/90 p-5 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur sm:p-6"
        >
          <label htmlFor="address_line1" className="block text-sm font-semibold text-slate-800">
            Address Line 1
          </label>
          <input
            id="address_line1"
            type="text"
            value={formData.address_line1}
            onChange={(event) => handleInputChange("address_line1", event.target.value)}
            placeholder="House / Street"
            className="mt-2 w-full rounded-xl border border-[#cdc5ad] bg-[#fcfbf6] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#6d8f56]"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-slate-800">
                City
              </label>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(event) => handleInputChange("city", event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#cdc5ad] bg-[#fcfbf6] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#6d8f56]"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-semibold text-slate-800">
                State
              </label>
              <input
                id="state"
                type="text"
                value={formData.state}
                onChange={(event) => handleInputChange("state", event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#cdc5ad] bg-[#fcfbf6] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#6d8f56]"
              />
            </div>

            <div>
              <label htmlFor="postal_code" className="block text-sm font-semibold text-slate-800">
                Postal Code
              </label>
              <input
                id="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={(event) => handleInputChange("postal_code", event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#cdc5ad] bg-[#fcfbf6] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#6d8f56]"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-semibold text-slate-800">
                Country
              </label>
              <input
                id="country"
                type="text"
                value={formData.country}
                onChange={(event) => handleInputChange("country", event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#cdc5ad] bg-[#fcfbf6] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#6d8f56]"
              />
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-800">Payment Option</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
             

              

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#d8d3c3] bg-[#fcfbf6] p-3 text-sm text-slate-800">
                <input
                  type="radio"
                  name="payment-method"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                Cash on Delivery
              </label>
            </div>
          </fieldset>

          {errorMessage && (
            <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-[0_12px_28px_-16px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Placing Order..." : "Confirm Order"}
          </button>
        </form>
      </main>
    </div>
  );
}
