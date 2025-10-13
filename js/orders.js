/* ===========================================================
   orders.js — FINAL FIXED (Mobile number saving fixed)
   =========================================================== */

/* ========= GLOBALS ========= */
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let filterDate = "";
let searchText = "";
let sortMode = "newest";
let pageSize = 10;
let currentPage = 1;
let editIndex = -1;

/* ========= DOM ELEMENTS ========= */
const ordersListEl = document.getElementById("ordersList");
const orderDateEl = document.getElementById("orderDate");
const clearFilterBtn = document.getElementById("clearFilter");
const exportPDFBtn = document.getElementById("exportPDF");
const exportExcelBtn = document.getElementById("exportExcel");
const searchTextEl = document.getElementById("searchText");
const sortSelect = document.getElementById("sortSelect");
const pageSizeEl = document.getElementById("pageSize");
const paginationEl = document.getElementById("pagination");
const totalOrdersEl = document.getElementById("totalOrders");
const totalRevenueEl = document.getElementById("totalRevenue");
const printAllBtn = document.getElementById("printAllBtn");

/* ========= MODAL ELEMENTS ========= */
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const itemsContainer = document.getElementById("itemsContainer");
const modalTotal = document.getElementById("modalTotal");

/* ========= HELPERS ========= */
function generateOrderId() {
  let lastNumber = parseInt(localStorage.getItem("lastOrderNumber") || "4725");
  lastNumber++;
  localStorage.setItem("lastOrderNumber", lastNumber);
  return `ORD-${lastNumber}`;
}

function ensureOrderIds() {
  let modified = false;
  let lastNumber = parseInt(localStorage.getItem("lastOrderNumber") || "4725");
  orders.forEach(o => {
    if (!o.id || !o.id.startsWith("ORD-")) {
      lastNumber++;
      o.id = `ORD-${lastNumber}`;
      modified = true;
    }
  });
  if (modified) {
    localStorage.setItem("lastOrderNumber", lastNumber);
    localStorage.setItem("orders", JSON.stringify(orders));
  }
}

function formatCurrency(num) {
  if (isNaN(num)) return "0";
  return Number(num).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function toLocalISODate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return ""; // invalid date guard
  return d.toISOString().split("T")[0];
}


function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ========= FILTER / SORT / SEARCH ========= */
function getFilteredOrdersList() {
  let list = orders.slice();

  if (filterDate) {
    list = list.filter(o => toLocalISODate(o.date) === filterDate);
  }

  if (searchText && searchText.trim() !== "") {
    const q = searchText.trim().toLowerCase();
    list = list.filter(o => {
      const idMatch = (o.id || "").toLowerCase().includes(q);
      const dateMatch = toLocalISODate(o.date).includes(q);
      const totalMatch = ("" + (o.total ?? "")).includes(q);
      const itemMatch = (o.items || []).some(it => (it.name || "").toLowerCase().includes(q));
      const nameMatch = (o.customerName || "").toLowerCase().includes(q);
      const numberMatch = (o.customerNumber || "").toLowerCase().includes(q);
      return idMatch || dateMatch || itemMatch || totalMatch || nameMatch || numberMatch;
    });
  }

  // ✅ Apply sortMode
  if (sortMode === "newest") {
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortMode === "oldest") {
    list.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortMode === "high") {
    list.sort((a, b) => (b.total || 0) - (a.total || 0));
  } else if (sortMode === "low") {
    list.sort((a, b) => (a.total || 0) - (b.total || 0));
  }

  return list;
}


/* ========= RENDER ========= */
function renderSummary(list) {
  const totalOrders = list.length;
  const totalRevenue = list.reduce((sum, o) => sum + Number(o.total || 0), 0);
  totalOrdersEl.textContent = totalOrders;
  totalRevenueEl.textContent = formatCurrency(totalRevenue);
}

