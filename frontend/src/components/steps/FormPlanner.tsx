import React, { useState } from 'react';

interface FormPlannerProps {
  onComplete: (formData: any) => void;
}

export const FormPlanner: React.FC<FormPlannerProps> = ({ onComplete }) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const examples = [
    'Create a customer feedback form with rating and comments',
    'Generate an event registration form with name, email, and dietary preferences',
    'Build a job application form with resume upload and work experience',
    'Make a survey about product satisfaction with multiple choice and ratings'
  ];

  const handleGenerate = () => {
    if (!description.trim()) {
      setError('Please describe the form you want to create');
      return;
    }

    // Navigate immediately to form builder with user query
    // Form builder will handle the generation and display
    onComplete({ 
      isGenerating: true, 
      user_query: description,
      title: 'Generating Form...',
      description: description,
      questions: [],
      conditional_rules: []
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '12vh 20px 40px 20px',
      background: '#ffffff'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '38px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#9333ea',
            marginBottom: '16px',
            letterSpacing: '-0.02em'
          }}>
            What form do you need?
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Tell us what you want to create and we'll build it for you
          </p>
        </div>

        <div style={{
          maxWidth: '900px',
          width: '100%'
        }}>
          <div style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError('');
            }}
              onFocus={(e) => {
                e.target.style.borderColor = '#9333ea';
                e.target.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = '0 2px 8px rgba(147, 51, 234, 0.15)';
              }}
            placeholder="Example: Create a customer feedback form with rating and comments"
            style={{
              width: '100%',
              minHeight: '140px',
                padding: '20px 60px 20px 20px',
              fontSize: '17px',
                border: '1px solid #e5e7eb',
              borderRadius: '12px',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'all 0.2s',
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(147, 51, 234, 0.15)'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && description.trim()) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={!description.trim()}
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                background: (!description.trim()) ? '#d1d5db' : '#9333ea',
                border: 'none',
                borderRadius: '8px',
                cursor: (!description.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: (!description.trim()) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (description.trim()) {
                  e.currentTarget.style.background = '#7e22ce';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (description.trim()) {
                  e.currentTarget.style.background = '#9333ea';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {error && (
            <div style={{
              padding: '16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#991b1b',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {/* Suggestions as pills below button */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {examples.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setDescription(example)}
                style={{
                  padding: '10px 16px',
                  fontSize: '14px',
                  color: '#374151',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9333ea';
                  e.currentTarget.style.color = '#9333ea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#374151';
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

