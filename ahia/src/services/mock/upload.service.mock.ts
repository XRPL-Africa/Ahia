// src/services/upload.service.mock.ts

import { UploadResponse } from '../upload.service';

class MockUploadService {
  private mockDelay = 1000;

  async uploadID(imageFile: File | Blob, userId: string): Promise<UploadResponse> {
    await this.delay();

    // Validate
    const validation = this.validateImage(imageFile);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const mockResponse: UploadResponse = {
      upload_id: 'upload_' + Date.now(),
      image_url: 's3://encrypted-bucket/student-ids/' + Date.now() + '.jpg',
      status: 'pending',
      uploaded_at: new Date().toISOString(),
    };

    console.log('MOCK Student ID uploaded successfully');

    return mockResponse;
  }

  async uploadListingImages(images: (File | Blob)[]): Promise<string[]> {
    await this.delay();

    // Validate all images
    for (const image of images) {
      const validation = this.validateImage(image);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    const urls = images.map(
      (_, index) => `https://mock-s3.amazonaws.com/listings/${Date.now()}_${index}.jpg`
    );

    console.log(`MOCK Uploaded ${urls.length} images`);

    return urls;
  }

  async uploadSingleImage(image: File | Blob): Promise<string> {
    await this.delay();

    const validation = this.validateImage(image);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image');
    }

    const url = `https://mock-s3.amazonaws.com/listings/${Date.now()}.jpg`;

    console.log('MOCK Image uploaded:', url);

    return url;
  }

  async getUploadProgress(uploadId: string): Promise<number> {
    await this.delay();
    
    // Mock progress
    return Math.floor(Math.random() * 100);
  }

  async cancelUpload(uploadId: string): Promise<void> {
    await this.delay();
    console.log('MOCK Upload cancelled');
  }

  async uploadWithProgress(
    imageFile: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    // Simulate progress
    const steps = [0, 25, 50, 75, 100];
    
    for (const progress of steps) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      if (onProgress) {
        onProgress(progress);
      }
      
      console.log(`MOCK Upload progress: ${progress}%`);
    }

    const url = `https://mock-s3.amazonaws.com/listings/${Date.now()}.jpg`;

    console.log('MOCK Upload complete:', url);

    return url;
  }

  validateImage(file: File | Blob): { valid: boolean; error?: string } {
    if (file instanceof File) {
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return {
          valid: false,
          error: 'File size must be less than 5MB',
        };
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return {
          valid: false,
          error: 'Only JPG, PNG, and WEBP images are allowed',
        };
      }
    }

    return { valid: true };
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.mockDelay));
  }
}

export default new MockUploadService();