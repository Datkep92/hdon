
function initBanHangModule() {
    console.log('🛒 Khởi tạo module bán hàng...');
    
    // Lắng nghe sự kiện tạo đơn bán hàng
    const createSaleButton = document.getElementById('create-sale-order');
    if (createSaleButton) {
        createSaleButton.addEventListener('click', createSaleOrder);
    }

    // Tải danh sách sản phẩm bán
    loadSaleProducts();
    
    // Tải danh sách đơn bán hàng
    loadSaleOrders();
    
    // Tải công nợ phải thu
    loadReceivableList();
    
    // Khởi tạo tính năng mở rộng
    initSaleSearch();
    initMarginCalculator();
    
    // THÊM CÁC HÀM MỚI
    initSaleOrdersFilter();
    
    // Khởi tạo customer manager nếu có
    if (window.customerManager) {
        setTimeout(() => {
            window.customerManager.addCustomerManagementButton();
        }, 1000);
    }
    
    // Đặt giá trị mặc định cho bộ lọc ngày
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('filter-from-date').value = firstDay.toISOString().split('T')[0];
    document.getElementById('filter-to-date').value = today.toISOString().split('T')[0];
}

function initSaleSearch() {
    const searchInput = document.getElementById('sale-product-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // CHỈ LỌC KHI CÓ BẢNG SẢN PHẨM
                const container = document.getElementById('sale-products-container');
                if (container && container.querySelector('table')) {
                    filterSaleProducts(e.target.value);
                }
            }, 300);
        });
        
        // Thêm sự kiện xóa tìm kiếm
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                filterSaleProducts('');
            }
        });
    }
}

