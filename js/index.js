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

// ✅ Load specials from localStorage or default
let todaysSpecials = JSON.parse(localStorage.getItem("todaysSpecials")) || [
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
function renderSpecials() {
  specialsContainer.innerHTML = todaysSpecials.map((item, i) => `
    <div class="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
      <img src="${item.img || 'https://via.placeholder.com/300x200?text=No+Image'}"
           alt="${item.name}" class="w-full h-48 object-cover">
      <div class="p-4">
        <h4 class="text-lg font-semibold">${item.name}</h4>
        <p class="text-gray-600 text-sm mb-2">${item.desc}</p>
        <p class="text-blue-600 font-bold mb-3">₹ ${item.price}</p>
        <a href="menu.html" class="text-sm text-blue-500 hover:underline">View in Menu →</a>
      </div>
    </div>
  `).join("");
}
renderSpecials();

// ✅ Modal elements
const editBtn = document.getElementById("editSpecialsBtn");
const modal = document.getElementById("editSpecialsModal");
const form = document.getElementById("editSpecialsForm");
const saveBtn = document.getElementById("saveSpecialsBtn");
const closeBtn = document.getElementById("closeSpecialsModal");
const addBtn = document.getElementById("addSpecialBtn");

let uploadedImages = {}; // Store uploaded base64s temporarily

// ✅ Function to build form fields dynamically
function buildSpecialsForm() {
  form.innerHTML = todaysSpecials.map((item, i) => `
    <div class="border p-3 rounded-lg relative bg-gray-50">
      <button data-index="${i}" class="remove-btn absolute top-2 right-2 text-red-600 hover:text-red-800">✖</button>
      <h4 class="font-semibold mb-2">Special ${i + 1}</h4>

      <label class="block text-sm font-semibold mb-1">Name</label>
      <input type="text" id="name${i}" value="${item.name}" class="w-full border rounded p-2 mb-2">

      <label class="block text-sm font-semibold mb-1">Description</label>
      <input type="text" id="desc${i}" value="${item.desc}" class="w-full border rounded p-2 mb-2">

      <label class="block text-sm font-semibold mb-1">Price (₹)</label>
      <input type="number" id="price${i}" value="${item.price}" class="w-full border rounded p-2 mb-2">

      <label class="block text-sm font-semibold mb-1">Image</label>
      <div class="flex items-center gap-2 mb-2">
        <img id="preview${i}" src="${item.img}" class="w-20 h-16 object-cover rounded border" alt="preview">
        <input type="file" id="imgUpload${i}" accept="image/*" class="text-sm">
      </div>
    </div>
  `).join("");

  // File upload listeners
  todaysSpecials.forEach((_, i) => {
    const input = document.getElementById(`imgUpload${i}`);
    const preview = document.getElementById(`preview${i}`);
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImages[i] = event.target.result;
        preview.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  });

  // Remove button logic
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.getAttribute("data-index");
      todaysSpecials.splice(index, 1);
      buildSpecialsForm(); // rebuild
    });
  });
}

// ✅ Open modal
editBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  buildSpecialsForm();
});

// ✅ Add new special
addBtn.addEventListener("click", () => {
  todaysSpecials.push({
    name: "New Special",
    desc: "Description here",
    price: 0,
    img: "https://via.placeholder.com/300x200?text=New+Item"
  });
  buildSpecialsForm();
});

// ✅ Save specials
saveBtn.addEventListener("click", () => {
  todaysSpecials = todaysSpecials.map((item, i) => ({
    name: document.getElementById(`name${i}`).value.trim(),
    desc: document.getElementById(`desc${i}`).value.trim(),
    price: parseFloat(document.getElementById(`price${i}`).value) || 0,
    img: uploadedImages[i] || item.img
  }));

  localStorage.setItem("todaysSpecials", JSON.stringify(todaysSpecials));
  renderSpecials();
  modal.classList.add("hidden");
  uploadedImages = {};
});

// ✅ Close modal
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  uploadedImages = {};
});
