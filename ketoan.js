// ketoan.js
function ketoan_render(){
  const container=document.getElementById('ketoanTab');
  container.innerHTML='';
  const taxCodes=Object.keys(hkdData);
  if(taxCodes.length===0){container.innerHTML='<p>Chưa có dữ liệu kế toán.</p>';return;}

  taxCodes.forEach(tc=>{
    const company=hkdData[tc];
    const div=document.createElement('div');
    div.innerHTML=`<h3>Kế toán công ty MST: ${tc}</h3>`;
    const table=document.createElement('table');
    const ths=['STT','HĐ','Ngày','Tổng trước thuế','Thuế','Tổng cộng'];
    table.innerHTML='<thead><tr>'+ths.map(t=>`<th>${t}</th>`).join('')+'</tr></thead>';
    const tbody=document.createElement('tbody');
    let stt=0;

    company.invoices.forEach(inv=>{
      stt++;
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${stt}</td>
        <td>${inv.invoiceInfo.number}</td>
        <td>${inv.invoiceInfo.date}</td>
        <td>${inv.totals.beforeTax}</td>
        <td>${inv.totals.tax}</td>
        <td>${inv.totals.total}</td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    div.appendChild(table);
    container.appendChild(div);
  });
}