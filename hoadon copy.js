
window.loadMoreInvoices = loadMoreInvoices; // Xuất toàn cục

function updateStockWithEditedInvoice(taxCode, invoice, useCustomMSP) {
    ensureHkdData(taxCode);
    const hkd = hkdData[taxCode];
    
    invoice.products.forEach(item => {
        if (item.category !== 'hang_hoa') return;
        
        // Sử dụng MSP từ hóa đơn đã chỉnh sửa
        const msp = item.msp;
        
        // Tìm sản phẩm trong tồn kho
        let stockItem = hkd.tonkhoMain.find(p => p.msp === msp);
        
        if (stockItem && !useCustomMSP) {
            // Cộng dồn vào MSP hiện có
            stockItem.quantity += parseFloat(item.quantity);
            stockItem.amount = accountingRound(stockItem.amount + item.amount);
            console.log(`✅ Cộng dồn tồn kho: ${item.name} (${msp}) - SL: +${item.quantity}`);
        } else {
            // Thêm mới với MSP (có thể là MSP mới hoặc MSP hiện có nhưng chưa tồn tại)
            hkd.tonkhoMain.push({
                msp: msp,
                code: msp,
                name: item.name,
                unit: item.unit,
                quantity: parseFloat(item.quantity),
                amount: item.amount
            });
            console.log(`✅ Thêm mới tồn kho: ${item.name} (${msp}) - SL: ${item.quantity}`);
        }
    });
    
    console.log(`📊 Tồn kho sau cập nhật:`, hkd.tonkhoMain);
}
function showFileResults(results) {
    const resultsList = document.getElementById('file-results-list');
    resultsList.innerHTML = '';
    
    const resultsCard = document.getElementById('file-results-card');
    if (results.length > 0) {
        resultsCard.classList.remove('hidden');
    } else {
        resultsCard.classList.add('hidden');
        return;
    }

    results.forEach(result => {
        const row = document.createElement('tr');
        let statusClass = '';
        if (result.status === 'success') {
            statusClass = 'text-success';
        } else if (result.status === 'duplicate') {
            statusClass = 'text-warning';
        } else {
            statusClass = 'text-danger';
        }
        
        row.innerHTML = `
            <td>${result.file}</td>
            <td class="${statusClass}">${result.status === 'success' ? '✅ Thành công' : result.status === 'duplicate' ? '⚠️ Trùng' : '❌ Lỗi'}</td>
            <td>${result.message}</td>
        `;
        resultsList.appendChild(row);
    });
}

function initInvoiceModule() {
    // ------------------------------------
    // 1. Logic cho tab Trích Xuất HĐ
    // ------------------------------------
    const processButton = document.getElementById('process-files');
    if (processButton) {
        processButton.addEventListener('click', async function() {
            const fileInput = document.getElementById('zip-file-input');
            const files = fileInput.files;
            
            if (files.length === 0) {
                alert('Vui lòng chọn file ZIP hoặc XML.');
                return;
            }

            // Reset UI
            updateFileStats(files.length, 0, 0, 0);
            document.getElementById('file-results-list').innerHTML = '';
            
            // Xử lý file (sử dụng hàm từ zip-trichxuat.js)
            await window.handleZipFiles(files); 
            
            // Cập nhật giao diện sau khi xử lý
            window.renderCompanyList(); 
            const companies = Object.keys(window.hkdData);
            
            // Nếu chưa chọn công ty và có dữ liệu mới, chọn công ty đầu tiên
            if (companies.length > 0 && !window.currentCompany) {
                window.selectCompany(companies[0]);
            }
            
            // Cập nhật thống kê
            if (window.currentCompany) {
                renderInvoices();
                updateInvoiceStats();
                if (typeof window.updateAccountingStats === 'function') {
                    window.updateAccountingStats();
                }
            }
        });
    }
    const searchInput = document.getElementById('search-invoice');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderInvoices(e.target.value);
        });
    }
}

function fixInvoiceAndPostStock(invoiceId) {
    if (!window.currentCompany) {
        alert('Vui lòng chọn công ty.');
        return;
    }
    
    const hkd = hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('Không tìm thấy hóa đơn.');
        return;
    }
    
    // Kiểm tra nếu đã chuyển kho rồi
    if (invoice.status.stockPosted) {
        alert('Hóa đơn này đã được chuyển tồn kho trước đó.');
        return;
    }
    
    // Hiển thị modal xác nhận
    const confirmMessage = `
        <div class="card">
            <div class="card-header">Xác Nhận Nhập Tồn Kho</div>
            <p><strong>Hóa đơn:</strong> ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</p>
            <p><strong>Chênh lệch:</strong> ${formatCurrency(invoice.status.difference)}</p>
            <p><strong>Tổng tính toán:</strong> ${formatCurrency(invoice.status.calculatedTotal)}</p>
            <p><strong>Tổng từ XML:</strong> ${formatCurrency(invoice.status.xmlTotal)}</p>
            <p class="text-warning"><strong>⚠️ Cảnh báo:</strong> Hóa đơn có chênh lệch. Bạn có chắc chắn muốn nhập tồn kho?</p>
        </div>
    `;
    
    window.showModal('Xác Nhận Nhập Tồn Kho', `
        ${confirmMessage}
        <div style="text-align: right; margin-top: 20px;">
            <button id="confirm-post-stock" class="btn-success" style="margin-right: 10px;">Đồng Ý Nhập Kho</button>
            <button id="cancel-post-stock" class="btn-secondary">Hủy</button>
        </div>
    `);
    
    document.getElementById('confirm-post-stock').addEventListener('click', function() {
        // Thực hiện chuyển tồn kho
        updateStock(window.currentCompany, invoice);
        invoice.status.stockPosted = true;
        invoice.status.validation = 'manual_fixed'; // Đánh dấu đã sửa thủ công
        
        // 🔥 QUAN TRỌNG: Tích hợp với hệ thống kế toán
        if (typeof window.integratePurchaseAccounting === 'function') {
            window.integratePurchaseAccounting(invoice, window.currentCompany);
        }
        
        // Cập nhật giao diện
        renderInvoices();
        if (typeof window.renderStock === 'function') window.renderStock();
        if (typeof window.updateAccountingStats === 'function') window.updateAccountingStats();
        
        // Đóng modal
        document.getElementById('custom-modal').remove();
        
        alert('✅ Đã nhập tồn kho thành công!');
        
        // Lưu dữ liệu
        if (typeof window.saveData === 'function') {
            window.saveData();
        }
    });
    
    document.getElementById('cancel-post-stock').addEventListener('click', function() {
        document.getElementById('custom-modal').remove();
    });
}

