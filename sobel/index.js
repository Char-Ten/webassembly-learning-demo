/**@type {HTMLCanvasElement} */
const cvs = document.getElementById("cvs");
const ctx = cvs.getContext("2d");
const btns = document.getElementById("btns");
const logPre = document.getElementById("log");
const fileInp = document.getElementById("file");
const data = {
	/**@type {ImageData} */
	sourceImageData: null,

	wasmModule: null,

	/**@type {HTMLCanvasElement} */
	ofscvs: null,
	/**@type {WebGLRenderingContext} */
	ofsgl: null,
	/**@type {WebGLBuffer} */
	ofsbuffer: null,
	/**@type {WebGLTexture} */
	ofstex: null,
	/**@type {WebGLProgram} */
	ofsprogram: null,
	ofsuniforms: {}
};

loadglsl().then(initGL);
loadwasm().then(complit);

cvs.addEventListener("click", e => {
	if (!data.sourceImageData) return;
	let w = cvs.offsetWidth;
	let h = cvs.offsetHeight;
	let x = Math.floor((e.offsetX * cvs.width) / w);
	let y = Math.floor((e.offsetY * cvs.height) / h);
	let d = ctx.getImageData(x, y, 1, 1).data;
	clearLog();
	log(
		`[cvs]位置xy:(${[x, y].join(",")});rgba(${d.join(",")});gray(${(
			(d[0] + d[1] + d[2]) /
			3
		).toFixed(2)})`
	);
});
fileInp.addEventListener("change",e=>{
    clearLog();
    let file = e.target.files[0];
    if(!file){
        log(`[input file]请重新选择文件`)
        return
    }
    log(`[input file]开始读取文件`);
    let fr = new FileReader();
    let img = new Image();
    fr.onprogress=e=>{
        log(`[input file]文件读取中${(e.loaded*100/e.total).toFixed(2)}%，已加载${e.loaded}字节，总共${e.total}字节`);
    }
    fr.onload=()=>{
        img.src=fr.result;
    }
    img.onload=()=>{
        clearLog();
        log(`[input file]文件读取完毕`);
        fileInp.value="";
        cvs.width = img.width;
        cvs.height = img.height;
        cvs.style.width = window.innerWidth+'px';
        cvs.style.height = (img.height * window.innerWidth) / img.width + "px";
        ctx.drawImage(img,0,0);
        data.sourceImageData=ctx.getImageData(0,0,cvs.width,cvs.height);
    }
    fr.readAsDataURL(file);
})

function ajaxGet(url, { type }) {
	return new Promise(res => {
		var xhr = new XMLHttpRequest();
		xhr.open("get", url);
		xhr.responseType = type;
		xhr.onprogress = e => {
			log(
				`[${url}]正在加载：${((e.loaded * 100) / e.total).toFixed(
					2
				)}%，已加载${e.loaded}字节，总共${e.total}字节`
			);
		};
		xhr.onload = () => {
			res(xhr.response);
		};
		xhr.send();
	});
}

function ajaxGetArrayBuffer(url) {
	return ajaxGet(url, {
		type: "arraybuffer"
	});
}

function ajaxGetString(url) {
	return ajaxGet(url, {
		type: "text"
	});
}

/**@todo 加载bmp */
function loadbmp() {
	return ajaxGetArrayBuffer("./provinces.bmp");
}

/**@todo 加载wasm */
function loadwasm() {
	return ajaxGetArrayBuffer("./sobel.wasm");
}

/**@todo 加载glsl */
function loadglsl() {
	return Promise.all([ajaxGetString("./v.glsl"), ajaxGetString("./f.glsl")]);
}

/**
 * @todo 解析bmp文件
 * @param {ArrayBuffer} res
 * */
function parsebmp(res) {
	var dataview = new DataView(res);
	let width = dataview.getUint32(0x12, true);
	let height = dataview.getInt32(0x16, true);
	let start = dataview.getUint32(10, true);
	let imgdata = new ImageData(width, height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			// source index
			let si = start + (y * width + x) * 3;
			// target index
			let ti = ((height - y) * width + x) * 4;

			//bmp的像素排练是 bgr
			imgdata.data[ti] = dataview.getUint8(si + 2);
			imgdata.data[ti + 1] = dataview.getUint8(si + 1);
			imgdata.data[ti + 2] = dataview.getUint8(si);
			imgdata.data[ti + 3] = 0xff;
		}
	}
	data.sourceImageData = imgdata;
}

