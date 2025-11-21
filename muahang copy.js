

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
// =======================
// SỬA HÀM VIEWPURCHASEINVOICEDETAIL - THÊM CỘT CHIẾT KHẤU
// =======================
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
        <div class="invoice-detail-compact">
            <!-- HEADER THÔNG TIN CHÍNH -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <strong>📄 HÓA ĐƠN ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong>
                    <span class="badge ${invoice.status?.stockPosted ? 'bg-success' : 'bg-warning'}">
                        ${invoice.status?.stockPosted ? '✅ ĐÃ NHẬP KHO' : '⚠️ CHƯA NHẬP KHO'}
                    </span>
                </div>
                <div class="card-body p-3">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="info-item">
                                <span class="label">📅 Ngày HĐ:</span>
                                <span class="value">${window.formatDate(invoice.invoiceInfo.date)}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">🏢 Nhà cung cấp:</span>
                                <span class="value">${invoice.sellerInfo.name}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="info-item">
                                <span class="label">🔢 MST:</span>
                                <span class="value">${invoice.sellerInfo.taxCode}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">📍 Địa chỉ:</span>
                                <span class="value">${invoice.sellerInfo.address || '---'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TỔNG HỢP THANH TOÁN - COMPACT -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <strong>💰 TỔNG HỢP THANH TOÁN</strong>
                </div>
                <div class="card-body p-2">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">Tiền hàng:</div>
                            <div class="summary-value">${window.formatCurrency(invoice.summary.calculatedAmountAfterDiscount)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Thuế GTGT:</div>
                            <div class="summary-value">${window.formatCurrency(invoice.summary.calculatedTax)}</div>
                        </div>
                        <div class="summary-item total">
                            <div class="summary-label"><strong>Tổng thanh toán:</strong></div>
                            <div class="summary-value"><strong>${window.formatCurrency(invoice.summary.calculatedTotal)}</strong></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DANH SÁCH SẢN PHẨM - TỐI ƯU HIỂN THỊ -->
            <div class="card">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <strong>📦 DANH SÁCH HÀNG HÓA (${invoice.products.length} sản phẩm)</strong>
                    <small class="text-muted">Click tiêu đề để sắp xếp</small>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 350px; overflow-y: auto;">
                        <table class="table table-sm table-hover mb-0">
                            <thead class="sticky-top" style="background: #f8f9fa;">
                                <tr>
                                    <th width="5%">STT</th>
                                    <th width="15%">MSP</th>
                                    <th width="30%">Tên hàng hóa</th>
                                    <th width="8%">ĐVT</th>
                                    <th width="10%" class="text-end">SL</th>
                                    <th width="12%" class="text-end">Đơn giá</th>
                                    <th width="10%" class="text-end">Chiết khấu</th>
                                    <th width="10%" class="text-end">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
    `;
    
    let totalQuantity = 0;
    let totalDiscount = 0;
    
    invoice.products.forEach(product => {
        const discount = product.discount || product.discountAmount || product.discountRate || 0;
        const discountFormatted = typeof discount === 'number' ? window.formatCurrency(discount) : discount;
        
        totalQuantity += parseFloat(product.quantity) || 0;
        totalDiscount += parseFloat(discount) || 0;
        
        // Tối ưu hiển thị tên sản phẩm dài
        const productName = product.name.length > 40 ? 
            product.name.substring(0, 40) + '...' : product.name;
        
        detailHtml += `
            <tr>
                <td><small class="text-muted">${product.stt}</small></td>
                <td><code class="text-primary">${product.msp}</code></td>
                <td title="${product.name}"><small>${productName}</small></td>
                <td><small>${product.unit}</small></td>
                <td class="text-end"><small>${parseFloat(product.quantity).toLocaleString('vi-VN')}</small></td>
                <td class="text-end"><small>${window.formatCurrency(product.price)}</small></td>
                <td class="text-end ${discount > 0 ? 'text-danger' : 'text-muted'}"><small>${discountFormatted}</small></td>
                <td class="text-end"><small><strong>${window.formatCurrency(product.amount)}</strong></small></td>
            </tr>
        `;
    });
    
    // TỔNG HỢP CUỐI BẢNG
    detailHtml += `
                            </tbody>
                            <tfoot class="table-secondary" style="position: sticky; bottom: 0;">
                                <tr>
                                    <td colspan="4" class="text-end"><strong>Tổng cộng:</strong></td>
                                    <td class="text-end"><strong>${totalQuantity.toLocaleString('vi-VN')}</strong></td>
                                    <td></td>
                                    <td class="text-end"><strong class="text-danger">${window.formatCurrency(totalDiscount)}</strong></td>
                                    <td class="text-end"><strong class="text-primary">${window.formatCurrency(invoice.summary.calculatedTotal)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            <!-- NÚT THAO TÁC -->
            <div class="action-buttons mt-3 text-center">
                <button class="btn btn-outline-primary btn-sm me-2" onclick="printPurchaseInvoice('${invoiceId}')">
                    🖨️ In HĐ
                </button>
                ${(!invoice.status || !invoice.status.stockPosted) ? 
                `<button class="btn btn-success btn-sm me-2" onclick="createPurchaseReceipt('${invoiceId}')">
                    📦 Tạo Phiếu Nhập
                </button>` : ''}
                <button class="btn btn-warning btn-sm" onclick="editPurchaseInvoice('${invoiceId}')">
                    ✏️ Sửa HĐ
                </button>
            </div>
        </div>

        <style>
        .invoice-detail-compact {
            font-size: 0.9rem;
        }
        .info-item {
            display: flex;
            justify-content: between;
            margin-bottom: 8px;
            padding: 4px 0;
        }
        .info-item .label {
            font-weight: 600;
            color: #495057;
            min-width: 120px;
        }
        .info-item .value {
            color: #212529;
            flex: 1;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #eee;
        }
        .summary-item.total {
            grid-column: 1 / -1;
            background: #e7f3ff;
            margin: 5px -10px;
            padding: 8px 10px;
            border-radius: 4px;
            border-bottom: none;
        }
        .summary-label {
            font-weight: 500;
        }
        .summary-value {
            font-weight: 600;
        }
        .table th {
            font-size: 0.8rem;
            font-weight: 600;
            border-bottom: 2px solid #dee2e6;
            white-space: nowrap;
        }
        .table td {
            font-size: 0.8rem;
            vertical-align: middle;
            padding: 4px 8px;
        }
        .action-buttons .btn {
            min-width: 100px;
        }
        .sticky-top {
            position: sticky;
            top: 0;
            z-index: 10;
        }
        @media (max-width: 768px) {
            .summary-grid {
                grid-template-columns: 1fr;
            }
            .info-item {
                flex-direction: column;
            }
            .info-item .label {
                min-width: auto;
                margin-bottom: 2px;
            }
        }
        </style>
    `;
    
    window.showModal(`📄 ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`, detailHtml, 'modal-xl');
}

// =======================
// SỬA HÀM EDITPURCHASEINVOICE - THÊM CỘT CHIẾT KHẤU
// =======================
function editPurchaseInvoice(invoiceId) {
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

    console.log('🎯 Bắt đầu mở popup chỉnh sửa hóa đơn:', invoiceId);

    let editHtml = `
        <div class="invoice-edit-compact">
            <!-- HEADER THÔNG TIN CHÍNH -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <div>
                        <strong>📝 CHỈNH SỬA HÓA ĐƠN ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong>
                    </div>
                    <span class="badge ${invoice.status?.stockPosted ? 'bg-success' : 'bg-warning'}">
                        ${invoice.status?.stockPosted ? '✅ ĐÃ NHẬP KHO' : '⚠️ CHƯA NHẬP KHO'}
                    </span>
                </div>
                <div class="card-body p-3">
                    <!-- HÀNG 1: 3 ITEM CÙNG HÀNG -->
                    <div class="form-row-horizontal">
                        <div class="form-item">
                            <div class="form-icon">📋</div>
                            <div class="form-details">
                                <label class="form-label">Số HĐ</label>
                                <input type="text" class="form-control form-control-sm" id="edit-invoice-number" 
                                       value="${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}">
                            </div>
                        </div>
                        
                        <div class="form-item">
                            <div class="form-icon">📅</div>
                            <div class="form-details">
                                <label class="form-label">Ngày HĐ</label>
                                <input type="date" class="form-control form-control-sm" id="edit-invoice-date" 
                                       value="${invoice.invoiceInfo.date}">
                            </div>
                        </div>
                        
                        <div class="form-item">
                            <div class="form-icon">🔢</div>
                            <div class="form-details">
                                <label class="form-label">MST NCC</label>
                                <input type="text" class="form-control form-control-sm" id="edit-supplier-taxcode" 
                                       value="${invoice.sellerInfo.taxCode}">
                            </div>
                        </div>
                    </div>
                    
                    <!-- HÀNG 2: 1 ITEM FULL WIDTH -->
                    <div class="form-row-horizontal full-width">
                        <div class="form-item">
                            <div class="form-icon">🏢</div>
                            <div class="form-details flex-grow-1">
                                <label class="form-label">Nhà cung cấp</label>
                                <input type="text" class="form-control form-control-sm" id="edit-supplier-name" 
                                       value="${invoice.sellerInfo.name}">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TỔNG HỢP THANH TOÁN - 3 ITEM CÙNG HÀNG -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <strong>💰 TỔNG HỢP THANH TOÁN</strong>
                </div>
                <div class="card-body p-3">
                    <div class="form-row-horizontal">
                        <div class="amount-item">
                            <label class="amount-label">Tiền hàng</label>
                            <input type="number" class="form-control form-control-sm amount-input" id="edit-total-amount" 
                                   value="${invoice.summary.calculatedAmountAfterDiscount}" step="0.01" 
                                   oninput="calculateTotalPayment()">
                        </div>
                        
                        <div class="amount-item">
                            <label class="amount-label">Thuế GTGT</label>
                            <input type="number" class="form-control form-control-sm amount-input" id="edit-tax-amount" 
                                   value="${invoice.summary.calculatedTax}" step="0.01" 
                                   oninput="calculateTotalPayment()">
                        </div>
                        
                        <div class="amount-item">
                            <label class="amount-label total-label">Tổng thanh toán</label>
                            <input type="number" class="form-control form-control-sm amount-input total-input" id="edit-total-payment" 
                                   value="${invoice.summary.calculatedTotal}" step="0.01" readonly>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DANH SÁCH SẢN PHẨM -->
            <div class="card">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <strong>📦 DANH SÁCH HÀNG HÓA (${invoice.products.length} sản phẩm)</strong>
                    <button class="btn btn-success btn-sm" onclick="addNewProduct('${invoiceId}')">
                        ➕ Thêm dòng
                    </button>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 350px; overflow-y: auto;">
                        <table class="table table-sm table-hover mb-0">
                            <thead class="sticky-top" style="background: #f8f9fa;">
                                <tr>
                                    <th width="4%">STT</th>
                                    <th width="12%">MSP</th>
                                    <th width="22%">Tên hàng</th>
                                    <th width="8%">ĐVT</th>
                                    <th width="8%" class="text-end">SL</th>
                                    <th width="12%" class="text-end">Đơn giá</th>
                                    <th width="10%" class="text-end">Chiết khấu</th>
                                    <th width="12%" class="text-end">Thành tiền</th>
                                    <th width="8%" class="text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody id="edit-products-body">
    `;
    
    // Hiển thị các dòng sản phẩm
    invoice.products.forEach((product, index) => {
        const discount = product.discount || product.discountAmount || product.discountRate || 0;
        
        editHtml += `
            <tr id="product-row-${index}">
                <td class="text-center">
                    <small class="text-muted">${product.stt}</small>
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm compact-input" 
                           value="${product.msp}" 
                           onchange="updateProductField('${invoiceId}', ${index}, 'msp', this.value)"
                           placeholder="MSP">
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm compact-input" 
                           value="${product.name}" 
                           onchange="updateProductField('${invoiceId}', ${index}, 'name', this.value)"
                           placeholder="Tên hàng hóa">
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm compact-input" 
                           value="${product.unit}" 
                           onchange="updateProductField('${invoiceId}', ${index}, 'unit', this.value)"
                           placeholder="ĐVT">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm compact-input text-end" 
                           value="${product.quantity}" step="0.001" 
                           onchange="updateProductField('${invoiceId}', ${index}, 'quantity', this.value)">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm compact-input text-end" 
                           value="${product.price}" step="0.01" 
                           onchange="updateProductField('${invoiceId}', ${index}, 'price', this.value)">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm compact-input text-end" 
                           value="${discount}" step="0.01" 
                           onchange="updateProductField('${invoiceId}', ${index}, 'discount', this.value)">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm compact-input text-end" 
                           value="${product.amount}" step="0.01" 
                           onchange="updateProductField('${invoiceId}', ${index}, 'amount', this.value)">
                </td>
                <td class="text-center">
                    <button class="btn btn-outline-danger btn-xs" 
                            onclick="removeProduct('${invoiceId}', ${index})"
                            title="Xóa dòng">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    });
    
    editHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- THÔNG BÁO VÀ NÚT THAO TÁC -->
            <div class="alert alert-info mt-3 mb-2 py-2">
                <small>💡 <strong>Lưu ý:</strong> Thay đổi sẽ tự động cập nhật vào tồn kho nếu hóa đơn đã được nhập kho.</small>
            </div>

            <div class="action-buttons text-center pt-2">
                <button class="btn btn-primary btn-sm me-2" onclick="saveInvoiceChanges('${invoiceId}')">
                    💾 Lưu Thay Đổi
                </button>
                <button class="btn btn-secondary btn-sm" onclick="closeModal()">
                    ❌ Hủy
                </button>
            </div>
        </div>

        <style>
        .invoice-edit-compact {
            font-size: 0.85rem;
        }
        
        /* HORIZONTAL FORM LAYOUT - CÁC ITEM CÙNG HÀNG */
        .form-row-horizontal {
            display: flex;
            gap: 15px;
            align-items: flex-end;
            margin-bottom: 15px;
        }
        
        .form-row-horizontal.full-width {
            margin-bottom: 0;
        }
        
        .form-item {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            flex: 1;
            min-width: 0; /* Quan trọng để flex hoạt động */
        }
        
        .amount-item {
            flex: 1;
            text-align: center;
        }
        
        .form-icon {
            font-size: 1.3rem;
            padding-bottom: 6px;
            flex-shrink: 0;
        }
        
        .form-details {
            flex: 1;
            min-width: 0; /* Quan trọng để input không bị tràn */
        }
        
        .form-label {
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 4px;
            color: #495057;
            display: block;
            white-space: nowrap;
        }
        
        /* AMOUNT STYLES */
        .amount-label {
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 6px;
            color: #495057;
            display: block;
            white-space: nowrap;
        }
        
        .total-label {
            color: #dc3545;
            font-weight: 700;
        }
        
        .amount-input {
            text-align: right;
            font-weight: 600;
            font-size: 0.9rem;
            padding: 6px 8px;
        }
        
        .total-input {
            background-color: #fff3cd;
            border-color: #ffc107;
            color: #856404;
            font-weight: 700;
        }
        
        /* FORM CONTROLS */
        .form-control-sm {
            font-size: 0.8rem;
            padding: 4px 8px;
            height: 32px;
            width: 100%; /* Quan trọng để input chiếm full width */
        }
        
        .compact-input {
            font-size: 0.75rem;
            padding: 2px 4px;
            height: 28px;
            min-width: 60px;
        }
        
        /* TABLE STYLES */
        .table th {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 6px 4px;
            white-space: nowrap;
        }
        
        .table td {
            font-size: 0.75rem;
            padding: 4px 2px;
            vertical-align: middle;
        }
        
        .btn-xs {
            padding: 1px 4px;
            font-size: 0.7rem;
            line-height: 1.2;
        }
        
        .action-buttons .btn {
            min-width: 120px;
            font-size: 0.8rem;
        }
        
        .sticky-top {
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .text-end input {
            text-align: right;
        }
        
        /* RESPONSIVE */
        @media (max-width: 768px) {
            .invoice-edit-compact {
                font-size: 0.8rem;
            }
            
            .form-row-horizontal {
                flex-direction: column;
                gap: 10px;
            }
            
            .form-item {
                flex-direction: column;
                align-items: stretch;
                gap: 5px;
            }
            
            .form-icon {
                text-align: center;
                padding-bottom: 0;
            }
            
            .compact-input {
                font-size: 0.7rem;
                min-width: 50px;
            }
            
            .table-responsive {
                font-size: 0.7rem;
            }
            
            .amount-input {
                font-size: 0.8rem;
            }
        }
        </style>
    `;
    
    // KIỂM TRA HÀM showModal TỒN TẠI
    if (typeof window.showModal !== 'function') {
        console.error('❌ Hàm showModal không tồn tại');
        alert('❌ Lỗi: Không thể mở popup chỉnh sửa. Hàm showModal không tồn tại.');
        return;
    }
    
    try {
        window.showModal(`📝 ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`, editHtml, 'modal-xl');
        console.log('✅ Đã gọi hàm showModal thành công');
    } catch (error) {
        console.error('❌ Lỗi khi gọi showModal:', error);
        alert('❌ Lỗi khi mở popup chỉnh sửa: ' + error.message);
    }
}

// =======================
// SỬA HÀM UPDATEPRODUCTFIELD - XỬ LÝ CẬP NHẬT CHIẾT KHẤU
// =======================
function updateProductField(invoiceId, productIndex, field, value) {
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (invoice && invoice.products[productIndex]) {
        // Xử lý đặc biệt cho trường hợp chiết khấu
        if (field === 'discount') {
            // Lưu chiết khấu vào các trường có thể có trong XML
            invoice.products[productIndex].discount = parseFloat(value) || 0;
            invoice.products[productIndex].discountAmount = parseFloat(value) || 0;
        } else {
            invoice.products[productIndex][field] = value;
        }
        
        // Tự động tính toán thành tiền nếu thay đổi số lượng, đơn giá hoặc chiết khấu
        if (field === 'quantity' || field === 'price' || field === 'discount') {
            const quantity = parseFloat(invoice.products[productIndex].quantity) || 0;
            const price = parseFloat(invoice.products[productIndex].price) || 0;
            const discount = parseFloat(invoice.products[productIndex].discount) || 0;
            
            // Tính thành tiền: (số lượng * đơn giá) - chiết khấu
            invoice.products[productIndex].amount = (quantity * price - discount).toFixed(2);
            
            // Cập nhật giá trị trên form (cột thành tiền là cột thứ 8, index 7)
            const amountInput = document.querySelector(`#product-row-${productIndex} input[type="number"]:nth-child(8)`);
            if (amountInput) {
                amountInput.value = invoice.products[productIndex].amount;
            }
        }
        
        console.log(`✅ Đã cập nhật ${field} cho sản phẩm ${productIndex}:`, value);
    }
}

