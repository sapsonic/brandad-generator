import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, Download, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GeneratedAd {
  id: string;
  imageUrl: string;
  rating?: number;
  isRegenerating?: boolean;
}

interface GenerationGalleryProps {
  generatedAds?: GeneratedAd[];
  onRateAd?: (id: string, rating: number) => void;
  onRegenerateAd?: (id: string) => void;
  onDownloadAd?: (id: string) => void;
  isLoading?: boolean;
}

const GenerationGallery = ({
  generatedAds = [
    {
      id: "1",
      imageUrl:
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
    },
    {
      id: "2",
      imageUrl:
        "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80",
    },
    {
      id: "3",
      imageUrl:
        "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80",
    },
  ],
  onRateAd = () => {},
  onRegenerateAd = () => {},
  onDownloadAd = () => {},
  isLoading = false,
}: GenerationGalleryProps) => {
  const [hoveredRatings, setHoveredRatings] = useState<Record<string, number>>(
    {},
  );

  const handleRatingHover = (adId: string, rating: number) => {
    setHoveredRatings((prev) => ({ ...prev, [adId]: rating }));
  };

  const handleRatingLeave = (adId: string) => {
    setHoveredRatings((prev) => {
      const newState = { ...prev };
      delete newState[adId];
      return newState;
    });
  };

  const handleRatingClick = (adId: string, rating: number) => {
    onRateAd(adId, rating);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto bg-background p-6">
      <h2 className="text-2xl font-bold mb-6">Generated Ad Variations</h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedAds.map((ad) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden h-full flex flex-col">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {ad.isRegenerating ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : null}
                  <img
                    src={ad.imageUrl}
                    alt={`Generated ad ${ad.id}`}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${ad.isRegenerating ? "opacity-30" : "opacity-100"}`}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.log(`Image loaded successfully: ${ad.id}`, {
                        url: ad.imageUrl.substring(0, 50) + "...",
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        complete: img.complete,
                      });
                    }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.error(`Image failed to load: ${ad.id}`, {
                        url: ad.imageUrl.substring(0, 50) + "...",
                        src: img.src.substring(0, 50) + "...",
                        error: e.type,
                      });

                      // Try to diagnose the issue
                      const errorType = e.type;
                      const url = ad.imageUrl;

                      // Check if URL is valid
                      try {
                        new URL(url);
                        console.log(`URL format is valid for ${ad.id}`);
                      } catch (urlError) {
                        console.error(
                          `Invalid URL format for ${ad.id}:`,
                          urlError,
                        );
                      }

                      // Check if URL is CORS-protected
                      if (
                        url.includes(
                          "oaidalleapiprodscus.blob.core.windows.net",
                        )
                      ) {
                        console.error(
                          `CORS issue likely with OpenAI URL for ${ad.id}`,
                        );
                      }

                      // Replace with a fallback image
                      const target = e.target as HTMLImageElement;
                      console.log(`Replacing with fallback image for ${ad.id}`);
                      target.src =
                        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80";
                      target.alt = "Error loading image - fallback displayed";
                    }}
                  />
                </div>

                <CardContent className="p-4 flex flex-col space-y-4 flex-grow">
                  <div className="flex items-center justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TooltipProvider key={star}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleRatingClick(ad.id, star)}
                              onMouseEnter={() =>
                                handleRatingHover(ad.id, star)
                              }
                              onMouseLeave={() => handleRatingLeave(ad.id)}
                              className="p-1"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  (
                                    hoveredRatings[ad.id] !== undefined
                                      ? star <= hoveredRatings[ad.id]
                                      : star <= (ad.rating || 0)
                                  )
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Rate {star} star{star !== 1 ? "s" : ""}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>

                  <div className="flex justify-between mt-auto pt-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRegenerateAd(ad.id)}
                            className="flex-1 mr-2"
                            disabled={ad.isRegenerating}
                          >
                            <RefreshCw
                              className={`h-4 w-4 mr-2 ${ad.isRegenerating ? "animate-spin" : ""}`}
                            />
                            {ad.isRegenerating
                              ? "Regenerating..."
                              : "Regenerate"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Create a new variation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onDownloadAd(ad.id)}
                            className="flex-1"
                            disabled={ad.isRegenerating}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save as PNG</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenerationGallery;
