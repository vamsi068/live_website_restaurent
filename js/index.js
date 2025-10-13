// ===============================
// Street Magic - Home Page Script
// ===============================

console.log("✅ Index page loaded");

// ✅ Highlight active navigation link
const currentPage = window.location.pathname.split("/").pop();
document.querySelectorAll(".nav-link").forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("text-blue-500", "font-bold", "underline");
  }
});

// ✅ Today’s Specials (manual daily edit here)
const todaysSpecials = [
  {
    name: "Street Magic Burger",
    desc: "Juicy beef patty with secret sauce.",
    price: 899,
    img: "assets/images/special-burger.jpg"
  },
  {
    name: "Magic Margherita Pizza",
    desc: "Classic cheese pizza with fresh basil.",
    price: 1250,
    img: "assets/images/special-pizza.jpg"
  },
  {
    name: "Caramel Coffee",
    desc: "Rich espresso with caramel drizzle.",
    price: 475,
    img: "assets/images/special-coffee.jpg"
  }
];

// ✅ Render specials
const specialsContainer = document.getElementById("specials-container");
if (specialsContainer) {
  specialsContainer.innerHTML = todaysSpecials.map(item => `
    <div class="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
      <img src="${item.img}" alt="${item.name}" class="w-full h-48 object-cover">
      <div class="p-4">
        <h4 class="text-lg font-semibold">${item.name}</h4>
        <p class="text-gray-600 text-sm mb-2">${item.desc}</p>
        <p class="text-blue-600 font-bold mb-3">₹ ${item.price}</p>
        <a href="menu.html" class="text-sm text-blue-500 hover:underline">View in Menu →</a>
      </div>
    </div>
  `).join("");
}
