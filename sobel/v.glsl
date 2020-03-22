
precision mediump float; 
attribute vec2 a_position;
varying vec2 v_position;

void main(){
    vec2 pos = (a_position+1.)/2.;
    pos.y = 1.-pos.y;
    v_position=pos;
    gl_Position=vec4(a_position,0.,1.);
}