// =======================
// SỬA HÀM ADDNEWPRODUCT - THÊM CHIẾT KHẤU MẶC ĐỊNH
// =======================
function addNewProduct(invoiceId) {
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (invoice) {
        const newProduct = {
            stt: invoice.products.length + 1,
            msp: 'NEW',
            name: 'Sản phẩm mới',
            unit: 'cái',
            quantity: 1,
            price: 0,
            discount: 0,
            discountAmount: 0,
            amount: 0
        };
        
        invoice.products.push(newProduct);
        
        closeModal();
        setTimeout(() => {
            editPurchaseInvoice(invoiceId);
        }, 100);
        
        console.log('✅ Đã thêm sản phẩm mới với chiết khấu');
    }
}



// =======================
// CẬP NHẬT HÀM INITMUAHANGMODULE - THÊM CSS CHIẾT KHẤU
// =======================
function initMuaHangModule() {
    console.log('🔄 Đang khởi tạo module Mua Hàng...');
    
    // Kiểm tra hàm modal
    checkModalFunction();
    
    // Thêm CSS
    addProcessingModalStyles();
    addEditModalStyles();
    
    // Lắng nghe sự kiện xử lý hóa đơn mua hàng
    const processButton = document.getElementById('process-purchase-invoices');
    if (processButton) {
        processButton.addEventListener('click', processPurchaseInvoices);
        console.log('✅ Đã gắn sự kiện cho nút xử lý hóa đơn');
    } else {
        console.error('❌ Không tìm thấy nút process-purchase-invoices');
    }

    // Tải công nợ phải trả
    loadPayableList();
    
    console.log('✅ Module Mua Hàng đã khởi tạo xong');
}




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
window.viewPurchaseInvoiceDetail = viewPurchaseInvoiceDetail;
window.createPurchaseReceipt = createPurchaseReceipt;
window.printPurchaseInvoices = printPurchaseInvoices;
window.printPurchaseReceipts = printPurchaseReceipts;
window.printPurchaseLedger = printPurchaseLedger;

