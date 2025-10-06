#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <openssl/sha.h>
#include <openssl/md5.h>
#include <sqlite3.h>
#include <dirent.h>
#include <sys/stat.h>
#include <unistd.h>

// Structure to hold file information
typedef struct {
    char path[1024];
    char hash[65]; // SHA256 hash is 64 chars + null terminator
    long size;
    time_t mtime;
} FileInfo;

// Global database connection
sqlite3 *db;

// Function to calculate SHA256 hash of a file
int calculate_file_hash(const char *filepath, char *hash_output) {
    FILE *file = fopen(filepath, "rb");
    if (!file) {
        return 0;
    }

    SHA256_CTX sha256;
    SHA256_Init(&sha256);

    unsigned char buffer[8192];
    size_t bytes_read;
    while ((bytes_read = fread(buffer, 1, sizeof(buffer), file)) > 0) {
        SHA256_Update(&sha256, buffer, bytes_read);
    }

    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_Final(hash, &sha256);

    // Convert to hex string
    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        sprintf(hash_output + (i * 2), "%02x", hash[i]);
    }
    hash_output[64] = '\0';

    fclose(file);
    return 1;
}

// Function to get file size
long get_file_size(const char *filepath) {
    struct stat st;
    if (stat(filepath, &st) == 0) {
        return st.st_size;
    }
    return 0;
}

// Function to get file modification time
time_t get_file_mtime(const char *filepath) {
    struct stat st;
    if (stat(filepath, &st) == 0) {
        return st.st_mtime;
    }
    return 0;
}

// Callback function for directory traversal
int process_file(const char *filepath) {
    FileInfo file_info;
    strncpy(file_info.path, filepath, sizeof(file_info.path) - 1);
    file_info.path[sizeof(file_info.path) - 1] = '\0';
    
    file_info.size = get_file_size(filepath);
    file_info.mtime = get_file_mtime(filepath);
    
    if (!calculate_file_hash(filepath, file_info.hash)) {
        return 0;
    }

    // Insert into database
    sqlite3_stmt *stmt;
    const char *sql = "INSERT OR REPLACE INTO files (path, hash, size, mtime) VALUES (?, ?, ?, ?)";
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        return 0;
    }

    sqlite3_bind_text(stmt, 1, file_info.path, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, file_info.hash, -1, SQLITE_STATIC);
    sqlite3_bind_int64(stmt, 3, file_info.size);
    sqlite3_bind_int64(stmt, 4, file_info.mtime);

    int result = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    
    return (result == SQLITE_DONE) ? 1 : 0;
}

// Recursive directory traversal
void scan_directory(const char *dirpath) {
    DIR *dir = opendir(dirpath);
    if (!dir) return;

    struct dirent *entry;
    while ((entry = readdir(dir)) != NULL) {
        if (entry->d_name[0] == '.') continue; // Skip hidden files

        char full_path[2048];
        snprintf(full_path, sizeof(full_path), "%s/%s", dirpath, entry->d_name);

        struct stat st;
        if (stat(full_path, &st) == 0) {
            if (S_ISDIR(st.st_mode)) {
                // Recursively scan subdirectories
                scan_directory(full_path);
            } else if (S_ISREG(st.st_mode)) {
                // Process regular files
                process_file(full_path);
            }
        }
    }
    closedir(dir);
}

// Initialize database
int init_database() {
    int rc = sqlite3_open("/workspace/file_hashes.db", &db);
    if (rc) {
        fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(db));
        return 0;
    }

    // Create files table
    const char *sql = "CREATE TABLE IF NOT EXISTS files ("
                     "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                     "path TEXT UNIQUE NOT NULL,"
                     "hash TEXT NOT NULL,"
                     "size INTEGER NOT NULL,"
                     "mtime INTEGER NOT NULL"
                     ")";
    
    char *err_msg = 0;
    rc = sqlite3_exec(db, sql, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
        return 0;
    }

    return 1;
}

// Find duplicate files
void find_duplicates() {
    const char *sql = "SELECT hash, COUNT(*) as count, GROUP_CONCAT(path, '|') as paths "
                     "FROM files GROUP BY hash HAVING count > 1";
    
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        return;
    }

    printf("Duplicate files found:\n");
    printf("====================\n");
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        const char *hash = (const char *)sqlite3_column_text(stmt, 0);
        int count = sqlite3_column_int(stmt, 1);
        const char *paths = (const char *)sqlite3_column_text(stmt, 2);
        
        printf("Hash: %s (Found %d times)\n", hash, count);
        
        // Split paths and print each
        char *paths_copy = strdup(paths);
        char *token = strtok(paths_copy, "|");
        while (token != NULL) {
            printf("  - %s\n", token);
            token = strtok(NULL, "|");
        }
        free(paths_copy);
        printf("\n");
    }
    
    sqlite3_finalize(stmt);
}

// Cleanup
void cleanup() {
    if (db) {
        sqlite3_close(db);
    }
}

// Main function for testing
int main(int argc, char *argv[]) {
    if (argc != 2) {
        printf("Usage: %s <directory_to_scan>\n", argv[0]);
        return 1;
    }

    if (!init_database()) {
        return 1;
    }

    printf("Scanning directory: %s\n", argv[1]);
    scan_directory(argv[1]);
    
    printf("Scan complete. Finding duplicates...\n");
    find_duplicates();
    
    cleanup();
    return 0;
}