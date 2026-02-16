// State management with subscription pattern

import * as storage from './storage.js';

// -- State Structure


const state = {
    transactions: [],
    categories: [],
    settings: {
        baseCurrency: 'USD',
        displayCurrency: 'USD',
        exchangeRates: { EUR: 1.08, RWF: 0.00073 },
        budgetCap: 0
    },
    ui: {
        currentSection: 'dashboard',
        searchQuery: '',
        searchRegex: null,
        sortBy: 'date-desc',
        categoryFilter: '',
        editingId: null,
        isLoading: false
    }
};

// Subscribers for state changes
const subscribers = new Set();

// -- State Initialization


/**
 * Initialize state from localStorage
 */
export function initState() {
    state.transactions = storage.loadTransactions();
    state.categories = storage.loadCategories();
    state.settings = storage.loadSettings();
    notifySubscribers();
}

// -- Getters


/**
 * Get all transactions
 * @returns {Array}
 */
export function getTransactions() {
    return [...state.transactions];
}

/**
 * Get filtered and sorted transactions
 * @returns {Array}
 */
export function getFilteredTransactions() {
    let filtered = [...state.transactions];

    // Apply category filter
    if (state.ui.categoryFilter) {
        filtered = filtered.filter(t => t.category === state.ui.categoryFilter);
    }

    // Apply search regex
    if (state.ui.searchRegex) {
        filtered = filtered.filter(t => {
            return state.ui.searchRegex.test(t.description) ||
                   state.ui.searchRegex.test(t.category) ||
                   state.ui.searchRegex.test(String(t.amount)) ||
                   state.ui.searchRegex.test(t.date);
        });
    }

    // Apply sorting
    filtered = sortTransactions(filtered, state.ui.sortBy);

    return filtered;
}

/**
 * Sort transactions by field and direction
 * @param {Array} transactions 
 * @param {string} sortKey 
 * @returns {Array}
 */
function sortTransactions(transactions, sortKey) {
    const [field, direction] = sortKey.split('-');
    const multiplier = direction === 'asc' ? 1 : -1;

    return transactions.sort((a, b) => {
        let comparison = 0;

        switch (field) {
            case 'date':
                comparison = new Date(a.date) - new Date(b.date);
                break;
            case 'description':
                comparison = a.description.localeCompare(b.description);
                break;
            case 'amount':
                comparison = a.amount - b.amount;
                break;
            default:
                comparison = 0;
        }

        return comparison * multiplier;
    });
}

/**
 * Get a single transaction by ID
 * @param {string} id 
 * @returns {Object|null}
 */
export function getTransaction(id) {
    return state.transactions.find(t => t.id === id) || null;
}

/**
 * Get all categories
 * @returns {Array}
 */
export function getCategories() {
    return [...state.categories];
}

/**
 * Get current settings
 * @returns {Object}
 */
export function getSettings() {
    return { ...state.settings };
}

/**
 * Get UI state
 * @returns {Object}
 */
export function getUIState() {
    return { ...state.ui };
}

/**
 * Get current section
 * @returns {string}
 */
export function getCurrentSection() {
    return state.ui.currentSection;
}

// -- Statistics Getters


/**
 * Calculate total amount of all transactions
 * @returns {number}
 */
export function getTotalAmount() {
    return state.transactions.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Get count of transactions
 * @returns {number}
 */
export function getTransactionCount() {
    return state.transactions.length;
}

/**
 * Get top category by spending
 * @returns {Object|null}
 */
export function getTopCategory() {
    if (state.transactions.length === 0) {
        return null;
    }

    const categoryTotals = {};
    state.transactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    let topCategory = null;
    let topAmount = 0;

    for (const [category, amount] of Object.entries(categoryTotals)) {
        if (amount > topAmount) {
            topCategory = category;
            topAmount = amount;
        }
    }

    return { category: topCategory, amount: topAmount };
}

/**
 * Get spending data for last 7 days
 * @returns {Array}
 */
export function getLast7DaysSpending() {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTotal = state.transactions
            .filter(t => t.date === dateStr)
            .reduce((sum, t) => sum + t.amount, 0);

        days.push({
            date: dateStr,
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            amount: dayTotal
        });
    }

    return days;
}

/**
 * Get budget status
 * @returns {Object}
 */
export function getBudgetStatus() {
    const total = getTotalAmount();
    const cap = state.settings.budgetCap || 0;
    
    if (cap === 0) {
        return {
            cap: 0,
            spent: total,
            remaining: null,
            percentage: 0,
            status: 'no-cap'
        };
    }

    const remaining = cap - total;
    const percentage = Math.min((total / cap) * 100, 100);
    
    let status = 'under';
    if (percentage >= 100) {
        status = 'over';
    } else if (percentage >= 80) {
        status = 'warning';
    }

    return {
        cap,
        spent: total,
        remaining,
        percentage,
        status
    };
}

/**
 * Get spending by category
 * @returns {Array}
 */
export function getSpendingByCategory() {
    const categoryTotals = {};
    
    state.transactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
}

// -- Setters / Actions


/**
 * Add a new transaction
 * @param {Object} transactionData 
 * @returns {Object|null}
 */
export function addTransaction(transactionData) {
    const newTransaction = storage.addTransaction(transactionData);
    if (newTransaction) {
        state.transactions.push(newTransaction);
        notifySubscribers();
        return newTransaction;
    }
    return null;
}

/**
 * Update an existing transaction
 * @param {string} id 
 * @param {Object} updates 
 * @returns {Object|null}
 */
export function updateTransaction(id, updates) {
    const updated = storage.updateTransaction(id, updates);
    if (updated) {
        const index = state.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            state.transactions[index] = updated;
            notifySubscribers();
        }
        return updated;
    }
    return null;
}

