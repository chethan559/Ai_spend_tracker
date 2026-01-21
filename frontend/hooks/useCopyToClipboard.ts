'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface CopyResult {
  isCopied: boolean;
  copyToClipboard: (text: string) => Promise<void>;
}

/**
 * Hook to copy text to clipboard with UI feedback.
 */
export function useCopyToClipboard(): CopyResult {
  const [isCopied, setIsCopied] = useState(false);

  const resetCopied = () => {
    setIsCopied(false);
  };

  const copyToClipboard = async (text: string) => {
    if (!text) {
      toast.error('Nothing to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success('Copied to clipboard');
      window.setTimeout(resetCopied, 2000);
      return;
    } catch (error) {
      // fallback for older browsers
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        setIsCopied(true);
        toast.success('Copied to clipboard');
        window.setTimeout(resetCopied, 2000);
        return;
      }

      toast.error('Failed to copy to clipboard');
    } catch (fallbackError) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return { isCopied, copyToClipboard };
}
