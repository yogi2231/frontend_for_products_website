import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Sora } from "next/font/google";

import Header from "@/components/Header";
import { authService } from "@/services/authService";
import { API_BASE_URL } from "@/services/backend";

const sora = Sora({ subsets: ["latin"] });
const CREATE_ORDER_API_URL = `${API_BASE_URL}/orders/create-from-cart/`;

type PaymentMethod = "card" | "upi" | "cod";

type CheckoutFormData = {
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type SavedAddress = CheckoutFormData & {
  id: number;
};

const ADDRESSES_API_URL = `${API_BASE_URL}/addresses/`;

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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isCreatingNewAddress, setIsCreatingNewAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/auth");
    }
  }, [router]);

  useEffect(() => {
    const loadSavedAddresses = async () => {
      const token = authService.getToken();

      if (!token) {
        return;
      }

      setIsLoadingAddresses(true);

      try {
        const response = await fetch(ADDRESSES_API_URL, {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load addresses (${response.status})`);
        }

        const data: SavedAddress[] = await response.json();
        const addresses = Array.isArray(data) ? data : [];
        setSavedAddresses(addresses);

        if (addresses.length > 0) {
          const firstAddress = addresses[0];
          setSelectedAddressId(firstAddress.id);
          setFormData({
            address_line1: firstAddress.address_line1,
            city: firstAddress.city,
            state: firstAddress.state,
            postal_code: firstAddress.postal_code,
            country: firstAddress.country,
          });
        }
      } catch (error) {
        console.error("Error loading addresses:", error);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    loadSavedAddresses();
  }, []);

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
    setSelectedAddressId(null);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressSelection = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setShowEditForm(false);
    setIsCreatingNewAddress(false);
    setFormData({
      address_line1: address.address_line1,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
    });
  };

  const handleCreateNewAddress = () => {
    setIsCreatingNewAddress(true);
    setSelectedAddressId(null);
    setShowEditForm(false);
    setFormData({
      address_line1: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
    });
  };

  const handleSaveNewAddress = async () => {
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
    setIsSavingAddress(true);

    try {
      const response = await fetch(ADDRESSES_API_URL, {
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
        throw new Error(message || `Failed to save address (${response.status})`);
      }

      const newAddress: SavedAddress = await response.json();
      setSavedAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
      setIsCreatingNewAddress(false);
      setFormData({
        address_line1: newAddress.address_line1,
        city: newAddress.city,
        state: newAddress.state,
        postal_code: newAddress.postal_code,
        country: newAddress.country,
      });
    } catch (error) {
      console.error("Error saving address:", error);
      setErrorMessage("Could not save address. Please try again.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-3xl border border-[#cfc8b0]/40 bg-gradient-to-br from-[#faf8f3] via-[#f8f3e7] to-[#e4efdb] p-8 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.3)] sm:p-10">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6d8f56]">Secure Checkout</p>
            <h1 className={`text-4xl font-bold leading-tight text-slate-900 sm:text-5xl ${sora.className}`}>
              Delivery & <span className="text-[#6d8f56]">Payment</span>
            </h1>
            <p className="pt-2 text-base text-slate-600">
              Select an address or create a new one, then confirm your order
            </p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Saved Addresses Section */}
          <section className="overflow-hidden rounded-3xl border border-[#d8d3c3]/60 bg-white shadow-[0_16px_50px_-25px_rgba(15,23,42,0.2)]">
            <div className="border-b border-[#e5e7eb] bg-gradient-to-r from-[#f9fafb] to-[#fcfbf6] px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Your Addresses</h2>
                  <p className="mt-1 text-sm text-slate-600">Select where you want this delivered</p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewAddress}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#6d8f56] bg-[#6d8f56] px-4 py-2.5 font-semibold text-white shadow-[0_8px_20px_-10px_rgba(109,143,86,0.3)] transition hover:bg-[#5a7548] hover:shadow-[0_12px_24px_-12px_rgba(109,143,86,0.4)]"
                >
                  <span className="text-lg">+</span>
                  <span>Add New Address</span>
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {isLoadingAddresses ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#d8d3c3] border-t-[#6d8f56]"></div>
                    <p className="mt-3 text-sm text-slate-600">Loading your addresses...</p>
                  </div>
                </div>
              ) : savedAddresses.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[#cdc5ad] bg-[#faf7ef] py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-[#c8bfaa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="mt-4 text-base font-semibold text-slate-700">No saved addresses yet</p>
                  <p className="mt-2 text-sm text-slate-600">Create your first address to get started</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {savedAddresses.map((address) => (
                    <label
                      key={address.id}
                      className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all ${
                        selectedAddressId === address.id && !isCreatingNewAddress
                          ? "border-[#6d8f56] bg-[#f0f8f0] ring-2 ring-[#6d8f56]/20"
                          : "border-[#e5e7eb] bg-white hover:border-[#cdc5ad] hover:shadow-[0_12px_30px_-15px_rgba(15,23,42,0.15)]"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#6d8f56]/5 to-transparent opacity-0 transition group-hover:opacity-100" />
                      <div className="relative p-5">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="saved-address"
                            value={address.id}
                            checked={selectedAddressId === address.id && !isCreatingNewAddress}
                            onChange={() => handleAddressSelection(address)}
                            className="mt-1 h-5 w-5 cursor-pointer accent-[#6d8f56]"
                          />
                          <div className="flex-1 space-y-2">
                            <p className="font-bold text-slate-900">{address.address_line1}</p>
                            <p className="text-sm text-slate-600">
                              {address.city}, {address.state}
                            </p>
                            <p className="text-sm text-slate-500">
                              {address.postal_code}, {address.country}
                            </p>
                          </div>
                        </div>
                        {selectedAddressId === address.id && !isCreatingNewAddress && (
                          <div className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-[#6d8f56] p-1">
                            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Selected Address Confirmation */}
          {selectedAddressId && !showEditForm && !isCreatingNewAddress && (
            <section className="overflow-hidden rounded-3xl border-2 border-[#6d8f56]/30 bg-gradient-to-br from-[#f0f8f0] to-[#e8f0e4] shadow-[0_12px_40px_-20px_rgba(109,143,86,0.25)]">
              <div className="px-6 py-5 sm:px-8 sm:py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 inline-flex rounded-full bg-[#6d8f56] p-2">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-[#5a7548]">Address Selected</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{formData.address_line1}</p>
                      <p className="mt-2 space-y-1 text-sm text-slate-700">
                        <div>{formData.city}, {formData.state} {formData.postal_code}</div>
                        <div>{formData.country}</div>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditForm(true)}
                    className="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#6d8f56] bg-white px-4 py-2.5 font-medium text-[#6d8f56] transition hover:bg-[#f0f8f0] hover:shadow-sm"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Address Form */}
          {(showEditForm || !selectedAddressId || isCreatingNewAddress) && (
            <section className="overflow-hidden rounded-3xl border border-[#d8d3c3]/60 bg-white shadow-[0_16px_50px_-25px_rgba(15,23,42,0.2)]">
              <div className="border-b border-[#e5e7eb] bg-gradient-to-r from-[#f9fafb] to-[#fcfbf6] px-6 py-5 sm:px-8">
                <h2 className="text-lg font-semibold text-slate-900">
                  {isCreatingNewAddress ? "Create New Address" : selectedAddressId && showEditForm ? "Edit Delivery Address" : "Enter Delivery Address"}
                </h2>
              </div>
              
              <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <label htmlFor="address_line1" className="block text-sm font-semibold text-slate-800">
                    Street Address
                  </label>
                  <input
                    id="address_line1"
                    type="text"
                    value={formData.address_line1}
                    onChange={(event) => handleInputChange("address_line1", event.target.value)}
                    placeholder="House number, street name..."
                    className="mt-2 w-full rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6d8f56] focus:ring-2 focus:ring-[#6d8f56]/10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-slate-800">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(event) => handleInputChange("city", event.target.value)}
                      placeholder="Your city"
                      className="mt-2 w-full rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6d8f56] focus:ring-2 focus:ring-[#6d8f56]/10"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-slate-800">
                      State / Province
                    </label>
                    <input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={(event) => handleInputChange("state", event.target.value)}
                      placeholder="State or province"
                      className="mt-2 w-full rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6d8f56] focus:ring-2 focus:ring-[#6d8f56]/10"
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
                      placeholder="Postal or zip code"
                      className="mt-2 w-full rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6d8f56] focus:ring-2 focus:ring-[#6d8f56]/10"
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
                      placeholder="Your country"
                      className="mt-2 w-full rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6d8f56] focus:ring-2 focus:ring-[#6d8f56]/10"
                    />
                  </div>
                </div>

                <div className="flex gap-3 border-t border-[#e5e7eb] pt-6">
                  {isCreatingNewAddress && (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveNewAddress}
                        disabled={isSavingAddress}
                        className="flex-1 rounded-xl border-2 border-[#6d8f56] bg-[#6d8f56] px-6 py-3 font-semibold text-white shadow-[0_8px_20px_-10px_rgba(109,143,86,0.3)] transition hover:bg-[#5a7548] hover:shadow-[0_12px_24px_-12px_rgba(109,143,86,0.4)] disabled:opacity-60 disabled:shadow-none"
                      >
                        {isSavingAddress ? "Saving..." : "Save Address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNewAddress(false);
                          setFormData({
                            address_line1: "",
                            city: "",
                            state: "",
                            postal_code: "",
                            country: "",
                          });
                        }}
                        className="flex-1 rounded-xl border-2 border-[#e5e7eb] bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-[#f9fafb]"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {showEditForm && selectedAddressId && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        const selected = savedAddresses.find((a) => a.id === selectedAddressId);
                        if (selected) {
                          handleAddressSelection(selected);
                        }
                      }}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-[#f9fafb]"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Payment Section */}
          <section className="overflow-hidden rounded-3xl border border-[#d8d3c3]/60 bg-white shadow-[0_16px_50px_-25px_rgba(15,23,42,0.2)]">
            <div className="border-b border-[#e5e7eb] bg-gradient-to-r from-[#f9fafb] to-[#fcfbf6] px-6 py-5 sm:px-8">
              <h2 className="text-lg font-semibold text-slate-900">Payment Method</h2>
            </div>

            <div className="p-6 sm:p-8">
              <label className="relative block overflow-hidden rounded-2xl border-2 border-[#e5e7eb] transition hover:border-[#cdc5ad] hover:shadow-[0_12px_30px_-15px_rgba(15,23,42,0.15)]">
                <input
                  type="radio"
                  name="payment-method"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="sr-only"
                />
                <div className="flex cursor-pointer items-center gap-4 p-5 transition">
                  <div className="inline-flex rounded-full border-2 border-[#e5e7eb] p-0.5">
                    {paymentMethod === "cod" ? (
                      <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#6d8f56]">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Cash on Delivery</p>
                    <p className="mt-1 text-sm text-slate-600">Pay when your order arrives</p>
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Error Message */}
          {errorMessage && (
            <div className="overflow-hidden rounded-2xl border-l-4 border-red-500 bg-red-50 shadow-[0_8px_20px_-10px_rgba(239,68,68,0.2)]">
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl border-2 border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-4 font-bold text-white shadow-[0_12px_40px_-15px_rgba(15,23,42,0.4)] transition hover:shadow-[0_18px_50px_-20px_rgba(15,23,42,0.5)] disabled:opacity-60 disabled:shadow-none"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Placing Order...
              </span>
            ) : (
              "Proceed to Order Confirmation"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
