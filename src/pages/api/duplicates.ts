import type { APIRoute } from 'astro';
import { fileHashService } from '../../lib/file-hash-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { directoryPath } = body;
    
    if (!directoryPath) {
      return new Response(JSON.stringify({ error: 'Directory path is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Scan directory for files
    const scanSuccess = await fileHashService.scanDirectory(directoryPath);
    
    if (!scanSuccess) {
      return new Response(JSON.stringify({ error: 'Failed to scan directory' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Find duplicates
    const duplicatesOutput = await fileHashService.findDuplicates();
    
    // Parse the output to extract duplicate information
    const duplicates = parseDuplicatesOutput(duplicatesOutput);
    
    return new Response(JSON.stringify({ 
      success: true, 
      duplicates,
      message: `Found ${duplicates.length} groups of duplicate files`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error finding duplicates:', error);
    return new Response(JSON.stringify({ error: 'Failed to find duplicates' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

function parseDuplicatesOutput(output: string): Array<{hash: string, count: number, files: string[]}> {
  const duplicates: Array<{hash: string, count: number, files: string[]}> = [];
  const lines = output.split('\n');
  
  let currentDuplicate: {hash: string, count: number, files: string[]} | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('Hash:')) {
      // Save previous duplicate if exists
      if (currentDuplicate) {
        duplicates.push(currentDuplicate);
      }
      
      // Start new duplicate group
      const hashMatch = trimmedLine.match(/Hash: (\w+) \(Found (\d+) times\)/);
      if (hashMatch) {
        currentDuplicate = {
          hash: hashMatch[1],
          count: parseInt(hashMatch[2]),
          files: []
        };
      }
    } else if (trimmedLine.startsWith('- ') && currentDuplicate) {
      // Add file to current duplicate group
      const filePath = trimmedLine.substring(2);
      currentDuplicate.files.push(filePath);
    }
  }
  
  // Add last duplicate if exists
  if (currentDuplicate) {
    duplicates.push(currentDuplicate);
  }
  
  return duplicates;
}