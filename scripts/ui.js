// UI module - handles DOM updates and rendering

import * as state from './state.js';
import { highlight, escapeHTML } from './search.js';

// -- DOM Element Cache


const elements = {};

/**
 * Cache DOM elements for performance
 */
export function cacheElements() {
    // Navigation
    elements.mainNav = document.getElementById('main-nav');
    elements.menuToggle = document.querySelector('.menu-toggle');
    elements.navLinks = document.querySelectorAll('.nav-link');
    
    // Sections
    elements.sections = document.querySelectorAll('.section');
    
    // Live regions
    elements.liveRegion = document.getElementById('live-region');
    elements.alertRegion = document.getElementById('alert-region');
    
    // Dashboard
    elements.statTotalCount = document.getElementById('stat-total-count');
    elements.statTotalAmount = document.getElementById('stat-total-amount');
    elements.statTopCategory = document.getElementById('stat-top-category');
    elements.statBudgetStatus = document.getElementById('stat-budget-status');
    elements.budgetBarFill = document.getElementById('budget-bar-fill');
    elements.spendingChart = document.getElementById('spending-chart');
    elements.recentList = document.getElementById('recent-list');
    
    // Transactions
    elements.searchInput = document.getElementById('search-input');
    elements.caseInsensitive = document.getElementById('case-insensitive');
    elements.searchError = document.getElementById('search-error');
    elements.sortSelect = document.getElementById('sort-select');
    elements.categoryFilter = document.getElementById('category-filter');
    elements.transactionsTable = document.getElementById('transactions-table');
    elements.transactionsBody = document.getElementById('transactions-body');
    elements.transactionsCards = document.getElementById('transactions-cards');
    elements.noResults = document.getElementById('no-results');
    
    // Form
    elements.transactionForm = document.getElementById('transaction-form');
    elements.formTitle = document.getElementById('form-title');
    elements.editId = document.getElementById('edit-id');
    elements.descriptionInput = document.getElementById('description');
    elements.amountInput = document.getElementById('amount');
    elements.dateInput = document.getElementById('date');
    elements.categorySelect = document.getElementById('category');
    elements.customCategory = document.getElementById('custom-category');
    elements.submitBtn = document.getElementById('submit-btn');
    elements.submitText = document.getElementById('submit-text');
    elements.cancelBtn = document.getElementById('cancel-btn');
    elements.currencyPrefix = document.getElementById('currency-prefix');
    
    // Settings
    elements.budgetCap = document.getElementById('budget-cap');
    elements.saveBudget = document.getElementById('save-budget');
    elements.baseCurrency = document.getElementById('base-currency');
    elements.displayCurrency = document.getElementById('display-currency');
    elements.rateEur = document.getElementById('rate-eur');
    elements.rateRwf = document.getElementById('rate-rwf');
    elements.saveCurrency = document.getElementById('save-currency');
    elements.categoriesList = document.getElementById('categories-list');
    elements.newCategory = document.getElementById('new-category');
    elements.addCategoryBtn = document.getElementById('add-category-btn');
    elements.exportBtn = document.getElementById('export-btn');
    elements.importFile = document.getElementById('import-file');
    elements.clearDataBtn = document.getElementById('clear-data-btn');
    
    // Dialog
    elements.deleteDialog = document.getElementById('delete-dialog');
    elements.confirmDelete = document.getElementById('confirm-delete');
    elements.cancelDelete = document.getElementById('cancel-delete');
}

/**
 * Get cached element
 * @param {string} name 
 * @returns {HTMLElement}
 */
export function getElement(name) {
    return elements[name];
}

// -- Navigation


/**
 * Show a specific section and update navigation
 * @param {string} sectionId - ID of the section to show
 */
export function showSection(sectionId) {
    // Update nav links
    elements.navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === sectionId);
    });

    // Show/hide sections
    elements.sections.forEach(section => {
        const isActive = section.id === sectionId;
        section.hidden = !isActive;
        section.classList.toggle('section--active', isActive);
    });

    // Close mobile menu
    if (elements.mainNav.classList.contains('is-open')) {
        toggleMobileMenu(false);
    }

    // Focus management for accessibility
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        const heading = activeSection.querySelector('h2');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus();
        }
    }
}

/**
 * Toggle mobile navigation menu
 * @param {boolean} open - Force open/close
 */
