GroestlCoin hash implementation in C converted with Emscripten

I was not able to find a JavaScript implementation, but could find a "C" one


---
C:\emscripten\emscripten\1.13.0\emcc.bat hash.c groestl.c -o grs.bc
C:\emscripten\emscripten\1.13.0\emcc.bat grs.bc -o grs.js -O2 -s EXPORTED_FUNCTIONS="['_GroestlCoinHash']"
