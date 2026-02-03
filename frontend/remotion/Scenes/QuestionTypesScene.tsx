import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const QuestionTypesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = 31 * fps; // Starts at 31 seconds (frame 930)

  // Grid of question types - more types for fuller screen
  const questionTypes = [
    { label: 'Short Text', icon: '📝', color: '#9333ea' },
    { label: 'Long Answer', icon: '📄', color: '#7c3aed' },
    { label: 'Email', icon: '📧', color: '#8b5cf6' },
    { label: 'Phone', icon: '📞', color: '#a855f7' },
    { label: 'Multiple Choice', icon: '⭕', color: '#9333ea' },
    { label: 'Checkboxes', icon: '☑️', color: '#7c3aed' },
    { label: 'Dropdown', icon: '📋', color: '#8b5cf6' },
    { label: 'Rating', icon: '⭐', color: '#a855f7' },
    { label: 'Date Picker', icon: '📅', color: '#9333ea' },
    { label: 'File Upload', icon: '📎', color: '#7c3aed' },
    { label: 'Signature', icon: '✍️', color: '#8b5cf6' },
    { label: 'Linear Scale', icon: '📊', color: '#a855f7' },
  ];

  // Title animation
  const titleOpacity = interpolate(
    frame,
    [startFrame, startFrame + 15],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 100%)',
        padding: '50px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ opacity: titleOpacity, textAlign: 'center', marginBottom: '40px' }}>
        <h2
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
          }}
        >
          19+ Question Types
        </h2>
        <p
          style={{
            fontSize: '28px',
            color: '#6b7280',
          }}
        >
          Every field type you need, all AI-generated
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
          width: '100%',
          maxWidth: '1400px',
        }}
      >
        {questionTypes.map((type, index) => {
          const delay = index * 6; // Stagger animation
          const opacity = interpolate(
            frame,
            [startFrame + 15 + delay, startFrame + 28 + delay],
            [0, 1],
            {
              easing: Easing.out(Easing.ease),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          const scale = interpolate(
            frame,
            [startFrame + 15 + delay, startFrame + 28 + delay],
            [0.8, 1],
            {
              easing: Easing.out(Easing.back(1.3)),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          const y = interpolate(
            frame,
            [startFrame + 15 + delay, startFrame + 28 + delay],
            [20, 0],
            {
              easing: Easing.out(Easing.ease),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          return (
            <div
              key={index}
              style={{
                opacity,
                transform: `scale(${scale}) translateY(${y}px)`,
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '28px',
                textAlign: 'center',
                border: '2px solid #e9d5ff',
                boxShadow: '0 6px 20px rgba(147, 51, 234, 0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '52px',
                  marginBottom: '14px',
                }}
              >
                {type.icon}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                {type.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