/**
 * Delete a transaction
 * @param {string} id 
 * @returns {boolean}
 */
export function deleteTransaction(id) {
    if (storage.deleteTransaction(id)) {
        state.transactions = state.transactions.filter(t => t.id !== id);
        notifySubscribers();
        return true;
    }
    return false;
}

/**
 * Import transactions (replaces all)
 * @param {Array} transactions 
 * @returns {boolean}
 */
export function importTransactions(transactions) {
    if (storage.importTransactions(transactions)) {
        state.transactions = [...transactions];
        notifySubscribers();
        return true;
    }
    return false;
}

/**
 * Clear all transactions
 * @returns {boolean}
 */
export function clearAllTransactions() {
    if (storage.clearTransactions()) {
        state.transactions = [];
        notifySubscribers();
        return true;
    }
    return false;
}

/**
 * Add a category
 * @param {string} category 
 * @returns {boolean}
 */
export function addCategory(category) {
    // Check if it already exists
    if (state.categories.some(c => c.toLowerCase() === category.toLowerCase())) {
        return false;
    }
    
    if (storage.addCategory(category)) {
        state.categories.push(category);
        notifySubscribers();
        return true;
    }
    return false;
}

/**
 * Remove a category
 * @param {string} category 
 * @returns {boolean}
 */
export function removeCategory(category) {
    if (storage.removeCategory(category)) {
        state.categories = state.categories.filter(c => c !== category);
        notifySubscribers();
        return true;
    }
    return false;
}

/**
 * Update settings
 * @param {Object} updates 
 */
export function updateSettings(updates) {
    state.settings = storage.updateSettings(updates);
    notifySubscribers();
}

// -- UI State Actions


/**
 * Set current section
 * @param {string} section 
 */
export function setCurrentSection(section) {
    state.ui.currentSection = section;
    notifySubscribers();
}

/**
 * Set search query and compile regex
 * @param {string} query 
 * @param {boolean} caseInsensitive 
 * @returns {{ valid: boolean, error: string | null }}
 */
export function setSearchQuery(query, caseInsensitive = true) {
    state.ui.searchQuery = query;

    if (!query || query.trim() === '') {
        state.ui.searchRegex = null;
        notifySubscribers();
        return { valid: true, error: null };
    }

    try {
        const flags = caseInsensitive ? 'gi' : 'g';
        state.ui.searchRegex = new RegExp(query, flags);
        notifySubscribers();
        return { valid: true, error: null };
    } catch (error) {
        state.ui.searchRegex = null;
        notifySubscribers();
        return { valid: false, error: 'Invalid regex pattern: ' + error.message };
    }
}

/**
 * Get current search regex
 * @returns {RegExp|null}
 */
export function getSearchRegex() {
    return state.ui.searchRegex;
}

/**
 * Set sort order
 * @param {string} sortBy 
 */
export function setSortBy(sortBy) {
    state.ui.sortBy = sortBy;
    notifySubscribers();
}

/**
 * Set category filter
 * @param {string} category 
 */
export function setCategoryFilter(category) {
    state.ui.categoryFilter = category;
    notifySubscribers();
}

/**
 * Set editing transaction ID
 * @param {string|null} id 
 */
export function setEditingId(id) {
    state.ui.editingId = id;
    notifySubscribers();
}

/**
 * Get editing transaction ID
 * @returns {string|null}
 */
export function getEditingId() {
    return state.ui.editingId;
}

/**
 * Set loading state
 * @param {boolean} loading 
 */
export function setLoading(loading) {
    state.ui.isLoading = loading;
    notifySubscribers();
}

// -- Currency Conversion


/**
 * Convert amount from one currency to another
 * @param {number} amount 
 * @param {string} from 
 * @param {string} to 
 * @returns {number}
 */
export function convertCurrency(amount, from, to) {
    if (from === to) return amount;

    const rates = state.settings.exchangeRates;
    
    // Convert to USD first (base)
    let inUSD = amount;
    if (from === 'EUR') {
        inUSD = amount * rates.EUR;
    } else if (from === 'RWF') {
        inUSD = amount * rates.RWF;
    }

    // Convert from USD to target
    if (to === 'USD') {
        return inUSD;
    } else if (to === 'EUR') {
        return inUSD / rates.EUR;
    } else if (to === 'RWF') {
        return inUSD / rates.RWF;
    }

    return amount;
}

/**
 * Format amount with currency symbol
 * @param {number} amount 
 * @param {string} currency 
 * @returns {string}
 */
export function formatCurrency(amount, currency = null) {
    const curr = currency || state.settings.displayCurrency;
    const symbols = { USD: '$', EUR: '€', RWF: 'FRw' };
    const symbol = symbols[curr] || '$';
    
    return symbol + amount.toFixed(2);
}

/**
 * Get amount in display currency
 * @param {number} amount 
 * @returns {number}
 */
export function getDisplayAmount(amount) {
    return convertCurrency(amount, state.settings.baseCurrency, state.settings.displayCurrency);
}

// -- Subscription Pattern


/**
 * Subscribe to state changes
 * @param {Function} callback 
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers of state change
 */
function notifySubscribers() {
    subscribers.forEach(callback => {
        try {
            callback(getFullState());
        } catch (error) {
            console.error('Subscriber error:', error);
        }
    });
}

/**
 * Get full state (for debugging)
 * @returns {Object}
 */
export function getFullState() {
    return {
        transactions: getTransactions(),
        categories: getCategories(),
        settings: getSettings(),
        ui: getUIState(),
        stats: {
            totalAmount: getTotalAmount(),
            transactionCount: getTransactionCount(),
            topCategory: getTopCategory(),
            budgetStatus: getBudgetStatus()
        }
    };
}
