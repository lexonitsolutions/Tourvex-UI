"use client";

import Script from "next/script";

export default function Post() {
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
                  <div className="col-md-6 text-center">
                    <div className="section-subtitle">Latest Travel News</div>
                    <div className="section-title">Experience the luxury of modern <i>Dubai</i></div>
                    <div className="post">
                      <div className="author"> <img src="/images/tst1.jpg" alt="" className="avatar" /> <span>Emily Brown</span> </div>
                      <div className="date-comment"> <i className="ti-calendar"></i> 27 Dec 2026</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="container-fluid">
                <div className="height1">
                  <div className="radius-mask">
                    <div className="bg-img height2" data-background="/images/destination-03.jpg" data-speed="0.5" data-lag="0"></div>
                  </div>
                </div>
              </div>
            </header>
            {/* Post */}
            <section className="post section-padding">
              <div className="container">
                <div className="row mb-30">
                  <div className="col-lg-8 col-md-12">
                    <p><span className="first-letter">E</span>Experience the vibrant charm of Dubai, where futuristic architecture meets rich culture and world-class luxury. Discover iconic landmarks such as the Burj Khalifa, Palm Jumeirah, and Dubai Marina, each offering a unique perspective of this extraordinary city.</p>
                  </div>
                  <div className="col-lg-3 offset-lg-1 col-md-12 mb-30">
                    <blockquote className="vert-move">
                      <p>Dubai is not a city, it's a vision of the future.</p> <cite>Anonymous</cite>
                    </blockquote>
                  </div>
                </div>
                {/* Image */}
                <section className="image-stack">
                  <div className="image-stack-wrapper">
                    <div className="image-stack-card"> <img src="/images/01_2.jpg" alt="" /> </div>
                    <div className="image-stack-card"> <img src="/images/02_2.jpg" alt="" /> </div>
                    <div className="image-stack-card"> <img src="/images/03_2.jpg" alt="" /> </div>
                    <div className="image-stack-card"> <img src="/images/04.jpg" alt="" /> </div>
                    <div className="image-stack-card"> <img src="/images/05.jpg" alt="" /> </div>
                  </div>
                </section>
                <div className="row justify-content-center mb-60 pt-30">
                  <div className="col-md-6">
                    <p>From desert safaris and traditional souks to luxury shopping malls and fine dining experiences, Dubai offers something for every type of traveler. Whether you are seeking adventure, relaxation, or cultural exploration, this dynamic destination promises unforgettable moments at every turn.</p>
                  </div>
                  <div className="col-md-5 offset-md-1">
                    <p>Immerse yourself in the energy of the city and experience the perfect blend of tradition and modernity that defines Dubai today. As day turns into night, Dubai transforms into a glowing masterpiece of lights, offering unforgettable dining, entertainment, and leisure experiences.</p>
                  </div>
                </div>
                <div className="post-comment-section">
                  <div className="row justify-content-center">
                    {/* Comment */}
                    <div className="col-md-6 mb-30">
                      <div className="post-comment-wrap">
                        <div className="post-user-comment"><img src="/images/team-g1.jpg" alt="" /></div>
                        <div className="post-user-content">
                          <h5>Emily Brown <span>[ Traveler ]</span></h5>
                          <p>Dubai was an unforgettable journey, where modern luxury meets rich tradition. Every moment felt unique, from the skyline views to the desert experiences. <i className="fa-solid fa-thumbs-up"></i></p>
                        </div>
                      </div>
                    </div>
                    {/* Contact Form */}
                    <div className="col-md-5 offset-md-1">
                      <h5 className="mb-30">Leave a Reply</h5>
                      <form method="post">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-group"> <span className="form-icon"><i className="fa-light fa-face-smile"></i></span>
                              <input type="text" name="name" id="name" placeholder="Your name" required />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group"> <span className="form-icon"><i className="fa-light fa-envelope"></i></span>
                              <input type="email" name="email" id="email" placeholder="Your email" required />
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="form-group form-textarea"> <span className="form-icon"><i className="fa-light fa-comment"></i></span>
                              <textarea name="message" id="message" cols="30" rows="3" placeholder="Message" required></textarea>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <button className="butn-arrow"><span className="btn-text">Read more</span> <span className="arrow-wrap">
                                <span className="arrow-inner">
                                  <i className="ti-arrow-right"></i>
                                  <i className="ti-arrow-right"></i>
                                </span> </span>
                            </button>
                          </div>
                        </div>
                      </form>
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
                      <div className="img bg-img" data-background="/images/blog-1.jpg">
                        <div className="text-left ontop">
                          <h5><a href="/post">Exploring the hidden Maldives paradise</a></h5>
                        </div>
                        <div className="overly"></div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 text-center rest">
                    <a href="/blog" className="all-works d-flex align-items-center"> <span className="icon full-width ti-layout-grid3"></span> </a>
                  </div>
                  <div className="col-md-5 rest">
                    <div className="nxt">
                      <div className="img bg-img" data-background="/images/blog-2.jpg">
                        <div className="text-right ontop">
                          <h5><a href="/post">Journey through Canada's wild beauty</a></h5>
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
