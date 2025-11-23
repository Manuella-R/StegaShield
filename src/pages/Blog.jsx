import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/styles.css';
import { blogsAPI } from '../utils/api';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Static fallback articles (same as before)
  const staticArticles = [
    {
      id: 1,
      title: 'The Rise of Deepfakes: A Threat to Digital Trust',
      category: 'deepfakes',
      date: 'January 10, 2025',
      author: 'Dr. Sarah Chen',
      excerpt: 'As manipulation technology becomes more accessible, deepfakes pose an increasing threat to digital authenticity. Learn about the current state of deepfake technology and how to protect yourself.',
      content: `The proliferation of deepfake technology has reached alarming levels. Recent studies show that over 95% of deepfake videos are non-consensual, with significant implications for privacy, security, and public trust.

Deepfakes leverage advanced generative techniques to create highly convincing fake videos. The technology has improved dramatically, making it increasingly difficult to distinguish between real and manipulated content. This poses serious risks to journalism, politics, and personal security.

Detection technologies are advancing in parallel, using pattern recognition and signal analysis to identify subtle artifacts in manipulated content. However, as generation techniques improve, so must our detection capabilities. StegaShield employs advanced detection methods to identify these threats.

The key to combating deepfakes lies in a multi-layered approach: technical detection, media literacy, and proactive authentication measures like watermarking. By combining these strategies, we can build more resilient systems for verifying digital authenticity.`,
      image: '🔴',
    },
    {
      id: 2,
      title: 'Watermarking 101: Protecting Your Digital Assets',
      category: 'watermarking',
      date: 'January 8, 2025',
      author: 'Michael Rodriguez',
      excerpt: 'A comprehensive guide to understanding digital watermarking, its applications, and how to effectively protect your intellectual property using invisible watermarks.',
      content: `Digital watermarking is the process of embedding imperceptible information into media files to establish ownership and verify authenticity. Unlike visible watermarks that can be removed or cropped, invisible watermarks are embedded in a way that survives common transformations.

There are several watermarking algorithms, each with different strengths:
- LSB (Least Significant Bit): Simple but fragile, suitable for basic use cases
- DWT (Discrete Wavelet Transform): More robust, resists compression
- DCT (Discrete Cosine Transform): Excellent balance of quality and robustness
- SVD (Singular Value Decomposition): Enterprise-grade, highly resistant to attacks

The choice of algorithm depends on your specific needs. For casual users protecting personal photos, LSB watermarking may suffice. Content creators requiring stronger protection should opt for DWT or DCT. Enterprise applications often require the robustness of SVD.

Watermarking serves multiple purposes: copyright protection, proof of ownership, content tracking, and tamper detection. By embedding watermarks in your original content before distribution, you create a digital fingerprint that can prove ownership even after the content has been shared or modified.`,
      image: '💧',
    },
    {
      id: 3,
      title: 'How Technology is Changing Media Authentication',
      category: 'technology',
      date: 'January 5, 2025',
      author: 'Dr. James Park',
      excerpt: 'Advanced detection methods are revolutionizing how we verify media authenticity. Explore the latest detection techniques and their implications.',
      content: `Modern detection systems have transformed media authentication from a manual, time-consuming process to an automated, accurate system. Advanced algorithms can analyze thousands of images in seconds, identifying patterns that would be imperceptible to human eyes.

Sophisticated detection methods can identify:
- Facial inconsistencies in deepfakes
- Lighting anomalies in manipulated videos
- Compression artifacts from editing
- Frequency domain irregularities
- Temporal inconsistencies in video sequences

The challenge lies in keeping detection methods current. As new generation techniques emerge, detection systems must be continuously updated. This arms race between generation and detection technologies drives innovation in both fields.

At StegaShield, we employ ensemble methods combining multiple detection techniques for higher accuracy. By analyzing content through different lenses (spatial, frequency, temporal), we achieve 95%+ accuracy in identifying manipulated media.`,
      image: '🔬',
    },
    {
      id: 4,
      title: 'Protecting Journalistic Integrity in the Age of Misinformation',
      category: 'journalism',
      date: 'January 3, 2025',
      author: 'Lisa Thompson',
      excerpt: 'How newsrooms are using authentication tools to verify sources and maintain editorial integrity in an era of widespread misinformation.',
      content: `Journalism faces unprecedented challenges in verifying content authenticity. The speed of news cycles combined with the sophistication of manipulation tools creates a perfect storm for misinformation.

Leading newsrooms are implementing multi-step verification processes:
1. Source verification using blockchain timestamps
2. Image authentication through watermark detection
3. Deepfake screening for video content
4. Metadata analysis to verify origin and editing history

Tools like StegaShield enable journalists to quickly verify images and videos before publication. By embedding watermarks in source materials and checking for existing watermarks in submitted content, newsrooms can maintain higher standards of authenticity.

The impact extends beyond traditional media. Social media platforms are also implementing verification mechanisms, though challenges remain in scale and speed. Automated systems can flag suspicious content, but human editorial judgment remains essential.`,
      image: '📰',
    },
    {
      id: 5,
      title: 'Steganography vs. Cryptography: Understanding the Difference',
      category: 'technology',
      date: 'December 28, 2024',
      author: 'Prof. David Kim',
      excerpt: 'Learn about the fundamental differences between steganography and cryptography, and when to use each approach for protecting information.',
      content: `While often confused, steganography and cryptography serve different purposes in information security. Cryptography scrambles information to make it unreadable, while steganography hides information to make it undetectable.

Cryptography transforms data into ciphertext that appears random but can be decrypted with the correct key. The security relies on computational difficulty, making decryption impractical without the key. This is ideal for protecting data during transmission.

Steganography hides information within other data, making the hidden information's existence itself secret. The security comes from obscurity - an attacker may not even know there's hidden information to find. This makes steganography ideal for watermarking and covert communication.

In digital watermarking, we combine both approaches: steganography hides the watermark in the media, while cryptographic techniques ensure only authorized parties can extract and verify it. This dual approach provides both invisibility and security.`,
      image: '🔐',
    },
    {
      id: 6,
      title: 'The Future of Content Verification: Blockchain and Beyond',
      category: 'technology',
      date: 'December 25, 2024',
      author: 'Alexandra Wright',
      excerpt: 'Exploring emerging technologies like blockchain for content verification and how they might shape the future of digital authentication.',
      content: `Blockchain technology offers promising solutions for content verification. By creating immutable records of content creation and modification, blockchain can provide tamper-proof authentication trails.

Key applications include:
- Timestamping content creation
- Tracking content modifications
- Establishing ownership chains
- Verifying source authenticity

However, blockchain has limitations: storage costs, scalability challenges, and energy consumption. Hybrid approaches combining blockchain for metadata with traditional watermarking for content integrity may offer the best of both worlds.

Looking further ahead, quantum computing may revolutionize both cryptography and steganography. Quantum-resistant algorithms are already being developed, anticipating the day when quantum computers could break current encryption methods.`,
      image: '⛓️',
    },
  ];

  useEffect(() => {
    fetchBlogPosts();
  }, [selectedCategory]);

  const fetchBlogPosts = async () => {
    setLoading(true);
    try {
      const category = selectedCategory === 'all' ? null : selectedCategory;
      const response = await blogsAPI.getPublishedBlogs(category);
      
      if (response.posts && response.posts.length > 0) {
        // Map API posts to the format expected by the component
        const formattedPosts = response.posts.map(post => ({
          id: post.post_id,
          title: post.title,
          category: post.category,
          date: post.date || new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          author: post.author || post.author_name || 'Admin',
          excerpt: post.excerpt || post.content.substring(0, 150) + '...',
          content: post.content,
          image: post.image_emoji || '📝',
        }));
        setArticles(formattedPosts);
      } else {
        // Fallback to static articles if no posts from API
        setArticles(staticArticles);
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
      // Fallback to static articles on error
      setArticles(staticArticles);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'deepfakes', 'watermarking', 'ai', 'journalism', 'technology'];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgba(18, 2, 2, 0.92), rgba(61, 14, 14, 0.85))', color: 'var(--cream)', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '3rem' }}>
          <Link to="/" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>← Back to Home</Link>
        </nav>

        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>Blog & Resources</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '3rem', color: 'var(--muted-cream)' }}>
          Insights, tutorials, and news about digital authentication, watermarking, and deepfake detection
        </p>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '0.75rem 1.5rem',
                background: selectedCategory === category ? 'var(--accent-gold)' : 'rgba(245, 230, 211, 0.1)',
                color: selectedCategory === category ? 'var(--dark-red)' : 'var(--cream)',
                border: '1px solid rgba(245, 230, 211, 0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontWeight: selectedCategory === category ? 'bold' : 'normal',
                transition: 'all 0.3s ease',
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted-cream)' }}>
            <p style={{ fontSize: '1.2rem' }}>Loading blog posts...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {articles.map(article => (
            <article
              key={article.id}
              style={{
                padding: '2rem',
                background: 'rgba(10, 2, 2, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = 'var(--accent-gold)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(212, 175, 55, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(245, 230, 211, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{article.image}</div>
              <div style={{ 
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                background: 'rgba(245, 230, 211, 0.2)',
                borderRadius: '4px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                textTransform: 'capitalize',
                color: 'var(--accent-gold)',
              }}>
                {article.category}
              </div>
              <h2 style={{ color: 'var(--accent-gold)', marginBottom: '0.75rem', fontSize: '1.5rem', lineHeight: '1.3' }}>
                {article.title}
              </h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--muted-cream)', marginBottom: '1rem' }}>
                By {article.author} • {article.date}
              </div>
              <p style={{ color: 'var(--muted-cream)', lineHeight: '1.7', marginBottom: '1rem' }}>
                {article.excerpt}
              </p>
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 'bold' }}>
                  Read Full Article
                </summary>
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(245, 230, 211, 0.2)' }}>
                  <p style={{ color: 'var(--muted-cream)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                    {article.content}
                  </p>
                </div>
              </details>
            </article>
            ))}
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted-cream)' }}>
            <p style={{ fontSize: '1.2rem' }}>No articles found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

