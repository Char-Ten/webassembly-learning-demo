#include <stdio.h>
#include <string.h>
#include <emscripten/emscripten.h>

char *EMSCRIPTEN_KEEPALIVE myCharAt()
{
    char txt[] = "test 大家好 你好世界";
    return txt;
};

size_t EMSCRIPTEN_KEEPALIVE stringLen(const char *p)
{
    return strlen(p);
};
