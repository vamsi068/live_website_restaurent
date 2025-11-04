document.addEventListener('DOMContentLoaded', function () {

  // ========= GLOBAL VARIABLES =========
  let customers = JSON.parse(localStorage.getItem("customers")) || [];
  let editIndex = -1;
  let undoStack = [];
  let filterMonth = "";


  // ========= DOM ELEMENTS =========
  const customersList = document.getElementById("customersList");
  const addCustomerBtn = document.getElementById("addCustomerBtn");
  const customerModal = document.getElementById("customerModal");
  const closeCustomerModal = document.getElementById("closeCustomerModal");
  const saveCustomerBtn = document.getElementById("saveCustomerBtn");
  const modalTitle = document.getElementById("modalTitle");
  const searchInput = document.getElementById("searchInput");
  const filterType = document.getElementById("filterType");

  const inputName = document.getElementById("customerName");
  const inputPhone = document.getElementById("customerPhone");
  const inputOrders = document.getElementById("customerOrders");
  const inputAmount = document.getElementById("customerAmount");

  const newCustEl = document.getElementById("newCustomersCount");
  const repeatCustEl = document.getElementById("repeatCustomersCount");
  const totalCustEl = document.getElementById("totalCustomersCount");
  const wrongCustEl = document.getElementById("wrongNumbersCount");

  const exportPDFBtn = document.getElementById("exportPDFBtn");
  const exportCSVBtn = document.getElementById("exportCSVBtn");
  const backupJSONBtn = document.getElementById("backupJSONBtn");
  const restoreJSONInput = document.getElementById("restoreJSONInput");
  const toastContainer = document.getElementById("toastContainer");
  const customersChartEl = document.getElementById("customersChart");

  // ========= HELPER FUNCTIONS =========

  function calculateRewards(c) {
    if (!c.totalOrders || c.totalOrders < 10) return 0;
    const earned = Math.floor(c.totalOrders / 10);
    const redeemed = c.redeemed || 0;
    return Math.max(0, earned - redeemed);
  }

  function rewardTier(c) {
    if (c.totalOrders >= 50) return "Gold";
    if (c.totalOrders >= 20) return "Silver";
    if (c.totalOrders >= 10) return "Bronze";
    return "";
  }

  function showToast(msg, type = "info") {
    const colors = {
      info: "bg-blue-500",
      success: "bg-green-500",
      warn: "bg-yellow-500",
      error: "bg-red-500"
    };
    const div = document.createElement("div");
    div.textContent = msg;
    div.className = `${colors[type] || colors.info} text-white px-4 py-2 rounded shadow transition-all`;
    toastContainer.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }

  function saveCustomers() {
    localStorage.setItem("customers", JSON.stringify(customers));
  }

  function updateOrdersWithCustomerChange(oldPhone, newPhone, newName) {
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    let changed = false;
    orders = orders.map(order => {
      if (order.customerMobile === oldPhone) {
        order.customerMobile = newPhone;
        order.customerName = newName;
        changed = true;
      }
      return order;
    });
    if (changed) localStorage.setItem("orders", JSON.stringify(orders));
  }

  // ========= SYNC FROM ORDERS =========
  function syncFromOrders() {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const aggregated = {};

    orders.forEach(order => {
      const mobile = order.customerMobile?.trim();
      const name = order.customerName?.trim() || "Unknown";
      if (!mobile) return;

      if (!aggregated[mobile]) {
        aggregated[mobile] = { name, phone: mobile, totalOrders: 0, amount: 0, redeemed: 0 };
      }

      aggregated[mobile].totalOrders += 1;
      aggregated[mobile].amount += parseFloat(order.total || 0);
    });

    Object.values(aggregated).forEach(orderCust => {
      const existing = customers.find(c => c.phone === orderCust.phone);
      if (existing) {
        existing.name = orderCust.name;
        existing.totalOrders = orderCust.totalOrders;
        existing.amount = orderCust.amount;
        existing.redeemed = existing.redeemed || 0;
      } else {
        customers.push(orderCust);
      }
    });

    customers = customers.filter(c => c.phone && c.phone !== "undefined");
    saveCustomers();
  }

  // ========= RENDER FUNCTIONS =========

  function renderStats() {
    const total = customers.length;
    const newC = customers.filter(c => c.totalOrders === 1).length;
    const repeatC = total - newC;
    const wrongC = customers.filter(c => !/^\d{10}$/.test(c.phone)).length;

    if (newCustEl) newCustEl.textContent = newC;
    if (repeatCustEl) repeatCustEl.textContent = repeatC;
    if (totalCustEl) totalCustEl.textContent = total;
    if (wrongCustEl) wrongCustEl.textContent = wrongC;
  }

  function renderBestCustomer() {
  const section = document.getElementById("bestCustomerDetails");
  if (!section) return;

  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  if (orders.length === 0) {
    section.innerHTML = `<p class="text-gray-500 italic">No orders found this month.</p>`;
    return;
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter only current month’s orders
  const monthlyOrders = orders.filter(order => {
    const date = new Date(order.date || order.createdAt || order.orderDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  if (monthlyOrders.length === 0) {
    section.innerHTML = `<p class="text-gray-500 italic">No customers have placed orders this month.</p>`;
    return;
  }

  // Aggregate spending per customer
  const spendingMap = {};
  monthlyOrders.forEach(order => {
    const phone = order.customerMobile?.trim();
    const name = order.customerName?.trim() || "Unknown";
    const total = parseFloat(order.total || 0);
    if (!phone) return;
    if (!spendingMap[phone]) spendingMap[phone] = { name, phone, amount: 0 };
    spendingMap[phone].amount += total;
  });

  // Find top spender
  const best = Object.values(spendingMap).sort((a, b) => b.amount - a.amount)[0];
  if (!best) {
    section.innerHTML = `<p class="text-gray-500 italic">No best customer found this month.</p>`;
    return;
  }

  section.innerHTML = `
    <div class="bg-yellow-100 border border-yellow-300 rounded-lg p-4 inline-block shadow-md">
      <p class="text-2xl font-bold text-yellow-800">${best.name}</p>
      <p class="text-gray-700">📞 ${best.phone}</p>
      <p class="text-xl text-green-700 font-semibold">💰 ₹${best.amount.toFixed(2)} Spent</p>
      <p class="text-sm text-gray-600 mt-1">Month: ${now.toLocaleString("default", { month: "long", year: "numeric" })}</p>
    </div>
  `;
}


  function renderWrongNumbers() {
    const list = document.getElementById("wrongNumbersList");
    if (!list) return;
    const wrongs = customers.filter(c => !/^\d{10}$/.test(c.phone));
    if (wrongs.length === 0) {
      list.innerHTML = `<tr><td colspan="5" class="text-center text-red-600 py-2">No wrong numbers found</td></tr>`;
    } else {
      list.innerHTML = wrongs.map((c, i) => `
        <tr class="bg-red-50">
          <td class="p-2 border">${i + 1}</td>
          <td class="p-2 border">${c.name}</td>
          <td class="p-2 border">${c.phone}</td>
          <td class="p-2 border">${c.totalOrders}</td>
          <td class="p-2 border">${c.amount?.toFixed(2) || "0.00"}</td>
        </tr>`).join("");
    }
  }

  function renderCustomers(filtered = customers) {
  const type = filterType?.value || "all";
  // 🔹 Filter by Month (based on orders)
  if (filterMonth) {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const filteredPhones = new Set();

    orders.forEach(o => {
      const date = new Date(o.date || o.createdAt || o.orderDate);
      if (!isNaN(date)) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (monthKey === filterMonth) {
          if (o.customerMobile) filteredPhones.add(o.customerMobile.trim());
        }
      }
    });

    filtered = filtered.filter(c => filteredPhones.has(c.phone));
  }

  if (type === "new") filtered = filtered.filter(c => c.totalOrders === 1);
  else if (type === "repeat") filtered = filtered.filter(c => c.totalOrders > 1);
  else if (type === "wrong") filtered = filtered.filter(c => !/^\d{10}$/.test(c.phone));

  filtered = [...filtered].sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));

  // Apply pagination
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  customersList.innerHTML = paginated.map((c, i) => {
    const rewards = calculateRewards(c);
    const tier = rewardTier(c);
    const tierBadge = tier ? `<span class="ml-1 px-2 py-1 text-sm bg-yellow-300 rounded">${tier}</span>` : "";
    return `
      <tr data-phone="${c.phone}" class="hover:bg-gray-50">
        <td class="p-2 border">${start + i + 1}</td>
        <td class="p-2 border">${c.name}${tierBadge}</td>
        <td class="p-2 border">${c.phone}</td>
        <td class="p-2 border">${c.totalOrders}</td>
        <td class="p-2 border">${rewards > 0 ? `🎉 ${rewards} Free Meal${rewards > 1 ? "s" : ""}` : "No Rewards"}</td>
        <td class="p-2 border">${c.amount?.toFixed(2) || "0.00"}</td>
        <td class="p-2 border">
          <button class="redeem-btn bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">${rewards > 0 ? "Redeem 1" : "No Rewards"}</button>
        </td>
        <td class="p-2 flex gap-2">
          <button class="edit-btn bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Edit</button>
          <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Delete</button>
          <button class="whatsapp-btn bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600">📄 WhatsApp</button>
        </td>
      </tr>`;
  }).join("");

  attachHandlers();
  renderStats();
  renderWrongNumbers();
  renderCharts();
  renderPagination(filtered.length);
}


  // ========= PAGINATION =========
  let currentPage = 1;
  const pageSize = 10;

  function renderPagination(totalItems) {
  const paginationContainer = document.getElementById("paginationContainer");
  if (!paginationContainer) return;

  const totalPages = Math.ceil(totalItems / pageSize);
  let html = `<div class="flex justify-center items-center mt-4 flex-wrap gap-1">`;

  // Prev button
  html += `<button class="px-3 py-1 border rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}" ${currentPage === 1 ? 'disabled' : 'onclick="changePage(' + (currentPage - 1) + ')"'}>‹ Prev</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="px-3 py-1 border rounded ${i === currentPage ? 'bg-teal-600 text-white' : 'bg-white hover:bg-gray-100'}" onclick="changePage(${i})">${i}</button>`;
  }

  // Next button
  html += `<button class="px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}" ${currentPage === totalPages ? 'disabled' : 'onclick="changePage(' + (currentPage + 1) + ')"'}>Next ›</button>`;

  html += `</div>`;
  paginationContainer.innerHTML = html;
  }

  window.changePage = function (page) {
  currentPage = page;
  renderCustomers();
  };


  // ========= EVENT HANDLERS =========

  function attachHandlers() {
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.onclick = () => {
        const phone = btn.closest("tr").dataset.phone;
        const index = customers.findIndex(c => c.phone === phone);
        if (index === -1) return;
        if (confirm("Delete this customer?")) {
          undoStack.push(customers[index]);
          customers.splice(index, 1);
          saveCustomers();
          renderCustomers();
          showToast("Customer deleted (Undo available for 5s)", "warn");
          setTimeout(() => undoStack.pop(), 5000);
        }
      };
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.onclick = () => {
        const phone = btn.closest("tr").dataset.phone;
        editIndex = customers.findIndex(c => c.phone === phone);
        const c = customers[editIndex];
        modalTitle.textContent = "Edit Customer";
        inputName.value = c.name;
        inputPhone.value = c.phone;
        inputOrders.value = c.totalOrders;
        inputAmount.value = c.amount;
        openModal();
      };
    });

    document.querySelectorAll(".redeem-btn").forEach(btn => {
      btn.onclick = () => {
        const phone = btn.closest("tr").dataset.phone;
        const c = customers.find(c => c.phone === phone);
        const rewards = calculateRewards(c);
        if (rewards > 0 && confirm("Redeem 1 reward?")) {
          c.redeemed = (c.redeemed || 0) + 1;
          saveCustomers();
          renderCustomers();
          showToast("Reward redeemed!", "success");
        } else showToast("No rewards to redeem", "info");
      };
    });

    document.querySelectorAll(".whatsapp-btn").forEach(btn => {
      btn.onclick = () => {
        const phone = btn.closest("tr").dataset.phone;
        const c = customers.find(c => c.phone === phone);
        const rewards = calculateRewards(c);
        const nextOrders = 10 - (c.totalOrders % 10);
        const msg = `Hello ${c.name}! Total Orders: ${c.totalOrders}, Reward Points: ${rewards}. Earn next reward in ${nextOrders} order${nextOrders > 1 ? "s" : ""}.`;
        window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(msg)}`, "_blank");
      };
    });
  }

  // ========= MODAL CONTROL =========
  function openModal() {
    customerModal.classList.remove("hidden");
    customerModal.classList.add("flex");
  }

  function closeModal() {
    customerModal.classList.add("hidden");
    editIndex = -1;
    inputName.value = "";
    inputPhone.value = "";
    inputOrders.value = "";
    inputAmount.value = "";
  }

  addCustomerBtn?.addEventListener("click", () => {
    modalTitle.textContent = "Add Customer";
    openModal();
  });

  closeCustomerModal?.addEventListener("click", closeModal);

  saveCustomerBtn?.addEventListener("click", () => {
    const name = inputName.value.trim();
    const phone = inputPhone.value.trim();
    const orders = parseInt(inputOrders.value) || 0;
    const amount = parseFloat(inputAmount.value) || 0;
    if (!name || !phone) return showToast("Name and phone required", "error");

    if (editIndex >= 0) {
      const oldPhone = customers[editIndex].phone;
      customers[editIndex] = { ...customers[editIndex], name, phone, totalOrders: orders, amount };
      updateOrdersWithCustomerChange(oldPhone, phone, name);
    } else {
      customers.push({ name, phone, totalOrders: orders, amount, redeemed: 0 });
    }
    saveCustomers();
    renderCustomers();
    closeModal();
    showToast("Customer saved!", "success");
  });

  // ========= EXPORTS =========

  exportCSVBtn?.addEventListener("click", () => {
    if (customers.length === 0) return showToast("No customer data to export", "warn");
    const headers = ["Name", "Mobile", "Total Orders", "Rewards", "Amount", "Redeemed"];
    const rows = customers.map(c => [
      c.name, c.phone, c.totalOrders, calculateRewards(c), c.amount?.toFixed(2) || "0.00", c.redeemed || 0
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported!", "success");
  });

  exportPDFBtn?.addEventListener("click", () => {
    const element = document.querySelector("main");
    html2pdf().from(element).set({
      margin: 0.2,
      filename: "customers.pdf",
      html2canvas: { scale: 2 }
    }).save();
  });

  backupJSONBtn?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(customers, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers_backup.json";
    a.click();
    showToast("Backup JSON exported!", "success");
  });

  restoreJSONInput?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data)) {
          customers = data;
          saveCustomers();
          renderCustomers();
          showToast("JSON restored successfully!", "success");
        }
      } catch {
        showToast("Invalid JSON file!", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // ========= SEARCH & FILTER =========
  searchInput?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    let filtered = customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    const type = filterType.value;
    if (type === "new") filtered = filtered.filter(c => c.totalOrders === 1);
    if (type === "repeat") filtered = filtered.filter(c => c.totalOrders > 1);
    if (type === "wrong") filtered = filtered.filter(c => !/^\d{10}$/.test(c.phone));
    renderCustomers(filtered);
  });

  filterType?.addEventListener("change", () => renderCustomers());

  // ========= MONTH FILTER =========
  const monthFilterEl = document.getElementById("monthFilter");
  monthFilterEl?.addEventListener("change", e => {
    let val = e.target.value.trim();
    if (val.length === 7) filterMonth = val;              // "YYYY-MM"
    else if (val.length >= 10) filterMonth = val.slice(0, 7); // "YYYY-MM-DD" → "YYYY-MM"
    else filterMonth = "";

    currentPage = 1;
    renderCustomers();
    renderBestCustomer();
  });

  // ========= CHART =========
  let chartInstance = null;
  let frequencyChartInstance = null;

  function renderCharts() {
  if (!customersChartEl) return;

  // === Chart 1: Customer Analytics ===
  const labels = customers.map(c => c.name);
  const orders = customers.map(c => c.totalOrders);
  const rewards = customers.map(c => calculateRewards(c));

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(customersChartEl, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Total Orders", data: orders, backgroundColor: "rgba(59,130,246,0.6)" },
        { label: "Rewards", data: rewards, backgroundColor: "rgba(253,224,71,0.6)" }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: "top" } } }
  });

  // === Chart 2: Visit Frequency ===
  const visitFrequencyEl = document.getElementById("visitFrequencyChart");
  if (!visitFrequencyEl) return;

  // Build frequency map
  const frequencyMap = {};
  customers.forEach(c => {
    const visits = c.totalOrders || 0;
    if (!frequencyMap[visits]) frequencyMap[visits] = 0;
    frequencyMap[visits]++;
  });

  // Sort by visit count
  const sortedVisits = Object.keys(frequencyMap).sort((a, b) => a - b);
  const visitCounts = sortedVisits.map(k => frequencyMap[k]);

  // Destroy old chart if exists
  if (frequencyChartInstance) frequencyChartInstance.destroy();

  // Render new frequency chart
  frequencyChartInstance = new Chart(visitFrequencyEl, {
    type: "bar",
    data: {
      labels: sortedVisits.map(v => `${v} visit${v > 1 ? "s" : ""}`),
      datasets: [
        {
          label: "Number of Customers",
          data: visitCounts,
          backgroundColor: "rgba(16,185,129,0.6)" // teal color
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: {
          display: true,
          text: "Customer Visit Frequency (How Many Times Each Customer Visited)"
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
  }


  




  // ========= INITIALIZE =========
  syncFromOrders();
  renderCustomers();

});

// ========= CUSTOMER ORDER POPUP =========
const body = document.body;
let popup = null;

function showCustomerPopup(customerPhone, x, y) {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const custOrders = orders.filter(o => o.customerMobile?.trim() === customerPhone);

  if (custOrders.length === 0) {
    hidePopup();
    return;
  }

  hidePopup(); // Remove any existing popup

  // ===== Find Most Repeated Item =====
  const itemFrequency = {};
  custOrders.forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach(i => {
        const name = i.name?.trim() || "Unknown Item";
        itemFrequency[name] = (itemFrequency[name] || 0) + (parseInt(i.qty) || 1);
      });
    }
  });

  let mostRepeatItem = null;
  if (Object.keys(itemFrequency).length > 0) {
    mostRepeatItem = Object.entries(itemFrequency)
      .sort((a, b) => b[1] - a[1])[0]; // [itemName, count]
  }

  // ===== Create Popup =====
  popup = document.createElement("div");
  popup.className = `
    fixed bg-white border border-gray-300 rounded-xl shadow-xl p-6 
    max-w-md max-h-[70vh] overflow-y-auto z-50 transition-all duration-200
  `;

  // ✅ Always center popup on screen
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.width = window.innerWidth < 600 ? "90%" : "500px";
  popup.style.maxWidth = "95vw";
  popup.style.zIndex = "9999";

  // ===== Inner HTML =====
  popup.innerHTML = `
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-lg font-bold text-blue-700 flex items-center gap-2">
        🛍 Purchase History
      </h3>
      <button id="closePopupBtn" class="text-gray-500 hover:text-red-500 text-xl font-bold">&times;</button>
    </div>

    ${
      mostRepeatItem
        ? `<div class="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
             <p class="font-semibold text-yellow-800">⭐ Most Repeated Item:</p>
             <p class="text-gray-800">${mostRepeatItem[0]} 
               <span class="text-sm text-gray-600">(×${mostRepeatItem[1]})</span>
             </p>
           </div>`
        : `<p class="text-gray-500 italic mb-4">No item repetition data available.</p>`
    }

    <ul class="space-y-3">
      ${custOrders.map(o => `
        <li class="border-b pb-2">
          <p><strong>Date:</strong> ${new Date(o.date || o.createdAt || o.orderDate).toLocaleDateString()}</p>
          <p><strong>Items:</strong> ${
            Array.isArray(o.items)
              ? o.items.map(i => `${i.name} (x${i.qty})`).join(", ")
              : (o.items || "—")
          }</p>
          <p><strong>Total:</strong> ₹${parseFloat(o.total || 0).toFixed(2)}</p>
        </li>
      `).join("")}
    </ul>
  `;

  document.body.appendChild(popup);

  // ✅ Close button inside popup
  document.getElementById("closePopupBtn").addEventListener("click", hidePopup);
}


function hidePopup() {
  if (popup) popup.remove();
  const overlay = document.getElementById("popupOverlay");
  if (overlay) overlay.remove();
  popup = null;
}


// ✅ Attach click on table rows
customersList.addEventListener("click", function (e) {
  const row = e.target.closest("tr[data-phone]");
  if (!row) return;

  const phone = row.dataset.phone;
  const rect = row.getBoundingClientRect();
  const x = rect.right + 10;
  const y = rect.top + window.scrollY + 10;

  showCustomerPopup(phone, x, y);
  e.stopPropagation();
});

// ✅ Hide popup on outside click
document.addEventListener("click", function (e) {
  if (popup && !popup.contains(e.target)) {
    hidePopup();
  }
});



