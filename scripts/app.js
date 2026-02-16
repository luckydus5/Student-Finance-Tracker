// Main app - initializes and coordinates modules

import * as state from './state.js';
import * as ui from './ui.js';
import * as validators from './validators.js';
import * as storage from './storage.js';
import { compileRegex } from './search.js';

// -- Application Initialization


/**
 * Initialize the application
 */
function init() {
    // Check localStorage availability
    if (!storage.isStorageAvailable()) {
        alert('LocalStorage is not available. Your data will not be saved.');
    }

    // Cache DOM elements
    ui.cacheElements();

    // Initialize state from storage
    state.initState();

    // Set up event listeners
    setupEventListeners();

    // Initial render
    renderAll();

    // Set up keyboard shortcuts
    setupKeyboardShortcuts();

    console.log('Student Finance Tracker initialized');
}

/**
 * Render all UI components
 */
function renderAll() {
    ui.renderDashboard();
    ui.renderTransactions();
    ui.renderCategories();
    ui.renderSettings();
}

// -- Event Listeners Setup


/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Navigation
    setupNavigation();

    // Transaction form
    setupTransactionForm();

    // Search and filters
    setupSearchAndFilters();

    // Settings
    setupSettings();

    // Dialog
    setupDialog();

    // Transaction actions (delegated)
    setupTransactionActions();
}

/**
 * Set up navigation event listeners
 */
function setupNavigation() {
    const menuToggle = ui.getElement('menuToggle');
    const navLinks = ui.getElement('navLinks');

    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        ui.toggleMobileMenu();
    });

    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            state.setCurrentSection(section);
            ui.showSection(section);
            
            // Special handling for add-transaction section
            if (section === 'add-transaction' && !state.getEditingId()) {
                ui.setupAddForm();
            }
        });
    });

    // Handle hash navigation
    window.addEventListener('hashchange', handleHashChange);
    
    // Initial hash handling
    if (window.location.hash) {
        handleHashChange();
    }
}

/**
 * Handle URL hash changes
 */
function handleHashChange() {
    const hash = window.location.hash.slice(1);
    const validSections = ['dashboard', 'transactions', 'add-transaction', 'settings', 'about'];
    
    if (validSections.includes(hash)) {
        state.setCurrentSection(hash);
        ui.showSection(hash);
    }
}

/**
 * Set up transaction form listeners
 */
function setupTransactionForm() {
    const form = ui.getElement('transactionForm');
    const cancelBtn = ui.getElement('cancelBtn');
    const descInput = ui.getElement('descriptionInput');
    const amountInput = ui.getElement('amountInput');
    const dateInput = ui.getElement('dateInput');
    const customCategory = ui.getElement('customCategory');

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Cancel edit
    cancelBtn.addEventListener('click', () => {
        state.setEditingId(null);
        ui.setupAddForm();
        ui.announce('Edit cancelled');
    });

    // Real-time validation
    descInput.addEventListener('blur', () => validateField('description', descInput.value));
    amountInput.addEventListener('blur', () => validateField('amount', amountInput.value));
    dateInput.addEventListener('blur', () => validateField('date', dateInput.value));
    customCategory.addEventListener('blur', () => {
        if (customCategory.value.trim()) {
            validateField('custom-category', customCategory.value);
        }
    });

    // Form reset
    form.addEventListener('reset', () => {
        setTimeout(() => {
            ui.clearFormErrors();
            ui.announce('Form cleared');
        }, 0);
    });
}

/**
 * Handle form submission
 * @param {Event} e 
 */
function handleFormSubmit(e) {
    e.preventDefault();

    ui.clearFormErrors();

    // Get form values
    const editId = ui.getElement('editId').value;
    const description = ui.getElement('descriptionInput').value;
    const amount = ui.getElement('amountInput').value;
    const date = ui.getElement('dateInput').value;
    let category = ui.getElement('categorySelect').value;
    const customCategory = ui.getElement('customCategory').value.trim();

    // Use custom category if provided
    if (customCategory) {
        const catValidation = validators.validateCategory(customCategory);
        if (!catValidation.valid) {
            ui.showFieldError('custom-category', catValidation.error);
            return;
        }
        category = customCategory;
        // Add to categories if new
        state.addCategory(customCategory);
        ui.renderCategories();
    }

    // Validate all fields
    const validation = validators.validateTransaction({
        description,
        amount,
        date,
        category
    });

    if (!validation.valid) {
        Object.entries(validation.errors).forEach(([field, error]) => {
            ui.showFieldError(field, error);
        });
        ui.announceAlert('Please correct the form errors');
        return;
    }

    // Create transaction data
    const transactionData = {
        description: description.trim(),
        amount: parseFloat(amount),
        date,
        category
    };

    // Add or update
    if (editId) {
        const updated = state.updateTransaction(editId, transactionData);
        if (updated) {
            ui.announce(`Transaction "${description}" updated successfully`);
            state.setEditingId(null);
            ui.setupAddForm();
        } else {
            ui.announceAlert('Failed to update transaction');
        }
    } else {
        const created = state.addTransaction(transactionData);
        if (created) {
            ui.announce(`Transaction "${description}" added successfully`);
            ui.clearForm();
            ui.getElement('dateInput').value = new Date().toISOString().split('T')[0];
        } else {
            ui.announceAlert('Failed to add transaction');
        }
    }

    // Re-render
    ui.renderDashboard();
    ui.renderTransactions();
}

