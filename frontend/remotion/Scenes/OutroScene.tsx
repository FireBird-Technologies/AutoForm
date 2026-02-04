import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing, Img, staticFile } from 'remotion';

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = 37 * fps; // Starts at 37 seconds (frame 1110)

  // Logo fade in first
  const logoOpacity = interpolate(
    frame,
    [startFrame, startFrame + 20],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const logoScale = interpolate(
    frame,
    [startFrame, startFrame + 20],
    [0.9, 1],
    {
      easing: Easing.out(Easing.back(1.2)),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // CTA text fade in
  const ctaOpacity = interpolate(
    frame,
    [startFrame + 20, startFrame + 40],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const ctaY = interpolate(
    frame,
    [startFrame + 20, startFrame + 40],
    [20, 0],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Button appears
  const buttonOpacity = interpolate(
    frame,
    [startFrame + 45, startFrame + 60],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Feature badges
  const badgesOpacity = interpolate(
    frame,
    [startFrame + 55, startFrame + 75],
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
        background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #6d28d9 100%)',
        padding: '60px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Logo in white card - same as intro */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: '30px',
          backgroundColor: '#ffffff',
          padding: '24px 40px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Img
          src={staticFile('logo.svg')}
          style={{
            width: '350px',
            height: 'auto',
          }}
        />
      </div>

      {/* CTA Text */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            marginBottom: '16px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            letterSpacing: '-0.02em',
          }}
        >
          Try AutoForm Free
        </h1>
        <p
          style={{
            fontSize: '32px',
            color: '#f3e8ff',
            margin: 0,
          }}
        >
          Create, Edit, and Analyze Forms with AI
        </p>
      </div>

      {/* CTA Button */}
      <div
        style={{
          opacity: buttonOpacity,
          marginBottom: '50px',
        }}
      >
        <div
          style={{
            padding: '24px 64px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            color: '#9333ea',
            fontSize: '28px',
            fontWeight: 700,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          }}
        >
          Get Started - It's Free
        </div>
      </div>

      {/* Feature badges */}
      <div
        style={{
          opacity: badgesOpacity,
          display: 'flex',
          gap: '32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f3e8ff',
            fontSize: '20px',
          }}
        >
          <span style={{ fontSize: '24px' }}>✓</span>
          Generate with AI
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f3e8ff',
            fontSize: '20px',
          }}
        >
          <span style={{ fontSize: '24px' }}>✓</span>
          Edit with AI
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f3e8ff',
            fontSize: '20px',
          }}
        >
          <span style={{ fontSize: '24px' }}>✓</span>
          AI Response Analysis
        </div>
      </div>
    </div>
  );
};
