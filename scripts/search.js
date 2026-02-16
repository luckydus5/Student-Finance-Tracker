// Search - safe regex compilation and text highlighting

// -- Regex Compilation


/**
 * Safely compile a regex pattern from user input
 * @param {string} input - User's search pattern
 * @param {string} flags - Regex flags (default: 'gi')
 * @returns {{ regex: RegExp | null, error: string | null }}
 */
export function compileRegex(input, flags = 'gi') {
    // Empty input returns null (no search)
    if (!input || input.trim() === '') {
        return { regex: null, error: null };
    }

    const pattern = input.trim();

    try {
        const regex = new RegExp(pattern, flags);
        
        // Test that the regex doesn't cause catastrophic backtracking
        // by testing it against a reasonable string
        const testString = 'a'.repeat(100);
        const startTime = performance.now();
        regex.test(testString);
        const elapsed = performance.now() - startTime;
        
        // If it takes more than 100ms on a simple string, it's probably dangerous
        if (elapsed > 100) {
            return { 
                regex: null, 
                error: 'Pattern is too complex and may cause performance issues' 
            };
        }

        return { regex, error: null };
    } catch (error) {
        return { 
            regex: null, 
            error: `Invalid pattern: ${error.message}` 
        };
    }
}

// -- Text Highlighting


/**
 * Highlight matches in text using <mark> tags
 * Preserves accessibility by not breaking semantic structure
 * @param {string} text - The text to highlight
 * @param {RegExp | null} regex - The compiled regex pattern
 * @returns {string} HTML string with highlights
 */
export function highlight(text, regex) {
    if (!regex || !text) {
        return escapeHTML(text || '');
    }

    // Reset lastIndex to ensure consistent matching
    regex.lastIndex = 0;

    // Escape HTML first, then apply highlighting
    const escaped = escapeHTML(text);
    
    // We need to re-create the regex for the escaped string
    // since escaping might change character positions
    try {
        const highlighted = escaped.replace(regex, match => {
            return `<mark>${match}</mark>`;
        });
        return highlighted;
    } catch (error) {
        // If something goes wrong, return escaped text
        return escaped;
    }
}

/**
 * Highlight matches while preserving original text structure
 * Returns segments for more complex rendering
 * @param {string} text - The text to segment
 * @param {RegExp | null} regex - The compiled regex pattern
 * @returns {Array<{ text: string, highlighted: boolean }>}
 */
export function getHighlightedSegments(text, regex) {
    if (!text) {
        return [];
    }

    if (!regex) {
        return [{ text, highlighted: false }];
    }

    // Reset lastIndex
    regex.lastIndex = 0;

    const segments = [];
    let lastIndex = 0;
    let match;

    // Create a new regex with global flag for iteration
    const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');

    while ((match = globalRegex.exec(text)) !== null) {
        // Add non-matching part before this match
        if (match.index > lastIndex) {
            segments.push({
                text: text.substring(lastIndex, match.index),
                highlighted: false
            });
        }

        // Add the match
        segments.push({
            text: match[0],
            highlighted: true
        });

        lastIndex = match.index + match[0].length;

        // Prevent infinite loops with zero-length matches
        if (match[0].length === 0) {
            globalRegex.lastIndex++;
        }
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
        segments.push({
            text: text.substring(lastIndex),
            highlighted: false
        });
    }

    return segments;
}

// -- Search Functions


/**
 * Test if a transaction matches the search regex
 * @param {Object} transaction - Transaction object
 * @param {RegExp | null} regex - Search regex
 * @returns {boolean}
 */
export function matchesSearch(transaction, regex) {
    if (!regex) {
        return true;
    }

    // Reset lastIndex for global regex
    regex.lastIndex = 0;

    // Check all searchable fields
    const searchableText = [
        transaction.description,
        transaction.category,
        String(transaction.amount),
        transaction.date
    ].join(' ');

    return regex.test(searchableText);
}

/**
 * Filter transactions by search regex
 * @param {Array} transactions - Array of transactions
 * @param {RegExp | null} regex - Search regex
 * @returns {Array}
 */
