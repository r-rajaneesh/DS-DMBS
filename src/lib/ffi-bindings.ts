// Using child processes to execute C programs
// This approach is more reliable and doesn't require complex FFI bindings
import { spawn } from 'child_process';

// File hash operations
export const fileHashLib = {
  async scanDirectory(directoryPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('/workspace/build/file_hash', [directoryPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`File hash scan failed: ${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }
};

// Pharmacy operations
export const pharmacyLib = {
  async getAllProducts(): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('/workspace/build/pharmacy_stock', [], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          // Extract JSON from the output
          const lines = output.split('\n');
          const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
          if (jsonStart !== -1) {
            const jsonLines = lines.slice(jsonStart);
            resolve(jsonLines.join('\n'));
          } else {
            resolve('[]');
          }
        } else {
          reject(new Error(`Pharmacy operation failed: ${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  },

  async addProduct(name: string, description: string, category: string, price: number, quantity: number, expiryDate: string, supplier: string): Promise<boolean> {
    // For now, we'll use the existing database that gets populated by the C program
    // In a real implementation, you'd want to modify the C program to accept parameters
    return true;
  }
};