import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const Payment: React.FC<QuestionProps> = ({
  question,
  value: _value,
  onChange: _onChange,
  disabled: _disabled = false,
  accentColor = '#9333ea',
  boldTextColor
}) => {
  const effectiveAccent = boldTextColor || accentColor;
  const amount = question.settings?.payment_amount || 0;
  const currency = question.settings?.currency || 'USD';

  return (
    <div style={{ marginBottom: '48px' }}>
      <label style={{
        display: 'block',
        fontSize: '16px',
        fontWeight: '500',
        color: '#000000',
        marginBottom: '8px',
        letterSpacing: '-0.01em'
      }}>
        {question.question_text}
        {question.required && <span style={{ color: effectiveAccent, marginLeft: '4px' }}>*</span>}
      </label>
      {question.description && (
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '12px',
          lineHeight: '1.5'
        }}>
          {question.description}
        </p>
      )}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: effectiveAccent,
          marginBottom: '12px'
        }}>
          Amount: {currency} {amount.toFixed(2)}
        </div>
        <div style={{
          padding: '24px',
          background: '#f9fafb',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Payment integration placeholder
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            In production, this would integrate with Stripe, PayPal, or other payment processors
          </p>
        </div>
      </div>
    </div>
  );
};

