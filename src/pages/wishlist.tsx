import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Sora } from "next/font/google";

import Header from "@/components/Header";
import { authService } from "@/services/authService";

const sora = Sora({ subsets: ["latin"] });

type WishlistProduct = {
  id: number;
  product: string;
  price: number;
  product_details: string | null;
  product_images: { image?: string }[];
  product_quantity: number;
  product_description: string | null;
};

type WishlistItem = {
  id: number;
  product: WishlistProduct;
  added_at: string;
};

type WishlistResponse = {
  id: number;
  user: number;
  items: WishlistItem[];
  created_at: string;
  updated_at: string;
};

export default function WishlistPage() {
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<WishlistResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [removingProductId, setRemovingProductId] = useState<number | null>(null);
  const router = useRouter();

  const fetchWishlist = async () => {
    const token = authService.getToken();
    if (!token) {
      router.push("/auth");
      return;
    }

    const response = await fetch("https://django-restframework-products-backend.onrender.com/api/wishlist/", {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load wishlist");
    }

    const wishlistData: WishlistResponse = await response.json();
    setWishlist(wishlistData);
  };

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    fetchWishlist()
      .catch((error) => {
        console.error("Error loading wishlist:", error);
        setErrorMessage("Could not load wishlist. Please refresh and try again.");
      })
      .finally(() => {
        setLoading(false);
      });

    const handleWishlistUpdated = () => {
      fetchWishlist().catch((error) => {
        console.error("Error refreshing wishlist:", error);
      });
    };

    window.addEventListener("wishlist-updated", handleWishlistUpdated);
    window.addEventListener("focus", handleWishlistUpdated);

    return () => {
      window.removeEventListener("wishlist-updated", handleWishlistUpdated);
      window.removeEventListener("focus", handleWishlistUpdated);
    };
  }, [router]);

  const handleRemoveWishlistItem = async (productId: number) => {
    const token = authService.getToken();
    if (!token) {
      router.push("/auth");
      return;
    }

    setRemovingProductId(productId);

    try {
      const response = await fetch("https://django-restframework-products-backend.onrender.com/api/wishlist/remove/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove wishlist item");
      }

      await fetchWishlist();
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (error) {
      console.error("Error removing wishlist item:", error);
      setErrorMessage("Could not remove item from wishlist. Please try again.");
    } finally {
      setRemovingProductId(null);
    }
  };

  const wishlistItems = wishlist?.items || [];
  const totalItems = wishlistItems.length;
  const totalValue = useMemo(
    () => wishlistItems.reduce((sum, item) => sum + Number(item.product.price || 0), 0),
    [wishlistItems]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#dad6c7] bg-white/90 p-8 text-center shadow-[0_16px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d6ccb2] border-t-[#b24f66]" />
          <p className={`mt-5 text-xl font-semibold text-slate-800 ${sora.className}`}>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f7f4ec] text-slate-900">
      <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-[#f4d8a8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-56 h-72 w-72 rounded-full bg-[#f2b4c2]/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#d9e8f3]/35 blur-3xl" />

      <Header />

      <main className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="mb-7 overflow-hidden rounded-3xl border border-[#d2c5c8] bg-gradient-to-br from-[#fde5ea] via-[#fef6f7] to-[#f0f6e9] p-6 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.4)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Saved Collection</p>
              <h1 className={`mt-2 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl ${sora.className}`}>
                Your Wishlist
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-700 sm:text-base">
                Keep track of favorites and come back when you are ready to add them to your cart.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-300/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800">
                {totalItems} items
              </span>
              <span className="rounded-full border border-[#b24f66]/30 bg-[#b24f66]/10 px-4 py-2 text-sm font-semibold text-[#7f3144]">
                ${totalValue.toFixed(2)} total value
              </span>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-300/70 bg-[#fff2ef] px-4 py-3 text-red-700 shadow-sm">
            {errorMessage}
          </div>
        )}

        {!errorMessage && wishlistItems.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#c9b9bd] bg-white/90 p-10 text-center shadow-[0_14px_42px_-24px_rgba(15,23,42,0.3)]">
            <h2 className={`text-2xl font-semibold text-slate-800 ${sora.className}`}>No favorites saved yet</h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Tap the heart icon on products to save them to your wishlist.
            </p>
            <button
              onClick={() => router.push("/shop")}
              className="mt-6 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Explore Products
            </button>
          </div>
        )}

        {!errorMessage && wishlistItems.length > 0 && (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistItems.map((item, index) => (
              <article
                key={item.id}
                className="group rounded-2xl border border-[#d8d3c3] bg-white/90 p-4 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur"
                style={{ animation: "wishFadeIn 360ms ease-out", animationDelay: `${index * 60}ms` }}
              >
                <img
                  src={item.product.product_images?.[0]?.image || "https://via.placeholder.com/500x300?text=Product"}
                  alt={item.product.product}
                  className="h-44 w-full rounded-xl border border-[#d8d3c3] object-cover"
                />

                <div className="mt-4 flex items-start justify-between gap-3">
                  <h2 className={`text-xl font-semibold text-slate-900 ${sora.className}`}>{item.product.product}</h2>
                  <span className="rounded-full bg-[#fde6ec] px-3 py-1 text-xs font-semibold text-[#8f3d53]">Saved</span>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  {item.product.product_description || "No description available for this product."}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-bold text-slate-900">${Number(item.product.price || 0).toFixed(2)}</p>
                  <button
                    onClick={() => handleRemoveWishlistItem(item.product.id)}
                    disabled={removingProductId === item.product.id}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {removingProductId === item.product.id ? "Removing..." : "Remove"}
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-end">
                  <p className="text-xs font-medium text-slate-500">Added {new Date(item.added_at).toLocaleDateString()}</p>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <style jsx global>{`
        @keyframes wishFadeIn {
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