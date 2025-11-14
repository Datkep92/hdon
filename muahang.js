// Module quản lý mua hàng - Phiên bản hoàn chỉnh
function initMuaHangModule() {
    console.log('🔄 Đang khởi tạo module Mua Hàng...');
    
    // Lắng nghe sự kiện xử lý hóa đơn mua hàng
    const processButton = document.getElementById('process-purchase-invoices');
    if (processButton) {
        processButton.addEventListener('click', processPurchaseInvoices);
        console.log('✅ Đã gắn sự kiện cho nút xử lý hóa đơn');
    } else {
        console.error('❌ Không tìm thấy nút process-purchase-invoices');
    }

    // Tải danh sách hóa đơn mua hàng
    loadPurchaseInvoices();
    
    // Tải công nợ phải trả
    loadPayableList();
    
    console.log('✅ Module Mua Hàng đã khởi tạo xong');
}



function createPurchaseStatsContainer() {
    // Kiểm tra xem container đã tồn tại chưa
    if (document.getElementById('purchase-file-stats')) {
        return;
    }
    
    const fileInputSection = document.querySelector('#mua-hang .card:first-child');
    if (!fileInputSection) {
        console.error('❌ Không tìm thấy section file input');
        return;
    }
    
    // Tạo HTML cho thống kê
    const statsHtml = `
        <div class="card" id="purchase-file-stats">
            <div class="card-header">📊 Thống Kê Xử Lý</div>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Tổng số file</div>
                    <div id="purchase-total-files" class="stat-value">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label text-success">Thành công</div>
                    <div id="purchase-success-count" class="stat-value">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label text-warning">Trùng lặp</div>
                    <div id="purchase-duplicate-count" class="stat-value">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label text-danger">Lỗi</div>
                    <div id="purchase-error-count" class="stat-value">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label text-info">Đã chuyển kho</div>
                    <div id="purchase-stock-posted-count" class="stat-value">0</div>
                </div>
            </div>
        </div>
    `;
    
    fileInputSection.insertAdjacentHTML('afterend', statsHtml);
    console.log('✅ Đã tạo container thống kê');
}

function updatePurchaseFileStats(total, success, error, duplicate, stockPosted = 0) {
    console.log('🔄 Cập nhật thống kê:', {total, success, error, duplicate, stockPosted});
    
    // Cập nhật các phần tử thống kê
    const elements = {
        'purchase-total-files': total,
        'purchase-success-count': success,
        'purchase-duplicate-count': duplicate,
        'purchase-error-count': error,
        'purchase-stock-posted-count': stockPosted
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`⚠️ Không tìm thấy phần tử #${id}`);
        }
    });
    
    // Hiển thị container thống kê
    const statsContainer = document.getElementById('purchase-file-stats');
    if (statsContainer) {
        statsContainer.classList.remove('hidden');
    }
}



function showPurchaseSuccessMessage(results) {
    const message = `
✅ ĐÃ XỬ LÝ HÓA ĐƠN THÀNH CÔNG!

📊 Kết quả:
• 🎯 Thành công: ${results.processedCount} hóa đơn
• 🔄 Trùng lặp: ${results.duplicateCount} hóa đơn  
• 📦 Đã chuyển kho: ${results.stockPostedCount} hóa đơn
• ❌ Lỗi: ${results.errorCount} file

💡 Dữ liệu đã được cập nhật tự động vào:
• Danh sách hóa đơn mua hàng
• Tồn kho (nếu hợp lệ)
• Công nợ phải trả
• Sổ sách kế toán
    `;
    
    alert(message);
}

