import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({ size = 32, className, style }: LogoProps) {
  return (
    <img
      src="/brand/logo.png"
      alt="MudraLearn Logo"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'block',
        borderRadius: '8px',
        ...style,
      }}
    />
  );
}
