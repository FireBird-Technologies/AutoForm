import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { config, getAuthHeaders } from '../config';
import { ResponseDataTable } from './ResponseDataTable';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: {
    columns?: string[];
    rows?: Record<string, any>[];
    row_count?: number;
  };
  route?: string;
}

interface FormChatPanelProps {
  formId: number;
  isOpen: boolean;
  onClose: () => void;
  onFormUpdated?: () => void;
  position?: 'right' | 'bottom';
  width?: number;
  accentColor?: string;
  mode?: 'builder' | 'analytics' | 'responses';
  inline?: boolean; // When true, renders as flex child instead of fixed position
}

/**
 * Shared chat panel component with streaming support.
 * Can be used in FormBuilder, FormAnalytics, and FormResponses pages.
 */
export const FormChatPanel: React.FC<FormChatPanelProps> = ({
  formId,
  isOpen,
  onClose,
  onFormUpdated,
  position = 'right',
  width: initialWidth = 400,
  accentColor = '#9333ea',
  mode = 'builder',
  inline = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingData, setStreamingData] = useState<ChatMessage['data'] | null>(null);
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Escape key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isStreaming) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isStreaming, onClose]);

  // Handle resize drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;
      
      const windowWidth = window.innerWidth;
      let newWidth: number;
      
      if (inline) {
        // For inline, calculate from left edge of panel
        const panelRect = panelRef.current.getBoundingClientRect();
        newWidth = e.clientX - panelRect.left;
      } else {
        // For fixed right position, calculate from right edge
        newWidth = windowWidth - e.clientX;
      }
      
      // Clamp between min and max
      const minWidth = 320;
      const maxWidth = Math.min(800, windowWidth * 0.6);
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, inline]);

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingData(null);

    try {
      const response = await fetch(
        `${config.backendUrl}/api/forms/${formId}/chat/stream`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: userMessage }),
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let currentContent = '';
      let currentData: ChatMessage['data'] | null = null;
      let currentRoute = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // Skip event type lines (e.g., "event: route", "event: content")
            continue;
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.route) {
                currentRoute = data.route;
              }
              
              if (data.content) {
                currentContent += data.content;
                setStreamingContent(currentContent);
              }
              
              if (data.columns && data.rows) {
                currentData = {
                  columns: data.columns,
                  rows: data.rows,
                  row_count: data.row_count
                };
                setStreamingData(currentData);
              }
              
              if (data.action === 'add' || data.action === 'edit') {
                // Form was updated, notify parent
                onFormUpdated?.();
              }
              
              if (data.error) {
                currentContent = `Error: ${data.error}`;
                setStreamingContent(currentContent);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Add complete message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: currentContent || 'Done.',
        data: currentData || undefined,
        route: currentRoute
      }]);
      
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Something went wrong: ${error.message}. Please try again.`
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingData(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getPlaceholder = () => {
    switch (mode) {
      case 'analytics':
      case 'responses':
        return 'Ask about responses... "Summarize all submissions"';
      default:
        return 'Edit form or analyze responses...';
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'analytics':
        return 'Analytics Chat';
      case 'responses':
        return 'Response Analysis';
      default:
        return 'Form Assistant';
    }
  };

  if (!isOpen) return null;

  // Inline mode - renders as a normal flex child within container
  const inlineStyle: React.CSSProperties = {
    width: `${panelWidth}px`,
    minWidth: '320px',
    maxWidth: '800px',
    height: '100%',
    background: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'relative'
  };

  // Fixed position mode - renders as overlay
  const fixedRightStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: `${panelWidth}px`,
    height: '100vh',
    background: '#ffffff',
    borderLeft: '1px solid #e5e7eb',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column'
  };

  const fixedBottomStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '400px',
    background: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column'
  };

  const panelStyle: React.CSSProperties = inline 
    ? inlineStyle 
    : position === 'right' 
      ? fixedRightStyle 
      : fixedBottomStyle;

  return (
    <div ref={panelRef} style={panelStyle}>
      {/* Resize handle */}
      {position === 'right' && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          style={{
            position: 'absolute',
            left: inline ? 'auto' : 0,
            right: inline ? 0 : 'auto',
            top: 0,
            bottom: 0,
            width: '6px',
            cursor: 'col-resize',
            background: isResizing ? accentColor : 'transparent',
            transition: 'background 0.15s',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            if (!isResizing) {
              e.currentTarget.style.background = `${accentColor}40`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {/* Visual indicator */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '4px',
            height: '40px',
            borderRadius: '2px',
            background: isResizing ? 'white' : '#d1d5db',
            opacity: isResizing ? 1 : 0.6,
            transition: 'all 0.15s'
          }} />
        </div>
      )}
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#faf5ff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px', color: '#111827' }}>
              {getTitle()}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {mode === 'builder' ? 'Edit form or analyze data' : 'Query your responses'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Width indicator when resizing */}
          {isResizing && (
            <span style={{
              fontSize: '11px',
              color: '#9ca3af',
              fontFamily: 'monospace',
              background: '#f3f4f6',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {panelWidth}px
            </span>
          )}
          {/* Close button */}
          <button
            onClick={onClose}
            title="Close chat (Esc)"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.borderColor = '#fecaca';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.length === 0 && !isStreaming && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#9ca3af'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              borderRadius: '12px',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              {mode === 'builder' ? 'Edit your form or analyze responses' : 'Ask questions about your data'}
            </div>
            <div style={{ fontSize: '13px' }}>
              {mode === 'builder' 
                ? '"Add an email field" or "Summarize my responses"'
                : '"What\'s the average rating?" or "Show incomplete responses"'}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: msg.role === 'user' ? '#faf5ff' : '#f9fafb',
              border: `1px solid ${msg.role === 'user' ? '#e9d5ff' : '#e5e7eb'}`
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: msg.role === 'user' ? accentColor : '#6b7280',
                marginBottom: '6px'
              }}>
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div style={{ fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <div style={{ margin: '0 0 8px 0' }}>{children}</div>,
                    strong: ({ children }) => <strong style={{ fontWeight: '600', color: accentColor }}>{children}</strong>,
                    em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                    code: ({ children }) => (
                      <code style={{
                        background: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}>
                        {children}
                      </code>
                    ),
                    ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ol>,
                    li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                    h3: ({ children }) => <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '12px 0 8px', color: '#111827' }}>{children}</h3>
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
            
            {/* Data table for response analysis */}
            {msg.data && msg.data.columns && msg.data.rows && (
              <ResponseDataTable
                columns={msg.data.columns}
                rows={msg.data.rows}
                rowCount={msg.data.row_count}
              />
            )}
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <div>
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6b7280',
                marginBottom: '6px'
              }}>
                Assistant
              </div>
              {streamingContent ? (
                <div style={{ fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingContent}
                  </ReactMarkdown>
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '16px',
                    background: accentColor,
                    marginLeft: '2px',
                    animation: 'blink 1s infinite'
                  }} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Thinking...</span>
                </div>
              )}
            </div>
            
            {/* Streaming data table */}
            {streamingData && streamingData.columns && streamingData.rows && (
              <ResponseDataTable
                columns={streamingData.columns}
                rows={streamingData.rows}
                rowCount={streamingData.row_count}
              />
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #e5e7eb',
        background: '#ffffff'
      }}>
        <div style={{ position: 'relative' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isStreaming}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: '56px',
              maxHeight: '120px',
              padding: '14px 54px 14px 16px',
              fontSize: '14px',
              fontFamily: 'inherit',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              outline: 'none',
              resize: 'vertical',
              background: '#ffffff',
              color: '#1f2937',
              boxShadow: `0 2px 8px ${accentColor}20`,
              lineHeight: '1.5'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = accentColor;
              e.target.style.boxShadow = `0 4px 12px ${accentColor}30`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = `0 2px 8px ${accentColor}20`;
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: 'none',
              background: input.trim() && !isStreaming 
                ? `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` 
                : '#e5e7eb',
              cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: input.trim() && !isStreaming ? `0 2px 8px ${accentColor}40` : 'none'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
