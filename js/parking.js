// Parking Slot Management
class ParkingManager {
    constructor() {
        this.floors = [];
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.loadFloors();
        this.renderFloors();
        this.startUpdateInterval();
    }

    loadFloors() {
        this.floors = storage.getFloors();
    }

    renderFloors() {
        const container = document.getElementById('parkingGrid');
        if (!container) return;

        container.innerHTML = '';
        
        this.floors.forEach(floor => {
            const floorElement = this.createFloorElement(floor);
            container.appendChild(floorElement);
        });
    }

    createFloorElement(floor) {
        const floorDiv = document.createElement('div');
        floorDiv.className = 'parking-floor';
        floorDiv.dataset.floorId = floor.id;

        // Floor header
        const floorHeader = document.createElement('div');
        floorHeader.className = 'floor-header';
        
        const floorTitle = document.createElement('h3');
        floorTitle.className = 'floor-title';
        const icon = floor.type === 'motor' ? '🛵' : '🚗';
        floorTitle.innerHTML = `<i class="fas fa-layer-group"></i> ${floor.name} <span class="floor-type">(${icon} ${floor.type === 'motor' ? 'Motor' : 'Mobil'})</span>`;
        floorHeader.appendChild(floorTitle);

        const floorStats = document.createElement('div');
        floorStats.className = 'floor-stats';
        const occupiedCount = floor.slots.filter(s => s.status === 'occupied').length;
        const totalCount = floor.slots.length;
        floorStats.innerHTML = `<span class="floor-stat occupied">${occupiedCount} terisi</span> / <span class="floor-stat total">${totalCount} total</span>`;
        floorHeader.appendChild(floorStats);

        floorDiv.appendChild(floorHeader);

        // Slots grid for this floor
        const slotsGrid = document.createElement('div');
        slotsGrid.className = 'slots-grid';
        
        floor.slots.forEach(slot => {
            const slotElement = this.createSlotElement(slot);
            slotsGrid.appendChild(slotElement);
        });

        floorDiv.appendChild(slotsGrid);

        return floorDiv;
    }

    createSlotElement(slot) {
        const div = document.createElement('div');
        div.className = `parking-slot ${slot.status}`;
        div.dataset.slotId = slot.id;

        // Add icon
        const icon = document.createElement('div');
        icon.className = 'slot-icon';
        if (slot.status === 'occupied' && slot.vehicle) {
            icon.innerHTML = slot.vehicle.type === 'motor' 
                ? '<i class="fas fa-motorcycle"></i>' 
                : '<i class="fas fa-car"></i>';
        } else {
            icon.innerHTML = '<i class="fas fa-parking"></i>';
        }
        div.appendChild(icon);

        const slotId = document.createElement('div');
        slotId.className = 'slot-id';
        slotId.textContent = slot.id;
        div.appendChild(slotId);

        if (slot.status === 'occupied' && slot.vehicle) {
            const info = document.createElement('div');
            info.className = 'slot-info';
            info.textContent = slot.vehicle.licensePlate;
            div.appendChild(info);

            const timer = document.createElement('div');
            timer.className = 'slot-timer';
            timer.dataset.entryTime = slot.entryTime;
            timer.textContent = this.calculateDuration(slot.entryTime);
            div.appendChild(timer);
        } else {
            const info = document.createElement('div');
            info.className = 'slot-info';
            info.textContent = 'Kosong';
            div.appendChild(info);
        }

        // Add click handler
        div.addEventListener('click', () => {
            if (slot.status === 'occupied') {
                this.showVehicleDetails(slot);
            }
        });

        return div;
    }

