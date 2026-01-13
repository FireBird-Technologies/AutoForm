import React from 'react';

interface QuestionProps {
  question: any;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  accentColor?: string;
  boldTextColor?: string;
}

export const Button: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  accentColor = '#9333ea',
  boldTextColor
}) => {
  const effectiveAccent = boldTextColor || accentColor;
  const buttonText = question.settings?.button_text || 'Click Me';
  const buttonStyle = question.settings?.button_style || 'primary';
  const [isClicked, setIsClicked] = React.useState(false);

  const handleClick = () => {
    if (!disabled) {
      const timestamp = Date.now();
      setIsClicked(true);
      onChange({ clicked: true, timestamp });
      
      // Visual feedback - reset after animation
      setTimeout(() => setIsClicked(false), 200);
    }
  };

  return (
    <div style={{ marginBottom: '48px' }}>
      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: '600',
          color: buttonStyle === 'primary' ? '#ffffff' : buttonStyle === 'secondary' ? effectiveAccent : '#6b7280',
          background: buttonStyle === 'primary' ? effectiveAccent : buttonStyle === 'secondary' ? 'transparent' : '#f3f4f6',
          border: buttonStyle === 'primary' ? 'none' : `2px solid ${buttonStyle === 'secondary' ? effectiveAccent : '#e5e7eb'}`,
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s',
          transform: isClicked ? 'scale(0.95)' : 'scale(1)',
          boxShadow: buttonStyle === 'primary' ? '0 2px 8px rgba(147, 51, 234, 0.2)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            if (buttonStyle === 'primary') {
              e.currentTarget.style.background = effectiveAccent + 'dd';
              e.currentTarget.style.boxShadow = `0 4px 12px ${effectiveAccent}4d`;
            } else if (buttonStyle === 'secondary') {
              e.currentTarget.style.background = `${effectiveAccent}10`;
            } else {
              e.currentTarget.style.background = '#e5e7eb';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            if (buttonStyle === 'primary') {
              e.currentTarget.style.background = effectiveAccent;
              e.currentTarget.style.boxShadow = `0 2px 8px ${effectiveAccent}33`;
            } else if (buttonStyle === 'secondary') {
              e.currentTarget.style.background = 'transparent';
            } else {
              e.currentTarget.style.background = '#f3f4f6';
            }
          }
        }}
      >
        {buttonText}
      </button>
      
      {value?.clicked && (
        <div style={{
          marginTop: '12px',
          fontSize: '14px',
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Clicked
        </div>
      )}
    </div>
  );
};