export function toggleMobileMenu(open) {
    const isOpen = open ?? !elements.mainNav.classList.contains('is-open');
    elements.mainNav.classList.toggle('is-open', isOpen);
    elements.menuToggle.setAttribute('aria-expanded', isOpen);
}

// -- Dashboard Rendering


/**
 * Render all dashboard components
 */
export function renderDashboard() {
    renderStats();
    renderChart();
    renderRecentTransactions();
}

/**
 * Render statistics cards
 */
export function renderStats() {
    const settings = state.getSettings();
    const count = state.getTransactionCount();
    const total = state.getTotalAmount();
    const topCategory = state.getTopCategory();
    const budgetStatus = state.getBudgetStatus();

    // Total count
    elements.statTotalCount.textContent = count;

    // Total amount
    const displayTotal = state.getDisplayAmount(total);
    elements.statTotalAmount.textContent = state.formatCurrency(displayTotal);

    // Top category
    if (topCategory) {
        elements.statTopCategory.textContent = topCategory.category;
    } else {
        elements.statTopCategory.textContent = '-';
    }

    // Budget status
    renderBudgetStatus(budgetStatus);
}

/**
 * Render budget status card
 * @param {Object} status - Budget status object
 */
function renderBudgetStatus(status) {
    const settings = state.getSettings();
    
    if (status.status === 'no-cap') {
        elements.statBudgetStatus.textContent = 'No budget set';
        elements.budgetBarFill.style.width = '0%';
        elements.budgetBarFill.className = 'budget-bar-fill';
        return;
    }

    const displayRemaining = state.getDisplayAmount(Math.abs(status.remaining));
    
    if (status.remaining >= 0) {
        elements.statBudgetStatus.textContent = `${state.formatCurrency(displayRemaining)} remaining`;
    } else {
        elements.statBudgetStatus.textContent = `${state.formatCurrency(displayRemaining)} over budget!`;
    }

    // Update progress bar
    elements.budgetBarFill.style.width = `${Math.min(status.percentage, 100)}%`;
    elements.budgetBarFill.className = 'budget-bar-fill';
    
    if (status.status === 'over') {
        elements.budgetBarFill.classList.add('danger');
        // Announce budget exceeded (assertive)
        announceAlert(`Warning: You have exceeded your budget by ${state.formatCurrency(displayRemaining)}`);
    } else if (status.status === 'warning') {
        elements.budgetBarFill.classList.add('warning');
        // Announce budget warning (polite)
        announce(`Budget notice: You have used ${status.percentage.toFixed(0)}% of your budget`);
    }
}

/**
 * Render spending chart
 */
export function renderChart() {
    const days = state.getLast7DaysSpending();
    const maxAmount = Math.max(...days.map(d => d.amount), 1);

    let chartHTML = '';

    days.forEach(day => {
        const height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
        const displayAmount = state.getDisplayAmount(day.amount);
        
        chartHTML += `
            <div class="chart-bar">
                <span class="chart-bar-value">${state.formatCurrency(displayAmount)}</span>
                <div class="chart-bar-fill" style="height: ${height}%" aria-hidden="true"></div>
                <span class="chart-bar-label">${day.label}</span>
            </div>
        `;
    });

    elements.spendingChart.innerHTML = chartHTML;

    // Update aria-label for accessibility
    const totalWeek = days.reduce((sum, d) => sum + d.amount, 0);
    const displayTotal = state.getDisplayAmount(totalWeek);
    elements.spendingChart.setAttribute(
        'aria-label', 
        `Bar chart showing spending over the last 7 days. Total: ${state.formatCurrency(displayTotal)}`
    );
}

/**
 * Render recent transactions (last 5)
 */
export function renderRecentTransactions() {
    const transactions = state.getTransactions();
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sorted.slice(0, 5);

    if (recent.length === 0) {
        elements.recentList.innerHTML = '<p class="no-data">No transactions yet. Add your first transaction!</p>';
        return;
    }

    let html = '';
    recent.forEach(t => {
        const displayAmount = state.getDisplayAmount(t.amount);
        html += `
            <div class="transaction-item">
                <div class="transaction-info">
                    <span class="transaction-desc">${escapeHTML(t.description)}</span>
                    <span class="transaction-date">${formatDate(t.date)} • ${escapeHTML(t.category)}</span>
                </div>
                <span class="transaction-amount">${state.formatCurrency(displayAmount)}</span>
            </div>
        `;
    });

    elements.recentList.innerHTML = html;
}

