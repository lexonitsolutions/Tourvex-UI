"use client";

import Script from "next/script";

export default function Blog() {
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
                    <div className="section-subtitle">Latest Travel News</div>
                    <div className="section-title">Stories that inspire your <i>next adventure</i></div>
                  </div>
                </div>
              </div>
              <div className="container-fluid">
                <div className="height1">
                  <div className="radius-mask">
                    <div className="bg-img height2" data-background="/images/8.jpg" data-speed="0.5" data-lag="0"></div>
                  </div>
                </div>
              </div>
            </header>
            {/* Blog */}
            <section className="blog-home section-padding">
              <div className="container">
                <div className="row">
                  <div className="col-lg-8 col-md-12">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="item bg-img" data-background="/images/blog-1.jpg">
                          <div className="content">
                            <div className="info">
                              <a href="/blog"> <span><i className="ti-time"></i>28 Dec 2026</span> </a>
                            </div>
                            <a href="/post">
                              <h5>Exploring the hidden Maldives paradise</h5>
                            </a>
                            <p>Discover a world where turquoise waters meet endless white sands in the heart of the Indian Ocean.</p>
                            <div className="arrow"> <a href="/post"><i className="ti-arrow-top-right"></i></a> </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="item bg-img" data-background="/images/blog-2.jpg">
                          <div className="content">
                            <div className="info">
                              <a href="/blog"> <span><i className="ti-time"></i>26 Dec 2026</span> </a>
                            </div>
                            <a href="/post">
                              <h5>Journey through Canada&apos;s wild beauty</h5>
                            </a>
                            <p>Discover vast landscapes of towering mountains, crystal-clear lakes, and endless forests across Canada.</p>
                            <div className="arrow"> <a href="/post"><i className="ti-arrow-top-right"></i></a> </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="item bg-img" data-background="/images/blog-3.jpg">
                          <div className="content">
                            <div className="info">
                              <a href="/blog"> <span><i className="ti-time"></i>24 Dec 2026</span> </a>
                            </div>
                            <a href="/post">
                              <h5>Experience the luxury of modern Dubai</h5>
                            </a>
                            <p>Discover a city where futuristic skylines meet golden deserts, blending luxury and innovation.</p>
                            <div className="arrow"> <a href="/post"><i className="ti-arrow-top-right"></i></a> </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="item bg-img" data-background="/images/blog-4.jpg">
                          <div className="content">
                            <div className="info">
                              <a href="/blog"> <span><i className="ti-time"></i>22 Dec 2026</span> </a>
                            </div>
                            <a href="/post">
                              <h5>Experience the spirit of Africa</h5>
                            </a>
                            <p>Discover a continent where vast savannas, stunning landscapes create an unforgettable journey of adventure.</p>
                            <div className="arrow"> <a href="/post"><i className="ti-arrow-top-right"></i></a> </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="item bg-img" data-background="/images/blog-1.jpg">
                          <div className="content">
                            <div className="info">
                              <a href="/blog"> <span><i className="ti-time"></i>28 Dec 2026</span> </a>
                            </div>
                            <a href="/post">
                              <h5>Exploring the hidden Maldives paradise</h5>
                            </a>
                            <p>Discover a world where turquoise waters meet endless white sands in the heart of the Indian Ocean.</p>
                            <div className="arrow"> <a href="/post"><i className="ti-arrow-top-right"></i></a> </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="item bg-img" data-background="/images/blog-2.jpg">
                          <div className="content">
                            <div className="info">
                              <a href="/blog"> <span><i className="ti-time"></i>26 Dec 2026</span> </a>
                            </div>
                            <a href="/post">
                              <h5>Journey through Canada&apos;s wild beauty</h5>
                            </a>
                            <p>Discover vast landscapes of towering mountains, crystal-clear lakes, and endless forests across Canada.</p>
                            <div className="arrow"> <a href="/post"><i className="ti-arrow-top-right"></i></a> </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Pagination */}
                    <div className="row">
                      <div className="col-md-12 text-center mt-30 mb-30">
                        <ul className="pagination-wrap">
                          <li><a href="/blog"><i className="fa-light fa-angle-left"></i></a></li>
                          <li><a href="/blog">1</a></li>
                          <li><a href="/blog" className="active">2</a></li>
                          <li><a href="/blog">3</a></li>
                          <li><a href="/blog"><i className="fa-light fa-angle-right"></i></a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* Sidebar */}
                  <div className="col-lg-4 col-md-12">
                    <div className="blog-sidebar row">
                      <div className="col-md-12">
                        <div className="widget search">
                          <form>
                            <input type="text" name="search" placeholder="Type here ..." />
                            <button type="submit"><i className="fa-light fa-magnifying-glass" aria-hidden="true"></i></button>
                          </form>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="widget">
                          <div className="widget-title">
                            <h6>Recent Posts</h6>
                          </div>
                          <ul className="recent">
                            <li>
                              <div className="thum"> <img src="/images/blog-5.jpg" className="img-fluid" alt="" /> </div> <a href="/post">Experience the spirit of South Africa</a>
                            </li>
                            <li>
                              <div className="thum"> <img src="/images/blog-6.jpg" className="img-fluid" alt="" /> </div> <a href="/post">Experience the luxury of modern Dubai</a>
                            </li>
                            <li>
                              <div className="thum"> <img src="/images/blog-7.jpg" className="img-fluid" alt="" /> </div> <a href="/post">Journey through Canada&apos;s wild beauty</a>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="widget">
                          <div className="widget-title">
                            <h6>Categories</h6>
                          </div>
                          <ul>
                            <li><a href="#"><i className="fa-light fa-angle-right"></i>Destinations</a></li>
                            <li><a href="#"><i className="fa-light fa-angle-right"></i>Nature & Adventure Tours</a></li>
                            <li><a href="#"><i className="fa-light fa-angle-right"></i>City & Cultural Tours</a></li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="widget">
                          <div className="widget-title">
                            <h6>Tags</h6>
                          </div>
                          <ul className="tags">
                            <li><a href="#">Destinations</a></li>
                            <li><a href="#">Adventure</a></li>
                            <li><a href="#">Tour</a></li>
                            <li><a href="#">Travel</a></li>
                            <li><a href="#">Nature</a></li>
                          </ul>
                        </div>
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
