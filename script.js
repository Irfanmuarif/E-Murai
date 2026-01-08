const API_URL = "https://script.google.com/macros/s/AKfycbywrFbC5j8WDXlAiQ-N1ztrCgBF4hZnlItFpcP6p77DZLiEI1YvVXb0_wW26L3mHJ4V/exec";

let role = "guest";

/* ================= LOGIN ================= */

function loginGuest() {
  role = "guest";
  startApp();
}

function loginAdmin() {
  const password = document.getElementById("adminPass").value;

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "login",
      password
    })
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) {
      role = "admin";
      startApp();
    } else {
      alert("Password salah");
    }
  });
}

function startApp() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("role").innerText = role.toUpperCase();
  loadPage("pengumuman");
}

function logout() {
  location.reload();
}

/* ================= PAGE ================= */

function loadPage(page) {
  if (page === "pengumuman") loadPengumuman();
  if (page === "iuran") loadIuran();
  if (page === "kas") loadKas();
  if (page === "ronda") loadRonda();
}

/* ================= DATA ================= */

function loadPengumuman() {
  fetch(API_URL + "?action=getPengumuman")
    .then(res => res.json())
    .then(res => {
      let html = "<h3>Pengumuman</h3>";
      res.data.slice(1).forEach(r => {
        html += `<p><b>${r[2]}</b><br>${r[3]}</p>`;
      });
      document.getElementById("content").innerHTML = html;
    });
}

function loadIuran() {
  fetch(API_URL + "?action=getIuran")
    .then(res => res.json())
    .then(res => {
      let html = "<h3>Iuran Bulanan</h3><table border=1>";
      res.data.forEach(r => {
        html += "<tr>" + r.map(c => `<td>${c}</td>`).join("") + "</tr>";
      });
      html += "</table>";
      document.getElementById("content").innerHTML = html;
    });
}

function loadKas() {
  fetch(API_URL + "?action=getKas")
    .then(res => res.json())
    .then(res => {
      let html = "<h3>Uang Kas</h3><table border=1>";
      res.data.forEach(r => {
        html += "<tr>" + r.map(c => `<td>${c}</td>`).join("") + "</tr>";
      });
      html += "</table>";
      document.getElementById("content").innerHTML = html;
    });
}

function loadRonda() {
  fetch(API_URL + "?action=getRonda")
    .then(res => res.json())
    .then(res => {
      let html = "<h3>Jadwal Ronda</h3><table border=1>";
      res.data.forEach(r => {
        html += "<tr>" + r.map(c => `<td>${c}</td>`).join("") + "</tr>";
      });
      html += "</table>";
      document.getElementById("content").innerHTML = html;
    });
}
