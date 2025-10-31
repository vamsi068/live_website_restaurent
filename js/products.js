// ======================================================
// products.js — Display Purchased Products (Category-wise, No Duplicates, in INR)
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

    // ✅ Check if product already exists in the same category
    const existingProduct = groupedByCategory[category].find(
      (item) => (item.item || item.name) === (p.item || p.name)
    );

    if (existingProduct) {
      // Merge duplicates by adding quantities and recalculating totals
      existingProduct.qty += p.qty;
      existingProduct.totalValue += p.qty * p.price;
    } else {
      // Add new product entry
      groupedByCategory[category].push({
        name: p.item || p.name || "Unnamed",
        qty: p.qty,
        price: p.price,
        totalValue: p.qty * p.price,
        date: p.date,
      });
    }
  });

  // ✅ Render category-wise tables
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
    items.forEach((item) => {
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

    // Category subtotal
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