function renderOrders() {
  ensureOrderIds();
  const filtered = getFilteredOrdersList();
  renderSummary(filtered);

  if (filtered.length === 0) {
    ordersListEl.innerHTML = "<div class='empty-state'>No orders found.</div>";
    paginationEl.innerHTML = "";
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  ordersListEl.innerHTML = "";

  pageItems.forEach(order => {
    const dateStr = new Date(order.date).toLocaleString();
    const div = document.createElement("div");
    div.className = "order-card";
    div.innerHTML = `
      <div class="order-header">
        <h3>Order #${escapeHtml(order.id)} ${order.kot ? "(KOT)" : ""}</h3>
        <small>${dateStr}</small>
      </div>

      <div class="order-items">
        <ul>${order.items.map(it => `<li><span>${escapeHtml(it.name)} x${it.qty}</span><span>₹${formatCurrency(it.price * it.qty)}</span></li>`).join("")}</ul>
      </div>

      <p><strong>Total: ₹${formatCurrency(order.total)}</strong></p>
      <p><strong>Customer:</strong> ${escapeHtml(order.customerName || "-")} | 
<strong>Mobile:</strong> ${escapeHtml(order.customerNumber || order.customerMobile || "-")}

      <div class="order-actions">
        <button class="green-btn" onclick="openEdit(${orders.indexOf(order)})">✏️ Edit</button>
        <button class="blue-btn" onclick="printOrder(${orders.indexOf(order)})">🖨️ Print</button>
        <button class="orange-btn" onclick="downloadBillPDF(${orders.indexOf(order)})">📄 Bill PDF</button>
        <button class="red-btn" onclick="deleteOrder(${orders.indexOf(order)})">🗑️ Delete</button>
      </div>

    `;
    ordersListEl.appendChild(div);
  });

  renderPagination(totalPages);
}

/* ========= PAGINATION ========= */
function renderPagination(totalPages) {
  paginationEl.innerHTML = "";

  const makeBtn = (label, disabled, active, handler) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (disabled) btn.disabled = true;
    if (active) btn.classList.add("active");
    btn.addEventListener("click", handler);
    return btn;
  };

  paginationEl.appendChild(makeBtn("‹ Prev", currentPage === 1, false, () => {
    if (currentPage > 1) { currentPage--; renderOrders(); }
  }));

  for (let p = 1; p <= totalPages; p++) {
    paginationEl.appendChild(makeBtn(p, false, p === currentPage, () => {
      currentPage = p; renderOrders();
    }));
  }

  paginationEl.appendChild(makeBtn("Next ›", currentPage === totalPages, false, () => {
    if (currentPage < totalPages) { currentPage++; renderOrders(); }
  }));
}

/* ========= DELETE ========= */
function deleteOrder(index) {
  if (confirm("Delete this order?")) {
    orders.splice(index, 1);
    localStorage.setItem("orders", JSON.stringify(orders));
    renderOrders();
  }
}

/* ========= EDIT MODAL ========= */
function openEdit(index) {
  editIndex = index;
  const order = orders[index];

  itemsContainer.innerHTML = "";
  (order.items || []).forEach(i => addItemRow(i.name, i.price, i.qty));

  document.getElementById("customerName").value = order.customerName || "";
  
  // ✅ Read both customerNumber and customerMobile
  document.getElementById("customerNumber").value = order.customerNumber || order.customerMobile || "";

  const orderDateEditEl = document.getElementById("orderDateEdit");
  if (orderDateEditEl) orderDateEditEl.value = toLocalISODate(order.date);

  updateModalTotal();
  editModal.showModal();
}


function addItemRow(name = "", price = "", qty = "") {
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <input type="text" placeholder="Item name" value="${name}">
    <input type="number" placeholder="Price" value="${price}" min="0">
    <input type="number" placeholder="Qty" value="${qty}" min="1">
    <button type="button" class="remove-item">🗑️</button>
  `;
  row.querySelector(".remove-item").onclick = () => { row.remove(); updateModalTotal(); };
  row.querySelectorAll("input").forEach(inp => inp.oninput = updateModalTotal);
  itemsContainer.appendChild(row);
  updateModalTotal();
}

function updateModalTotal() {
  let total = 0;
  itemsContainer.querySelectorAll(".item-row").forEach(row => {
    const [name, price, qty] = row.querySelectorAll("input");
    if (price.value && qty.value) total += parseFloat(price.value) * parseInt(qty.value);
  });
  modalTotal.textContent = total.toFixed(2);
}

document.getElementById("addItemBtn")?.addEventListener("click", () => addItemRow());
editForm?.addEventListener("submit", e => {
  e.preventDefault();

  const updatedItems = [];
  itemsContainer.querySelectorAll(".item-row").forEach(row => {
    const [name, price, qty] = row.querySelectorAll("input");
    if (name.value && price.value > 0 && qty.value > 0) {
      updatedItems.push({ name: name.value, price: +price.value, qty: +qty.value });
    }
  });

  if (updatedItems.length === 0) return alert("Please add valid items.");

  const total = updatedItems.reduce((s, i) => s + i.price * i.qty, 0);
  orders[editIndex].items = updatedItems;
  orders[editIndex].total = total;
  orders[editIndex].customerName = document.getElementById("customerName").value.trim();
  
  // ✅ Always save into customerNumber
  orders[editIndex].customerNumber = document.getElementById("customerNumber").value.trim();

  const newDate = document.getElementById("orderDateEdit").value;
  if (newDate) orders[editIndex].date = new Date(newDate).toISOString();

  localStorage.setItem("orders", JSON.stringify(orders));
  editModal.close();
  renderOrders();
});



/* ========= PRINT ========= */
function printOrder(index) {
  const o = orders[index];
  const w = window.open("", "_blank");
  w.document.write(`
    <html><head><title>Order #${o.id}</title></head><body>
    <h2>Street Magic</h2>
    <p>Order #${o.id} ${o.kot ? "(KOT)" : ""} - ${new Date(o.date).toLocaleString()}</p>
    <table border="1" cellpadding="5" cellspacing="0" width="100%">
      <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      ${o.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${i.price}</td><td>₹${i.price * i.qty}</td></tr>`).join("")}
    </table>
    <h3>Total: ₹${o.total.toFixed(2)}</h3>
    <p>Customer: ${o.customerName || "-"} | Mobile: ${o.customerNumber || "-"}</p>
    <script>window.print();<\/script>
    </body></html>
  `);
  w.document.close();
}

