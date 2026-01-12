import React, { Fragment, useState } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';

interface AddQuestionButtonProps {
  onAdd: (questionType: string) => void;
  disabled?: boolean;
}

const QUESTION_TYPES = [
  { id: 'short_answer', name: 'Short Answer', icon: '📝' },
  { id: 'long_answer', name: 'Long Answer', icon: '📄' },
  { id: 'multiple_choice', name: 'Multiple Choice', icon: '🔘' },
  { id: 'checkboxes', name: 'Checkboxes', icon: '☑️' },
  { id: 'dropdown', name: 'Dropdown', icon: '📋' },
  { id: 'multi_select', name: 'Multi-Select', icon: '📌' },
  { id: 'number', name: 'Number', icon: '🔢' },
  { id: 'email', name: 'Email', icon: '📧' },
  { id: 'phone', name: 'Phone', icon: '📱' },
  { id: 'link', name: 'Link', icon: '🔗' },
  { id: 'file_upload', name: 'File Upload', icon: '📎' },
  { id: 'date', name: 'Date', icon: '📅' },
  { id: 'time', name: 'Time', icon: '⏰' },
  { id: 'linear_scale', name: 'Linear Scale', icon: '📊' },
  { id: 'matrix', name: 'Matrix', icon: '📐' },
  { id: 'rating', name: 'Rating', icon: '⭐' },
  { id: 'payment', name: 'Payment', icon: '💳' },
  { id: 'signature', name: 'Signature', icon: '✍️' },
  { id: 'ranking', name: 'Ranking', icon: '🔢' },
  { id: 'wallet_connect', name: 'Wallet Connect', icon: '🔐' },
  { id: 'button', name: 'Button', icon: '🔘' }
];

export const AddQuestionButton: React.FC<AddQuestionButtonProps> = ({ onAdd, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(QUESTION_TYPES[0]);

  const handleAdd = () => {
    onAdd(selectedType.id);
    setIsOpen(false);
    setSelectedType(QUESTION_TYPES[0]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#9333ea',
          border: 'none',
          color: '#ffffff',
          fontSize: '24px',
          fontWeight: '300',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)',
          transition: 'all 0.2s',
          opacity: disabled ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = '#7e22ce';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = '#9333ea';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(147, 51, 234, 0.3)';
          }
        }}
        title="Add question"
      >
        +
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
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
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '32px',
                    maxWidth: '500px',
                    width: '100%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <Dialog.Title
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '24px'
                    }}
                  >
                    Add Question
                  </Dialog.Title>

                  <div style={{ marginBottom: '24px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}
                    >
                      Question Type
                    </label>
                    <Listbox value={selectedType} onChange={setSelectedType}>
                      <div style={{ position: 'relative' }}>
                        <Listbox.Button
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '15px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            background: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            outline: 'none'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#9333ea';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '20px' }}>{selectedType.icon}</span>
                            <span>{selectedType.name}</span>
                          </div>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </Listbox.Button>

                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options
                            style={{
                              position: 'absolute',
                              marginTop: '8px',
                              width: '100%',
                              maxHeight: '300px',
                              overflow: 'auto',
                              background: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                              zIndex: 50
                            }}
                          >
                            {QUESTION_TYPES.map((type) => (
                              <Listbox.Option
                                key={type.id}
                                value={type}
                                className={({ active }: { active: boolean }) => 
                                  active ? 'bg-purple-50' : ''
                                }
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  fontSize: '15px'
                                }}
                              >
                                {({ selected, active }: { selected: boolean; active: boolean }) => (
                                  <>
                                    <span style={{ fontSize: '20px' }}>{type.icon}</span>
                                    <span style={{ 
                                      flex: 1,
                                      color: active ? '#9333ea' : '#1f2937'
                                    }}>{type.name}</span>
                                    {selected && (
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#9333ea"
                                        strokeWidth="2"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setIsOpen(false)}
                      style={{
                        flex: 1,
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
                      Cancel
                    </button>
                    <button
                      onClick={handleAdd}
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#ffffff',
                        background: '#9333ea',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Add Question
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
