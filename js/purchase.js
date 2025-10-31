document.addEventListener('DOMContentLoaded', function(){
// ===========================================================
// purchase.js — Final Version (with Edit Modal & Scoped Handlers)
// ===========================================================

// ===== Data =====
let inventory = JSON.parse(localStorage.getItem("inventory")) || {};
let purchases = JSON.parse(localStorage.getItem("purchases")) || [];
let images = JSON.parse(localStorage.getItem("images")) || {};
let filterDate = "";
let purchaseChart = null;
let productChart = null;
let editIndex = -1;
let monthFilter = "current";


// ===== Save Data =====
function saveData() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("purchases", JSON.stringify(purchases));
  localStorage.setItem("images", JSON.stringify(images));
}

// ===== Populate Product Datalist =====
function renderProductSelect() {
  const datalist = document.getElementById("productList");
  if (!datalist) return;
  datalist.innerHTML = "";
  Object.keys(inventory).forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    datalist.appendChild(opt);
  });
}

// ===== Inventory Summary =====
function renderInventorySummary(dateFilter = "") {
  const summaryContainer = document.getElementById("inventorySummary");
  const countBadge = document.getElementById("productCountBadge");
  const unitBadge = document.getElementById("unitCountBadge");
  if (!summaryContainer) return;

  summaryContainer.innerHTML = "";

  let totalUnits = 0;
  let productCount = 0;

  Object.keys(inventory).forEach(productName => {
    // 🧮 Calculate total units and total amount per product
    const filteredPurchases = purchases.filter(
      p => p.item === productName && (!dateFilter || p.date.startsWith(dateFilter))
    );

    let units = filteredPurchases.reduce((sum, p) => sum + p.qty, 0);
    let totalAmount = filteredPurchases.reduce((sum, p) => sum + p.qty * p.price, 0);

    // 🧠 Hide items with zero units when a date filter is active
    if (dateFilter && units === 0) return;

    totalUnits += units;
    productCount++;

    const imgSrc = images[productName] || "https://via.placeholder.com/100?text=No+Img";

    const card = document.createElement("div");
    card.className = "summary-item";
    card.innerHTML = `
      <img src="${imgSrc}" alt="${productName}" class="product-thumb"/>
      <strong class="product-name">${productName}</strong>
      <p>Units: ${units}</p>
      <p><b>Total: ₹${totalAmount.toLocaleString("en-IN")}</b></p>
      <div class="actions">
        <button class="edit-btn" data-product="${productName}">✏️ Edit</button>
        <button class="delete-btn" data-product="${productName}">🗑️ Delete</button>
      </div>
    `;
    summaryContainer.appendChild(card);
  });

  if (countBadge) countBadge.textContent = `${productCount} items`;
  if (unitBadge) unitBadge.textContent = `${totalUnits} units`;
}


// ===== Scoped Edit/Delete Handlers =====
// 🧩 Run this ONCE globally (not inside renderInventorySummary)
document.getElementById("inventorySummary").addEventListener("click", e => {
  const target = e.target;

  // 🟢 Edit Product
  if (target.classList.contains("edit-btn")) {
    const productName = target.dataset.product;
    openEditModal(productName);
  }

  // 🟠 Delete Product (only from inventory summary, not purchase records)
if (target.classList.contains("delete-btn")) {
  const name = target.dataset.product;
  if (!confirm(`Delete ${name} from inventory summary? Purchases will remain.`)) return;

  delete inventory[name];
  delete images[name];

  saveData();
  renderAll();
}

});

// ===== Totals =====
function updateTotalSpent() {
  const total = purchases
    .filter(p => !filterDate || p.date.startsWith(filterDate))
    .reduce((sum, p) => sum + (p.qty * p.price), 0);
  document.getElementById("totalSpentCard").innerHTML = `<h4>Total Spent</h4><p>₹${total.toLocaleString("en-IN")}</p>`;
}

function updateTodaySpent() {
  const today = new Date().toISOString().slice(0, 10);
  const total = purchases
    .filter(p => p.date.startsWith(today) && (!filterDate || p.date.startsWith(filterDate)))
    .reduce((sum, p) => sum + (p.qty * p.price), 0);
  document.getElementById("todaySpentCard").innerHTML = `<h4>Today's Purchases</h4><p>₹${total.toLocaleString("en-IN")}</p>`;
}

