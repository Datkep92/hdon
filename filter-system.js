// =======================
// HỆ THỐNG LỌC DỮ LIỆU THỐNG NHẤT
// =======================

/**
 * Lọc hóa đơn mua hàng (đầu vào) - Kết hợp loadPurchaseInvoices() + filterInvoices()
 * @param {Array} invoices - Danh sách hóa đơn từ hkdData[company].invoices
 * @param {Object} filters - Bộ lọc
 * @returns {Array} Danh sách hóa đơn đã lọc
 */
function filterPurchaseInvoices(invoices, filters = {}) {
    const {
        status = 'all',            // 'all' | 'stocked' | 'notStocked' | 'error'
        dateSort = 'desc',         // 'asc' | 'desc' | 'none'
        supplier = 'all',          // 'all' | taxCode cụ thể
        category = 'all',          // 'all' | 'hang_hoa' | 'chiet_khau' | 'khuyen_mai' | 'dich_vu'
        minAmount = 0,             // Giá trị tối thiểu
        maxAmount = Infinity,      // Giá trị tối đa
        dateRange = null,          // { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
        searchTerm = ''            // Tìm kiếm theo số HĐ, tên SP
    } = filters;

    // Chỉ lọc hóa đơn MUA (có sellerInfo)
    let filtered = invoices.filter(invoice => {
        if (!invoice.sellerInfo || !invoice.sellerInfo.taxCode) return false;
        
        // 1. Filter theo trạng thái nhập kho (kế thừa từ loadPurchaseInvoices)
        if (status !== 'all') {
            if (status === 'stocked' && !invoice.status?.stockPosted) return false;
            if (status === 'notStocked' && invoice.status?.stockPosted) return false;
            if (status === 'error' && invoice.status?.validation !== 'error') return false;
        }

        // 2. Filter theo nhà cung cấp (kế thừa từ filterInvoices)
        if (supplier !== 'all' && invoice.sellerInfo.taxCode !== supplier) {
            return false;
        }

        // 3. Filter theo loại hóa đơn (kế thừa từ filterInvoices)
        if (category !== 'all') {
            const hasCategory = invoice.products.some(product => product.category === category);
            if (!hasCategory) return false;
        }

        // 4. Filter theo giá trị (kế thừa từ cả 2 hàm)
        const total = invoice.summary?.calculatedTotal || 0;
        if (total < minAmount || total > maxAmount) return false;

        // 5. Filter theo khoảng thời gian (kế thừa từ filterInvoices)
        if (dateRange) {
            const invoiceDate = new Date(invoice.invoiceInfo.date);
            const fromDate = new Date(dateRange.from);
            const toDate = new Date(dateRange.to);
            if (invoiceDate < fromDate || invoiceDate > toDate) return false;
        }

        // 6. Filter theo search term (tính năng mới)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const invoiceNumber = `${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`.toLowerCase();
            const supplierName = (invoice.sellerInfo.name || '').toLowerCase();
            const productNames = invoice.products.map(p => p.name.toLowerCase()).join(' ');
            
            const matchesSearch = invoiceNumber.includes(term) || 
                                 supplierName.includes(term) ||
                                 productNames.includes(term);
            if (!matchesSearch) return false;
        }

        return true;
    });

    // Sắp xếp theo ngày (kế thừa từ loadPurchaseInvoices)
    if (dateSort !== 'none') {
        filtered.sort((a, b) => {
            const dateA = new Date(a.invoiceInfo.date);
            const dateB = new Date(b.invoiceInfo.date);
            return dateSort === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }

    // Thêm trường statusDisplay để render UI (kế thừa từ loadPurchaseInvoices)
    filtered.forEach(invoice => {
        invoice.statusDisplay = getStatusDisplay(invoice.status);
    });

    return filtered;
}

/**
 * Lọc và gom nhóm nhà cung cấp - Kết hợp loadPayableList() + filterCustomers()
 * @param {Array} invoices - Danh sách hóa đơn từ hkdData[company].invoices
 * @param {Object} filters - Bộ lọc
 * @returns {Array} Danh sách NCC đã gom nhóm
 */
function filterSuppliers(invoices, filters = {}) {
    const {
        searchTerm = '',           // Tìm kiếm theo tên/MST NCC (kế thừa từ filterCustomers)
        minDebt = 0,               // Lọc NCC có tổng nợ tối thiểu (kế thừa từ cả 2)
        includeInvoices = false,   // Bao gồm danh sách hóa đơn (kế thừa từ filterCustomers)
        status = 'all',            // 'all' | 'hasDebt' | 'noDebt' (kế thừa từ loadPayableList)
        paymentStatus = 'all'      // 'all' | 'partial' | 'full' | 'overdue' (tính năng mới)
    } = filters;

    // Chỉ lấy hóa đơn mua (kế thừa từ loadPayableList)
    const purchaseInvoices = invoices.filter(inv => 
        inv.sellerInfo && inv.sellerInfo.taxCode
    );

    // Gom nhóm theo NCC (kế thừa từ cả 2 hàm)
    const suppliersMap = {};

    purchaseInvoices.forEach(invoice => {
        const supplier = invoice.sellerInfo;
        const supplierKey = supplier.taxCode;

        if (!suppliersMap[supplierKey]) {
            suppliersMap[supplierKey] = {
                // Thông tin NCC (kế thừa từ cả 2)
                name: supplier.name,
                taxCode: supplier.taxCode,
                address: supplier.address || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                
                // Thống kê công nợ (kế thừa từ loadPayableList)
                totalDebt: 0,
                paidAmount: 0,
                remainingDebt: 0,
                invoiceCount: 0,
                
                // Thông tin thống kê (kế thừa từ filterCustomers)
                lastPurchaseDate: invoice.invoiceInfo.date,
                firstPurchaseDate: invoice.invoiceInfo.date,
                
                // Chi tiết hóa đơn (kế thừa từ filterCustomers)
                invoices: includeInvoices ? [] : undefined,
                
                // Trạng thái tính toán (tính năng mới)
                paymentRatio: 0,
                isOverdue: false
            };
        }

        const supplierData = suppliersMap[supplierKey];
        
        // Tính tổng công nợ (kế thừa từ loadPayableList)
        const invoiceAmount = invoice.summary?.calculatedTotal || 0;
        supplierData.totalDebt += invoiceAmount;
        supplierData.invoiceCount++;

        // Cập nhật ngày mua hàng (kế thừa từ filterCustomers)
        const invoiceDate = new Date(invoice.invoiceInfo.date);
        const lastDate = new Date(supplierData.lastPurchaseDate);
        const firstDate = new Date(supplierData.firstPurchaseDate);
        
        if (invoiceDate > lastDate) {
            supplierData.lastPurchaseDate = invoice.invoiceInfo.date;
        }
        if (invoiceDate < firstDate) {
            supplierData.firstPurchaseDate = invoice.invoiceInfo.date;
        }

        // Thêm chi tiết hóa đơn nếu cần (kế thừa từ filterCustomers)
        if (includeInvoices) {
            supplierData.invoices.push({
                id: invoice.originalFileId,
                number: `${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`,
                date: invoice.invoiceInfo.date,
                amount: invoiceAmount,
                status: invoice.status,
                products: invoice.products.length
            });
        }
    });

    // Tính toán công nợ chi tiết (kế thừa từ loadPayableList + cải tiến)
    Object.values(suppliersMap).forEach(supplier => {
        // Giả định thanh toán 30% (có thể thay bằng dữ liệu thực tế)
        supplier.paidAmount = supplier.totalDebt * 0.3;
        supplier.remainingDebt = supplier.totalDebt - supplier.paidAmount;
        supplier.paymentRatio = supplier.totalDebt > 0 ? (supplier.paidAmount / supplier.totalDebt) * 100 : 0;
        
        // Xác định trạng thái quá hạn (tính năng mới)
        const lastPurchaseDate = new Date(supplier.lastPurchaseDate);
        const daysSinceLastPurchase = Math.floor((new Date() - lastPurchaseDate) / (1000 * 60 * 60 * 24));
        supplier.isOverdue = daysSinceLastPurchase > 30 && supplier.remainingDebt > 0;
    });

    let suppliers = Object.values(suppliersMap);

    // Filter theo search term (kế thừa từ filterCustomers)
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        suppliers = suppliers.filter(supplier =>
            supplier.name.toLowerCase().includes(term) ||
            supplier.taxCode.includes(term) ||
            (supplier.address && supplier.address.toLowerCase().includes(term))
        );
    }

    // Filter theo số nợ tối thiểu (kế thừa từ cả 2)
    if (minDebt > 0) {
        suppliers = suppliers.filter(supplier => supplier.totalDebt >= minDebt);
    }

    // Filter theo trạng thái công nợ (kế thừa từ loadPayableList)
    if (status !== 'all') {
        suppliers = suppliers.filter(supplier => {
            if (status === 'hasDebt') return supplier.remainingDebt > 0;
            if (status === 'noDebt') return supplier.remainingDebt <= 0;
            return true;
        });
    }

    // Filter theo trạng thái thanh toán (tính năng mới)
    if (paymentStatus !== 'all') {
        suppliers = suppliers.filter(supplier => {
            switch(paymentStatus) {
                case 'partial': return supplier.paymentRatio > 0 && supplier.paymentRatio < 100;
                case 'full': return supplier.paymentRatio >= 100;
                case 'overdue': return supplier.isOverdue;
                default: return true;
            }
        });
    }

    // Sắp xếp theo tổng nợ giảm dần (kế thừa từ loadPayableList)
    suppliers.sort((a, b) => b.totalDebt - a.totalDebt);

    return suppliers;
}

