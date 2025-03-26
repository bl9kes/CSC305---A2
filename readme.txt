CSC 305 - Assignment 2


Author: Blake Stewart - v00966622
Submission Date: March 17th, 2025


Overview
This project implements a WebGL scene featuring a colour-changing space creature standing on a rotating red planet. The creature is using his right arm to wave as he stands still. In the scene, there exists an orbiting moon and a background of stars. 


The project meets all the assignment criteria, including;
1. At least one hierarchical object of at least three levels in the hierarchy,
2. A 360-degree camera fly-around using lookAt() and setMV(), 
3. Connection to real-time,
4. Use of at least two textures either procedural or mapped to objects in a meaningful way,
5. Converting the ADS shader in the assignment base code from a vertex shader to a fragment shader, 
6. Converting to Blinn-Phong shading, 
7. One shader effect was designed from scratch to perform a visible novel effect.


Disclaimer and Credits:
This assignment was started using the base code from Lab 5
* If you use existing code (e.g. A1, Lab5, Lab 7) then you must state that clearly in your readme.txt file.


Implemented Features


1. Hierarchical Object with 3+ Levels (4 Marks)
The right arm of the space creature has three levels of hierarchy:
* The shoulder joint, elbow joint, and hand with fingers.
The arm waves dynamically and smoothly while the limbs remain attached to the torso


2. 360-degree Camera Fly-Around (4 Marks)
Implemented using lookAt() and setMV() to orbit around the scene.
The camera moves in a circular path, always looking at the center.


3. Real-Time Execution (4 Marks)
Frame updates based on delta time (dt) to maintain real-time animation.
Animations run at the correct speed regardless of frame rate because we used real-time for calculations.


dt = (timestamp - prevTime) / 1000.0;  // Real-time for (3.)
let theta = timestamp * cameraSpeed; // Ran in real-time for (3.)




4. Two Non-Trivial Textures (6 Marks)


Modified the procedural checkerboard texture from the lab that is dynamically generated in main.js.
* Updated the colours and used as one of textures to toggle between for the skin changing of the space creature
Mapped textures include:
* Face texture on the creature. 
   * Male_face.png acquired from https://opengameart.org/content/male-face free to use
* Planet texture mapped to the sphere.
   * Red planet acquired from https://opengameart.org/content/red-lava-planet-textures free to use
* Moon texture on the orbiting moon.
   * Moon texture acquired from https://opengameart.org/content/moon-surface-2d free to use


Textures change dynamically using the toggleTextures() function.
* Used Stone textures from  https://opengameart.org/content/stone-texture-1 to add to the toggle skin options


All textures were used in a meaningful way and not simply applied to default objects. 

The code for the checkerboard pattern was taken from the lab5 base code but not used for marks simply for an additional feature.


5. Vertex to Fragment Shader Conversion (5 Marks)
Moved ADS lighting calculations from the vertex shader to the fragment shader in the main.html.
This enables per-fragment lighting, making the shading smoother and more realistic.
Computed the lighting equation per fragment.


6. Converted Phong to Blinn-Phong (2 Marks)
In the newly converted fragment shader, converted the Phong to Blinn-Phong.


7. Novel Shader Effect (5 Marks)
Implemented a real-time edge-highlighting effect that dynamically detects and brightens object edges. The effect is based on the angle between the normal vector (N) and the view direction (V) and is toggleable by a button. The effect detects edges by calculating how much the normal (N) aligns with the view direction (V). If a surface faces the camera directly, it receives no effect.
If a surface is nearly perpendicular to the camera, it brightens up, highlighting object contours.





dot(N, V): Computes how much the normal aligns with the view direction.

1.0 - abs(dot(N, V)): Inverts the effect so that edges are highlighted instead of flat surfaces.

fragColor.rgb += edgeFactor * 0.5; This increases brightness only at edges, making them stand out.


I added a toggle button in main.html, this works similarly to the texture toggle system in Lab 5.


11. Programming Style (2 Marks) 
Well-commented, modular code, well-structured with helper functions. Simple and clear.


12. Video Recording & Cover Image (-2 Marks if Missing)


A 512x512 mp4 video demonstrating the full scene is included, and named appropriately.
* blake_stewart_movie.mp4
A screenshot (.jpg) from the video is also attached, and named appropriately.
* Blake_stewart_image.jpg


13. Readme.txt provided (-4 Marks if Missing)
Provided a readme.txt that describes what was completed and omitted, sources used, what is required to run the scene on the grader’s device, and any additional information.




Additional Information
Omissions:
No omissions: I believe all requirements have been met.


Notes for the Grader


Toggle Features:
Texture toggle button: Allows switching between textures.
* Used the toggle feature provided in the lab 5 base code to switch between the available skins of the space creature in the scene.


Edge highlight toggle button: Enables/disables the outline effect.
* Use a toggle to apply the edge highlight novel effect
* Used a toggle to make the effect clear


________________


WebGL Setup
Please set it up like in lab 5 with a Python HTTP sever.
This is necessary for the textures in my assignment two submission.

Instructions below:


The easiest way to handle this is with the python HTTP server approach we discussed in Lab. This is how we will mark your assignment.
1. Open explorer/file manager and navigate to the code folder.
2. Now shift-click in the file list and open a command prompt or powershell here
   1. Alternatively, you can open a command prompt or power shell from the windows menus and then use cd [folder] to navigate to the correct folder.
3. Now run the following:
python -m http.server 8080
4. Now you should be able to open a browser and type
localhost:8080
In the URL bar
5. You’ll see your files being hosted on a simple local server, you can now click your html file.


Additional files
   * Male_face.png
   * Redplanet.png
   * Stontex_norm.png
   * Stontex.png


Collaboration
None. 


Original Work
The assignment must be done from scratch. Apart from the template provided and labs, you should not use code from any other source, including the previous offering of the class. 


Zero Mark
If the code does not run, no objects appear in the window, or only the template code is running properly, no partial marks will be given.


Final Remarks
This WebGL project demonstrates hierarchical modelling, animation, lighting, texturing, and shader programming. All features have been implemented correctly and clearly documented in both the code and this README.