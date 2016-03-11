'use strict';

// HOLOSIM

/*
TODO:
-get FOV and aspect right
-ui toggles for
-webvr 1.0 support (via boilerplate, etc.)
-better scene for viewing
-push out
*/

var clock = new THREE.Clock();

var renderer;
var camera, holoCamera;

var scene, holoScene;

var cube, holoCube;

var controls;
var mouseControls;

var renderWidth, renderHeight;


var renderHolograms = true;

var FOV = 70;

var holoFOV = [30, 17.5]; // based off estimates
var holoAspect = holoFOV[0] / holoFOV[1];



init();

function init() {
  scene = new THREE.Scene();
  holoScene = new THREE.Scene();

  // vertical FOV, aspect
  camera = new THREE.PerspectiveCamera( FOV, window.innerWidth/window.innerHeight, 0.1, 1000 );
  holoCamera = new THREE.PerspectiveCamera( holoFOV[1], holoAspect, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.autoClear = false;

  renderWidth = window.innerWidth;
  renderHeight = window.innerHeight;

  renderer.setSize( renderWidth, renderHeight );
  document.body.appendChild( renderer.domElement );

  addLights(scene);
  addLights(holoScene);

  setupWorld();
  setupHoloWorld();

  setupControls();

  animate();
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function addLights(scene) {
  var light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(1, 1, 1);
  scene.add(light);

  light = new THREE.DirectionalLight(0xffffff, 0.75);
  light.position.set(-1, - 0.5, - 1);
  scene.add(light);

  light = new THREE.AmbientLight(0x666666);
  scene.add(light);
}

function setupWorld() {
  var geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
  var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );

  var r = 3;

  for (var i = 0; i < 200; i++) {
    cube = new THREE.Mesh( geometry, material );

    cube.position.set( randRange(-r, r), randRange(-r, r), randRange(-r, r) );

    scene.add( cube );
  }
}

function setupHoloWorld() {
  var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  var material = new THREE.MeshLambertMaterial( { color: 0x0000ff } );

  holoCube = new THREE.Mesh( geometry, material );
  //holoScene.add( holoCube );

  holoCube.position.set(0,0,-1);

  var r = 2;
  var geo = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
  for (var i = 0; i < 200; i++) {
    var mat = new THREE.MeshLambertMaterial( { color: 0xff3399 } );
      //{ color: Math.random() * 0xffffff } );
    var cube = new THREE.Mesh( geo, mat );

    cube.position.set( randRange(-r, r), randRange(-r, r), randRange(-r, r) );

    holoScene.add( cube );
  }
}

var holoControls;
function setupControls() {
  mouseControls = new THREE.MouseControls(camera);
  holoControls = new THREE.MouseControls(holoCamera);

  window.addEventListener('keydown', function(ev){
    var X = 1.1;
    console.log('keydown', event.keyCode);
    switch ( event.keyCode ) {
      case 74: /*J*/
        holoFOV = scaleFOV(holoFOV, -1);
        break;
      case 75: /*K*/
        holoFOV = scaleFOV(holoFOV, 1);
        break;
    }
  }, false);
}

function scaleFOV(fov, direction) {
  var FOV = [];
  var factor = 1.1;
  factor = (direction == 1) ? factor : 1/factor;
  FOV = [ fov[0]*factor, fov[1]*factor ];
  console.log('scaleFOV: ' + FOV);
  return FOV;
}

function animate(t) {
  requestAnimationFrame( animate );

  var dt = clock.getDelta();

  update( dt );
  render( dt );
}

function update(dt) {
  mouseControls.update(dt);
  holoControls.update(dt);
}

function render(dt) {
  renderer.clear();

  renderer.render(scene, camera);

  if (renderHolograms) {
    renderHolo();

    // reset
    renderer.setViewport( 0, 0, renderWidth, renderHeight );
    renderer.setScissor( 0, 0, renderWidth, renderHeight );
    renderer.setScissorTest( false );
  }
}

function renderHolo() {
  var H = renderHeight;
  var W = renderWidth;

  var hFOV = FOV * renderWidth/renderHeight;

  var x,y,w,h;
  w = holoFOV[0] / hFOV;
  h = holoFOV[1] /  FOV;
  x = 0.5 - w/2;
  y = 0.5 - h/2;

  crop( W*x, H*y, W*w, H*h );

  renderer.render( holoScene, camera );
}

function crop( x, y, w, h ) {
  //renderer.setViewport( x, y, w, h );
  renderer.setScissor( x, y, w, h );
  renderer.setScissorTest( true );
}
