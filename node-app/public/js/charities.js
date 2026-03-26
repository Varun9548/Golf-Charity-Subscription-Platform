/* =====================================================
   GREENHEART — CHARITIES PAGE JS (Updated for INR)
   ===================================================== */

let activeFilter = 'all';
let searchQuery = '';
let sortBy = 'popular';

// ===================== SEARCH =====================
const searchInput = document.getElementById('charitySearch');
if (searchInput) {
    searchInput.addEventListener('input', function () {
        searchQuery = this.value.toLowerCase().trim();
        filterAndSort();
    });
}

// ===================== CATEGORY FILTER =====================
const filterTabs = document.getElementById('filterTabs');
if (filterTabs) {
    filterTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.filter-tab');
        if (!tab) return;
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.filter;
        filterAndSort();
    });
}

// ===================== SORT =====================
const sortSelect = document.getElementById('charitySort');
if (sortSelect) {
    sortSelect.addEventListener('change', function () {
        sortBy = this.value;
        filterAndSort();
    });
}

// ===================== FILTER & SORT LOGIC =====================
function filterAndSort() {
    const cards = document.querySelectorAll('.charity-dir-card');
    const noResults = document.getElementById('noResults');
    const countEl = document.getElementById('charityCount');
    let visibleCount = 0;

    // Get card data for sorting
    const cardData = Array.from(cards).map(card => {
        const stats = card.querySelectorAll('.dir-stat span');
        
        // Logic to extract numbers from Indian formatting (e.g., ₹1,20,000 -> 120000)
        const raisedText = stats[1]?.textContent || '0';
        const raisedNumeric = parseInt(raisedText.replace(/[^0-9]/g, '')) || 0;

        return {
            el: card,
            category: card.dataset.category,
            name: card.querySelector('.dir-card-name')?.textContent.toLowerCase() || '',
            supporters: parseInt(stats[0]?.textContent?.replace(/[^0-9]/g, '') || '0'),
            raised: raisedNumeric
        };
    });

    // Apply filter
    const filtered = cardData.filter(item => {
        const catMatch = activeFilter === 'all' || item.category === activeFilter;
        const searchMatch = !searchQuery || item.name.includes(searchQuery);
        return catMatch && searchMatch;
    });

    // Apply sort
    filtered.sort((a, b) => {
        if (sortBy === 'popular') return b.supporters - a.supporters;
        if (sortBy === 'raised') return b.raised - a.raised;
        if (sortBy === 'az') return a.name.localeCompare(b.name);
        return 0;
    });

    // Hide all first (reset layout)
    cards.forEach(card => {
        card.style.display = 'none';
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
    });

    // Show filtered/sorted with staggered animation
    filtered.forEach((item, index) => {
        item.el.style.display = 'block';
        // Small delay per item for a "ripple" loading effect
        setTimeout(() => {
            item.el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.el.style.opacity = '1';
            item.el.style.transform = 'translateY(0)';
        }, index * 60);
        visibleCount++;
    });

    // Update count display
    if (countEl) countEl.textContent = `${visibleCount} ${visibleCount === 1 ? 'charity' : 'charities'}`;

    // Show/Hide No Results message
    if (noResults) {
        noResults.classList.toggle('hidden', visibleCount > 0);
    }
}

function resetFilters() {
    activeFilter = 'all';
    searchQuery = '';
    sortBy = 'popular';
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'popular';
    document.querySelectorAll('.filter-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    filterAndSort();
}

// Initial Run
document.addEventListener('DOMContentLoaded', filterAndSort);