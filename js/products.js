/* ======================================================
   products.js — Display Purchased Products
   (Category-wise, No Duplicates, in INR, with Filters)
   ====================================================== */

let allPurchases = [];

/* ========= DOM READY ========= */
document.addEventListener("DOMContentLoaded", () => {
  const purchases = JSON.parse(localStorage.getItem("purchases")) || [];
  allPurchases = purchases;

  populateMonthFilter(purchases);
  renderProductsTable();

  const applyBtn = document.getElementById("applyFilter");
  const clearBtn = document.getElementById("clearFilter");

  if (applyBtn) applyBtn.addEventListener("click", applyFilter);
  if (clearBtn) clearBtn.addEventListener("click", clearFilter);
});

/* ======================================================
   🗓 Populate Month Dropdown from Existing Purchase Dates
   ====================================================== */
function populateMonthFilter(purchases) {
  const monthFilter = document.getElementById("monthFilter");
  if (!monthFilter) return;

  // Always start with "All"
  monthFilter.innerHTML = `<option value="all">All Months</option>`;

  const monthSet = new Set();

  purchases.forEach(p => {
    if (p.date) {
      const d = new Date(p.date);
      if (!isNaN(d)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthSet.add(key);
      }
    }
  });

  // Sort by most recent month
  const sortedMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

  sortedMonths.forEach(monthKey => {
    const [year, month] = monthKey.split("-");
    const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });
    const opt = document.createElement("option");
    opt.value = monthKey;
    opt.textContent = `${monthName} ${year}`;
    monthFilter.appendChild(opt);
  });
}

/* ======================================================
   🎯 Apply Filters (Category/Item + Month)
   ====================================================== */
function applyFilter() {
  const type = document.getElementById("filterType").value;
  const keyword = document.getElementById("filterInput").value.trim().toLowerCase();
  const monthValue = document.getElementById("monthFilter").value;

  let filtered = [...allPurchases];

  // Filter by category or item
  if (keyword) {
    filtered = filtered.filter(p => {
      if (type === "category") return (p.category || "").toLowerCase().includes(keyword);
      if (type === "item") return (p.item || p.name || "").toLowerCase().includes(keyword);
      return true;
    });
  }

  // Filter by selected month
  if (monthValue !== "all") {
    filtered = filtered.filter(p => {
      if (!p.date) return false;
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === monthValue;
    });
  }

  renderProductsTable(filtered);
}

/* ======================================================
   🔄 Clear Filters
   ====================================================== */
function clearFilter() {
  document.getElementById("filterInput").value = "";
  const monthFilter = document.getElementById("monthFilter");
  if (monthFilter) monthFilter.value = "all";
  renderProductsTable();
}

/* ======================================================
   🧾 Main Table Renderer
   ====================================================== */
function renderProductsTable(filteredList) {
  const tableBody = document.querySelector("#productsTable tbody");
  const grandTotalEl = document.querySelector("#grandTotal");
  const dateRangeEl = document.querySelector("#dateRange");

  const purchases = filteredList || JSON.parse(localStorage.getItem("purchases")) || [];
  allPurchases = JSON.parse(localStorage.getItem("purchases")) || [];

  tableBody.innerHTML = "";
  let grandTotal = 0;

  // ✅ Handle empty purchases
  if (purchases.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No purchased products found.</td></tr>`;
    grandTotalEl.textContent = "₹0.00";
    if (dateRangeEl) dateRangeEl.textContent = "-";
    return;
  }

  // ✅ Calculate min and max purchase dates
  const allDates = purchases.map(p => new Date(p.date)).filter(d => !isNaN(d));
  let dateRangeStr = "-";
  if (allDates.length > 0) {
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    const options = { month: "numeric", year: "numeric" };
    dateRangeStr = `1/${minDate.toLocaleDateString("en-IN", options)} - ${maxDate.getDate()}/${maxDate.toLocaleDateString("en-IN", options)}`;
  }

  if (dateRangeEl) dateRangeEl.textContent = dateRangeStr;

  // ✅ Group by Category
  const groupedByCategory = {};
  purchases.forEach(p => {
    const category = p.category || "Uncategorized";
    if (!groupedByCategory[category]) groupedByCategory[category] = [];

    const existing = groupedByCategory[category].find(
      item => (item.item || item.name) === (p.item || p.name)
    );

    if (existing) {
      existing.qty += p.qty;
      existing.totalValue += p.qty * p.price;
    } else {
      groupedByCategory[category].push({
        name: p.item || p.name || "Unnamed",
        qty: p.qty,
        price: p.price,
        totalValue: p.qty * p.price,
        date: p.date,
      });
    }
  });

  // ✅ Render category-wise sections
  let rowCount = 0;
  for (const [category, items] of Object.entries(groupedByCategory)) {
    let categoryTotal = 0;
    let categoryQty = 0;

    // Category header
    const catHeaderRow = `
      <tr class="table-secondary fw-bold text-start">
        <td colspan="7">📦 Category: ${category}</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", catHeaderRow);

    // Product rows
    items.forEach(item => {
      rowCount++;
      categoryTotal += item.totalValue;
      categoryQty += item.qty;
      grandTotal += item.totalValue;

      const dateStr = item.date
        ? new Date(item.date).toLocaleDateString("en-IN")
        : "-";

      const row = `
        <tr>
          <td>${rowCount}</td>
          <td>${item.name}</td>
          <td>${category}</td>
          <td>${item.qty}</td>
          <td>₹${item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td>₹${item.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td>${dateStr}</td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    // Subtotal
    const subtotalRow = `
      <tr class="table-light fw-semibold text-end">
        <td colspan="3">Subtotal (${categoryQty} items)</td>
        <td colspan="4">₹${categoryTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", subtotalRow);
  }

  // ✅ Update grand total
  grandTotalEl.textContent = `₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}