// -- Transactions Table/Cards Rendering


/**
 * Render transactions table and cards
 */
export function renderTransactions() {
    const transactions = state.getFilteredTransactions();
    const regex = state.getSearchRegex();

    if (transactions.length === 0) {
        elements.transactionsBody.innerHTML = '';
        elements.transactionsCards.innerHTML = '';
        elements.noResults.hidden = false;
        return;
    }

    elements.noResults.hidden = true;
    renderTable(transactions, regex);
    renderCards(transactions, regex);
}

/**
 * Render transactions table (desktop)
 * @param {Array} transactions 
 * @param {RegExp|null} regex 
 */
function renderTable(transactions, regex) {
    let html = '';

    transactions.forEach(t => {
        const displayAmount = state.getDisplayAmount(t.amount);
        const descHighlighted = highlight(t.description, regex);
        const categoryHighlighted = highlight(t.category, regex);
        const amountStr = state.formatCurrency(displayAmount);
        const amountHighlighted = highlight(amountStr, regex);

        html += `
            <tr data-id="${t.id}">
                <td>${formatDate(t.date)}</td>
                <td>${descHighlighted}</td>
                <td>${categoryHighlighted}</td>
                <td>${amountHighlighted}</td>
                <td class="transaction-actions">
                    <button class="btn btn--sm btn--secondary edit-btn" data-id="${t.id}" aria-label="Edit ${escapeHTML(t.description)}">
                        Edit
                    </button>
                    <button class="btn btn--sm btn--danger delete-btn" data-id="${t.id}" aria-label="Delete ${escapeHTML(t.description)}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    elements.transactionsBody.innerHTML = html;
}

/**
 * Render transaction cards (mobile)
 * @param {Array} transactions 
 * @param {RegExp|null} regex 
 */
function renderCards(transactions, regex) {
    let html = '';

    transactions.forEach(t => {
        const displayAmount = state.getDisplayAmount(t.amount);
        const descHighlighted = highlight(t.description, regex);
        const categoryHighlighted = highlight(t.category, regex);
        const amountStr = state.formatCurrency(displayAmount);

        html += `
            <article class="transaction-card" data-id="${t.id}">
                <div class="card-header">
                    <h3 class="card-title">${descHighlighted}</h3>
                    <span class="card-amount">${amountStr}</span>
                </div>
                <div class="card-meta">
                    <span class="card-date">${formatDate(t.date)}</span>
                    <span class="card-category">${categoryHighlighted}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn--sm btn--secondary edit-btn" data-id="${t.id}" aria-label="Edit ${escapeHTML(t.description)}">
                        Edit
                    </button>
                    <button class="btn btn--sm btn--danger delete-btn" data-id="${t.id}" aria-label="Delete ${escapeHTML(t.description)}">
                        Delete
                    </button>
                </div>
            </article>
        `;
    });

    elements.transactionsCards.innerHTML = html;
}

// -- Form Rendering


/**
 * Populate category dropdowns
 */
export function renderCategories() {
    const categories = state.getCategories();

    // Form category select
    let optionsHTML = '<option value="">Select a category</option>';
    categories.forEach(cat => {
        optionsHTML += `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`;
    });
    elements.categorySelect.innerHTML = optionsHTML;

    // Filter category select
    let filterHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        filterHTML += `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`;
    });
    elements.categoryFilter.innerHTML = filterHTML;

    // Settings categories list
    let listHTML = '';
    categories.forEach(cat => {
        listHTML += `
            <li class="category-tag">
                <span>${escapeHTML(cat)}</span>
                <button class="remove-category" data-category="${escapeHTML(cat)}" aria-label="Remove ${escapeHTML(cat)} category">×</button>
            </li>
        `;
    });
    elements.categoriesList.innerHTML = listHTML;
}

/**
 * Set up form for adding new transaction
 */
export function setupAddForm() {
    elements.formTitle.textContent = 'Add New Transaction';
    elements.submitText.textContent = 'Add Transaction';
    elements.cancelBtn.hidden = true;
    elements.editId.value = '';
    clearForm();
    
    // Set default date to today
    elements.dateInput.value = new Date().toISOString().split('T')[0];
}

/**
 * Set up form for editing existing transaction
 * @param {string} id - Transaction ID
 */
export function setupEditForm(id) {
    const transaction = state.getTransaction(id);
    if (!transaction) return;

    elements.formTitle.textContent = 'Edit Transaction';
    elements.submitText.textContent = 'Update Transaction';
    elements.cancelBtn.hidden = false;
    elements.editId.value = id;

    // Populate form fields
    elements.descriptionInput.value = transaction.description;
    elements.amountInput.value = transaction.amount.toFixed(2);
    elements.dateInput.value = transaction.date;
    elements.categorySelect.value = transaction.category;
    elements.customCategory.value = '';

    // Clear any existing errors
    clearFormErrors();
}

/**
 * Clear the transaction form
 */
export function clearForm() {
    elements.transactionForm.reset();
    elements.editId.value = '';
    clearFormErrors();
}

/**
 * Clear form validation errors
 */
export function clearFormErrors() {
    const errorElements = elements.transactionForm.querySelectorAll('.error-text');
    errorElements.forEach(el => {
        el.hidden = true;
        el.textContent = '';
    });

    const inputs = elements.transactionForm.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
}

/**
 * Show form validation error
 * @param {string} fieldId - Field ID
 * @param {string} message - Error message
 */
export function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);

    if (input) {
        input.classList.add('is-invalid');
    }

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
    }
}

// -- Settings Rendering


/**
 * Populate settings form from state
 */
export function renderSettings() {
    const settings = state.getSettings();

    // Budget
    elements.budgetCap.value = settings.budgetCap > 0 ? settings.budgetCap.toFixed(2) : '';

    // Currency
    elements.baseCurrency.value = settings.baseCurrency;
    elements.displayCurrency.value = settings.displayCurrency;
    elements.rateEur.value = settings.exchangeRates.EUR;
    elements.rateRwf.value = settings.exchangeRates.RWF;

    // Update currency prefix in form
    updateCurrencyPrefix(settings.baseCurrency);

    // Categories
    renderCategories();
}

/**
 * Update currency prefix in amount input
 * @param {string} currency 
 */
export function updateCurrencyPrefix(currency) {
    const symbols = { USD: '$', EUR: '€', RWF: 'FRw' };
    elements.currencyPrefix.textContent = symbols[currency] || '$';
}

// -- Dialog


let pendingDeleteId = null;

/**
 * Show delete confirmation dialog
 * @param {string} id - Transaction ID to delete
 */
export function showDeleteDialog(id) {
    pendingDeleteId = id;
    elements.deleteDialog.showModal();
    elements.cancelDelete.focus();
}

/**
 * Hide delete dialog
 */
export function hideDeleteDialog() {
    pendingDeleteId = null;
    elements.deleteDialog.close();
}

/**
 * Get pending delete ID
 * @returns {string|null}
 */
export function getPendingDeleteId() {
    return pendingDeleteId;
}

// -- Accessibility Announcements


/**
 * Announce message to screen readers (polite)
 * @param {string} message 
 */
export function announce(message) {
    elements.liveRegion.textContent = '';
    // Small delay to ensure the change is detected
    setTimeout(() => {
        elements.liveRegion.textContent = message;
    }, 50);
}

/**
 * Announce alert to screen readers (assertive)
 * @param {string} message 
 */
export function announceAlert(message) {
    elements.alertRegion.textContent = '';
    setTimeout(() => {
        elements.alertRegion.textContent = message;
    }, 50);
}

// -- Search UI


/**
 * Show search error
 * @param {string} message 
 */
export function showSearchError(message) {
    elements.searchError.textContent = message;
    elements.searchError.hidden = false;
}

/**
 * Clear search error
 */
export function clearSearchError() {
    elements.searchError.textContent = '';
    elements.searchError.hidden = true;
}

/**
 * Update sort select with current sort
 * @param {string} sortKey 
 */
export function updateSortUI(sortKey) {
    elements.sortSelect.value = sortKey;

    // Update table header indicators
    const headers = elements.transactionsTable.querySelectorAll('th.sortable');
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        
        const [field, direction] = sortKey.split('-');
        if (header.dataset.sort === field) {
            header.classList.add(`sort-${direction}`);
        }
    });
}

// -- Utility Functions


/**
 * Format date for display
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {string}
 */
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Check if we're on mobile
 * @returns {boolean}
 */
export function isMobile() {
    return window.innerWidth < 768;
}

/**
 * Debounce function
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
