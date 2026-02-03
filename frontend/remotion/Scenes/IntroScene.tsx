import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing, Img, staticFile } from 'remotion';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  useVideoConfig();

  // Logo fade in and scale
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  const logoScale = interpolate(frame, [0, 25], [0.8, 1], {
    easing: Easing.out(Easing.back(1.2)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tagline fade in
  const taglineOpacity = interpolate(frame, [25, 45], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const taglineY = interpolate(frame, [25, 45], [30, 0], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Feature badges appear
  const badge1Opacity = interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badge2Opacity = interpolate(frame, [58, 73], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badge3Opacity = interpolate(frame, [66, 81], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

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
      {/* Logo - white background card on purple */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: '30px',
          backgroundColor: '#ffffff',
          padding: '30px 50px',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Img
          src={staticFile('logo.svg')}
          style={{
            width: '500px',
            height: 'auto',
          }}
        />
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '84px',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            letterSpacing: '-0.02em',
          }}
        >
          AI First Forms
        </h1>
        <p
          style={{
            fontSize: '36px',
            color: '#f3e8ff',
            margin: 0,
          }}
        >
          Create, Edit, and Analyze Forms with AI
        </p>
      </div>

      {/* Feature badges */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          marginTop: '50px',
        }}
      >
        <div
          style={{
            opacity: badge1Opacity,
            padding: '16px 32px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          Generate with AI
        </div>
        <div
          style={{
            opacity: badge2Opacity,
            padding: '16px 32px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          Edit with AI
        </div>
        <div
          style={{
            opacity: badge3Opacity,
            padding: '16px 32px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          AI Response Analysis
        </div>
      </div>
    </div>
  );
};
