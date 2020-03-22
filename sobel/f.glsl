precision mediump float;
uniform vec2 u_resolution;
uniform sampler2D u_tex0;
varying vec2 v_position;


float get_pos_gray(vec2 pos,vec2 k){
    vec4 c = texture2D(u_tex0,v_position+pos*k);
    return (c.r+c.g+c.b)/3.;
}

void main(){
    vec2 k = 1./u_resolution;
    float a[8];
    a[0] = get_pos_gray(vec2(-1,-1),k);
    a[1] = get_pos_gray(vec2(0, -1),k);
    a[2] = get_pos_gray(vec2(1, -1),k);
    a[3] = get_pos_gray(vec2(1, 0),k);
    a[4] = get_pos_gray(vec2(1, 1),k);
    a[5] = get_pos_gray(vec2(0, 1),k);
    a[6] = get_pos_gray(vec2(-1, 1),k);
    a[7] = get_pos_gray(vec2(-1, 0),k);


    float gx=-a[0]-2.*a[1]-a[3]+a[6]+2.*a[5]+a[4];
    float gy=-a[0]-2.*a[7]-a[6]+a[2]+2.*a[3]+a[4];
    float g = 1.-sqrt(gx*gx+gy*gy);
    if(g<0.99){
        g=0.;
    }
    gl_FragColor=vec4(vec3(g),1.);
}