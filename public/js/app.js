/* eslint-env browser */
/* ShopVerse storefront - talks to the Express REST API */
(function () {
  'use strict';

  var sessionId = localStorage.getItem('shopverse-session') || 'web-' + Math.random().toString(36).slice(2);
  localStorage.setItem('shopverse-session', sessionId);

  function api(path, options) {
    return fetch(path, Object.assign({
      headers: { 'content-type': 'application/json', 'x-session-id': sessionId }
    }, options || {})).then(function (res) {
      return res.status === 204 ? null : res.json();
    });
  }

  var money = function (n) { return '₹' + n.toLocaleString('en-IN'); };

  function loadProducts() {
    var search = document.getElementById('search').value;
    var category = document.getElementById('category').value;
    var qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (category) qs.set('category', category);

    api('/api/products?' + qs.toString()).then(function (data) {
      document.getElementById('products').innerHTML = data.items.map(function (p) {
        return '<article class="card">'
          + '<div class="icon">' + p.image + '</div>'
          + '<div class="name">' + p.name + '</div>'
          + '<div>' + p.brand + ' &middot; ' + p.category + '</div>'
          + '<div class="price">' + money(p.price) + '</div>'
          + '<div class="stock">' + p.stock + ' in stock &middot; ★ ' + p.rating + '</div>'
          + '<button data-add="' + p.id + '">Add to cart</button>'
          + '</article>';
      }).join('') || '<p>No products match your search.</p>';
    });
  }

  function loadCart() {
    return api('/api/cart').then(function (cart) {
      document.getElementById('cart-count').textContent = cart.itemCount;
      document.getElementById('cart-items').innerHTML = cart.items.length
        ? cart.items.map(function (i) {
            return '<div class="line"><span>' + i.image + ' ' + i.name + ' × ' + i.qty
              + '<small> ' + money(i.unitPrice) + ' each</small></span>'
              + '<span>' + money(i.lineTotal)
              + ' <button class="remove" data-rm="' + i.productId + '">✕</button></span></div>';
          }).join('')
        : '<p>Your cart is empty.</p>';

      var p = cart.pricing;
      document.getElementById('cart-total').innerHTML =
        '<p>Subtotal: ' + money(p.subtotal) + '</p>'
        + '<p>Shipping: ' + money(p.shipping) + '</p>'
        + '<p>Tax (5%): ' + money(p.tax) + '</p>'
        + (p.discount ? '<p style="color:#4ade80">Discount: -' + money(p.discount) + '</p>' : '')
        + '<h3>Total: ' + money(p.total) + '</h3>';
    });
  }

  document.addEventListener('click', function (e) {
    var add = e.target.dataset && e.target.dataset.add;
    var rm = e.target.dataset && e.target.dataset.rm;

    if (add) {
      api('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId: add, qty: 1 }) })
        .then(function () { return loadCart(); });
    }
    if (rm) {
      api('/api/cart/items/' + rm, { method: 'DELETE' }).then(function () { return loadCart(); });
    }
    if (e.target.id === 'cart-btn') {
      document.getElementById('cart-panel').classList.remove('hidden');
      loadCart();
    }
    if (e.target.id === 'close-cart') {
      document.getElementById('cart-panel').classList.add('hidden');
    }
    if (e.target.id === 'checkout') {
      api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: { name: 'Web Customer', email: 'customer@example.com', address: 'Demo Address' },
          paymentMethod: 'COD'
        })
      }).then(function (order) {
        if (order.error) return alert(order.message);
        alert('Order placed: ' + order.id);
        document.getElementById('cart-panel').classList.add('hidden');
        loadCart();
      });
    }
  });

  api('/api/products/categories').then(function (d) {
    d.categories.forEach(function (c) {
      var o = document.createElement('option');
      o.value = o.textContent = c;
      document.getElementById('category').appendChild(o);
    });
  });

  document.getElementById('search').addEventListener('input', loadProducts);
  document.getElementById('category').addEventListener('change', loadProducts);

  loadProducts();
  loadCart();
})();
