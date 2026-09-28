// GANTI DENGAN WEB APP URL DARI GOOGLE APPS SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyhTiIkkuyY52jLOVCNDf0Lu0EmuMWZWn_lEDmKBUQlktxyLPVo-5b4-S_4rLT53caFag/exec";

// Sample / Mock Data jika API belum dikonfigurasi
const MOCK_DATA = [
  {
    timestamp: "2026-09-28",
    project: "Project Nike Expansion",
    noBa: "BA-2026-089",
    tipeDamage: "Inbound",
    sku: "NK-AIR-MAX-90 (Sepatu Running Air Max)",
    qty: 12,
    keterangan: "Dus luar hancur basah terendam air hujan saat pembongkaran (unloading) dari truk kontainer vendor.",
    folderLink: "https://drive.google.com",
    pdfLink: "https://drive.google.com",
    photos: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"]
  },
  {
    timestamp: "2026-09-28",
    project: "Project Shopee Megahub",
    noBa: "BA-2026-092",
    tipeDamage: "Handling",
    sku: "ELEC-TV-55-4K (Smart TV 55 Inch)",
    qty: 2,
    keterangan: "Layar retak akibat terjatuh dari forklift saat aktivitas penyusunan rack di Zone C Warehouse.",
    folderLink: "https://drive.google.com",
    pdfLink: "https://drive.google.com",
    photos: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80"]
  },
  {
    timestamp: "2026-09-27",
    project: "Project Unilever Logistics",
    noBa: "BA-2026-095",
    tipeDamage: "Handling",
    sku: "HGC-SOAP-500ML (Liquid Soap Refill)",
    qty: 45,
    keterangan: "Kemasan bocor membasahi barang lain di sekitarnya karena tertindih berat pallet yang berlebihan.",
    folderLink: "https://drive.google.com",
    pdfLink: "https://drive.google.com",
    photos: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80"]
  }
];

let allReports = [];

// Navigation Manager (Tab Switcher)
function switchTab(tabName) {
  const dashboardView = document.getElementById('dashboardView');
  const formView = document.getElementById('formView');
  const btnDashboard = document.getElementById('btnTabDashboard');
  const btnForm = document.getElementById('btnTabForm');

  if (tabName === 'dashboard') {
    dashboardView.classList.remove('hidden');
    formView.classList.add('hidden');
    btnDashboard.classList.add('active');
    btnForm.classList.remove('active');
  } else {
    dashboardView.classList.add('hidden');
    formView.classList.remove('hidden');
    btnDashboard.classList.remove('active');
    btnForm.classList.add('active');
  }
}

// Fetch Reports Data from Google Apps Script / Mock
async function loadReports() {
  const loading = document.getElementById('loadingCards');
  const cardGrid = document.getElementById('cardGrid');

  if (SCRIPT_URL === "PASTE_WEB_APP_URL_DI_SINI") {
    // Mode Simulasi / Mock Data
    setTimeout(() => {
      allReports = MOCK_DATA;
      loading.classList.add('hidden');
      renderCards(allReports);
      showToast("Mode Demo: Menggunakan Data Simulasi Local");
    }, 600);
    return;
  }

  try {
    const response = await fetch(SCRIPT_URL);
    const json = await response.json();

    if (json.result === 'success') {
      allReports = json.data;
      loading.classList.add('hidden');
      renderCards(allReports);
    } else {
      loading.innerHTML = `<p style="color: #dc2626;">Gagal memuat data: ${json.error}</p>`;
    }
  } catch (err) {
    console.error(err);
    loading.innerHTML = `<p style="color: #dc2626;">Terjadi kesalahan saat terhubung ke Google Apps Script.</p>`;
  }
}

