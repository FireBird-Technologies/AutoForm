import React, { useState, useEffect } from 'react';
import { QuestionProps } from './ShortAnswer';

export const Ranking: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const rankingItems = question.settings?.ranking_items || [];
  const [items, setItems] = useState<string[]>(value?.ranked_items || [...rankingItems]);

  useEffect(() => {
    if (!value?.ranked_items) {
      setItems([...rankingItems]);
    }
  }, [rankingItems]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newItems.length) {
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      setItems(newItems);
      onChange({ ranked_items: newItems });
    }
  };

  return (
    <div className="question-wrapper">
      <label className="question-label">
        {question.question_text}
        {question.required && <span className="required-mark">*</span>}
      </label>
      {question.description && (
        <p className="question-description">{question.description}</p>
      )}
      <div className="ranking-container">
        {items.map((item, index) => (
          <div key={index} className="ranking-item">
            <span className="ranking-number">{index + 1}</span>
            <span className="ranking-text">{item}</span>
            <div className="ranking-controls">
              <button
                type="button"
                onClick={() => moveItem(index, 'up')}
                disabled={disabled || index === 0}
                className="ranking-button"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 'down')}
                disabled={disabled || index === items.length - 1}
                className="ranking-button"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

