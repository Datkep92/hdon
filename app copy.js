// =======================================================
// KHỞI TẠO DỮ LIỆU VÀ BIẾN TOÀN CỤC
// =======================================================
window.hkdData = {}; // Dữ liệu toàn bộ các công ty (MST -> {name, invoices, tonkhoMain, exports})
window.currentCompany = null; // MST của công ty đang được chọn

const STORAGE_KEY = 'hkd_manager_data';

// =======================================================
// CÁC HÀM TIỆN ÍCH CHUNG
// =======================================================

/**
 * Định dạng tiền tệ VND
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0';
    return accountingRound(amount).toLocaleString('vi-VN');
}
window.formatCurrency = formatCurrency;

/**
 * Định dạng ngày tháng
 */
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    } catch {
        return dateString;
    }
}
window.formatDate = formatDate;

/**
 * Làm tròn kế toán
 */
function accountingRound(amount) {
    return Math.round(amount);
}
window.accountingRound = accountingRound;

/**
 * Hiển thị Modal tùy chỉnh
 */
function showModal(title, content) {
    // ... (giữ nguyên hàm showModal từ file app.js cũ)
}

// =======================================================
// QUẢN LÝ DỮ LIỆU (localStorage)
// =======================================================

function loadData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            window.hkdData = JSON.parse(savedData);
            console.log('Dữ liệu đã được tải từ LocalStorage.');
        }
    } catch (e) {
        console.error('Lỗi khi tải dữ liệu từ LocalStorage:', e);
        window.hkdData = {};
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.hkdData));
        console.log('Dữ liệu đã được lưu vào LocalStorage.');
    } catch (e) {
        console.error('Lỗi khi lưu dữ liệu vào LocalStorage:', e);
    }
}

// =======================================================
// QUẢN LÝ CÔNG TY VÀ GIAO DIỆN CHÍNH
// =======================================================

function renderCompanyList() {
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
            selectCompany(taxCode);
        });

        companyList.appendChild(companyItem);
    });
    
    console.log(`✅ Đã render ${companies.length} công ty`);
}

function selectCompany(taxCode) {
    if (window.currentCompany === taxCode) return;
    
    window.currentCompany = taxCode;
    saveData();

    // Cập nhật giao diện sidebar và header
    renderCompanyList();
    const companyName = window.hkdData[taxCode].name || taxCode;
    document.getElementById('current-company').textContent = `Đang chọn: ${companyName} (MST: ${taxCode})`;
    
    // Cập nhật tên công ty trên các tab
    const companyNameElements = [
        'company-name-so-du', 'company-name-mua-hang', 'company-name-kho-hang',
        'company-name-ban-hang', 'company-name-tien-cong-no', 
        'company-name-thue-bao-cao', 'company-name-so-sach'
    ];
    
    companyNameElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = companyName;
        }
    });

    // Kích hoạt các module
    const currentTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab') || 'so-du-dau-ky';
    showTab(currentTab);

    // Cập nhật dữ liệu cho các tab
    if (typeof window.loadOpeningBalance === 'function') window.loadOpeningBalance();
    if (typeof window.loadPurchaseInvoices === 'function') window.loadPurchaseInvoices();
    if (typeof window.loadProductCatalog === 'function') window.loadProductCatalog();
    if (typeof window.loadSaleOrders === 'function') window.loadSaleOrders();
    if (typeof window.loadCashBook === 'function') window.loadCashBook();
    if (typeof window.loadVATSummary === 'function') window.loadVATSummary();
    
    console.log(`Đã chọn công ty: ${taxCode}`);
}

function showTab(tabName) {
    // Ẩn tất cả nội dung tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Bỏ active của tất cả nút tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Hiển thị nội dung tab và đánh dấu nút tab
    const tabContent = document.getElementById(tabName);
    const navTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);

    if (tabContent && navTab) {
        tabContent.classList.add('active');
        navTab.classList.add('active');
        
        // Khởi tạo module tương ứng khi chuyển tab
        setTimeout(() => {
            switch(tabName) {
                case 'so-du-dau-ky':
                    if (typeof window.initSoDuDauKyModule === 'function') window.initSoDuDauKyModule();
                    break;
                case 'mua-hang':
                    if (typeof window.initMuaHangModule === 'function') window.initMuaHangModule();
                    break;
                case 'kho-hang':
                    if (typeof window.initKhoHangModule === 'function') window.initKhoHangModule();
                    break;
                case 'ban-hang':
                    if (typeof window.initBanHangModule === 'function') window.initBanHangModule();
                    break;
                case 'tien-cong-no':
                    if (typeof window.initTienCongNoModule === 'function') window.initTienCongNoModule();
                    break;
                case 'thue-bao-cao':
                    if (typeof window.initThueBaoCaoModule === 'function') window.initThueBaoCaoModule();
                    break;
                case 'so-sach':
                    if (typeof window.initSoSachModule === 'function') window.initSoSachModule();
                    break;
            }
        }, 100);
    }
}

function setupTabSwitching() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });
}

// =======================================================
// KHỞI TẠO ỨNG DỤNG
// =======================================================

