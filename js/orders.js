/* ===========================================================
   orders.js — CLEANED & FIXED (localStorage only)
   =========================================================== */

/* ========= GLOBALS ========= */
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let filterDate = "";
let searchText = "";
let sortMode = "newest";
let pageSize = 10;
let currentPage = 1;
let editIndex = -1;

/* ========= DOM ELEMENTS (deferred script ensures DOM exists) ========= */
const ordersListEl = document.getElementById("ordersList");
const orderDateEl = document.getElementById("orderDate");
const clearFilterBtn = document.getElementById("clearFilter");
const exportPDFBtn = document.getElementById("exportPDF");
const exportExcelBtn = document.getElementById("exportExcel");
const exportCSVBtn = document.getElementById("exportCSV");
const searchTextEl = document.getElementById("searchText");
const sortSelect = document.getElementById("sortSelect");
const pageSizeEl = document.getElementById("pageSize");
const paginationEl = document.getElementById("pagination");
const totalOrdersEl = document.getElementById("totalOrders");
const totalRevenueEl = document.getElementById("totalRevenue");
const printAllBtn = document.getElementById("printAllBtn");

const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const itemsContainer = document.getElementById("itemsContainer");
const modalTotal = document.getElementById("modalTotal");
const soldListContainer = document.getElementById("todaysSoldItems");
const soldHeader = document.getElementById("soldHeader");
const triangle = document.getElementById("triangle");

/* ========= HELPERS ========= */
function saveOrders() {
  localStorage.setItem("orders", JSON.stringify(orders));
}

function generateOrderId() {
  let lastNumber = parseInt(localStorage.getItem("lastOrderNumber") || "4812", 10);
  lastNumber++;
  localStorage.setItem("lastOrderNumber", lastNumber);
  return `ORD-${lastNumber}`;
}

function ensureOrderIds() {
  let modified = false;
  let last = parseInt(localStorage.getItem("lastOrderNumber") || "4812", 10);
  orders.forEach(o => {
    if (!o.id || !o.id.startsWith("ORD-")) {
      last++;
      o.id = `ORD-${last}`;
      modified = true;
    }
  });
  if (modified) {
    localStorage.setItem("lastOrderNumber", last);
    saveOrders();
  }
}
function formatCurrency(num) {
  if (isNaN(num)) return "0";
  return Number(num).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
function toLocalISODate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}
function escapeHtml(unsafe) {
  return String(unsafe || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
    // still update sold items
    displayTodaysSoldItems();
    displayBestSaleItem();
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  ordersListEl.innerHTML = "";

  pageItems.forEach((order, idx) => {
    const globalIndex = orders.findIndex(o => o === order); // stable index against original array
    const dateStr = order.date ? new Date(order.date).toLocaleString() : "-";
    const div = document.createElement("div");
    div.className = "order-card";
    div.innerHTML = `
      <div class="order-header">
        <h3>Order #${escapeHtml(order.id)} ${order.kot ? "(KOT)" : ""}</h3>
        <small>${escapeHtml(dateStr)}</small>
      </div>

      <div class="order-items">
        <ul>${(order.items || []).map(it => {
          const variantText = it.variant ? ` (${escapeHtml(it.variant)})` : "";
          return `<li>
            <span>${escapeHtml(it.name)}${variantText} x${escapeHtml(it.qty)}</span>
            <span>₹${formatCurrency((it.price||0) * (it.qty||0))}</span>
          </li>`;
        }).join("")}</ul>
      </div>

      <p><strong>Total: ₹${formatCurrency(order.total || 0)}</strong></p>
      <p><strong>Customer:</strong> ${escapeHtml(order.customerName || "-")} | <strong>Mobile:</strong> ${escapeHtml(order.customerNumber || order.customerMobile || "-")}</p>

      <div class="order-actions">
        <button class="green-btn" data-action="edit" data-idx="${globalIndex}">✏️ Edit</button>
        <button class="blue-btn" data-action="print" data-idx="${globalIndex}">🖨️ Print</button>
        <button class="orange-btn" data-action="pdf" data-idx="${globalIndex}">📄 Bill PDF</button>
        <button class="red-btn" data-action="delete" data-idx="${globalIndex}">🗑️ Delete</button>
      </div>
    `;
    ordersListEl.appendChild(div);
  });

  renderPagination(totalPages);
  displayTodaysSoldItems();

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
    paginationEl.appendChild(makeBtn(String(p), false, p === currentPage, () => {
      currentPage = p; renderOrders();
    }));
  }

  paginationEl.appendChild(makeBtn("Next ›", currentPage === totalPages, false, () => {
    if (currentPage < totalPages) { currentPage++; renderOrders(); }
  }));
}

