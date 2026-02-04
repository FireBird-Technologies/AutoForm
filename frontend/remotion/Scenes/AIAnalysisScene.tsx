import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const AIAnalysisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = 12 * fps; // Starts at 12 seconds

  // Header animation
  const headerOpacity = interpolate(frame, [startFrame, startFrame + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Stats cards animate in
  const stat1Opacity = interpolate(frame, [startFrame + 20, startFrame + 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const stat2Opacity = interpolate(frame, [startFrame + 30, startFrame + 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const stat3Opacity = interpolate(frame, [startFrame + 40, startFrame + 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Bar chart appears
  const chartOpacity = interpolate(frame, [startFrame + 50, startFrame + 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // Bar chart bars animate
  const bar1Height = interpolate(frame, [startFrame + 70, startFrame + 95], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar2Height = interpolate(frame, [startFrame + 75, startFrame + 100], [0, 70], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar3Height = interpolate(frame, [startFrame + 80, startFrame + 105], [0, 85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar4Height = interpolate(frame, [startFrame + 85, startFrame + 110], [0, 55], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar5Height = interpolate(frame, [startFrame + 90, startFrame + 115], [0, 90], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar6Height = interpolate(frame, [startFrame + 95, startFrame + 120], [0, 75], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar7Height = interpolate(frame, [startFrame + 100, startFrame + 125], [0, 95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Funnel chart appears
  const funnelOpacity = interpolate(frame, [startFrame + 100, startFrame + 125], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const funnel1Width = interpolate(frame, [startFrame + 120, startFrame + 145], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const funnel2Width = interpolate(frame, [startFrame + 130, startFrame + 155], [0, 78], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const funnel3Width = interpolate(frame, [startFrame + 140, startFrame + 165], [0, 52], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const funnel4Width = interpolate(frame, [startFrame + 150, startFrame + 175], [0, 25.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // AI Chat panel appears
  const aiChatOpacity = interpolate(frame, [startFrame + 150, startFrame + 180], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const aiChatX = interpolate(frame, [startFrame + 150, startFrame + 180], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // AI typing animation
  const question = "What's the main feedback trend this week?";
  const questionProgress = interpolate(frame, [startFrame + 185, startFrame + 230], [0, question.length], { easing: Easing.linear, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const displayedQuestion = question.slice(0, Math.floor(questionProgress));

  // AI response appears
  const aiResponseOpacity = interpolate(frame, [startFrame + 240, startFrame + 270], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Insight cards appear
  const insight1Opacity = interpolate(frame, [startFrame + 280, startFrame + 300], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const insight2Opacity = interpolate(frame, [startFrame + 295, startFrame + 315], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const insight3Opacity = interpolate(frame, [startFrame + 310, startFrame + 330], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fafafa',
      padding: '36px 40px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{ opacity: headerOpacity, marginBottom: '20px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 24px',
          backgroundColor: '#9333ea',
          borderRadius: '50px',
          color: 'white',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          AI-Powered Response Analysis
        </div>
        <h2 style={{ fontSize: '38px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
          Ask AI Anything About Your Responses
        </h2>
        <p style={{ fontSize: '18px', color: '#6b7280', margin: '8px 0 0 0' }}>
          No export needed - get instant insights with natural language
        </p>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Left side - Analytics Dashboard */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Stats Row - matching FormAnalyticsNew.tsx exactly */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              opacity: stat1Opacity,
              flex: 1,
              background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid #e9d5ff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Submissions
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#9333ea' }}>1,247</div>
            </div>
            <div style={{
              opacity: stat2Opacity,
              flex: 1,
              background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid #e9d5ff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Views
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#9333ea' }}>4,892</div>
            </div>
            <div style={{
              opacity: stat3Opacity,
              flex: 1,
              background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid #e9d5ff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Conversion Rate
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#9333ea' }}>25.5%</div>
            </div>
          </div>

          {/* Bar Chart - matching BarChart.tsx styling */}
          <div style={{
            opacity: chartOpacity,
            background: 'white',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            flex: 1,
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '2px', letterSpacing: '-0.01em' }}>
              Submissions vs Views
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '14px' }}>
              Track form engagement over time
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '140px', padding: '0 10px' }}>
              {[
                { day: 'Mon', submissions: bar1Height, views: bar1Height * 0.4 },
                { day: 'Tue', submissions: bar2Height, views: bar2Height * 0.4 },
                { day: 'Wed', submissions: bar3Height, views: bar3Height * 0.4 },
                { day: 'Thu', submissions: bar4Height, views: bar4Height * 0.4 },
                { day: 'Fri', submissions: bar5Height, views: bar5Height * 0.4 },
                { day: 'Sat', submissions: bar6Height, views: bar6Height * 0.4 },
                { day: 'Sun', submissions: bar7Height, views: bar7Height * 0.4 },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '110px' }}>
                    <div style={{ width: '20px', height: `${item.submissions}px`, background: '#a855f7', borderRadius: '4px 4px 0 0' }} />
                    <div style={{ width: '20px', height: `${item.views}px`, background: '#9ca3af', borderRadius: '4px 4px 0 0' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>{item.day}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a855f7' }} />
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Submissions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9ca3af' }} />
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Views</span>
              </div>
            </div>
          </div>

          {/* Funnel Chart - matching FunnelChart.tsx styling */}
          <div style={{
            opacity: funnelOpacity,
            background: 'white',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '2px', letterSpacing: '-0.01em' }}>
              Conversion Funnel
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
              Track user progression through form completion
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Page Views', value: 4892, width: funnel1Width, percentage: 100 },
                { label: 'Form Started', value: 3816, width: funnel2Width, percentage: 78 },
                { label: 'Q3 Completed', value: 2544, width: funnel3Width, percentage: 52 },
                { label: 'Form Completed', value: 1247, width: funnel4Width, percentage: 25.5 },
              ].map((stage, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ minWidth: '110px', fontSize: '13px', fontWeight: 600, color: '#111827' }}>{stage.label}</div>
                  <div style={{ minWidth: '90px', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>{stage.value.toLocaleString()}</div>
                  <div style={{ flex: 1, height: '28px', background: '#f3f4f6', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${stage.width}%`,
                      background: i === 3 ? 'linear-gradient(90deg, #6b7280 0%, #4b5563 100%)' : 'linear-gradient(90deg, #9333ea 0%, #7e22ce 100%)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '10px',
                    }}>
                      {stage.width > 15 && <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{stage.percentage}%</span>}
                    </div>
                  </div>
                  <div style={{ minWidth: '45px', textAlign: 'right', fontSize: '14px', fontWeight: 700, color: '#111827' }}>{stage.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - AI Chat Panel */}
        <div style={{
          opacity: aiChatOpacity,
          transform: `translateX(${aiChatX}px)`,
          width: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(147, 51, 234, 0.15)',
          border: '2px solid #9333ea',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Chat Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#faf5ff',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              🤖
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>AI Analytics Agent</div>
              <div style={{ fontSize: '12px', color: '#9333ea', fontWeight: 600 }}>Specialized for your form data</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
            {/* User question */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9333ea', marginBottom: '6px' }}>You</div>
              <div style={{ fontSize: '14px', color: '#1f2937', lineHeight: 1.5, minHeight: '21px' }}>
                {displayedQuestion}
                {frame >= startFrame + 185 && frame < startFrame + 230 && (
                  <span style={{ display: 'inline-block', width: '2px', height: '16px', backgroundColor: '#9333ea', marginLeft: '2px', verticalAlign: 'middle' }} />
                )}
              </div>
            </div>

            {/* AI response */}
            <div style={{
              opacity: aiResponseOpacity,
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              flex: 1,
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '8px' }}>AI Analysis</div>
              <div style={{ fontSize: '14px', color: '#1f2937', lineHeight: 1.7 }}>
                Based on <strong style={{ color: '#9333ea' }}>342 responses</strong> this week:<br /><br />
                <span style={{ color: '#10b981', fontWeight: 600 }}>✓ 87% positive sentiment</span><br /><br />
                <strong>Top 3 Themes:</strong><br />
                1. "Great product quality" (45%)<br />
                2. "Fast shipping" (32%)<br />
                3. "Helpful support" (23%)<br /><br />
                <strong>Avg Rating:</strong> <span style={{ color: '#9333ea', fontWeight: 700 }}>4.6/5 ⭐</span>
              </div>
            </div>

            {/* Insight cards */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{
                opacity: insight1Opacity,
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '1px solid #a7f3d0',
              }}>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600, marginBottom: '4px' }}>Sentiment</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#047857' }}>87%</div>
                <div style={{ fontSize: '10px', color: '#10b981' }}>Positive</div>
              </div>
              <div style={{
                opacity: insight2Opacity,
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                border: '1px solid #e9d5ff',
              }}>
                <div style={{ fontSize: '11px', color: '#9333ea', fontWeight: 600, marginBottom: '4px' }}>Avg Rating</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>4.6</div>
                <div style={{ fontSize: '10px', color: '#9333ea' }}>out of 5</div>
              </div>
              <div style={{
                opacity: insight3Opacity,
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #bfdbfe',
              }}>
                <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginBottom: '4px' }}>NPS Score</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d4ed8' }}>+72</div>
                <div style={{ fontSize: '10px', color: '#3b82f6' }}>Excellent</div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#ffffff' }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              fontSize: '13px',
              color: '#9ca3af',
              fontStyle: 'italic',
            }}>
              Ask anything: "Show incomplete responses", "Compare ratings by source"...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
