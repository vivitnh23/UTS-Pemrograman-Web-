// js/script.js

// --- Pemuatan & Inisialisasi Data Global (Memastikan urutan yang benar) ---
// Menggunakan 'var' untuk inisialisasi agar kompatibel dengan data.js
var loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
var keranjangGlobal = JSON.parse(sessionStorage.getItem('keranjang')) || [];
var dataPemesanan = JSON.parse(localStorage.getItem('dataPemesananApp')) || (typeof dataPemesanan !== 'undefined' ? dataPemesanan : []);


// --- Fungsi Utilitas ---

/**
 * Mengubah angka menjadi format Rupiah.
 */
function formatRupiah(angka) {
    if (typeof angka !== 'number' || isNaN(angka)) {
        return 'Rp 0';
    }
    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    });
    return formatter.format(angka);
}

/**
 * Mengubah string Rupiah menjadi angka murni (INT) untuk perhitungan.
 */
function parseRupiah(formattedString) {
    if (typeof formattedString !== 'string') return 0;
    const cleanString = formattedString.replace(/Rp\s?|\./g, '');
    const number = parseInt(cleanString);
    return isNaN(number) ? 0 : number;
}

function showModal(title, body, isHtml = false) {
    document.getElementById('modal-title').textContent = title;
    const bodyElement = document.getElementById('modal-body');
    if (isHtml) {
        bodyElement.innerHTML = body;
    } else {
        bodyElement.textContent = body;
    }
    document.getElementById('modal').style.display = 'flex';
}

function getGreeting(nama) {
    const hour = new Date().getHours();
    let sapaan;
    if (hour >= 5 && hour < 12) { sapaan = 'Selamat Pagi'; } 
    else if (hour >= 12 && hour < 18) { sapaan = 'Selamat Siang'; } 
    else { sapaan = 'Selamat Sore'; }
    return `${sapaan}, ${nama}!`; // Tampilkan "greeting" berdasarkan waktu lokal
}

// --- Autentikasi & Navigasi ---

function checkAuth() {
    if (!loggedInUser) {
        window.location.href = 'index.html';
        return false;
    }
    
    // Sembunyikan/tampilkan nav stok/katalog
    const navStok = document.getElementById('nav-stok');
    if (navStok) {
        navStok.style.display = (loggedInUser.role === 'Admin') ? 'block' : 'none';
    }
    return true;
}

function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('keranjang');
    window.location.href = 'index.html';
}

// --- Halaman Login (index.html) ---

function handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    const user = dataPengguna.find(
        u => u.email === emailInput && u.password === passwordInput
    );

    if (user) {
        sessionStorage.setItem('loggedInUser', JSON.stringify(user));
        window.location.href = 'dashboard.html'; 
    } else {
        // Jika salah atau tidak sesuai, munculkan pop-up/alert
        alert('Email/Password yang Anda masukkan salah!');
    }
}

// --- Fungsionalitas Dashboard (dashboard.html) ---

function initDashboard() {
    if (!checkAuth()) return;

    const greetingElement = document.getElementById('greeting-text');
    if (greetingElement) {
        greetingElement.textContent = getGreeting(loggedInUser.nama); // Tampilkan "greeting"
    }
}

// --- Fungsionalitas Katalog (stok.html) ---

function renderKatalog() {
    if (!checkAuth()) return;
    
    const katalogTableBody = document.querySelector('#katalog-table tbody');
    const addStockDiv = document.getElementById('add-stock-form');
    
    // Fitur tambah baris stok baru menggunakan JavaScript DOM
    if (addStockDiv) {
        addStockDiv.style.display = (loggedInUser.role === 'Admin') ? 'block' : 'none';
    }

    katalogTableBody.innerHTML = '';
    dataKatalogBuku.forEach(buku => {
        const hargaAngka = parseRupiah(buku.harga); 
        const hargaDisplay = buku.harga; 
        
        const row = katalogTableBody.insertRow();
        row.innerHTML = `
            <td><img src="${buku.cover}" alt="${buku.namaBarang}" class="cover-thumb"></td>
            <td>${buku.kodeBarang}</td>
            <td>${buku.namaBarang}</td>
            <td>${buku.jenisBarang}</td>
            <td>${buku.edisi}</td>
            <td class="${buku.stok < 200 ? 'stok-rendah' : ''}">${buku.stok}</td>
            <td>${hargaDisplay}</td> 
            <td><button class="btn-beli" ${buku.stok === 0 ? 'disabled' : ''} data-kode="${buku.kodeBarang}" data-harga="${hargaAngka}">${buku.stok === 0 ? 'Stok Habis' : 'Beli'}</button></td>
        `;
    });

    document.querySelectorAll('.btn-beli').forEach(button => {
        button.addEventListener('click', function() {
            const kode = this.getAttribute('data-kode');
            const harga = Number(this.getAttribute('data-harga')); 
            addToCart(kode, harga);
        });
    });

    const form = document.getElementById('form-tambah-buku');
    if (form) form.addEventListener('submit', handleAddBook);
}