function updateMonthSpent() {
  const ym = new Date().toISOString().slice(0, 7);
  const total = purchases
    .filter(p => p.date.startsWith(ym) && (!filterDate || p.date.startsWith(filterDate)))
    .reduce((sum, p) => sum + (p.qty * p.price), 0);
  document.getElementById("monthSpentCard").innerHTML = `<h4>This Month</h4><p>₹${total.toLocaleString("en-IN")}</p>`;
}

function updateLastMonthSpent() {
  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const total = purchases
    .filter(p => p.date.startsWith(lastMonth) && (!filterDate || p.date.startsWith(filterDate)))
    .reduce((sum, p) => sum + (p.qty * p.price), 0);
  document.getElementById("lastMonthSpentCard").innerHTML = `<h4>Last Month</h4><p>₹${total.toLocaleString("en-IN")}</p>`;
}

// ===== Charts =====
function updatePurchaseChart(dateFilter = "") {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

  const todayTotal = purchases.filter(p => p.date.startsWith(today)).reduce((s, p) => s + p.qty * p.price, 0);
  const thisMonthTotal = purchases.filter(p => p.date.startsWith(thisMonth)).reduce((s, p) => s + p.qty * p.price, 0);
  const lastMonthTotal = purchases.filter(p => p.date.startsWith(lastMonth)).reduce((s, p) => s + p.qty * p.price, 0);

  const ctx = document.getElementById("purchaseChart").getContext("2d");
  if (purchaseChart) purchaseChart.destroy();
  purchaseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Today", "This Month", "Last Month"],
      datasets: [{
        label: "Purchases (₹)",
        data: [todayTotal, thisMonthTotal, lastMonthTotal],
        backgroundColor: ["#e74c3c", "#3498db", "#2ecc71"],
        barThickness: 36
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => `₹${v.toLocaleString("en-IN")}` } } }
    }
  });
}

function updateProductChart(dateFilter = "") {
  const totals = {};
  purchases.forEach(p => {
    if (dateFilter && !p.date.startsWith(dateFilter)) return;
    if (!totals[p.item]) totals[p.item] = { qty: 0, amount: 0 };
    totals[p.item].qty += p.qty;
    totals[p.item].amount += p.qty * p.price;
  });

  const labels = Object.keys(totals);
  const qtyData = labels.map(l => totals[l].qty);
  const amountData = labels.map(l => totals[l].amount);

  const ctx = document.getElementById("productChart").getContext("2d");
  if (productChart) productChart.destroy();
  productChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Quantity", data: qtyData, backgroundColor: "#3498db", yAxisID: "y1" },
        { label: "Amount (₹)", data: amountData, backgroundColor: "#e67e22", yAxisID: "y2" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        y1: { beginAtZero: true, position: "left", title: { display: true, text: "Quantity" } },
        y2: { beginAtZero: true, position: "right", title: { display: true, text: "Amount (₹)" },
          ticks: { callback: v => `₹${v.toLocaleString("en-IN")}` }, grid: { drawOnChartArea: false } }
      }
    }
  });
}

// ===== Purchases Rendering, CRUD, and Filters =====
function renderPurchases() {
  const container = document.getElementById("purchaseRecords");
  if (!container) return;

  let list = purchases.slice();
  if (filterDate) {
    list = list.filter(p => p.date.startsWith(filterDate));
  } else if (monthFilter === "current") {
    const ym = new Date().toISOString().slice(0, 7);
    list = list.filter(p => p.date.startsWith(ym));
  } else if (monthFilter === "last") {
    const d = new Date();
    const lastMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 7);
    list = list.filter(p => p.date.startsWith(lastMonth));
  }

  list = list.reverse();

  if (list.length === 0) {
    container.innerHTML = "<p>No purchase records.</p>";
    return;
  }

  container.innerHTML = list.map(p => {
    const idx = purchases.indexOf(p);
    return `
      <div class="record-card">
        <h4>${p.item}</h4>
        <p>Qty: ${p.qty} ${p.unit || ""}</p>
        <p>₹${p.price} each</p>
        <p>Total: ₹${p.qty * p.price}</p>
        <small>${new Date(p.date).toLocaleDateString()}</small>
        <div class="actions">
          <button class="edit" onclick="editPurchase(${idx})">Edit</button>
          <button class="delete" onclick="deletePurchase(${idx})">Delete</button>
        </div>
      </div>`;
  }).join("");

  updateTotalSpent();
  updateTodaySpent();
  updateMonthSpent();
  updateLastMonthSpent();

  let activeDateFilter = filterDate;
  if (!filterDate && monthFilter === "current") {
    activeDateFilter = new Date().toISOString().slice(0, 7);
  } else if (!filterDate && monthFilter === "last") {
    const d = new Date();
    activeDateFilter = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 7);
  }

  updatePurchaseChart(activeDateFilter);
  updateProductChart(activeDateFilter);
  updateDailyPurchaseChart(activeDateFilter); // 🆕 Added line
  renderInventorySummary(activeDateFilter);
  renderProductSelect();
  
}

