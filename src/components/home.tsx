import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import InputSection from "./InputSection";
import GenerationGallery from "./GenerationGallery";

// Define the steps in the ad generation process
enum Step {
  INPUT = "input",
  GENERATION = "generation",
}

// Define the type for ad generation data
type GeneratedAd = {
  id: string;
  imageUrl: string;
  rating?: number;
  adType?: string;
  isRegenerating?: boolean;
};

const Home = () => {
  // State for tracking the current step in the process
  const [currentStep, setCurrentStep] = useState<Step>(Step.INPUT);

  // State for storing the product description and uploaded image
  const [productDescription, setProductDescription] = useState<string>("");
  const [productImage, setProductImage] = useState<File | null>(null);

  // State for storing generated ads
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);

  // State for tracking generation errors and loading state
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>(
    "Uploading your image",
  );

  // Function to animate the progress bar
  const startProgressAnimation = () => {
    const messages = [
      { threshold: 0, message: "Uploading your image" },
      { threshold: 20, message: "Doing science" },
      { threshold: 40, message: "Doing quality assessment" },
      { threshold: 60, message: "Almost done..." },
      { threshold: 80, message: "Anytime now..." },
    ];

    let currentProgress = 0;
    const maxProgress = 95; // Only go to 95% with animation, the final 5% happens when generation completes

    const interval = setInterval(() => {
      if (currentProgress >= maxProgress) {
        clearInterval(interval);
        return;
      }

      // Increment progress more slowly as we get closer to maxProgress
      const increment = Math.max(0.5, (maxProgress - currentProgress) / 20);
      currentProgress = Math.min(maxProgress, currentProgress + increment);
      setProgressValue(currentProgress);

      // Update message based on progress thresholds
      for (let i = messages.length - 1; i >= 0; i--) {
        if (currentProgress >= messages[i].threshold) {
          setProgressMessage(messages[i].message);
          break;
        }
      }
    }, 200);

    return () => clearInterval(interval);
  };

  // Handle form submission from InputSection
  const handleInputSubmit = (description: string, image: File) => {
    setProductDescription(description);
    setProductImage(image);

    // Generate ad variations directly
    generateAdVariations(description, image);
  };

  // Generate ad variations using OpenAI API
  const generateAdVariations = async (description: string, image: File) => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      setCurrentStep(Step.GENERATION);
      setProgressValue(0);
      setProgressMessage("Enhancing your prompt");

      // Start progress animation
      startProgressAnimation();

      // Import the OpenAI service functions
      const { generateImages, fileToDataUrl, enhancePrompt } = await import(
        "../services/openaiService"
      );

      // Step 1: Enhance the user prompt using GPT-4.1 nano
      console.log("Enhancing user prompt with GPT-4.1 nano...");
      setProgressMessage("Enhancing your description with AI");
      const enhancedDescription = await enhancePrompt({
        userPrompt: description,
      });
      console.log("Enhanced description:", enhancedDescription);

      // Update progress
      setProgressMessage("Uploading your image");

      // Convert the uploaded image to a data URL
      const imageDataUrl = await fileToDataUrl(image);

      // Fetch prompts from external source
      let basePrompt =
        'Create a professional ecommerce ad for this product. The product description is: "' +
        enhancedDescription +
        '". CRITICAL INSTRUCTION: The product must be the central focus of the ad and must maintain its exact appearance, colors, and design. Do not change any text on the product image uploaded.';
      let adTypes = [
        {
          type: "Creative Concept Ad",
          prompt:
            "\n\n1. Creative Concept Ad:\n- Generate a bold, imaginative visual concept using the product image.\n- The background and design should align with the product's theme and aesthetic.\n- Add a short, catchy headline or tagline that evokes curiosity or emotion.\n- Use a unique font style that fits the vibe of the concept.\n\nGeneral Rules:\n\n- Ensure the product is centered or attractively placed in the visual.\n- The image should be 1080x1080px.\n- Keep text concise and legible.\n- Use a font style that is unique to this ad.",
        },
        {
          type: "Benefit Highlight Ad",
          prompt:
            "\n\n1. Benefit Highlight Ad:\n- Focus on showcasing 2–3 key benefits or features of the product.\n- Integrate supporting graphics or icons (if relevant) in the design.\n- Make the product the visual hero.\n- Use a clean and legible font style different from other ads.\n\nGeneral Rules:\n\n- Ensure the product is centered or attractively placed in the visual.\n- The image should be 1080x1080px.\n- Keep text concise and legible.\n- Use a font style that is unique to this ad.",
        },
        {
          type: "Ecommerce-Style Ad",
          prompt:
            '\n\n1. Ecommerce-Style Ad:\n- Make it suitable for a Shopify or Amazon-style ecommerce setting.\n- Use color palettes that complement the product (auto-match to image).\n- Add CTA like "Buy Now" or "Limited Offer".\n- Do not add pricing, unless explicitly mentioned in the USER_DESCRIPTION.\n- Use a modern, commerce-friendly font style.\n\nGeneral Rules:\n\n- Ensure the product is centered or attractively placed in the visual.\n- The image should be 1080x1080px.\n- Keep text concise and legible.\n- Use a font style that is unique to this ad.',
        },
      ];

      // Try to fetch external prompt configuration
      try {
        const promptUrl =
          "https://gist.githubusercontent.com/sapsonic/b23aaf0bfd2d0c409364996e63ac8da4/raw/de27b05fbcec2bfe71f4179c50f43a6e16b5eb22/ad_prompt";
        if (promptUrl) {
          console.log("Fetching prompts from:", promptUrl);
          const response = await fetch(promptUrl);
          if (response.ok) {
            const externalConfig = await response.json();
            if (externalConfig.basePrompt) {
              basePrompt = externalConfig.basePrompt.replace(
                "{DESCRIPTION}",
                enhancedDescription,
              );
            }
            if (
              externalConfig.adTypes &&
              Array.isArray(externalConfig.adTypes)
            ) {
              adTypes = externalConfig.adTypes;
            }
            console.log("Successfully loaded external prompt configuration");
          } else {
            console.warn("Failed to fetch external prompts, using defaults");
          }
        }
      } catch (error) {
        console.warn("Error fetching external prompts, using defaults:", error);
      }

      console.log("Generating ad variations with OpenAI...");

      try {
        // Generate each ad type sequentially
        const generatedAds: GeneratedAd[] = [];

        for (const adType of adTypes) {
          console.log(`Generating ${adType.type}...`);

          // Create the full prompt by combining base prompt with ad type prompt
          const fullPrompt = basePrompt + adType.prompt;

          // Call the OpenAI API to generate the image
          const generatedImageUrls = await generateImages({
            prompt: fullPrompt,
            originalImageUrl: imageDataUrl,
            n: 1,
            size: "1024x1024", // Close to 1080x1080
            quality: "hd",
          });

          if (generatedImageUrls.length > 0) {
            generatedAds.push({
              id: `gen-${Date.now()}-${adType.type.toLowerCase().replace(/\s+/g, "-")}`,
              imageUrl: generatedImageUrls[0],
              adType: adType.type,
            });
          }
        }

        console.log("Setting generated ads:", generatedAds);
        setGeneratedAds(generatedAds);
      } catch (apiError) {
        console.error("OpenAI API error:", apiError);
        const errorMessage =
          apiError instanceof Error
            ? apiError.message
            : "Failed to generate images with OpenAI API";
        console.error("Error message:", errorMessage);
        setGenerationError(errorMessage);

        // Fall back to placeholder images if API fails
        const fallbackAds = [
          {
            id: "1",
            imageUrl:
              "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
            adType: "Creative Concept Ad",
          },
          {
            id: "2",
            imageUrl:
              "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
            adType: "Benefit Highlight Ad",
          },
          {
            id: "3",
            imageUrl:
              "https://images.unsplash.com/photo-1661956602926-db6b25f75947?w=800&q=80",
            adType: "Ecommerce-Style Ad",
          },
        ];

        console.log("Setting fallback ads:", fallbackAds);
        setGeneratedAds(fallbackAds);
      }

      // Complete the progress bar
      setProgressValue(100);
      setProgressMessage("Complete!");

      // Short delay before showing results
      setTimeout(() => {
        setIsGenerating(false);
      }, 500);
    } catch (error) {
      console.error("Error in generateAdVariations:", error);
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Failed to generate ad variations",
      );
      setIsGenerating(false);
    }
  };

  // Handle rating of a generated ad
  const handleRateAd = (id: string, rating: number) => {
    setGeneratedAds((prevAds) =>
      prevAds.map((ad) => (ad.id === id ? { ...ad, rating } : ad)),
    );
  };

  // Handle regeneration of an ad
  const handleRegenerateAd = async (id: string) => {
    try {
      // Find the ad to regenerate
      const adToRegenerate = generatedAds.find((ad) => ad.id === id);
      if (!adToRegenerate) return;

      // Set loading state for this specific ad
      setGeneratedAds((prevAds) =>
        prevAds.map((ad) => {
          if (ad.id === id) {
            return { ...ad, isRegenerating: true };
          }
          return ad;
        }),
      );

      // If we have the original image and product description, use the OpenAI API
      if (productImage && productDescription) {
        try {
          const { generateImages, fileToDataUrl, enhancePrompt } = await import(
            "../services/openaiService"
          );

          // Convert the uploaded image to a data URL
          const imageDataUrl = await fileToDataUrl(productImage);

          // Determine which ad type to regenerate
          const adType = adToRegenerate.adType || "Creative Concept Ad";

          // Get the current ad type configurations
          let currentAdTypes = [
            {
              type: "Creative Concept Ad",
              prompt:
                "\n\n1. Creative Concept Ad:\n- Generate a bold, imaginative visual concept using the product image.\n- The background and design should align with the product's theme and aesthetic.\n- Add a short, catchy headline or tagline that evokes curiosity or emotion.\n- Use a unique font style that fits the vibe of the concept.\n\nGeneral Rules:\n\n- Ensure the product is centered or attractively placed in the visual.\n- The image should be 1080x1080px.\n- Keep text concise and legible.\n- Use a font style that is unique to this ad.",
            },
            {
              type: "Benefit Highlight Ad",
              prompt:
                "\n\n1. Benefit Highlight Ad:\n- Focus on showcasing 2–3 key benefits or features of the product.\n- Integrate supporting graphics or icons (if relevant) in the design.\n- Make the product the visual hero.\n- Use a clean and legible font style different from other ads.\n\nGeneral Rules:\n\n- Ensure the product is centered or attractively placed in the visual.\n- The image should be 1080x1080px.\n- Keep text concise and legible.\n- Use a font style that is unique to this ad.",
            },
            {
              type: "Ecommerce-Style Ad",
              prompt:
                '\n\n1. Ecommerce-Style Ad:\n- Make it suitable for a Shopify or Amazon-style ecommerce setting.\n- Use color palettes that complement the product (auto-match to image).\n- Add CTA like "Buy Now" or "Limited Offer".\n- Do not add pricing, unless explicitly mentioned in the USER_DESCRIPTION.\n- Use a modern, commerce-friendly font style.\n\nGeneral Rules:\n\n- Ensure the product is centered or attractively placed in the visual.\n- The image should be 1080x1080px.\n- Keep text concise and legible.\n- Use a font style that is unique to this ad.',
            },
          ];

          // Try to fetch external prompt configuration
          try {
<<<<<<< HEAD
            const promptUrl = import.meta.env.VITE_PROMPT_CONFIG_URL;
=======
            const promptUrl =
              "https://gist.githubusercontent.com/sapsonic/b23aaf0bfd2d0c409364996e63ac8da4/raw/de27b05fbcec2bfe71f4179c50f43a6e16b5eb22/ad_prompt";
>>>>>>> Update components and OpenAI service
            if (promptUrl) {
              const response = await fetch(promptUrl);
              if (response.ok) {
                const externalConfig = await response.json();
                if (
                  externalConfig.adTypes &&
                  Array.isArray(externalConfig.adTypes)
                ) {
                  currentAdTypes = externalConfig.adTypes;
                }
              }
            }
          } catch (error) {
            console.warn(
              "Error fetching external prompts for regeneration, using defaults:",
              error,
            );
          }

          // Find the matching ad type in the configuration
          const adTypeConfig = currentAdTypes.find(
            (at) => at.type === adType,
          ) || {
            type: adType,
            prompt: "",
          };

          // Add the creativity instruction to make this generation unique
          const adTypeWithCreativity = {
            ...adTypeConfig,
            prompt: `${adTypeConfig.prompt}\n\n- Make it slightly more creative.`,
          };

          // Enhance the product description first
          const enhancedProductDescription = await enhancePrompt({
            userPrompt: productDescription,
          });

          // Get the current base prompt
          let currentBasePrompt =
            'Create a professional ecommerce ad for this product. The product description is: "' +
            enhancedProductDescription +
            '". CRITICAL INSTRUCTION: The product must be the central focus of the ad and must maintain its exact appearance, colors, and design. Do not change any text on the product image uploaded.';

          // Try to fetch external base prompt configuration
          try {
<<<<<<< HEAD
            const promptUrl = import.meta.env.VITE_PROMPT_CONFIG_URL;
=======
            const promptUrl =
              "https://gist.githubusercontent.com/sapsonic/b23aaf0bfd2d0c409364996e63ac8da4/raw/de27b05fbcec2bfe71f4179c50f43a6e16b5eb22/ad_prompt";
>>>>>>> Update components and OpenAI service
            if (promptUrl) {
              const response = await fetch(promptUrl);
              if (response.ok) {
                const externalConfig = await response.json();
                if (externalConfig.basePrompt) {
                  currentBasePrompt = externalConfig.basePrompt.replace(
                    "{DESCRIPTION}",
                    enhancedProductDescription,
                  );
                }
              }
            }
          } catch (error) {
            console.warn(
              "Error fetching external base prompt for regeneration, using default:",
              error,
            );
          }

          // Create the full prompt by combining base prompt with ad type prompt
          const specificPrompt =
            currentBasePrompt + adTypeWithCreativity.prompt;

          console.log(`Regenerating ${adType} with enhanced creativity...`);

          // Call the OpenAI API to generate a new image
          const generatedImageUrls = await generateImages({
            prompt: specificPrompt,
            originalImageUrl: imageDataUrl,
            n: 1,
            size: "1024x1024",
            quality: "hd",
          });

          if (generatedImageUrls.length > 0) {
            // Update the ad with the new image URL
            setGeneratedAds((prevAds) =>
              prevAds.map((ad) => {
                if (ad.id === id) {
                  return {
                    ...ad,
                    imageUrl: generatedImageUrls[0],
                    rating: undefined,
                    isRegenerating: false,
                  };
                }
                return ad;
              }),
            );
            return;
          }
        } catch (error) {
          console.error("Error regenerating ad with API:", error);
          // Fall back to mock regeneration
        }
      }

      // Fallback: update with a mock URL to simulate a new generation
      setGeneratedAds((prevAds) =>
        prevAds.map((ad) => {
          if (ad.id === id) {
            return {
              ...ad,
              imageUrl: `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80&random=${Math.random()}`,
              rating: undefined,
              isRegenerating: false,
            };
          }
          return ad;
        }),
      );
    } catch (error) {
      console.error("Error regenerating ad:", error);

      // Reset the loading state in case of error
      setGeneratedAds((prevAds) =>
        prevAds.map((ad) => {
          if (ad.id === id) {
            return { ...ad, isRegenerating: false };
          }
          return ad;
        }),
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b py-4 px-6">
        <div className="max-w-[1200px] mx-auto flex items-center justify-center">
          <img
            src="/images/logo-black-large.png"
            alt="Air Software Logo"
            className="h-12"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1200px] mx-auto py-8 px-4">
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger
              value={Step.INPUT}
              disabled={currentStep !== Step.INPUT}
              className={
                currentStep === Step.INPUT
                  ? "bg-primary text-primary-foreground"
                  : ""
              }
            >
              1. Input
            </TabsTrigger>
            <TabsTrigger
              value={Step.GENERATION}
              disabled={currentStep !== Step.GENERATION}
              className={
                currentStep === Step.GENERATION
                  ? "bg-primary text-primary-foreground"
                  : ""
              }
            >
              2. Generation
            </TabsTrigger>
          </TabsList>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TabsContent value={Step.INPUT} className="mt-6">
              <InputSection
                onSubmit={handleInputSubmit}
                isLoading={isGenerating}
              />
            </TabsContent>

            <TabsContent value={Step.GENERATION} className="mt-6">
              {generationError && (
                <div className="mb-6 p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
                  <p className="font-medium">Error generating ads:</p>
                  <pre className="whitespace-pre-wrap text-sm mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40">
                    {generationError}
                  </pre>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="font-medium text-yellow-800">
                      Troubleshooting tips:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm text-yellow-800 space-y-1">
                      <li>
                        Ensure the OpenAI API has access to image generation
                        models
                      </li>
                      <li>
                        Try a different image that's smaller in size (under 4MB)
                      </li>
                      <li>
                        Make sure your image has a transparent background (PNG
                        format)
                      </li>
                      <li>Check browser console for detailed error logs</li>
                    </ul>
                  </div>
                  <p className="mt-4 text-sm">
                    Using sample images instead. Please try again with a
                    different image.
                  </p>
                </div>
              )}
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 max-w-md mx-auto">
                  <h3 className="text-xl font-semibold mb-6">
                    Generating your ad variations
                  </h3>
                  <div className="w-full mb-2">
                    <Progress value={progressValue} className="h-2 w-full" />
                  </div>
                  <p className="text-muted-foreground mt-4">
                    {progressMessage}
                  </p>
                </div>
              ) : (
                <GenerationGallery
                  generatedAds={generatedAds}
                  onRateAd={handleRateAd}
                  onRegenerateAd={handleRegenerateAd}
                  isLoading={false}
                  onDownloadAd={(id) => {
                    const ad = generatedAds.find((ad) => ad.id === id);
                    if (ad) {
                      try {
                        // Create a temporary anchor element to download the image
                        const link = document.createElement("a");
                        link.href = ad.imageUrl;
                        link.download = `ad-variation-${ad.adType?.toLowerCase().replace(/\s+/g, "-") || id}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (error) {
                        console.error("Error downloading image:", error);
                        alert(
                          "Failed to download image. The image might be from an external source that doesn't allow downloads.",
                        );
                      } finally {
                        // Clean up the link element
                        const link = document.querySelector(
                          `a[download="ad-variation-${ad.adType?.toLowerCase().replace(/\s+/g, "-") || id}.png"]`,
                        );
                        if (link) document.body.removeChild(link);
                      }
                    }
                  }}
                />
              )}
            </TabsContent>
          </motion.div>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground">
        <p>© Air Software Pte Ltd, 2025</p>
      </footer>
    </div>
  );
};

export default Home;
