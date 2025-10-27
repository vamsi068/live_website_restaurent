// menu.js — Fixed & cleaned version for Street Magic POS
// ===================================================

// =======================
// DATA & HELPERS
// =======================
let menuItems = JSON.parse(localStorage.getItem("menuItems")) || [];
let cart = JSON.parse(localStorage.getItem("cart")) || []; // persist cart
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let customers = JSON.parse(localStorage.getItem("customers")) || []; // global customers
let editIndex = -1;
let selectedCategory = null;
let currentVariants = [];
let lastCategory = localStorage.getItem("lastCategory") || "";
let lastSubcategory = localStorage.getItem("lastSubcategory") || "";
let savingOrder = false; // prevent double-save

// small random IDs
function generateId() {
  return "id_" + Math.random().toString(36).slice(2, 9);
}

function saveMenuItems() {
  localStorage.setItem("menuItems", JSON.stringify(menuItems));
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function saveCustomers() {
  localStorage.setItem("customers", JSON.stringify(customers));
}

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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

  // sort categories based on saved drag order
const savedOrder = getCategoryOrder();
const sortedCats = Object.keys(cats).sort((a, b) => {
  const ai = savedOrder.indexOf(a);
  const bi = savedOrder.indexOf(b);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
});

sortedCats.forEach((cat) => {
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
        localStorage.setItem("selectedCategory", JSON.stringify(selectedCategory));
        renderMenu();
      };
      subUl.appendChild(subLi);
    });

    li.appendChild(subUl);
    span.onclick = () => {
      document.querySelectorAll("#categoryList li.expanded").forEach((el) => {
        if (el !== li) el.classList.remove("expanded");
      });
      li.classList.toggle("expanded");

      if (selectedCategory && selectedCategory.cat === cat && !selectedCategory.sub) {
        selectedCategory = null;
        localStorage.removeItem("selectedCategory");
      } else {
        selectedCategory = { cat, sub: null };
        localStorage.setItem("selectedCategory", JSON.stringify(selectedCategory));
      }
      renderMenu();
    };

    catList.appendChild(li);
});


  // ✅ Call drag after we build the list
  enableQuickNavDrag();
}

// =======================
// SAVE & RESTORE CATEGORY ORDER
// =======================
function saveCategoryOrder() {
  const order = Array.from(document.querySelectorAll("#categoryList > li > span"))
    .map(span => span.textContent.trim());
  localStorage.setItem("categoryOrder", JSON.stringify(order));
}

function getCategoryOrder() {
  try {
    return JSON.parse(localStorage.getItem("categoryOrder")) || [];
  } catch {
    return [];
  }
}


// =======================
// FREEHAND MOVE FOR QUICK NAVIGATION
// =======================
function enableQuickNavDrag() {
  const navItems = document.querySelectorAll("#categoryList > li");
  let dragged = null;

  navItems.forEach((li) => {
    li.draggable = true;

    li.addEventListener("dragstart", (e) => {
      dragged = li;
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    li.addEventListener("dragend", () => {
  li.classList.remove("dragging");
  dragged = null;
  saveCategoryOrder();
});

  });

  const list = document.getElementById("categoryList");
  if (!list) return;

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const afterEl = getAfterElement(list, e.clientY);
    if (!afterEl) list.appendChild(dragged);
    else list.insertBefore(dragged, afterEl);
  });

  function getAfterElement(container, y) {
    const els = [...container.querySelectorAll("li:not(.dragging)")];
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    els.forEach((child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) closest = { offset, element: child };
    });
    return closest.element;
  }
}



