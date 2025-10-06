import ffi from 'ffi-napi';
import ref from 'ref-napi';
import ArrayType from 'ref-array-napi';

// Define string type
const stringType = ref.types.CString;

// Define function signatures for file hash library
const fileHashLib = ffi.Library('/workspace/build/libfile_hash.so', {
  'init_database': ['int', []],
  'process_file': ['int', [stringType]],
  'scan_directory': ['void', [stringType]],
  'find_duplicates': ['void', []],
  'cleanup': ['void', []]
});

// Define function signatures for pharmacy stock library
const pharmacyLib = ffi.Library('/workspace/build/libpharmacy_stock.so', {
  'init_pharmacy_database': ['int', []],
  'add_product': ['int', [stringType, stringType, stringType, 'double', 'int', stringType, stringType]],
  'update_product_quantity': ['int', ['int', 'int']],
  'get_all_products': ['void', []],
  'get_products_by_category': ['void', [stringType]],
  'get_low_stock_products': ['void', ['int']],
  'get_categories': ['void', []],
  'cleanup_pharmacy': ['void', []]
});

export { fileHashLib, pharmacyLib };