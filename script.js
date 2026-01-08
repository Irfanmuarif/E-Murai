// Global variables
const csvUrls = {
    pengumuman: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=0&single=true&output=csv', // Ganti dengan URL CSV untuk sheet PENGUMUMAN
    iuran: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=1650144415&single=true&output=csv', // Ganti dengan URL CSV untuk sheet IURAN BULANAN
    kas: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2139823991&single=true&output=csv', // Ganti dengan URL CSV untuk sheet UANG KAS
    ronda: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhtHQT_YmSq-tiQt-6Kqj5Ms9oeUdTdiNIChEdQPgEQryYxTMf2M5RTgpVa1oi30rvvXrJK3XY4nyd/pub?gid=2068778061&single=true&output=csv' // Ganti dengan URL CSV untuk sheet JADWAL RONDA
};

// DOM elements
const mainScreen = document.getElementById('mainScreen');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const loadingIndicator = document.getElementById('loadingIndicator');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

// Page specific elements
const pengumumanList = document.getElementById('pengumumanList');
const iuranTable = document.getElementById('iuranTable');
const kasContainer = document.getElementById('kasContainer');
const rondaTable = document.getElementById('rondaTable');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners
    refreshBtn.addEventListener('click', refreshAllData);
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const pageName = this.getAttribute('data-page');
            switchPage(pageName);
        });
    });
    
    // Load initial data
    loadInitialData();
    
    // Auto refresh every 5 minutes
    setInterval(refreshAllData, 5 * 60 * 1000);
});

