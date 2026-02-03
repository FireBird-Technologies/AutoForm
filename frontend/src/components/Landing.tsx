import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player } from '@remotion/player';
import { FeatureCard } from './landing/FeatureCard';
import { WorkflowStep } from './landing/WorkflowStep';
import { GoogleAuthButton } from './GoogleAuthButton';
import { InteractiveDemo } from './landing/InteractiveDemo';
import { DemoVideo } from '../../remotion/DemoVideo';

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const landingRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Check if user is already logged in and redirect
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigate('/build', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all sections and cards
    const elementsToAnimate = landingRef.current?.querySelectorAll(
      '.landing-hero, .features-section, .workflow-section, .demo-section, .showcase-section, .benefits-section, .final-cta, .feature-card, .workflow-step, .viz-card, .benefit-card'
    );

    elementsToAnimate?.forEach(el => observer.observe(el));

    // Animate hero section immediately on mount
    setTimeout(() => {
      const hero = landingRef.current?.querySelector('.landing-hero');
      hero?.classList.add('animate-in');
    }, 100);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing" ref={landingRef}>
      {/* Hero */}

      <header className="landing-hero" style={{ 
          maxWidth: '1400px', 
          padding: '60px 32px 40px',
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: 'none',
          boxShadow: 'none',
          borderRadius: 0,
        }}>
        {/* Browser Mockup Frame */}
        <div style={{
          width: '100%',
          margin: '0 auto',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}>
          {/* Browser Chrome / Title Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #e5e5e5',
            gap: '8px',
          }}>
            {/* Traffic Lights */}
            <div style={{ display: 'flex', gap: '8px', marginRight: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#febc2e' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28c840' }} />
            </div>
            {/* URL Bar */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              padding: '6px 12px',
              border: '1px solid #e5e5e5',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span style={{ fontSize: '13px', color: '#666', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                autoform.ink
              </span>
            </div>
          </div>
          {/* Video Content */}
          <div style={{ backgroundColor: '#000000' }}>
            <Player
              component={DemoVideo}
              durationInFrames={1200}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={30}
              controls
              loop
              autoPlay
              style={{
                width: '100%',
                display: 'block',
              }}
              clickToPlay={false}
            />
          </div>
        </div>

        <div className="landing-cta" style={{ marginTop: '48px' }}>
          <GoogleAuthButton onSuccess={(token) => {
            localStorage.setItem('auth_token', token);
            onStart();
          }}>
            Try the AI-First Form Builder
          </GoogleAuthButton>
        </div>
      </header>

      {/* Interactive Demo */}
      <section className="demo-section" style={{ backgroundColor: 'white' }}>
        <div className="section-container">
          <div className="demo-header">
            <span className="demo-badge">Live Interactive Demo</span>
            <h2 className="section-heading">See It in Action</h2>
            <p className="section-subheading">
              Try our fully functional demo: Fill out the form, explore analytics, view submissions, and see AI-powered response analysis.
              <br />
              <strong>All features are fully interactive</strong> - exactly what you'll use with AutoForm.
            </p>
          </div>
          <InteractiveDemo />
          <div className="demo-cta">
            <p className="demo-cta-text">
              <strong>AI-Powered Analysis:</strong> Preview 20+ question types, track analytics in real-time, and get instant AI insights on your responses. 
              Add conditional logic, validation rules, custom themes, and analyze data without exports.
            </p>
            <GoogleAuthButton
              onSuccess={(token) => {
                localStorage.setItem('auth_token', token);
                onStart();
              }}
            >
              Create Your Own Form
            </GoogleAuthButton>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-heading">Do Everything via AI</h2>
          <p className="section-subheading" style={{ marginBottom: '3rem', fontSize: '1.1rem', color: '#6b7280' }}>
            Create forms instantly. Edit components with simple English. Analyze responses with a specialized AI agent.
            <br />No MCP servers. No hidden features. AI is built into every step.
          </p>
          <div className="features-grid">
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              }
              title="Create Forms Instantly with Simple English"
              description="Describe your form in plain English and let AI create it instantly. No manual field configuration or drag & drop needed."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.71 4.63a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75L23 8.29a1 1 0 0 0 0-1.41z"/>
                  <path d="M16 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  <path d="M20 21v-8"/>
                  <path d="M16 17H8"/>
                </svg>
              }
              title="Add & Edit Components with Simple English"
              description="Tell AI what to add, remove, or change. No clicking through menus or configuring fields manually."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              title="AI-Powered Response Analysis"
              description="After publishing, ask AI anything about your responses. Specialized analytics agent understands your form structure and provides instant insights."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              }
              title="Validation Rules"
              description="Built-in validation for emails, phone numbers, URLs, and more. Ensure data quality from the start."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
              }
              title="19 Question Types"
              description="Text, email, phone, dropdowns, file uploads, ratings, dates, and more. Every field type you need, all AI-generated."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.71 4.63a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75L23 8.29a1 1 0 0 0 0-1.41z"/>
                  <path d="M16 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  <path d="M20 21v-8"/>
                  <path d="M16 17H8"/>
                </svg>
              }
              title="Conditional Logic"
              description="Add skip logic and show/hide rules. Forms adapt based on user responses for smarter data collection."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              title="Clean Design"
              description="Beautiful white/black/purple theme. Mobile-responsive forms that work perfectly on any device."
            />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="workflow-section">
        <div className="section-container">
          <h2 className="section-heading">AI-First Form Building</h2>
          <p className="section-subheading">
            From idea to insights in minutes. Everything powered by AI - no manual configuration needed.
          </p>
          <div className="workflow-steps">
            <WorkflowStep
              number="01"
              title="Create Forms Instantly with Simple English"
              description="Tell AI what form you need. No drag & drop, no manual configuration."
              details={[
                "Natural language understanding",
                "AI generates appropriate question types",
                "Examples: 'Customer feedback survey'",
                "Instant form generation"
              ]}
            />
            <WorkflowStep
              number="02"
              title="Add & Edit Components with Simple English"
              description="Tell AI what to add, remove, or change. No clicking through menus."
              details={[
                "Edit questions using plain English",
                "Add components instantly",
                "Remove or reorder with simple commands",
                "AI understands your form structure"
              ]}
            />
            <WorkflowStep
              number="03"
              title="Publish & Analyze with AI"
              description="Publish your form and ask AI anything about your responses."
              details={[
                "Generate publishable link instantly",
                "Specialized AI analytics agent",
                "Ask questions like 'How many responses?'",
                "Get instant insights without exporting data"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Publish with the World */}
      <section className="sharing-section" style={{
        padding: '80px 20px',
        background: '#ffffff'
      }}>
        <div className="section-container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '60px',
            maxWidth: '1100px',
            margin: '0 auto',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {/* Illustration */}
            <div style={{
              flex: '1 1 300px',
              maxWidth: '400px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                position: 'relative',
                width: '300px',
                height: '220px'
              }}>
                {/* Main form card */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '30px',
                  width: '200px',
                  height: '140px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(147, 51, 234, 0.08)',
                  border: '1px solid #e9d5ff',
                  padding: '12px',
                  zIndex: 2
                }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9333ea' }}></div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#c084fc' }}></div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d8b4fe' }}></div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <div style={{ flex: 1, height: '24px', backgroundColor: '#f5f3ff', borderRadius: '4px' }}></div>
                    <div style={{ flex: 1, height: '24px', backgroundColor: '#f5f3ff', borderRadius: '4px' }}></div>
                    <div style={{ flex: 1, height: '24px', backgroundColor: '#f5f3ff', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ height: '60px', backgroundColor: '#faf5ff', borderRadius: '6px', display: 'flex', alignItems: 'flex-end', padding: '8px', gap: '4px' }}>
                    <div style={{ flex: 1, height: '70%', backgroundColor: '#9333ea', borderRadius: '2px', opacity: 0.8 }}></div>
                    <div style={{ flex: 1, height: '90%', backgroundColor: '#9333ea', borderRadius: '2px', opacity: 0.8 }}></div>
                    <div style={{ flex: 1, height: '50%', backgroundColor: '#9333ea', borderRadius: '2px', opacity: 0.8 }}></div>
                    <div style={{ flex: 1, height: '80%', backgroundColor: '#9333ea', borderRadius: '2px', opacity: 0.8 }}></div>
                  </div>
                </div>
                
                {/* Share icon floating */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '40px',
                  width: '50px',
                  height: '50px',
                  backgroundColor: '#9333ea',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(147, 51, 234, 0.15)',
                  zIndex: 3
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                
                {/* Globe icon */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '20px',
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  border: '2px solid #e9d5ff',
                  zIndex: 1
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                
                {/* Link floating */}
                <div style={{
                  position: 'absolute',
                  bottom: '40px',
                  left: '0',
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '8px 14px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  example.com/shared/...
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div style={{
              flex: '1 1 400px',
              maxWidth: '500px'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '6px 12px',
                backgroundColor: 'rgba(147, 51, 234, 0.05)',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#9333ea',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Publish Instantly
              </div>
              <h2 style={{
                fontSize: '2.2rem',
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: '16px',
                lineHeight: 1.2
              }}>
                Publish your forms with anyone
              </h2>
              <p style={{
                fontSize: '1.1rem',
                color: '#6b7280',
                lineHeight: 1.7,
                marginBottom: '24px'
              }}>
                Generate a public link and publish your forms with anyone - no login required for respondents. 
                Perfect for surveys, registrations, applications, and collecting feedback from anyone.
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#f5f3ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ color: '#374151', fontSize: '15px' }}>One-click publishable links</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#f5f3ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ color: '#374151', fontSize: '15px' }}>No login required for respondents</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#f5f3ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ color: '#374151', fontSize: '15px' }}>Forms work perfectly on any device</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#f5f3ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ color: '#374151', fontSize: '15px' }}>Track all responses in real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Types Showcase */}
      <section className="showcase-section">
        <div className="section-container">
          <h2 className="section-heading">Build Any Type of Form</h2>
          <p className="section-subheading">
            From simple surveys to complex applications
          </p>
          <div className="viz-showcase-grid">
            <div className="viz-card">
              <div className="viz-preview" style={{background: '#ffffff', border: '2px solid #e5e7eb'}}>
                <svg viewBox="0 0 200 120" className="viz-svg">
                  <rect x="30" y="30" width="140" height="15" fill="#9333ea" opacity="0.3" rx="4" />
                  <rect x="30" y="55" width="140" height="15" fill="#9333ea" opacity="0.3" rx="4" />
                  <rect x="30" y="80" width="140" height="15" fill="#9333ea" opacity="0.3" rx="4" />
                  <circle cx="40" cy="37.5" r="4" fill="#9333ea" />
                  <circle cx="40" cy="62.5" r="4" fill="#9333ea" />
                  <circle cx="40" cy="87.5" r="4" fill="#9333ea" />
                </svg>
              </div>
              <h4>Surveys & Feedback</h4>
              <p>Collect customer opinions and ratings</p>
            </div>

            <div className="viz-card">
              <div className="viz-preview" style={{background: '#ffffff', border: '2px solid #e5e7eb'}}>
                <svg viewBox="0 0 200 120" className="viz-svg">
                  <rect x="30" y="25" width="140" height="12" fill="#9333ea" opacity="0.2" rx="3" />
                  <rect x="30" y="45" width="140" height="12" fill="#9333ea" opacity="0.2" rx="3" />
                  <rect x="30" y="65" width="65" height="12" fill="#9333ea" opacity="0.2" rx="3" />
                  <rect x="105" y="65" width="65" height="12" fill="#9333ea" opacity="0.2" rx="3" />
                  <rect x="30" y="85" width="140" height="20" fill="#9333ea" opacity="0.3" rx="3" />
                </svg>
              </div>
              <h4>Registration Forms</h4>
              <p>Event signups and user registrations</p>
            </div>

            <div className="viz-card">
              <div className="viz-preview" style={{background: '#ffffff', border: '2px solid #e5e7eb'}}>
                <svg viewBox="0 0 200 120" className="viz-svg">
                  <rect x="30" y="20" width="140" height="10" fill="#9333ea" opacity="0.2" rx="3" />
                  <rect x="30" y="38" width="140" height="10" fill="#9333ea" opacity="0.2" rx="3" />
                  <rect x="30" y="56" width="140" height="25" fill="#9333ea" opacity="0.2" rx="3" />
                  <rect x="30" y="89" width="50" height="18" fill="#9333ea" opacity="0.5" rx="3" />
                  <path d="M 50,95 L 55,100 L 65,90" stroke="#ffffff" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <h4>Applications</h4>
              <p>Job applications and contact forms</p>
            </div>
          </div>
          <div className="showcase-features">
            <div className="showcase-feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>Built-in validation</span>
            </div>
            <div className="showcase-feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>Conditional logic</span>
            </div>
            <div className="showcase-feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>Easy sharing</span>
            </div>
            <div className="showcase-feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <span>Mobile responsive</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits-section">
        <div className="section-container">
          <div className="benefits-grid">
            <div className="benefit-card">
            <h3>AI-Powered Analytics</h3>
            <p>Ask AI anything about your responses. No need to export data or upload to ChatGPT. Specialized analytics agent understands your form structure and provides instant insights.</p>
            </div>
            <div className="benefit-card">
              <h3>Fast & Reliable</h3>
              <p>Create forms instantly with simple English. Edit components with natural language. Get insights in seconds. Everything powered by AI.</p>
            </div>
            <div className="benefit-card">
              <h3>AI is the Core Product</h3>
              <p>Not an MCP server. Not a hidden chat tool. AI is built into every step - creation, editing, and analysis. This is how forms should work in the age of AI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Ready to Build Forms the Right Way?</h2>
          <p>Join the AI-first form builder. Create, edit, and analyze - all with simple English.</p>
          <GoogleAuthButton 
            className="cta-button-primary"
            onSuccess={(token) => {
              localStorage.setItem('auth_token', token);
              onStart();
            }}
          >
            Start Building with AI - Free
          </GoogleAuthButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img 
              src="/logo.svg" 
              alt="Logo" 
              style={{
                width: '120px',
                height: 'auto',
                marginBottom: '10px'
              }}
            />
          </div>
          <div className="footer-links">
            <a href="https://github.com/FireBird-Technologies/AutoForm" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};