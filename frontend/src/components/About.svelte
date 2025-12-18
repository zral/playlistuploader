<script lang="ts">
</script>

<div class="about-container">
  <div class="hero-section">
    <div class="hero-content">
      <h1>🎵 Listify</h1>
      <p class="tagline">Your vibe, your way</p>
      <p class="subtitle">Transform your music taste into incredible Spotify playlists in seconds</p>
    </div>
  </div>

  <div class="features-section">
    <h2>Why Listify?</h2>
    
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">🎯</div>
        <h3>Smart Song Matching</h3>
        <p>Our intelligent search finds the perfect tracks from your song list, even with typos or incomplete info.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🤖</div>
        <h3>AI-Powered Generation</h3>
        <p>Describe your mood or vibe, and our AI will craft a personalized playlist just for you.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Lightning Fast</h3>
        <p>Upload entire playlists in seconds. No manual searching, no waiting around.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📝</div>
        <h3>Multiple Input Formats</h3>
        <p>Paste text, upload CSV files from Shazam or other apps - we handle it all seamlessly.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">✨</div>
        <h3>Preview & Refine</h3>
        <p>Review matches with confidence scores, listen to previews, and swap alternatives before uploading.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>Secure & Private</h3>
        <p>Your data is safe. We only request the minimum Spotify permissions needed to manage your playlists.</p>
      </div>
    </div>
  </div>

  <div class="how-it-works-section">
    <h2>How It Works</h2>
    
    <div class="steps">
      <div class="step">
        <div class="step-number">1</div>
        <h3>Connect Your Spotify</h3>
        <p>Quick and secure authentication with your Spotify account.</p>
      </div>

      <div class="step">
        <div class="step-number">2</div>
        <h3>Add Your Songs</h3>
        <p>Paste a list, upload a CSV, or let AI generate songs based on your mood.</p>
      </div>

      <div class="step">
        <div class="step-number">3</div>
        <h3>Review & Customize</h3>
        <p>Check matches, swap alternatives, and preview songs before uploading.</p>
      </div>

      <div class="step">
        <div class="step-number">4</div>
        <h3>Create Your Playlist</h3>
        <p>Add to an existing playlist or create a new one - your music, instantly organized!</p>
      </div>
    </div>
  </div>

  <div class="use-cases-section">
    <h2>Perfect For...</h2>
    
    <div class="use-case-grid">
      <div class="use-case">
        <div class="emoji">🎉</div>
        <h4>Party Playlists</h4>
        <p>Compile requests from friends into one epic playlist</p>
      </div>

      <div class="use-case">
        <div class="emoji">📱</div>
        <h4>Shazam History</h4>
        <p>Export your Shazam discoveries directly to Spotify</p>
      </div>

      <div class="use-case">
        <div class="emoji">💿</div>
        <h4>Old Collections</h4>
        <p>Convert text lists or spreadsheets to modern playlists</p>
      </div>

      <div class="use-case">
        <div class="emoji">🎭</div>
        <h4>Themed Vibes</h4>
        <p>Let AI create playlists matching any mood or theme</p>
      </div>

      <div class="use-case">
        <div class="emoji">🎸</div>
        <h4>Concert Setlists</h4>
        <p>Turn setlists from shows into playable playlists</p>
      </div>

      <div class="use-case">
        <div class="emoji">📻</div>
        <h4>Radio Tracklists</h4>
        <p>Capture songs from radio shows or podcasts</p>
      </div>
    </div>
  </div>

  <div class="tech-section">
    <h2>Built With Modern Tech</h2>
    <p class="tech-description">
      Listify leverages cutting-edge technology to deliver a fast, reliable experience:
    </p>
    
    <div class="tech-stack">
      <div class="tech-item">
        <strong>Smart Caching</strong>
        <p>Redis-powered caching reduces API calls by 60-80%</p>
      </div>
      <div class="tech-item">
        <strong>AI Integration</strong>
        <p>GPT-4 powered playlist generation</p>
      </div>
      <div class="tech-item">
        <strong>Circuit Breakers</strong>
        <p>Robust error handling for uninterrupted service</p>
      </div>
      <div class="tech-item">
        <strong>TypeScript</strong>
        <p>Type-safe code for fewer bugs and better reliability</p>
      </div>
    </div>
  </div>

  <div class="cta-section">
    <h2>Ready to Listify Your Vibe?</h2>
    <p>Join thousands of music lovers transforming their playlists</p>
    <a href="/" class="cta-button">Get Started Now</a>
  </div>
</div>

<style>
  .about-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .hero-section {
    text-align: center;
    padding: 4rem 0;
    margin-bottom: 4rem;
  }

  .hero-content h1 {
    font-size: 4rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--christmas-gold), var(--christmas-light-red));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    font-size: 2rem;
    color: var(--christmas-gold);
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .subtitle {
    font-size: 1.3rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto;
  }

  .features-section,
  .how-it-works-section,
  .use-cases-section,
  .tech-section {
    margin-bottom: 5rem;
  }

  h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: var(--text-primary);
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }

  .feature-card {
    background: var(--bg-card);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.2);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .feature-card h3 {
    color: var(--christmas-gold);
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  .feature-card p {
    color: var(--text-secondary);
    line-height: 1.6;
  }

  .steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }

  .step {
    text-align: center;
    padding: 2rem;
  }

  .step-number {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, var(--christmas-red), var(--christmas-light-red));
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    font-weight: bold;
    margin: 0 auto 1.5rem;
  }

  .step h3 {
    color: var(--text-primary);
    margin-bottom: 1rem;
    font-size: 1.3rem;
  }

  .step p {
    color: var(--text-secondary);
    line-height: 1.6;
  }

  .use-case-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
  }

  .use-case {
    background: var(--bg-card);
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    text-align: center;
    transition: transform 0.3s ease;
  }

  .use-case:hover {
    transform: scale(1.05);
  }

  .use-case .emoji {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .use-case h4 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
  }

  .use-case p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .tech-section {
    text-align: center;
  }

  .tech-description {
    color: var(--text-secondary);
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }

  .tech-stack {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .tech-item {
    background: var(--bg-card);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .tech-item strong {
    color: var(--christmas-gold);
    display: block;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  .tech-item p {
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  .cta-section {
    text-align: center;
    padding: 4rem 2rem;
    background: linear-gradient(135deg, var(--christmas-red), var(--christmas-dark-red));
    border-radius: 16px;
    margin-top: 4rem;
  }

  .cta-section h2 {
    color: white;
    margin-bottom: 1rem;
  }

  .cta-section p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }

  .cta-button {
    display: inline-block;
    background: var(--christmas-gold);
    color: var(--bg-primary);
    padding: 1rem 3rem;
    border-radius: 50px;
    font-size: 1.2rem;
    font-weight: 600;
    text-decoration: none;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .cta-button:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.4);
  }

  @media (max-width: 768px) {
    .hero-content h1 {
      font-size: 2.5rem;
    }

    .tagline {
      font-size: 1.5rem;
    }

    .subtitle {
      font-size: 1.1rem;
    }

    h2 {
      font-size: 2rem;
    }

    .feature-grid,
    .steps,
    .use-case-grid,
    .tech-stack {
      grid-template-columns: 1fr;
    }
  }
</style>