/**
 * Hàm hỗ trợ - Lấy thông tin hiển thị trạng thái (kế thừa từ loadPurchaseInvoices)
 */
function getStatusDisplay(status) {
    if (!status) {
        return { text: '⚠️ Chưa xử lý', class: 'warning' };
    }
    
    if (status.stockPosted) {
        return { text: '✅ Đã nhập kho', class: 'success' };
    } else if (status.validation === 'error') {
        return { text: '❌ Có lỗi', class: 'error' };
    } else {
        return { text: '⚠️ Chưa xử lý', class: 'warning' };
    }
}

/**
 * Hàm hỗ trợ - Lấy danh sách NCC duy nhất từ hóa đơn
 */
function getUniqueSuppliers(invoices) {
    const suppliersMap = {};
    
    invoices.forEach(invoice => {
        if (invoice.sellerInfo && invoice.sellerInfo.taxCode) {
            const key = invoice.sellerInfo.taxCode;
            if (!suppliersMap[key]) {
                suppliersMap[key] = {
                    taxCode: invoice.sellerInfo.taxCode,
                    name: invoice.sellerInfo.name
                };
            }
        }
    });
    
    return Object.values(suppliersMap);
}

/**
 * Hàm hỗ trợ - Lấy danh sách khách hàng duy nhất từ hóa đơn (cho module bán hàng)
 */
function getUniqueCustomers(invoices) {
    const customersMap = {};
    
    invoices.forEach(invoice => {
        if (invoice.buyerInfo && invoice.buyerInfo.taxCode) {
            const key = invoice.buyerInfo.taxCode;
            if (!customersMap[key]) {
                customersMap[key] = {
                    taxCode: invoice.buyerInfo.taxCode,
                    name: invoice.buyerInfo.name
                };
            }
        }
    });
    
    return Object.values(customersMap);
}

// =======================
// EXPORT FUNCTIONS
// =======================
window.filterPurchaseInvoices = filterPurchaseInvoices;
window.filterSuppliers = filterSuppliers;
window.getUniqueSuppliers = getUniqueSuppliers;
window.getUniqueCustomers = getUniqueCustomers;