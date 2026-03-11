import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { authService } from "@/services/authService";
import Sidebar from "@/components/Sidebar";

interface Product {
  id: number;
  product: string;
  category: string;
  price: string;
  product_description: string;
  product_images: { image: string }[];
  product_quantity
  : number;
}

interface ProductFormData {
  product: string;
  category: string;
  price: string;
  product_description: string;
  image: string;
  product_quantity: number;
}

interface User {
  username: string;
  email: string;
  user_type: string;
}

const API_BASE_URL = "https://django-restframework-products-backend.onrender.com/api/products";

const initialFormData: ProductFormData = {
  product: "",
  category: "",
  price: "",
  product_description: "",
  image: "",
  product_quantity: 0,
};

export default function Products() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    const userData = authService.getUser();
    // ensure only store users see this page
    if (!userData || userData.user_type !== "store") {
      router.push("/");
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router]);

  const fetchProducts = async () => {
    try {
      const headers = authService.getToken()        ? {
            Authorization: `Token ${authService.getToken()}`,
          }
        : null;
      if (!headers) {
        router.push("/auth");
        return;
      }

      const response = await fetch(API_BASE_URL, { headers });
      if (!response.ok) {
        throw new Error(`Failed to load products (${response.status})`);
      }
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push("/auth");
  };

  const openAddForm = () => {
    setFormMode("add");
    setSelectedProductId(null);
    setFormData(initialFormData);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setFormMode("edit");
    setSelectedProductId(product.id);
    setFormData({
      product: product.product,
      category: product.category,
      price: product.price,
      product_description: product.product_description,
      image: product.product_images?.[0]?.image || "",
      product_quantity: product.product_quantity || 0,
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) {
      return;
    }
    setIsFormOpen(false);
    setFormData(initialFormData);
    setSelectedProductId(null);
    setFormError("");
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "product_quantity" ? Number(value) : value,
    }));
  };

  const handleSaveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const endpoint =
        formMode === "edit" && selectedProductId !== null
          ? `${API_BASE_URL}/${selectedProductId}`
          : API_BASE_URL;
      const method = formMode === "edit" ? "PUT" : "POST";
     
