import type { APIRoute } from 'astro';
import { pharmacyService } from '../../lib/pharmacy-service';

export const GET: APIRoute = async () => {
  try {
    const categoriesData = await pharmacyService.getCategories();
    
    // Clean up the JSON output (remove trailing commas)
    const cleanData = categoriesData.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
    
    let categories;
    try {
      categories = JSON.parse(cleanData);
    } catch (parseError) {
      console.error('Failed to parse categories JSON:', parseError);
      categories = [];
    }
    
    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};