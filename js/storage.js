// Storage Management using LocalStorage
class Storage {
    constructor() {
        this.init();
    }

    init() {
        // Initialize default data if not exists
        if (!localStorage.getItem('parkingFloors')) {
            this.initFloors();
        }
        if (!localStorage.getItem('transactions')) {
            localStorage.setItem('transactions', JSON.stringify([]));
        }
        if (!localStorage.getItem('users')) {
            this.initUsers();
        }
        if (!localStorage.getItem('settings')) {
            localStorage.setItem('settings', JSON.stringify({
                theme: 'light',
                rates: {
                    motor: 2000,
                    mobil: 5000,
                    minimum: 5000
                },
                lastResetDate: null
            }));
        }
    }

    initFloors() {
        // Default: Lantai 1 untuk Motor, Lantai 2 untuk Mobil
        const floors = [
            {
                id: 'F1',
                name: 'Lantai 1',
                type: 'motor',
                slots: []
            },
            {
                id: 'F2',
                name: 'Lantai 2',
                type: 'mobil',
                slots: []
            }
        ];

        // Generate slots for each floor
        floors.forEach(floor => {
            const rows = ['A', 'B', 'C', 'D', 'E'];
            const cols = 10;
            
            for (let row = 0; row < rows.length; row++) {
                for (let col = 1; col <= cols; col++) {
                    floor.slots.push({
                        id: `${floor.id}-${rows[row]}-${col.toString().padStart(2, '0')}`,
                        status: 'empty',
                        vehicle: null,
                        entryTime: null
                    });
                }
            }
        });

        localStorage.setItem('parkingFloors', JSON.stringify(floors));
    }

