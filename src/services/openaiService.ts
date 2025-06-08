import OpenAI from "openai";

interface GenerateImageParams {
  prompt: string;
  originalImageUrl: string;
  n?: number;
  size?: string;
  quality?: string;
}

interface EnhancePromptParams {
  userPrompt: string;
}

interface OpenAIImageResponse {
  created: number;
  data: {
    url: string;
    revised_prompt?: string;
  }[];
}

/**
 * Enhances a user prompt using GPT-4.1 nano
 * @param params Parameters for prompt enhancement
 * @returns Promise with the enhanced prompt
 */
export const enhancePrompt = async ({
  userPrompt,
}: EnhancePromptParams): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.error(
      "API Key validation failed: No API key provided in environment",
    );
    throw new Error("OpenAI API key is not configured");
  }

  try {
    console.log("=== PROMPT ENHANCEMENT STARTED ===");
    console.log("Original user prompt:", userPrompt);

    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini as GPT-4.1 nano equivalent
      messages: [
        {
          role: "user",
          content: `Explain this prompt in more detail, to help an image model create a high quality image. This prompt will be fed into the image model for creation. Only return your detailed prompt and nothing else.\n\n${userPrompt}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const enhancedPrompt =
      response.choices[0]?.message?.content?.trim() || userPrompt;

    console.log("Enhanced prompt:", enhancedPrompt);
    console.log("=== PROMPT ENHANCEMENT COMPLETED ===");

    return enhancedPrompt;
  } catch (error) {
    console.error("=== PROMPT ENHANCEMENT FAILED ===");
    console.error("Error details:", error);

    // Fallback to original prompt if enhancement fails
    console.log("Falling back to original prompt");
    return userPrompt;
  }
};

/**
 * Generates images using OpenAI's gpt-image-1 model
 * @param params Parameters for image generation
 * @returns Promise with the generated image URLs
 */
export const generateImages = async ({
  prompt,
  originalImageUrl,
  n = 1,
  size = "1024x1024",
  quality = "high",
}: GenerateImageParams): Promise<string[]> => {
  // API key is now managed through Vite's environment variables
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.error(
      "API Key validation failed: No API key provided in environment",
    );
    throw new Error("OpenAI API key is not configured");
  }

  // Use the image edits endpoint for gpt-image-1
  const url = "https://api.openai.com/v1/images/edits";

  try {
    console.log("=== IMAGE GENERATION STARTED ===");
    console.log(
      "API Key (masked):",
      apiKey
        ? apiKey.substring(0, 5) + "***" + apiKey.substring(apiKey.length - 4)
        : "Not provided",
    );
    console.log("Prompt length:", prompt.length);
    console.log("Prompt sample:", prompt.substring(0, 100) + "...");
    console.log("Number of images requested:", n);
    console.log("Size:", size);
    console.log("Quality:", quality);
    console.log("Original image URL provided:", !!originalImageUrl);

    // Convert the data URL to a Blob
    const fetchImageBlob = async (dataUrl: string): Promise<Blob> => {
      // If it's already a data URL
      if (dataUrl.startsWith("data:")) {
        const response = await fetch(dataUrl);
        return await response.blob();
      }
      // If it's a URL
      else if (dataUrl.startsWith("http")) {
        const response = await fetch(dataUrl);
        return await response.blob();
      }
      // If it's base64 without the data URL prefix
      else {
        const base64Response = await fetch(`data:image/png;base64,${dataUrl}`);
        return await base64Response.blob();
      }
    };

    // Make multiple requests to generate n images
    const imageUrls: string[] = [];

    for (let i = 0; i < n; i++) {
      // Add a small variation to the prompt for each image
      const variedPrompt = `${prompt} (Variation ${i + 1} of ${n})`;

      console.log(`\n--- Generating image ${i + 1} of ${n} ---`);
      console.log(`Request URL: ${url}`);
      console.log(`Request method: POST`);
      console.log(`Request headers: Authorization: Bearer sk-***`);

      // Log the full prompt being sent to the model
      console.log(`FULL PROMPT BEING SENT TO MODEL:`);
      console.log(variedPrompt);

      try {
        // Send the request to OpenAI API
        const startTime = Date.now();

        // Convert the image to a blob
        const imageBlob = await fetchImageBlob(originalImageUrl);
        if (!imageBlob) {
          throw new Error("Failed to convert image to blob");
        }

        // Create a FormData object for the multipart/form-data request
        const formData = new FormData();
        formData.append("model", "gpt-image-1");
        formData.append("prompt", variedPrompt);
        formData.append("n", "1");
        formData.append("size", size);

        // Add the image as a file
        const imageFile = new File([imageBlob], "image.png", {
          type: imageBlob.type,
        });
        formData.append("image", imageFile);

        // Send the request to OpenAI API with FormData
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });
        const responseTime = Date.now() - startTime;
        console.log(`Response time: ${responseTime}ms`);
        console.log(
          `Response status: ${response.status} ${response.statusText}`,
        );

        // Get response headers for debugging
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log("Response headers:", headers);

        // Handle non-OK responses
        if (!response.ok) {
          let errorMessage = `API request failed with status ${response.status}`;
          let errorDetails = {};

          try {
            const errorData = await response.json();
            console.error(
              `OpenAI API error response:`,
              JSON.stringify(errorData, null, 2),
            );
            errorMessage = errorData.error?.message || errorMessage;
            errorDetails = errorData;
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
            const textResponse = await response.text();
            console.error("Raw error response:", textResponse);
          }

          throw new Error(
            JSON.stringify({
              message: errorMessage,
              status: response.status,
              details: errorDetails,
            }),
          );
        }

        // Parse successful response
        console.log(`Parsing response JSON...`);
        const responseText = await response.text();
        console.log(`FULL RESPONSE BODY:`);
        console.log(responseText);

        let data: any;
        try {
          data = JSON.parse(responseText);
          console.log(
            "PARSED RESPONSE STRUCTURE:",
            JSON.stringify(data, null, 2),
          );
        } catch (parseError) {
          console.error("Failed to parse successful response:", parseError);
          console.error("Raw response:", responseText);
          throw new Error("Failed to parse API response");
        }

        // Check for different possible response formats
        if (data.data && Array.isArray(data.data)) {
          console.log(
            "Response contains data array with",
            data.data.length,
            "items",
          );

          // Log each item in the data array
          data.data.forEach((item: any, index: number) => {
            console.log(`Data item ${index}:`, JSON.stringify(item, null, 2));
          });

          // Try to extract URL from different possible formats
          const firstItem = data.data[0];
          if (firstItem) {
            if (firstItem.url) {
              console.log(
                `Image ${i + 1} URL found in data[0].url:`,
                firstItem.url,
              );
              imageUrls.push(firstItem.url);
            } else if (firstItem.b64_json) {
              console.log(`Image ${i + 1} found as base64 data`);
              const dataUrl = `data:image/png;base64,${firstItem.b64_json}`;
              imageUrls.push(dataUrl);
            } else {
              console.log(`No recognized image format in data[0]:`, firstItem);
              // Try to find any property that might contain a URL or image data
              const possibleUrlProps = Object.keys(firstItem).filter(
                (key) =>
                  typeof firstItem[key] === "string" &&
                  (firstItem[key].startsWith("http") ||
                    firstItem[key].startsWith("data:")),
              );

              if (possibleUrlProps.length > 0) {
                console.log(
                  `Found possible URL in property: ${possibleUrlProps[0]}`,
                );
                imageUrls.push(firstItem[possibleUrlProps[0]]);
              } else {
                console.error("No image URL or data found in response item");
                throw new Error(
                  "API response missing image data - no URL or base64 found",
                );
              }
            }
          } else {
            console.error("Empty data array in response");
            throw new Error("API response contains empty data array");
          }
        } else {
          // If data.data is not an array, log the entire structure and look for URLs
          console.log(
            "Response does not contain expected data array structure",
          );
          console.log(
            "Full response structure:",
            JSON.stringify(data, null, 2),
          );

          // Try to find any property that might contain a URL
          const findUrls = (obj: any, path = ""): string[] => {
            const urls: string[] = [];
            if (!obj || typeof obj !== "object") return urls;

            Object.entries(obj).forEach(([key, value]) => {
              const currentPath = path ? `${path}.${key}` : key;
              if (
                typeof value === "string" &&
                (value.startsWith("http") || value.startsWith("data:"))
              ) {
                urls.push(value);
                console.log(`Found URL at ${currentPath}:`, value);
              } else if (typeof value === "object" && value !== null) {
                urls.push(...findUrls(value, currentPath));
              }
            });

            return urls;
          };

          const foundUrls = findUrls(data);
          if (foundUrls.length > 0) {
            console.log(
              `Found ${foundUrls.length} URLs in response:`,
              foundUrls,
            );
            imageUrls.push(foundUrls[0]);
          } else {
            console.error("No image URLs found in response");
            throw new Error(
              "API response missing image data - no URLs found in response",
            );
          }
        }
        console.log(`Successfully added image ${i + 1} to results`);
      } catch (error) {
        console.error(`Error generating image ${i + 1}:`, error);
        throw error; // Re-throw the error to be handled by the caller
      }

      // Add a small delay between requests to avoid rate limiting
      if (i < n - 1) {
        console.log(`Waiting 1 second before next request...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // If we didn't generate any images, throw an error
    if (imageUrls.length === 0) {
      console.error("No images were generated");
      throw new Error("Failed to generate any images");
    }

    console.log(`=== IMAGE GENERATION COMPLETED ===`);
    console.log(`Total images generated: ${imageUrls.length}`);
    return imageUrls;
  } catch (error) {
    console.error("=== IMAGE GENERATION FAILED ===");
    console.error("Error details:", error);

    // Create a more informative error message
    let errorMessage = "Failed to generate images";
    if (error instanceof Error) {
      try {
        // Try to parse the error message as JSON for structured errors
        const parsedError = JSON.parse(error.message);
        errorMessage = `${parsedError.message} (Status: ${parsedError.status})`;
      } catch {
        // If not JSON, use the error message directly
        errorMessage = error.message;
      }
    }

    throw new Error(errorMessage);
  }
};

/**
 * Creates a data URL from a File object
 * @param file The file to convert to a data URL
 * @returns Promise with the data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// No longer need the createProductMask function as we're using the prompt to handle product placement
