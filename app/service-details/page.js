"use client";

import Script from "next/script";

export default function ServiceDetails() {
  return (
    <>
      {/* Preloader */}
      <div className="loader-wrap">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path id="svg" d="M0,1005S175,995,500,995s500,5,500,5V0H0Z"></path>
        </svg>
        <div className="loader-wrap-heading">
          <div className="load-text"> <span>L</span> <span>o</span> <span>a</span> <span>d</span> <span>i</span> <span>n</span> <span>g</span> </div>
        </div>
      </div>
      {/* Cursor */}
      <div className="cursor"></div>
      {/* Progress scroll totop */}
      <div className="progress-wrap cursor-pointer">
        <svg className="progress-circle svg-content" width="100%" height="100%" viewBox="-1 -1 102 102">
          <path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"></path>
        </svg>
      </div>
      {/* Smooth-wrapper */}
      <div id="smooth-wrapper">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg">
          <div className="container">
            {/* Logo */}
            <div className="logo-wrapper">
              <a className="logo" href="/"><img src="/images/karnish-logo.png" className="logo-img karnish-logo" alt="Karnish Tourism LLC" /></a>
            </div>
            {/* Button */}
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar" aria-controls="navbar" aria-expanded="false" aria-label="Toggle navigation"> <span className="navbar-toggler-icon"><i className="ti-menu"></i></span> </button>
            {/* Menu */}
            <div className="collapse navbar-collapse" id="navbar">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item"><a className="nav-link" href="/"><span className="rolling-text">Home</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/about"><span className="rolling-text">About</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/tours"><span className="rolling-text">Tours</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/destination"><span className="rolling-text">Destinations</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/activities"><span className="rolling-text">Activities</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/services"><span className="rolling-text">Services</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/contact"><span className="rolling-text">Contact</span></a></li>
              </ul>
            </div>
          </div>
        </nav>
        <div id="smooth-content">
          <main className="o-hidden">
            {/* Header Banner */}
            <header className="pg-hero section-padding">
              <div className="container">
                <div className="row mb-60 justify-content-center">
                  <div className="col-md-5 text-center">
                    <div className="section-subtitle">Hotel & Accommodation</div>
                    <div className="section-title">Find <i>the perfect stay</i> for every journey</div>
                  </div>
                </div>
              </div>
              <div className="container-fluid">
                <div className="height1">
                  <div className="radius-mask">
                    <div className="bg-img height2" data-background="/images/service-details-hero.jpg" data-speed="0.5" data-lag="0"></div>
                  </div>
                </div>
              </div>
            </header>
            {/* Services Details */}
            <div className="service-details section-padding pb-0">
              <div className="container">
                <div className="row">
                  <div className="col-lg-7 col-md-12">
                    <h4>Overview</h4>
                    <p className="mb-30">Discover carefully selected hotels and accommodations that combine comfort, quality, and convenience. Whether you're looking for a luxury resort, a boutique hotel, or a cozy stay, we help you find the perfect place to relax and enjoy your journey.</p>
                    <div className="row">
                      <div className="col-md-12">
                        <h4>Experience Includes</h4>
                        <ul className="list-unstyled list">
                          <li>
                            <div className="list-icon"> <span className="ti-check"></span> </div>
                            <div className="list-text">
                              <p>Personalized stays tailored to your travel style</p>
                            </div>
                          </li>
                          <li>
                            <div className="list-icon"> <span className="ti-check"></span> </div>
                            <div className="list-text">
                              <p>Carefully selected hotels with comfort and elegance</p>
                            </div>
                          </li>
                          <li>
                            <div className="list-icon"> <span className="ti-check"></span> </div>
                            <div className="list-text">
                              <p>Seamless blend of convenience, quality, and experience</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 offset-lg-1 col-md-12">
                    <blockquote className="vert-move">
                      <p>At our travel agency, every journey is shaped by carefully crafted details that make your trip seamless and memorable.</p> <cite>Charles Eames</cite>
                    </blockquote>
                  </div>
                </div>
              </div>
            </div>
            {/* Image */}
            <section className="image-stack pt-30">
              <div className="image-stack-wrapper">
                <div className="image-stack-card">
                  <img src="/images/01_2.jpg" alt="" />
                </div>
                <div className="image-stack-card">
                  <img src="/images/02_2.jpg" alt="" />
                </div>
                <div className="image-stack-card">
                  <img src="/images/03_2.jpg" alt="" />
                </div>
                <div className="image-stack-card">
                  <img src="/images/04.jpg" alt="" />
                </div>
                <div className="image-stack-card">
                  <img src="/images/05.jpg" alt="" />
                </div>
              </div>
            </section>
            {/* Services Details */}
            <section className="service-details section-padding pt-30">
              <div className="container">
                <div className="row">
                  <div className="col-lg-7 col-md-12">
                    <h4>Frequently Asked Questions</h4>
                    <ul className="accordion-box clearfix">
                      <li className="accordion block">
                        <div className="acc-btn">How do I make a hotel reservation?</div>
                        <div className="acc-content">
                          <div className="content">
                            <p>You can easily book your stay through our website or by contacting our travel consultants for personalized assistance.</p> <i className="fa-thin fa-hotel"></i>
                          </div>
                        </div>
                      </li>
                      <li className="accordion block">
                        <div className="acc-btn">What is the check-in and check-out time?</div>
                        <div className="acc-content">
                          <div className="content">
                            <p>Check-in and check-out times vary by hotel, but we always provide full details before your booking is confirmed.</p> <i className="fa-thin fa-calendar"></i>
                          </div>
                        </div>
                      </li>
                      <li className="accordion block active-block">
                        <div className="acc-btn active">Can I modify or cancel my booking?</div>
                        <div className="acc-content" style={{ display: 'block' }}>
                          <div className="content">
                            <p>Yes, most reservations can be modified or canceled according to the hotel's policy. Our team is here to assist you with any changes.</p> <i className="fa-thin fa-plane"></i>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </main>
          {/* Footer */}
          <footer className="footer">
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-md-7 mb-45 text-center">
                  <div className="subscribe">
                    <div className="section-subtitle wow fadeInRight">Subscribe to travel</div>
                    <div className="section-title d-rotate wow mb-30"><span className="rotate-text text-white">Travel deals to your inbox<i>!</i></span></div>
                    <div className="newsletter">
                      <form action="#">
                        <input type="email" placeholder="Enter your email address" required />
                        <button type="submit"><i className="fa-light fa-arrow-right"></i></button>
                      </form>
                    </div>
                    <p>We are committed to protecting your <a href="#0" className="text-decoration-line-bottom">privacy policy.</a></p>
                  </div>
                </div>
              </div>
              {/* Instagram */}
              <div className="insta">
                <div className="container">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="item">
                        <div className="img">
                          <a href="#0"> <img src="/images/03_2.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="img">
                          <a href="#0"> <img src="/images/01_2.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="img">
                          <a href="#0"> <img src="/images/02_2.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="img">
                          <a href="#0"> <img src="/images/04.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="img">
                          <a href="#0"> <img src="/images/05.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="img">
                          <a href="#0"> <img src="/images/06.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="follow">
                          <a href="#0" className="text-bg"> <span><i className="fa-brands fa-instagram"></i> / Karnish Tourism</span></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom */}
            <div className="bottom">
              <div className="container">
                <div className="row">
                  <div className="col-lg-3 col-md-12">
                    <p>© All Rights Reserved <a href="https://lexonit.com" target="_blank">lexonit.com</a></p>
                  </div>
                  <div className="col-lg-7 col-md-12 text-center">
                    <div className="links">
                      <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/tours">Tours</a></li>
                        <li><a href="/destination">Destinations</a></li>
                        <li><a href="/blog">Blog</a></li>
                        <li><a href="/contact">Contact</a></li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-12">
                    <div className="social-icons text-end">
                      <ul className="list-inline">
                        <li><a href="#"><i className="fa-brands fa-instagram"></i></a></li>
                        <li><a href="#"><i className="fa-brands fa-twitter"></i></a></li>
                        <li><a href="#"><i className="fa-brands fa-dribbble"></i></a></li>
                        <li><a href="#"><i className="fa-brands fa-facebook-f"></i></a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-text-style5">Karnish Tourism</div>
          </footer>
        </div>
      </div>

      <Script id="script-jquery" src="/js/jquery-3.6.0.min.js" strategy="afterInteractive" />
      <Script id="script-jquery-migrate" src="/js/jquery-migrate-3.4.0.min.js" strategy="afterInteractive" />
      <Script id="script-plugins" src="/js/plugins.js" strategy="afterInteractive" />
      <Script id="script-imagesloaded" src="/js/imagesloaded.pkgd.min.js" strategy="afterInteractive" />
      <Script id="script-gsap" src="/js/gsap.min.js" strategy="afterInteractive" />
      <Script id="script-scrollsmoother" src="/js/ScrollSmoother.min.js" strategy="afterInteractive" />
      <Script id="script-scrolltrigger" src="/js/ScrollTrigger.min.js" strategy="afterInteractive" />
      <Script id="script-smoother-script" src="/js/smoother-script.js" strategy="afterInteractive" />
      <Script id="script-springer" src="/js/springer.min.js" strategy="afterInteractive" />
      <Script id="script-lenis" src="/js/lenis.min.js" strategy="afterInteractive" />
      <Script id="script-three" src="/js/three.min.js" strategy="afterInteractive" />
      <Script id="script-hover-effect" src="/js/hover-effect.umd.js" strategy="afterInteractive" />
      <Script id="script-custom" src="/js/custom.js" strategy="afterInteractive" />
    </>
  );
}
