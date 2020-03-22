rm -r *.js *.wasm
export EXPORTED_FUNCTIONS="[ \
    _myCharAt, \
    _stringLen, \
    _readutf8
]"
emcc index.c \
    -o useString.js \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=useString \
    -s EXPORTED_FUNCTIONS="${EXPORTED_FUNCTIONS}" \
    -s EXTRA_EXPORTED_RUNTIME_METHODS="[
        'ccall', \
        'stringToUTF16' \
    ]"