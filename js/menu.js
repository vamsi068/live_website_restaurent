/* ============================================
   menu.js — Final Merged Version
   Restaurant POS Menu System
   ============================================ */

// =======================
// DATA & HELPERS
// =======================
let menuItems = JSON.parse(localStorage.getItem("menuItems")) || [
  // {
  //   id: generateId(),
  //   name: "Classic Burger",
  //   category: "Food",
  //   subcategory: "Burger",
  //   variants: [
  //     { qty: "1", price: 120 },
  //     { qty: "2", price: 200 }
  //   ]
  // },
  // {
  //   id: generateId(),
  //   name: "Chicken Pizza",
  //   category: "Food",
  //   subcategory: "Pizza",
  //   variants: [
  //     { qty: "1", price: 250 },
  //     { qty: "2", price: 480 }
  //   ]
  // }
];

let cart = [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let editIndex = -1;
let selectedCategory = null;
let currentVariants = [];
let lastCategory = localStorage.getItem("lastCategory") || "";
let lastSubcategory = localStorage.getItem("lastSubcategory") || "";


// Generate small random IDs for stability
function generateId() {
  return "id_" + Math.random().toString(36).slice(2, 9);
}

// Save menuItems safely
function saveMenuItems() {
  localStorage.setItem("menuItems", JSON.stringify(menuItems));
}

// Escape HTML for safe display
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// =======================
// RENDER CATEGORIES
// =======================
function renderCategories() {
  const catList = document.getElementById("categoryList");
  if (!catList) return;
  catList.innerHTML = "";

  const cats = {};
  menuItems.forEach((i) => {
    if (!cats[i.category]) cats[i.category] = new Set();
    cats[i.category].add(i.subcategory);
  });

  Object.keys(cats).forEach((cat) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = cat;
    span.style.fontWeight = "600";
    li.appendChild(span);

    const subUl = document.createElement("ul");
    subUl.className = "subcat-list";
    cats[cat].forEach((sub) => {
      const subLi = document.createElement("li");
      subLi.textContent = sub;
      subLi.onclick = (e) => {
        e.stopPropagation();
        selectedCategory = { cat, sub };
        renderMenu();
      };
      subUl.appendChild(subLi);
    });

    li.appendChild(subUl);
span.onclick = () => {
  // Collapse all other expanded categories first
  document.querySelectorAll("#categoryList li.expanded").forEach((el) => {
    if (el !== li) el.classList.remove("expanded");
  });
  // Toggle the clicked one
  li.classList.toggle("expanded");
};
    catList.appendChild(li);
  });
}

