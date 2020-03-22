#include <math.h>
typedef unsigned char uc8;
int js_log(long i);
int getIndex(int x, int y, int width, int height);
int getGray(int i);
void sobel(int *p, int width, int height)
{
    // 目标指针
    int *t;

    // 来源指针
    int *s;
    int around[16] = {
        -1, -1,
        0, -1,
        1, -1,
        1, 0,
        1, 1,
        0, 1,
        -1, 1,
        -1, 0};
    int _p = p;
    for (int y = 0; y < height; y++)
    {
        for (int x = 0; x < width; x++)
        {
            long a[8];
            for (int j = 0, i = 0; j < 16; j += 2, i++)
            {
                s= _p + getIndex(
                    x + around[j],
                    y + around[j + 1],
                    width,
                    height);
                // *s : 0xrrggbbaa
                a[i] = (*s)*-1;
                
            }
            
            /**
             * 0 1 2
             * 7   3
             * 6 5 4
             */
            long gx = -a[0] - 2 * a[1] - a[3] + a[6] + 2 * a[5] + a[4];
            long gy = -a[0] - 2 * a[7] - a[6] + a[2] + 2 * a[3] + a[4];
            long g = (long)sqrt((double)(gx * gx + gy * gy));
            int _t;
            if(x==3238&&y==1624){
                js_log(gx);
                js_log(gy);
            }
            

            g =0xffffffff-g;
            
            if(g<0xffffffff){
                g=0;
            }
            _t = g;
            _t = _t | (g<<8);
            _t = _t | (g<<16);
            _t = _t | (0xff<<24);

            t = _p + getIndex(x, y, width, height)+width*height*4;
            *t = _t;
            
        }
    }
}

int getIndex(int x, int y, int width, int height)
{
    if (x < 0)
        x = 0;
    if (x > width)
        x = width - 1;
    if (y < 0)
        y = 0;
    if (y > height)
        y = height - 1;
    return (y * width + x) * 4;
}

int getGray(int i)
{
    int res;
    int *p;
    p = i;
    int b = (0x0000ff00 & *p)>>8;
    int g = (0x00ff0000 & *p)>>16;
    int r = (0xff000000 & *p)>>24;
    res = (r+g+b)*100/3;
    return res;
}
