import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeatureCard } from './landing/FeatureCard';
import { WorkflowStep } from './landing/WorkflowStep';
import { GoogleAuthButton } from './GoogleAuthButton';
// import { DemoForms } from './landing/DemoForms';

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

      <header className="landing-hero">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0px', gap: '0.25rem' }}>
          <div className="landing-badge" style={{ marginBottom: 0 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '0.4em' }}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Open Source
          </div>
          <img 
            src="/logo.svg" 
            alt="Logo" 
            className="hero-logo"
            style={{
              width: '600px',
              height: 'auto',
              marginBottom: 0,
              marginTop: 0
            }}
          />
        </div>
        <h1 className="landing-title">Build Forms with AI</h1>
        <p className="landing-subtitle">
          AutoForm creates beautiful, intelligent forms from simple descriptions.
          <br />Fast. No complexity. Just forms that work.
        </p>
        <div className="landing-cta">
          <GoogleAuthButton onSuccess={(token) => {
            localStorage.setItem('auth_token', token);
            onStart();
          }}>
            Create Forms for free
          </GoogleAuthButton>
        </div>
      </header>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-heading">Everything you need to build forms</h2>
          <div className="features-grid">
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              }
              title="AI-Powered Generation"
              description="Describe your form in plain English and let AI create it instantly. No manual field configuration needed."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              }
              title="19 Question Types"
              description="Text, email, phone, dropdowns, file uploads, ratings, dates, and more. Every field type you need."
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
              title="Easy Sharing"
              description="Generate publishable links instantly. No login required for respondents. Collect responses from anyone, anywhere."
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              title="Response Management"
              description="Track all submissions in one place. View individual responses and export data in CSV or JSON format."
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
          <h2 className="section-heading">Building forms is as easy as 1, 2, 3</h2>
          <p className="section-subheading">
            From idea to live form in minutes. No technical skills required.
          </p>
          <div className="workflow-steps">
            <WorkflowStep
              number="01"
              title="Describe Your Form"
              description="Tell us what kind of form you need in plain English."
              details={[
                "Natural language understanding",
                "AI suggests appropriate question types",
                "Examples: 'Customer feedback survey'",
                "Context-aware field generation"
              ]}
            />
            <WorkflowStep
              number="02"
              title="Review & Customize"
              description="Get instant form generation and refine as needed."
              details={[
                "19 question types supported",
                "Add conditional logic and validation",
                "Reorder questions with drag & drop",
                "Set required fields and defaults"
              ]}
            />
            <WorkflowStep
              number="03"
              title="Publish & Collect"
              description="Publish your form and start collecting responses."
              details={[
                "Generate publishable link instantly",
                "No login required for respondents",
                "Real-time response tracking",
                "Export responses as CSV or JSON"
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

      {/* Interactive Demo */}
      <section className="demo-section" style={{ backgroundColor: 'white' }}>
        <div className="section-container">
          <div className="demo-header">
            <span className="demo-badge">Live Interactive Demo</span>
            <h2 className="section-heading">See It in Action</h2>
            <p className="section-subheading">
              Experience how easy it is to create forms with AI. 
              <strong> Describe what you need</strong> and watch as intelligent forms are generated instantly!
              Build surveys, registration forms, applications, and more - all from natural language.
            </p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(147, 51, 234, 0.08)', position: 'relative' }}>
            {/* Form Examples Demo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Customer Feedback Form */}
              <div style={{ 
                background: '#ffffff', 
                border: '2px solid #e9d5ff', 
                borderRadius: '12px', 
                padding: '20px',
                boxShadow: '0 2px 8px rgba(147, 51, 234, 0.06)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000', marginBottom: '16px' }}>
                  Customer Feedback Survey
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>
                      How satisfied are you with our service? *
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1,2,3,4,5].map(n => (
                        <div key={n} style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '2px solid #e9d5ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          color: '#9333ea'
                        }}>
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>
                      Additional comments
                    </div>
                    <div style={{
                      height: '60px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: '#faf5ff'
                    }}></div>
                  </div>
                </div>
              </div>

              {/* Event Registration Form */}
              <div style={{ 
                background: '#ffffff', 
                border: '2px solid #e9d5ff', 
                borderRadius: '12px', 
                padding: '20px',
                boxShadow: '0 2px 8px rgba(147, 51, 234, 0.06)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000', marginBottom: '16px' }}>
                  Event Registration
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>
                      Full Name *
                    </div>
                    <div style={{
                      height: '38px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: '#faf5ff'
                    }}></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>
                      Email Address *
                    </div>
                    <div style={{
                      height: '38px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: '#faf5ff'
                    }}></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>
                      Ticket Type *
                    </div>
                    <div style={{
                      height: '38px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: '#faf5ff',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 12px',
                      fontSize: '14px',
                      color: '#9333ea'
                    }}>
                      Select...
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div style={{ 
                background: '#ffffff', 
                border: '2px solid #e9d5ff', 
                borderRadius: '12px', 
                padding: '20px',
                boxShadow: '0 2px 8px rgba(147, 51, 234, 0.06)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000', marginBottom: '16px' }}>
                  Contact Us
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>
                      Subject *
                    </div>
                    <div style={{
                      height: '38px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: '#faf5ff'
                    }}></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>
                      Message *
                    </div>
                    <div style={{
                      height: '80px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: '#faf5ff'
                    }}></div>
                  </div>
                  <div style={{
                    height: '38px',
                    background: '#9333ea',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Submit
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="demo-cta">
            <p className="demo-cta-text">
              <strong>🚀 Intelligent Forms:</strong> Add conditional logic, validation rules, and custom field types. 
              These are just examples. You can create <strong>any form you can imagine</strong> - just describe it in plain English.
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
              <h3>No Code Required</h3>
              <p>Built for everyone - from analysts to executives. If you can describe it, we can visualize it.</p>
            </div>
            <div className="benefit-card">
              <h3>Lightning Fast</h3>
              <p>Go from upload to insight in under 60 seconds. Our backend handles all the heavy lifting.</p>
            </div>
            <div className="benefit-card">
              <h3>Enterprise Ready</h3>
              <p>Secure, scalable, and built with production workloads in mind. Connect to any database.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Ready to build intelligent forms?</h2>
          <p>Join thousands of teams collecting data faster with AI-powered forms.</p>
          <GoogleAuthButton 
            className="cta-button-primary"
            onSuccess={(token) => {
              localStorage.setItem('auth_token', token);
              onStart();
            }}
          >
            Create Your First Form - Free
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
            <a href="https://github.com/FireBird-Technologies/Auto-Dash" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="#features">Features</a>
            <a href="#benefits">Benefits</a>
          </div>
        </div>
      </footer>
    </div>
  );
};