// =======================
// RENDER MENU
// =======================
function renderMenu() {
  const container = document.getElementById("menuItems");
  if (!container) return;
  container.innerHTML = "";

  let items = selectedCategory
    ? menuItems.filter((i) => i.category === selectedCategory.cat)
    : menuItems;

  if (items.length === 0) {
    container.innerHTML = "<p>No items available</p>";
    return;
  }

  // Group items by category and subcategory
  const grouped = {};
  items.forEach((i) => {
    if (!grouped[i.category]) grouped[i.category] = {};
    if (!grouped[i.category][i.subcategory])
      grouped[i.category][i.subcategory] = [];
    grouped[i.category][i.subcategory].push(i);
  });

  // Render
  for (let cat in grouped) {
    const catDiv = document.createElement("div");
    catDiv.className = "category-section";

    const catHeader = document.createElement("h3");
    catHeader.textContent = cat;
    catDiv.appendChild(catHeader);

    for (let sub in grouped[cat]) {
      const subRow = document.createElement("div");
      subRow.className = "subcategory-row";

      // Subcategory name (left side)
      const subHeader = document.createElement("div");
      subHeader.className = "subcategory-name";
      subHeader.textContent = sub;
      subRow.appendChild(subHeader);

      // Items (right side)
      const itemContainer = document.createElement("div");
      itemContainer.className = "subcategory-grid";
      itemContainer.dataset.cat = cat;
      itemContainer.dataset.sub = sub;

      grouped[cat][sub].forEach((item) => {
        const card = document.createElement("div");
        card.className = "menu-item";
        card.dataset.id = item.id;
        card.draggable = true;

        card.innerHTML = `
          <h4>${escapeHtml(item.name)}</h4>
          <div class="quantity-options">
            ${
              item.variants && item.variants.length > 0
                ? item.variants.length === 1
                  ? `
                    <button class="add-to-cart-btn"
                      data-id="${item.id}"
                      data-name="${escapeHtml(item.name)}"
                      data-price="${parseFloat(item.variants[0].price)}"
                      data-qty="">
                      ₹${parseFloat(item.variants[0].price)}
                    </button>`
                  : item.variants
                      .map(
                        (v) => `
                      <button class="add-to-cart-btn"
                        data-id="${item.id}"
                        data-name="${escapeHtml(item.name)}"
                        data-price="${parseFloat(v.price)}"
                        data-qty="${escapeHtml(v.qty)}">
                        ${escapeHtml(v.qty)} - ₹${parseFloat(v.price)}
                      </button>`
                      )
                      .join("")
                : `
                  <button class="add-to-cart-btn"
                    data-id="${item.id}"
                    data-name="${escapeHtml(item.name)}"
                    data-price="${item.price || 0}"
                    data-qty="">
                    ₹${item.price || 0}
                  </button>`
            }
          </div>

          <div class="card-actions">
            <button class="edit-btn" data-id="${item.id}">Edit</button>
            <button class="delete-btn" data-id="${item.id}">Delete</button>
          </div>
        `;

        itemContainer.appendChild(card);
      });

      subRow.appendChild(itemContainer);
      catDiv.appendChild(subRow);
    }

    container.appendChild(catDiv);
  }

  enableDragDrop();
}


// =======================
// DRAG & DROP
// =======================
function enableDragDrop() {
  const items = document.querySelectorAll(".menu-item");
  const grids = document.querySelectorAll(".subcategory-grid");
  let dragged = null;

  items.forEach((it) => {
    it.addEventListener("dragstart", (e) => {
      dragged = it;
      it.classList.add("dragging");
      e.dataTransfer?.setData?.("text/plain", it.dataset.id || "");
    });

    it.addEventListener("dragend", () => {
      it.classList.remove("dragging");
      saveMenuItems();
      renderCategories();
      renderMenu();
    });
  });

  grids.forEach((grid) => {
    grid.addEventListener("dragover", (e) => {
      e.preventDefault();
      const after = getAfterElement(grid, e.clientY);
      if (!after) grid.appendChild(dragged);
      else grid.insertBefore(dragged, after);
    });

    grid.addEventListener("drop", (e) => {
      e.preventDefault();
      const id =
        dragged?.dataset?.id || e.dataTransfer?.getData?.("text/plain");
      const item = menuItems.find((mi) => mi.id === id);
      if (!item) return;
      item.category = grid.dataset.cat;
      item.subcategory = grid.dataset.sub;
      saveMenuItems();
      renderCategories();
      renderMenu();
    });
  });

  function getAfterElement(container, y) {
    const els = [...container.querySelectorAll(".menu-item:not(.dragging)")];
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    els.forEach((child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset)
        closest = { offset, element: child };
    });
    return closest.element;
  }
}

// =======================
// CART
// =======================
function addToCart(item) {
  const key = item.name + "_" + item.variantQty;
  const existing = cart.find((c) => c.key === key);
  if (existing) existing.qty++;
  else cart.push({ ...item, key, qty: 1 });
  renderCart();
}

function updateQty(key, delta) {
  const it = cart.find((c) => c.key === key);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) cart = cart.filter((c) => c.key !== key);
  renderCart();
}

