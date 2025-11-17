// smart-sale-floating.js - Hệ thống bán hàng thông minh với nút nổi

class SmartSaleFloating {
    constructor() {
        this.isOpen = false;
        this.currentDistribution = [];
        this.selectedDays = new Set();
        this.init();
    }

    init() {
        this.addFloatingButton();
        this.addStyles();
        this.bindGlobalEvents();
        console.log('🚀 Smart Sale Floating initialized');
    }

    // ==================== FLOATING BUTTON ====================
    addFloatingButton() {
        if (document.getElementById('smart-sale-floating-btn')) return;

        const floatingBtn = document.createElement('button');
        floatingBtn.id = 'smart-sale-floating-btn';
        floatingBtn.innerHTML = '🚀<br>Bán Hàng<br>Thông Minh';
        floatingBtn.className = 'smart-sale-floating-btn';
        
        document.body.appendChild(floatingBtn);

        // Click event
        floatingBtn.addEventListener('click', () => {
            this.toggleSmartSalePanel();
        });
    }

    // ==================== SMART SALE PANEL ====================
    toggleSmartSalePanel() {
        if (this.isOpen) {
            this.closeSmartSalePanel();
        } else {
            this.openSmartSalePanel();
        }
    }

    openSmartSalePanel() {
        if (this.isOpen) return;

        const panelHTML = this.renderSmartSalePanel();
        const overlay = document.createElement('div');
        overlay.id = 'smart-sale-overlay';
        overlay.innerHTML = panelHTML;
        document.body.appendChild(overlay);

        this.bindPanelEvents();
        this.isOpen = true;

        // Load initial data
        this.loadInitialData();
    }

