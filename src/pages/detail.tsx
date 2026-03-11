import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { Sora } from "next/font/google";

import Header from "@/components/Header";
import { authService } from "@/services/authService";

const sora = Sora({ subsets: ["latin"] });

type ProductDetail = {
  id: number;
  product: string;
  category?: string;
  price: number | string;
  product_details: string | null;
  product_images: { image?: string }[];
  product_quantity: number;
  product_description: string | null;
};

type CartResponse = {
  items?: {
    product?: {
      id?: number;
    };
    quantity?: number;
  }[];
};

export default function DetailPage() {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [isCartUpdating, setIsCartUpdating] = useState(false);
  const router = useRouter();

  const productId = useMemo(() => {
    const rawId = router.query.id;
    if (Array.isArray(rawId)) {
      return rawId[0] || "";
    }

    return rawId || "";
  }, [router.query.id]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!authService.isAuthenticated()) {
      router.push("/auth");
      return;
    }

    if (!productId) {
      setErrorMessage("No product selected. Choose a product from the shop.");
      setLoading(false);
      return;
    }

    const fetchProductDetail = async () => {
      const token = authService.getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Token ${token}`;
      }

      const response = await fetch(`https://django-restframework-products-backend.onrender.com/api/products/${productId}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to load product details");
      }

      const productData: ProductDetail = await response.json();
      setProduct(productData);
    };

    const syncQuantityFromServer = async () => {
      const token = authService.getToken();
      if (!token) {
        setQuantity(0);
        return;
      }

      const response = await fetch("https://django-restframework-products-backend.onrender.com/api/cart/", {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load cart data");
      }

      const cartData: CartResponse = await response.json();
      const matchedItem = cartData.items?.find((item) => item.product?.id === Number(productId));
      setQuantity(matchedItem?.quantity ?? 0);
    };

    Promise.all([fetchProductDetail(), syncQuantityFromServer()])
      .catch((error) => {
        console.error("Error loading product detail:", error);
        setErrorMessage("Could not load this product. Please go back and try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId, router, router.isReady]);

  const updateCartQuantity = async (delta: number) => {
    if (isCartUpdating) {
      return;
    }

    const token = authService.getToken();
    if (!token || !product) {
      router.push("/auth");
      return;
    }

    const nextQuantity = quantity + delta;
    if (nextQuantity < 0) {
      return;
    }

    const previousQuantity = quantity;
    setQuantity(nextQuantity);
    setIsCartUpdating(true);

    try {
      const response = await fetch("https://django-restframework-products-backend.onrender.com/api/cart/add/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: delta,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update cart item quantity");
      }

      const cartResponse = await fetch("https://django-restframework-products-backend.onrender.com/api/cart/", {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!cartResponse.ok) {
        throw new Error("Failed to refresh cart item quantity");
      }

      const cartData: CartResponse = await cartResponse.json();
      const matchedItem = cartData.items?.find((item) => item.product?.id === product.id);
      setQuantity(matchedItem?.quantity ?? 0);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      setQuantity(previousQuantity);
      console.error("Error updating cart item:", error);
    } finally {
      setIsCartUpdating(false);
    }
  };

  const handleAddToCart = () => {
    updateCartQuantity(1);
  };

  const handleIncrease = () => {
    updateCartQuantity(1);
  };

  const handleDecrease = () => {
    updateCartQuantity(-1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#dad6c7] bg-white/90 p-8 text-center shadow-[0_16px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d6ccb2] border-t-[#486f3d]" />
          <p className={`mt-5 text-xl font-semibold text-slate-800 ${sora.className}`}>Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f7f4ec] text-slate-900">
      <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-[#f4d8a8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-56 h-72 w-72 rounded-full bg-[#b4d2ad]/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#d9e8f3]/35 blur-3xl" />

      <Header />

      <main className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2 text-sm text-slate-600">
          <Link href="/shop" className="font-semibold text-slate-800 transition hover:text-[#486f3d]">
            Shop
          </Link>
          <span>/</span>
          <span>{product?.product || "Product detail"}</span>
        </div>

        {errorMessage && (
          <div className="rounded-3xl border border-red-300/70 bg-[#fff2ef] p-8 text-center shadow-sm">
            <h1 className={`text-2xl font-semibold text-red-700 ${sora.className}`}>Product unavailable</h1>
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
            <button
              onClick={() => router.push("/shop")}
              className="mt-6 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to shop
            </button>
          </div>
        )}

        {!errorMessage && product && (
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-[#d8d3c3] bg-white/90 p-5 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur sm:p-6">
              <div className="overflow-hidden rounded-[1.5rem] border border-[#ddd7c8] bg-[#f8f4eb]">
                <img
                  src={product.product_images?.[0]?.image || "https://via.placeholder.com/900x620?text=Product"}
                  alt={product.product}
                  className="h-[22rem] w-full object-cover sm:h-[30rem]"
                />
              </div>

              {product.product_images?.length > 1 && (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {product.product_images.map((image, index) => (
                    <div key={`${image.image || "product-image"}-${index}`} className="overflow-hidden rounded-2xl border border-[#ddd7c8] bg-[#f8f4eb]">
                      <img
                        src={image.image || "https://via.placeholder.com/260x200?text=Product"}
                        alt={`${product.product} preview ${index + 1}`}
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <section className="rounded-[2rem] border border-[#cfc8b0] bg-gradient-to-br from-[#f5e7cb] via-[#f8f3e7] to-[#dfead8] p-6 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.4)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">Selected Product</p>
                <h1 className={`mt-3 text-4xl leading-tight text-slate-900 sm:text-5xl ${sora.className}`}>
                  {product.product}
                </h1>
                <p className="mt-4 text-sm text-slate-700 sm:text-base">
                  {product.product_description || "No product description is available for this item yet."}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-300/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800">
                    ${Number(product.price || 0).toFixed(2)}
                  </span>
                  <span className="rounded-full border border-[#5f834f]/30 bg-[#6d8f56]/15 px-4 py-2 text-sm font-semibold text-[#345026]">
                    {product.product_quantity} in stock
                  </span>
                  {product.category && (
                    <span className="rounded-full border border-[#d8c46d]/40 bg-[#f5e9b8]/55 px-4 py-2 text-sm font-semibold text-[#7a5d12]">
                      {product.category}
                    </span>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-[#d8d3c3] bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur">
                <h2 className={`text-2xl font-semibold text-slate-900 ${sora.className}`}>Product Information</h2>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Product ID</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">#{product.id}</p>
                  </div>

                  <div className="rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Availability</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {product.product_quantity > 0 ? "Available now" : "Out of stock"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Details</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {product.product_details || product.product_description || "Additional product details are not available yet."}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push("/shop")}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    Back to products
                  </button>

                  {quantity > 0 ? (
                    <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-50 px-2 py-1">
                      <button
                        onClick={handleDecrease}
                        disabled={isCartUpdating}
                        className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Decrease quantity of ${product.product}`}
                      >
                        -
                      </button>
                      <span className="min-w-7 text-center text-base font-bold text-emerald-700">{quantity}</span>
                      <button
                        onClick={handleIncrease}
                        disabled={isCartUpdating}
                        className="h-9 w-9 rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Increase quantity of ${product.product}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      disabled={isCartUpdating}
                      className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCartUpdating ? "Adding..." : "Add to cart"}
                    </button>
                  )}
                  {quantity > 0 && (
                    <button
                      onClick={() => router.push("/cart")}
                      className="rounded-full border border-slate-900 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                    Go to cart
                  </button>)}
                </div>
              </section>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
