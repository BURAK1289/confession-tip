'use client';

import React, { useState } from 'react';
import styles from './OnboardingModal.module.css';

export interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: '🤫',
    title: 'Welcome to Confession Tip',
    description: 'Share your secrets anonymously and connect with others through honest confessions.',
  },
  {
    icon: '📝',
    title: 'Share Anonymously',
    description: 'Write confessions without revealing your identity. Your secrets are safe with us.',
  },
  {
    icon: '💰',
    title: 'Tip with USDC',
    description: 'Support confessions you love by sending USDC tips directly on Base network.',
  },
  {
    icon: '🏆',
    title: 'Climb the Leaderboard',
    description: 'The most-tipped confessions rise to the top. Will yours make it?',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Gradient glows */}
        <div className={styles.glowTop} />
        <div className={styles.glowBottom} />

        <div className={styles.content}>
          {/* Step indicator */}
          <div className={styles.stepIndicator}>
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`${styles.dot} ${index === currentStep ? styles.active : ''}`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className={styles.stepContent} key={currentStep}>
            <div className={styles.iconWrapper}>
              {step.icon}
            </div>
            <h2 className={styles.title}>{step.title}</h2>
            <p className={styles.description}>{step.description}</p>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.skipBtn} onClick={handleSkip}>
              Skip
            </button>
            <button className={styles.nextBtn} onClick={handleNext}>
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
