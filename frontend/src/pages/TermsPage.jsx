import { useEffect } from 'react'

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service — AERODROME'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1rem' }}>Terms of Service</h1>
      <p style={{ color: 'var(--text-soft)', marginBottom: '3rem' }}>Last updated: {new Date().toLocaleDateString()}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-main)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-white)' }}>1. Acceptance of Terms</h2>
          <p>
            By accessing and using AERODROME, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-white)' }}>2. Predictions and Accuracy</h2>
          <p>
            AERODROME provides flight fare predictions based on machine learning models trained on historical data. These predictions are estimates and <strong>are not guaranteed</strong>. We do not assume liability for any financial losses or missed booking opportunities resulting from relying on our predictions.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-white)' }}>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials (managed via Google OAuth). You agree to accept responsibility for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate our terms.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-white)' }}>4. Changes to Service</h2>
          <p>
            We reserve the right to modify or discontinue, temporarily or permanently, the platform (or any part of it) with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
          </p>
        </section>
      </div>
    </div>
  )
}
