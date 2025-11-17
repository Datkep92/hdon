function initKhoHangModule() {
    // Xóa tất cả cảnh báo cũ trước khi khởi tạo mới
    const existingAlerts = document.querySelectorAll('.stock-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const searchInput = document.getElementById('search-products');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function(event) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                showAllProducts = false;
                const useDateFilter = !!(currentStockDateStart && currentStockDateEnd);
                loadProductCatalog(event.target.value, useDateFilter);
            }, 300);
        });
    }

    // Sự kiện cho bộ lọc ngày
    const dateFilterStart = document.getElementById('stock-date-start');
    const dateFilterEnd = document.getElementById('stock-date-end');
    const applyDateFilter = document.getElementById('apply-date-filter');
    const clearDateFilter = document.getElementById('clear-date-filter');

    if (applyDateFilter) {
        applyDateFilter.addEventListener('click', function() {
            const selectedStartDate = dateFilterStart.value;
            const selectedEndDate = dateFilterEnd.value;
            
            if (!selectedStartDate || !selectedEndDate) {
                alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc');
                return;
            }
            
            if (new Date(selectedStartDate) > new Date(selectedEndDate)) {
                alert('Ngày bắt đầu không thể lớn hơn ngày kết thúc');
                return;
            }
            
            currentStockDateStart = selectedStartDate;
            currentStockDateEnd = selectedEndDate;
            loadProductCatalog('', true);
        });
    }

    if (clearDateFilter) {
        clearDateFilter.addEventListener('click', function() {
            currentStockDateStart = null;
            currentStockDateEnd = null;
            if (dateFilterStart) dateFilterStart.value = '';
            if (dateFilterEnd) dateFilterEnd.value = '';
            loadProductCatalog('', false);
        });
    }

    const generateReportButton = document.getElementById('generate-stock-report');
    if (generateReportButton) {
        generateReportButton.addEventListener('click', generateStockReport);
    }

    // Tải danh mục hàng hóa
    loadProductCatalog();
    
    // Tải thẻ kho
    loadStockCards();
    
    // Khởi tạo các tính năng mở rộng - CHỈ GỌI KHI CÓ CÔNG TY
    if (window.currentCompany && window.hkdData[window.currentCompany]) {
        initStockAlerts();
        initDemandForecast();
        initWarehousePerformance();
        initSmartSearch();
     } else {
        console.log('Skipping extended features - no company selected'); // Debug log
    }
    
    console.log('=== END INIT KHO HANG ==='); // Debug log
}
// Khi chuyển công ty, gọi hàm này để reset tab kho hàng
function resetKhoHangTab() {
    // Xóa cảnh báo cũ
    const existingAlerts = document.querySelectorAll('.stock-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Reset các biến
    showAllProducts = false;
    currentStockDateStart = null;
    currentStockDateEnd = null;
    
    // Nếu đang ở tab kho hàng, reload lại
    const khoHangTab = document.getElementById('kho-hang');
    if (khoHangTab && khoHangTab.style.display !== 'none') {
        initKhoHangModule();
    }
}

// Gọi hàm này khi chuyển công ty
// Ví dụ: trong hàm changeCompany của bạn, thêm:
// resetKhoHangTab();
let showAllProducts = false;
let currentStockDate = null; // Ngày lọc tồn kho
let currentStockDateStart = null; // Ngày bắt đầu lọc tồn kho
let currentStockDateEnd = null;   // Ngày kết thúc lọc tồn kho
/**
 * Hàm tổng hợp tồn kho theo khoảng thời gian cụ thể
 */
function calculateMonthlyAverage(monthlyData) {
    if (!monthlyData || Object.keys(monthlyData).length === 0) return 1;
    
    const values = Object.values(monthlyData);
    return values.reduce((a, b) => a + b, 0) / values.length;
}
function generatePerformanceReport() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        alert('Vui lòng chọn công ty');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const stockItems = Object.values(aggregatedStock).filter(item => item.category === 'hang_hoa');
    
    const totalSKU = stockItems.length;
    const lowStockSKU = stockItems.filter(item => item.quantity <= 10 && item.quantity > 0).length;
    const outOfStockSKU = stockItems.filter(item => item.quantity === 0).length;
    const totalValue = stockItems.reduce((sum, item) => sum + item.totalAmount, 0);
    
    const modalContent = `
        <div class="card">
            <div class="card-header">
                <h4>📊 Báo Cáo Hiệu Suất Kho</h4>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #28a745;">${totalSKU}</div>
                        <div style="font-size: 12px;">Tổng SKU</div>
                    </div>
                    <div style="background: #fff3cd; padding: 15px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${lowStockSKU}</div>
                        <div style="font-size: 12px;">SKU sắp hết</div>
                    </div>
                    <div style="background: #f8d7da; padding: 15px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${outOfStockSKU}</div>
                        <div style="font-size: 12px;">SKU hết hàng</div>
                    </div>
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #2196f3;">${safeFormatCurrency(totalValue)}</div>
                        <div style="font-size: 12px;">Tổng giá trị</div>
                    </div>
                </div>
                
                <h5>Top 5 Sản Phẩm Giá Trị Cao Nhất</h5>
                <table class="table table-striped" style="font-size: 12px;">
                    <thead>
                        <tr>
                            <th>MSP</th>
                            <th>Tên sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Giá trị</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stockItems
                            .sort((a, b) => b.totalAmount - a.totalAmount)
                            .slice(0, 5)
                            .map(item => `
                                <tr>
                                    <td>${item.msp}</td>
                                    <td>${item.name}</td>
                                    <td style="text-align: right;">${item.quantity.toLocaleString('vi-VN')}</td>
                                    <td style="text-align: right;">${safeFormatCurrency(item.totalAmount)}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-primary" onclick="printPerformanceReport()">🖨️ In Báo Cáo Đầy Đủ</button>
            <button class="btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Đóng</button>
        </div>
    `;

    window.showModal('Báo Cáo Hiệu Suất Kho', modalContent, 'modal-lg');
}

function printPerformanceReport() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        alert('Vui lòng chọn công ty');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const stockItems = Object.values(aggregatedStock).filter(item => item.category === 'hang_hoa');
    
    // Tính toán các chỉ số hiệu suất
    const totalSKU = stockItems.length;
    const lowStockSKU = stockItems.filter(item => item.quantity <= 10 && item.quantity > 0).length;
    const outOfStockSKU = stockItems.filter(item => item.quantity === 0).length;
    const totalValue = stockItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalQuantity = stockItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Tính tỷ lệ xoay vòng kho (Inventory Turnover)
    const costOfGoodsSold = calculateCOGS(hkd);
    const avgInventoryValue = totalValue / 2;
    const turnoverRate = avgInventoryValue > 0 ? (costOfGoodsSold / avgInventoryValue).toFixed(2) : 0;
    
    // Top sản phẩm giá trị cao nhất
    const topValueProducts = stockItems
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10);
    
    // Sản phẩm sắp hết hàng
    const lowStockProducts = stockItems
        .filter(item => item.quantity > 0 && item.quantity <= 10)
        .sort((a, b) => a.quantity - b.quantity);
    
    // Sản phẩm không có tồn kho
    const zeroStockProducts = stockItems
        .filter(item => item.quantity === 0);

    // Tạo nội dung in
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Báo Cáo Hiệu Suất Kho</title>
            <style>
                body { 
                    font-family: 'Times New Roman', Times, serif; 
                    font-size: 12px; 
                    margin: 20px; 
                    line-height: 1.4;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 20px; 
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 18px; 
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .header h2 {
                    margin: 5px 0;
                    font-size: 14px;
                    font-weight: normal;
                }
                .summary-grid { 
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin: 15px 0;
                }
                .summary-card {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: center;
                    border-radius: 4px;
                }
                .summary-value {
                    font-size: 16px;
                    font-weight: bold;
                    margin: 5px 0;
                }
                .summary-label {
                    font-size: 10px;
                    color: #666;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 10px 0;
                    page-break-inside: auto;
                }
                th, td { 
                    border: 1px solid #000; 
                    padding: 6px; 
                    text-align: center; 
                    font-size: 10px;
                }
                th { 
                    background-color: #f0f0f0; 
                    font-weight: bold; 
                }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .text-center { text-align: center; }
                .section {
                    margin: 20px 0;
                    page-break-inside: avoid;
                }
                .section-title {
                    background: #f8f9fa;
                    padding: 8px;
                    font-weight: bold;
                    border-left: 4px solid #007bff;
                    margin-bottom: 10px;
                }
                .footer {
                    margin-top: 30px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                }
                .page-break {
                    page-break-after: always;
                }
                @media print {
                    body { margin: 15px; }
                    .no-print { display: none; }
                    .page-break { page-break-after: always; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CÔNG TY TNHH HKD</h1>
                <h2>BÁO CÁO HIỆU SUẤT KHO</h2>
                <h3>Ngày báo cáo: ${new Date().toLocaleDateString('vi-VN')}</h3>
            </div>

            <!-- Tổng quan hiệu suất -->
            <div class="section">
                <div class="section-title">📊 TỔNG QUAN HIỆU SUẤT</div>
                <div class="summary-grid">
                    <div class="summary-card" style="background: #e8f5e8;">
                        <div class="summary-value">${totalSKU}</div>
                        <div class="summary-label">Tổng SKU</div>
                    </div>
                    <div class="summary-card" style="background: #fff3cd;">
                        <div class="summary-value">${lowStockSKU}</div>
                        <div class="summary-label">SKU sắp hết</div>
                    </div>
                    <div class="summary-card" style="background: #f8d7da;">
                        <div class="summary-value">${outOfStockSKU}</div>
                        <div class="summary-label">SKU hết hàng</div>
                    </div>
                    <div class="summary-card" style="background: #e3f2fd;">
                        <div class="summary-value">${turnoverRate}</div>
                        <div class="summary-label">Tỷ lệ xoay vòng</div>
                    </div>
                </div>
                <div class="summary-grid">
                    <div class="summary-card" style="background: #f3e5f5;">
                        <div class="summary-value">${totalQuantity.toLocaleString('vi-VN')}</div>
                        <div class="summary-label">Tổng số lượng</div>
                    </div>
                    <div class="summary-card" style="background: #e0f2f1;">
                        <div class="summary-value">${safeFormatCurrency(totalValue)}</div>
                        <div class="summary-label">Tổng giá trị</div>
                    </div>
                    <div class="summary-card" style="background: #fbe9e7;">
                        <div class="summary-value">${safeFormatCurrency(costOfGoodsSold)}</div>
                        <div class="summary-label">Giá vốn hàng bán</div>
                    </div>
                    <div class="summary-card" style="background: #e8eaf6;">
                        <div class="summary-value">${((lowStockSKU / totalSKU) * 100).toFixed(1)}%</div>
                        <div class="summary-label">Tỷ lệ SKU sắp hết</div>
                    </div>
                </div>
            </div>

            <!-- Top sản phẩm giá trị cao -->
            <div class="section">
                <div class="section-title">🏆 TOP 10 SẢN PHẨM GIÁ TRỊ CAO NHẤT</div>
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>MSP</th>
                            <th>Tên sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                            <th>Tỷ trọng</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topValueProducts.map((product, index) => {
                            const percentage = totalValue > 0 ? (product.totalAmount / totalValue * 100).toFixed(1) : 0;
                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td class="text-left">${product.msp}</td>
                                    <td class="text-left">${product.name}</td>
                                    <td class="text-right">${product.quantity.toLocaleString('vi-VN')}</td>
                                    <td class="text-right">${safeFormatCurrency(product.avgPrice)}</td>
                                    <td class="text-right">${safeFormatCurrency(product.totalAmount)}</td>
                                    <td class="text-right">${percentage}%</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Cảnh báo sắp hết hàng -->
            ${lowStockProducts.length > 0 ? `
            <div class="section">
                <div class="section-title">⚠️ CẢNH BÁO SẮP HẾT HÀNG</div>
                <table>
                    <thead>
                        <tr>
                            <th>MSP</th>
                            <th>Tên sản phẩm</th>
                            <th>Số lượng tồn</th>
                            <th>Đơn vị</th>
                            <th>Giá trị</th>
                            <th>Mức độ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lowStockProducts.map(product => {
                            let level = 'CAO';
                            let color = '#dc3545';
                            if (product.quantity > 5) {
                                level = 'TRUNG BÌNH';
                                color = '#ffc107';
                            } else if (product.quantity > 2) {
                                level = 'THẤP';
                                color = '#fd7e14';
                            }
                            return `
                                <tr>
                                    <td class="text-left">${product.msp}</td>
                                    <td class="text-left">${product.name}</td>
                                    <td class="text-right" style="color: ${color}; font-weight: bold;">${product.quantity}</td>
                                    <td>${product.unit}</td>
                                    <td class="text-right">${safeFormatCurrency(product.totalAmount)}</td>
                                    <td style="color: ${color}; font-weight: bold;">${level}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <!-- Sản phẩm hết hàng -->
            ${zeroStockProducts.length > 0 ? `
            <div class="section">
                <div class="section-title">❌ SẢN PHẨM HẾT HÀNG</div>
                <table>
                    <thead>
                        <tr>
                            <th>MSP</th>
                            <th>Tên sản phẩm</th>
                            <th>Đơn vị</th>
                            <th>Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${zeroStockProducts.map(product => `
                            <tr>
                                <td class="text-left">${product.msp}</td>
                                <td class="text-left">${product.name}</td>
                                <td>${product.unit}</td>
                                <td class="text-left" style="color: #dc3545;">Cần nhập hàng ngay</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <!-- Phân tích ABC -->
            <div class="section">
                <div class="section-title">🔍 PHÂN TÍCH ABC HÀNG TỒN KHO</div>
                <table>
                    <thead>
                        <tr>
                            <th>Nhóm</th>
                            <th>Mô tả</th>
                            <th>Số SKU</th>
                            <th>Tỷ lệ SKU</th>
                            <th>Giá trị</th>
                            <th>Tỷ lệ giá trị</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${calculateABCAnalysis(stockItems).map(group => `
                            <tr>
                                <td class="text-center" style="font-weight: bold;">${group.group}</td>
                                <td class="text-left">${group.description}</td>
                                <td class="text-right">${group.skuCount}</td>
                                <td class="text-right">${group.skuPercentage}%</td>
                                <td class="text-right">${safeFormatCurrency(group.value)}</td>
                                <td class="text-right">${group.valuePercentage}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Đề xuất -->
            <div class="section">
                <div class="section-title">💡 ĐỀ XUẤT & KHUYẾN NGHỊ</div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; font-size: 11px;">
                    ${generateRecommendations(stockItems, lowStockProducts.length, zeroStockProducts.length, turnoverRate)}
                </div>
            </div>

            <div class="footer">
                <div>
                    <p>Người lập báo cáo</p>
                    <p style="margin-top: 40px;">(Ký, ghi rõ họ tên)</p>
                </div>
                <div>
                    <p>Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
                    <p style="margin-top: 40px;">Trưởng phòng kho vận</p>
                    <p style="margin-top: 40px;">(Ký, ghi rõ họ tên)</p>
                </div>
            </div>

            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print();" style="padding: 10px 20px; font-size: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">🖨️ In Báo Cáo</button>
                <button onclick="window.close();" style="padding: 10px 20px; font-size: 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">❌ Đóng</button>
            </div>
        </body>
        </html>
    `;

    // Mở cửa sổ in
    const printWindow = window.open('', '_blank', 'width=1200,height=700');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
  
}
// Tính giá vốn hàng bán (Cost of Goods Sold)
function calculateCOGS(hkd) {
    let totalCOGS = 0;
    
    // Tính từ các phiếu xuất hàng
    (hkd.exports || []).forEach(exportRecord => {
        exportRecord.products.forEach(item => {
            const quantity = parseFloat(item.quantity) || 0;
            const costPrice = parseFloat(item.costPrice) || parseFloat(item.price) * 0.7; // Giả định giá vốn = 70% giá bán
            totalCOGS += quantity * costPrice;
        });
    });
    
    // Tính tổng giá trị tồn kho để fallback
    const aggregatedStock = getAggregatedStock(hkd);
    const stockItems = Object.values(aggregatedStock).filter(item => item.category === 'hang_hoa');
    const totalValue = stockItems.reduce((sum, item) => sum + item.totalAmount, 0);
    
    return totalCOGS > 0 ? totalCOGS : totalValue * 0.6; // Fallback: 60% tổng giá trị tồn kho
}

// Phân tích ABC hàng tồn kho
function calculateABCAnalysis(stockItems) {
    // Sắp xếp theo giá trị giảm dần
    const sortedItems = [...stockItems].sort((a, b) => b.totalAmount - a.totalAmount);
    const totalValue = sortedItems.reduce((sum, item) => sum + item.totalAmount, 0);
    
    let cumulativeValue = 0;
    const groups = [
        { group: 'A', description: 'Hàng giá trị cao - Quản lý chặt chẽ', skuCount: 0, value: 0, skuPercentage: 0, valuePercentage: 0 },
        { group: 'B', description: 'Hàng giá trị trung bình - Quản lý thông thường', skuCount: 0, value: 0, skuPercentage: 0, valuePercentage: 0 },
        { group: 'C', description: 'Hàng giá trị thấp - Quản lý đơn giản', skuCount: 0, value: 0, skuPercentage: 0, valuePercentage: 0 }
    ];
    
    sortedItems.forEach((item, index) => {
        cumulativeValue += item.totalAmount;
        const cumulativePercentage = (cumulativeValue / totalValue) * 100;
        
        if (cumulativePercentage <= 80) {
            groups[0].skuCount++;
            groups[0].value += item.totalAmount;
        } else if (cumulativePercentage <= 95) {
            groups[1].skuCount++;
            groups[1].value += item.totalAmount;
        } else {
            groups[2].skuCount++;
            groups[2].value += item.totalAmount;
        }
    });
    
    // Tính tỷ lệ phần trăm
    const totalSKU = sortedItems.length;
    groups.forEach(group => {
        group.skuPercentage = totalSKU > 0 ? ((group.skuCount / totalSKU) * 100).toFixed(1) : 0;
        group.valuePercentage = totalValue > 0 ? ((group.value / totalValue) * 100).toFixed(1) : 0;
    });
    
    return groups;
}

// Tạo đề xuất và khuyến nghị
function generateRecommendations(stockItems, lowStockCount, zeroStockCount, turnoverRate) {
    const totalSKU = stockItems.length;
    const recommendations = [];
    
    // Đánh giá tỷ lệ xoay vòng
    if (turnoverRate < 2) {
        recommendations.push("• <strong>Tỷ lệ xoay vòng thấp</strong>: Cần xem xét giảm mức tồn kho hoặc tăng doanh số bán hàng");
    } else if (turnoverRate > 8) {
        recommendations.push("• <strong>Tỷ lệ xoay vòng cao</strong>: Quản lý kho hiệu quả, tiếp tục duy trì");
    } else {
        recommendations.push("• <strong>Tỷ lệ xoay vòng ổn định</strong>: Mức độ quản lý kho phù hợp");
    }
    
    // Đánh giá SKU sắp hết hàng
    if (lowStockCount > 0) {
        const percentage = (lowStockCount / totalSKU * 100).toFixed(1);
        recommendations.push(`• <strong>${lowStockCount} SKU sắp hết hàng</strong> (${percentage}%): Cần lập kế hoạch nhập hàng ngay`);
    }
    
    // Đánh giá SKU hết hàng
    if (zeroStockCount > 0) {
        recommendations.push(`• <strong>${zeroStockCount} SKU đã hết hàng</strong>: Ưu tiên nhập hàng khẩn cấp`);
    }
    
    // Đánh giá tập trung giá trị
    const abcAnalysis = calculateABCAnalysis(stockItems);
    const groupA = abcAnalysis.find(g => g.group === 'A');
    if (groupA && groupA.valuePercentage > 70) {
        recommendations.push("• <strong>Tập trung giá trị cao vào nhóm A</strong>: Quản lý chặt chẽ nhóm hàng này");
    }
    
    // Đề xuất chung
    recommendations.push("• <strong>Kiểm kê định kỳ</strong>: Thực hiện kiểm kê ít nhất 1 lần/tháng");
    recommendations.push("• <strong>Thiết lập mức tồn kho tối thiểu</strong>: Để cảnh báo kịp thời khi sắp hết hàng");
    recommendations.push("• <strong>Phân tích xu hướng tiêu thụ</strong>: Để dự báo nhu cầu chính xác hơn");
    
    return recommendations.map(rec => `<p style="margin: 5px 0;">${rec}</p>`).join('');
}
function displayForecastResults(results) {
    const resultElement = document.getElementById('forecast-result');
    
    if (results.length === 0) {
        resultElement.innerHTML = '<p style="color: #666; text-align: center;">Không có dữ liệu để dự báo</p>';
        return;
    }
    
    let html = `
        <div style="max-height: 300px; overflow-y: auto;">
            <table class="table table-striped" style="font-size: 12px;">
                <thead>
                    <tr>
                        <th>MSP</th>
                        <th>Sản phẩm</th>
                        <th>Tồn hiện tại</th>
                        <th>Xuất TB/tháng</th>
                        <th>Dự báo ${document.getElementById('forecast-months').value} tháng</th>
                        <th>Số tuần tồn</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    results.forEach(item => {
        let statusClass = 'badge-success';
        if (item.status === 'CẦN NHẬP') statusClass = 'badge-danger';
        else if (item.status === 'THEO DÕI') statusClass = 'badge-warning';
        
        html += `
            <tr>
                <td><strong>${item.msp}</strong></td>
                <td>${item.name}</td>
                <td style="text-align: right;">${item.currentStock.toLocaleString('vi-VN')}</td>
                <td style="text-align: right;">${item.monthlyAvg.toFixed(1)}</td>
                <td style="text-align: right;">${item.forecast.toFixed(1)}</td>
                <td style="text-align: right;">${item.weeksOfSupply.toFixed(1)}</td>
                <td><span class="badge ${statusClass}">${item.status}</span></td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    resultElement.innerHTML = html;
}
function getAggregatedStockByDateRange(startDate = null, endDate = null) {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        return {};
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = {};
    
    // Hàm lấy thông tin hóa đơn
    function getInvoiceInfo(invoice) {
        if (invoice.invoiceInfo) {
            return {
                date: invoice.invoiceInfo.date || '',
                number: invoice.invoiceInfo.number || '',
                symbol: invoice.invoiceInfo.symbol || ''
            };
        }
        return {
            date: invoice.date || '',
            number: invoice.invNumber || invoice.invoiceNumber || '',
            symbol: ''
        };
    }

    // Giao dịch NHẬP từ hóa đơn (chỉ lấy trong khoảng thời gian)
    (hkd.invoices || []).forEach(invoice => {
        const invoiceInfo = getInvoiceInfo(invoice);
        const invoiceDate = invoiceInfo.date;
        
        // Nếu có khoảng thời gian, chỉ lấy hóa đơn trong khoảng
        if (startDate && new Date(invoiceDate) < new Date(startDate)) {
            return;
        }
        if (endDate && new Date(invoiceDate) > new Date(endDate)) {
            return;
        }
        
        invoice.products.filter(product => product.category === 'hang_hoa').forEach(item => {
            if (!aggregatedStock[item.msp]) {
                aggregatedStock[item.msp] = {
                    msp: item.msp,
                    name: item.name || 'Không có tên',
                    unit: item.unit || 'cái',
                    quantity: 0,
                    totalAmount: 0,
                    avgPrice: 0,
                    category: item.category || 'hang_hoa'
                };
            }
            
            const quantity = parseFloat(item.quantity) || 0;
            const amount = parseFloat(item.amount) || 0;
            
            aggregatedStock[item.msp].quantity += quantity;
            aggregatedStock[item.msp].totalAmount += amount;
        });
    });

    // Giao dịch XUẤT từ phiếu xuất (chỉ lấy trong khoảng thời gian)
    (hkd.exports || []).forEach(exportRecord => {
        const exportDate = exportRecord.date || new Date().toISOString().substring(0, 10);
        
        // Nếu có khoảng thời gian, chỉ lấy phiếu xuất trong khoảng
        if (startDate && new Date(exportDate) < new Date(startDate)) {
            return;
        }
        if (endDate && new Date(exportDate) > new Date(endDate)) {
            return;
        }
        
        exportRecord.products.forEach(item => {
            if (!aggregatedStock[item.msp]) {
                aggregatedStock[item.msp] = {
                    msp: item.msp,
                    name: item.name || 'Không có tên',
                    unit: item.unit || 'cái',
                    quantity: 0,
                    totalAmount: 0,
                    avgPrice: 0,
                    category: 'hang_hoa'
                };
            }
            
            const quantity = -(parseFloat(item.quantity) || 0);
            const amount = -(parseFloat(item.amount) || 0);
            
            aggregatedStock[item.msp].quantity += quantity;
            aggregatedStock[item.msp].totalAmount += amount;
        });
    });

    // Giao dịch ĐIỀU CHỈNH (chỉ lấy trong khoảng thời gian)
    (hkd.tonkhoMain || []).filter(product => product.type === 'ADJUSTMENT').forEach(adjustment => {
        const adjustmentDate = adjustment.date || new Date().toISOString().substring(0, 10);
        
        // Nếu có khoảng thời gian, chỉ lấy điều chỉnh trong khoảng
        if (startDate && new Date(adjustmentDate) < new Date(startDate)) {
            return;
        }
        if (endDate && new Date(adjustmentDate) > new Date(endDate)) {
            return;
        }
        
        if (!aggregatedStock[adjustment.msp]) {
            aggregatedStock[adjustment.msp] = {
                msp: adjustment.msp,
                name: adjustment.name || 'Không có tên',
                unit: adjustment.unit || 'cái',
                quantity: 0,
                totalAmount: 0,
                avgPrice: 0,
                category: adjustment.category || 'hang_hoa'
            };
        }
        
        const quantity = parseFloat(adjustment.quantity) || 0;
        const amount = parseFloat(adjustment.amount) || 0;
        
        aggregatedStock[adjustment.msp].quantity += quantity;
        aggregatedStock[adjustment.msp].totalAmount += amount;
    });

    // Tính giá trung bình
    Object.values(aggregatedStock).forEach(product => {
        if (product.quantity > 0 && product.category === 'hang_hoa') {
            product.avgPrice = Math.abs(product.totalAmount) / product.quantity;
        } else {
            product.avgPrice = 0;
        }
    });

    return aggregatedStock;
}
function loadProductCatalog(searchTerm = '', useDateFilter = false) {
    const productList = document.getElementById('product-catalog-list');
    if (!productList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        updateCatalogHeader(0, 0, 0);
        return;
    }

    // Sử dụng hàm tổng hợp theo khoảng ngày nếu có filter
    const aggregatedStock = useDateFilter && currentStockDateStart && currentStockDateEnd 
        ? getAggregatedStockByDateRange(currentStockDateStart, currentStockDateEnd)
        : getAggregatedStock();

    const stockItems = Object.values(aggregatedStock);

    productList.innerHTML = '';

    if (stockItems.length === 0) {
        const message = useDateFilter && currentStockDateStart && currentStockDateEnd 
            ? `Không có dữ liệu tồn kho từ ${safeFormatDate(currentStockDateStart)} đến ${safeFormatDate(currentStockDateEnd)}`
            : 'Chưa có dữ liệu hàng hóa';
        productList.innerHTML = `<tr><td colspan="7" style="text-align: center;">${message}</td></tr>`;
        updateCatalogHeader(0, 0, 0);
        return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    let filteredItems = stockItems;

    if (searchTerm) {
        filteredItems = stockItems.filter(item => 
            item.msp.toLowerCase().includes(lowerSearchTerm) ||
            item.name.toLowerCase().includes(lowerSearchTerm)
        );
        showAllProducts = false;
    }

    if (filteredItems.length === 0) {
        productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không tìm thấy sản phẩm phù hợp</td></tr>';
        updateCatalogHeader(0, 0, 0);
        return;
    }

    // Tính tổng số lượng và giá trị
    const totalQuantity = filteredItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    // Hiển thị sản phẩm (10 hoặc toàn bộ)
    const displayedItems = showAllProducts ? filteredItems : filteredItems.slice(0, 10);

    displayedItems.forEach((product, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <a href="javascript:void(0)" onclick="viewStockCard('${product.msp}')" 
                   style="color: #007bff; text-decoration: none; font-weight: bold; cursor: pointer;"
                   title="Click để xem thẻ kho">
                   ${product.msp}
                </a>
            </td>
            <td>${product.name}</td>
            <td>${product.unit}</td>
            <td style="text-align: right;">${product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
            <td style="text-align: right;">${safeFormatCurrency(product.avgPrice)}</td>
            <td style="text-align: right;">${safeFormatCurrency(product.totalAmount)}</td>
            <td>
                <button class="btn-sm btn-warning" onclick="adjustStock('${product.msp}')">Điều chỉnh</button>
            </td>
        `;
        
        productList.appendChild(row);
    });

    // Cập nhật thông tin tổng cộng và điều khiển
    updateCatalogHeader(totalQuantity, totalValue, filteredItems.length, useDateFilter);
    updateCatalogControls(filteredItems.length, displayedItems.length);
}

/**
 * Cập nhật thông tin tổng cộng trong header
 */
function updateCatalogHeader(totalQuantity, totalValue, totalProducts, useDateFilter = false) {
    const summaryElement = document.getElementById('catalog-summary');
    const statusElement = document.getElementById('date-filter-status');
    
    if (!summaryElement || !statusElement) return;

    if (totalProducts === 0) {
        summaryElement.innerHTML = '<span style="color: #999;">Chưa có dữ liệu</span>';
        return;
    }

    // Cập nhật trạng thái bộ lọc ngày
    if (useDateFilter && currentStockDateStart && currentStockDateEnd) {
        statusElement.innerHTML = `Đang hiển thị tồn kho từ <strong>${safeFormatDate(currentStockDateStart)}</strong> đến <strong>${safeFormatDate(currentStockDateEnd)}</strong>`;
        statusElement.style.color = '#28a745';
    } else {
        statusElement.innerHTML = 'Đang hiển thị tồn kho hiện tại';
        statusElement.style.color = '#666';
    }

    summaryElement.innerHTML = `
        <div style="display: flex; gap: 20px; font-size: 13px;">
            <div><strong>Tổng SP:</strong> ${totalProducts}</div>
            <div><strong>Tổng SL:</strong> ${totalQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</div>
            <div><strong>Tổng giá trị:</strong> ${safeFormatCurrency(totalValue)}</div>
        </div>
    `;
}

/**
 * Cập nhật điều khiển phân trang và nút mở rộng
 */
function updateCatalogControls(totalItems, displayedItems) {
    const controlsElement = document.getElementById('catalog-controls');
    if (!controlsElement) return;

    if (totalItems <= 10) {
        controlsElement.innerHTML = `
            <div style="color: #666; font-size: 13px;">
                Đang hiển thị ${displayedItems}/${totalItems} sản phẩm
            </div>
        `;
        return;
    }

    controlsElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #666; font-size: 13px;">
                Đang hiển thị ${displayedItems}/${totalItems} sản phẩm
            </div>
            <button class="btn-sm ${showAllProducts ? 'btn-outline-secondary' : 'btn-primary'}" 
                    onclick="toggleShowAll()" style="font-size: 12px;">
                ${showAllProducts ? '↥ Thu gọn' : '↧ Xem thêm ' + (totalItems - displayedItems) + ' sản phẩm'}
            </button>
        </div>
    `;
}

/**
 * Hàm chuyển đổi hiển thị toàn bộ/10 sản phẩm
 */
function toggleShowAll() {
    showAllProducts = !showAllProducts;
    const searchInput = document.getElementById('search-products');
    loadProductCatalog(searchInput ? searchInput.value : '', !!currentStockDate);
}

/**
 * Hiển thị thẻ kho chi tiết với thông tin hóa đơn
 */
function viewStockCard(msp) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const product = aggregatedStock[msp];
    
    if (!product) {
        alert('Không tìm thấy sản phẩm');
        return;
    }

    // Lấy tất cả giao dịch liên quan đến sản phẩm
    const transactions = [];

    // Hàm lấy thông tin hóa đơn
    function getInvoiceInfo(invoice) {
        if (invoice.invoiceInfo) {
            return {
                number: invoice.invoiceInfo.number || '',
                symbol: invoice.invoiceInfo.symbol || '',
                date: invoice.invoiceInfo.date || '',
                fullRef: `${invoice.invoiceInfo.symbol || ''}/${invoice.invoiceInfo.number || ''}`.replace('//', '/')
            };
        }
        return {
            number: invoice.invNumber || invoice.invoiceNumber || '',
            symbol: '',
            date: invoice.date || '',
            fullRef: invoice.invNumber || invoice.invoiceNumber || 'Không rõ'
        };
    }

    // Giao dịch NHẬP từ hóa đơn
    (hkd.invoices || []).forEach(invoice => {
        const invoiceInfo = getInvoiceInfo(invoice);
        
        invoice.products.filter(product => product.msp === msp && product.category === 'hang_hoa').forEach(item => {
            transactions.push({
                date: invoiceInfo.date,
                type: 'NHẬP',
                reference: `Hóa đơn ${invoiceInfo.fullRef}`,
                documentNumber: invoiceInfo.fullRef,
                quantity: parseFloat(item.quantity) || 0,
                unitPrice: parseFloat(item.quantity) !== 0 ? item.amount / parseFloat(item.quantity) : 0,
                amount: parseFloat(item.amount) || 0,
                source: 'hoadon'
            });
        });
    });

    // Giao dịch XUẤT từ phiếu xuất
    (hkd.exports || []).forEach(exportRecord => {
        exportRecord.products.filter(product => product.msp === msp).forEach(item => {
            transactions.push({
                date: exportRecord.date || new Date().toISOString().substring(0, 10),
                type: 'XUẤT',
                reference: `Phiếu xuất ${exportRecord.id || 'N/A'}`,
                documentNumber: exportRecord.id || 'N/A',
                quantity: -parseFloat(item.quantity) || 0,
                unitPrice: parseFloat(item.price) || 0,
                amount: -parseFloat(item.amount) || 0,
                source: 'xuathang'
            });
        });
    });

    // Giao dịch ĐIỀU CHỈNH
    (hkd.tonkhoMain || []).filter(product => product.msp === msp && product.type === 'ADJUSTMENT').forEach(adjustment => {
        transactions.push({
            date: adjustment.date || new Date().toISOString().substring(0, 10),
            type: 'ĐIỀU CHỈNH',
            reference: adjustment.description || adjustment.id,
            documentNumber: adjustment.id,
            quantity: parseFloat(adjustment.quantity) || 0,
            unitPrice: parseFloat(adjustment.price) || 0,
            amount: parseFloat(adjustment.amount) || 0,
            source: 'tonkho'
        });
    });

    // Sắp xếp theo ngày
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningQuantity = 0;
    let runningAmount = 0;

    let detailHtml = `
        <div class="card">
            <div class="card-header">
                <h4>THẺ KHO - ${msp}</h4>
                <p style="margin: 5px 0; font-size: 14px;">
                    <strong>Tên hàng:</strong> ${product.name} | 
                    <strong>Đơn vị tính:</strong> ${product.unit}
                </p>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered" style="font-size: 12px;">
                    <thead style="background-color: #f8f9fa;">
                        <tr>
                            <th rowspan="2" style="vertical-align: middle;">Ngày</th>
                            <th rowspan="2" style="vertical-align: middle;">Số chứng từ</th>
                            <th rowspan="2" style="vertical-align: middle;">Diễn giải</th>
                            <th colspan="2" style="text-align: center;">Nhập</th>
                            <th colspan="2" style="text-align: center;">Xuất</th>
                            <th colspan="2" style="text-align: center;">Tồn</th>
                        </tr>
                        <tr>
                            <th style="text-align: center;">SL</th>
                            <th style="text-align: center;">Đơn giá</th>
                            <th style="text-align: center;">SL</th>
                            <th style="text-align: center;">Đơn giá</th>
                            <th style="text-align: center;">SL</th>
                            <th style="text-align: center;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Dòng tồn đầu kỳ
    detailHtml += `
        <tr style="background-color: #fff3cd;">
            <td></td>
            <td></td>
            <td><strong>Tồn đầu kỳ</strong></td>
            <td style="text-align: right;"></td>
            <td style="text-align: right;"></td>
            <td style="text-align: right;"></td>
            <td style="text-align: right;"></td>
            <td style="text-align: right;"><strong>0</strong></td>
            <td style="text-align: right;"><strong>0</strong></td>
        </tr>
    `;

    // Các giao dịch
    transactions.forEach(transaction => {
        const quantityIn = transaction.quantity > 0 ? transaction.quantity : 0;
        const quantityOut = transaction.quantity < 0 ? Math.abs(transaction.quantity) : 0;
        
        runningQuantity += transaction.quantity;
        runningAmount += transaction.amount;

        const displayDate = safeFormatDate(transaction.date);

        detailHtml += `
            <tr>
                <td>${displayDate}</td>
                <td>${transaction.documentNumber}</td>
                <td>${transaction.reference}</td>
                <td style="text-align: right;">${quantityIn > 0 ? quantityIn.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : ''}</td>
                <td style="text-align: right;">${quantityIn > 0 ? safeFormatCurrency(transaction.unitPrice) : ''}</td>
                <td style="text-align: right;">${quantityOut > 0 ? quantityOut.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : ''}</td>
                <td style="text-align: right;">${quantityOut > 0 ? safeFormatCurrency(transaction.unitPrice) : ''}</td>
                <td style="text-align: right; font-weight: bold;">${runningQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; font-weight: bold;">${safeFormatCurrency(runningAmount)}</td>
            </tr>
        `;
    });

    // Dòng tổng kết
    const totalIn = transactions.filter(transaction => transaction.quantity > 0).reduce((sum, transaction) => sum + transaction.quantity, 0);
    const totalOut = transactions.filter(transaction => transaction.quantity < 0).reduce((sum, transaction) => sum + Math.abs(transaction.quantity), 0);
    const totalInAmount = transactions.filter(transaction => transaction.quantity > 0).reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalOutAmount = transactions.filter(transaction => transaction.quantity < 0).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    detailHtml += `
                        <tr style="background-color: #e9ecef; font-weight: bold;">
                            <td colspan="3" style="text-align: center;">TỔNG CỘNG</td>
                            <td style="text-align: right;">${totalIn.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                            <td style="text-align: right;">${safeFormatCurrency(totalInAmount / totalIn)}</td>
                            <td style="text-align: right;">${totalOut.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                            <td style="text-align: right;">${safeFormatCurrency(totalOutAmount / totalOut)}</td>
                            <td style="text-align: right;">${runningQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                            <td style="text-align: right;">${safeFormatCurrency(runningAmount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
                <div>
                    <strong>Tổng nhập:</strong> ${totalIn.toLocaleString('vi-VN')} | 
                    <strong>Tổng xuất:</strong> ${totalOut.toLocaleString('vi-VN')} | 
                    <strong>Tồn cuối:</strong> ${runningQuantity.toLocaleString('vi-VN')}
                </div>
                <div>
                    <strong>Giá trị tồn:</strong> ${safeFormatCurrency(runningAmount)}
                </div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-primary" onclick="printStockCard('${msp}')">In Thẻ Kho</button>
            <button class="btn-warning" onclick="adjustStock('${msp}')">Điều Chỉnh Tồn Kho</button>
            <button class="btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Đóng</button>
        </div>
    `;

    window.showModal(`Thẻ Kho - ${msp}`, detailHtml, 'modal-xl');
}


/**
 * Hàm tổng hợp tồn kho theo ngày cụ thể
 */
function getAggregatedStockByDate(targetDate = null) {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        return {};
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = {};
    
    // Hàm lấy thông tin hóa đơn
    function getInvoiceInfo(invoice) {
        if (invoice.invoiceInfo) {
            return {
                date: invoice.invoiceInfo.date || '',
                number: invoice.invoiceInfo.number || '',
                symbol: invoice.invoiceInfo.symbol || ''
            };
        }
        return {
            date: invoice.date || '',
            number: invoice.invNumber || invoice.invoiceNumber || '',
            symbol: ''
        };
    }

    // Giao dịch NHẬP từ hóa đơn (chỉ lấy đến targetDate)
    (hkd.invoices || []).forEach(invoice => {
        const invoiceInfo = getInvoiceInfo(invoice);
        const invoiceDate = invoiceInfo.date;
        
        // Nếu có targetDate, chỉ lấy hóa đơn trước hoặc bằng targetDate
        if (targetDate && new Date(invoiceDate) > new Date(targetDate)) {
            return;
        }
        
        invoice.products.filter(product => product.category === 'hang_hoa').forEach(item => {
            if (!aggregatedStock[item.msp]) {
                aggregatedStock[item.msp] = {
                    msp: item.msp,
                    name: item.name || 'Không có tên',
                    unit: item.unit || 'cái',
                    quantity: 0,
                    totalAmount: 0,
                    avgPrice: 0,
                    category: item.category || 'hang_hoa'
                };
            }
            
            const quantity = parseFloat(item.quantity) || 0;
            const amount = parseFloat(item.amount) || 0;
            
            aggregatedStock[item.msp].quantity += quantity;
            aggregatedStock[item.msp].totalAmount += amount;
        });
    });

    // Giao dịch XUẤT từ phiếu xuất (chỉ lấy đến targetDate)
    (hkd.exports || []).forEach(exportRecord => {
        const exportDate = exportRecord.date || new Date().toISOString().substring(0, 10);
        
        // Nếu có targetDate, chỉ lấy phiếu xuất trước hoặc bằng targetDate
        if (targetDate && new Date(exportDate) > new Date(targetDate)) {
            return;
        }
        
        exportRecord.products.forEach(item => {
            if (!aggregatedStock[item.msp]) {
                aggregatedStock[item.msp] = {
                    msp: item.msp,
                    name: item.name || 'Không có tên',
                    unit: item.unit || 'cái',
                    quantity: 0,
                    totalAmount: 0,
                    avgPrice: 0,
                    category: 'hang_hoa'
                };
            }
            
            const quantity = -(parseFloat(item.quantity) || 0);
            const amount = -(parseFloat(item.amount) || 0);
            
            aggregatedStock[item.msp].quantity += quantity;
            aggregatedStock[item.msp].totalAmount += amount;
        });
    });

    // Giao dịch ĐIỀU CHỈNH (chỉ lấy đến targetDate)
    (hkd.tonkhoMain || []).filter(product => product.type === 'ADJUSTMENT').forEach(adjustment => {
        const adjustmentDate = adjustment.date || new Date().toISOString().substring(0, 10);
        
        // Nếu có targetDate, chỉ lấy điều chỉnh trước hoặc bằng targetDate
        if (targetDate && new Date(adjustmentDate) > new Date(targetDate)) {
            return;
        }
        
        if (!aggregatedStock[adjustment.msp]) {
            aggregatedStock[adjustment.msp] = {
                msp: adjustment.msp,
                name: adjustment.name || 'Không có tên',
                unit: adjustment.unit || 'cái',
                quantity: 0,
                totalAmount: 0,
                avgPrice: 0,
                category: adjustment.category || 'hang_hoa'
            };
        }
        
        const quantity = parseFloat(adjustment.quantity) || 0;
        const amount = parseFloat(adjustment.amount) || 0;
        
        aggregatedStock[adjustment.msp].quantity += quantity;
        aggregatedStock[adjustment.msp].totalAmount += amount;
    });

    // Tính giá trung bình
    Object.values(aggregatedStock).forEach(product => {
        if (product.quantity > 0 && product.category === 'hang_hoa') {
            product.avgPrice = Math.abs(product.totalAmount) / product.quantity;
        } else {
            product.avgPrice = 0;
        }
    });

    return aggregatedStock;
}
/**
 * Fallback: Hiển thị thẻ kho đơn giản
 */
function showSimpleStockCard(msp) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const product = aggregatedStock[msp];
    
    if (!product) {
        alert('Không tìm thấy sản phẩm');
        return;
    }

    const modalContent = `
        <div class="card">
            <div class="card-header">
                <h5>Thông Tin Tồn Kho - ${msp}</h5>
            </div>
            <div class="card-body">
                <p><strong>Tên sản phẩm:</strong> ${product.name}</p>
                <p><strong>Đơn vị tính:</strong> ${product.unit}</p>
                <p><strong>Số lượng tồn:</strong> ${product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</p>
                <p><strong>Đơn giá trung bình:</strong> ${safeFormatCurrency(product.avgPrice)}</p>
                <p><strong>Giá trị tồn kho:</strong> ${safeFormatCurrency(product.totalAmount)}</p>
                <p><strong>Phân loại:</strong> ${getProductClassification(product.category)}</p>
            </div>
        </div>
        <div style="text-align: center; margin-top: 15px;">
            <button class="btn-warning" onclick="adjustStock('${msp}')">Điều Chỉnh Tồn Kho</button>
            <button class="btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Đóng</button>
        </div>
    `;

    window.showModal(`Thẻ Kho - ${msp}`, modalContent);
}
function loadStockCards() {
    const container = document.getElementById('stock-card-container');
    if (!container) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Vui lòng chọn công ty</p>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const stockItems = Object.values(aggregatedStock);

    if (stockItems.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Chưa có dữ liệu thẻ kho</p>';
        return;
    }

    // Hiển thị 5 sản phẩm có số lượng tồn cao nhất
    const topProducts = stockItems
        .filter(item => item.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    let html = `
        <h4>Top 5 Sản Phẩm Tồn Kho Cao Nhất</h4>
        <table class="table">
            <thead>
                <tr>
                    <th>MSP</th>
                    <th>Tên hàng hóa</th>
                    <th>Số lượng tồn</th>
                    <th>Giá trị tồn</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
    `;

    topProducts.forEach(product => {
        html += `
            <tr>
                <td>
                    <a href="javascript:void(0)" onclick="viewStockCard('${product.msp}')" 
                       style="color: #007bff; text-decoration: none; font-weight: bold; cursor: pointer;"
                       title="Click để xem thẻ kho">
                       ${product.msp}
                    </a>
                </td>
                <td>${product.name}</td>
                <td>${product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td>${safeFormatCurrency(product.totalAmount)}</td>
                <td>
                    <button class="btn-sm btn-warning" onclick="adjustStock('${product.msp}')">Điều chỉnh</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * Hàm tiện ích: Lấy phân loại sản phẩm - ĐỒNG BỘ VỚI TONKHO
 */
function getProductClassification(category) {
    const classifications = {
        'hang_hoa': 'Hàng hóa',
        'chiet_khau': 'Chiết khấu',
        'khuyen_mai': 'Khuyến mãi',
        'dich_vu': 'Dịch vụ'
    };
    return classifications[category] || 'Hàng hóa';
}

/**
 * Hàm tiện ích: Format tiền tệ an toàn - MỚI
 */
function safeFormatCurrency(amount) {
    if (typeof window.formatCurrency === 'function') {
        return window.formatCurrency(amount || 0);
    }
    return (amount || 0).toLocaleString('vi-VN');
}

/**
 * Hàm tiện ích: Format ngày an toàn - ĐÃ SỬA LỖI ĐỆ QUY
 */
function safeFormatDate(dateStr) {
    // FIX: Kiểm tra trực tiếp window.formatDate thay vì gọi đệ quy
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


function adjustStock(msp) {
    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const product = aggregatedStock[msp];
    
    if (!product) {
        alert('Không tìm thấy sản phẩm');
        return;
    }

    const modalContent = `
        <div class="form-grid">
            <div class="form-group">
                <label for="adjust-date">Ngày điều chỉnh</label>
                <input type="date" id="adjust-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="adjust-type">Loại điều chỉnh</label>
                <select id="adjust-type" class="form-control">
                    <option value="increase">Tăng tồn kho</option>
                    <option value="decrease">Giảm tồn kho</option>
                    <option value="set">Đặt lại số lượng</option>
                </select>
            </div>
            <div class="form-group">
                <label for="adjust-quantity">Số lượng</label>
                <input type="number" id="adjust-quantity" class="form-control" placeholder="Nhập số lượng" step="0.01">
            </div>
            <div class="form-group">
                <label for="adjust-reason">Lý do</label>
                <input type="text" id="adjust-reason" class="form-control" placeholder="Nhập lý do điều chỉnh">
            </div>
        </div>
        <div class="card">
            <div class="card-header">Thông Tin Hiện Tại</div>
            <p><strong>Sản phẩm:</strong> ${product.name} (${msp})</p>
            <p><strong>Tồn kho hiện tại:</strong> ${product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${product.unit}</p>
        </div>
        <div style="text-align: right; margin-top: 20px;">
            <button id="confirm-adjust" class="btn-success">Xác Nhận Điều Chỉnh</button>
            <button class="btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Hủy</button>
        </div>
    `;

    window.showModal('Điều Chỉnh Tồn Kho', modalContent);

    document.getElementById('confirm-adjust').addEventListener('click', function() {
        processStockAdjustment(msp, product);
    });
}
function processStockAdjustment(msp, product) {
    const date = document.getElementById('adjust-date').value;
    const type = document.getElementById('adjust-type').value;
    const quantity = parseFloat(document.getElementById('adjust-quantity').value) || 0;
    const reason = document.getElementById('adjust-reason').value;

    // SỬA: Sử dụng validation thống nhất
    const validation = validateStockAdjustment(product, quantity, product.avgPrice, reason, date);
    if (!validation.isValid) {
        alert('Lỗi validation:\n' + validation.errors.join('\n'));
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    
    // Tính toán số lượng mới
    let newQuantity = product.quantity;
    switch (type) {
        case 'increase':
            newQuantity += quantity;
            break;
        case 'decrease':
            newQuantity -= quantity;
            if (newQuantity < 0) {
                alert('Số lượng tồn kho không thể âm.');
                return;
            }
            break;
        case 'set':
            newQuantity = quantity;
            break;
    }

    // SỬA: Sử dụng hàm processStockAdjustment từ tonkho.js nếu có
    if (typeof window.processStockAdjustment === 'function') {
        window.processStockAdjustment(product, newQuantity, product.avgPrice, reason, date);
    } else {
        // Fallback: xử lý cục bộ
        createStockAdjustmentAccountingEntry(msp, product.name, date, type, Math.abs(newQuantity - product.quantity), reason, newQuantity);
        updateStockAfterAdjustment(msp, newQuantity, product.avgPrice);
    }

    alert(`Đã điều chỉnh tồn kho thành công! Số lượng mới: ${newQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}`);
    document.getElementById('custom-modal').style.display = 'none';
    
    // Cập nhật giao diện
    loadProductCatalog();
    loadStockCards();
    
    // Lưu dữ liệu
    if (typeof window.saveAccountingData === 'function') {
        window.saveAccountingData();
    } else if (typeof window.saveData === 'function') {
        window.saveData();
    }
}
function updateStockAfterAdjustment(msp, newQuantity, unitPrice = null) {
    const hkd = window.hkdData[window.currentCompany];
    
    // Tìm hoặc tạo bản ghi tồn kho
    let stockItem = hkd.tonkhoMain.find(item => item.msp === msp && item.type !== 'ADJUSTMENT');
    
    if (!stockItem) {
        // Tạo bản ghi mới nếu chưa có
        const aggregatedStock = getAggregatedStock(hkd);
        const product = aggregatedStock[msp];
        
        stockItem = {
            id: `STOCK_${Date.now()}`,
            msp: msp,
            name: product?.name || 'Sản phẩm',
            unit: product?.unit || 'cái',
            category: product?.category || 'hang_hoa',
            quantity: 0,
            amount: 0,
            price: unitPrice || product?.avgPrice || 0
        };
        hkd.tonkhoMain.push(stockItem);
    }
    
    // Cập nhật số lượng và giá trị
    stockItem.quantity = newQuantity;
    if (unitPrice && unitPrice > 0) {
        stockItem.price = unitPrice;
    }
    stockItem.amount = accountingRound(newQuantity * (stockItem.price || unitPrice || 0));
    
    // Ghi log điều chỉnh
    const adjustmentEntry = {
        id: `ADJ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'ADJUSTMENT',
        date: new Date().toISOString().substring(0, 10),
        description: `Điều chỉnh tồn kho từ giao diện kho hàng`,
        msp: msp,
        name: stockItem.name,
        unit: stockItem.unit,
        category: stockItem.category,
        quantity: newQuantity - (product?.quantity || 0),
        amount: stockItem.amount - (product?.totalAmount || 0),
        price: stockItem.price
    };
    
    hkd.tonkhoMain.push(adjustmentEntry);
}

function createStockAdjustmentAccountingEntry(msp, productName, date, type, quantity, reason, newQuantity) {
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.accountingTransactions) {
        hkd.accountingTransactions = [];
    }

    const transactionId = `ADJ_${Date.now()}`;
    const description = `Điều chỉnh tồn kho ${productName} - ${reason}`;

    // Bút toán điều chỉnh tồn kho
    // Trong kế toán, điều chỉnh tăng: Nợ 156/Có 711
    // Điều chỉnh giảm: Nợ 632/Có 156

    if (type === 'increase') {
        hkd.accountingTransactions.push({
            id: transactionId,
            date: date,
            type: 'STOCK_ADJUST',
            account: '156',
            debit: quantity * 1000, // Giả sử đơn giá 1000
            credit: 0,
            description: description,
            reference: msp
        });

        hkd.accountingTransactions.push({
            id: transactionId,
            date: date,
            type: 'STOCK_ADJUST',
            account: '711',
            debit: 0,
            credit: quantity * 1000,
            description: description,
            reference: msp
        });
    } else {
        hkd.accountingTransactions.push({
            id: transactionId,
            date: date,
            type: 'STOCK_ADJUST',
            account: '632',
            debit: quantity * 1000,
            credit: 0,
            description: description,
            reference: msp
        });

        hkd.accountingTransactions.push({
            id: transactionId,
            date: date,
            type: 'STOCK_ADJUST',
            account: '156',
            debit: 0,
            credit: quantity * 1000,
            description: description,
            reference: msp
        });
    }
}
/**
 * Hàm tiện ích: Làm tròn kế toán - FALLBACK
 */
function accountingRound(amount) {
    if (typeof window.accountingRound === 'function') {
        return window.accountingRound(amount);
    }
    return Math.round(amount);
}
function generateStockReport() {
    const reportDateStart = document.getElementById('report-date-start').value;
    const reportDateEnd = document.getElementById('report-date-end').value;
    const resultContainer = document.getElementById('stock-report-result');
    
    if (!reportDateStart || !reportDateEnd) {
        alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc');
        return;
    }

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        alert('Vui lòng chọn công ty');
        return;
    }

    // Sử dụng hàm tổng hợp theo khoảng ngày
    const aggregatedStock = getAggregatedStockByDateRange(reportDateStart, reportDateEnd);
    const stockItems = Object.values(aggregatedStock).filter(item => item.quantity > 0);

    const formattedStartDate = safeFormatDate(reportDateStart);
    const formattedEndDate = safeFormatDate(reportDateEnd);

    let html = `
        <div class="card">
            <div class="card-header">Báo Cáo Tồn Kho Từ ${formattedStartDate} Đến ${formattedEndDate}</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>MSP</th>
                        <th>Tên hàng hóa</th>
                        <th>ĐVT</th>
                        <th>Số lượng</th>
                        <th>Đơn giá TB</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalQuantity = 0;
    let totalValue = 0;

    stockItems.forEach(item => {
        totalQuantity += item.quantity;
        totalValue += item.totalAmount;

        html += `
            <tr>
                <td>${item.msp}</td>
                <td>${item.name}</td>
                <td>${item.unit}</td>
                <td style="text-align: right;">${item.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td style="text-align: right;">${safeFormatCurrency(item.avgPrice)}</td>
                <td style="text-align: right;">${safeFormatCurrency(item.totalAmount)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold;">
                        <td colspan="3">Tổng cộng</td>
                        <td style="text-align: right;">${totalQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                        <td></td>
                        <td style="text-align: right;">${safeFormatCurrency(totalValue)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-primary" onclick="printStockReport('${reportDateStart}', '${reportDateEnd}')">In Báo Cáo</button>
        </div>
    `;

    resultContainer.innerHTML = html;
    resultContainer.classList.remove('hidden');
}

/**
 * Hàm tiện ích tổng hợp tồn kho - ĐÃ SỬA LỖI ĐỆ QUY
 */
function getAggregatedStock(hkd = null) {
    // FIX: Nếu không truyền hkd, lấy từ window.currentCompany
    if (!hkd) {
        if (!window.currentCompany || !window.hkdData || !window.hkdData[window.currentCompany]) {
            return {};
        }
        hkd = window.hkdData[window.currentCompany];
    }
    
    const aggregatedStock = {};
    
    (hkd.tonkhoMain || []).forEach(product => {
        // SỬA: Sử dụng validation giống tonkho.js
        const productCategory = product.category || 'hang_hoa';
        const quantity = parseFloat(product.quantity) || 0;
        const amount = parseFloat(product.amount) || 0;
        
        if (quantity <= 0 && productCategory !== 'chiet_khau') return;
        if (!product.msp) return;
        
        if (!aggregatedStock[product.msp]) {
            aggregatedStock[product.msp] = {
                msp: product.msp,
                name: product.name || 'Không có tên',
                unit: product.unit || 'cái',
                quantity: 0,
                totalAmount: 0,
                avgPrice: 0,
                category: productCategory
            };
        }
        
        if (productCategory === 'hang_hoa' || productCategory === 'dich_vu') {
            aggregatedStock[product.msp].quantity += quantity;
        }
        
        aggregatedStock[product.msp].totalAmount += amount;
    });
    
    // SỬA: Tính toán avgPrice an toàn
    Object.values(aggregatedStock).forEach(product => {
        if (product.quantity > 0 && product.category === 'hang_hoa') {
            product.avgPrice = Math.abs(product.totalAmount) / product.quantity;
        } else {
            product.avgPrice = 0;
        }
    });
    
    return aggregatedStock;
}

// Hàm in ấn
/**
 * Hàm in thẻ kho - Mở máy in trực tiếp
 */
function printStockCard(msp) {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        alert('Vui lòng chọn công ty');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const product = aggregatedStock[msp];
    
    if (!product) {
        alert('Không tìm thấy sản phẩm');
        return;
    }

    // Lấy tất cả giao dịch liên quan đến sản phẩm
    const transactions = [];

    // Hàm lấy thông tin hóa đơn
    function getInvoiceInfo(invoice) {
        if (invoice.invoiceInfo) {
            return {
                number: invoice.invoiceInfo.number || '',
                symbol: invoice.invoiceInfo.symbol || '',
                date: invoice.invoiceInfo.date || '',
                fullRef: `${invoice.invoiceInfo.symbol || ''}/${invoice.invoiceInfo.number || ''}`.replace('//', '/')
            };
        }
        return {
            number: invoice.invNumber || invoice.invoiceNumber || '',
            symbol: '',
            date: invoice.date || '',
            fullRef: invoice.invNumber || invoice.invoiceNumber || 'Không rõ'
        };
    }

    // Giao dịch NHẬP từ hóa đơn
    (hkd.invoices || []).forEach(invoice => {
        const invoiceInfo = getInvoiceInfo(invoice);
        
        invoice.products.filter(product => product.msp === msp && product.category === 'hang_hoa').forEach(item => {
            transactions.push({
                date: invoiceInfo.date,
                type: 'NHẬP',
                reference: `Hóa đơn ${invoiceInfo.fullRef}`,
                documentNumber: invoiceInfo.fullRef,
                quantity: parseFloat(item.quantity) || 0,
                unitPrice: parseFloat(item.quantity) !== 0 ? item.amount / parseFloat(item.quantity) : 0,
                amount: parseFloat(item.amount) || 0,
                source: 'hoadon'
            });
        });
    });

    // Giao dịch XUẤT từ phiếu xuất
    (hkd.exports || []).forEach(exportRecord => {
        exportRecord.products.filter(product => product.msp === msp).forEach(item => {
            transactions.push({
                date: exportRecord.date || new Date().toISOString().substring(0, 10),
                type: 'XUẤT',
                reference: `Phiếu xuất ${exportRecord.id || 'N/A'}`,
                documentNumber: exportRecord.id || 'N/A',
                quantity: -parseFloat(item.quantity) || 0,
                unitPrice: parseFloat(item.price) || 0,
                amount: -parseFloat(item.amount) || 0,
                source: 'xuathang'
            });
        });
    });

    // Giao dịch ĐIỀU CHỈNH
    (hkd.tonkhoMain || []).filter(product => product.msp === msp && product.type === 'ADJUSTMENT').forEach(adjustment => {
        transactions.push({
            date: adjustment.date || new Date().toISOString().substring(0, 10),
            type: 'ĐIỀU CHỈNH',
            reference: adjustment.description || adjustment.id,
            documentNumber: adjustment.id,
            quantity: parseFloat(adjustment.quantity) || 0,
            unitPrice: parseFloat(adjustment.price) || 0,
            amount: parseFloat(adjustment.amount) || 0,
            source: 'tonkho'
        });
    });

    // Sắp xếp theo ngày
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningQuantity = 0;
    let runningAmount = 0;

    // Tính tổng
    const totalIn = transactions.filter(transaction => transaction.quantity > 0).reduce((sum, transaction) => sum + transaction.quantity, 0);
    const totalOut = transactions.filter(transaction => transaction.quantity < 0).reduce((sum, transaction) => sum + Math.abs(transaction.quantity), 0);

    // Tạo nội dung in
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Thẻ Kho - ${msp}</title>
            <style>
                body { 
                    font-family: 'Times New Roman', Times, serif; 
                    font-size: 12px; 
                    margin: 20px; 
                    line-height: 1.4;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 20px; 
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 18px; 
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .header h2 {
                    margin: 5px 0;
                    font-size: 14px;
                    font-weight: normal;
                }
                .product-info { 
                    margin-bottom: 15px; 
                    padding: 10px;
                    background-color: #f9f9f9;
                    border: 1px solid #ddd;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 10px;
                }
                th, td { 
                    border: 1px solid #000; 
                    padding: 6px; 
                    text-align: center; 
                    font-size: 11px;
                }
                th { 
                    background-color: #f0f0f0; 
                    font-weight: bold; 
                }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .text-center { text-align: center; }
                .summary { 
                    margin-top: 15px; 
                    padding: 10px; 
                    background-color: #f9f9f9; 
                    border: 1px solid #ddd;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                    .header { page-break-after: avoid; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CÔNG TY TNHH HKD</h1>
                <h2>THẺ KHO</h2>
                <h3>Mã sản phẩm: ${msp}</h3>
            </div>
            
            <div class="product-info">
                <p><strong>Tên hàng:</strong> ${product.name}</p>
                <p><strong>Đơn vị tính:</strong> ${product.unit}</p>
                <p><strong>Ngày in:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 8%;">Ngày</th>
                        <th rowspan="2" style="width: 12%;">Số chứng từ</th>
                        <th rowspan="2" style="width: 20%;">Diễn giải</th>
                        <th colspan="2" style="width: 20%;">Nhập</th>
                        <th colspan="2" style="width: 20%;">Xuất</th>
                        <th colspan="2" style="width: 20%;">Tồn</th>
                    </tr>
                    <tr>
                        <th style="width: 10%;">SL</th>
                        <th style="width: 10%;">Đơn giá</th>
                        <th style="width: 10%;">SL</th>
                        <th style="width: 10%;">Đơn giá</th>
                        <th style="width: 10%;">SL</th>
                        <th style="width: 10%;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Dòng tồn đầu kỳ
    printContent += `
        <tr style="background-color: #fff3cd;">
            <td></td>
            <td></td>
            <td class="text-left"><strong>Tồn đầu kỳ</strong></td>
            <td class="text-right"></td>
            <td class="text-right"></td>
            <td class="text-right"></td>
            <td class="text-right"></td>
            <td class="text-right"><strong>0</strong></td>
            <td class="text-right"><strong>0</strong></td>
        </tr>
    `;

    // Các giao dịch
    transactions.forEach(transaction => {
        const quantityIn = transaction.quantity > 0 ? transaction.quantity : 0;
        const quantityOut = transaction.quantity < 0 ? Math.abs(transaction.quantity) : 0;
        
        runningQuantity += transaction.quantity;
        runningAmount += transaction.amount;

        const displayDate = safeFormatDate(transaction.date);

        printContent += `
            <tr>
                <td>${displayDate}</td>
                <td class="text-left">${transaction.documentNumber}</td>
                <td class="text-left">${transaction.reference}</td>
                <td class="text-right">${quantityIn > 0 ? quantityIn.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : ''}</td>
                <td class="text-right">${quantityIn > 0 ? safeFormatCurrency(transaction.unitPrice) : ''}</td>
                <td class="text-right">${quantityOut > 0 ? quantityOut.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : ''}</td>
                <td class="text-right">${quantityOut > 0 ? safeFormatCurrency(transaction.unitPrice) : ''}</td>
                <td class="text-right"><strong>${runningQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</strong></td>
                <td class="text-right"><strong>${safeFormatCurrency(runningAmount)}</strong></td>
            </tr>
        `;
    });

    // Dòng tổng kết
    printContent += `
                </tbody>
                <tfoot>
                    <tr style="background-color: #e9ecef; font-weight: bold;">
                        <td colspan="3" class="text-center">TỔNG CỘNG</td>
                        <td class="text-right">${totalIn.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                        <td class="text-right"></td>
                        <td class="text-right">${totalOut.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                        <td class="text-right"></td>
                        <td class="text-right">${runningQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                        <td class="text-right">${safeFormatCurrency(runningAmount)}</td>
                    </tr>
                </tfoot>
            </table>

            <div class="summary">
                <p><strong>Tổng nhập:</strong> ${totalIn.toLocaleString('vi-VN')} | 
                <strong>Tổng xuất:</strong> ${totalOut.toLocaleString('vi-VN')} | 
                <strong>Tồn cuối:</strong> ${runningQuantity.toLocaleString('vi-VN')} | 
                <strong>Giá trị tồn:</strong> ${safeFormatCurrency(runningAmount)}</p>
            </div>

            <div class="footer">
                <div>
                    <p>Người lập biểu</p>
                    <p style="margin-top: 40px;">(Ký, ghi rõ họ tên)</p>
                </div>
                <div>
                    <p>Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
                    <p style="margin-top: 40px;">(Ký, ghi rõ họ tên)</p>
                </div>
            </div>

            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print();" style="padding: 10px 20px; font-size: 14px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">In Ngay</button>
                <button onclick="window.close();" style="padding: 10px 20px; font-size: 14px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Đóng</button>
            </div>
        </body>
        </html>
    `;

    // Mở cửa sổ in
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    
}

/**
 * Hàm in Sổ Nhập-Xuất-Tồn - Tổng hợp tất cả giao dịch kho
 */
function printStockLedger() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        alert('Vui lòng chọn công ty');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    
    // Lấy tất cả giao dịch của tất cả sản phẩm
    const allTransactions = [];

    // Hàm lấy thông tin hóa đơn
    function getInvoiceInfo(invoice) {
        if (invoice.invoiceInfo) {
            return {
                number: invoice.invoiceInfo.number || '',
                symbol: invoice.invoiceInfo.symbol || '',
                date: invoice.invoiceInfo.date || '',
                fullRef: `${invoice.invoiceInfo.symbol || ''}/${invoice.invoiceInfo.number || ''}`.replace('//', '/')
            };
        }
        return {
            number: invoice.invNumber || invoice.invoiceNumber || '',
            symbol: '',
            date: invoice.date || '',
            fullRef: invoice.invNumber || invoice.invoiceNumber || 'Không rõ'
        };
    }

    // Thu thập tất cả giao dịch NHẬP từ hóa đơn
    (hkd.invoices || []).forEach(invoice => {
        const invoiceInfo = getInvoiceInfo(invoice);
        
        invoice.products.filter(product => product.category === 'hang_hoa').forEach(item => {
            allTransactions.push({
                date: invoiceInfo.date,
                msp: item.msp,
                name: item.name || 'Không có tên',
                unit: item.unit || 'cái',
                type: 'NHẬP',
                reference: `HD ${invoiceInfo.fullRef}`,
                documentNumber: invoiceInfo.fullRef,
                quantity: parseFloat(item.quantity) || 0,
                unitPrice: parseFloat(item.quantity) !== 0 ? item.amount / parseFloat(item.quantity) : 0,
                amount: parseFloat(item.amount) || 0,
                source: 'hoadon'
            });
        });
    });

    // Thu thập tất cả giao dịch XUẤT từ phiếu xuất
    (hkd.exports || []).forEach(exportRecord => {
        exportRecord.products.forEach(item => {
            allTransactions.push({
                date: exportRecord.date || new Date().toISOString().substring(0, 10),
                msp: item.msp,
                name: item.name || 'Không có tên',
                unit: item.unit || 'cái',
                type: 'XUẤT',
                reference: `PX ${exportRecord.id || 'N/A'}`,
                documentNumber: exportRecord.id || 'N/A',
                quantity: -(parseFloat(item.quantity) || 0),
                unitPrice: parseFloat(item.price) || 0,
                amount: -(parseFloat(item.amount) || 0),
                source: 'xuathang'
            });
        });
    });

    // Thu thập tất cả giao dịch ĐIỀU CHỈNH
    (hkd.tonkhoMain || []).filter(product => product.type === 'ADJUSTMENT').forEach(adjustment => {
        allTransactions.push({
            date: adjustment.date || new Date().toISOString().substring(0, 10),
            msp: adjustment.msp,
            name: adjustment.name || 'Không có tên',
            unit: adjustment.unit || 'cái',
            type: 'ĐIỀU CHỈNH',
            reference: adjustment.description || adjustment.id,
            documentNumber: adjustment.id,
            quantity: parseFloat(adjustment.quantity) || 0,
            unitPrice: parseFloat(adjustment.price) || 0,
            amount: parseFloat(adjustment.amount) || 0,
            source: 'tonkho'
        });
    });

    // Sắp xếp theo ngày và MSP
    allTransactions.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.msp.localeCompare(b.msp);
    });

    // Tính tồn kho cho từng sản phẩm
    const stockBalances = {};
    let currentProduct = null;
    let pageNumber = 1;
    const transactionsPerPage = 30; // Số dòng mỗi trang

    // Tạo nội dung in
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sổ Nhập - Xuất - Tồn</title>
            <style>
                body { 
                    font-family: 'Times New Roman', Times, serif; 
                    font-size: 11px; 
                    margin: 15px; 
                    line-height: 1.3;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 15px; 
                    border-bottom: 2px solid #000;
                    padding-bottom: 8px;
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 16px; 
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .header h2 {
                    margin: 3px 0;
                    font-size: 12px;
                    font-weight: normal;
                }
                .period-info {
                    text-align: center;
                    margin-bottom: 10px;
                    font-weight: bold;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 8px;
                    page-break-inside: auto;
                }
                th, td { 
                    border: 1px solid #000; 
                    padding: 4px; 
                    text-align: center; 
                    font-size: 10px;
                }
                th { 
                    background-color: #f0f0f0; 
                    font-weight: bold; 
                }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .text-center { text-align: center; }
                .product-header {
                    background-color: #e8f4fd;
                    font-weight: bold;
                    border: 2px solid #000;
                }
                .page-break {
                    page-break-after: always;
                }
                .summary { 
                    margin-top: 10px; 
                    padding: 8px; 
                    background-color: #f9f9f9; 
                    border: 1px solid #ddd;
                    font-weight: bold;
                    font-size: 10px;
                }
                .footer {
                    margin-top: 15px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                }
                @media print {
                    body { margin: 10px; }
                    .no-print { display: none; }
                    .page-break { page-break-after: always; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CÔNG TY TNHH HKD</h1>
                <h2>SỔ NHẬP - XUẤT - TỒN</h2>
                <h3>Kỳ: Từ đầu năm đến ngày ${new Date().toLocaleDateString('vi-VN')}</h3>
            </div>
    `;

    let transactionCount = 0;
    let currentPageContent = '';

    allTransactions.forEach((transaction, index) => {
        // Khởi tạo số dư cho sản phẩm mới
        if (!stockBalances[transaction.msp]) {
            stockBalances[transaction.msp] = {
                quantity: 0,
                amount: 0
            };
        }

        // Thêm header cho sản phẩm mới
        if (currentProduct !== transaction.msp) {
            if (currentProduct !== null) {
                currentPageContent += `
                    <tr class="product-header">
                        <td colspan="9" class="text-left">
                            <strong>Tổng kết ${currentProduct}: Tồn cuối ${stockBalances[currentProduct].quantity.toLocaleString('vi-VN')} - Giá trị ${safeFormatCurrency(stockBalances[currentProduct].amount)}</strong>
                        </td>
                    </tr>
                `;
                transactionCount++;
            }

            currentProduct = transaction.msp;
            currentPageContent += `
                <tr class="product-header">
                    <td colspan="9" class="text-left">
                        <strong>MSP: ${transaction.msp} - ${transaction.name} - ĐVT: ${transaction.unit}</strong>
                    </td>
                </tr>
            `;
            transactionCount++;
        }

        // Cập nhật số dư
        stockBalances[transaction.msp].quantity += transaction.quantity;
        stockBalances[transaction.msp].amount += transaction.amount;

        const quantityIn = transaction.quantity > 0 ? transaction.quantity : 0;
        const quantityOut = transaction.quantity < 0 ? Math.abs(transaction.quantity) : 0;

        currentPageContent += `
            <tr>
                <td>${safeFormatDate(transaction.date)}</td>
                <td class="text-left">${transaction.documentNumber}</td>
                <td class="text-left">${transaction.reference}</td>
                <td class="text-right">${quantityIn > 0 ? quantityIn.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : ''}</td>
                <td class="text-right">${quantityIn > 0 ? safeFormatCurrency(transaction.unitPrice) : ''}</td>
                <td class="text-right">${quantityOut > 0 ? quantityOut.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : ''}</td>
                <td class="text-right">${quantityOut > 0 ? safeFormatCurrency(transaction.unitPrice) : ''}</td>
                <td class="text-right"><strong>${stockBalances[transaction.msp].quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</strong></td>
                <td class="text-right"><strong>${safeFormatCurrency(stockBalances[transaction.msp].amount)}</strong></td>
            </tr>
        `;
        transactionCount++;

        // Kiểm tra nếu cần sang trang mới
        if (transactionCount >= transactionsPerPage || index === allTransactions.length - 1) {
            printContent += `
                <div class="period-info">Trang ${pageNumber}</div>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2" style="width: 8%;">Ngày</th>
                            <th rowspan="2" style="width: 12%;">Số CT</th>
                            <th rowspan="2" style="width: 20%;">Diễn giải</th>
                            <th colspan="2" style="width: 20%;">Nhập kho</th>
                            <th colspan="2" style="width: 20%;">Xuất kho</th>
                            <th colspan="2" style="width: 20%;">Tồn kho</th>
                        </tr>
                        <tr>
                            <th style="width: 8%;">SL</th>
                            <th style="width: 12%;">Đơn giá</th>
                            <th style="width: 8%;">SL</th>
                            <th style="width: 12%;">Đơn giá</th>
                            <th style="width: 8%;">SL</th>
                            <th style="width: 12%;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentPageContent}
                    </tbody>
                </table>
            `;

            // Thêm tổng kết trang cuối
            if (index === allTransactions.length - 1) {
                // Thêm tổng kết cho sản phẩm cuối cùng
                printContent += `
                    <tr class="product-header">
                        <td colspan="9" class="text-left">
                            <strong>Tổng kết ${currentProduct}: Tồn cuối ${stockBalances[currentProduct].quantity.toLocaleString('vi-VN')} - Giá trị ${safeFormatCurrency(stockBalances[currentProduct].amount)}</strong>
                        </td>
                    </tr>
                `;

                // Thêm tổng kết toàn bộ
                const totalProducts = Object.keys(stockBalances).length;
                const totalQuantity = Object.values(stockBalances).reduce((sum, balance) => sum + balance.quantity, 0);
                const totalValue = Object.values(stockBalances).reduce((sum, balance) => sum + balance.amount, 0);

                printContent += `
                    <div class="summary">
                        <p><strong>TỔNG KẾT TOÀN BỘ SỔ:</strong> 
                        Số mặt hàng: ${totalProducts} | 
                        Tổng số lượng tồn: ${totalQuantity.toLocaleString('vi-VN')} | 
                        Tổng giá trị tồn: ${safeFormatCurrency(totalValue)}</p>
                    </div>

                    <div class="footer">
                        <div>
                            <p>Người lập biểu</p>
                            <p style="margin-top: 30px;">(Ký, ghi rõ họ tên)</p>
                        </div>
                        <div>
                            <p>Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
                            <p style="margin-top: 30px;">(Ký, ghi rõ họ tên)</p>
                        </div>
                    </div>
                `;
            }

            if (index !== allTransactions.length - 1) {
                printContent += `<div class="page-break"></div>`;
                pageNumber++;
                transactionCount = 0;
                currentPageContent = '';
            }
        }
    });

    printContent += `
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print();" style="padding: 8px 16px; font-size: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">In Ngay</button>
                <button onclick="window.close();" style="padding: 8px 16px; font-size: 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Đóng</button>
            </div>
        </body>
        </html>
    `;

    // Mở cửa sổ in
    const printWindow = window.open('', '_blank', 'width=1200,height=700');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
   
}
function initStockAlerts() {
    // Xóa cảnh báo cũ nếu có
    const existingAlert = document.querySelector('.stock-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Kiểm tra công ty hiện tại
    if (!window.currentCompany || !window.hkdData || !window.hkdData[window.currentCompany]) {
        return;
    }

    const LOW_STOCK_THRESHOLD = 10; // Ngưỡng cảnh báo
    
    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    
    const lowStockItems = Object.values(aggregatedStock).filter(item => 
        item.quantity > 0 && item.quantity <= LOW_STOCK_THRESHOLD && item.category === 'hang_hoa'
    );
    
    if (lowStockItems.length > 0) {
        showStockAlerts(lowStockItems);
    }
}

function showStockAlerts(lowStockItems) {
    // Đảm bảo chỉ hiển thị 1 cảnh báo
    const existingAlert = document.querySelector('.stock-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertHtml = `
        <div class="stock-alert" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #856404;">⚠️ CẢNH BÁO TỒN KHO THẤP</h4>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #856404;">×</button>
            </div>
            <div style="max-height: 150px; overflow-y: auto;">
                ${lowStockItems.map(item => `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #ffeaa7;">
                        <span><strong>${item.msp}</strong> - ${item.name}</span>
                        <span style="color: #dc3545;">Tồn: ${item.quantity} ${item.unit}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Thêm vào đầu tab kho hàng
    const khoHangTab = document.getElementById('kho-hang');
    if (khoHangTab) {
        const firstCard = khoHangTab.querySelector('.card');
        if (firstCard) {
            firstCard.insertAdjacentHTML('beforebegin', alertHtml);
        }
    }
}
function renderStockTrend(msp) {
    console.log('Rendering trend for:', msp); // Debug log
    
    const chartElement = document.getElementById('stock-trend-chart');
    if (!chartElement) {
        console.log('Chart element not found'); // Debug log
        return;
    }
    
    // Hiển thị loading
    chartElement.innerHTML = `
        <div style="text-align: center; width: 100%;">
            <div style="font-size: 24px;">⏳</div>
            <div>Đang tải dữ liệu...</div>
        </div>
    `;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        chartElement.innerHTML = `
            <div style="text-align: center; color: #dc3545;">
                <div>❌ Không có dữ liệu công ty</div>
            </div>
        `;
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const product = aggregatedStock[msp];
    
    if (!product) {
        chartElement.innerHTML = `
            <div style="text-align: center; color: #dc3545;">
                <div>❌ Không tìm thấy sản phẩm</div>
            </div>
        `;
        return;
    }

    // Phân tích dữ liệu
    const analysis = analyzeProductTrend(msp, hkd);
    
    // Hiển thị kết quả
    setTimeout(() => {
        chartElement.innerHTML = `
            <div style="padding: 15px; width: 100%;">
                <h6 style="margin: 0 0 15px 0; text-align: center;">${product.msp} - ${product.name}</h6>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                    <div style="background: #e8f5e8; padding: 8px; border-radius: 4px;">
                        <div style="font-weight: bold;">📦 Tồn hiện tại</div>
                        <div style="font-size: 14px; font-weight: bold;">${product.quantity.toLocaleString('vi-VN')} ${product.unit}</div>
                    </div>
                    <div style="background: #e3f2fd; padding: 8px; border-radius: 4px;">
                        <div style="font-weight: bold;">💰 Giá trị</div>
                        <div style="font-size: 14px; font-weight: bold;">${safeFormatCurrency(product.totalAmount)}</div>
                    </div>
                    <div style="background: #fff3cd; padding: 8px; border-radius: 4px;">
                        <div style="font-weight: bold;">📤 Xuất TB/tháng</div>
                        <div style="font-size: 14px; font-weight: bold;">${analysis.avgExport.toFixed(1)} ${product.unit}</div>
                    </div>
                    <div style="background: #fce4ec; padding: 8px; border-radius: 4px;">
                        <div style="font-weight: bold;">⏱️ Số tháng tồn</div>
                        <div style="font-size: 14px; font-weight: bold;">${analysis.monthsOfSupply.toFixed(1)} tháng</div>
                    </div>
                </div>
                
                ${analysis.recentMonths.length > 0 ? `
                <div style="margin-top: 15px;">
                    <div style="font-weight: bold; margin-bottom: 8px;">📅 Xu hướng 6 tháng gần nhất:</div>
                    <div style="font-size: 11px; color: #666;">
                        ${analysis.recentMonths.map(month => `
                            <div style="display: flex; justify-content: space-between; padding: 2px 0;">
                                <span>${month.month}</span>
                                <span>${month.quantity} ${product.unit}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div style="margin-top: 15px; padding: 8px; background: #f8f9fa; border-radius: 4px; text-align: center;">
                    <div style="font-size: 11px; color: #666;">
                        ${analysis.recommendation}
                    </div>
                </div>
            </div>
        `;
    }, 500);
}
function analyzeProductTrend(msp, hkd) {
    const monthlyData = {};
    const recentMonths = [];
    
    // Phân tích xuất kho 6 tháng gần nhất
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    (hkd.exports || []).forEach(exportRecord => {
        const exportDate = exportRecord.date ? new Date(exportRecord.date) : new Date();
        if (exportDate >= sixMonthsAgo) {
            const monthKey = exportDate.toISOString().substring(0, 7); // YYYY-MM
            const monthName = exportDate.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
            
            exportRecord.products.filter(p => p.msp === msp).forEach(item => {
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = {
                        month: monthName,
                        quantity: 0
                    };
                }
                monthlyData[monthKey].quantity += parseFloat(item.quantity) || 0;
            });
        }
    });
    
    // Chuyển thành mảng và sắp xếp
    Object.values(monthlyData).forEach(month => {
        recentMonths.push(month);
    });
    
    recentMonths.sort((a, b) => {
        const months = ['Thg1', 'Thg2', 'Thg3', 'Thg4', 'Thg5', 'Thg6', 'Thg7', 'Thg8', 'Thg9', 'Thg10', 'Thg11', 'Thg12'];
        const aIndex = months.findIndex(m => a.month.includes(m));
        const bIndex = months.findIndex(m => b.month.includes(m));
        return aIndex - bIndex;
    });
    
    // Tính trung bình
    const exportValues = recentMonths.map(m => m.quantity);
    const avgExport = exportValues.length > 0 ? 
        exportValues.reduce((a, b) => a + b, 0) / exportValues.length : 0;
    
    // Lấy tồn kho hiện tại
    const aggregatedStock = getAggregatedStock(hkd);
    const product = aggregatedStock[msp];
    const currentStock = product ? product.quantity : 0;
    
    // Tính số tháng tồn
    const monthsOfSupply = avgExport > 0 ? (currentStock / avgExport) : 0;
    
    // Đề xuất
    let recommendation = "Tồn kho ổn định";
    if (monthsOfSupply < 1) {
        recommendation = "⚠️ Cần nhập thêm hàng (tồn kho dưới 1 tháng)";
    } else if (monthsOfSupply > 6) {
        recommendation = "📦 Tồn kho cao, xem xét giảm nhập";
    } else if (monthsOfSupply > 3) {
        recommendation = "✅ Tồn kho tốt";
    }
    
    return {
        avgExport: avgExport,
        monthsOfSupply: monthsOfSupply,
        recentMonths: recentMonths.slice(-6), // 6 tháng gần nhất
        recommendation: recommendation
    };
}
function loadProductTrends() {
    console.log('Loading product trends...'); // Debug log
    
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        console.log('No company selected or no data'); // Debug log
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const productSelect = document.getElementById('trend-product');
    
    if (!productSelect) {
        console.log('Product select element not found'); // Debug log
        return;
    }
    
    console.log('Found product select, loading products...'); // Debug log

    // Clear existing options
    productSelect.innerHTML = '<option value="">Chọn sản phẩm...</option>';
    
    const stockItems = Object.values(aggregatedStock).filter(item => 
        item.quantity > 0 && item.category === 'hang_hoa'
    );
    
    console.log('Filtered products:', stockItems.length); // Debug log

    if (stockItems.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Không có sản phẩm nào trong kho";
        option.disabled = true;
        productSelect.appendChild(option);
        return;
    }

    stockItems.forEach(product => {
        const option = document.createElement('option');
        option.value = product.msp;
        option.textContent = `${product.msp} - ${product.name} (Tồn: ${product.quantity})`;
        productSelect.appendChild(option);
    });
    
    console.log('Products loaded into select'); // Debug log

    // Thêm sự kiện change
    productSelect.addEventListener('change', function(e) {
        console.log('Product selected:', e.target.value); // Debug log
        if (e.target.value) {
            renderStockTrend(e.target.value);
        } else {
            document.getElementById('stock-trend-chart').innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 48px;">📈</div>
                    <div>Chọn sản phẩm để xem xu hướng</div>
                </div>
            `;
        }
    });
    
    console.log('Event listener added'); // Debug log
}
/**
 * Dự báo nhu cầu hàng hóa
 */
function initDemandForecast() {
    const html = `
        <div class="card">
            <div class="card-header">
                <h5>🔮 Dự Báo Nhu Cầu</h5>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label>Số tháng dự báo:</label>
                    <select id="forecast-months" class="form-control">
                        <option value="1">1 tháng</option>
                        <option value="2">2 tháng</option>
                        <option value="3">3 tháng</option>
                    </select>
                </div>
                <button onclick="generateDemandForecast()" class="btn-primary">Tạo Dự Báo</button>
                <div id="forecast-result" style="margin-top: 15px;"></div>
            </div>
        </div>
    `;
    
    // Thêm vào tab
    const existingCards = document.querySelectorAll('.card');
    existingCards[existingCards.length - 2].insertAdjacentHTML('afterend', html);
}

function generateDemandForecast() {
    const months = parseInt(document.getElementById('forecast-months').value);
    const hkd = window.hkdData[window.currentCompany];
    
    // Phân tích lịch sử xuất hàng
    const exportHistory = {};
    
    (hkd.exports || []).forEach(exportRecord => {
        const month = exportRecord.date.substring(0, 7); // YYYY-MM
        
        exportRecord.products.forEach(item => {
            if (!exportHistory[item.msp]) {
                exportHistory[item.msp] = {};
            }
            if (!exportHistory[item.msp][month]) {
                exportHistory[item.msp][month] = 0;
            }
            exportHistory[item.msp][month] += parseFloat(item.quantity) || 0;
        });
    });
    
    // Tạo dự báo
    const forecastResults = [];
    const aggregatedStock = getAggregatedStock(hkd);
    
    Object.values(aggregatedStock).forEach(product => {
        if (product.quantity > 0) {
            const monthlyAvg = calculateMonthlyAverage(exportHistory[product.msp]);
            const forecast = monthlyAvg * months;
            const weeksOfSupply = product.quantity / monthlyAvg;
            
            forecastResults.push({
                msp: product.msp,
                name: product.name,
                currentStock: product.quantity,
                monthlyAvg: monthlyAvg,
                forecast: forecast,
                weeksOfSupply: weeksOfSupply,
                status: weeksOfSupply < 2 ? 'CẦN NHẬP' : weeksOfSupply < 4 ? 'THEO DÕI' : 'ĐỦ DÙNG'
            });
        }
    });
    
    displayForecastResults(forecastResults);
}
/**
 * Báo cáo hiệu suất kho
 */
function initWarehousePerformance() {
    const html = `
        <div class="card">
            <div class="card-header">
                <h5>📈 Hiệu Suất Kho</h5>
            </div>
            <div class="card-body">
                <div class="performance-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    <div class="stat-card" style="background: #e8f5e8; padding: 15px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #28a745;">0%</div>
                        <div style="font-size: 12px;">Tỷ lệ xoay vòng</div>
                    </div>
                    <div class="stat-card" style="background: #fff3cd; padding: 15px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #ffc107;">0</div>
                        <div style="font-size: 12px;">SKU tồn kho</div>
                    </div>
                    <div class="stat-card" style="background: #f8d7da; padding: 15px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #dc3545;">0</div>
                        <div style="font-size: 12px;">SKU sắp hết</div>
                    </div>
                </div>
                <button onclick="generatePerformanceReport()" class="btn-primary" style="margin-top: 15px;">Tạo Báo Cáo Hiệu Suất</button>
            </div>
        </div>
    `;
    
    // Thêm vào tab
    const existingCards = document.querySelectorAll('.card');
    existingCards[existingCards.length - 2].insertAdjacentHTML('afterend', html);
}
/**
 * Tìm kiếm thông minh
 */
function initSmartSearch() {
    const searchInput = document.getElementById('search-products');
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm.length >= 2) {
            showSearchSuggestions(searchTerm);
        } else {
            hideSearchSuggestions();
        }
    });
    
    // Thêm dropdown gợi ý
    const suggestionsHtml = `
        <div id="search-suggestions" style="display: none; position: absolute; background: white; border: 1px solid #ddd; max-height: 200px; overflow-y: auto; z-index: 1000; width: calc(100% - 30px);">
            <div class="suggestion-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;">Tìm kiếm...</div>
        </div>
    `;
    
    searchInput.insertAdjacentHTML('afterend', suggestionsHtml);
}
/**
 * Hàm in báo cáo tồn kho - Mở máy in trực tiếp
 */
function printStockReport(startDate = '', endDate = '') {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        alert('Vui lòng chọn công ty');
        return;
    }

    const reportDateStart = startDate || document.getElementById('report-date-start').value;
    const reportDateEnd = endDate || document.getElementById('report-date-end').value;
    
    if (!reportDateStart || !reportDateEnd) {
        alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc');
        return;
    }

    // Sử dụng hàm tổng hợp theo khoảng ngày
    const aggregatedStock = getAggregatedStockByDateRange(reportDateStart, reportDateEnd);
    const stockItems = Object.values(aggregatedStock).filter(item => item.quantity > 0);

    const formattedStartDate = safeFormatDate(reportDateStart);
    const formattedEndDate = safeFormatDate(reportDateEnd);

    let totalQuantity = 0;
    let totalValue = 0;

    // Tạo nội dung báo cáo
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Báo Cáo Tồn Kho</title>
            <style>
                body { 
                    font-family: 'Times New Roman', Times, serif; 
                    font-size: 12px; 
                    margin: 20px; 
                    line-height: 1.4;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 20px; 
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 18px; 
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .header h2 {
                    margin: 5px 0;
                    font-size: 14px;
                    font-weight: normal;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 10px;
                }
                th, td { 
                    border: 1px solid #000; 
                    padding: 6px; 
                    text-align: center; 
                    font-size: 11px;
                }
                th { 
                    background-color: #f0f0f0; 
                    font-weight: bold; 
                }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .text-center { text-align: center; }
                .summary { 
                    margin-top: 15px; 
                    padding: 10px; 
                    background-color: #f9f9f9; 
                    border: 1px solid #ddd;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CÔNG TY TNHH HKD</h1>
                <h2>BÁO CÁO TỒN KHO</h2>
                <h3>Từ ngày ${formattedStartDate} đến ngày ${formattedEndDate}</h3>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 10%;">STT</th>
                        <th style="width: 15%;">MSP</th>
                        <th style="width: 30%;">Tên hàng hóa</th>
                        <th style="width: 10%;">ĐVT</th>
                        <th style="width: 15%;">Số lượng</th>
                        <th style="width: 15%;">Đơn giá TB</th>
                        <th style="width: 15%;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;

    stockItems.forEach((item, index) => {
        totalQuantity += item.quantity;
        totalValue += item.totalAmount;

        printContent += `
            <tr>
                <td>${index + 1}</td>
                <td class="text-left">${item.msp}</td>
                <td class="text-left">${item.name}</td>
                <td>${item.unit}</td>
                <td class="text-right">${item.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td class="text-right">${safeFormatCurrency(item.avgPrice)}</td>
                <td class="text-right">${safeFormatCurrency(item.totalAmount)}</td>
            </tr>
        `;
    });

    printContent += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background-color: #e9ecef;">
                        <td colspan="4" class="text-center">TỔNG CỘNG</td>
                        <td class="text-right">${totalQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                        <td></td>
                        <td class="text-right">${safeFormatCurrency(totalValue)}</td>
                    </tr>
                </tfoot>
            </table>

            <div class="summary">
                <p><strong>Tổng số mặt hàng:</strong> ${stockItems.length} | 
                <strong>Tổng số lượng:</strong> ${totalQuantity.toLocaleString('vi-VN')} | 
                <strong>Tổng giá trị tồn kho:</strong> ${safeFormatCurrency(totalValue)}</p>
            </div>

            <div class="footer">
                <div>
                    <p>Người lập biểu</p>
                    <p style="margin-top: 40px;">(Ký, ghi rõ họ tên)</p>
                </div>
                <div>
                    <p>Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
                    <p style="margin-top: 40px;">(Ký, ghi rõ họ tên)</p>
                </div>
            </div>

            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print();" style="padding: 10px 20px; font-size: 14px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">In Ngay</button>
                <button onclick="window.close();" style="padding: 10px 20px; font-size: 14px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Đóng</button>
            </div>
        </body>
        </html>
    `;

    // Mở cửa sổ in
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
   
}
// Sửa lại hàm getAggregatedStock để đảm bảo có thể gọi được
function getAggregatedStock(hkd = null) {
    if (!hkd) {
        if (!window.currentCompany || !window.hkdData || !window.hkdData[window.currentCompany]) {
            return {};
        }
        hkd = window.hkdData[window.currentCompany];
    }
    
    const aggregatedStock = {};
    
    (hkd.tonkhoMain || []).forEach(product => {
        const productCategory = product.category || 'hang_hoa';
        const quantity = parseFloat(product.quantity) || 0;
        const amount = parseFloat(product.amount) || 0;
        
        if (!product.msp) return;

        if (!aggregatedStock[product.msp]) {
            aggregatedStock[product.msp] = {
                msp: product.msp,
                name: product.name || 'Không có tên',
                unit: product.unit || 'cái',
                quantity: 0,
                totalAmount: 0,
                avgPrice: 0,
                category: productCategory
            };
        }

        if (productCategory === 'hang_hoa' || productCategory === 'dich_vu') {
            aggregatedStock[product.msp].quantity += quantity;
            aggregatedStock[product.msp].totalAmount += amount;
        }
    });

    Object.values(aggregatedStock).forEach(product => {
        if (product.quantity > 0 && product.category === 'hang_hoa') {
            product.avgPrice = Math.abs(product.totalAmount) / product.quantity;
        } else {
            product.avgPrice = 0;
        }
    });

    return aggregatedStock;
}
window.initKhoHangModule = initKhoHangModule;
window.loadProductCatalog = loadProductCatalog;
window.viewStockCard = viewStockCard;
window.adjustStock = adjustStock;
window.generateStockReport = generateStockReport;
window.getAggregatedStock = getAggregatedStock;
window.safeFormatCurrency = safeFormatCurrency;
window.safeFormatDate = safeFormatDate;
window.accountingRound = accountingRound; // THÊM
window.getProductClassification = getProductClassification; // THÊM