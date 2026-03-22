// ============================================
// cart-page.js
// Renders and manages the cart page UI
// ============================================

// Valid coupon codes
const COUPONS = {
  "VARUN10": 10,   // 10% off
  "STYLE20": 20,   // 20% off
  "FIRST50": 50,   // ₹50 flat off
};

let appliedDiscount = 0;
let discountType = "percent"; // "percent" or "flat"

// ---- Render cart page ----
function renderCartPage() {
  const cart = getCart();
  const emptyCart = document.getElementById("emptyCart");
  const cartLayout = document.getElementById("cartLayout");
  const container = document.getElementById("cartItemsContainer");

  if (cart.length === 0) {
    emptyCart.style.display = "block";
    cartLayout.style.display = "none";
    return;
  }

  emptyCart.style.display = "none";
  cartLayout.style.display = "grid";
  container.innerHTML = "";

  cart.forEach(item => {
    const itemTotal = item.price * (item.qty || 1);
    const div = document.createElement("div");
    div.className = "cart-item";
    div.id = `cart-item-${item.id}`;

    div.innerHTML = `
      <img 
        class="cart-item-img" 
        src="${item.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&q=80'}" 
        alt="${item.name}"
        onerror="this.src='https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&q=80'"
      />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-desc">${item.brand || ""} ${item.description ? "· " + item.description.substring(0, 60) + "…" : ""}</p>
        <p class="cart-item-price">₹${itemTotal.toLocaleString("en-IN")}</p>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
          <span class="qty-val" id="qty-${item.id}">${item.qty || 1}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
          <button class="cart-item-remove" onclick="removeItem('${item.id}')">Remove</button>
        </div>
      </div>
    `;

    container.appendChild(div);
  });

  updateSummary();
}

// ---- Update quantity and re-render ----
window.changeQty = function(id, delta) {
  updateQty(id, delta);
  renderCartPage(); // Full re-render after qty change
  reapplyDiscount();
};

// ---- Remove item with animation ----
window.removeItem = function(id) {
  const el = document.getElementById(`cart-item-${id}`);
  if (el) {
    el.style.opacity = "0";
    el.style.transform = "translateX(30px)";
    el.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    setTimeout(() => {
      removeFromCart(id);
      renderCartPage();
      reapplyDiscount();
    }, 250);
  }
};

// ---- Update order summary panel ----
function updateSummary() {
  const cart = getCart();
  const subtotal = getCartTotal();
  const itemCount = getCartCount();

  document.getElementById("itemCount").textContent = itemCount;
  document.getElementById("subtotalAmt").textContent = `₹${subtotal.toLocaleString("en-IN")}`;

  // Delivery
  const delivery = subtotal >= 999 ? "FREE" : "₹99";
  const deliveryEl = document.getElementById("deliveryAmt");
  deliveryEl.textContent = delivery;
  deliveryEl.className = subtotal >= 999 ? "green" : "";

  // Discount
  const discountAmt = calcDiscount(subtotal);
  const discountRow = document.getElementById("discountRow");
  if (discountAmt > 0) {
    discountRow.style.display = "flex";
    document.getElementById("discountAmt").textContent = `-₹${discountAmt.toLocaleString("en-IN")}`;
  } else {
    discountRow.style.display = "none";
  }

  // Total
  const deliveryCharge = subtotal >= 999 ? 0 : 99;
  const total = subtotal - discountAmt + deliveryCharge;
  document.getElementById("totalAmt").textContent = `₹${total.toLocaleString("en-IN")}`;

  // Savings note
  const savingsNote = document.getElementById("savingsNote");
  const totalSaved = (cart.reduce((s, i) => s + ((i.mrp || i.price) - i.price) * (i.qty || 1), 0)) + discountAmt;
  if (totalSaved > 0) {
    savingsNote.textContent = `🎉 You're saving ₹${totalSaved.toLocaleString("en-IN")} on this order!`;
  } else {
    savingsNote.textContent = "";
  }
}

// ---- Calculate discount based on applied coupon ----
function calcDiscount(subtotal) {
  if (!appliedDiscount) return 0;
  if (discountType === "percent") {
    return Math.round(subtotal * appliedDiscount / 100);
  } else {
    return Math.min(appliedDiscount, subtotal);
  }
}

function reapplyDiscount() {
  updateSummary();
}

// ---- Apply coupon code ----
window.applyCoupon = function() {
  const input = document.getElementById("couponInput").value.trim().toUpperCase();
  const msg = document.getElementById("couponMsg");

  if (!input) {
    msg.textContent = "Please enter a coupon code.";
    msg.className = "coupon-msg err";
    return;
  }

  if (COUPONS[input] !== undefined) {
    const value = COUPONS[input];
    if (input === "FIRST50") {
      appliedDiscount = 50;
      discountType = "flat";
      msg.textContent = `✓ Coupon applied! ₹50 off on your order.`;
    } else {
      appliedDiscount = value;
      discountType = "percent";
      msg.textContent = `✓ Coupon applied! ${value}% off on your order.`;
    }
    msg.className = "coupon-msg ok";
    updateSummary();
  } else {
    appliedDiscount = 0;
    msg.textContent = "✗ Invalid coupon code. Try VARUN10, STYLE20, or FIRST50.";
    msg.className = "coupon-msg err";
    updateSummary();
  }
};

// ---- Init cart page ----
document.addEventListener("DOMContentLoaded", renderCartPage);
