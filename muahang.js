
// Module quản lý mua hàng
function initMuaHangModule() {
    // Lắng nghe sự kiện xử lý hóa đơn mua hàng
    const processButton = document.getElementById('process-purchase-invoices');
    if (processButton) {
        processButton.addEventListener('click', processPurchaseInvoices);
    }

    // Tải danh sách hóa đơn mua hàng
    loadPurchaseInvoices();
    
    // Tải công nợ phải trả
    loadPayableList();
}

async function processPurchaseInvoices() {
    const fileInput = document.getElementById('purchase-invoice-files');
    const files = fileInput.files;

    if (files.length === 0) {
        alert('Vui lòng chọn file hóa đơn mua hàng.');
        return;
    }

    try {
        console.log('Bắt đầu xử lý files:', files);
        
        // QUAN TRỌNG: Đảm bảo hàm handleZipFiles tồn tại
        if (typeof window.handleZipFiles !== 'function') {
            throw new Error('Hệ thống trích xuất chưa được khởi tạo. Vui lòng tải lại trang.');
        }
        
        // Sử dụng hàm xử lý hóa đơn từ zip-trichxuat.js
        const results = await window.handleZipFiles(files);
        
        console.log('Kết quả xử lý:', results);
        
        // Cập nhật giao diện
        loadPurchaseInvoices();
        loadPayableList();
        
        // Cập nhật danh sách công ty
        if (typeof window.renderCompanyList === 'function') {
            window.renderCompanyList();
        }
        
        alert(`Đã xử lý ${results.processedCount} hóa đơn mua hàng thành công!\n- Thành công: ${results.processedCount}\n- Trùng: ${results.duplicateCount}\n- Lỗi: ${results.errorCount}`);
        
    } catch (error) {
        console.error('Lỗi xử lý hóa đơn mua hàng:', error);
        console.error('Chi tiết lỗi:', error.stack);
        
        // Hiển thị thông báo lỗi chi tiết
        alert(`Lỗi xử lý hóa đơn: ${error.message}`);
    }
}

