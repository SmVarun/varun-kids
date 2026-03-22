// ============================================
// products.js
// Fetches products from Firestore & renders grid
// Falls back to demo data if Firebase not configured
// ============================================

import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---- DEMO PRODUCTS (used when Firestore is not configured) ----
const DEMO_PRODUCTS = [
  {
    id: "p1",
    name: "Dino Roar Graphic T-Shirt",
    price: 399,
    mrp: 599,
    image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&q=80",
    description: "Fun dinosaur print tee in 100% soft cotton. Crew neck, short sleeves, ribbed cuffs. Machine washable. Perfect for everyday wear.",
    category: "T-Shirts",
    brand: "Little Varun",
    gender: "Boys",
    ageGroup: "4–10 years"
  },
  {
    id: "p2",
    name: "Rainbow Frill Dress",
    price: 699,
    mrp: 1099,
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf0?w=400&q=80",
    description: "Bright rainbow frill dress with smocked bodice. Breathable cotton fabric, zip-back closure. Great for parties and playdates.",
    category: "Dresses",
    brand: "Little Varun",
    gender: "Girls",
    ageGroup: "4–8 years"
  },
  {
    id: "p3",
    name: "Space Explorer Hoodie",
    price: 849,
    mrp: 1299,
    image: "https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=400&q=80",
    description: "Cosy fleece hoodie with an all-over space and rocket print. Kangaroo pocket, drawstring hood. Ideal for cool evenings.",
    category: "Winter Wear",
    brand: "Little Varun",
    gender: "Boys",
    ageGroup: "5–10 years"
  },
  {
    id: "p4",
    name: "Floral Cotton Kurti",
    price: 549,
    mrp: 849,
    image: "https://images.unsplash.com/photo-1617529497471-9218633199c0?w=400&q=80",
    description: "Soft cotton kurti with delicate floral block print and contrast hem embroidery. Easy slip-on style for festive occasions.",
    category: "Ethnic",
    brand: "Little Varun",
    gender: "Girls",
    ageGroup: "4–10 years"
  },
  {
    id: "p5",
    name: "Cargo Jogger Pants",
    price: 499,
    mrp: 749,
    image: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400&q=80",
    description: "Comfy cotton-blend joggers with side cargo pockets and adjustable waistband. Perfect for school, play, or weekends.",
    category: "Boys",
    brand: "Little Varun",
    gender: "Boys",
    ageGroup: "5–10 years"
  },
  {
    id: "p6",
    name: "Unicorn Shimmer Dress",
    price: 799,
    mrp: 1249,
    image: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&q=80",
    description: "Magical unicorn-themed shimmer dress with tulle skirt. Glitter print bodice, satin ribbon sash. The perfect birthday outfit.",
    category: "Dresses",
    brand: "Little Varun",
    gender: "Girls",
    ageGroup: "4–8 years"
  },
  {
    id: "p7",
    name: "Superhero Pyjama Set",
    price: 449,
    mrp: 699,
    image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80",
    description: "Soft jersey pyjama set with superhero badge prints. Elasticated waist, full-length bottoms and short-sleeve top.",
    category: "Nightwear",
    brand: "Little Varun",
    gender: "Boys",
    ageGroup: "4–10 years"
  },
  {
    id: "p8",
    name: "Dungaree Dress – Strawberry",
    price: 649,
    mrp: 999,
    image: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=400&q=80",
    description: "Cute strawberry-embroidered denim dungaree dress with adjustable straps. Paired with a white puff-sleeve inner.",
    category: "Girls",
    brand: "Little Varun",
    gender: "Girls",
    ageGroup: "4–8 years"
  },
  {
    id: "p9",
    name: "Classic Kurta Pyjama Set",
    price: 749,
    mrp: 1149,
    image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&q=80",
    description: "Festive kurta pyjama set in soft cotton with thread embroidery on the neckline. Available in multiple colours.",
    category: "Ethnic",
    brand: "Little Varun",
    gender: "Boys",
    ageGroup: "4–10 years"
  },
  {
    id: "p10",
    name: "Butterfly Print Nightdress",
    price: 379,
    mrp: 579,
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=80",
    description: "Lightweight cotton nightdress with allover butterfly print. Cap sleeves, knee length. Breathable and comfortable for sleep.",
    category: "Nightwear",
    brand: "Little Varun",
    gender: "Girls",
    ageGroup: "4–9 years"
  },
  {
    id: "p11",
    name: "Zip-Up Tracksuit Set",
    price: 999,
    mrp: 1499,
    image: "https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=400&q=80",
    description: "Sporty zip-up jacket and jogger set in moisture-wicking fabric. Side stripe detailing. Great for outdoor activities and sports day.",
    category: "Boys",
    brand: "Little Varun",
    gender: "Boys",
    ageGroup: "6–10 years"
  },
  {
    id: "p12",
    name: "Lehenga Choli Set",
    price: 1099,
    mrp: 1699,
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80",
    description: "Vibrant printed lehenga choli with mirror-work blouse and dupatta. Made from breathable chanderi cotton. Ideal for festivals.",
    category: "Ethnic",
    brand: "Little Varun",
    gender: "Girls",
    ageGroup: "4–10 years"
  }
];

