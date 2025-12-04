'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction';
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';
import { useAccount } from 'wagmi';
import { useToast } from '@/components/ui/Toast';
import { base } from 'wagmi/chains';
import { encodeFunctionData, parseUnits } from 'viem';
import styles from './TipButton.module.css';

export interface TipButtonProps {
  confessionId: string;
  recipientAddress: string;
  onTipSuccess?: () => void;
  disabled?: boolean;
  className?: string;
  hasTipped?: boolean;
}

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const TIP_AMOUNTS = [
  { value: 0.05, label: '$0.05' },
  { value: 0.10, label: '$0.10' },
  { value: 0.50, label: '$0.50' },
  { value: 1.00, label: '$1.00' },
  { value: 5.00, label: '$5.00' },
];

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
  hasTipped = false,
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
      
      if (status.statusData.transactionReceipts?.[0]?.transactionHash && address) {
        try {
          await fetch('/api/tips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              confession_id: confessionId,
              tipper_address: address,
              transaction_hash: status.statusData.transactionReceipts[0].transactionHash,
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

  const getCalls = () => {
    if (!selectedAmount || !address || !recipientAddress) return [];

    const amountInUsdc = parseUnits(selectedAmount.toString(), 6);

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
      <button className={`${styles.tipBtn} ${styles.disabled} ${className}`} disabled>
        <Heart className={styles.heartIcon} />
        Tip
      </button>
    );
  }

  if (!selectedAmount) {
    return (
      <div className={`${styles.container} ${className}`}>
        <button
          className={`${styles.tipBtn} ${hasTipped ? styles.tipped : ''}`}
          onClick={() => setShowAmountSelector(!showAmountSelector)}
          disabled={disabled || isProcessing}
        >
          <Heart className={`${styles.heartIcon} ${hasTipped ? styles.filled : ''}`} />
          Tip
        </button>

        {showAmountSelector && (
          <>
            <div className={styles.overlay} onClick={() => setShowAmountSelector(false)} />
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>Tip Amount</div>
              <div className={styles.dropdownGrid}>
                {TIP_AMOUNTS.map((amount) => (
                  <button
                    key={amount.value}
                    className={styles.dropdownItem}
                    onClick={() => handleAmountSelect(amount.value)}
                  >
                    {amount.label}
                  </button>
                ))}
              </div>
            </div>
          </>
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
          className={styles.txBtn}
          text={`Tip ${selectedAmount} USDC`}
          disabled={disabled || isProcessing}
        />
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>

      <button
        className={styles.cancelBtn}
        onClick={() => setSelectedAmount(null)}
        disabled={isProcessing}
      >
        Cancel
      </button>
    </div>
  );
};
