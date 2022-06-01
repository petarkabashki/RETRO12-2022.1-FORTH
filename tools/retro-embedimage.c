/* RETRO ------------------------------------------------------
  A personal, minimalistic forth
  Copyright (c) 2016 - 2019 Charles Childers

  This loads an image file and generates a C formatted output
  suitable for being linked into the virtual machine. It's
  used to create the `image.c` that gets linked into `retro`.
  ---------------------------------------------------------- */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <stdint.h>

#ifndef BIT64
#define CELL int32_t
#define CELL_MIN INT_MIN + 1
#define CELL_MAX INT_MAX - 1
#else
#define CELL int64_t
#define CELL_MIN LLONG_MIN + 1
#define CELL_MAX LLONG_MAX - 1
#endif

CELL memory[512*1024];

CELL ngaLoadImage(char *imageFile) {
  FILE *fp;
  CELL imageSize;
  long fileLen;
  if ((fp = fopen(imageFile, "rb")) != NULL) {
    /* Determine length (in cells) */
    fseek(fp, 0, SEEK_END);
    fileLen = ftell(fp) / sizeof(CELL);
    rewind(fp);
    /* Read the file into memory */
    imageSize = fread(&memory, sizeof(CELL), fileLen, fp);
    fclose(fp);
  }
  else {
    printf("Unable to find the ngaImage!\n");
    exit(1);
  }
  return imageSize;
}

void output_header(int size) {
  printf("#include <stdint.h>\n");
  printf("#ifndef CELL\n");
  printf("#ifndef BIT64\n");
  printf("#define CELL int32_t\n");
  printf("#define CELL_MIN INT_MIN + 1\n");
  printf("#define CELL_MAX INT_MAX - 1\n");
  printf("#else\n");
  printf("#define CELL int64_t\n");
  printf("#define CELL_MIN LLONG_MIN + 1\n");
  printf("#define CELL_MAX LLONG_MAX - 1\n");
  printf("#endif\n");
  printf("#endif\n");
  printf("CELL ngaImageCells = %lld;\n", (long long)size);
  printf("CELL ngaImage[] = { ");
}

int main(int argc, char **argv) {
  int32_t size = 0;
  int32_t i;
  int32_t n;

  if (argc == 2)
      size = ngaLoadImage(argv[1]);
  else
      size = ngaLoadImage("ngaImage");

  output_header(size);

  i = 0;
  n = 0;
  while (i < size) {
    n++;
    if (n == 20) {
      printf("\n                       ");
      n = 0;
    }
    if (i+1 < size)
      printf("%lld,", (long long)memory[i]);
    else
      printf("%lld };\n", (long long)memory[i]);
    i++;
  }
  exit(0);
}
