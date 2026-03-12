import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Syne, Nunito_Sans } from "next/font/google";
import Header from "@/components/Header";
import { authService } from "@/services/authService";
import Fruitscard from "@/components/Fruitscard";
import { API_BASE_URL } from "@/services/backend";

const syne = Syne({ subsets: ["latin"] });
const nunito = Nunito_Sans({ subsets: ["latin"] });

type Product = {
  id: number;
  product: string;
  price: string | number;
  product_description: string;
  product_images: { image: string }[];
};

const safePrice = (value: string | number) => {
  return Number.parseFloat(String(value).replace("$", "")) || 0;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);

  const router = useRouter();

  const productPrices = useMemo(() => products.map((p) => safePrice(p.price)), [products]);
  const minProductPrice = productPrices.length > 0 ? Math.min(...productPrices) : 0;
  const maxProductPrice = productPrices.length > 0 ? Math.max(...productPrices) : 2000;

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    const user = authService.getUser();
    if (user && user.user_type === "store") {
      router.push("/dashboard");
      return;
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data: Product[] = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    setMinPrice(minProductPrice);
    setMaxPrice(maxProductPrice);
  }, [minProductPrice, maxProductPrice]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      const price = safePrice(p.price);
      const matchesPrice = price >= minPrice && price <= maxPrice;
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        p.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.product_description || "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchesPrice && matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (sortOrder === "default") {
        return 0;
      }

      const priceA = safePrice(a.price);
      const priceB = safePrice(b.price);
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
    });
  }, [maxPrice, minPrice, products, searchQuery, sortOrder]);

  const rangeSpan = Math.max(maxProductPrice - minProductPrice, 1);
  const rangeStart = ((minPrice - minProductPrice) / rangeSpan) * 100;
  const rangeEnd = ((maxPrice - minProductPrice) / rangeSpan) * 100;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1e7] px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#d9d0b6] bg-white/90 p-8 text-center shadow-[0_18px_50px_-28px_rgba(15,23,42,0.5)] backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#cfc4a4] border-t-[#4b6b3f]" />
          <p className={`mt-5 text-xl font-semibold text-slate-800 ${syne.className}`}>Preparing your fresh picks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 999px;
          background: #345a2a;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
        }
        input[type="range"]::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 999px;
          background: #345a2a;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
        }
        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className={`relative min-h-screen overflow-x-clip bg-[#f6f2e9] text-slate-900 ${nunito.className}`}>
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#f6d79e]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-52 h-80 w-80 rounded-full bg-[#b9d9af]/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-8 left-1/3 h-80 w-80 rounded-full bg-[#e2c5ad]/35 blur-3xl" />

        <Header />

        <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-[#cfc3a7] bg-gradient-to-br from-[#f8ead0] via-[#f8f3e4] to-[#e4efdb] p-6 shadow-[0_20px_64px_-32px_rgba(15,23,42,0.45)] sm:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">Premium Tech Store</p>
                <h1 className={`mt-3 text-4xl leading-tight sm:text-5xl ${syne.className}`}>
                  Electronics & Gadgets
                  <span className="block text-[#345a2a]">Premium Quality Technology</span>
                </h1>
                <p className="mt-4 max-w-xl text-sm text-slate-700 sm:text-base">
                  Discover curated electronics and gadgets from trusted brands. Express delivery, smart filtering, and the latest tech every week.
                </p>

                

                <div className="mt-6 flex flex-wrap gap-2 text-xs sm:text-sm">
                  <span className="rounded-full border border-[#b8c9a6] bg-[#e7f0dc] px-3 py-1.5 font-semibold text-[#345a2a]">
                    {products.length} gadgets & devices
                  </span>
                  <span className="rounded-full border border-[#d6c9a9] bg-[#fff5dc] px-3 py-1.5 font-semibold text-slate-700">
                    New releases weekly
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { title: "Free Shipping", subtitle: "On orders over $300", icon: "🚚" },
                  { title: "Secure Checkout", subtitle: "Encrypted payment", icon: "🔒" },
                  { title: "Fast Support", subtitle: "Help within minutes", icon: "⚡" },
                  { title: "Return Policy", subtitle: "30-day money back", icon: "↺" },
                ].map((item, index) => (
                  <article
                    key={item.title}
                    className="animate-[riseIn_420ms_ease-out] rounded-2xl border border-[#d7ceb8] bg-white/90 p-4 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.6)]"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <p className="text-xl">{item.icon}</p>
                    <h3 className="mt-2 text-sm font-bold text-slate-900 sm:text-base">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-600 sm:text-sm">{item.subtitle}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 rounded-3xl border border-[#d8cfb8] bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.4)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Explore</p>
                <h2 className={`mt-1 text-3xl text-slate-900 ${syne.className}`}>Our Tech Collection</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Premium gadgets that match your budget, sorted your way.
                </p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu((prev) => !prev)}
                  className="rounded-full border border-[#35562a] bg-[#345a2a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2e4e25]"
                >
                  Filters & Sort
                </button>

                {showFilterMenu && (
                  <div className="absolute right-0 top-14 z-20 w-[18.5rem] rounded-2xl border border-[#d6ccb3] bg-white p-4 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.55)]">
                    <h3 className="text-sm font-semibold text-slate-800">Price Range</h3>
                    <p className="mt-1 text-xs text-slate-600">
                      ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
                    </p>

                    <div className="relative mt-3">
                      <div
                        className="absolute h-2 w-full rounded-full bg-slate-200"
                        style={{
                          background: `linear-gradient(to right, #e2e8f0 0%, #e2e8f0 ${rangeStart}%, #4b6b3f ${rangeStart}%, #4b6b3f ${rangeEnd}%, #e2e8f0 ${rangeEnd}%, #e2e8f0 100%)`,
                        }}
                      />
                      <input
                        type="range"
                        min={minProductPrice}
                        max={maxProductPrice}
                        step="0.01"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 0.01))}
                        className="absolute h-2 w-full cursor-pointer appearance-none bg-transparent"
                        style={{ zIndex: 2 }}
                      />
                      <input
                        type="range"
                        min={minProductPrice}
                        max={maxProductPrice}
                        step="0.01"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 0.01))}
                        className="h-2 w-full cursor-pointer appearance-none bg-transparent"
                        style={{ zIndex: 3 }}
                      />
                    </div>

                    <label htmlFor="sort-order" className="mt-4 block text-sm font-semibold text-slate-800">
                      Sort by price
                    </label>
                    <select
                      id="sort-order"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#345a2a]"
                    >
                      <option value="default">Default Order</option>
                      <option value="asc">Low to High</option>
                      <option value="desc">High to Low</option>
                    </select>

                    <button
                      onClick={() => setShowFilterMenu(false)}
                      className="mt-4 w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {filteredProducts.slice(0, 8).map((p) => (
                  <Fruitscard
                    key={p.id}
                    name={p.product}
                    price={String(p.price)}
                    image={p.product_images?.[0]?.image || "https://via.placeholder.com/200x200"}
                    category={p.product}
                    description={p.product_description || "Fresh and high quality produce."}
                    id={p.id}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#c8bfaa] bg-[#faf7ef] p-8 text-center">
                <h3 className={`text-2xl text-slate-900 ${syne.className}`}>No products found</h3>
                <p className="mt-2 text-sm text-slate-600">Try adjusting price range or search text.</p>
              </div>
            )}

            <div className="mt-8 text-center">
              <Link
                href="/shop"
                className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                View All Products
              </Link>
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#d5ccb5] bg-gradient-to-br from-[#fbe9bf] to-[#f4cf7f] p-7 shadow-[0_14px_38px_-24px_rgba(15,23,42,0.45)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">Weekly Spotlight</p>
              <h3 className={`mt-2 text-3xl text-slate-900 ${syne.className}`}>Latest Tech Gadgets</h3>
              <p className="mt-3 max-w-lg text-sm text-slate-700 sm:text-base">
                Cutting-edge innovation, premium quality, and verified devices from trusted brands. Perfect for work, gaming, and entertainment.
              </p>
              <Link href="/shop">
              <button className="mt-6 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                Buy Collection
              </button>
              </Link>
            
            </article>

            <article className="rounded-3xl border border-[#c9d8bd] bg-gradient-to-br from-[#edf7e7] to-[#d3ebc5] p-7 shadow-[0_14px_38px_-24px_rgba(15,23,42,0.45)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">Trusted Metrics</p>
              <h3 className={`mt-2 text-3xl text-slate-900 ${syne.className}`}>Built Around Innovation</h3>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Satisfied Customers", value: "4200+" },
                  { label: "Quality Assurance", value: "99%" },
                  { label: "Verified Brands", value: "45" },
                  { label: "Tech Products", value: "850" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/70 bg-white/70 p-3">
                    <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          
        </main>
      </div>
    </>
  );
}
