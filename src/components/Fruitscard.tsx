import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

type Props = {
    name: string;
    price: string;
    image: string;
    category: string;
    description: string;
    id: number;
}

const Fruitscard = (props: Props) => {
  const [quantity, setQuantity] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistUpdating, setIsWishlistUpdating] = useState(false);
  const router = useRouter();

  type CartResponse = {
    items?: {
      product?: {
        id?: number;
      };
      quantity?: number;
    }[];
  };

  type WishlistItem = {
    product_id?: number;
    product?: {
      id?: number;
    };
    id?: number;
  };

  type WishlistResponse =
    | WishlistItem[]
    | {
        items?: WishlistItem[];
        results?: WishlistItem[];
      };

  const syncQuantityFromServer = async (token: string) => {
    const response = await fetch('https://django-restframework-products-backend.onrender.com/api/cart/', {
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load cart data');
    }

    const cartData: CartResponse = await response.json();
    const matchingItem = cartData.items?.find((item) => item.product?.id === props.id);
    setQuantity(matchingItem?.quantity ?? 0);
  };

  const syncWishlistFromServer = async (token: string) => {
    const response = await fetch('https://django-restframework-products-backend.onrender.com/api/wishlist/', {
      method: 'GET',
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load wishlist data');
    }

    const wishlistData: WishlistResponse = await response.json();
    const wishlistItems = Array.isArray(wishlistData)
      ? wishlistData
      : wishlistData.items ?? wishlistData.results ?? [];

    const matchingItem = wishlistItems.find(
      (item) => item.product_id === props.id || item.product?.id === props.id || item.id === props.id
    );

    setIsWishlisted(Boolean(matchingItem));
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsWishlisted(false);

    if (!token) {
      setQuantity(0);
      return;
    }

    syncQuantityFromServer(token).catch((error) => {
      console.error('Error loading cart quantity:', error);
    });

    syncWishlistFromServer(token).catch((error) => {
      console.error('Error loading wishlist state:', error);
    });
  }, [props.id]);

  const updateCartQuantity = async (delta: number) => {
    if (isUpdating) {
      return;
    }

    const nextQuantity = quantity + delta;
    if (nextQuantity < 0) {
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    const previousQuantity = quantity;
    setQuantity(nextQuantity);
    setIsUpdating(true);

    try {
      const response = await fetch('https://django-restframework-products-backend.onrender.com/api/cart/add/', {
        method: 'POST',
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: props.id,
          quantity: delta
        })
      });

      if (!response) {
        throw new Error('Failed to update cart item quantity');
      }

      await syncQuantityFromServer(token);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error) {
      setQuantity(previousQuantity);
      console.error('Error updating item quantity:', error);
    } finally {
      setIsUpdating(false);
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

  const handleAddToWishlist = async () => {
    if (isWishlistUpdating) {
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    setIsWishlistUpdating(true);

    try {
      const response = await fetch(`${isWishlisted ? 'https://django-restframework-products-backend.onrender.com/api/wishlist/remove/' : 'https://django-restframework-products-backend.onrender.com/api/wishlist/add/'}`, {
        method: 'POST',
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: props.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item to wishlist');
      }

      setIsWishlisted(!isWishlisted);
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
    } finally {
      setIsWishlistUpdating(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/detail?id=${props.id}`);
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };
  

  return (
    <div 
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      className="group relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 h-56">
        <img
          src={props.image}
          alt={props.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Category Badge */}
        <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
          {props.category}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleAddToWishlist();
          }}
          disabled={isWishlistUpdating}
          className={`absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border shadow-md backdrop-blur-sm transition ${
            isWishlisted
              ? 'border-rose-200 bg-rose-500 text-white'
              : 'border-white/60 bg-white/90 text-gray-700 hover:bg-rose-50 hover:text-rose-500'
          } disabled:cursor-not-allowed disabled:opacity-80`}
          aria-label={isWishlisted ? `${props.name} added to wishlist` : `Add ${props.name} to wishlist`}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </button>

       

        
      </div>

      {/* Content Container */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-green-600 transition-colors">
          {props.name}
        </h3>

        

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
          {props.description}
        </p>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4"></div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Price */}
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Price</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {props.price}
            </span>
          </div>

          {quantity > 0 ? (
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-50 px-2 py-1">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleDecrease();
                }}
                disabled={isUpdating}
                className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={`Decrease quantity of ${props.name}`}
              >
                -
              </button>
              <span className="min-w-7 text-center text-base font-bold text-emerald-700">{quantity}</span>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleIncrease();
                }}
                disabled={isUpdating}
                className="h-9 w-9 rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={`Increase quantity of ${props.name}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleAddToCart();
              }}
              disabled={isUpdating}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z" />
              </svg>
              {isUpdating ? 'Adding...' : 'Add'}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  )
}

export default Fruitscard