/**
 * @todo 绘制imageData
 * @param {ImageData} imgdata
 * */
function drawImageData(imgdata) {
	if (!imgdata) return;
	cvs.width = imgdata.width;
	cvs.height = imgdata.height;
	cvs.style.width = window.innerWidth + "px";
	cvs.style.height =
		(imgdata.height * window.innerWidth) / imgdata.width + "px";
	ctx.putImageData(imgdata, 0, 0);
}

/**
 * @todo 复制一个imageData
 * @param {ImageData} imgdata
 * @returns {ImageData}
 */
function newImageData(imgdata) {
	if (!imgdata) return;
	let newone = new ImageData(imgdata.width, imgdata.height);
	for (let i = 0; i < imgdata.data.length; i += 4) {
		newone.data[i] = imgdata.data[i];
		newone.data[i + 1] = imgdata.data[i + 1];
		newone.data[i + 2] = imgdata.data[i + 2];
		newone.data[i + 3] = imgdata.data[i + 3];
	}
	return newone;
}

function getEU4Map() {
	loadbmp()
		.then(parsebmp)
		.then(drawSourceImage);
}

/**
 * @todo 绘制原图
 */
function drawSourceImage() {
	if (!data.sourceImageData) return;
	clearLog();
	drawImageData(data.sourceImageData);
}

/**
 * @todo js绘制sobel
 */
function drawBorderWithJS() {
	if (!data.sourceImageData) return;
	let bt = Date.now();
	let imgdata = newImageData(data.sourceImageData);
	let nt = Date.now();
	let around = [-1, -1, 0, -1, 1, -1, 1, 0, 1, 1, 0, 1, -1, 1, -1, 0];
	let a = [];
	let getIndex = (x, y) => {
		if (x < 0) x = 0;
		if (x > imgdata.width) x = imgdata.width - 1;
		if (y < 0) y = 0;
		if (y > imgdata.height) y = imgdata.height - 1;
		return (y * imgdata.width + x) * 4;
	};
	let getGray = i => {
		let r = data.sourceImageData.data[i];
		let g = data.sourceImageData.data[i + 1];
		let b = data.sourceImageData.data[i + 2];
		return (r + g + b) / 3;
	};

	let loop = (x, y, a, imgdata) => {
		for (let j = 0; j < 8; j++) {
			a[j] = getGray(getIndex(x + around[2 * j], y + around[2 * j + 1]));
		}
		/**
		 * 0 1 2
		 * 7   3
		 * 6 5 4
		 */
		let gx = -a[0] - 2 * a[1] - a[3] + a[6] + 2 * a[5] + a[4];
		let gy = -a[0] - 2 * a[7] - a[6] + a[2] + 2 * a[3] + a[4];
		let g = 0xff - Math.sqrt(gx * gx + gy * gy);
		let i = getIndex(x, y);
		if (g < 0xfe) {
			g = 0;
		}
		imgdata.data[i] = g;
		imgdata.data[i + 1] = g;
		imgdata.data[i + 2] = g;
	};

	//js sobel
	for (let y = 0; y < imgdata.height; y++) {
		for (let x = 0; x < imgdata.width; x++) {
			loop(x, y, a, imgdata);
		}
	}
	let et = Date.now();
	log(`[js]新建imageData用时:${nt - bt}ms`);
	log(`[js]绘制sobel计算用时:${et - nt}ms`);
	log(`[js]总用时:${et - bt}ms`);
	log(`[js]迭代次数:${imgdata.width * imgdata.height * 8}`);
	drawImageData(imgdata);
}

/**
 * @todo wasm绘制sobel
 */
function drawBorderWithWasm() {
	if (!data.sourceImageData) return;
	let bt = Date.now();
	let imgdata = newImageData(data.sourceImageData);
	let env = {
		memoryBase: 0,
		tableBase: 0,
		memory: new WebAssembly.Memory({
			initial:
				(imgdata.data.length * imgdata.data.BYTES_PER_ELEMENT * 2) /
					64 /
					1024 +
				100 //64*1024
		}),
		table: new WebAssembly.Table({
			initial: 2,
			element: "anyfunc"
		}),
		abort: () => {
			throw "abort";
		},
		getGray: i => {
			if (!data.sourceImageData) return 0;
			let r = data.sourceImageData.data[i];
			let g = data.sourceImageData.data[i + 1];
			let b = data.sourceImageData.data[i + 2];
			return (r + g + b) / 3;
		},
		stackSave: (...r) => {
			console.log(...r);
		},
		js_log: i => {
			console.log(i, i.toString(16), i.toString(2));
		}
	};

	WebAssembly.instantiate(data.wasmModule, {
		env
	}).then(inst => {
		let nt = Date.now();
		let { width, height } = imgdata;
		let u8a = new Uint8ClampedArray(env.memory.buffer);
		let len = width * height * 4 * u8a.BYTES_PER_ELEMENT;
		u8a.set(data.sourceImageData.data, 0);

		inst.exports.sobel(0, width, height);

		imgdata.data.set(u8a.slice(len, 2 * len));

		let et = Date.now();
		log(`[wasm]新建imageData用时:${nt - bt}ms`);
		log(`[wasm]绘制sobel计算用时:${et - nt}ms`);
		log(`[wasm]总用时:${et - bt}ms`);
		drawImageData(imgdata);
		console.log(imgdata.data);
	});
}

