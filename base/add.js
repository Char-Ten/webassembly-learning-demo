const env = {
    memoryBase: 0,
    tableBase: 0,
    memory: new WebAssembly.Memory({
        initial: 1 //256*64kb
    }),
    table: new WebAssembly.Table({
        initial: 2,
        element: "anyfunc"
    }),
    abort: () => {throw 'abort'},
    log:(i)=>console.log(i)
};
loadWasm("./add.wasm")
	.then(buf => WebAssembly.compile(buf))
	.then(mod => {
		
        return WebAssembly.instantiate(mod,{env})
	}).then((ins)=>{
        console.log(ins)

        //简单传值
        console.log(ins.exports.add(1,2))

        //类型数组传递 js函数调用
        let i32a = new Int32Array(env.memory.buffer);
        var r = 0;
        for(var i = 0;i<10000;i++){
            i32a[i]=Math.ceil(Math.random()*100);
            r+=i32a[i];
        }
        console.log("js计算结果：",r);
        console.log("wasm计算结果：",ins.exports.test(0,10000));




    })

/**
 * @name 获取wasm
 * @param {string} url
 * @returns {Promise<ArrayBuffer>}
 */
function loadWasm(url) {
	return new Promise((res, rej) => {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.responseType = "arraybuffer";
		xhr.onload = () => res(xhr.response);
		xhr.send();
	});
}
