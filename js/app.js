// Main Application Logic
class ParkingApp {
    constructor() {
        this.currentUser = null;
        this.occupancyChart = null;
        this.revenueChart = null;
        this.clockInterval = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadTheme();
    }

    checkAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('app').classList.remove('hidden');
        this.updateUserInfo();
        this.updateDashboard();
        this.initCharts();
        this.startClock();
        parkingManager.refresh();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Add vehicle button
        document.getElementById('addVehicleBtn').addEventListener('click', () => {
            this.showAddVehicleModal();
        });

        // View history button
        document.getElementById('viewHistoryBtn').addEventListener('click', () => {
            this.showHistoryModal();
        });

        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // Reset harian
        const resetDailyBtn = document.getElementById('resetDailyBtn');
        if (resetDailyBtn) {
            resetDailyBtn.addEventListener('click', () => {
                this.resetDailyData();
            });
        }

        // Add floor button
        const addFloorBtn = document.getElementById('addFloorBtn');
        if (addFloorBtn) {
            addFloorBtn.addEventListener('click', () => {
                this.showAddFloorModal();
            });
        }

        // Add slots button
        const addSlotsBtn = document.getElementById('addSlotsBtn');
        if (addSlotsBtn) {
            addSlotsBtn.addEventListener('click', () => {
                this.showAddSlotsModal();
            });
        }

        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveSettings();
            });
        }

        // Add floor form
        const addFloorForm = document.getElementById('addFloorForm');
        if (addFloorForm) {
            addFloorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddFloor();
            });
        }

        // Add slots form
        const addSlotsForm = document.getElementById('addSlotsForm');
        if (addSlotsForm) {
            addSlotsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddSlots();
            });
        }

        // Parking slot search and filters
        const searchSlot = document.getElementById('searchSlot');
        if (searchSlot) {
            searchSlot.addEventListener('input', (e) => {
                this.filterParkingSlots();
            });
        }

        const filterSlotStatus = document.getElementById('filterSlotStatus');
        if (filterSlotStatus) {
            filterSlotStatus.addEventListener('change', () => {
                this.filterParkingSlots();
            });
        }

        const filterSlotRow = document.getElementById('filterSlotRow');
        if (filterSlotRow) {
            filterSlotRow.addEventListener('change', () => {
                this.filterParkingSlots();
            });
        }

        // History date filters
        const filterDateFrom = document.getElementById('filterDateFrom');
        const filterDateTo = document.getElementById('filterDateTo');
        const resetDateFilter = document.getElementById('resetDateFilter');
        
        if (filterDateFrom) {
            filterDateFrom.addEventListener('change', () => {
                this.filterHistoryByDate();
            });
        }
        if (filterDateTo) {
            filterDateTo.addEventListener('change', () => {
                this.filterHistoryByDate();
            });
        }
        if (resetDateFilter) {
            resetDateFilter.addEventListener('click', () => {
                filterDateFrom.value = '';
                filterDateTo.value = '';
                this.filterHistoryByDate();
            });
        }

        // History tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchHistoryTab(tab);
            });
        });

        // Vehicle history search
        const vehicleSearchHistory = document.getElementById('vehicleSearchHistory');
        if (vehicleSearchHistory) {
            vehicleSearchHistory.addEventListener('input', (e) => {
                this.searchVehicleHistory(e.target.value);
            });
        }

        // Print receipt button
        const printReceiptBtn = document.getElementById('printReceiptBtn');
        if (printReceiptBtn) {
            printReceiptBtn.addEventListener('click', () => {
                this.printReceipt();
            });
        }

        // Modal close buttons
        document.querySelectorAll('.close, .close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    modal.style.display = 'none';
                }
            });
        });

        // Vehicle form
        document.getElementById('vehicleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddVehicle();
        });

        // License plate validation
        document.getElementById('licensePlate').addEventListener('input', (e) => {
            this.validateLicensePlate(e.target);
        });

        // Vehicle type change - filter available slots
        const vehicleTypeSelect = document.getElementById('vehicleType');
        if (vehicleTypeSelect) {
            vehicleTypeSelect.addEventListener('change', (e) => {
                this.updateAvailableSlots(e.target.value);
            });
        }

        // Search history
        document.getElementById('searchHistory').addEventListener('input', (e) => {
            this.filterHistory(e.target.value);
        });

        // Export buttons
        document.getElementById('exportCSVBtn').addEventListener('click', () => {
            transactionManager.exportToCSV();
        });

        document.getElementById('exportPDFBtn').addEventListener('click', () => {
            transactionManager.exportToPDF();
        });

        const exportRevenueBtn = document.getElementById('exportRevenueBtn');
        if (exportRevenueBtn) {
            exportRevenueBtn.addEventListener('click', () => {
                transactionManager.exportRevenueSummary();
            });
        }

        // QR scan button (simulation)
        document.getElementById('scanQRBtn').addEventListener('click', () => {
            this.simulateQRScan();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
                e.target.style.display = 'none';
            }
        });
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        const user = storage.getUser(username);
        
        if (user && user.password === password) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            errorDiv.classList.remove('show');
            this.showApp();
        } else {
            errorDiv.textContent = 'Username atau password salah!';
            errorDiv.classList.add('show');
        }
    }

    handleLogout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        this.showLogin();
        document.getElementById('loginForm').reset();
    }

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (this.currentUser) {
            userInfo.textContent = `${this.currentUser.name} (${this.currentUser.role})`;
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        // Update charts if they exist
        if (this.occupancyChart) {
            this.occupancyChart.destroy();
            this.initCharts();
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    updateDashboard() {
        const stats = storage.getStats();
        
        document.getElementById('totalSlots').textContent = stats.total;
        document.getElementById('emptySlots').textContent = stats.empty;
        document.getElementById('occupiedSlots').textContent = stats.occupied;
        document.getElementById('occupancyRate').textContent = `${stats.occupancy}%`;

        // Update motor and mobil stats
        const motorSlotsEl = document.getElementById('motorSlots');
        const mobilSlotsEl = document.getElementById('mobilSlots');
        const motorOccupiedEl = document.getElementById('motorOccupied');
        const mobilOccupiedEl = document.getElementById('mobilOccupied');
        
        if (motorSlotsEl) motorSlotsEl.textContent = `${stats.motorOccupied}/${stats.motorSlots}`;
        if (mobilSlotsEl) mobilSlotsEl.textContent = `${stats.mobilOccupied}/${stats.mobilSlots}`;
        if (motorOccupiedEl) motorOccupiedEl.textContent = stats.motorOccupied;
        if (mobilOccupiedEl) mobilOccupiedEl.textContent = stats.mobilOccupied;

        const todayRevenue = storage.getTodayRevenue();
        const todayRevenueEl = document.getElementById('todayRevenue');
        if (todayRevenueEl) {
            todayRevenueEl.textContent = transactionManager.formatCurrency(todayRevenue);
        }

        // Update slot colors based on occupancy
        const slots = document.querySelectorAll('.parking-slot');
        slots.forEach(slot => {
            if (stats.occupancy >= 80 && slot.classList.contains('empty')) {
                slot.classList.add('warning');
            } else {
                slot.classList.remove('warning');
            }
        });
    }

    startClock() {
        const clockEl = document.getElementById('clock');
        if (!clockEl) return;

        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }

        const updateClock = () => {
            const now = new Date();
            clockEl.textContent = now.toLocaleString('id-ID', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };

        updateClock();
        this.clockInterval = setInterval(updateClock, 1000);
    }

    initCharts() {
        this.initOccupancyChart();
        this.initRevenueChart();
    }

    initOccupancyChart() {
        const ctx = document.getElementById('occupancyChart');
        if (!ctx) return;

        const dailyData = storage.getDailyOccupancy();
        
        if (this.occupancyChart) {
            this.occupancyChart.destroy();
        }

        this.occupancyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyData.map(d => d.date),
                datasets: [{
                    label: 'Jumlah Transaksi',
                    data: dailyData.map(d => d.count),
                    borderColor: 'rgb(49, 130, 206)',
                    backgroundColor: 'rgba(49, 130, 206, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const dailyData = storage.getDailyOccupancy();
        const todayRevenue = storage.getTodayRevenue();
        
        if (this.revenueChart) {
            this.revenueChart.destroy();
        }

        this.revenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dailyData.map(d => d.date),
                datasets: [{
                    label: 'Pendapatan (Rp)',
                    data: dailyData.map(d => d.revenue),
                    backgroundColor: 'rgba(72, 187, 120, 0.6)',
                    borderColor: 'rgba(72, 187, 120, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Rp ' + new Intl.NumberFormat('id-ID').format(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + new Intl.NumberFormat('id-ID').format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        this.initCharts();
    }

    showAddVehicleModal() {
        const modal = document.getElementById('vehicleModal');
        const slotSelect = document.getElementById('selectedSlot');
        const vehicleType = document.getElementById('vehicleType').value;
        
        // Populate available slots based on vehicle type
        this.updateAvailableSlots(vehicleType);

        modal.classList.add('active');
        modal.style.display = 'flex';
        document.getElementById('vehicleForm').reset();
    }

    updateAvailableSlots(vehicleType) {
        const slotSelect = document.getElementById('selectedSlot');
        const emptySlots = storage.getEmptySlots(vehicleType);
        
        slotSelect.innerHTML = '<option value="">Pilih Slot</option>';
        emptySlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.id;
            option.textContent = slot.id;
            slotSelect.appendChild(option);
        });

        if (emptySlots.length === 0) {
            slotSelect.innerHTML = '<option value="">Tidak ada slot tersedia</option>';
            slotSelect.disabled = true;
            if (vehicleType) {
                this.showNotification('warning', `Tidak ada slot ${vehicleType === 'motor' ? 'motor' : 'mobil'} tersedia!`);
            }
        } else {
            slotSelect.disabled = false;
        }
    }

    validateLicensePlate(input) {
        const value = input.value.toUpperCase();
        // Indonesian license plate format: B 1234 XYZ
        const pattern = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/;
        
        if (value && !pattern.test(value)) {
            input.style.borderColor = 'var(--danger-color)';
        } else {
            input.style.borderColor = 'var(--border-color)';
        }
        
        // Auto-format: add space after letter(s) and before numbers
        const formatted = value.replace(/([A-Z]{1,2})(\d)/, '$1 $2');
        if (formatted !== value) {
            input.value = formatted;
        }
    }

    handleAddVehicle() {
        const licensePlate = document.getElementById('licensePlate').value.trim().toUpperCase();
        const vehicleType = document.getElementById('vehicleType').value;
        const qrCode = document.getElementById('qrCode').value.trim();
        const slotId = document.getElementById('selectedSlot').value;

        // Validate license plate format
        const pattern = /^[A-Z]{1,2}\s\d{1,4}\s[A-Z]{1,3}$/;
        if (!pattern.test(licensePlate)) {
            this.showNotification('error', 'Format nomor polisi tidak valid! Contoh: B 1234 XYZ');
            return;
        }

        if (!vehicleType || !slotId) {
            this.showNotification('error', 'Harap lengkapi semua field!');
            return;
        }

        // Check if license plate already exists in occupied slots
        const occupiedSlots = storage.getOccupiedSlots();
        const existing = occupiedSlots.find(s => 
            s.vehicle && s.vehicle.licensePlate === licensePlate
        );

        if (existing) {
            this.showNotification('error', `Kendaraan dengan nomor polisi ${licensePlate} sudah terparkir di slot ${existing.id}`);
            return;
        }

        // Add vehicle
        const vehicleData = {
            licensePlate: licensePlate,
            type: vehicleType,
            qrCode: qrCode || storage.generateQRCode()
        };

        const vehicle = storage.addVehicle(slotId, vehicleData);

        if (vehicle) {
            this.showNotification('success', `Kendaraan ${licensePlate} berhasil ditambahkan ke slot ${slotId}`);
            parkingManager.refresh();
            this.updateDashboard();
            
            // Close modal
            document.getElementById('vehicleModal').classList.remove('active');
            document.getElementById('vehicleModal').style.display = 'none';
            document.getElementById('vehicleForm').reset();
        } else {
            this.showNotification('error', 'Gagal menambahkan kendaraan. Slot mungkin sudah terisi.');
        }
    }

    simulateQRScan() {
        // Generate a new QR code for the vehicle
        const qrInput = document.getElementById('qrCode');
        const simulatedQR = storage.generateQRCode();
        qrInput.value = simulatedQR;
        
        // Show QR code preview
        this.showQRCodePreview(simulatedQR);
        this.showNotification('success', 'QR Code berhasil di-generate!');
    }

    showQRCodePreview(qrData) {
        // Check if QRCode library is available
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            return;
        }

        // Check if preview already exists
        let previewContainer = document.getElementById('qrPreviewContainer');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'qrPreviewContainer';
            previewContainer.className = 'qr-preview-container';
            const qrCodeInput = document.getElementById('qrCode');
            qrCodeInput.parentNode.appendChild(previewContainer);
        }

        previewContainer.innerHTML = '<canvas id="qrPreviewCanvas"></canvas>';
        const canvas = document.getElementById('qrPreviewCanvas');

        QRCode.toCanvas(canvas, qrData, {
            width: 150,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, function (error) {
            if (error) {
                console.error('Error generating QR preview:', error);
                previewContainer.innerHTML = '';
            }
        });
    }

    showHistoryModal() {
        const modal = document.getElementById('historyModal');
        modal.classList.add('active');
        modal.style.display = 'flex';
        this.renderHistory();
    }

    renderHistory() {
        const tbody = document.getElementById('historyTableBody');
        const transactions = storage.getTransactions().reverse(); // Latest first
        
        tbody.innerHTML = '';

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem;">Tidak ada data transaksi</td></tr>';
            return;
        }

        transactions.forEach((transaction, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${new Date(transaction.entryTime).toLocaleString('id-ID')}</td>
                <td>${transaction.exitTime ? new Date(transaction.exitTime).toLocaleString('id-ID') : '-'}</td>
                <td>${transaction.licensePlate}</td>
                <td>${transaction.vehicleType === 'motor' ? 'Motor' : 'Mobil'}</td>
                <td>${transaction.slotId}</td>
                <td>${transaction.duration || '-'}</td>
                <td>${transactionManager.formatCurrency(transaction.amount || 0)}</td>
                <td><span class="status-badge ${transaction.status || 'pending'}">${transaction.status === 'paid' ? 'Lunas' : 'Pending'}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    filterHistory(searchTerm) {
        const rows = document.querySelectorAll('#historyTableBody tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    showNotification(type, message) {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <span>${message}</span>
            <span class="notification-close"><i class="fas fa-times"></i></span>
        `;

        notifications.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const settings = storage.getSettings();
        
        document.getElementById('motorRate').value = settings.rates.motor;
        document.getElementById('mobilRate').value = settings.rates.mobil;
        document.getElementById('minimumRate').value = settings.rates.minimum;
        
        modal.classList.add('active');
        modal.style.display = 'flex';
    }

    showAddFloorModal() {
        const modal = document.getElementById('addFloorModal');
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.getElementById('addFloorForm').reset();
    }

    showAddSlotsModal() {
        const modal = document.getElementById('addSlotsModal');
        
        // Populate floor dropdown
        const floorSelect = document.getElementById('addSlotsFloor');
        const floors = storage.getFloors();
        floorSelect.innerHTML = '';
        floors.forEach(floor => {
            const option = document.createElement('option');
            option.value = floor.id;
            option.textContent = `${floor.name} (${floor.type === 'motor' ? 'Motor' : 'Mobil'})`;
            floorSelect.appendChild(option);
        });

        modal.classList.add('active');
        modal.style.display = 'flex';
        document.getElementById('addSlotsForm').reset();
    }

    resetDailyData() {
        const confirmReset = window.confirm('Yakin ingin mereset data hari ini? Semua transaksi dan status slot akan dikosongkan.');
        if (!confirmReset) return;

        storage.resetDailyData();
        parkingManager.refresh();
        this.updateDashboard();
        this.updateCharts();
        this.showNotification('success', 'Data parkir dan pendapatan berhasil di-reset.');
    }

    handleAddFloor() {
        const floorName = document.getElementById('newFloorName').value;
        const floorType = document.getElementById('newFloorType').value;
        const floorRows = parseInt(document.getElementById('newFloorRows').value) || 5;
        const floorCols = parseInt(document.getElementById('newFloorCols').value) || 10;

        if (!floorName || !floorType) {
            this.showNotification('error', 'Harap lengkapi semua field!');
            return;
        }

        const newFloor = parkingManager.addFloor(floorName, floorType, floorRows, floorCols);
        
        if (newFloor) {
            this.showNotification('success', `Lantai ${newFloor.name} berhasil ditambahkan dengan ${newFloor.slots.length} slot!`);
            
            // Close modal
            document.getElementById('addFloorModal').classList.remove('active');
            document.getElementById('addFloorModal').style.display = 'none';
            
            this.updateDashboard();
        } else {
            this.showNotification('error', 'Gagal menambahkan lantai.');
        }
    }

    handleAddSlots() {
        const floorId = document.getElementById('addSlotsFloor').value;
        const rowsToAdd = parseInt(document.getElementById('slotsRowsToAdd').value) || 1;
        const colsToAdd = parseInt(document.getElementById('slotsColsToAdd').value) || 10;

        if (!floorId || rowsToAdd < 1 || colsToAdd < 1) {
            this.showNotification('error', 'Harap lengkapi semua field dengan benar!');
            return;
        }

        const added = parkingManager.addSlotsToFloor(floorId, rowsToAdd, colsToAdd);
        
        if (added > 0) {
            this.showNotification('success', `${added} slot parkir berhasil ditambahkan!`);
            
            // Close modal
            document.getElementById('addSlotsModal').classList.remove('active');
            document.getElementById('addSlotsModal').style.display = 'none';
            
            this.updateDashboard();
        } else {
            this.showNotification('warning', 'Tidak ada slot baru yang ditambahkan (mungkin sudah ada).');
        }
    }

    handleSaveSettings() {
        const motorRate = parseInt(document.getElementById('motorRate').value);
        const mobilRate = parseInt(document.getElementById('mobilRate').value);
        const minimumRate = parseInt(document.getElementById('minimumRate').value);

        storage.updateSettings({
            rates: {
                motor: motorRate,
                mobil: mobilRate,
                minimum: minimumRate
            }
        });

        // Update transaction manager settings
        transactionManager.settings = storage.getSettings();

        // Update vehicle type dropdown with new rates
        const vehicleTypeSelect = document.getElementById('vehicleType');
        if (vehicleTypeSelect) {
            const options = vehicleTypeSelect.options;
            if (options.length >= 3) {
                options[1].text = `🛵 Motor (Rp${motorRate.toLocaleString('id-ID')}/jam)`;
                options[2].text = `🚗 Mobil (Rp${mobilRate.toLocaleString('id-ID')}/jam)`;
            }
        }

        this.showNotification('success', 'Pengaturan berhasil disimpan!');
        
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('active');
        modal.style.display = 'none';
    }

    filterParkingSlots() {
        const searchTerm = document.getElementById('searchSlot').value.toLowerCase();
        const statusFilter = document.getElementById('filterSlotStatus').value;
        
        const floors = document.querySelectorAll('.parking-floor');
        
        floors.forEach(floor => {
            const slots = floor.querySelectorAll('.parking-slot');
            let visibleSlots = 0;
            
            slots.forEach(slot => {
                const slotId = slot.dataset.slotId || '';
                const slotStatus = slot.classList.contains('empty') ? 'empty' : 
                                 slot.classList.contains('occupied') ? 'occupied' : 'empty';
                
                // Get the license plate from slot info (for occupied slots)
                const slotInfo = slot.querySelector('.slot-info');
                const licensePlate = slotInfo ? slotInfo.textContent.toLowerCase() : '';

                let show = true;

                // Search filter - search by slot ID OR license plate
                if (searchTerm && !slotId.toLowerCase().includes(searchTerm) && !licensePlate.includes(searchTerm)) {
                    show = false;
                }

                // Status filter
                if (statusFilter !== 'all' && slotStatus !== statusFilter) {
                    show = false;
                }

                slot.style.display = show ? '' : 'none';
                if (show) visibleSlots++;
            });

            // Hide floor header if no visible slots
            const floorHeader = floor.querySelector('.floor-header');
            if (floorHeader) {
                floorHeader.style.display = visibleSlots > 0 || searchTerm === '' ? '' : 'none';
            }
        });
    }

    filterHistoryByDate() {
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        const rows = document.querySelectorAll('#historyTableBody tr');

        rows.forEach(row => {
            const entryTimeText = row.cells[1]?.textContent || '';
            let show = true;

            if (dateFrom || dateTo) {
                // Extract date from entry time (format: DD/MM/YYYY HH:MM:SS)
                const dateMatch = entryTimeText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (dateMatch) {
                    const rowDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
                    
                    if (dateFrom && rowDate < dateFrom) {
                        show = false;
                    }
                    if (dateTo && rowDate > dateTo) {
                        show = false;
                    }
                } else {
                    show = false;
                }
            }

            row.style.display = show ? '' : 'none';
        });
    }

    switchHistoryTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const allSection = document.getElementById('historyTableBody').parentElement.parentElement;
        const vehicleSection = document.getElementById('vehicleHistorySection');

        if (tab === 'all') {
            allSection.style.display = '';
            vehicleSection.classList.add('hidden');
        } else {
            allSection.style.display = 'none';
            vehicleSection.classList.remove('hidden');
        }
    }

    searchVehicleHistory(licensePlate) {
        if (!licensePlate || licensePlate.trim() === '') {
            document.getElementById('vehicleHistoryResults').innerHTML = '';
            return;
        }

        const transactions = storage.getTransactions();
        const vehicleTransactions = transactions.filter(t => 
            t.licensePlate.toLowerCase().includes(licensePlate.toLowerCase())
        ).reverse();

        const resultsDiv = document.getElementById('vehicleHistoryResults');
        
        if (vehicleTransactions.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Tidak ada data untuk nomor polisi ini</p>';
            return;
        }

        const totalTransactions = vehicleTransactions.length;
        const totalRevenue = vehicleTransactions
            .filter(t => t.status === 'paid')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const avgDuration = vehicleTransactions.reduce((sum, t) => {
            const duration = t.duration || '0 menit';
            const hours = duration.match(/(\d+)\s*jam/)?.[1] || 0;
            const minutes = duration.match(/(\d+)\s*menit/)?.[1] || 0;
            return sum + (parseInt(hours) * 60 + parseInt(minutes));
        }, 0) / totalTransactions;

        let html = `
            <div class="vehicle-history-card">
                <h4><i class="fas fa-car"></i> ${licensePlate.toUpperCase()}</h4>
                <div class="vehicle-history-stats">
                    <div class="stat-item">
                        <div class="stat-item-label">Total Transaksi</div>
                        <div class="stat-item-value">${totalTransactions}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-item-label">Total Pendapatan</div>
                        <div class="stat-item-value">${transactionManager.formatCurrency(totalRevenue)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-item-label">Rata-rata Durasi</div>
                        <div class="stat-item-value">${Math.round(avgDuration)} menit</div>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Waktu Masuk</th>
                            <th>Waktu Keluar</th>
                            <th>Slot</th>
                            <th>Durasi</th>
                            <th>Biaya</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        vehicleTransactions.forEach((transaction, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${new Date(transaction.entryTime).toLocaleString('id-ID')}</td>
                    <td>${transaction.exitTime ? new Date(transaction.exitTime).toLocaleString('id-ID') : '-'}</td>
                    <td>${transaction.slotId}</td>
                    <td>${transaction.duration || '-'}</td>
                    <td>${transactionManager.formatCurrency(transaction.amount || 0)}</td>
                    <td><span class="status-badge ${transaction.status || 'pending'}">${transaction.status === 'paid' ? 'Lunas' : 'Pending'}</span></td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        resultsDiv.innerHTML = html;
    }

    showReceipt(transaction) {
        const modal = document.getElementById('receiptModal');
        const receiptContent = document.getElementById('receiptContent');
        
        const receiptHTML = `
            <div class="receipt-header">
                <h3>SISTEM PARKIR</h3>
                <p>Struk Pembayaran</p>
            </div>
            <div class="receipt-details">
                <div class="receipt-line">
                    <span>Nomor Polisi:</span>
                    <span>${transaction.licensePlate}</span>
                </div>
                <div class="receipt-line">
                    <span>Tipe:</span>
                    <span>${transaction.vehicleType === 'motor' ? 'Motor' : 'Mobil'}</span>
                </div>
                <div class="receipt-line">
                    <span>Slot:</span>
                    <span>${transaction.slotId}</span>
                </div>
                <div class="receipt-line">
                    <span>Waktu Masuk:</span>
                    <span>${new Date(transaction.entryTime).toLocaleString('id-ID')}</span>
                </div>
                <div class="receipt-line">
                    <span>Waktu Keluar:</span>
                    <span>${new Date(transaction.exitTime).toLocaleString('id-ID')}</span>
                </div>
                <div class="receipt-line">
                    <span>Durasi:</span>
                    <span>${transaction.duration}</span>
                </div>
                <div class="receipt-line receipt-total">
                    <span>Total:</span>
                    <span>${transactionManager.formatCurrency(transaction.amount)}</span>
                </div>
            </div>
            <div class="receipt-footer">
                <p>Terima Kasih</p>
                <p>${new Date().toLocaleString('id-ID')}</p>
            </div>
        `;

        receiptContent.innerHTML = receiptHTML;
        modal.classList.add('active');
        modal.style.display = 'flex';
    }

    printReceipt() {
        window.print();
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ParkingApp();
});

// Export for global access
window.app = app;
