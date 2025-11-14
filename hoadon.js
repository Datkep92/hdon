// hoadon.js
function hoadon_render() {
  const container = document.getElementById('hoadonTab');
  container.innerHTML = '';
  
  const taxCodes = Object.keys(hkdData);
  if(taxCodes.length===0){
    container.innerHTML='<p>Chưa có hóa đơn nào.</p>';
    return;
  }

  taxCodes.forEach(tc=>{
    const company = hkdData[tc];
    const div = document.createElement('div');
    div.innerHTML=`<h3>Công ty MST: ${tc}</h3>`;
    const table = document.createElement('table');
    const ths = ['STT','Số HĐ','Ký hiệu','Ngày','Người bán','Người mua','Tổng','Trạng thái'];
    table.innerHTML='<thead><tr>'+ths.map(t=>`<th>${t}</th>`).join('')+'</tr></thead>';
    const tbody = document.createElement('tbody');

    company.invoices.forEach((inv,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML=`
        <td>${i+1}</td>
        <td>${inv.invoiceInfo.number}</td>
        <td>${inv.invoiceInfo.symbol}</td>
        <td>${inv.invoiceInfo.date}</td>
        <td>${inv.sellerInfo.name}</td>
        <td>${inv.buyerInfo.name}</td>
        <td>${inv.totals.total}</td>
        <td>${inv.status.validation}</td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    div.appendChild(table);
    container.appendChild(div);
  });
}