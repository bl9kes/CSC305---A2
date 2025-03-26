// CSC 305 - Assignment 2
// Blake Stewart - v00966622

var canvas;
var gl;

var program;

var near = 1;
var far = 100;

var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;

var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0);
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0);

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0;
var prevTime = 0.0;
var resetTimerFlag = true;

// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time.
var currentRotation = [0, 0, 0];

var useTextures = 1;

//making a texture image procedurally
//Let's start with a 1-D array
var texSize = 12;
var imageCheckerBoardData = new Array();

//My Code (Start)
var bodyRotation = [0, 0, 0];
var torsoAngle = 0; // Slightly turn towards the camera
var waveAngle = 0; // For the waving arm
var headAngle = 0; // For the head nod// Used for left and right arms
var armRotation = Math.sin(TIME * 0.75) * 12;

var applyOutline = 0; // 0 = Normal, 1 = Outline Mode

// Stars array
var stars = [];
for (var i = 0; i < 10; i++) {
  stars.push([Math.random() * 12 - 6, Math.random() * 12 - 6, -5]);
}

// My Code (End)

// Now for each entry of the array make another array
// 2D array now!
for (var i = 0; i < texSize; i++) imageCheckerBoardData[i] = new Array();

// Now for each entry in the 2D array make a 4 element array (RGBA! for colour)
for (var i = 0; i < texSize; i++)
  for (var j = 0; j < texSize; j++)
    imageCheckerBoardData[i][j] = new Float32Array(4);

// Now for each entry in the 2D array let's set the colour.
// We could have just as easily done this in the previous loop actually
for (var i = 0; i < texSize; i++)
  for (var j = 0; j < texSize; j++) {
    var c = (i + j) % 2;

    if (c == 0) imageCheckerBoardData[i][j] = [0, 1, 0, 1];
    else imageCheckerBoardData[i][j] = [0, 0.5, 0, 1];
  }

//Convert the image to uint8 rather than float.
var imageCheckerboard = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++)
  for (var j = 0; j < texSize; j++)
    for (var k = 0; k < 4; k++)
      imageCheckerboard[4 * texSize * i + 4 * j + k] =
        255 * imageCheckerBoardData[i][j][k];

// For this example we are going to store a few different textures here
var textureArray = [];

// Setting the colour which is needed during illumination of a surface
function setColor(c) {
  ambientProduct = mult(lightAmbient, c);
  diffuseProduct = mult(lightDiffuse, c);
  specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition2)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
}

// We are going to asynchronously load actual image files this will check if that call if an async call is complete
// You can use this for debugging
function isLoaded(im) {
  if (im.complete) {
    console.log("loaded");
    return true;
  } else {
    console.log("still not loaded!!!!");
    return false;
  }
}

// Helper function to load an actual file as a texture
// NOTE: The image is going to be loaded asyncronously (lazy) which could be
// after the program continues to the next functions. OUCH!
function loadFileTexture(tex, filename) {
  //create and initalize a webgl texture object.
  tex.textureWebGL = gl.createTexture();
  tex.image = new Image();
  tex.image.src = filename;
  tex.isTextureReady = false;
  tex.image.onload = function () {
    handleTextureLoaded(tex);
  };
}

// Once the above image file loaded with loadFileTexture is actually loaded,
// this funcion is the onload handler and will be called.
function handleTextureLoaded(textureObj) {
  //Binds a texture to a target. Target is then used in future calls.
  //Targets:
  // TEXTURE_2D           - A two-dimensional texture.
  // TEXTURE_CUBE_MAP     - A cube-mapped texture.
  // TEXTURE_3D           - A three-dimensional texture.
  // TEXTURE_2D_ARRAY     - A two-dimensional array texture.
  gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down

  //texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
  //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
  //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
  //Border: Width of image border. Adds padding.
  //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
  //Type: Data type of the texel data
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    textureObj.image
  );

  //Set texture parameters.
  //texParameteri(GLenum target, GLenum pname, GLint param);
  //pname: Texture parameter to set.
  // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
  // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
  //param: What to set it to.
  //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
  //For the Min Filter:
  //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
  //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_NEAREST
  );

  //Generates a set of mipmaps for the texture object.
  /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
  gl.bindTexture(gl.TEXTURE_2D, null);
  console.log(textureObj.image.src);

  textureObj.isTextureReady = true;
}

