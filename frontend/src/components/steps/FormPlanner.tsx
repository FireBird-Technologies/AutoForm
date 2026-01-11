import React, { useState } from 'react';

interface FormPlannerProps {
  onComplete: (formData: any) => void;
}

export const FormPlanner: React.FC<FormPlannerProps> = ({ onComplete }) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#1f2937',
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
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError('');
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Example: Create a customer feedback form with rating and comments"
            style={{
              width: '100%',
              minHeight: '140px',
              padding: '20px',
              fontSize: '17px',
              border: `2px solid ${isFocused ? '#9333ea' : '#e5e7eb'}`,
              borderRadius: '12px',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'all 0.2s',
              marginBottom: '16px',
              boxShadow: isFocused ? '0 0 0 4px rgba(147, 51, 234, 0.1)' : 'none',
              background: '#ffffff'
            }}
          />

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

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
            <button
              onClick={handleGenerate}
              disabled={!description.trim()}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#ffffff',
                background: !description.trim() ? '#d1d5db' : '#9333ea',
                border: 'none',
                borderRadius: '8px',
                cursor: !description.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: !description.trim() ? 'none' : '0 4px 12px rgba(147, 51, 234, 0.3)'
              }}
            onMouseEnter={(e) => {
              if (description.trim()) {
                e.currentTarget.style.background = '#7e22ce';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(147, 51, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (description.trim()) {
                e.currentTarget.style.background = '#9333ea';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.3)';
              }
            }}
            >
              Generate Form
            </button>
          </div>

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
                  color: '#9333ea',
                  background: '#faf5ff',
                  border: '1px solid #e9d5ff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3e8ff';
                  e.currentTarget.style.borderColor = '#d8b4fe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#faf5ff';
                  e.currentTarget.style.borderColor = '#e9d5ff';
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

