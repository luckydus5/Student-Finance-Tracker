// Validators - regex patterns and validation functions

// -- Regex Patterns


/**
 * Validation patterns with descriptions
 */
export const PATTERNS = {
    /**
     * Description: No leading/trailing spaces, no double consecutive spaces
     * Matches: "Hello World", "Single", "A B C"
     * Rejects: " leading", "trailing ", "double  spaces"
     */
    description: /^\S(?:.*\S)?$/,

    /**
     * Amount: Positive number with up to 2 decimal places
     * Matches: "0", "0.50", "12.99", "1234", "0.01"
     * Rejects: "01", ".50", "12.999", "-5", "abc"
     */
    amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,

    /**
     * Date: YYYY-MM-DD format with valid month/day ranges
     * Matches: "2025-01-01", "2025-12-31", "2000-09-15"
     * Rejects: "2025-13-01", "2025-00-15", "25-01-01", "2025/01/01"
     */
    date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,

    /**
     * Category: Letters, spaces, and hyphens only
     * Matches: "Food", "Fast Food", "Self-Care", "Books And More"
     * Rejects: "Food123", "  Spaced  ", "under_score"
     */
    category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,

    /**
     * ADVANCED: Duplicate word detection using back-reference
     * Detects repeated consecutive words (case insensitive issue handled in usage)
     * Matches in: "the the cat", "very very good", "hello hello"
     * No match: "the cat", "very good hello"
     */
    duplicateWord: /\b(\w+)\s+\1\b/gi,

    /**
     * ADVANCED: Lookahead for strong password (example for reference)
     * At least 8 chars, one uppercase, one lowercase, one number
     * Uses positive lookahead assertions
     */
    strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,

    /**
     * Currency format with cents (for search)
     * Matches amounts ending in .XX
     */
    withCents: /\.\d{2}\b/,

    /**
     * Beverage keywords (for search)
     * Case insensitive matching of common beverages
     */
    beverages: /(coffee|tea|juice|water|soda|drink)/i,

    /**
     * High value transactions (100+)
     * Matches numbers >= 100
     */
    highValue: /\b[1-9]\d{2,}(\.\d{2})?\b/,

    /**
     * Exchange rate format
     * Positive decimal number
     */
    exchangeRate: /^(0|[1-9]\d*)(\.\d+)?$/,

    /**
     * Budget cap format
     * Non-negative number with up to 2 decimals
     */
    budgetCap: /^(0|[1-9]\d*)(\.\d{1,2})?$/
};

// -- Validation Functions


/**
 * Validate description field
 * @param {string} value - The description to validate
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateDescription(value) {
    if (!value || value.trim() === '') {
        return { valid: false, error: 'Description is required' };
    }

    // Check for leading/trailing spaces
    if (value !== value.trim()) {
        return { valid: false, error: 'Description cannot have leading or trailing spaces' };
    }

    // Check for consecutive spaces
    if (/\s{2,}/.test(value)) {
        return { valid: false, error: 'Description cannot have consecutive spaces' };
    }

    // Check minimum length
    if (value.length < 2) {
        return { valid: false, error: 'Description must be at least 2 characters' };
    }

    // Check maximum length
    if (value.length > 200) {
        return { valid: false, error: 'Description cannot exceed 200 characters' };
    }

    // Check for duplicate words (advanced pattern with back-reference)
    const duplicateMatch = value.match(PATTERNS.duplicateWord);
    if (duplicateMatch) {
        return { 
            valid: false, 
            error: `Duplicate word detected: "${duplicateMatch[0]}". Please rephrase.` 
        };
    }

    if (!PATTERNS.description.test(value)) {
        return { valid: false, error: 'Invalid description format' };
    }

    return { valid: true, error: null };
}

/**
 * Validate amount field
 * @param {string} value - The amount to validate
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateAmount(value) {
    if (!value || value.trim() === '') {
        return { valid: false, error: 'Amount is required' };
    }

    const trimmed = value.trim();

    if (!PATTERNS.amount.test(trimmed)) {
        return { 
            valid: false, 
            error: 'Invalid amount format. Use numbers with up to 2 decimal places (e.g., 12.50)' 
        };
    }

    const numValue = parseFloat(trimmed);

    if (numValue < 0) {
        return { valid: false, error: 'Amount cannot be negative' };
    }

    if (numValue > 999999.99) {
        return { valid: false, error: 'Amount cannot exceed 999,999.99' };
    }

    return { valid: true, error: null };
}

/**
 * Validate date field
 * @param {string} value - The date string to validate (YYYY-MM-DD)
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateDate(value) {
    if (!value || value.trim() === '') {
        return { valid: false, error: 'Date is required' };
    }

    const trimmed = value.trim();

    if (!PATTERNS.date.test(trimmed)) {
        return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD (e.g., 2025-09-15)' };
    }

    // Additional validation for actual date validity
    const [year, month, day] = trimmed.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    // Check if the date is actually valid (handles things like Feb 30)
    if (
        dateObj.getFullYear() !== year ||
        dateObj.getMonth() !== month - 1 ||
        dateObj.getDate() !== day
    ) {
        return { valid: false, error: 'Invalid date. Please enter a real date.' };
    }

    // Check for reasonable year range
    const currentYear = new Date().getFullYear();
    if (year < 2000 || year > currentYear + 10) {
        return { valid: false, error: `Year must be between 2000 and ${currentYear + 10}` };
    }

    return { valid: true, error: null };
}

/**
 * Validate category field
 * @param {string} value - The category to validate
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateCategory(value) {
    if (!value || value.trim() === '') {
        return { valid: false, error: 'Category is required' };
    }

    const trimmed = value.trim();

    if (!PATTERNS.category.test(trimmed)) {
        return { 
            valid: false, 
            error: 'Category can only contain letters, spaces, and hyphens' 
        };
    }

    if (trimmed.length < 2) {
        return { valid: false, error: 'Category must be at least 2 characters' };
    }

    if (trimmed.length > 50) {
        return { valid: false, error: 'Category cannot exceed 50 characters' };
    }

    return { valid: true, error: null };
}

/**
 * Validate exchange rate
 * @param {string} value - The rate to validate
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateExchangeRate(value) {
    if (!value || value.trim() === '') {
        return { valid: false, error: 'Exchange rate is required' };
    }

    const trimmed = value.trim();

    if (!PATTERNS.exchangeRate.test(trimmed)) {
        return { valid: false, error: 'Invalid exchange rate format' };
    }

    const numValue = parseFloat(trimmed);

    if (numValue <= 0) {
        return { valid: false, error: 'Exchange rate must be greater than 0' };
    }

    if (numValue > 1000) {
        return { valid: false, error: 'Exchange rate seems unrealistic' };
    }

    return { valid: true, error: null };
}

/**
 * Validate budget cap
 * @param {string} value - The budget cap to validate
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateBudgetCap(value) {
    if (!value || value.trim() === '') {
        // Empty is valid (means no cap)
        return { valid: true, error: null };
    }

    const trimmed = value.trim();

    if (!PATTERNS.budgetCap.test(trimmed)) {
        return { valid: false, error: 'Invalid budget format' };
    }

    const numValue = parseFloat(trimmed);

    if (numValue < 0) {
        return { valid: false, error: 'Budget cannot be negative' };
    }

    return { valid: true, error: null };
}

/**
 * Validate complete transaction object
 * @param {Object} transaction - The transaction to validate
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateTransaction(transaction) {
    const errors = {};

    const descResult = validateDescription(transaction.description);
    if (!descResult.valid) {
        errors.description = descResult.error;
    }

    const amountResult = validateAmount(String(transaction.amount));
    if (!amountResult.valid) {
        errors.amount = amountResult.error;
    }

    const dateResult = validateDate(transaction.date);
    if (!dateResult.valid) {
        errors.date = dateResult.error;
    }

    const categoryResult = validateCategory(transaction.category);
    if (!categoryResult.valid) {
        errors.category = categoryResult.error;
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Validate imported JSON data structure
 * @param {any} data - The data to validate
 * @returns {{ valid: boolean, error: string | null, data: Array | null }}
 */
