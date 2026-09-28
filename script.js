// 1. SPREADSHEET ID ANDA (Lihat dari URL Google Sheet Anda: https://docs.google.com/spreadsheets/d/ ID_DI_SINI /edit)
const SPREADSHEET_ID = "1b8_-ul5N6Zld9O1A-xzgR-zHmkJ7xDSHyAPZgFAnnIg";

// 2. WEB APP URL GOOGLE APPS SCRIPT ANDA (Hanya dipakai untuk Mengirim/Upload Form Baru)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLGmD-beTJkCJc5NfGHBODebnwJ_YZJEBS01spupR6BNLtIu3A5nY6yqhHeNEvAR-mdQ/exec";

let allReports = [];

// Tab Navigator (SPA)
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

// BACA DATA DENGAN CARA SUPER FAST (Google Visualization API ~ 0.3 Detik)
async function loadReports() {
  const loading = document.getElementById('loadingCards');

  // Fallback jika ID belum diisi
  if (!SPREADSHEET_ID || SPREADSHEET_ID.includes("PASTE_SPREADSHEET_ID")) {
    loading.innerHTML = `<p style="color:#d97706;">Silakan isi <b>SPREADSHEET_ID</b> pada file script.js terlebih dahulu.</p>`;
    return;
  }

  const gvisUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

  try {
    const res = await fetch(gvisUrl);
    const text = await res.text();
    
    // Google gviz mengembalikan format jsonp string "//OK:{...}", kita potong teksnya
    const jsonString = text.substring(47, text.length - 2);
    const json = JSON.parse(jsonString);

    const rows = json.table.rows;
    allReports = [];

    rows.forEach(r => {
      const c = r.c;
      if (!c || !c[1]) return; // Skip baris kosong

      // Parsing foto dari Kolom J (Index 9)
      let photoUrls = [];
      if (c[9] && c[9].v) {
        photoUrls = c[9].v.toString().split(",");
      }

      allReports.push({
        timestamp: c[0] ? c[0].v : "",
        project: c[1] ? c[1].v : "",
        noBa: c[2] ? c[2].v : "",
        tipeDamage: c[3] ? c[3].v : "",
        sku: c[4] ? c[4].v : "",
        qty: c[5] ? c[5].v : "",
        keterangan: c[6] ? c[6].v : "",
        folderLink: c[7] ? c[7].v : "#",
        pdfLink: c[8] ? c[8].v : "#",
        photos: photoUrls
      });
    });

    loading.classList.add('hidden');
    renderCards(allReports);

  } catch (err) {
    console.error("Error reading sheets:", err);
    loading.innerHTML = `
      <div style="color: #dc2626; text-align: center; padding: 20px;">
        <p><strong>Gagal membaca Google Sheets.</strong></p>
        <p style="font-size: 0.85rem; color: #64748b; margin-top: 6px;">
          Pastikan Anda sudah klik <b>File > Share > Publish to Web</b> pada Google Spreadsheet Anda.
        </p>
      </div>
    `;
  }
}

// Render Kartu ke Dashboard
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
    const photoSrc = (item.photos && item.photos.length > 0 && item.photos[0] !== "") 
      ? item.photos[0] 
      : 'https://via.placeholder.com/400x200?text=Foto+Kerusakan';

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
          ${(item.pdfLink && item.pdfLink !== "#") ? `<a href="${item.pdfLink}" target="_blank" class="card-btn pdf">📄 PDF BA</a>` : ''}
          ${(item.folderLink && item.folderLink !== "#") ? `<a href="${item.folderLink}" target="_blank" class="card-btn drive">📁 Google Drive</a>` : ''}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Filter Laporan
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

// File Helper
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

// Submit Form Laporan Baru
async function handleFormSubmit(event) {
  event.preventDefault();

  const btnSubmit = document.getElementById('btnSubmit');
  btnSubmit.disabled = true;
  btnSubmit.textContent = '⏳ Mengunggah ke Drive & Sheets...';

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

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    showToast("Laporan terkirim! Memperbarui data...");
    document.getElementById('damageForm').reset();
    switchTab('dashboard');
    setTimeout(loadReports, 3000);

  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan saat mengunggah data.');
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
