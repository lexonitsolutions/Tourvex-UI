/*-----------------------------------------------------------------------------------
    Theme Name: Tourvex Template
    Theme URI: https://duruthemes.com/demo/html/tourvex
    Description: Travel Agency Template
    Author: DuruThemes
    Author URI: https://themeforest.net/user/duruthemes
    Version: 1.0
    
    ==========================================================================
    TABLE OF CONTENTS
    ==========================================================================
    1. GSAP CONFIG
    2. DOCUMENT READY & WOW ANIMATION
    3. CURSOR ANIMATION
    4. SMOOTH SCROLL NAV (SCROLLIT)
    5. ONEPAGE MENU CLICK
    6. NAVBAR SCROLL BACKGROUND
    7. MOBILE MENU CLOSE
    8. ROLLING TEXT
    9. DYNAMIC BACKGROUND IMAGE
    10. YOUTUBE POPUP
    11. MAGNIFIC POPUP
    12. ISOTOPE GALLERY
    13. SCROLL BACK TO TOP
    14. ACCORDION FAQ
    15. CUSTOM MAGNIFIC POPUP
    16. BUTTON ACTIVE TOGGLE
    17. GSAP SVG PRELOADER
    18. GSAP SCROLLTRIGGER ANIMATIONS
    19. MARQUEE
    20. COUNTER
    21. SWIPER SLIDER
    22. TESTIMONIALS 2 OWLCAROUSEL
    23. WINDOW LOAD
    24. ELASTIC CARD ANIMATION
    25. TEAM SLIDER
    26. GALLERY SCROLL SLIDER
    27. TRAVEL HERO SLIDER
-----------------------------------------------------------------------------------*/