function renderCart() {
  const list = document.getElementById("cartList");
  if (!list) return;
  list.innerHTML = "";

  let subtotal = 0;
  cart.forEach((c) => {
    subtotal += c.price * c.qty;

    const li = document.createElement("li");
    li.className = "cart-item";

    li.innerHTML = `
      <div class="cart-info">
        <span class="cart-name">${escapeHtml(c.name)}</span>
        <small class="cart-variant">(${escapeHtml(c.variantQty) || "Regular"})</small>
      </div>
      <div class="cart-controls">
        <button class="qty-btn" onclick="updateQty('${c.key}',-1)">-</button>
        <span class="cart-qty">${c.qty}</span>
        <button class="qty-btn" onclick="updateQty('${c.key}',1)">+</button>
        <span class="cart-price">₹${c.price * c.qty}</span>
        <button class="remove-btn" onclick="removeFromCart('${c.key}')">🗑</button>
      </div>
    `;

    list.appendChild(li);
  });

  const discount =
    parseFloat(document.getElementById("discountInput")?.value || 0) || 0;
  document.getElementById("cartSubtotal").textContent = subtotal;
  document.getElementById("cartDiscount").textContent = discount;
  document.getElementById("cartTotal").textContent = Math.max(
    0,
    subtotal - discount
  );
}

function removeFromCart(key) {
  cart = cart.filter((c) => c.key !== key);
  renderCart();
}


document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "discountInput") renderCart();
});

// =======================
// MODAL (Add/Edit)
// =======================
const modal = document.getElementById("menuModal");

function renderVariantInputs() {
  const box = document.getElementById("variantList");
  if (!box) return;
  box.innerHTML = "";
  currentVariants.forEach((v, i) => {
    const row = document.createElement("div");
    row.innerHTML = `
      <input type="text" value="${escapeHtml(v.qty)}" placeholder="Qty" class="var-qty"/>
      <input type="number" value="${parseFloat(v.price) || 0}" placeholder="Price ₹" class="var-price"/>
      <input type="text" id="customerMobile" placeholder="Optional" maxlength="10" />
      <button type="button" class="remove-variant" data-i="${i}">✕</button>
    `;
    box.appendChild(row);
  });

  box.querySelectorAll(".remove-variant").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.i);
      currentVariants.splice(i, 1);
      renderVariantInputs();
    });
  });
}
 


function openAddModal() {
  editIndex = -1;
  currentVariants = [];

  document.getElementById("newItemName").value = "";
  document.getElementById("newItemCategory").value = "";
  document.getElementById("newItemSubcategory").value = "";

  renderVariantInputs();
   document.querySelectorAll(".dropdown-list").forEach(d => d.classList.remove("visible"));
  modal.style.display = "block";
}



function editMenuItemById(id) {
  const idx = menuItems.findIndex((m) => m.id === id);
  if (idx === -1) return;
  editIndex = idx;
  const it = menuItems[idx];
  document.getElementById("newItemName").value = it.name;
  document.getElementById("newItemCategory").value = it.category;
  document.getElementById("newItemSubcategory").value = it.subcategory;
  currentVariants = JSON.parse(JSON.stringify(it.variants || []));
  renderVariantInputs();
  modal.style.display = "block";
}

function deleteMenuItemById(id) {
  if (!confirm("Delete this item?")) return;
  menuItems = menuItems.filter((m) => m.id !== id);
  saveMenuItems();
  renderCategories();
  renderMenu();
}

