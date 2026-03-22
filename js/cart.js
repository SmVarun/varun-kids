// ============================================
// cart.js
// Shared cart utilities using localStorage
// Included on every page
// ============================================

const CART_KEY = "varun_cart";

// ---- Get cart from localStorage ----
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

// ---- Save cart to localStorage ----
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ---- Add item to cart (or increment qty if exists) ----
function addToCart(product) {
  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.id === product.id);

  if (existingIndex >= 0) {
    // Already in cart – increase quantity
    cart[existingIndex].qty = (cart[existingIndex].qty || 1) + 1;
  } else {
    // New item
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp || null,
      image: product.image || "",
      description: product.description || "",
      brand: product.brand || "",
      qty: 1
    });
  }

  saveCart(cart);
  updateCartBadge();
}

// ---- Remove item from cart ----
function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  updateCartBadge();
}

// ---- Update item quantity ----
function updateQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty = (item.qty || 1) + delta;

  if (item.qty <= 0) {
    // Remove item if qty drops to 0
    removeFromCart(productId);
    return;
  }

  saveCart(cart);
  updateCartBadge();
}

// ---- Get total item count ----
function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.qty || 1), 0);
}

// ---- Get cart subtotal ----
function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
}

// ---- Update navbar cart badge ----
function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;

  const count = getCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";

  // Bump animation
  badge.classList.remove("bump");
  void badge.offsetWidth; // Reflow to restart animation
  badge.classList.add("bump");
}

// ---- Clear cart ----
function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

// ---- Expose globally ----
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQty = updateQty;
window.getCart = getCart;
window.getCartTotal = getCartTotal;
window.getCartCount = getCartCount;
window.clearCart = clearCart;

// ---- Initialize badge on load ----
document.addEventListener("DOMContentLoaded", updateCartBadge);
