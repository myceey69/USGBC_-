import { useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'

const tocLinks = [
  { href: '#overview', key: 'toc-overview' },
  { href: '#risk', key: 'toc-risk' },
  { href: '#hubs', key: 'toc-hubs' },
  { href: '#water', key: 'toc-water' },
  { href: '#mobility', key: 'toc-mobility' },
  { href: '#green', key: 'toc-green' },
  { href: '#equity', key: 'toc-equity' },
  { href: '#monitoring', key: 'toc-monitoring' },
]

export default function GuidesPage() {
  const { t, lang } = useI18n()

  const readSection = useCallback((elementId) => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const el = document.getElementById(elementId)
    if (!el) return
    const speech = new SpeechSynthesisUtterance(el.innerText)
    speech.lang = lang === 'es' ? 'es-MX' : 'en-US'
    speech.rate = 1; speech.pitch = 1
    const stopBtn = document.getElementById('ttsStop')
    if (stopBtn) stopBtn.classList.add('visible')
    speech.onend = () => { if (stopBtn) stopBtn.classList.remove('visible') }
    window.speechSynthesis.speak(speech)
  }, [lang])

  return (
    <Layout tocLinks={tocLinks} activePage="guides">
      {/* OVERVIEW */}
      <section className="hero" id="overview">
        <div>
          <span className="badge">{t('hero-badge')}</span>
          <br />
          <h2>{t('hero-h2')}</h2>
          <p id="tts-overview">
            {t('overview-p')}
          </p>
          <div className="kpis" style={{ marginTop: '10px' }}>
            <div className="k"><div className="small">{t('kpi-minority')}</div><strong>~72%</strong></div>
            <div className="k"><div className="small">{t('kpi-seniors')}</div><strong>~16%</strong></div>
            <div className="k"><div className="small">{t('kpi-homes')}</div><strong>~86%</strong></div>
            <div className="k"><div className="small">{t('kpi-canopy')}</div><strong>~12%</strong></div>
          </div>
        </div>
        <div className="hero-video">
          <video autoPlay muted loop playsInline>
            <source src="/logos/USGBC_Logo_Reveal_2.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* RISK */}
      <section className="panel" id="risk">
        <h3>
          {t('risk-h3')}{' '}
          <button className="btn" type="button" onClick={() => readSection('tts-risk')}>🔊</button>
        </h3>
        <p id="tts-risk" className="small">
          {t('risk-p')}
        </p>
        <br />
        <div className="program-cards">
          <div className="program-card">
            <h4>
              {t('risk-high-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-risk-high')}>🔊</button>
            </h4>
            <div id="tts-risk-high">
              <ul>
                <li>{t('risk-high-li1')}</li>
                <li>{t('risk-high-li2')}</li>
                <li>{t('risk-high-li3')}</li>
              </ul>
            </div>
          </div>
          <div className="program-card">
            <h4>
              {t('risk-env-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-risk-env')}>🔊</button>
            </h4>
            <div id="tts-risk-env">
              <ul>
                <li>{t('risk-env-li1')}</li>
                <li>{t('risk-env-li2')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* RECOVERY HUBS */}
      <section className="panel" id="hubs">
        <h3>
          {t('hubs-h3')}{' '}
          <button className="btn" type="button" onClick={() => readSection('tts-hubs')}>🔊</button>
        </h3>
        <p id="tts-hubs" className="small">
          {t('hubs-p')}
        </p>
        <br />
        <div className="program-cards">
          <div className="program-card">
            <h4>
              {t('hubs-primary-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-hubs-primary')}>🔊</button>
            </h4>
            <div id="tts-hubs-primary">
              <ul>
                <li dangerouslySetInnerHTML={{ __html: t('hubs-primary-li1') }} />
                <li>{t('hubs-primary-li2')}</li>
                <li>{t('hubs-primary-li3')}</li>
              </ul>
            </div>
          </div>
          <div className="program-card">
            <h4>
              {t('hubs-support-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-hubs-support')}>🔊</button>
            </h4>
            <div id="tts-hubs-support">
              <ul>
                <li>{t('hubs-support-li1')}</li>
                <li>{t('hubs-support-li2')}</li>
                <li>{t('hubs-support-li3')}</li>
                <li>{t('hubs-support-li4')}</li>
                <li>{t('hubs-support-li5')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WATER RESILIENCE */}
      <section className="panel" id="water">
        <h3>
          {t('water-h3')}{' '}
          <button className="btn" type="button" onClick={() => readSection('tts-water')}>🔊</button>
        </h3>
        <p id="tts-water" className="small">
          {t('water-p')}
        </p>
        <br />
        <div className="program-cards">
          <div className="program-card">
            <h4>
              {t('water-elements-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-water-elements')}>🔊</button>
            </h4>
            <div id="tts-water-elements">
              <ul>
                <li>{t('water-elements-li1')}</li>
                <li>{t('water-elements-li2')}</li>
                <li>{t('water-elements-li3')}</li>
                <li>{t('water-elements-li4')}</li>
              </ul>
            </div>
          </div>
          <div className="program-card">
            <h4>
              {t('water-dist-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-water-dist')}>🔊</button>
            </h4>
            <div id="tts-water-dist">
              <ul>
                <li>{t('water-dist-li1')}</li>
                <li>{t('water-dist-li2')}</li>
                <li>{t('water-dist-li3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILITY */}
      <section className="panel" id="mobility">
        <h3>
          {t('mobility-h3')}{' '}
          <button className="btn" type="button" onClick={() => readSection('tts-mobility')}>🔊</button>
        </h3>
        <p id="tts-mobility" className="small">
          {t('mobility-p')}
        </p>
        <br />
        <div className="program-cards">
          <div className="program-card">
            <h4>
              {t('mobility-nodes-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-mobility-nodes')}>🔊</button>
            </h4>
            <div id="tts-mobility-nodes">
              <ul>
                <li>{t('mobility-nodes-li1')}</li>
                <li>{t('mobility-nodes-li2')}</li>
                <li>{t('mobility-nodes-li3')}</li>
              </ul>
            </div>
          </div>
          <div className="program-card">
            <h4>
              {t('mobility-emergency-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-mobility-emergency')}>🔊</button>
            </h4>
            <div id="tts-mobility-emergency">
              <ul>
                <li>{t('mobility-emergency-li1')}</li>
                <li>{t('mobility-emergency-li2')}</li>
                <li>{t('mobility-emergency-li3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GREEN REBUILDING */}
      <section className="panel" id="green">
        <h3>
          {t('green-h3')}{' '}
          <button className="btn" type="button" onClick={() => readSection('tts-green')}>🔊</button>
        </h3>
        <p id="tts-green" className="small">
          {t('green-p')}
        </p>
        <br />
        <div className="program-cards">
          <div className="program-card">
            <h4>
              {t('green-design-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-green-design')}>🔊</button>
            </h4>
            <div id="tts-green-design">
              <ul>
                <li>{t('green-design-li1')}</li>
                <li>{t('green-design-li2')}</li>
                <li>{t('green-design-li3')}</li>
                <li>{t('green-design-li4')}</li>
                <li>{t('green-design-li5')}</li>
              </ul>
            </div>
          </div>
          <div className="program-card">
            <h4>
              {t('green-nature-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-green-nature')}>🔊</button>
            </h4>
            <div id="tts-green-nature">
              <ul>
                <li>{t('green-nature-li1')}</li>
                <li>{t('green-nature-li2')}</li>
                <li>{t('green-nature-li3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* EQUITY */}
      <section className="panel" id="equity">
        <h3>
          {t('equity-h3')}{' '}
          <button className="btn" type="button" onClick={() => readSection('tts-equity')}>🔊</button>
        </h3>
        <p id="tts-equity" className="small">
          {t('equity-p')}
        </p>
        <br />
        <div className="program-cards" style={{ justifyContent: 'center', gridTemplateColumns: '1fr', maxWidth: '700px', margin: '0 auto' }}>
          <div className="program-card">
            <h4>
              {t('equity-impl-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-equity-impl')}>🔊</button>
            </h4>
            <div id="tts-equity-impl">
              <ul>
                <li>{t('equity-impl-li1')}</li>
                <li>{t('equity-impl-li2')}</li>
                <li>{t('equity-impl-li3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MONITORING */}
      <section className="panel" id="monitoring">
        <h3>
          {t('monitoring-h3')}{' '}
          <button className="btn" type="button" onClick={() => readSection('tts-monitoring')}>🔊</button>
        </h3>
        <p id="tts-monitoring" className="small">
          {t('monitoring-p')}
        </p>
        <br />
        <div className="program-cards" style={{ justifyContent: 'center', gridTemplateColumns: '1fr', maxWidth: '700px', margin: '0 auto' }}>
          <div className="program-card">
            <h4>
              {t('monitoring-dashboard-h4')}{' '}
              <button className="mini-tts" type="button" onClick={() => readSection('tts-monitoring-dashboard')}>🔊</button>
            </h4>
            <div id="tts-monitoring-dashboard">
              <ul>
                <li>{t('monitoring-dashboard-li1')}</li>
                <li>{t('monitoring-dashboard-li2')}</li>
                <li>{t('monitoring-dashboard-li3')}</li>
                <li>{t('monitoring-dashboard-li4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