(function ($) {
    "use strict";

    var wind = $(window);

    /* ==========================================================================
       1. GSAP CONFIG
       ========================================================================== */
    if (typeof gsap !== "undefined") {
        gsap.config({
            nullTargetWarn: false
        });
        if (typeof ScrollTrigger !== "undefined") {
            gsap.registerPlugin(ScrollTrigger);
        }
    }

    /* ==========================================================================
       2. DOCUMENT READY
       ========================================================================== */
    $(document).ready(function () {

        /* ==========================================================================
           WOW ANIMATION
           ========================================================================== */
        if (typeof WOW !== "undefined") {
            var wow = new WOW({
                animateClass: 'animated',
                offset: 100
            });
            wow.init();
        }

        /* ==========================================================================
           3. CURSOR ANIMATION
           ========================================================================== */
        (function () {
            const link = document.querySelectorAll('.hover-this');
            const cursor = document.querySelector('.cursor');
            if (!cursor) return;
            
            const animateit = function (e) {
                const hoverAnim = this.querySelector('.hover-anim');
                if (!hoverAnim) return;
                const { offsetX: x, offsetY: y } = e;
                const { offsetWidth: width, offsetHeight: height } = this;
                const move = 100;
                const xMove = x / width * (move * 2) - move;
                const yMove = y / height * (move * 2) - move;
                
                hoverAnim.style.transform = `translate(${xMove}px, ${yMove}px)`;
                if (e.type === 'mouseleave') {
                    hoverAnim.style.transform = '';
                }
            };
            
            const editCursor = e => {
                const { clientX: x, clientY: y } = e;
                cursor.style.left = x + 'px';
                cursor.style.top = y + 'px';
            };
            
            link.forEach(b => b.addEventListener('mousemove', animateit));
            link.forEach(b => b.addEventListener('mouseleave', animateit));
            window.addEventListener('mousemove', editCursor);
            
            $("a, .cursor-pointer").hover(function () {
                $(".cursor").addClass("cursor-active");
            }, function () {
                $(".cursor").removeClass("cursor-active");
            });
        })();

        /* ==========================================================================
           4. SMOOTH SCROLL NAV (SCROLLIT)
           ========================================================================== */
        if ($.scrollIt) {
            $.scrollIt({
                upKey: 38,
                downKey: 40,
                easing: 'linear',
                scrollTime: 600,
                activeClass: 'active',
                onPageChange: null,
                topOffset: -100
            });
        }

        /* ==========================================================================
           5. ONEPAGE MENU CLICK
           ========================================================================== */
        $('a[data-scroll-nav]').on('click', function (e) {
            var href = $(this).attr('href');
            if (href && href !== "#" && href !== "javascript:void(0)") {
                return;
            }
            e.preventDefault();
            var target = parseInt($(this).attr('data-scroll-nav'), 10);
            var targetSection = $('[data-scroll-index="' + target + '"]');
            if (targetSection.length) {
                $('html, body').animate({
                    scrollTop: targetSection.offset().top - 100
                }, 600);
            }
            if ($('.navbar-collapse').hasClass('show')) {
                $('.navbar-collapse').collapse('hide');
            }
        });

        /* ==========================================================================
           6. NAVBAR SCROLL BACKGROUND
           ========================================================================== */
        wind.on("scroll", function () {
            var bodyScroll = wind.scrollTop(),
                navbar = $(".navbar"),
                logo = $(".navbar .logo > img");
            if (bodyScroll > 100) {
                navbar.addClass("nav-scroll");
            } else {
                navbar.removeClass("nav-scroll");
            }
            logo.attr('src', '/images/karnish-logo.png');
        });

        /* ==========================================================================
           7. MOBILE MENU CLOSE
           ========================================================================== */
        $(document).on('click', '.navbar-nav .dropdown-item a', function () {
            $(".navbar-collapse").removeClass("show");
        });

        /* ==========================================================================
           8. ROLLING TEXT
           ========================================================================== */
        $('.rolling-text').each(function () {
            const $el = $(this);
            const innerText = $el.text();
            $el.empty();
            const $textContainer = $('<div>').addClass('block');
            for (const letter of innerText) {
                const $span = $('<span>').addClass('letter').text(letter.trim() === '' ? '\xa0' : letter);
                $textContainer.append($span);
            }
            $el.append($textContainer).append($textContainer.clone());
        });
        $(document).on('mouseenter', '.rolling-text', function () {
            $(this).removeClass('play');
        });
        
        

        /* ==========================================================================
           9. DYNAMIC BACKGROUND IMAGE
           ========================================================================== */
        var pageSection = $(".bg-img, section");
        pageSection.each(function () {
            if ($(this).attr("data-background")) {
                $(this).css("background-image", "url(" + $(this).data("background") + ")");
            }
        });

        /* ==========================================================================
           10. YOUTUBE POPUP
           ========================================================================== */
        $(document).on('click', 'a.vid', function (e) {
            e.preventDefault();
            if ($(this).YouTubePopUp) {
                $(this).YouTubePopUp();
            }
        });

        /* ==========================================================================
           11. MAGNIFIC POPUP
           ========================================================================== */
        if ($.fn.magnificPopup) {
            $('.gallery').magnificPopup({
                delegate: '.popimg',
                type: 'image',
                gallery: {
                    enabled: true
                }
            });
            $(".img-zoom").magnificPopup({
                type: "image",
                closeOnContentClick: true,
                mainClass: "mfp-fade",
                gallery: {
                    enabled: true,
                    navigateByImgClick: true,
                    preload: [0, 1]
                }
            });
            $('.magnific-youtube, .magnific-vimeo, .magnific-custom').magnificPopup({
                disableOn: 700,
                type: 'iframe',
                mainClass: 'mfp-fade',
                removalDelay: 300,
                preloader: false,
                fixedContentPos: false
            });
            $('.image-popup-vertical-fit').magnificPopup({
                type: 'image',
                closeOnContentClick: true,
                mainClass: 'mfp-img-mobile',
                image: {
                    verticalFit: true
                }
            });
        }

        /* ==========================================================================
           12. ISOTOPE GALLERY
           ========================================================================== */
        var $grid = $('.gallery-wrap');
        if ($grid.length && $.fn.isotope) {
            $grid.isotope({
                itemSelector: '.gallery-item',
                percentPosition: true,
                layoutMode: 'masonry',
                transitionDuration: '0.6s'
            });
            if ($.fn.imagesLoaded) {
                $grid.imagesLoaded(function () {
                    $grid.isotope('layout');
                    if (typeof ScrollTrigger !== 'undefined') {
                        ScrollTrigger.refresh();
                    }
                });
            }
            $('.gallery-filter li').on('click', function () {
                $('.gallery-filter li').removeClass('active');
                $(this).addClass('active');
                var filterValue = $(this).attr('data-filter');
                $grid.isotope({
                    filter: filterValue
                });
                setTimeout(function () {
                    $grid.isotope('layout');
                }, 50);
            });
        }
        
        if ($.fn.isotope) {
            $('.tours-isotope').isotope({
                itemSelector: '.items'
            });
        }

        /* ==========================================================================
           13. SCROLL BACK TO TOP
           ========================================================================== */
        var progressPath = document.querySelector('.progress-wrap path');
        if (progressPath) {
            var pathLength = progressPath.getTotalLength();
            progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
            progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
            progressPath.style.strokeDashoffset = pathLength;
            progressPath.getBoundingClientRect();
            progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';
            var updateProgress = function () {
                var scroll = $(window).scrollTop();
                var height = $(document).height() - $(window).height();
                var progress = pathLength - (scroll * pathLength / height);
                progressPath.style.strokeDashoffset = progress;
            };
            updateProgress();
            $(window).on('scroll', updateProgress);
            var offset = 150;
            var duration = 550;
            jQuery(window).on('scroll', function () {
                if (jQuery(this).scrollTop() > offset) {
                    jQuery('.progress-wrap').addClass('active-progress');
                } else {
                    jQuery('.progress-wrap').removeClass('active-progress');
                }
            });
            jQuery('.progress-wrap').on('click', function (event) {
                event.preventDefault();
                jQuery('html, body').animate({
                    scrollTop: 0
                }, duration);
                return false;
            });
        }

        /* ==========================================================================
           14. ACCORDION FAQ
           ========================================================================== */
        if ($(".accordion-box").length) {
            $(document).on("click", ".accordion-box .acc-btn", function () {
                var outerBox = $(this).closest(".accordion-box");
                var target = $(this).closest(".accordion");
                if ($(this).next(".acc-content").is(":visible")) {
                    $(this).removeClass("active");
                    $(this).next(".acc-content").slideUp(300);
                    outerBox.children(".accordion").removeClass("active-block");
                } else {
                    outerBox.find(".accordion .acc-btn").removeClass("active");
                    $(this).addClass("active");
                    outerBox.children(".accordion").removeClass("active-block");
                    outerBox.find(".accordion").children(".acc-content").slideUp(300);
                    target.addClass("active-block");
                    $(this).next(".acc-content").slideDown(300);
                }
            });
        }

        /* ==========================================================================
           15. CUSTOM MAGNIFIC POPUP
           ========================================================================== */
        $(document).on('click', '.popup-img', function (e) {
            e.preventDefault();
            var src = $(this).attr('href') || $(this).data('src');
            var galleryName = $(this).data('gallery');
            var items;
            var galleryEnabled = false;
            var index = 0;
            if (galleryName) {
                items = $('.popup-img').filter('[data-gallery="' + galleryName + '"]').map(function () {
                    return {
                        src: $(this).attr('href') || $(this).data('src')
                    };
                }).get();
                galleryEnabled = true;
                index = items.findIndex(function (it) {
                    return it.src === src;
                });
            } else {
                items = {
                    src: src
                };
            }
            $.magnificPopup.open({
                items: items,
                type: 'image',
                gallery: {
                    enabled: galleryEnabled
                },
                image: {
                    markup: '<div class="mfp-figure">' + '<div class="close-btn close-icon" role="button">&#215;</div>' + '<div class="mfp-img"></div>' + '<div class="close-btn close-bottom" role="button">閉じる</div>' + '</div>'
                },
                index: index,
                callbacks: {
                    open: function () {
                        $(document).off('click.mfpClose', '.close-btn').on('click.mfpClose', '.close-btn', function () {
                            $.magnificPopup.close();
                        });
                    },
                    close: function () {
                        $(document).off('click.mfpClose', '.close-btn');
                    }
                }
            });
        });

        /* ==========================================================================
           16. BUTTON ACTIVE TOGGLE
           ========================================================================== */
        $(document).on('click', '.butn-arrow, .butn-arrow2', function () {
            $(this).toggleClass('active');
        });

        /* ==========================================================================
           17. GSAP SVG PRELOADER
           ========================================================================== */
        if (typeof gsap !== "undefined") {
            const svg = document.getElementById("svg");
            if (svg) {
                const tl = gsap.timeline();
                const curve = "M0 502S175 272 500 272s500 230 500 230V0H0Z";
                const flat = "M0 2S175 1 500 1s500 1 500 1V0H0Z";
                tl.to(".loader-wrap-heading .load-text, .loader-wrap-heading .cont", {
                    delay: 1.5,
                    y: -100,
                    opacity: 0,
                });
                tl.to(svg, {
                    duration: 0.5,
                    attr: {
                        d: curve
                    },
                    ease: "power2.easeIn",
                }).to(svg, {
                    duration: 0.5,
                    attr: {
                        d: flat
                    },
                    ease: "power2.easeOut",
                });
                tl.to(".loader-wrap", {
                    y: -1500,
                });
                tl.to(".loader-wrap", {
                    zIndex: -1,
                    display: "none",
                });
                tl.from("header", {
                    y: 200,
                }, "-=1.5");
                tl.from("header .container", {
                    y: 40,
                    opacity: 0,
                    delay: 0.3,
                }, "-=1.5");
            }
        }
        
        

        /* ==========================================================================
           18. GSAP SCROLLTRIGGER ANIMATIONS
           ========================================================================== */
        if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
            function createScrollAnimation(selector, options) {
                gsap.utils.toArray(selector).forEach((el) => {
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: el,
                            scrub: options.scrub || 1,
                            start: options.start || "top 90%",
                            end: options.end || "bottom 60%",
                            toggleActions: "play none none reverse",
                            markers: false
                        }
                    });

                    tl.set(el, {
                        transformOrigin: 'center center'
                    });

                    if (options.fromTo) {
                        tl.fromTo(el, options.from, options.to);
                    } else {
                        tl.from(el, options.from, options.to);
                    }
                });
            }
            
            // Section effects
            createScrollAnimation('.duru-section-scale-bg-reveal', {
                start: "top 80%",
                end: "bottom 60%",
                from: { background: "#171717", scale: .8 },
                to: { background: "inherit", scale: 1, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-section-shrink', {
                scrub: 1, start: "top 80%", end: "bottom 20%", fromTo: true,
                from: { scale: 1, opacity: 1 },
                to: { scale: 0.9, opacity: 0.6, ease: "none" }
            });
            // CTA / UI effects
            createScrollAnimation('.duru-cta-slide-up', {
                start: "top 90%", end: "top 70%",
                from: { opacity: 1, y: "+=300" },
                to: { opacity: 1, y: 0, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-popup-scale-in', {
                start: "top 95%", end: "top 70%", fromTo: true,
                from: { scale: 0 },
                to: { scale: 1, duration: .5, immediateRender: false }
            });
            // Slide / Move animations
            createScrollAnimation('.duru-slide-left', {
                from: { x: "-=100" },
                to: { x: 0, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-slide-right', {
                from: { x: "+=100" },
                to: { x: 0, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-slide-up', {
                start: "top 85%",
                from: { y: "+=100" },
                to: { y: 0, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-slide-down', {
                start: "top 85%",
                from: { y: "-=100" },
                to: { y: 0, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-move-from-right', {
                start: "top 85%", end: "bottom 60%", scrub: 1, fromTo: true,
                from: { opacity: 0, scale: 0.8, xPercent: 100, transformOrigin: "center center" },
                to: { opacity: 1, scale: 1, xPercent: 0, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-move-from-left', {
                start: "top 85%", end: "bottom 60%", scrub: 1, fromTo: true,
                from: { opacity: 0, scale: 0.8, xPercent: -100, transformOrigin: "center center" },
                to: { opacity: 1, scale: 1, xPercent: 0, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-image-slide-right', {
                scrub: 2, start: "top 80%", end: "top 70%", fromTo: true,
                from: { xPercent: -100 },
                to: { xPercent: 0, duration: 1, immediateRender: false }
            });
            // Zoom / Scale animations
            createScrollAnimation('.duru-image-zoom', {
                start: "top 85%", fromTo: true, target: 'img', scrub: 0.3,
                from: { scale: 1 },
                to: { scale: 1.5, ease: "none", immediateRender: false }
            });
            createScrollAnimation('.duru-zoom-out', {
                start: "top 85%", fromTo: true,
                from: { scale: 1 },
                to: { scale: 0, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-scale-down-large', {
                start: "top 85%", end: "bottom 50%", fromTo: true,
                from: { scale: 2 },
                to: { scale: 1, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-scale-down-medium', {
                start: "top 85%", end: "bottom 50%", fromTo: true,
                from: { scale: 1.5 },
                to: { scale: 1, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-scale-in', {
                start: "top 95%", end: "top 70%", fromTo: true,
                from: { scale: .8 },
                to: { scale: 1, duration: .5, immediateRender: false }
            });
            createScrollAnimation('.duru-bounce-reveal', {
                start: "top 85%",
                from: { scale: 0.6, opacity: 0 },
                to: { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.5)" }
            });
            // Text animations
            createScrollAnimation('.duru-text-color-light', {
                start: "top 70%", end: "bottom 40%", fromTo: true,
                from: { color: "#171717" },
                to: { color: "#fff", duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-stagger-reveal', {
                start: "top 85%", fromTo: true,
                from: { opacity: 0, y: 40 },
                to: { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power3.out" }
            });
            createScrollAnimation('.duru-text-blur-reveal', {
                start: "top 85%",
                from: { opacity: 0, y: 20, filter: "blur(6px)" },
                to: { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.05 }
            });
            // Reveal / Mask effects
            createScrollAnimation('.duru-reveal-up', {
                start: "top 85%", fromTo: true,
                from: { clipPath: "inset(0 0 100% 0)", opacity: 0, y: 30 },
                to: { clipPath: "inset(0 0 0% 0)", opacity: 1, y: 0, duration: 1, ease: "power3.out", immediateRender: false }
            });
            createScrollAnimation('.duru-clip-expand', {
                scrub: 2, start: "top 80%", end: "top 60%", fromTo: true,
                from: { clipPath: "polygon(30% 0, 70% 0, 70% 100%, 30% 100%)" },
                to: { clipPath: "polygon(0% 0, 100% 0, 100% 100%, 0% 100%)", duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-mask-reveal-horizontal', {
                start: "top 85%", fromTo: true,
                from: { clipPath: "inset(0 100% 0 0)" },
                to: { clipPath: "inset(0 0% 0 0)", duration: 1, ease: "power4.out" }
            });
            // Rotate / 3D effects
            createScrollAnimation('.duru-rotate-scale-reveal', {
                from: { opacity: 1, rotateZ: 45, scale: 0.5, y: "+=100" },
                to: { opacity: 1, rotateZ: 0, scale: 1, y: 0, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-rotate-on-scroll', {
                scrub: 3, start: "top 70%", end: "top 50%", fromTo: true,
                from: { rotateZ: 360 },
                to: { rotateZ: 0, duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-flip-3d', {
                start: "top 85%", fromTo: true,
                from: { rotationX: 60, opacity: 0, transformPerspective: 1000 },
                to: { rotationX: 0, opacity: 1, duration: 1, ease: "power3.out" }
            });
            // Image / Parallax effects
            createScrollAnimation('.duru-background-parallax', {
                scrub: 1, start: "top bottom", end: "bottom top", fromTo: true,
                from: { backgroundPosition: "50% 0%" },
                to: { backgroundPosition: "50% 100%", ease: "none" }
            });
            createScrollAnimation('.duru-image-parallax', {
                scrub: 1.2, start: "top bottom", end: "bottom top", fromTo: true,
                from: { scale: 1.2, y: -50 },
                to: { scale: 1, y: 50, ease: "none" }
            });
            createScrollAnimation('.duru-horizontal-parallax', {
                scrub: 1, start: "top bottom", end: "bottom top", fromTo: true,
                from: { x: -200 },
                to: { x: 200, ease: "none" }
            });
            createScrollAnimation('.duru-vertical-parallax', {
                scrub: 1, start: "top bottom", end: "bottom top", fromTo: true,
                from: { y: -200 },
                to: { y: 200, ease: "none" }
            });
            // Color / Filter effects
            createScrollAnimation('.duru-bg-dark-transition', {
                start: "top 70%", end: "bottom 40%", fromTo: true,
                from: { backgroundColor: "var(--clr-primary)" },
                to: { backgroundColor: "#171717", duration: 1, immediateRender: false }
            });
            createScrollAnimation('.duru-hue-rotate', {
                scrub: 1, start: "top 80%", end: "bottom 20%", fromTo: true,
                from: { filter: "hue-rotate(0deg)" },
                to: { filter: "hue-rotate(180deg)", ease: "none" }
            });
        }

        /* ==========================================================================
           19. MARQUEE
           ========================================================================== */
        if ($.fn.marquee) {
            $('.js-marquee-wrapper').marquee({
                speed: 100,
                gap: 30,
                delayBeforeStart: 0,
                direction: 'left',
                duplicated: true,
                pauseOnHover: true,
                startVisible: true,
            });
        }

        /* ==========================================================================
           20. COUNTER
           ========================================================================== */
        if ($.fn.counterUp) {
            $('.counter').counterUp({
                delay: 10,
                time: 3000
            });
        }

        /* ==========================================================================
           21. SWIPER SLIDER
           ========================================================================== */
        if (typeof Swiper !== "undefined") {
            var parallaxSlider;
            var parallaxSliderOptions = {
                speed: 1000,
                autoplay: true,
                parallax: true,
                loop: true,
                on: {
                    init: function () {
                        var swiper = this;
                        for (var i = 0; i < swiper.slides.length; i++) {
                            $(swiper.slides[i]).find('.bg-img').attr({
                                'data-swiper-parallax': 0.75 * swiper.width
                            });
                        }
                    },
                    resize: function () {
                        this.update();
                    }
                },
                pagination: {
                    el: '.slider-prlx .parallax-slider .swiper-pagination',
                    type: 'fraction',
                    clickable: true
                },
                navigation: {
                    nextEl: '.slider-prlx .parallax-slider .next-ctrl',
                    prevEl: '.slider-prlx .parallax-slider .prev-ctrl'
                }
            };
            parallaxSlider = new Swiper('.slider-prlx .parallax-slider', parallaxSliderOptions);

            var swiperTestim = new Swiper('.swiper-testim', {
                spaceBetween: 0,
                speed: 1000,
                loop: true,
                pagination: {
                    el: '.swiper-testim .swiper-pagination',
                },
                navigation: {
                    nextEl: '.swiper-testim .swiper-button-next',
                    prevEl: '.swiper-testim .swiper-button-prev'
                },
            });

            var swiperTestimImg = new Swiper('.testimonials .swiper-img', {
                slidesPerView: 1,
                spaceBetween: 0,
                speed: 800,
                loop: true,
                effect: 'fade',
                pagination: {
                    el: '.testimonials .controls .swiper-pagination',
                    type: 'fraction',
                },
                navigation: {
                    nextEl: '.testimonials .controls .next-ctrl',
                    prevEl: '.testimonials .controls .prev-ctrl'
                },
            });

            var swiperTestimContent = new Swiper('.testimonials .swiper-content', {
                slidesPerView: 1,
                spaceBetween: 0,
                speed: 800,
                loop: true,
                pagination: {
                    el: '.testimonials .controls .swiper-pagination',
                    type: 'fraction',
                },
                navigation: {
                    nextEl: '.testimonials .controls .next-ctrl',
                    prevEl: '.testimonials .controls .prev-ctrl'
                },
            });

            var swiperWork = new Swiper(".work-crsol", {
                slidesPerView: "auto",
                spaceBetween: 60,
                loop: true
            });
        }
        
        /* ==========================================================================
           22. TESTIMONIALS 2 OWLCAROUSEL
           ========================================================================== */
        $('.testimonials2').each(function (index, value) {
            var valueObj = $(value),
                totalWidth = valueObj.outerWidth(),
                slidingLength = valueObj.find('.item').length,
                devideRightPadding = parseInt(valueObj.css('padding-right')) / slidingLength,
                devideLeftPadding = parseInt(valueObj.css('padding-left')) / slidingLength,
                usageWidth = (slidingLength * 12.5) + 12.5 + devideRightPadding + devideLeftPadding,
                useWidth = totalWidth - usageWidth,
                devideLength = slidingLength + 1,
                devideWidth = (useWidth / devideLength),
                activeWidth = devideWidth * 2;
            valueObj.find('.item, .img, .item .cont').css('width', devideWidth);
            valueObj.find('.item .cont').css('left', devideWidth);
            valueObj.find('.item.active').css('width', activeWidth);
            $(document).on('mouseenter', '.testimonials2 .item', function () {
                $(this).siblings().removeClass('active');
                $(this).addClass('active');
                valueObj.find('.item, .img, .item .cont').css('width', devideWidth);
                valueObj.find('.item .cont').css('left', devideWidth);
                valueObj.find('.item.active').css('width', activeWidth);
            });
        });

    });

    /* ==========================================================================
       23. WINDOW LOAD
       ========================================================================== */
    wind.on("load", function () {
        var body = $('body');
        body.addClass('loaded');
        setTimeout(function () {
            body.removeClass('loaded');
        }, 1500);
    });
    
    /* ==========================================================================
        24. ELASTIC CARD ANIMATION
        ========================================================================== */
        if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
            const elasticCards = gsap.utils.toArray(".image-stack-card");
            if (elasticCards.length) {
                elasticCards.forEach((card, i) => {
                    card.style.zIndex = elasticCards.length - i;
                });
                const elasticTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".image-stack",
                        start: "top 80%",
                        end: "+=350",
                        scrub: 1
                    }
                });
                elasticCards.forEach((card, i) => {
                    const offset = i - (elasticCards.length - 1) / 2;
                    elasticTl.to(card, {
                        x: offset * 180,
                        rotation: offset * 8,
                        ease: "none"
                    }, 0);
                });
                let highestZ = elasticCards.length;
                elasticCards.forEach(card => {
                    card.addEventListener("mouseenter", () => {
                        highestZ++;
                        gsap.to(card, {
                            zIndex: highestZ,
                            scale: 1.05,
                            y: -10,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                    });
                    card.addEventListener("mouseleave", () => {
                        gsap.to(card, {
                            scale: 1,
                            y: 0,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                    });
                });
            }
        }
    
    /* ==========================================================================
        25. TEAM SLIDER
        ========================================================================== */
            var swiperTeam = new Swiper(".team-slider", {
                slidesPerView: 4,
                spaceBetween: 25,
                loop: true,
                speed: 900,
                autoplay: false,
                breakpoints: {
                    0: {
                        slidesPerView: 1
                    },
                    768: {
                        slidesPerView: 2
                    },
                    1200: {
                        slidesPerView: 4
                    }
                }
            });
    
    /* ==========================================================================
        26. GALLERY SCROLL SLIDER
        ========================================================================== */
            var swiperGalleryScroll = new Swiper(".galleryscroll-slider", {
                slidesPerView: 4,
                spaceBetween: 25,
                loop: true,
                speed: 900,
                autoplay: false,
                breakpoints: {
                    0: {
                        slidesPerView: 1
                    },
                    768: {
                        slidesPerView: 2
                    },
                    1200: {
                        slidesPerView: 4
                    }
                }
            });
    
    /* ==========================================================================
           18. STACKCARD ANIMATION
           ========================================================================== */
        if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
            var currentWidth = $(window).width();
            if (currentWidth > 991) {
                const fe = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".stsec .stack-title",
                        start: "center center",
                        endTrigger: ".stsec",
                        end: "bottom bottom",
                        pin: true,
                        pinSpacing: false,
                    }
                });
                let cardsList = gsap.utils.toArray(".stackCard");
                let stickDistance = 0;
                let lastCardST = ScrollTrigger.create({
                    trigger: cardsList[cardsList.length - 1],
                    start: "center center"
                });
                cardsList.forEach((card, index) => {
                    ScrollTrigger.create({
                        trigger: card,
                        start: "center center",
                        end: () => lastCardST.start + stickDistance,
                        pin: true,
                        pinSpacing: false,
                        scrub: true,
                        snap: true,
                        ease: "power4.out",
                        onUpdate: (self) => {
                            const progress = self.progress;
                            const EvenOdd = index % 2 === 0;
                            gsap.to(card, {
                                scaleX: 1 - progress * 0.2,
                                x: index * 20,
                                filter: `grayscale(${progress * 20}%)`,
                                top: index * 20,
                                rotate: EvenOdd ? -3 * progress : 3 * progress,
                            });
                        }
                    });
                });
            }
        }
    
    
    /* ==========================================================================
           19. TRAVEL HERO SLIDER
           ========================================================================== */
        if ($('.travel-hero-slider').length) {
            var travelHeroSlider = new Swiper(".travel-hero-slider", {
                grabCursor: true,
                speed: 500,
                effect: "slide",
                loop: false,
                mousewheel: {
                    invert: false,
                    sensitivity: 1,
                    releaseOnEdges: true,
                },
            });
            travelHeroSlider.enable();
        }
    
})(jQuery);