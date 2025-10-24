document.addEventListener('DOMContentLoaded', function () {

  // ========= GLOBAL VARIABLES =========
  let customers = JSON.parse(localStorage.getItem("customers")) || [];
  let editIndex = -1;
  let undoStack = [];

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
    // Apply filter
    const type = filterType?.value || "all";
    if (type === "new") filtered = filtered.filter(c => c.totalOrders === 1);
    else if (type === "repeat") filtered = filtered.filter(c => c.totalOrders > 1);
    else if (type === "wrong") filtered = filtered.filter(c => !/^\d{10}$/.test(c.phone));

    filtered = [...filtered].sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));

    customersList.innerHTML = filtered.map((c, i) => {
      const rewards = calculateRewards(c);
      const tier = rewardTier(c);
      const tierBadge = tier ? `<span class="ml-1 px-2 py-1 text-sm bg-yellow-300 rounded">${tier}</span>` : "";
      return `
        <tr data-phone="${c.phone}" class="hover:bg-gray-50">
          <td class="p-2 border">${i + 1}</td>
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
  }

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

  // ========= CHART =========
  let chartInstance = null;
  function renderCharts() {
    if (!customersChartEl) return;
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
  }

  // ========= INITIALIZE =========
  syncFromOrders();
  renderCustomers();

});
