// BigQuery Release Hub - Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
    // State variables
    let releases = [];
    let filteredReleases = [];
    let selectedReleaseId = null;
    let currentFilter = 'All';
    let searchQuery = '';

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const exportBtn = document.getElementById('export-btn');
    const spinnerIcon = document.getElementById('spinner-icon');
    const searchInput = document.getElementById('search-input');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const releasesList = document.getElementById('releases-list');
    const updateCount = document.getElementById('update-count');
    
    // Theme Toggle Elements
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('theme-sun-icon');
    const moonIcon = document.getElementById('theme-moon-icon');

    // Theme Initialization
    const initialTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', initialTheme);
    updateThemeIcons(initialTheme);

    function updateThemeIcons(theme) {
        if (theme === 'light') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcons(newTheme);
    });
    
    // Detail Pane Elements
    const emptyState = document.getElementById('empty-state');
    const detailContent = document.getElementById('detail-content');
    const detailTag = document.getElementById('detail-tag');
    const detailDate = document.getElementById('detail-date');
    const detailTitle = document.getElementById('detail-title');
    const detailBody = document.getElementById('detail-body');
    const tweetBtn = document.getElementById('tweet-btn');
    const copyBtn = document.getElementById('copy-btn');
    const copyBtnText = document.getElementById('copy-btn-text');
    const copyIcon = document.getElementById('copy-icon');

    // Fetch releases from the API
    async function fetchReleases() {
        setLoadingState(true);
        try {
            const response = await fetch('/api/releases');
            if (!response.ok) throw new Error('Failed to fetch release notes');
            
            const data = await response.json();
            if (data.success) {
                releases = data.releases;
                applyFilterAndSearch();
            } else {
                showErrorState(data.error || 'Server error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            showErrorState(error.message || 'Network error occurred');
        } finally {
            setLoadingState(false);
        }
    }

    // Toggle loading spinners
    function setLoadingState(isLoading) {
        if (isLoading) {
            spinnerIcon.classList.add('spinning');
            refreshBtn.disabled = true;
            releasesList.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Fetching latest release notes...</p>
                </div>
            `;
        } else {
            spinnerIcon.classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    }

    // Show error state in sidebar
    function showErrorState(message) {
        releasesList.innerHTML = `
            <div class="error-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }

    // Filter and Search notes
    function applyFilterAndSearch() {
        filteredReleases = releases.filter(item => {
            const matchesFilter = currentFilter === 'All' || item.type === currentFilter;
            const matchesSearch = searchQuery === '' || 
                item.title.toLowerCase().includes(searchQuery) || 
                item.plain_text.toLowerCase().includes(searchQuery);
            return matchesFilter && matchesSearch;
        });

        updateCount.textContent = filteredReleases.length;
        renderList();
    }

    // Render list elements in Sidebar
    function renderList() {
        if (filteredReleases.length === 0) {
            releasesList.innerHTML = `
                <div class="loading-state">
                    <p>No release notes found.</p>
                </div>
            `;
            return;
        }

        releasesList.innerHTML = '';
        filteredReleases.forEach(item => {
            const card = document.createElement('article');
            card.className = `release-card ${selectedReleaseId === item.id ? 'selected' : ''}`;
            card.dataset.id = item.id;
            
            const displayDate = formatDate(item.updated);
            const lowerType = item.type.toLowerCase();

            card.innerHTML = `
                <div class="card-meta">
                    <span class="type-badge ${lowerType}">${item.type}</span>
                    <div class="meta-right">
                        <span class="card-date">${displayDate}</span>
                        <button class="card-copy-btn" title="Copy card to clipboard" aria-label="Copy release note text">
                            <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <h3>${escapeHtml(item.title)}</h3>
                <div class="card-snippet">${escapeHtml(item.plain_text)}</div>
            `;

            card.addEventListener('click', () => selectRelease(item.id));
            
            // Card copy button logic
            const cardCopyBtn = card.querySelector('.card-copy-btn');
            cardCopyBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid triggering card selection
                copyCardToClipboard(cardCopyBtn, item.title, item.plain_text);
            });
            
            releasesList.appendChild(card);
        });

        // Retain selection if the selected ID exists in filtered list
        if (selectedReleaseId) {
            const stillExists = filteredReleases.some(item => item.id === selectedReleaseId);
            if (!stillExists) {
                clearDetails();
            }
        }
    }

    // Select and load release details
    function selectRelease(id) {
        selectedReleaseId = id;
        
        // Highlight active card
        document.querySelectorAll('.release-card').forEach(card => {
            if (card.dataset.id === id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        const release = releases.find(item => item.id === id);
        if (!release) return;

        // Show details panel
        emptyState.classList.add('hidden');
        detailContent.classList.remove('hidden');

        // Populate content
        detailTitle.textContent = release.title;
        detailDate.textContent = formatDate(release.updated);
        
        // Set tag classes
        detailTag.className = `type-badge ${release.type.toLowerCase()}`;
        detailTag.textContent = release.type;
        
        detailBody.innerHTML = release.content;
        
        // Set action links
        tweetBtn.href = release.tweet_url;
        
        // Update click handlers
        copyBtn.onclick = () => copyTextToClipboard(release.title, release.plain_text);
        
        // Scroll detail view to top
        const detailPanel = document.getElementById('detail-panel');
        detailPanel.scrollTop = 0;
        
        // If viewport is mobile/tablet, smoothly scroll the detail panel into view
        if (window.innerWidth < 992) {
            detailPanel.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Reset details view
    function clearDetails() {
        selectedReleaseId = null;
        emptyState.classList.remove('hidden');
        detailContent.classList.add('hidden');
    }

    // Format dates nicely
    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            // GCP dates are ISO 8601 strings
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr.split('T')[0];
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    // Copy clean description text
    async function copyTextToClipboard(title, bodyText) {
        const fullShareText = `BigQuery Update: ${title}\n\n${bodyText}`;
        try {
            await navigator.clipboard.writeText(fullShareText);
            
            // Visual success indicator
            copyBtnText.textContent = 'Copied!';
            copyBtn.classList.add('btn-primary');
            copyBtn.classList.remove('btn-secondary');
            
            setTimeout(() => {
                copyBtnText.textContent = 'Copy text';
                copyBtn.classList.add('btn-secondary');
                copyBtn.classList.remove('btn-primary');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Could not copy text to clipboard.');
        }
    }

    // Utility to prevent HTML injections in plaintext templates
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // Copy single card text to clipboard
    async function copyCardToClipboard(btn, title, bodyText) {
        const fullShareText = `BigQuery Update: ${title}\n\n${bodyText}`;
        const originalHTML = btn.innerHTML;
        try {
            await navigator.clipboard.writeText(fullShareText);
            
            btn.classList.add('copied');
            btn.innerHTML = `
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = originalHTML;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    // Export current filtered list to CSV
    function exportToCSV() {
        if (filteredReleases.length === 0) {
            alert('No releases to export.');
            return;
        }
        
        const headers = ['ID', 'Title', 'Date', 'Type', 'Plain Text'];
        const rows = filteredReleases.map(item => [
            item.id,
            item.title,
            item.updated,
            item.type,
            item.plain_text
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(val => {
                const escaped = (val || '').toString().replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        
        const dateStr = new Date().toISOString().slice(0, 10);
        link.setAttribute('download', `bigquery_releases_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Bind event handlers
    refreshBtn.addEventListener('click', fetchReleases);
    exportBtn.addEventListener('click', exportToCSV);
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        applyFilterAndSearch();
    });

    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            e.target.classList.add('active');
            e.target.setAttribute('aria-selected', 'true');
            currentFilter = e.target.dataset.filter;
            
            applyFilterAndSearch();
        });
    });

    // Initial Fetch
    fetchReleases();
});