export function validateImportData(data) {
    // Must be an array
    if (!Array.isArray(data)) {
        return { valid: false, error: 'Data must be an array of transactions', data: null };
    }

    // Can't be empty
    if (data.length === 0) {
        return { valid: false, error: 'Data array is empty', data: null };
    }

    // Validate each transaction
    const validatedData = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        // Check required fields exist
        if (typeof item !== 'object' || item === null) {
            errors.push(`Item ${i + 1}: Not a valid object`);
            continue;
        }

        // Validate structure
        const requiredFields = ['description', 'amount', 'category', 'date'];
        const missingFields = requiredFields.filter(field => !(field in item));

        if (missingFields.length > 0) {
            errors.push(`Item ${i + 1}: Missing fields: ${missingFields.join(', ')}`);
            continue;
        }

        // Validate individual fields
        const validation = validateTransaction({
            description: String(item.description),
            amount: String(item.amount),
            date: String(item.date),
            category: String(item.category)
        });

        if (!validation.valid) {
            const fieldErrors = Object.entries(validation.errors)
                .map(([field, error]) => `${field}: ${error}`)
                .join('; ');
            errors.push(`Item ${i + 1}: ${fieldErrors}`);
            continue;
        }

        // Create validated transaction
        validatedData.push({
            id: item.id || generateId(),
            description: String(item.description).trim(),
            amount: parseFloat(item.amount),
            category: String(item.category).trim(),
            date: String(item.date).trim(),
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString()
        });
    }

    if (errors.length > 0) {
        return {
            valid: false,
            error: `Validation errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`,
            data: null
        };
    }

    return { valid: true, error: null, data: validatedData };
}

/**
 * Generate a unique ID for transactions
 * @returns {string}
 */
function generateId() {
    return 'txn_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// -- Search Pattern Examples (exported for reference/documentation)


export const SEARCH_EXAMPLES = [
    {
        pattern: '/\\.\d{2}\\b/',
        description: 'Find transactions with cents (e.g., 12.50)',
        example: 'Matches: "12.50", "0.99"'
    },
    {
        pattern: '/(coffee|tea)/i',
        description: 'Find beverages (case insensitive)',
        example: 'Matches: "Coffee at cafe", "Tea break"'
    },
    {
        pattern: '/\\b(\\w+)\\s+\\1\\b/i',
        description: 'Find duplicate words',
        example: 'Matches: "very very", "the the"'
    },
    {
        pattern: '/^Book/',
        description: 'Starts with "Book"',
        example: 'Matches: "Bookstore", "Books"'
    },
    {
        pattern: '/food$/i',
        description: 'Ends with "food"',
        example: 'Matches: "Fast food", "Street food"'
    },
    {
        pattern: '/\\b[1-9]\\d{2,}/',
        description: 'High value (100+)',
        example: 'Matches amounts >= 100'
    }
];
