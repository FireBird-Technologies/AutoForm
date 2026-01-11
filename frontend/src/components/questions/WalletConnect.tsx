import React, { useState } from 'react';
import { QuestionProps } from './ShortAnswer';

export const WalletConnect: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const [isConnected, setIsConnected] = useState(!!value?.wallet_address);
  const walletAddress = value?.wallet_address || '';

  const handleConnect = async () => {
    if (disabled) return;
    
    // Placeholder for Web3 wallet connection
    // In production, this would use libraries like ethers.js or web3.js
    try {
      // Simulated wallet connection
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      onChange({ wallet_address: mockAddress });
      setIsConnected(true);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    onChange({ wallet_address: '' });
    setIsConnected(false);
  };

  return (
    <div className="question-wrapper">
      <label className="question-label">
        {question.question_text}
        {question.required && <span className="required-mark">*</span>}
      </label>
      {question.description && (
        <p className="question-description">{question.description}</p>
      )}
      <div className="wallet-connect-container">
        {!isConnected ? (
          <button
            type="button"
            className="wallet-connect-button"
            onClick={handleConnect}
            disabled={disabled}
          >
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-connected">
            <div className="wallet-address">
              Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
            </div>
            {!disabled && (
              <button
                type="button"
                className="wallet-disconnect-button"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>
        )}
        <p className="input-hint">
          Web3 wallet connection (MetaMask, WalletConnect, etc.)
        </p>
      </div>
    </div>
  );
};

