import React, { useState } from 'react';
import { QuestionProps } from './ShortAnswer';

export const WalletConnect: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false
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
    <div style={{
      marginBottom: hideLabel ? '0' : '48px',
      transition: 'all 0.2s'
    }}>
      {!hideLabel && (
        <>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: '500',
            color: '#000000',
            marginBottom: '8px',
            letterSpacing: '-0.01em'
          }}>
            {question.question_text}
            {question.required && <span style={{ color: '#9333ea', marginLeft: '4px' }}>*</span>}
          </label>
          {question.description && (
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              {question.description}
            </p>
          )}
        </>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!isConnected ? (
          <button
            type="button"
            onClick={handleConnect}
            disabled={disabled}
            style={{
              alignSelf: 'flex-start',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '500',
              color: '#ffffff',
              background: '#9333ea',
              border: 'none',
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = '#7e22ce')}
            onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = '#9333ea')}
          >
            Connect Wallet
          </button>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '8px'
          }}>
            <div style={{
              flex: 1,
              fontSize: '14px',
              color: '#7e22ce',
              fontFamily: 'monospace'
            }}>
              Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleDisconnect}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#6b7280',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9333ea';
                  e.currentTarget.style.color = '#9333ea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        )}
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: 0
        }}>
          Web3 wallet connection (MetaMask, WalletConnect, etc.)
        </p>
      </div>
    </div>
  );
};

