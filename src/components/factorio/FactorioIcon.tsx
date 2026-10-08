import React, { useState } from 'react';
import { Box, Droplet } from 'lucide-react';

interface FactorioIconProps {
  id: string;
  name?: string;
  isFluid?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

export const FactorioIcon: React.FC<FactorioIconProps> = ({
  id,
  name,
  isFluid = false,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClass = typeof size === 'string' ? SIZE_MAP[size] : '';
  const customStyle = typeof size === 'number' ? { width: size, height: size } : {};

  if (hasError || !id) {
    return (
      <div
        style={customStyle}
        className={`flex items-center justify-center rounded shrink-0 border ${sizeClass} ${
          isFluid
            ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-400'
            : 'bg-amber-950/40 border-amber-800/40 text-amber-400'
        } ${className}`}
        title={name || id}
      >
        {isFluid ? <Droplet className="w-4/5 h-4/5" /> : <Box className="w-4/5 h-4/5" />}
      </div>
    );
  }

  return (
    <div
      style={customStyle}
      className={`relative flex items-center justify-center rounded shrink-0 bg-[#0e1015]/80 border border-[#2d333f]/60 p-0.5 overflow-hidden shadow-xs ${sizeClass} ${className}`}
      title={name || id}
    >
      <img
        src={`${import.meta.env.BASE_URL}icons/${id}.png`}
        alt={name || id}
        className="w-full h-full object-contain [image-rendering:pixelated]"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
