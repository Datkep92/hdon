

function renderModePreview(mode, fileCount) {
    if (mode === 'immediate') {
        return `
            <div class="preview-immediate">
                <h4>⚡ Sẽ xử lý ngay:</h4>
                <ul>
                    <li>Hiển thị popup sửa lỗi trực tiếp</li>
                    <li>Cập nhật ngay vào Mua Hàng & Kho</li>
                    <li>Phù hợp cho <strong>${fileCount} file</strong></li>
                    <li>Hoàn thành ngay trong vài phút</li>
                </ul>
            </div>
        `;
    } else {
        return `
            <div class="preview-batch">
                <h4>📦 Sẽ xử lý hàng loạt:</h4>
                <ul>
                    <li>Chuyển sang tab "NHẬP HÓA ĐƠN ĐẦU VÀO"</li>
                    <li>Quản lý tập trung tất cả hóa đơn</li>
                    <li>Xử lý <strong>${fileCount} file</strong> theo lô</li>
                    <li>Phù hợp cho số lượng lớn</li>
                </ul>
            </div>
        `;
    }
}


// =======================
// THÊM HÀM XỬ LÝ LỖI TỨC THÌ
// =======================
async function processImmediateErrors(results) {
    console.log(`⚠️ Có ${results.errorCount} hóa đơn cần xử lý`);
    
    // Hiển thị thông báo về hóa đơn lỗi
    if (results.errorCount === 1) {
        const userChoice = confirm(`⚠️ Phát hiện 1 hóa đơn có chênh lệch.\n\nBạn có muốn xử lý thủ công ngay không?`);
        if (userChoice) {
            // TODO: Hiển thị popup chỉnh sửa hóa đơn
            console.log('🎯 Sẽ hiển thị popup chỉnh sửa hóa đơn');
            alert('📝 Chức năng chỉnh sửa hóa đơn đang được phát triển...');
        }
    } else if (results.errorCount > 1) {
        alert(`⚠️ Phát hiện ${results.errorCount} hóa đơn có chênh lệch.\n\nCác hóa đơn này sẽ được chuyển sang tab xử lý chuyên dụng.`);
    }
}




