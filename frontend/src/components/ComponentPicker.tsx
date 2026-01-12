import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface ComponentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (questionType: string) => void;
  onGenerate?: (prompt: string) => void;
}

const QUESTION_TYPES = [
  { id: 'short_answer', name: 'Short answer', icon: '≡', category: 'questions' },
  { id: 'long_answer', name: 'Long answer', icon: '☰', category: 'questions' },
  { id: 'multiple_choice', name: 'Multiple choice', icon: '◉', category: 'questions' },
  { id: 'checkboxes', name: 'Checkboxes', icon: '☑', category: 'questions' },
  { id: 'dropdown', name: 'Dropdown', icon: '⌄', category: 'questions' },
  { id: 'multi_select', name: 'Multi-select', icon: '✓✓', category: 'questions' },
  { id: 'number', name: 'Number', icon: '#', category: 'questions' },
  { id: 'email', name: 'Email', icon: '@', category: 'questions' },
  { id: 'phone', name: 'Phone number', icon: '✆', category: 'questions' },
  { id: 'link', name: 'Link', icon: '🔗', category: 'questions' },
  { id: 'file_upload', name: 'File upload', icon: '⬆', category: 'questions' },
  { id: 'date', name: 'Date', icon: '📅', category: 'questions' },
  { id: 'time', name: 'Time', icon: '⏱', category: 'questions' },
  { id: 'linear_scale', name: 'Linear scale', icon: '•••', category: 'questions' },
  { id: 'matrix', name: 'Matrix', icon: '⊞', category: 'questions' },
  { id: 'rating', name: 'Rating', icon: '☆', category: 'questions' },
  { id: 'payment', name: 'Payment', icon: '▢', category: 'questions' },
  { id: 'signature', name: 'Signature', icon: '✎', category: 'questions' },
  { id: 'ranking', name: 'Ranking', icon: '⇅', category: 'questions' },
  { id: 'wallet_connect', name: 'Wallet Connect', icon: '◇', category: 'questions' },
];

const LAYOUT_BLOCKS = [
  { id: 'new_page', name: 'New page', icon: '▭', category: 'layout' },
  { id: 'statement', name: 'Statement', icon: '¶', category: 'layout' },
  { id: 'hidden_field', name: 'Hidden field', icon: '👁', category: 'layout' },
];

