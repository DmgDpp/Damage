// GANTI SCRIPT_URL DENGAN WEB APP URL GOOGLE APPS SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyhTiIkkuyY52jLOVCNDf0Lu0EmuMWZWn_lEDmKBUQlktxyLPVo-5b4-S_4rLT53caFag/exec";

let allReports = [];

document.addEventListener("DOMContentLoaded", fetchReports);
document.getElementById("searchInput").addEventListener("input", filterReports);
document.getElementById("filterTipe").addEventListener("change", filterReports);

async function fetchReports() {
  const loading = document.getElementById("loading");
  const grid = document.getElementById("cardGrid");

  try {
    const response = await fetch(SCRIPT_URL);
    const json = await response.json();

    if (json.result === "success") {
      allReports = json.data;
      loading.style.display = "none";
      renderCards(allReports);
    } else {
      loading.textContent = "Gagal memuat data: " + json.error;
    }
  } catch (err) {
    console.error(err);
    loading.textContent = "Terjadi kesalahan saat mengambil data.";
  }
}

function renderCards(reports) {
  const grid = document.getElementById("cardGrid");
  grid.innerHTML = "";

  if (reports.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Tidak ada data laporan barang damage ditemukan.</p>`;
    return;
  }

  reports.forEach(item => {
    // Foto Produk (Gunakan foto pertama jika ada, atau placeholder)
    const photoSrc = (item.photos && item.photos.length > 0) 
      ? item.photos[0] 
      : "https://via.placeholder.com/400x200?text=Tidak+Ada+Foto";

    const badgeClass = item.tipeDamage.toLowerCase() === "inbound" ? "badge-inbound" : "badge-handling";

    const cardHtml = `
      <div class="card">
        <div class="card-image-wrapper">
          <img src="${photoSrc}" alt="${item.sku}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400x200?text=Foto+Gagal+Muat'">
          <span class="badge-type ${badgeClass}">${item.tipeDamage}</span>
        </div>
        
        <div class="card-body">
          <div class="card-project">📌 ${item.project}</div>
          <h3 class="card-title">${item.sku}</h3>
          <div class="card-meta">
            <strong>Qty:</strong> ${item.qty} Pcs | <strong>No. BA:</strong> ${item.noBa}
          </div>
          
          <div class="card-keterangan">
            <strong>Keterangan:</strong><br>
            ${item.keterangan}
          </div>

          <div class="card-footer">
            ${item.pdfLink ? `<a href="${item.pdfLink}" target="_blank" class="btn-link btn-pdf">📄 PDF BA</a>` : ''}
            ${item.folderLink ? `<a href="${item.folderLink}" target="_blank" class="btn-link btn-drive">📁 Drive Foto (${item.photos ? item.photos.length : 0})</a>` : ''}
          </div>
        </div>
      </div>
    `;

    grid.innerHTML += cardHtml;
  });
}

function filterReports() {
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  const tipeValue = document.getElementById("filterTipe").value;

  const filtered = allReports.filter(item => {
    const matchesSearch = 
      item.project.toLowerCase().includes(searchValue) ||
      item.sku.toLowerCase().includes(searchValue) ||
      item.noBa.toLowerCase().includes(searchValue) ||
      item.keterangan.toLowerCase().includes(searchValue);

    const matchesTipe = tipeValue === "" || item.tipeDamage === tipeValue;

    return matchesSearch && matchesTipe;
  });

  renderCards(filtered);
}
