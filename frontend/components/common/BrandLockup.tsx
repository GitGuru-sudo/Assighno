'use client';

import Image from 'next/image';
import Link from 'next/link';

type BrandLockupProps = {
  className?: string;
  href?: string;
  subtitle?: string;
  tone?: 'dark' | 'light';
};

export const BrandLockup = ({
  className = '',
  href = '/dashboard',
  subtitle = 'Assignment flow, cleaned up.',
  tone = 'dark',
}: BrandLockupProps) => {
  const titleClassName = tone === 'light' ? 'text-white' : 'text-ink';
  const subtitleClassName = tone === 'light' ? 'text-white/55' : 'text-ink/55';

  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40 bg-[#10212e] shadow-[0_14px_35px_rgba(17,32,49,0.28)]">
        <Image src="/favicon-32x32.png" alt="Assighno logo" width={28} height={28} className="h-7 w-7 rounded-lg" priority />
      </div>
      <div>
        <p className={`font-display text-xl leading-none ${titleClassName}`}>Assighno</p>
        <p className={`mt-1 text-xs uppercase tracking-[0.22em] ${subtitleClassName}`}>{subtitle}</p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="transition duration-200 hover:scale-[1.01]">
      {content}
    </Link>
  );
};
