// GANTI SCRIPT_URL DENGAN WEB APP URL GOOGLE APPS SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyhTiIkkuyY52jLOVCNDf0Lu0EmuMWZWn_lEDmKBUQlktxyLPVo-5b4-S_4rLT53caFag/exec";

// Fungsi helper untuk mengonversi File ke format Base64
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

document.getElementById('damageForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const btnSubmit = document.getElementById('btnSubmit');
  const loading = document.getElementById('loading');
  
  btnSubmit.disabled = true;
  loading.style.display = 'block';

  try {
    // 1. Memproses file PDF Berita Acara
    const pdfInput = document.getElementById('pdfFile').files[0];
    const pdfData = pdfInput ? await fileToBase64(pdfInput) : null;

    // 2. Memproses array foto-foto kerusakan
    const photoInputs = document.getElementById('photoFiles').files;
    const photoPromises = Array.from(photoInputs).map(file => fileToBase64(file));
    const photosData = await Promise.all(photoPromises);

    // 3. Menyusun Payload Data yang akan dikirim
    const payload = {
      project: document.getElementById('project').value,
      noBa: document.getElementById('noBa').value,
      tipeDamage: document.getElementById('tipeDamage').value,
      sku: document.getElementById('sku').value,
      qty: document.getElementById('qty').value,
      keterangan: document.getElementById('keterangan').value,
      pdfFile: pdfData,
      photos: photosData
    };

    // 4. Mengirim data ke Google Apps Script via HTTP POST
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.result === 'success') {
      alert('Berhasil! Laporan tersimpan dan folder Google Drive telah dibuat.');
      document.getElementById('damageForm').reset();
    } else {
      alert('Gagal menyimpan data: ' + result.error);
    }

  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan koneksi saat mengunggah data.');
  } finally {
    btnSubmit.disabled = false;
    loading.style.display = 'none';
  }
});
