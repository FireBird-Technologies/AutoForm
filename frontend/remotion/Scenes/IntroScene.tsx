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
  const badge1Opacity = interpolate(frame, [50, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badge2Opacity = interpolate(frame, [55, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badge3Opacity = interpolate(frame, [60, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Feature closeup - each badge scales up for ~10 frames (0.33s each = 1s total)
  // Starts at frame 75, ends at frame 105
  const badge1Scale = interpolate(frame, [75, 80, 85, 90], [1, 1.15, 1.15, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badge2Scale = interpolate(frame, [85, 90, 95, 100], [1, 1.15, 1.15, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badge3Scale = interpolate(frame, [95, 100, 105, 110], [1, 1.15, 1.15, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // Glow effect during closeup
  const badge1Glow = interpolate(frame, [75, 80, 85, 90], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badge2Glow = interpolate(frame, [85, 90, 95, 100], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badge3Glow = interpolate(frame, [95, 100, 105, 110], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

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
            transform: `scale(${badge1Scale})`,
            padding: '16px 32px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: badge1Glow > 0 ? `0 0 ${30 * badge1Glow}px ${15 * badge1Glow}px rgba(255, 255, 255, 0.4)` : 'none',
            transition: 'box-shadow 0.1s',
          }}
        >
          Generate with AI
        </div>
        <div
          style={{
            opacity: badge2Opacity,
            transform: `scale(${badge2Scale})`,
            padding: '16px 32px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: badge2Glow > 0 ? `0 0 ${30 * badge2Glow}px ${15 * badge2Glow}px rgba(255, 255, 255, 0.4)` : 'none',
            transition: 'box-shadow 0.1s',
          }}
        >
          Edit with AI
        </div>
        <div
          style={{
            opacity: badge3Opacity,
            transform: `scale(${badge3Scale})`,
            padding: '16px 32px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: badge3Glow > 0 ? `0 0 ${30 * badge3Glow}px ${15 * badge3Glow}px rgba(255, 255, 255, 0.4)` : 'none',
            transition: 'box-shadow 0.1s',
          }}
        >
          AI Response Analysis
        </div>
      </div>
    </div>
  );
};