function loadPurchaseInvoices() {
    const invoiceList = document.getElementById('purchase-invoice-list');
    if (!invoiceList) {
        console.error('❌ Không tìm thấy danh sách hóa đơn');
        return;
    }

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        invoiceList.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">👈 Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];

    invoiceList.innerHTML = '';

    if (invoices.length === 0) {
        invoiceList.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">📭 Chưa có hóa đơn mua hàng nào</td></tr>';
        return;
    }

    // Sắp xếp hóa đơn theo ngày (mới nhất trước)
    const sortedInvoices = [...invoices].sort((a, b) => 
        new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date)
    );

    console.log(`📄 Đang tải ${sortedInvoices.length} hóa đơn`);

    sortedInvoices.forEach((invoice, index) => {
        const row = document.createElement('tr');
        
        // Xác định trạng thái
        let statusBadge = '';
        let statusClass = '';
        
        if (invoice.status && invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-success">✅ Đã nhập kho</span>';
            statusClass = 'table-success';
        } else if (invoice.status && invoice.status.validation === 'error') {
            statusBadge = '<span class="badge badge-danger">❌ Lỗi</span>';
            statusClass = 'table-danger';
        } else {
            statusBadge = '<span class="badge badge-warning">⚠️ Chưa xử lý</span>';
            statusClass = 'table-warning';
        }

        row.className = statusClass;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong></td>
            <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
            <td>${invoice.sellerInfo.name}</td>
            <td><code>${invoice.sellerInfo.taxCode}</code></td>
            <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
            <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTax)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="button-group-small">
                    <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">👁️ Xem</button>
                    ${(!invoice.status || !invoice.status.stockPosted) ? 
                      `<button class="btn-sm btn-primary" onclick="createPurchaseReceipt('${invoice.originalFileId}')">📦 Tạo PN</button>` : 
                      ''}
                </div>
            </td>
        `;
        
        invoiceList.appendChild(row);
    });
    
    console.log('✅ Đã tải danh sách hóa đơn');
}

function loadPayableList() {
    const payableList = document.getElementById('payable-list');
    if (!payableList) {
        console.error('❌ Không tìm thấy danh sách công nợ');
        return;
    }

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        payableList.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">👈 Vui lòng chọn công ty</td></tr>';
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
        payableList.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">💳 Chưa có công nợ phải trả</td></tr>';
        return;
    }

    console.log(`🏢 Đang tải ${Object.keys(supplierDebt).length} nhà cung cấp`);

    Object.values(supplierDebt).forEach((supplier, index) => {
        // Giả sử đã thanh toán 30% (trong thực tế sẽ lấy từ dữ liệu thanh toán)
        supplier.paid = supplier.totalDebt * 0.3;
        supplier.remaining = supplier.totalDebt - supplier.paid;

        const row = document.createElement('tr');
        const debtLevel = supplier.remaining > 0 ? 'table-warning' : '';
        
        row.className = debtLevel;
        row.innerHTML = `
            <td><strong>${supplier.name}</strong></td>
            <td><code>${supplier.taxCode}</code></td>
            <td style="text-align: right;">${window.formatCurrency(supplier.totalDebt)}</td>
            <td style="text-align: right;">${window.formatCurrency(supplier.paid)}</td>
            <td style="text-align: right; font-weight: bold;">${window.formatCurrency(supplier.remaining)}</td>
            <td>
                <div class="button-group-small">
                    <button class="btn-sm btn-primary" onclick="viewSupplierDetail('${supplier.taxCode}')">📊 Chi tiết</button>
                    ${supplier.remaining > 0 ? 
                      `<button class="btn-sm btn-success" onclick="makePayment('${supplier.taxCode}')">💳 Thanh toán</button>` : 
                      ''}
                </div>
            </td>
        `;
        
        payableList.appendChild(row);
    });
    
    console.log('✅ Đã tải danh sách công nợ');
}

function viewPurchaseInvoiceDetail(invoiceId) {
    if (!window.currentCompany) {
        alert('👈 Vui lòng chọn công ty trước.');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('❌ Không tìm thấy hóa đơn');
        return;
    }

    let detailHtml = `
        <div class="card">
            <div class="card-header">📄 Thông Tin Hóa Đơn</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <p><strong>📋 Số HĐ:</strong> ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</p>
                        <p><strong>📅 Ngày HĐ:</strong> ${window.formatDate(invoice.invoiceInfo.date)}</p>
                        <p><strong>🏢 Nhà cung cấp:</strong> ${invoice.sellerInfo.name}</p>
                    </div>
                    <div class="col-6">
                        <p><strong>🔢 MST NCC:</strong> ${invoice.sellerInfo.taxCode}</p>
                        <p><strong>📍 Địa chỉ:</strong> ${invoice.sellerInfo.address || 'Không có'}</p>
                        <p><strong>📞 Điện thoại:</strong> ${invoice.sellerInfo.phone || 'Không có'}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">💰 Tổng Hợp Thanh Toán</div>
            <div class="card-body">
                <table class="table table-bordered">
                    <tr><th>Tổng tiền hàng trước thuế</th><td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedAmountAfterDiscount)}</td></tr>
                    <tr><th>Thuế GTGT</th><td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTax)}</td></tr>
                    <tr style="font-weight: bold; background: #f8f9fa;"><th>Tổng thanh toán</th><td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTotal)}</td></tr>
                    <tr><th>Trạng thái</th><td>${invoice.status && invoice.status.stockPosted ? '✅ Đã nhập kho' : '⚠️ Chưa nhập kho'}</td></tr>
                </table>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">📦 Chi Tiết Hàng Hóa</div>
            <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                <table class="table table-striped table-sm">
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
                <td><code>${product.msp}</code></td>
                <td>${product.name}</td>
                <td>${product.unit}</td>
                <td style="text-align: right;">${product.quantity}</td>
                <td style="text-align: right;">${window.formatCurrency(product.price)}</td>
                <td style="text-align: right;">${window.formatCurrency(product.amount)}</td>
            </tr>
        `;
    });
    
    detailHtml += `
                    </tbody>
                </table>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn btn-primary" onclick="printPurchaseInvoice('${invoiceId}')">🖨️ In Hóa Đơn</button>
            ${(!invoice.status || !invoice.status.stockPosted) ? 
              `<button class="btn btn-success" onclick="createPurchaseReceipt('${invoiceId}')">📦 Tạo Phiếu Nhập Kho</button>` : 
              ''}
        </div>
    `;
    
    window.showModal(`📄 Chi Tiết Hóa Đơn - ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`, detailHtml, 'modal-lg');
}

function createPurchaseReceipt(invoiceId) {
    if (!window.currentCompany) {
        alert('👈 Vui lòng chọn công ty trước.');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('❌ Không tìm thấy hóa đơn');
        return;
    }

    if (invoice.status && invoice.status.stockPosted) {
        alert('✅ Hóa đơn này đã được tạo phiếu nhập kho trước đó.');
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

    // Cập nhật tồn kho
    if (typeof window.updateStock === 'function') {
        window.updateStock(window.currentCompany, invoice);
    } else {
        // Fallback: tự cập nhật tồn kho
        updateStockAfterPurchase(invoice);
    }

    // Tạo bút toán kế toán
    createPurchaseAccountingEntry(invoice);

    alert(`✅ Đã tạo phiếu nhập kho ${receipt.id} thành công!\n\n📦 Sản phẩm đã được cập nhật vào tồn kho.`);
    
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
            console.log(`📦 Cộng dồn tồn kho: ${item.msp} (+${item.quantity})`);
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
            console.log(`📦 Thêm mới tồn kho: ${item.msp} (${item.quantity})`);
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

    // Bút toán mua hàng
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
    
    console.log(`📒 Đã tạo bút toán mua hàng: ${transactionId}`);
}

// Các hàm phụ trợ khác
function viewSupplierDetail(taxCode) {
    alert(`📊 Chi tiết nhà cung cấp ${taxCode}\n\nChức năng đang được phát triển...`);
}

function makePayment(taxCode) {
    alert(`💳 Thanh toán cho nhà cung cấp ${taxCode}\n\nChức năng đang được phát triển...`);
}

// Hàm in ấn
function printPurchaseInvoices() {
    alert('🖨️ Chức năng in hóa đơn mua hàng đang được phát triển');
}

function printPurchaseReceipts() {
    alert('🖨️ Chức năng in phiếu nhập kho đang được phát triển');
}

function printPurchaseLedger() {
    alert('🖨️ Chức năng in sổ chi tiết mua hàng đang được phát triển');
}
async function processPurchaseInvoices() {
    const fileInput = document.getElementById('purchase-invoice-files');
    const files = fileInput.files;

    if (files.length === 0) {
        alert('❌ Vui lòng chọn file hóa đơn mua hàng (ZIP/XML).');
        return;
    }

    try {
        // Hiển thị thông tin file được chọn
        let fileInfo = '📁 DANH SÁCH FILE ĐÃ CHỌN:\n';
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            fileInfo += `\n${i + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        }
        alert(fileInfo + '\n\n⏳ Đang xử lý...');

        // Kiểm tra hàm xử lý
        if (typeof window.handleZipFiles !== 'function') {
            throw new Error('Hệ thống trích xuất chưa được khởi tạo');
        }
        
        // Kiểm tra công ty
        if (!window.currentCompany) {
            throw new Error('Vui lòng chọn công ty trước');
        }

        // Tạo container thống kê
        createPurchaseStatsContainer();
        updatePurchaseFileStats(files.length, 0, 0, 0, 0);
        
        // GHI ĐÈ HÀM HIỂN THỊ LỖI ĐỂ BẮT TẤT CẢ THÔNG BÁO
        const originalAlert = window.alert;
        const allAlerts = [];
        window.alert = function(message) {
            allAlerts.push(message);
            console.log('ALERT:', message); // Vẫn log ra console phòng trường hợp
        };

        // Xử lý files
        const results = await window.handleZipFiles(files);
        
        // KHÔI PHỤC HÀM ALERT
        window.alert = originalAlert;

        // HIỂN THỊ TẤT CẢ THÔNG BÁO LỖI TỪ QUÁ TRÌNH XỬ LÝ
        if (allAlerts.length > 0) {
            let alertMessage = '📢 THÔNG BÁO TRONG QUÁ TRÌNH XỬ LÝ:\n\n';
            allAlerts.forEach((msg, index) => {
                alertMessage += `${index + 1}. ${msg}\n`;
            });
            alert(alertMessage);
        }

        // Cập nhật thống kê
        updatePurchaseFileStats(
            files.length, 
            results.processedCount, 
            results.errorCount, 
            results.duplicateCount, 
            results.stockPostedCount
        );
        
        // Hiển thị kết quả chi tiết
        if (results.fileResults && results.fileResults.length > 0) {
            showPurchaseFileResults(results.fileResults);
        }
        
        // Cập nhật giao diện
        loadPurchaseInvoices();
        loadPayableList();
        
        if (typeof window.renderCompanyList === 'function') {
            window.renderCompanyList();
        }
        
        // HIỂN THỊ KẾT QUẢ CUỐI CÙNG
        showPurchaseFinalResult(results, files.length);
        
    } catch (error) {
        alert(`❌ LỖI XỬ LÝ:\n\n${error.message}\n\n💡 Hướng giải quyết:\n1. Kiểm tra file có đúng định dạng ZIP/XML\n2. File không bị hỏng\n3. Đã chọn công ty\n4. Thử lại với file khác`);
    }
}

