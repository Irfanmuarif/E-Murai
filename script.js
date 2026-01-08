const API_URL = "https://script.google.com/macros/s/AKfycbzO55YCPFDNd9WQPykDCt3NqL4gPjLsZJ-kk1crNiHmWOKxQCKaUa_VLKBmvUrtx8L6/exec";

// ================= UI ELEMENT =================
const loginDiv = document.getElementById("login");
const appDiv = document.getElementById("app");
const roleText = document.getElementById("role");
const content = document.getElementById("content");

// ================= GUEST LOGIN =================
function loginGuest() {
  console.log("LOGIN GUEST");
  roleText.innerText = "Guest";
  loginDiv.classList.add("hidden");
  appDiv.classList.remove("hidden");
  loadPage("pengumuman");
}

// ================= ADMIN LOGIN =================
async function loginAdmin() {
  const pass = document.getElementById("adminPass").value;

  if (!pass) {
    alert("Masukkan password admin");
    return;
  }

  try {
    const res = await fetch(`${API_URL}?action=validateLogin&password=${pass}`);
    const data = await res.json();

    if (data.valid) {
      roleText.innerText = "Admin";
      loginDiv.classList.add("hidden");
      appDiv.classList.remove("hidden");
      loadPage("pengumuman");
    } else {
      alert("Password salah");
    }
  } catch (err) {
    alert("Gagal koneksi ke server");
    console.error(err);
  }
}

// ================= LOGOUT =================
function logout() {
  appDiv.classList.add("hidden");
  loginDiv.classList.remove("hidden");
  content.innerHTML = "";
  document.getElementById("adminPass").value = "";
}

// ================= PAGE LOADER =================
async function loadPage(page) {
  content.innerHTML = "<p>Loading...</p>";

  try {
    let action = "";
    if (page === "pengumuman") action = "getPengumuman";
    if (page === "iuran") action = "getIuranBulanan";
    if (page === "kas") action = "getUangKas";
    if (page === "ronda") action = "getJadwalRonda";

    const res = await fetch(`${API_URL}?action=${action}`);
    const data = await res.json();

    content.innerHTML = `
      <h3>${page.toUpperCase()}</h3>
      <pre>${JSON.stringify(data.data, null, 2)}</pre>
    `;
  } catch (err) {
    content.innerHTML = "<p>Gagal memuat data</p>";
    console.error(err);
  }
}

// ================= API TEST =================
fetch(API_URL)
  .then(res => res.json())
  .then(data => console.log("API OK:", data))
  .catch(err => console.error("API ERROR:", err));
