import React from 'react';
import { ShortAnswer } from './questions/ShortAnswer';
import { LongAnswer } from './questions/LongAnswer';
import { MultipleChoice } from './questions/MultipleChoice';
import { Checkboxes } from './questions/Checkboxes';
import { Dropdown } from './questions/Dropdown';
import { MultiSelect } from './questions/MultiSelect';
import { NumberInput } from './questions/NumberInput';
import { EmailInput } from './questions/EmailInput';
import { PhoneInput } from './questions/PhoneInput';
import { LinkInput } from './questions/LinkInput';
import { FileUpload } from './questions/FileUpload';
import { DatePicker } from './questions/DatePicker';
import { TimePicker } from './questions/TimePicker';
import { LinearScale } from './questions/LinearScale';
import { Matrix } from './questions/Matrix';
import { Rating } from './questions/Rating';
import { Payment } from './questions/Payment';
import { Signature } from './questions/Signature';
import { Ranking } from './questions/Ranking';
import { WalletConnect } from './questions/WalletConnect';
import { Button } from './questions/Button';

interface QuestionRendererProps {
  question: {
    id: number;
    question_type: string;
    question_text: string;
    description?: string;
    required: boolean;
    settings?: any;
  };
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  hideLabel?: boolean;
  accentColor?: string;
  boldTextColor?: string;
  uploadContext?: {
    token?: string;
  };
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  accentColor,
  boldTextColor,
  uploadContext
}) => {
  const questionProps = {
    question,
    value,
    onChange,
    disabled,
    hideLabel,
    accentColor,
    boldTextColor,
    uploadContext
  };

  switch (question.question_type) {
    case 'short_answer':
      return <ShortAnswer {...questionProps} />;
    case 'long_answer':
      return <LongAnswer {...questionProps} />;
    case 'multiple_choice':
      return <MultipleChoice {...questionProps} />;
    case 'checkboxes':
      return <Checkboxes {...questionProps} />;
    case 'dropdown':
      return <Dropdown {...questionProps} />;
    case 'multi_select':
      return <MultiSelect {...questionProps} />;
    case 'number':
      return <NumberInput {...questionProps} />;
    case 'email':
      return <EmailInput {...questionProps} />;
    case 'phone':
      return <PhoneInput {...questionProps} />;
    case 'link':
      return <LinkInput {...questionProps} />;
    case 'file_upload':
      return <FileUpload {...questionProps} />;
    case 'date':
      return <DatePicker {...questionProps} />;
    case 'time':
      return <TimePicker {...questionProps} />;
    case 'linear_scale':
      return <LinearScale {...questionProps} />;
    case 'matrix':
      return <Matrix {...questionProps} />;
    case 'rating':
      return <Rating {...questionProps} />;
    case 'payment':
      return <Payment {...questionProps} />;
    case 'signature':
      return <Signature {...questionProps} />;
    case 'ranking':
      return <Ranking {...questionProps} />;
    case 'wallet_connect':
      return <WalletConnect {...questionProps} />;
    case 'button':
      return <Button {...questionProps} />;
    default:
      return (
        <div className="question-wrapper">
          <p className="error-message">
            Unsupported question type: {question.question_type}
          </p>
        </div>
      );
  }
};
