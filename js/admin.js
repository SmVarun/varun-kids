// ============================================
// admin.js
// Admin Panel – Products CRUD + Orders View
// ============================================

import { db } from "./firebase-config.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---- ADMIN PASSWORD (change this to your own) ----
const ADMIN_PASSWORD = "varun@admin";
const ADMIN_SESSION_KEY = "varun_admin_session";

// ---- State ----
let allAdminProducts = [];
let allOrders = [];
let editingProductId = null; // null = adding new, string = editing

// ============================================
// AUTH
// ============================================

window.adminLogin = function () {
  const pwd = document.getElementById("adminPassword").value;
  const err = document.getElementById("loginErr");
  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("adminDashboard").style.display = "flex";
    initAdmin();
  } else {
    err.textContent = "Incorrect password. Please try again.";
    document.getElementById("adminPassword").style.borderColor = "#c0392b";
  }
};

window.adminLogout = function () {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  document.getElementById("adminDashboard").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("adminPassword").value = "";
};

// Check session on load
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("adminDashboard").style.display = "flex";
    initAdmin();
  }
});

// ============================================
// INIT
// ============================================

async function initAdmin() {
  await Promise.all([loadProducts(), loadOrders()]);
  updateStats();
}

// ============================================
// TAB NAVIGATION
// ============================================

window.showTab = function (tabName, el) {
  // Hide all tabs
  document.querySelectorAll(".admin-tab").forEach(t => t.style.display = "none");
  // Remove active from all nav items
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  // Show selected tab
  document.getElementById(`tab-${tabName}`).style.display = "block";
  // Mark active
  if (el) el.classList.add("active");
};

// ============================================
// PRODUCTS – LOAD
// ============================================

async function loadProducts() {
  try {
    const snap = await getDocs(collection(db, "products"));
    allAdminProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProductsTable(allAdminProducts);
  } catch (err) {
    console.error("Error loading products:", err);
    showAdminToast("⚠️ Could not load products from Firebase.", "error");
  } finally {
    document.getElementById("adminProductsLoading").style.display = "none";
    document.getElementById("productsTableWrap").style.display = "block";
  }
}

// ============================================
// PRODUCTS – RENDER TABLE
// ============================================

