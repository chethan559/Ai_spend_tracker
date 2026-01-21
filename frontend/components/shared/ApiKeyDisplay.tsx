'use client';

import { useState } from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface ApiKeyDisplayProps {
  apiKey: string;
  label?: string;
  description?: string;
}

export default function ApiKeyDisplay({
  apiKey,
  label = 'API Key',
  description,
}: ApiKeyDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  const maskedKey = apiKey ? `${apiKey.slice(0, 4)}••••••••••••••••` : '';

  const handleCopy = () => {
    void copyToClipboard(apiKey);
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setIsVisible((prev) => !prev)}
              aria-label={isVisible ? 'Hide API key' : 'Show API key'}
            >
              {isVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={handleCopy}
              aria-label="Copy API key"
            >
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-muted px-3 py-2 text-sm font-mono">
          {isVisible ? apiKey : maskedKey}
        </div>
      </CardContent>
    </Card>
  );
}
