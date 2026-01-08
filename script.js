const API_URL = "https://script.google.com/macros/s/AKfycbywrFbC5j8WDXlAiQ-N1ztrCgBF4hZnlItFpcP6p77DZLiEI1YvVXb0_wW26L3mHJ4V/exec";

let role = "guest";

/* ================= INIT ================= */

window.onload = () => {
  testAPI();
};

function testAPI() {
  fetch(API_URL + "?action=ping")
    .then(res => res.json())
    .then(res => {
      console.log("API OK:", res);
    })
    .catch(err => {
      alert("API TIDAK TERHUBUNG");
      console.error(err);
    });
}

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
      alert("Password admin salah");
    }
  })
  .catch(err => {
    alert("Login gagal");
    console.error(err);
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

/* ================= NAV ================= */

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

      if (!res.data || res.data.length <= 1) {
        html += "<p>Tidak ada pengumuman</p>";
      } else {
        res.data.slice(1).forEach(r => {
          html += `
            <div>
              <b>${r[2]}</b><br>
              ${r[3]}
              <hr>
            </div>`;
        });
      }

      document.getElementById("content").innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      document.getElementById("content").innerHTML = "Gagal load pengumuman";
    });
}

function loadIuran() {
  fetch(API_URL + "?action=getIuran")
    .then(res => res.json())
    .then(res => {
      renderTable("Iuran Bulanan", res.data);
    });
}

function loadKas() {
  fetch(API_URL + "?action=getKas")
    .then(res => res.json())
    .then(res => {
      renderTable("Uang Kas", res.data);
    });
}

function loadRonda() {
  fetch(API_URL + "?action=getRonda")
    .then(res => res.json())
    .then(res => {
      renderTable("Jadwal Ronda", res.data);
    });
}

/* ================= UTIL ================= */

function renderTable(title, data) {
  let html = `<h3>${title}</h3>`;

  if (!data || data.length === 0) {
    html += "<p>Data kosong</p>";
  } else {
    html += "<table border='1'>";
    data.forEach(row => {
      html += "<tr>";
      row.forEach(col => {
        html += `<td>${col}</td>`;
      });
      html += "</tr>";
    });
    html += "</table>";
  }

  document.getElementById("content").innerHTML = html;
}
