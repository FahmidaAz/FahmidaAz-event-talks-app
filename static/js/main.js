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
    const spinnerIcon = document.getElementById('spinner-icon');
    const searchInput = document.getElementById('search-input');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const releasesList = document.getElementById('releases-list');
    const updateCount = document.getElementById('update-count');
    
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
                    <span class="card-date">${displayDate}</span>
                </div>
                <h3>${escapeHtml(item.title)}</h3>
                <div class="card-snippet">${escapeHtml(item.plain_text)}</div>
            `;

            card.addEventListener('click', () => selectRelease(item.id));
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
        document.getElementById('detail-panel').scrollTop = 0;
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

    // Bind event handlers
    refreshBtn.addEventListener('click', fetchReleases);
    
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
