"use client";

import Script from "next/script";

export default function TourDetails() {
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
            <header className="pg-hero section-padding">
              <div className="container">
                <div className="row mb-60 justify-content-center">
                  <div className="col-md-6 text-center">
                    <div className="section-subtitle">Explore Our Tours</div>
                    <div className="section-title">Maldives Paradise Escape</div>
                  </div>
                </div>
              </div>
              <div className="container-fluid">
                <div className="height1">
                  <div className="radius-mask">
                    <div className="bg-img height2" data-background="/images/destination-01.jpg" data-speed="0.5" data-lag="0"></div>
                  </div>
                </div>
              </div>
            </header>
            {/* Tour Details */}
            <section className="tour-details stsec section-padding">
              <div className="container">
                <div className="row justify-content-center">
                  <div className="col-lg-6 col-md-12 mb-30">
                    <h4>Overview</h4>
                    <p className="mb-30">Escape to pure paradise with our Maldives Paradise Escape tour. Experience crystal-clear turquoise waters, white sandy beaches, and luxurious island resorts. This carefully designed package offers the perfect balance of relaxation, adventure, and unforgettable tropical beauty.</p>
                    <h4>Tour Highlights</h4>
                    <ul className="page-list list-unstyled mb-30">
                      <li>
                        <div className="page-list-icon"> <span className="ti-check"></span> </div>
                        <div className="page-list-text">
                          <p>Stay in a five star beachfront resort</p>
                        </div>
                      </li>
                      <li>
                        <div className="page-list-icon"> <span className="ti-check"></span> </div>
                        <div className="page-list-text">
                          <p>Direct access to private beaches</p>
                        </div>
                      </li>
                      <li>
                        <div className="page-list-icon"> <span className="ti-check"></span> </div>
                        <div className="page-list-text">
                          <p>Sunset cruises and dolphin watching</p>
                        </div>
                      </li>
                    </ul>
                    <h4>Best Time to Visit</h4>
                    <p className="mb-30">November – April (dry season, best weather conditions)</p>
                    <h4>Who is it for?</h4>
                    <p className="mb-30">Couples, honeymooners, families, and luxury travel lovers</p>
                    <h4>Included Services</h4>
                    <ul className="page-list list-unstyled mb-30">
                      <li>
                        <div className="page-list-icon"> <span className="ti-check"></span> </div>
                        <div className="page-list-text">
                          <p>Daily breakfast</p>
                        </div>
                      </li>
                      <li>
                        <div className="page-list-icon"> <span className="ti-check"></span> </div>
                        <div className="page-list-text">
                          <p>Guided island activities</p>
                        </div>
                      </li>
                      <li>
                        <div className="page-list-icon"> <span className="ti-check"></span> </div>
                        <div className="page-list-text">
                          <p>Welcome assistance on arrival</p>
                        </div>
                      </li>
                    </ul>
                    <h4>Not Included</h4>
                    <ul className="page-list list-unstyled">
                      <li>
                        <div className="page-list-icon"> <span className="ti-check"></span> </div>
                        <div className="page-list-text">
                          <p>International flights</p>
                        </div>
                      </li>
                      <li>
                        <div className="page-list-icon"> <span className="ti-check"></span> </div>
                        <div className="page-list-text">
                          <p>Personal expenses</p>
                        </div>
                      </li>
                      <li>
                        <div className="page-list-icon"> <span className="ti-check"></span> </div>
                        <div className="page-list-text">
                          <p>Optional tours & activities</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="col-lg-4 offset-lg-1 col-md-12">
                    <div className="cont stack-title">
                      <h4>Tour Details</h4>
                      <div className="item">
                        <div className="icon"><i className="fa-light fa-calendar-alt"></i></div>
                        <div className="title">Tour Date</div>
                        <div className="value">26.05.2027</div>
                      </div>
                      <div className="item">
                        <div className="icon"><i className="fa-light fa-people-group"></i></div>
                        <div className="title">Group</div>
                        <div className="value">15 - 20 People</div>
                      </div>
                      <div className="item">
                        <div className="icon"><i className="fa-light fa-hourglass-start"></i></div>
                        <div className="title">Duration</div>
                        <div className="value">6 Days - 5 Nights</div>
                      </div>
                      <div className="item">
                        <div className="icon"><i className="fa-light fa-map-marker-alt"></i></div>
                        <div className="title">Location</div>
                        <div className="value">Maldives, Asia</div>
                      </div>
                      <div className="item">
                        <div className="icon status-completed"><i className="fa-light fa-circle-check"></i></div>
                        <div className="title">Status</div>
                        <div className="value status-completed">Completed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Gallery Scroll Image */}
            <section className="galleryscroll section-padding pt-0">
              <div className="container-fluid p-0 box-right-7">
                <div className="row">
                  <div className="col-md-12">
                    <div className="swiper galleryscroll-slider">
                      <div className="swiper-wrapper">
                        <div className="swiper-slide">
                          <div className="item">
                            <a href="/images/destination-a.jpg" title="" className="img-zoom">
                              <div className="img"> <img src="/images/destination-a.jpg" className="img-fluid mx-auto d-block" alt="" /> </div>
                            </a>
                          </div>
                        </div>
                        <div className="swiper-slide">
                          <div className="item">
                            <a href="/images/destination-b.jpg" title="" className="img-zoom">
                              <div className="img"> <img src="/images/destination-b.jpg" className="img-fluid mx-auto d-block" alt="" /> </div>
                            </a>
                          </div>
                        </div>
                        <div className="swiper-slide">
                          <div className="item">
                            <a href="/images/destination-c.jpg" title="" className="img-zoom">
                              <div className="img"> <img src="/images/destination-c.jpg" className="img-fluid mx-auto d-block" alt="" /> </div>
                            </a>
                          </div>
                        </div>
                        <div className="swiper-slide">
                          <div className="item">
                            <a href="/images/destination-d.jpg" title="" className="img-zoom">
                              <div className="img"> <img src="/images/destination-d.jpg" className="img-fluid mx-auto d-block" alt="" /> </div>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Next & Prev */}
            <section className="nex-prv">
              <div className="container">
                <div className="row">
                  <div className="col-md-5 rest">
                    <div className="prv">
                      <div className="img bg-img" data-background="/images/destination-03.jpg">
                        <div className="text-left ontop">
                          <h5><a href="/tour-details">Dubai Luxury Journey</a></h5>
                        </div>
                        <div className="overly"></div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 text-center rest">
                    <a href="/tours" className="all-works d-flex align-items-center"> <span className="icon full-width ti-layout-grid3"></span> </a>
                  </div>
                  <div className="col-md-5 rest">
                    <div className="nxt">
                      <div className="img bg-img" data-background="/images/destination-02.jpg">
                        <div className="text-right ontop">
                          <h5><a href="/tour-details">Canadian Nature Tour</a></h5>
                        </div>
                        <div className="overly"></div>
                      </div>
                    </div>
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
