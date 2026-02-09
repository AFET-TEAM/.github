// Archive Report Management System

class ArchiveManager {
    constructor() {
        this.reports = [];
        this.init();
    }

    init() {
        this.loadReports();
        this.renderReports();
    }

    // Calculate week number and year for a given date
    getWeekInfo(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return {
            year: d.getFullYear(),
            week: weekNo,
            date: d
        };
    }

    // Check if a report date is within the editable range (current week + 1 week back)
    isEditable(reportDate) {
        const now = new Date();
        const report = new Date(reportDate);
        
        // Get current week info
        const currentWeek = this.getWeekInfo(now);
        const reportWeek = this.getWeekInfo(report);
        
        // Calculate week difference
        const weeksDiff = (currentWeek.year - reportWeek.year) * 52 + (currentWeek.week - reportWeek.week);
        
        // Editable if within current week or 1 week back (0 or 1 weeks difference)
        return weeksDiff >= 0 && weeksDiff <= 1;
    }

    // Get week label for display
    getWeekLabel(reportDate) {
        const now = new Date();
        const report = new Date(reportDate);
        
        const currentWeek = this.getWeekInfo(now);
        const reportWeek = this.getWeekInfo(report);
        
        const weeksDiff = (currentWeek.year - reportWeek.year) * 52 + (currentWeek.week - reportWeek.week);
        
        if (weeksDiff === 0) {
            return { text: 'Bu Hafta', class: 'current' };
        } else if (weeksDiff === 1) {
            return { text: 'Geçen Hafta', class: 'last-week' };
        } else if (weeksDiff > 1) {
            return { text: `${weeksDiff} hafta önce`, class: 'old' };
        } else {
            return { text: 'Gelecek', class: 'future' };
        }
    }

    // Load reports from localStorage (in a real app, this would be from a backend)
    loadReports() {
        const stored = localStorage.getItem('afet_reports');
        if (stored) {
            this.reports = JSON.parse(stored);
        } else {
            // Generate sample reports for demonstration
            this.reports = this.generateSampleReports();
            this.saveReports();
        }
    }

    // Save reports to localStorage
    saveReports() {
        localStorage.setItem('afet_reports', JSON.stringify(this.reports));
    }

    // Generate sample reports for demonstration
    generateSampleReports() {
        const now = new Date();
        const reports = [];

        // Current week report
        reports.push({
            id: 1,
            date: now.toISOString().split('T')[0],
            title: 'Haftalık Proje Raporu',
            author: 'Kullanıcı A',
            content: 'Bu hafta React component geliştirmeleri ve API entegrasyonları üzerinde çalışıldı.',
            tasks: 'Component tasarımı, API entegrasyonu, Unit testler'
        });

        // Last week report
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        reports.push({
            id: 2,
            date: lastWeek.toISOString().split('T')[0],
            title: 'Önceki Hafta Raporu',
            author: 'Kullanıcı B',
            content: 'Geçen hafta veritabanı optimizasyonları ve performans iyileştirmeleri yapıldı.',
            tasks: 'Veritabanı optimizasyonu, Query iyileştirmeleri'
        });

        // 2 weeks ago report (not editable)
        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        reports.push({
            id: 3,
            date: twoWeeksAgo.toISOString().split('T')[0],
            title: '2 Hafta Önceki Rapor',
            author: 'Kullanıcı C',
            content: 'Authentication sistemi geliştirildi ve test edildi.',
            tasks: 'JWT implementasyonu, Güvenlik testleri'
        });

        // 3 weeks ago report (not editable)
        const threeWeeksAgo = new Date(now);
        threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
        reports.push({
            id: 4,
            date: threeWeeksAgo.toISOString().split('T')[0],
            title: '3 Hafta Önceki Rapor',
            author: 'Kullanıcı D',
            content: 'Frontend tasarım sistemi oluşturuldu.',
            tasks: 'Design system, Component library'
        });

        // 1 month ago report (not editable)
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        reports.push({
            id: 5,
            date: oneMonthAgo.toISOString().split('T')[0],
            title: '1 Ay Önceki Rapor',
            author: 'Kullanıcı E',
            content: 'Proje başlangıç aşaması tamamlandı.',
            tasks: 'Proje kurulumu, İlk sprint planlaması'
        });

        return reports;
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('tr-TR', options);
    }

    // Render all reports
    renderReports() {
        const container = document.getElementById('reports-container');
        container.innerHTML = '';

        // Sort reports by date (newest first)
        const sortedReports = [...this.reports].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        sortedReports.forEach(report => {
            const reportCard = this.createReportCard(report);
            container.appendChild(reportCard);
        });
    }

