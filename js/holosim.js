'use strict';

// HOLOSIM

/*
TODO:
-get FOV and aspect right
-UI controls
--input specific FOV
-WebVR 1.0 support (via polyfill, etc.)
-better scene for viewing
-resize handler
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
var hololensFOV = [30, 17.5]; // based off estimates

var holoFOV = hololensFOV;
var holoAspect = holoFOV[0] / holoFOV[1];

var targetFOV;
setTargetFOV(holoFOV);


init();

function init() {
  scene = new THREE.Scene();
  holoScene = new THREE.Scene();

  // vertical FOV, aspect
  camera = new THREE.PerspectiveCamera( FOV, window.innerWidth/window.innerHeight, 0.1, 1000 );
  holoCamera = new THREE.PerspectiveCamera( holoFOV[1], holoAspect, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    antialias: true
  });
  renderer.autoClear = false;

  renderWidth = window.innerWidth;
  renderHeight = window.innerHeight;

  renderer.setSize( renderWidth, renderHeight );

  addLights(scene);
  addLights(holoScene);

  setupWorld();
  setupHoloWorld();

  setupControls();

  setupUI();

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
  // floor
  var height = 2;
  var map = new THREE.TextureLoader().load('textures/hardwood2_diffuse.jpg');
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  map.repeat.set( 6, 12 );
  var geo = new THREE.PlaneGeometry(20,20, 4,4);
  geo.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

  // wall
  var wallGeo = new THREE.PlaneGeometry(20, 5);
  var wallMap = new THREE.TextureLoader().load('textures/brick_diffuse.jpg');
  var mat = new THREE.MeshLambertMaterial({ map: wallMap });
  wallMap.wrapS = THREE.RepeatWrapping;
  wallMap.wrapT = THREE.RepeatWrapping;
  wallMap.anisotropy = 4;
  wallMap.repeat.set( 3, 1 );
  var wall = new THREE.Mesh( wallGeo, mat );
  wall.position.set( 0, 0, -5 );
  scene.add( wall );

  var mat = new THREE.MeshLambertMaterial( { map: map, side: THREE.DoubleSide } );
  var object = new THREE.Mesh( geo, mat );
  object.position.set( 0, -height, 0 );
  scene.add( object );

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
  var geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
  var material = new THREE.MeshLambertMaterial( { color: 0xff3399 } );

  var r = 2;
  for (var i = 0; i < 200; i++) {
    var cube = new THREE.Mesh( geometry, material );

    cube.position.set( randRange(-r, r), randRange(-r, r), randRange(-r, r) );

    holoScene.add( cube );
  }

  // skeleton model
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setBaseUrl( 'models/' );
  mtlLoader.setPath( 'models/' );
  mtlLoader.load( 'skeleton.mtl', function( materials ) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials( materials );
    objLoader.setPath( 'models/' );
    objLoader.load( 'skeleton.obj', function ( object ) {
      var s = 0.012;
      object.scale.set( s,s,s );
      object.position.y = -1.845;
      object.position.z = -1;
      holoScene.add( object );
    }, function(){ }, function(err){ console.log(err); } );
  });

}

function setupControls() {
  mouseControls = new THREE.MouseControls(camera);

  window.addEventListener('keydown', function(ev){
    var X = 1.1;
    console.log('keydown', event.keyCode);
    switch ( event.keyCode ) {
      case 74: /*J*/
        setTargetFOV(scaleFOV(targetFOV, -1));
        break;
      case 75: /*K*/
        setTargetFOV(scaleFOV(targetFOV, 1));
        break;
      case 70: /*F*/
        break;
      case 71: /*G*/
        var hFOV = FOV * renderWidth/renderHeight;
        setTargetFOV([hFOV, FOV]);
        break;
      case 72: /*H*/
        setTargetFOV(hololensFOV);
        break;
      case 82: /*R*/

        break;
    }
  }, false);
}

function setupUI() {
  var holoBtn = document.getElementById('holo-btn');
  var fullBtn = document.getElementById('full-btn');
  var incBtn = document.getElementById('inc-btn');
  var decBtn = document.getElementById('dec-btn');

  holoBtn.addEventListener('click', function(){
    setTargetFOV(hololensFOV);
  }, false);
  fullBtn.addEventListener('click', function(){
    var hFOV = FOV * renderWidth/renderHeight;
    setTargetFOV([hFOV, FOV]);
  }, false);
  incBtn.addEventListener('click', function(){
    setTargetFOV(scaleFOV(targetFOV, 1));
  }, false);
  decBtn.addEventListener('click', function(){
    setTargetFOV(scaleFOV(targetFOV, -1));
  }, false);

}

function setTargetFOV(tFOV) {
  if (tFOV[1] > FOV) {
    tFOV = [FOV * renderWidth/renderHeight, FOV];
  }

  targetFOV = tFOV;
  var fovStr = targetFOV[0].toFixed(1) + '° × ' + targetFOV[1].toFixed(1) + '°';
  document.getElementById('current-fov').innerHTML = fovStr;
}

function scaleFOV(fov, direction, percentage) {
  var _FOV = [];
  var factor = (percentage !== undefined) ? 1+(percentage/100) : 1+0.1;
  factor = (direction == 1) ? factor : 1/factor;
  _FOV = [ fov[0]*factor, fov[1]*factor ];
  console.log('scaleFOV: ' + _FOV);
  return _FOV;
}

function animate(t) {
  requestAnimationFrame(animate);

  var dt = clock.getDelta();

  update(dt);
  render(dt);
}

function update(dt) {
  mouseControls.update(dt);

  updateFOV(dt);
}

function updateFOV(dt) {
  var dH = targetFOV[0] - holoFOV[0];
  var dV = targetFOV[1] - holoFOV[1];

  var rate = 5;
  var hFOV = holoFOV[0] + dH*rate*dt;
  var vFOV = holoFOV[1] + dV*rate*dt;

  holoFOV = [hFOV, vFOV];
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
