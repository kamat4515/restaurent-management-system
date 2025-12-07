/* script.js — frontend-only Restaurant demo (ES6+) */
/* Features:
   - Display menu with images
   - Add/remove/change quantity in cart
   - Compute subtotal, GST (5%), total
   - Place orders saved to LocalStorage
   - View orders modal (order history)
*/

(() => {
  // ----- Data (menu with images) -----
  const MENU = [
    { id: 'm1', name: 'Margherita Pizza', desc: 'Classic cheese & tomato', price: 299, img: '1.png' },
    { id: 'm2', name: 'Veg Burger', desc: 'Veg patty, lettuce & tomato', price: 149, img: '4.jpg' },
    { id: 'm3', name: 'Paneer Butter Masala', desc: 'Creamy tomato gravy', price: 229, img: '5.jpg' },
    { id: 'm4', name: 'Garlic Naan', desc: 'Tandoor-roasted naan', price: 49, img: '2.png' },
    { id: 'm5', name: 'Coke (500ml)', desc: 'Chilled beverage', price: 49, img: '3.png' },
    { id: 'm6', name: 'Chocolate Brownie', desc: 'With ice cream', price: 129, img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=60&auto=format&fit=crop' },
  ];

  // ----- LocalStorage keys -----
  const LS_ORDERS = 'rms_orders_local_v1';

  // ----- DOM refs -----
  const $ = (s) => document.querySelector(s);
  const menuListEl = $('#menu-list');
  const cartListEl = $('#cart-list');
  const subtotalEl = $('#subtotal');
  const taxEl = $('#tax');
  const totalEl = $('#total');
  const cartCountEl = $('#cart-count');
  const ordersCountEl = $('#orders-count');
  const ordersModal = $('#orders-modal');
  const ordersListEl = $('#orders-list');

  // cart state
  let cart = []; // items: { itemId, qty }

  // ----- Helpers -----
  const findMenu = id => MENU.find(m => m.id === id);
  const formatMoney = n => Number(n).toFixed(2);

  function updateCartCount() {
    const totalQty = cart.reduce((s, c) => s + c.qty, 0);
    cartCountEl.textContent = totalQty;
  }

  // ----- Render menu -----
  function renderMenu(filter = '') {
    menuListEl.innerHTML = '';
    const f = filter.trim().toLowerCase();
    MENU.filter(m => !f || m.name.toLowerCase().includes(f) || m.desc.toLowerCase().includes(f))
      .forEach(m => {
        const card = document.createElement('div');
        card.className = 'menu-item';
        card.innerHTML = `
          <img src="${m.img}" alt="${m.name}">
          <h4>${m.name} <span>₹${formatMoney(m.price)}</span></h4>
          <p>${m.desc}</p>
          <div class="actions">
            <button class="btn btn-info" data-id="${m.id}" data-action="info">Info</button>
            <button class="btn btn-add" data-id="${m.id}" data-action="add">Add</button>
          </div>
        `;
        menuListEl.appendChild(card);
      });
  }

  // ----- Cart operations -----
  function addToCart(itemId, qty = 1) {
    const ex = cart.find(c => c.itemId === itemId);
    if (ex) ex.qty += qty;
    else cart.push({ itemId, qty });
    renderCart();
  }

  function removeFromCart(itemId) {
    cart = cart.filter(c => c.itemId !== itemId);
    renderCart();
  }

  function changeQty(itemId, qty) {
    const it = cart.find(c => c.itemId === itemId);
    if (!it) return;
    it.qty = Math.max(1, Number(qty));
    renderCart();
  }

  function computeTotals() {
    const subtotal = cart.reduce((s, c) => {
      const m = findMenu(c.itemId);
      return s + (m ? m.price * c.qty : 0);
    }, 0);
    const gst = subtotal * 0.05;
    return { subtotal, gst, total: subtotal + gst };
  }

  function renderCart() {
    cartListEl.innerHTML = '';
    if (cart.length === 0) {
      cartListEl.innerHTML = `<li style="color:var(--muted);padding:8px">Your cart is empty</li>`;
    } else {
      cart.forEach(ci => {
        const m = findMenu(ci.itemId);
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
          <div>
            <div style="font-weight:700">${m.name}</div>
            <small>₹${formatMoney(m.price)} x ${ci.qty} = ₹${formatMoney(m.price * ci.qty)}</small>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="number" min="1" value="${ci.qty}" data-id="${ci.itemId}" class="qty-input" style="width:64px;padding:6px;border-radius:6px">
            <button data-id="${ci.itemId}" class="muted remove-item">Remove</button>
          </div>
        `;
        cartListEl.appendChild(li);
      });
    }

    const t = computeTotals();
    subtotalEl.textContent = formatMoney(t.subtotal);
    taxEl.textContent = formatMoney(t.gst);
    totalEl.textContent = formatMoney(t.total);

    updateCartCount();
  }

  // ----- Orders (LocalStorage) -----
  function loadOrders() {
    try {
      return JSON.parse(localStorage.getItem(LS_ORDERS)) || [];
    } catch {
      return [];
    }
  }
  function saveOrders(list) {
    localStorage.setItem(LS_ORDERS, JSON.stringify(list));
  }
  function updateOrdersCount() {
    const orders = loadOrders();
    ordersCountEl.textContent = orders.length;
  }

  function placeOrder() {
    if (cart.length === 0) { alert('Cart is empty'); return; }
    const customer = (document.getElementById('cust-name').value || 'Guest').trim();
    const t = computeTotals();
    const order = {
      id: 'o' + Date.now(),
      customer,
      items: cart.map(c => ({ itemId: c.itemId, qty: c.qty })),
      subtotal: t.subtotal,
      gst: t.gst,
      total: t.total,
      status: 'placed',
      placedAt: new Date().toISOString()
    };
    const orders = loadOrders();
    orders.unshift(order);
    saveOrders(orders);
    cart = [];
    document.getElementById('cust-name').value = '';
    renderCart();
    updateOrdersCount();
    alert('Order placed successfully! Order ID: ' + order.id);
  }

  function renderOrdersModal() {
    const orders = loadOrders();
    ordersListEl.innerHTML = '';
    if (!orders.length) {
      ordersListEl.innerHTML = `<div style="color:var(--muted)">No orders yet.</div>`;
      return;
    }
    orders.forEach(o => {
      const div = document.createElement('div');
      div.className = 'order-card';
      const itemsHtml = o.items.map(it => {
        const m = findMenu(it.itemId) || { name: 'Unknown' };
        return `<div>${m.name} x ${it.qty}</div>`;
      }).join('');
      div.innerHTML = `
        <h4>Order ${o.id} <small style="color:var(--muted)">${new Date(o.placedAt).toLocaleString()}</small></h4>
        <div>Customer: <strong>${o.customer}</strong></div>
        <div style="margin-top:6px;color:var(--muted)">${itemsHtml}</div>
        <div style="margin-top:8px">Total: <strong>₹${formatMoney(o.total)}</strong> • Status: ${o.status}</div>
      `;
      ordersListEl.appendChild(div);
    });
  }

  // ----- Event listeners -----
  // Menu buttons (delegation)
  menuListEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'add') addToCart(id, 1);
    if (action === 'info') {
      const m = findMenu(id);
      alert(`${m.name}\n\n${m.desc}\n\nPrice: ₹${formatMoney(m.price)}`);
    }
  });

  // Cart events
  cartListEl.addEventListener('click', (e) => {
    const rem = e.target.closest('.remove-item');
    if (rem) removeFromCart(rem.dataset.id);
  });
  cartListEl.addEventListener('change', (e) => {
    const inp = e.target.closest('.qty-input');
    if (inp) changeQty(inp.dataset.id, Number(inp.value));
  });

  // Place order & clear
  $('#place-order').addEventListener('click', placeOrder);
  $('#clear-cart').addEventListener('click', () => {
    if (!confirm('Clear cart?')) return;
    cart = [];
    renderCart();
  });

  // Orders modal open/close
  $('#btn-orders').addEventListener('click', () => {
    renderOrdersModal();
    ordersModal.classList.remove('hidden');
  });
  ordersModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-modal') || e.target === ordersModal) ordersModal.classList.add('hidden');
  });

  // View cart button scrolls to cart
  $('#btn-view-cart').addEventListener('click', () => {
    document.getElementById('cart-section').scrollIntoView({ behavior: 'smooth' });
  });

  // Search
  $('#search').addEventListener('input', (e) => renderMenu(e.target.value));

  // initial render
  renderMenu();
  renderCart();
  updateOrdersCount();

  // expose small debug
  window.rms = { MENU, cart, loadOrders };
})();