function renderInvoices(searchTerm = '') {
    const invoiceList = document.getElementById('invoice-list');
    if (!invoiceList) return;
    
    invoiceList.innerHTML = '';
    
    if (!window.currentCompany || !hkdData[window.currentCompany]) {
        invoiceList.innerHTML = '<tr><td colspan="14" style="text-align: center;">Chưa chọn công ty</td></tr>';
        return;
    }
    
    const hkd = hkdData[window.currentCompany];
    let invoiceCount = 0;
    
    // Cập nhật thống kê
    updateInvoiceStats();
    
    // Sắp xếp hóa đơn theo ngày (mới nhất trước)
    const sortedInvoices = [...hkd.invoices].sort((a, b) => 
        new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date)
    );
    
    sortedInvoices.forEach((invoice, index) => {
        // Lọc theo từ khóa tìm kiếm
        const searchTerms = searchTerm.toLowerCase().split(' ').filter(t => t);
        
        const isMatch = searchTerms.every(term => 
            invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
            invoice.invoiceInfo.number.toLowerCase().includes(term) ||
            invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
            invoice.sellerInfo.name.toLowerCase().includes(term)
        );
        
        if (searchTerm && !isMatch) {
            return;
        }

        const row = document.createElement('tr');
        // Thêm màu nền cho hóa đơn
        let rowClass = '';
        if (invoice.status.validation === 'error') {
            rowClass = 'table-danger';
        } else if (invoice.status.validation === 'manual_fixed') {
            rowClass = 'table-warning';
        } else if (invoice.products.some(p => p.hasDifference)) {
            rowClass = 'table-info';
        }

        row.className = rowClass;
        
        // Tính tổng chiết khấu
        const totalDiscount = invoice.products.reduce((sum, product) => {
            return sum + (parseFloat(product.discount) || 0);
        }, 0);
        
        // Xác định trạng thái và nút thao tác
        let statusBadge = '';
        let actionButtons = '';
        
        if (invoice.status.validation === 'ok' && invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-success">Đã nhập kho</span>';
            actionButtons = `
                <button class="btn-sm btn-info" onclick="showInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
                <button class="btn-sm btn-danger" onclick="deleteInvoice('${invoice.originalFileId}')">Xóa</button>
            `;
        } else if ((invoice.status.validation === 'error' || invoice.status.validation === 'manual_fixed') && !invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-danger">Lỗi chênh lệch</span>';
            actionButtons = `
                <button class="btn-sm btn-warning" onclick="showFixInvoicePopup('${invoice.originalFileId}')">Sửa & Nhập kho</button>
                <button class="btn-sm btn-info" onclick="showInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
                <button class="btn-sm btn-danger" onclick="deleteInvoice('${invoice.originalFileId}')">Xóa</button>
            `;
        } else if (invoice.status.validation === 'manual_fixed') {
            statusBadge = '<span class="badge badge-warning">Đã sửa thủ công</span>';
            actionButtons = `
                <button class="btn-sm btn-info" onclick="showInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
                <button class="btn-sm btn-danger" onclick="deleteInvoice('${invoice.originalFileId}')">Xóa</button>
            `;
        } else {
            statusBadge = '<span class="badge badge-secondary">Không xác định</span>';
            actionButtons = `
                <button class="btn-sm btn-info" onclick="showInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
                <button class="btn-sm btn-danger" onclick="deleteInvoice('${invoice.originalFileId}')">Xóa</button>
            `;
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</td>
            <td>${formatDate(invoice.invoiceInfo.date)}</td>
            <td>${invoice.sellerInfo.name}</td>
            <td>${invoice.sellerInfo.taxCode}</td>
            <td>${invoice.invoiceInfo.type}</td>
            <td>${invoice.invoiceInfo.paymentMethod}</td>
            <td>${formatCurrency(invoice.summary.calculatedTotal)}</td>
            <td>${formatCurrency(invoice.summary.calculatedTax)}</td>
            <td>${formatCurrency(totalDiscount)}</td> <!-- Cột chiết khấu -->
            <td class="${invoice.status.difference > 0 ? 'text-danger' : ''}">
                ${formatCurrency(invoice.status.difference || 0)}
            </td>
            <td>${statusBadge}</td>
            <td>
                <div class="button-group-small">
                    ${actionButtons}
                </div>
            </td>
        `;
        
        invoiceList.appendChild(row);
        invoiceCount++;
    });
    
    if (invoiceCount === 0) {
        invoiceList.innerHTML = `<tr><td colspan="14" style="text-align: center;">${searchTerm ? 'Không tìm thấy hóa đơn' : 'Chưa có hóa đơn nào được nhập'}</td></tr>`;
    }
}

function showInvoiceDetail(id) {
    if (!window.currentCompany) return;
    
    const hkd = hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === id);
    
    if (!invoice) {
        alert('Không tìm thấy hóa đơn');
        return;
    }

    // Hiển thị HTML preview nếu có
    if (invoice.htmlUrl) {
        window.open(invoice.htmlUrl, '_blank');
        return;
    }
    
    // Hiển thị chi tiết đầy đủ từ XML dưới dạng modal
    let detailHtml = `
        <div class="invoice-detail-container" style="max-width: 1000px; margin: 0 auto;">
            <!-- HEADER HÓA ĐƠN -->
            <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-bottom: 20px;">
                <div class="card-header" style="background: transparent; border: none; text-align: center;">
                    <h3 style="margin: 0; font-weight: 700;">${invoice.invoiceInfo.type || 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG'}</h3>
                    <p style="margin: 5px 0; opacity: 0.9;">Mẫu số: ${invoice.invoiceInfo.symbol || ''} | Ký hiệu: ${invoice.invoiceInfo.number || ''}</p>
                    <p style="margin: 0; opacity: 0.9;">Số: ${invoice.invoiceInfo.symbol || ''}/${invoice.invoiceInfo.number || ''}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <!-- BÊN BÁN -->
                <div class="card">
                    <div class="card-header" style="background: #f8f9fa; font-weight: bold;">BÊN BÁN</div>
                    <div class="card-body" style="padding: 15px;">
                        <p><strong>Tên:</strong> ${invoice.sellerInfo.name}</p>
                        <p><strong>MST:</strong> ${invoice.sellerInfo.taxCode}</p>
                        <p><strong>Địa chỉ:</strong> ${invoice.sellerInfo.address || 'Chưa có thông tin'}</p>
                        ${invoice.sellerInfo.phone ? `<p><strong>Điện thoại:</strong> ${invoice.sellerInfo.phone}</p>` : ''}
                        ${invoice.sellerInfo.email ? `<p><strong>Email:</strong> ${invoice.sellerInfo.email}</p>` : ''}
                    </div>
                </div>

                <!-- BÊN MUA -->
                <div class="card">
                    <div class="card-header" style="background: #f8f9fa; font-weight: bold;">BÊN MUA</div>
                    <div class="card-body" style="padding: 15px;">
                        <p><strong>Tên:</strong> ${invoice.buyerInfo.name}</p>
                        <p><strong>MST:</strong> ${invoice.buyerInfo.taxCode}</p>
                        <p><strong>Địa chỉ:</strong> ${invoice.buyerInfo.address || 'Chưa có thông tin'}</p>
                        ${invoice.buyerInfo.phone ? `<p><strong>Điện thoại:</strong> ${invoice.buyerInfo.phone}</p>` : ''}
                        ${invoice.buyerInfo.email ? `<p><strong>Email:</strong> ${invoice.buyerInfo.email}</p>` : ''}
                    </div>
                </div>
            </div>

            <!-- THÔNG TIN CHUNG -->
            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header" style="background: #f8f9fa; font-weight: bold;">THÔNG TIN CHUNG</div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div>
                            <p><strong>Ngày lập:</strong> ${formatDate(invoice.invoiceInfo.date)}</p>
                            <p><strong>Phương thức TT:</strong> ${invoice.invoiceInfo.paymentMethod}</p>
                        </div>
                        <div>
                            <p><strong>Loại tiền tệ:</strong> ${invoice.invoiceInfo.currency || 'VND'}</p>
                            <p><strong>Tỷ giá:</strong> ${invoice.invoiceInfo.exchangeRate || '1'}</p>
                        </div>
                        <div>
                            <p><strong>Hình thức hóa đơn:</strong> ${invoice.invoiceInfo.form || 'Hóa đơn điện tử'}</p>
                            <p><strong>Trạng thái:</strong> ${getInvoiceStatusBadge(invoice)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DANH SÁCH HÀNG HÓA DỊCH VỤ -->
            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header" style="background: #f8f9fa; font-weight: bold;">
                    DANH SÁCH HÀNG HÓA, DỊCH VỤ
                </div>
                <div class="card-body" style="padding: 0;">
                    <div style="overflow-x: auto;">
                        <table class="table" style="margin: 0; font-size: 12px;">
                            <thead style="background: #e9ecef;">
                                <tr>
                                    <th style="padding: 10px 8px; text-align: center;">STT</th>
                                    <th style="padding: 10px 8px;">Mã hàng</th>
                                    <th style="padding: 10px 8px;">Tên hàng hóa, dịch vụ</th>
                                    <th style="padding: 10px 8px; text-align: center;">ĐVT</th>
                                    <th style="padding: 10px 8px; text-align: right;">Số lượng</th>
                                    <th style="padding: 10px 8px; text-align: right;">Đơn giá</th>
                                    <th style="padding: 10px 8px; text-align: right;">Thành tiền</th>
                                    <th style="padding: 10px 8px; text-align: center;">Thuế suất</th>
                                    <th style="padding: 10px 8px; text-align: right;">Tiền thuế</th>
                                </tr>
                            </thead>
                            <tbody>
    `;
    
    // Hiển thị chi tiết sản phẩm
    invoice.products.forEach((product, index) => {
        const taxAmount = product.taxAmount || accountingRound(product.amount * (parseFloat(product.taxRate) || 0) / 100);
        const rowClass = product.hasDifference ? 'table-warning' : '';
        
        detailHtml += `
            <tr class="${rowClass}" style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px; text-align: center;">${product.stt}</td>
                <td style="padding: 8px;"><code>${product.productCode || product.msp || ''}</code></td>
                <td style="padding: 8px;">${product.name}</td>
                <td style="padding: 8px; text-align: center;">${product.unit}</td>
                <td style="padding: 8px; text-align: right;">${product.quantity}</td>
                <td style="padding: 8px; text-align: right;">${formatCurrency(product.price)}</td>
                <td style="padding: 8px; text-align: right; font-weight: 500;">${formatCurrency(product.amount)}</td>
                <td style="padding: 8px; text-align: center;">${product.taxRate}%</td>
                <td style="padding: 8px; text-align: right;">${formatCurrency(taxAmount)}</td>
            </tr>
        `;
    });
    
    detailHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- TỔNG HỢP THANH TOÁN -->
            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header" style="background: #f8f9fa; font-weight: bold;">TỔNG HỢP THANH TOÁN</div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <!-- Cột trái: Tổng hợp theo thuế suất -->
                        <div>
                            <h6 style="margin-bottom: 15px; color: #495057;">TỔNG HỢP THEO THUẾ SUẤT</h6>
                            <table style="width: 100%; font-size: 13px;">
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><strong>Thuế suất</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: right;"><strong>Tiền hàng</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: right;"><strong>Tiền thuế</strong></td>
                                </tr>
    `;
    
    // Tính tổng theo từng mức thuế suất
    const taxGroups = {};
    invoice.products.forEach(product => {
        const taxRate = product.taxRate || '0';
        if (!taxGroups[taxRate]) {
            taxGroups[taxRate] = { amount: 0, tax: 0 };
        }
        taxGroups[taxRate].amount += product.amount;
        taxGroups[taxRate].tax += product.taxAmount || accountingRound(product.amount * (parseFloat(taxRate) || 0) / 100);
    });
    
    Object.keys(taxGroups).forEach(taxRate => {
        detailHtml += `
            <tr>
                <td style="padding: 8px;">${taxRate}%</td>
                <td style="padding: 8px; text-align: right;">${formatCurrency(taxGroups[taxRate].amount)}</td>
                <td style="padding: 8px; text-align: right;">${formatCurrency(taxGroups[taxRate].tax)}</td>
            </tr>
        `;
    });
    
    detailHtml += `
                            </table>
                        </div>
                        
                        <!-- Cột phải: Tổng cộng -->
                        <div>
                            <h6 style="margin-bottom: 15px; color: #495057;">TỔNG CỘNG</h6>
                            <table style="width: 100%; font-size: 14px;">
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Tổng tiền hàng:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right; font-weight: 500;">
                                        ${formatCurrency(invoice.summary.calculatedAmountAfterDiscount || invoice.summary.totalBeforeTax)}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Tiền chiết khấu:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right; color: #dc3545;">
                                        ${formatCurrency(invoice.summary.calculatedDiscount || 0)}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Tổng tiền thuế GTGT:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right; font-weight: 500;">
                                        ${formatCurrency(invoice.summary.calculatedTax)}
                                    </td>
                                </tr>
                                <tr style="background: #f8f9fa;">
                                    <td style="padding: 12px; font-weight: bold; font-size: 15px;"><strong>TỔNG TIỀN THANH TOÁN:</strong></td>
                                    <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px; color: #dc3545;">
                                        ${formatCurrency(invoice.summary.calculatedTotal)}
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Số tiền bằng chữ -->
                            <div style="margin-top: 15px; padding: 12px; background: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
                                <strong>Số tiền bằng chữ:</strong> 
                                <span style="font-style: italic;">${convertCurrencyToText(invoice.summary.calculatedTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- THÔNG TIN XÁC THỰC -->
            <div class="card">
                <div class="card-header" style="background: #f8f9fa; font-weight: bold;">THÔNG TIN XÁC THỰC</div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px;">
                        <div>
                            <p><strong>Mã tra cứu:</strong> ${invoice.originalFileId || 'Không có'}</p>
                            <p><strong>Thời gian ký:</strong> ${invoice.signingTime || formatDate(invoice.invoiceInfo.date)}</p>
                        </div>
                        <div>
                            <p><strong>Trạng thái xác thực:</strong> 
                                <span class="badge ${invoice.status.validation === 'ok' ? 'badge-success' : invoice.status.validation === 'error' ? 'badge-danger' : 'badge-warning'}">
                                    ${getValidationStatusText(invoice.status.validation)}
                                </span>
                            </p>
                            <p><strong>Chênh lệch:</strong> 
                                <span style="color: ${invoice.status.difference === 0 ? 'green' : 'red'}; font-weight: 500;">
                                    ${formatCurrency(invoice.status.difference || 0)}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    window.showModal(`CHI TIẾT HÓA ĐƠN ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`, detailHtml, 'modal-xl');
}

function convertCurrencyToText(amount) {
    if (!amount || amount === 0) return "Không đồng";
    
    // Đơn giản hóa - trong thực tế cần hàm chuyển đổi phức tạp hơn
    const billions = Math.floor(amount / 1000000000);
    const millions = Math.floor((amount % 1000000000) / 1000000);
    const thousands = Math.floor((amount % 1000000) / 1000);
    const units = amount % 1000;
    
    let result = "";
    if (billions > 0) result += `${billions} tỷ `;
    if (millions > 0) result += `${millions} triệu `;
    if (thousands > 0) result += `${thousands} nghìn `;
    if (units > 0) result += `${units} `;
    
    return result.trim() + " đồng";
}

function getInvoiceStatusBadge(invoice) {
    if (invoice.status.stockPosted) {
        return '<span class="badge badge-success">✅ Đã nhập kho</span>';
    } else if (invoice.status.validation === 'error') {
        return '<span class="badge badge-danger">❌ Lỗi chênh lệch</span>';
    } else if (invoice.status.validation === 'manual_fixed') {
        return '<span class="badge badge-warning">⚠️ Đã sửa thủ công</span>';
    } else {
        return '<span class="badge badge-secondary">⏳ Chưa xử lý</span>';
    }
}

function getValidationStatusText(status) {
    const statusMap = {
        'ok': 'Hợp lệ',
        'error': 'Lỗi chênh lệch',
        'manual_fixed': 'Đã sửa thủ công',
        'pending': 'Đang chờ xử lý'
    };
    return statusMap[status] || 'Không xác định';
}

// Xóa hóa đơn
function deleteInvoice(id) {
    if (!window.currentCompany || !confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) return;
    
    const hkd = hkdData[window.currentCompany];
    const index = hkd.invoices.findIndex(inv => inv.originalFileId === id);
    
    if (index !== -1) {
        const deletedInvoice = hkd.invoices[index];
        
        // 1. Xóa hóa đơn khỏi danh sách
        hkd.invoices.splice(index, 1);
        
        // 2. Cập nhật lại tồn kho (Hoàn nguyên)
        if (deletedInvoice.status.stockPosted) {
            deletedInvoice.products.forEach(item => {
                if (item.category !== 'hang_hoa') return;
                let stockItem = hkd.tonkhoMain.find(p => p.msp === item.msp);
                if (stockItem) {
                    // Trừ số lượng và giá trị (vì khi nhập là cộng vào)
                    stockItem.quantity -= parseFloat(item.quantity); 
                    stockItem.amount -= item.amount;
                }
            });
            
            // Xóa các sản phẩm có số lượng < 1
            hkd.tonkhoMain = hkd.tonkhoMain.filter(p => p.quantity >= 1);
        }
        
        // 3. Cập nhật giao diện
        window.renderInvoices();
        if (typeof window.renderStock === 'function') window.renderStock();
        if (typeof window.updateAccountingStats === 'function') window.updateAccountingStats();
        window.renderCompanyList();
        
        alert('Đã xóa hóa đơn và cập nhật tồn kho.');
    } else {
        alert('Không tìm thấy hóa đơn để xóa.');
    }
}

function filterPurchaseInvoices() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    
    if (invoices.length === 0) {
        renderFilteredPurchaseInvoices([]);
        return;
    }
    
    // Lấy giá trị bộ lọc
    const searchTerm = document.getElementById('search-purchase-invoices')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('purchase-date-filter')?.value || 'all';
    const showErrorsFirst = document.getElementById('show-error-invoices')?.checked || false;
    
    // Lọc theo từ khóa tìm kiếm
    let filteredInvoices = invoices.filter(invoice => {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        
        if (searchTerms.length === 0) return true;
        
        return searchTerms.every(term => 
            invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
            invoice.invoiceInfo.number.toLowerCase().includes(term) ||
            invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
            invoice.sellerInfo.name.toLowerCase().includes(term) ||
            (invoice.invoiceInfo.symbol + '/' + invoice.invoiceInfo.number).toLowerCase().includes(term)
        );
    });
    
    // Lọc theo ngày
    filteredInvoices = filterInvoicesByDate(filteredInvoices, dateFilter);
    
    // Sắp xếp: hóa đơn lỗi lên đầu (nếu được chọn)
    if (showErrorsFirst) {
        filteredInvoices.sort((a, b) => {
            const aIsError = a.status && a.status.validation === 'error' && !a.status.stockPosted;
            const bIsError = b.status && b.status.validation === 'error' && !b.status.stockPosted;
            
            if (aIsError && !bIsError) return -1;
            if (!aIsError && bIsError) return 1;
            
            // Nếu cùng trạng thái, sắp xếp theo ngày (mới nhất trước)
            return new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date);
        });
    } else {
        // Mặc định: sắp xếp theo ngày (mới nhất trước)
        filteredInvoices.sort((a, b) => new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date));
    }
    
    // Giới hạn hiển thị 5 hóa đơn gần nhất
    window.currentPurchaseDisplayLimit = 5;
    const displayedInvoices = filteredInvoices.slice(0, window.currentPurchaseDisplayLimit);
    
    // Hiển thị kết quả
    renderFilteredPurchaseInvoices(displayedInvoices, filteredInvoices.length);
    
    console.log(`🔍 Lọc hoàn tất: ${displayedInvoices.length}/${filteredInvoices.length} hóa đơn`);
}

function loadMorePurchaseInvoices() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    // Áp dụng lại bộ lọc hiện tại
    const searchTerm = document.getElementById('search-purchase-invoices')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('purchase-date-filter')?.value || 'all';
    const showErrorsFirst = document.getElementById('show-error-invoices')?.checked || false;
    
    // Lọc theo từ khóa
    let filteredInvoices = invoices.filter(invoice => {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length === 0) return true;
        
        return searchTerms.every(term => 
            invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
            invoice.invoiceInfo.number.toLowerCase().includes(term) ||
            invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
            invoice.sellerInfo.name.toLowerCase().includes(term)
        );
    });
    
    // Lọc theo ngày
    filteredInvoices = filterInvoicesByDate(filteredInvoices, dateFilter);
    
    // Sắp xếp
    if (showErrorsFirst) {
        filteredInvoices.sort((a, b) => {
            const aIsError = a.status && a.status.validation === 'error' && !a.status.stockPosted;
            const bIsError = b.status && b.status.validation === 'error' && !b.status.stockPosted;
            
            if (aIsError && !bIsError) return -1;
            if (!aIsError && bIsError) return 1;
            
            return new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date);
        });
    } else {
        filteredInvoices.sort((a, b) => new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date));
    }
    
    // Tăng giới hạn hiển thị (thêm 10 hóa đơn mỗi lần nhấn)
    window.currentPurchaseDisplayLimit = (window.currentPurchaseDisplayLimit || 5) + 10;
    const displayedInvoices = filteredInvoices.slice(0, window.currentPurchaseDisplayLimit);
    
    // Hiển thị lại
    renderFilteredPurchaseInvoices(displayedInvoices, filteredInvoices.length);
}

function updateFilterStats(displayed, total) {
    const displayedElement = document.getElementById('displayed-count');
    const totalElement = document.getElementById('total-count');
    const statsElement = document.getElementById('purchase-filter-stats');
    
    if (displayedElement && totalElement && statsElement) {
        displayedElement.textContent = displayed;
        totalElement.textContent = total;
        
        if (displayed === 0) {
            statsElement.style.background = '#fff5f5';
            statsElement.innerHTML = '<small style="color: #dc3545;">❌ Không tìm thấy hóa đơn phù hợp</small>';
        } else {
            statsElement.style.background = '#f8f9fa';
            let statsText = `<small>Đang hiển thị: <strong>${displayed}</strong>/<strong>${total}</strong> hóa đơn</small>`;
            
            // Thêm thông báo "5 hóa đơn gần nhất" nếu đang hiển thị ít hơn tổng số
            if (displayed < total && displayed === 5) {
                statsText += `<br><small style="color: #007bff;">📋 Đang hiển thị 5 hóa đơn gần nhất</small>`;
            }
            
            statsElement.innerHTML = statsText;
        }
    }
}

function showSupplierHistory(taxCode) {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        alert('👈 Vui lòng chọn công ty trước.');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    
    // Lọc hóa đơn của NCC này và sắp xếp theo ngày (mới nhất trước)
    const supplierInvoices = invoices
        .filter(inv => inv.sellerInfo.taxCode === taxCode)
        .sort((a, b) => new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date));
    
    if (supplierInvoices.length === 0) {
        alert('📭 Không tìm thấy hóa đơn nào của NCC này.');
        return;
    }
    
    const supplierName = supplierInvoices[0].sellerInfo.name;
    
    // Tạo nội dung modal
    let historyHtml = `
        <div class="card">
            <div class="card-header">
                <h4>📊 Lịch Sử Hóa Đơn - ${supplierName}</h4>
                <small>MST: ${taxCode} | Tổng số: ${supplierInvoices.length} hóa đơn</small>
            </div>
            <div class="card-body" style="max-height: 60vh; overflow-y: auto;">
                <table class="table table-striped table-sm">
                   
                    <tbody>
    `;
    
    let totalAmount = 0;
    let totalTax = 0;
    
    supplierInvoices.forEach((invoice, index) => {
        totalAmount += invoice.summary.calculatedTotal;
        totalTax += invoice.summary.calculatedTax;
        
        let statusBadge = '';
        if (invoice.status && invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-success">✅ Đã nhập kho</span>';
        } else if (invoice.status && invoice.status.validation === 'error') {
            statusBadge = '<span class="badge badge-danger">❌ Lỗi</span>';
        } else {
            statusBadge = '<span class="badge badge-warning">⚠️ Chưa xử lý</span>';
        }
        
        historyHtml += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong></td>
                <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
                <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
                <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTax)}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">👁️</button>
                    <button class="btn-sm btn-warning" onclick="editPurchaseInvoice('${invoice.originalFileId}')">✏️</button>
                </td>
            </tr>
        `;
    });
    
    historyHtml += `
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="card mt-3">
            <div class="card-header">📈 Tổng Hợp</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <p><strong>Tổng số hóa đơn:</strong> ${supplierInvoices.length}</p>
                        <p><strong>Tổng giá trị:</strong> ${window.formatCurrency(totalAmount)}</p>
                    </div>
                    <div class="col-6">
                        <p><strong>Tổng thuế GTGT:</strong> ${window.formatCurrency(totalTax)}</p>
                        <p><strong>Giá trị trung bình/HĐ:</strong> ${window.formatCurrency(totalAmount / supplierInvoices.length)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Hiển thị modal
    window.showModal(`📊 Lịch Sử Hóa Đơn - ${supplierName}`, historyHtml, 'modal-lg');
}

window.filterModulesInitialized = false;


function setupPurchaseFilterEvents() {
    console.log('🔧 setupPurchaseFilterEvents() called');
    
    const searchInput = document.getElementById('search-purchase-invoices');
    if (searchInput) {
        searchInput.addEventListener('input', filterPurchaseInvoices);
        console.log('✅ Đã gắn sự kiện search input');
    } else {
        console.warn('⚠️ Không tìm thấy search-purchase-invoices');
    }
    
    const dateFilter = document.getElementById('purchase-date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            filterPurchaseInvoices();
        });
        console.log('✅ Đã gắn sự kiện date filter');
    }
    
    const showErrorsCheckbox = document.getElementById('show-error-invoices');
    if (showErrorsCheckbox) {
        showErrorsCheckbox.addEventListener('change', filterPurchaseInvoices);
        console.log('✅ Đã gắn sự kiện error checkbox');
    }
}

function calculateSupplierDebt(invoices) {
    console.log('🧮 calculateSupplierDebt() called với', invoices.length, 'hóa đơn');
    
    const supplierDebt = {};
    
    invoices.forEach(invoice => {
        const supplierKey = invoice.sellerInfo.taxCode;
        if (!supplierDebt[supplierKey]) {
            supplierDebt[supplierKey] = {
                name: invoice.sellerInfo.name,
                taxCode: supplierKey,
                totalDebt: 0,
                paid: 0,
                remaining: 0,
                invoices: []
            };
        }
        
        supplierDebt[supplierKey].totalDebt += invoice.summary.calculatedTotal;
        supplierDebt[supplierKey].invoices.push(invoice);
    });

    // Tính toán số đã thanh toán và còn nợ
    Object.values(supplierDebt).forEach(supplier => {
        supplier.paid = supplier.totalDebt * 0.3; // Giả sử đã thanh toán 30%
        supplier.remaining = supplier.totalDebt - supplier.paid;
        
        // Sắp xếp hóa đơn theo ngày (mới nhất trước)
        supplier.invoices.sort((a, b) => new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date));
        
        console.log(`💰 NCC "${supplier.name}": Tổng nợ ${supplier.totalDebt}, Đã trả ${supplier.paid}, Còn nợ ${supplier.remaining}`);
    });
    
    console.log('📊 Tổng số NCC:', Object.keys(supplierDebt).length);
    return supplierDebt;
}


function createFilterUI() {
    console.log('🔄 createFilterUI() called');
    
    // KIỂM TRA ĐÃ TỒN TẠI CHƯA
    if (document.getElementById('purchase-invoice-filter')) {
        console.log('✅ Bộ lọc hóa đơn đã tồn tại, bỏ qua');
        return;
    }
    
    // TÌM CARD HÓA ĐƠN TRONG .content-body
    let invoiceListSection = null;
    const allCards = document.querySelectorAll('#mua-hang .content-body .card');
    
    console.log('📋 Tìm card Hóa Đơn trong', allCards.length, 'cards');
    
    for (let card of allCards) {
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Danh Sách Hóa Đơn Mua Hàng')) {
            invoiceListSection = card;
            console.log('✅ Đã tìm thấy card Hóa Đơn:', header.textContent);
            break;
        }
    }
    
    if (!invoiceListSection) {
        console.error('❌ Không tìm thấy card Danh Sách Hóa Đơn Mua Hàng');
        return;
    }
    
    // Tạo HTML cho bộ lọc
    const filterHtml = `
        <div class="card" id="purchase-invoice-filter">
            <div class="card-header">🔍 Bộ Lọc Hóa Đơn</div>
            <div class="card-body">
                <div class="filter-grid">
                    <div class="form-group">
                        <label for="search-purchase-invoices">Tìm kiếm nhanh</label>
                        <input type="text" id="search-purchase-invoices" 
                               placeholder="Tên NCC, MST, Số HĐ..." 
                               class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label for="purchase-date-filter">Lọc theo ngày</label>
                        <select id="purchase-date-filter" class="form-control">
                            <option value="all">Tất cả ngày</option>
                            <option value="today">Hôm nay</option>
                            <option value="yesterday">Hôm qua</option>
                            <option value="week">Tuần này</option>
                            <option value="month">Tháng này</option>
                            <option value="last-month">Tháng trước</option>
                            <option value="custom">Tùy chọn...</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="custom-date-range" style="display: none;">
                        <label>Khoảng ngày tùy chọn</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="date" id="start-date" class="form-control" style="flex: 1;">
                            <input type="date" id="end-date" class="form-control" style="flex: 1;">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="show-error-invoices" style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="show-error-invoices">
                            <span>Ưu tiên hiển thị hóa đơn lỗi</span>
                        </label>
                    </div>
                </div>
                
                <div class="filter-stats" id="purchase-filter-stats" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                    <small>Đang hiển thị: <span id="displayed-count">0</span>/<span id="total-count">0</span> hóa đơn</small>
                </div>
            </div>
        </div>
    `;
    
    try {
        invoiceListSection.insertAdjacentHTML('beforebegin', filterHtml);
        console.log('✅ Đã tạo bộ lọc hóa đơn thành công');
    } catch (error) {
        console.error('❌ Lỗi khi tạo bộ lọc hóa đơn:', error);
    }
}


function initPurchaseInvoiceFilter() {
    if (window.purchaseFilterInitialized) {
        console.log('✅ Bộ lọc hóa đơn đã được khởi tạo trước đó');
        setTimeout(filterPurchaseInvoices, 100);
        return;
    }
    
    console.log('🔄 Đang khởi tạo bộ lọc hóa đơn mua hàng...');
    
    const isMuaHangActive = document.getElementById('mua-hang')?.classList.contains('active');
    if (!isMuaHangActive) {
        console.log('⏳ Tab Mua Hàng chưa active');
        return;
    }
    
    // Tạo HTML cho bộ lọc HÓA ĐƠN TRƯỚC
    createFilterUI();
    
    // Gắn sự kiện
    setupPurchaseFilterEvents();
    
    // TỰ ĐỘNG CHẠY FILTER
    setTimeout(() => {
        filterPurchaseInvoices();
        console.log('🎯 Đã tự động chạy filter hiển thị 5 hóa đơn gần nhất');
    }, 200);
    
    window.purchaseFilterInitialized = true;
    console.log('✅ Đã khởi tạo bộ lọc hóa đơn mua hàng');
}



window.loadPurchaseInvoices = function() {
  
    
    // TỰ ĐỘNG CHẠY FILTER KHI DỮ LIỆU THAY ĐỔI
    setTimeout(() => {
        if (window.purchaseFilterInitialized) {
            filterPurchaseInvoices();
            console.log('🔄 Đã tự động cập nhật filter sau khi load dữ liệu');
        }
    }, 300);
};


function resetPurchaseFilter() {
    console.log('🔄 Reset bộ lọc hóa đơn');
    
    // Reset các input filter
    const searchInput = document.getElementById('search-purchase-invoices');
    const dateFilter = document.getElementById('purchase-date-filter');
    const showErrorsCheckbox = document.getElementById('show-error-invoices');
    
    if (searchInput) searchInput.value = '';
    if (dateFilter) dateFilter.value = 'all';
    if (showErrorsCheckbox) showErrorsCheckbox.checked = false;
    
    // Ẩn custom date range nếu có
    const customDateRange = document.getElementById('custom-date-range');
    if (customDateRange) customDateRange.style.display = 'none';
    
    // Chạy lại filter
    filterPurchaseInvoices();
}

function addResetButtons() {
    console.log('🔧 addResetButtons() called');
    
    // Thêm nút reset cho filter hóa đơn
    const purchaseFilter = document.getElementById('purchase-invoice-filter');
    if (purchaseFilter && !purchaseFilter.querySelector('.reset-filter-btn')) {
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-sm btn-outline-secondary reset-filter-btn';
        resetBtn.innerHTML = '🔄 Reset';
        resetBtn.style.marginLeft = '10px';
        resetBtn.onclick = resetPurchaseFilter;
        
        const cardHeader = purchaseFilter.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.appendChild(resetBtn);
            console.log('✅ Đã thêm nút reset cho filter hóa đơn');
        }
    }
    
    // Thêm nút reset cho filter công nợ
    const payableFilter = document.getElementById('payable-filter');
    if (payableFilter && !payableFilter.querySelector('.reset-filter-btn')) {
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-sm btn-outline-secondary reset-filter-btn';
        resetBtn.innerHTML = '🔄 Reset';
        resetBtn.style.marginLeft = '10px';
        resetBtn.onclick = resetPayableFilter;
        
        const cardHeader = payableFilter.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.appendChild(resetBtn);
            console.log('✅ Đã thêm nút reset cho filter công nợ');
        }
    }
}

window.loadMorePayable = loadMorePayable;
window.showSupplierHistory = showSupplierHistory;


function createPayableFilterUI() {
    const cards = document.querySelectorAll('#mua-hang .content-body .card');
    let payableCard = null;
    
    for (let card of cards) {
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Công Nợ Phải Trả NCC')) {
            payableCard = card;
            break;
        }
    }
    
    if (!payableCard) return;
    
    const header = payableCard.querySelector('.card-header');
    
    // GỘP TIÊU ĐỀ + THỐNG KÊ + BỘ LỌC
    header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <!-- BÊN TRÁI: TIÊU ĐỀ + THỐNG KÊ -->
            <div style="display: flex; align-items: center; gap: 15px;">
                <div>
                    <strong>3. Công Nợ Phải Trả NCC (331)</strong>
                </div>
                <div id="payable-stats" style="font-size: 13px; color: #666;">
                    <!-- Thống kê sẽ được cập nhật ở đây -->
                </div>
            </div>
            
            <!-- BÊN PHẢI: BỘ LỌC -->
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" id="search-payable" placeholder="Tìm NCC..." 
                           style="width: 180px; padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                    <select id="debt-filter" style="padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="all">Tất cả NCC</option>
                        <option value="debt">Còn nợ</option>
                        <option value="paid">Đã trả</option>
                    </select>
                </div>
                <button class="btn btn-sm btn-outline-secondary" onclick="resetPayableFilter()">🔄</button>
            </div>
        </div>
    `;
    
    // Gắn sự kiện real-time
    setupPayableFilterEvents();
    
    // Cập nhật thống kê ban đầu
    updatePayableStats();
}

function updatePayableStats() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    const supplierDebt = calculateSupplierDebt(invoices);
    let suppliers = Object.values(supplierDebt);
    
    // Áp dụng bộ lọc hiện tại
    const searchTerm = document.getElementById('search-payable')?.value.toLowerCase() || '';
    const debtFilter = document.getElementById('debt-filter')?.value || 'all';
    
    // Lọc theo từ khóa
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            suppliers = suppliers.filter(supplier => {
                return searchTerms.every(term => 
                    supplier.name.toLowerCase().includes(term) ||
                    supplier.taxCode.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Lọc theo trạng thái nợ
    if (debtFilter === 'debt') {
        suppliers = suppliers.filter(supplier => supplier.remaining > 0);
    } else if (debtFilter === 'paid') {
        suppliers = suppliers.filter(supplier => supplier.remaining <= 0);
    }
    
    // Tính tổng hợp
    const totalSuppliers = suppliers.length;
    const totalDebt = suppliers.reduce((sum, supplier) => sum + supplier.totalDebt, 0);
    const totalRemaining = suppliers.reduce((sum, supplier) => sum + supplier.remaining, 0);
    const totalPaid = totalDebt - totalRemaining;
    
    // Hiển thị thống kê
    const statsElement = document.getElementById('payable-stats');
    if (statsElement) {
        if (totalSuppliers === 0) {
            statsElement.innerHTML = '<span style="color: #dc3545;">❌ Không có NCC</span>';
        } else {
            statsElement.innerHTML = `
                <span>📊 ${totalSuppliers} NCC</span> • 
                <span style="color: #e74c3c;">💰 ${window.formatCurrency(totalRemaining)} nợ</span> • 
                <span style="color: #27ae60;">💵 ${window.formatCurrency(totalPaid)} đã trả</span>
            `;
        }
    }
}

function setupPayableFilterEvents() {
    const searchInput = document.getElementById('search-payable');
    const debtFilter = document.getElementById('debt-filter');
    
    let timeoutId;
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                applyPayableFilters();
                updatePayableStats(); // CẬP NHẬT THỐNG KÊ
            }, 300);
        });
    }
    
    if (debtFilter) {
        debtFilter.addEventListener('change', function() {
            applyPayableFilters();
            updatePayableStats(); // CẬP NHẬT THỐNG KÊ
        });
    }
}

