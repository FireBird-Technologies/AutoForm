import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const PublishingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = 26 * fps; // Starts at 26 seconds (frame 780) - NOT USED

  // Share link appears
  const linkOpacity = interpolate(
    frame,
    [startFrame, startFrame + 20],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Analytics dashboard appears
  const analyticsOpacity = interpolate(
    frame,
    [startFrame + 25, startFrame + 50],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const analyticsScale = interpolate(
    frame,
    [startFrame + 25, startFrame + 50],
    [0.95, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Chart bars animate
  const bar1Height = interpolate(frame, [startFrame + 55, startFrame + 75], [0, 70], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar2Height = interpolate(frame, [startFrame + 60, startFrame + 80], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar3Height = interpolate(frame, [startFrame + 65, startFrame + 85], [0, 55], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar4Height = interpolate(frame, [startFrame + 70, startFrame + 90], [0, 85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar5Height = interpolate(frame, [startFrame + 75, startFrame + 95], [0, 65], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // AI Analysis appears - KEY FEATURE
  const aiAnalysisOpacity = interpolate(
    frame,
    [startFrame + 100, startFrame + 125],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const aiAnalysisY = interpolate(
    frame,
    [startFrame + 100, startFrame + 125],
    [30, 0],
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
        backgroundColor: '#ffffff',
        padding: '50px',
      }}
    >
      {/* Header */}
      <div
        style={{
          opacity: linkOpacity,
          marginBottom: '30px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#9333ea',
            marginBottom: '8px',
            fontFamily: 'system-ui',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Step 3: Publish & Analyze
        </div>
        <div
          style={{
            backgroundColor: '#faf5ff',
            borderRadius: '12px',
            padding: '16px 32px',
            border: '2px solid #e9d5ff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '18px', color: '#6b7280', fontFamily: 'monospace' }}>
            autoform.app/form/customer-feedback
          </span>
          <span style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
          }}>
            Live
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          gap: '40px',
          width: '100%',
          maxWidth: '1600px',
        }}
      >
        {/* Analytics Dashboard */}
        <div
          style={{
            opacity: analyticsOpacity,
            transform: `scale(${analyticsScale})`,
            flex: 1,
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 10px 40px rgba(147, 51, 234, 0.12)',
            border: '2px solid #e9d5ff',
          }}
        >
          <h3
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: '24px',
              fontFamily: 'system-ui',
            }}
          >
            Response Analytics
          </h3>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginBottom: '28px',
            }}
          >
            <div style={{
              flex: 1,
              backgroundColor: '#faf5ff',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#9333ea', fontFamily: 'system-ui' }}>
                1,247
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'system-ui' }}>
                Total Views
              </div>
            </div>
            <div style={{
              flex: 1,
              backgroundColor: '#faf5ff',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#9333ea', fontFamily: 'system-ui' }}>
                342
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'system-ui' }}>
                Submissions
              </div>
            </div>
            <div style={{
              flex: 1,
              backgroundColor: '#faf5ff',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#10b981', fontFamily: 'system-ui' }}>
                89%
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'system-ui' }}>
                Completion Rate
              </div>
            </div>
          </div>

          {/* Chart - styled like LineChart component */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '16px', fontFamily: 'system-ui' }}>
              Response Trends
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '16px',
                height: '120px',
                padding: '0 10px',
              }}
            >
              {[
                { day: 'Mon', height: bar1Height },
                { day: 'Tue', height: bar2Height },
                { day: 'Wed', height: bar3Height },
                { day: 'Thu', height: bar4Height },
                { day: 'Fri', height: bar5Height },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${item.height}px`,
                      background: 'linear-gradient(180deg, #9333ea 0%, #7e22ce 100%)',
                      borderRadius: '6px 6px 0 0',
                      marginBottom: '8px',
                    }}
                  />
                  <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'system-ui', fontWeight: 500 }}>{item.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Analysis Panel - KEY FEATURE */}
        <div
          style={{
            opacity: aiAnalysisOpacity,
            transform: `translateY(${aiAnalysisY}px)`,
            width: '500px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 10px 40px rgba(147, 51, 234, 0.15)',
            border: '3px solid #9333ea',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#9333ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              🤖
            </div>
            <div>
              <h3 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#1f2937',
                fontFamily: 'system-ui',
                margin: 0,
              }}>
                AI Response Analysis
              </h3>
              <div style={{ fontSize: '14px', color: '#9333ea', fontWeight: 600 }}>
                Instant AI-Powered Insights
              </div>
            </div>
          </div>

          {/* AI Chat */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontFamily: 'system-ui' }}>
              You asked:
            </div>
            <div style={{ fontSize: '16px', color: '#1f2937', fontFamily: 'system-ui', fontWeight: 500 }}>
              "What's the main feedback trend?"
            </div>
          </div>

          <div style={{
            backgroundColor: '#faf5ff',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #e9d5ff',
          }}>
            <div style={{ fontSize: '14px', color: '#9333ea', marginBottom: '8px', fontFamily: 'system-ui', fontWeight: 600 }}>
              AI Analysis:
            </div>
            <div style={{ fontSize: '16px', color: '#1f2937', fontFamily: 'system-ui', lineHeight: 1.5 }}>
              Based on 342 responses:<br />
              <span style={{ color: '#10b981', fontWeight: 600 }}>87% positive sentiment</span><br />
              Top request: "Faster checkout process"<br />
              Average rating: <span style={{ color: '#9333ea', fontWeight: 600 }}>4.6/5 ⭐</span>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            fontSize: '13px',
            color: '#6b7280',
            fontFamily: 'system-ui',
            textAlign: 'center',
          }}>
            Ask anything about your responses - no export needed!
          </div>
        </div>
      </div>
    </div>
  );
};
