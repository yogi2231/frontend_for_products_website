import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";

type CartResponse = {
  items?: {
    quantity?: number;
  }[];
};

export default function Header() {
  const [showProfile, setShowProfile] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const user = authService.getUser();

  const fetchCartCount = async () => {
    const token = authService.getToken();
    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const response = await fetch("https://django-restframework-products-backend.onrender.com/api/cart/", {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setCartCount(0);
        return;
      }

      const cartData: CartResponse = await response.json();
      const totalCount = (cartData.items || []).reduce(
        (sum, item) => sum + (item.quantity ?? 0),
        0
      );
      setCartCount(totalCount);
    } catch (error) {
      console.error("Error loading cart count:", error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();

    const handleCartUpdated = () => {
      fetchCartCount();
    };

    const handleWindowFocus = () => {
      fetchCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [router.pathname]);

  const handleLogout = () => {
    authService.logout();
    router.push("/auth");
  };

  return (
    <div className="sticky top-0 z-50">
    

      {/* Main Header */}
      <div className="bg-white shadow-md py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <h1 className="text-4xl font-extrabold text-gray-900 cursor-pointer">Fruitables</h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex gap-8 items-center">
            <Link href="/" className={`font-medium transition-colors ${router.pathname === '/' ? 'text-lime-500' : 'text-gray-600 hover:text-lime-500'}`}>
              Home
            </Link>
            <Link href="/shop" className={`font-medium transition-colors ${router.pathname === '/shop' ? 'text-lime-500' : 'text-gray-600 hover:text-lime-500'}`}>
              Shop
            </Link>
           
            {/* show dashboard link only for store users */}
            {user?.user_type === "store" && (
              <Link href="/dashboard" className={`font-medium transition-colors ${router.pathname === '/dashboard' ? 'text-lime-500' : 'text-gray-600 hover:text-lime-500'}`}>
                Dashboard
              </Link>
            )}
           
            <Link href="/contact" className="font-medium text-gray-600 hover:text-lime-500 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-6">
          
            {/* Cart */}
            <Link href="/cart" className="relative text-gray-600 hover:text-lime-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 11.293A1 1 0 006 25h12a1 1 0 00.707-.293L17 13M17 13l2-8m-10 4h.01M9 17a1 1 0 11-2 0 1 1 0 012 0zm10 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-lime-500 text-xs font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="text-gray-600 hover:text-lime-500 p-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
                  {user && (
                    <>
                      <Link href="/profile" className="block px-4 py-2 text-gray-600 hover:bg-lime-50 hover:text-lime-500">
                        <div className="px-4 py-3 border-b">
                    
                        <p className="font-semibold text-gray-800">{user.username}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                      </Link>
                      <Link href="/wishlist" className="block px-4 py-2 text-gray-600 hover:bg-lime-50 hover:text-lime-500">
                        wishlist
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 text-gray-600 hover:bg-lime-50 hover:text-lime-500">
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 border-t"
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
