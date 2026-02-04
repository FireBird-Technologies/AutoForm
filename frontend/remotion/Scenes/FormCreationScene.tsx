import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const FormCreationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = 4 * fps; // Starts at 4 seconds

  // Typing animation - starts immediately
  const prompt = "Create a customer feedback survey with ratings and comments";
  const typingProgress = interpolate(frame, [startFrame + 5, startFrame + 95], [0, prompt.length], { easing: Easing.linear, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const displayedText = prompt.slice(0, Math.floor(typingProgress));

  // ZOOM EFFECT: Stay zoomed in while typing, then zoom out to normal
  // Typing ends at startFrame + 95, zoom out from startFrame + 100 to startFrame + 130
  const zoomScale = interpolate(
    frame, 
    [startFrame, startFrame + 95, startFrame + 100, startFrame + 130], 
    [1.4, 1.4, 1.4, 1], // Zoom in -> hold -> zoom out to 1x (centered)
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  // Pan position - focus on chat input while zoomed, then center (0,0) when zoomed out
  const panX = interpolate(
    frame,
    [startFrame, startFrame + 95, startFrame + 100, startFrame + 130],
    [18, 18, 18, 0], // Shift to show chat, then center
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  const panY = interpolate(
    frame,
    [startFrame, startFrame + 95, startFrame + 100, startFrame + 130],
    [0, 0, 0, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Form container appears (after zoom out)
  const formOpacity = interpolate(frame, [startFrame + 130, startFrame + 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const formScale = interpolate(frame, [startFrame + 130, startFrame + 150], [0.95, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Form fields animate in sequentially - matching exact UI components
  const field1Opacity = interpolate(frame, [startFrame + 150, startFrame + 165], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const field2Opacity = interpolate(frame, [startFrame + 165, startFrame + 180], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const field3Opacity = interpolate(frame, [startFrame + 180, startFrame + 195], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const field4Opacity = interpolate(frame, [startFrame + 195, startFrame + 210], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
    }}>
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      gap: '40px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transform: `scale(${zoomScale}) translate(${panX}%, ${panY}%)`,
      transformOrigin: 'center center',
    }}>
      {/* Left side - Chat input matching FormChatPanel */}
      <div style={{ width: '580px', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#9333ea',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Step 1: Describe Your Form
        </div>
        
        {/* Chat panel header - matching FormChatPanel */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#faf5ff',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #9333ea, #9333eadd)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>Form Assistant</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Describe what you need</div>
            </div>
          </div>

          {/* Message area */}
          <div style={{ padding: '16px 18px' }}>
            {/* User message */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
              marginBottom: '12px',
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#9333ea',
                marginBottom: '6px',
              }}>
                You
              </div>
              <div style={{ fontSize: '14px', color: '#1f2937', lineHeight: 1.5, minHeight: '21px' }}>
                {displayedText}
                {frame < startFrame + 90 && (
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '16px',
                    backgroundColor: '#9333ea',
                    marginLeft: '2px',
                    verticalAlign: 'middle',
                  }} />
                )}
              </div>
            </div>

            {/* AI response */}
            {frame >= startFrame + 95 && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
              }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#6b7280',
                  marginBottom: '6px',
                }}>
                  Assistant
                </div>
                <div style={{ fontSize: '14px', color: '#1f2937', lineHeight: 1.5 }}>
                  ✓ Creating <strong style={{ color: '#9333ea' }}>Customer Feedback Survey</strong><br />
                  Generated 4 questions with ratings and text fields
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Generated Form with exact question component styling */}
      <div style={{
        opacity: formOpacity,
        transform: `scale(${formScale})`,
        width: '520px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 10px 40px rgba(147, 51, 234, 0.12)',
        border: '1px solid #e9d5ff',
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '28px',
          paddingBottom: '14px',
          borderBottom: '1px solid #e5e7eb',
          letterSpacing: '-0.02em',
        }}>
          Customer Feedback Survey
        </h2>

        {/* Field 1 - Rating (matching Rating.tsx exactly) */}
        <div style={{ opacity: field1Opacity, marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>
            How satisfied are you with our service?
            <span style={{ color: '#9333ea', marginLeft: '4px' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} style={{
                fontSize: '32px',
                color: star <= 4 ? '#9333ea' : '#e5e7eb',
                background: 'transparent',
                border: 'none',
                padding: '4px',
                lineHeight: 1,
              }}>
                ★
              </button>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            4 out of 5 stars
          </div>
        </div>

        {/* Field 2 - Dropdown (matching Dropdown.tsx exactly) */}
        <div style={{ opacity: field2Opacity, marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>
            How did you hear about us?
          </label>
          <select style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '15px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            outline: 'none',
            background: '#ffffff',
            fontFamily: 'inherit',
            cursor: 'pointer',
            color: '#6b7280',
          }}>
            <option>Select an option</option>
          </select>
        </div>

        {/* Field 3 - Long Answer (matching LongAnswer.tsx exactly) */}
        <div style={{ opacity: field3Opacity, marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>
            What can we improve?
          </label>
          <textarea style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: '15px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            resize: 'none',
            minHeight: '80px',
            lineHeight: 1.6,
            color: '#9ca3af',
          }} placeholder="Your answer" />
        </div>

        {/* Field 4 - Multiple Choice (matching MultipleChoice.tsx exactly) */}
        <div style={{ opacity: field4Opacity }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>
            Would you recommend us?
            <span style={{ color: '#9333ea', marginLeft: '4px' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Yes, definitely', 'Maybe', 'No'].map((choice, i) => (
              <label key={choice} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                background: i === 0 ? 'rgba(147, 51, 234, 0.06)' : 'transparent',
              }}>
                <input type="radio" checked={i === 0} readOnly style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#9333ea',
                }} />
                <span style={{ fontSize: '15px', color: '#000000' }}>{choice}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
