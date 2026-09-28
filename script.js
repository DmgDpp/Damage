// GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLGmD-beTJkCJc5NfGHBODebnwJ_YZJEBS01spupR6BNLtIu3A5nY6yqhHeNEvAR-mdQ/exec";

// Mock data fallback jika URL belum diisi
const MOCK_DATA = [
  {
    timestamp: "2026-09-28",
    project: "Project Nike Expansion",
    noBa: "BA-2026-089",
    tipeDamage: "Inbound",
    sku: "NK-AIR-MAX-90 (Sepatu Running Air Max)",
    qty: 12,
    keterangan: "Dus luar hancur basah terendam air hujan saat pembongkaran dari kontainer.",
    folderLink: "#",
    pdfLink: "#",
    photos: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"]
  }
];

let allReports = [];

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

// Load Data menggunakan JSONP untuk Menghindari CORS Block
function loadReports() {
  const loading = document.getElementById('loadingCards');

  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_WEB_APP_URL_DI_SINI")) {
    allReports = MOCK_DATA;
    loading.classList.add('hidden');
    renderCards(allReports);
    showToast("Mode Demo: Menggunakan data simulasi lokal.");
    return;
  }

  // Buat fungsi callback global
  window.handleGasResponse = function(json) {
    if (json && json.result === 'success') {
      allReports = json.data;
      loading.classList.add('hidden');
      renderCards(allReports);
    } else {
      loading.innerHTML = `<p style="color: #dc2626;">Error Data: ${json ? json.error : 'Format data salah'}</p>`;
    }
    // Hapus script tag setelah selesai
    const oldScript = document.getElementById('jsonpScript');
    if (oldScript) oldScript.remove();
  };

  // Inject Script Tag untuk Bypassing CORS
  const script = document.createElement('script');
  script.id = 'jsonpScript';
  script.src = `${SCRIPT_URL}?callback=handleGasResponse&t=${new Date().getTime()}`;
  
  script.onerror = function() {
    loading.innerHTML = `
      <div style="color: #dc2626; text-align: center; padding: 20px;">
        <p><strong>Gagal terhubung ke Google Apps Script.</strong></p>
        <p style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">
          Pastikan Anda sudah memilih <b>Who has access: Anyone</b> saat melakukan New Deployment di Apps Script.
        </p>
      </div>
    `;
  };

  document.body.appendChild(script);
}

function renderCards(reports) {
  const grid = document.getElementById('cardGrid');
  grid.innerHTML = '';

  if (!reports || reports.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: #64748b;">
        <p>Belum ada data laporan barang damage.</p>
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

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedType = document.getElementById('typeFilter').value;

  const filtered = allReports.filter(item => {
    const matchesSearch = 
      (item.project && item.project.toLowerCase().includes(searchTerm)) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm)) ||
      (item.noBa && item.noBa.toLowerCase().includes(searchTerm)) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(searchTerm));

    const matchesType = (selectedType === 'ALL') || (item.tipeDamage === selectedType);

    return matchesSearch && matchesType;
  });

  renderCards(filtered);
}

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

async function handleFormSubmit(event) {
  event.preventDefault();

  const btnSubmit = document.getElementById('btnSubmit');
  btnSubmit.disabled = true;
  btnSubmit.textContent = '⏳ Mengunggah ke Drive...';

  try {
    const pdfInput = document.getElementById('pdfFileInput').files[0];
    const pdfData = pdfInput ? await fileToBase64(pdfInput) : null;

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

    // Menggunakan no-cors untuk POST upload file
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    showToast("Laporan terkirim! Memperbarui data...");
    document.getElementById('damageForm').reset();
    switchTab('dashboard');
    setTimeout(loadReports, 3000); // Beri jeda 3 detik agar Drive & Sheet selesai memproses

  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan saat mengirim data.');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Kirim & Buat Folder Drive';
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  loadReports();
});