function renderProductsTable(products) {
  const tbody = document.getElementById("productsTableBody");
  const noMsg = document.getElementById("noProductsMsg");
  tbody.innerHTML = "";

  if (products.length === 0) {
    noMsg.style.display = "block";
    document.getElementById("productsTableWrap").style.display = "none";
    return;
  }
  noMsg.style.display = "none";
  document.getElementById("productsTableWrap").style.display = "block";

  products.forEach(p => {
    const discount = p.mrp && p.mrp > p.price
      ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
      : null;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <img src="${p.image || ''}" alt="${p.name}"
          onerror="this.style.background='#eee';this.src=''" />
      </td>
      <td>
        <p class="table-name">${p.name}</p>
        <p style="font-size:11px;color:var(--text-muted)">${p.ageGroup || ""}</p>
      </td>
      <td>${p.category || "—"}</td>
      <td>${p.gender || "—"}</td>
      <td class="table-price">₹${(p.price || 0).toLocaleString("en-IN")}
        ${discount ? `<br/><span style="font-size:10px;color:var(--green);font-weight:600">${discount}% off</span>` : ""}
      </td>
      <td class="table-mrp">₹${(p.mrp || 0).toLocaleString("en-IN")}</td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" onclick="openProductModal('${p.id}')">✏️ Edit</button>
          <button class="btn-danger" onclick="confirmDelete('${p.id}', '${p.name.replace(/'/g, "\\'")}')">🗑️ Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================
// PRODUCTS – FILTER
// ============================================

window.filterAdminProducts = function () {
  const query = document.getElementById("productSearch").value.toLowerCase();
  const cat = document.getElementById("productCategoryFilter").value;

  const filtered = allAdminProducts.filter(p => {
    const matchSearch = !query ||
      p.name.toLowerCase().includes(query) ||
      (p.brand || "").toLowerCase().includes(query);
    const matchCat = !cat || p.category === cat;
    return matchSearch && matchCat;
  });

  renderProductsTable(filtered);
};

// ============================================
// PRODUCTS – ADD / EDIT MODAL
// ============================================

window.openProductModal = function (productId = null) {
  editingProductId = productId;
  const modal = document.getElementById("productModal");
  const title = document.getElementById("modalTitle");

  // Clear form
  clearProductForm();

  if (productId) {
    // Edit mode – prefill form
    title.textContent = "Edit Product";
    document.getElementById("saveProductBtn").textContent = "Update Product";
    const p = allAdminProducts.find(x => x.id === productId);
    if (p) {
      document.getElementById("pName").value = p.name || "";
      document.getElementById("pPrice").value = p.price || "";
      document.getElementById("pMrp").value = p.mrp || "";
      document.getElementById("pCategory").value = p.category || "";
      document.getElementById("pGender").value = p.gender || "";
      document.getElementById("pAgeGroup").value = p.ageGroup || "";
      document.getElementById("pBrand").value = p.brand || "";
      document.getElementById("pImage").value = p.image || "";
      document.getElementById("pDesc").value = p.description || "";
      previewImage();
    }
  } else {
    title.textContent = "Add New Product";
    document.getElementById("saveProductBtn").textContent = "Save Product";
  }

  modal.style.display = "flex";
};

window.closeProductModal = function () {
  document.getElementById("productModal").style.display = "none";
  editingProductId = null;
  clearProductForm();
};

function clearProductForm() {
  ["pName","pPrice","pMrp","pAgeGroup","pBrand","pImage","pDesc"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("pCategory").value = "";
  document.getElementById("pGender").value = "";
  document.getElementById("imagePreviewWrap").style.display = "none";
  ["pNameErr","pPriceErr","pCategoryErr","pImageErr"].forEach(id => {
    document.getElementById(id).textContent = "";
  });
}

// ---- Image preview ----
window.previewImage = function () {
  const url = document.getElementById("pImage").value.trim();
  const wrap = document.getElementById("imagePreviewWrap");
  const img = document.getElementById("imagePreview");
  if (url) {
    img.src = url;
    wrap.style.display = "block";
    img.onerror = () => { wrap.style.display = "none"; };
  } else {
    wrap.style.display = "none";
  }
};

// ---- Validate product form ----
function validateProductForm() {
  let valid = true;
  const name = document.getElementById("pName").value.trim();
  const price = document.getElementById("pPrice").value.trim();
  const category = document.getElementById("pCategory").value;
  const image = document.getElementById("pImage").value.trim();

  if (name.length < 2) {
    document.getElementById("pNameErr").textContent = "Product name is required.";
    valid = false;
  } else {
    document.getElementById("pNameErr").textContent = "";
  }

  if (!price || isNaN(price) || Number(price) <= 0) {
    document.getElementById("pPriceErr").textContent = "Enter a valid price.";
    valid = false;
  } else {
    document.getElementById("pPriceErr").textContent = "";
  }

  if (!category) {
    document.getElementById("pCategoryErr").textContent = "Select a category.";
    valid = false;
  } else {
    document.getElementById("pCategoryErr").textContent = "";
  }

  if (!image) {
    document.getElementById("pImageErr").textContent = "Image URL is required.";
    valid = false;
  } else {
    document.getElementById("pImageErr").textContent = "";
  }

  return valid;
}

// ============================================
// PRODUCTS – SAVE (ADD or UPDATE)
// ============================================

window.saveProduct = async function () {
  if (!validateProductForm()) return;

  const btn = document.getElementById("saveProductBtn");
  btn.textContent = "Saving...";
  btn.disabled = true;

  const productData = {
    name: document.getElementById("pName").value.trim(),
    price: Number(document.getElementById("pPrice").value),
    mrp: Number(document.getElementById("pMrp").value) || null,
    category: document.getElementById("pCategory").value,
    gender: document.getElementById("pGender").value,
    ageGroup: document.getElementById("pAgeGroup").value.trim() || "4–10 years",
    brand: document.getElementById("pBrand").value.trim() || "Little Varun",
    image: document.getElementById("pImage").value.trim(),
    description: document.getElementById("pDesc").value.trim(),
    updatedAt: serverTimestamp()
  };

  try {
    if (editingProductId) {
      // Update existing
      await updateDoc(doc(db, "products", editingProductId), productData);
      showAdminToast("✅ Product updated successfully!");
    } else {
      // Add new
      productData.createdAt = serverTimestamp();
      await addDoc(collection(db, "products"), productData);
      showAdminToast("✅ Product added successfully!");
    }

    closeProductModal();
    await loadProducts();
    updateStats();

  } catch (err) {
    console.error("Error saving product:", err);
    showAdminToast("❌ Error saving product. Check Firebase rules.", "error");
  } finally {
    btn.textContent = editingProductId ? "Update Product" : "Save Product";
    btn.disabled = false;
  }
};

// ============================================
// PRODUCTS – DELETE
// ============================================

window.confirmDelete = function (id, name) {
  document.getElementById("deleteProductName").textContent = name;
  document.getElementById("deleteModal").style.display = "flex";
  document.getElementById("confirmDeleteBtn").onclick = () => deleteProduct(id);
};

async function deleteProduct(id) {
  try {
    await deleteDoc(doc(db, "products", id));
    document.getElementById("deleteModal").style.display = "none";
    showAdminToast("🗑️ Product deleted.");
    await loadProducts();
    updateStats();
  } catch (err) {
    console.error("Error deleting:", err);
    showAdminToast("❌ Could not delete product.", "error");
  }
}

// ============================================
// ORDERS – LOAD
// ============================================

async function loadOrders() {
  try {
    const q = query(collection(db, "orders"), orderBy("placedAt", "desc"));
    const snap = await getDocs(q);
    allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOrdersTable(allOrders);
  } catch (err) {
    // Orders collection may not exist yet
    allOrders = [];
    console.warn("No orders yet or error:", err.message);
  } finally {
    document.getElementById("ordersLoading").style.display = "none";
    document.getElementById("ordersTableWrap").style.display = "block";
    if (allOrders.length === 0) {
      document.getElementById("noOrdersMsg").style.display = "block";
      document.getElementById("ordersTableWrap").style.display = "none";
    }
  }
}

// ============================================
// ORDERS – RENDER TABLE
// ============================================

function renderOrdersTable(orders) {
  const tbody = document.getElementById("ordersTableBody");
  const noMsg = document.getElementById("noOrdersMsg");
  tbody.innerHTML = "";

  if (orders.length === 0) {
    noMsg.style.display = "block";
    document.getElementById("ordersTableWrap").style.display = "none";
    return;
  }
  noMsg.style.display = "none";
  document.getElementById("ordersTableWrap").style.display = "block";

  orders.forEach(order => {
    const date = order.placedAt?.toDate
      ? order.placedAt.toDate().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
      : order.placedAt
        ? new Date(order.placedAt).toLocaleDateString("en-IN")
        : "—";

    const statusBadge = getStatusBadge(order.status || (order.paymentStatus === "paid" ? "paid" : "pending"));
    const paymentLabel = order.payment === "cod" ? "Cash on Delivery"
      : order.payment === "razorpay" ? "Razorpay (Online)"
      : order.payment || "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:600;font-size:12px">${order.orderId || order.id.slice(0,8).toUpperCase()}</td>
      <td>${order.name || "—"}</td>
      <td>${order.phone || "—"}</td>
      <td>${(order.items || []).length} item(s)</td>
      <td class="table-price">₹${(order.total || 0).toLocaleString("en-IN")}</td>
      <td style="font-size:12px">${paymentLabel}</td>
      <td>${statusBadge}</td>
      <td style="font-size:12px;white-space:nowrap">${date}</td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" onclick="viewOrder('${order.id}')">👁️ View</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getStatusBadge(status) {
  const map = {
    paid: '<span class="badge badge-paid">Paid</span>',
    cod: '<span class="badge badge-cod">COD</span>',
    pending: '<span class="badge badge-pending">Pending</span>',
    delivered: '<span class="badge badge-delivered">Delivered</span>',
    cancelled: '<span class="badge badge-cancelled">Cancelled</span>',
  };
  return map[status] || `<span class="badge badge-pending">${status}</span>`;
}

// ============================================
// ORDERS – FILTER
// ============================================

window.filterOrders = function () {
  const filter = document.getElementById("orderStatusFilter").value;
  const filtered = !filter ? allOrders : allOrders.filter(o => {
    if (filter === "paid") return o.paymentStatus === "paid" || o.payment === "razorpay";
    if (filter === "cod") return o.payment === "cod";
    if (filter === "pending") return !o.paymentStatus || o.paymentStatus === "pending";
    return true;
  });
  renderOrdersTable(filtered);
};

// ============================================
// ORDERS – VIEW DETAIL
// ============================================

window.viewOrder = function (orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const date = order.placedAt?.toDate
    ? order.placedAt.toDate().toLocaleString("en-IN")
    : order.placedAt ? new Date(order.placedAt).toLocaleString("en-IN") : "—";

  const itemsHtml = (order.items || []).map(item => `
    <div class="order-item-row">
      <img src="${item.image || ''}" alt="${item.name}" onerror="this.style.display='none'" />
      <span class="name">${item.name}</span>
      <span class="qty">x${item.qty || 1}</span>
      <span class="price">₹${(item.price * (item.qty || 1)).toLocaleString("en-IN")}</span>
    </div>
  `).join("");

  document.getElementById("orderModalBody").innerHTML = `
    <div class="order-detail-grid">
      <div class="order-detail-field"><label>Order ID</label><p>${order.orderId || order.id}</p></div>
      <div class="order-detail-field"><label>Date</label><p>${date}</p></div>
      <div class="order-detail-field"><label>Customer</label><p>${order.name}</p></div>
      <div class="order-detail-field"><label>Phone</label><p>${order.phone}</p></div>
      <div class="order-detail-field"><label>Email</label><p>${order.email || "—"}</p></div>
      <div class="order-detail-field"><label>Payment</label><p>${order.payment === "cod" ? "Cash on Delivery" : "Razorpay (Online)"}</p></div>
      <div class="order-detail-field full" style="grid-column:1/-1"><label>Address</label><p>${order.address}, ${order.city}, ${order.state} – ${order.pincode}</p></div>
    </div>
    <h3 style="font-family:var(--font-serif);font-size:16px;margin-bottom:0.75rem">Items Ordered</h3>
    <div class="order-items-list">${itemsHtml}</div>
    <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-weight:600">
      <span>Total</span>
      <span>₹${(order.total || 0).toLocaleString("en-IN")}</span>
    </div>
    <div class="status-update">
      <select id="statusSelect">
        <option value="pending" ${(order.status || "pending") === "pending" ? "selected" : ""}>Pending</option>
        <option value="paid" ${order.status === "paid" ? "selected" : ""}>Paid</option>
        <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Delivered</option>
        <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelled</option>
      </select>
      <button class="btn-primary" style="padding:8px 16px;font-size:12px" onclick="updateOrderStatus('${orderId}')">Update Status</button>
    </div>
  `;

  document.getElementById("orderModal").style.display = "flex";
};

window.updateOrderStatus = async function (orderId) {
  const status = document.getElementById("statusSelect").value;
  try {
    await updateDoc(doc(db, "orders", orderId), { status });
    showAdminToast("✅ Order status updated!");
    document.getElementById("orderModal").style.display = "none";
    await loadOrders();
    updateStats();
  } catch (err) {
    showAdminToast("❌ Could not update status.", "error");
  }
};

// ============================================
// STATS
// ============================================

function updateStats() {
  document.getElementById("statProducts").textContent = allAdminProducts.length;
  document.getElementById("statOrders").textContent = allOrders.length;

  const revenue = allOrders.reduce((sum, o) => {
    if (o.paymentStatus === "paid" || o.payment === "razorpay") return sum + (o.total || 0);
    return sum;
  }, 0);
  document.getElementById("statRevenue").textContent = `₹${revenue.toLocaleString("en-IN")}`;

  const paid = allOrders.filter(o => o.paymentStatus === "paid" || o.payment === "razorpay").length;
  document.getElementById("statPaid").textContent = paid;

  // Recent orders in stats tab
  const recentEl = document.getElementById("recentOrdersList");
  if (allOrders.length === 0) {
    recentEl.innerHTML = '<p class="empty-msg">No orders yet.</p>';
    return;
  }
  const recent = allOrders.slice(0, 5);
  recentEl.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
      <tbody>${recent.map(o => `
        <tr>
          <td style="font-weight:600;font-size:12px">${o.orderId || o.id.slice(0,8)}</td>
          <td>${o.name}</td>
          <td class="table-price">₹${(o.total||0).toLocaleString("en-IN")}</td>
          <td style="font-size:12px">${o.payment === "cod" ? "COD" : "Online"}</td>
          <td>${getStatusBadge(o.status || "pending")}</td>
        </tr>
      `).join("")}</tbody>
    </table>
  `;
}

// ============================================
// HELPERS
// ============================================

window.closeModalOnOverlay = function (e) {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.style.display = "none";
  }
};

function showAdminToast(msg, type = "success") {
  const toast = document.getElementById("adminToast");
  toast.textContent = msg;
  toast.style.background = type === "error" ? "#c0392b" : "#1a2a4a";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