// =======================
// EVENT HANDLERS
// =======================
document.addEventListener("click", (e) => {
  const t = e.target;

  if (t.classList.contains("add-to-cart-btn")) {
    const name = t.dataset.name;
    const price = parseFloat(t.dataset.price);
    const qty = t.dataset.qty;
    addToCart({ name, price, variantQty: qty });
    return;
  }

  document.addEventListener("input", (e) => {
    if (e.target.id === "newItemCategory") {
      lastCategory = e.target.value.trim();
      localStorage.setItem("lastCategory", lastCategory);
    }

    if (e.target.id === "newItemSubcategory") {
      lastSubcategory = e.target.value.trim();
      localStorage.setItem("lastSubcategory", lastSubcategory);
    }
  });



  if (t.classList.contains("edit-btn")) {
    editMenuItemById(t.dataset.id);
    return;
  }

  if (t.classList.contains("delete-btn")) {
    deleteMenuItemById(t.dataset.id);
    return;
  }

  if (t.id === "addVariantBtn") {
    const rows = document.querySelectorAll("#variantList div");
    const variants = [];
    rows.forEach((r) => {
      const qty = r.querySelector(".var-qty")?.value.trim();
      const price = parseFloat(r.querySelector(".var-price")?.value);
      if (qty && !isNaN(price)) variants.push({ qty, price });
    });
    currentVariants = variants;
    currentVariants.push({ qty: "", price: 0 });
    renderVariantInputs();
    return;
  }

  if (t.id === "saveMenuItem") {
  const name = document.getElementById("newItemName").value?.trim();
  const cat = document.getElementById("newItemCategory").value?.trim();
  const sub = document.getElementById("newItemSubcategory").value?.trim();

  const rows = document.querySelectorAll("#variantList div");
  const variants = Array.from(rows)
    .map((r) => {
      const qty = r.querySelector(".var-qty")?.value?.trim();
      const price = parseFloat(r.querySelector(".var-price")?.value);
      return qty && !isNaN(price) ? { qty, price } : null;
    })
    .filter(Boolean);

  if (!name) return alert("Please enter item name");
  if (!cat) return alert("Please enter category");
  if (!sub) return alert("Please enter subcategory");
// Variants are now optional
// Variants optional: if none, store price directly
// let basePrice = 0;
// if (variants.length === 0) {
//   basePrice = parseFloat(prompt("Enter item price (₹):", "0")) || 0;
// }
let basePrice = parseFloat(document.getElementById("newItemPrice")?.value || 0);



const newItem = {
  id: editIndex >= 0 ? menuItems[editIndex].id : generateId(),
  name,
  category: cat,
  subcategory: sub,
  variants,
  price: basePrice || (variants[0]?.price ?? 0)
};

  if (editIndex >= 0) {
    menuItems[editIndex] = newItem;
  } else {
    menuItems.push(newItem);
  }

  saveMenuItems();
  lastCategory = cat;
lastSubcategory = sub;
localStorage.setItem("lastCategory", lastCategory);
localStorage.setItem("lastSubcategory", lastSubcategory);
  modal.style.display = "none";
  renderCategories();
  renderMenu();
}


  if (t.id === "closeModal" || t.classList.contains("close")) {
    modal.style.display = "none";
    return;
  }

  if (t.id === "clearMenuBtn") {
    if (confirm("Are you sure you want to delete ALL menu items?")) {
      menuItems = [];
      localStorage.removeItem("menuItems");
      selectedCategory = null;
      renderCategories();
      renderMenu();
      alert("All menu items cleared!");
    }
    return;
  }

  if (t.id === "addMenuBtn") {
    openAddModal();
    return;
  }
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// =======================
// PRINT + SAVE
// =======================
function saveOrder(type) {
  if (cart.length === 0) {
    alert("Cart is empty!");
    return false;
  }

  const subtotal = parseFloat(document.getElementById("cartSubtotal").textContent);
  const discount = parseFloat(document.getElementById("cartDiscount").textContent);
  const total = parseFloat(document.getElementById("cartTotal").textContent);
  const table = document.getElementById("tableSelect").value || "N/A";

  const customerName = document.getElementById("orderCustomerName")?.value.trim() || "";
const customerMobile = document.getElementById("orderCustomerMobile")?.value.trim() || "";

const newOrder = {
    id: generateId(),
    type,
    table,
    customerName,
    customerMobile,  // ✅ stored as "customerMobile"
    items: [...cart],
    subtotal,
    discount,
    total,
   date: new Date().toISOString(),
};


  orders.push(newOrder);
  localStorage.setItem("orders", JSON.stringify(orders));

  // Reset cart after saving
  cart = [];
  renderCart();

  // Update previous orders section
  renderPreviousOrders();

  return newOrder;
}

function printKOT() {
  if (cart.length === 0) return alert("Cart is empty!");

  const order = saveOrder("KOT");

  // ✅ Maintain persistent KOT counter
  let kotCount = parseInt(localStorage.getItem("kotCount") || "0", 10);
  kotCount++;
  localStorage.setItem("kotCount", kotCount);

  const now = new Date(order.date);
  const dateStr = now.toLocaleDateString("en-GB");
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const LINE_WIDTH = 42;
  const makeLine = (char = "-") => char.repeat(LINE_WIDTH);
  const centerText = (text) => {
    const pad = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2.5));
    return " ".repeat(pad) + text;
  };

  let kotText = "";

  kotText += centerText("Street Magic") + "\n\n"; // ✅ Centered header
  kotText += `Date: ${dateStr}    ${timeStr}\n`;
  kotText += `KOT No: ${kotCount}\n`;
  kotText += makeLine() + "\n";
  kotText += "No.  Item                      Qty\n";
  kotText += makeLine() + "\n";

  order.items.forEach((item, index) => {
    const no = (index + 1).toString().padEnd(3, " ");
    const name = item.name.length > 20 ? item.name.slice(0, 20) : item.name.padEnd(20, " ");
    const qty = item.qty.toString().padStart(8, " ");
    kotText += `${no}  ${name}${qty}\n`;
  });

  kotText += makeLine() + "\n";
  kotText += `Total Items: ${order.items.length}   Quantity: ${order.items.reduce((a, b) => a + b.qty, 0)}\n`;
  kotText += makeLine() + "\n";
  kotText += centerText("Thank You!"); // ✅ Centered footer

  const printWin = window.open("", "KOT", "width=400,height=600");
  printWin.document.write(`
    <html>
      <head>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            white-space: pre;
            line-height: 1.3;
          }
          pre {
            margin: 0;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <pre>${kotText}</pre>
      </body>
    </html>
  `);
  printWin.document.close();
  printWin.focus();
  printWin.print();
  printWin.close();

  alert(`KOT #${kotCount} printed successfully!`);
}






