void log(int a);
int add(int a,int b){
    return a+b;
};

int test(int *p,int len){
    int r = 0;
    for(int i =0 ;i<len;i++){
        r+=*p;
        p++;
    };
    log(r);
    return r;
};