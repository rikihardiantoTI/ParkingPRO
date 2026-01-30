// Transaction and Billing Management
class TransactionManager {
    constructor() {
        this.settings = storage.getSettings();
    }

    calculateCost(entryTime, vehicleType) {
        const entry = new Date(entryTime);
        const now = new Date();
        const diffMs = now - entry;
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60)); // Round up
        
        const rate = vehicleType === 'motor' 
            ? this.settings.rates.motor 
            : this.settings.rates.mobil;
        
        const cost = diffHours * rate;
        return Math.max(cost, this.settings.rates.minimum);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    initiateCheckout(slot) {
        if (!slot || !slot.vehicle) {
            app.showNotification('error', 'Data kendaraan tidak ditemukan');
            return;
        }

        const cost = this.calculateCost(slot.entryTime, slot.vehicle.type);
        const entryTime = new Date(slot.entryTime);
        const now = new Date();
        const duration = this.calculateDuration(slot.entryTime);

        // Close vehicle details modal
        document.getElementById('vehicleDetailsModal').classList.remove('active');
        document.getElementById('vehicleDetailsModal').style.display = 'none';

        // Show payment modal
        const paymentModal = document.getElementById('paymentModal');
        const paymentDetails = document.getElementById('paymentDetails');
        const paymentAmount = document.getElementById('paymentAmount');

        paymentDetails.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Nomor Polisi:</span>
                <span class="detail-value">${slot.vehicle.licensePlate}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tipe:</span>
                <span class="detail-value">${slot.vehicle.type === 'motor' ? 'Motor' : 'Mobil'}</span>
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
                <span class="detail-label">Waktu Keluar:</span>
                <span class="detail-value">${now.toLocaleString('id-ID')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Durasi:</span>
                <span class="detail-value">${duration}</span>
            </div>
        `;

        paymentAmount.textContent = this.formatCurrency(cost);
        this.generateQRCode(paymentModal);

        paymentModal.dataset.slotId = slot.id;
        paymentModal.dataset.amount = cost;
        paymentModal.classList.add('active');
        paymentModal.style.display = 'flex';

        // Set confirm payment handler
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        confirmBtn.onclick = () => {
            this.processPayment(slot.id, cost, slot.vehicle, entryTime, now);
        };
    }

    generateQRCode(modal) {
        const qrisCode = document.getElementById('qrisCode');
        const amount = modal.dataset.amount || 0;
        
        // Generate QRIS data (simplified format for demo)
        const qrData = `QRIS|PARKIR|${Date.now()}|${amount}|IDR`;
        
        // Check if QRCode library is available
        if (typeof QRCode === 'undefined') {
            qrisCode.innerHTML = `
                <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">${qrData}</div>
                <div style="font-size: 4rem;">📱</div>
                <div style="font-size: 0.7rem; color: #999; margin-top: 0.5rem;">Scan dengan aplikasi e-wallet</div>
            `;
            return;
        }
        
        // Clear previous content
        qrisCode.innerHTML = '<canvas id="qrisCanvas"></canvas>';
        
        const canvas = document.getElementById('qrisCanvas');
        
        // Generate QR code using qrcode.js library
        QRCode.toCanvas(canvas, qrData, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, function (error) {
            if (error) {
                console.error('Error generating QR code:', error);
                qrisCode.innerHTML = `
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">${qrData}</div>
                    <div style="font-size: 4rem;">📱</div>
                    <div style="font-size: 0.7rem; color: #999; margin-top: 0.5rem;">Scan dengan aplikasi e-wallet</div>
                `;
            } else {
                // Add instruction text below QR code
                const instruction = document.createElement('p');
                instruction.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem; text-align: center;';
                instruction.textContent = 'Scan dengan aplikasi e-wallet';
                qrisCode.appendChild(instruction);
            }
        });
    }

    processPayment(slotId, amount, vehicle, entryTime, exitTime) {
        // Create transaction record
        const transaction = {
            slotId: slotId,
            licensePlate: vehicle.licensePlate,
            vehicleType: vehicle.type,
            entryTime: entryTime.toISOString(),
            exitTime: exitTime.toISOString(),
            duration: this.calculateDuration(entryTime),
            amount: amount,
            status: 'paid',
            paymentMethod: 'QRIS',
            qrCode: vehicle.qrCode
        };

        // Save transaction
        storage.addTransaction(transaction);

        // Free up the slot
        storage.removeVehicle(slotId);

        // Update UI
        parkingManager.refresh();
        app.updateDashboard();
        app.updateCharts();

        // Close payment modal
        document.getElementById('paymentModal').classList.remove('active');
        document.getElementById('paymentModal').style.display = 'none';

        // Show success notification
        app.showNotification('success', `Pembayaran berhasil! Total: ${this.formatCurrency(amount)}`);

        // Show receipt
        setTimeout(() => {
            app.showReceipt(transaction);
        }, 500);

        // Refresh history if modal is open
        if (document.getElementById('historyModal').classList.contains('active')) {
            app.renderHistory();
        }
    }

    calculateDuration(entryTime) {
        if (!entryTime) return '0 jam';
        
        const entry = new Date(entryTime);
        const now = new Date();
        const diffMs = now - entry;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours > 0) {
            return `${diffHours} jam ${diffMinutes} menit`;
        }
        return `${diffMinutes} menit`;
    }

    exportToCSV() {
        const transactions = storage.getTransactions();
        if (transactions.length === 0) {
            app.showNotification('warning', 'Tidak ada data transaksi untuk diekspor');
            return;
        }

        const headers = ['No', 'Waktu Masuk', 'Waktu Keluar', 'Nomor Polisi', 'Tipe', 'Slot', 'Durasi', 'Biaya', 'Status'];
        const rows = transactions.map((t, index) => {
            return [
                index + 1,
                new Date(t.entryTime).toLocaleString('id-ID'),
                new Date(t.exitTime).toLocaleString('id-ID'),
                t.licensePlate,
                t.vehicleType === 'motor' ? 'Motor' : 'Mobil',
                t.slotId,
                t.duration,
                this.formatCurrency(t.amount),
                t.status === 'paid' ? 'Lunas' : 'Pending'
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `riwayat_parkir_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        app.showNotification('success', 'Data berhasil diekspor ke CSV');
    }

    exportToPDF() {
        const transactions = storage.getTransactions();
        if (transactions.length === 0) {
            app.showNotification('warning', 'Tidak ada data transaksi untuk diekspor');
            return;
        }

        // Simple PDF generation using window.print
        const printWindow = window.open('', '_blank');
        const table = document.getElementById('historyTable').cloneNode(true);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Riwayat Transaksi Parkir</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #4CAF50; color: white; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    h1 { text-align: center; }
                </style>
            </head>
            <body>
                <h1>Riwayat Transaksi Parkir</h1>
                <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
                ${table.outerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();

        app.showNotification('success', 'PDF siap untuk dicetak');
    }

    exportRevenueSummary() {
        const transactions = storage.getTransactions();
        if (transactions.length === 0) {
            app.showNotification('warning', 'Tidak ada data transaksi untuk direkap');
            return;
        }

        // Kelompokkan berdasarkan tanggal (YYYY-MM-DD)
        const summaryMap = {};
        transactions.forEach(t => {
            const dateKey = new Date(t.createdAt).toISOString().split('T')[0];
            if (!summaryMap[dateKey]) {
                summaryMap[dateKey] = {
                    totalTransactions: 0,
                    totalRevenue: 0
                };
            }
            summaryMap[dateKey].totalTransactions += 1;
            if (t.status === 'paid') {
                summaryMap[dateKey].totalRevenue += (t.amount || 0);
            }
        });

        const headers = ['Tanggal', 'Total Transaksi', 'Total Pendapatan (Rp)', 'Rata-rata / Transaksi (Rp)'];
        const rows = Object.keys(summaryMap).sort().map(dateKey => {
            const item = summaryMap[dateKey];
            const avg = item.totalTransactions > 0 ? Math.round(item.totalRevenue / item.totalTransactions) : 0;
            return [
                dateKey,
                item.totalTransactions,
                item.totalRevenue,
                avg
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `rekap_pendapatan_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        app.showNotification('success', 'Rekap pendapatan berhasil diekspor');
    }
}

// Export singleton instance
const transactionManager = new TransactionManager();
