// ======================================================
// products.js — Display Purchased Products (Category-wise, in INR)
// ======================================================

function renderProductsTable() {
  const tableBody = document.querySelector("#productsTable tbody");
  const grandTotalEl = document.querySelector("#grandTotal");

  // ✅ Fetch purchases from localStorage
  const purchases = JSON.parse(localStorage.getItem("purchases")) || [];

  tableBody.innerHTML = "";
  let grandTotal = 0;

  if (purchases.length === 0) {
    const emptyRow = `
      <tr>
        <td colspan="7" class="text-center">No purchased products found.</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", emptyRow);
    grandTotalEl.textContent = "₹0.00";
    return;
  }

  // ✅ Group purchases by category
  const groupedByCategory = {};
  purchases.forEach((p) => {
    const category = p.category || "Uncategorized";
    if (!groupedByCategory[category]) groupedByCategory[category] = [];
    groupedByCategory[category].push(p);
  });

  // ✅ Render category-wise tables
  let rowCount = 0;
  for (const [category, items] of Object.entries(groupedByCategory)) {
    let categoryTotal = 0;
    let categoryQty = 0;

    // Add category header row
    const catHeaderRow = `
      <tr class="table-secondary fw-bold text-start">
        <td colspan="7">📦 Category: ${category}</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", catHeaderRow);

    // Add all items in this category
    items.forEach((item) => {
      const total = item.qty * item.price;
      rowCount++;
      categoryTotal += total;
      categoryQty += item.qty;
      grandTotal += total;

      const dateStr = new Date(item.date).toLocaleDateString("en-IN");

      const row = `
        <tr>
          <td>${rowCount}</td>
          <td>${item.item || item.name || "Unnamed"}</td>
          <td>${category}</td>
          <td>${item.qty}</td>
          <td>₹${item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td>₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td>${dateStr}</td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    // Add category subtotal row
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

// Initialize table on page load
document.addEventListener("DOMContentLoaded", renderProductsTable);
