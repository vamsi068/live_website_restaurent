document.addEventListener("DOMContentLoaded", () => {

  // =====================
  // Load Orders & Purchases
  // =====================
  let orders = JSON.parse(localStorage.getItem("orders")) || [];
  let purchases = JSON.parse(localStorage.getItem("purchases")) || [];

  // =====================
  // Date Variables
  // =====================
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const lastMonth = (thisMonth - 1 + 12) % 12;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  // =====================
  // Expenses
  // =====================
  let expenses = JSON.parse(localStorage.getItem("expenses")) || {
    salaryPerDay: 500,
    rentPerMonth: 3000,
    powerPerMonth: 1200,
    othersPerMonth: 1000
  };

  // Fill expense input fields
  document.getElementById("salaryInput").value = expenses.salaryPerDay;
  document.getElementById("rentInput").value = expenses.rentPerMonth;
  document.getElementById("powerInput").value = expenses.powerPerMonth;
  document.getElementById("salaryMonthlyInput").value = expenses.othersPerMonth;

  document.getElementById("saveExpenses").addEventListener("click", () => {
    expenses.salaryPerDay = parseInt(document.getElementById("salaryInput").value) || 0;
    expenses.rentPerMonth = parseInt(document.getElementById("rentInput").value) || 0;
    expenses.powerPerMonth = parseInt(document.getElementById("powerInput").value) || 0;
    expenses.othersPerMonth = parseInt(document.getElementById("salaryMonthlyInput").value) || 0;

    localStorage.setItem("expenses", JSON.stringify(expenses));
    alert("Expenses updated!");
    location.reload();
  });

  const dailySalary = expenses.salaryPerDay;
  const dailyRent = Math.round(expenses.rentPerMonth / 30);
  const dailyPower = Math.round(expenses.powerPerMonth / 30);
  const dailyOther = Math.round(expenses.othersPerMonth / 30);
  const totalExpenses = dailySalary + dailyRent + dailyPower + dailyOther;

  // =====================
  // Helper Functions
  // =====================
  function getOrdersTotals(orderList) {
    let todayTotal = 0, monthTotal = 0, lastMonthTotal = 0;
    let monthTransactions = 0, lastMonthTransactions = 0;
    let salesByItemToday = {};

    orderList.forEach(order => {
      let orderDate = new Date(order.date);
      if (isNaN(orderDate)) return;

      const orderDateStr = orderDate.toISOString().split("T")[0];

      // Today's sales
      if (orderDateStr === todayStr) {
        todayTotal += order.total;
        order.items.forEach(i => {
          salesByItemToday[i.name] = (salesByItemToday[i.name] || 0) + i.qty * i.price;
        });
      }

      // This month
      if (orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear) {
        monthTotal += order.total;
        monthTransactions++;
      }

      // Last month
      if (orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear) {
        lastMonthTotal += order.total;
        lastMonthTransactions++;
      }
    });

    const daysWithSales = new Set(orderList
      .filter(o => {
        let d = new Date(o.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .map(o => new Date(o.date).toISOString().split("T")[0])
    );

    const dailyAvg = daysWithSales.size ? monthTotal / daysWithSales.size : 0;

    return { todayTotal, monthTotal, lastMonthTotal, monthTransactions, lastMonthTransactions, dailyAvg, salesByItemToday };
  }

  function getPurchasesTotals(purchaseList) {
    let todayPurchaseTotal = 0, monthPurchaseTotal = 0, lastMonthPurchaseTotal = 0;

    purchaseList.forEach(p => {
      const pDate = new Date(p.date);
      if (isNaN(pDate)) return;
      const pStr = pDate.toISOString().split("T")[0];

      if (pStr === todayStr) todayPurchaseTotal += p.qty * p.price;
      if (pDate.getMonth() === thisMonth && pDate.getFullYear() === thisYear) monthPurchaseTotal += p.qty * p.price;
      if (pDate.getMonth() === lastMonth && pDate.getFullYear() === lastMonthYear) lastMonthPurchaseTotal += p.qty * p.price;
    });

    return { todayPurchaseTotal, monthPurchaseTotal, lastMonthPurchaseTotal };
  }

  const orderStats = getOrdersTotals(orders);
  const purchaseStats = getPurchasesTotals(purchases);

  const todayProfitLoss = orderStats.todayTotal - (purchaseStats.todayPurchaseTotal + totalExpenses);

  // =====================
  // Update UI
  // =====================
  const setText = (id, value) => document.getElementById(id).textContent = value;

  setText("todaySales", orderStats.todayTotal);
  setText("monthSales", orderStats.monthTotal);
  setText("dailyAvg", orderStats.dailyAvg.toFixed(2));
  setText("transactionCount", orders.length);
  setText("lastMonthSales", orderStats.lastMonthTotal);
  setText("lastMonthCount", orderStats.lastMonthTransactions);

  setText("todayPurchase", purchaseStats.todayPurchaseTotal);
  setText("monthPurchase", purchaseStats.monthPurchaseTotal);
  setText("lastMonthPurchase", purchaseStats.lastMonthPurchaseTotal);

  setText("salaryExpense", dailySalary);
  setText("rentExpense", dailyRent);
  setText("powerExpense", dailyPower);
  setText("otherExpense", dailyOther);

  const plEl = document.getElementById("todayProfitLoss");
  plEl.textContent = "₹" + todayProfitLoss;
  plEl.style.color = todayProfitLoss >= 0 ? "green" : "red";

  // =====================
  // Populate Categories
  // =====================
  const categories = new Set();
  orders.forEach(o => o.items.forEach(i => i.category && categories.add(i.category)));
  const categoryFilter = document.getElementById("categoryFilter");
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  // =====================
  // Chart.js Setup
  // =====================
  const salesChart = new Chart(document.getElementById("salesChart").getContext("2d"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        { label: "Sales (₹)", data: [], backgroundColor: "rgba(54,162,235,0.7)", yAxisID: "y1", barThickness: 25 },
        { label: "Quantity Sold", data: [], backgroundColor: "rgba(255,159,64,0.7)", yAxisID: "y2", barThickness: 25 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: false, ticks: { autoSkip: false, maxRotation: 45 }, categoryPercentage: 0.6, barPercentage: 0.5 },
        y1: { type: "linear", position: "left", beginAtZero: true, title: { display: true, text: "Sales (₹)" } },
        y2: { type: "linear", position: "right", beginAtZero: true, title: { display: true, text: "Quantity" }, grid: { drawOnChartArea: false } }
      }
    }
  });

  const trendChart = new Chart(document.getElementById("trendChart").getContext("2d"), {
    type: "bar",
    data: { labels: [], datasets: [{ label: "Sales (₹)", data: [], backgroundColor: "rgba(75,192,192,0.7)", barThickness: 25 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
  });

  const trendItemsChart = new Chart(document.getElementById("trendItemsChart").getContext("2d"), {
    type: "bar",
    data: { labels: [], datasets: [{ label: "Items Sold", data: [], backgroundColor: "rgba(255,159,64,0.7)", barThickness: 25 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
  });

  // =====================
  // Filter Function
  // =====================
  function applyFilters() {
    const startDate = document.getElementById("startDate").value ? new Date(document.getElementById("startDate").value) : null;
    const endDate = document.getElementById("endDate").value ? new Date(document.getElementById("endDate").value) : null;
    const selectedCategory = categoryFilter.value;

    const filteredOrders = orders.filter(o => {
      const d = new Date(o.date);
      if (isNaN(d)) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    let salesByItem = {}, qtyByItem = {}, totalSales = 0, totalTransactions = 0;

    filteredOrders.forEach(o => {
      let include = false;
      o.items.forEach(i => {
        if (selectedCategory === "all" || i.category === selectedCategory) {
          include = true;
          salesByItem[i.name] = (salesByItem[i.name] || 0) + i.qty * i.price;
          qtyByItem[i.name] = (qtyByItem[i.name] || 0) + i.qty;
        }
      });
      if (include) { totalSales += o.total; totalTransactions++; }
    });

    const daysWithSales = new Set(filteredOrders.map(o => new Date(o.date).toISOString().split("T")[0]));
    const dailyAvg = daysWithSales.size ? totalSales / daysWithSales.size : 0;

    setText("filteredSales", totalSales);
    setText("filteredTransactions", totalTransactions);
    setText("filteredDailyAvg", dailyAvg.toFixed(2));

    const labels = Object.keys(salesByItem).length ? Object.keys(salesByItem) : ["No Data"];
    salesChart.data.labels = labels;
    salesChart.data.datasets[0].data = labels.map(k => salesByItem[k] || 0);
    salesChart.data.datasets[1].data = labels.map(k => qtyByItem[k] || 0);
    salesChart.update();

    updateTrendCharts(filteredOrders);
  }

  // =====================
  // Trend Chart Updater
  // =====================
  function updateTrendCharts(filteredOrders) {
    const dateSet = new Set(filteredOrders.map(o => new Date(o.date).toISOString().split("T")[0]));
    const sortedDates = Array.from(dateSet).sort();

    const labels = [], salesData = [], itemsData = [];

    sortedDates.forEach(dateStr => {
      labels.push(new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));
      let dailySales = 0, dailyItems = 0;
      filteredOrders.forEach(o => {
        const oDateStr = new Date(o.date).toISOString().split("T")[0];
        if (oDateStr === dateStr) {
          dailySales += o.total;
          o.items.forEach(it => dailyItems += it.qty);
        }
      });
      salesData.push(dailySales);
      itemsData.push(dailyItems);
    });

    trendChart.data.labels = labels.length ? labels : ["No Data"];
    trendChart.data.datasets[0].data = salesData.length ? salesData : [0];
    trendChart.update();

    trendItemsChart.data.labels = labels.length ? labels : ["No Data"];
    trendItemsChart.data.datasets[0].data = itemsData.length ? itemsData : [0];
    trendItemsChart.update();
  }

  document.getElementById("applyFilters").addEventListener("click", applyFilters);
  applyFilters();

  // =====================
  // Trend Toggle Buttons (7D / 6M)
  // =====================
  function getLastNDaysSalesItems(n, type = "sales") {
    const labels = [], data = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      labels.push(d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));

      let sum = 0;
      orders.forEach(o => {
        const oDate = new Date(o.date);
        if (oDate.toISOString().split("T")[0] === dStr) {
          if (type === "sales") sum += o.total;
          else o.items.forEach(it => sum += it.qty);
        }
      });
      data.push(sum);
    }
    return { labels, data };
  }

  function getLastNMonthsSalesItems(n, type = "sales") {
    const labels = [], data = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.push(d.toLocaleString("default", { month: "short" }));
      let sum = 0;
      orders.forEach(o => {
        const oDate = new Date(o.date);
        if (oDate.getMonth() === d.getMonth() && oDate.getFullYear() === d.getFullYear()) {
          if (type === "sales") sum += o.total;
          else o.items.forEach(it => sum += it.qty);
        }
      });
      data.push(sum);
    }
    return { labels, data };
  }

  function toggleTrend(chart, type, n, btnActiveId, btnInactiveId) {
    const { labels, data } = n <= 31
      ? getLastNDaysSalesItems(n, type)
      : getLastNMonthsSalesItems(n / 5, type); // approx
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
    document.getElementById(btnActiveId).classList.add("active");
    document.getElementById(btnInactiveId).classList.remove("active");
  }

  document.getElementById("btn7d").addEventListener("click", () => toggleTrend(trendChart, "sales", 7, "btn7d", "btn6m"));
  document.getElementById("btn6m").addEventListener("click", () => toggleTrend(trendChart, "sales", 30, "btn6m", "btn7d"));

  document.getElementById("btn7dItems").addEventListener("click", () => toggleTrend(trendItemsChart, "items", 7, "btn7dItems", "btn6mItems"));
  document.getElementById("btn6mItems").addEventListener("click", () => toggleTrend(trendItemsChart, "items", 30, "btn6mItems", "btn7dItems"));

  // Default load
  toggleTrend(trendChart, "sales", 7, "btn7d", "btn6m");
  toggleTrend(trendItemsChart, "items", 7, "btn7dItems", "btn6mItems");

});
