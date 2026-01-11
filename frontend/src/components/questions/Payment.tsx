import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const Payment: React.FC<QuestionProps> = ({
  question,
  value: _value,
  onChange: _onChange,
  disabled: _disabled = false
}) => {
  const amount = question.settings?.payment_amount || 0;
  const currency = question.settings?.currency || 'USD';

  return (
    <div className="question-wrapper">
      <label className="question-label">
        {question.question_text}
        {question.required && <span className="required-mark">*</span>}
      </label>
      {question.description && (
        <p className="question-description">{question.description}</p>
      )}
      <div className="payment-container">
        <div className="payment-amount">
          Amount: {currency} {amount.toFixed(2)}
        </div>
        <div className="payment-placeholder">
          <p>Payment integration placeholder</p>
          <p className="input-hint">
            In production, this would integrate with Stripe, PayPal, or other payment processors
          </p>
        </div>
      </div>
    </div>
  );
};

