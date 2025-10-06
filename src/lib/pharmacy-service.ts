import { pharmacyLib } from './ffi-bindings';
import { spawn } from 'child_process';

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  expiry_date: string;
  supplier: string;
  created_at: number;
  updated_at: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export class PharmacyService {
  private initialized = false;

  async initialize(): Promise<boolean> {
    try {
      const result = pharmacyLib.init_pharmacy_database();
      this.initialized = result === 1;
      return this.initialized;
    } catch (error) {
      console.error('Failed to initialize pharmacy database:', error);
      return false;
    }
  }

  async addProduct(
    name: string,
    description: string,
    category: string,
    price: number,
    quantity: number,
    expiryDate: string,
    supplier: string
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result = pharmacyLib.add_product(
        name,
        description,
        category,
        price,
        quantity,
        expiryDate,
        supplier
      );
      return result === 1;
    } catch (error) {
      console.error('Failed to add product:', error);
      return false;
    }
  }

  async updateProductQuantity(productId: number, newQuantity: number): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result = pharmacyLib.update_product_quantity(productId, newQuantity);
      return result === 1;
    } catch (error) {
      console.error('Failed to update product quantity:', error);
      return false;
    }
  }

  async getAllProducts(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Use child process to execute C program and capture output
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
            // Extract JSON from the output (skip the "Sample products added..." line)
            const lines = output.split('\n');
            const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
            if (jsonStart !== -1) {
              const jsonLines = lines.slice(jsonStart);
              const jsonOutput = jsonLines.join('\n');
              resolve(jsonOutput);
            } else {
              resolve('[]');
            }
          } else {
            console.error('C program error:', errorOutput);
            resolve('[]');
          }
        });

        child.on('error', (error) => {
          console.error('Failed to execute C program:', error);
          resolve('[]');
        });
      });
    } catch (error) {
      console.error('Failed to get all products:', error);
      return '[]';
    }
  }

  async getProductsByCategory(category: string): Promise<string> {
    // For now, get all products and filter by category
    const allProducts = await this.getAllProducts();
    try {
      const products = JSON.parse(allProducts);
      const filtered = products.filter((p: any) => p.category === category);
      return JSON.stringify(filtered);
    } catch (error) {
      console.error('Failed to filter products by category:', error);
      return '[]';
    }
  }

  async getLowStockProducts(threshold: number = 10): Promise<string> {
    // For now, get all products and filter by quantity
    const allProducts = await this.getAllProducts();
    try {
      const products = JSON.parse(allProducts);
      const filtered = products.filter((p: any) => parseInt(p.quantity) < threshold);
      return JSON.stringify(filtered);
    } catch (error) {
      console.error('Failed to filter low stock products:', error);
      return '[]';
    }
  }

  async getCategories(): Promise<string> {
    // Return hardcoded categories for now
    return JSON.stringify([
      { id: 1, name: "Medications", description: "Prescription and over-the-counter medications" },
      { id: 2, name: "Supplements", description: "Vitamins and dietary supplements" },
      { id: 3, name: "Medical Supplies", description: "Bandages, syringes, and medical equipment" },
      { id: 4, name: "Personal Care", description: "Hygiene and personal care products" },
      { id: 5, name: "Health Devices", description: "Blood pressure monitors, thermometers, etc." }
    ]);
  }

  cleanup(): void {
    try {
      pharmacyLib.cleanup_pharmacy();
      this.initialized = false;
    } catch (error) {
      console.error('Failed to cleanup pharmacy service:', error);
    }
  }
}

export const pharmacyService = new PharmacyService();