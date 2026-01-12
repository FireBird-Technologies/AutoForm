import React, { useState, useEffect } from 'react';
import { QuestionProps } from './ShortAnswer';

// Helper to normalize int or list to array of strings
const normalizeToArray = (val: number | string[] | undefined, prefix: string): string[] => {
  if (!val) return [];
  if (typeof val === 'number') {
    return Array.from({ length: Math.max(2, val) }, (_, i) => `${prefix} ${i + 1}`);
  }
  return val;
};

export const Ranking: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const rankingItems = normalizeToArray(question.settings?.ranking_items, 'Item');
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
    <div style={{
      marginBottom: '48px',
      transition: 'all 0.2s'
    }}>
      <label style={{
        display: 'block',
        fontSize: '16px',
        fontWeight: '500',
        color: '#000000',
        marginBottom: '8px',
        letterSpacing: '-0.01em'
      }}>
        {question.question_text}
        {question.required && <span style={{ color: '#9333ea', marginLeft: '4px' }}>*</span>}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, index) => (
          <div 
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: '#ffffff'
            }}
          >
            <span style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '600',
              color: '#9333ea',
              background: '#faf5ff',
              borderRadius: '4px'
            }}>
              {index + 1}
            </span>
            <span style={{
              flex: 1,
              fontSize: '15px',
              color: '#000000'
            }}>
              {item}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => moveItem(index, 'up')}
                disabled={disabled || index === 0}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: disabled || index === 0 ? '#d1d5db' : '#6b7280',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: disabled || index === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !(disabled || index === 0) && (e.currentTarget.style.borderColor = '#9333ea')}
                onMouseLeave={(e) => !(disabled || index === 0) && (e.currentTarget.style.borderColor = '#e5e7eb')}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 'down')}
                disabled={disabled || index === items.length - 1}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: disabled || index === items.length - 1 ? '#d1d5db' : '#6b7280',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: disabled || index === items.length - 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !(disabled || index === items.length - 1) && (e.currentTarget.style.borderColor = '#9333ea')}
                onMouseLeave={(e) => !(disabled || index === items.length - 1) && (e.currentTarget.style.borderColor = '#e5e7eb')}
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

