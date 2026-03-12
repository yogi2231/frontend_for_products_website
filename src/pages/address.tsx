import { useEffect, useMemo, useState } from "react";
import { Syne, Nunito_Sans } from "next/font/google";
import Header from "@/components/Header";
import { API_BASE_URL } from "@/services/backend";
import { authService } from "@/services/authService";

type Address = {
  id: number;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type FormState = Omit<Address, "id">;
  
const API_BASE = `${API_BASE_URL}/addresses/`;

const syne = Syne({ subsets: ["latin"] });
const nunito = Nunito_Sans({ subsets: ["latin"] });

const initialForm: FormState = {
  address_line1: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
};

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

 

  const getAuthHeaders = () => {
    const token =authService.getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    };
  };

  const fetchAddresses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_BASE, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch addresses");
      const data: Address[] = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load addresses. Check API/token.");
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((a, b) =>
        a.city.localeCompare(b.city) || a.country.localeCompare(b.country)
      ),
    [addresses]
  );

  const onChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.address_line1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.postal_code.trim() ||
      !form.country.trim()
    ) {
      alert("Please fill all fields.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const isEdit = editingId !== null;
      const endpoint = isEdit ? `${API_BASE}${editingId}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Save failed");

      await fetchAddresses();
      resetForm();
    } catch {
      setError("Unable to save address.");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item: Address) => {
    setEditingId(item.id);
    setForm({
      address_line1: item.address_line1,
      city: item.city,
      state: item.state,
      postal_code: item.postal_code,
      country: item.country,
    });
  };

  const onDelete = async (id: number) => {
    if (!window.confirm("Delete this address?")) return;

    try {
      const res = await fetch(`${API_BASE}${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Delete failed");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) resetForm();
    } catch {
      setError("Unable to delete address.");
    }
  };

  return (
    <div className={`relative min-h-screen overflow-x-clip bg-[#f6f2e9] text-slate-900 ${nunito.className}`}>
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#f6d79e]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-52 h-80 w-80 rounded-full bg-[#b9d9af]/40 blur-3xl" />

      <Header />

      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-[#cfc3a7] bg-gradient-to-br from-[#f8ead0] via-[#f8f3e4] to-[#e4efdb] p-6 shadow-[0_20px_64px_-32px_rgba(15,23,42,0.45)] sm:p-8 lg:p-10">
          <h1 className={`text-4xl sm:text-5xl ${syne.className}`}>
            Address <span className="text-[#345a2a]">Management</span>
          </h1>
          <p className="mt-3 text-sm text-slate-700">
            API: <span className="font-semibold">{API_BASE}</span>
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-5">
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-[#d8cfb8] bg-white/85 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.4)] lg:col-span-2"
          >
            <h2 className={`text-2xl ${syne.className}`}>
              {editingId ? "Update Address" : "Create Address"}
            </h2>

            <div className="mt-4 grid gap-3">
              <input
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#345a2a]"
                placeholder="Address Line"
                value={form.address_line1}
                onChange={(e) => onChange("address_line1", e.target.value)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#345a2a]"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => onChange("city", e.target.value)}
                />
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#345a2a]"
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => onChange("state", e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#345a2a]"
                  placeholder="Postal Code"
                  value={form.postal_code}
                  onChange={(e) => onChange("postal_code", e.target.value)}
                />
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#345a2a]"
                  placeholder="Country"
                  value={form.country}
                  onChange={(e) => onChange("country", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full border border-[#35562a] bg-[#345a2a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2e4e25] disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Save"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          </form>

          <div className="rounded-3xl border border-[#d8cfb8] bg-white/85 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.4)] lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className={`text-2xl ${syne.className}`}>Saved Addresses</h2>
              <button
                onClick={fetchAddresses}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-slate-600">Loading...</p>
            ) : sortedAddresses.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#c8bfaa] bg-[#faf7ef] p-6 text-sm text-slate-600">
                No addresses found.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#e5e7eb]">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f9fafb] text-left text-xs uppercase tracking-wide text-slate-600">
                      <th className="px-4 py-3">Address</th>
                      <th className="px-4 py-3">City/State</th>
                      <th className="px-4 py-3">Postal/Country</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAddresses.map((item, i) => (
                      <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-[#fcfcfd]"}>
                        <td className="px-4 py-3 text-sm">{item.address_line1}</td>
                        <td className="px-4 py-3 text-sm">
                          {item.city}, {item.state}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.postal_code}, {item.country}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => onEdit(item)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => onDelete(item.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}