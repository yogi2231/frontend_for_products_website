import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Sora } from "next/font/google";
import Header from "@/components/Header";
import { authService } from "@/services/authService";
import { API_BASE_URL } from "@/services/backend";

const sora = Sora({ subsets: ["latin"] });

type CartProduct = {
  id: number;
  product: string;
  price: number;
  product_description: string | null;
  product_images: { image: string }[];
};

type CartItem = {
  id: number;
  product: CartProduct;
  quantity: number;
  subtotal: number;
};

type CartResponse = {
  id: number;
  user: number;
  items: CartItem[];
  total_price: number;
  created_at: string;
  updated_at: string;
};

export default function CartPage() {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const router = useRouter();

  const fetchCart = async () => {
    const token = authService.getToken();
    if (!token) {
      router.push("/auth");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/cart/`, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load cart");
    }

    const cartData: CartResponse = await response.json();
    setCart(cartData);
  };

  const updateProductQuantity = async (productId: number, delta: number, itemId: number) => {
    if (delta === 0 || updatingItemId !== null) {
      return;
    }

    const token = authService.getToken();
    if (!token) {
      router.push("/auth");
      return;
    }

    setUpdatingItemId(itemId);

    try {
      const response = await fetch("https://django-restframework-products-backend.onrender.com/api/cart/update/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: delta,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item quantity");
      }

      await fetchCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      console.error("Error updating cart item:", error);
      setErrorMessage("Could not update cart. Please try again.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleIncrease = (item: CartItem) => {
    updateProductQuantity(item.product.id, item.quantity + 1, item.id);
  };

  const handleDecrease = (item: CartItem) => {
    updateProductQuantity(item.product.id, item.quantity - 1, item.id);
  };

  const handleRemove = (item: CartItem) => {
    const token = authService.getToken();
    if (!token) {
      router.push("/auth");
      return;
    }
  fetch('https://django-restframework-products-backend.onrender.com/api/cart/remove/',{
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: item.product.id,
      }),
    }).then((response) => {      if (!response.ok) {
        throw new Error("Failed to remove item from cart");
      }
      return response.json()}).then((cartData: CartResponse) => {      setCart(cartData);
      window.dispatchEvent(new Event("cart-updated"));
    }).catch((error) => {      console.error("Error removing cart item:", error);
      setErrorMessage("Could not remove item from cart. Please try again.");
    })

  };

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    fetchCart()
      .catch((error) => {
        console.error("Error loading cart:", error);
        setErrorMessage("Could not load cart details. Please refresh and try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const totalUnits = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalProducts = cart?.items.length || 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#dad6c7] bg-white/90 p-8 text-center shadow-[0_16px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d6ccb2] border-t-[#6d8f56]" />
          <p className={`mt-5 text-xl font-semibold text-slate-800 ${sora.className}`}>Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f7f4ec] text-slate-900">
      <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-[#f4d8a8]/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-56 h-72 w-72 rounded-full bg-[#b4d2ad]/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#d9e8f3]/40 blur-3xl" />

      <Header />

      <main className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="mb-7 overflow-hidden rounded-3xl border border-[#cfc8b0] bg-gradient-to-br from-[#f5e7cb] via-[#f8f3e7] to-[#dfead8] p-6 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.4)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Basket Overview</p>
              <h1 className={`mt-2 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl ${sora.className}`}>
                Your Cart, Curated.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-700 sm:text-base">
                Review items, tune quantities, and checkout when everything feels perfect.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-300/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800">
                {totalProducts} products
              </span>
              <span className="rounded-full border border-[#5f834f]/30 bg-[#6d8f56]/15 px-4 py-2 text-sm font-semibold text-[#345026]">
                {totalUnits} total units
              </span>
            </div>
          </div>
          <div className="mt-6 h-px bg-gradient-to-r from-slate-400/20 via-slate-500/40 to-slate-400/20" />
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <p>Fast updates, clear subtotals, and a cleaner checkout path.</p>
            <p className="font-semibold text-slate-900">Total: ${Number(cart?.total_price || 0).toFixed(2)}</p>
          </div>
        </section>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-300/70 bg-[#fff2ef] px-4 py-3 text-red-700 shadow-sm">
            {errorMessage}
          </div>
        )}

        {!errorMessage && cart && cart.items.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#c5c0ae] bg-white/90 p-10 text-center shadow-[0_14px_42px_-24px_rgba(15,23,42,0.3)]">
            <h2 className={`text-2xl font-semibold text-slate-800 ${sora.className}`}>Your cart is waiting</h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Add products from the shop to build your next order.
            </p>
            <button
              onClick={() => router.push("/shop")}
              className="mt-6 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Explore Products
            </button>
          </div>
        )}

        {!errorMessage && cart && cart.items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="space-y-4 lg:col-span-2">
              {cart.items.map((item, index) => (
                <article
                  key={item.id}
                  className="group animate-[cartFadeIn_360ms_ease-out] rounded-2xl border border-[#d8d3c3] bg-white/90 p-4 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur sm:p-5"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img
                      src={item.product.product_images?.[0]?.image || "https://via.placeholder.com/300x220?text=Product"}
                      alt={item.product.product}
                      className="h-32 w-full rounded-xl border border-[#d8d3c3] object-cover sm:w-40"
                    />

                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className={`text-xl font-semibold text-slate-900 ${sora.className}`}>{item.product.product}</h2>
                        <span className="rounded-full bg-[#f4ecd8] px-3 py-1 text-xs font-semibold tracking-wide text-slate-700">
                          ${Number(item.product.price).toFixed(2)} each
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {item.product.product_description || "No description available for this item."}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-full border border-[#cfc7b1] bg-[#f8f4e7] px-3 py-1.5">
                          <button
                            onClick={() => handleDecrease(item)}
                            disabled={updatingItemId === item.id}
                            className="h-8 w-8 rounded-full bg-white text-base font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={`Decrease quantity of ${item.product.product}`}
                          >
                            -
                          </button>
                          <strong className="min-w-7 text-center text-sm text-slate-900">{item.quantity}</strong>
                          <button
                            onClick={() => handleIncrease(item)}
                            disabled={updatingItemId === item.id}
                            className="h-8 w-8 rounded-full bg-[#6d8f56] text-base font-bold text-white transition hover:bg-[#5f7d4c] disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={`Increase quantity of ${item.product.product}`}
                          >
                            +
                          </button>
                        </div>

                        <span className="text-sm font-medium text-slate-700">
                          Subtotal: <strong className="text-slate-900">${Number(item.subtotal).toFixed(2)}</strong>
                        </span>

                        <button
                          onClick={() => handleRemove(item)}
                          disabled={updatingItemId === item.id}
                          className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-2xl border border-[#cdc5ad] bg-gradient-to-br from-[#f8f5ec] to-[#e8efdd] p-5 shadow-[0_16px_48px_-26px_rgba(15,23,42,0.45)] lg:sticky lg:top-24">
              <h3 className={`text-2xl font-semibold text-slate-900 ${sora.className}`}>Order Summary</h3>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Total Items</span>
                  <span className="font-semibold text-slate-900">{totalUnits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Products</span>
                  <span className="font-semibold text-slate-900">{cart.items.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-[#345026]">Free</span>
                </div>
              </div>

              <div className="my-5 h-px bg-slate-300/70" />

              <div className="flex items-center justify-between text-lg font-bold text-slate-900">
                <span>Final Price</span>
                <span>${Number(cart.total_price).toFixed(2)}</span>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-[0_12px_28px_-16px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Proceed to Checkout
              </button>

              <p className="mt-3 text-center text-xs text-slate-600">Secure checkout, encrypted payment, instant confirmation.</p>
            </aside>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes cartFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
