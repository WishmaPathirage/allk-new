import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    height: 70px; padding: 0 48px;
    display: flex; align-items: center; justify-content: space-between;
    transition: background 0.4s ease, box-shadow 0.4s ease;
  }
  .nav.scrolled {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.08);
  }

  .nav-logo {
    display: flex; align-items: center;
    text-decoration: none; z-index: 201;
  }
  .nav-logo img {
    height: 48px; width: 48px;
    border-radius: 6px;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  /* ── Desktop links ── */
  .nav-links {
    list-style: none;
    display: flex; align-items: center; gap: 30px;
  }
  .nav-links a {
    font-family: 'Inter', sans-serif;
    font-size: 14px; font-weight: 500; letter-spacing: 0.04em;
    color: #555; text-decoration: none;
    position: relative;
    transition: color 0.2s;
  }
  .nav-links a::after {
    content: '';
    position: absolute; bottom: -2px; left: 0; right: 0;
    height: 1.5px; background: #ff3c2e;
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.25s cubic-bezier(.22,1,.36,1);
  }
  .nav-links a:hover { color: #ff3c2e; }
  .nav-links a:hover::after { transform: scaleX(1); }

  /* ── Login button ── */
  .nav-login {
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: #ff3c2e; background: transparent;
    border: 1.5px solid #ff3c2e; border-radius: 4px;
    padding: 9px 22px; cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
    text-decoration: none;
    display: inline-block;
  }
  .nav-login:hover { background: #ff3c2e; color: #fff; }

  /* White nav links + login button when hero video is playing */
  body.hero-video-playing .nav-links a {
    color: #fff;
  }
  body.hero-video-playing .nav-links a::after {
    background: #fff;
  }
  body.hero-video-playing .nav-links a:hover {
    color: rgba(255,255,255,0.8);
  }
  body.hero-video-playing .nav-login {
    color: #fff;
    border-color: #fff;
  }
  body.hero-video-playing .nav-login:hover {
    background: #fff;
    color: #111;
  }

  /* ── Hamburger button ── */
  .nav-hamburger {
    display: none;
    flex-direction: column; justify-content: center; align-items: center;
    gap: 5px;
    width: 40px; height: 40px;
    background: none; border: none; cursor: pointer;
    z-index: 201; padding: 4px;
  }
  .nav-hamburger span {
    display: block;
    width: 24px; height: 2px;
    background: #222;
    border-radius: 2px;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .nav-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .nav-hamburger.open span:nth-child(2) { opacity: 0; }
  .nav-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* ── Mobile drawer ── */
  .nav-drawer {
    display: none;
    position: fixed; top: 70px; left: 0; right: 0;
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.10);
    flex-direction: column;
    padding: 20px 32px 28px;
    gap: 0;
    z-index: 199;
    transform: translateY(-8px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.28s ease, opacity 0.28s ease;
  }
  .nav-drawer.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: all;
  }
  .nav-drawer a, .nav-drawer button {
    font-family: 'Inter', sans-serif;
    font-size: 15px; font-weight: 500;
    color: #222; text-decoration: none;
    padding: 14px 0;
    border: none; background: none; cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    text-align: left;
    transition: color 0.2s;
    width: 100%;
  }
  .nav-drawer a:last-child, .nav-drawer button:last-child { border-bottom: none; }
  .nav-drawer a:hover, .nav-drawer button:hover { color: #ff3c2e; }
  .nav-drawer .drawer-login {
    margin-top: 12px;
    font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: #fff; background: #ff3c2e;
    border-radius: 4px; padding: 13px 0;
    text-align: center; border-bottom: none;
  }
  .nav-drawer .drawer-login:hover { background: #e03325; color: #fff; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .nav { padding: 0 24px; }
    .nav-links { display: none; }
    .nav-login { display: none; }
    .nav-hamburger { display: flex; }
    .nav-drawer { display: flex; }
  }
`;

const links = [
  { label: 'Home',         href: '/'               },
  { label: 'About',        href: '/#about'        },
  { label: 'Social Stats', href: '/#social-stats'  },
  { label: 'Teachers',     href: '/#teachers'      },
  { label: 'Podcasts',     href: '/#podcasts'      },
  { label: 'Contact',      href: '/#contact'       },
  { label: 'FAQ',          href: '/#faq'           },
];

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchorClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    if (href === '/') {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (href.startsWith('/#')) {
      const id = href.slice(2);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  return (
    <>
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <style>{css}</style>

        <Link to="/" className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={`${process.env.PUBLIC_URL}/AL.lk Logo.webp`} alt="A/L.lk" />
        </Link>

        {/* Desktop links */}
        <ul className="nav-links">
          {links.map(({ label, href }) => (
            <li key={label}>
              <a href={href} onClick={(e) => handleAnchorClick(e, href)}>{label}</a>
            </li>
          ))}
        </ul>

        <Link to="/login" className="nav-login">Login</Link>

        {/* Hamburger */}
        <button
          className={`nav-hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`nav-drawer${menuOpen ? ' open' : ''}`}>
        {links.map(({ label, href }) => (
          <a key={label} href={href} onClick={(e) => handleAnchorClick(e, href)}>{label}</a>
        ))}
        <Link to="/login" className="drawer-login" onClick={() => setMenuOpen(false)}>Login</Link>
      </div>
    </>
  );
}
