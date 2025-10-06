# PharmaStock - Pharmacy Stock Management & Duplicate File Finder

A comprehensive system built with Bun, Astro, SQLite, and C that provides:

1. **Pharmacy Stock Management Dashboard** - Manage inventory, track products, and monitor stock levels
2. **Duplicate File Finder** - Find duplicate files using SHA256 hashing with C backend for performance

## Architecture

- **Frontend**: Astro with Tailwind CSS for modern, responsive UI
- **Backend**: C libraries with SQLite for high-performance data operations
- **Runtime**: Bun for fast JavaScript execution
- **Database**: SQLite for lightweight, embedded database
- **FFI**: Foreign Function Interface to connect Node.js/Bun with C libraries

## Features

### Pharmacy Stock Management
- Add, view, and manage pharmacy products
- Track inventory levels and stock quantities
- Categorize products (Medications, Supplements, Medical Supplies, etc.)
- Low stock alerts and monitoring
- Product expiry date tracking
- Supplier information management

### Duplicate File Finder
- SHA256-based file hashing for accurate duplicate detection
- Recursive directory scanning
- High-performance C implementation
- Web interface for easy file management
- Copy file paths to clipboard

## Prerequisites

- Bun runtime
- GCC compiler
- SQLite development libraries
- OpenSSL development libraries

## Installation

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Install system dependencies:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y libsqlite3-dev libssl-dev build-essential
   ```

3. **Compile C libraries:**
   ```bash
   make all
   # or
   bun run compile-c
   ```

## Usage

1. **Start the development server:**
   ```bash
   bun run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000` (or the port shown in the terminal)

3. **Add sample data:**
   Click "Add Sample Data" on the dashboard to populate the database with example products

4. **Find duplicates:**
   Go to the "File Duplicates" page and enter a directory path to scan

## Project Structure

```
├── src/
│   ├── c/                    # C source files
│   │   ├── file_hash.c      # File hashing and duplicate detection
│   │   └── pharmacy_stock.c # Pharmacy inventory management
│   ├── lib/                 # TypeScript libraries
│   │   ├── ffi-bindings.ts  # FFI bindings for C libraries
│   │   ├── file-hash-service.ts
│   │   └── pharmacy-service.ts
│   ├── pages/               # Astro pages
│   │   ├── api/            # API endpoints
│   │   ├── index.astro     # Dashboard
│   │   ├── products.astro  # Product management
│   │   └── duplicates.astro # Duplicate finder
│   └── public/             # Static assets
├── build/                   # Compiled C libraries
├── Makefile                # C compilation rules
└── astro.config.mjs        # Astro configuration
```

## API Endpoints

- `GET /api/products` - Get all products
- `POST /api/products` - Add new product
- `GET /api/categories` - Get product categories
- `POST /api/duplicates` - Find duplicate files
- `POST /api/products/sample` - Add sample data

## C Libraries

### File Hash Library (`libfile_hash.so`)
- `init_database()` - Initialize SQLite database
- `scan_directory(path)` - Recursively scan directory
- `find_duplicates()` - Find and display duplicates
- `process_file(path)` - Process individual file

### Pharmacy Stock Library (`libpharmacy_stock.so`)
- `init_pharmacy_database()` - Initialize pharmacy database
- `add_product(...)` - Add new product
- `get_all_products()` - Retrieve all products
- `get_products_by_category(category)` - Filter by category
- `get_low_stock_products(threshold)` - Find low stock items

## Development

### Compiling C Code
```bash
make all          # Compile all libraries and executables
make clean        # Clean build artifacts
make compile-c    # Alias for make all
```

### Running Tests
```bash
# Test C libraries directly
./build/file_hash /path/to/directory
./build/pharmacy_stock
```

## Database Schema

### Files Table (file_hashes.db)
- `id` - Primary key
- `path` - File path
- `hash` - SHA256 hash
- `size` - File size in bytes
- `mtime` - Modification time

### Products Table (pharmacy_stock.db)
- `id` - Primary key
- `name` - Product name
- `description` - Product description
- `category` - Product category
- `price` - Product price
- `quantity` - Stock quantity
- `expiry_date` - Expiry date
- `supplier` - Supplier name
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Performance

- C backend provides high-performance file hashing
- SQLite offers fast, embedded database operations
- Bun runtime ensures fast JavaScript execution
- FFI minimizes overhead between JavaScript and C

## Security Considerations

- File paths are validated before processing
- SQLite prepared statements prevent injection
- Input sanitization on all user inputs
- Safe file system operations

## License

MIT License - see LICENSE file for details