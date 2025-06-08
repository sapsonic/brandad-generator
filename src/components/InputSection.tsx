import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface InputSectionProps {
  onSubmit: (description: string, image: File) => void;
  isLoading?: boolean;
}

const InputSection = ({ onSubmit, isLoading = false }: InputSectionProps) => {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Reset any previous errors
    setError(null);

    const file = acceptedFiles[0];

    // Validate file type
    if (
      !file.type.match("image/png") &&
      !file.type.match("image/jpeg") &&
      !file.type.match("image/jpg")
    ) {
      setError("Please upload a valid PNG or JPEG image");
      return;
    }

    // Validate file size (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      setError("Image size must be less than 15MB");
      return;
    }

    setImage(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: 4 * 1024 * 1024, // 4MB (OpenAI API limit)
    multiple: false,
  });

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(e.target.value);
    setError(null);
  };

  const handleSubmit = () => {
    // Validate description
    if (!description || !description.trim()) {
      setError("Please enter a product description");
      return;
    }

    // Validate image
    if (!image) {
      setError("Please upload a product image");
      return;
    }

    // Submit data
    onSubmit(description, image);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="product-description">Product Description</Label>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-400" />
              <Textarea
                id="product-description"
                placeholder="Describe your product in a few sentences..."
                value={description}
                onChange={handleDescriptionChange}
                className="flex-1 min-h-[100px]"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter a short description of your product to help generate
              relevant ads
            </p>
          </div>

          <div className="space-y-2">
            <Label>Upload Product Image (PNG or JPEG)</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50"}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
              {image ? (
                <div>
                  <p className="font-medium text-green-600">Image uploaded!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {image.name} ({(image.size / (1024 * 1024)).toFixed(2)}MB)
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">
                    Drag & drop your product image here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PNG or JPEG format, max 4MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate Ad Variations"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InputSection;
