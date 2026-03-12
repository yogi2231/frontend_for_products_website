import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
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
  category?: string;
  price: string | number;
  product_description: string;
  product_images: { image: string }[];
};

const toPrice = (value: string | number) => Number.parseFloat(String(value).replace("$", "")) || 0;

export default function Shop() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sortOrder, setSortOrder] = useState("default");
  const router = useRouter();

  const productPrices = useMemo(() => products.map((p) => toPrice(p.price)), [products]);
  const minProductPrice = productPrices.length > 0 ? Math.min(...productPrices) : 0;
  const maxProductPrice = productPrices.length > 0 ? Math.max(...productPrices) : 2000;

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      router.push("/auth");
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

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.product))), [products]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const price = toPrice(product.price);
      const matchesSearch =
        (product.product?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (product.product_description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "" || product.product === selectedCategory;
      const matchesPrice = price >= minPrice && price <= maxPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    });

    return filtered.sort((a, b) => {
      if (sortOrder === "default") {
        return 0;
      }

      const priceA = toPrice(a.price);
      const priceB = toPrice(b.price);
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
    });
  }, [maxPrice, minPrice, products, searchTerm, selectedCategory, sortOrder]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSortOrder("default");
    setMinPrice(minProductPrice);
    setMaxPrice(maxProductPrice);
  };

  const rangeSpan = Math.max(maxProductPrice - minProductPrice, 1);
  const rangeStart = ((minPrice - minProductPrice) / rangeSpan) * 100;
  const rangeEnd = ((maxPrice - minProductPrice) / rangeSpan) * 100;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1e7] px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#d9d0b6] bg-white/90 p-8 text-center shadow-[0_18px_50px_-28px_rgba(15,23,42,0.5)] backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#cfc4a4] border-t-[#4b6b3f]" />
          <p className={`mt-5 text-xl font-semibold text-slate-800 ${syne.className}`}>Loading tech collection...</p>
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
        @keyframes shopRiseIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className={`relative min-h-screen overflow-x-clip bg-[#f6f2e9] text-slate-900 ${nunito.className}`}>
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#f6d79e]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-52 h-80 w-80 rounded-full bg-[#b9d9af]/40 blur-3xl" />

        <Header />

        <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-[#cfc3a7] bg-gradient-to-br from-[#f8ead0] via-[#f8f3e4] to-[#e4efdb] p-6 shadow-[0_20px_64px_-32px_rgba(15,23,42,0.45)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">Full Tech Store</p>
            <h1 className={`mt-3 text-4xl leading-tight sm:text-5xl ${syne.className}`}>
              Electronics & Gadgets
              <span className="block text-[#345a2a]">Cutting-Edge Technology</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-700 sm:text-base">
              Browse by category, filter by price, and sort to find your perfect tech gadget.
            </p>
          </section> 

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[18.5rem_minmax(0,1fr)]">
            <aside className="h-fit rounded-3xl border border-[#d8cfb8] bg-white/85 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.4)] backdrop-blur lg:sticky lg:top-24">
              <h2 className={`text-2xl text-slate-900 ${syne.className}`}>Filters</h2>

              <div className="mt-4">
                <label htmlFor="search-products" className="text-sm font-semibold text-slate-700">
                  Search
                </label>
                <input
                  id="search-products"
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#345a2a]"
                />
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold text-slate-700">Categories</h3>
                <div className="mt-2 max-h-48 space-y-2 overflow-auto pr-1">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${selectedCategory === ""
                        ? "bg-[#345a2a] font-semibold text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    <span>All Products</span>
                    <span>({products.length})</span>
                  </button>

                  {categories.map((category) => {
                    const count = products.filter((p) => p.product === category).length;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${selectedCategory === category
                            ? "bg-[#345a2a] font-semibold text-white"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        <span>{category}</span>
                        <span>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold text-slate-700">Price Range</h3>
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
              </div>

              <div className="mt-5">
                <label htmlFor="sort-products" className="text-sm font-semibold text-slate-700">
                  Sort by Price
                </label>
                <select
                  id="sort-products"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#345a2a]"
                >
                  <option value="default">Default Order</option>
                  <option value="asc">Low to High</option>
                  <option value="desc">High to Low</option>
                </select>
              </div>

              <button
                onClick={clearFilters}
                className="mt-5 w-full rounded-lg border border-slate-300 bg-slate-100 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
              >
                Reset Filters
              </button>
            </aside>

            <section className="rounded-3xl border border-[#d8cfb8] bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.4)] backdrop-blur sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-700">
                  Showing <span className="font-bold text-slate-900">{filteredProducts.length}</span> products
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Premium & Verified</p>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product, index) => (
                    <div key={product.id} className="animate-[shopRiseIn_360ms_ease-out]" style={{ animationDelay: `${index * 35}ms` }}>
                      <Fruitscard
                        id={product.id}
                        name={product.product}
                        price={String(product.price)}
                        image={product.product_images?.[0]?.image || "https://via.placeholder.com/200x200"}
                        category={product.category || product.product}
                        description={product.product_description || "Premium quality electronics and gadgets."}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#c8bfaa] bg-[#faf7ef] p-10 text-center">
                  <h3 className={`text-2xl text-slate-900 ${syne.className}`}>No products found</h3>
                    <p className="mt-2 text-sm text-slate-600">Try a different search, category, or price range to find your tech.</p>
                </div>
              )}
            </section>
          </section> </main>
      </div>
    
    </>
  );
}