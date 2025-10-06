#!/usr/bin/env node

// Demo script for PharmaStock system
const baseUrl = 'http://localhost:3001';

async function demo() {
  console.log('🏥 PharmaStock System Demo\n');
  
  try {
    // Test 1: Get all products
    console.log('1. 📦 Fetching all products...');
    const productsResponse = await fetch(`${baseUrl}/api/products`);
    const products = await productsResponse.json();
    console.log(`   Found ${products.length} products in inventory\n`);
    
    // Test 2: Get categories
    console.log('2. 📋 Fetching product categories...');
    const categoriesResponse = await fetch(`${baseUrl}/api/categories`);
    const categories = await categoriesResponse.json();
    console.log(`   Available categories: ${categories.map(c => c.name).join(', ')}\n`);
    
    // Test 3: Filter by category
    console.log('3. 🔍 Filtering products by category (Medications)...');
    const medsResponse = await fetch(`${baseUrl}/api/products?category=Medications`);
    const medications = await medsResponse.json();
    console.log(`   Found ${medications.length} medication products\n`);
    
    // Test 4: Check low stock
    console.log('4. ⚠️  Checking for low stock products...');
    const lowStockResponse = await fetch(`${baseUrl}/api/products?lowStock=true`);
    const lowStock = await lowStockResponse.json();
    console.log(`   Found ${lowStock.length} low stock items\n`);
    
    // Test 5: Add a new product
    console.log('5. ➕ Adding a new product...');
    const newProduct = {
      name: 'Demo Product',
      description: 'This is a demo product',
      category: 'Supplements',
      price: 15.99,
      quantity: 20,
      expiryDate: '2025-12-31',
      supplier: 'Demo Supplier'
    };
    
    const addResponse = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    
    if (addResponse.ok) {
      console.log('   ✅ Product added successfully\n');
    } else {
      console.log('   ❌ Failed to add product\n');
    }
    
    // Test 6: Find duplicate files
    console.log('6. 🔍 Scanning for duplicate files in /workspace/src...');
    const duplicatesResponse = await fetch(`${baseUrl}/api/duplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directoryPath: '/workspace/src' })
    });
    
    const duplicatesResult = await duplicatesResponse.json();
    console.log(`   ${duplicatesResult.message}\n`);
    
    // Test 7: Show some product details
    console.log('7. 📊 Sample product details:');
    products.slice(0, 3).forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - $${product.price} (Qty: ${product.quantity})`);
    });
    
    console.log('\n✅ Demo completed successfully!');
    console.log('\n🌐 Open http://localhost:3001 in your browser to see the web interface');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log('\n💡 Make sure the server is running with: bun run dev');
  }
}

// Run demo
demo();