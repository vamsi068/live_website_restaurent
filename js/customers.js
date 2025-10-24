document.addEventListener('DOMContentLoaded', function () {

  // ========= GLOBAL VARIABLES =========
  let customers = JSON.parse(localStorage.getItem("customers")) || [];
  let editIndex = -1;

  // ========= DOM ELEMENTS =========
  const customersList = document.getElementById("customersList");
  const addCustomerBtn = document.getElementById("addCustomerBtn");
  const customerModal = document.getElementById("customerModal");
  const closeCustomerModal = document.getElementById("closeCustomerModal");
  const saveCustomerBtn = document.getElementById("saveCustomerBtn");
  const modalTitle = document.getElementById("modalTitle");
  const searchInput = document.getElementById("searchInput");

  const inputName = document.getElementById("customerName");
  const inputPhone = document.getElementById("customerPhone");
  const inputOrders = document.getElementById("customerOrders");
  const inputAmount = document.getElementById("customerAmount");

  // 🔹 Stats section elements
  const newCustEl = document.getElementById("newCustomersCount");
  const repeatCustEl = document.getElementById("repeatCustomersCount");
  const totalCustEl = document.getElementById("totalCustomersCount");

  // ========= HELPER FUNCTIONS =========

  // Calculate rewards
  function calculateRewards(customer) {
    if (!customer.totalOrders || customer.totalOrders < 10) return 0;
    const totalEarned = Math.floor(customer.totalOrders / 10);
    const redeemed = customer.redeemed || 0;
    return Math.max(0, totalEarned - redeemed);
  }

  // Update customer details inside saved orders
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

  // Sync customers from orders
  function syncFromOrders() {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const aggregated = {};

    orders.forEach(order => {
      const mobile = order.customerMobile?.trim();
      const name = order.customerName?.trim() || "Unknown";
      if (!mobile) return;

      if (!aggregated[mobile]) {
        aggregated[mobile] = {
          name,
          phone: mobile,
          totalOrders: 0,
          amount: 0,
          redeemed: 0
        };
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

  // Save customers
  function saveCustomers() {
    localStorage.setItem("customers", JSON.stringify(customers));
  }

  // ========= RENDER FUNCTION (uses phone as unique ID) =========
  function renderCustomers(filtered = customers) {
  if (!customersList) return;

  filtered = [...filtered].sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));

  customersList.innerHTML = filtered.map((c, i) => {
    const totalRewards = calculateRewards(c);
    const redeemed = c.redeemed || 0;
    const remainingRewards = Math.max(0, totalRewards - redeemed);
    const rewardText = remainingRewards > 0
      ? `🎉 ${remainingRewards} Free Meal${remainingRewards > 1 ? 's' : ''} Available`
      : "No Rewards";

    return `
      <tr data-phone="${c.phone}">
        <td class="p-2">${i + 1}</td>
        <td class="p-2">${c.name}</td>
        <td class="p-2">${c.phone}</td>
        <td class="p-2">${c.totalOrders}</td>
        <td class="p-2">${rewardText}</td>
        <td class="p-2">${c.amount ? c.amount.toFixed(2) : "0.00"}</td>
        <td class="p-2">
          <button data-phone="${c.phone}" class="redeem-btn bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
            ${remainingRewards > 0 ? "Redeem 1" : "No Rewards"}
          </button>
        </td>
        <td class="p-2 actions flex gap-2">
          <button data-phone="${c.phone}" class="edit-btn bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Edit</button>
          <button data-phone="${c.phone}" class="delete-btn bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Delete</button>
          <button data-phone="${c.phone}" class="pdf-btn bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600">📄 WhatsApp</button>
        </td>
      </tr>
    `;
  }).join("");

  attachEventHandlers();
  renderStats();
  renderWrongNumbers(); // ✅ Show wrong numbers separately
}



function renderWrongNumbers() {
  const wrongNumbersList = document.getElementById("wrongNumbersList");
  if (!wrongNumbersList) return;

  // Customers whose phone number is not exactly 10 digits
  const wrongNumbers = customers.filter(c => !/^\d{10}$/.test(c.phone));

  if (wrongNumbers.length === 0) {
    wrongNumbersList.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-red-600 py-2">No wrong numbers found</td>
      </tr>
    `;
  } else {
    wrongNumbersList.innerHTML = wrongNumbers.map((c, i) => `
      <tr class="bg-red-50">
        <td class="p-2 border">${i + 1}</td>
        <td class="p-2 border">${c.name}</td>
        <td class="p-2 border">${c.phone || "N/A"}</td>
        <td class="p-2 border">${c.totalOrders || 0}</td>
        <td class="p-2 border">${c.amount ? c.amount.toFixed(2) : "0.00"}</td>
      </tr>
    `).join("");
  }
}


  // ========= ATTACH HANDLERS (uses phone instead of index) =========
  function attachEventHandlers() {
    // Delete
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const phone = btn.dataset.phone;
        customers = customers.filter(c => c.phone !== phone);
        saveCustomers();
        renderCustomers();
      });
    });

    // Edit
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const phone = btn.dataset.phone;
        editIndex = customers.findIndex(c => c.phone === phone);
        if (editIndex === -1) return;

        const c = customers[editIndex];
        modalTitle.textContent = "Edit Customer";
        inputName.value = c.name;
        inputPhone.value = c.phone;
        inputOrders.value = c.totalOrders;
        inputAmount.value = c.amount || 0;
        openModal();
      });
    });

    // Redeem
    document.querySelectorAll(".redeem-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const phone = btn.dataset.phone;
        const index = customers.findIndex(c => c.phone === phone);
        if (index === -1) return;

        const c = customers[index];
        const remainingRewards = calculateRewards(c);
        if (remainingRewards > 0) {
          if (confirm("Redeem 1 reward point for this customer?")) {
            c.redeemed = (c.redeemed || 0) + 1;
            saveCustomers();
            renderCustomers();
          }
        } else {
          alert("No rewards available to redeem!");
        }
      });
    });

    // WhatsApp
    document.querySelectorAll(".pdf-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const phone = btn.dataset.phone;
        const c = customers.find(c => c.phone === phone);
        if (!c) return;

        const totalRewards = calculateRewards(c);
        const redeemed = c.redeemed || 0;
        const remainingRewards = Math.max(0, totalRewards - redeemed);
        const nextOrders = 10 - (c.totalOrders % 10);

        const message = `
Hello ${c.name}!

Here’s your *Street Magic Rewards Summary*:

*Mobile:* ${c.phone}
*Total Orders:* ${c.totalOrders}
*Reward Points:* ${remainingRewards}

After ${nextOrders} more order${nextOrders > 1 ? 's' : ''}, you'll earn *1 Reward Point = 1 Free Meal* 🍔

Thank you for being a valued customer!`;

        const whatsappURL = `https://wa.me/${c.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, "_blank");
      });
    });
  }

  // ========= STATS SECTION =========
  function renderStats() {
  if (!newCustEl || !repeatCustEl || !totalCustEl) return;

  const total = customers.length;
  const newCustomers = customers.filter(c => c.totalOrders === 1).length;
  const repeatCustomers = total - newCustomers;

  // Wrong numbers
  const wrongNumbers = customers.filter(c => !/^\d{10}$/.test(c.phone)).length;
  const wrongNumbersEl = document.getElementById("wrongNumbersCount");

  newCustEl.textContent = newCustomers;
  repeatCustEl.textContent = repeatCustomers;
  totalCustEl.textContent = total;
  if (wrongNumbersEl) wrongNumbersEl.textContent = wrongNumbers;
}


  // ========= MODAL CONTROLS =========
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

  // ========= EVENT LISTENERS =========
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

    if (!name || !phone) return;

    if (editIndex >= 0) {
      const oldPhone = customers[editIndex].phone;
      customers[editIndex] = {
        ...customers[editIndex],
        name,
        phone,
        totalOrders: orders,
        amount
      };
      updateOrdersWithCustomerChange(oldPhone, phone, name);
    } else {
      customers.push({ name, phone, totalOrders: orders, amount, redeemed: 0 });
    }

    saveCustomers();
    renderCustomers();
    closeModal();
  });

  searchInput?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
    renderCustomers(filtered);
  });

  // ========= INITIAL LOAD =========
  syncFromOrders();
  renderCustomers();

});
