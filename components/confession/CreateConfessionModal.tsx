'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { Confession } from '@/types';
import styles from './CreateConfessionModal.module.css';

export interface CreateConfessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (confession: Confession) => void;
}

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

export const CreateConfessionModal: React.FC<CreateConfessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { showToast } = useToast();

  const charCount = text.length;
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;
  const remaining = MAX_LENGTH - charCount;

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setText('');
      setError(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      setError(`Confession must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/confessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create confession');
      }

      // Show success animation
      setShowSuccess(true);
      showToast('Confession shared successfully! 🎉', 'success');

      // Wait for animation then close
      setTimeout(() => {
        if (onSuccess && data.confession) {
          onSuccess(data.confession);
        }
        onClose();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create confession';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCharCountColor = () => {
    if (charCount < MIN_LENGTH) return styles.tooShort;
    if (charCount > MAX_LENGTH) return styles.tooLong;
    if (remaining < 50) return styles.warning;
    return styles.valid;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share a Confession"
    >
      {showSuccess ? (
        <div className={styles.successAnimation}>
          <div className={styles.successIcon}>✓</div>
          <p className={styles.successText}>Confession shared!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Textarea */}
          <div className={styles.textareaContainer}>
            <textarea
              className={styles.textarea}
              placeholder="Share your confession anonymously..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              rows={6}
            />
            
            {/* Character counter */}
            <div className={`${styles.charCounter} ${getCharCountColor()}`}>
              {charCount < MIN_LENGTH ? (
                <span>{MIN_LENGTH - charCount} more characters needed</span>
              ) : (
                <span>{remaining} characters remaining</span>
              )}
            </div>
          </div>

          {/* Validation hints */}
          {charCount > 0 && (
            <div className={styles.hints}>
              {charCount < MIN_LENGTH && (
                <p className={styles.hint}>
                  ⚠️ Confession is too short (minimum {MIN_LENGTH} characters)
                </p>
              )}
              {charCount > MAX_LENGTH && (
                <p className={styles.hint}>
                  ⚠️ Confession is too long (maximum {MAX_LENGTH} characters)
                </p>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Info message */}
          <div className={styles.info}>
            <span className={styles.infoIcon}>ℹ️</span>
            <span>Your confession will be anonymous and moderated by AI</span>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Sharing...' : 'Share Confession'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