/**
 * @todo webgl绘制sobel
 */
function drawBorderWithWebGL() {
	if (!data.sourceImageData) return;
	let gl = data.ofsgl;
	let cvs = data.ofscvs;
	let tex = data.ofstex;
	let bt = Date.now();
	cvs.width = data.sourceImageData.width;
	cvs.height = data.sourceImageData.height;

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.RGBA,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		data.sourceImageData
	);
	checkTexture(gl, tex, cvs.width, cvs.height);

	gl.uniform1i(data.ofsuniforms.u_tex0, 0);
	gl.uniform2f(data.ofsuniforms.u_resolution, cvs.width, cvs.height);

	gl.viewport(0, 0, cvs.width, cvs.height);
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	ctx.clearRect(0, 0, cvs.width, cvs.height);
	ctx.drawImage(cvs, 0, 0);
	let et = Date.now();
	log(`[webgl]总用时:${et - bt}ms`);
}

/**
 * @todo 初始化webgl
 * @param {string[]} param0
 */
function initGL([vss, fss]) {
	destoryGL();
	data.ofscvs = document.createElement("canvas");
	let gl = (data.ofsgl = data.ofscvs.getContext("webgl"));
	let program = (data.ofsprogram = gl.createProgram());
	let buffer = (data.ofsbuffer = gl.createBuffer());
	data.ofstex = gl.createTexture();

	let vshader = gl.createShader(gl.VERTEX_SHADER);
	let fshader = gl.createShader(gl.FRAGMENT_SHADER);
	for (let i = 0; i < 2; i++) {
		/**@type {WebGLShader} */
		let shader = [vshader, fshader][i];
		let source = [vss, fss][i];
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		gl.attachShader(program, shader);
	}
	gl.linkProgram(program);

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]),
		gl.STATIC_DRAW
	);

	gl.useProgram(program);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, "a_position"));
	gl.vertexAttribPointer(
		gl.getAttribLocation(program, "a_position"),
		2,
		gl.FLOAT,
		false,
		0,
		0
	);

	data.ofsuniforms.u_resolution = gl.getUniformLocation(
		program,
		"u_resolution"
	);
	data.ofsuniforms.u_tex0 = gl.getUniformLocation(program, "u_tex0");
}

/**@todo 销毁webgl */
function destoryGL() {
	if (!data.ofsgl) return;
	data.ofsgl.deleteBuffer(data.ofsbuffer);
	data.ofsgl.deleteTexture(data.ofstex);
	data.ofsgl.deleteProgram(data.ofsprogram);
	data.ofsgl = null;
	data.ofscvs = null;
}

/**
 * @todo 编译wasm且将其缓存起来
 * @param {ArrayBuffer} res
 */
async function complit(res) {
	const mod = await WebAssembly.compile(res);
	data.wasmModule = mod;
}

function log(message) {
	let h = Math.max(
		document.documentElement.scrollHeight,
		document.body.scrollHeight,
		window.innerHeight
	);
	logPre.innerText += message + "\r\n";
	window.scrollTo(0, h);
}

function clearLog() {
	logPre.innerText = "";
}

/**
 * @todo 检查是否为2的指数
 * @param {number} value
 */
function isPowerOf2(value) {
	return !(value & (value - 1));
}

/**
 * @todo 检查长宽设置纹理
 * @param {WebGLRenderingContext} gl
 * @param {WebGLTexture} texture
 * @param {number} width
 * @param {number} height
 */
function checkTexture(gl, texture, width, height) {
	if (isPowerOf2(width) && isPowerOf2(height)) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		return texture;
	}
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	return texture;
}
