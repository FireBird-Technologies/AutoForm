import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QuestionEditorProps {
  question: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: any) => void;
  onRegenerate: (question: any) => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  isOpen,
  onClose,
  onSave,
  onRegenerate
}) => {
  const [questionText, setQuestionText] = useState(question.question_text);
  const [description, setDescription] = useState(question.description || '');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const handleSave = () => {
    onSave({
      question_text: questionText,
      description: description
    });
    onClose();
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate(question);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                style={{
                  width: '100%',
                  maxWidth: '700px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
              >
                <Dialog.Title 
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '24px'
                  }}
                >
                  Edit Question
                </Dialog.Title>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '12px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={() => setIsPreview(false)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: !isPreview ? '#9333ea' : '#6b7280',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: !isPreview ? '2px solid #9333ea' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setIsPreview(true)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: isPreview ? '#9333ea' : '#6b7280',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: isPreview ? '2px solid #9333ea' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Preview
                    </button>
                  </div>

                  {!isPreview ? (
                    <>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#000000',
                          marginBottom: '8px'
                        }}>
                          Question Text (Markdown supported)
                        </label>
                        <textarea
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '15px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        />
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#000000',
                          marginBottom: '8px'
                        }}>
                          Description (Optional)
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '15px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        />
                      </div>
                    </>
                  ) : (
                    <div style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      minHeight: '150px'
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#000000',
                        marginBottom: '8px'
                      }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {questionText}
                        </ReactMarkdown>
                      </div>
                      {description && (
                        <div style={{
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {description}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '20px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#9333ea',
                      background: 'transparent',
                      border: '1px solid #9333ea',
                      borderRadius: '8px',
                      cursor: isRegenerating ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isRegenerating ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => !isRegenerating && (e.currentTarget.style.background = '#faf5ff')}
                    onMouseLeave={(e) => !isRegenerating && (e.currentTarget.style.background = 'transparent')}
                  >
                    {isRegenerating ? 'Regenerating...' : '✨ Regenerate with AI'}
                  </button>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={onClose}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6b7280',
                        background: 'transparent',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#ffffff',
                        background: '#9333ea',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#7e22ce'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#9333ea'}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
