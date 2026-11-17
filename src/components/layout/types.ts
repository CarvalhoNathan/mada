import React from 'react';
import { ScreenId } from '../../types';

export interface OperatorInfo {
  name: string;
  avatarUrl?: string;
  role?: string;
}

export interface BottomBarProps {
  backLabel?: string;
  onBack?: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
  isPrimaryDisabled?: boolean;
  primaryIcon?: React.ReactNode;
}

export interface AppShellProps {
  appName?: string;
  subTitle?: string;
  operator?: OperatorInfo;
  isWifiConnected?: boolean;
  isServerLocal?: boolean;
  onOperatorClick?: () => void;
  currentScreen?: ScreenId;
  onNavigate?: (screen: ScreenId) => void;
  bottomBar?: BottomBarProps;
  children: React.ReactNode;
}