// =======================
// RENDER MENU
// =======================
function renderMenu() {
  const container = document.getElementById("menuItems");
  if (!container) return;
  container.innerHTML = "";

  let items = selectedCategory 
  ? menuItems.filter((i) => 
      selectedCategory.sub
        ? i.category === selectedCategory.cat && i.subcategory === selectedCategory.sub
        : i.category === selectedCategory.cat
    )
  : menuItems;


  if (items.length === 0) {
    container.innerHTML = "<p>No items available</p>";
    return;
  }

  const grouped = {};
items.forEach((i) => {
  if (!grouped[i.category]) grouped[i.category] = {};
  if (!grouped[i.category][i.subcategory]) grouped[i.category][i.subcategory] = [];
  grouped[i.category][i.subcategory].push(i);
});


  for (let cat in grouped) {
    const catDiv = document.createElement("div");
    catDiv.className = "category-section";

    const catHeader = document.createElement("h3");
    catHeader.textContent = cat;
    catDiv.appendChild(catHeader);

    for (let sub in grouped[cat]) {
      const subRow = document.createElement("div");
      subRow.className = "subcategory-row";

      const subHeader = document.createElement("div");
      subHeader.className = "subcategory-name";
      subHeader.textContent = sub;
      subRow.appendChild(subHeader);

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
          <div class="item-image">
            <img src="${item.image || 'images/default-food.png'}" alt="${escapeHtml(item.name)}" />
          </div>
          <h4 class="item-name">${escapeHtml(item.name)}</h4>
          <div class="quantity-options">
            ${
              item.variants && item.variants.length > 0
                ? item.variants.length === 1
                  ? `<button class="add-to-cart-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" data-price="${parseFloat(item.variants[0].price)}" data-qty="">₹${parseFloat(item.variants[0].price)}</button>`
                  : item.variants
                      .map(
                        (v) => `<button class="add-to-cart-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" data-price="${parseFloat(v.price)}" data-qty="${escapeHtml(v.qty)}">${escapeHtml(v.qty)} - ₹${parseFloat(v.price)}</button>`
                      )
                      .join("")
                : `<button class="add-to-cart-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" data-price="${item.price || 0}" data-qty="">₹${item.price || 0}</button>`
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
// DRAG & DROP — Free movement across all sections
// =======================
function enableDragDrop() {
  const items = document.querySelectorAll(".menu-item");
  const allDropZones = document.querySelectorAll(".subcategory-grid, .category-section");
  let draggedItem = null;

  items.forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      draggedItem = item;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", item.dataset.id);
      setTimeout(() => item.classList.add("dragging"), 0);
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      draggedItem = null;
      saveMenuItems();
      renderCategories();
      renderMenu();
    });
  });

  allDropZones.forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const afterEl = getAfterElement(zone, e.clientX, e.clientY);

  if (!afterEl || afterEl.parentNode !== zone) {
    zone.appendChild(draggedItem);
  } else {
    zone.insertBefore(draggedItem, afterEl);
  }
});

zone.addEventListener("drop", (e) => {
  e.preventDefault();
  const id = e.dataTransfer.getData("text/plain");
  const itemIndex = menuItems.findIndex((m) => m.id === id);
  if (itemIndex === -1) return;

  const draggedItem = menuItems[itemIndex];

  // Remove from old position
  menuItems.splice(itemIndex, 1);

  // Determine new index in menuItems array
  const cat = zone.dataset.cat;
  const sub = zone.dataset.sub;

  if (cat && sub) {
    // Update category/subcategory
    draggedItem.category = cat;
    draggedItem.subcategory = sub;

    // Find first index of items in that category/subcategory
    const targetIndex = menuItems.findIndex(m => m.category === cat && m.subcategory === sub);
    if (targetIndex === -1) {
      menuItems.push(draggedItem);
    } else {
      menuItems.splice(targetIndex, 0, draggedItem);
    }
  } else {
    // Dropped outside any subcategory, just push at end
    menuItems.push(draggedItem);
  }

  saveMenuItems();
  renderCategories();
  renderMenu();
});


});

  // helper: figure out where to insert item visually
  function getAfterElement(container, x, y) {
  const draggableElements = [...container.children].filter(
    el => el.classList.contains("menu-item") && !el.classList.contains("dragging")
  );

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2 + (x - box.left - box.width / 2);
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

}


// =======================
// MODAL & VARIANTS
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

let uploadedImageBase64 = ""; // Store temporary image

function openAddModal() {
  const preview = document.getElementById("imagePreview");
  if (preview) preview.src = uploadedImageBase64 || "images/default-food.png";
  editIndex = -1;
  currentVariants = [];
  if (document.getElementById("newItemName")) document.getElementById("newItemName").value = "";
  if (document.getElementById("newItemCategory")) document.getElementById("newItemCategory").value = "";
  if (document.getElementById("newItemSubcategory")) document.getElementById("newItemSubcategory").value = "";
  renderVariantInputs();
  if (modal) modal.style.display = "block";
}

