#include <math.h>
typedef unsigned char uc8;
int js_log(long i);
int getIndex(int x, int y, int width, int height);
void sobel(int *p, int width, int height)
{
    // 目标指针
    int *t;

    // 来源指针
    int *s;

    // 遍历步数表
    int around[16] = {
        -1, -1,
        0, -1,
        1, -1,
        1, 0,
        1, 1,
        0, 1,
        -1, 1,
        -1, 0};
    
    // 缓存初始地址
    int _p = p;

    // 目标地址，给目标指针地址赋值用
    int _t;

    // 像素四周八个灰度值
    long a[8];

    // 水平加权平均值
    long gx;

    // 垂直加权平均值
    long gy;

    // sobel计算结果
    long g;

    for (int y = 0; y < height; y++)
    {
        for (int x = 0; x < width; x++)
        {
            for (int j = 0, i = 0; j < 16; j += 2, i++)
            {
                s= _p + getIndex(
                    x + around[j],
                    y + around[j + 1],
                    width,
                    height);
                // *s : 0xrrggbbaa
                a[i] = (long)(*s*-1);
            }
            
            /**
             * 0 1 2
             * 7   3
             * 6 5 4
             */
            gx = -a[0] - 2 * a[1] - a[3] + a[6] + 2 * a[5] + a[4];
            gy = -a[0] - 2 * a[7] - a[6] + a[2] + 2 * a[3] + a[4];
            g = (long)sqrt((double)(gx * gx + gy * gy));
            
            g =0xffffffff-g;
            
            // 二值化
            if(g<0xffffffff){
                g=0;
            }

            // 小端序存储int 0xrrggbbaa -> 0xaabbggrr
            _t = g;
            _t = _t | (g<<8);
            _t = _t | (g<<16);
            _t = _t | (0xff<<24);

            // 获得地址
            t = _p + getIndex(x, y, width, height)+width*height*4;

            // 写入内存
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