    closeSmartSalePanel() {
        const overlay = document.getElementById('smart-sale-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.isOpen = false;
    }

    // ==================== MAIN PANEL RENDER ====================
    renderSmartSalePanel() {
        return `
            <div class="smart-sale-panel">
                <!-- Header -->
                <div class="smart-sale-header">
                    <h3>🏪 BÁN HÀNG THÔNG MINH</h3>
                    <button class="close-btn" onclick="window.smartSaleFloating.closeSmartSalePanel()">×</button>
                </div>

                <!-- Main Content -->
                <div class="smart-sale-content">
                    ${this.renderCustomerSection()}
                    ${this.renderScheduleSection()}
                    ${this.renderDistributionSection()}
                    ${this.renderPreviewSection()}
                </div>

                <!-- Action Buttons -->
                <div class="smart-sale-actions">
                    <button class="btn-primary" onclick="window.smartSaleFloating.confirmDistribution()">
                        ✅ Xác Nhận Phân Bổ
                    </button>
                    <button class="btn-secondary" onclick="window.smartSaleFloating.recalculateDistribution()">
                        🔄 Tính Lại
                    </button>
                    <button class="btn-success" onclick="window.smartSaleFloating.saveSchedule()">
                        💾 Lưu Lịch Trình
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== SECTION RENDERS ====================
    renderCustomerSection() {
        return `
            <div class="section">
                <h4>🔍 CHỌN KHÁCH HÀNG</h4>
                <div class="search-options">
                    <label><input type="checkbox" id="search-mst" checked> MST</label>
                    <label><input type="checkbox" id="search-name" checked> Tên</label>
                    <label><input type="checkbox" id="search-phone"> SĐT</label>
                </div>
                <div class="search-inputs">
                    <input type="text" id="customer-company" placeholder="🏢 Tên công ty..." class="form-control">
                    <input type="text" id="customer-name" placeholder="👤 Tên khách hàng..." class="form-control">
                    <button class="btn-small" onclick="window.smartSaleFloating.searchCustomer()">🔍 Tìm</button>
                </div>
            </div>
        `;
    }

    renderScheduleSection() {
        return `
            <div class="section">
                <h4>📅 THIẾT LẬP LỊCH TRÌNH</h4>
                <div class="schedule-grid">
                    <!-- Chế độ lập lịch -->
                    <div class="form-group">
                        <label>Chế độ:</label>
                        <select id="schedule-mode" class="form-control" onchange="window.smartSaleFloating.onScheduleModeChange()">
                            <option value="once">Một lần</option>
                            <option value="daily">Hàng ngày</option>
                            <option value="weekly">Hàng tuần</option>
                            <option value="monthly">Hàng tháng</option>
                        </select>
                    </div>

                    <!-- Chế độ giờ -->
                    <div class="form-group">
                        <label>Giờ xuất:</label>
                        <select id="time-mode" class="form-control" onchange="window.smartSaleFloating.onTimeModeChange()">
                            <option value="fixed">Giờ cố định</option>
                            <option value="random">Random giờ</option>
                        </select>
                    </div>

                    <!-- Phân bổ -->
                    <div class="form-group">
                        <label>Phân bổ:</label>
                        <select id="distribution-mode" class="form-control" onchange="window.smartSaleFloating.onDistributionModeChange()">
                            <option value="equal">Chia đều</option>
                            <option value="increasing">Tăng dần</option>
                            <option value="decreasing">Giảm dần</option>
                            <option value="random">Ngẫu nhiên</option>
                            <option value="custom">Tùy chỉnh</option>
                        </select>
                    </div>
                </div>

                <!-- Chi tiết thiết lập -->
                <div class="detail-grid">
                    <div class="form-group">
                        <label>Tổng số tiền:</label>
                        <input type="number" id="total-amount" class="form-control" value="100000000" placeholder="Số tiền">
                    </div>
                    <div class="form-group">
                        <label>Số ngày xuất:</label>
                        <input type="number" id="days-count" class="form-control" value="10" min="1" max="30">
                    </div>
                    <div class="form-group">
                        <label>Ngày bắt đầu:</label>
                        <input type="date" id="start-date" class="form-control" value="${this.getTodayDate()}">
                    </div>
                    <div class="form-group">
                        <label>Giờ xuất:</label>
                        <input type="time" id="fixed-time" class="form-control" value="09:00">
                        <div id="random-time-range" style="display: none;">
                            <span>08:00 - 17:00</span>
                        </div>
                    </div>
                </div>

                <button class="btn-primary" onclick="window.smartSaleFloating.generateDistribution()">
                    🎲 Tạo Phân Bổ Tự Động
                </button>
            </div>
        `;
    }

    renderDistributionSection() {
        return `
            <div class="section">
                <h4>📊 PHÂN BỔ CHI TIẾT</h4>
                <div class="distribution-controls">
                    <button class="btn-small" onclick="window.smartSaleFloating.selectAllDays()">✓ Chọn tất cả</button>
                    <button class="btn-small" onclick="window.smartSaleFloating.deselectAllDays()">✗ Bỏ chọn tất cả</button>
                    <button class="btn-small" onclick="window.smartSaleFloating.randomizeDistribution()">🎲 Random</button>
                </div>
                
                <div id="distribution-list" class="distribution-list">
                    <!-- Distribution items will be loaded here -->
                </div>

                <div class="distribution-summary">
                    <strong>Đã chọn: <span id="selected-days-count">0</span>/<span id="total-days-count">0</span> ngày</strong>
                    <strong>Tổng tiền: <span id="selected-amount-total">0</span>₫</strong>
                </div>
            </div>
        `;
    }

    renderPreviewSection() {
        return `
            <div class="section">
                <h4>👁️ XEM TRƯỚC</h4>
                <div class="preview-chart" id="preview-chart">
                    <!-- Biểu đồ phân bổ sẽ được render here -->
                </div>
                <div class="preview-stats">
                    <div>Tổng số tiền: <span id="preview-total-amount">0</span>₫</div>
                    <div>Tổng sản phẩm: <span id="preview-total-products">0</span> SP</div>
                    <div>Số ngày thực hiện: <span id="preview-days-count">0</span> ngày</div>
                </div>
            </div>
        `;
    }

    // ==================== DISTRIBUTION LOGIC ====================
    generateDistribution() {
        const totalAmount = parseInt(document.getElementById('total-amount').value) || 0;
        const daysCount = parseInt(document.getElementById('days-count').value) || 1;
        const distributionMode = document.getElementById('distribution-mode').value;

        if (totalAmount <= 0) {
            alert('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        const amounts = this.calculateDistribution(totalAmount, daysCount, distributionMode);
        const times = this.generateTimes(daysCount);
        
        this.currentDistribution = amounts.map((amount, index) => ({
            date: this.calculateDate(index),
            time: times[index],
            amount: amount,
            selected: true,
            products: []
        }));

        this.selectedDays = new Set(Array.from({length: daysCount}, (_, i) => i));
        this.renderDistributionList();
        this.updatePreview();
    }

    calculateDistribution(totalAmount, daysCount, mode) {
        const distributor = new DistributionCalculator();
        return distributor.distribute(totalAmount, daysCount, mode);
    }

    generateTimes(daysCount) {
        const timeMode = document.getElementById('time-mode').value;
        
        if (timeMode === 'fixed') {
            const fixedTime = document.getElementById('fixed-time').value;
            return Array(daysCount).fill(fixedTime);
        } else {
            // Random times between 8:00 and 17:00
            return Array.from({length: daysCount}, () => {
                const hour = Math.floor(Math.random() * 10) + 8; // 8-17
                const minute = Math.floor(Math.random() * 4) * 15; // 0,15,30,45
                return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            });
        }
    }

    calculateDate(dayIndex) {
        const startDate = new Date(document.getElementById('start-date').value);
        startDate.setDate(startDate.getDate() + dayIndex);
        return startDate.toISOString().split('T')[0];
    }

    // ==================== DISTRIBUTION LIST RENDER ====================
    renderDistributionList() {
        const container = document.getElementById('distribution-list');
        if (!container) return;

        container.innerHTML = this.currentDistribution.map((item, index) => `
            <div class="distribution-item ${item.selected ? 'selected' : ''}">
                <label class="day-selector">
                    <input type="checkbox" ${item.selected ? 'checked' : ''} 
                           onchange="window.smartSaleFloating.toggleDay(${index})">
                    <span class="checkmark"></span>
                </label>
                
                <div class="day-info">
                    <div class="date">${this.formatDate(item.date)}</div>
                    <div class="time">🕘 ${item.time}</div>
                </div>
                
                <div class="amount-info">
                    <div class="amount">${this.formatCurrency(item.amount)}₫</div>
                    <div class="products">~ ${Math.round(item.amount / 1000000)} SP</div>
                </div>
                
                <div class="day-controls">
                    <input type="number" class="amount-input" value="${item.amount}" 
                           onchange="window.smartSaleFloating.adjustAmount(${index}, this.value)">
                    <button class="btn-tiny" onclick="window.smartSaleFloating.randomizeTime(${index})">🕐</button>
                </div>
            </div>
        `).join('');

        this.updateSummary();
    }

    // ==================== EVENT HANDLERS ====================
    toggleDay(index) {
        if (this.selectedDays.has(index)) {
            this.selectedDays.delete(index);
        } else {
            this.selectedDays.add(index);
        }
        this.currentDistribution[index].selected = this.selectedDays.has(index);
        this.renderDistributionList();
        this.updatePreview();
    }

    selectAllDays() {
        this.selectedDays = new Set(Array.from({length: this.currentDistribution.length}, (_, i) => i));
        this.currentDistribution.forEach(item => item.selected = true);
        this.renderDistributionList();
        this.updatePreview();
    }

    deselectAllDays() {
        this.selectedDays.clear();
        this.currentDistribution.forEach(item => item.selected = false);
        this.renderDistributionList();
        this.updatePreview();
    }

    adjustAmount(index, newAmount) {
        const amount = parseInt(newAmount) || 0;
        this.currentDistribution[index].amount = amount;
        this.updatePreview();
    }

    randomizeTime(index) {
        const hour = Math.floor(Math.random() * 10) + 8;
        const minute = Math.floor(Math.random() * 4) * 15;
        this.currentDistribution[index].time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        this.renderDistributionList();
    }

    randomizeDistribution() {
        const totalAmount = this.currentDistribution.reduce((sum, item) => sum + item.amount, 0);
        const selectedCount = this.selectedDays.size;
        
        if (selectedCount === 0) return;

        const newAmounts = this.calculateDistribution(totalAmount, selectedCount, 'random');
        let amountIndex = 0;
        
        this.currentDistribution.forEach((item, index) => {
            if (item.selected) {
                item.amount = newAmounts[amountIndex++];
            }
        });

        this.renderDistributionList();
        this.updatePreview();
    }

    // ==================== PREVIEW & SUMMARY ====================
    updatePreview() {
        const selectedItems = this.currentDistribution.filter(item => item.selected);
        const totalAmount = selectedItems.reduce((sum, item) => sum + item.amount, 0);
        const totalProducts = Math.round(totalAmount / 1000000); // Giả định 1tr/SP

        document.getElementById('preview-total-amount').textContent = this.formatCurrency(totalAmount);
        document.getElementById('preview-total-products').textContent = totalProducts;
        document.getElementById('preview-days-count').textContent = selectedItems.length;

        this.renderPreviewChart(selectedItems);
    }

    updateSummary() {
        const selectedItems = this.currentDistribution.filter(item => item.selected);
        const totalAmount = selectedItems.reduce((sum, item) => sum + item.amount, 0);

        document.getElementById('selected-days-count').textContent = selectedItems.length;
        document.getElementById('total-days-count').textContent = this.currentDistribution.length;
        document.getElementById('selected-amount-total').textContent = this.formatCurrency(totalAmount);
    }

    renderPreviewChart(items) {
        const container = document.getElementById('preview-chart');
        if (!container) return;

        const maxAmount = Math.max(...items.map(item => item.amount));
        
        container.innerHTML = items.map(item => `
            <div class="chart-bar">
                <div class="bar-label">${this.formatDate(item.date)}</div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${(item.amount / maxAmount) * 100}%"></div>
                </div>
                <div class="bar-amount">${this.formatCurrency(item.amount)}</div>
            </div>
        `).join('');
    }

    // ==================== ACTION HANDLERS ====================
    confirmDistribution() {
        const selectedItems = this.currentDistribution.filter(item => item.selected);
        
        if (selectedItems.length === 0) {
            alert('Vui lòng chọn ít nhất một ngày xuất hàng');
            return;
        }

        // Generate products for each day
        selectedItems.forEach(item => {
            item.products = this.generateProductsForAmount(item.amount);
        });

        alert(`✅ Đã xác nhận phân bổ ${selectedItems.length} ngày xuất hàng!`);
        this.updatePreview();
    }

    recalculateDistribution() {
        this.generateDistribution();
    }

    saveSchedule() {
        const selectedItems = this.currentDistribution.filter(item => item.selected);
        
        if (selectedItems.length === 0) {
            alert('Vui lòng xác nhận phân bổ trước khi lưu');
            return;
        }

        // Save to localStorage or send to server
        const schedule = {
            id: 'SCHEDULE_' + Date.now(),
            items: selectedItems,
            totalAmount: selectedItems.reduce((sum, item) => sum + item.amount, 0),
            createdAt: new Date().toISOString()
        };

        this.saveToStorage(schedule);
        alert('💾 Đã lưu lịch trình xuất hàng!');
    }

    // ==================== UTILITY FUNCTIONS ====================
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    loadInitialData() {
        // Load customers, products, etc.
        setTimeout(() => {
            this.generateDistribution();
        }, 100);
    }

    bindPanelEvents() {
        // Bind various event listeners
        console.log('Binding panel events...');
    }

    bindGlobalEvents() {
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !e.target.closest('.smart-sale-panel') && 
                !e.target.closest('.smart-sale-floating-btn')) {
                this.closeSmartSalePanel();
            }
        });
    }

    saveToStorage(schedule) {
        const schedules = JSON.parse(localStorage.getItem('smart_sale_schedules') || '[]');
        schedules.push(schedule);
        localStorage.setItem('smart_sale_schedules', JSON.stringify(schedules));
    }

    // ==================== STYLES ====================
    addStyles() {
        if (document.getElementById('smart-sale-styles')) return;

        const styles = `
            <style>
                /* Floating Button */
                .smart-sale-floating-btn {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                    z-index: 10000;
                    font-size: 12px;
                    font-weight: bold;
                    text-align: center;
                    transition: all 0.3s ease;
                }

                .smart-sale-floating-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 12px 35px rgba(0,0,0,0.4);
                }

                /* Overlay */
                #smart-sale-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 10001;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                /* Main Panel */
                .smart-sale-panel {
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .smart-sale-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .smart-sale-header h3 {
                    margin: 0;
                    font-size: 1.5em;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                }

                .smart-sale-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }

                .smart-sale-actions {
                    padding: 20px;
                    background: #f8f9fa;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    border-top: 1px solid #dee2e6;
                }

                /* Sections */
                .section {
                    margin-bottom: 25px;
                    padding: 20px;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    background: #f8f9fa;
                }

                .section h4 {
                    margin-top: 0;
                    margin-bottom: 15px;
                    color: #495057;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 8px;
                }

                /* Form Elements */
                .form-control {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .schedule-grid, .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #495057;
                    font-size: 13px;
                }

                /* Buttons */
                .btn-primary, .btn-secondary, .btn-success, .btn-small, .btn-tiny {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    transition: all 0.2s;
                }

                .btn-primary { background: #007bff; color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                .btn-success { background: #28a745; color: white; }
                .btn-small { padding: 6px 12px; font-size: 12px; }
                .btn-tiny { padding: 4px 8px; font-size: 10px; }

                .btn-primary:hover { background: #0056b3; }
                .btn-secondary:hover { background: #545b62; }
                .btn-success:hover { background: #1e7e34; }

                /* Distribution List */
                .distribution-list {
                    max-height: 300px;
                    overflow-y: auto;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    background: white;
                }

                .distribution-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 15px;
                    border-bottom: 1px solid #e9ecef;
                    transition: background 0.2s;
                }

                .distribution-item:hover {
                    background: #f8f9fa;
                }

                .distribution-item.selected {
                    background: #e7f3ff;
                    border-left: 4px solid #007bff;
                }

                .day-selector {
                    margin-right: 15px;
                }

                .day-info {
                    flex: 1;
                }

                .date {
                    font-weight: bold;
                    color: #495057;
                }

                .time {
                    font-size: 12px;
                    color: #6c757d;
                }

                .amount-info {
                    text-align: right;
                    margin-right: 15px;
                }

                .amount {
                    font-weight: bold;
                    color: #28a745;
                }

                .products {
                    font-size: 11px;
                    color: #6c757d;
                }

                .day-controls {
                    display: flex;
                    gap: 5px;
                    align-items: center;
                }

                .amount-input {
                    width: 100px;
                    padding: 4px 8px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    text-align: right;
                }

                /* Preview Chart */
                .preview-chart {
                    background: white;
                    padding: 15px;
                    border-radius: 6px;
                    border: 1px solid #dee2e6;
                }

                .chart-bar {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .bar-label {
                    width: 80px;
                    font-size: 12px;
                    color: #495057;
                }

                .bar-container {
                    flex: 1;
                    height: 20px;
                    background: #e9ecef;
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 0 10px;
                }

                .bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    transition: width 0.3s ease;
                }

                .bar-amount {
                    width: 100px;
                    text-align: right;
                    font-size: 12px;
                    font-weight: bold;
                    color: #495057;
                }

                /* Search Options */
                .search-options {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 10px;
                }

                .search-options label {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 13px;
                    cursor: pointer;
                }

                .search-inputs {
                    display: flex;
                    gap: 10px;
                }

                .search-inputs input {
                    flex: 1;
                }

                /* Distribution Controls */
                .distribution-controls {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .distribution-summary {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 15px;
                    padding: 10px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #dee2e6;
                }

                /* Preview Stats */
                .preview-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 10px;
                    margin-top: 15px;
                    padding: 15px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #dee2e6;
                }

                .preview-stats div {
                    text-align: center;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 4px;
                    font-weight: bold;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .smart-sale-panel {
                        width: 95%;
                        height: 95vh;
                    }
                    
                    .schedule-grid, .detail-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .search-inputs {
                        flex-direction: column;
                    }
                    
                    .smart-sale-actions {
                        flex-direction: column;
                    }
                    
                    .distribution-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                    
                    .day-controls {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// ==================== DISTRIBUTION CALCULATOR ====================
class DistributionCalculator {
    distribute(totalAmount, daysCount, mode) {
        switch (mode) {
            case 'equal':
                return this.distributeEqual(totalAmount, daysCount);
            case 'increasing':
                return this.distributeIncreasing(totalAmount, daysCount);
            case 'decreasing':
                return this.distributeDecreasing(totalAmount, daysCount);
            case 'random':
                return this.distributeRandom(totalAmount, daysCount);
            default:
                return this.distributeEqual(totalAmount, daysCount);
        }
    }

    distributeEqual(totalAmount, daysCount) {
        const baseAmount = Math.floor(totalAmount / daysCount);
        const amounts = Array(daysCount).fill(baseAmount);
        
        // Distribute remainder
        const remainder = totalAmount - (baseAmount * daysCount);
        for (let i = 0; i < remainder; i++) {
            amounts[i] += 1;
        }
        
        return amounts;
    }

    distributeIncreasing(totalAmount, daysCount) {
        // Create increasing weights (1, 2, 3, ..., n)
        const weights = Array.from({length: daysCount}, (_, i) => i + 1);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        return weights.map(weight => 
            Math.round((weight / totalWeight) * totalAmount)
        );
    }

    distributeDecreasing(totalAmount, daysCount) {
        // Create decreasing weights (n, n-1, ..., 1)
        const weights = Array.from({length: daysCount}, (_, i) => daysCount - i);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        return weights.map(weight => 
            Math.round((weight / totalWeight) * totalAmount)
        );
    }

    distributeRandom(totalAmount, daysCount) {
        const amounts = [];
        let remaining = totalAmount;
        
        // Generate random amounts for first n-1 days
        for (let i = 0; i < daysCount - 1; i++) {
            const max = Math.floor(remaining * 0.8); // Don't use all remaining
            const amount = Math.floor(Math.random() * max) + Math.floor(remaining * 0.1);
            amounts.push(amount);
            remaining -= amount;
        }
        
        // Last day gets whatever is left
        amounts.push(remaining);
        
        // Shuffle to make it truly random
        return this.shuffleArray(amounts);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// ==================== INITIALIZATION ====================
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (!window.smartSaleFloating) {
            window.smartSaleFloating = new SmartSaleFloating();
            console.log('🚀 Smart Sale Floating system initialized');
        }
    }, 1000);
});

// Fallback initialization
if (!window.smartSaleFloating) {
    window.smartSaleFloating = new SmartSaleFloating();
}

// Export for global access
window.SmartSaleFloating = SmartSaleFloating;
window.DistributionCalculator = DistributionCalculator;
