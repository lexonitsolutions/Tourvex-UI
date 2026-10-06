"use client";

import Script from "next/script";

export default function TeamDetails() {
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
                    <div className="section-subtitle">Jason Walker</div>
                    <div className="section-title">I&apos;m a professional <i>Adventure Specialist</i></div>
                  </div>
                </div>
              </div>
              <div className="container-fluid">
                <div className="height1">
                  <div className="radius-mask">
                    <div className="bg-img height2" data-background="/images/5.jpg" data-speed="0.5" data-lag="0"></div>
                  </div>
                </div>
              </div>
            </header>
            {/* Team Details */}
            <section className="team-details section-padding">
              <div className="container">
                <div className="row justify-content-center">
                  <div className="col-md-4 mb-30 duru-slide-up"> <img src="/images/team-1.jpg" className="img-fluid mb-0" alt="" />
                    <div className="wrap">
                      <h3>Jason Walker</h3>
                      <h5>Adventure Specialist</h5>
                      <div className="cont">
                        <div className="coll">
                          <h6>Email:</h6>
                        </div>
                        <div className="coll">
                          <p>walker@karnishtourism.com</p>
                        </div>
                      </div>
                      <div className="cont mb-30">
                        <div className="coll">
                          <h6>Call:</h6>
                        </div>
                        <div className="coll">
                          <p>+1 123 567 8910</p>
                        </div>
                      </div>
                      <div className="social-icon"> <a href="#"><i className="fa-brands fa-instagram"></i></a> <a href="#"><i className="fab fa-x-twitter"></i></a> <a href="#"><i className="fa-brands fa-facebook-f"></i></a> <a href="#"><i className="fa-brands fa-pinterest"></i></a> </div>
                    </div>
                  </div>
                  <div className="col-md-6 offset-md-1">
                    <div className="content">
                      <div className="section-subtitle wow fadeInRight">Jason Walker</div>
                      <div className="section-title d-rotate wow"><span className="rotate-text">I&apos;m a professional <i>Adventure Specialist</i></span></div>
                      <p>With over 10 years of experience in the travel industry, Jason Walker helps travelers discover unique destinations and create unforgettable journeys tailored to their interests and lifestyles. From mountain expeditions to cultural tours across Europe, Asia, and South America, he specializes in designing authentic travel experiences that combine adventure, comfort, and local discovery.</p>
                      <p>For Ethan, travel is about more than visiting new places—it&apos;s about creating meaningful memories and connecting people with the world. His expertise, attention to detail, and passion for exploration ensure every trip is carefully planned from start to finish.</p>
                      <ul className="page-list list-unstyled mb-30">
                        <li>
                          <div className="page-list-icon"> <span className="ti-check"></span> </div>
                          <div className="page-list-text">
                            <p>10+ years in global travel planning</p>
                          </div>
                        </li>
                        <li>
                          <div className="page-list-icon"> <span className="ti-check"></span> </div>
                          <div className="page-list-text">
                            <p>Adventure and experiential travel specialist</p>
                          </div>
                        </li>
                        <li>
                          <div className="page-list-icon"> <span className="ti-check"></span> </div>
                          <div className="page-list-text">
                            <p>Expert in customized itineraries and destination planning</p>
                          </div>
                        </li>
                      </ul>
                      <ul className="nav nav-tabs simpl-bord mt-60" id="myTab" role="tablist">
                        <li className="nav-item" role="presentation"> <span className="nav-link cursor-pointer" id="experience-tab" data-bs-toggle="tab" data-bs-target="#experience">Experience</span> </li>
                        <li className="nav-item" role="presentation"> <span className="nav-link cursor-pointer" id="education-tab" data-bs-toggle="tab" data-bs-target="#education">Education</span> </li>
                        <li className="nav-item" role="presentation"> <span className="nav-link active cursor-pointer" id="awards-tab" data-bs-toggle="tab" data-bs-target="#awards">Awards</span> </li>
                      </ul>
                      <div className="tab-content" id="myTabContent">
                        <div className="tab-pane fade" id="experience" role="tabpanel" aria-labelledby="experience-tab">
                          <p>Ethan has curated and managed travel experiences across multiple continents, working with solo travelers, families, and group tours seeking unique and memorable adventures.</p>
                          <p>As an Adventure Specialist, he oversees itinerary development, destination research, and traveler support, ensuring every journey delivers exceptional experiences, seamless logistics, and lasting memories.</p>
                        </div>
                        <div className="tab-pane fade" id="education" role="tabpanel" aria-labelledby="education-tab">
                          <ul className="page-list list-unstyled mb-30">
                            <li>
                              <div className="page-list-icon"><span className="ti-check"></span></div>
                              <div className="page-list-text">
                                <p>Bachelor of Tourism & Hospitality Management</p>
                              </div>
                            </li>
                            <li>
                              <div className="page-list-icon"><span className="ti-check"></span></div>
                              <div className="page-list-text">
                                <p>Certified Travel Consultant (CTC)</p>
                              </div>
                            </li>
                          </ul>
                        </div>
                        <div className="tab-pane fade show active" id="awards" role="tabpanel" aria-labelledby="awards-tab">
                          <ul className="page-list list-unstyled mb-30">
                            <li>
                              <div className="page-list-icon"><span className="ti-check"></span></div>
                              <div className="page-list-text">
                                <p>Travel Excellence Award 2023</p>
                              </div>
                            </li>
                            <li>
                              <div className="page-list-icon"><span className="ti-check"></span></div>
                              <div className="page-list-text">
                                <p>Outstanding Tour Planning Recognition 2021</p>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Team */}
            <section className="team section-padding">
              <div className="bg-text-style3 duru-slide-up">Experts</div>
              <div className="container">
                <div className="row">
                  <div className="col-md-12 text-center mb-30">
                    <div className="section-subtitle wow fadeInRight">Travel Advisors</div>
                    <div className="section-title d-rotate wow"><span className="rotate-text">Meet the Karnish Tourism Team</span></div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="swiper team-slider">
                      <div className="swiper-wrapper">
                        <div className="swiper-slide">
                          <div className="item">
                            <div className="wrapper">
                              <div className="img"><img src="/images/team-2.jpg" className="img-fluid" alt="" /></div>
                              <div className="icon"> <a href="/team-details" className="arrow"><span className="fa-solid fa-info default-icon"></span><span className="ti-arrow-top-right hover-icon"></span></a></div>
                            </div>
                            <div className="text">
                              <h4 className="name">Mia Taylor</h4>
                              <h6 className="position">Customer Success Manager</h6>
                            </div>
                          </div>
                        </div>
                        <div className="swiper-slide">
                          <div className="item">
                            <div className="wrapper">
                              <div className="img"><img src="/images/team-3.jpg" className="img-fluid" alt="" /></div>
                              <div className="icon"> <a href="/team-details" className="arrow"><span className="fa-solid fa-info default-icon"></span><span className="ti-arrow-top-right hover-icon"></span></a></div>
                            </div>
                            <div className="text">
                              <h4 className="name">Frank Mitchell</h4>
                              <h6 className="position">Operations Director</h6>
                            </div>
                          </div>
                        </div>
                        <div className="swiper-slide">
                          <div className="item">
                            <div className="wrapper">
                              <div className="img"><img src="/images/team-4.jpg" className="img-fluid" alt="" /></div>
                              <div className="icon"> <a href="/team-details" className="arrow"><span className="fa-solid fa-info default-icon"></span><span className="ti-arrow-top-right hover-icon"></span></a></div>
                            </div>
                            <div className="text">
                              <h4 className="name">Jesica Brown</h4>
                              <h6 className="position">Travel Designer</h6>
                            </div>
                          </div>
                        </div>
                        <div className="swiper-slide">
                          <div className="item">
                            <div className="wrapper">
                              <div className="img"><img src="/images/team-1.jpg" className="img-fluid" alt="" /></div>
                              <div className="icon"> <a href="/team-details" className="arrow"><span className="fa-solid fa-info default-icon"></span><span className="ti-arrow-top-right hover-icon"></span></a></div>
                            </div>
                            <div className="text">
                              <h4 className="name">Jason Walker</h4>
                              <h6 className="position">Adventure Specialist</h6>
                            </div>
                          </div>
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