function handleAddBook(e) {
    e.preventDefault();
    const form = document.getElementById('form-tambah-buku');
    const newKode = form.kodeBarang.value.trim();
    const newNama = form.namaBarang.value.trim();
    const newJenis = form.jenisBarang.value.trim();
    const newEdisi = form.edisi.value.trim();
    const newStok = parseInt(form.stok.value);
    
    const newHargaAngka = parseInt(form.harga.value); 
    const newHargaFormatted = formatRupiah(newHargaAngka);

    // Default cover jika input kosong
    const newCover = form.cover.value.trim() || 'assets/img/buku_default.jpg';
    
    if (dataKatalogBuku.some(b => b.kodeBarang === newKode)) {
        alert('Kode Barang sudah ada!');
        return;
    }

    const newBuku = {
        kodeBarang: newKode, namaBarang: newNama, jenisBarang: newJenis, edisi: newEdisi, stok: newStok,
        harga: newHargaFormatted, cover: newCover
    };

    dataKatalogBuku.push(newBuku);
    renderKatalog();
    form.reset();
    showModal('Sukses', 'Buku baru berhasil ditambahkan ke katalog!');
}

function addToCart(kode, hargaAngka) {
    const buku = dataKatalogBuku.find(b => b.kodeBarang === kode);
    
    if (buku && buku.stok > 0) {
        let item = keranjangGlobal.find(i => i.kodeBarang === kode);
        
        if (item) {
            item.jumlah++;
        } else {
            keranjangGlobal.push({ 
                kodeBarang: buku.kodeBarang,
                namaBarang: buku.namaBarang,
                harga: hargaAngka, 
                jumlah: 1 
            });
        }
        
        buku.stok--; 
        sessionStorage.setItem('keranjang', JSON.stringify(keranjangGlobal));
        renderKatalog(); 
        
        showModal('Keranjang', `${buku.namaBarang} ditambahkan ke keranjang.`);
    } else {
        alert('Stok buku tidak tersedia.');
    }
}

// --- Fungsionalitas Checkout (checkout.html) ---

function initCheckout() {
    if (!checkAuth()) return;
    keranjangGlobal = JSON.parse(sessionStorage.getItem('keranjang')) || [];
    dataPemesanan = JSON.parse(localStorage.getItem('dataPemesananApp')) || (typeof dataPemesanan !== 'undefined' ? dataPemesanan : []);
    
    renderKeranjang();
    renderHistori();

    const form = document.getElementById('checkout-form');
    if (form) form.addEventListener('submit', handleCheckout);
}

function renderKeranjang() {
    const keranjangTableBody = document.querySelector('#keranjang-table tbody');
    const totalBayarElement = document.getElementById('total-pembayaran');
    const prosesPesananButton = document.getElementById('proses-pesanan');

    keranjangTableBody.innerHTML = '';
    let grandTotal = 0;

    if (keranjangGlobal.length === 0) {
        keranjangTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Keranjang kosong.</td></tr>';
        if (prosesPesananButton) prosesPesananButton.disabled = true;
        totalBayarElement.textContent = formatRupiah(0);
        return;
    }

    keranjangGlobal.forEach(item => {
        const hargaValid = Number(item.harga) || 0;
        const jumlahValid = Number(item.jumlah) || 0;

        const subtotal = hargaValid * jumlahValid;
        grandTotal += subtotal; // FIX: Menghindari NaN

        const row = keranjangTableBody.insertRow();
        row.innerHTML = `
            <td>${item.namaBarang}</td>
            <td>${formatRupiah(hargaValid)}</td>
            <td>${jumlahValid}</td>
            <td>${formatRupiah(subtotal)}</td>
        `;
    });

    totalBayarElement.textContent = formatRupiah(grandTotal);
    if (prosesPesananButton) prosesPesananButton.disabled = false;
}

function renderHistori() {
    const historiTableBody = document.querySelector('#histori-table tbody');
    historiTableBody.innerHTML = '';
    
    dataPemesanan.slice().reverse().forEach(pesanan => {
        const row = historiTableBody.insertRow();
        const detailBtn = document.createElement('button');
        detailBtn.textContent = 'Detail';
        detailBtn.classList.add('btn', 'btn-detail');
        detailBtn.onclick = () => showDetailPesanan(pesanan);
        
        const statusClass = pesanan.status ? pesanan.status.toLowerCase().replace(/\s/g, '-') : 'pending';
        
        row.innerHTML = `
            <td>${pesanan.nomorPesan}</td>
            <td>${pesanan.tanggal}</td>
            <td>${pesanan.total}</td>
            <td class="status-${statusClass}">${pesanan.status}</td>
            <td id="detail-${pesanan.nomorPesan}"></td>
        `;
        document.getElementById(`detail-${pesanan.nomorPesan}`).appendChild(detailBtn);
    });
}