/**
 * Validate a single field and show error
 * @param {string} fieldId 
 * @param {string} value 
 */
function validateField(fieldId, value) {
    let validation;

    switch (fieldId) {
        case 'description':
            validation = validators.validateDescription(value);
            break;
        case 'amount':
            validation = validators.validateAmount(value);
            break;
        case 'date':
            validation = validators.validateDate(value);
            break;
        case 'custom-category':
            validation = validators.validateCategory(value);
            break;
        default:
            return;
    }

    if (!validation.valid) {
        ui.showFieldError(fieldId, validation.error);
    } else {
        // Clear error for this field
        const input = document.getElementById(fieldId);
        const errorEl = document.getElementById(`${fieldId}-error`);
        if (input) input.classList.remove('is-invalid');
        if (errorEl) errorEl.hidden = true;
    }
}

/**
 * Set up search and filter listeners
 */
function setupSearchAndFilters() {
    const searchInput = ui.getElement('searchInput');
    const caseInsensitive = ui.getElement('caseInsensitive');
    const sortSelect = ui.getElement('sortSelect');
    const categoryFilter = ui.getElement('categoryFilter');

    // Debounced search
    const debouncedSearch = ui.debounce(() => {
        const query = searchInput.value;
        const caseIns = caseInsensitive.checked;
        
        const result = state.setSearchQuery(query, caseIns);
        
        if (result.valid) {
            ui.clearSearchError();
        } else {
            ui.showSearchError(result.error);
        }
        
        ui.renderTransactions();
    }, 300);

    searchInput.addEventListener('input', debouncedSearch);
    caseInsensitive.addEventListener('change', debouncedSearch);

    // Sort
    sortSelect.addEventListener('change', () => {
        state.setSortBy(sortSelect.value);
        ui.updateSortUI(sortSelect.value);
        ui.renderTransactions();
    });

    // Category filter
    categoryFilter.addEventListener('change', () => {
        state.setCategoryFilter(categoryFilter.value);
        ui.renderTransactions();
    });

    // Table header sorting
    const tableHeaders = document.querySelectorAll('th.sortable');
    tableHeaders.forEach(header => {
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        
        header.addEventListener('click', () => handleHeaderSort(header));
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleHeaderSort(header);
            }
        });
    });
}

/**
 * Handle table header click for sorting
 * @param {HTMLElement} header 
 */
function handleHeaderSort(header) {
    const field = header.dataset.sort;
    const currentSort = state.getUIState().sortBy;
    const [currentField, currentDir] = currentSort.split('-');

    let newDir = 'desc';
    if (currentField === field) {
        newDir = currentDir === 'desc' ? 'asc' : 'desc';
    }

    const newSort = `${field}-${newDir}`;
    state.setSortBy(newSort);
    ui.updateSortUI(newSort);
    ui.renderTransactions();
    ui.announce(`Sorted by ${field} ${newDir === 'asc' ? 'ascending' : 'descending'}`);
}

/**
 * Set up settings listeners
 */
function setupSettings() {
    const saveBudget = ui.getElement('saveBudget');
    const saveCurrency = ui.getElement('saveCurrency');
    const addCategoryBtn = ui.getElement('addCategoryBtn');
    const newCategory = ui.getElement('newCategory');
    const exportBtn = ui.getElement('exportBtn');
    const importFile = ui.getElement('importFile');
    const clearDataBtn = ui.getElement('clearDataBtn');
    const categoriesList = ui.getElement('categoriesList');

    // Save budget
    saveBudget.addEventListener('click', () => {
        const budgetInput = ui.getElement('budgetCap');
        const value = budgetInput.value.trim();

        if (value && !validators.validateBudgetCap(value).valid) {
            ui.announceAlert('Invalid budget format');
            return;
        }

        const budgetCap = value ? parseFloat(value) : 0;
        state.updateSettings({ budgetCap });
        ui.renderDashboard();
        ui.announce('Budget saved successfully');
    });

    // Save currency settings
    saveCurrency.addEventListener('click', () => {
        const baseCurrency = ui.getElement('baseCurrency').value;
        const displayCurrency = ui.getElement('displayCurrency').value;
        const rateEur = ui.getElement('rateEur').value;
        const rateRwf = ui.getElement('rateRwf').value;

        // Validate rates
        if (!validators.validateExchangeRate(rateEur).valid || 
            !validators.validateExchangeRate(rateRwf).valid) {
            ui.announceAlert('Invalid exchange rate format');
            return;
        }

        state.updateSettings({
            baseCurrency,
            displayCurrency,
            exchangeRates: {
                EUR: parseFloat(rateEur),
                RWF: parseFloat(rateRwf)
            }
        });

        ui.updateCurrencyPrefix(baseCurrency);
        ui.renderDashboard();
        ui.renderTransactions();
        ui.announce('Currency settings saved');
    });

    // Add category
    addCategoryBtn.addEventListener('click', () => {
        addNewCategory();
    });

    newCategory.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewCategory();
        }
    });

    // Remove category (delegated)
    categoriesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-category')) {
            const category = e.target.dataset.category;
            if (state.removeCategory(category)) {
                ui.renderCategories();
                ui.announce(`Category "${category}" removed`);
            }
        }
    });

    // Export
    exportBtn.addEventListener('click', () => {
        const data = storage.exportTransactions();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        ui.announce('Data exported successfully');
    });

    // Import
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const validation = validators.validateImportData(data);

                if (!validation.valid) {
                    ui.announceAlert(validation.error);
                    alert('Import failed:\n' + validation.error);
                    return;
                }

                if (confirm(`Import ${validation.data.length} transactions? This will replace all existing data.`)) {
                    state.importTransactions(validation.data);
                    renderAll();
                    ui.announce(`Successfully imported ${validation.data.length} transactions`);
                }
            } catch (error) {
                ui.announceAlert('Failed to parse JSON file');
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    });

    // Clear data
    clearDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) {
            state.clearAllTransactions();
            renderAll();
            ui.announceAlert('All data has been cleared');
        }
    });
}

