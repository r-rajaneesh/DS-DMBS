import type { APIRoute } from 'astro';
import { pharmacyService } from '../../../lib/pharmacy-service';

export const POST: APIRoute = async () => {
  try {
    // Add sample products
    const sampleProducts = [
      {
        name: 'Aspirin 100mg',
        description: 'Pain relief and anti-inflammatory medication',
        category: 'Medications',
        price: 5.99,
        quantity: 50,
        expiryDate: '2025-12-31',
        supplier: 'PharmaCorp'
      },
      {
        name: 'Vitamin D3 1000IU',
        description: 'Daily vitamin supplement for bone health',
        category: 'Supplements',
        price: 12.99,
        quantity: 30,
        expiryDate: '2026-06-30',
        supplier: 'HealthPlus'
      },
      {
        name: 'Bandages 100 pack',
        description: 'Adhesive bandages for minor cuts and wounds',
        category: 'Medical Supplies',
        price: 3.49,
        quantity: 25,
        expiryDate: '2027-01-01',
        supplier: 'MedSupply Inc'
      },
      {
        name: 'Blood Pressure Monitor',
        description: 'Digital arm cuff monitor with large display',
        category: 'Health Devices',
        price: 89.99,
        quantity: 5,
        expiryDate: '2028-12-31',
        supplier: 'MedTech Solutions'
      },
      {
        name: 'Paracetamol 500mg',
        description: 'Fever reducer and pain reliever',
        category: 'Medications',
        price: 4.50,
        quantity: 8,
        expiryDate: '2025-08-15',
        supplier: 'Generic Pharma'
      },
      {
        name: 'Multivitamin Complex',
        description: 'Complete daily multivitamin with minerals',
        category: 'Supplements',
        price: 18.99,
        quantity: 15,
        expiryDate: '2026-03-20',
        supplier: 'VitaLife'
      },
      {
        name: 'Thermometer Digital',
        description: 'Fast and accurate digital thermometer',
        category: 'Health Devices',
        price: 24.99,
        quantity: 12,
        expiryDate: '2029-05-10',
        supplier: 'HealthTech Pro'
      },
      {
        name: 'Gauze Pads 4x4',
        description: 'Sterile gauze pads for wound care',
        category: 'Medical Supplies',
        price: 7.99,
        quantity: 3,
        expiryDate: '2026-11-30',
        supplier: 'MedSupply Inc'
      }
    ];

    let successCount = 0;
    for (const product of sampleProducts) {
      const success = await pharmacyService.addProduct(
        product.name,
        product.description,
        product.category,
        product.price,
        product.quantity,
        product.expiryDate,
        product.supplier
      );
      if (success) successCount++;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Added ${successCount} sample products` 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error adding sample products:', error);
    return new Response(JSON.stringify({ error: 'Failed to add sample products' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};