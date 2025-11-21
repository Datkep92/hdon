// =======================
// CORE FIXES - FIX CONTEXT ISSUES
// =======================
// 🔥 FALLBACK FUNCTIONS - ĐẢM BẢO TÍNH TƯƠNG THÍCH
window.ensureBackwardCompatibility = function() {
    console.log('🔄 Đảm bảo tính tương thích ngược...');
    
    // Fallback cho renderInvoices nếu module cũ gọi
    if (typeof window.renderInvoices !== 'function') {
        window.renderInvoices = function(searchTerm = '') {
            console.warn('⚠️ renderInvoices được gọi - sử dụng unifiedRenderInvoices');
            window.unifiedRenderInvoices(searchTerm, 'invoice-list', 'auto');
        };
    }
    
    // Fallback cho các hàm xử lý hóa đơn lỗi
    if (typeof window.fixInvoiceAndPostStock !== 'function') {
        window.fixInvoiceAndPostStock = function(invoiceId) {
            console.warn('⚠️ fixInvoiceAndPostStock được gọi - chức năng đang phát triển');
            alert(`🛠️ Sửa hóa đơn ${invoiceId}\n\nChức năng đang được phát triển...`);
        };
    }
    
    // Fallback cho viewPurchaseInvoiceDetail
    if (typeof window.viewPurchaseInvoiceDetail !== 'function') {
        window.viewPurchaseInvoiceDetail = function(invoiceId) {
            console.warn('⚠️ viewPurchaseInvoiceDetail được gọi - chức năng đang phát triển');
            alert(`👁️ Xem chi tiết hóa đơn ${invoiceId}\n\nChức năng đang được phát triển...`);
        };
    }
    
    // Fallback cho editPurchaseInvoice  
    if (typeof window.editPurchaseInvoice !== 'function') {
        window.editPurchaseInvoice = function(invoiceId) {
            console.warn('⚠️ editPurchaseInvoice được gọi - chức năng đang phát triển');
            alert(`✏️ Sửa hóa đơn ${invoiceId}\n\nChức năng đang được phát triển...`);
        };
    }
    
    console.log('✅ Đảm bảo tính tương thích ngược hoàn tất');
};