document.getElementById("filterMonth").addEventListener("change", e => {
  monthFilter = e.target.value;
  renderPurchases();
});


// ===== Add / Update Purchase =====
document.getElementById("savePurchaseBtn").addEventListener("click", () => {
  const product = document.getElementById("productInput").value.trim();
  const qty = parseFloat(document.getElementById("quantityInput").value);
  const price = parseFloat(document.getElementById("priceInput").value);
  const dateInput = document.getElementById("purchaseDateInput").value;
  const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

  if (!product || isNaN(qty) || isNaN(price)) return alert("Please fill all fields.");

  let unit = "pcs";

// If product exists in inventory and has a unit → use it
if (inventory[product]) {
  if (typeof inventory[product] === "object" && inventory[product].unit) {
    unit = inventory[product].unit;
  }
} else {
  // New product — ask only once (fallback)
  unit = prompt("Enter unit (e.g., pcs, kg, g, l):", "pcs") || "pcs";
  // Optional: also add to inventory structure for future
  inventory[product] = { qty: 0, unit, category: "Uncategorized" };
}


  if (editIndex === -1) {
  // Add new purchase
  if (!inventory[product]) {
    inventory[product] = { qty: 0, unit, category: "Uncategorized" };
  }
  const category = inventory[product].category || "Uncategorized";
  inventory[product].qty += qty;
  purchases.push({ item: product, qty, price, date, unit, category });
} else {
  // Editing an existing purchase
  const old = purchases[editIndex];
  if (inventory[old.item]) {
    inventory[old.item].qty -= old.qty;
    if (inventory[old.item].qty < 0) inventory[old.item].qty = 0;
  }
  if (!inventory[product]) {
    inventory[product] = { qty: 0, unit, category: "Uncategorized" };
  }
  const category = inventory[product].category || "Uncategorized";
  inventory[product].qty += qty;
  purchases[editIndex] = { item: product, qty, price, date, unit, category };
}



  saveData();
  clearForm();
  renderAll();
});

// ===== Add New Item (Popup with image upload + category + unit) =====
const newItemBtn = document.getElementById("newItemBtn");
let newItemPopup = null;

newItemBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  if (newItemPopup) {
    newItemPopup.remove();
    newItemPopup = null;
    return;
  }

  newItemPopup = document.createElement("div");
  newItemPopup.className = "new-item-popup";
  newItemPopup.innerHTML = `
    <div class="popup-row">
      <input type="text" id="newItemName" placeholder="Item name (e.g. Rice)" />
    </div>

    <div class="popup-row">
      <select id="newItemUnit">
        <option value="">Select Unit</option>
        <option value="kg">Kg</option>
        <option value="liters">Liters</option>
        <option value="pcs">Pieces</option>
        <option value="grm">Grams</option>
      </select>
    </div>

    <div class="popup-row">
      <select id="newItemCategory">
        <option value="">Select Category</option>
        <option value="Vegetables">Vegetables</option>
        <option value="Grocery">Grocery</option>
        <option value="Meat">Meat</option>
        <option value="Dairy">Dairy</option>
        <option value="Beverages">Beverages</option>
      </select>
    </div>

    <!-- 🔹 Image Upload with Camera Icon -->
    <div class="popup-row image-upload">
      <label for="newItemImage" class="camera-btn">
        📷 Upload / Capture
      </label>
      <input type="file" id="newItemImage" accept="image/*" capture="environment" hidden />
      <img id="previewImage" src="https://via.placeholder.com/100?text=Preview" alt="Preview" class="image-preview" />
    </div>

    <div class="popup-actions">
      <button id="addItemConfirm" class="btn primary">Add</button>
    </div>
  `;

  // Style the popup (centered)
  newItemPopup.style.position = "fixed";
  newItemPopup.style.top = "50%";
  newItemPopup.style.left = "50%";
  newItemPopup.style.transform = "translate(-50%, -50%)";
  newItemPopup.style.zIndex = "1001";

  document.body.appendChild(newItemPopup);

  const imageInput = newItemPopup.querySelector("#newItemImage");
  const preview = newItemPopup.querySelector("#previewImage");

  // 🔸 Live preview when selecting or capturing an image
  imageInput.addEventListener("change", (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => preview.src = reader.result;
    reader.readAsDataURL(file);
  });

  // 🔹 Confirm Add
  newItemPopup.querySelector("#addItemConfirm").addEventListener("click", () => {
    const name = document.getElementById("newItemName").value.trim();
    const unit = document.getElementById("newItemUnit").value;
    const category = document.getElementById("newItemCategory").value;

    if (!name || !unit || !category) return alert("Please fill all fields (Name, Unit, Category).");
    if (inventory[name]) return alert("Item already exists!");

    const imgFile = imageInput.files[0];

    if (imgFile) {
      const reader = new FileReader();
      reader.onload = () => {
        images[name] = reader.result;
        inventory[name] = { qty: 0, unit, category };
        saveData();
        renderAll();
        closePopup();
      };
      reader.readAsDataURL(imgFile);
    } else {
      inventory[name] = { qty: 0, unit, category };
      saveData();
      renderAll();
      closePopup();
    }
  });

  // ✅ Close Popup on outside click
  function handleOutsideClick(ev) {
    if (!newItemPopup.contains(ev.target) && ev.target !== newItemBtn) {
      closePopup();
    }
  }

  function closePopup() {
    if (newItemPopup) {
      document.removeEventListener("click", handleOutsideClick);
      newItemPopup.remove();
      newItemPopup = null;
    }
  }

  setTimeout(() => document.addEventListener("click", handleOutsideClick), 50);
});

// ===== Delete Purchase =====
function deletePurchase(index) {
  if (!confirm("Delete this purchase?")) return;
  const record = purchases[index];
  if (record && inventory[record.item] !== undefined) {
    inventory[record.item].qty -= record.qty; // ✅ fix qty update bug too
    if (inventory[record.item].qty < 0) inventory[record.item].qty = 0;
  }
  purchases.splice(index, 1);
  saveData();
  renderAll();
}