function editMenuItemById(id) {
  const idx = menuItems.findIndex(m => m.id === id);
  if (idx === -1) return;

  const it = menuItems[idx];
  editIndex = idx;

  if (document.getElementById("newItemName")) document.getElementById("newItemName").value = it.name;
  if (document.getElementById("newItemCategory")) document.getElementById("newItemCategory").value = it.category;
  if (document.getElementById("newItemSubcategory")) document.getElementById("newItemSubcategory").value = it.subcategory;
  if (document.getElementById("newItemPrice")) document.getElementById("newItemPrice").value = it.price ?? "";

  currentVariants = JSON.parse(JSON.stringify(it.variants || []));
  renderVariantInputs();

  uploadedImageBase64 = it.image || "";
  const imgPrev = document.getElementById("imagePreview");
  if (imgPrev) imgPrev.src = uploadedImageBase64 || "images/default-food.png";

  if (modal) modal.style.display = "block";
}

function deleteMenuItemById(id) {
  if (!confirm("Delete this item?")) return;
  menuItems = menuItems.filter((m) => m.id !== id);
  saveMenuItems();
  renderCategories();
  renderMenu();
}

// =======================
// SAVE / ADD ITEM
// =======================
document.getElementById("saveMenuItem")?.addEventListener("click", () => {
  const nameEl = document.getElementById("newItemName");
  const catEl = document.getElementById("newItemCategory");
  const subEl = document.getElementById("newItemSubcategory");

  const name = nameEl?.value?.trim() || "";
  const cat = catEl?.value?.trim() || "";
  const sub = subEl?.value?.trim() || "";

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

  let basePrice = parseFloat(document.getElementById("newItemPrice")?.value || 0);
  const imageUrl = uploadedImageBase64 || localStorage.getItem("lastUploadedImage") || "";

  const newItem = {
    id: editIndex >= 0 ? menuItems[editIndex].id : generateId(),
    name,
    category: cat,
    subcategory: sub,
    variants,
    price: basePrice || (variants[0]?.price ?? 0),
    image: imageUrl,
  };

  if (editIndex >= 0) menuItems[editIndex] = newItem;
  else menuItems.push(newItem);

  saveMenuItems();
  lastCategory = cat;
  lastSubcategory = sub;
  localStorage.setItem("lastCategory", lastCategory);
  localStorage.setItem("lastSubcategory", lastSubcategory);

  if (modal) modal.style.display = "none";
  uploadedImageBase64 = "";
  localStorage.removeItem("lastUploadedImage");

  renderCategories();
  renderMenu();
});

// =======================
// CART: addToCart() + renderCart()
// =======================
function addToCart({ id = null, name = "", price = 0, variantQty = "" } = {}) {
  let item = null;
  if (id) item = menuItems.find(m => m.id === id);
  if (!item && name) {
    // fallback object
    item = { id: id || generateId(), name, price, image: "" };
  }
  if (!item) return;

  // Make cart key unique by id + variant
  const existing = cart.find(c => c.id === item.id && c.variantQty === variantQty);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name || name,
      price: parseFloat(price || item.price || 0),
      qty: 1,
      variantQty: variantQty || "",
      image: item.image || ""
    });
  }

  saveCart();
  renderCart();
}


function renderCart() {
  const list = document.getElementById("cartList");
  const subtotalEl = document.getElementById("cartSubtotal");
  const discountEl = document.getElementById("cartDiscount");
  const totalEl = document.getElementById("cartTotal");

  if (!list) return;

  list.innerHTML = "";
  if (!cart || cart.length === 0) {
    list.innerHTML = "<li>No items in cart</li>";
    if (subtotalEl) subtotalEl.textContent = "0";
    if (discountEl) discountEl.textContent = "0";
    if (totalEl) totalEl.textContent = "0";
    return;
  }

  let subtotal = 0;
  cart.forEach((c, idx) => {
    const li = document.createElement("li");
    li.className = "cart-row";
    const name = `${c.name}${c.variantQty ? " (" + c.variantQty + ")" : ""}`;
    li.innerHTML = `
      <span class="cart-name">${escapeHtml(name)} x${c.qty}</span>
      <span class="cart-price">₹${(c.price * c.qty).toFixed(2)}</span>
      <button class="cart-remove" data-idx="${idx}">✕</button>
    `;
    list.appendChild(li);
    subtotal += c.price * c.qty;
  });

  if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
  const discount = parseFloat(document.getElementById("discountInput")?.value || 0);
  if (discountEl) discountEl.textContent = isNaN(discount) ? "0" : discount.toFixed(2);
  const total = subtotal - (isNaN(discount) ? 0 : discount);
  if (totalEl) totalEl.textContent = total.toFixed(2);

  // attach remove handlers
  list.querySelectorAll(".cart-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.idx, 10);
      if (!isNaN(i)) {
        cart.splice(i, 1);
        saveCart();
        renderCart();
      }
    });
  });
}

