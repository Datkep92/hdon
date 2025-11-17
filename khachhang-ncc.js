// khachhang-ncc.js - PHIÊN BẢN ĐÃ SỬA HOÀN CHỈNH

// ==================== CSS STYLES ====================
function addCustomerStyles() {
    if (document.getElementById('customer-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'customer-styles';
    style.textContent = `
        .customer-suggestions {
            position: absolute;
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 10000;
            width: 100%;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            margin-top: 5px;
            font-size: 14px;
        }
        
        .suggestion-item {
            padding: 12px 15px;
            cursor: pointer;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            align-items: flex-start;
            transition: all 0.2s;
            min-height: 60px;
        }
        
        .suggestion-item:hover {
            background-color: #e3f2fd !important;
            transform: translateX(2px);
        }
        
        .suggestion-item:last-child {
            border-bottom: none;
        }
        
        .customer-checkbox {
            margin-right: 15px;
            margin-top: 5px;
            transform: scale(1.5);
            min-width: 20px;
            min-height: 20px;
            cursor: pointer;
        }
        
        .suggestion-info {
            flex: 1;
            min-width: 0;
        }
        
        .suggestion-name {
            font-weight: bold;
            color: #1a1a1a;
            font-size: 15px;
            margin-bottom: 4px;
            line-height: 1.3;
        }
        
        .suggestion-details {
            font-size: 13px;
            color: #495057;
            margin-bottom: 3px;
            line-height: 1.2;
        }
        
        .suggestion-address {
            font-size: 12px;
            color: #6c757d;
            line-height: 1.2;
            font-style: italic;
        }
        
        .customer-input-container {
            position: relative;
        }
        
        .customer-item:hover {
            background: #f8f9fa !important;
        }

        .customer-item.selected {
            background: #e3f2fd !important;
            border-left: 4px solid #007bff !important;
        }

        /* Modal size */
        .modal-xlarge {
            max-width: 1200px !important;
            width: 95% !important;
        }
    `;
    
    document.head.appendChild(style);
}

// ==================== CUSTOMER MANAGEMENT MODAL ====================
class CustomerManagementModal {
    constructor(customerManager) {
        this.customerManager = customerManager;
        this.selectedCustomer = null;
    }

    show() {
        const modalContent = this.renderModal();
        window.showModal('👥 Quản Lý Khách Hàng', modalContent, 'xlarge');
        this.loadCustomerList();
    }

    renderModal() {
        return `
            <div style="min-height: 600px;">
                <!-- Search và Filter -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: 1fr auto auto auto; gap: 10px; align-items: end;">
                            <div>
                                <label style="font-size: 12px; color: #666;">Tìm kiếm</label>
                                <input type="text" id="customer-search-input" class="form-control" 
                                       placeholder="Tìm theo tên, SĐT, MST..." 
                                       oninput="window.customerManagementModal.filterCustomers()">
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #666;">Loại KH</label>
                                <select id="customer-type-filter" class="form-control" onchange="window.customerManagementModal.filterCustomers()">
                                    <option value="">Tất cả</option>
                                    <option value="business">Doanh nghiệp</option>
                                    <option value="retail">Khách lẻ</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #666;">Sắp xếp</label>
                                <select id="customer-sort" class="form-control" onchange="window.customerManagementModal.filterCustomers()">
                                    <option value="name">Tên A-Z</option>
                                    <option value="recent">Mới nhất</option>
                                    <option value="total_spent">Mua nhiều nhất</option>
                                </select>
                            </div>
                            <div>
                                <button class="btn btn-success" onclick="window.customerManagementModal.addNewCustomer()">
                                    ➕ Thêm mới
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 400px; gap: 20px;">
                    <!-- Danh sách khách hàng -->
                    <div class="card">
                        <div class="card-header">
                            <h6 style="margin: 0;">Danh sách khách hàng (<span id="customer-count">0</span>)</h6>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            <div id="customer-list-container" style="max-height: 500px; overflow-y: auto;">
                                <!-- Customer list will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- Chi tiết khách hàng -->
                    <div class="card">
                        <div class="card-header">
                            <h6 style="margin: 0;">Chi tiết khách hàng</h6>
                        </div>
                        <div class="card-body">
                            <div id="customer-detail-container">
                                <div style="text-align: center; color: #666; padding: 40px;">
                                    <div style="font-size: 48px;">👤</div>
                                    <p>Chọn một khách hàng để xem chi tiết</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadCustomerList() {
        const container = document.getElementById('customer-list-container');
        if (!container) return;

        const customers = this.customerManager.customers.map(customer => {
            const stats = this.customerManager.getCustomerPurchaseStats(customer);
            return { ...customer, ...stats };
        });

        if (customers.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        const sortBy = document.getElementById('customer-sort')?.value || 'name';
        const sortedCustomers = this.sortCustomers(customers, sortBy);

        container.innerHTML = sortedCustomers.map(customer => this.renderCustomerItem(customer)).join('');
        document.getElementById('customer-count').textContent = sortedCustomers.length;
    }

    renderCustomerItem(customer) {
        const isSelected = this.selectedCustomer?.id === customer.id;
        return `
            <div class="customer-item ${isSelected ? 'selected' : ''}" 
                 onclick="window.customerManagementModal.selectCustomer('${customer.id}')"
                 style="padding: 15px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; 
                        ${isSelected ? 'background: #e3f2fd; border-left: 4px solid #007bff;' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                            <strong style="font-size: 14px; color: #333;">${customer.name}</strong>
                            <span class="badge ${customer.type === 'business' ? 'badge-primary' : 'badge-secondary'}" 
                                  style="font-size: 10px;">
                                ${customer.type === 'business' ? 'DN' : 'Lẻ'}
                            </span>
                        </div>
                        
                        <div style="font-size: 12px; color: #666; margin-bottom: 3px;">
                            ${customer.phone ? `📞 ${customer.phone}` : '📞 Chưa có SĐT'}
                            ${customer.taxcode ? ` | 🏢 ${customer.taxcode}` : ''}
                        </div>
                        
                        ${customer.address ? `
                            <div style="font-size: 11px; color: #888; margin-bottom: 5px;">
                                📍 ${customer.address}
                            </div>
                        ` : ''}
                        
                        <div style="font-size: 11px; color: #28a745;">
                            ${customer.orderCount > 0 ? 
                                `🛍️ ${customer.orderCount} đơn • 💰 ${this.customerManager.formatCurrency(customer.totalSpent)}` : 
                                '🆕 Khách hàng mới'
                            }
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 5px; flex-direction: column;">
                        <button class="btn-sm btn-success" 
                                onclick="event.stopPropagation(); window.customerManagementModal.useCustomer('${customer.id}')"
                                style="font-size: 11px; padding: 2px 8px;">
                            Chọn
                        </button>
                        <button class="btn-sm btn-warning" 
                                onclick="event.stopPropagation(); window.customerManagementModal.editCustomer('${customer.id}')"
                                style="font-size: 11px; padding: 2px 8px;">
                            Sửa
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <div style="font-size: 64px;">👥</div>
                <h5 style="margin: 15px 0 10px 0;">Chưa có khách hàng</h5>
                <p style="margin-bottom: 20px;">Bắt đầu bằng cách thêm khách hàng đầu tiên</p>
                <button class="btn btn-success" onclick="window.customerManagementModal.addNewCustomer()">
                    ➕ Thêm khách hàng đầu tiên
                </button>
            </div>
        `;
    }

    sortCustomers(customers, sortBy) {
        switch (sortBy) {
            case 'recent':
                return customers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'total_spent':
                return customers.sort((a, b) => b.totalSpent - a.totalSpent);
            default:
                return customers.sort((a, b) => a.name.localeCompare(b.name));
        }
    }

    filterCustomers() {
        const searchText = document.getElementById('customer-search-input')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('customer-type-filter')?.value || '';
        const sortBy = document.getElementById('customer-sort')?.value || 'name';

        let filteredCustomers = this.customerManager.customers;

        if (searchText) {
            filteredCustomers = filteredCustomers.filter(customer =>
                customer.name.toLowerCase().includes(searchText) ||
                (customer.phone && customer.phone.includes(searchText)) ||
                (customer.taxcode && customer.taxcode.toLowerCase().includes(searchText)) ||
                (customer.address && customer.address.toLowerCase().includes(searchText))
            );
        }

        if (typeFilter) {
            filteredCustomers = filteredCustomers.filter(customer => customer.type === typeFilter);
        }

        filteredCustomers = filteredCustomers.map(customer => {
            const stats = this.customerManager.getCustomerPurchaseStats(customer);
            return { ...customer, ...stats };
        });

        const sortedCustomers = this.sortCustomers(filteredCustomers, sortBy);

        const container = document.getElementById('customer-list-container');
        if (container) {
            container.innerHTML = sortedCustomers.map(customer => this.renderCustomerItem(customer)).join('');
            document.getElementById('customer-count').textContent = sortedCustomers.length;
        }
    }

    selectCustomer(customerId) {
        this.selectedCustomer = this.customerManager.customers.find(c => c.id === customerId);
        this.loadCustomerList();
        this.showCustomerDetail();
    }

    showCustomerDetail() {
        const container = document.getElementById('customer-detail-container');
        if (!container || !this.selectedCustomer) return;

        const stats = this.customerManager.getCustomerPurchaseStats(this.selectedCustomer);
        const customer = { ...this.selectedCustomer, ...stats };

        container.innerHTML = `
            <div>
                <div style="margin-bottom: 20px;">
                    <h5 style="color: #333; margin-bottom: 15px;">${customer.name}</h5>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Số điện thoại</label>
                            <input type="text" class="form-control" value="${customer.phone || 'Chưa có'}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Mã số thuế</label>
                            <input type="text" class="form-control" value="${customer.taxcode || 'Chưa có'}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Loại khách hàng</label>
                            <input type="text" class="form-control" value="${customer.type === 'business' ? 'Doanh nghiệp' : 'Khách lẻ'}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Ngày tạo</label>
                            <input type="text" class="form-control" value="${this.customerManager.formatDate(customer.createdAt)}" readonly>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Địa chỉ</label>
                        <textarea class="form-control" rows="2" readonly>${customer.address || 'Chưa có địa chỉ'}</textarea>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                    <div style="text-align: center; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: bold; color: #28a745;">${this.customerManager.formatCurrency(customer.totalSpent)}</div>
                        <div style="font-size: 11px; color: #666;">Tổng chi tiêu</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: bold; color: #1976d2;">${customer.orderCount}</div>
                        <div style="font-size: 11px; color: #666;">Số đơn hàng</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #fff3e0; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: bold; color: #f57c00;">${customer.lastPurchase ? this.customerManager.formatDate(customer.lastPurchase) : 'N/A'}</div>
                        <div style="font-size: 11px; color: #666;">Lần mua cuối</div>
                    </div>
                </div>

                ${customer.orders.length > 0 ? this.renderOrderHistory(customer.orders) : ''}

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-success" onclick="window.customerManagementModal.useCustomer('${customer.id}')">
                        🛒 Chọn cho đơn hàng
                    </button>
                    <button class="btn btn-warning" onclick="window.customerManagementModal.editCustomer('${customer.id}')">
                        ✏️ Sửa thông tin
                    </button>
                    ${customer.orderCount === 0 ? 
                        `<button class="btn btn-danger" onclick="window.customerManagementModal.deleteCustomer('${customer.id}')">
                            🗑️ Xóa khách hàng
                        </button>` : ''
                    }
                </div>
            </div>
        `;
    }

    renderOrderHistory(orders) {
        const sortedOrders = orders.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        return `
            <div>
                <h6 style="margin-bottom: 10px;">📋 Lịch sử đơn hàng gần đây</h6>
                <div style="max-height: 200px; overflow-y: auto;">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Ngày</th>
                                <th>Số tiền</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedOrders.map(order => `
                                <tr>
                                    <td><small>${order.id}</small></td>
                                    <td>${this.customerManager.formatDate(order.date)}</td>
                                    <td>${this.customerManager.formatCurrency(order.totalAmount)}</td>
                                    <td>
                                        <span class="badge ${order.status === 'completed' ? 'badge-success' : 'badge-warning'}">
                                            ${order.status === 'completed' ? 'Đã TT' : 'Chờ TT'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    addNewCustomer() {
        const modalContent = `
            <div class="form-grid">
                <div class="form-group">
                    <label for="new-customer-name">Tên khách hàng *</label>
                    <input type="text" id="new-customer-name" class="form-control" placeholder="Nhập tên khách hàng">
                </div>
                <div class="form-group">
                    <label for="new-customer-phone">Số điện thoại</label>
                    <input type="text" id="new-customer-phone" class="form-control" placeholder="Nhập SĐT">
                </div>
                <div class="form-group">
                    <label for="new-customer-taxcode">Mã số thuế</label>
                    <input type="text" id="new-customer-taxcode" class="form-control" placeholder="Nhập MST">
                </div>
                <div class="form-group">
                    <label for="new-customer-type">Loại khách hàng</label>
                    <select id="new-customer-type" class="form-control">
                        <option value="retail">Khách lẻ</option>
                        <option value="business">Doanh nghiệp</option>
                    </select>
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label for="new-customer-address">Địa chỉ</label>
                    <textarea id="new-customer-address" class="form-control" rows="2" placeholder="Nhập địa chỉ"></textarea>
                </div>
            </div>
            <div style="text-align: right; margin-top: 20px;">
                <button class="btn btn-success" onclick="window.customerManagementModal.saveNewCustomer()">💾 Lưu</button>
                <button class="btn btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Hủy</button>
            </div>
        `;
        
        window.showModal('Thêm Khách Hàng Mới', modalContent);
    }

    saveNewCustomer() {
        const name = document.getElementById('new-customer-name').value;
        const phone = document.getElementById('new-customer-phone').value;
        const taxcode = document.getElementById('new-customer-taxcode').value;
        const type = document.getElementById('new-customer-type').value;
        const address = document.getElementById('new-customer-address').value;

        if (!name.trim()) {
            alert('Vui lòng nhập tên khách hàng');
            return;
        }

        const customer = {
            id: `CUS_${Date.now()}`,
            name: name.trim(),
            phone: phone,
            taxcode: taxcode,
            address: address,
            type: type,
            createdAt: new Date().toISOString()
        };

        this.customerManager.customers.push(customer);
        this.customerManager.saveCustomers();
        
        alert('✅ Đã thêm khách hàng thành công!');
        document.getElementById('custom-modal').style.display = 'none';
        this.show();
    }

    editCustomer(customerId) {
        const customer = this.customerManager.customers.find(c => c.id === customerId);
        if (!customer) return;

        const modalContent = `
            <div class="form-grid">
                <div class="form-group">
                    <label for="edit-customer-name">Tên khách hàng *</label>
                    <input type="text" id="edit-customer-name" class="form-control" value="${customer.name}">
                </div>
                <div class="form-group">
                    <label for="edit-customer-phone">Số điện thoại</label>
                    <input type="text" id="edit-customer-phone" class="form-control" value="${customer.phone || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-customer-taxcode">Mã số thuế</label>
                    <input type="text" id="edit-customer-taxcode" class="form-control" value="${customer.taxcode || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-customer-type">Loại khách hàng</label>
                    <select id="edit-customer-type" class="form-control">
                        <option value="retail" ${customer.type === 'retail' ? 'selected' : ''}>Khách lẻ</option>
                        <option value="business" ${customer.type === 'business' ? 'selected' : ''}>Doanh nghiệp</option>
                    </select>
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label for="edit-customer-address">Địa chỉ</label>
                    <textarea id="edit-customer-address" class="form-control" rows="2">${customer.address || ''}</textarea>
                </div>
            </div>
            <div style="text-align: right; margin-top: 20px;">
                <button class="btn btn-success" onclick="window.customerManagementModal.saveEditCustomer('${customerId}')">💾 Cập nhật</button>
                <button class="btn btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Hủy</button>
            </div>
        `;
        
        window.showModal('Sửa Thông Tin Khách Hàng', modalContent);
    }

    saveEditCustomer(customerId) {
        const name = document.getElementById('edit-customer-name').value;
        const phone = document.getElementById('edit-customer-phone').value;
        const taxcode = document.getElementById('edit-customer-taxcode').value;
        const type = document.getElementById('edit-customer-type').value;
        const address = document.getElementById('edit-customer-address').value;

        if (!name.trim()) {
            alert('Vui lòng nhập tên khách hàng');
            return;
        }

        const customerIndex = this.customerManager.customers.findIndex(c => c.id === customerId);
        if (customerIndex !== -1) {
            this.customerManager.customers[customerIndex] = {
                ...this.customerManager.customers[customerIndex],
                name: name.trim(),
                phone: phone,
                taxcode: taxcode,
                address: address,
                type: type
            };
            
            this.customerManager.saveCustomers();
            alert('✅ Đã cập nhật thông tin khách hàng!');
            document.getElementById('custom-modal').style.display = 'none';
            this.show();
        }
    }

    deleteCustomer(customerId) {
        if (!confirm('Bạn có chắc muốn xóa khách hàng này?')) return;

        this.customerManager.customers = this.customerManager.customers.filter(c => c.id !== customerId);
        this.customerManager.saveCustomers();
        
        alert('✅ Đã xóa khách hàng!');
        this.show();
    }

    useCustomer(customerId) {
        const customer = this.customerManager.customers.find(c => c.id === customerId);
        if (customer) {
            document.getElementById('sale-customer').value = customer.name;
            document.getElementById('sale-phone').value = customer.phone || '';
            document.getElementById('sale-taxcode').value = customer.taxcode || '';
            document.getElementById('sale-address').value = customer.address || '';
            
            document.getElementById('custom-modal').style.display = 'none';
            
            setTimeout(() => {
                if (!customer.phone) {
                    document.getElementById('sale-phone').focus();
                } else if (!customer.taxcode) {
                    document.getElementById('sale-taxcode').focus();
                }
            }, 100);
        }
    }
}

// ==================== CUSTOMER MANAGER ====================
class CustomerManager {
    constructor() {
        this.customers = this.loadCustomers();
        this.randomizer = new RandomCustomerGenerator();
        this.productRandomizer = new ProductRandomizer();
        this.managementModal = new CustomerManagementModal(this);
        this.init();
    }

    init() {
        addCustomerStyles();
        setTimeout(() => {
            this.setupInterface();
        }, 500);
    }

    setupInterface() {
        this.addCustomButtons();
        this.initCustomerEvents();
        this.initProductRandomizer();
        this.addCustomerManagementButton();
        console.log('✅ Module khách hàng/NCC đã khởi tạo');
    }

    // THÊM NÚT QUẢN LÝ KH
    addCustomerManagementButton() {
        const existingBtn = document.getElementById('customer-management-btn');
        if (existingBtn) return;

        const cardHeader = document.querySelector('#ban-hang .card-header');
        if (cardHeader) {
            const managementBtn = document.createElement('button');
            managementBtn.type = 'button';
            managementBtn.id = 'customer-management-btn';
            managementBtn.className = 'btn btn-primary';
            managementBtn.innerHTML = '👥 Quản lý KH';
            managementBtn.style.marginLeft = '10px';
            managementBtn.onclick = () => this.showCustomerManagement();
            
            const title = cardHeader.querySelector('h5');
            if (title) {
                const headerContainer = document.createElement('div');
                headerContainer.style.display = 'flex';
                headerContainer.style.justifyContent = 'space-between';
                headerContainer.style.alignItems = 'center';
                headerContainer.style.width = '100%';
                
                cardHeader.insertBefore(headerContainer, title);
                headerContainer.appendChild(title);
                
                const buttonContainer = document.createElement('div');
                buttonContainer.appendChild(managementBtn);
                headerContainer.appendChild(buttonContainer);
            } else {
                cardHeader.appendChild(managementBtn);
            }
        } else {
            // Fallback: thêm nút test
            this.addTestButton();
        }
    }

    // THÊM NÚT TEST
    addTestButton() {
        const testBtn = document.createElement('button');
        testBtn.innerHTML = '🧪 TEST KH';
        testBtn.style.cssText = `
            position: fixed;
            top: 150px;
            right: 20px;
            z-index: 1000;
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
        `;
        testBtn.onclick = () => {
            this.showCustomerManagement();
        };
        document.body.appendChild(testBtn);
    }

    showCustomerManagement() {
        console.log('🎪 Opening customer management modal...');
        this.managementModal.show();
    }

    // CÁC HÀM CÒN LẠI GIỮ NGUYÊN...
    addCustomButtons() {
        // Thêm nút khách lẻ
        const customerGroup = document.querySelector('[for="sale-customer"]');
        if (customerGroup && !document.getElementById('retail-customer-btn')) {
            const customerContainer = customerGroup.parentNode;
            const retailBtn = document.createElement('button');
            retailBtn.type = 'button';
            retailBtn.id = 'retail-customer-btn';
            retailBtn.className = 'btn-sm btn-outline-secondary';
            retailBtn.innerHTML = '👤 Khách lẻ';
            retailBtn.style.marginTop = '5px';
            retailBtn.style.marginRight = '5px';
            customerContainer.appendChild(retailBtn);
        }

        // Thêm nút lưu khách hàng
        const phoneGroup = document.querySelector('[for="sale-phone"]');
        if (phoneGroup && !document.getElementById('save-customer-btn')) {
            const phoneContainer = phoneGroup.parentNode;
            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.id = 'save-customer-btn';
            saveBtn.className = 'btn-sm btn-outline-success';
            saveBtn.innerHTML = '💾 Lưu KH';
            saveBtn.style.marginTop = '5px';
            phoneContainer.appendChild(saveBtn);
        }

        this.addRandomProductSection();
        this.createSuggestionDropdown();
    }

    addRandomProductSection() {
        const existingSection = document.getElementById('random-products-section');
        if (existingSection) return;

        const searchGroup = document.querySelector('[for="sale-product-search"]');
        if (searchGroup) {
            const container = searchGroup.closest('.form-grid');
            if (container) {
                const randomSection = document.createElement('div');
                randomSection.id = 'random-products-section';
                randomSection.className = 'form-group';
                randomSection.innerHTML = `
                    <label for="target-amount">🎲 Random hàng hóa</label>
                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                        <input type="number" id="target-amount" class="form-control" 
                               placeholder="Số tiền mong muốn" style="flex: 1;" min="1000" step="1000">
                        <button id="random-products-btn" class="btn-sm btn-outline-warning">Random</button>
                    </div>
                    <small style="color: #666;">Tự động chọn hàng ngẫu nhiên theo số tiền</small>
                `;
                container.appendChild(randomSection);
            }
        }
    }

    createSuggestionDropdown() {
        const customerInput = document.getElementById('sale-customer');
        if (customerInput && !document.getElementById('customer-suggestions')) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.id = 'customer-suggestions';
            suggestionsDiv.className = 'customer-suggestions';
            
            const inputContainer = customerInput.parentNode;
            inputContainer.classList.add('customer-input-container');
            inputContainer.style.position = 'relative';
            inputContainer.appendChild(suggestionsDiv);
        }
    }

    initCustomerEvents() {
        const customerInput = document.getElementById('sale-customer');
        if (customerInput) {
            customerInput.addEventListener('input', (e) => this.suggestCustomers(e.target.value));
            customerInput.addEventListener('focus', (e) => {
                if (e.target.value) {
                    this.suggestCustomers(e.target.value);
                }
            });
            customerInput.addEventListener('blur', () => {
                setTimeout(() => this.hideSuggestions(), 200);
            });
        }

        const retailBtn = document.getElementById('retail-customer-btn');
        if (retailBtn) {
            retailBtn.addEventListener('click', () => this.setRetailCustomer());
        }

        const saveBtn = document.getElementById('save-customer-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCurrentCustomer());
        }
    }

    initProductRandomizer() {
        const randomProductBtn = document.getElementById('random-products-btn');
        if (randomProductBtn) {
            randomProductBtn.addEventListener('click', () => this.generateRandomProducts());
        }
    }

    suggestCustomers(keyword) {
        const suggestionsDiv = document.getElementById('customer-suggestions');
        if (!suggestionsDiv) {
            this.createSuggestionDropdown();
            return;
        }

        if (!keyword || keyword.length < 1) {
            this.hideSuggestions();
            return;
        }
        
        const keywordLower = keyword.toLowerCase();
        const suggestions = this.customers.filter(customer => 
            customer.name.toLowerCase().includes(keywordLower) ||
            (customer.phone && customer.phone.includes(keyword)) ||
            (customer.taxcode && customer.taxcode.toLowerCase().includes(keywordLower))
        );
        
        if (suggestions.length > 0) {
            this.showSuggestions(suggestions);
        } else {
            this.showNoResults();
        }
    }

    showSuggestions(suggestions) {
        const suggestionsDiv = document.getElementById('customer-suggestions');
        if (!suggestionsDiv) return;

        suggestionsDiv.innerHTML = suggestions.map(customer => `
            <div class="suggestion-item" onclick="window.customerManager.selectCustomer('${customer.id}')">
                <input type="checkbox" class="customer-checkbox" data-customer-id="${customer.id}" 
                       onclick="event.stopPropagation(); window.customerManager.toggleCustomerSelection('${customer.id}')">
                <div class="suggestion-info">
                    <div class="suggestion-name">${customer.name}</div>
                    <div class="suggestion-details">
                        ${customer.phone ? `📞 ${customer.phone}` : ''} 
                        ${customer.taxcode ? ` | 🏢 ${customer.taxcode}` : ''}
                    </div>
                    ${customer.address ? `<div class="suggestion-address">📍 ${customer.address}</div>` : ''}
                </div>
            </div>
        `).join('');

        suggestionsDiv.style.display = 'block';
    }

    showNoResults() {
        const suggestionsDiv = document.getElementById('customer-suggestions');
        if (!suggestionsDiv) return;

        suggestionsDiv.innerHTML = `
            <div class="suggestion-item" style="color: #666; font-style: italic;">
                <div class="suggestion-info">
                    <div class="suggestion-name">Không tìm thấy khách hàng</div>
                    <div class="suggestion-details">Nhấp "Lưu KH" để thêm mới</div>
                </div>
            </div>
        `;
        suggestionsDiv.style.display = 'block';
    }

    hideSuggestions() {
        const suggestionsDiv = document.getElementById('customer-suggestions');
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    }

    selectCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            document.getElementById('sale-customer').value = customer.name;
            document.getElementById('sale-phone').value = customer.phone || '';
            document.getElementById('sale-taxcode').value = customer.taxcode || '';
            document.getElementById('sale-address').value = customer.address || '';
            this.hideSuggestions();
        }
    }

    toggleCustomerSelection(customerId) {
        // Có thể thêm logic cho multiple selection
        console.log('Selected customer:', customerId);
    }

    // ... CÁC HÀM CÒN LẠI GIỮ NGUYÊN
    setRetailCustomer() {
        const randomCustomer = this.randomizer.generateRetailCustomer();
        document.getElementById('sale-customer').value = randomCustomer.name;
        document.getElementById('sale-phone').value = randomCustomer.phone;
        document.getElementById('sale-address').value = randomCustomer.address;
        document.getElementById('sale-taxcode').value = '';
        document.getElementById('sale-phone').focus();
    }

    generateRandomProducts() {
        const targetAmount = parseFloat(document.getElementById('target-amount').value) || 0;
        if (targetAmount <= 0) {
            alert('Vui lòng nhập số tiền mong muốn');
            return;
        }
        if (targetAmount < 1000) {
            alert('Số tiền phải lớn hơn 1,000 VND');
            return;
        }

        const randomProducts = this.productRandomizer.generateRandomProducts(targetAmount);
        if (randomProducts.length === 0) {
            alert('Không đủ hàng hóa để tạo đơn với số tiền này hoặc chưa có dữ liệu tồn kho');
            return;
        }

        this.fillProductsToForm(randomProducts);
        const totalAmount = randomProducts.reduce((sum, product) => sum + (product.quantity * product.price), 0);
        alert(`✅ Đã tạo ${randomProducts.length} sản phẩm\n💰 Tổng tiền: ${this.formatCurrency(totalAmount)}`);
    }

    fillProductsToForm(products) {
        if (typeof deselectAllProducts !== 'function') {
            alert('Vui lòng chờ module bán hàng khởi tạo xong');
            return;
        }

        deselectAllProducts();
        
        let filledCount = 0;
        products.forEach(product => {
            const checkbox = document.querySelector(`.sale-product-check[data-msp="${product.msp}"]`);
            if (checkbox) {
                checkbox.checked = true;
                const qtyInput = document.querySelector(`.sale-quantity[data-msp="${product.msp}"]`);
                const priceInput = document.querySelector(`.sale-price[data-msp="${product.msp}"]`);
                
                if (qtyInput) qtyInput.value = product.quantity;
                if (priceInput) priceInput.value = this.accountingRound(product.price);
                
                if (typeof calculateSaleAmount === 'function') {
                    calculateSaleAmount(product.msp);
                }
                filledCount++;
            }
        });
        
        if (typeof calculateTotalSaleAmount === 'function') {
            calculateTotalSaleAmount();
        }
        if (typeof updateSaleSummary === 'function') {
            updateSaleSummary();
        }
    }

    saveCurrentCustomer() {
        const name = document.getElementById('sale-customer').value;
        const phone = document.getElementById('sale-phone').value;
        const taxcode = document.getElementById('sale-taxcode').value;
        const address = document.getElementById('sale-address').value;

        if (!name.trim()) {
            alert('Vui lòng nhập tên khách hàng');
            return;
        }

        const existingIndex = this.customers.findIndex(customer => 
            customer.name.toLowerCase() === name.toLowerCase() || 
            (phone && customer.phone === phone) ||
            (taxcode && customer.taxcode === taxcode)
        );

        if (existingIndex !== -1) {
            if (confirm('Khách hàng đã tồn tại. Cập nhật thông tin?')) {
                this.customers[existingIndex] = {
                    ...this.customers[existingIndex],
                    phone: phone,
                    taxcode: taxcode,
                    address: address,
                    updatedAt: new Date().toISOString()
                };
            } else {
                return;
            }
        } else {
            const customer = {
                id: `CUS_${Date.now()}`,
                name: name.trim(),
                phone: phone,
                taxcode: taxcode,
                address: address,
                type: taxcode ? 'business' : 'retail',
                createdAt: new Date().toISOString()
            };
            this.customers.push(customer);
        }

        this.saveCustomers();
        alert('✅ Đã lưu thông tin khách hàng thành công!');
    }

    getCustomerPurchaseStats(customer) {
        if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
            return { totalSpent: 0, orderCount: 0, lastPurchase: null, orders: [] };
        }

        const hkd = window.hkdData[window.currentCompany];
        const customerOrders = (hkd.saleOrders || []).filter(order => 
            order.customer === customer.name
        );

        const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const orderCount = customerOrders.length;
        const lastPurchase = customerOrders.length > 0 ? 
            customerOrders.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null;

        return {
            totalSpent,
            orderCount,
            lastPurchase,
            orders: customerOrders
        };
    }

    loadCustomers() {
        try {
            return JSON.parse(localStorage.getItem('banhang_customers')) || this.getDefaultCustomers();
        } catch (e) {
            console.error('Lỗi load khách hàng:', e);
            return this.getDefaultCustomers();
        }
    }

    getDefaultCustomers() {
        return [
            {
                id: 'CUS_DEFAULT_1',
                name: 'Công ty TNHH ABC',
                phone: '02838293829',
                taxcode: '0315928374',
                address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
                type: 'business',
                createdAt: new Date().toISOString()
            },
            {
                id: 'CUS_DEFAULT_2', 
                name: 'Cửa hàng XYZ',
                phone: '0903123456',
                taxcode: '',
                address: '45 Lê Lợi, Quận 1, TP.HCM',
                type: 'retail',
                createdAt: new Date().toISOString()
            },
            {
                id: 'CUS_DEFAULT_3',
                name: 'Nguyễn Văn An',
                phone: '0918123456',
                taxcode: '',
                address: '78 Nguyễn Huệ, Quận 1, TP.HCM',
                type: 'retail',
                createdAt: new Date().toISOString()
            }
        ];
    }

    saveCustomers() {
        localStorage.setItem('banhang_customers', JSON.stringify(this.customers));
    }

    formatCurrency(amount) {
        if (typeof window.formatCurrency === 'function') {
            return window.formatCurrency(amount);
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        } catch {
            return '-';
        }
    }

    accountingRound(amount) {
        if (typeof window.accountingRound === 'function') {
            return window.accountingRound(amount);
        }
        return Math.round(amount);
    }
}

// ==================== RANDOM CUSTOMER GENERATOR ====================
class RandomCustomerGenerator {
    generateRetailCustomer() {
        return {
            name: this.generateRandomName(),
            phone: this.generateRandomPhone(),
            address: this.generateRandomAddress(),
            taxcode: '',
            type: 'retail'
        };
    }

    generateRandomName() {
        const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];
        const middleNames = ['Văn', 'Thị', 'Xuân', 'Hồng', 'Minh', 'Thanh', 'Đức', 'Kim', 'Ngọc', 'Bảo'];
        const lastNames = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hải', 'Khoa', 'Lan', 'Mai', 'Nga', 'Phong', 'Quân', 'Tú', 'Vy'];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return `${firstName} ${middleName} ${lastName}`;
    }

    generateRandomPhone() {
        const prefixes = ['032', '033', '034', '035', '036', '037', '038', '039', 
                         '070', '076', '077', '078', '079', '081', '082', '083', 
                         '084', '085', '086', '088', '089', '090', '091', '092', 
                         '093', '094', '096', '097', '098'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const number = Math.floor(1000000 + Math.random() * 9000000);
        return `${prefix}${number}`;
    }

    generateRandomAddress() {
        const streets = ['Nguyễn Trãi', 'Cách Mạng Tháng 8', 'Lê Lợi', 'Hai Bà Trưng', 'Lý Thường Kiệt', 'Trần Hưng Đạo', 'Lê Văn Sỹ', 'Nguyễn Thị Minh Khai'];
        const wards = ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8'];
        const districts = ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 10', 'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình'];
        const cities = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];
        
        const street = streets[Math.floor(Math.random() * streets.length)];
        const number = Math.floor(1 + Math.random() * 300);
        const ward = wards[Math.floor(Math.random() * wards.length)];
        const district = districts[Math.floor(Math.random() * districts.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        
        return `Số ${number}, Đường ${street}, ${ward}, ${district}, ${city}`;
    }
}

// ==================== PRODUCT RANDOMIZER ====================
class ProductRandomizer {
    generateRandomProducts(targetAmount) {
        if (!window.currentCompany || !window.hkdData || !window.hkdData[window.currentCompany]) {
            console.error('Chưa chọn công ty hoặc không có dữ liệu');
            return [];
        }

        const hkd = window.hkdData[window.currentCompany];
        const availableProducts = this.getAvailableProducts(hkd);

        if (availableProducts.length === 0) {
            console.error('Không có sản phẩm nào trong kho');
            return [];
        }

        const selectedProducts = [];
        let currentAmount = 0;
        const maxAmount = targetAmount * 1.1;
        const minAmount = targetAmount * 0.9;
        
        const sortedProducts = [...availableProducts].sort((a, b) => b.avgPrice - a.avgPrice);
        const productsPool = [...sortedProducts];

        let attempts = 0;
        const maxAttempts = 200;

        while (currentAmount < minAmount && attempts < maxAttempts && productsPool.length > 0) {
            attempts++;
            
            const poolSize = Math.min(productsPool.length, 3);
            const productIndex = Math.floor(Math.random() * poolSize);
            const product = productsPool[productIndex];
            
            if (!product || product.quantity <= 0) {
                productsPool.splice(productIndex, 1);
                continue;
            }

            const sellingPrice = product.avgPrice * 1.2;
            const maxPossibleQty = Math.min(
                product.quantity,
                Math.floor((maxAmount - currentAmount) / sellingPrice)
            );

            if (maxPossibleQty > 0) {
                const minQty = Math.min(1, maxPossibleQty);
                const maxQty = Math.min(10, maxPossibleQty);
                const quantity = Math.max(minQty, Math.floor(Math.random() * maxQty) + 1);
                const productAmount = quantity * sellingPrice;
                
                if (currentAmount + productAmount <= maxAmount) {
                    selectedProducts.push({
                        msp: product.msp,
                        name: product.name,
                        unit: product.unit,
                        quantity: quantity,
                        price: sellingPrice,
                        costPrice: product.avgPrice,
                        amount: productAmount
                    });
                    
                    currentAmount += productAmount;
                    product.quantity -= quantity;
                    
                    if (product.quantity <= 0) {
                        productsPool.splice(productIndex, 1);
                    }
                } else {
                    productsPool.splice(productIndex, 1);
                }
            } else {
                productsPool.splice(productIndex, 1);
            }
        }

        return selectedProducts;
    }

    getAvailableProducts(hkd) {
        let aggregatedStock;
        if (typeof getAggregatedStock === 'function') {
            aggregatedStock = getAggregatedStock(hkd);
        } else {
            aggregatedStock = this.fallbackGetAggregatedStock(hkd);
        }

        return Object.values(aggregatedStock).filter(item => 
            item.quantity > 0 && item.category === 'hang_hoa'
        );
    }

    fallbackGetAggregatedStock(hkd) {
        const aggregated = {};
        if (hkd.tonkhoMain) {
            hkd.tonkhoMain.forEach(item => {
                if (!aggregated[item.msp]) {
                    aggregated[item.msp] = { 
                        ...item,
                        avgPrice: item.amount / item.quantity
                    };
                } else {
                    aggregated[item.msp].quantity += item.quantity;
                    aggregated[item.msp].amount += item.amount;
                    aggregated[item.msp].avgPrice = aggregated[item.msp].amount / aggregated[item.msp].quantity;
                }
            });
        }
        return aggregated;
    }
}

// ==================== KHỞI TẠO ====================
setTimeout(() => {
    if (!window.customerManager) {
        window.customerManager = new CustomerManager();
        window.customerManagementModal = window.customerManager.managementModal;
        console.log('🔄 Đã khởi tạo CustomerManager');
    }
}, 1000);

// Export toàn cục
window.CustomerManager = CustomerManager;
window.RandomCustomerGenerator = RandomCustomerGenerator;
window.ProductRandomizer = ProductRandomizer;
window.CustomerManagementModal = CustomerManagementModal;

console.log('📦 Module khách hàng/NCC đã load');