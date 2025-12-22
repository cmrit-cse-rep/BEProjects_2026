'use client';

import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  FileText,
  Globe,
  Newspaper,
  Brain,
  Zap,
  Eye,
  ChevronRight,
  Volume2,
} from 'lucide-react';
import styles from './page.module.css';

interface ArticleMetadata {
  title?: string;
  source?: string;
  url?: string;
  author?: string;
  summary?: string;
}

interface AnalysisResult {
  is_fake: boolean;
  fake_probability: number;
  real_probability: number;
  confidence_score: number;
  red_flags: string[];
  patterns: string[];
  reasoning: string;
  key_entities?: string[];
  article_metadata?: ArticleMetadata;
  sources_found?: Array<{
    title: string;
    url: string;
    image?: string;
    publisher: { title: string };
  }>;
  similar_articles?: Array<{
    title: string;
    url: string;
    image?: string;
    publisher: { title: string };
  }>;
  advanced_features?: {
    tts?: { ok: boolean; file?: string; url?: string; error?: string };
    ner_reality_checker?: {
      ok: boolean;
      entities?: Array<{ text: string; label: string; verified: boolean; status: string; source: string }>;
      credibility_score?: number;
      error?: string;
    };
    // Removed problematic features: bias_sentiment, ai_writer, multi_style_summarizer, headline_generator
  };
}

