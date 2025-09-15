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
            this.initRsvpForm();
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

        // REBUILT (FINAL V2): This version uses simpler logic that works with the new CSS padding.
        initParallax() {
            const headline = document.querySelector('.hero-headline');
            const imageFrame = document.querySelector('.hero-image-container');
            const animationContainer = document.getElementById('hero-animation-container');
            const welcomeMessage = document.getElementById('welcome-message');

            if (!headline || !imageFrame || !welcomeMessage || !animationContainer) return;

            let animationDuration = 500; // Fallback

            const calculateAnimationDuration = () => {
                // The animation completes over a scroll distance equal to 80% of the image height.
                animationDuration = imageFrame.offsetHeight * 0.8;
            };

            const updateAnimation = () => {
                const scrollPosition = window.scrollY;
                let progress = scrollPosition / animationDuration;
                progress = Math.max(0, Math.min(1, progress));

                // --- ANIMATION CALCULATIONS ---
                
                // 1. Headline Journey: Starts at the top of the padded container and lands inside the frame.
                const headlineEndPosition = imageFrame.offsetTop + imageFrame.offsetHeight - headline.offsetHeight - 35;
                const headlineCurrentPosition = progress * headlineEndPosition;
                headline.style.transform = `translateY(${headlineCurrentPosition}px)`;

                // 2. Image Frame Parallax: Moves up for depth.
                const frameParallaxDistance = -75;
                const frameCurrentPosition = progress * frameParallaxDistance;
                imageFrame.style.transform = `translateY(${frameCurrentPosition}px)`;
                imageFrame.style.opacity = 1 - (progress * 1.2); // Fades out as progress goes 0 -> 1
                
                // 3. Container Margin Adjustment: Pulls the content below up to remove the gap.
                const containerMargin = progress * frameParallaxDistance;
                animationContainer.style.marginBottom = `${containerMargin}px`;

                // 4. Welcome Message Parallax: Moves up into its final position.
                const welcomeParallaxDistance = 150;
                const welcomeCurrentPosition = welcomeParallaxDistance * (1 - progress);
                welcomeMessage.style.transform = `translateY(${welcomeCurrentPosition}px)`;
            };

            imagesLoaded(imageFrame, () => {
                calculateAnimationDuration();
                updateAnimation();
                
                this.updateParallaxAnimation = updateAnimation;
                
                window.addEventListener('resize', this.debounce(() => {
                    calculateAnimationDuration();
                    updateAnimation();
                }));
            });
        },

        initCountdown() {
            if (!this.elements.countdownTimer) return;

            const weddingDate = new Date('November 11, 2025 15:30:00').getTime();
            let previousTime = {}; // Stores the last known time values

            const createTimerStructure = () => {
                const units = ['days', 'hours', 'minutes', 'seconds'];
                this.elements.countdownTimer.innerHTML = units.map(unit => `
                    <div class="timer-unit">
                        <div class="number-container">
                            <span class="number" id="countdown-${unit}">0</span>
                        </div>
                        <span class="label">${unit.charAt(0).toUpperCase() + unit.slice(1)}</span>
                    </div>
                `).join('');
            };

            const update = () => {
                const now = new Date().getTime();
                const distance = weddingDate - now;

                if (distance < 0) {
                    this.elements.countdownTimer.innerHTML = "<p class='countdown-expired'>The day is here!</p>";
                    return;
                }

                const currentTime = {
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                };

                for (const unit in currentTime) {
                    const element = document.getElementById(`countdown-${unit}`);
                    if (element && currentTime[unit] !== previousTime[unit]) {
                        element.textContent = currentTime[unit];
                        element.classList.add('number-flip');
                        element.addEventListener('animationend', () => element.classList.remove('number-flip'), { once: true });
                    }
                }

                previousTime = currentTime;
                const nextTick = 1000 - (new Date().getTime() - now);
                setTimeout(update, nextTick);
            };

            createTimerStructure();
            update();
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
                    const modal = event.target.closest('.modal-overlay');
                    if (modal) {
                        modal.classList.remove('visible');
                    }
                });
            });
        },

        initRsvpForm() {
            const form = document.getElementById('rsvp-form');
            if (!form) return;

            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const actionUrl = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSd7At-87ABxeDfTecWUmMlFfNYfdLA8QlWHEAB8yh_bJhQEFw/formResponse';
                const submitBtn = form.querySelector('.submit-btn');
                const formData = new FormData(form);

                // --- NEW DEBUGGER ---
                // This will print the data to your browser's console.
                console.log("--- Sending to Google Forms ---");
                for (let [key, value] of formData.entries()) {
                    console.log(`${key}: ${value}`);
                }
                console.log("-----------------------------");
                // --- END DEBUGGER ---

                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';

                fetch(actionUrl, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors' 
                })
                .then(() => {
                    window.location.href = 'thank-you.html';
                })
                .catch((error) => {
                    console.error('Error submitting form:', error);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Response';
                    alert('There was an error submitting your RSVP. Please try again.');
                });
            });
        },

        // --- Global Event Handlers ---

        handleScroll() {
            if (!this.isScrollTicking) {
                window.requestAnimationFrame(() => {
                    const scrollPosition = window.scrollY;

                    if (this.updateParallaxAnimation) {
                        this.updateParallaxAnimation();
                    }

                    const isDesktop = window.innerWidth > this.CONFIG.DESKTOP_BREAKPOINT;
                    const shouldBeSticky = scrollPosition > this.CONFIG.STICKY_HEADER_OFFSET;
                    
                    if (this.elements.header && !isDesktop) {
                        this.elements.header.classList.toggle('scrolled', shouldBeSticky);
                    }
                    if (this.elements.nav && isDesktop) {
                        this.elements.nav.classList.toggle('scrolled', shouldBeSticky);
                    }

                    if (this.elements.backToTopButton) {
                        this.elements.backToTopButton.classList.toggle('visible', scrollPosition > this.CONFIG.BACK_TO_TOP_OFFSET);
                    }

                    this.isScrollTicking = false;
                });
                this.isScrollTicking = true;
            }
        },

        initGlobalListeners() {
            window.addEventListener('scroll', this.handleScroll.bind(this));
        },

    };

    App.init();

});
