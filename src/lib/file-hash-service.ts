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
      fileHashLib.scan_directory(directoryPath);
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
      // Capture stdout output
      const originalWrite = process.stdout.write;
      let output = '';
      
      process.stdout.write = (chunk: any) => {
        output += chunk.toString();
        return true;
      };

      fileHashLib.find_duplicates();

      // Restore original write function
      process.stdout.write = originalWrite;

      return output;
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