// Render Card Grid HTML
function renderCards(reports) {
  const grid = document.getElementById('cardGrid');
  grid.innerHTML = '';

  if (reports.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--text-muted);">
        <p>Tidak ada data laporan barang damage ditemukan.</p>
      </div>
    `;
    return;
  }

  reports.forEach(item => {
    const photoSrc = (item.photos && item.photos.length > 0) 
      ? item.photos[0] 
      : 'https://via.placeholder.com/400x200?text=Tidak+Ada+Foto';

    const typeClass = item.tipeDamage ? item.tipeDamage.toLowerCase() : 'inbound';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-media">
        <img src="${photoSrc}" alt="${item.sku}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x200?text=Foto+Gagal+Dimuat'">
        <span class="badge-type ${typeClass}">${item.tipeDamage}</span>
      </div>
      <div class="card-body">
        <div class="card-project">📌 ${item.project}</div>
        <h3 class="card-title">${item.sku}</h3>
        <div class="card-meta">
          <span><strong>Qty:</strong> ${item.qty} Pcs</span>
          <span><strong>BA:</strong> ${item.noBa}</span>
        </div>
        <div class="card-keterangan">
          <strong>Kronologi / Keterangan:</strong><br>
          ${item.keterangan}
        </div>
        <div class="card-footer">
          ${item.pdfLink ? `<a href="${item.pdfLink}" target="_blank" class="card-btn pdf">📄 PDF BA</a>` : ''}
          ${item.folderLink ? `<a href="${item.folderLink}" target="_blank" class="card-btn drive">📁 Google Drive</a>` : ''}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Filter Search & Category
function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedType = document.getElementById('typeFilter').value;

  const filtered = allReports.filter(item => {
    const matchesSearch = 
      item.project.toLowerCase().includes(searchTerm) ||
      item.sku.toLowerCase().includes(searchTerm) ||
      item.noBa.toLowerCase().includes(searchTerm) ||
      item.keterangan.toLowerCase().includes(searchTerm);

    const matchesType = (selectedType === 'ALL') || (item.tipeDamage === selectedType);

    return matchesSearch && matchesType;
  });

  renderCards(filtered);
}

// File to Base64 Conversion Helper
const fileToBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve({
    name: file.name,
    type: file.type,
    data: reader.result
  });
  reader.onerror = error => reject(error);
});

// Handle Form Submission
async function handleFormSubmit(event) {
  event.preventDefault();

  const btnSubmit = document.getElementById('btnSubmit');
  btnSubmit.disabled = true;
  btnSubmit.textContent = '⏳ Mengunggah ke Drive...';

  try {
    // Process PDF File
    const pdfInput = document.getElementById('pdfFileInput').files[0];
    const pdfData = pdfInput ? await fileToBase64(pdfInput) : null;

    // Process Photo Files
    const photoInputs = document.getElementById('photosInput').files;
    const photoPromises = Array.from(photoInputs).map(file => fileToBase64(file));
    const photosData = await Promise.all(photoPromises);

    const payload = {
      project: document.getElementById('projectInput').value,
      noBa: document.getElementById('noBaInput').value,
      tipeDamage: document.getElementById('typeInput').value,
      qty: document.getElementById('qtyInput').value,
      sku: document.getElementById('skuInput').value,
      keterangan: document.getElementById('keteranganInput').value,
      pdfFile: pdfData,
      photos: photosData
    };

    if (SCRIPT_URL === "PASTE_WEB_APP_URL_DI_SINI") {
      // Demo mode fallback
      setTimeout(() => {
        allReports.unshift({
          ...payload,
          timestamp: new Date().toISOString().slice(0, 10),
          folderLink: "https://drive.google.com",
          pdfLink: "https://drive.google.com",
          photos: photosData.map(p => p.data)
        });

        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Kirim & Buat Folder Drive';
        document.getElementById('damageForm').reset();
        switchTab('dashboard');
        renderCards(allReports);
        showToast("Laporan Berhasil Disimpan! (Mode Demo Local)");
      }, 1000);
      return;
    }

    // Real API Call to Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.result === 'success') {
      showToast("Laporan tersimpan & folder Google Drive berhasil dibuat!");
      document.getElementById('damageForm').reset();
      switchTab('dashboard');
      loadReports();
    } else {
      alert('Gagal menyimpan: ' + result.error);
    }

  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan koneksi saat mengirim data.');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Kirim & Buat Folder Drive';
  }
}

// Toast Helper
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

// Initialize System on Load
document.addEventListener('DOMContentLoaded', () => {
  loadReports();
});
