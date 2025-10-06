import type { APIRoute } from 'astro';
import { pharmacyService } from '../../lib/pharmacy-service';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const lowStock = url.searchParams.get('lowStock');
    
    let productsData: string;
    
    if (lowStock === 'true') {
      productsData = await pharmacyService.getLowStockProducts(10);
    } else if (category) {
      productsData = await pharmacyService.getProductsByCategory(category);
    } else {
      productsData = await pharmacyService.getAllProducts();
    }
    
    // Clean up the JSON output (remove trailing commas)
    const cleanData = productsData.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
    
    let products;
    try {
      products = JSON.parse(cleanData);
    } catch (parseError) {
      console.error('Failed to parse products JSON:', parseError);
      products = [];
    }
    
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, description, category, price, quantity, expiryDate, supplier } = body;
    
    if (!name || !category || price === undefined || quantity === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const success = await pharmacyService.addProduct(
      name,
      description || '',
      category,
      price,
      quantity,
      expiryDate || '',
      supplier || ''
    );
    
    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Failed to add product' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Error adding product:', error);
    return new Response(JSON.stringify({ error: 'Failed to add product' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};