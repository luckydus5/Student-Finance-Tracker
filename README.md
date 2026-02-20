# Student Finance Tracker

A fully accessible, responsive, vanilla HTML/CSS/JavaScript web application for tracking student expenses and managing budgets.

## Live Demo

**GitHub Pages URL:** [https://luckydus5.github.io/Student-Finance-Tracker](https://luckydus5.github.io/Student-Finance-Tracker/)

## Demo Video

Watch the demo: [https://www.youtube.com/watch?v=0V9dTjF1eRo](https://www.youtube.com/watch?v=0V9dTjF1eRo)

About the video: This short walkthrough demonstrates the core flows of the Student Finance Tracker — adding and editing transactions, using the regex search, switching currencies, and viewing the dashboard and 7-day spending chart. The video is presented by Olivier Dusabaamhoro and shows the app running in the browser with example data.

## Chosen Theme

**Student Finance Tracker** - A budgeting application designed for students to track their daily expenses, categorize spending, set budget limits, and see where their money goes.

## Features

### Core Features
- **Dashboard** - Real-time statistics including total transactions, spending totals, top category, and budget status
- **7-Day Spending Chart** - Visual representation of spending trends
- **Transaction Management** - Add, edit, and delete transactions with validation
- **Advanced Regex Search** - Live search with regex pattern support and match highlighting
- **Sorting & Filtering** - Sort by date, description, or amount; filter by category
- **Multi-Currency Support** - USD, EUR, RWF with manual exchange rate settings
- **Budget Cap** - Set monthly budget with visual progress bar and alerts
- **Data Persistence** - Automatic saving to localStorage
- **Import/Export** - JSON data import/export with validation

### Accessibility Features
- Skip-to-content link
- Visible focus indicators
- ARIA live regions for dynamic announcements
- Full keyboard navigation
- Proper semantic HTML structure
- Adequate color contrast (WCAG 2.1 AA)

### Responsive Design
- Mobile-first approach
- Three breakpoints: 360px, 768px, 1024px
- Card view on mobile, table view on desktop
- Collapsible mobile navigation

## Project Structure

```
├── index.html              # Main application entry point
├── tests.html              # Validation test suite
├── seed.json               # Sample data (15+ transactions)
├── README.md               # Documentation
├── styles/
│   ├── main.css           # Base styles and CSS variables
│   ├── components.css     # UI component styles
│   └── responsive.css     # Media queries and responsive adjustments
└── scripts/
    ├── app.js             # Main application logic and event handling
    ├── state.js           # Centralized state management
    ├── storage.js         # localStorage operations
    ├── validators.js      # Regex patterns and validation functions
    ├── search.js          # Safe regex compilation and highlighting
    └── ui.js              # DOM manipulation and rendering
```

## Regex Catalog

### Validation Patterns

| Pattern | Regex | Description | Valid Examples | Invalid Examples |
|---------|-------|-------------|----------------|------------------|
| Description | `^\S(?:.*\S)?$` | No leading/trailing spaces | "Hello World" | " leading", "trailing " |
| Amount | `^(0\|[1-9]\d*)(\.\d{1,2})?$` | Positive number, max 2 decimals | "12.50", "0", "100" | "01", ".50", "12.999" |
| Date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` | YYYY-MM-DD format | "2025-09-15" | "25-01-01", "2025/01/01" |
| Category | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` | Letters, spaces, hyphens | "Food", "Self-Care" | "Food123", "under_score" |

### Advanced Pattern (Back-Reference)

| Pattern | Regex | Description |
|---------|-------|-------------|
| Duplicate Words | `\b(\w+)\s+\1\b` | Detects consecutive repeated words using back-reference `\1` |

**Example:** Catches "the the cat", "very very good"

### Search Patterns

| Pattern | Regex | Description |
|---------|-------|-------------|
| With Cents | `\.\d{2}\b` | Find amounts with cents |
| Beverages | `(coffee\|tea\|juice\|water\|soda)` | Match beverage keywords |
| High Value | `\b[1-9]\d{2,}(\.\d{2})?\b` | Amounts >= $100 |
| Duplicate Words | `\b(\w+)\s+\1\b` | Find repeated words in descriptions |

### Lookahead Pattern (Reference)

| Pattern | Regex | Description |
|---------|-------|-------------|
| Strong Password | `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$` | At least 8 chars with mixed case and number |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate between focusable elements |
| `Shift + Tab` | Navigate backwards |
| `Enter` | Activate buttons, links, submit forms |
| `Escape` | Cancel edit mode, close dialogs |
| `1` | Go to Dashboard |
| `2` | Go to Transactions |
| `3` | Go to Add New |
| `4` | Go to Settings |
| `5` | Go to About |
| `/` | Focus search input (on Transactions page) |

## Accessibility Notes

### Semantic Structure
- Uses proper landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Proper heading hierarchy (h1 → h2 → h3)
- Form labels bound to inputs with `for` attribute
- Tables use `<th scope="col">` for header cells

### ARIA Implementation
- `role="status"` with `aria-live="polite"` for general announcements
- `role="alert"` with `aria-live="assertive"` for urgent messages (budget exceeded)
- `aria-expanded` on mobile menu toggle
- `aria-label` on icon-only buttons
- `aria-describedby` linking inputs to hints/errors

### Focus Management
- Skip-to-content link visible on focus
- Focus moved to section heading on navigation
- Visible focus ring (3px blue outline)
- Focus trapped in modal dialogs

### Color Contrast
- All text meets WCAG 2.1 AA standards (4.5:1 ratio minimum)
- Error states use both color and text indicators
- Budget status uses color + progress bar + text

## Running Tests

1. Open the application in a browser
2. Click "Run Tests" link in the footer, or navigate to `tests.html`
3. Tests run automatically and display results

### Test Coverage
- Description validation (9 tests)
- Amount validation (9 tests)
- Date validation (9 tests)
- Category validation (7 tests)
- Regex compilation (6 tests)
- Search highlighting (4 tests)
- Import validation (4 tests)
- Advanced regex patterns (4 tests)

## Data Structure

```javascript
{
    "id": "txn_001",           // Unique identifier
    "description": "Lunch",    // Transaction description
    "amount": 12.50,           // Amount in base currency
    "category": "Food",        // Category name
    "date": "2025-09-25",      // YYYY-MM-DD format
    "createdAt": "...",        // ISO timestamp
    "updatedAt": "..."         // ISO timestamp
}
```

## How to Run

### Local Development
1. Clone the repository
2. Open `index.html` in a modern browser
3. No build step or dependencies required!

### Loading Sample Data
1. Go to Settings
2. Click "Import JSON"
3. Select `seed.json`

### GitHub Pages Deployment
1. Push to GitHub repository
2. Go to Settings → Pages
3. Select "Deploy from a branch" → main/master
4. Site will be available at `https://yourusername.github.io/repo-name`

## Default Categories

- Food
- Books
- Transport
- Entertainment
- Fees
- Other

Categories can be added/removed in Settings.

## Currency Support

- **Base Currencies:** USD, EUR, RWF
- **Exchange Rates:** Manually configurable in Settings
- **Default Rates:**
  - 1 EUR = 1.08 USD
  - 1 RWF = 0.00073 USD

## Design Decisions

1. **Mobile-first CSS** - Base styles target mobile, enhanced via media queries
2. **CSS Custom Properties** - Consistent theming and easy customization
3. **ES Modules** - Clean separation of concerns without build tools
4. **Subscription Pattern** - State changes automatically trigger UI updates
5. **Defensive Validation** - All inputs validated on blur and submit
6. **Safe Regex** - User patterns compiled with try/catch, tested for performance

## Technologies Used

- HTML5 (Semantic markup)
- CSS3 (Flexbox, Grid, Custom Properties, Animations)
- Vanilla JavaScript (ES6+ Modules)
- localStorage API

**No frameworks or external libraries used.**

## Author

- **Name:** Olivier Dusabamahoro
- **GitHub:** [luckydus5](https://github.com/luckydus5)
- **Email:** o.dusabamah@alustudent.com

## License

This project was created for educational purposes.