// ===== Edit Purchase =====
function editPurchase(index) {
  const p = purchases[index];
  if (!p) return;
  document.getElementById("productInput").value = p.item;
  document.getElementById("quantityInput").value = p.qty;
  document.getElementById("priceInput").value = p.price;
  document.getElementById("purchaseDateInput").value = p.date.slice(0, 10);
  editIndex = index;
  document.getElementById("savePurchaseBtn").textContent = "Update Purchase";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 🧩 Expose functions globally so inline onclick works:
window.editPurchase = editPurchase;
window.deletePurchase = deletePurchase;

// ===== Clear Form =====
function clearForm() {
  document.getElementById("productInput").value = "";
  document.getElementById("quantityInput").value = 1;
  document.getElementById("priceInput").value = 0;
  document.getElementById("purchaseDateInput").value = "";
  editIndex = -1;
  document.getElementById("savePurchaseBtn").textContent = "Add / Update Purchase";
}

// ===== Filters =====
document.getElementById("filterDate").addEventListener("change", e => {
  filterDate = e.target.value;
  renderPurchases();
});

document.getElementById("clearFilterBtn").addEventListener("click", () => {
  filterDate = "";
  document.getElementById("filterDate").value = "";
  renderPurchases();
});

// ===== Reset Inventory =====
document.getElementById("resetInventoryBtn").addEventListener("click", () => {
  if (!confirm("Reset all units to 0?")) return;
  Object.keys(inventory).forEach(k => {
  if (typeof inventory[k] === "object") inventory[k].qty = 0;
  else inventory[k] = { qty: 0, unit: "pcs", category: "Uncategorized" };
});

  saveData();
  renderAll();
});

// ===== Combined Render =====
function renderAll() {
  renderProductSelect();
  renderPurchases();
}

function openEditModal(productName) {
  const currentImg = images[productName] || "https://via.placeholder.com/100?text=No+Image";

  const modal = document.createElement("div");
  modal.className = "edit-modal-overlay";
  modal.innerHTML = `
    <div class="edit-modal">
      <h4>Edit Product</h4>
      <div class="preview-wrapper">
        <img src="${currentImg}" alt="Preview" id="previewImage">
      </div>
      <input type="text" class="edit-name" value="${productName}" placeholder="New name"/>
      <input type="file" accept="image/*" class="edit-img"/>
      <div>
        <button class="save-edit">Save</button>
        <button class="cancel-edit">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add("show"), 10);

  // Live preview
  modal.querySelector(".edit-img").addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => modal.querySelector("#previewImage").src = reader.result;
      reader.readAsDataURL(file);
    }
  });

  // Save
  modal.querySelector(".save-edit").addEventListener("click", () => {
    const newName = modal.querySelector(".edit-name").value.trim();
    const imgFile = modal.querySelector(".edit-img").files[0];

    if (!newName) return alert("Enter a valid name");
    if (newName !== productName && inventory[newName]) return alert("Product already exists!");

    if (newName !== productName) {
      inventory[newName] = inventory[productName];
      delete inventory[productName];
      purchases = purchases.map(p => p.item === productName ? { ...p, item: newName } : p);
      if (images[productName]) {
        images[newName] = images[productName];
        delete images[productName];
      }
    }

    if (imgFile) {
      const reader = new FileReader();
      reader.onload = () => {
        images[newName] = reader.result;
        saveData();
        closeModal();
        renderAll();
      };
      reader.readAsDataURL(imgFile);
    } else {
      saveData();
      closeModal();
      renderAll();
    }
  });

  const closeModal = () => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 250);
  };
  modal.querySelector(".cancel-edit").addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target.classList.contains("edit-modal-overlay")) closeModal(); });
}  

let dailyPurchaseChart = null;

function updateDailyPurchaseChart(dateFilter = "") {
  let targetMonth = "";

  // 🔹 Determine month to show
  if (dateFilter && dateFilter.length === 7) {
    targetMonth = dateFilter; // e.g. "2025-10"
  } else if (filterDate) {
    targetMonth = filterDate.slice(0, 7);
  } else if (monthFilter === "last") {
    const d = new Date();
    targetMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 7);
  } else if (monthFilter === "current") {
    targetMonth = new Date().toISOString().slice(0, 7);
  } else {
    targetMonth = "";
  }

  // 🔹 Filter purchases
  let filtered = purchases;
  if (targetMonth) filtered = purchases.filter(p => p.date.startsWith(targetMonth));

  // 🔹 Calculate totals per day
  const dayTotals = {};
  filtered.forEach(p => {
    const day = p.date.slice(0, 10);
    if (!dayTotals[day]) dayTotals[day] = 0;
    dayTotals[day] += p.qty * p.price;
  });

  // 🔹 Prepare data
  const labels = Object.keys(dayTotals).sort();
  const data = labels.map(d => dayTotals[d]);

  const ctx = document.getElementById("dailyPurchaseChart").getContext("2d");
  if (dailyPurchaseChart) dailyPurchaseChart.destroy();

  // 🔹 Create Bar Chart
  dailyPurchaseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Daily Purchase (₹)",
        data,
        backgroundColor: "#8e44ad",
        borderColor: "#6c3483",
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 28
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `₹${ctx.raw.toLocaleString("en-IN")}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Date" },
          ticks: { autoSkip: true, maxTicksLimit: 10 }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Amount (₹)" },
          ticks: { callback: v => `₹${v.toLocaleString("en-IN")}` }
        }
      }
    }
  });
}

// ===== Initial Load =====
renderAll();

});
