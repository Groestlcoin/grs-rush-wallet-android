#include <emscripten.h>
#include <stdlib.h>
#include "sph_groestl.h"

char *g_pHexedOutput = NULL;

//unhexify
unsigned char unhexify(char ch)
{
	if((ch >= '0') && (ch <= '9'))
		return ch - '0';

	if((ch >= 'a') && (ch <= 'f'))
		return ch - 'a' + 10;

	if((ch >= 'A') && (ch <= 'F'))
		return ch - 'A' + 10;

	return 0;
}

//hexify
char hexify(unsigned char ch)
{
	if(ch <= 9)
		return '0' + ch;

	return 'a' + (ch - 10);
}

char *EMSCRIPTEN_KEEPALIVE GroestlCoinHash(char *hexstring)
{
	size_t i, sl;
	unsigned char *unhexed;
	uint32_t hashA[16], hashB[16];
	sph_groestl512_context ctx_groestl[2];

	//output buffer [we're not releasing it, so it'll be a memory leak. don't care in this case]
	if(!g_pHexedOutput)
	{
		g_pHexedOutput = malloc(65);
		for(i=0; i<65; i++)
			g_pHexedOutput[i] = 0;
	}

	//input length
	sl = 0;
	while(hexstring[sl])
		sl++;

	sl /= 2;
	unhexed = malloc(sl);
	if(unhexed)
	{
		//unhex the buffer
		for(i = 0; i < sl; i++)
			unhexed[i] = unhexify(hexstring[i*2]) * 16 + unhexify(hexstring[i*2+1]);

		//grs 1 pass
		sph_groestl512_init(&ctx_groestl[0]);
		sph_groestl512(&ctx_groestl[0], unhexed, sl);
		sph_groestl512_close(&ctx_groestl[0], hashA);

		free(unhexed);

		//grs 2 pass
		sph_groestl512_init(&ctx_groestl[1]);
		sph_groestl512(&ctx_groestl[1], hashA, 64);
		sph_groestl512_close(&ctx_groestl[1], hashB);

		//copy result
		for(i = 0; i < 32; i++)
		{
			unsigned ch = ((unsigned char*)hashB)[i];
			g_pHexedOutput[i*2] = hexify(ch >> 4);
			g_pHexedOutput[i*2+1] = hexify(ch & 0x0F);
		}
	}

	return g_pHexedOutput;
}