/* ========= CRUD: Delete & Edit ========= */
function deleteOrder(index) {
  if (!Number.isInteger(index) || index < 0 || index >= orders.length) return;
  if (confirm("Delete this order?")) {
    orders.splice(index, 1);
    saveOrders();
    renderOrders();
  }
}

function openEdit(index) {
  if (!Number.isInteger(index) || index < 0 || index >= orders.length) return;
  editIndex = index;
  const order = orders[index];

  itemsContainer.innerHTML = "";
  (order.items || []).forEach(i => addItemRow(i.name, i.price, i.qty, i.variant || ""));

  document.getElementById("customerName").value = order.customerName || "";
  document.getElementById("customerNumber").value = order.customerNumber || order.customerMobile || "";
  document.getElementById("orderDateEdit").value = toLocalISODate(order.date) || "";
  updateModalTotal();
  try { editModal.showModal(); } catch (e) { editModal.setAttribute('open',''); }
}


function addItemRow(name = "", price = "", qty = "", variant = "") {
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <input type="text" placeholder="Item name" value="${escapeHtml(name)}">
    <input type="text" placeholder="Variant (optional)" value="${escapeHtml(variant)}">
    <input type="number" placeholder="Price" value="${escapeHtml(price)}" min="0">
    <input type="number" placeholder="Qty" value="${escapeHtml(qty)}" min="1">
    <button type="button" class="remove-item">🗑️</button>
  `;
  row.querySelector(".remove-item").onclick = () => { row.remove(); updateModalTotal(); };
  row.querySelectorAll("input").forEach(inp => inp.oninput = updateModalTotal);
  itemsContainer.appendChild(row);
  updateModalTotal();
}


/* handle edit form submit */
editForm?.addEventListener("submit", e => {
  e.preventDefault();

  const updatedItems = [];
  itemsContainer.querySelectorAll(".item-row").forEach(row => {
    const [nameEl, variantEl, priceEl, qtyEl] = row.querySelectorAll("input, select");
    const name = nameEl.value.trim();
    const variant = variantEl.value.trim();
    const price = parseFloat(priceEl.value || 0);
    const qty = parseInt(qtyEl.value || 0, 10);
    if (name && price > 0 && qty > 0) {
      updatedItems.push({ name, variant, price, qty });
    }
  });

  if (updatedItems.length === 0) return alert("Please add valid items.");

  const total = updatedItems.reduce((s, i) => s + i.price * i.qty, 0);
  orders[editIndex].items = updatedItems;
  orders[editIndex].total = total;
  orders[editIndex].customerName = document.getElementById("customerName").value.trim();
  orders[editIndex].customerNumber = document.getElementById("customerNumber").value.trim();
  const newDate = document.getElementById("orderDateEdit").value;
  if (newDate) orders[editIndex].date = new Date(newDate).toISOString();
  saveOrders();
  try { editModal.close(); } catch(e){ editModal.removeAttribute('open'); }
  renderOrders();
});



/* ========= PRINT / EXPORT ========= */
function printOrder(index) {
  const o = orders[index];
  if (!o) return alert("Order not found!");

  const w = window.open("", "_blank");
  w.document.write(`
    <html>
    <head>
      <title>Order #${escapeHtml(o.id)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
        tfoot td { font-weight: bold; }
      </style>
    </head>
    <body>
      <h2>Street Magic Restaurant</h2>
      <p><strong>Order:</strong> ${escapeHtml(o.id)}<br>
      <strong>Date:</strong> ${new Date(o.date).toLocaleString()}<br>
      <strong>Customer:</strong> ${escapeHtml(o.customerName || "-")}<br>
      <strong>Mobile:</strong> ${escapeHtml(o.customerNumber || "-")}</p>

      <table>
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${(o.items || []).map(it => `
            <tr>
              <td>${escapeHtml(it.name)}${it.variant ? ` (${escapeHtml(it.variant)})` : ""}</td>
              <td>${escapeHtml(it.qty)}</td>
              <td>₹${formatCurrency(it.price)}</td>
              <td>₹${formatCurrency(it.price * it.qty)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr><td colspan="3">Total</td><td>₹${formatCurrency(o.total || 0)}</td></tr>
        </tfoot>
      </table>

      <script>
        window.print();
        window.onafterprint = () => window.close();
      <\/script>
    </body>
    </html>
  `);
  w.document.close();
}


printAllBtn?.addEventListener("click", () => {
  const w = window.open("", "_blank");
  w.document.write("<h2>All Orders Summary</h2>");
  orders.forEach(o => {
    w.document.write(`<h4>Order #${escapeHtml(o.id)} - ${escapeHtml(new Date(o.date).toLocaleString())}</h4>`);
    w.document.write("<ul>" + (o.items||[]).map(i => `<li>${escapeHtml(i.name)} x${i.qty} - ₹${formatCurrency(i.price * i.qty)}</li>`).join("") + "</ul>");
    w.document.write(`<p><b>Total: ₹${formatCurrency(o.total||0)}</b></p>`);
    w.document.write(`<p>Customer: ${escapeHtml(o.customerName||"-")} | Mobile: ${escapeHtml(o.customerNumber||"-")}</p><hr>`);
  });
  w.document.write("<script>window.print();<\/script>");
  w.document.close();
});

/* Export CSV */
function exportToCSV() {
  const filtered = getFilteredOrdersList();
  const rows = [["Order ID","Date","Customer","Mobile","Item Name","Qty","Price","Item Total","Order Total"]];
  filtered.forEach(o => {
    (o.items||[]).forEach(it => {
      rows.push([
        o.id || "",
        new Date(o.date).toLocaleString(),
        o.customerName || "",
        o.customerNumber || o.customerMobile || "",
        it.name || "",
        it.qty || 0,
        it.price || 0,
        (it.qty || 0) * (it.price || 0),
        o.total || 0
      ]);
    });
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders_export_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* Export Excel (SheetJS) */
function exportToExcel() {
  const filtered = getFilteredOrdersList();
  const wb = XLSX.utils.book_new();
  const rows = [["Order ID","Date","Customer","Mobile","Item Name","Qty","Price","Item Total","Order Total"]];
  filtered.forEach(o => {
    (o.items||[]).forEach(it => {
      rows.push([
        o.id || "",
        new Date(o.date).toLocaleString(),
        o.customerName || "",
        o.customerNumber || o.customerMobile || "",
        it.name || "",
        it.qty || 0,
        it.price || 0,
        (it.qty || 0) * (it.price || 0),
        o.total || 0
      ]);
    });
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  XLSX.writeFile(wb, `orders_export_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/* Export All Orders as simple PDF */
function exportAllToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt" });
  let y = 40;
  doc.setFontSize(16);
  doc.text("Street Magic - Orders Export", 40, y);
  y += 24;
  doc.setFontSize(12);

  const filtered = getFilteredOrdersList();
  filtered.forEach(o => {
    doc.text(`Order: ${o.id} — ${new Date(o.date).toLocaleString()}`, 40, y); y += 16;
    (o.items||[]).forEach(it => {
      const line = `${it.name} x${it.qty} — ₹${formatCurrency((it.price||0) * (it.qty||0))}`;
      doc.text(line, 60, y); y += 14;
      if (y > 720) { doc.addPage(); y = 40; }
    });
    doc.text(`Total: ₹${formatCurrency(o.total||0)}`, 40, y); y += 20;
    doc.line(40, y, 550, y); y += 12;
    if (y > 720) { doc.addPage(); y = 40; }
  });

  doc.save(`orders_${new Date().toISOString().slice(0,10)}.pdf`);
}

/* ========= NORMALIZED DATE HELPER ========= */
function getLocalDateKey(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // e.g. "2025-10-14"
}

/* ========= FIXED TODAY'S SOLD ITEMS ========= */
function displayTodaysSoldItems() {
  const ordersLocal = JSON.parse(localStorage.getItem("orders")) || [];

  // Use filterDate if set, otherwise today's date
  const dateKey = filterDate || getLocalDateKey(new Date());

  const filteredOrders = ordersLocal.filter(o => {
    const orderDate = getLocalDateKey(o.date);
    return orderDate === dateKey && Array.isArray(o.items);
  });

  const soldItems = {};
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const name = (item.name || "Unnamed Item").trim();
      const qty = Number(item.qty) || 1;
      soldItems[name] = (soldItems[name] || 0) + qty;
    });
  });

  if (!soldListContainer) return;
  soldListContainer.innerHTML = "";

  const labelDate = filterDate
  ? new Date(filterDate).toLocaleDateString()
  : new Date().toLocaleDateString();

// Update header title dynamically (optional)
if (soldHeader) {
  const span = soldHeader.querySelector("span");
  if (span) span.textContent = `Sold Items (${labelDate})`;
}



  if (Object.keys(soldItems).length === 0) {
    soldListContainer.innerHTML = `<p>No items sold on ${labelDate}.</p>`;
    return;
  }

  const ul = document.createElement("ul");
  Object.entries(soldItems)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, qty]) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="sold-name">${escapeHtml(name)}</span><span class="sold-qty">${qty}</span>`;
      ul.appendChild(li);
    });
  soldListContainer.appendChild(ul);
}

/* ========= EVENT ATTACHMENTS (UPDATED) ========= */
function attachEvents() {
  // Delegated actions for order card buttons
  ordersListEl.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const action = btn.dataset.action;
    if (action === "edit") openEdit(idx);
    if (action === "print") printOrder(idx);
    if (action === "pdf") downloadBillPDF(idx);
    if (action === "delete") { deleteOrder(idx); displayTodaysSoldItems(); }
  });

  document.getElementById("addItemBtn")?.addEventListener("click", () => addItemRow());

  // ✅ Clear Filter button now resets filters only
  clearFilterBtn?.addEventListener("click", () => {
  filterDate = "";
  searchText = "";
  sortMode = "newest";
  orderDateEl.value = "";
  searchTextEl.value = "";
  sortSelect.value = "newest";
  currentPage = 1;
  renderOrders();
  displayBestSaleItem(); // ✅ add this
});


  // ✅ NEW Delete All button (must exist in HTML)
  const deleteAllBtn = document.getElementById("deleteAllBtn");
  deleteAllBtn?.addEventListener("click", () => {
    if (!confirm("⚠️ Delete ALL saved orders permanently? This cannot be undone.")) return;
    localStorage.removeItem("orders");
    localStorage.removeItem("lastOrderNumber");
    orders = [];
    saveOrders();
    renderOrders();
    displayTodaysSoldItems();
    displayBestSaleItem();
  });

  orderDateEl?.addEventListener("change", e => {
  filterDate = e.target.value;
  currentPage = 1;
  renderOrders();
  displayBestSaleItem(); // ✅ refresh best sale based on selected date
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

  let searchDebounce;
  searchTextEl?.addEventListener("input", e => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchText = e.target.value || "";
      currentPage = 1;
      renderOrders();
    }, 300);
  });

  exportCSVBtn?.addEventListener("click", exportToCSV);
  exportExcelBtn?.addEventListener("click", exportToExcel);
  exportPDFBtn?.addEventListener("click", exportAllToPDF);

  // Sold header toggle (collapsible)
  if (soldHeader && soldListContainer) {
    soldHeader.addEventListener("click", () => {
      const hidden = soldListContainer.classList.toggle("hidden");
      triangle.style.transform = hidden ? "rotate(-90deg)" : "rotate(0deg)";
      soldHeader.setAttribute("aria-expanded", !hidden);
    });
  }

  // Auto-refresh sold items every 5 seconds
  setInterval(displayTodaysSoldItems, 5000);
}


/* Download single order as formatted PDF */
function downloadBillPDF(index) {
  const o = orders[index];
  if (!o) return alert("Order not found!");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text("Street Magic Restaurant", 14, y);
  y += 10;
  doc.setFontSize(11);
  doc.text(`Order ID: ${o.id}`, 14, y); y += 8;
  doc.text(`Date: ${new Date(o.date).toLocaleString()}`, 14, y); y += 8;
  doc.text(`Customer: ${o.customerName || "-"}`, 14, y); y += 8;
  doc.text(`Mobile: ${o.customerNumber || "-"}`, 14, y); y += 12;

  doc.line(14, y, 195, y); y += 6;
  doc.text("Item", 14, y);
  doc.text("Qty", 90, y);
  doc.text("Price", 130, y);
  doc.text("Total", 170, y);
  y += 4;
  doc.line(14, y, 195, y); y += 6;

  doc.setFontSize(10);
  (o.items || []).forEach(it => {
    doc.text(`${it.name}${it.variant ? " (" + it.variant + ")" : ""}`, 14, y);
    doc.text(String(it.qty), 90, y);
    doc.text(`Rs. ${formatCurrency(it.price)}`, 130, y);
    doc.text(`Rs. ${formatCurrency(it.price * it.qty)}`, 170, y);
    y += 6;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  y += 4;
  doc.line(14, y, 195, y); y += 8;
  doc.setFontSize(12);
  doc.text(`Grand Total: Rs. ${formatCurrency(o.total || 0)}`, 14, y);
  doc.save(`${o.id}_Bill.pdf`);
}


/* ========= BEST SALE ITEM (RESPECTS FILTER DATE) ========= */
function displayBestSaleItem() {
  const ordersLocal = JSON.parse(localStorage.getItem("orders")) || [];
  const dateKey = filterDate || getLocalDateKey(new Date());

  const filteredOrders = ordersLocal.filter(o => {
    const orderDate = getLocalDateKey(o.date);
    return orderDate === dateKey && Array.isArray(o.items);
  });

  const soldItems = {};
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const name = (item.name || "Unnamed Item").trim();
      const qty = Number(item.qty) || 1;
      soldItems[name] = (soldItems[name] || 0) + qty;
    });
  });

  const container = document.getElementById("bestSaleContainer");
  if (!container) return;
  container.innerHTML = "";

  const labelDate = filterDate
    ? new Date(filterDate).toLocaleDateString()
    : new Date().toLocaleDateString();

  const entries = Object.entries(soldItems).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    container.innerHTML = `<p>No sales on ${labelDate}.</p>`;
    return;
  }

  const [bestItem, qty] = entries[0];
  container.innerHTML = `
    <div class="best-sale-card">
      <h3>${escapeHtml(bestItem)}</h3>
      <p><strong>Qty Sold:</strong> ${qty}</p>
      <p><strong>Date:</strong> ${labelDate}</p>
    </div>
  `;
}

