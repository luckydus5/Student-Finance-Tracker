// Storage - localStorage operations with error handling

// Storage keys
const KEYS = {
    TRANSACTIONS: 'sft:transactions',
    SETTINGS: 'sft:settings',
    CATEGORIES: 'sft:categories'
};

// Default categories
const DEFAULT_CATEGORIES = [
    'Food',
    'Books',
    'Transport',
    'Entertainment',
    'Fees',
    'Other'
];

// Default settings
const DEFAULT_SETTINGS = {
    baseCurrency: 'USD',
    displayCurrency: 'USD',
    exchangeRates: {
        EUR: 1.08,
        RWF: 0.00073
    },
    budgetCap: 0
};

// -- Transactions Storage


/**
 * Load all transactions from localStorage
 * @returns {Array} Array of transaction objects
 */
export function loadTransactions() {
    try {
        const data = localStorage.getItem(KEYS.TRANSACTIONS);
        if (!data) {
            return [];
        }
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error loading transactions:', error);
        return [];
    }
}

/**
 * Save transactions to localStorage
 * @param {Array} transactions - Array of transaction objects
 * @returns {boolean} Success status
 */
export function saveTransactions(transactions) {
    try {
        if (!Array.isArray(transactions)) {
            throw new Error('Transactions must be an array');
        }
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
        return true;
    } catch (error) {
        console.error('Error saving transactions:', error);
        return false;
    }
}

/**
 * Add a new transaction
 * @param {Object} transaction - Transaction object (without id and timestamps)
 * @returns {Object|null} The created transaction or null on failure
 */
