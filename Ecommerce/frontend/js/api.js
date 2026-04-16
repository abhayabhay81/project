const API_BASE = 'http://localhost:5000/api';

// ─── Token management ───
const getToken = () => localStorage.getItem('nexus_token');
const getUser = () => {
  const u = localStorage.getItem('nexus_user');
  return u ? JSON.parse(u) : null;
};

// ─── API helper ───
async function apiRequest(method, path, body = null, authRequired = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (authRequired) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    throw err;
  }
}

// ─── Auth ───
const Auth = {
  register: (name, email, password) => apiRequest('POST', '/auth/register', { name, email, password }),
  login: (email, password) => apiRequest('POST', '/auth/login', { email, password }),
  verify: () => apiRequest('GET', '/auth/verify', null, true),
  logout: () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    updateNavAuth();
    updateCartBadge();
  },
  isLoggedIn: () => !!getToken(),
  saveSession: (token, user) => {
    localStorage.setItem('nexus_token', token);
    localStorage.setItem('nexus_user', JSON.stringify(user));
  }
};

// ─── Products ───
const Products = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest('GET', `/products?${q}`);
  },
  getById: (id) => apiRequest('GET', `/products/${id}`)
};

// ─── Cart ───
const Cart = {
  get: () => apiRequest('GET', '/cart', null, true),
  add: (productId, quantity = 1) => apiRequest('POST', '/cart', { productId, quantity }, true),
  update: (productId, quantity) => apiRequest('PUT', `/cart/${productId}`, { quantity }, true),
  remove: (productId) => apiRequest('DELETE', `/cart/${productId}`, null, true),
  clear: () => apiRequest('DELETE', '/cart', null, true)
};

// ─── Orders ───
const Orders = {
  getAll: () => apiRequest('GET', '/orders', null, true),
  getById: (id) => apiRequest('GET', `/orders/${id}`, null, true),
  place: (shippingAddress, paymentMethod) => apiRequest('POST', '/orders', { shippingAddress, paymentMethod }, true)
};

// ─── Toast Notifications ───
let toastContainer;
function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(message, type = 'info', duration = 3500) {
  const container = ensureToastContainer();
  const icons = { success: '✅', error: '❌', info: '💜' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Navbar Auth UI ───
function updateNavAuth() {
  const user = getUser();
  const authEl = document.getElementById('nav-auth');
  if (!authEl) return;

  if (user) {
    authEl.innerHTML = `
      <span style="color:var(--text-secondary);font-size:0.85rem">Hi, <strong style="color:var(--text-primary)">${user.name.split(' ')[0]}</strong></span>
      <a href="orders.html" class="btn-nav-auth btn-outline">My Orders</a>
      <button onclick="Auth.logout(); location.reload();" class="btn-nav-auth btn-outline">Logout</button>
    `;
  } else {
    authEl.innerHTML = `
      <a href="login.html" class="btn-nav-auth btn-outline">Login</a>
      <a href="register.html" class="btn-nav-auth btn-primary-sm">Sign Up</a>
    `;
  }
}

// ─── Cart Badge ───
async function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  if (!Auth.isLoggedIn()) { badge.classList.add('hidden'); return; }
  try {
    const data = await Cart.get();
    if (data.itemCount > 0) {
      badge.textContent = data.itemCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch {
    badge.classList.add('hidden');
  }
}

// ─── Star Rating ───
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '★'.repeat(full);
  if (half) stars += '½';
  stars += '☆'.repeat(5 - full - (half ? 1 : 0));
  return stars;
}

// ─── Price Format ───
function formatPrice(price) {
  return '₹' + price.toLocaleString('en-IN');
}

// ─── Discount % ───
function calcDiscount(original, current) {
  return Math.round((1 - current / original) * 100);
}

// ─── Badge HTML ───
function getBadgeHtml(badge) {
  if (!badge) return '';
  const map = {
    'Best Seller': 'bestseller',
    'New': 'new',
    'Hot': 'hot',
    'Sale': 'sale',
    'Top Rated': 'toprated'
  };
  const cls = map[badge] || 'new';
  return `<span class="product-badge badge-${cls}">${badge}</span>`;
}

// ─── Product Card HTML ───
function buildProductCard(p) {
  return `
    <div class="product-card" onclick="window.location='product.html?id=${p.id}'">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300/16181f/7c4dff?text=Product'">
        ${getBadgeHtml(p.badge)}
        <button class="product-wishlist" onclick="event.stopPropagation(); showToast('Added to wishlist!', 'success')">♡</button>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span class="rating-count">(${p.reviews})</span>
        </div>
        <div class="product-price-row">
          <span class="price-current">${formatPrice(p.price)}</span>
          ${p.originalPrice ? `<span class="price-original">${formatPrice(p.originalPrice)}</span>` : ''}
          ${p.originalPrice ? `<span class="price-discount">-${calcDiscount(p.originalPrice, p.price)}%</span>` : ''}
        </div>
      </div>
      <div class="product-actions" onclick="event.stopPropagation()">
        <button class="btn-add-cart" onclick="addToCartFromCard('${p.id}', this)">
          🛒 Add to Cart
        </button>
        <button class="btn-view-detail" onclick="window.location='product.html?id=${p.id}'">→</button>
      </div>
    </div>
  `;
}

// ─── Add to Cart from card ───
async function addToCartFromCard(productId, btn) {
  if (!Auth.isLoggedIn()) {
    showToast('Please login to add items to cart', 'error');
    setTimeout(() => window.location = 'login.html', 1500);
    return;
  }
  const original = btn.innerHTML;
  btn.innerHTML = '<span class="loader"></span>';
  btn.disabled = true;
  try {
    await Cart.add(productId);
    btn.innerHTML = '✓ Added!';
    btn.style.background = 'var(--success-bg)';
    btn.style.color = 'var(--success)';
    showToast('Added to cart!', 'success');
    updateCartBadge();
    setTimeout(() => {
      btn.innerHTML = original;
      btn.style.background = '';
      btn.style.color = '';
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    showToast(err.message, 'error');
    btn.innerHTML = original;
    btn.disabled = false;
  }
}

// On every page load, update nav
document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  updateCartBadge();
});
