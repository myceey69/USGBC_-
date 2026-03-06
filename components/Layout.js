import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useI18n } from '../lib/i18n'

export default function Layout({ children, tocLinks, activePage }) {
  const { t, lang, setLang } = useI18n()
  const [theme, setTheme] = useState('dark')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const [ttsVisible, setTtsVisible] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const router = useRouter()

  // Load persisted theme + sidebar state
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    setTheme(savedTheme)
    if (localStorage.getItem('sidebarHidden') === 'true' && window.innerWidth > 768) {
      setSidebarOpen(false)
    }
  }, [])

  // Apply theme to body
  useEffect(() => {
    document.body.classList.toggle('light-mode', theme === 'light')
  }, [theme])

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100
      setScrollPct(Math.min(pct, 100))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
  }

  const toggleLang = () => {
    setLang(lang === 'en' ? 'es' : 'en')
  }

  const openSidebar = () => {
    setSidebarOpen(true)
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarMobileOpen(true)
    }
    localStorage.removeItem('sidebarHidden')
  }

  const closeSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarMobileOpen(false)
    } else {
      setSidebarOpen(false)
      localStorage.setItem('sidebarHidden', 'true')
    }
  }

  const stopTTS = () => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
      setTtsVisible(false)
    }
  }

  const appClass = ['app', !sidebarOpen ? 'sidebar-hidden' : ''].filter(Boolean).join(' ')
  const navClass = ['sidebar', sidebarMobileOpen ? 'mobile-open' : ''].filter(Boolean).join(' ')

  return (
    <>
      <div id="scrollBar" style={{ width: scrollPct + '%' }}></div>
      <div
        className={`sidebar-overlay${sidebarMobileOpen ? ' active' : ''}`}
        onClick={closeSidebar}
      />
      <button
        id="ttsStop"
        className={ttsVisible ? 'visible' : ''}
        onClick={stopTTS}
      >
        ⏹ Stop Reading
      </button>
      {shareToast && (
        <div className="share-toast show">🔗 Link copied!</div>
      )}

      <div className={appClass}>
        <button className="show-sidebar" onClick={openSidebar}>☰ Menu</button>

        <nav id="sidebar" className={navClass}>
          <div className="brand">
            <div className="brand-top">
              <div className="logo">
                <img src={`${router.basePath}/logos/smallLogoUSGBC.png`} alt="USGBC Logo" />
              </div>
              <h1 dangerouslySetInnerHTML={{ __html: t('brand-title') }} />
            </div>
            <div className="brand-controls">
              <button id="themeToggle" title="Toggle light/dark mode" onClick={toggleTheme}>
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button id="langToggle" title="Switch language / Cambiar idioma" onClick={toggleLang}>
                {lang === 'en' ? 'ES' : 'EN'}
              </button>
              <button id="hideSidebar" className="hide-btn" title="Hide sidebar" onClick={closeSidebar}>×</button>
            </div>
          </div>

          <div className="sidebar-nav-btns">
            <Link
              href="/"
              className={`nav-page-btn${activePage === 'guides' ? ' active' : ''}`}
              dangerouslySetInnerHTML={{ __html: t('nav-guides') }}
            />
            <Link
              href="/tools"
              className={`nav-page-btn${activePage === 'tools' ? ' active' : ''}`}
              dangerouslySetInnerHTML={{ __html: t('nav-tools') }}
            />
            <div className="pdf-link-wrapper">
              <a
                href="/USGBC%20AURA%20Report.pdf"
                target="_blank"
                rel="noreferrer"
                className="nav-page-btn"
                dangerouslySetInnerHTML={{ __html: t('nav-pdf') }}
              />
            </div>
            <div className="last-updated" dangerouslySetInnerHTML={{ __html: t('last-updated') }} />
          </div>

          <div className="toc" id="toc">
            {activePage === 'guides' && (
              <div className="group" dangerouslySetInnerHTML={{ __html: t('toc-group-guide') }} />
            )}
            {activePage === 'tools' && (
              <div className="group" dangerouslySetInnerHTML={{ __html: t('toc-group-tools') }} />
            )}
            {(tocLinks || []).map((link) => (
              <a key={link.href} href={link.href} dangerouslySetInnerHTML={{ __html: t(link.key) }} />
            ))}
          </div>
        </nav>

        <main>{children}</main>
      </div>
    </>
  )
}