export function addTransaction(transaction) {
    try {
        const transactions = loadTransactions();
        const newTransaction = {
            id: generateId(),
            ...transaction,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        transactions.push(newTransaction);
        saveTransactions(transactions);
        return newTransaction;
    } catch (error) {
        console.error('Error adding transaction:', error);
        return null;
    }
}

/**
 * Update an existing transaction
 * @param {string} id - Transaction ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} The updated transaction or null on failure
 */
export function updateTransaction(id, updates) {
    try {
        const transactions = loadTransactions();
        const index = transactions.findIndex(t => t.id === id);
        
        if (index === -1) {
            throw new Error('Transaction not found');
        }

        const updatedTransaction = {
            ...transactions[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        transactions[index] = updatedTransaction;
        saveTransactions(transactions);
        return updatedTransaction;
    } catch (error) {
        console.error('Error updating transaction:', error);
        return null;
    }
}

/**
 * Delete a transaction
 * @param {string} id - Transaction ID
 * @returns {boolean} Success status
 */
export function deleteTransaction(id) {
    try {
        const transactions = loadTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        
        if (filtered.length === transactions.length) {
            throw new Error('Transaction not found');
        }

        saveTransactions(filtered);
        return true;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return false;
    }
}

/**
 * Get a single transaction by ID
 * @param {string} id - Transaction ID
 * @returns {Object|null} The transaction or null if not found
 */
export function getTransaction(id) {
    const transactions = loadTransactions();
    return transactions.find(t => t.id === id) || null;
}

/**
 * Clear all transactions
 * @returns {boolean} Success status
 */
export function clearTransactions() {
    try {
        localStorage.removeItem(KEYS.TRANSACTIONS);
        return true;
    } catch (error) {
        console.error('Error clearing transactions:', error);
        return false;
    }
}

// -- Categories Storage


/**
 * Load categories from localStorage
 * @returns {Array} Array of category strings
 */
export function loadCategories() {
    try {
        const data = localStorage.getItem(KEYS.CATEGORIES);
        if (!data) {
            // Initialize with defaults
            saveCategories(DEFAULT_CATEGORIES);
            return [...DEFAULT_CATEGORIES];
        }
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [...DEFAULT_CATEGORIES];
    } catch (error) {
        console.error('Error loading categories:', error);
        return [...DEFAULT_CATEGORIES];
    }
}

/**
 * Save categories to localStorage
 * @param {Array} categories - Array of category strings
 * @returns {boolean} Success status
 */
export function saveCategories(categories) {
    try {
        if (!Array.isArray(categories)) {
            throw new Error('Categories must be an array');
        }
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
        return true;
    } catch (error) {
        console.error('Error saving categories:', error);
        return false;
    }
}

/**
 * Add a new category
 * @param {string} category - Category name
 * @returns {boolean} Success status
 */
export function addCategory(category) {
    try {
        const categories = loadCategories();
        const normalized = category.trim();
        
        // Check for duplicates (case insensitive)
        if (categories.some(c => c.toLowerCase() === normalized.toLowerCase())) {
            throw new Error('Category already exists');
        }

        categories.push(normalized);
        saveCategories(categories);
        return true;
    } catch (error) {
        console.error('Error adding category:', error);
        return false;
    }
}

/**
 * Remove a category
 * @param {string} category - Category name
 * @returns {boolean} Success status
 */
export function removeCategory(category) {
    try {
        const categories = loadCategories();
        const filtered = categories.filter(c => c !== category);
        
        if (filtered.length === categories.length) {
            throw new Error('Category not found');
        }

        saveCategories(filtered);
        return true;
    } catch (error) {
        console.error('Error removing category:', error);
        return false;
    }
}

// -- Settings Storage


/**
 * Load settings from localStorage
 * @returns {Object} Settings object
 */
export function loadSettings() {
    try {
        const data = localStorage.getItem(KEYS.SETTINGS);
        if (!data) {
            // Initialize with defaults
            saveSettings(DEFAULT_SETTINGS);
            return { ...DEFAULT_SETTINGS };
        }
        const parsed = JSON.parse(data);
        // Merge with defaults to ensure all properties exist
        return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (error) {
        console.error('Error loading settings:', error);
        return { ...DEFAULT_SETTINGS };
    }
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object
 * @returns {boolean} Success status
 */
export function saveSettings(settings) {
    try {
        if (typeof settings !== 'object' || settings === null) {
            throw new Error('Settings must be an object');
        }
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

/**
 * Update specific settings
 * @param {Object} updates - Settings to update
 * @returns {Object} Updated settings
 */
export function updateSettings(updates) {
    try {
        const settings = loadSettings();
        const updatedSettings = { ...settings, ...updates };
        saveSettings(updatedSettings);
        return updatedSettings;
    } catch (error) {
        console.error('Error updating settings:', error);
        return loadSettings();
    }
}

// -- Import/Export Functions


/**
 * Export all data as JSON
 * @returns {Object} Complete data export
 */
export function exportAllData() {
    return {
        transactions: loadTransactions(),
        categories: loadCategories(),
        settings: loadSettings(),
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
}

/**
 * Export transactions only
 * @returns {Array} Transactions array
 */
export function exportTransactions() {
    return loadTransactions();
}

/**
 * Import transactions (replaces existing)
 * @param {Array} transactions - Validated transactions array
 * @returns {boolean} Success status
 */
export function importTransactions(transactions) {
    try {
        saveTransactions(transactions);
        return true;
    } catch (error) {
        console.error('Error importing transactions:', error);
        return false;
    }
}

/**
 * Clear all stored data
 * @returns {boolean} Success status
 */
export function clearAllData() {
    try {
        localStorage.removeItem(KEYS.TRANSACTIONS);
        localStorage.removeItem(KEYS.SETTINGS);
        localStorage.removeItem(KEYS.CATEGORIES);
        return true;
    } catch (error) {
        console.error('Error clearing all data:', error);
        return false;
    }
}

// -- Utility Functions


/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
    return 'txn_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Check if localStorage is available
 * @returns {boolean} Availability status
 */
export function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get storage usage info
 * @returns {Object} Storage usage information
 */
export function getStorageInfo() {
    try {
        let total = 0;
        for (const key of Object.values(KEYS)) {
            const item = localStorage.getItem(key);
            if (item) {
                total += item.length * 2; // Approximate bytes (UTF-16)
            }
        }
        return {
            used: total,
            usedKB: (total / 1024).toFixed(2),
            available: isStorageAvailable()
        };
    } catch (error) {
        return {
            used: 0,
            usedKB: '0',
            available: false
        };
    }
}
