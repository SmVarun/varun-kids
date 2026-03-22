// ============================================
// product-detail.js
// Loads a single product and populates PDP
// ============================================

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---- Demo products (mirrors products.js for fallback) ----
const DEMO_PRODUCTS = {
  p1:  { id:"p1",  name:"Dino Roar Graphic T-Shirt",    price:399,  mrp:599,  image:"https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80",   description:"Fun dinosaur print tee in 100% soft cotton. Crew neck, short sleeves, ribbed cuffs. Machine washable. Perfect for everyday wear.", category:"T-Shirts", brand:"Little Varun", gender:"Boys", ageGroup:"4–10 years" },
  p2:  { id:"p2",  name:"Rainbow Frill Dress",           price:699,  mrp:1099, image:"https://images.unsplash.com/photo-1518831959646-742c3a14ebf0?w=600&q=80",   description:"Bright rainbow frill dress with smocked bodice. Breathable cotton fabric, zip-back closure. Great for parties and playdates.", category:"Dresses", brand:"Little Varun", gender:"Girls", ageGroup:"4–8 years" },
  p3:  { id:"p3",  name:"Space Explorer Hoodie",         price:849,  mrp:1299, image:"https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=600&q=80",   description:"Cosy fleece hoodie with an all-over space and rocket print. Kangaroo pocket, drawstring hood. Ideal for cool evenings.", category:"Winter Wear", brand:"Little Varun", gender:"Boys", ageGroup:"5–10 years" },
  p4:  { id:"p4",  name:"Floral Cotton Kurti",           price:549,  mrp:849,  image:"https://images.unsplash.com/photo-1617529497471-9218633199c0?w=600&q=80",   description:"Soft cotton kurti with delicate floral block print and contrast hem embroidery. Easy slip-on style for festive occasions.", category:"Ethnic", brand:"Little Varun", gender:"Girls", ageGroup:"4–10 years" },
  p5:  { id:"p5",  name:"Cargo Jogger Pants",            price:499,  mrp:749,  image:"https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&q=80",   description:"Comfy cotton-blend joggers with side cargo pockets and adjustable waistband. Perfect for school, play, or weekends.", category:"Boys", brand:"Little Varun", gender:"Boys", ageGroup:"5–10 years" },
  p6:  { id:"p6",  name:"Unicorn Shimmer Dress",         price:799,  mrp:1249, image:"https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600&q=80",   description:"Magical unicorn-themed shimmer dress with tulle skirt. Glitter print bodice, satin ribbon sash. The perfect birthday outfit.", category:"Dresses", brand:"Little Varun", gender:"Girls", ageGroup:"4–8 years" },
  p7:  { id:"p7",  name:"Superhero Pyjama Set",          price:449,  mrp:699,  image:"https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80",   description:"Soft jersey pyjama set with superhero badge prints. Elasticated waist, full-length bottoms and short-sleeve top.", category:"Nightwear", brand:"Little Varun", gender:"Boys", ageGroup:"4–10 years" },
  p8:  { id:"p8",  name:"Dungaree Dress – Strawberry",   price:649,  mrp:999,  image:"https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&q=80",   description:"Cute strawberry-embroidered denim dungaree dress with adjustable straps. Paired with a white puff-sleeve inner.", category:"Girls", brand:"Little Varun", gender:"Girls", ageGroup:"4–8 years" },
  p9:  { id:"p9",  name:"Classic Kurta Pyjama Set",      price:749,  mrp:1149, image:"https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600&q=80",   description:"Festive kurta pyjama set in soft cotton with thread embroidery on the neckline. Available in multiple colours.", category:"Ethnic", brand:"Little Varun", gender:"Boys", ageGroup:"4–10 years" },
  p10: { id:"p10", name:"Butterfly Print Nightdress",    price:379,  mrp:579,  image:"https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80",   description:"Lightweight cotton nightdress with allover butterfly print. Cap sleeves, knee length. Breathable and comfortable for sleep.", category:"Nightwear", brand:"Little Varun", gender:"Girls", ageGroup:"4–9 years" },
  p11: { id:"p11", name:"Zip-Up Tracksuit Set",          price:999,  mrp:1499, image:"https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=600&q=80",   description:"Sporty zip-up jacket and jogger set in moisture-wicking fabric. Side stripe detailing. Great for outdoor activities and sports day.", category:"Boys", brand:"Little Varun", gender:"Boys", ageGroup:"6–10 years" },
  p12: { id:"p12", name:"Lehenga Choli Set",             price:1099, mrp:1699, image:"https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80",   description:"Vibrant printed lehenga choli with mirror-work blouse and dupatta. Made from breathable chanderi cotton. Ideal for festivals.", category:"Ethnic", brand:"Little Varun", gender:"Girls", ageGroup:"4–10 years" },
};

// Current product stored globally so the add-to-cart button can access it
let currentProduct = null;

// ---- Load product on page init ----
async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    window.location.href = "index.html";
    return;
  }

  try {
    // Try Firestore first
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      currentProduct = { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Not in Firestore, checking demo data");
    }
  } catch (err) {
    // Fall back to demo product
    console.warn("Using demo product:", err.message);
    currentProduct = DEMO_PRODUCTS[productId] || null;
  }

  if (!currentProduct) {
    // Product not found at all
    document.getElementById("pdpLoading").innerHTML = `
      <p style="color:#c0392b">Product not found. <a href="index.html" style="color:var(--accent)">← Back to Home</a></p>
    `;
    return;
  }

  renderProduct(currentProduct);
}

// ---- Render the PDP ----
function renderProduct(product) {
  // Hide loader, show layout
  document.getElementById("pdpLoading").style.display = "none";
  document.getElementById("pdpLayout").style.display = "grid";

  // Page title
  document.title = `${product.name} – Varun`;

  // Breadcrumb
  document.getElementById("breadcrumbName").textContent = product.name;

  // Image
  const img = document.getElementById("pdpImage");
  img.src = product.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80";
  img.alt = product.name;
  img.onerror = () => { img.src = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80"; };

  // Text fields
  document.getElementById("pdpCategory").textContent = `${product.gender || "Kids"} · ${product.ageGroup || "4–10 yrs"} · ${product.category || ""}`;
  document.getElementById("pdpName").textContent = product.name;
  document.getElementById("pdpPrice").textContent = `₹${product.price.toLocaleString("en-IN")}`;
  document.getElementById("pdpDesc").textContent = product.description || "No description available.";

  // MRP and discount
  if (product.mrp && product.mrp > product.price) {
    const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
    document.getElementById("pdpMrp").textContent = `₹${product.mrp.toLocaleString("en-IN")}`;
    document.getElementById("pdpDiscount").textContent = `(${discount}% off)`;
  }
}

// ---- Add current product to cart ----
window.addCurrentToCart = function() {
  if (!currentProduct) return;

  addToCart(currentProduct);

  // Show toast
  const toast = document.getElementById("toast");
  toast.textContent = `✓ "${currentProduct.name}" added to cart!`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);

  // Visual feedback on button
  const btn = document.getElementById("addToCartBtn");
  btn.textContent = "✓ Added to Cart!";
  btn.style.background = "#2e7d45";
  setTimeout(() => {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg> Add to Cart`;
    btn.style.background = "";
  }, 1500);
};

// ---- Size chip selection ----
document.querySelectorAll(".size-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".size-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
  });
});

// ---- Init ----
loadProduct();