// =======================
// HÀM CHỈNH SỬA HÓA ĐƠN (ĐÃ SỬA LỖI)
// =======================

// =======================
// HÀM CHỈNH SỬA HÓA ĐƠN (ĐÃ SỬA LỖI HIỂN THỊ)
// =======================
// THÊM HÀM KIỂM TRA MODAL (nếu chưa có)
function checkModalFunction() {
    console.log('🔍 Kiểm tra hàm modal:');
    console.log('- showModal:', typeof window.showModal);
    console.log('- closeModal:', typeof window.closeModal);
    
    if (typeof window.showModal !== 'function') {
        console.error('❌ Hàm showModal không tồn tại, đang thêm fallback...');
        
        // Fallback modal đơn giản
        window.showModal = function(title, content, size = '') {
            const modalHtml = `
                <div id="custom-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 90%; overflow: auto; width: ${size === 'modal-xl' ? '1200px' : '800px'}">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; flex: 1;">${title}</h3>
                            <button onclick="closeModal()" style="background: none; border: none; font-size: 20px; cursor: pointer;">❌</button>
                        </div>
                        <div>${content}</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        };
        
        window.closeModal = function() {
            const modal = document.getElementById('custom-modal');
            if (modal) modal.remove();
        };
        
        console.log('✅ Đã thêm fallback modal');
    }
}



// Tính toán tổng thanh toán
function calculateTotalPayment() {
    const totalAmountInput = document.getElementById('edit-total-amount');
    const taxAmountInput = document.getElementById('edit-tax-amount');
    const totalPaymentInput = document.getElementById('edit-total-payment');
    
    if (!totalAmountInput || !taxAmountInput || !totalPaymentInput) {
        console.warn('⚠️ Không tìm thấy phần tử input để tính toán');
        return;
    }
    
    const totalAmount = parseFloat(totalAmountInput.value) || 0;
    const taxAmount = parseFloat(taxAmountInput.value) || 0;
    const totalPayment = totalAmount + taxAmount;
    
    totalPaymentInput.value = totalPayment.toFixed(2);
}



// Xóa sản phẩm
function removeProduct(invoiceId, productIndex) {
    if (!confirm('❌ Bạn có chắc muốn xóa sản phẩm này?')) {
        return;
    }
    
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (invoice && invoice.products[productIndex]) {
        invoice.products.splice(productIndex, 1);
        
        // Cập nhật lại STT
        invoice.products.forEach((product, index) => {
            product.stt = index + 1;
        });
        
        // Đóng và mở lại popup để refresh dữ liệu
        closeModal();
        setTimeout(() => {
            editPurchaseInvoice(invoiceId);
        }, 100);
        
        console.log(`✅ Đã xóa sản phẩm ${productIndex}`);
    }
}



// Lưu thay đổi hóa đơn
function saveInvoiceChanges(invoiceId) {
    if (!window.currentCompany || !window.hkdData) {
        alert('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('❌ Không tìm thấy hóa đơn');
        return;
    }

    // Cập nhật thông tin cơ bản
    const invoiceNumberInput = document.getElementById('edit-invoice-number');
    const invoiceDateInput = document.getElementById('edit-invoice-date');
    const supplierNameInput = document.getElementById('edit-supplier-name');
    const supplierTaxCodeInput = document.getElementById('edit-supplier-taxcode');
    
    if (invoiceNumberInput) {
        const invoiceNumber = invoiceNumberInput.value;
        const numberParts = invoiceNumber.split('/');
        if (numberParts.length === 2) {
            invoice.invoiceInfo.symbol = numberParts[0];
            invoice.invoiceInfo.number = numberParts[1];
        }
    }
    
    if (invoiceDateInput) {
        invoice.invoiceInfo.date = invoiceDateInput.value;
    }
    
    if (supplierNameInput) {
        invoice.sellerInfo.name = supplierNameInput.value;
    }
    
    if (supplierTaxCodeInput) {
        invoice.sellerInfo.taxCode = supplierTaxCodeInput.value;
    }
    
    // Cập nhật tổng hợp
    const totalAmountInput = document.getElementById('edit-total-amount');
    const taxAmountInput = document.getElementById('edit-tax-amount');
    const totalPaymentInput = document.getElementById('edit-total-payment');
    
    if (totalAmountInput) {
        invoice.summary.calculatedAmountAfterDiscount = parseFloat(totalAmountInput.value) || 0;
    }
    
    if (taxAmountInput) {
        invoice.summary.calculatedTax = parseFloat(taxAmountInput.value) || 0;
    }
    
    if (totalPaymentInput) {
        invoice.summary.calculatedTotal = parseFloat(totalPaymentInput.value) || 0;
    }

    // Cập nhật tồn kho nếu hóa đơn đã được nhập kho
    if (invoice.status && invoice.status.stockPosted) {
        updateStockAfterInvoiceEdit(invoice);
    }

    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }

    // Đóng popup
    closeModal();
    
    if (typeof window.renderStock === 'function') window.renderStock();
    
    alert('✅ Đã lưu thay đổi thành công!');
    console.log('💾 Đã lưu thay đổi hóa đơn:', invoiceId);
}

// Cập nhật tồn kho sau khi chỉnh sửa hóa đơn
function updateStockAfterInvoiceEdit(updatedInvoice) {
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    
    if (!hkd.tonkhoMain) {
        hkd.tonkhoMain = [];
    }

    // Xóa các sản phẩm cũ của hóa đơn này khỏi tồn kho
    hkd.tonkhoMain = hkd.tonkhoMain.filter(item => 
        !item.sourceInvoiceId || item.sourceInvoiceId !== updatedInvoice.originalFileId
    );

    // Thêm lại các sản phẩm mới vào tồn kho
    updatedInvoice.products.forEach(product => {
        const existingProduct = hkd.tonkhoMain.find(p => 
            p.msp === product.msp && p.sourceInvoiceId === updatedInvoice.originalFileId
        );

        if (existingProduct) {
            // Cập nhật sản phẩm tồn tại
            existingProduct.quantity = product.quantity;
            existingProduct.price = product.price;
            existingProduct.amount = product.amount;
            existingProduct.name = product.name;
            existingProduct.unit = product.unit;
        } else {
            // Thêm sản phẩm mới
            hkd.tonkhoMain.push({
                msp: product.msp,
                name: product.name,
                unit: product.unit,
                quantity: product.quantity,
                price: product.price,
                amount: product.amount,
                source: 'PURCHASE',
                sourceInvoiceId: updatedInvoice.originalFileId,
                sourceInvoiceNumber: `${updatedInvoice.invoiceInfo.symbol}/${updatedInvoice.invoiceInfo.number}`,
                supplier: updatedInvoice.sellerInfo.name,
                importDate: updatedInvoice.invoiceInfo.date
            });
        }
    });

    console.log('📦 Đã cập nhật tồn kho sau chỉnh sửa hóa đơn');
}


// =======================
// THÊM CSS CHO POPUP CHỈNH SỬA
// =======================

function addEditModalStyles() {
    const styles = `
        <style>
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            font-weight: bold;
            margin-bottom: 5px;
            display: block;
        }
        
        .form-control {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px 12px;
            width: 100%;
        }
        
        .form-control-sm {
            padding: 4px 8px;
            font-size: 12px;
        }
        
        .button-group-small .btn-sm {
            margin: 2px;
            padding: 4px 8px;
            font-size: 12px;
        }
        
        .table input.form-control-sm {
            border: 1px solid #ccc;
        }
        
        .table input.form-control-sm:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}



// Export các hàm mới
window.editPurchaseInvoice = editPurchaseInvoice;
window.updateProductField = updateProductField;
window.removeProduct = removeProduct;
window.addNewProduct = addNewProduct;
window.saveInvoiceChanges = saveInvoiceChanges;
window.calculateTotalPayment = calculateTotalPayment;