function filterSaleProducts(searchTerm) {
    const container = document.getElementById('sale-products-container');
    if (!container) return;

    const rows = container.querySelectorAll('tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        // BỎ QUA CÁC HÀNG KHÔNG PHẢI SẢN PHẨM (thông báo, lỗi, v.v.)
        if (row.id === 'sale-no-results' || 
            row.querySelector('td[colspan]') || 
            !row.querySelector('.sale-product-check')) {
            row.style.display = 'none';
            return;
        }
        
        // KIỂM TRA AN TOÀN TẤT CẢ CÁC PHẦN TỬ
        const mspCell = row.querySelector('td:nth-child(2)');
        const nameCell = row.querySelector('td:nth-child(3)');
        
        if (!mspCell || !nameCell) {
            row.style.display = 'none';
            return;
        }
        
        const msp = mspCell.textContent ? mspCell.textContent.toLowerCase() : '';
        const name = nameCell.textContent ? nameCell.textContent.toLowerCase() : '';
        const searchTermLower = searchTerm ? searchTerm.toLowerCase() : '';
        
        if (msp.includes(searchTermLower) || name.includes(searchTermLower)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Xử lý thông báo không có kết quả
    const tbody = container.querySelector('tbody');
    if (!tbody) return;
    
    let noResults = document.getElementById('sale-no-results');
    
    if (visibleCount === 0 && searchTerm) {
        if (!noResults) {
            noResults = document.createElement('tr');
            noResults.id = 'sale-no-results';
            noResults.innerHTML = `<td colspan="9" style="text-align: center; color: #666; padding: 20px;">Không tìm thấy sản phẩm phù hợp</td>`;
            tbody.appendChild(noResults);
        }
        noResults.style.display = '';
    } else if (noResults) {
        noResults.style.display = 'none';
    }
}

// Tính năng điều chỉnh % lợi nhuận
function initMarginCalculator() {
    const marginInput = document.getElementById('sale-margin');
    if (marginInput) {
        marginInput.addEventListener('change', function() {
            const margin = parseFloat(this.value) || 0;
            if (margin < 0 || margin > 100) {
                alert('Phần trăm lợi nhuận phải từ 0-100%');
                this.value = 20;
                return;
            }
        });
    }
}

function applyMarginToAll() {
    const margin = parseFloat(document.getElementById('sale-margin').value) || 20;
    
    document.querySelectorAll('.sale-product-check').forEach(checkbox => {
        const msp = checkbox.getAttribute('data-msp');
        const costPrice = parseFloat(checkbox.getAttribute('data-cost')) || 0;
        const sellingPrice = costPrice * (1 + margin / 100);
        
        const priceInput = document.querySelector(`.sale-price[data-msp="${msp}"]`);
        priceInput.value = accountingRound(sellingPrice);
        
        // Cập nhật số lượng nếu đã chọn
        if (checkbox.checked) {
            const qtyInput = document.querySelector(`.sale-quantity[data-msp="${msp}"]`);
            if (parseFloat(qtyInput.value) === 0) {
                qtyInput.value = '1';
            }
        }
        
        calculateSaleAmount(msp);
    });
    
    calculateTotalSaleAmount();
    updateSaleSummary();
}

function loadSaleProducts() {
    const container = document.getElementById('sale-products-container');
    if (!container) return;

    // XÓA THÔNG BÁO KHÔNG CÓ KẾT QUẢ NẾU CÓ
    const noResults = document.getElementById('sale-no-results');
    if (noResults) {
        noResults.remove();
    }

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Vui lòng chọn công ty</p>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const availableProducts = Object.values(aggregatedStock).filter(item => 
        item.quantity > 0 && item.category === 'hang_hoa'
    );

    if (availableProducts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px;">📦</div>
                <h4>Không có sản phẩm nào trong kho</h4>
                <p>Vui lòng nhập hàng trước khi bán</p>
            </div>
        `;
        return;
    }

    let html = `
        <div style="max-height: 500px; overflow-y: auto;">
            <table class="table table-striped">
                <thead style="position: sticky; top: 0; background: white;">
                    <tr>
                        <th style="width: 50px;">Chọn</th>
                        <th>MSP</th>
                        <th>Tên SP</th>
                        <th>ĐVT</th>
                        <th style="text-align: right;">Tồn kho</th>
                        <th style="text-align: right;">Giá vốn</th>
                        <th style="text-align: right;">Giá bán</th>
                        <th style="text-align: right;">SL bán</th>
                        <th style="text-align: right;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;

    availableProducts.forEach(product => {
        const sellingPrice = accountingRound(product.avgPrice * 1.2);
        
        html += `
            <tr class="sale-product-row" data-msp="${product.msp}">
                <td>
                    <input type="checkbox" class="sale-product-check" data-msp="${product.msp}" 
                           data-price="${sellingPrice}" data-cost="${product.avgPrice}" data-max="${product.quantity}">
                </td>
                <td><strong>${product.msp}</strong></td>
                <td>${product.name}</td>
                <td>${product.unit}</td>
                <td style="text-align: right;">${product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td style="text-align: right;">${safeFormatCurrency(product.avgPrice)}</td>
                <td style="text-align: right;">
                    <input type="number" class="sale-price form-control-sm" data-msp="${product.msp}" 
                           value="${sellingPrice}" min="${product.avgPrice}" style="width: 100px; text-align: right;">
                </td>
                <td style="text-align: right;">
                    <input type="number" class="sale-quantity form-control-sm" data-msp="${product.msp}" 
                           min="0" max="${product.quantity}" value="0" step="0.01" 
                           style="width: 80px; text-align: right;" 
                           onchange="validateQuantity('${product.msp}')">
                </td>
                <td style="text-align: right; font-weight: bold;" 
                    class="sale-amount" data-msp="${product.msp}">0</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;

    // Reset ô tìm kiếm
    const searchInput = document.getElementById('sale-product-search');
    if (searchInput) {
        searchInput.value = '';
    }

    // Gắn sự kiện tính toán
    attachSaleEventListeners();
    updateSaleSummary();
}

// Cập nhật tổng quan bán hàng
function updateSaleSummary() {
    const selectedCount = document.querySelectorAll('.sale-product-check:checked').length;
    const totalAmount = calculateTotalAmount();
    
    document.getElementById('selected-count').textContent = selectedCount;
    document.getElementById('header-total-amount').textContent = safeFormatCurrency(totalAmount);
    document.getElementById('total-sale-display').textContent = safeFormatCurrency(totalAmount);
}

function calculateTotalAmount() {
    let total = 0;
    document.querySelectorAll('.sale-amount').forEach(cell => {
        const amount = parseFloat(cell.textContent.replace(/[^\d]/g, '')) || 0;
        total += amount;
    });
    return total;
}
// Thêm exports toàn cục
window.selectAllProducts = selectAllProducts;
window.deselectAllProducts = deselectAllProducts;
window.validateQuantity = validateQuantity;
window.calculateTotalSaleAmount = calculateTotalSaleAmount;



function attachSaleEventListeners() {
    document.querySelectorAll('.sale-product-check').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const msp = this.getAttribute('data-msp');
            const qtyInput = document.querySelector(`.sale-quantity[data-msp="${msp}"]`);
            if (this.checked) {
                qtyInput.value = '1';
                qtyInput.focus();
            } else {
                qtyInput.value = '0';
            }
            calculateSaleAmount(msp);
            calculateTotalSaleAmount();
        });
    });

    document.querySelectorAll('.sale-quantity, .sale-price').forEach(input => {
        input.addEventListener('input', function() {
            const msp = this.getAttribute('data-msp');
            calculateSaleAmount(msp);
            calculateTotalSaleAmount();
        });
    });
}

function validateQuantity(msp) {
    const qtyInput = document.querySelector(`.sale-quantity[data-msp="${msp}"]`);
    const maxQty = parseFloat(qtyInput.getAttribute('max')) || 0;
    const currentQty = parseFloat(qtyInput.value) || 0;
    
    if (currentQty > maxQty) {
        alert(`Số lượng không được vượt quá ${maxQty}`);
        qtyInput.value = maxQty;
        calculateSaleAmount(msp);
        calculateTotalSaleAmount();
    }
}

function calculateTotalSaleAmount() {
    let total = 0;
    document.querySelectorAll('.sale-amount').forEach(cell => {
        const amount = parseFloat(cell.textContent.replace(/[^\d]/g, '')) || 0;
        total += amount;
    });
    
    // KIỂM TRA PHẦN TỬ CÓ TỒN TẠI KHÔNG
    const totalSaleElement = document.getElementById('total-sale-amount');
    if (totalSaleElement) {
        totalSaleElement.textContent = safeFormatCurrency(total);
    }
    
    // CẬP NHẬT CẢ HEADER TOTAL NẾU CÓ
    const headerTotalElement = document.getElementById('header-total-amount');
    if (headerTotalElement) {
        headerTotalElement.textContent = safeFormatCurrency(total);
    }
    
    // CẬP NHẬT TOTAL SALE DISPLAY NẾU CÓ
    const totalSaleDisplay = document.getElementById('total-sale-display');
    if (totalSaleDisplay) {
        totalSaleDisplay.textContent = safeFormatCurrency(total);
    }
}

function selectAllProducts() {
    document.querySelectorAll('.sale-product-check').forEach(checkbox => {
        checkbox.checked = true;
        const msp = checkbox.getAttribute('data-msp');
        const qtyInput = document.querySelector(`.sale-quantity[data-msp="${msp}"]`);
        if (qtyInput) {
            qtyInput.value = '1';
            calculateSaleAmount(msp);
        }
    });
    calculateTotalSaleAmount();
    updateSaleSummary(); // ĐẢM BẢO CẬP NHẬT SUMMARY
}

function deselectAllProducts() {
    document.querySelectorAll('.sale-product-check').forEach(checkbox => {
        checkbox.checked = false;
        const msp = checkbox.getAttribute('data-msp');
        const qtyInput = document.querySelector(`.sale-quantity[data-msp="${msp}"]`);
        if (qtyInput) {
            qtyInput.value = '0';
            calculateSaleAmount(msp);
        }
    });
    calculateTotalSaleAmount();
    updateSaleSummary(); // ĐẢM BẢO CẬP NHẬT SUMMARY
}

// THÊM HÀM KIỂM TRA AN TOÀN
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

// CẬP NHẬT HÀM APPLY DISCOUNT ĐẦY ĐỦ
function applyDiscount() {
    const discountType = document.getElementById('discount-type').value;
    const discountValue = parseFloat(document.getElementById('discount-value').value) || 0;
    
    if (discountValue > 0) {
        // Lưu giá gốc trước khi áp dụng chiết khấu
        document.querySelectorAll('.sale-product-check:checked').forEach(checkbox => {
            const msp = checkbox.getAttribute('data-msp');
            const priceInput = document.querySelector(`.sale-price[data-msp="${msp}"]`);
            const originalPrice = parseFloat(priceInput.getAttribute('data-original-price')) || parseFloat(priceInput.value);
            
            // Lưu giá gốc nếu chưa có
            if (!priceInput.getAttribute('data-original-price')) {
                priceInput.setAttribute('data-original-price', originalPrice);
            }
            
            let newPrice = originalPrice;
            if (discountType === 'percent') {
                newPrice = originalPrice * (1 - discountValue / 100);
            } else if (discountType === 'amount') {
                newPrice = originalPrice - discountValue;
            }
            
            priceInput.value = Math.max(newPrice, 0).toFixed(0);
            calculateSaleAmount(msp);
        });
        
        calculateTotalSaleAmount();
        updateSaleSummary();
    }
}

// THÊM HÀM RESET DISCOUNT
function resetDiscount() {
    document.querySelectorAll('.sale-price').forEach(priceInput => {
        const originalPrice = priceInput.getAttribute('data-original-price');
        if (originalPrice) {
            priceInput.value = originalPrice;
            const msp = priceInput.getAttribute('data-msp');
            calculateSaleAmount(msp);
        }
    });
    
    const discountValue = document.getElementById('discount-value');
    const discountNote = document.getElementById('discount-note');
    
    if (discountValue) discountValue.value = '0';
    if (discountNote) discountNote.value = '';
    
    calculateTotalSaleAmount();
    updateSaleSummary();
}
// Thêm vào cuối file
window.applyDiscount = applyDiscount;
window.resetDiscount = resetDiscount;
function calculateSaleAmount(msp) {
    const qtyInput = document.querySelector(`.sale-quantity[data-msp="${msp}"]`);
    const priceInput = document.querySelector(`.sale-price[data-msp="${msp}"]`);
    const amountCell = document.querySelector(`.sale-amount[data-msp="${msp}"]`);
    
    const quantity = parseFloat(qtyInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const amount = quantity * price;
    
    amountCell.textContent = window.formatCurrency(amount);
}

function createSaleOrder() {
    if (!window.currentCompany) {
        alert('Vui lòng chọn công ty trước.');
        return;
    }

    const customer = document.getElementById('sale-customer').value;
    const phone = document.getElementById('sale-phone').value;
    const taxcode = document.getElementById('sale-taxcode').value;
    const address = document.getElementById('sale-address').value;
    const saleDate = document.getElementById('sale-date').value;
    const paymentMethod = document.getElementById('sale-payment-method').value;
    
    // THÊM PHẦN LẤY THÔNG TIN CHIẾT KHẤU
    const discountNote = document.getElementById('discount-note') ? document.getElementById('discount-note').value : '';
    const discountType = document.getElementById('discount-type') ? document.getElementById('discount-type').value : 'percent';
    const discountValue = document.getElementById('discount-value') ? parseFloat(document.getElementById('discount-value').value) || 0 : 0;

    if (!customer || !saleDate) {
        alert('Vui lòng nhập đầy đủ thông tin khách hàng và ngày bán.');
        return;
    }

    // Lấy danh sách sản phẩm được chọn
    const saleProducts = [];
    let totalAmount = 0;
    let totalCost = 0;
    let totalDiscount = 0; // THÊM TÍNH TỔNG CHIẾT KHẤU

    document.querySelectorAll('.sale-product-check:checked').forEach(checkbox => {
        const msp = checkbox.getAttribute('data-msp');
        const qtyInput = document.querySelector(`.sale-quantity[data-msp="${msp}"]`);
        const priceInput = document.querySelector(`.sale-price[data-msp="${msp}"]`);
        
        const quantity = parseFloat(qtyInput.value) || 0;
        const sellingPrice = parseFloat(priceInput.value) || 0;
        const amount = quantity * sellingPrice;

        if (quantity > 0) {
            // Tính giá vốn
            const hkd = window.hkdData[window.currentCompany];
            const aggregatedStock = getAggregatedStock(hkd);
            const product = aggregatedStock[msp];
            const costPrice = product.avgPrice;
            const costAmount = quantity * costPrice;

            // TÍNH CHIẾT KHẤU CHO TỪNG SẢN PHẨM
            let productDiscount = 0;
            let finalPrice = sellingPrice;
            
            if (discountValue > 0) {
                if (discountType === 'percent') {
                    productDiscount = sellingPrice * (discountValue / 100);
                    finalPrice = sellingPrice - productDiscount;
                } else if (discountType === 'amount') {
                    productDiscount = discountValue;
                    finalPrice = Math.max(sellingPrice - discountValue, 0);
                }
                totalDiscount += productDiscount * quantity;
            }

            saleProducts.push({
                msp: msp,
                name: product.name,
                unit: product.unit,
                quantity: quantity,
                price: finalPrice, // GIÁ SAU CHIẾT KHẤU
                originalPrice: sellingPrice, // GIÁ GỐC TRƯỚC CHIẾT KHẤU
                amount: quantity * finalPrice,
                discount: productDiscount,
                costPrice: costPrice,
                costAmount: costAmount
            });

            totalAmount += quantity * finalPrice;
            totalCost += costAmount;
        }
    });

    if (saleProducts.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để bán.');
        return;
    }

    // Tạo đơn bán hàng
    const saleOrder = {
        id: `SO_${Date.now()}`,
        date: saleDate,
        customer: customer,
        paymentMethod: paymentMethod,
        products: saleProducts,
        totalAmount: totalAmount,
        totalCost: totalCost,
        profit: totalAmount - totalCost,
        status: paymentMethod === 'credit' ? 'pending' : 'completed',
        discountNote: discountNote,
        discountType: discountType,
        discountValue: discountValue,
        totalDiscount: totalDiscount,
        createdAt: new Date().toISOString(),
        phone: phone,
        taxcode: taxcode,
        address: address
    };


    // Lưu đơn bán hàng
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.saleOrders) {
        hkd.saleOrders = [];
    }
    hkd.saleOrders.push(saleOrder);

    // Cập nhật tồn kho
    updateStockAfterSale(saleProducts);

    // Tạo hóa đơn đầu ra (nếu cần)
    if (paymentMethod !== 'credit') {
        createSaleInvoice(saleOrder.id);
    }

    // Tạo bút toán kế toán
    createSaleAccountingEntry(saleOrder);

    const successMessage = `
        ✅ ĐÃ TẠO ĐƠN BÁN HÀNG THÀNH CÔNG!
        
        Mã đơn: ${saleOrder.id}
        Khách hàng: ${customer}
        Tổng tiền: ${safeFormatCurrency(totalAmount)}
        Lợi nhuận: ${safeFormatCurrency(saleOrder.profit)}
        Trạng thái: ${paymentMethod === 'credit' ? 'Chờ thanh toán' : 'Đã thanh toán'}
    `;
    
    alert(successMessage);
    
    // SỬA DÒNG NÀY: thay resetSaleForm() bằng safeResetSaleForm()
    safeResetSaleForm();
    
    // Cập nhật giao diện
    loadSaleOrders();
    loadReceivableList();
    if (typeof window.renderStock === 'function') window.renderStock();
    
    // Lưu dữ liệu
    if (typeof window.saveAccountingData === 'function') {
        window.saveAccountingData();
    } else if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

// THÊM HÀM NÀY VÀO FILE banhang.js - đặt gần hàm resetSaleForm

function safeResetSaleForm() {
    // Reset các trường cơ bản - kiểm tra tồn tại trước
    const fields = [
        'sale-customer', 'sale-phone', 'sale-taxcode', 'sale-address',
        'sale-date', 'sale-payment-method'
    ];
    
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            if (fieldId === 'sale-date') {
                element.value = new Date().toISOString().split('T')[0];
            } else if (fieldId === 'sale-payment-method') {
                element.value = 'cash';
            } else {
                element.value = '';
            }
        }
    });
    
    // Reset các trường chiết khấu nếu có - KIỂM TRA TỒN TẠI
    const discountNote = document.getElementById('discount-note');
    const discountType = document.getElementById('discount-type');
    const discountValue = document.getElementById('discount-value');
    
    if (discountNote) discountNote.value = '';
    if (discountType) discountType.value = 'percent';
    if (discountValue) discountValue.value = '0';
    
    // Reset danh sách sản phẩm
    document.querySelectorAll('.sale-product-check').forEach(cb => {
        if (cb) cb.checked = false;
    });
    
    document.querySelectorAll('.sale-quantity').forEach(input => {
        if (input) {
            const msp = input.getAttribute('data-msp');
            const priceInput = input.closest('tr')?.querySelector('.sale-price');
            if (priceInput) {
                const originalPrice = priceInput.getAttribute('data-price') || priceInput.getAttribute('data-original-price') || priceInput.value;
                input.value = '0';
                priceInput.value = originalPrice;
            } else {
                input.value = '0';
            }
        }
    });
    
    document.querySelectorAll('.sale-amount').forEach(td => {
        if (td) td.textContent = '0';
    });
    
    // Cập nhật tổng tiền
    if (typeof calculateTotalSaleAmount === 'function') {
        calculateTotalSaleAmount();
    }
    if (typeof updateSaleSummary === 'function') {
        updateSaleSummary();
    }
}
function resetSaleForm() {
    document.getElementById('sale-customer').value = '';
    document.getElementById('sale-phone').value = '';
    document.getElementById('sale-taxcode').value = '';
    document.getElementById('sale-address').value = '';
    document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('sale-payment-method').value = 'cash';
    
    // RESET CÁC TRƯỜNG CHIẾT KHẤU - LỖI Ở ĐÂY
    const discountNote = document.getElementById('discount-note');
    const discountType = document.getElementById('discount-type');
    const discountValue = document.getElementById('discount-value');
    
    if (discountNote) discountNote.value = '';
    if (discountType) discountType.value = 'percent';
    if (discountValue) discountValue.value = '0';
    
    document.querySelectorAll('.sale-product-check').forEach(cb => cb.checked = false);
    document.querySelectorAll('.sale-quantity').forEach(input => {
        const msp = input.getAttribute('data-msp');
        const originalPrice = input.closest('tr').querySelector('.sale-price').getAttribute('data-price');
        input.value = '0';
        input.closest('tr').querySelector('.sale-price').value = originalPrice;
    });
    document.querySelectorAll('.sale-amount').forEach(td => td.textContent = '0');
    
    // CẬP NHẬT TỔNG TIỀN
    calculateTotalSaleAmount();
    updateSaleSummary();
}

function updateStockAfterSale(saleProducts) {
    const hkd = window.hkdData[window.currentCompany];
    
    saleProducts.forEach(item => {
        let stockItem = hkd.tonkhoMain.find(p => p.msp === item.msp);
        
        if (stockItem) {
            // Trừ số lượng tồn kho
            stockItem.quantity -= item.quantity;
            
            // Đảm bảo số lượng không âm
            if (stockItem.quantity < 0) {
                stockItem.quantity = 0;
            }
            
            // Cập nhật giá trị tồn kho (theo phương pháp bình quân)
            if (stockItem.quantity > 0) {
                stockItem.amount = stockItem.quantity * (stockItem.amount / (stockItem.quantity + item.quantity));
            } else {
                stockItem.amount = 0;
            }
        }
    });
}

function createSaleAccountingEntry(saleOrder) {
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.accountingTransactions) {
        hkd.accountingTransactions = [];
    }

    const transactionId = `SALE_${Date.now()}`;

    // Bút toán bán hàng:
    if (saleOrder.paymentMethod === 'cash') {
        // Nợ 111 - Tiền mặt
        // Có 511 - Doanh thu bán hàng
        // Có 3331 - Thuế GTGT đầu ra
        // Đồng thời: Nợ 632 - Giá vốn hàng bán / Có 156 - Hàng hóa
        
        hkd.accountingTransactions.push({
            id: transactionId,
            date: saleOrder.date,
            type: 'SALE_CASH',
            account: '111',
            debit: saleOrder.totalAmount,
            credit: 0,
            description: `Bán hàng cho ${saleOrder.customer}`,
            reference: saleOrder.id
        });

        hkd.accountingTransactions.push({
            id: transactionId,
            date: saleOrder.date,
            type: 'SALE_CASH',
            account: '511',
            debit: 0,
            credit: saleOrder.totalAmount / 1.1, // Doanh thu chưa thuế
            description: `Doanh thu bán hàng`,
            reference: saleOrder.id
        });

        hkd.accountingTransactions.push({
            id: transactionId,
            date: saleOrder.date,
            type: 'SALE_CASH',
            account: '3331',
            debit: 0,
            credit: saleOrder.totalAmount - (saleOrder.totalAmount / 1.1), // Thuế GTGT
            description: `Thuế GTGT đầu ra`,
            reference: saleOrder.id
        });
    } else if (saleOrder.paymentMethod === 'bank') {
        // Tương tự nhưng tài khoản 112 - Tiền gửi ngân hàng
        hkd.accountingTransactions.push({
            id: transactionId,
            date: saleOrder.date,
            type: 'SALE_BANK',
            account: '112',
            debit: saleOrder.totalAmount,
            credit: 0,
            description: `Bán hàng cho ${saleOrder.customer}`,
            reference: saleOrder.id
        });

        // ... các bút toán doanh thu và thuế tương tự
    } else if (saleOrder.paymentMethod === 'credit') {
        // Nợ 131 - Phải thu khách hàng
        hkd.accountingTransactions.push({
            id: transactionId,
            date: saleOrder.date,
            type: 'SALE_CREDIT',
            account: '131',
            debit: saleOrder.totalAmount,
            credit: 0,
            description: `Bán hàng công nợ cho ${saleOrder.customer}`,
            reference: saleOrder.id
        });

        // ... các bút toán doanh thu và thuế tương tự
    }

    // Bút toán giá vốn
    hkd.accountingTransactions.push({
        id: transactionId + '_COST',
        date: saleOrder.date,
        type: 'COST_OF_SALES',
        account: '632',
        debit: saleOrder.totalCost,
        credit: 0,
        description: `Giá vốn hàng bán cho ${saleOrder.customer}`,
        reference: saleOrder.id
    });

    hkd.accountingTransactions.push({
        id: transactionId + '_COST',
        date: saleOrder.date,
        type: 'COST_OF_SALES',
        account: '156',
        debit: 0,
        credit: saleOrder.totalCost,
        description: `Xuất kho hàng bán`,
        reference: saleOrder.id
    });
}

function loadSaleOrders() {
    const orderList = document.getElementById('sale-orders-list');
    if (!orderList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        orderList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const saleOrders = hkd.saleOrders || [];

    orderList.innerHTML = '';

    if (saleOrders.length === 0) {
        orderList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Chưa có đơn bán hàng</td></tr>';
        return;
    }

    const sortedOrders = [...saleOrders].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        
        let statusBadge = '';
        if (order.status === 'completed') {
            statusBadge = '<span class="badge badge-success">Hoàn thành</span>';
        } else {
            statusBadge = '<span class="badge badge-warning">Chờ thanh toán</span>';
        }

        row.innerHTML = `
            <td>${order.id}</td>
            <td>${safeFormatDate(order.date)}</td>
            <td>${order.customer}</td>
            <td>${order.phone || '-'}</td>
            <td>${safeFormatCurrency(order.totalAmount)}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-sm btn-info" onclick="viewSaleOrderDetail('${order.id}')">Xem</button>
                <button class="btn-sm btn-primary" onclick="createSaleInvoice('${order.id}')">Tạo HĐ</button>
                ${order.status === 'pending' ? `<button class="btn-sm btn-success" onclick="receivePayment('${order.id}')">Thu tiền</button>` : ''}
            </td>
        `;
        
        orderList.appendChild(row);
    });
}

// Thêm exports toàn cục
window.applyMarginToAll = applyMarginToAll;
window.filterSaleProducts = filterSaleProducts;

function loadReceivableList() {
    const receivableList = document.getElementById('receivable-list');
    if (!receivableList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        receivableList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const saleOrders = hkd.saleOrders || [];
    
    // Tính toán công nợ theo khách hàng - THÊM SĐT
    const customerDebt = {};
    
    saleOrders.forEach(order => {
        if (order.status === 'pending') {
            const customerKey = order.customer + (order.phone || '');
            
            if (!customerDebt[customerKey]) {
                customerDebt[customerKey] = {
                    name: order.customer,
                    phone: order.phone || '-',
                    totalDebt: 0,
                    paid: 0,
                    remaining: 0,
                    orders: []
                };
            }
            
            customerDebt[customerKey].totalDebt += order.totalAmount;
            customerDebt[customerKey].orders.push(order);
        }
    });

    receivableList.innerHTML = '';

    if (Object.keys(customerDebt).length === 0) {
        receivableList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Chưa có công nợ phải thu</td></tr>';
        return;
    }

    Object.values(customerDebt).forEach((customer, index) => {
        customer.remaining = customer.totalDebt - customer.paid;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${customer.name}</strong></td>
            <td>${customer.phone}</td>
            <td>${window.formatCurrency(customer.totalDebt)}</td>
            <td>${window.formatCurrency(customer.paid)}</td>
            <td style="font-weight: bold; color: #dc3545;">${window.formatCurrency(customer.remaining)}</td>
            <td>
                <button class="btn-sm btn-primary" onclick="viewCustomerDetail('${customer.name}')">Chi tiết</button>
                <button class="btn-sm btn-success" onclick="receiveCustomerPayment('${customer.name}')">Thu nợ</button>
            </td>
        `;
        
        receivableList.appendChild(row);
    });
}
function initSaleOrdersFilter() {
    // Thêm bộ lọc vào giao diện
    const ordersTable = document.querySelector('#sale-orders-list').closest('table');
    if (ordersTable && !document.getElementById('sale-orders-filter')) {
        const filterHtml = `
            <div id="sale-orders-filter" style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; align-items: end;">
                    <div>
                        <label style="font-size: 12px; color: #666;">Từ ngày</label>
                        <input type="date" id="filter-from-date" class="form-control">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #666;">Đến ngày</label>
                        <input type="date" id="filter-to-date" class="form-control">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #666;">Khách hàng</label>
                        <input type="text" id="filter-customer" class="form-control" placeholder="Tên khách hàng">
                    </div>
                    <div>
                        <button class="btn-sm btn-primary" onclick="applySaleOrdersFilter()">🔍 Lọc</button>
                        <button class="btn-sm btn-secondary" onclick="resetSaleOrdersFilter()">🔄 Reset</button>
                    </div>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <select id="filter-status" class="form-control" style="width: 150px;" onchange="applySaleOrdersFilter()">
                        <option value="">Tất cả trạng thái</option>
                        <option value="completed">Đã thanh toán</option>
                        <option value="pending">Chờ thanh toán</option>
                    </select>
                    <select id="filter-payment" class="form-control" style="width: 150px;" onchange="applySaleOrdersFilter()">
                        <option value="">Tất cả PT thanh toán</option>
                        <option value="cash">Tiền mặt</option>
                        <option value="bank">Chuyển khoản</option>
                        <option value="credit">Công nợ</option>
                    </select>
                </div>
            </div>
        `;
        
        ordersTable.parentNode.insertBefore(createElementFromHTML(filterHtml), ordersTable);
    }
}

function createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

function applySaleOrdersFilter() {
    const fromDate = document.getElementById('filter-from-date').value;
    const toDate = document.getElementById('filter-to-date').value;
    const customer = document.getElementById('filter-customer').value.toLowerCase();
    const status = document.getElementById('filter-status').value;
    const payment = document.getElementById('filter-payment').value;

    const rows = document.querySelectorAll('#sale-orders-list tr');
    let visibleCount = 0;

    rows.forEach(row => {
        if (row.cells.length < 7) return; // Skip header/empty rows

        const orderDate = row.cells[1].textContent;
        const orderCustomer = row.cells[2].textContent.toLowerCase();
        const orderStatus = row.cells[5].textContent.includes('Hoàn thành') ? 'completed' : 'pending';
        const orderPayment = getPaymentMethodFromRow(row);

        let showRow = true;

        // Lọc theo ngày
        if (fromDate && orderDate < fromDate) showRow = false;
        if (toDate && orderDate > toDate) showRow = false;
        
        // Lọc theo khách hàng
        if (customer && !orderCustomer.includes(customer)) showRow = false;
        
        // Lọc theo trạng thái
        if (status && orderStatus !== status) showRow = false;
        
        // Lọc theo phương thức thanh toán
        if (payment && orderPayment !== payment) showRow = false;

        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    });

    // Hiển thị số kết quả
    const filterSection = document.getElementById('sale-orders-filter');
    let resultCount = filterSection.querySelector('.result-count');
    if (!resultCount) {
        resultCount = document.createElement('div');
        resultCount.className = 'result-count';
        resultCount.style.marginTop = '10px';
        filterSection.appendChild(resultCount);
    }
    resultCount.innerHTML = `<small style="color: #666;">Tìm thấy ${visibleCount} đơn hàng</small>`;
}

function getPaymentMethodFromRow(row) {
    // Dựa vào nội dung để xác định phương thức thanh toán
    const statusCell = row.cells[5].textContent;
    if (statusCell.includes('Chờ thanh toán')) return 'credit';
    
    // Có thể cần lưu thêm thông tin payment method trong đơn hàng
    return 'cash'; // Mặc định
}

function resetSaleOrdersFilter() {
    document.getElementById('filter-from-date').value = '';
    document.getElementById('filter-to-date').value = '';
    document.getElementById('filter-customer').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-payment').value = '';
    
    const rows = document.querySelectorAll('#sale-orders-list tr');
    rows.forEach(row => row.style.display = '');
    
    const resultCount = document.querySelector('.result-count');
    if (resultCount) resultCount.remove();
}
// Thêm vào cuối file banhang.js
function viewCustomerDetail(customerName) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const customerOrders = (hkd.saleOrders || []).filter(order => 
        order.customer === customerName && order.status === 'pending'
    );

    let detailHtml = `
        <div class="card">
            <div class="card-header">Chi Tiết Công Nợ - ${customerName}</div>
            <div class="card-body">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Ngày</th>
                            <th>Số tiền</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if (customerOrders.length === 0) {
        detailHtml += `<tr><td colspan="5" style="text-align: center;">Không có đơn hàng công nợ</td></tr>`;
    } else {
        customerOrders.forEach(order => {
            detailHtml += `
                <tr>
                    <td>${order.id}</td>
                    <td>${safeFormatDate(order.date)}</td>
                    <td>${safeFormatCurrency(order.totalAmount)}</td>
                    <td><span class="badge badge-warning">Chờ thanh toán</span></td>
                    <td>
                        <button class="btn-sm btn-success" onclick="receivePayment('${order.id}')">Thu tiền</button>
                        <button class="btn-sm btn-info" onclick="viewSaleOrderDetail('${order.id}')">Xem</button>
                    </td>
                </tr>
            `;
        });
    }
    
    detailHtml += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    window.showModal(`Chi Tiết Công Nợ - ${customerName}`, detailHtml);
}

function receiveCustomerPayment(customerName) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const customerOrders = (hkd.saleOrders || []).filter(order => 
        order.customer === customerName && order.status === 'pending'
    );
    
    const totalDebt = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const modalContent = `
        <div class="form-grid">
            <div class="form-group">
                <label for="customer-receive-date">Ngày thu tiền</label>
                <input type="date" id="customer-receive-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="customer-receive-amount">Số tiền</label>
                <input type="number" id="customer-receive-amount" class="form-control" 
                       value="${totalDebt}" placeholder="Nhập số tiền thu">
            </div>
            <div class="form-group">
                <label for="customer-receive-method">Phương thức</label>
                <select id="customer-receive-method" class="form-control">
                    <option value="cash">Tiền mặt</option>
                    <option value="bank">Chuyển khoản</option>
                </select>
            </div>
            <div class="form-group">
                <label for="customer-receive-description">Nội dung</label>
                <input type="text" id="customer-receive-description" class="form-control" 
                       value="Thu tiền công nợ khách hàng ${customerName}">
            </div>
        </div>
        <div style="margin: 15px 0; padding: 10px; background: #e9ecef; border-radius: 4px;">
            <strong>Tổng công nợ:</strong> ${safeFormatCurrency(totalDebt)}
        </div>
        <div style="text-align: right;">
            <button class="btn-success" onclick="processCustomerReceivePayment('${customerName}')">Xác Nhận Thu Tiền</button>
            <button class="btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Hủy</button>
        </div>
    `;

    window.showModal(`Thu Tiền Công Nợ - ${customerName}`, modalContent);
}

function processCustomerReceivePayment(customerName) {
    const receiveDate = document.getElementById('customer-receive-date').value;
    const amount = parseFloat(document.getElementById('customer-receive-amount').value) || 0;
    const method = document.getElementById('customer-receive-method').value;
    const description = document.getElementById('customer-receive-description').value;

    if (!receiveDate || amount <= 0) {
        alert('Vui lòng nhập đầy đủ thông tin thu tiền.');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const customerOrders = (hkd.saleOrders || []).filter(order => 
        order.customer === customerName && order.status === 'pending'
    );

    if (customerOrders.length === 0) {
        alert('Không tìm thấy công nợ cho khách hàng này');
        return;
    }

    // Cập nhật trạng thái các đơn hàng
    let remainingAmount = amount;
    customerOrders.forEach(order => {
        if (remainingAmount >= order.totalAmount) {
            order.status = 'completed';
            remainingAmount -= order.totalAmount;
            
            // Tạo bút toán thu tiền cho từng đơn
            createReceivePaymentAccountingEntry(order, receiveDate, order.totalAmount, method, 
                                              `Thu tiền đơn ${order.id} - ${description}`);
        }
    });

    alert(`✅ Đã thu tiền ${safeFormatCurrency(amount)} từ khách hàng ${customerName}`);
    document.getElementById('custom-modal').style.display = 'none';
    
    // Cập nhật giao diện
    loadSaleOrders();
    loadReceivableList();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

// Thêm exports toàn cục
window.viewCustomerDetail = viewCustomerDetail;
window.receiveCustomerPayment = receiveCustomerPayment;
window.processCustomerReceivePayment = processCustomerReceivePayment;
function viewSaleOrderDetail(orderId) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const order = hkd.saleOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Không tìm thấy đơn hàng');
        return;
    }

    let detailHtml = `
        <div class="card">
            <div class="card-header">Thông Tin Đơn Hàng</div>
            <p><strong>Mã đơn:</strong> ${order.id}</p>
            <p><strong>Ngày bán:</strong> ${window.formatDate(order.date)}</p>
            <p><strong>Khách hàng:</strong> ${order.customer}</p>
            <p><strong>Phương thức TT:</strong> ${order.paymentMethod}</p>
            <p><strong>Trạng thái:</strong> ${order.status === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}</p>
        </div>
        
        <div class="card">
            <div class="card-header">Chi Tiết Sản Phẩm</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>MSP</th>
                        <th>Tên SP</th>
                        <th>ĐVT</th>
                        <th>SL</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    order.products.forEach(product => {
        detailHtml += `
            <tr>
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
                <tfoot>
                    <tr style="font-weight: bold;">
                        <td colspan="5">Tổng cộng</td>
                        <td>${window.formatCurrency(order.totalAmount)}</td>
                    </tr>
                    <tr>
                        <td colspan="5">Giá vốn</td>
                        <td>${window.formatCurrency(order.totalCost)}</td>
                    </tr>
                    <tr>
                        <td colspan="5">Lợi nhuận</td>
                        <td>${window.formatCurrency(order.profit)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-primary" onclick="printSaleOrder('${orderId}')">In Đơn Hàng</button>
            ${!order.invoiceId ? `<button class="btn-success" onclick="createSaleInvoice('${orderId}')">Tạo Hóa Đơn</button>` : ''}
            ${order.status === 'pending' ? `<button class="btn-warning" onclick="receivePayment('${orderId}')">Xác Nhận Thanh Toán</button>` : ''}
        </div>
    `;
    
    window.showModal(`Chi Tiết Đơn Hàng - ${order.id}`, detailHtml);
}

function createSaleInvoice(orderId) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const order = hkd.saleOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Không tìm thấy đơn hàng');
        return;
    }

    if (order.invoiceId) {
        alert('Đơn hàng này đã có hóa đơn.');
        return;
    }

    // Tạo hóa đơn đầu ra
    const invoice = {
        id: `HD_OUT_${Date.now()}`,
        orderId: orderId,
        date: new Date().toISOString().split('T')[0],
        customer: order.customer,
        products: order.products,
        totalAmount: order.totalAmount,
        taxAmount: order.totalAmount - (order.totalAmount / 1.1),
        status: 'issued'
    };

    // Lưu hóa đơn
    if (!hkd.saleInvoices) {
        hkd.saleInvoices = [];
    }
    hkd.saleInvoices.push(invoice);

    // Cập nhật đơn hàng
    order.invoiceId = invoice.id;
    order.status = 'completed';

    alert(`Đã tạo hóa đơn ${invoice.id} thành công!`);
    
    // Cập nhật giao diện
    loadSaleOrders();
    loadReceivableList();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function receivePayment(orderId) {
    const modalContent = `
        <div class="form-grid">
            <div class="form-group">
                <label for="receive-date">Ngày thu tiền</label>
                <input type="date" id="receive-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="receive-amount">Số tiền</label>
                <input type="number" id="receive-amount" class="form-control" placeholder="Nhập số tiền thu">
            </div>
            <div class="form-group">
                <label for="receive-method">Phương thức</label>
                <select id="receive-method" class="form-control">
                    <option value="cash">Tiền mặt</option>
                    <option value="bank">Chuyển khoản</option>
                </select>
            </div>
            <div class="form-group">
                <label for="receive-description">Nội dung</label>
                <input type="text" id="receive-description" class="form-control" placeholder="Nội dung thu tiền">
            </div>
        </div>
        <div style="text-align: right; margin-top: 20px;">
            <button id="confirm-receive" class="btn-success">Xác Nhận Thu Tiền</button>
            <button class="btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Hủy</button>
        </div>
    `;

    window.showModal('Thu Tiền Bán Hàng', modalContent);

    document.getElementById('confirm-receive').addEventListener('click', function() {
        processReceivePayment(orderId);
    });
}

function processReceivePayment(orderId) {
    const receiveDate = document.getElementById('receive-date').value;
    const amount = parseFloat(document.getElementById('receive-amount').value) || 0;
    const method = document.getElementById('receive-method').value;
    const description = document.getElementById('receive-description').value;

    if (!receiveDate || amount <= 0) {
        alert('Vui lòng nhập đầy đủ thông tin thu tiền.');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const order = hkd.saleOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Không tìm thấy đơn hàng');
        return;
    }

    // Cập nhật trạng thái đơn hàng
    order.status = 'completed';

    // Tạo bút toán thu tiền
    createReceivePaymentAccountingEntry(order, receiveDate, amount, method, description);

    alert(`Đã xác nhận thu tiền ${window.formatCurrency(amount)} thành công!`);
    document.getElementById('custom-modal').style.display = 'none';
    
    // Cập nhật giao diện
    loadSaleOrders();
    loadReceivableList();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function createReceivePaymentAccountingEntry(order, date, amount, method, description) {
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.accountingTransactions) {
        hkd.accountingTransactions = [];
    }

    const transactionId = `RECEIVE_${Date.now()}`;
    const accountDebit = method === 'cash' ? '111' : '112';
    const accountCredit = '131';

    hkd.accountingTransactions.push({
        id: transactionId,
        date: date,
        type: 'RECEIVE',
        account: accountDebit,
        debit: amount,
        credit: 0,
        description: description || `Thu tiền bán hàng từ ${order.customer}`,
        reference: order.id
    });

    hkd.accountingTransactions.push({
        id: transactionId,
        date: date,
        type: 'RECEIVE',
        account: accountCredit,
        debit: 0,
        credit: amount,
        description: description || `Giảm công nợ khách hàng ${order.customer}`,
        reference: order.id
    });
}

// Hàm in ấn
function printSaleOrders() {
    alert('Chức năng in đơn hàng đang được phát triển');
}

function printSaleInvoices() {
    alert('Chức năng in hóa đơn đầu ra đang được phát triển');
}

function printSaleReport() {
    alert('Chức năng in báo cáo doanh thu đang được phát triển');
}
// Thêm các hàm tiện ích còn thiếu
function safeFormatCurrency(amount) {
    if (typeof window.formatCurrency === 'function') {
        return window.formatCurrency(amount || 0);
    }
    return (amount || 0).toLocaleString('vi-VN');
}

function safeFormatDate(dateStr) {
    if (typeof window.formatDate === 'function') {
        return window.formatDate(dateStr);
    }
    
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
    } catch {
        return 'N/A';
    }
}

function accountingRound(amount) {
    return window.accountingRound ? window.accountingRound(amount) : Math.round(amount);
}
// Exports toàn cục
window.initBanHangModule = initBanHangModule;
window.loadSaleProducts = loadSaleProducts;
window.createSaleOrder = createSaleOrder;
window.viewSaleOrderDetail = viewSaleOrderDetail;
window.createSaleInvoice = createSaleInvoice;
window.receivePayment = receivePayment;