// 🔥 CẬP NHẬT HÀM INIT CORE
window.initCoreSystem = function() {
    console.log('🚀 Khởi tạo hệ thống core...');
    
    // 1. Đảm bảo hàm modal
    window.ensureModalFunctions();
    
    // 2. Đồng bộ dữ liệu
    window.syncCompanyData();
    
    // 3. Dọn dẹp hàm trùng
    window.cleanDuplicateFunctions();
    
    // 4. Đảm bảo tính tương thích ngược
    window.ensureBackwardCompatibility();
    
    // 5. Đảm bảo các hàm tiện ích tồn tại
    if (typeof window.formatCurrency !== 'function') {
        window.formatCurrency = function(amount) {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
        };
    }
    
    if (typeof window.formatDate !== 'function') {
        window.formatDate = function(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        };
    }
    
    if (typeof window.accountingRound !== 'function') {
        window.accountingRound = function(amount) {
            return Math.round(amount);
        };
    }
    
    console.log('✅ Core system initialized');
};
// 🔥 HÀM RENDER INVOICES THỐNG NHẤT - FIX CONTEXT
window.unifiedRenderInvoices = function(searchTerm = '', containerId = 'invoice-list', context = 'auto') {
    // Tự động detect context nếu không chỉ định
    if (context === 'auto') {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            if (activeTab.id === 'mua-hang') context = 'purchase';
            else if (activeTab.id === 'xu-ly-hoa-don-loi') context = 'error';
            else context = 'general';
        }
    }
    
    // Xác định container ID dựa trên context
    let actualContainerId = containerId;
    if (context === 'purchase') {
        actualContainerId = 'purchase-invoice-list';
    } else if (context === 'error') {
        actualContainerId = 'error-invoice-list'; 
    }
    
    const container = document.getElementById(actualContainerId);
    if (!container) {
        console.warn(`⚠️ Container not found: ${actualContainerId}. Available containers in ${context} context:`, 
            Array.from(document.querySelectorAll('[id*="invoice"], [id*="list"]')).map(el => el.id));
        return;
    }
    
    container.innerHTML = '';
    
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        container.innerHTML = '<tr><td colspan="14" style="text-align: center;">Chưa chọn công ty</td></tr>';
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    // 🔥 FILTER THEO CONTEXT
    if (context === 'error') {
        // Chỉ hiển thị hóa đơn lỗi
        invoices = invoices.filter(invoice => 
            invoice.status?.validation === 'error' && !invoice.status?.stockPosted
        );
    } else if (context === 'purchase') {
        // Tất cả hóa đơn mua hàng (có thể thêm filter sau)
        invoices = invoices; // Giữ nguyên
    }
    
    // Áp dụng search filter
    if (searchTerm) {
        const searchTerms = searchTerm.toLowerCase().split(' ').filter(t => t);
        invoices = invoices.filter(invoice => 
            searchTerms.every(term => 
                invoice.invoiceInfo.symbol?.toLowerCase().includes(term) ||
                invoice.invoiceInfo.number?.toLowerCase().includes(term) ||
                invoice.sellerInfo.taxCode?.toLowerCase().includes(term) ||
                invoice.sellerInfo.name?.toLowerCase().includes(term)
            )
        );
    }
    
    // Sắp xếp: mới nhất trước
    invoices.sort((a, b) => new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date));
    
    if (invoices.length === 0) {
        const noDataMessage = context === 'error' ? 
            '🎉 Không có hóa đơn lỗi nào!' : 
            (searchTerm ? 'Không tìm thấy hóa đơn' : 'Chưa có hóa đơn');
        
        container.innerHTML = `<tr><td colspan="14" style="text-align: center; padding: 20px;">${noDataMessage}</td></tr>`;
        return;
    }
    
    // Render invoices - HTML khác nhau theo context
    invoices.forEach((invoice, index) => {
        const row = document.createElement('tr');
        
        // Xác định trạng thái và action buttons theo context
        let statusBadge = '';
        let rowClass = '';
        let actionButtons = '';
        
        if (invoice.status?.stockPosted) {
            statusBadge = '<span class="badge badge-success">✅ Đã nhập kho</span>';
            rowClass = 'table-success';
            actionButtons = `
                <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
            `;
        } else if (invoice.status?.validation === 'error') {
            statusBadge = '<span class="badge badge-danger">❌ Lỗi chênh lệch</span>';
            rowClass = 'table-danger';
            actionButtons = `
                <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
                <button class="btn-sm btn-warning" onclick="editPurchaseInvoice('${invoice.originalFileId}')">Sửa</button>
                <button class="btn-sm btn-success" onclick="fixInvoiceAndPostStock('${invoice.originalFileId}')">Nhập kho</button>
            `;
        } else {
            statusBadge = '<span class="badge badge-warning">⚠️ Chưa xử lý</span>';
            rowClass = 'table-warning';
            actionButtons = `
                <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
                <button class="btn-sm btn-primary" onclick="createPurchaseReceipt('${invoice.originalFileId}')">Nhập kho</button>
            `;
        }
        
        row.className = rowClass;
        
        // HTML khác nhau theo context
        if (context === 'error') {
            // View tối ưu cho xử lý lỗi
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong></td>
                <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
                <td>${invoice.sellerInfo.name}</td>
                <td><code>${invoice.sellerInfo.taxCode}</code></td>
                <td class="text-right">${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
                <td class="text-right ${invoice.status?.difference > 0 ? 'text-danger' : ''}">
                    ${window.formatCurrency(invoice.status?.difference || 0)}
                </td>
                <td>${statusBadge}</td>
                <td>
                    <div class="button-group-small">
                        ${actionButtons}
                    </div>
                </td>
            `;
        } else {
            // View mặc định
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</td>
                <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
                <td>${invoice.sellerInfo.name}</td>
                <td>${invoice.sellerInfo.taxCode}</td>
                <td class="text-right">${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
                <td class="text-right">${window.formatCurrency(invoice.summary.calculatedTax)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="button-group-small">
                        ${actionButtons}
                    </div>
                </td>
            `;
        }
        
        container.appendChild(row);
    });
    
    console.log(`✅ Rendered ${invoices.length} invoices in ${context} context`);
};

// 🔥 HÀM ĐỂ CÁC MODULE GỌI ĐÚNG CONTEXT
window.renderPurchaseInvoices = function(searchTerm = '') {
    window.unifiedRenderInvoices(searchTerm, 'purchase-invoice-list', 'purchase');
};

window.renderErrorInvoices = function(searchTerm = '') {
    window.unifiedRenderInvoices(searchTerm, 'error-invoice-list', 'error');
};

// 🔥 FIX CÁC HÀM TRONG APP.JS
window.initXuLyHoaDonLoiModule = function() {
    console.log('🔄 Đang khởi tạo module Xử Lý Hóa Đơn Lỗi...');
    
    // Đảm bảo container tồn tại
    const container = document.getElementById('error-invoice-list');
    if (!container) {
        console.error('❌ Container error-invoice-list không tồn tại trong DOM');
        return;
    }
    
    // Gọi render với context đúng
    window.renderErrorInvoices();
    
    console.log('✅ Module Xử Lý Hóa Đơn Lỗi đã khởi tạo');
};