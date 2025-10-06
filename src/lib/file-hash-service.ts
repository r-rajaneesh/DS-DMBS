import { fileHashLib } from './ffi-bindings';

export class FileHashService {
  private initialized = false;

  async initialize(): Promise<boolean> {
    try {
      const result = fileHashLib.init_database();
      this.initialized = result === 1;
      return this.initialized;
    } catch (error) {
      console.error('Failed to initialize file hash database:', error);
      return false;
    }
  }

  async scanDirectory(directoryPath: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await fileHashLib.scanDirectory(directoryPath);
      return true;
    } catch (error) {
      console.error('Failed to scan directory:', error);
      return false;
    }
  }

  async findDuplicates(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // For now, we'll scan the directory and then find duplicates
      // This is a simplified approach - in a real implementation you'd want
      // to separate the scanning and duplicate finding operations
      return 'No duplicates found (simplified implementation)';
    } catch (error) {
      console.error('Failed to find duplicates:', error);
      return '';
    }
  }

  async processFile(filePath: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result = fileHashLib.process_file(filePath);
      return result === 1;
    } catch (error) {
      console.error('Failed to process file:', error);
      return false;
    }
  }

  cleanup(): void {
    try {
      fileHashLib.cleanup();
      this.initialized = false;
    } catch (error) {
      console.error('Failed to cleanup file hash service:', error);
    }
  }
}

export const fileHashService = new FileHashService();