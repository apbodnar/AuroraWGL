var gl;

function initGL(canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
  }
  if (!gl) {
    console.log("Could not initialise WebGL, sorry :-(");
  }
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
      return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
  
}

var shaderProgram;

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log("Could not initialise shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexTrans");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  
  shaderProgram.tickUniform = gl.getUniformLocation(shaderProgram, "tick");
  shaderProgram.crunchUniform = gl.getUniformLocation(shaderProgram, "crunch");
  shaderProgram.countUniform = gl.getUniformLocation(shaderProgram, "num_quads");
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.perspectiveUniform = gl.getUniformLocation(shaderProgram, "PM");
  shaderProgram.rotationUniform = gl.getUniformLocation(shaderProgram, "R");

}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTexture() {
  cubeTexture = gl.createTexture();
  cubeImage = new Image();
  cubeImage.onload = function() { handleTextureLoaded(cubeImage, cubeTexture); }
  cubeImage.src = "flower.png";
}

var squareVertexPositionBuffer;
var squareVertexTransBuffer;
var num_quads = 600;
var crunch = 0.005;
var persp = mat4.create();
mat4.perspective(persp,45.0, 1.0, 1.0, 100.0);
var rotation = mat4.create();
mat4.rotateX(rotation, rotation, 1.0 );
mat4.translate(rotation, rotation, [0,0,0]);
console.log(rotation);


function generateStrip(num_quads, crunch) {
  vertices = [];
  for(var i=0; i< 2*num_quads+1; i+=2){
    vert1 = [i*crunch, (i+1)%2, -2];
    vert2 = [i*crunch, i%2    , -2];
    vertices = vertices.concat(vert1);
    vertices = vertices.concat(vert2);
  }
  return vertices;
}

function initBuffers() {
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);

  vertices = generateStrip(num_quads, crunch);
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 2*num_quads+2;
}

var lastTime = 0;
var elapsed = 0.0;

function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
      elapsed += timeNow - lastTime;
  }
  lastTime = timeNow;
}

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.uniform1f(shaderProgram.tickUniform, elapsed);
  gl.uniform1f(shaderProgram.crunchUniform, crunch);
  gl.uniform1f(shaderProgram.countUniform, num_quads);
  gl.uniformMatrix4fv(shaderProgram.perspectiveUniform, false, persp);
  gl.uniformMatrix4fv(shaderProgram.rotationUniform, false, rotation);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

function tick() {
  requestAnimFrame(tick);
  drawScene();
  animate();
}

function webGLStart() {
  
  var canvas = document.getElementById("aurora_canvas");
  initGL(canvas);
  initShaders();
  initBuffers();
  //initTexture();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_COLOR, gl.ONE);
  tick();
  //drawScene();
}