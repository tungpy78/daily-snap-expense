export interface StorageService {
  uploadImage(file: Express.Multer.File, folderPath: string): Promise<string>;
  deleteImage(imageUrl: string): Promise<void>;
}