window.payableDisplayLimit = 5;

function renderSimpleFilteredPayable(suppliers) {
    const payableList = document.getElementById('payable-list');
    if (!payableList) return;
    
    payableList.innerHTML = '';
    
    if (suppliers.length === 0) {
        payableList.innerHTML = '<div class="no-data-message">📭 Không tìm thấy NCC phù hợp</div>';
        return;
    }
    
    const displayedSuppliers = suppliers.slice(0, window.payableDisplayLimit);
    
    // === TẠO RESPONSIVE TABLE - HIỂN THỊ CẢ TRÊN PC VÀ MOBILE ===
    const table = document.createElement('table');
    table.className = 'table table-striped table-responsive';
    table.style.width = '100%';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nhà Cung Cấp</th>
                <th>MST</th>
                <th class="text-right">Tổng Nợ</th>
                <th class="text-right">Đã Thanh Toán</th>
                <th class="text-right">Còn Nợ</th>
                <th>Thao Tác</th>
            </tr>
        </thead>
        <tbody>
            ${displayedSuppliers.map((supplier, index) => {
                const debtLevel = supplier.remaining > 0 ? 'table-warning' : '';
                const debtStatus = supplier.remaining > 0 ? 'text-danger' : 'text-success';
                
                return `
                    <tr class="${debtLevel}">
                        <td>
                            <div class="supplier-info">
                                <div class="supplier-name" style="cursor: pointer; color: #007bff; font-weight: 600;" 
                                     onclick="showSupplierHistory('${supplier.taxCode}')">
                                    ${supplier.name}
                                </div>
                                <small class="text-muted">${supplier.phone || 'Chưa có SĐT'}</small>
                            </div>
                        </td>
                        <td><code>${supplier.taxCode}</code></td>
                        <td class="text-right">${window.formatCurrency(supplier.totalDebt)}</td>
                        <td class="text-right">${window.formatCurrency(supplier.paid)}</td>
                        <td class="text-right ${debtStatus}">
                            <strong>${window.formatCurrency(supplier.remaining)}</strong>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-info" onclick="showSupplierHistory('${supplier.taxCode}')" title="Lịch sử">
                                    📊
                                </button>
                                ${supplier.remaining > 0 ? 
                                  `<button class="btn btn-success" onclick="makePayment('${supplier.taxCode}')" title="Thanh toán">
                                    💳
                                  </button>` : 
                                  ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
    
    payableList.appendChild(table);
    
    // Xem thêm
    if (suppliers.length > window.payableDisplayLimit) {
        const loadMoreDiv = document.createElement('div');
        loadMoreDiv.className = 'load-more-container text-center mt-3';
        loadMoreDiv.innerHTML = `
            <button onclick="loadMorePayable()" class="btn btn-outline-primary btn-sm">
                📋 Xem thêm ${suppliers.length - window.payableDisplayLimit} NCC
            </button>
        `;
        payableList.appendChild(loadMoreDiv);
    }
    
    console.log('✅ Đã render danh sách NCC với', displayedSuppliers.length, 'NCC');
}


function loadMorePayable() {
    // TĂNG GIỚI HẠN HIỂN THỊ
    window.payableDisplayLimit += 10;
    
    // RELOAD LẠI VỚI BỘ LỌC HIỆN TẠI
    applyPayableFilters();
}


function applyPayableFilters() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    const supplierDebt = calculateSupplierDebt(invoices);
    let suppliers = Object.values(supplierDebt);
    
    // Lọc theo từ khóa
    const searchTerm = document.getElementById('search-payable')?.value.toLowerCase() || '';
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            suppliers = suppliers.filter(supplier => {
                return searchTerms.every(term => 
                    supplier.name.toLowerCase().includes(term) ||
                    supplier.taxCode.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Lọc theo trạng thái nợ
    const debtFilter = document.getElementById('debt-filter')?.value || 'all';
    if (debtFilter === 'debt') {
        suppliers = suppliers.filter(supplier => supplier.remaining > 0);
    } else if (debtFilter === 'paid') {
        suppliers = suppliers.filter(supplier => supplier.remaining <= 0);
    }
    
    // Sắp xếp theo nợ giảm dần
    suppliers.sort((a, b) => b.remaining - a.remaining);
    
    // RESET GIỚI HẠN KHI THAY ĐỔI BỘ LỌC (chỉ giữ limit khi xem thêm)
    if (!window.keepPayableLimit) {
        window.payableDisplayLimit = 5;
    }
    window.keepPayableLimit = false;
    
    // Hiển thị kết quả
    renderSimpleFilteredPayable(suppliers);
    updatePayableStats();
}


function resetPayableFilter() {
    document.getElementById('search-payable').value = '';
    document.getElementById('debt-filter').value = 'all';
    window.payableDisplayLimit = 5; // RESET VỀ 5
    window.keepPayableLimit = false;
    loadPayableListWithDefaultSort();
    updatePayableStats();
}

function loadMorePayable() {
    // GIỮ NGUYÊN LIMIT HIỆN TẠI
    window.keepPayableLimit = true;
    window.payableDisplayLimit += 10;
    
    // RELOAD LẠI VỚI BỘ LỌC HIỆN TẠI
    applyPayableFilters();
}

function loadPayableListWithDefaultSort() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    const supplierDebt = calculateSupplierDebt(invoices);
    const suppliers = Object.values(supplierDebt);
    
    // Sắp xếp theo số nợ giảm dần
    suppliers.sort((a, b) => b.remaining - a.remaining);
    
    renderSimpleFilteredPayable(suppliers);
    updatePayableStats(); // CẬP NHẬT THỐNG KÊ KHI LOAD
}


function updateInvoiceStats() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    // Áp dụng bộ lọc hiện tại
    const searchTerm = document.getElementById('search-invoices')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('date-filter-invoices')?.value || 'all';
    
    // Lọc theo từ khóa
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            invoices = invoices.filter(invoice => {
                return searchTerms.every(term => 
                    invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
                    invoice.invoiceInfo.number.toLowerCase().includes(term) ||
                    invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
                    invoice.sellerInfo.name.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Lọc theo ngày
    if (dateFilter !== 'all') {
        invoices = filterInvoicesByDate(invoices, dateFilter);
    }
    
    // Tính tổng hợp
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.summary.calculatedTotal || 0), 0);
    const errorInvoices = invoices.filter(inv => 
        inv.status && inv.status.validation === 'error' && !inv.status.stockPosted
    ).length;
    
    // Hiển thị thống kê
    const statsElement = document.getElementById('invoice-stats');
    if (statsElement) {
        if (totalInvoices === 0) {
            statsElement.innerHTML = '<span style="color: #dc3545;">❌ Không có HĐ</span>';
        } else {
            statsElement.innerHTML = `
                <span>📊 ${totalInvoices} HĐ</span> • 
                <span style="color: #007bff;">💰 ${window.formatCurrency(totalAmount)}</span> • 
                <span style="color: #e74c3c;">⚠️ ${errorInvoices} lỗi</span>
            `;
        }
    }
}

// BIẾN TOÀN CỤC
window.invoiceDisplayLimit = 5;
window.currentFilteredInvoices = [];

function loadMoreInvoices() {
    console.log(`🔄 Nhấn xem thêm, limit hiện tại: ${window.invoiceDisplayLimit}`);
    
    // TĂNG GIỚI HẠN HIỂN THỊ
    window.keepInvoiceLimit = true;
    window.invoiceDisplayLimit += 10;
    
    console.log(`🔄 Limit mới: ${window.invoiceDisplayLimit}`);
    
    // HIỂN THỊ LẠI VỚI DỮ LIỆU ĐÃ LỌC
    if (window.currentFilteredInvoices && window.currentFilteredInvoices.length > 0) {
        renderSimpleFilteredInvoices(window.currentFilteredInvoices);
    } else {
        // Nếu không có dữ liệu đã lọc, chạy lại filter
        applyInvoiceFilters();
    }
}


function applyInvoiceFilters() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    // Lọc theo từ khóa
    const searchTerm = document.getElementById('search-invoices')?.value.toLowerCase() || '';
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            invoices = invoices.filter(invoice => {
                return searchTerms.every(term => 
                    invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
                    invoice.invoiceInfo.number.toLowerCase().includes(term) ||
                    invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
                    invoice.sellerInfo.name.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Lọc theo ngày
    const dateFilter = document.getElementById('date-filter-invoices')?.value || 'all';
    if (dateFilter !== 'all') {
        invoices = filterInvoicesByDate(invoices, dateFilter);
    }
    
    // Sắp xếp: lỗi trên đầu
    invoices.sort((a, b) => {
        const aIsError = a.status && a.status.validation === 'error' && !a.status.stockPosted;
        const bIsError = b.status && b.status.validation === 'error' && !b.status.stockPosted;
        if (aIsError && !bIsError) return -1;
        if (!aIsError && bIsError) return 1;
        return new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date);
    });
    
    // LƯU KẾT QUẢ LỌC ĐỂ DÙNG CHO LOAD MORE
    window.currentFilteredInvoices = invoices;
    
    // RESET GIỚI HẠN KHI THAY ĐỔI BỘ LỌC (không phải load more)
    if (!window.keepInvoiceLimit) {
        window.invoiceDisplayLimit = 5;
    }
    window.keepInvoiceLimit = false;
    
    // Hiển thị kết quả
    renderSimpleFilteredInvoices(window.currentFilteredInvoices);
    updateInvoiceStats();
}
function createInvoiceFilterUI() {
    const cards = document.querySelectorAll('#mua-hang .content-body .card');
    let invoiceCard = null;
    
    for (let card of cards) {
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Danh Sách Hóa Đơn Mua Hàng')) {
            invoiceCard = card;
            break;
        }
    }
    
    if (!invoiceCard) return;
    
    const header = invoiceCard.querySelector('.card-header');
    
    // GỘP TIÊU ĐỀ + THỐNG KÊ + BỘ LỌC (THÊM DROPDOWN NGÀY)
    header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <!-- BÊN TRÁI: TIÊU ĐỀ + THỐNG KÊ -->
            <div style="display: flex; align-items: center; gap: 15px;">
                <div>
                    <strong>2. Danh Sách Hóa Đơn Mua Hàng</strong>
                </div>
                <div id="invoice-stats" style="font-size: 13px; color: #666;">
                    <!-- Thống kê sẽ được cập nhật ở đây -->
                </div>
            </div>
            
            <!-- BÊN PHẢI: BỘ LỌC (THÊM DROPDOWN NGÀY) -->
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" id="search-invoices" placeholder="Tìm HĐ, NCC..." 
                           style="width: 180px; padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                    <select id="date-filter-invoices" style="padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="all">Tất cả thời gian</option>
                        <option value="today">Hôm nay</option>
                        <option value="yesterday">Hôm qua</option>
                        <option value="week">Tuần này</option>
                        <option value="month">Tháng này</option>
                        <option value="last-month">Tháng trước</option>
                        <option value="custom">Tùy chọn...</option>
                    </select>
                </div>
                <button class="btn btn-sm btn-outline-secondary" onclick="resetInvoiceFilter()">🔄</button>
            </div>
        </div>
        
        <!-- KHOẢNG NGÀY TÙY CHỌN (ẨN MẶC ĐỊNH) -->
        <div id="custom-date-range" style="display: none; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label style="font-size: 12px; margin-bottom: 4px; display: block;">Từ ngày</label>
                    <input type="date" id="start-date" style="width: 100%; padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 12px; margin-bottom: 4px; display: block;">Đến ngày</label>
                    <input type="date" id="end-date" style="width: 100%; padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div>
                    <button onclick="applyCustomDateRange()" class="btn btn-primary btn-sm" style="margin-top: 16px;">Áp dụng</button>
                </div>
            </div>
        </div>
    `;
    
    // Gắn sự kiện real-time
    setupInvoiceFilterEvents();
    
    // Cập nhật thống kê ban đầu
    updateInvoiceStats();
}


function setupInvoiceFilterEvents() {
    const searchInput = document.getElementById('search-invoices');
    const dateFilter = document.getElementById('date-filter-invoices');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    let timeoutId;
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                applyInvoiceFilters();
                updateInvoiceStats();
            }, 300);
        });
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            const customDateRange = document.getElementById('custom-date-range');
            
            if (this.value === 'custom') {
                // HIỆN KHOẢNG NGÀY TÙY CHỌN
                customDateRange.style.display = 'block';
            } else {
                // ẨN KHOẢNG NGÀY TÙY CHỌN VÀ ÁP DỤNG LỌC
                customDateRange.style.display = 'none';
                applyInvoiceFilters();
                updateInvoiceStats();
            }
        });
    }
    
    // TỰ ĐỘNG ÁP DỤNG KHI THAY ĐỔI NGÀY TÙY CHỌN
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', function() {
            if (this.value && document.getElementById('end-date').value) {
                applyInvoiceFilters();
                updateInvoiceStats();
            }
        });
        
        endDateInput.addEventListener('change', function() {
            if (this.value && document.getElementById('start-date').value) {
                applyInvoiceFilters();
                updateInvoiceStats();
            }
        });
    }
}


