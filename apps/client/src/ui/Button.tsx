import type { ButtonHTMLAttributes } from 'react';

import { Loader } from './Loader';

type Variant = 'filled' | 'default' | 'light' | 'subtle' | 'danger';
type Size = 'xs' | 'sm' | 'md';

const variants: Record<Variant, string> = {
  filled: 'border-transparent bg-blue text-white hover:bg-blue-6',
  default: 'border-gray-2 bg-white text-black hover:bg-gray-0',
  light: 'border-transparent bg-blue-0 text-blue hover:bg-blue-1/65',
  subtle: 'border-transparent bg-transparent text-blue hover:bg-blue-0',
  danger: 'border-transparent bg-red text-white hover:bg-red-6',
};

const sizes: Record<Size, string> = {
  xs: 'h-[30px] px-3.5',
  sm: 'h-9 px-[18px]',
  md: 'h-[42px] px-[22px]',
};

/** Also used to style links as buttons. */
export function buttonClasses({
  variant = 'filled',
  size = 'sm',
}: { variant?: Variant; size?: Size } = {}) {
  return `inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border text-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-gray-2 disabled:text-gray-5 aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-gray-2 aria-disabled:text-gray-5 aria-disabled:hover:bg-gray-2 ${variants[variant]} ${sizes[size]}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Disables the button and shows a spinner next to its label. */
  loading?: boolean;
};

export function Button(props: Props) {
  const {
    variant,
    size,
    loading,
    disabled,
    className = '',
    type = 'button',
    children,
    ...rest
  } = props;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${buttonClasses({ variant, size })} ${className}`}
      {...rest}
    >
      {loading && <Loader className="size-3.5" />}
      {children}
    </button>
  );
}