// =======================
// THÊM CSS CHO MODAL
// =======================
function addProcessingModalStyles() {
    const styles = `
        <style>
        .processing-choice-modal .mode-option {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: flex-start;
        }
        
        .processing-choice-modal .mode-option:hover {
            border-color: #007bff;
            background: #f8f9fa;
        }
        
        .processing-choice-modal .mode-option.recommended {
            border-color: #28a745;
            background: #f8fff9;
        }
        
        .processing-choice-modal input[type="radio"] {
            margin-right: 10px;
            margin-top: 5px;
        }
        
        .processing-choice-modal .mode-icon {
            font-size: 24px;
            margin-right: 15px;
        }
        
        .processing-choice-modal .mode-content {
            flex: 1;
        }
        
        .processing-choice-modal .mode-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
        }
        
        .processing-choice-modal .mode-desc {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
        
        .mode-preview {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #007bff;
        }
        
        .mode-preview h4 {
            margin: 0 0 10px 0;
            color: #333;
        }
        
        .mode-preview ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .mode-preview li {
            margin-bottom: 5px;
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// =======================
// HÀM PHỤ TRỢ
// =======================
function showLoading(message) {
    console.log('⏳ ' + message);
    // Có thể thêm spinner UI sau
}

function showSuccessMessage(message) {
    alert(message);
}

function showBatchResultsSummary(results, totalFiles) {
    const message = `
📊 KẾT QUẢ TRÍCH XUẤT HÀNG LOẠT

📁 Tổng số file: ${totalFiles}
✅ Hóa đơn hợp lệ: ${results.processedCount}
⚠️ Hóa đơn cần sửa: ${results.errorCount}
🔄 Trùng lặp: ${results.duplicateCount}
📦 Đã chuyển kho: ${results.stockPostedCount}

Đang chuyển sang tab xử lý chuyên dụng...
    `;
    
    alert(message);
}

function switchToImportTab() {
    console.log('🔄 Chuyển sang tab NHẬP HÓA ĐƠN ĐẦU VÀO');
    // Sẽ triển khai khi có tab mới
    alert('📦 Đã chuyển hóa đơn sang tab xử lý chuyên dụng. Tab này đang được phát triển.');
}

// =======================
// KHỞI TẠO
// =======================
function initMuaHangModule() {
    console.log('🔄 Đang khởi tạo module Mua Hàng...');
    
    // Thêm CSS
    addProcessingModalStyles();
    
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



function updateFileStats(total, success, error, duplicate, stockPosted = 0) {
    console.log('📊 Cập nhật thống kê:', {total, success, error, duplicate, stockPosted});
    
    // KIỂM TRA XEM ĐANG Ở TAB NÀO
    const currentTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');
    console.log('📍 Tab hiện tại:', currentTab);
    
    if (currentTab === 'mua-hang') {
        // Nếu đang ở tab Mua Hàng, sử dụng hàm của tab Mua Hàng
        if (typeof updatePurchaseFileStats === 'function') {
        } else {
            console.warn('⚠️ Hàm updatePurchaseFileStats không tồn tại');
        }
        return;
    }
    
    // Nếu đang ở tab Trích Xuất HĐ (tab cũ), cập nhật các phần tử cũ
    try {
        const totalFilesElem = document.getElementById('total-files');
        const successCountElem = document.getElementById('success-count');
        const duplicateCountElem = document.getElementById('duplicate-count');
        const errorCountElem = document.getElementById('error-count');
        const stockPostedElem = document.getElementById('stock-posted-count');
        
        // CHỈ CẬP NHẬT NẾU PHẦN TỬ TỒN TẠI
        if (totalFilesElem) totalFilesElem.textContent = total;
        if (successCountElem) successCountElem.textContent = success;
        if (duplicateCountElem) duplicateCountElem.textContent = duplicate;
        if (errorCountElem) errorCountElem.textContent = error;
        if (stockPostedElem) stockPostedElem.textContent = stockPosted;
        
        // Hiển thị container thống kê nếu tồn tại
        const fileStatsElem = document.getElementById('file-stats');
        if (fileStatsElem) {
            fileStatsElem.classList.remove('hidden');
        }
        
    } catch (error) {
        console.warn('⚠️ Không thể cập nhật thống kê tab cũ:', error.message);
    }
}
// XÓA HÀM TRÙNG LẶP NÀY (đã có trong zip-trichxuat.js)
/*
function updateFileStats(total, success, error, duplicate, stockPosted = 0) {
    // XÓA TOÀN BỘ HÀM NÀY
}
*/

// GIỮ LẠI HÀM createPurchaseStatsContainer VÀ updatePurchaseFileStats
function createPurchaseStatsContainer() {
    // KIỂM TRA KỸ TRƯỚC KHI TẠO
    const existingStats = document.getElementById('purchase-file-stats');
    if (existingStats) {
        existingStats.remove(); // Xóa cái cũ nếu tồn tại
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

// THÊM HÀM HIỂN THỊ KẾT QUẢ FILE BỊ THIẾU
function showPurchaseFileResults(fileResults) {
    let resultsHtml = `
        <div class="card">
            <div class="card-header">📋 Chi Tiết Kết Quả Xử Lý</div>
            <div style="max-height: 300px; overflow-y: auto;">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>File</th>
                            <th>Trạng thái</th>
                            <th>Thông báo</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    fileResults.forEach(result => {
        let statusClass = '';
        let statusIcon = '';
        
        switch(result.status) {
            case 'success':
                statusClass = 'text-success';
                statusIcon = '✅';
                break;
            case 'duplicate':
                statusClass = 'text-warning';
                statusIcon = '⚠️';
                break;
            case 'error':
                statusClass = 'text-danger';
                statusIcon = '❌';
                break;
            default:
                statusClass = 'text-secondary';
                statusIcon = '🔍';
        }
        
        resultsHtml += `
            <tr>
                <td><small>${result.file}</small></td>
                <td class="${statusClass}">${statusIcon} ${result.status}</td>
                <td><small>${result.message}</small></td>
            </tr>
        `;
    });
    
    resultsHtml += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Hiển thị trong modal
    window.showModal('📋 Kết Quả Xử Lý Chi Tiết', resultsHtml);
}