function printBill() {
  if (cart.length === 0) return alert("Cart is empty!");

  const order = saveOrder("BILL");
  let text = `
Street Magic Restaurant
----------------------------
BILL RECEIPT (${order.type})
----------------------------
Date: ${order.date}
Table: ${order.table}
----------------------------
`;

  order.items.forEach(
    (c) =>
      (text += `${c.name} (${c.variantQty}) - ₹${c.price} x ${c.qty} = ₹${c.price * c.qty}\n`)
  );

  text += `
----------------------------
Subtotal: ₹${order.subtotal}
Discount: ₹${order.discount}
Total: ₹${order.total}
----------------------------
Thank you! Visit again!
`;

  const win = window.open("", "Bill", "width=400,height=600");
  win.document.write(`<pre>${text}</pre>`);
  win.print();
  win.close();
  alert("Bill saved successfully!");
}

// =======================
// PREVIOUS ORDERS
// =======================
function renderPreviousOrders() {
  const container = document.getElementById("previousOrder");
  if (!container) return;
  container.innerHTML = "";

  if (orders.length === 0) {
    container.innerHTML = "<p>No previous orders yet</p>";
    return;
  }

  // Show only the latest order
  const o = orders[orders.length - 1];

  const date = new Date(o.date);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString();

  const card = document.createElement("div");
  card.className = "previous-order-card";

  let html = `
    <h4 class="prev-title">Previous Bill</h4>
    <hr>
    <p><strong>Date:</strong> ${dateStr} | <strong>Time:</strong> ${timeStr}</p>
${o.customerName ? `<p><strong>Name:</strong> ${escapeHtml(o.customerName)}</p>` : ""}
${o.customerMobile ? `<p><strong>Mobile:</strong> ${escapeHtml(o.customerMobile)}</p>` : ""}

    <div class="prev-items">
  `;

  o.items.forEach((it) => {
    html += `
      <div class="prev-row">
        <span>${escapeHtml(it.name)} x${it.qty}</span>
        <span>₹${(it.price * it.qty).toFixed(2)}</span>
      </div>
    `;
  });

  html += `
    </div>
    <hr>
    <p class="prev-total"><strong>Total:</strong> ₹${o.total.toFixed(2)}</p>
  `;

  card.innerHTML = html;
  container.appendChild(card);
}


// =======================
// INIT
// =======================
window.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderMenu();
  renderCart();
  renderPreviousOrders();

  document.getElementById("kotBtn").addEventListener("click", printKOT);
  document.getElementById("printBtn").addEventListener("click", printBill);
});