// Navigation
function switchPage(pageName) {
    // Update nav items
    navItems.forEach(item => {
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update pages
    pages.forEach(page => {
        if (page.id === `${pageName}Page`) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
    
    // Load page data
    loadPageData(pageName);
}

// Load initial data
function loadInitialData() {
    refreshAllData();
}

// Refresh all data
function refreshAllData() {
    const currentPage = document.querySelector('.page.active').id.replace('Page', '');
    loadPageData(currentPage);
}

// Load page data
function loadPageData(pageName) {
    showLoading(true);
    
    switch (pageName) {
        case 'pengumuman':
            loadPengumuman();
            break;
        case 'iuran':
            loadIuranBulanan();
            break;
        case 'kas':
            loadUangKas();
            break;
        case 'ronda':
            loadJadwalRonda();
            break;
    }
}

// Function to fetch and parse CSV
function fetchAndParseCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: false,
            complete: function(results) {
                resolve(results.data);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
}

// Show/hide loading
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

// Update last update time
function updateLastUpdateTime() {
    lastUpdate.textContent = `Terakhir diperbarui: ${moment().format('DD MMMM YYYY, HH:mm:ss')}`;
}

// Pengumuman functions
function loadPengumuman() {
    fetchAndParseCSV(csvUrls.pengumuman)
        .then(data => {
            renderPengumuman(data);
            updateLastUpdateTime();
        })
        .catch(error => {
            showToast('Gagal memuat data pengumuman: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function renderPengumuman(data) {
    pengumumanList.innerHTML = '';
    
    // Skip header row (index 0)
    for (let i = 1; i < data.length; i++) {
        const [id, tanggal, judul, isi, pengirim] = data[i];
        
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${judul}</h3>
                <span class="card-date">${moment(tanggal).format('DD MMMM YYYY')}</span>
            </div>
            <div class="card-content">
                <p>${isi}</p>
            </div>
            <div class="card-footer">
                <span>Oleh: ${pengirim}</span>
            </div>
        `;
        
        pengumumanList.appendChild(card);
    }
}

// Iuran Bulanan functions
function loadIuranBulanan() {
    fetchAndParseCSV(csvUrls.iuran)
        .then(data => {
            renderIuranBulanan(data);
            updateLastUpdateTime();
        })
        .catch(error => {
            showToast('Gagal memuat data iuran bulanan: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function renderIuranBulanan(data) {
    if (data.length === 0) {
        iuranTable.innerHTML = '<tr><td colspan="100%">Tidak ada data</td></tr>';
        return;
    }
    
    // Create table header
    let html = '<thead><tr><th>Nama Warga</th>';
    
    // Add month headers (skip first column which is name)
    for (let i = 1; i < data[0].length; i++) {
        html += `<th>${data[0][i]}</th>`;
    }
    
    html += '</tr></thead><tbody>';
    
    // Add table rows
    for (let i = 1; i < data.length; i++) {
        html += '<tr>';
        
        // Add name
        html += `<td>${data[i][0]}</td>`;
        
        // Add month checkboxes
        for (let j = 1; j < data[i].length; j++) {
            const checked = data[i][j] === 'TRUE' ? 'checked' : '';
            
            html += `
                <td class="checkbox-container">
                    <input type="checkbox" ${checked} disabled>
                </td>
            `;
        }
        
        html += '</tr>';
    }
    
    html += '</tbody>';
    
    iuranTable.innerHTML = html;
}

// Uang Kas functions
function loadUangKas() {
    fetchAndParseCSV(csvUrls.kas)
        .then(data => {
            renderUangKas(data);
            updateLastUpdateTime();
        })
        .catch(error => {
            showToast('Gagal memuat data uang kas: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function renderUangKas(data) {
    kasContainer.innerHTML = '';
    
    if (data.length === 0) {
        kasContainer.innerHTML = '<p>Tidak ada data</p>';
        return;
    }
    
    // Group transactions by month
    const transactionsByMonth = {};
    
    // Skip header row (index 0)
    for (let i = 1; i < data.length; i++) {
        const [id, bulan, tanggal, keterangan, pemasukan, pengeluaran] = data[i];
        
        if (!transactionsByMonth[bulan]) {
            transactionsByMonth[bulan] = [];
        }
        
        transactionsByMonth[bulan].push({
            id,
            bulan,
            tanggal,
            keterangan,
            pemasukan: parseInt(pemasukan) || 0,
            pengeluaran: parseInt(pengeluaran) || 0
        });
    }
    
    // Create a table for each month
    Object.keys(transactionsByMonth).sort().forEach(bulan => {
        const transactions = transactionsByMonth[bulan];
        
        // Calculate previous month balance
        let previousBalance = 0;
        const months = Object.keys(transactionsByMonth).sort();
        const currentIndex = months.indexOf(bulan);
        
        if (currentIndex > 0) {
            const previousMonth = months[currentIndex - 1];
            const previousTransactions = transactionsByMonth[previousMonth];
            
            let balance = 0;
            previousTransactions.forEach(transaction => {
                balance += transaction.pemasukan - transaction.pengeluaran;
            });
            
            previousBalance = balance;
        }
        
        // Create month container
        const monthContainer = document.createElement('div');
        monthContainer.className = 'mb-20';
        
        // Create month header
        const monthHeader = document.createElement('div');
        monthHeader.className = 'card-header mb-10';
        monthHeader.innerHTML = `
            <h3>${bulan}</h3>
            <span>Saldo Awal: Rp ${formatNumber(previousBalance)}</span>
        `;
        
        // Create table
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Create table header
        let tableHtml = `
            <thead>
                <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Pemasukan</th>
                    <th>Pengeluaran</th>
                    <th>Saldo</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        // Add transactions
        let balance = previousBalance;
        
        transactions.forEach((transaction, index) => {
            balance += transaction.pemasukan - transaction.pengeluaran;
            
            tableHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${moment(transaction.tanggal).format('DD/MM/YYYY')}</td>
                    <td>${transaction.keterangan}</td>
                    <td class="text-right">Rp ${formatNumber(transaction.pemasukan)}</td>
                    <td class="text-right">Rp ${formatNumber(transaction.pengeluaran)}</td>
                    <td class="text-right">Rp ${formatNumber(balance)}</td>
                </tr>
            `;
        });
        
        // Add final balance row
        tableHtml += `
            <tr class="font-weight-bold">
                <td colspan="3">Saldo Akhir</td>
                <td colspan="3" class="text-right">Rp ${formatNumber(balance)}</td>
            </tr>
        `;
        
        tableHtml += '</tbody>';
        
        table.innerHTML = tableHtml;
        
        // Add to container
        monthContainer.appendChild(monthHeader);
        monthContainer.appendChild(table);
        kasContainer.appendChild(monthContainer);
    });
}

// Jadwal Ronda functions
function loadJadwalRonda() {
    fetchAndParseCSV(csvUrls.ronda)
        .then(data => {
            renderJadwalRonda(data);
            updateLastUpdateTime();
        })
        .catch(error => {
            showToast('Gagal memuat data jadwal ronda: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function renderJadwalRonda(data) {
    if (data.length === 0) {
        rondaTable.innerHTML = '<tr><td colspan="100%">Tidak ada data</td></tr>';
        return;
    }
    
    // Create table header
    let html = '<thead><tr><th>Nama Warga</th>';
    
    // Add date headers (skip first column which is name, and last two columns which are Terakhir Ronda and Remaining)
    for (let i = 1; i < data[0].length - 2; i++) {
        html += `<th>${data[0][i]}</th>`;
    }
    
    html += '<th>Terakhir Ronda</th><th>Remaining</th></tr></thead><tbody>';
    
    // Add table rows
    for (let i = 1; i < data.length; i++) {
        html += '<tr>';
        
        // Add name
        html += `<td>${data[i][0]}</td>`;
        
        // Add date checkboxes
        for (let j = 1; j < data[i].length - 2; j++) {
            const checked = data[i][j] === 'TRUE' ? 'checked' : '';
            
            html += `
                <td class="checkbox-container">
                    <input type="checkbox" ${checked} disabled>
                </td>
            `;
        }
        
        // Add Terakhir Ronda and Remaining
        const terakhirRonda = data[i][data[i].length - 2] ? moment(data[i][data[i].length - 2]).format('DD/MM/YYYY') : '-';
        const remaining = data[i][data[i].length - 1] || 0;
        const remainingClass = remaining > 30 ? 'text-danger' : '';
        
        html += `
            <td>${terakhirRonda}</td>
            <td class="${remainingClass}">${remaining} hari</td>
        `;
        
        html += '</tr>';
    }
    
    html += '</tbody>';
    
    rondaTable.innerHTML = html;
}

// Utility function to format numbers
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide and remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add CSS for toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background-color: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .toast.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
    
    .toast-success {
        background-color: #28a745;
    }
    
    .toast-error {
        background-color: #dc3545;
    }
    
    .toast-info {
        background-color: #17a2b8;
    }
    
    .font-weight-bold {
        font-weight: 600;
    }
`;
document.head.appendChild(toastStyles);