const token = authService.getToken();
      if (!token) {
        router.push("/auth");
        return;
      }
      const payload = {
        product: formData.product,
        category: formData.category,
        price: formData.price,
        product_description: formData.product_description,
        product_images: formData.image ? [{ image: formData.image }] : [],
        product_quantity: formData.product_quantity,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Failed to save product.");
      }

      await fetchProducts();
      closeForm();
    } catch (error) {
      console.error("Error saving product:", error);
      setFormError("Could not save the product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const shouldDelete = window.confirm(
      `Delete \"${product.product}\" permanently?`
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingProductId(product.id);

    try {      const token = authService.getToken();
      if (!token) {
        router.push("/auth");
        return;
      }
      

      const response = await fetch(`${API_BASE_URL}/${product.id}`, {
        method: "DELETE",
        headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Failed to delete product.");
      }

      setProducts((prev) => prev.filter((item) => item.id !== product.id));
    } catch (error) {
      console.error("Error deleting product:", error);
      window.alert("Could not delete the product. Please try again.");
    } finally {
      setDeletingProductId(null);
    }
  };

  const parsePrice = (value: string) => {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      products
        .map((item) => item.product.trim())
        .filter((item) => item.length > 0)
    );

    return ["all", ...Array.from(uniqueCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.product.toLowerCase().includes(term) ||
        item.product_description.toLowerCase().includes(term);

      const matchesCategory =
        activeCategory === "all" ||
        item.category.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  const averagePrice = useMemo(() => {
    if (products.length === 0) {
      return 0;
    }

    const total = products.reduce((sum, item) => sum + parsePrice(item.price), 0);
    return total / products.length;
  }, [products]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07131f]">
        <div className="products-ui rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center text-white shadow-2xl backdrop-blur-sm">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-white/35 border-t-white mx-auto" />
          <p className="text-lg font-semibold tracking-wide">Preparing products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Sora:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="products-ui relative min-h-screen overflow-hidden bg-[#081625] text-slate-100">
        <div className="mesh-orb absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#f97316]/40" />
        <div className="mesh-orb delay absolute right-8 top-10 h-64 w-64 rounded-full bg-[#14b8a6]/30" />
        <div className="mesh-orb absolute bottom-10 right-1/3 h-56 w-56 rounded-full bg-[#facc15]/25" />

        <div className="relative flex min-h-screen flex-col md:flex-row">
          <div className="shrink-0 md:sticky md:top-0 md:h-screen">
            <Sidebar onLogout={handleLogout} />
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
            <section className="reveal mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-teal-950/60 p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)] backdrop-blur-sm md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
                    Store Catalog
                  </p>
                  <h1 className="products-title text-4xl leading-tight text-[#fff9ef] md:text-5xl">
                    Products That Sell With Style
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm text-slate-200/90 md:text-base">
                    Welcome{user?.username ? `, ${user.username}` : ""}. Manage your collection with a polished catalog view, quick edits, and instant price insights.
                  </p>
                </div>

                <button
                  onClick={openAddForm}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#f97316] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-14px_rgba(249,115,22,0.9)] transition hover:-translate-y-0.5 hover:bg-[#fb8b33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-[#fdba74]"
                >
                  + Add Product
                </button>
              </div>
            </section>

            <section className="reveal mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Total Products</p>
                <p className="mt-2 text-3xl font-semibold text-white">{products.length}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Categories</p>
                <p className="mt-2 text-3xl font-semibold text-white">{categories.length - 1}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Avg Price</p>
                <p className="mt-2 text-3xl font-semibold text-white">${averagePrice.toFixed(2)}</p>
              </article>
            </section>

            <section className="reveal mb-6 rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="w-full lg:max-w-md">
                  <label htmlFor="product-search" className="sr-only">
                    Search products
                  </label>
                  <input
                    id="product-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by product name or description"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/45 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isActive = activeCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition ${
                          isActive
                            ? "bg-[#14b8a6] text-slate-950"
                            : "border border-white/20 bg-slate-900/40 text-slate-200 hover:border-white/40"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/20 bg-slate-900/40 py-20 text-center text-slate-200 backdrop-blur-sm">
                <p className="text-xl font-semibold text-white">No matching products found</p>
                <p className="mt-2 text-sm text-slate-300">Try another search or add a new product to your catalog.</p>
              </div>
            ) : (
              <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const primaryImage = product.product_images?.[0]?.image;

                  return (
                    <article
                      key={product.id}
                      className="reveal group overflow-hidden rounded-3xl border border-white/10 bg-[#0f2235]/80 shadow-[0_18px_40px_-25px_rgba(0,0,0,0.8)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_45px_-20px_rgba(20,184,166,0.5)]"
                    >
                      <div className="relative h-52 overflow-hidden">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={product.product}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-700 text-sm text-slate-300">
                            No product image
                          </div>
                        )}
                        <span className="absolute left-3 top-3 rounded-full bg-[#081625]/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-200">
                          {product.product || "uncategorized"}
                        </span>
                      </div>

                      <div className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white">{product.product}</h3>
                          <p className="shrink-0 rounded-xl bg-[#f97316]/15 px-2.5 py-1 text-sm font-bold text-orange-300">
                            {product.price}
                          </p>
                        </div>

                        <p className="text-sm leading-relaxed text-slate-300">{product.product_description}</p>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => openEditForm(product)}
                            className="flex-1 rounded-xl border border-sky-300/45 bg-sky-500/12 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            disabled={deletingProductId === product.id}
                            className="flex-1 rounded-xl border border-rose-300/45 bg-rose-500/12 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingProductId === product.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </main>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0b1c2d]/95 p-6 text-slate-100 shadow-2xl md:p-7">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="products-title text-3xl text-[#fff8ea]">
                  {formMode === "add" ? "Create New Product" : "Update Product"}
                </h2>
                <button
                  onClick={closeForm}
                  className="rounded-full border border-white/25 px-3 py-1 text-sm text-slate-300 transition hover:border-white/50 hover:text-white"
                  aria-label="Close form"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="product"
                      value={formData.product}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-white/15 bg-slate-950/45 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]"
                      required
                    />
                  </div>

                  

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                      Price
                    </label>
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleFormChange}
                      placeholder="e.g. 99 or $99.00"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/45 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                      Product Quantity
                    </label>
                    <input
                      type="text"
                      name="product_quantity"
                      value={formData.product_quantity}
                      onChange={handleFormChange}
                      min={0}
                      step={1}
                      className="w-full rounded-xl border border-white/15 bg-slate-950/45 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                      Description
                    </label>
                    <textarea
                      name="product_description"
                      value={formData.product_description}
                      onChange={handleFormChange}
                      rows={4}
                      className="w-full rounded-xl border border-white/15 bg-slate-950/45 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                      Image URL
                    </label>
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleFormChange}
                      placeholder="https://example.com/product-image.jpg"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/45 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]"
                    />
                  </div>
                </div>

                {formError && <p className="text-sm text-rose-300">{formError}</p>}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-xl border border-white/25 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/45"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-[#14b8a6] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[#2dd4bf] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : formMode === "add"
                        ? "Create Product"
                        : "Update Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style jsx>{`
          .products-ui {
            font-family: "Sora", "Trebuchet MS", sans-serif;
          }

          .products-title {
            font-family: "DM Serif Display", Georgia, serif;
            letter-spacing: 0.01em;
          }

          .mesh-orb {
            filter: blur(36px);
            animation: float 9s ease-in-out infinite;
            pointer-events: none;
          }

          .mesh-orb.delay {
            animation-delay: -4.5s;
          }

          .reveal {
            animation: rise 0.5s ease both;
          }

          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          @keyframes rise {
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
    </>
  );
}
