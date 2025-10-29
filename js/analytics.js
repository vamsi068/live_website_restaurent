document.addEventListener("DOMContentLoaded", () => {
  const monthInput = document.getElementById("monthFilter");
  const resetBtn = document.getElementById("resetBtn");

  let purchases = JSON.parse(localStorage.getItem("purchases")) || [];
  let orders = JSON.parse(localStorage.getItem("orders")) || [];

  // 🧩 Store chart instances
  let charts = {};

  function destroyChart(id) {
    if (charts[id]) {
      charts[id].destroy();
      delete charts[id];
    }
  }

  function getMonthString(dateStr) {
    return dateStr.slice(0, 7); // "YYYY-MM"
  }

  function filterByMonth(data, month) {
    if (!month) return data;
    return data.filter(d => d.date && d.date.startsWith(month));
  }

  // ========================
  // PURCHASES RENDER FUNCTION
  // ========================
  function renderPurchases(month) {
    const list = filterByMonth(purchases, month);

    // Category grouping (based on name keywords)
    const categoryMap = {
      vegetable: 0,
      grocery: 0,
      meat: 0,
      other: 0
    };

    list.forEach(p => {
      const name = p.product?.toLowerCase() || "";
      const total = (p.price || 0) * (p.quantity || 0);
      if (name.includes("veg") || name.includes("tomato") || name.includes("onion"))
        categoryMap.vegetable += total;
      else if (name.includes("meat") || name.includes("chicken") || name.includes("mutton"))
        categoryMap.meat += total;
      else if (name.includes("rice") || name.includes("oil") || name.includes("sugar") || name.includes("atta"))
        categoryMap.grocery += total;
      else
        categoryMap.other += total;
    });

    // Update summary cards
    const container = document.getElementById("purchaseSummaryCards");
    container.innerHTML = Object.entries(categoryMap)
      .map(([cat, val]) => `
        <div class="card">
          <h4>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h4>
          <p>₹${val.toFixed(2)}</p>
        </div>
      `).join("");

    // 🧨 Destroy old charts before drawing new ones
    destroyChart("purchaseCategoryChart");
    destroyChart("purchaseItemChart");

    // Chart by category
    const ctx1 = document.getElementById("purchaseCategoryChart");
    charts["purchaseCategoryChart"] = new Chart(ctx1, {
      type: "pie",
      data: {
        labels: Object.keys(categoryMap),
        datasets: [{
          data: Object.values(categoryMap),
          backgroundColor: ["#ff9f40", "#4bc0c0", "#9966ff", "#ff6384"]
        }]
      },
      options: { plugins: { legend: { position: "bottom" } } }
    });

    // Chart by item
    const itemTotals = {};
    list.forEach(p => {
      const key = p.product || "Unknown";
      itemTotals[key] = (itemTotals[key] || 0) + (p.price * p.quantity);
    });

    const ctx2 = document.getElementById("purchaseItemChart");
    charts["purchaseItemChart"] = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: Object.keys(itemTotals),
        datasets: [{
          label: "₹ Spent",
          data: Object.values(itemTotals),
          backgroundColor: "#36a2eb"
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

  // =====================
  // ORDERS RENDER FUNCTION
  // =====================
  function renderOrders(month) {
    const list = filterByMonth(orders, month);

    const totalOrders = list.length;
    const itemCount = {};

    list.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(i => {
          itemCount[i.name] = (itemCount[i.name] || 0) + i.quantity;
        });
      }
    });

    // Summary cards
    const container = document.getElementById("orderSummaryCards");
    container.innerHTML = `
      <div class="card">
        <h4>Total Orders</h4>
        <p>${totalOrders}</p>
      </div>
      <div class="card">
        <h4>Unique Items</h4>
        <p>${Object.keys(itemCount).length}</p>
      </div>
    `;

    // 🧨 Destroy old chart before creating new
    destroyChart("orderItemChart");

    // Chart by items
    const ctx3 = document.getElementById("orderItemChart");
    charts["orderItemChart"] = new Chart(ctx3, {
      type: "bar",
      data: {
        labels: Object.keys(itemCount),
        datasets: [{
          label: "Item Count",
          data: Object.values(itemCount),
          backgroundColor: "#ff6384"
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

  // =================
  // MAIN RENDER LOGIC
  // =================
  function renderAll() {
    const month = monthInput.value;
    renderPurchases(month);
    renderOrders(month);
  }

  monthInput.addEventListener("change", renderAll);
  resetBtn.addEventListener("click", () => {
    monthInput.value = "";
    renderAll();
  });

  renderAll(); // initial load
});
