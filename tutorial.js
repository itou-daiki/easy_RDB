document.addEventListener('DOMContentLoaded', function() {
    initializeTutorial();
});

function initializeTutorial() {
    const navLinks = document.querySelectorAll('.tutorial-nav a');
    const sections = document.querySelectorAll('.tutorial-section');

    // Set first section as active by default
    if (sections.length > 0) {
        sections[0].classList.add('active');
        if (navLinks.length > 0) {
            navLinks[0].classList.add('active');
        }
    }

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('data-section');
            showSection(targetId);
            
            // Update active navigation
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Smooth scroll to top of content area
            document.querySelector('.tutorial-content').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });

    // Handle direct links from URL hash
    if (window.location.hash) {
        const sectionId = window.location.hash.substring(1);
        const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (targetLink) {
            targetLink.click();
        }
    }

    // Initialize code syntax highlighting
    highlightCodeBlocks();
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.tutorial-section');
    
    // Hide all sections
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update URL hash without scrolling
        history.replaceState(null, null, `#${sectionId}`);
    }
}

function highlightCodeBlocks() {
    const codeBlocks = document.querySelectorAll('code');
    
    codeBlocks.forEach(block => {
        // Add basic SQL keyword highlighting
        let content = block.innerHTML;
        
        // SQL keywords
        const keywords = [
            'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE',
            'INTO', 'VALUES', 'SET', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
            'ON', 'GROUP', 'BY', 'ORDER', 'COUNT', 'SUM', 'AVG',
            'MAX', 'MIN', 'AND', 'OR', 'NOT', 'IN', 'LIKE',
            'BETWEEN', 'IS', 'NULL', 'DISTINCT', 'LIMIT', 'HAVING'
        ];
        
        // Highlight keywords (case insensitive)
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            content = content.replace(regex, `<span style="color: #ff7b72; font-weight: 600;">${keyword.toUpperCase()}</span>`);
        });
        
        // Highlight strings
        content = content.replace(/'([^']*)'/g, '<span style="color: #a5d6ff;">\'$1\'</span>');
        content = content.replace(/"([^"]*)"/g, '<span style="color: #a5d6ff;">"$1"</span>');
        
        // Highlight numbers
        content = content.replace(/\b(\d+)\b/g, '<span style="color: #79c0ff;">$1</span>');
        
        // Highlight comments
        content = content.replace(/--([^\n]*)/g, '<span style="color: #8b949e; font-style: italic;">--$1</span>');
        
        block.innerHTML = content;
    });
}

// Add smooth scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href') && e.target.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add copy to clipboard functionality for code blocks
function copyCode(button) {
    const codeBlock = button.nextElementSibling.querySelector('code');
    
    if (codeBlock) {
        // Get text content without HTML tags
        const text = codeBlock.textContent || codeBlock.innerText;
        
        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            const originalText = button.textContent;
            button.textContent = '✓ コピー完了!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const originalText = button.textContent;
            button.textContent = '✓ コピー完了!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        });
    }
}

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        return; // Don't interfere with browser shortcuts
    }
    
    const navLinks = document.querySelectorAll('.tutorial-nav a');
    const activeLink = document.querySelector('.tutorial-nav a.active');
    
    if (!activeLink) return;
    
    const currentIndex = Array.from(navLinks).indexOf(activeLink);
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
            navLinks[currentIndex - 1].click();
        }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < navLinks.length - 1) {
            navLinks[currentIndex + 1].click();
        }
    }
});

// Add progress tracking
function updateProgress() {
    const sections = document.querySelectorAll('.tutorial-section');
    const visitedSections = JSON.parse(localStorage.getItem('tutorial_progress') || '[]');
    
    // Mark sections as visited
    sections.forEach(section => {
        if (visitedSections.includes(section.id)) {
            const navLink = document.querySelector(`[data-section="${section.id}"]`);
            if (navLink && !navLink.classList.contains('visited')) {
                navLink.classList.add('visited');
            }
        }
    });
    
    // Update progress bar
    const progressPercentage = Math.round((visitedSections.length / sections.length) * 100);
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-percentage');
    
    if (progressFill && progressText) {
        progressFill.style.width = progressPercentage + '%';
        progressText.textContent = progressPercentage + '%';
    }
}

// Track section visits
function markSectionAsVisited(sectionId) {
    const visitedSections = JSON.parse(localStorage.getItem('tutorial_progress') || '[]');
    
    if (!visitedSections.includes(sectionId)) {
        visitedSections.push(sectionId);
        localStorage.setItem('tutorial_progress', JSON.stringify(visitedSections));
        updateProgress();
    }
}

// Add intersection observer to track section visits
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -50% 0px'
};

const sectionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.classList.contains('active')) {
            markSectionAsVisited(entry.target.id);
        }
    });
}, observerOptions);

// Observe all sections
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.tutorial-section');
    sections.forEach(section => {
        sectionObserver.observe(section);
    });
    
    updateProgress();
});