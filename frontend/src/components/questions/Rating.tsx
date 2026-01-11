import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const Rating: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const ratingValue = value?.rating || 0;
  const maxRating = question.settings?.max_value || 5;

  return (
    <div className="question-wrapper">
      <label className="question-label">
        {question.question_text}
        {question.required && <span className="required-mark">*</span>}
      </label>
      {question.description && (
        <p className="question-description">{question.description}</p>
      )}
      <div className="rating-container">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          return (
            <button
              key={index}
              type="button"
              className={`star-button ${starValue <= ratingValue ? 'star-filled' : 'star-empty'}`}
              onClick={() => !disabled && onChange({ rating: starValue })}
              disabled={disabled}
            >
              ★
            </button>
          );
        })}
      </div>
      {ratingValue > 0 && (
        <div className="rating-display">
          {ratingValue} out of {maxRating} stars
        </div>
      )}
    </div>
  );
};

