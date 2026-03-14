"use client";
import { useState } from "react";
import { Upload, X, FileCheck, Shield } from "lucide-react";
import { Button } from "../ui/Button";

export const IDUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setIsUploading(false);
  };

  return (
    <div className="bg-white p-8 rounded-ahia-lg border border-gray-100 shadow-ahia max-w-md w-full space-y-6">
      <div className="space-y-2">
        <h3 className="font-heading font-bold text-2xl text-ahia-text">
          KYC (Know Your Campus)
        </h3>
        <p className="text-sm text-gray-500">
          Upload your Student ID or Portal Screenshot to start trading.
        </p>
      </div>

      {!file ? (
        <label className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-200 rounded-ahia-lg bg-gray-50/50 hover:bg-ahia-trust/5 hover:border-ahia-trust/30 transition-all cursor-pointer">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <Upload className="text-ahia-trust" size={32} />
            </div>
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-gray-400">PNG, JPG or PDF (Max. 5MB)</p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf"
          />
        </label>
      ) : (
        <div className="relative p-4 border-2 border-ahia-trust/20 rounded-ahia-lg bg-ahia-trust/5">
          <button
            onClick={clearFile}
            className="absolute -top-3 -right-3 p-1 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-ahia-red"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-white rounded-ahia flex items-center justify-center border border-ahia-trust/10 overflow-hidden">
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  className="object-cover w-full h-full"
                  alt="Preview"
                />
              ) : (
                <FileCheck className="text-ahia-trust" size={24} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-ahia-text">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-ahia text-xs text-gray-500">
        <Shield className="shrink-0 text-ahia-trust" size={16} />
        <p>
          Your ID is encrypted and only used for verification. It is not visible
          to other students.
        </p>
      </div>

      <Button
        variant="primary"
        className={`w-full ${
          !file || isUploading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => (!file || isUploading ? null : setIsUploading(true))}
      >
        {isUploading ? "Verifying..." : "Submit for Approval"}
      </Button>
    </div>
  );
};