function loadPurchaseInvoices() {
    const invoiceList = document.getElementById('purchase-invoice-list');
    if (!invoiceList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        invoiceList.innerHTML = '<tr><td colspan="9" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];

    invoiceList.innerHTML = '';

    if (invoices.length === 0) {
        invoiceList.innerHTML = '<tr><td colspan="9" style="text-align: center;">Chưa có hóa đơn mua hàng</td></tr>';
        return;
    }

    // Sắp xếp hóa đơn theo ngày (mới nhất trước)
    const sortedInvoices = [...invoices].sort((a, b) => 
        new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date)
    );

    sortedInvoices.forEach((invoice, index) => {
        const row = document.createElement('tr');
        
        let statusBadge = '';
        if (invoice.status && invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-success">Đã nhập kho</span>';
        } else if (invoice.status && invoice.status.validation === 'error') {
            statusBadge = '<span class="badge badge-danger">Lỗi</span>';
        } else {
            statusBadge = '<span class="badge badge-warning">Chưa xử lý</span>';
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</td>
            <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
            <td>${invoice.sellerInfo.name}</td>
            <td>${invoice.sellerInfo.taxCode}</td>
            <td>${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
            <td>${window.formatCurrency(invoice.summary.calculatedTax)}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">Xem</button>
                ${(!invoice.status || !invoice.status.stockPosted) ? 
                  `<button class="btn-sm btn-primary" onclick="createPurchaseReceipt('${invoice.originalFileId}')">Tạo PN</button>` : 
                  ''}
            </td>
        `;
        
        invoiceList.appendChild(row);
    });
}

function loadPayableList() {
    const payableList = document.getElementById('payable-list');
    if (!payableList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        payableList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    
    // Tính toán công nợ theo nhà cung cấp
    const supplierDebt = {};
    
    invoices.forEach(invoice => {
        const supplierKey = invoice.sellerInfo.taxCode;
        if (!supplierDebt[supplierKey]) {
            supplierDebt[supplierKey] = {
                name: invoice.sellerInfo.name,
                taxCode: supplierKey,
                totalDebt: 0,
                paid: 0,
                remaining: 0
            };
        }
        
        supplierDebt[supplierKey].totalDebt += invoice.summary.calculatedTotal;
    });

    payableList.innerHTML = '';

    if (Object.keys(supplierDebt).length === 0) {
        payableList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chưa có công nợ phải trả</td></tr>';
        return;
    }

    Object.values(supplierDebt).forEach((supplier, index) => {
        // Giả sử đã thanh toán 30% (trong thực tế sẽ lấy từ dữ liệu thanh toán)
        supplier.paid = supplier.totalDebt * 0.3;
        supplier.remaining = supplier.totalDebt - supplier.paid;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${supplier.name}</td>
            <td>${supplier.taxCode}</td>
            <td>${window.formatCurrency(supplier.totalDebt)}</td>
            <td>${window.formatCurrency(supplier.paid)}</td>
            <td>${window.formatCurrency(supplier.remaining)}</td>
            <td>
                <button class="btn-sm btn-primary" onclick="viewSupplierDetail('${supplier.taxCode}')">Chi tiết</button>
                <button class="btn-sm btn-success" onclick="makePayment('${supplier.taxCode}')">Thanh toán</button>
            </td>
        `;
        
        payableList.appendChild(row);
    });
}

function viewPurchaseInvoiceDetail(invoiceId) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('Không tìm thấy hóa đơn');
        return;
    }

    let detailHtml = `
        <div class="card">
            <div class="card-header">Thông Tin Hóa Đơn</div>
            <p><strong>Số HĐ:</strong> ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</p>
            <p><strong>Ngày HĐ:</strong> ${window.formatDate(invoice.invoiceInfo.date)}</p>
            <p><strong>Nhà cung cấp:</strong> ${invoice.sellerInfo.name}</p>
            <p><strong>MST NCC:</strong> ${invoice.sellerInfo.taxCode}</p>
            <p><strong>Địa chỉ:</strong> ${invoice.sellerInfo.address || 'Không có'}</p>
        </div>
        
        <div class="card">
            <div class="card-header">Tổng Hợp Thanh Toán</div>
            <table class="table">
                <tr><th>Tổng tiền hàng trước thuế</th><td>${window.formatCurrency(invoice.summary.calculatedAmountAfterDiscount)}</td></tr>
                <tr><th>Thuế GTGT</th><td>${window.formatCurrency(invoice.summary.calculatedTax)}</td></tr>
                <tr><th>Tổng thanh toán</th><td><strong>${window.formatCurrency(invoice.summary.calculatedTotal)}</strong></td></tr>
                <tr><th>Trạng thái</th><td>${invoice.status && invoice.status.stockPosted ? 'Đã nhập kho' : 'Chưa nhập kho'}</td></tr>
            </table>
        </div>
        
        <div class="card">
            <div class="card-header">Chi Tiết Hàng Hóa</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>MSP</th>
                        <th>Tên hàng hóa</th>
                        <th>ĐVT</th>
                        <th>SL</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    invoice.products.forEach(product => {
        detailHtml += `
            <tr>
                <td>${product.stt}</td>
                <td>${product.msp}</td>
                <td>${product.name}</td>
                <td>${product.unit}</td>
                <td>${product.quantity}</td>
                <td>${window.formatCurrency(product.price)}</td>
                <td>${window.formatCurrency(product.amount)}</td>
            </tr>
        `;
    });
    
    detailHtml += `
                </tbody>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-primary" onclick="printPurchaseInvoice('${invoiceId}')">In Hóa Đơn</button>
            ${(!invoice.status || !invoice.status.stockPosted) ? 
              `<button class="btn-success" onclick="createPurchaseReceipt('${invoiceId}')">Tạo Phiếu Nhập Kho</button>` : 
              ''}
        </div>
    `;
    
    window.showModal(`Chi Tiết Hóa Đơn Mua Hàng`, detailHtml);
}

function createPurchaseReceipt(invoiceId) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('Không tìm thấy hóa đơn');
        return;
    }

    if (invoice.status && invoice.status.stockPosted) {
        alert('Hóa đơn này đã được tạo phiếu nhập kho trước đó.');
        return;
    }

    // Tạo phiếu nhập kho
    const receipt = {
        id: `PN_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        invoiceId: invoiceId,
        invoiceNumber: `${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`,
        supplier: invoice.sellerInfo.name,
        products: invoice.products.map(product => ({
            msp: product.msp,
            name: product.name,
            unit: product.unit,
            quantity: product.quantity,
            price: product.price,
            amount: product.amount
        })),
        totalAmount: invoice.summary.calculatedTotal
    };

    // Lưu phiếu nhập kho
    if (!hkd.purchaseReceipts) {
        hkd.purchaseReceipts = [];
    }
    hkd.purchaseReceipts.push(receipt);

    // Đánh dấu hóa đơn đã nhập kho
    if (!invoice.status) {
        invoice.status = {};
    }
    invoice.status.stockPosted = true;

    // Cập nhật tồn kho (sử dụng hàm từ module cũ)
    if (typeof window.updateStock === 'function') {
        window.updateStock(window.currentCompany, invoice);
    } else {
        // Fallback: tự cập nhật tồn kho
        updateStockAfterPurchase(invoice);
    }

    // Tạo bút toán kế toán
    createPurchaseAccountingEntry(invoice);

    alert(`Đã tạo phiếu nhập kho ${receipt.id} thành công!`);
    
    // Cập nhật giao diện
    loadPurchaseInvoices();
    if (typeof window.renderStock === 'function') window.renderStock();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function updateStockAfterPurchase(invoice) {
    const hkd = window.hkdData[window.currentCompany];
    
    invoice.products.forEach(item => {
        if (item.category !== 'hang_hoa') return;
        
        let stockItem = hkd.tonkhoMain.find(p => p.msp === item.msp);
        
        if (stockItem) {
            // Cộng dồn số lượng
            stockItem.quantity += parseFloat(item.quantity);
            stockItem.amount += item.amount;
        } else {
            // Thêm mới
            hkd.tonkhoMain.push({
                msp: item.msp,
                code: item.msp,
                name: item.name,
                unit: item.unit,
                quantity: parseFloat(item.quantity),
                amount: item.amount,
                category: item.category
            });
        }
    });
}