function applyCustomDateRange() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Ngày bắt đầu không thể lớn hơn ngày kết thúc');
        return;
    }
    
    applyInvoiceFilters();
    updateInvoiceStats();
}


function filterInvoicesByDate(invoices, dateFilter) {
    if (dateFilter === 'all') return invoices;
    
    const now = new Date();
    let startDate, endDate;
    
    switch(dateFilter) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
            
        case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
            
        case 'week':
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
            
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
            
        case 'last-month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
            
        case 'custom':
            const startInput = document.getElementById('start-date')?.value;
            const endInput = document.getElementById('end-date')?.value;
            
            if (startInput && endInput) {
                startDate = new Date(startInput);
                endDate = new Date(endInput);
                endDate.setDate(endDate.getDate() + 1); // Bao gồm cả ngày kết thúc
            } else {
                return invoices; // Nếu không có ngày tùy chọn, hiển thị tất cả
            }
            break;
            
        default:
            return invoices;
    }
    
    return invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceInfo.date);
        return invoiceDate >= startDate && invoiceDate < endDate;
    });
}


function resetInvoiceFilter() {
    document.getElementById('search-invoices').value = '';
    document.getElementById('date-filter-invoices').value = 'all';
    
    // RESET NGÀY TÙY CHỌN
    document.getElementById('custom-date-range').style.display = 'none';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    
    window.invoiceDisplayLimit = 5;
    window.keepInvoiceLimit = false;
    loadPurchaseInvoicesWithDefaultSort();
    updateInvoiceStats();
}

