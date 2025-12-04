'use client';

import React, { useState } from 'react';
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction';
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { base } from 'wagmi/chains';
import { encodeFunctionData, parseUnits } from 'viem';
import styles from './TipButton.module.css';

export interface TipButtonProps {
  confessionId: string;
  recipientAddress: string; // Confession author's wallet address
  onTipSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const TIP_AMOUNTS = [0.001, 0.005, 0.01, 0.05];

// USDC ERC20 ABI (transfer function)
const USDC_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const;

export const TipButton: React.FC<TipButtonProps> = ({
  confessionId,
  recipientAddress,
  onTipSuccess,
  disabled = false,
  className = '',
}) => {
  const [showAmountSelector, setShowAmountSelector] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { address } = useAccount();
  const { showToast } = useToast();

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setShowAmountSelector(false);
  };

  const handleStatusChange = async (status: LifecycleStatus) => {
    if (status.statusName === 'success') {
      setIsProcessing(false);
      showToast('Tip sent successfully! 🎉', 'success');
      
      // Record tip in database
      if (status.statusData.transactionReceipts?.[0]?.transactionHash) {
        try {
          await fetch('/api/tips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              confessionId,
              amount: selectedAmount,
              txHash: status.statusData.transactionReceipts[0].transactionHash,
            }),
          });
          
          if (onTipSuccess) {
            onTipSuccess();
          }
        } catch (error) {
          console.error('Failed to record tip:', error);
        }
      }
      
      setSelectedAmount(null);
    } else if (status.statusName === 'error') {
      setIsProcessing(false);
      showToast('Tip failed. Please try again.', 'error');
    } else if (status.statusName === 'init') {
      setIsProcessing(true);
    }
  };

  const handleError = (error: { code: string; error: string; message: string }) => {
    console.error('Transaction error:', error);
    setIsProcessing(false);
    showToast(error?.message || 'Transaction failed', 'error');
  };

  // Generate transaction calls
  const getCalls = () => {
    if (!selectedAmount || !address || !recipientAddress) return [];

    const amountInUsdc = parseUnits(selectedAmount.toString(), 6); // USDC has 6 decimals

    return [
      {
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [recipientAddress, amountInUsdc],
        }),
      },
    ];
  };

  if (!address) {
    return (
      <Button variant="primary" size="sm" disabled className={className}>
        Connect Wallet to Tip
      </Button>
    );
  }

  if (!selectedAmount) {
    return (
      <div className={`${styles.container} ${className}`}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAmountSelector(!showAmountSelector)}
          disabled={disabled || isProcessing}
        >
          💸 Tip
        </Button>

        {showAmountSelector && (
          <div className={styles.amountSelector}>
            <div className={styles.selectorHeader}>Select Amount</div>
            {TIP_AMOUNTS.map((amount) => (
              <button
                key={amount}
                className={styles.amountOption}
                onClick={() => handleAmountSelect(amount)}
              >
                ${amount} USDC
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <Transaction
        chainId={base.id}
        calls={getCalls()}
        onStatus={handleStatusChange}
        onError={handleError}
      >
        <TransactionButton
          className={styles.transactionButton}
          text={`Tip $${selectedAmount} USDC`}
          disabled={disabled || isProcessing}
        />
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>

      <button
        className={styles.cancelButton}
        onClick={() => setSelectedAmount(null)}
        disabled={isProcessing}
      >
        Cancel
      </button>
    </div>
  );
};