    // Create a report card element
    createReportCard(report) {
        const card = document.createElement('div');
        const editable = this.isEditable(report.date);
        const weekLabel = this.getWeekLabel(report.date);
        
        card.className = `report-card ${editable ? 'editable' : 'non-editable'}`;
        card.dataset.reportId = report.id;

        const weekInfo = this.getWeekInfo(new Date(report.date));
        
        card.innerHTML = `
            <div class="report-header">
                <div>
                    <div class="report-week">
                        Hafta ${weekInfo.week}, ${weekInfo.year}
                        <span class="week-indicator ${weekLabel.class}">${weekLabel.text}</span>
                    </div>
                    <div class="report-date">${this.formatDate(report.date)}</div>
                </div>
                <span class="status-badge ${editable ? 'editable' : 'locked'}">
                    ${editable ? '✏️ Düzenlenebilir' : '🔒 Kilitli'}
                </span>
            </div>

            <div class="report-content" id="content-${report.id}">
                <p><strong>Başlık:</strong> ${report.title}</p>
                <p><strong>Yazar:</strong> ${report.author}</p>
                <p><strong>İçerik:</strong> ${report.content}</p>
                <p><strong>Yapılan İşler:</strong> ${report.tasks}</p>
            </div>

            <div class="edit-form" id="form-${report.id}">
                <div class="form-group">
                    <label>Başlık:</label>
                    <input type="text" id="title-${report.id}" value="${report.title}">
                </div>
                <div class="form-group">
                    <label>İçerik:</label>
                    <textarea id="content-input-${report.id}">${report.content}</textarea>
                </div>
                <div class="form-group">
                    <label>Yapılan İşler:</label>
                    <textarea id="tasks-${report.id}">${report.tasks}</textarea>
                </div>
            </div>

            <div class="report-actions">
                ${editable ? `
                    <button class="btn-edit" onclick="archiveManager.toggleEdit(${report.id})">
                        <span id="edit-btn-text-${report.id}">Düzenle</span>
                    </button>
                ` : `
                    <button class="btn-edit" disabled title="Bu rapor artık düzenlenemez">
                        Düzenlenemez
                    </button>
                `}
            </div>
        `;

        return card;
    }

    // Toggle edit mode for a report
    toggleEdit(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        
        if (!this.isEditable(report.date)) {
            this.showAlert('Bu rapor artık düzenlenemez. Sadece bu hafta ve geçen haftanın raporları düzenlenebilir.', 'error');
            return;
        }

        const contentDiv = document.getElementById(`content-${reportId}`);
        const formDiv = document.getElementById(`form-${reportId}`);
        const editBtnText = document.getElementById(`edit-btn-text-${reportId}`);
        const actionsDiv = contentDiv.nextElementSibling.nextElementSibling;

        if (formDiv.classList.contains('active')) {
            // Cancel editing
            formDiv.classList.remove('active');
            contentDiv.style.display = 'block';
            editBtnText.textContent = 'Düzenle';
            actionsDiv.innerHTML = `
                <button class="btn-edit" onclick="archiveManager.toggleEdit(${reportId})">
                    <span id="edit-btn-text-${reportId}">Düzenle</span>
                </button>
            `;
        } else {
            // Start editing
            formDiv.classList.add('active');
            contentDiv.style.display = 'none';
            editBtnText.textContent = 'İptal';
            actionsDiv.innerHTML = `
                <button class="btn-save" onclick="archiveManager.saveReport(${reportId})">
                    Kaydet
                </button>
                <button class="btn-cancel" onclick="archiveManager.toggleEdit(${reportId})">
                    İptal
                </button>
            `;
        }
    }

    // Save edited report
    saveReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        
        // Double-check editability
        if (!this.isEditable(report.date)) {
            this.showAlert('Bu rapor artık düzenlenemez!', 'error');
            return;
        }

        const title = document.getElementById(`title-${reportId}`).value.trim();
        const content = document.getElementById(`content-input-${reportId}`).value.trim();
        const tasks = document.getElementById(`tasks-${reportId}`).value.trim();

        if (!title || !content || !tasks) {
            this.showAlert('Lütfen tüm alanları doldurun!', 'error');
            return;
        }

        // Update report
        report.title = title;
        report.content = content;
        report.tasks = tasks;

        this.saveReports();
        this.renderReports();
        this.showAlert('Rapor başarıyla güncellendi!', 'success');
    }

    // Show alert message
    showAlert(message, type) {
        const container = document.getElementById('alert-container');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        container.innerHTML = '';
        container.appendChild(alert);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// Initialize the archive manager when the page loads
let archiveManager;
document.addEventListener('DOMContentLoaded', () => {
    archiveManager = new ArchiveManager();
});
