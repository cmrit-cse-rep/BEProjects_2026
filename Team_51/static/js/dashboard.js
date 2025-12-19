// Dashboard functionality
class Dashboard {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.fileInput = document.getElementById('file');
        this.uploadForm = document.getElementById('uploadForm');
        this.uploadArea = document.querySelector('.upload-area');
        this.loading = document.getElementById('loading');
        this.customFileUpload = document.querySelector('.custom-file-upload');
    }

    attachEventListeners() {
        // File upload handling
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e);
        });

        // Form submission with loading
        this.uploadForm.addEventListener('submit', () => {
            this.handleFormSubmission();
        });

        // Drag and drop functionality
        this.setupDragAndDrop();
    }

    handleFileSelection(e) {
        const fileName = e.target.files[0]?.name;
        if (fileName) {
            this.customFileUpload.innerHTML = 
                `<i class="fas fa-file-medical me-2"></i>${fileName}`;
        }
    }

    handleFormSubmission() {
        this.loading.style.display = 'block';
        this.uploadArea.style.opacity = '0.7';
    }

    setupDragAndDrop() {
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.fileInput.files = files;
                const fileName = files[0].name;
                this.customFileUpload.innerHTML = 
                    `<i class="fas fa-file-medical me-2"></i>${fileName}`;
            }
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new Dashboard();
});