function loadPurchaseInvoicesWithDefaultSort() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    // Sắp xếp: lỗi trên đầu
    invoices.sort((a, b) => {
        const aIsError = a.status && a.status.validation === 'error' && !a.status.stockPosted;
        const bIsError = b.status && b.status.validation === 'error' && !b.status.stockPosted;
        if (aIsError && !bIsError) return -1;
        if (!aIsError && bIsError) return 1;
        return new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date);
    });
    
    // LƯU KẾT QUẢ LỌC
    window.currentFilteredInvoices = invoices;
    
    // RESET LIMIT
    window.invoiceDisplayLimit = 5;
    window.keepInvoiceLimit = false;
    
    renderSimpleFilteredInvoices(invoices);
    updateInvoiceStats();
}
function checkDateInputSupport() {
    const testInput = document.createElement('input');
    testInput.setAttribute('type', 'date');
    return testInput.type === 'date';
}
function initSimpleFilters() {
    // Kiểm tra hỗ trợ input date
    const supportsDateInput = checkDateInputSupport();
    console.log('📅 Trình duyệt hỗ trợ input date:', supportsDateInput);
    
    if (!supportsDateInput) {
        // Nếu không hỗ trợ, thêm fallback
        addDatePickerFallback();
    }
    
    createPayableFilterUI();
    createInvoiceFilterUI();
    
    setupPayableFilterEvents();
    setupInvoiceFilterEvents();
    
    window.loadPurchaseInvoices = loadPurchaseInvoicesWithDefaultSort;
    window.loadPayableList = loadPayableListWithDefaultSort;
}
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSimpleFilters, 1000);
});

