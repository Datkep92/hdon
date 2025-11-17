// auto-export-scheduler.js

class AutoExportScheduler {
    constructor() {
        this.scheduledExports = this.loadScheduledExports();
        this.init();
    }

    init() {
        this.setupInterface();
        this.startScheduler();
        console.log('⏰ Auto Export Scheduler initialized');
    }

    setupInterface() {
        // Thêm nút vào giao diện bán hàng
        this.addSchedulerButton();
        // Thêm CSS
        this.addSchedulerStyles();
    }

    addSchedulerStyles() {
        if (document.getElementById('scheduler-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'scheduler-styles';
        style.textContent = `
            .scheduled-export-item {
                padding: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                margin-bottom: 10px;
                background: #f8f9fa;
                transition: all 0.3s;
            }
            
            .scheduled-export-item:hover {
                background: #e3f2fd;
                border-color: #007bff;
            }
            
            .scheduled-export-item.active {
                background: #fff3cd;
                border-color: #ffc107;
            }
            
            .scheduled-export-item.completed {
                background: #d4edda;
                border-color: #28a745;
                opacity: 0.7;
            }
            
            .scheduled-export-item.cancelled {
                background: #f8d7da;
                border-color: #dc3545;
                opacity: 0.7;
            }
            
            .export-countdown {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
            }
            
            .export-countdown.urgent {
                color: #dc3545;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    addSchedulerButton() {
        const existingBtn = document.getElementById('auto-export-btn');
        if (existingBtn) return;

        // Tìm header của tab bán hàng
        const cardHeader = document.querySelector('#ban-hang .card-header');
        if (cardHeader) {
            const schedulerBtn = document.createElement('button');
            schedulerBtn.type = 'button';
            schedulerBtn.id = 'auto-export-btn';
            schedulerBtn.className = 'btn btn-warning';
            schedulerBtn.innerHTML = '⏰ Hẹn giờ xuất hàng';
            schedulerBtn.style.marginLeft = '10px';
            schedulerBtn.onclick = () => this.showSchedulerModal();
            
            // Thêm vào header
            const headerContainer = cardHeader.querySelector('div') || cardHeader;
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.alignItems = 'center';
            
            // Di chuyển các nút hiện có vào container
            const existingButtons = headerContainer.querySelectorAll('button');
            existingButtons.forEach(btn => buttonContainer.appendChild(btn));
            
            buttonContainer.appendChild(schedulerBtn);
            headerContainer.appendChild(buttonContainer);
        }
    }

    showSchedulerModal() {
        const modalContent = this.renderSchedulerModal();
        window.showModal('⏰ Lập Lịch Tự Động Xuất Hàng', modalContent, 'large');
    }

    renderSchedulerModal() {
        return `
            <div style="min-height: 500px;">
                <!-- Form tạo lịch mới -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="card-header">
                        <h6 style="margin: 0;">➕ Tạo lịch xuất hàng mới</h6>
                    </div>
                    <div class="card-body">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="schedule-name">Tên lịch trình *</label>
                                <input type="text" id="schedule-name" class="form-control" placeholder="VD: Xuất hàng cho KH A lúc 14:00">
                            </div>
                            <div class="form-group">
                                <label for="schedule-date">Ngày xuất hàng *</label>
                                <input type="date" id="schedule-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label for="schedule-time">Giờ xuất hàng *</label>
                                <input type="time" id="schedule-time" class="form-control" value="09:00">
                            </div>
                            <div class="form-group">
                                <label for="schedule-customer">Khách hàng</label>
                                <input type="text" id="schedule-customer" class="form-control" placeholder="Tên khách hàng">
                            </div>
                        </div>
                        
                        <div style="margin: 15px 0;">
                            <label for="schedule-amount">Số tiền mong muốn *</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="number" id="schedule-amount" class="form-control" placeholder="Số tiền" min="1000" step="1000">
                                <button class="btn btn-outline-primary" onclick="window.autoExportScheduler.randomizeScheduleProducts()">🎲 Random hàng</button>
                            </div>
                        </div>
                        
                        <div id="schedule-products-preview" style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 4px; display: none;">
                            <h6>📦 Sản phẩm sẽ xuất:</h6>
                            <div id="schedule-products-list"></div>
                            <div id="schedule-total-amount" style="font-weight: bold; margin-top: 10px;"></div>
                        </div>
                        
                        <div style="text-align: right;">
                            <button class="btn btn-success" onclick="window.autoExportScheduler.createSchedule()">
                                💾 Lưu lịch trình
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Danh sách lịch trình -->
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h6 style="margin: 0;">📅 Lịch trình đã lập (${this.scheduledExports.length})</h6>
                        <button class="btn-sm btn-outline-secondary" onclick="window.autoExportScheduler.exportSchedules()">📤 Export</button>
                    </div>
                    <div class="card-body">
                        <div id="scheduled-exports-list">
                            ${this.renderScheduledExportsList()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderScheduledExportsList() {
        if (this.scheduledExports.length === 0) {
            return `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px;">⏰</div>
                    <p>Chưa có lịch trình nào</p>
                    <small>Tạo lịch trình đầu tiên bằng form bên trên</small>
                </div>
            `;
        }

        const now = new Date();
        return this.scheduledExports
            .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
            .map(schedule => {
                const scheduledTime = new Date(schedule.scheduledTime);
                const timeDiff = scheduledTime - now;
                const isActive = timeDiff > 0 && schedule.status === 'scheduled';
                const isCompleted = schedule.status === 'completed';
                const isCancelled = schedule.status === 'cancelled';
                
                let statusClass = 'active';
                let statusText = 'Đang chờ';
                
                if (isCompleted) {
                    statusClass = 'completed';
                    statusText = 'Đã hoàn thành';
                } else if (isCancelled) {
                    statusClass = 'cancelled';
                    statusText = 'Đã hủy';
                }

                return `
                    <div class="scheduled-export-item ${statusClass}" data-schedule-id="${schedule.id}">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                    <strong>${schedule.name}</strong>
                                    <span class="badge badge-${this.getStatusBadgeColor(schedule.status)}">
                                        ${statusText}
                                    </span>
                                </div>
                                
                                <div style="font-size: 13px; color: #666;">
                                    <div>📅 ${this.formatDateTime(schedule.scheduledTime)}</div>
                                    <div>👤 ${schedule.customer || 'Không xác định'}</div>
                                    <div>💰 ${this.formatCurrency(schedule.totalAmount || 0)}</div>
                                    <div>📦 ${schedule.products?.length || 0} sản phẩm</div>
                                </div>
                                
                                ${isActive ? `
                                    <div class="export-countdown ${timeDiff < 300000 ? 'urgent' : ''}">
                                        ⏳ Còn lại: ${this.formatTimeRemaining(timeDiff)}
                                    </div>
                                ` : ''}
                                
                                ${schedule.executedAt ? `
                                    <div style="font-size: 11px; color: #888; margin-top: 5px;">
                                        🕒 Đã thực hiện: ${this.formatDateTime(schedule.executedAt)}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div style="display: flex; gap: 5px; flex-direction: column;">
                                ${isActive ? `
                                    <button class="btn-sm btn-success" onclick="window.autoExportScheduler.executeScheduleNow('${schedule.id}')">
                                        🚀 Chạy ngay
                                    </button>
                                    <button class="btn-sm btn-warning" onclick="window.autoExportScheduler.editSchedule('${schedule.id}')">
                                        ✏️ Sửa
                                    </button>
                                    <button class="btn-sm btn-danger" onclick="window.autoExportScheduler.cancelSchedule('${schedule.id}')">
                                        ❌ Hủy
                                    </button>
                                ` : ''}
                                
                                ${isCompleted ? `
                                    <button class="btn-sm btn-info" onclick="window.autoExportScheduler.viewScheduleResult('${schedule.id}')">
                                        📊 Xem kết quả
                                    </button>
                                ` : ''}
                                
                                <button class="btn-sm btn-outline-secondary" onclick="window.autoExportScheduler.deleteSchedule('${schedule.id}')">
                                    🗑️ Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    randomizeScheduleProducts() {
        const amount = parseFloat(document.getElementById('schedule-amount').value) || 0;
        if (amount <= 0) {
            alert('Vui lòng nhập số tiền mong muốn');
            return;
        }

        // Sử dụng ProductRandomizer từ customer manager
        const randomProducts = window.customerManager?.productRandomizer.generateRandomProducts(amount);
        if (!randomProducts || randomProducts.length === 0) {
            alert('Không đủ hàng hóa để tạo đơn với số tiền này');
            return;
        }

        // Hiển thị preview
        const previewContainer = document.getElementById('schedule-products-preview');
        const productsList = document.getElementById('schedule-products-list');
        const totalAmountElement = document.getElementById('schedule-total-amount');

        if (previewContainer && productsList && totalAmountElement) {
            const totalAmount = randomProducts.reduce((sum, product) => sum + (product.quantity * product.price), 0);
            
            productsList.innerHTML = randomProducts.map(product => `
                <div style="font-size: 12px; padding: 2px 0;">
                    • ${product.name} (${product.msp}): ${product.quantity} x ${this.formatCurrency(product.price)}
                </div>
            `).join('');
            
            totalAmountElement.textContent = `Tổng tiền: ${this.formatCurrency(totalAmount)}`;
            previewContainer.style.display = 'block';
            
            // Lưu products tạm thời
            this.tempScheduleProducts = randomProducts;
        }
    }

    createSchedule() {
        const name = document.getElementById('schedule-name').value;
        const date = document.getElementById('schedule-date').value;
        const time = document.getElementById('schedule-time').value;
        const customer = document.getElementById('schedule-customer').value;
        const amount = parseFloat(document.getElementById('schedule-amount').value) || 0;

        if (!name || !date || !time || amount <= 0) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (!this.tempScheduleProducts || this.tempScheduleProducts.length === 0) {
            alert('Vui lòng random hàng hóa trước khi lưu');
            return;
        }

        const scheduledTime = new Date(`${date}T${time}`);
        if (scheduledTime <= new Date()) {
            alert('Thời gian xuất hàng phải ở tương lai');
            return;
        }

        const schedule = {
            id: `SCHEDULE_${Date.now()}`,
            name: name,
            scheduledTime: scheduledTime.toISOString(),
            customer: customer,
            totalAmount: this.tempScheduleProducts.reduce((sum, product) => sum + (product.quantity * product.price), 0),
            products: this.tempScheduleProducts,
            status: 'scheduled',
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        };

        this.scheduledExports.push(schedule);
        this.saveScheduledExports();
        
        alert('✅ Đã lưu lịch trình xuất hàng!');
        document.getElementById('custom-modal').style.display = 'none';
        
        // Reset form
        this.tempScheduleProducts = null;
        
        // Cập nhật giao diện
        this.showSchedulerModal();
    }

    startScheduler() {
        // Kiểm tra mỗi phút
        setInterval(() => {
            this.checkScheduledExports();
        }, 60000); // 1 phút

        // Kiểm tra ngay khi khởi động
        this.checkScheduledExports();
    }

    checkScheduledExports() {
        const now = new Date();
        const pendingSchedules = this.scheduledExports.filter(schedule => 
            schedule.status === 'scheduled' && 
            new Date(schedule.scheduledTime) <= now
        );

        pendingSchedules.forEach(schedule => {
            this.executeScheduledExport(schedule.id);
        });
    }

    async executeScheduledExport(scheduleId) {
        const schedule = this.scheduledExports.find(s => s.id === scheduleId);
        if (!schedule || schedule.status !== 'scheduled') return;

        console.log(`🚀 Executing scheduled export: ${schedule.name}`);

        try {
            // Cập nhật trạng thái đang xử lý
            schedule.status = 'processing';
            this.saveScheduledExports();

            // Tạo đơn bán hàng tự động
            const result = await this.createAutoSaleOrder(schedule);
            
            // Cập nhật kết quả
            schedule.status = 'completed';
            schedule.executedAt = new Date().toISOString();
            schedule.result = result;
            
            this.saveScheduledExports();

            // Hiển thị thông báo
            this.showExportResult(schedule, result);

        } catch (error) {
            console.error('Error executing scheduled export:', error);
            schedule.status = 'failed';
            schedule.error = error.message;
            this.saveScheduledExports();
            
            this.showExportError(schedule, error);
        }
    }

    async createAutoSaleOrder(schedule) {
        return new Promise((resolve, reject) => {
            try {
                // Kiểm tra dữ liệu công ty
                if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
                    throw new Error('Chưa chọn công ty');
                }

                const hkd = window.hkdData[window.currentCompany];
                
                // Tạo đơn bán hàng
                const saleOrder = {
                    id: `AUTO_${schedule.id}_${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    customer: schedule.customer || 'Khách hàng tự động',
                    paymentMethod: 'cash',
                    products: schedule.products,
                    totalAmount: schedule.totalAmount,
                    totalCost: schedule.products.reduce((sum, product) => sum + (product.quantity * product.costPrice), 0),
                    profit: schedule.totalAmount - schedule.products.reduce((sum, product) => sum + (product.quantity * product.costPrice), 0),
                    status: 'completed',
                    isAutoExport: true,
                    scheduleId: schedule.id,
                    createdAt: new Date().toISOString()
                };

                // Lưu đơn hàng
                if (!hkd.saleOrders) {
                    hkd.saleOrders = [];
                }
                hkd.saleOrders.push(saleOrder);

                // Cập nhật tồn kho
                this.updateStockAfterAutoExport(schedule.products);

                // Lưu dữ liệu
                if (typeof window.saveData === 'function') {
                    window.saveData();
                }

                resolve({
                    success: true,
                    orderId: saleOrder.id,
                    totalAmount: saleOrder.totalAmount,
                    productCount: saleOrder.products.length
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    updateStockAfterAutoExport(products) {
        const hkd = window.hkdData[window.currentCompany];
        
        products.forEach(item => {
            let stockItem = hkd.tonkhoMain.find(p => p.msp === item.msp);
            
            if (stockItem) {
                stockItem.quantity -= item.quantity;
                
                if (stockItem.quantity < 0) {
                    stockItem.quantity = 0;
                }
                
                if (stockItem.quantity > 0) {
                    stockItem.amount = stockItem.quantity * (stockItem.amount / (stockItem.quantity + item.quantity));
                } else {
                    stockItem.amount = 0;
                }
            }
        });
    }

    showExportResult(schedule, result) {
        const message = `
            ✅ XUẤT HÀNG TỰ ĐỘNG THÀNH CÔNG!
            
            Lịch trình: ${schedule.name}
            Mã đơn: ${result.orderId}
            Khách hàng: ${schedule.customer}
            Số sản phẩm: ${result.productCount}
            Tổng tiền: ${this.formatCurrency(result.totalAmount)}
            Thời gian: ${this.formatDateTime(new Date())}
        `;
        
        // Hiển thị alert
        alert(message);
        
        // Có thể thêm notification hoặc sound
        this.playNotificationSound();
    }

    showExportError(schedule, error) {
        const message = `
            ❌ LỖI XUẤT HÀNG TỰ ĐỘNG!
            
            Lịch trình: ${schedule.name}
            Lỗi: ${error.message}
            Thời gian: ${this.formatDateTime(new Date())}
        `;
        
        alert(message);
        this.playErrorSound();
    }

    playNotificationSound() {
        // Có thể thêm âm thanh thông báo
        console.log('🔊 Play notification sound');
    }

    playErrorSound() {
        // Có thể thêm âm thanh lỗi
        console.log('🔊 Play error sound');
    }

    // Các hàm tiện ích
    executeScheduleNow(scheduleId) {
        if (confirm('Bạn có chắc muốn chạy lịch trình này ngay bây giờ?')) {
            this.executeScheduledExport(scheduleId);
        }
    }

    cancelSchedule(scheduleId) {
        if (confirm('Bạn có chắc muốn hủy lịch trình này?')) {
            const schedule = this.scheduledExports.find(s => s.id === scheduleId);
            if (schedule) {
                schedule.status = 'cancelled';
                schedule.cancelledAt = new Date().toISOString();
                this.saveScheduledExports();
                this.showSchedulerModal();
            }
        }
    }

    deleteSchedule(scheduleId) {
        if (confirm('Bạn có chắc muốn xóa lịch trình này?')) {
            this.scheduledExports = this.scheduledExports.filter(s => s.id !== scheduleId);
            this.saveScheduledExports();
            this.showSchedulerModal();
        }
    }

    viewScheduleResult(scheduleId) {
        const schedule = this.scheduledExports.find(s => s.id === scheduleId);
        if (schedule && schedule.result) {
            alert(`
                📊 KẾT QUẢ XUẤT HÀNG
                
                Lịch trình: ${schedule.name}
                Mã đơn: ${schedule.result.orderId}
                Tổng tiền: ${this.formatCurrency(schedule.result.totalAmount)}
                Số sản phẩm: ${schedule.result.productCount}
                Trạng thái: ${schedule.result.success ? 'Thành công' : 'Thất bại'}
                Thời gian thực hiện: ${this.formatDateTime(schedule.executedAt)}
            `);
        }
    }

    // Utility functions
    formatDateTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleString('vi-VN');
    }

    formatTimeRemaining(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} ngày ${hours % 24} giờ`;
        if (hours > 0) return `${hours} giờ ${minutes % 60} phút`;
        if (minutes > 0) return `${minutes} phút ${seconds % 60} giây`;
        return `${seconds} giây`;
    }

    formatCurrency(amount) {
        if (typeof window.formatCurrency === 'function') {
            return window.formatCurrency(amount);
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    getStatusBadgeColor(status) {
        const colors = {
            'scheduled': 'warning',
            'processing': 'info',
            'completed': 'success',
            'cancelled': 'danger',
            'failed': 'dark'
        };
        return colors[status] || 'secondary';
    }

    loadScheduledExports() {
        try {
            return JSON.parse(localStorage.getItem('auto_export_schedules')) || [];
        } catch (e) {
            console.error('Error loading scheduled exports:', e);
            return [];
        }
    }

    saveScheduledExports() {
        localStorage.setItem('auto_export_schedules', JSON.stringify(this.scheduledExports));
    }

    exportSchedules() {
        const dataStr = JSON.stringify(this.scheduledExports, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `scheduled_exports_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Khởi tạo
setTimeout(() => {
    if (!window.autoExportScheduler) {
        window.autoExportScheduler = new AutoExportScheduler();
    }
}, 2000);

// Export toàn cục
window.AutoExportScheduler = AutoExportScheduler;