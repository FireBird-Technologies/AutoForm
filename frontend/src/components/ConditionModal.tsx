import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface ConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: any;
  formQuestions: any[];
  onSave: (condition: any) => void;
}

export const ConditionModal: React.FC<ConditionModalProps> = ({
  isOpen,
  onClose,
  question,
  formQuestions,
  onSave
}) => {
  const [triggerQuestionId, setTriggerQuestionId] = useState('');
  const [conditionType, setConditionType] = useState('equals');
  const [conditionValue, setConditionValue] = useState('');
  const [action, setAction] = useState('show');

  const handleSave = () => {
    if (!triggerQuestionId) {
      alert('Please select a trigger question');
      return;
    }

    onSave({
      trigger_question_id: parseInt(triggerQuestionId),
      target_question_id: question.id,
      condition_type: conditionType,
      condition_value: conditionValue,
      action: action
    });

    // Reset and close
    setTriggerQuestionId('');
    setConditionValue('');
    onClose();
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
                  textAlign: 'left',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
              >
                <Dialog.Title
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}
                >
                  Add Conditional Logic
                </Dialog.Title>

                <Dialog.Description
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '24px'
                  }}
                >
                  Show or hide this question based on another question's answer
                </Dialog.Description>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* When (Trigger Question) */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}
                    >
                      When question
                    </label>
                    <select
                      value={triggerQuestionId}
                      onChange={(e) => setTriggerQuestionId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    >
                      <option value="">Select a question...</option>
                      {formQuestions
                        .filter((q) => q.id !== question.id)
                        .map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.question_text}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Condition Type */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}
                    >
                      Condition
                    </label>
                    <select
                      value={conditionType}
                      onChange={(e) => setConditionType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    >
                      <option value="equals">equals</option>
                      <option value="not_equals">does not equal</option>
                      <option value="contains">contains</option>
                      <option value="not_contains">does not contain</option>
                      <option value="is_empty">is empty</option>
                      <option value="is_not_empty">is not empty</option>
                      <option value="greater_than">is greater than</option>
                      <option value="less_than">is less than</option>
                    </select>
                  </div>

                  {/* Condition Value (if needed) */}
                  {!['is_empty', 'is_not_empty'].includes(conditionType) && (
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '8px'
                        }}
                      >
                        Value
                      </label>
                      <input
                        type="text"
                        value={conditionValue}
                        onChange={(e) => setConditionValue(e.target.value)}
                        placeholder="Enter comparison value..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}

                  {/* Action */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}
                    >
                      Then
                    </label>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    >
                      <option value="show">Show this question</option>
                      <option value="hide">Hide this question</option>
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                  <button
                    onClick={onClose}
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
                    onClick={handleSave}
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
                    Save Condition
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