    calculateDuration(entryTime) {
        if (!entryTime) return '0 jam';
        
        const entry = new Date(entryTime);
        const now = new Date();
        const diffMs = now - entry;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours > 0) {
            return `${diffHours}j ${diffMinutes}m`;
        }
        return `${diffMinutes}m`;
    }

    updateSlotTimers() {
        const timers = document.querySelectorAll('.slot-timer');
        timers.forEach(timer => {
            const entryTime = timer.dataset.entryTime;
            if (entryTime) {
                timer.textContent = this.calculateDuration(entryTime);
            }
        });
    }

    updateSlotStatus(slotId, status) {
        const slotElement = document.querySelector(`[data-slot-id="${slotId}"]`);
        if (slotElement) {
            slotElement.className = `parking-slot ${status}`;
            // Re-render the slot content
            const slotData = storage.getSlot(slotId);
            slotElement.innerHTML = '';
            
            // Add icon
            const icon = document.createElement('div');
            icon.className = 'slot-icon';
            if (slotData.status === 'occupied' && slotData.vehicle) {
                icon.innerHTML = slotData.vehicle.type === 'motor' 
                    ? '<i class="fas fa-motorcycle"></i>' 
                    : '<i class="fas fa-car"></i>';
            } else {
                icon.innerHTML = '<i class="fas fa-parking"></i>';
            }
            slotElement.appendChild(icon);
            
            const slotIdDiv = document.createElement('div');
            slotIdDiv.className = 'slot-id';
            slotIdDiv.textContent = slotData.id;
            slotElement.appendChild(slotIdDiv);

            if (slotData.status === 'occupied' && slotData.vehicle) {
                const info = document.createElement('div');
                info.className = 'slot-info';
                info.textContent = slotData.vehicle.licensePlate;
                slotElement.appendChild(info);

                const timer = document.createElement('div');
                timer.className = 'slot-timer';
                timer.dataset.entryTime = slotData.entryTime;
                timer.textContent = this.calculateDuration(slotData.entryTime);
                slotElement.appendChild(timer);
            } else {
                const info = document.createElement('div');
                info.className = 'slot-info';
                info.textContent = 'Kosong';
                slotElement.appendChild(info);
            }
        }
    }

    showVehicleDetails(slot) {
        if (!slot.vehicle) return;

        const modal = document.getElementById('vehicleDetailsModal');
        const detailsDiv = document.getElementById('vehicleDetails');
        
        const entryTime = new Date(slot.entryTime);
        const now = new Date();
        const duration = this.calculateDuration(slot.entryTime);
        const hours = Math.ceil((now - entryTime) / (1000 * 60 * 60));

        // Get floor info
        const slotWithFloor = storage.getSlotWithFloor(slot.id);
        const floorName = slotWithFloor ? slotWithFloor.floor.name : 'Unknown';

        // Generate QR code data for vehicle
        const qrData = JSON.stringify({
            type: 'parking',
            licensePlate: slot.vehicle.licensePlate,
            slotId: slot.id,
            qrCode: slot.vehicle.qrCode,
            entryTime: slot.entryTime,
            vehicleType: slot.vehicle.type
        });

        detailsDiv.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Nomor Polisi:</span>
                <span class="detail-value">${slot.vehicle.licensePlate}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tipe Kendaraan:</span>
                <span class="detail-value">${slot.vehicle.type === 'motor' ? 'Motor' : 'Mobil'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Lantai:</span>
                <span class="detail-value">${floorName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Slot:</span>
                <span class="detail-value">${slot.id}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Waktu Masuk:</span>
                <span class="detail-value">${entryTime.toLocaleString('id-ID')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Durasi:</span>
                <span class="detail-value">${duration}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">QR Code ID:</span>
                <span class="detail-value">${slot.vehicle.qrCode}</span>
            </div>
            <div class="qr-display-section">
                <h4 style="margin-bottom: 0.5rem; color: var(--text-primary);">QR Code Kendaraan</h4>
                <div id="vehicleQRCode" class="vehicle-qr-code"></div>
                <button id="downloadQRBtn" class="btn btn-secondary" style="margin-top: 0.5rem; width: 100%;">
                    <i class="fas fa-download"></i> Download QR Code
                </button>
            </div>
        `;

        // Generate QR code for vehicle
        const vehicleQRCode = document.getElementById('vehicleQRCode');
        
        if (typeof QRCode !== 'undefined') {
            const canvas = document.createElement('canvas');
            vehicleQRCode.appendChild(canvas);

            QRCode.toCanvas(canvas, qrData, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }, function (error) {
                if (error) {
                    console.error('Error generating vehicle QR code:', error);
                    vehicleQRCode.innerHTML = `<p style="color: var(--danger-color);">Gagal generate QR code</p>`;
                }
            });
        } else {
            vehicleQRCode.innerHTML = `<p style="color: var(--danger-color);">QR Code library tidak tersedia</p>`;
        }

        // Download QR code button handler
        const downloadQRBtn = document.getElementById('downloadQRBtn');
        downloadQRBtn.onclick = () => {
            const canvas = vehicleQRCode.querySelector('canvas');
            if (canvas) {
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `QR_${slot.vehicle.licensePlate}_${slot.id}.png`;
                    link.click();
                    URL.revokeObjectURL(url);
                    app.showNotification('success', 'QR Code berhasil diunduh');
                });
            } else {
                app.showNotification('error', 'QR Code belum tersedia');
            }
        };

        modal.dataset.slotId = slot.id;
        modal.classList.add('active');
        modal.style.display = 'flex';

        // Update checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        checkoutBtn.onclick = () => {
            transactionManager.initiateCheckout(slot);
        };
    }

    checkWarningStatus() {
        const stats = storage.getStats();
        const occupancy = stats.occupancy;
        
        // Check if occupancy is above 80%
        if (occupancy >= 80) {
            app.showNotification('warning', `Peringatan: Slot parkir hampir penuh (${occupancy}%)`);
        }

        // Check for overstaying vehicles (more than 24 hours)
        const occupiedSlots = storage.getOccupiedSlots();
        occupiedSlots.forEach(slot => {
            if (slot.entryTime) {
                const entry = new Date(slot.entryTime);
                const now = new Date();
                const hours = (now - entry) / (1000 * 60 * 60);
                
                if (hours >= 24) {
                    app.showNotification('warning', `Kendaraan ${slot.vehicle.licensePlate} di slot ${slot.id} sudah lebih dari 24 jam`);
                }
            }
        });
    }

    startUpdateInterval() {
        // Update every minute
        this.updateInterval = setInterval(() => {
            this.loadFloors();
            this.renderFloors();
            this.updateSlotTimers();
            this.checkWarningStatus();
            app.updateDashboard();
        }, 60000); // 1 minute

        // Also update timers every 30 seconds
        setInterval(() => {
            this.updateSlotTimers();
        }, 30000);
    }

    stopUpdateInterval() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    refresh() {
        this.loadFloors();
        this.renderFloors();
        this.updateSlotTimers();
    }

    // Add a new floor
    addFloor(name, type, rows = 5, cols = 10) {
        const newFloor = storage.addFloor(name, type, rows, cols);
        this.loadFloors();
        this.renderFloors();
        return newFloor;
    }

    // Add slots to existing floor
    addSlotsToFloor(floorId, rows = 1, cols = 10) {
        const added = storage.addSlotsToFloor(floorId, rows, cols);
        this.loadFloors();
        this.renderFloors();
        return added;
    }
}

// Export singleton instance
const parkingManager = new ParkingManager();