// =======================
// SAVED CATEGORY & SUBCATEGORY TOGGLE
// =======================
function getAllCategories() {
  const cats = [...new Set(menuItems.map(i => i.category))];
  if (lastCategory && !cats.includes(lastCategory)) cats.push(lastCategory);
  return cats.filter(Boolean);
}

function getAllSubcategories() {
  const subs = [...new Set(menuItems.map(i => i.subcategory))];
  if (lastSubcategory && !subs.includes(lastSubcategory)) subs.push(lastSubcategory);
  return subs.filter(Boolean);
}

function renderDropdown(dropdownDiv, items, inputField) {
  dropdownDiv.innerHTML = "";
  if (items.length === 0) {
    dropdownDiv.innerHTML = `<div style="color:#777;padding:6px;">No saved items</div>`;
    return;
  }

  items.forEach((it) => {
    const div = document.createElement("div");
    div.textContent = it;
    div.addEventListener("click", () => {
      inputField.value = it;
      dropdownDiv.classList.remove("visible");

      if(inputField.id === "newItemCategory") {
        lastCategory = it;
        localStorage.setItem("lastCategory", lastCategory);
      } else if(inputField.id === "newItemSubcategory") {
        lastSubcategory = it;
        localStorage.setItem("lastSubcategory", lastSubcategory);
      }
    });
    dropdownDiv.appendChild(div);
  });
}

// Show dropdown on input focus
document.getElementById("newItemCategory").addEventListener("focus", (e) => {
  const dropdown = document.getElementById("categoryDropdown");
  dropdown.classList.add("visible");
  renderDropdown(dropdown, getAllCategories(), e.target);
});

document.getElementById("newItemSubcategory").addEventListener("focus", (e) => {
  const dropdown = document.getElementById("subcategoryDropdown");
  dropdown.classList.add("visible");
  renderDropdown(dropdown, getAllSubcategories(), e.target);
});

// Hide dropdown when clicking outside
window.addEventListener("click", (e) => {
  if (!e.target.closest(".input-wrapper")) {
    document.querySelectorAll(".dropdown-list").forEach(d => d.classList.remove("visible"));
  }
});



// Toggle dropdown visibility
document.getElementById("toggleCategoryList").addEventListener("click", () => {
  const dropdown = document.getElementById("categoryDropdown");
  const input = document.getElementById("newItemCategory");
  dropdown.classList.toggle("visible");
  if (dropdown.classList.contains("visible")) {
    renderDropdown(dropdown, getAllCategories(), input, dropdown);
  }
});

document.getElementById("toggleSubcategoryList").addEventListener("click", () => {
  const dropdown = document.getElementById("subcategoryDropdown");
  const input = document.getElementById("newItemSubcategory");
  dropdown.classList.toggle("visible");
  if (dropdown.classList.contains("visible")) {
    renderDropdown(dropdown, getAllSubcategories(), input, dropdown);
  }
});

// Close dropdowns when clicking outside
window.addEventListener("click", (e) => {
  if (!e.target.closest(".category-select-wrapper") && !e.target.closest(".subcategory-select-wrapper")) {
    document.querySelectorAll(".dropdown-list").forEach(d => d.classList.remove("visible"));
  }
});
// =======================
// SHOW DROPDOWN ON FOCUS (for Category & Subcategory inputs)
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const catInput = document.getElementById("newItemCategory");
  const subInput = document.getElementById("newItemSubcategory");

  if (catInput) {
    catInput.addEventListener("focus", () => {
      const dropdown = document.getElementById("categoryDropdown");
      if (!dropdown) return;
      dropdown.classList.add("visible");
      renderDropdown(dropdown, getAllCategories(), catInput, dropdown);
    });
  }

  if (subInput) {
    subInput.addEventListener("focus", () => {
      const dropdown = document.getElementById("subcategoryDropdown");
      if (!dropdown) return;
      dropdown.classList.add("visible");
      renderDropdown(dropdown, getAllSubcategories(), subInput, dropdown);
    });
  }
});