// =======================
// SAVE ORDER, PRINT KOT/BILL (unchanged but safer references)
// =======================
function saveOrder(type) {
  if (savingOrder) return null; // prevent double save
  savingOrder = true;

  try {
    if (cart.length === 0) {
      savingOrder = false;
      return null;
    }

    const subtotal = parseFloat(document.getElementById("cartSubtotal")?.textContent || "0");
    const discount = parseFloat(document.getElementById("cartDiscount")?.textContent || "0");
    const total = parseFloat(document.getElementById("cartTotal")?.textContent || (subtotal - discount));
    const table = document.getElementById("tableSelect")?.value || "N/A";
    const customerName = document.getElementById("orderCustomerName")?.value.trim() || "";
    const customerMobile = document.getElementById("orderCustomerMobile")?.value.trim() || "";

    const newOrder = {
      id: generateId(),
      type,
      table,
      customerName,
      customerMobile,
      items: cart.map(c => ({
        name: c.name,
        variant: c.variantQty || "",
        price: c.price,
        qty: c.qty
      })),
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      discount: isNaN(discount) ? 0 : discount,
      total: isNaN(total) ? 0 : total,
      date: new Date().toISOString(),
    };

    // Only push if valid
    if (newOrder.total > 0 && newOrder.items.length > 0) {
      orders.push(newOrder);
      localStorage.setItem("orders", JSON.stringify(orders));
    }

    // Update customer rewards
    if (customerMobile) {
      let cust = customers.find(c => c.mobile === customerMobile);
      if (!cust) {
        cust = {
          name: customerName,
          mobile: customerMobile,
          totalSpent: newOrder.total,
          ordersCount: 1,
          reward: 0,
        };
        customers.push(cust);
      } else {
        cust.name = customerName || cust.name;
        cust.totalSpent = (cust.totalSpent || 0) + newOrder.total;
        cust.ordersCount = (cust.ordersCount || 0) + 1;

        // Example reward: every 10 orders = 1 reward
        if (cust.ordersCount % 10 === 0) {
          cust.reward = (cust.reward || 0) + 1;
        }
      }
      saveCustomers();
    }

    cart = [];
    saveCart();
    renderCart();
    renderPreviousOrders();

    return newOrder;
  } finally {
    savingOrder = false;
  }
}

