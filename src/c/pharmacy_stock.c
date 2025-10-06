#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sqlite3.h>
#include <time.h>

// Global database connection
sqlite3 *db;

// Structure for pharmacy product
typedef struct {
    int id;
    char name[256];
    char description[512];
    char category[128];
    double price;
    int quantity;
    char expiry_date[32];
    char supplier[256];
    time_t created_at;
    time_t updated_at;
} Product;

// Initialize pharmacy database
int init_pharmacy_database() {
    int rc = sqlite3_open("/workspace/pharmacy_stock.db", &db);
    if (rc) {
        fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(db));
        return 0;
    }

    // Create products table
    const char *sql = "CREATE TABLE IF NOT EXISTS products ("
                     "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                     "name TEXT NOT NULL,"
                     "description TEXT,"
                     "category TEXT NOT NULL,"
                     "price REAL NOT NULL,"
                     "quantity INTEGER NOT NULL DEFAULT 0,"
                     "expiry_date TEXT,"
                     "supplier TEXT,"
                     "created_at INTEGER NOT NULL,"
                     "updated_at INTEGER NOT NULL"
                     ")";
    
    char *err_msg = 0;
    rc = sqlite3_exec(db, sql, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
        return 0;
    }

    // Create categories table
    sql = "CREATE TABLE IF NOT EXISTS categories ("
          "id INTEGER PRIMARY KEY AUTOINCREMENT,"
          "name TEXT UNIQUE NOT NULL,"
          "description TEXT"
          ")";
    
    rc = sqlite3_exec(db, sql, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
        return 0;
    }

    // Insert default categories
    sql = "INSERT OR IGNORE INTO categories (name, description) VALUES "
          "('Medications', 'Prescription and over-the-counter medications'),"
          "('Supplements', 'Vitamins and dietary supplements'),"
          "('Medical Supplies', 'Bandages, syringes, and medical equipment'),"
          "('Personal Care', 'Hygiene and personal care products'),"
          "('Health Devices', 'Blood pressure monitors, thermometers, etc.')";
    
    rc = sqlite3_exec(db, sql, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
    }

    return 1;
}

// Add a new product
int add_product(const char *name, const char *description, const char *category,
                double price, int quantity, const char *expiry_date, const char *supplier) {
    const char *sql = "INSERT INTO products (name, description, category, price, quantity, expiry_date, supplier, created_at, updated_at) "
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        return 0;
    }

    time_t now = time(NULL);
    
    sqlite3_bind_text(stmt, 1, name, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, description, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, category, -1, SQLITE_STATIC);
    sqlite3_bind_double(stmt, 4, price);
    sqlite3_bind_int(stmt, 5, quantity);
    sqlite3_bind_text(stmt, 6, expiry_date, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 7, supplier, -1, SQLITE_STATIC);
    sqlite3_bind_int64(stmt, 8, now);
    sqlite3_bind_int64(stmt, 9, now);

    int result = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    
    return (result == SQLITE_DONE) ? 1 : 0;
}

// Update product quantity
int update_product_quantity(int product_id, int new_quantity) {
    const char *sql = "UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?";
    
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        return 0;
    }

    time_t now = time(NULL);
    
    sqlite3_bind_int(stmt, 1, new_quantity);
    sqlite3_bind_int64(stmt, 2, now);
    sqlite3_bind_int(stmt, 3, product_id);

    int result = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    
    return (result == SQLITE_DONE) ? 1 : 0;
}

// Get all products (callback for JSON output)
int get_all_products_callback(void *data, int argc, char **argv, char **azColName) {
    printf("{\n");
    for (int i = 0; i < argc; i++) {
        printf("  \"%s\": \"%s\"%s\n", azColName[i], argv[i] ? argv[i] : "null", 
               (i < argc - 1) ? "," : "");
    }
    printf("},\n");
    return 0;
}

// Get all products as JSON
void get_all_products() {
    const char *sql = "SELECT * FROM products ORDER BY name";
    
    printf("[\n");
    char *err_msg = 0;
    int rc = sqlite3_exec(db, sql, get_all_products_callback, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
    }
    printf("]\n");
}

// Get products by category
void get_products_by_category(const char *category) {
    const char *sql = "SELECT * FROM products WHERE category = ? ORDER BY name";
    
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        return;
    }

    sqlite3_bind_text(stmt, 1, category, -1, SQLITE_STATIC);
    
    printf("[\n");
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        printf("{\n");
        for (int i = 0; i < sqlite3_column_count(stmt); i++) {
            const char *col_name = sqlite3_column_name(stmt, i);
            const char *value = (const char *)sqlite3_column_text(stmt, i);
            printf("  \"%s\": \"%s\"%s\n", col_name, value ? value : "null", 
                   (i < sqlite3_column_count(stmt) - 1) ? "," : "");
        }
        printf("},\n");
    }
    printf("]\n");
    
    sqlite3_finalize(stmt);
}

// Get low stock products (quantity < threshold)
void get_low_stock_products(int threshold) {
    const char *sql = "SELECT * FROM products WHERE quantity < ? ORDER BY quantity ASC";
    
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        return;
    }

    sqlite3_bind_int(stmt, 1, threshold);
    
    printf("[\n");
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        printf("{\n");
        for (int i = 0; i < sqlite3_column_count(stmt); i++) {
            const char *col_name = sqlite3_column_name(stmt, i);
            const char *value = (const char *)sqlite3_column_text(stmt, i);
            printf("  \"%s\": \"%s\"%s\n", col_name, value ? value : "null", 
                   (i < sqlite3_column_count(stmt) - 1) ? "," : "");
        }
        printf("},\n");
    }
    printf("]\n");
    
    sqlite3_finalize(stmt);
}

// Get all categories
void get_categories() {
    const char *sql = "SELECT * FROM categories ORDER BY name";
    
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        return;
    }
    
    printf("[\n");
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        printf("{\n");
        for (int i = 0; i < sqlite3_column_count(stmt); i++) {
            const char *col_name = sqlite3_column_name(stmt, i);
            const char *value = (const char *)sqlite3_column_text(stmt, i);
            printf("  \"%s\": \"%s\"%s\n", col_name, value ? value : "null", 
                   (i < sqlite3_column_count(stmt) - 1) ? "," : "");
        }
        printf("},\n");
    }
    printf("]\n");
    
    sqlite3_finalize(stmt);
}

// Cleanup
void cleanup_pharmacy() {
    if (db) {
        sqlite3_close(db);
    }
}

// Main function for testing
int main(int argc, char *argv[]) {
    if (!init_pharmacy_database()) {
        return 1;
    }

    // Add some sample products
    add_product("Aspirin 100mg", "Pain relief and anti-inflammatory", "Medications", 5.99, 50, "2025-12-31", "PharmaCorp");
    add_product("Vitamin D3", "Daily vitamin supplement", "Supplements", 12.99, 30, "2026-06-30", "HealthPlus");
    add_product("Bandages", "Adhesive bandages 100 pack", "Medical Supplies", 3.49, 25, "2027-01-01", "MedSupply Inc");
    add_product("Blood Pressure Monitor", "Digital arm cuff monitor", "Health Devices", 89.99, 5, "2028-12-31", "MedTech Solutions");

    printf("Sample products added. Current inventory:\n");
    get_all_products();
    
    cleanup_pharmacy();
    return 0;
}