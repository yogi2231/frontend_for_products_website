import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Sora } from "next/font/google";

import Header from "@/components/Header";
import { authService } from "@/services/authService";
import { API_BASE_URL } from "@/services/backend";

const sora = Sora({ subsets: ["latin"] });

const ORDERS_API_URL = `${API_BASE_URL}/orders/`;

type OrderProduct = {
    id: number;
    product: string;
    price: number;
    product_details: string | null;
    product_images: { image: string }[];
    product_quantity: number;
    product_description: string | null;
};

type OrderItem = {
    id: number;
    product: OrderProduct;
    quantity: number;
    price: number;
};

type Order = {
    id: number;
    user: number;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    items: OrderItem[];
    total_price: number;
    created_at: string;
    updated_at: string;
};

export default function OrdersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        const loadOrders = async () => {
            const token = authService.getToken();

            if (!token) {
                router.push("/auth");
                return;
            }

            try {
                const response = await fetch(ORDERS_API_URL, {
                    method: "GET",
                    headers: {
                        Authorization: `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`Unable to fetch orders (${response.status})`);
                }

                const data: Order[] = await response.json();
                setOrders(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error loading orders:", error);
                setErrorMessage("Could not load your orders. Please refresh and try again.");
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, [router]);

    const totalSpend = useMemo(() => {
        return orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    }, [orders]);

    const totalItemsOrdered = useMemo(() => {
        return orders.reduce(
            (sum, order) =>
                sum + order.items.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
            0
        );
    }, [orders]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-6">
                <div className="w-full max-w-md rounded-3xl border border-[#dad6c7] bg-white/90 p-8 text-center shadow-[0_16px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d6ccb2] border-t-[#6d8f56]" />
                    <p className={`mt-5 text-xl font-semibold text-slate-800 ${sora.className}`}>Loading your orders...</p>
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
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Order History</p>
                            <h1 className={`mt-2 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl ${sora.className}`}>
                                Your Previous Orders
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-700 sm:text-base">
                                Review every order with product details, quantities, and totals.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-slate-300/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800">
                                {orders.length} orders
                            </span>
                            <span className="rounded-full border border-[#5f834f]/30 bg-[#6d8f56]/15 px-4 py-2 text-sm font-semibold text-[#345026]">
                                {totalItemsOrdered} items
                            </span>
                        </div>
                    </div>
                    <div className="mt-6 h-px bg-gradient-to-r from-slate-400/20 via-slate-500/40 to-slate-400/20" />
                    <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                        <p>Placed orders are fetched live from your account.</p>
                        <p className="font-semibold text-slate-900">Total Spend: ${totalSpend.toFixed(2)}</p>
                    </div>
                </section>

                {errorMessage && (
                    <div className="mb-6 rounded-2xl border border-red-300/70 bg-[#fff2ef] px-4 py-3 text-red-700 shadow-sm">
                        {errorMessage}
                    </div>
                )}

                {!errorMessage && orders.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-[#c5c0ae] bg-white/90 p-10 text-center shadow-[0_14px_42px_-24px_rgba(15,23,42,0.3)]">
                        <h2 className={`text-2xl font-semibold text-slate-800 ${sora.className}`}>No orders yet</h2>
                        <p className="mt-2 text-sm text-slate-600 sm:text-base">
                            Your confirmed orders will appear here once you complete checkout.
                        </p>
                        <button
                            onClick={() => router.push("/shop")}
                            className="mt-6 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                        >
                            Start Shopping
                        </button>
                    </div>
                )}

                {!errorMessage && orders.length > 0 && (
                    <section className="space-y-6">
                        {orders.map((order, orderIndex) => {
                            const orderTotalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

                            return (
                                <article
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="animate-[orderFadeIn_360ms_ease-out] cursor-pointer overflow-hidden rounded-2xl border border-[#d8d3c3] bg-white/90 p-4 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#c7bea5] sm:p-6"
                                    style={{ animationDelay: `${orderIndex * 60}ms` }}
                                >
                                    <div className="flex flex-col gap-2 border-b border-[#e5dfcd] pb-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className={`text-xl font-semibold text-slate-900 ${sora.className}`}>Order id #{order.id}</h2>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Placed on {new Date(order.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-sm text-slate-700 sm:text-right">
                                            <p>
                                                Items: <span className="font-semibold text-slate-900">{orderTotalItems}</span>
                                            </p>
                                            <p>
                                                Total: <span className="font-semibold text-slate-900">${Number(order.total_price).toFixed(2)}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                                        <p>
                                            Delivering to <span className="font-semibold text-slate-800">{order.city}</span>
                                        </p>
                                        <p className="font-semibold text-[#345026]">Click to view full details</p>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </main>

            {selectedOrder && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#d8d3c3] bg-white p-5 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.6)] sm:p-6"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[#e5dfcd] pb-4">
                            <div>
                                <h2 className={`text-2xl font-semibold text-slate-900 ${sora.className}`}>Order #{selectedOrder.id}</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-4 rounded-xl border border-[#e5dfcd] bg-[#f7f4ea] p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Shipping Address</p>
                            <p className="mt-2 text-sm text-slate-800">{selectedOrder.address_line1}</p>
                            {selectedOrder.address_line2 && <p className="text-sm text-slate-700">{selectedOrder.address_line2}</p>}
                            <p className="text-sm text-slate-700">
                                {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.postal_code}
                            </p>
                            <p className="text-sm font-medium text-slate-800">{selectedOrder.country}</p>
                        </div>

                        <div className="mt-4 grid gap-3">
                            {selectedOrder.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-3 rounded-xl border border-[#e5dfcd] bg-[#fcfbf6] p-3 sm:flex-row sm:items-center"
                                >
                                    <img
                                        src={item.product.product_images?.[0]?.image || "https://via.placeholder.com/120x100?text=Product"}
                                        alt={item.product.product}
                                        className="h-24 w-full rounded-lg border border-[#d8d3c3] object-cover sm:w-28"
                                    />

                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-slate-900">{item.product.product}</h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {item.product.product_description || "No product description available."}
                                        </p>
                                    </div>

                                    <div className="text-sm text-slate-700 sm:text-right">
                                        <p>
                                            Qty: <span className="font-semibold text-slate-900">{item.quantity}</span>
                                        </p>
                                        <p>
                                            Price: <span className="font-semibold text-slate-900">${Number(item.price).toFixed(2)}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 flex items-center justify-end border-t border-[#e5dfcd] pt-4 text-base font-semibold text-slate-900">
                            Total: ${Number(selectedOrder.total_price).toFixed(2)}
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
        @keyframes orderFadeIn {
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