printAllBtn?.addEventListener("click", () => {
  const w = window.open("", "_blank");
  w.document.write("<h2>All Orders Summary</h2>");
  orders.forEach(o => {
    w.document.write(`<h4>Order #${o.id} - ${new Date(o.date).toLocaleString()}</h4>`);
    w.document.write("<ul>" + o.items.map(i => `<li>${i.name} x${i.qty} - ₹${i.price * i.qty}</li>`).join("") + "</ul>");
    w.document.write(`<p><b>Total: ₹${o.total.toFixed(2)}</b></p>`);
    w.document.write(`<p>Customer: ${o.customerName || "-"} | Mobile: ${o.customerNumber || "-"}</p><hr>`);
  });
  w.document.write("<script>window.print();<\/script>");
  w.document.close();
});

/* ========= EXPORT ========= */
exportPDFBtn?.addEventListener("click", () => alert("PDF export can be integrated with jsPDF library."));
exportExcelBtn?.addEventListener("click", () => alert("Excel export can be added using SheetJS (xlsx)."));

/* ========= FILTERS ========= */
clearFilterBtn?.addEventListener("click", () => {
  if (confirm("⚠️ Are you sure you want to clear ALL orders? This action cannot be undone.")) {
    localStorage.removeItem("orders");
    localStorage.removeItem("lastOrderNumber");
    orders = [];
    renderOrders();
    alert("✅ All orders have been cleared.");
  } else {
    console.log("Clear all orders cancelled");
  }
});


orderDateEl?.addEventListener("change", e => {
  filterDate = e.target.value;
  currentPage = 1;
  renderOrders();
});

sortSelect?.addEventListener("change", e => {
  sortMode = e.target.value;
  currentPage = 1;
  renderOrders();
});

pageSizeEl?.addEventListener("change", e => {
  pageSize = Number(e.target.value) || 10;
  currentPage = 1;
  renderOrders();
});
JSON.parse(localStorage.getItem('ordres'))

let searchDebounce;
searchTextEl?.addEventListener("input", e => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchText = e.target.value;
    currentPage = 1;
    renderOrders();
  }, 300);
});

/* ========= BILL PDF ========= */
async function downloadBillPDF(index) {
  const o = orders[index];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const lineHeight = 8;
  let y = 15;

  doc.setFontSize(16);
  doc.text("Street Magic Restaurant", 14, y);
  y += lineHeight;
  doc.setFontSize(12);
  doc.text(`Order ID: ${o.id}`, 14, y);
  y += lineHeight;
  doc.text(`Date: ${new Date(o.date).toLocaleString()}`, 14, y);
  y += lineHeight;
  doc.text(`Customer: ${o.customerName || "-"}`, 14, y);
  y += lineHeight;
  doc.text(`Mobile: ${o.customerNumber || "-"}`, 14, y);
  y += lineHeight * 2;

  // Table Header
  doc.setFont(undefined, "bold");
  doc.text("Item", 14, y);
  doc.text("Qty", 90, y);
  doc.text("Price", 120, y);
  doc.text("Total", 160, y);
  doc.setFont(undefined, "normal");
  y += 5;
  doc.line(14, y, 195, y);
  y += 7;

  // Items
o.items.forEach(i => {
  const itemName = String(i.name || "");
  const qty = Number(i.qty) || 0;
  const price = Number(i.price) || 0;
  const total = (price * qty).toFixed(2);

  doc.text(itemName, 14, y);
  doc.text(String(qty), 90, y);
 doc.text(`INR ${price.toFixed(2)}`, 120, y);
doc.text(`INR ${total}`, 160, y);

  y += lineHeight;
});


  // Total line
  y += 5;
  doc.line(14, y, 195, y);
  y += lineHeight;
  doc.setFont(undefined, "bold");
doc.text(`Total: INR ${o.total.toFixed(2)}`, 14, y);
  doc.setFont(undefined, "normal");

  // Footer
  y += lineHeight * 2;
  doc.setFontSize(10);
  doc.text("Thank you for dining with Street Magic!", 14, y);

  doc.save(`${o.id}_Bill.pdf`);
}



/* ========= INIT ========= */
document.addEventListener("DOMContentLoaded", () => {
  pageSize = Number(pageSizeEl?.value) || 10;
  sortMode = sortSelect?.value || "newest";
  renderOrders();
});
