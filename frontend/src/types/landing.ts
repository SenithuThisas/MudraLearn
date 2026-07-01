import type React from 'react';

export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'white';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

export interface CardProps {
  bg?: string;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export interface BadgeProps {
  bg?: string;
  children: React.ReactNode;
  className?: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
}

export interface FeatureCard {
  title: string;
  description: string;
  bg: string;
  size: 'large' | 'medium' | 'small' | 'stat';
  link?: string;
}