export const ComponentPicker: React.FC<ComponentPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  onGenerate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showGenerateInput, setShowGenerateInput] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const generateInputRef = useRef<HTMLTextAreaElement>(null);

  const allItems = [...QUESTION_TYPES, ...LAYOUT_BLOCKS];
  
  const filteredQuestions = QUESTION_TYPES.filter(q => 
    q.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredLayouts = LAYOUT_BLOCKS.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredItems = [...filteredQuestions, ...filteredLayouts];
  
  // Check if search looks like a generate prompt
  const looksLikePrompt = searchQuery.length > 15 || searchQuery.toLowerCase().includes('ask') || searchQuery.toLowerCase().includes('question');

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setShowGenerateInput(false);
      setGeneratePrompt('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showGenerateInput) return; // Don't handle when in generate mode
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex === 0 && onGenerate) {
        // Generate option is always index 0
        setShowGenerateInput(true);
        setTimeout(() => generateInputRef.current?.focus(), 100);
      } else if (filteredItems[selectedIndex - 1]) {
        handleSelect(filteredItems[selectedIndex - 1].id);
      }
    } else if (e.key === 'Escape') {
      if (showGenerateInput) {
        setShowGenerateInput(false);
      } else {
        onClose();
      }
    }
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  const handleGenerate = () => {
    if (generatePrompt.trim() && onGenerate) {
      onGenerate(generatePrompt.trim());
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)'
          }} />
        </Transition.Child>

        <div style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '10vh'
        }}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              style={{
                width: '100%',
                maxWidth: '540px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
              }}
              onKeyDown={handleKeyDown}
            >
              {/* Search Input */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find questions, input fields and layout options..."
                    style={{
                      flex: 1,
                      fontSize: '15px',
                      color: '#1f2937',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Content */}
              <div style={{
                display: 'flex',
                maxHeight: '60vh'
              }}>
                {/* Left: List */}
                <div style={{
                  width: '240px',
                  borderRight: '1px solid #f3f4f6',
                  overflowY: 'auto',
                  padding: '8px 0'
                }}>
                  {/* Generate with AI - Always at top */}
                  {onGenerate && !showGenerateInput && (
                    <>
                      <div style={{
                        padding: '8px 16px 6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        AI Generate
                      </div>
                      <button
                        onClick={() => {
                          setShowGenerateInput(true);
                          setTimeout(() => generateInputRef.current?.focus(), 100);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          fontSize: '14px',
                          color: '#374151',
                          background: 'transparent',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#9333ea';
                          e.currentTarget.style.color = '#9333ea';
                          setSelectedIndex(0);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.color = '#374151';
                        }}
                      >
                        <span style={{
                          width: '20px',
                          textAlign: 'center',
                          fontSize: '14px',
                          color: 'inherit'
                        }}>
                          ✨
                        </span>
                        Generate with AI
                      </button>
                    </>
                  )}
                  
                  {/* Questions Section */}
                  {filteredQuestions.length > 0 && !showGenerateInput && (
                    <>
                      <div style={{
                        padding: '16px 16px 6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Questions
                      </div>
                      {filteredQuestions.map((item, index) => {
                        const actualIndex = onGenerate ? index + 1 : index;
                        const isSelected = actualIndex === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              fontSize: '14px',
                              color: '#374151',
                              background: 'transparent',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              textAlign: 'left',
                              fontFamily: 'inherit',
                              transition: 'all 0.2s',
                              marginBottom: '4px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#9333ea';
                              e.currentTarget.style.color = '#9333ea';
                              setSelectedIndex(actualIndex);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.color = '#374151';
                            }}
                          >
                            <span style={{
                              width: '20px',
                              textAlign: 'center',
                              fontSize: '14px',
                              color: '#6b7280'
                            }}>
                              {item.icon}
                            </span>
                            {item.name}
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Layout Blocks Section */}
                  {filteredLayouts.length > 0 && !showGenerateInput && (
                    <>
                      <div style={{
                        padding: '16px 16px 6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Layout blocks
                      </div>
                      {filteredLayouts.map((item, index) => {
                        const actualIndex = (onGenerate ? 1 : 0) + filteredQuestions.length + index;
                        const isSelected = actualIndex === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              fontSize: '14px',
                              color: '#374151',
                              background: 'transparent',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              textAlign: 'left',
                              fontFamily: 'inherit',
                              transition: 'all 0.2s',
                              marginBottom: '4px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#9333ea';
                              e.currentTarget.style.color = '#9333ea';
                              setSelectedIndex(actualIndex);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.color = '#374151';
                            }}
                          >
                            <span style={{
                              width: '20px',
                              textAlign: 'center',
                              fontSize: '14px',
                              color: '#6b7280'
                            }}>
                              {item.icon}
                            </span>
                            {item.name}
                          </button>
                        );
                      })}
                    </>
                  )}

                  {filteredItems.length === 0 && !showGenerateInput && (
                    <div style={{
                      padding: '20px 16px',
                      fontSize: '14px',
                      color: '#9ca3af',
                      textAlign: 'center'
                    }}>
                      No results found
                    </div>
                  )}
                  
                  {/* Generate Input in left panel */}
                  {showGenerateInput && (
                    <div style={{ padding: '16px' }}>
                      <button
                        onClick={() => setShowGenerateInput(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          color: '#6b7280',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          marginBottom: '12px',
                          padding: 0
                        }}
                      >
                        ← Back
                      </button>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '8px'
                      }}>
                        ✨ Generate with AI
                      </div>
                      <p style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '12px',
                        lineHeight: '1.4'
                      }}>
                        Describe the question you want to add using exact terms.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Helper Panel / Generate Input */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: showGenerateInput ? '24px' : '40px 24px',
                  color: '#9ca3af',
                  textAlign: showGenerateInput ? 'left' : 'center',
                  justifyContent: showGenerateInput ? 'flex-start' : 'center',
                  alignItems: showGenerateInput ? 'stretch' : 'center'
                }}>
                  {showGenerateInput ? (
                    <div style={{ position: 'relative', width: '100%' }}>
                      <textarea
                        ref={generateInputRef}
                        value={generatePrompt}
                        onChange={(e) => setGeneratePrompt(e.target.value)}
                        placeholder="e.g., Ask which events (Valima, Nikkah, Barat) the guest will attend with checkboxes, and if they're bringing someone..."
                        style={{
                          width: '100%',
                          minHeight: '120px',
                          padding: '12px 48px 12px 12px',
                          fontSize: '14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          background: '#ffffff',
                          boxShadow: '0 2px 8px rgba(147, 51, 234, 0.15)'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#9333ea';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.25)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(147, 51, 234, 0.15)';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && generatePrompt.trim()) {
                            e.preventDefault();
                            handleGenerate();
                          }
                          if (e.key === 'Escape') {
                            setShowGenerateInput(false);
                          }
                        }}
                      />
                      <button
                        onClick={handleGenerate}
                        disabled={!generatePrompt.trim()}
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          width: '32px',
                          height: '32px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          background: (!generatePrompt.trim()) ? '#d1d5db' : '#9333ea',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: (!generatePrompt.trim()) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: (!generatePrompt.trim()) ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (generatePrompt.trim()) {
                            e.currentTarget.style.background = '#7e22ce';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (generatePrompt.trim()) {
                            e.currentTarget.style.background = '#9333ea';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px'
                      }}>
                        <span style={{ fontSize: '24px', color: '#d1d5db' }}>+</span>
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Insert anything
                      </div>
                      <div style={{
                        fontSize: '14px',
                        lineHeight: '1.5',
                        maxWidth: '260px'
                      }}>
                        Search for any input field or layout option. Use{' '}
                        <kbd style={{
                          padding: '2px 6px',
                          background: '#f3f4f6',
                          borderRadius: '4px',
                          fontSize: '12px',
                          border: '1px solid #e5e7eb'
                        }}>↑</kbd>
                        {' '}and{' '}
                        <kbd style={{
                          padding: '2px 6px',
                          background: '#f3f4f6',
                          borderRadius: '4px',
                          fontSize: '12px',
                          border: '1px solid #e5e7eb'
                        }}>↓</kbd>
                        {' '}to browse the list, then hit{' '}
                        <kbd style={{
                          padding: '2px 6px',
                          background: '#f3f4f6',
                          borderRadius: '4px',
                          fontSize: '12px',
                          border: '1px solid #e5e7eb'
                        }}>↵</kbd>
                        {' '}to insert the selected block.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