export default function Home() {
  const [content, setContent] = useState('');
  const [inputType, setInputType] = useState<'title' | 'url' | 'article'>('url');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [featureToggles, setFeatureToggles] = useState({
    tts: false,
    ner_reality_checker: false,
  });

  const analyzeNews = async () => {
    if (!content.trim()) {
      setError('Please enter some content to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          input_type: inputType,
          enable_features: featureToggles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* Ambient blobs */}
      <div className={styles.ambient}>
        <div className={`${styles.blob} ${styles.blobLeft}`} />
        <div className={`${styles.blob} ${styles.blobRight}`} />
        <div className={`${styles.blob} ${styles.blobBottom}`} />
      </div>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.brandIcon}>
              <Shield />
            </div>
            <div>
              <p className={styles.badge}>
                Real-time AI Defense
              </p>
              <h1 className={styles.title}>VERITAS Intelligence</h1>
              <p className={styles.subtitle}>Truth-first analysis powered by Groq + Llama 3.3 70B</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Sparkles />
            <div>
              <p className={styles.headerRightTitle}>Lumeo-inspired surface</p>
              <p className={styles.headerRightSubtitle}>Soft glassmorphism + neon gradients</p>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className={styles.mainGrid}>
          {/* Left Column - Input & Results */}
          <div className={styles.leftColumn}>
            {/* Input Card */}
            <div className={styles.card}>
              <div className={styles.inputCardHeader}>
                <div>
                  <h2 className={styles.inputTitle}>Analyze any story</h2>
                  <p className={styles.inputSubtitle}>
                    Drop a URL, headline, or full article to validate authenticity.
                  </p>
                </div>
                <div className={styles.pill}>
                  Secure • Private • Instant
                </div>
              </div>

              {/* Input Type Tabs */}
              <div className={styles.tabs}>
                <button
                  onClick={() => setInputType('url')}
                  className={`${styles.tabButton} ${inputType === 'url' ? styles.tabActiveUrl : ''
                    }`}
                >
                  <div className={styles.tabInner}>
                    <Globe />
                    URL
                  </div>
                </button>
                <button
                  onClick={() => setInputType('title')}
                  className={`${styles.tabButton} ${inputType === 'title' ? styles.tabActiveTitle : ''
                    }`}
                >
                  <div className={styles.tabInner}>
                    <FileText />
                    Title
                  </div>
                </button>
                <button
                  onClick={() => setInputType('article')}
                  className={`${styles.tabButton} ${inputType === 'article' ? styles.tabActiveArticle : ''
                    }`}
                >
                  <div className={styles.tabInner}>
                    <Newspaper />
                    Article
                  </div>
                </button>
              </div>

              {/* Input Area */}
              <div className={styles.inputArea}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    inputType === 'url'
                      ? 'Paste article URL...'
                      : inputType === 'title'
                        ? 'Enter headline to check...'
                        : 'Paste full article text...'
                  }
                  rows={inputType === 'article' ? 8 : 4}
                  className={styles.textarea}
                />
              </div>

              {/* Advanced feature toggles */}
              <div className={styles.featureToggleGrid}>
                {Object.entries(featureToggles).map(([key, value]) => (
                  <label key={key} className={styles.featureToggle}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setFeatureToggles((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                    />
                    <span className={styles.featureToggleLabel}>{key.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>

              {/* Analyze Button */}
              <button
                onClick={analyzeNews}
                disabled={loading || !content.trim()}
                className={styles.primaryButton}
              >
                <span className={styles.primaryButtonGlow} />
                {loading ? (
                  <span className={styles.buttonContent}>
                    <Loader2 className="animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className={styles.buttonContent}>
                    <Search />
                    Analyze with VERITAS
                  </span>
                )}
              </button>

              {/* Error Message */}
              {error && (
                <div className={styles.error}>
                  <AlertTriangle />
                  {error}
                </div>
              )}
            </div>

            {/* Article Metadata */}
            {result?.article_metadata && (
              <div className={styles.card}>
                <div className={styles.metadataHeader}>
                  <h3 className={styles.metadataTitle}>
                    <FileText />
                    Article details
                  </h3>
                  <span className={styles.metadataChip}>
                    Metadata
                  </span>
                </div>
                <div className={styles.metadataGrid}>
                  <div className="space-y-2">
                    <p className={styles.metadataLabel}>Title</p>
                    <p className={styles.metadataValue}>{result.article_metadata.title}</p>
                  </div>
                  <div className="space-y-2">
                    <p className={styles.metadataLabel}>Source</p>
                    <p className={styles.metadataValue}>{result.article_metadata.source}</p>
                  </div>
                  <div className="space-y-2">
                    <p className={styles.metadataLabel}>Author</p>
                    <p className={styles.metadataValue}>{result.article_metadata.author}</p>
                  </div>
                </div>
                {result.article_metadata.summary && (
                  <p className={styles.metadataSummary}>{result.article_metadata.summary}</p>
                )}
              </div>
            )}

            {/* Key Entities */}
            {result?.key_entities && result.key_entities.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.listCardTitle}>Key entities</h3>
                <ul className={styles.list}>
                  {result.key_entities.map((ent, idx) => (
                    <li key={idx} className={styles.listItem}>
                      <span className={`${styles.listBullet} ${styles.listBulletTeal}`}>•</span>
                      <span>{ent}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verdict Card */}
            {result && (
              <div
                className={`${styles.verdictCard} ${result.is_fake ? styles.verdictFake : styles.verdictReal
                  }`}
              >
                <div className={styles.verdictHeader}>
                  {result.is_fake ? (
                    <AlertTriangle />
                  ) : (
                    <CheckCircle />
                  )}
                  <div>
                    <p className={styles.verdictLabel}>Verdict</p>
                    <div className={styles.verdictTitle}>
                      {result.is_fake
                        ? result.fake_probability >= 80
                          ? 'Fake'
                          : 'Likely Fake'
                        : result.real_probability >= 80
                          ? 'Real'
                          : 'Likely Real'}
                    </div>
                    <div className={styles.verdictConfidence}>
                      Confidence {result.confidence_score.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Probability Bars */}
                <div className={styles.probabilityGrid}>
                  <div className={styles.probabilityCard}>
                    <div className={styles.probabilityHeader}>
                      <span>Fake</span>
                      <span className={styles.probabilityValue}>
                        {result.fake_probability.toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.probabilityTrack}>
                      <div
                        className={styles.probabilityBar}
                        style={{ width: `${result.fake_probability}%` }}
                      />
                    </div>
                  </div>
                  <div className={styles.probabilityCard}>
                    <div className={styles.probabilityHeader}>
                      <span>Real</span>
                      <span className={styles.probabilityValue}>
                        {result.real_probability.toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.probabilityTrack}>
                      <div
                        className={styles.probabilityBar}
                        style={{ width: `${result.real_probability}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Red Flags & Patterns */}
            {result && (result.red_flags.length > 0 || result.patterns.length > 0) && (
              <div className={styles.twoColumnGrid}>
                {result.red_flags.length > 0 && (
                  <div className={styles.card}>
                    <h3 className={styles.listCardTitle}>
                      <AlertTriangle className={styles.listBulletRed} />
                      Red Flags ({result.red_flags.length})
                    </h3>
                    <ul className={styles.list}>
                      {result.red_flags.map((flag, index) => (
                        <li key={index} className={styles.listItem}>
                          <span className={`${styles.listBullet} ${styles.listBulletRed}`}>•</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.patterns.length > 0 && (
                  <div className={styles.card}>
                    <h3 className={styles.listCardTitle}>
                      <TrendingUp className={styles.listBulletTeal} />
                      Patterns ({result.patterns.length})
                    </h3>
                    <ul className={styles.list}>
                      {result.patterns.map((pattern, index) => (
                        <li key={index} className={styles.listItem}>
                          <span className={`${styles.listBullet} ${styles.listBulletTeal}`}>•</span>
                          <span>{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* AI Reasoning */}
            {result && (
              <div className={styles.card}>
                <h3 className={styles.analysisTitle}>
                  <Brain />
                  AI Analysis
                </h3>
                <p className={styles.analysisText}>{result.reasoning}</p>
              </div>
            )}

            {/* Advanced Features Output */}
            {result?.advanced_features && (
              <div className={styles.card}>
                <h3 className={styles.analysisTitle}>Advanced features</h3>

                {/* TTS */}
                {result.advanced_features.tts && (
                  <div className={styles.featureBlock}>
                    <div className={styles.listCardTitle}>
                      <Volume2 style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                      Text-to-Speech Audio
                    </div>
                    {result.advanced_features.tts.ok && result.advanced_features.tts.url ? (
                      <div className={styles.audioPlayer}>
                        <audio
                          id="news-audio"
                          src={`http://localhost:8000${result.advanced_features.tts.url}`}
                          controls
                          className={styles.audioElement}
                          preload="auto"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ) : (
                      <div className={styles.error} style={{ marginTop: '0.5rem' }}>
                        {result.advanced_features.tts.error || 'Failed to generate audio'}
                      </div>
                    )}
                  </div>
                )}

                {/* NER Reality Checker */}
                {result.advanced_features.ner_reality_checker && (
                  <div className={styles.featureBlock}>
                    <div className={styles.listCardTitle}>
                      Entity reality checker • Score:{' '}
                      {result.advanced_features.ner_reality_checker.credibility_score ?? 0}%
                    </div>
                    <ul className={styles.list}>
                      {(result.advanced_features.ner_reality_checker.entities || []).map((ent, idx) => (
                        <li key={idx} className={styles.listItem}>
                          <span className={`${styles.listBullet} ${ent.verified ? styles.listBulletTeal : styles.listBulletRed}`}>•</span>
                          <span>{ent.text} ({ent.label}) — {ent.status}</span>
                        </li>
                      ))}
                    </ul>
                    {!result.advanced_features.ner_reality_checker.ok && result.advanced_features.ner_reality_checker.error && (
                      <div className={styles.error} style={{ marginTop: '0.5rem' }}>
                        {result.advanced_features.ner_reality_checker.error}
                      </div>
                    )}
                  </div>
                )}








              </div>
            )}

            {/* Similar Articles */}
            {result?.similar_articles && result.similar_articles.length > 0 && (
              <div className={styles.card}>
                <div className={styles.similarHeader}>
                  <h3 className={styles.similarTitle}>
                    <Newspaper />
                    Similar Articles
                  </h3>
                  <span className={styles.similarChip}>Cross-check sources</span>
                </div>
                <div className={styles.similarList}>
                  {result.similar_articles.map((article, index) => (
                    <a
                      key={index}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.similarItem}
                    >
                      <div className={styles.similarThumb}>
                        {article.image ? (
                          // Provided image
                          <img src={article.image} alt="" className={styles.similarImg} />
                        ) : (
                          // Fallback favicon from domain
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${new URL(article.url).hostname}&sz=64`}
                            alt=""
                            className={styles.similarImg}
                          />
                        )}
                      </div>
                      <div>
                        <h4 className={styles.similarItemTitle}>{article.title}</h4>
                        <p className={styles.similarItemPublisher}>{article.publisher.title}</p>
                      </div>
                      <ChevronRight />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Info Cards */}
          <div className={styles.rightColumn}>
            {/* Features Card */}
            <div className={styles.featureCard}>
              <h3 className={styles.cardTitle}>Powered by AI</h3>
              <div className="mt-4 space-y-4">
                <div className={styles.featureRow}>
                  <div className={styles.featureIcon}>
                    <Brain />
                  </div>
                  <div>
                    <p className={styles.featureTitle}>Llama 3.3 70B</p>
                    <p className={styles.featureSubtitle}>LLM-grade intelligence</p>
                  </div>
                </div>
                <div className={styles.featureRow}>
                  <div className={styles.featureIcon}>
                    <Zap />
                  </div>
                  <div>
                    <p className={styles.featureTitle}>Realtime</p>
                    <p className={styles.featureSubtitle}>Instant signal checks</p>
                  </div>
                </div>
                <div className={styles.featureRow}>
                  <div className={styles.featureIcon}>
                    <Eye />
                  </div>
                  <div>
                    <p className={styles.featureTitle}>Deep insights</p>
                    <p className={styles.featureSubtitle}>Pattern-level detection</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How it Works */}
            <div className={styles.stepsCard}>
              <h3 className={styles.cardTitle}>How it works</h3>
              <ol className={styles.stepsList}>
                <li className={styles.stepItem}>
                  <span className={`${styles.stepNumber} ${styles.stepNumberOne}`}>1</span>
                  Paste URL, title, or article
                </li>
                <li className={styles.stepItem}>
                  <span className={`${styles.stepNumber} ${styles.stepNumberTwo}`}>2</span>
                  AI inspects sourcing & language patterns
                </li>
                <li className={styles.stepItem}>
                  <span className={`${styles.stepNumber} ${styles.stepNumberThree}`}>3</span>
                  Get verdict, red flags, and similar sources
                </li>
              </ol>
            </div>

            {/* Stats Card */}
            <div className={styles.statsCard}>
              <h3 className={styles.statsLabel}>Live Signals</h3>
              <p className={styles.statsValue}>95%+ accuracy</p>
              <div className={styles.statsRows}>
                <div className={styles.statsRow}>
                  <span>Latency</span>
                  <span className={styles.statsAccentTeal}>Sub-second</span>
                </div>
                <div className={styles.statsRow}>
                  <span>Signals</span>
                  <span className={styles.statsAccentPurple}>Linguistic + Source</span>
                </div>
                <div className={styles.statsRow}>
                  <span>Coverage</span>
                  <span className={styles.statsAccentPink}>Global news</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <span className={styles.footerLeft}>
            <Sparkles />
            Built with Next.js & FastAPI • Powered by Groq AI
          </span>
          <span className={styles.footerRight}>Veritas • 2025</span>
        </footer>
      </div>
    </div>
  );
}