export function filterBySearch(transactions, regex) {
    if (!regex) {
        return transactions;
    }

    return transactions.filter(t => matchesSearch(t, regex));
}

/**
 * Get match count in text
 * @param {string} text - Text to search
 * @param {RegExp | null} regex - Search regex
 * @returns {number}
 */
export function countMatches(text, regex) {
    if (!text || !regex) {
        return 0;
    }

    regex.lastIndex = 0;
    const matches = text.match(regex);
    return matches ? matches.length : 0;
}

// -- Pre-defined Search Patterns


/**
 * Common search patterns for finance tracking
 */
export const PRESET_SEARCHES = {
    // Transactions with cents
    withCents: {
        pattern: '\\.\\d{2}\\b',
        description: 'Amounts with cents (e.g., 12.50)',
        example: '12.50, 99.99'
    },
    
    // Beverages
    beverages: {
        pattern: '(coffee|tea|juice|water|soda|drink|smoothie)',
        description: 'Beverage-related transactions',
        example: 'Coffee at cafe'
    },
    
    // Food-related
    food: {
        pattern: '(lunch|dinner|breakfast|meal|food|eat|restaurant|cafe)',
        description: 'Food and dining',
        example: 'Lunch at cafeteria'
    },
    
    // High value (100+)
    highValue: {
        pattern: '\\b[1-9]\\d{2,}(\\.\\d{2})?\\b',
        description: 'Amounts of $100 or more',
        example: '150.00, 200'
    },
    
    // Low value (under 10)
    lowValue: {
        pattern: '\\b[0-9](\\.\\d{2})?\\b',
        description: 'Amounts under $10',
        example: '5.00, 9.99'
    },
    
    // Duplicate words (advanced back-reference)
    duplicateWords: {
        pattern: '\\b(\\w+)\\s+\\1\\b',
        description: 'Duplicate consecutive words',
        example: 'the the, very very'
    },
    
    // Starts with specific letter
    startsWithA: {
        pattern: '^[Aa]',
        description: 'Starts with A',
        example: 'Amazon, Apple'
    },
    
    // Contains numbers
    containsNumbers: {
        pattern: '\\d+',
        description: 'Contains numbers',
        example: 'Order #123'
    },
    
    // Book-related
    books: {
        pattern: '(book|textbook|novel|reading|library)',
        description: 'Book-related purchases',
        example: 'Chemistry textbook'
    },
    
    // Transport
    transport: {
        pattern: '(bus|train|uber|lyft|taxi|gas|fuel|metro|subway)',
        description: 'Transportation costs',
        example: 'Bus pass, Uber ride'
    }
};

/**
 * Get a preset search regex
 * @param {string} presetName - Name of the preset
 * @param {boolean} caseInsensitive - Whether to use case insensitive matching
 * @returns {{ regex: RegExp | null, error: string | null }}
 */
export function getPresetSearch(presetName, caseInsensitive = true) {
    const preset = PRESET_SEARCHES[presetName];
    if (!preset) {
        return { regex: null, error: 'Unknown preset' };
    }

    const flags = caseInsensitive ? 'gi' : 'g';
    return compileRegex(preset.pattern, flags);
}

// -- Utility Functions


/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string}
 */
export function escapeHTML(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Escape special regex characters in a string
 * @param {string} string - String to escape
 * @returns {string}
 */
export function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a literal search regex (escaped special characters)
 * @param {string} text - Text to search for literally
 * @param {boolean} caseInsensitive - Whether to ignore case
 * @returns {{ regex: RegExp | null, error: string | null }}
 */
export function createLiteralSearch(text, caseInsensitive = true) {
    if (!text || text.trim() === '') {
        return { regex: null, error: null };
    }

    const escaped = escapeRegex(text.trim());
    const flags = caseInsensitive ? 'gi' : 'g';
    
    return compileRegex(escaped, flags);
}

/**
 * Validate search pattern without compiling
 * @param {string} pattern - Regex pattern to validate
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validatePattern(pattern) {
    if (!pattern || pattern.trim() === '') {
        return { valid: true, error: null };
    }

    try {
        new RegExp(pattern);
        return { valid: true, error: null };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}
