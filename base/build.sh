rm -r  *.wasm
emcc index.c \
    -o add.wasm \
    -Os \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s SIDE_MODULE=1 \
    -s EXPORT_NAME=add \
    -s EXPORTED_FUNCTIONS="['add','log','test']" \
    -s EXTRA_EXPORTED_RUNTIME_METHODS="[
        'ccall' \
    ]" \
    -v