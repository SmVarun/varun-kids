// ============================================
// checkout.js
// Handles checkout form, Razorpay payment,
// and saves orders to Firestore
// ============================================

// ---- YOUR RAZORPAY KEY ID ----
// Sign up free at https://razorpay.com → Settings → API Keys
const RAZORPAY_KEY_ID = "YOUR_RAZORPAY_KEY_ID"; // e.g. "rzp_test_xxxxxxxxxx"

// ---- Load order summary sidebar ----
function loadCheckoutSummary() {
  const cart = getCart();
  const listEl = document.getElementById("checkoutItemsList");
  const subtotalEl = document.getElementById("coSubtotal");
  const totalEl = document.getElementById("coTotal");
  if (!listEl) return;
  if (cart.length === 0) { window.location.href = "cart.html"; return; }
  listEl.innerHTML = "";
  let subtotal = 0;
  cart.forEach(item => {
    const itemTotal = item.price * (item.qty || 1);
    subtotal += itemTotal;
    const div = document.createElement("div");
    div.className = "checkout-item";
    div.innerHTML = `
      <img src="${item.image || 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=100&q=80'}"
        alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1522771930-78848d9293e8?w=100&q=80'" />
      <div class="checkout-item-info">
        <p class="checkout-item-name">${item.name}</p>
        <p class="checkout-item-qty">Qty: ${item.qty || 1}</p>
      </div>
      <span class="checkout-item-price">₹${itemTotal.toLocaleString("en-IN")}</span>`;
    listEl.appendChild(div);
  });
  subtotalEl.textContent = `₹${subtotal.toLocaleString("en-IN")}`;
  totalEl.textContent = `₹${subtotal.toLocaleString("en-IN")}`;
}

// ---- Validation helper ----
function validateField(id, errId, validator, errMsg) {
  const val = document.getElementById(id).value.trim();
  const errEl = document.getElementById(errId);
  if (!validator(val)) { errEl.textContent = errMsg; document.getElementById(id).style.borderColor = "#c0392b"; return false; }
  errEl.textContent = ""; document.getElementById(id).style.borderColor = ""; return true;
}

function validateDelivery() {
  let valid = true;
  valid &= validateField("fullName","nameErr", v => v.length >= 2, "Please enter your full name.");
  valid &= validateField("phone","phoneErr", v => /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number.");
  valid &= validateField("pincode","pincodeErr", v => /^\d{6}$/.test(v), "Enter a valid 6-digit pincode.");
  valid &= validateField("address","addressErr", v => v.length >= 10, "Please enter your full address.");
  valid &= validateField("city","cityErr", v => v.length >= 2, "Please enter your city.");
  const state = document.getElementById("state").value;
  if (!state) { document.getElementById("stateErr").textContent = "Please select a state."; valid = false; }
  else { document.getElementById("stateErr").textContent = ""; }
  return !!valid;
}

// ---- Step 1 → Step 2 ----
window.proceedToPayment = function() {
  if (!validateDelivery()) return;
  document.getElementById("step1Indicator").classList.add("done");
  document.getElementById("step1Indicator").classList.remove("active");
  document.getElementById("step2Indicator").classList.add("active");
  document.querySelectorAll(".step-line")[0].classList.add("done");
  const d = document.getElementById("deliveryStep");
  d.style.opacity = "0"; d.style.transform = "translateX(-20px)"; d.style.transition = "all 0.25s ease";
  setTimeout(() => {
    d.style.display = "none";
    const p = document.getElementById("paymentStep");
    p.style.display = "block"; p.style.opacity = "0"; p.style.transform = "translateX(20px)"; p.style.transition = "all 0.25s ease";
    requestAnimationFrame(() => { p.style.opacity = "1"; p.style.transform = "translateX(0)"; });
    window.scrollTo({ top: 200, behavior: "smooth" });
  }, 250);
};

// ---- Step 2 → Step 1 ----
window.goBackToDelivery = function() {
  document.getElementById("step1Indicator").classList.remove("done");
  document.getElementById("step1Indicator").classList.add("active");
  document.getElementById("step2Indicator").classList.remove("active");
  document.querySelectorAll(".step-line")[0].classList.remove("done");
  document.getElementById("paymentStep").style.display = "none";
  const d = document.getElementById("deliveryStep");
  d.style.display = "block"; d.style.opacity = "1"; d.style.transform = "translateX(0)";
};

function getDeliveryDetails() {
  return {
    name: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    address: document.getElementById("address").value.trim(),
    city: document.getElementById("city").value.trim(),
    state: document.getElementById("state").value,
    pincode: document.getElementById("pincode").value.trim(),
  };
}

// ---- Place Order ----
window.placeOrder = function() {
  const payment = document.querySelector('input[name="payment"]:checked').value;
  if (payment === "razorpay") {
    initiateRazorpay();
  } else {
    saveOrderToFirestore({ payment, paymentStatus: "pending" });
  }
};

// ============================================
// RAZORPAY
// ============================================
function initiateRazorpay() {
  const total = getCartTotal();
  const details = getDeliveryDetails();
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: total * 100, // paise
    currency: "INR",
    name: "Varun Kids",
    description: "Kids Clothing Order",
    prefill: { name: details.name, contact: details.phone, email: details.email || "" },
    notes: { address: `${details.address}, ${details.city}, ${details.state} - ${details.pincode}` },
    theme: { color: "#c8522a" },
    handler: function(response) {
      saveOrderToFirestore({
        payment: "razorpay",
        paymentStatus: "paid",
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id || "",
        razorpaySignature: response.razorpay_signature || "",
      });
    },
    modal: { ondismiss: function() { showPaymentError("Payment cancelled. Please try again."); } }
  };
  try {
    const rzp = new Razorpay(options);
    rzp.on("payment.failed", function(r) { showPaymentError("Payment failed: " + r.error.description); });
    rzp.open();
  } catch(err) {
    showPaymentError("Razorpay not loaded. Check your internet connection.");
  }
}

