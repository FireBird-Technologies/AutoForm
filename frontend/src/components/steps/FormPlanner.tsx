import React, { useState } from 'react';
import { config, getAuthHeaders } from '../../config';

interface FormPlannerProps {
  onComplete: (formData: any) => void;
}

export const FormPlanner: React.FC<FormPlannerProps> = ({ onComplete }) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const examples = [
    'Create a customer feedback form with rating and comments',
    'Generate an event registration form with name, email, and dietary preferences',
    'Build a job application form with resume upload and work experience',
    'Make a survey about product satisfaction with multiple choice and ratings'
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe the form you want to create');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${config.backendUrl}/api/forms/generate`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        credentials: 'include',
        body: JSON.stringify({
          user_query: description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate form');
      }

      const data = await response.json();
      onComplete(data.form);
    } catch (err: any) {
      console.error('Form generation error:', err);
      setError(err.message || 'Failed to generate form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#000000',
          marginBottom: '12px'
        }}>
          Describe Your Form
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          marginBottom: '32px'
        }}>
          Tell us what kind of form you need, and our AI will generate it for you.
        </p>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#000000',
            marginBottom: '8px'
          }}>
            Form Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: Create a customer feedback form with rating, comments, and contact information"
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              fontSize: '15px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#9333ea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '12px'
          }}>
            Examples:
          </p>
          <div style={{
            display: 'grid',
            gap: '8px'
          }}>
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => setDescription(example)}
                style={{
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#6b7280',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#faf5ff';
                  e.currentTarget.style.borderColor = '#9333ea';
                  e.currentTarget.style.color = '#9333ea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#f3e8ff',
            border: '1px solid #e9d5ff',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff',
            background: isGenerating || !description.trim() ? '#d1d5db' : '#9333ea',
            border: 'none',
            borderRadius: '8px',
            cursor: isGenerating || !description.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!isGenerating && description.trim()) {
              e.currentTarget.style.background = '#7e22ce';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGenerating && description.trim()) {
              e.currentTarget.style.background = '#9333ea';
            }
          }}
        >
          {isGenerating ? (
            <>
              <div className="loading-spinner" style={{ width: 20, height: 20 }} />
              Generating Form...
            </>
          ) : (
            'Generate Form'
          )}
        </button>

        <p style={{
          fontSize: '13px',
          color: '#9ca3af',
          textAlign: 'center',
          marginTop: '16px'
        }}>
          This will use 5 credits
        </p>
      </div>
    </div>
  );
};

