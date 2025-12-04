'use client';

import React from 'react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';
import styles from './WalletConnect.module.css';

export interface WalletConnectProps {
  className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ className = '' }) => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className={`${styles.container} ${className}`}>
        <ConnectWallet>
          <Avatar className={styles.avatar} />
          <Name className={styles.name} />
        </ConnectWallet>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <Wallet>
        <ConnectWallet>
          <Avatar className={styles.avatar} />
          <Name className={styles.name} />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className={styles.identity} hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className={styles.address} />
            <EthBalance />
          </Identity>
          <WalletDropdownLink
            icon="wallet"
            href="https://keys.coinbase.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wallet
          </WalletDropdownLink>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
};

// Simplified wallet button for mobile/compact views
export const WalletButton: React.FC<WalletConnectProps> = ({ className = '' }) => {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <ConnectWallet className={className}>
        <button className={styles.connectButton}>
          Connect Wallet
        </button>
      </ConnectWallet>
    );
  }

  return (
    <Wallet className={className}>
      <ConnectWallet>
        <button className={styles.walletButton}>
          <Avatar className={styles.smallAvatar} />
          <span className={styles.truncatedAddress}>
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </span>
        </button>
      </ConnectWallet>
      <WalletDropdown>
        <Identity className={styles.identity} hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address className={styles.address} />
          <EthBalance />
        </Identity>
        <WalletDropdownLink
          icon="wallet"
          href="https://keys.coinbase.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Wallet
        </WalletDropdownLink>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
};