/* ========= STARTUP ========= */
document.addEventListener("DOMContentLoaded", () => {
  // default pageSize + sort
  pageSize = Number(pageSizeEl?.value) || 10;
  sortMode = sortSelect?.value || "newest";

  // Seed sample data if empty (optional)
  if (!orders || orders.length === 0) {
    const seed = [
      { id: generateOrderId(), date: new Date().toISOString(), items: [{name:"Egg Fried Rice", price:140, qty:2}], total:280, customerName:"", customerNumber:"" },
      { id: generateOrderId(), date: new Date().toISOString(), items: [{name:"Chicken Fried Rice", price:160, qty:1},{name:"Soft Drinks", price:40, qty:1}], total:200, customerName:"", customerNumber:"" }
    ];
    // orders = seed;
    // saveOrders();
  }

  attachEvents();
  renderOrders();
  displayTodaysSoldItems();
  displayBestSaleItem();
});


/* ========= UPDATE MODAL TOTAL ========= */
function updateModalTotal() {
  const rows = itemsContainer.querySelectorAll(".item-row");
  let total = 0;

  rows.forEach(row => {
    const priceEl = row.querySelector('input[placeholder="Price"]');
    const qtyEl = row.querySelector('input[placeholder="Qty"]');
    const price = parseFloat(priceEl?.value || 0);
    const qty = parseInt(qtyEl?.value || 0, 10);
    if (!isNaN(price) && !isNaN(qty)) {
      total += price * qty;
    }
  });

  if (modalTotal) {
    modalTotal.textContent = `₹${formatCurrency(total)}`;
  }
}