// Takes an array of textures and calls render if the textures are created/loaded
// This is useful if you have a bunch of textures, to ensure that those files are
// actually loaded from disk you can wait and delay the render function call
// Notice how we call this at the end of init instead of just calling requestAnimFrame like before
function waitForTextures(texs) {
  setTimeout(function () {
    var n = 0;
    for (var i = 0; i < texs.length; i++) {
      console.log(texs[i].image.src);
      n = n + texs[i].isTextureReady;
    }
    wtime = new Date().getTime();
    if (n != texs.length) {
      console.log(wtime + " not ready yet");
      waitForTextures(texs);
    } else {
      console.log("ready to render");
      render(0);
    }
  }, 5);
}

// This will use an array of existing image data to load and set parameters for a texture
// We'll use this function for procedural textures, since there is no async loading to deal with
function loadImageTexture(tex, image) {
  //create and initalize a webgl texture object.
  tex.textureWebGL = gl.createTexture();
  tex.image = new Image();

  //Binds a texture to a target. Target is then used in future calls.
  //Targets:
  // TEXTURE_2D           - A two-dimensional texture.
  // TEXTURE_CUBE_MAP     - A cube-mapped texture.
  // TEXTURE_3D           - A three-dimensional texture.
  // TEXTURE_2D_ARRAY     - A two-dimensional array texture.
  gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);

  //texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
  //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
  //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
  //Border: Width of image border. Adds padding.
  //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
  //Type: Data type of the texel data
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    texSize,
    texSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  //Generates a set of mipmaps for the texture object.
  /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
  gl.generateMipmap(gl.TEXTURE_2D);

  //Set texture parameters.
  //texParameteri(GLenum target, GLenum pname, GLint param);
  //pname: Texture parameter to set.
  // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
  // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
  //param: What to set it to.
  //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
  //For the Min Filter:
  //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
  //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
  gl.bindTexture(gl.TEXTURE_2D, null);

  tex.isTextureReady = true;
}

// This just calls the appropriate texture loads for this example adn puts the textures in an array
function initTexturesForExample() {
  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "Stontex_norm.png"); // Updated to remove box.png

  textureArray.push({});
  loadImageTexture(textureArray[textureArray.length - 1], imageCheckerboard);

  // My Code (Start)

  // New Texture 1
  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "Stontex.png"); // Added Stone texture

  // New Texture 2
  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "redplanet.png"); // Added Planet texture

  // New Texture 3
  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "male_face.png"); // Added Male Face texture

  // New Texture 4
  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "moon.png"); // Added Moon texture

  // My Code (End)
}

// Changes which texture is active in the array of texture examples (see initTexturesForExample)
function toggleTextures() {
  useTextures = (useTextures + 1) % 3; // Updated to cycle 3 textures
  gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.1, 0.3, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  setColor(materialDiffuse);

  // Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
  // Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
  Cube.init(program);
  Cylinder.init(20, program);
  Cone.init(20, program);
  Sphere.init(36, program);

  // Matrix uniforms
  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  // Lighting Uniforms
  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  document.getElementById("textureToggleButton").onclick = function () {
    toggleTextures();
    window.requestAnimFrame(render);

  };
  // New toggle added for my new effect
  document.getElementById("outlineToggle").onclick = function () {
    applyOutline = 1 - applyOutline; // Toggle between 0 (off) and 1 (on)
    window.requestAnimFrame(render);
};

  // Helper function just for this example to load the set of textures
  initTexturesForExample();

  waitForTextures(textureArray);
};