function createPurchaseAccountingEntry(invoice) {
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.accountingTransactions) {
        hkd.accountingTransactions = [];
    }

    const transactionId = `PUR_${Date.now()}`;
    const transactionDate = invoice.invoiceInfo.date;

    // Bút toán mua hàng:
    // Nợ 156 - Hàng hóa (giá chưa thuế)
    // Nợ 133 - Thuế GTGT được khấu trừ
    // Có 331 - Phải trả nhà cung cấp

    hkd.accountingTransactions.push({
        id: transactionId,
        date: transactionDate,
        type: 'PURCHASE',
        account: '156',
        debit: invoice.summary.calculatedAmountAfterDiscount,
        credit: 0,
        description: `Mua hàng từ ${invoice.sellerInfo.name} - ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`,
        reference: invoice.originalFileId
    });

    hkd.accountingTransactions.push({
        id: transactionId,
        date: transactionDate,
        type: 'PURCHASE',
        account: '133',
        debit: invoice.summary.calculatedTax,
        credit: 0,
        description: `Thuế GTGT đầu vào - ${invoice.sellerInfo.name}`,
        reference: invoice.originalFileId
    });

    hkd.accountingTransactions.push({
        id: transactionId,
        date: transactionDate,
        type: 'PURCHASE',
        account: '331',
        debit: 0,
        credit: invoice.summary.calculatedTotal,
        description: `Phải trả ${invoice.sellerInfo.name}`,
        reference: invoice.originalFileId
    });
}

// Các hàm khác giữ nguyên...
// viewSupplierDetail, makePayment, processPayment, createPaymentAccountingEntry

// Hàm in ấn
function printPurchaseInvoices() {
    alert('Chức năng in hóa đơn mua hàng đang được phát triển');
}

function printPurchaseReceipts() {
    alert('Chức năng in phiếu nhập kho đang được phát triển');
}

function printPurchaseLedger() {
    alert('Chức năng in sổ chi tiết mua hàng đang được phát triển');
}

// Exports toàn cục
window.initMuaHangModule = initMuaHangModule;
window.loadPurchaseInvoices = loadPurchaseInvoices;
window.viewPurchaseInvoiceDetail = viewPurchaseInvoiceDetail;
window.createPurchaseReceipt = createPurchaseReceipt;
