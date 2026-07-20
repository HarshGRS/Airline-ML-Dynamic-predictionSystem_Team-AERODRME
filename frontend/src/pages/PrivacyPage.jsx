import { useEffect } from 'react'

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy — AERODROME'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1rem' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-soft)', marginBottom: '3rem' }}>Last updated: {new Date().toLocaleDateString()}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-main)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-white)' }}>1. Information We Collect</h2>
          <p>
            When you use AERODROME, we may collect information about your searches, route preferences, and interactions with our predictions. If you create an account, we store your profile information (like email and name provided via Google OAuth) and any routes you save to your Watchlist.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-white)' }}>2. How We Use Your Data</h2>
          <p>
            Your search history and saved routes are used strictly to provide you with personalized fare predictions and watchlist alerts. We do not sell your personal data to third parties. Anonymised search trends may be used to improve our XGBoost machine learning model's accuracy.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-white)' }}>3. Cookies and Storage</h2>
          <p>
            We use local storage and secure cookies to maintain your session (via JWT) and temporarily store your active watchlist routes. These are essential for the platform's core functionality.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-white)' }}>4. Contact Us</h2>
          <p>
            If you have questions about how we handle your data, please contact the AERODROME team through our support channels.
          </p>
        </section>
      </div>
    </div>
  )
}