function renderSimpleFilteredInvoices(invoices) {
    const invoiceList = document.getElementById('purchase-invoice-list');
    if (!invoiceList) return;
    
    invoiceList.innerHTML = '';
    
    if (invoices.length === 0) {
        invoiceList.innerHTML = '<div class="no-data-message">📭 Không tìm thấy hóa đơn phù hợp</div>';
        return;
    }
    
    const displayedInvoices = invoices.slice(0, window.invoiceDisplayLimit);
    
    // Tạo container cho cả 2 phiên bản
    const container = document.createElement('div');
    
    // === PHIÊN BẢN DESKTOP (TABLE) ===
    const tableContainer = document.createElement('div');
    tableContainer.className = 'invoice-table-container';
    
    const table = document.createElement('table');
    table.className = 'table-invoice';
    table.innerHTML = `
        <thead>
            <tr>
                <th>STT</th>
                <th>Số HĐ</th>
                <th>Ngày</th>
                <th>Nhà CC</th>
                <th>MST</th>
                <th class="text-right">Tổng tiền</th>
                <th class="text-right">Thuế</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
            </tr>
        </thead>
        <tbody>
            ${displayedInvoices.map((invoice, index) => {
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
                
                return `
                    <tr class="${statusClass}">
                        <td>${index + 1}</td>
                        <td><strong>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong></td>
                        <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
                        <td>${invoice.sellerInfo.name}</td>
                        <td><code>${invoice.sellerInfo.taxCode}</code></td>
                        <td class="text-right">${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
                        <td class="text-right">${window.formatCurrency(invoice.summary.calculatedTax)}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="button-group-small">
                                <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">👁️</button>
                                <button class="btn-sm btn-warning" onclick="editPurchaseInvoice('${invoice.originalFileId}')">✏️</button>
                                ${(!invoice.status || !invoice.status.stockPosted) ? 
                                  `<button class="btn-sm btn-primary" onclick="createPurchaseReceipt('${invoice.originalFileId}')">📦</button>` : 
                                  ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
    tableContainer.appendChild(table);
    
    // === PHIÊN BẢN MOBILE (CARDS) ===
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'invoice-cards-container';
    
    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'invoice-cards-grid';
    
    displayedInvoices.forEach((invoice, index) => {
        let statusBadge = '';
        let cardClass = '';
        
        if (invoice.status && invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-success">✅ Đã nhập kho</span>';
            cardClass = 'success';
        } else if (invoice.status && invoice.status.validation === 'error') {
            statusBadge = '<span class="badge badge-danger">❌ Cần sửa</span>';
            cardClass = 'error';
        } else {
            statusBadge = '<span class="badge badge-warning">⚠️ Chưa xử lý</span>';
            cardClass = 'warning';
        }
        
        const card = document.createElement('div');
        card.className = `invoice-card ${cardClass}`;
        card.innerHTML = `
            <!-- Header -->
            <div class="card-header">
                <div class="invoice-main-info">
                    <div class="invoice-number">${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</div>
                    <div class="invoice-date">${window.formatDate(invoice.invoiceInfo.date)}</div>
                </div>
                <div class="invoice-status">
                    ${statusBadge}
                </div>
            </div>
            
            <!-- Supplier Info -->
            <div class="supplier-info">
                <div class="supplier-name">${invoice.sellerInfo.name}</div>
                <div class="supplier-tax">MST: ${invoice.sellerInfo.taxCode}</div>
            </div>
            
            <!-- Amounts -->
            <div class="amount-section">
                <div class="amount-item">
                    <div class="amount-label">Tổng tiền</div>
                    <div class="amount-value">${window.formatCurrency(invoice.summary.calculatedTotal)}</div>
                </div>
                <div class="amount-item">
                    <div class="amount-label">Thuế GTGT</div>
                    <div class="amount-value tax-value">${window.formatCurrency(invoice.summary.calculatedTax)}</div>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="card-actions">
                <button class="card-btn card-btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">
                    👁️ Xem
                </button>
                <button class="card-btn card-btn-warning" onclick="editPurchaseInvoice('${invoice.originalFileId}')">
                    ✏️ Sửa
                </button>
                ${(!invoice.status || !invoice.status.stockPosted) ? 
                  `<button class="card-btn card-btn-primary" onclick="createPurchaseReceipt('${invoice.originalFileId}')">
                    📦 Nhập kho
                   </button>` : 
                  ''}
            </div>
        `;
        
        cardsGrid.appendChild(card);
    });
    
    cardsContainer.appendChild(cardsGrid);
    
    // Thêm cả 2 phiên bản vào container
    container.appendChild(tableContainer);
    container.appendChild(cardsContainer);
    invoiceList.appendChild(container);
    
    // Xem thêm button
    if (invoices.length > window.invoiceDisplayLimit) {
        const loadMoreDiv = document.createElement('div');
        loadMoreDiv.className = 'load-more-container';
        loadMoreDiv.innerHTML = `
            <button onclick="loadMoreInvoices()" class="btn btn-outline-primary btn-sm load-more-btn">
                📋 Xem thêm ${invoices.length - window.invoiceDisplayLimit} hóa đơn
            </button>
        `;
        invoiceList.appendChild(loadMoreDiv);
    }
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSimpleFilters, 1000);
});




window.loadMorePayable = loadMorePayable;
window.resetPurchaseFilter = resetPurchaseFilter;
window.resetPayableFilter = resetPayableFilter;
