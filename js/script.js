// ========================================
// Main Animations & Interactivity Script (Refined)
// ========================================
// This script is structured into a modular 'App' object to improve
// readability, maintainability, and performance.
// ========================================

document.addEventListener('DOMContentLoaded', () => {

    // The App object encapsulates all functionality for the website.
    const App = {
        // --- Configuration Constants ---
        CONFIG: {
            DESKTOP_BREAKPOINT: 768, // This can now be used for other logic, but not to disable parallax
            HERO_ANIMATION_MARGIN: 40,
            STICKY_HEADER_OFFSET: 10,
            BACK_TO_TOP_OFFSET: 300,
            DEBOUNCE_DELAY: 150, // REFINED: Slightly reduced delay for a more responsive feel on resize.
            HERO_IMAGE_PARALLAX_SPEED: -0.4,
            WELCOME_MESSAGE_PARALLAX_SPEED: -0.15,
            HERO_IMAGE_MIN_OPACITY: 0.2,
        },

        // --- Element Cache ---
        elements: {
            header: document.querySelector('header'),
            nav: document.querySelector('nav'),
            navLinks: document.querySelectorAll('nav a'),
            heroHeadline: document.querySelector('.hero-headline'),
            heroImage: document.getElementById('hero-image'),
            welcomeMessage: document.getElementById('welcome-message'),
            countdownTimer: document.getElementById('countdown-timer'),
            dateElement: document.getElementById('current-date'),
            fadeElements: document.querySelectorAll('.fade-in-element'),
            galleries: document.querySelectorAll('.photo-gallery'),
            mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
            backToTopButton: document.getElementById('back-to-top-btn'),
            modalTriggers: document.querySelectorAll('[data-modal-target]'),
            modalCloseButtons: document.querySelectorAll('.modal-close, .modal-overlay')
        },

        // --- State Properties ---
        isScrollTicking: false,
        parallaxMetrics: {}, // REFINED: Object to store parallax calculation results.

        /**
         * Main initialization function. Called once the DOM is ready.
         */
        init() {
            // Call all the individual initialization functions.
            this.initActiveNav();
            this.initParallax();
            this.initCountdown();
            this.initFooterDate();
            this.initFadeInElements();
            this.initGalleries();
            this.initMobileMenu();
            this.initBackToTop();
            this.initModals();
            this.initGlobalListeners(); // Sets up a single scroll/resize listener.
        },

        // --- Utility Functions ---
        debounce(func, delay = this.CONFIG.DEBOUNCE_DELAY) {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                }, delay);
            };
        },

        // --- Initialization Methods ---

        initActiveNav() {
            // REFINED: Use URL objects for a more robust path comparison. This correctly handles
            // trailing slashes and other URL variations.
            const currentPath = window.location.pathname;
            this.elements.navLinks.forEach(link => {
                try {
                    if (new URL(link.href).pathname === currentPath) {
                        link.classList.add('active');
                    }
                } catch (e) {
                    console.error("Could not parse link href:", link.href, e);
                }
            });
        },

        initParallax() {
            const { heroHeadline, heroImage, welcomeMessage } = this.elements;
            if (!heroHeadline || !heroImage || !welcomeMessage) return;

            const setupParallax = () => {
                // Reset styles on elements before recalculating positions
                heroHeadline.style.transform = '';
                heroImage.style.transform = '';
                heroImage.style.opacity = '1';
                welcomeMessage.style.transform = '';
                welcomeMessage.style.marginTop = ''; // Reset margin for accurate measurement

                const headlineStopOffset = heroImage.offsetTop + heroImage.offsetHeight + this.CONFIG.HERO_ANIMATION_MARGIN;
                const animationDistance = headlineStopOffset;

                // Pre-calculate parallax travel distances
                const metrics = {
                    animationDistance: animationDistance,
                    headlineTravelDistance: headlineStopOffset - heroHeadline.offsetTop,
                    imageTravelDistance: animationDistance * this.CONFIG.HERO_IMAGE_PARALLAX_SPEED,
                    welcomeTravelDistance: animationDistance * this.CONFIG.WELCOME_MESSAGE_PARALLAX_SPEED,
                };
                this.parallaxMetrics = metrics;

                // Calculate the final bottom position of the headline after animation.
                const headlineFinalBottom = headlineStopOffset + heroHeadline.offsetHeight;

                // --- THE ONLY LINE THAT CHANGED IS BELOW ---
                // We now subtract the welcome message's travel distance to compensate for its upward parallax movement.
                const requiredPush = headlineFinalBottom - welcomeMessage.offsetTop - metrics.welcomeTravelDistance;

                // Apply the push only if the welcome message is too high.
                if (requiredPush > 0) {
                    welcomeMessage.style.marginTop = `${requiredPush}px`;
                }

                this.updateParallaxAnimation();
            };

            this.updateParallaxAnimation = () => {
                const {
                    animationDistance,
                    headlineTravelDistance,
                    imageTravelDistance,
                    welcomeTravelDistance
                } = this.parallaxMetrics;

                if (!animationDistance) return;

                const scrollPosition = window.scrollY;
                const progress = Math.min(1, Math.max(0, scrollPosition / animationDistance));

                heroHeadline.style.transform = `translateY(${progress * headlineTravelDistance}px)`;
                heroImage.style.transform = `translateY(${progress * imageTravelDistance}px)`;
                welcomeMessage.style.transform = `translateY(${progress * welcomeTravelDistance}px)`;
                heroImage.style.opacity = 1 - ((1 - this.CONFIG.HERO_IMAGE_MIN_OPACITY) * progress);
            };

            // Wait for the image to load to ensure calculations are correct
            if (typeof imagesLoaded !== 'undefined') {
                imagesLoaded(heroImage, () => {
                    setupParallax();
                    window.addEventListener('resize', this.debounce(setupParallax.bind(this)));
                });
            } else {
                console.warn("imagesLoaded library not found. Parallax might be inaccurate.");
                setupParallax();
                window.addEventListener('resize', this.debounce(setupParallax.bind(this)));
            }
        },


        initCountdown() {
            if (!this.elements.countdownTimer) return;

            const weddingDate = new Date('November 11, 2025 00:00:00').getTime();

            const update = () => {
                const now = new Date().getTime();
                const distance = weddingDate - now;

                if (distance < 0) {
                    this.elements.countdownTimer.innerHTML = "<p class='countdown-expired'>The day is here!</p>";
                    return; // Stop the timer
                }

                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                // REFINED: Using textContent is slightly more performant and safer than innerHTML.
                // We can query the number elements once and update them directly.
                // For simplicity here, we'll keep innerHTML but it's a good point for future optimization.
                this.elements.countdownTimer.innerHTML = `
                    <div class="timer-unit"><span class="number">${days}</span><span class="label">Days</span></div>
                    <div class="timer-unit"><span class="number">${hours}</span><span class="label">Hours</span></div>
                    <div class="timer-unit"><span class="number">${minutes}</span><span class="label">Minutes</span></div>
                    <div class="timer-unit"><span class="number">${seconds}</span><span class="label">Seconds</span></div>
                `;

                // REFINED: Use a self-correcting timer with setTimeout instead of setInterval.
                // This accounts for any delay in the script's execution and stays accurate.
                const nextTick = 1000 - (new Date().getTime() - now);
                setTimeout(update, nextTick);
            };

            update(); // Start the timer
        },


        initFooterDate() {
            if (!this.elements.dateElement) return;
            const today = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' };
            this.elements.dateElement.textContent = today.toLocaleDateString('en-US', options);
        },

        initFadeInElements() {
            if (this.elements.fadeElements.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            this.elements.fadeElements.forEach(element => observer.observe(element));
        },

        initGalleries() {
            if (this.elements.galleries.length === 0) return;

            this.elements.galleries.forEach(gallery => {
                // Assuming you have these libraries loaded (e.g., via CDN)
                if (typeof imagesLoaded !== 'undefined' && typeof Masonry !== 'undefined' && typeof SimpleLightbox !== 'undefined') {
                    imagesLoaded(gallery, () => {
                        new Masonry(gallery, {
                            itemSelector: '.gallery-item',
                            columnWidth: '.gallery-item',
                            gutter: 15,
                            percentPosition: true
                        });
                        new SimpleLightbox(gallery.querySelectorAll('a'), { /* options */ });
                    });
                } else {
                    console.warn("Gallery libraries (imagesLoaded, Masonry, SimpleLightbox) not found.");
                }
            });
        },


        initMobileMenu() {
            if (!this.elements.mobileMenuToggle) return;
            this.elements.mobileMenuToggle.addEventListener('click', () => {
                document.body.classList.toggle('mobile-menu-open');
            });
        },

        initBackToTop() {
            if (!this.elements.backToTopButton) return;
            this.elements.backToTopButton.onclick = () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
        },

        initModals() {
            this.elements.modalTriggers.forEach(button => {
                button.addEventListener('click', () => {
                    const targetModal = document.querySelector(button.dataset.modalTarget);
                    if (targetModal) targetModal.classList.add('visible');
                });
            });

            this.elements.modalCloseButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    // REFINED: Simplified logic. This ensures any click on a close button
                    // or overlay closes the correct parent modal.
                    const modal = event.target.closest('.modal-overlay');
                    if (modal) {
                        modal.classList.remove('visible');
                    }
                });
            });
        },

        // --- Global Event Handlers ---

        /**
         * A single, optimized scroll handler for all scroll-based effects.
         */
        handleScroll() {
            if (!this.isScrollTicking) {
                window.requestAnimationFrame(() => {
                    const scrollPosition = window.scrollY;

                    // 1. Update Parallax (if its update function exists)
                    if (this.updateParallaxAnimation) {
                        this.updateParallaxAnimation();
                    }

                    // 2. Update Sticky Header/Nav
                    const isDesktop = window.innerWidth > this.CONFIG.DESKTOP_BREAKPOINT;
                    const shouldBeSticky = scrollPosition > this.CONFIG.STICKY_HEADER_OFFSET;
                    
                    if (this.elements.header && !isDesktop) {
                        this.elements.header.classList.toggle('scrolled', shouldBeSticky);
                    }
                    if (this.elements.nav && isDesktop) {
                        this.elements.nav.classList.toggle('scrolled', shouldBeSticky);
                    }

                    // 3. Update 'Back to Top' button visibility
                    if (this.elements.backToTopButton) {
                        this.elements.backToTopButton.classList.toggle('visible', scrollPosition > this.CONFIG.BACK_TO_TOP_OFFSET);
                    }

                    this.isScrollTicking = false;
                });
                this.isScrollTicking = true;
            }
        },

        /**
         * Sets up global event listeners.
         */
        initGlobalListeners() {
            window.addEventListener('scroll', this.handleScroll.bind(this));
        }
    };

    // Start the application!
    App.init();

});