// Global state
let allProducts = [];
let filteredProducts = [];
let activeCategory = "";
let sortOrder = "default";

// ---- Fetch products from Firestore ----
async function fetchProducts() {
  const grid = document.getElementById("productGrid");
  const loading = document.getElementById("loadingState");
  const error = document.getElementById("errorState");

  try {
    // Attempt to load from Firestore
    const querySnapshot = await getDocs(collection(db, "products"));

    if (querySnapshot.empty) {
      // Firestore collection empty → use demo data
      throw new Error("Empty collection – using demo data");
    }

    allProducts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (err) {
    // Show error notice & fall back to demo products
    console.warn("Firestore not configured or empty. Using demo products.", err.message);
    error.style.display = "block";
    allProducts = DEMO_PRODUCTS;
  } finally {
    loading.style.display = "none";
    filteredProducts = [...allProducts];
    renderProducts(filteredProducts);
  }
}

// ---- Render products into grid ----
function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  const emptyState = document.getElementById("emptyState");

  grid.innerHTML = "";

  if (products.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  products.forEach((product, index) => {
    const discount = product.mrp
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null;

    const card = document.createElement("div");
    card.className = "product-card";
    card.style.animationDelay = `${index * 0.05}s`;

    card.innerHTML = `
      <div class="product-img-wrap" onclick="goToProduct('${product.id}')">
        <img 
          src="${product.image || 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&q=80'}" 
          alt="${product.name}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&q=80'"
        />
        ${discount && discount > 0 ? `<div class="product-badge sale">${discount}% OFF</div>` : '<div class="product-badge">New</div>'}
        <button class="product-wishlist" title="Add to Wishlist">♡</button>
      </div>
      <div class="product-info">
        <p class="product-brand">${product.gender || "Kids"} · ${product.ageGroup || "4–10 yrs"}</p>
        <p class="product-name" onclick="goToProduct('${product.id}')">${product.name}</p>
        <div class="product-price-row">
          <span class="product-price">₹${product.price.toLocaleString("en-IN")}</span>
          ${product.mrp ? `<span class="product-mrp">₹${product.mrp.toLocaleString("en-IN")}</span>` : ""}
          ${discount && discount > 0 ? `<span class="product-discount">(${discount}% off)</span>` : ""}
        </div>
        <button class="btn-add-to-cart" onclick="addToCartFromGrid(event, '${product.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
          Add to Cart
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ---- Navigate to product detail page ----
window.goToProduct = function(id) {
  window.location.href = `product.html?id=${id}`;
};

// ---- Add to cart from grid (without navigation) ----
window.addToCartFromGrid = function(event, id) {
  event.stopPropagation(); // Prevent card click navigation
  const product = allProducts.find(p => p.id === id);
  if (product) {
    addToCart(product);
    showGridToast(event.target);
  }
};

// ---- Mini toast on grid add ----
function showGridToast(btn) {
  const original = btn.innerHTML;
  btn.textContent = "✓ Added!";
  btn.style.background = "#2e7d45";
  setTimeout(() => {
    btn.innerHTML = original;
    btn.style.background = "";
  }, 1200);
}

// ---- Filter by category ----
window.filterByCategory = function(category) {
  activeCategory = category;
  applyFilters();
};

// ---- Filter by search text ----
window.filterProducts = function() {
  applyFilters();
};

// ---- Sort products ----
window.sortProducts = function() {
  sortOrder = document.getElementById("sortSelect").value;
  applyFilters();
};

// ---- Apply both filters and sort ----
function applyFilters() {
  const query = (document.getElementById("searchInput")?.value || "").toLowerCase();

  filteredProducts = allProducts.filter(p => {
    const matchCat = !activeCategory || p.category === activeCategory;
    const matchSearch = !query ||
      p.name.toLowerCase().includes(query) ||
      (p.brand || "").toLowerCase().includes(query) ||
      (p.category || "").toLowerCase().includes(query);
    return matchCat && matchSearch;
  });

  // Apply sort
  if (sortOrder === "price-asc") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === "price-desc") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortOrder === "name") {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Update section title to reflect filter
  const title = document.getElementById("trending");
  if (activeCategory) {
    title.textContent = activeCategory;
  } else if (query) {
    title.textContent = `Results for "${query}"`;
  } else {
    title.textContent = "Popular with Little Ones";
  }

  renderProducts(filteredProducts);
}

// ---- Reset all filters ----
window.resetFilters = function() {
  activeCategory = "";
  sortOrder = "default";
  const search = document.getElementById("searchInput");
  if (search) search.value = "";
  const sort = document.getElementById("sortSelect");
  if (sort) sort.value = "default";
  filteredProducts = [...allProducts];
  renderProducts(filteredProducts);
};

// ---- Toggle search bar ----
window.toggleSearch = function() {
  const bar = document.getElementById("searchBar");
  bar.classList.toggle("open");
  if (bar.classList.contains("open")) {
    document.getElementById("searchInput")?.focus();
  }
};

// ---- Kick off on page load ----
fetchProducts();
