// src/services/upload.service.ts

import api from './api';

// ============================================
// TYPES
// ============================================

export interface UploadResponse {
  upload_id: string;
  image_url: string;
  status: 'pending';
  uploaded_at: string;
}

// ============================================
// UPLOAD SERVICE
// ============================================

class UploadService {
  /**
   * Upload student ID for verification
   * POST /api/upload-id
   */
  async uploadID(imageFile: File, userId: string): Promise<UploadResponse> {
    try {
      // Validate before uploading
      const validation = this.validateImage(imageFile);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('user_id', userId);

      const response = await api.post<UploadResponse>('/upload-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Student ID uploaded successfully');

      return response.data;
    } catch (error: any) {
      console.error(
        'ID upload failed:',
        error.response?.data || error.message
      );
      throw this.handleError(error);
    }
  }

  /**
   * Upload multiple listing images
   */
  async uploadListingImages(images: File[]): Promise<string[]> {
    try {
      // Validate all images first
      for (const image of images) {
        const validation = this.validateImage(image);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      const formData = new FormData();
      images.forEach((image) => formData.append('images', image));

      const response = await api.post<{ image_urls: string[] }>(
        '/listings/upload-images',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log(`Uploaded ${response.data.image_urls.length} images`);

      return response.data.image_urls;
    } catch (error: any) {
      console.error(
        'Image upload failed:',
        error.response?.data || error.message
      );
      throw this.handleError(error);
    }
  }

  /**
   * Upload with progress tracking
   */
  async uploadWithProgress(
    imageFile: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const validation = this.validateImage(imageFile);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post<{ image_url: string }>(
        '/listings/upload-image',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress?.(progress);
              console.log(`Upload progress: ${progress}%`);
            }
          },
        }
      );

      console.log('Upload complete:', response.data.image_url);

      return response.data.image_url;
    } catch (error: any) {
      console.error(
        'Upload failed:',
        error.response?.data || error.message
      );
      throw this.handleError(error);
    }
  }

  /**
   * Get upload progress by ID
   */
  async getUploadProgress(uploadId: string): Promise<number> {
    try {
      const response = await api.get<{ progress: number }>(
        `/upload/progress/${uploadId}`
      );
      return response.data.progress;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel ongoing upload
   */
  async cancelUpload(uploadId: string): Promise<void> {
    try {
      await api.delete(`/upload/cancel/${uploadId}`);
      console.log('Upload cancelled');
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate image file before upload
   * Max 5MB, JPG/PNG only
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPG, PNG, and WEBP images are allowed',
      };
    }

    return { valid: true };
  }

  /**
   * Handle and format API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'Upload failed';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new UploadService();