// Sets the modelview and normal matrix in the shaders
function setMV() {
  modelViewMatrix = mult(viewMatrix, modelMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  normalMatrix = inverseTranspose(modelViewMatrix);
  gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
  setMV();
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
  setMV();
  Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
  setMV();
  Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
  setMV();
  Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
  setMV();
  Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x, y, z) {
  modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta, x, y, z) {
  modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx, sy, sz) {
  modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
  modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
  MS.push(modelMatrix);
}

// My code (Start)

// Function added to draw stars for the backgroud
function drawStars() {
  gPush();

  // Disable camera transformations by resetting the model matrix
  modelMatrix = mat4();

  for (var i = 0; i < stars.length; i++) {
      gPush();

      // Randomly position stars in all three axis, ensuring they remain in the background when the camera moves
      let starX = (Math.random() - 0.5) * 10; 
      let starY = (Math.random() - 0.5) * 10; 
      let starZ = (Math.random() - 0.5) * 10; 

      gTranslate(starX, starY, starZ);
      gScale(0.05, 0.05, 0.05); // Keep stars small
      setColor(vec4(1, 1, 1, 1));
      drawSphere();

      gPop();
  }

  gPop();
}

// My Code (End)


function render(timestamp) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // 360-Degree Camera Fly-Around for (2.)
  let radius = 15.0; // Distance from center
  let cameraSpeed = 0.001; // Adjust speed of orbit
  let theta = timestamp * cameraSpeed; // Ran in real-time for (3.)


  let eyeX = radius * Math.cos(theta);
  let eyeZ = radius * Math.sin(theta);
  let eyeY = 5.0; // Keep camera slightly elevated

  eye = vec3(eyeX, eyeY, eyeZ); // Update camera position
  MS = []; // Initialize modeling matrix stack

  // initialize the modeling matrix to identity
  modelMatrix = mat4();

  // set the camera matrix
  viewMatrix = lookAt(eye, at, up);

  // SetMV() for (2.)
  if (viewMatrix) {
    setMV(viewMatrix);
  } else {
    console.error("Error! viewMatrix is undefined");
  } 

  // set the projection matrix
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  // set all the matrices
  setAllMatrices();

  // dt is the change in time or delta time from the last frame to this one
  // in animation typically we have some property or degree of freedom we want to evolve over time
  // For example imagine x is the position of a thing.
  // To get the new position of a thing we do something called integration
  // the simpelst form of this looks like:
  // x_new = x + v*dt
  // That is the new position equals the current position + the rate of of change of that position (often a velocity or speed), times the change in time
  // We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!

  dt = (timestamp - prevTime) / 1000.0;  // Real-time for (3.)
  prevTime = timestamp;

  // added for the outline toggle effect (7.)
  gl.uniform1i(gl.getUniformLocation(program, "applyOutline"), applyOutline);


  // My Code - Calls to functions created in render()
  // All named pretty clearly as to what they do
  drawStars();
  drawTorso();
  drawLeftArm();
  drawRightArm();
  drawLeftLeg();
  drawRightLeg();
  drawMoon();
  drawHead();
  drawPlanet();


  // We need to bind our textures, ensure the right one is active before we draw
  //Activate a specified "texture unit".
  //Texture units are of form gl.TEXTUREi | where i is an integer.
  gl.activeTexture(gl.TEXTURE0);
  if (useTextures % 3 == 1) {
    //Binds a texture to a target. Target is then used in future calls.
    //Targets:
    // TEXTURE_2D           - A two-dimensional texture.
    // TEXTURE_CUBE_MAP     - A cube-mapped texture.
    // TEXTURE_3D           - A three-dimensional texture.
    // TEXTURE_2D_ARRAY     - A two-dimensional array texture.

    // Updated to toggle through 3 textures for the creature body textures

    gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
  } else if (useTextures % 3 == 2) {
    gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture2"), 0);
  } else {
    gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture3"), 0);
  }

  // Now let's draw a shape animated!
  // You may be wondering where the texture coordinates are!
  // We've modified the object.js to add in support for this attribute array!


  // My code (Start)

  // Function to draw the torso of the space creature.
  function drawTorso() {
    gPush();
    {
      gTranslate(0, -1, 0);
      gScale(0.6, 1, -0.4);
      drawCube();
    }
    gPop();
  }
  // Function to draw the space creatures static left arm.
  function drawLeftArm() {
    gPush();
    {
      gTranslate(-1, -1.05, 0);
      gRotate(-10, 0, 0, 1);
      gScale(0.25, 0.8, 0.25);
      drawCube();
    }
    gPop();
  }

  // Function to draw the space creatures right arm which performs a waving motion.
  function drawRightArm() {
    gPush();
    {
      gTranslate(0.85, -0.5, 0); // Move to shoulder joint position
      waveAngle = Math.sin(prevTime * 0.002) * 40;; // Creates swinging motion
      gRotate(60 + waveAngle, 0, 0, 1); // Swing motion added

      // Draw the upper arm
      gPush();
      {
        gTranslate(0, -0.3, 0); // Move arm down so it pivots from the top
        gScale(0.25, 0.5, 0.25); // Scale upper arm
        drawCube(); // Draw upper arm
      }
      gPop();

      // Attach and rotate the forearm at the elbow
      gPush();
      {
        gTranslate(0, -0.6, 0); // Move to elbow joint
        forearmAngle = Math.max(0, Math.sin(prevTime / 500) * 45 + 10);
        gRotate(forearmAngle, 0, 0, 1); // Rotate at the elbow

        gPush();
        {
          gTranslate(0, -0.55, 0); // Move forearm down from elbow
          gScale(0.25, 0.5, 0.25); // Scale forearm
          drawCube(); // Draw forearm
        }
        gPop();
        gPush(); //Hand
        {
          gTranslate(0, -1.3, 0);
          handAngle = Math.sin(prevTime / 500) * 15;
          gRotate(handAngle, 0, 0, 1);
          gScale(0.25, 0.25, 0.2);
          drawCube();
          // Attach fingers
          gPush();
          {
            gTranslate(-0.3, -1.6, 0);
            gScale(0.2, 0.5, 0.2); // Scale the finger to be thin and long
            drawCube(); // Draw finger
          }
          gPop();
          gPush();
          {
            gTranslate(0.3, -1.6, 0);
            gScale(0.2, 0.5, 0.2);
            drawCube(); // Draw finger
          }
          gPop();

          gPush();
          {
            gTranslate(0.85, -1.6, 0);
            gScale(0.2, 0.5, 0.2);
            drawCube(); // Draw finger
          }
          gPop();

          gPush();
          {
            gTranslate(-0.85, -1.6, 0);
            gScale(0.2, 0.5, 0.2);
            drawCube(); // Draw finger
          }
          gPop();

          gPush();
          {
            gTranslate(1.5, 0, 0);
            gScale(0.5, 0.2, 0.5);
            drawCube(); // Draw finger
          }
          gPop();
        }
        gPop();
      }
      gPop();
    }
    gPop();
  }
  // Function to draw left leg
  function drawLeftLeg() {
    gPush();
    {
      gTranslate(-0.425, -2.5, 0); // Move legs downward
      gScale(0.4, 0.5, 0.5);
      drawCube(); // Draw leg
    }
    gPop();
  }


  // Function to draw right leg
  function drawRightLeg() {
    gPush();
    {
      gTranslate(0.425, -2.5, 0); // Move legs downward
      gScale(0.4, 0.5, 0.5);
      drawCube(); // Draw leg
    }
    gPop();
  }

  // Function to draw head of creature.
  function drawHead() {
    gPush();
    {
      gTranslate(0, 0.65, 0);
      gScale(0.65, 0.65, 0.65);
      // Apply Face texture to all sides of the scary 4 face having creature.
      if (textureArray[4].isTextureReady) {
        gl.bindTexture(gl.TEXTURE_2D, textureArray[4].textureWebGL);
      }
      gl.uniform1i(gl.getUniformLocation(program, "face texture"), 0);
      drawCube();
    }
    gPop();
  }

  // Function to draw the planet which the creature is standing on.
  // The planet rotates counter clockwise.
  function drawPlanet() {
    gPush();
    {
      gTranslate(0,-10,0);
      gRotate(-(prevTime * 0.1), 0, 1, 0); // Use time-based rotation
      gScale(7,7,7);

      // Apply planet texture
      if (textureArray[3].isTextureReady) {
        gl.bindTexture(gl.TEXTURE_2D, textureArray[3].textureWebGL);
      }
      gl.uniform1i(gl.getUniformLocation(program, "planet texture"), 0);
      drawSphere();
    }
    gPop();
  }

  // Function to draw the moon that orbits the planet and creature.
  // The moon rotates on the X and Y axis.
  function drawMoon() {
    gPush();
    {
      gTranslate(-5,4,-5);
      gRotate(prevTime * 0.1, 1, 1, 0); // Use time-based rotation
      gScale(2,2,2);

      // Apply the moon texture
      if (textureArray[5].isTextureReady) {
        gl.bindTexture(gl.TEXTURE_2D, textureArray[5].textureWebGL);
      }
      gl.uniform1i(gl.getUniformLocation(program, "moon texture"), 0);
      drawSphere();
    }
    gPop();
  }

  // My Code (End)

  window.requestAnimFrame(render);
}
