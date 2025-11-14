// zip-trichxuat.js
window.hkdData = window.hkdData || {};

// =======================
// Log hiển thị trên UI
// =======================
window.logAction = function(msg){
  const logDiv = document.getElementById('logDiv');
  if(logDiv){
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
  } else {
    console.log(msg);
  }
};

// =======================
// Tạo / kiểm tra HKD
// =======================
function ensureHkdData(taxCode){
  if(!hkdData[taxCode]){
    hkdData[taxCode] = { name:taxCode, invoices:[], tonkhoMain:[], tonkhoMainDefault:null, exports:[] };
  }
}

// =======================
// Tạo MSP chuẩn
// =======================
function generateMSP(code, idx, category){
  let msp = code || `MSP${String(idx+1).padStart(5,'0')}`;
  if(category==='chiet_khau') msp+='_CK';
  if(category==='KM') msp+='_KM';
  return msp;
}

// =======================
// Parse XML
// =======================
function parseXmlInvoice(xmlContent){
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent,"text/xml");
  const getText = (sel, p=xmlDoc)=>{ const n=p.querySelector(sel); return n?n.textContent.trim():''; };

  const invoiceInfo = {
    title: getText('HDon > DLHDon > TTChung > THDon'),
    symbol: getText('HDon > DLHDon > TTChung > KHMSHDon'),
    number: getText('HDon > DLHDon > TTChung > SHDon'),
    date: getText('HDon > DLHDon > TTChung > NLap'),
    mccqt: getText('HDon > MCCQT')?.toUpperCase() || ''
  };
  const sellerInfo = {
    name: getText('HDon > DLHDon > NDHDon > NBan > Ten'),
    taxCode: getText('HDon > DLHDon > NDHDon > NBan > MST')
  };
  const buyerInfo = {
    name: getText('HDon > DLHDon > NDHDon > NMua > Ten'),
    taxCode: getText('HDon > DLHDon > NDHDon > NMua > MST')
  };

  const products = [];
  const productNodes = xmlDoc.querySelectorAll('HHDVu');
  productNodes.forEach((node, idx)=>{
    const tchat = parseInt(getText('TChat',node)||'1');
    const name = getText('THHDVu',node)||'';
    const code = getText('MaSP',node)||'';
    const unit = getText('DVTinh',node)||'';
    const quantity = parseFloat(getText('SLuong',node)||'0');
    const price = parseFloat(getText('DGia',node)||'0');
    const discount = parseFloat(getText('CKhau',node)||'0');
    const xmlAmount = parseFloat(getText('ThTien',node)||'0');

    let taxRate = 0;
    const rawTax = getText('TSuat',node).replace('%','').trim();
    if(!isNaN(parseFloat(rawTax))) taxRate=parseFloat(rawTax);

    let category='hang_hoa';
    const lower = name.toLowerCase();
    const isCK = lower.includes('chiết khấu') || lower.includes('ck');
    if(quantity===0 && price===0) category='KM';
    else if(tchat===3 && isCK) category='chiet_khau';

    const msp = generateMSP(code, idx, category);
    const amount = quantity*price - discount;

    products.push({stt:idx+1, msp, code, name, unit, quantity, price, discount, amount, taxRate, category, xmlAmount});
  });

  const totals = {
    beforeTax: products.reduce((s,p)=>s+p.amount,0),
    tax: Math.round(products.reduce((s,p)=>s+(p.amount*p.taxRate/100),0))
  };
  totals.total = totals.beforeTax + totals.tax;

  return {invoiceInfo, sellerInfo, buyerInfo, products, totals};
}

// =======================
// Kiểm tra trùng HĐ
// =======================
function isDuplicate(invoice, taxCode){
  ensureHkdData(taxCode);
  const key = `${invoice.invoiceInfo.symbol}_${invoice.invoiceInfo.number}`;
  return hkdData[taxCode].invoices.some(inv=>inv.uniqueKey===key);
}

// =======================
// Cập nhật tồn kho
// =======================
function updateStock(taxCode, invoice){
  ensureHkdData(taxCode);
  const hkd = hkdData[taxCode];
  invoice.products.forEach(item=>{
    if(item.category!=='hang_hoa') return;
    let stockItem = hkd.tonkhoMain.find(p=>p.msp===item.msp);
    if(stockItem){
      stockItem.quantity += item.quantity;
      stockItem.amount += item.amount;
    } else {
      hkd.tonkhoMain.push({
        msp:item.msp, code:item.code, name:item.name, unit:item.unit, 
        quantity:item.quantity, price:item.price, amount:item.amount
      });
    }
  });
}

// =======================
// Xử lý ZIP
// =======================
async function extractInvoiceFromZip(file){
  const zip = await JSZip.loadAsync(file);
  const xmlFile = Object.values(zip.files).find(f=>f.name.toLowerCase().endsWith('.xml'));
  if(!xmlFile) throw new Error('Không tìm thấy file XML trong ZIP');
  const xmlContent = await xmlFile.async('text');
  return parseXmlInvoice(xmlContent);
}

async function handleZipFiles(files){
  for(const file of files){
    if(!file.name.toLowerCase().endsWith('.zip')) continue;
    try{
      const invoice = await extractInvoiceFromZip(file);
      if(!invoice || !invoice.products || invoice.products.length===0){
        window.logAction(`Bỏ qua file ${file.name}`);
        continue;
      }

      const taxCode = invoice.buyerInfo.taxCode || 'UNKNOWN';
      ensureHkdData(taxCode);
      const uniqueKey = `${invoice.invoiceInfo.symbol}_${invoice.invoiceInfo.number}`;
      if(isDuplicate(invoice, taxCode)){
        window.logAction(`Trùng HĐ, bỏ qua: ${uniqueKey}`);
        continue;
      }

      const computedTotal = invoice.products.reduce((s,p)=>s+p.amount,0) + Math.round(invoice.products.reduce((s,p)=>s+(p.amount*p.taxRate/100),0));
      const totalDiff = Math.abs(computedTotal - invoice.totals.total);

      invoice.status = { validation: totalDiff<=1?'ok':'error', stockPosted: totalDiff<=1 };
      invoice.uniqueKey = uniqueKey;
      invoice.extractedAt = new Date().toISOString();

      hkdData[taxCode].invoices.push(invoice);
      if(invoice.status.stockPosted) updateStock(taxCode, invoice);

      window.logAction(`[NHẬP HĐ] MST=${taxCode}, HĐ=${uniqueKey}, trạng thái=${invoice.status.validation}`);

    } catch(err){
      window.logAction(`Lỗi file ${file.name}: ${err.message}`);
    }
  }
}

// =======================
// Exports
// =======================
window.handleZipFiles = handleZipFiles;
window.extractInvoiceFromZip = extractInvoiceFromZip;
window.parseXmlInvoice = parseXmlInvoice;
window.ensureHkdData = ensureHkdData;
window.isDuplicate = isDuplicate;
window.updateStock = updateStock;
window.generateMSP = generateMSP;