function handleCheckout(e) {
    e.preventDefault();
    
    if (keranjangGlobal.length === 0) {
        alert('Keranjang belanja masih kosong!'); // Alert jika kosong
        return;
    }
    
    // ... (Logika perhitungan grandTotal dan pembuatan newOrder) ...
    let grandTotalAngka = keranjangGlobal.reduce((sum, item) => sum + (Number(item.harga) * Number(item.jumlah)), 0);
    const grandTotalFormatted = formatRupiah(grandTotalAngka);
    const nextOrderNumber = dataPemesanan.length + 1;
    const newNomorPesan = 'P' + nextOrderNumber.toString().padStart(4, '0');
    
    const newOrder = {
        nomorPesan: newNomorPesan,
        tanggal: new Date().toISOString().slice(0, 10),
        total: grandTotalFormatted,
        status: "Pending",
        items: keranjangGlobal.map(item => ({ kode: item.kodeBarang, nama: item.namaBarang, jumlah: item.jumlah })),
    };

    dataPemesanan.push(newOrder); 
    localStorage.setItem('dataPemesananApp', JSON.stringify(dataPemesanan)); // Simpan permanen

    keranjangGlobal.length = 0; // Kosongkan keranjang
    sessionStorage.removeItem('keranjang');

    showModal('Checkout Berhasil!', `Pesanan Anda berhasil diproses. No. Pesanan: ${newNomorPesan}.`);
    
    initCheckout(); 
}


// --- Fungsionalitas Tracking (tracking.html) ---

function initTracking() {
    if (!checkAuth()) return;
    
    const button = document.getElementById('cari-do');
    if (button) button.addEventListener('click', handleTracking);
    
    const resultDiv = document.getElementById('tracking-result');
    if (resultDiv) resultDiv.style.display = 'none';
}

function updateProgressBar(status) {
    const progressBarContainer = document.getElementById('progress-bar-simulasi');
    if (!progressBarContainer) return;

    let progressValue;
    let colorClass;
    const lowerStatus = status.toLowerCase();
    
    // Status Pengiriman disimulasikan dengan progress bar
    if (lowerStatus.includes('selesai') || lowerStatus.includes('terkirim')) {
        progressValue = 100;
        colorClass = 'progress-terkirim';
    } else if (lowerStatus.includes('perjalanan') || lowerStatus.includes('dikirim') || lowerStatus.includes('antar')) {
        progressValue = 75;
        colorClass = 'progress-jalan';
    } else if (lowerStatus.includes('tiba di hub') || lowerStatus.includes('diteruskan')) {
        progressValue = 50;
        colorClass = 'progress-diproses';
    } else if (lowerStatus.includes('penerimaan')) {
        progressValue = 25;
        colorClass = 'progress-awal';
    } else {
        progressValue = 50;
        colorClass = 'progress-lain';
    }

    progressBarContainer.innerHTML = `
        <div class="progress-bar ${colorClass}" style="width: ${progressValue}%;">
            ${status}
        </div>
    `;
}

function handleTracking() {
    const nomorDO = document.getElementById('nomor-do').value.trim();
    const data = dataTracking[nomorDO];
    const trackingResultDiv = document.getElementById('tracking-result');
    const riwayatTableBody = document.querySelector('#riwayat-table tbody');

    if (!trackingResultDiv || !riwayatTableBody) return;

    if (data) {
        // Tampilkan Nama Pemesan, Status, Detail Ekspedisi, Total
        document.getElementById('nama-pemesan-track').textContent = data.nama || '-';
        document.getElementById('status-pengiriman').textContent = data.status || '-';
        document.getElementById('ekspedisi').textContent = data.ekspedisi || '-';
        document.getElementById('tanggal-kirim').textContent = data.tanggalKirim || '-';
        document.getElementById('jenis-paket-track').textContent = data.paket || '-';
        document.getElementById('total-bayar-track').textContent = data.total || 'Rp 0';

        updateProgressBar(data.status);
        
        riwayatTableBody.innerHTML = '';
        data.perjalanan.slice().reverse().forEach(perjalanan => { 
            const row = riwayatTableBody.insertRow();
            row.innerHTML = `
                <td>${perjalanan.waktu}</td>
                <td>${perjalanan.keterangan}</td>
            `;
        });

        trackingResultDiv.style.display = 'block';
    } else {
        showModal('Tracking Gagal', 'Nomor Delivery Order tidak ditemukan! Coba 20230012 atau 20230013.');
        trackingResultDiv.style.display = 'none';
    }
}


// --- Inisialisasi DOM (Entry Point) ---

document.addEventListener('DOMContentLoaded', () => {
    // Setup Modal
    const modal = document.getElementById('modal');
    if (modal) {
        document.querySelector('.close-button').onclick = function() { modal.style.display = 'none'; };
        window.onclick = function(event) { if (event.target == modal) { modal.style.display = 'none'; } };
    }
    
    const fileName = window.location.pathname.split('/').pop();

    if (fileName === 'index.html' || fileName === '') {
        const form = document.getElementById('login-form');
        if (form) form.addEventListener('submit', handleLogin);
    } else if (fileName === 'dashboard.html') {
        initDashboard();
    } else if (fileName === 'stok.html') {
        renderKatalog(); // Menampilkan secara dinamis data dari data.js
    } else if (fileName === 'checkout.html') {
        initCheckout();
    } else if (fileName === 'tracking.html') {
        initTracking();
    }

    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});