function showPurchaseFinalResult(results, totalFiles) {
    let resultMessage = `📊 KẾT QUẢ XỬ LÝ ${totalFiles} FILE:\n\n`;
    
    if (results.processedCount === 0 && results.errorCount === 0 && results.duplicateCount === 0) {
        resultMessage += `🤔 KHÔNG CÓ FILE NÀO ĐƯỢC XỬ LÝ!\n\n`;
        resultMessage += `🔍 NGUYÊN NHÂN CÓ THỂ:\n`;
        resultMessage += `• File không chứa hóa đơn hợp lệ\n`;
        resultMessage += `• Định dạng XML không đúng chuẩn\n`;
        resultMessage += `• File ZIP không có file XML bên trong\n`;
        resultMessage += `• Lỗi kết nối hoặc bộ nhớ\n\n`;
        resultMessage += `💡 THỬ LẠI VỚI:\n`;
        resultMessage += `• File ZIP/XML từ nguồn khác\n`;
        resultMessage += `• File mẫu để kiểm tra\n`;
        resultMessage += `• Reset trình duyệt và thử lại`;
    } else {
        resultMessage += `✅ Thành công: ${results.processedCount} file\n`;
        resultMessage += `🔄 Trùng lặp: ${results.duplicateCount} file\n`;
        resultMessage += `📦 Đã chuyển kho: ${results.stockPostedCount} file\n`;
        resultMessage += `❌ Lỗi: ${results.errorCount} file\n\n`;
        
        if (results.errorCount > 0 && results.fileResults) {
            resultMessage += `📋 CHI TIẾT LỖI:\n`;
            results.fileResults.forEach(result => {
                if (result.status === 'error') {
                    resultMessage += `• ${result.file}: ${result.message}\n`;
                }
            });
        }
        
        if (results.processedCount > 0) {
            resultMessage += `\n💾 Dữ liệu đã được cập nhật vào hệ thống`;
        }
    }
    
    alert(resultMessage);
}

// THÊM HÀM XỬ LÝ LỖI TOÀN CỤC
window.addEventListener('error', function(event) {
    alert(`🚨 LỖI HỆ THỐNG:\n\n${event.error?.message || event.message}\n\nVui lòng thử lại hoặc liên hệ hỗ trợ`);
});

window.addEventListener('unhandledrejection', function(event) {
    alert(`🚨 LỖI BẤT NGỜ:\n\n${event.reason?.message || event.reason}\n\nVui lòng thử lại hoặc liên hệ hỗ trợ`);
});
function printPurchaseInvoice(invoiceId) {
    alert(`🖨️ In hóa đơn ${invoiceId}\n\nChức năng đang được phát triển...`);
}

// Exports toàn cục
window.initMuaHangModule = initMuaHangModule;
window.loadPurchaseInvoices = loadPurchaseInvoices;
window.viewPurchaseInvoiceDetail = viewPurchaseInvoiceDetail;
window.createPurchaseReceipt = createPurchaseReceipt;
window.printPurchaseInvoices = printPurchaseInvoices;
window.printPurchaseReceipts = printPurchaseReceipts;
window.printPurchaseLedger = printPurchaseLedger;