function showPaymentError(msg) {
  let el = document.getElementById("razorpayErr");
  if (!el) {
    el = document.createElement("p"); el.id = "razorpayErr";
    el.style.cssText = "color:#c0392b;font-size:13px;margin-top:0.75rem;text-align:center";
    document.getElementById("paymentStep").appendChild(el);
  }
  el.textContent = msg;
}

// ============================================
// SAVE ORDER TO FIRESTORE
// ============================================
async function saveOrderToFirestore(paymentInfo) {
  const details = getDeliveryDetails();
  const orderId = "VRN" + Date.now().toString().slice(-8).toUpperCase();
  const order = {
    orderId, ...details,
    payment: paymentInfo.payment,
    paymentStatus: paymentInfo.paymentStatus,
    ...(paymentInfo.razorpayPaymentId && {
      razorpayPaymentId: paymentInfo.razorpayPaymentId,
      razorpayOrderId: paymentInfo.razorpayOrderId,
      razorpaySignature: paymentInfo.razorpaySignature,
    }),
    items: getCart(),
    total: getCartTotal(),
    status: paymentInfo.paymentStatus === "paid" ? "paid" : "pending",
    placedAt: new Date().toISOString(),
  };
  try {
    const { db } = await import("./firebase-config.js");
    const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await addDoc(collection(db, "orders"), order);
    console.log("Order saved:", orderId);
  } catch(err) {
    console.warn("Could not save order:", err.message);
  }
  showConfirmation(orderId, details.name, paymentInfo.paymentStatus);
}

function showConfirmation(orderId, customerName, paymentStatus) {
  document.getElementById("step2Indicator").classList.add("done");
  document.getElementById("step2Indicator").classList.remove("active");
  document.getElementById("step3Indicator").classList.add("active");
  document.querySelectorAll(".step-line")[1].classList.add("done");
  const p = document.getElementById("paymentStep");
  p.style.opacity = "0"; p.style.transition = "opacity 0.25s ease";
  setTimeout(() => {
    p.style.display = "none";
    document.getElementById("confirmName").textContent = customerName;
    document.getElementById("orderId").textContent = orderId;
    const confirmStep = document.getElementById("confirmStep");
    if (!document.getElementById("paymentConfirmLine")) {
      const line = document.createElement("p"); line.id = "paymentConfirmLine";
      line.style.cssText = "font-size:13px;color:var(--green);font-weight:500;margin-top:0.5rem";
      line.textContent = paymentStatus === "paid" ? "✅ Payment received successfully!" : "💵 Pay at the time of delivery.";
      const orderIdEl = document.getElementById("orderId");
      orderIdEl.parentNode.insertBefore(line, orderIdEl.nextSibling);
    }
    confirmStep.style.display = "block";
    confirmStep.style.animation = "fadeInUp 0.4s ease";
    clearCart();
    const summary = document.getElementById("checkoutSummary");
    if (summary) summary.style.opacity = "0.5";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 250);
}

function attachLiveValidation() {
  [
    { id:"fullName", errId:"nameErr", validator: v => v.length >= 2, msg:"Name too short" },
    { id:"phone", errId:"phoneErr", validator: v => !v || /^[6-9]\d{0,9}$/.test(v), msg:"Invalid phone" },
    { id:"pincode", errId:"pincodeErr", validator: v => !v || /^\d{0,6}$/.test(v), msg:"Invalid pincode" },
  ].forEach(({ id, errId, validator, msg }) => {
    document.getElementById(id)?.addEventListener("input", function() {
      const el = document.getElementById(errId);
      if (!validator(this.value.trim())) { el.textContent = msg; this.style.borderColor = "#c0392b"; }
      else { el.textContent = ""; this.style.borderColor = ""; }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadCheckoutSummary();
  attachLiveValidation();
});