// =======================================================
// SỬA PHẦN KHỞI TẠO ỨNG DỤNG
// =======================================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. Tải dữ liệu từ LocalStorage
    loadData();
    
    // 2. Thiết lập chuyển đổi tab
    setupTabSwitching();

    // 3. Hiển thị danh sách công ty
    renderCompanyList();

    // 4. Kiểm tra nếu có công ty đang được chọn
    if (window.currentCompany && window.hkdData[window.currentCompany]) {
        selectCompany(window.currentCompany);
    } else {
        // Hiển thị tab đầu tiên
        const firstTab = document.querySelector('.nav-tab');
        if (firstTab) {
            const tabName = firstTab.getAttribute('data-tab');
            showTab(tabName);
        }
    }

    // 5. Gắn sự kiện cho nút "Xóa hết dữ liệu" - SỬA LỖI Ở ĐÂY
    const clearDataButton = document.getElementById('clear-all-data');
    if (clearDataButton) {
        clearDataButton.addEventListener('click', function() {
            showClearDataConfirmation();
        });
    } else {
        console.warn('⚠️ Không tìm thấy nút "Xóa hết dữ liệu"');
    }

    console.log('Ứng dụng đã khởi động hoàn tất.');
});

// =======================
// HÀM HIỂN THỊ XÁC NHẬN XÓA DỮ LIỆU
// =======================
function showClearDataConfirmation() {
    const companyCount = Object.keys(window.hkdData).length;
    let invoiceCount = 0;
    let stockCount = 0;
    
    // Đếm tổng số hóa đơn và sản phẩm tồn kho
    Object.values(window.hkdData).forEach(company => {
        invoiceCount += company.invoices ? company.invoices.length : 0;
        stockCount += company.tonkhoMain ? company.tonkhoMain.length : 0;
    });

    const confirmMessage = `
        <div class="clear-data-warning">
            <div class="warning-header">
                <span style="color: #dc3545; font-size: 24px;">⚠️</span>
                <h4 style="color: #dc3545; margin: 0;">CẢNH BÁO: XÓA TOÀN BỘ DỮ LIỆU</h4>
            </div>
            
            <div class="data-stats" style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Dữ liệu sẽ bị xóa:</strong></p>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>🏢 Số công ty: <strong>${companyCount}</strong></li>
                    <li>🧾 Số hóa đơn: <strong>${invoiceCount}</strong></li>
                    <li>📦 Sản phẩm tồn kho: <strong>${stockCount}</strong></li>
                    <li>💰 Dữ liệu kế toán: <strong>Tất cả</strong></li>
                </ul>
            </div>
            
            <p style="color: #856404;"><strong>Thao tác này KHÔNG THỂ HOÀN TÁC!</strong></p>
            <p>Tất cả dữ liệu sẽ bị xóa vĩnh viễn khỏi trình duyệt.</p>
            
            <div class="confirmation-check" style="margin: 15px 0;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="confirm-delete-checkbox" style="margin-right: 8px;">
                    <span>Tôi hiểu và chắc chắn muốn xóa toàn bộ dữ liệu</span>
                </label>
            </div>
        </div>
        
        <div style="text-align: right; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
            <button id="confirm-clear" class="btn-danger" style="margin-right: 10px;" disabled>
                🗑️ XÓA NGAY
            </button>
            <button id="cancel-clear" class="btn-secondary">❌ Hủy</button>
        </div>
    `;
    
    window.showModal('XÁC NHẬN XÓA DỮ LIỆU', confirmMessage);
    
    // Kích hoạt nút xóa khi tích checkbox
    const checkbox = document.getElementById('confirm-delete-checkbox');
    const confirmButton = document.getElementById('confirm-clear');
    
    checkbox.addEventListener('change', function() {
        confirmButton.disabled = !this.checked;
    });
    
    // Xử lý xác nhận xóa
    document.getElementById('confirm-clear').addEventListener('click', function() {
        clearAllData();
    });

    // Xử lý hủy
    document.getElementById('cancel-clear').addEventListener('click', function() {
        document.getElementById('custom-modal').remove();
    });
}

// =======================
// HÀM XÓA TOÀN BỘ DỮ LIỆU
// =======================
function clearAllData() {
    try {
        // 1. Xóa khỏi LocalStorage
        localStorage.removeItem(STORAGE_KEY);
        
        // 2. Xóa dữ liệu trong memory
        window.hkdData = {};
        window.currentCompany = null;
        
        // 3. Xóa dữ liệu import (nếu có)
        if (window.importData) {
            window.importData = {
                pendingInvoices: [],
                errorInvoices: [], 
                processedInvoices: [],
                statistics: { totalProcessed: 0, validCount: 0, errorCount: 0 }
            };
        }
        
        // 4. Đóng modal
        const modal = document.getElementById('custom-modal');
        if (modal) modal.remove();
        
        // 5. Hiển thị thông báo thành công
        setTimeout(() => {
            alert('✅ Đã xóa toàn bộ dữ liệu thành công!');
            
            // 6. Reload trang để làm mới giao diện
            window.location.reload();
        }, 100);
        
    } catch (error) {
        console.error('❌ Lỗi khi xóa dữ liệu:', error);
        alert('❌ Có lỗi xảy ra khi xóa dữ liệu. Vui lòng thử lại.');
    }
}

// =======================
// THÊM HÀM KIỂM TRA DỮ LIỆU (Debug)
// =======================
function debugDataStatus() {
    console.log('🔍 DEBUG DỮ LIỆU:');
    console.log('- window.hkdData:', window.hkdData);
    console.log('- window.currentCompany:', window.currentCompany);
    console.log('- LocalStorage data:', localStorage.getItem(STORAGE_KEY));
    
    const companyCount = Object.keys(window.hkdData).length;
    let totalInvoices = 0;
    let totalStock = 0;
    
    Object.values(window.hkdData).forEach(company => {
        totalInvoices += company.invoices ? company.invoices.length : 0;
        totalStock += company.tonkhoMain ? company.tonkhoMain.length : 0;
    });
    
    console.log(`📊 Thống kê: ${companyCount} công ty, ${totalInvoices} hóa đơn, ${totalStock} sản phẩm tồn kho`);
}

// Gọi hàm debug để kiểm tra
// debugDataStatus();