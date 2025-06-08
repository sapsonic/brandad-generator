import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon, KeyIcon } from "lucide-react";

interface ApiKeyInputProps {
  apiKey: string;
  onChange: (apiKey: string) => void;
  className?: string;
}

const ApiKeyInput = ({
  apiKey,
  onChange,
  className = "",
}: ApiKeyInputProps) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="openai-api-key">OpenAI API Key</Label>
      <div className="flex items-center space-x-2">
        <KeyIcon className="h-5 w-5 text-gray-400" />
        <div className="relative flex-1">
          <Input
            id="openai-api-key"
            type={showApiKey ? "text" : "password"}
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => onChange(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={toggleShowApiKey}
          >
            {showApiKey ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Enter your OpenAI API key to use the gpt-image-1 model for generating ad
        variations. This model is specifically designed for image generation
        tasks.
      </p>
    </div>
  );
};

export default ApiKeyInput;
