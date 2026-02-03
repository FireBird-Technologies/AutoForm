import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const EditingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = 23 * fps; // Starts at 23 seconds

  // Chat message typing
  const editPrompt = "Add an email field and make the rating required";
  const typingProgress = interpolate(frame, [startFrame, startFrame + 60], [0, editPrompt.length], { easing: Easing.linear, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const displayedText = editPrompt.slice(0, Math.floor(typingProgress));

  // AI response appears
  const responseOpacity = interpolate(frame, [startFrame + 70, startFrame + 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // New field animates in
  const newFieldOpacity = interpolate(frame, [startFrame + 100, startFrame + 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const newFieldY = interpolate(frame, [startFrame + 100, startFrame + 120], [-15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Required badge appears
  const requiredBadgeOpacity = interpolate(frame, [startFrame + 130, startFrame + 145], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fafafa',
      padding: '50px',
      gap: '50px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Left side - Chat Panel matching FormChatPanel exactly */}
      <div style={{ width: '480px', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#9333ea',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Step 2: Edit with AI
        </div>
        
        {/* Chat panel - matching FormChatPanel */}
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
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Edit form or analyze responses</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* User message */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
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
                {frame < startFrame + 60 && (
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
            <div style={{
              opacity: responseOpacity,
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
              <div style={{ fontSize: '14px', color: '#1f2937', lineHeight: 1.6 }}>
                Done! I've made these changes:<br /><br />
                <strong style={{ color: '#9333ea' }}>✓</strong> Added email field after "Your Name"<br />
                <strong style={{ color: '#9333ea' }}>✓</strong> Made rating question required
              </div>
            </div>
          </div>

          {/* Input area - matching FormChatPanel */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid #e5e7eb', background: '#ffffff' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder='Edit form or analyze responses...'
                style={{
                  width: '100%',
                  padding: '12px 50px 12px 14px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  outline: 'none',
                  background: '#ffffff',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(147, 51, 234, 0.08)',
                }}
              />
              <button style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #9333ea, #9333eadd)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Updated Form with exact component styling */}
      <div style={{
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

        {/* Field 1 - Short Answer (matching ShortAnswer.tsx) */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>
            Your Name
          </label>
          <input type="text" placeholder="Your answer" style={{
            width: '100%',
            padding: '12px 0',
            fontSize: '15px',
            border: 'none',
            borderBottom: '1px solid #e5e7eb',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
          }} />
        </div>

        {/* Field 2 - NEW Email field (matching EmailInput.tsx) */}
        <div style={{
          opacity: newFieldOpacity,
          transform: `translateY(${newFieldY}px)`,
          marginBottom: '32px',
          padding: '16px',
          borderRadius: '10px',
          background: '#faf5ff',
          border: '2px solid #9333ea',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <label style={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#000000',
              letterSpacing: '-0.01em',
            }}>
              Email Address
            </label>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: '#9333ea',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              NEW
            </span>
          </div>
          <input type="email" placeholder="your@email.com" style={{
            width: '100%',
            padding: '12px 0',
            fontSize: '15px',
            border: 'none',
            borderBottom: '2px solid #9333ea',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
          }} />
        </div>

        {/* Field 3 - Rating with REQUIRED badge */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <label style={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#000000',
              letterSpacing: '-0.01em',
            }}>
              How satisfied are you?
            </label>
            <span style={{ color: '#9333ea' }}>*</span>
            <span style={{
              opacity: requiredBadgeOpacity,
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              REQUIRED
            </span>
          </div>
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
        </div>

        {/* Field 4 - Long Answer */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>
            Additional Comments
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
            minHeight: '70px',
            lineHeight: 1.6,
            color: '#9ca3af',
          }} placeholder="Your answer" />
        </div>
      </div>
    </div>
  );
};