    initUsers() {
        const users = [
            {
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                name: 'Administrator'
            },
            {
                username: 'juru_parkir',
                password: 'parkir123',
                role: 'juru_parkir',
                name: 'Juru Parkir'
            }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Floor Management
    getFloors() {
        return JSON.parse(localStorage.getItem('parkingFloors') || '[]');
    }

    getFloor(floorId) {
        const floors = this.getFloors();
        return floors.find(f => f.id === floorId);
    }

    getFloorsByType(type) {
        const floors = this.getFloors();
        return floors.filter(f => f.type === type);
    }

    addFloor(name, type, rows = 5, cols = 10) {
        const floors = this.getFloors();
        const floorId = 'F' + (floors.length + 1);
        
        const newFloor = {
            id: floorId,
            name: name || `Lantai ${floors.length + 1}`,
            type: type,
            slots: []
        };

        // Generate slots for new floor
        const rowLetters = [];
        for (let i = 0; i < rows; i++) {
            rowLetters.push(String.fromCharCode(65 + i)); // A, B, C, etc.
        }

        for (let row = 0; row < rows; row++) {
            for (let col = 1; col <= cols; col++) {
                newFloor.slots.push({
                    id: `${floorId}-${rowLetters[row]}-${col.toString().padStart(2, '0')}`,
                    status: 'empty',
                    vehicle: null,
                    entryTime: null
                });
            }
        }

        floors.push(newFloor);
        localStorage.setItem('parkingFloors', JSON.stringify(floors));
        return newFloor;
    }

    updateFloor(floorId, data) {
        const floors = this.getFloors();
        const index = floors.findIndex(f => f.id === floorId);
        if (index !== -1) {
            floors[index] = { ...floors[index], ...data };
            localStorage.setItem('parkingFloors', JSON.stringify(floors));
            return true;
        }
        return false;
    }

    deleteFloor(floorId) {
        const floors = this.getFloors();
        const filtered = floors.filter(f => f.id !== floorId);
        localStorage.setItem('parkingFloors', JSON.stringify(filtered));
        return true;
    }

    addSlotsToFloor(floorId, rows = 1, cols = 10) {
        const floors = this.getFloors();
        const floorIndex = floors.findIndex(f => f.id === floorId);
        
        if (floorIndex === -1) return false;

        const floor = floors[floorIndex];
        const existingRowCount = Math.ceil(floor.slots.length / 10);
        const rowLetters = [];
        for (let i = 0; i < existingRowCount + rows; i++) {
            rowLetters.push(String.fromCharCode(65 + i));
        }

        let addedCount = 0;
        const currentSlotCount = floor.slots.length;
        const slotsToAdd = rows * cols;

        for (let r = existingRowCount; r < existingRowCount + rows; r++) {
            for (let c = 1; c <= cols; c++) {
                const slotId = `${floorId}-${rowLetters[r]}-${c.toString().padStart(2, '0')}`;
                
                // Check if slot already exists
                if (!floor.slots.find(s => s.id === slotId)) {
                    floor.slots.push({
                        id: slotId,
                        status: 'empty',
                        vehicle: null,
                        entryTime: null
                    });
                    addedCount++;
                }
            }
        }

        floors[floorIndex] = floor;
        localStorage.setItem('parkingFloors', JSON.stringify(floors));
        return addedCount;
    }

    // Slot Management
    getSlots() {
        const floors = this.getFloors();
        return floors.flatMap(f => f.slots);
    }

    getSlot(slotId) {
        const floors = this.getFloors();
        for (const floor of floors) {
            const slot = floor.slots.find(s => s.id === slotId);
            if (slot) return slot;
        }
        return null;
    }

    getSlotWithFloor(slotId) {
        const floors = this.getFloors();
        for (const floor of floors) {
            const slot = floor.slots.find(s => s.id === slotId);
            if (slot) return { slot, floor };
        }
        return null;
    }

    updateSlot(slotId, data) {
        const floors = this.getFloors();
        for (const floor of floors) {
            const slotIndex = floor.slots.findIndex(s => s.id === slotId);
            if (slotIndex !== -1) {
                floor.slots[slotIndex] = { ...floor.slots[slotIndex], ...data };
                localStorage.setItem('parkingFloors', JSON.stringify(floors));
                return true;
            }
        }
        return false;
    }

    getEmptySlots(vehicleType = null) {
        const floors = this.getFloors();
        if (vehicleType) {
            const targetFloor = floors.find(f => f.type === vehicleType);
            if (targetFloor) {
                return targetFloor.slots.filter(s => s.status === 'empty');
            }
            return [];
        }
        return floors.flatMap(f => f.slots).filter(s => s.status === 'empty');
    }

    getOccupiedSlots() {
        const floors = this.getFloors();
        return floors.flatMap(f => f.slots).filter(s => s.status === 'occupied');
    }

    // Vehicle Management
    addVehicle(slotId, vehicleData) {
        const slot = this.getSlot(slotId);
        if (!slot || slot.status !== 'empty') {
            return false;
        }

        const vehicle = {
            licensePlate: vehicleData.licensePlate,
            type: vehicleData.type,
            qrCode: vehicleData.qrCode || this.generateQRCode(),
            entryTime: new Date().toISOString(),
            slotId: slotId
        };

        this.updateSlot(slotId, {
            status: 'occupied',
            vehicle: vehicle,
            entryTime: vehicle.entryTime
        });

        return vehicle;
    }

    removeVehicle(slotId) {
        const slot = this.getSlot(slotId);
        if (!slot || slot.status !== 'occupied') {
            return false;
        }

        this.updateSlot(slotId, {
            status: 'empty',
            vehicle: null,
            entryTime: null
        });

        return true;
    }

    generateQRCode() {
        return 'QR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    // Daily reset (slots + transaksi)
    resetDailyData() {
        // Reset all slots in all floors
        const floors = this.getFloors();
        floors.forEach(floor => {
            floor.slots.forEach(slot => {
                slot.status = 'empty';
                slot.vehicle = null;
                slot.entryTime = null;
            });
        });
        localStorage.setItem('parkingFloors', JSON.stringify(floors));

        // Hapus seluruh transaksi
        localStorage.setItem('transactions', JSON.stringify([]));

        // Simpan tanggal reset terakhir
        const currentSettings = this.getSettings();
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('settings', JSON.stringify({
            ...currentSettings,
            lastResetDate: today
        }));
    }

    // Transaction Management
    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transaction.id = Date.now().toString();
        transaction.createdAt = new Date().toISOString();
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        return transaction;
    }

    getTransactions() {
        return JSON.parse(localStorage.getItem('transactions') || '[]');
    }

    getTransactionsByDate(date) {
        const transactions = this.getTransactions();
        return transactions.filter(t => {
            const tDate = new Date(t.createdAt).toDateString();
            return tDate === date.toDateString();
        });
    }

    getTodayTransactions() {
        return this.getTransactionsByDate(new Date());
    }

    // User Management
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    getUser(username) {
        const users = this.getUsers();
        return users.find(u => u.username === username);
    }

    // Settings
    getSettings() {
        return JSON.parse(localStorage.getItem('settings') || '{}');
    }

    updateSettings(settings) {
        const current = this.getSettings();
        localStorage.setItem('settings', JSON.stringify({ ...current, ...settings }));
    }

    // Statistics
    getStats() {
        const floors = this.getFloors();
        const allSlots = floors.flatMap(f => f.slots);
        const total = allSlots.length;
        const empty = allSlots.filter(s => s.status === 'empty').length;
        const occupied = allSlots.filter(s => s.status === 'occupied').length;
        const occupancy = total > 0 ? ((occupied / total) * 100).toFixed(1) : 0;

        return {
            total,
            empty,
            occupied,
            occupancy: parseFloat(occupancy),
            motorSlots: floors.filter(f => f.type === 'motor').flatMap(f => f.slots).length,
            mobilSlots: floors.filter(f => f.type === 'mobil').flatMap(f => f.slots).length,
            motorOccupied: floors.filter(f => f.type === 'motor').flatMap(f => f.slots).filter(s => s.status === 'occupied').length,
            mobilOccupied: floors.filter(f => f.type === 'mobil').flatMap(f => f.slots).filter(s => s.status === 'occupied').length
        };
    }

    getDailyOccupancy() {
        const transactions = this.getTransactions();
        const last7Days = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayTransactions = transactions.filter(t => {
                const tDate = new Date(t.createdAt).toDateString();
                return tDate === date.toDateString();
            });
            
            last7Days.push({
                date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
                count: dayTransactions.length,
                revenue: dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
            });
        }

        return last7Days;
    }

    getTodayRevenue() {
        const todayTransactions = this.getTodayTransactions();
        return todayTransactions
            .filter(t => t.status === 'paid')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }
}

// Export singleton instance
const storage = new Storage();
