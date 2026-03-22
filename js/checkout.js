// ============================================
// checkout.js
// Handles checkout form, validation, and order
// ============================================

// ---- Load order summary sidebar ----
function loadCheckoutSummary() {
  const cart = getCart();
  const listEl = document.getElementById("checkoutItemsList");
  const subtotalEl = document.getElementById("coSubtotal");
  const totalEl = document.getElementById("coTotal");

  if (!listEl) return;

  // If cart is empty, redirect
  if (cart.length === 0) {
    window.location.href = "cart.html";
    return;
  }

  listEl.innerHTML = "";
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * (item.qty || 1);
    subtotal += itemTotal;

    const div = document.createElement("div");
    div.className = "checkout-item";
    div.innerHTML = `
      <img 
        src="${item.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&q=80'}" 
        alt="${item.name}"
        onerror="this.src='https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&q=80'"
      />
      <div class="checkout-item-info">
        <p class="checkout-item-name">${item.name}</p>
        <p class="checkout-item-qty">Qty: ${item.qty || 1}</p>
      </div>
      <span class="checkout-item-price">₹${itemTotal.toLocaleString("en-IN")}</span>
    `;
    listEl.appendChild(div);
  });

  subtotalEl.textContent = `₹${subtotal.toLocaleString("en-IN")}`;
  totalEl.textContent = `₹${subtotal.toLocaleString("en-IN")}`;
}

// ---- Input validation helpers ----
function validateField(id, errId, validator, errMsg) {
  const val = document.getElementById(id).value.trim();
  const errEl = document.getElementById(errId);
  if (!validator(val)) {
    errEl.textContent = errMsg;
    document.getElementById(id).style.borderColor = "#c0392b";
    return false;
  }
  errEl.textContent = "";
  document.getElementById(id).style.borderColor = "";
  return true;
}

// ---- Validate all delivery fields ----
function validateDelivery() {
  let valid = true;

  valid &= validateField("fullName", "nameErr",
    v => v.length >= 2,
    "Please enter your full name.");

  valid &= validateField("phone", "phoneErr",
    v => /^[6-9]\d{9}$/.test(v),
    "Enter a valid 10-digit Indian mobile number.");

  valid &= validateField("pincode", "pincodeErr",
    v => /^\d{6}$/.test(v),
    "Enter a valid 6-digit pincode.");

  valid &= validateField("address", "addressErr",
    v => v.length >= 10,
    "Please enter your full address.");

  valid &= validateField("city", "cityErr",
    v => v.length >= 2,
    "Please enter your city.");

  const state = document.getElementById("state").value;
  const stateErr = document.getElementById("stateErr");
  if (!state) {
    stateErr.textContent = "Please select a state.";
    valid = false;
  } else {
    stateErr.textContent = "";
  }

  return !!valid;
}

// ---- Step 1 → Step 2: Delivery to Payment ----
window.proceedToPayment = function() {
  if (!validateDelivery()) return;

  // Update step indicators
  document.getElementById("step1Indicator").classList.add("done");
  document.getElementById("step1Indicator").classList.remove("active");
  document.getElementById("step2Indicator").classList.add("active");
  document.querySelectorAll(".step-line")[0].classList.add("done");

  // Swap cards with smooth transition
  const deliveryStep = document.getElementById("deliveryStep");
  deliveryStep.style.opacity = "0";
  deliveryStep.style.transform = "translateX(-20px)";
  deliveryStep.style.transition = "all 0.25s ease";

  setTimeout(() => {
    deliveryStep.style.display = "none";
    const paymentStep = document.getElementById("paymentStep");
    paymentStep.style.display = "block";
    paymentStep.style.opacity = "0";
    paymentStep.style.transform = "translateX(20px)";
    paymentStep.style.transition = "all 0.25s ease";
    requestAnimationFrame(() => {
      paymentStep.style.opacity = "1";
      paymentStep.style.transform = "translateX(0)";
    });

    // Scroll to top of checkout
    window.scrollTo({ top: 200, behavior: "smooth" });
  }, 250);
};

// ---- Step 2 → Step 1: Back ----
window.goBackToDelivery = function() {
  document.getElementById("step1Indicator").classList.remove("done");
  document.getElementById("step1Indicator").classList.add("active");
  document.getElementById("step2Indicator").classList.remove("active");
  document.querySelectorAll(".step-line")[0].classList.remove("done");

  document.getElementById("paymentStep").style.display = "none";
  document.getElementById("deliveryStep").style.display = "block";
  document.getElementById("deliveryStep").style.opacity = "1";
  document.getElementById("deliveryStep").style.transform = "translateX(0)";
};

// ---- Step 2 → Step 3: Place order ----
window.placeOrder = function() {
  // Gather order details
  const name = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const city = document.getElementById("city").value.trim();
  const state = document.getElementById("state").value;
  const pincode = document.getElementById("pincode").value.trim();
  const payment = document.querySelector('input[name="payment"]:checked').value;

  // Build order object (in production, save to Firestore / backend)
  const order = {
    orderId: "VRN" + Date.now().toString().slice(-8).toUpperCase(),
    name, phone, address, city, state, pincode,
    payment,
    items: getCart(),
    total: getCartTotal(),
    placedAt: new Date().toISOString()
  };

  console.log("Order placed:", order); // In production: save to Firestore

  // Update step indicators
  document.getElementById("step2Indicator").classList.add("done");
  document.getElementById("step2Indicator").classList.remove("active");
  document.getElementById("step3Indicator").classList.add("active");
  document.querySelectorAll(".step-line")[1].classList.add("done");

  // Show confirmation step
  const paymentStep = document.getElementById("paymentStep");
  paymentStep.style.opacity = "0";
  paymentStep.style.transition = "opacity 0.25s ease";

  setTimeout(() => {
    paymentStep.style.display = "none";

    // Populate confirmation
    document.getElementById("confirmName").textContent = name;
    document.getElementById("orderId").textContent = order.orderId;

    const confirmStep = document.getElementById("confirmStep");
    confirmStep.style.display = "block";
    confirmStep.style.animation = "fadeInUp 0.4s ease";

    // Clear cart
    clearCart();

    // Hide summary on mobile
    const summary = document.getElementById("checkoutSummary");
    if (summary) summary.style.opacity = "0.5";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 250);
};

// ---- Real-time input feedback ----
function attachLiveValidation() {
  const fields = [
    { id: "fullName", errId: "nameErr", validator: v => v.length >= 2, msg: "Name too short" },
    { id: "phone", errId: "phoneErr", validator: v => !v || /^[6-9]\d{0,9}$/.test(v), msg: "Invalid phone" },
    { id: "pincode", errId: "pincodeErr", validator: v => !v || /^\d{0,6}$/.test(v), msg: "Invalid pincode" },
  ];

  fields.forEach(({ id, errId, validator, msg }) => {
    document.getElementById(id)?.addEventListener("input", function() {
      const errEl = document.getElementById(errId);
      if (!validator(this.value.trim())) {
        errEl.textContent = msg;
        this.style.borderColor = "#c0392b";
      } else {
        errEl.textContent = "";
        this.style.borderColor = "";
      }
    });
  });
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  loadCheckoutSummary();
  attachLiveValidation();
});
