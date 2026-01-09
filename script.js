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
let allKasData = []; // Variabel global untuk menampung data kas buat export

function loadUangKas() {
    fetchAndParseCSV(csvUrls.kas)
        .then(data => {
            allKasData = data;
            renderUangKas(data);
            updateLastUpdateTime();
        })
        .finally(() => showLoading(false));
}

function renderUangKas(data) {
    const container = document.getElementById('kasContainer');
    container.innerHTML = '';
    
    if (!data || data.length <= 1) {
        container.innerHTML = '<p class="text-center">Data kas tidak ditemukan.</p>';
        return;
    }

    let grandTotalSaldo = 0;
    let currentMonthIn = 0;
    let currentMonthOut = 0;
    
    const barisTerakhir = data[data.length - 1];
    const namaBulanTerkini = barisTerakhir[1]; 

    const monthsGroup = {};

    // 1. Hitung Semua Data
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[1]) continue;

        const masuk = parseInt(row[4].toString().replace(/[^0-9]/g, "")) || 0;
        const keluar = parseInt(row[5].toString().replace(/[^0-9]/g, "")) || 0;

        grandTotalSaldo += (masuk - keluar);

        if (row[1] === namaBulanTerkini) {
            currentMonthIn += masuk;
            currentMonthOut += keluar;
        }

        if (!monthsGroup[row[1]]) monthsGroup[row[1]] = [];
        monthsGroup[row[1]].push({
            tgl: row[2],
            ket: row[3],
            masuk: masuk,
            keluar: keluar
        });
    }

    // Update Dashboard Atas
    document.getElementById('statTotalSaldo').innerText = `Rp ${formatNumber(grandTotalSaldo)}`;
    document.getElementById('statTotalMasuk').innerText = `Rp ${formatNumber(currentMonthIn)}`;
    document.getElementById('statTotalKeluar').innerText = `Rp ${formatNumber(currentMonthOut)}`;
    
    const textLabels = document.querySelectorAll('.stat-info span');
    if(textLabels[1]) textLabels[1].innerText = `Masuk (${namaBulanTerkini})`;
    if(textLabels[2]) textLabels[2].innerText = `Keluar (${namaBulanTerkini})`;

    // 2. Render List Accordion dengan Saldo Per Bulan
    Object.keys(monthsGroup).reverse().forEach((m, idx) => {
        const accDiv = document.createElement('div');
        accDiv.className = `month-accordion ${idx === 0 ? 'active' : ''}`;
        
        let subBalance = 0;
        let runningTotalMonth = 0; // Untuk menghitung saldo akhir khusus bulan ini

        let rowsHtml = monthsGroup[m].map(item => {
            runningTotalMonth += (item.masuk - item.keluar);
            subBalance = runningTotalMonth; 
            return `
                <tr>
                    <td>${item.tgl}</td>
                    <td>${item.ket}</td>
                    <td><span class="badge ${item.masuk > 0 ? 'badge-in' : ''}">${item.masuk > 0 ? '+' + formatNumber(item.masuk) : '-'}</span></td>
                    <td><span class="badge ${item.keluar > 0 ? 'badge-out' : ''}">${item.keluar > 0 ? '-' + formatNumber(item.keluar) : '-'}</span></td>
                    <td class="text-right"><strong>${formatNumber(subBalance)}</strong></td>
                </tr>
            `;
        }).join('');

        // Tampilan Header: Kiri (Nama Bulan), Kanan (Saldo Akhir Bulan Ini)
        accDiv.innerHTML = `
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <div class="acc-left">
                    <i class="fas fa-calendar-check"></i> 
                    <span>${m}</span>
                </div>
                <div class="acc-right">
                    <span class="label-saldo-header">Saldo Akhir:</span>
                    <span class="value-saldo-header">Rp ${formatNumber(subBalance)}</span>
                    <i class="fas fa-chevron-down ml-10"></i>
                </div>
            </div>
            <div class="accordion-content">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr><th>Tgl</th><th>Keterangan</th><th>Masuk</th><th>Keluar</th><th>Saldo</th></tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
        container.appendChild(accDiv);
    });
}

// FUNGSI EXPORT EXCEL
function exportToExcel() {
    const ws = XLSX.utils.aoa_to_sheet(allKasData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");
    XLSX.writeFile(wb, `Laporan_Kas_EMURAI_${moment().format('YYYYMMDD')}.xlsx`);
}

// FUNGSI EXPORT PDF
// Tambahkan fungsi untuk menangkap grafik menjadi gambar
// Fungsi membuat grafik yang lebih stabil
async function getChartImage() {
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.id = 'tempChartCanvas';
            canvas.width = 800;
            canvas.height = 400;
            canvas.style.display = 'none';
            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            
            // Hitung data untuk grafik
            const monthsGroup = {};
            for (let i = 1; i < rawKasData.length; i++) {
                const row = rawKasData[i];
                if (!row[1]) continue;
                if (!monthsGroup[row[1]]) monthsGroup[row[1]] = { in: 0, out: 0 };
                monthsGroup[row[1]].in += parseInt(row[4].toString().replace(/[^0-9]/g, "")) || 0;
                monthsGroup[row[1]].out += parseInt(row[5].toString().replace(/[^0-9]/g, "")) || 0;
            }

            const labels = Object.keys(monthsGroup);
            const dataIn = labels.map(l => monthsGroup[l].in);
            const dataOut = labels.map(l => monthsGroup[l].out);

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Masuk', data: dataIn, borderColor: '#4361ee', backgroundColor: '#4361ee', tension: 0.3 },
                        { label: 'Keluar', data: dataOut, borderColor: '#ff006e', backgroundColor: '#ff006e', tension: 0.3 }
                    ]
                },
                options: {
                    devicePixelRatio: 2,
                    animation: {
                        onComplete: function() {
                            const imgData = canvas.toDataURL('image/png');
                            document.body.removeChild(canvas);
                            resolve(imgData);
                        }
                    }
                }
            });
        } catch (err) {
            console.error("Gagal buat grafik:", err);
            resolve(null); // Kirim null agar PDF tetap lanjut meski tanpa grafik
        }
    });
}

// Fungsi utama Export PDF
async function exportToPDF() {
    if (rawKasData.length <= 1) return alert("Data kas belum terisi!");
    
    showLoading(true);
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // 1. Tambahkan Header Laporan
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("LAPORAN BULANAN KAS E-MURAI", 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Dicetak: ${moment().format('DD/MM/YYYY HH:mm')}`, 14, 27);
        
        // 2. Tambahkan Grafik (Jika Berhasil)
        const chartBase64 = await getChartImage();
        if (chartBase64) {
            doc.addImage(chartBase64, 'PNG', 14, 35, 180, 70);
            doc.text("Grafik Arus Kas (Pemasukan vs Pengeluaran)", 14, 110);
        }

        let currentY = chartBase64 ? 120 : 40;
        let globalBalance = 0;

        // Grouping Data
        const grouped = {};
        for (let i = 1; i < rawKasData.length; i++) {
            const bulan = rawKasData[i][1];
            if (!grouped[bulan]) grouped[bulan] = [];
            grouped[bulan].push(rawKasData[i]);
        }

        // 3. Render Table Per Bulan
        const monthNames = Object.keys(grouped);
        
        for (let m = 0; m < monthNames.length; m++) {
            const bulan = monthNames[m];
            const saldoAwal = globalBalance;
            let mIn = 0;
            let mOut = 0;

            // Header Bulan & Saldo Sebelumnya
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`BULAN: ${bulan.toUpperCase()}`, 14, currentY);
            doc.setFontSize(9);
            doc.text(`Saldo Sebelumnya: Rp ${formatNumber(saldoAwal)}`, 196, currentY, { align: 'right' });
            
            const rows = grouped[bulan].map(r => {
                const vIn = parseInt(r[4].toString().replace(/[^0-9]/g, "")) || 0;
                const vOut = parseInt(r[5].toString().replace(/[^0-9]/g, "")) || 0;
                mIn += vIn;
                mOut += vOut;
                globalBalance += (vIn - vOut);
                return [r[2], r[3], formatNumber(vIn), formatNumber(vOut), formatNumber(globalBalance)];
            });

            // Footer Bulan (Total)
            rows.push([
                { content: 'TOTAL '+bulan, colSpan: 2, styles: { fillColor: [245, 245, 245], fontStyle: 'bold' } },
                { content: formatNumber(mIn), styles: { fillColor: [245, 245, 245], fontStyle: 'bold' } },
                { content: formatNumber(mOut), styles: { fillColor: [245, 245, 245], fontStyle: 'bold' } },
                { content: 'Saldo Akhir: ' + formatNumber(globalBalance), styles: { fillColor: [230, 240, 255], fontStyle: 'bold' } }
            ]);

            doc.autoTable({
                startY: currentY + 5,
                head: [['Tgl', 'Keterangan', 'Masuk', 'Keluar', 'Saldo']],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [67, 97, 238] },
                margin: { left: 14, right: 14 },
                didDrawPage: (d) => { currentY = d.cursor.y + 15; }
            });
        }

        doc.save(`Laporan_Kas_EMurai_${moment().format('MMM_YYYY')}.pdf`);

    } catch (err) {
        console.error("Fatal Error PDF:", err);
        alert("Terjadi kesalahan saat membuat PDF: " + err.message);
    } finally {
        showLoading(false);
    }
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
