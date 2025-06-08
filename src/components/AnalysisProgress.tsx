import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, LoaderIcon } from "lucide-react";

interface AnalysisProgressProps {
  isAnalyzing?: boolean;
  currentStep?: number;
  progress?: number;
  onAnalysisComplete?: () => void;
}

const AnalysisProgress = ({
  isAnalyzing = true,
  currentStep = 0,
  progress = 0,
  onAnalysisComplete = () => {},
}: AnalysisProgressProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const steps = [
    {
      id: 0,
      name: "Website Crawling",
      description: "Scanning website content and structure",
    },
    {
      id: 1,
      name: "Brand Element Extraction",
      description: "Identifying colors, fonts, and visual style",
    },
    {
      id: 2,
      name: "Tone Analysis",
      description: "Determining brand voice and messaging style",
    },
    {
      id: 3,
      name: "Product Detection",
      description: "Identifying and masking product areas",
    },
  ];

  useEffect(() => {
    // Simulate progress animation
    if (isAnalyzing) {
      const timer = setTimeout(() => {
        if (animatedProgress < progress) {
          setAnimatedProgress((prev) => Math.min(prev + 1, 100));
        }
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(100);
      onAnalysisComplete();
    }
  }, [isAnalyzing, progress, animatedProgress, onAnalysisComplete]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-background p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Analyzing Brand Elements
      </h2>

      <div className="mb-6">
        <Progress value={animatedProgress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2 text-right">
          {animatedProgress}%
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <Card
            key={step.id}
            className={`border ${currentStep === step.id ? "border-primary" : currentStep > step.id ? "border-green-500" : "border-muted"}`}
          >
            <CardContent className="p-4 flex items-center">
              <div className="mr-4">
                {currentStep > step.id ? (
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckIcon className="h-5 w-5 text-white" />
                  </div>
                ) : currentStep === step.id ? (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                    <LoaderIcon className="h-5 w-5 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">{step.id + 1}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{step.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentStep >= steps.length && (
        <div className="mt-6 text-center text-green-600 font-medium">
          Analysis complete! Generating ad variations...
        </div>
      )}
    </div>
  );
};

export default AnalysisProgress;
