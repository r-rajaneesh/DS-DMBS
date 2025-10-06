CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -fPIC -D_GNU_SOURCE -Wno-deprecated-declarations
LDFLAGS = -shared
LIBS = -lsqlite3 -lssl -lcrypto

# Source files
FILE_HASH_SRC = src/c/file_hash.c
PHARMACY_SRC = src/c/pharmacy_stock.c

# Object files
FILE_HASH_OBJ = build/file_hash.o
PHARMACY_OBJ = build/pharmacy_stock.o

# Shared libraries
FILE_HASH_LIB = build/libfile_hash.so
PHARMACY_LIB = build/libpharmacy_stock.so

# Executables
FILE_HASH_EXE = build/file_hash
PHARMACY_EXE = build/pharmacy_stock

# Create build directory
build:
	mkdir -p build

# Compile shared libraries
$(FILE_HASH_LIB): $(FILE_HASH_OBJ) | build
	$(CC) $(LDFLAGS) -o $@ $< $(LIBS)

$(PHARMACY_LIB): $(PHARMACY_OBJ) | build
	$(CC) $(LDFLAGS) -o $@ $< $(LIBS)

# Compile object files
$(FILE_HASH_OBJ): $(FILE_HASH_SRC) | build
	$(CC) $(CFLAGS) -c -o $@ $<

$(PHARMACY_OBJ): $(PHARMACY_SRC) | build
	$(CC) $(CFLAGS) -c -o $@ $<

# Compile executables
$(FILE_HASH_EXE): $(FILE_HASH_SRC) | build
	$(CC) $(CFLAGS) -o $@ $< $(LIBS)

$(PHARMACY_EXE): $(PHARMACY_SRC) | build
	$(CC) $(CFLAGS) -o $@ $< $(LIBS)

# Build all
all: $(FILE_HASH_LIB) $(PHARMACY_LIB) $(FILE_HASH_EXE) $(PHARMACY_EXE)

# Clean
clean:
	rm -rf build

# Install dependencies
install-deps:
	sudo apt-get update
	sudo apt-get install -y libsqlite3-dev libssl-dev build-essential

.PHONY: all clean install-deps