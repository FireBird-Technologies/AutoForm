import React, { useState, useEffect } from 'react';
import { QuestionRenderer } from '../QuestionRenderer';
import { QuestionEditor } from '../QuestionEditor';
import { LoadingAnimation } from '../LoadingAnimation';
import { ConditionModal } from '../ConditionModal';
import { GlobalColorPicker, QuestionColorPicker } from '../ColorPicker';
import { AddQuestionButton } from '../AddQuestionButton';
import { config, getAuthHeaders } from '../../config';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormBuilderProps {
  formData: any;
  onBack?: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ formData: initialFormData, onBack }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(initialFormData.isGenerating || false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [conditionForQuestion, setConditionForQuestion] = useState<any>(null);
  const [showQuestionColorPicker, setShowQuestionColorPicker] = useState(false);
  const [colorPickerForQuestion, setColorPickerForQuestion] = useState<number | null>(null);
  const [questionColors, setQuestionColors] = useState<Record<number, any>>({});
  const [globalColors, setGlobalColors] = useState({
    background: '#ffffff',
    text: '#1f2937',
    accent: '#9333ea'
  });

  // Handle form generation on mount if needed
  useEffect(() => {
    if (initialFormData.isGenerating && initialFormData.user_query) {
      generateForm(initialFormData.user_query);
    }
  }, []);

  const generateForm = async (userQuery: string) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/generate`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        credentials: 'include',
        body: JSON.stringify({
          user_query: userQuery
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate form');
      }

      const data = await response.json();
      setFormData(data.form);
      setChatMessages([
        { role: 'user', content: userQuery },
        { role: 'assistant', content: `I've created your form with ${data.form.questions.length} questions. You can edit questions by clicking on them or chat with me to make changes.` }
      ]);
    } catch (err: any) {
      console.error('Form generation error:', err);
      setChatMessages([
        { role: 'user', content: userQuery },
        { role: 'assistant', content: `Sorry, I couldn't generate the form: ${err.message}` }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuestion = (updates: any) => {
    if (!selectedQuestion) return;

    const updatedQuestions = formData.questions.map((q: any) =>
      q.id === selectedQuestion.id ? { ...q, ...updates } : q
    );

    setFormData({ ...formData, questions: updatedQuestions });
    setSelectedQuestion({ ...selectedQuestion, ...updates });
  };

  const handleRegenerateQuestion = async (question: any) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/forms/${formData.id}/questions/${question.id}/regenerate`,
        {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ context: 'Regenerate this question' })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to regenerate question');
      }

      const data = await response.json();
      handleSaveQuestion(data.question);
    } catch (err) {
      console.error('Question regeneration error:', err);
      alert('Failed to regenerate question. Please try again.');
    }
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = formData.questions.filter((q: any) => q.id !== questionId);
      setFormData({ ...formData, questions: updatedQuestions });
    }
  };

  const handleSaveCondition = (condition: any) => {
    // Add or update conditional rule
    const existingRules = formData.conditional_rules || [];
    const updatedRules = [...existingRules, condition];
    setFormData({ ...formData, conditional_rules: updatedRules });
  };

  const handleQuestionColorChange = (questionId: number, colors: any) => {
    setQuestionColors((prev) => ({
      ...prev,
      [questionId]: colors
    }));
  };

  const handleAddQuestion = async (questionType: string) => {
    if (!formData.id) {
      alert('Form must be saved before adding questions');
      return;
    }

    try {
      // Get the max question order
      const maxOrder = formData.questions?.length > 0
        ? Math.max(...formData.questions.map((q: any) => q.question_order))
        : -1;

      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/questions`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        credentials: 'include',
        body: JSON.stringify({
          form_id: formData.id,
          question_order: maxOrder + 1,
          question_type: questionType,
          question_text: 'New Question',
          description: '',
          required: false,
          settings: {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add question');
      }

      const newQuestion = await response.json();
      
      // Refresh form data
      const formResponse = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (formResponse.ok) {
        const updatedForm = await formResponse.json();
        setFormData(updatedForm);
      }
    } catch (err) {
      console.error('Failed to add question:', err);
      alert('Failed to add question. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/share`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          form_id: formData.id,
          allow_multiple_submissions: true,
          collect_email: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const link = `${window.location.origin}/public/forms/${data.share_token}`;
        setShareLink(link);
        setShowSharePopup(true);
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  // Evaluate conditional logic to determine which questions to show
  const evaluateConditionalLogic = () => {
    const visibleQuestions = new Set<number>();

    // Initially, all questions are visible
    formData.questions?.forEach((q: any) => {
      visibleQuestions.add(q.id);
    });

    // Apply conditional rules
    formData.conditional_rules?.forEach((rule: any) => {
      const triggerAnswer = answers[rule.trigger_question_id];
      let conditionMet = false;

      if (triggerAnswer) {
        switch (rule.condition_type) {
          case 'equals':
            conditionMet = triggerAnswer.text === rule.condition_value ||
                          triggerAnswer.number?.toString() === rule.condition_value;
            break;
          case 'not_equals':
            conditionMet = triggerAnswer.text !== rule.condition_value;
            break;
          case 'contains':
            conditionMet = triggerAnswer.text?.includes(rule.condition_value);
            break;
          case 'is_not_empty':
            conditionMet = !!triggerAnswer.text || !!triggerAnswer.number || 
                          (triggerAnswer.choices && triggerAnswer.choices.length > 0);
            break;
          case 'is_empty':
            conditionMet = !triggerAnswer.text && !triggerAnswer.number && 
                          (!triggerAnswer.choices || triggerAnswer.choices.length === 0);
            break;
        }
      }

      // Apply action
      if (conditionMet) {
        if (rule.action === 'show') {
          visibleQuestions.add(rule.target_question_id);
        } else if (rule.action === 'hide') {
          visibleQuestions.delete(rule.target_question_id);
        }
      } else {
        // Condition not met - reverse the action
        if (rule.action === 'show') {
          visibleQuestions.delete(rule.target_question_id);
        }
      }
    });

    return visibleQuestions;
  };

  const visibleQuestionIds = evaluateConditionalLogic();

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: globalColors.background
    }}>
      {/* Top Bar */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                color: '#6b7280',
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
          )}
          <input
            type="text"
            value={formData.title || 'Untitled Form'}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: globalColors.text,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              flex: 1,
              maxWidth: '500px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Global Color Picker */}
          <GlobalColorPicker
            colors={globalColors}
            onChange={setGlobalColors}
          />

          <button
            onClick={handleShare}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              background: globalColors.accent,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Share Form
          </button>
        </div>
      </div>

      {/* Main Content: Chat + Form side by side */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Chat Panel */}
        <div style={{
          width: '400px',
          borderRight: '1px solid #e5e7eb',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#000000',
              margin: 0
            }}>
              Form Assistant
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Chat to edit or add questions
            </p>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: msg.role === 'user' ? '#faf5ff' : '#f9fafb',
                  border: `1px solid ${msg.role === 'user' ? '#e9d5ff' : '#e5e7eb'}`
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: msg.role === 'user' ? '#9333ea' : '#6b7280',
                  marginBottom: '4px'
                }}>
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#000000',
                  lineHeight: '1.5'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Generating form...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div style={{
            padding: '24px 20px',
            borderTop: '1px solid #e5e7eb',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              What changes do you need?
            </div>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Add a rating question for customer satisfaction..."
              disabled={isGenerating}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px 0',
                fontSize: '15px',
                fontFamily: 'inherit',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                outline: 'none',
                resize: 'none',
                background: 'transparent',
                color: '#1f2937'
              }}
              onFocus={(e) => {
                e.target.style.borderBottom = '2px solid #9333ea';
              }}
              onBlur={(e) => {
                e.target.style.borderBottom = '1px solid #e5e7eb';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey && chatInput.trim() && !isGenerating) {
                  // TODO: Implement chat editing
                  setChatInput('');
                }
              }}
            />
            <button
              onClick={() => {
                if (chatInput.trim() && !isGenerating) {
                  // TODO: Implement chat editing
                  setChatInput('');
                }
              }}
              disabled={!chatInput.trim() || isGenerating}
              style={{
                alignSelf: 'flex-end',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                background: (!chatInput.trim() || isGenerating) ? '#d1d5db' : '#9333ea',
                border: 'none',
                borderRadius: '6px',
                cursor: (!chatInput.trim() || isGenerating) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Form Edit Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '40px 24px',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '100px'
          }}>
          {isGenerating && (!formData.questions || formData.questions.length === 0) ? (
            <LoadingAnimation />
          ) : formData.questions && formData.questions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {formData.questions
                .filter((q: any) => visibleQuestionIds.has(q.id))
                .sort((a: any, b: any) => a.question_order - b.question_order)
                .map((question: any, index: number) => (
                  <React.Fragment key={question.id}>
                    {/* Add Question Button Before Each Question */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '24px 0',
                      position: 'relative'
                    }}>
                      <AddQuestionButton
                        onAdd={handleAddQuestion}
                        disabled={isGenerating}
                      />
                    </div>

                    <div
                      style={{
                        padding: '48px 0',
                        borderBottom: index < formData.questions.length - 1 ? '1px solid #e5e7eb' : 'none',
                        position: 'relative'
                      }}
                      onMouseEnter={() => setHoveredQuestion(question.id)}
                      onMouseLeave={() => setHoveredQuestion(null)}
                    >
                    {/* Question Content */}
                    <div style={{ marginBottom: '16px' }}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        className="markdown-question"
                        style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: globalColors.text,
                          marginBottom: '8px',
                          lineHeight: '1.4'
                        }}
                        components={{
                          p: ({ children }) => <div style={{ margin: 0 }}>{children}</div>,
                          strong: ({ children }) => <strong style={{ color: globalColors.accent }}>{children}</strong>
                        }}
                      >
                        {question.question_text}
                      </ReactMarkdown>
                      
                      {question.description && (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            lineHeight: '1.5'
                          }}
                          components={{
                            p: ({ children }) => <div style={{ margin: 0 }}>{children}</div>
                          }}
                        >
                          {question.description}
                        </ReactMarkdown>
                      )}
                    </div>

                    <QuestionRenderer
                      question={question}
                      value={answers[question.id] || {}}
                      onChange={(value) => handleAnswerChange(question.id, value)}
                      disabled={false}
                    />

                    {/* Per-Component Controls (visible on hover) */}
                    {hoveredQuestion === question.id && (
                      <div style={{
                        position: 'absolute',
                        top: '48px',
                        right: '0',
                        display: 'flex',
                        gap: '8px',
                        background: '#ffffff',
                        padding: '8px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e5e7eb'
                      }}>
                        {/* AI Edit Button */}
                        <button
                          onClick={() => {
                            setSelectedQuestion(question);
                            setShowQuestionEditor(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#9333ea',
                            background: '#faf5ff',
                            border: '1px solid #e9d5ff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '500'
                          }}
                          title="Edit with AI"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="14 2 18 6 7 17 3 17 3 13 14 2" />
                          </svg>
                          Edit
                        </button>

                        {/* Condition Button */}
                        <button
                          onClick={() => {
                            setConditionForQuestion(question);
                            setShowConditionModal(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#6b7280',
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Add condition"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="2" x2="12" y2="6" />
                            <line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" />
                            <line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg>
                        </button>

                        {/* Color Picker Button */}
                        <button
                          onClick={() => {
                            setColorPickerForQuestion(question.id);
                            setShowQuestionColorPicker(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#6b7280',
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Customize color"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#dc2626',
                            background: '#ffffff',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Delete question"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  </React.Fragment>
                ))}

                {/* Add Question Button After Last Question */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '24px 0'
                }}>
                  <AddQuestionButton
                    onAdd={handleAddQuestion}
                    disabled={isGenerating}
                  />
                </div>

              {/* Submit Button Preview */}
              <div style={{ marginTop: '48px', marginBottom: '40px' }}>
                <button
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: globalColors.accent,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {formData.settings?.submit_button_text || 'Submit'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280'
            }}>
              <p>No questions yet. Add questions to your form.</p>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Share Popup */}
      {showSharePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#000000',
              marginBottom: '16px'
            }}>
              Share Your Form
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              Anyone with this link can fill out your form:
            </p>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <input
                type="text"
                value={shareLink}
                readOnly
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#f9fafb'
                }}
              />
              <button
                onClick={copyShareLink}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  background: '#9333ea',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowSharePopup(false)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Condition Modal */}
      {showConditionModal && conditionForQuestion && (
        <ConditionModal
          isOpen={showConditionModal}
          onClose={() => {
            setShowConditionModal(false);
            setConditionForQuestion(null);
          }}
          question={conditionForQuestion}
          formQuestions={formData.questions || []}
          onSave={handleSaveCondition}
        />
      )}

      {/* Question Color Picker */}
      {colorPickerForQuestion !== null && (
        <QuestionColorPicker
          questionId={colorPickerForQuestion}
          colors={questionColors[colorPickerForQuestion] || {}}
          onChange={handleQuestionColorChange}
          isOpen={showQuestionColorPicker}
          onClose={() => {
            setShowQuestionColorPicker(false);
            setColorPickerForQuestion(null);
          }}
        />
      )}

      {/* Question Editor Modal */}
      {selectedQuestion && (
        <QuestionEditor
          question={selectedQuestion}
          isOpen={showQuestionEditor}
          onClose={() => {
            setShowQuestionEditor(false);
            setSelectedQuestion(null);
          }}
          onSave={handleSaveQuestion}
          onRegenerate={handleRegenerateQuestion}
        />
      )}
    </div>
  );
};