// THÊM HÀM HIỂN THỊ KẾT QUẢ CUỐI CÙNG
function showPurchaseFinalResult(results, totalFiles) {
    const successRate = totalFiles > 0 ? (results.processedCount / totalFiles * 100).toFixed(1) : 0;
    
    const message = `
🎯 **XỬ LÝ HOÀN TẤT!**

📊 **Tổng kết:**
• 📁 Tổng file: ${totalFiles}
• ✅ Thành công: ${results.processedCount}
• 🔄 Trùng lặp: ${results.duplicateCount}
• 📦 Đã chuyển kho: ${results.stockPostedCount}
• ❌ Lỗi: ${results.errorCount}
• 📈 Tỷ lệ thành công: ${successRate}%

🏢 **Tình trạng công ty:**
• Đang chọn: ${window.currentCompany ? window.hkdData[window.currentCompany]?.name : 'Chưa chọn'}
• Tổng công ty: ${Object.keys(window.hkdData).length}

💡 **Tiếp theo:**
• Hóa đơn đã được gom theo MST người mua
• Tự động tạo công ty nếu chưa có
• Dữ liệu đã sẵn sàng trong tab Mua Hàng
    `;
    
    // Sử dụng console.log để debug
    console.log('🔍 DEBUG - Danh sách công ty sau xử lý:', Object.keys(window.hkdData));
    console.log('🔍 DEBUG - Hóa đơn trong công ty hiện tại:', 
        window.currentCompany ? window.hkdData[window.currentCompany]?.invoices?.length : 'Chưa chọn công ty');
    
    alert(message);
}
// THÊM HÀM DEBUG VÀO muahang.js
function debugCompanyData() {
    console.log('🔍 DEBUG COMPANY DATA:');
    console.log('- Số công ty:', Object.keys(window.hkdData).length);
    
    Object.keys(window.hkdData).forEach(taxCode => {
        const company = window.hkdData[taxCode];
        console.log(`- ${taxCode}: ${company.name}`);
        console.log(`  Số HĐ: ${company.invoices?.length || 0}`);
        console.log(`  Tồn kho: ${company.tonkhoMain?.length || 0} sản phẩm`);
        
        // Log chi tiết hóa đơn
        if (company.invoices && company.invoices.length > 0) {
            company.invoices.forEach((inv, idx) => {
                console.log(`  HĐ ${idx + 1}: ${inv.invoiceInfo.symbol}/${inv.invoiceInfo.number} - ${inv.summary.calculatedTotal}`);
            });
        }
    });
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



// 🔥 THÊM HÀM FALLBACK ĐỂ HIỂN THỊ DANH SÁCH CÔNG TY
function renderCompanyListFallback() {
    const companyList = document.getElementById('company-list');
    if (!companyList) {
        console.error('❌ Không tìm thấy #company-list');
        return;
    }

    companyList.innerHTML = '';

    if (!window.hkdData || Object.keys(window.hkdData).length === 0) {
        companyList.innerHTML = '<div class="company-item no-company">📭 Chưa có công ty nào</div>';
        return;
    }

    const companies = Object.keys(window.hkdData).sort();
    
    companies.forEach(taxCode => {
        const company = window.hkdData[taxCode];
        const companyItem = document.createElement('div');
        companyItem.className = 'company-item';
        if (taxCode === window.currentCompany) {
            companyItem.classList.add('active');
        }
        
        // Tính tổng số lượng tồn kho
        const totalStock = Array.isArray(company.tonkhoMain) 
            ? company.tonkhoMain.reduce((sum, p) => sum + (p.quantity || 0), 0)
            : 0;

        companyItem.innerHTML = `
            <div class="company-name">${company.name || 'Chưa có tên'}</div>
            <div class="company-mst">MST: ${taxCode}</div>
            <div class="company-info">
                <small>🧾 HĐ: ${company.invoices?.length || 0} | 📦 Tồn kho: ${totalStock.toLocaleString('vi-VN')} SP</small>
            </div>
        `;

        companyItem.addEventListener('click', () => {
            if (typeof window.selectCompany === 'function') {
                window.selectCompany(taxCode);
            } else {
                // Fallback selection
                window.currentCompany = taxCode;
                updateCurrentCompanyDisplay();
                renderCompanyListFallback();
                loadPurchaseInvoices();
                loadPayableList();
            }
        });

        companyList.appendChild(companyItem);
    });
    
    console.log(`✅ Đã render ${companies.length} công ty`);
}

// 🔥 THÊM HÀM CẬP NHẬT HIỂN THỊ CÔNG TY ĐANG CHỌN
function updateCurrentCompanyDisplay() {
    const currentCompanyElem = document.getElementById('current-company');
    if (currentCompanyElem && window.currentCompany && window.hkdData[window.currentCompany]) {
        const companyName = window.hkdData[window.currentCompany].name || window.currentCompany;
        currentCompanyElem.textContent = `Đang chọn: ${companyName} (MST: ${window.currentCompany})`;
    }
}

// 🔥 ĐẢM BẢO CÁC HÀM NÀY ĐƯỢC EXPORT
window.renderCompanyListFallback = renderCompanyListFallback;
window.updateCurrentCompanyDisplay = updateCurrentCompanyDisplay;
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