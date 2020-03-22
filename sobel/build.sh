rm -r  *.wasm
emcc index.c \
    -o sobel.wasm \
    -O3 \
    -s WASM=1 \
    -s SIDE_MODULE=1 \
    -s INCOMING_MODULE_JS_API=[""] \
    -s EXPORTED_FUNCTIONS=["sobel"] \
    -v