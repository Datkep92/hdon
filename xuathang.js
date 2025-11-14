// xuathang.js
function xuathang_render(){
  const container=document.getElementById('xuathangTab');
  container.innerHTML='';
  const taxCodes=Object.keys(hkdData);
  if(taxCodes.length===0){container.innerHTML='<p>Chưa có dữ liệu xuất hàng.</p>';return;}

  taxCodes.forEach(tc=>{
    const company=hkdData[tc];
    const div=document.createElement('div');
    div.innerHTML=`<h3>Xuất hàng công ty MST: ${tc}</h3>`;
    const table=document.createElement('table');
    const ths=['STT','MSP','Tên','SL tồn','SL xuất','Thành tiền'];
    table.innerHTML='<thead><tr>'+ths.map(t=>`<th>${t}</th>`).join('')+'</tr></thead>';
    const tbody=document.createElement('tbody');
    let stt=0,totalQty=0,totalAmount=0;

    company.tonkhoMain.forEach(item=>{
      stt++;
      const qtyXuat = Math.floor(item.quantity/2); // ví dụ xuất 50%
      totalQty+=qtyXuat;
      const amount=item.price*qtyXuat;
      totalAmount+=amount;
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${stt}</td>
        <td>${item.msp}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${qtyXuat}</td>
        <td>${amount}</td>
      `;
      tbody.appendChild(tr);
    });

    const trTotal=document.createElement('tr');
    trTotal.innerHTML=`<td colspan="4">Tổng</td><td>${totalQty}</td><td>${totalAmount}</td>`;
    tbody.appendChild(trTotal);
    table.appendChild(tbody);
    div.appendChild(table);
    container.appendChild(div);
  });
}