/**
 * Add new category from input
 */
function addNewCategory() {
    const newCategory = ui.getElement('newCategory');
    const value = newCategory.value.trim();
    const errorEl = document.getElementById('new-category-error');

    if (!value) {
        errorEl.textContent = 'Please enter a category name';
        errorEl.hidden = false;
        return;
    }

    const validation = validators.validateCategory(value);
    if (!validation.valid) {
        errorEl.textContent = validation.error;
        errorEl.hidden = false;
        return;
    }

    if (state.addCategory(value)) {
        ui.renderCategories();
        newCategory.value = '';
        errorEl.hidden = true;
        ui.announce(`Category "${value}" added`);
    } else {
        errorEl.textContent = 'Category already exists';
        errorEl.hidden = false;
    }
}

/**
 * Set up delete dialog listeners
 */
function setupDialog() {
    const confirmDelete = ui.getElement('confirmDelete');
    const cancelDelete = ui.getElement('cancelDelete');
    const deleteDialog = ui.getElement('deleteDialog');

    confirmDelete.addEventListener('click', () => {
        const id = ui.getPendingDeleteId();
        if (id) {
            const transaction = state.getTransaction(id);
            if (state.deleteTransaction(id)) {
                ui.announce(`Transaction "${transaction?.description}" deleted`);
                ui.renderDashboard();
                ui.renderTransactions();
            } else {
                ui.announceAlert('Failed to delete transaction');
            }
        }
        ui.hideDeleteDialog();
    });

    cancelDelete.addEventListener('click', () => {
        ui.hideDeleteDialog();
    });

    // Close on escape
    deleteDialog.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ui.hideDeleteDialog();
        }
    });

    // Close on backdrop click
    deleteDialog.addEventListener('click', (e) => {
        if (e.target === deleteDialog) {
            ui.hideDeleteDialog();
        }
    });
}

/**
 * Set up transaction action buttons (edit/delete)
 */
function setupTransactionActions() {
    const transactionsBody = ui.getElement('transactionsBody');
    const transactionsCards = ui.getElement('transactionsCards');

    // Table actions
    transactionsBody.addEventListener('click', handleTransactionAction);
    
    // Card actions
    transactionsCards.addEventListener('click', handleTransactionAction);
}

/**
 * Handle edit/delete button clicks
 * @param {Event} e 
 */
function handleTransactionAction(e) {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (editBtn) {
        const id = editBtn.dataset.id;
        state.setEditingId(id);
        ui.setupEditForm(id);
        state.setCurrentSection('add-transaction');
        ui.showSection('add-transaction');
        ui.getElement('descriptionInput').focus();
        ui.announce('Editing transaction');
    }

    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        ui.showDeleteDialog(id);
    }
}

// -- Keyboard Shortcuts


/**
 * Set up keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        // Number keys for navigation
        const sectionMap = {
            '1': 'dashboard',
            '2': 'transactions',
            '3': 'add-transaction',
            '4': 'settings',
            '5': 'about'
        };

        if (sectionMap[e.key]) {
            e.preventDefault();
            const section = sectionMap[e.key];
            state.setCurrentSection(section);
            ui.showSection(section);
            if (section === 'add-transaction' && !state.getEditingId()) {
                ui.setupAddForm();
            }
        }

        // Escape to cancel edit
        if (e.key === 'Escape' && state.getEditingId()) {
            state.setEditingId(null);
            ui.setupAddForm();
            ui.announce('Edit cancelled');
        }

        // Forward slash to focus search
        if (e.key === '/' && state.getCurrentSection() === 'transactions') {
            e.preventDefault();
            ui.getElement('searchInput').focus();
        }
    });
}

// -- Initialization


// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Subscribe to state changes for auto-save feedback
state.subscribe((newState) => {
    // Could add additional UI updates here if needed
});
