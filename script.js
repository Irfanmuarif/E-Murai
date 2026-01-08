// Global variables
const csvUrls = {
    pengumuman: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=0&single=true&output=csv',
    iuran: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=1650144415&single=true&output=csv',
    kas: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2139823991&single=true&output=csv',
    ronda: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2068778061&single=true&output=csv'
};

// DOM elements
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const loadingIndicator = document.getElementById('loadingIndicator');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

// Containers
const pengumumanList = document.getElementById('pengumumanList');
const iuranTable = document.getElementById('iuranTable');
const kasContainer = document.getElementById('kasContainer');
const rondaTable = document.getElementById('rondaTable');

document.addEventListener('DOMContentLoaded', () => {
    refreshBtn.addEventListener('click', refreshAllData);
    navItems.forEach(item => {
        item.addEventListener('click', () => switchPage(item.getAttribute('data-page')));
    });
    loadInitialData();
    setInterval(refreshAllData, 5 * 60 * 1000);
});

function switchPage(pageName) {
    navItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-page') === pageName));
    pages.forEach(page => page.classList.toggle('active', page.id === `${pageName}Page`));
    loadPageData(pageName);
}

function loadInitialData() {
    refreshAllData();
}

function refreshAllData() {
    const activePage = document.querySelector('.page.active').id.replace('Page', '');
    loadPageData(activePage);
}

function loadPageData(pageName) {
    showLoading(true);
    switch (pageName) {
        case 'pengumuman': loadPengumuman(); break;
        case 'iuran': loadIuranBulanan(); break;
        case 'kas': loadUangKas(); break;
        case 'ronda': loadJadwalRonda(); break;
    }
}

function fetchAndParseCSV(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(res => res.text())
            .then(csvText => {
                const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
                resolve(results.data);
            })
            .catch(err => reject(err));
    });
}

function showLoading(show) {
    loadingIndicator.classList.toggle('hidden', !show);
}

function updateLastUpdateTime() {
    lastUpdate.textContent = `Terakhir diperbarui: ${moment().format('DD MMMM YYYY, HH:mm:ss')}`;
}

// 1. PENGUMUMAN
function loadPengumuman() {
    fetchAndParseCSV(csvUrls.pengumuman)
        .then(data => {
            pengumumanList.innerHTML = '';
            if (data.length <= 1) { pengumumanList.innerHTML = '<p>Tidak ada pengumuman.</p>'; return; }
            for (let i = 1; i < data.length; i++) {
                const [id, tgl, judul, isi, pengirim] = data[i];
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-header"><h3 class="card-title">${judul}</h3><span>${moment(tgl).format('DD/MM/YY')}</span></div>
                    <div class="card-content"><p>${isi}</p></div>
                    <div class="card-footer"><span>Oleh: ${pengirim}</span></div>`;
                pengumumanList.appendChild(card);
            }
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

// 2. IURAN BULANAN (FIXED: Sesuai Header)
function loadIuranBulanan() {
    fetchAndParseCSV(csvUrls.iuran)
        .then(data => {
            if (data.length === 0) return;
            const headers = data[0];
            let html = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
            
            for (let i = 1; i < data.length; i++) {
                if (!data[i][0]) continue;
                html += '<tr>';
                for (let j = 0; j < headers.length; j++) {
                    const val = (data[i][j] || "").toString().trim().toUpperCase();
                    if (val === 'TRUE' || val === 'FALSE') {
                        html += `<td class="text-center"><input type="checkbox" ${val === 'TRUE' ? 'checked' : ''} disabled></td>`;
                    } else {
                        html += `<td>${data[i][j] || '-'}</td>`;
                    }
                }
                html += '</tr>';
            }
            iuranTable.innerHTML = html + '</tbody>';
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

// 3. UANG KAS
function loadUangKas() {
    fetchAndParseCSV(csvUrls.kas)
        .then(data => {
            kasContainer.innerHTML = '';
            const months = {};
            for (let i = 1; i < data.length; i++) {
                const [id, bulan, tgl, ket, masuk, keluar] = data[i];
                if (!months[bulan]) months[bulan] = [];
                months[bulan].push({ tgl, ket, masuk: parseInt(masuk)||0, keluar: parseInt(keluar)||0 });
            }
            Object.keys(months).forEach(m => {
                let bal = 0;
                let tableHtml = `<h3>${m}</h3><div class="table-container"><table class="data-table"><thead><tr><th>Tgl</th><th>Ket</th><th>Masuk</th><th>Keluar</th><th>Saldo</th></tr></thead><tbody>`;
                months[m].forEach(t => {
                    bal += (t.masuk - t.keluar);
                    tableHtml += `<tr><td>${moment(t.tgl).format('DD/MM')}</td><td>${t.ket}</td><td>${formatNumber(t.masuk)}</td><td>${formatNumber(t.keluar)}</td><td><strong>${formatNumber(bal)}</strong></td></tr>`;
                });
                kasContainer.innerHTML += tableHtml + '</tbody></table></div><br>';
            });
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

// 4. JADWAL RONDA (FIXED: Sesuai Header)
function loadJadwalRonda() {
    fetchAndParseCSV(csvUrls.ronda)
        .then(data => {
            if (data.length === 0) return;
            const headers = data[0];
            let html = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
            
            for (let i = 1; i < data.length; i++) {
                if (!data[i][0]) continue;
                html += '<tr>';
                for (let j = 0; j < headers.length; j++) {
                    const val = (data[i][j] || "").toString().trim().toUpperCase();
                    if (val === 'TRUE' || val === 'FALSE') {
                        html += `<td class="text-center"><input type="checkbox" ${val === 'TRUE' ? 'checked' : ''} disabled></td>`;
                    } else {
                        let cls = headers[j].toLowerCase().includes('remaining') && parseInt(data[i][j]) > 30 ? 'text-danger font-weight-bold' : '';
                        html += `<td class="${cls}">${data[i][j] || '-'}</td>`;
                    }
                }
                html += '</tr>';
            }
            rondaTable.innerHTML = html + '</tbody>';
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

function formatNumber(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

function showToast(m, t = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${t}`;
    toast.textContent = m;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}
