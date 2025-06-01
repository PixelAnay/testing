document.addEventListener('DOMContentLoaded', function() {
    // --- Global Element Selectors (checked for existence before use) ---
    const header = document.querySelector('.main-header');
    const headerOffset = header ? header.offsetHeight : 70; // Fallback offset

    const hamburger = document.querySelector('.hamburger-menu');
    const mobileNavPanel = document.querySelector('.mobile-nav-panel');

    const yearSpan = document.getElementById('currentYear');

    // For Email Copy Functionality (present on index, skills, projects)
    const copyButton = document.getElementById('copyEmailButton');
    const emailLink = document.getElementById('emailToCopy');
    const copyFeedback = document.getElementById('copyFeedback');

    // For index.html specific scroll highlighting
    // We'll gate the execution of highlightNav based on a check for index.html
    let indexPageSections = null;
    let mainNavLinksForHighlight = null;
    let mobileNavLinksForHighlight = null;

    // --- Helper Functions ---
    function closeMobileMenu() {
        if (mobileNavPanel && mobileNavPanel.classList.contains('open')) {
            mobileNavPanel.classList.remove('open');
            if (hamburger) {
                hamburger.classList.remove('is-active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        }
    }

    function handleNavLinkClick(e) {
        const linkElement = this; // 'this' refers to the clicked anchor element
        const hrefAttribute = linkElement.getAttribute('href');

        // Resolve the link's full URL to compare pathnames and hashes
        const targetUrl = new URL(linkElement.href, window.location.origin);
        const currentUrl = new URL(window.location.href, window.location.origin);

        const isMailTo = hrefAttribute.startsWith('mailto:');
        const isTargetBlank = linkElement.getAttribute('target') === '_blank';
        const isDownload = typeof linkElement.getAttribute('download') === 'string';

        if (isMailTo || isTargetBlank || isDownload) {
            // Let the browser handle these link types naturally.
            // Still close mobile menu if the click came from inside it.
            if (mobileNavPanel && mobileNavPanel.contains(linkElement)) {
                closeMobileMenu();
            }
            return; // Don't prevent default or do custom navigation
        }

        // For all other navigation links we want to control:
        e.preventDefault();
        closeMobileMenu();

        // Check if it's a same-page hash link
        if (targetUrl.pathname === currentUrl.pathname && targetUrl.hash) {
            const targetElement = document.querySelector(targetUrl.hash);
            if (targetElement) {
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            } else {
                // Fallback if target element for hash not found on same page
                window.location.href = linkElement.href;
            }
        } else {
            // Different page navigation (with or without hash)
            window.location.href = linkElement.href;
        }
    }

    // --- Scroll Highlighting Logic (for index.html) ---
    function highlightNav() {
        // This function should only operate if indexPageSections are available
        if (!indexPageSections || indexPageSections.length === 0) return;

        let currentSectionId = '';
        const currentScroll = window.pageYOffset;

        indexPageSections.forEach(section => {
            const sectionTop = section.offsetTop - headerOffset - 50; // Adjusted offset
            if (currentScroll >= sectionTop) {
                currentSectionId = section.getAttribute('id');
            }
        });

        // Default to 'about' if at the very top (specific to index.html structure)
        if (!currentSectionId && currentScroll < (indexPageSections[0].offsetTop - headerOffset - 50)) {
            currentSectionId = 'about';
        }
        
        const allNavLinksForHighlight = [...(mainNavLinksForHighlight || []), ...(mobileNavLinksForHighlight || [])];
        allNavLinksForHighlight.forEach(link => {
            if (link) {
                link.classList.remove('active');
                const linkHref = link.getAttribute('href');
                if (linkHref && linkHref.substring(1) === currentSectionId) {
                    link.classList.add('active');
                }
            }
        });
    }

    // --- Event Listener Setup ---

    // Hamburger Menu Toggle & Outside Click Close
    if (hamburger && mobileNavPanel) {
        hamburger.addEventListener('click', () => {
            const isOpen = mobileNavPanel.classList.toggle('open');
            hamburger.classList.toggle('is-active', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen);
        });

        document.addEventListener('click', function(event) {
            const isClickInsideNav = mobileNavPanel.contains(event.target);
            const isClickOnHamburger = hamburger.contains(event.target);
            if (mobileNavPanel.classList.contains('open') && !isClickInsideNav && !isClickOnHamburger) {
                closeMobileMenu();
            }
        });
    }

    // Navigation Links (Desktop, Mobile, Hero button on index.html)
    const allNavigableLinks = document.querySelectorAll(
        '.main-nav a, .mobile-nav-panel a, .hero a[href^="#"]' // Common query for all pages
    );
    if (allNavigableLinks) {
        allNavigableLinks.forEach(anchor => {
            anchor.addEventListener('click', handleNavLinkClick);
        });
    }
    
    // Email Copy Button Functionality
    if (copyButton && emailLink && copyFeedback) {
        copyButton.addEventListener('click', function() {
            const emailText = emailLink.textContent.trim();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(emailText).then(function() {
                    copyFeedback.classList.add('show');
                    setTimeout(function() { copyFeedback.classList.remove('show'); }, 2000);
                }).catch(function(err) {
                    console.error('Failed to copy email: ', err);
                    alert('Could not copy email. Please copy it manually.');
                });
            } else {
                // Fallback for older browsers
                try {
                    const textArea = document.createElement("textarea");
                    textArea.value = emailText;
                    Object.assign(textArea.style, { position: "fixed", top: "0", left: "0", opacity: "0" });
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    copyFeedback.classList.add('show');
                    setTimeout(function() { copyFeedback.classList.remove('show'); }, 2000);
                } catch (err) {
                    console.error('Fallback copy failed: ', err);
                    alert('Could not copy email. Please copy it manually.');
                }
            }
        });
    }

    // Current Year in Footer
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- Page-Specific Setup for index.html Scroll Highlighting ---
    // Check if we are on a page that should have scroll highlighting (e.g., index.html)
    // A good heuristic is the presence of the .hero section, which is unique to index.html
    if (document.querySelector('section.hero')) {
        indexPageSections = document.querySelectorAll('main > section[id]'); // Sections within main
        mainNavLinksForHighlight = document.querySelectorAll('.main-nav a[href^="#"]');
        mobileNavLinksForHighlight = document.querySelectorAll('.mobile-nav-panel a[href^="#"]');

        if (indexPageSections && indexPageSections.length > 0) {
            window.addEventListener('scroll', highlightNav);
            highlightNav(); // Initial call to set active link on page load
        }
    }
});