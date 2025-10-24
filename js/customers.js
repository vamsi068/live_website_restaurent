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

  // ========= HELPER FUNCTIONS =========

  // Calculate rewards: 1 reward per 10 orders, starting from 10 orders
function calculateRewards(customer) {
  if (!customer.totalOrders || customer.totalOrders < 10) return 0;
  const totalEarned = Math.floor(customer.totalOrders / 10); // total rewards earned
  const redeemed = customer.redeemed || 0;
  return Math.max(0, totalEarned - redeemed); // remaining rewards
}


  // Sync customers from orders data
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

  // Save customers to localStorage
  function saveCustomers() {
    localStorage.setItem("customers", JSON.stringify(customers));
  }

  // ========= RENDER FUNCTION =========
  function renderCustomers(filtered = customers) {
  if (!customersList) return;

  // 🔹 Sort by Total Orders (descending)
  filtered = [...filtered].sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));

  customersList.innerHTML = filtered.map((c, i) => {
    const totalRewards = calculateRewards(c);
    const redeemed = c.redeemed || 0;
    const remainingRewards = Math.max(0, totalRewards - redeemed);

    const rewardText = remainingRewards > 0
      ? `🎉 ${remainingRewards} Free Meal${remainingRewards > 1 ? 's' : ''} Available`
      : "No Rewards";

    return `
      <tr>
        <td class="p-2">${i + 1}</td>
        <td class="p-2">${c.name}</td>
        <td class="p-2">${c.phone}</td>
        <td class="p-2">${c.totalOrders}</td>
        <td class="p-2">${rewardText}</td>
        <td class="p-2">${c.amount ? c.amount.toFixed(2) : "0.00"}</td>
        <td class="p-2">
          <button data-index="${i}" class="redeem-btn bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
            ${remainingRewards > 0 ? "Redeem 1" : "No Rewards"}
          </button>
        </td>
        <td class="p-2 actions flex gap-2">
          <button data-index="${i}" class="edit-btn bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Edit</button>
          <button data-index="${i}" class="delete-btn bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Delete</button>
          <button data-index="${i}" class="pdf-btn bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600">📄 WhatsApp</button>
        </td>
      </tr>
    `;
  }).join("");

    // ===== DELETE CUSTOMER =====
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        customers.splice(index, 1);
        saveCustomers();
        renderCustomers();
      });
    });

    // ===== EDIT CUSTOMER =====
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        editIndex = parseInt(btn.getAttribute("data-index"));
        const c = customers[editIndex];
        modalTitle.textContent = "Edit Customer";
        inputName.value = c.name;
        inputPhone.value = c.phone;
        inputOrders.value = c.totalOrders;
        inputAmount.value = c.amount || 0;
        openModal();
      });
    });

    // ===== REDEEM (one reward per click) =====
    document.querySelectorAll(".redeem-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const index = parseInt(btn.getAttribute("data-index"));
    const c = customers[index];
    const remainingRewards = calculateRewards(c);

    if (remainingRewards > 0) {
      if (confirm("Redeem 1 reward point for this customer?")) {
        c.redeemed = (c.redeemed || 0) + 1; // use 1 reward
        saveCustomers();
        renderCustomers();
      }
    } else {
      alert("No rewards available to redeem!");
    }
  });
});


    // ===== WHATSAPP SHARE =====
    document.querySelectorAll(".pdf-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        const c = customers[index];
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

Thank you for being a valued customer! 
        `;

        const whatsappURL = `https://wa.me/${c.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, "_blank");
      });
    });
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
    if (inputAmount) inputAmount.value = "";
  }

  // ========= EVENT LISTENERS =========
  if (addCustomerBtn) {
    addCustomerBtn.addEventListener("click", () => {
      modalTitle.textContent = "Add Customer";
      openModal();
    });
  }

  if (closeCustomerModal) {
    closeCustomerModal.addEventListener("click", closeModal);
  }

  if (saveCustomerBtn) {
    saveCustomerBtn.addEventListener("click", () => {
      const name = inputName.value.trim();
      const phone = inputPhone.value.trim();
      const orders = parseInt(inputOrders.value) || 0;
      const amount = parseFloat(inputAmount.value) || 0;

      if (!name || !phone) return;

      if (editIndex >= 0) {
        customers[editIndex] = {
          name,
          phone,
          totalOrders: orders,
          amount,
          redeemed: customers[editIndex].redeemed || 0
        };
      } else {
        customers.push({
          name,
          phone,
          totalOrders: orders,
          amount,
          redeemed: 0
        });
      }

      saveCustomers();
      renderCustomers();
      closeModal();
    });
  }

  // ========= SEARCH FUNCTIONALITY =========
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query)
      );
      renderCustomers(filtered);
    });
  }

  // ========= INITIAL LOAD =========
  syncFromOrders();
  renderCustomers();

});