function printKOT() {
  if (cart.length === 0) return alert("Cart is empty!");
  const order = saveOrder("KOT");
  if (!order) return;

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
  kotText += centerText("Street Magic") + "\n\n";
  kotText += `Date: ${dateStr}    ${timeStr}\n`;
  kotText += `KOT No: ${kotCount}\n`;
  kotText += makeLine() + "\n";
  kotText += "No.  Item                      Qty\n";
  kotText += makeLine() + "\n";

  order.items.forEach((item, index) => {
    const no = (index + 1).toString().padEnd(3, " ");
    let displayName = item.name;
    if (item.variant || item.variantQty) displayName += ` (${item.variant || item.variantQty})`;
    displayName = displayName.length > 20 ? displayName.slice(0, 20) : displayName.padEnd(20, " ");
    const qty = item.qty.toString().padStart(8, " ");
    kotText += `${no}  ${displayName}${qty}\n`;
  });

  kotText += makeLine() + "\n";
  kotText += `Total Items: ${order.items.length}   Quantity: ${order.items.reduce((a, b) => a + b.qty, 0)}\n`;
  kotText += makeLine() + "\n";
  kotText += centerText("Thank You!");

  const printWin = window.open("", "KOT", "width=400,height=600");
  printWin.document.write(`
    <html>
      <head>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          body { font-family: 'Courier New', monospace; font-size:13px; white-space:pre; line-height:1.3; }
          pre { margin:0; text-align:left; }
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

}

function printBill() {
  if (cart.length === 0) return alert("Cart is empty!");
  const order = saveOrder("BILL");
  if (!order) return;

  let text = `
Street Magic Restaurant
----------------------------
BILL RECEIPT (${order.type})
----------------------------
Date: ${order.date}
Table: ${order.table}
----------------------------
`;

  order.items.forEach((c) => {
    text += `${c.name} (${c.variantQty}) - ₹${c.price} x ${c.qty} = ₹${c.price * c.qty}\n`;
  });

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

}

// =======================
// PREVIOUS ORDERS RENDER
// =======================
function renderPreviousOrders() {
  const container = document.getElementById("previousOrder");
  if (!container) return;
  container.innerHTML = "";

  if (orders.length === 0) {
    container.innerHTML = "<p>No previous orders yet</p>";
    return;
  }

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
        <span>${escapeHtml(it.name)}${it.variant ? ' (' + escapeHtml(it.variant) + ')' : ''} x${it.qty}</span>
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
// CUSTOMER REWARD DISPLAY
// =======================
function updateCustomerRewardDisplay(mobile) {
  const el = document.getElementById("customerReward");
  const cust = customers.find(c => c.mobile === (mobile || document.getElementById("orderCustomerMobile")?.value?.trim()));
  if (el) {
    el.textContent = cust ? `Rewards: ${cust.reward} free meal(s)` : "";
  }
}

// =======================
// DROPDOWN HELPERS (consolidated)
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
      if (inputField.id === "newItemCategory") {
        lastCategory = it; localStorage.setItem("lastCategory", lastCategory);
      } else if (inputField.id === "newItemSubcategory") {
        lastSubcategory = it; localStorage.setItem("lastSubcategory", lastSubcategory);
      }
    });
    dropdownDiv.appendChild(div);
  });
}

// =======================
// GLOBAL EVENT HANDLERS (not nested)
// =======================
document.addEventListener("click", (e) => {
  const t = e.target;

  if (t.classList.contains("add-to-cart-btn")) {
    // prefer passing id to addToCart; if needed pass name/price fallback
    const dataId = t.dataset.id || null;
    const dataName = t.dataset.name || "";
    const dataPrice = parseFloat(t.dataset.price) || 0;
    const dataQty = t.dataset.qty || "";
    addToCart({ id: dataId, name: dataName, price: dataPrice, variantQty: dataQty });
    return;
  }

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

  if (t.id === "closeModal" || t.classList.contains("close")) {
    if (modal) modal.style.display = "none";
    uploadedImageBase64 = "";
    localStorage.removeItem("lastUploadedImage");
    return;
  }

  if (t.id === "clearMenuBtn") {
    if (confirm("Are you sure you want to delete ALL menu items?")) {
      menuItems = [];
      localStorage.removeItem("menuItems");
      selectedCategory = null;
      renderCategories();
      renderMenu();

    }
    return;
  }

  if (t.id === "addMenuBtn") {
    openAddModal();
    return;
  }
});

// Hide modal when clicking outside it
window.addEventListener("click", (e) => {
  if (modal && e.target === modal) modal.style.display = "none";
});

// listen for inputs to persist lastCategory/lastSubcategory and update reward display
document.addEventListener("input", (e) => {
  if (e.target.id === "newItemCategory") {
    lastCategory = e.target.value.trim();
    localStorage.setItem("lastCategory", lastCategory);
  }
  if (e.target.id === "newItemSubcategory") {
    lastSubcategory = e.target.value.trim();
    localStorage.setItem("lastSubcategory", lastSubcategory);
  }
  if (e.target.id === "orderCustomerMobile") {
    updateCustomerRewardDisplay(e.target.value.trim());
  }
});

// file upload preview
document.getElementById("newItemImageUpload")?.addEventListener("change", function (e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    uploadedImageBase64 = ev.target.result;
    localStorage.setItem("lastUploadedImage", uploadedImageBase64);
    const img = document.getElementById("imagePreview");
    if (img) img.src = uploadedImageBase64;
  };
  reader.readAsDataURL(file);
});

// Dropdown & UI wiring on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  // ✅ Restore previously selected category or subcategory
const savedCat = localStorage.getItem("selectedCategory");
if (savedCat) {
  try {
    selectedCategory = JSON.parse(savedCat);
  } catch {
    selectedCategory = null;
  }
}

  renderMenu();
  renderCart();
  renderPreviousOrders();

  document.getElementById("kotBtn")?.addEventListener("click", printKOT);
  document.getElementById("printBtn")?.addEventListener("click", printBill);

  /* ===========================================================
   SEND WHATSAPP BILL — FIXED
   =========================================================== */
  function sendWhatsAppBill(order) {
  try {
    // Get customer number from order (fallback to prompt)
    let phone = order.customerPhone || "";

    if (!phone) {
      phone = prompt("Enter customer WhatsApp number (with country code, e.g., 91XXXXXXXXXX):");
      if (!phone) {
        alert("WhatsApp number required to send the bill!");
        return;
      }
    }

    // Clean number: remove spaces, +, -, etc.
    phone = phone.replace(/\D/g, ""); // keep only digits

    // --- Format Bill Message ---
    let message = `🧾 *Street Magic Bill*\n\n`;
    message += `*Customer:* ${order.customerName || "Guest"}\n`;
    message += `*Date:* ${order.date}\n\n`;

    // Add order items
    message += `*Items:*\n`;
    order.items.forEach((item, idx) => {
      message += `${idx + 1}. ${item.name} × ${item.qty} = ₹${item.total}\n`;
    });

    // Add totals
    message += `\n*Subtotal:* ₹${order.subtotal.toFixed(2)}\n`;
    if (order.discount && order.discount > 0)
      message += `*Discount:* ₹${order.discount.toFixed(2)}\n`;
    if (order.tax && order.tax > 0)
      message += `*Tax:* ₹${order.tax.toFixed(2)}\n`;
    message += `*Total:* ₹${order.total.toFixed(2)}\n\n`;

    // Add footer
    message += `Thank you for your order! 🙏\nStreet Magic`;

    // Encode for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    // Open WhatsApp Web in a new tab
    window.open(waUrl, "_blank");

  } catch (err) {
    console.error("Error sending WhatsApp bill:", err);
    alert("Failed to send WhatsApp bill. Check console for details.");
  }
  }



  // dropdown wiring
  const catInput = document.getElementById("newItemCategory");
  const subInput = document.getElementById("newItemSubcategory");
  const catDropdown = document.getElementById("categoryDropdown");
  const subDropdown = document.getElementById("subcategoryDropdown");

  if (catInput && catDropdown) {
    catInput.addEventListener("focus", () => {
      catDropdown.classList.add("visible");
      renderDropdown(catDropdown, getAllCategories(), catInput);
    });
  }
  if (subInput && subDropdown) {
    subInput.addEventListener("focus", () => {
      subDropdown.classList.add("visible");
      renderDropdown(subDropdown, getAllSubcategories(), subInput);
    });
  }

  document.getElementById("toggleCategoryList")?.addEventListener("click", () => {
    if (!catDropdown || !catInput) return;
    catDropdown.classList.toggle("visible");
    if (catDropdown.classList.contains("visible")) renderDropdown(catDropdown, getAllCategories(), catInput);
  });

  document.getElementById("toggleSubcategoryList")?.addEventListener("click", () => {
    if (!subDropdown || !subInput) return;
    subDropdown.classList.toggle("visible");
    if (subDropdown.classList.contains("visible")) renderDropdown(subDropdown, getAllSubcategories(), subInput);
  });

  // close dropdowns on outside click
  window.addEventListener("click", (e) => {
    if (!e.target.closest(".input-wrapper")) {
      document.querySelectorAll(".dropdown-list").forEach(d => d.classList.remove("visible"));
    }
  });
});

function renderCustomers() {
  const list = document.getElementById("customerList");
  if (!list) return;

  if (customers.length === 0) {
    list.innerHTML = `<tr><td colspan="5" style="text-align:center;">No customers yet</td></tr>`;
    return;
  }

  list.innerHTML = customers.map(c => `
    <tr>
      <td>${escapeHtml(c.name || "-")}</td>
      <td>${escapeHtml(c.mobile || "-")}</td>
      <td>₹${(c.totalSpent || 0).toFixed(2)}</td>
      <td>${c.ordersCount || 0}</td>
      <td>${c.reward || 0}</td>
    </tr>
  `).join("");
}

