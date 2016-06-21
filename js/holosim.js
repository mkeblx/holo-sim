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

var renderer, effect;
var camera, holoCamera;

var scene, holoScene;

var dolly, holoDolly;

var cube, holoCube;

var controls, holoControls;
var mouseControls;

var renderWidth, renderHeight;


var renderHolograms = true;

var FOV = 70;
var hololensFOV = [30, 17.5]; // based off estimates

var holoFOV = hololensFOV;
var holoAspect = holoFOV[0] / holoFOV[1];

var targetFOV;
setTargetFOV(holoFOV);

var holoPlaneL, holoPlaneR;
var holoTextureL, holoTextureR;

var vrHMD;



_init();

function _init() {
  if (!navigator.getVRDisplays) {
    init();
    return;
  }
  navigator.getVRDisplays().then(function(displays){
    if (displays.length) {
      vrHMD = displays[0];
    }
    init();
  });
}

/*
TODO:
-set right distance
-put in player

-update correctly
---set distance
---change FOV of holoCamera
---
*/

function init() {
  scene = new THREE.Scene();
  holoScene = new THREE.Scene();

  // vertical FOV, aspect
  camera = new THREE.PerspectiveCamera( FOV, window.innerWidth/window.innerHeight, 0.1, 1000 );
  camera.layers.enable(1);

  holoCamera = new THREE.PerspectiveCamera( holoFOV[1], holoAspect, 0.1, 1000 );

  dolly = new THREE.Object3D();
  dolly.add( camera );
  scene.add( dolly );

  holoDolly = new THREE.Object3D();
  holoDolly.add( holoCamera );
  holoScene.add( holoDolly );

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.autoClear = false;

  document.body.appendChild( renderer.domElement );

  renderWidth = window.innerWidth;
  renderHeight = window.innerHeight;

  renderer.setSize( renderWidth, renderHeight );

  effect = new THREE.VREffect( renderer );

  var enterBtn = document.getElementById('enter-btn');
  enterBtn.addEventListener('click', function(ev){
    console.log(effect);
    effect.setFullScreen( true );
  }, false);


  controls = new THREE.VRControls( dolly );
  //holoControls = new THREE.VRControls( holoDolly );

  setupHoloRendering();

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

  var mat = new THREE.MeshLambertMaterial( { map: map, side: THREE.DoubleSide } );
  var object = new THREE.Mesh( geo, mat );
  object.position.set( 0, -height, 0 );
  scene.add( object );

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
  //scene.add( wall );

  // cubes
  var geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
  var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );

  var r = 3;

  for (var i = 0; i < 200; i++) {
    cube = new THREE.Mesh( geometry, material );

    cube.position.set( randRange(-r, r), randRange(-r, r), randRange(-r, r) );

    scene.add( cube );
  }

}

var holoScreenContainer;
function setupHoloRendering() {
  var holoResolution = 512;

  holoTextureL = new THREE.WebGLRenderTarget( holoResolution, holoResolution*holoAspect,
    { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
  holoTextureR = holoTextureL.clone();

  var planeGeoL = new THREE.PlaneGeometry(1,1*1/holoAspect);
  var planeMatL = new THREE.MeshBasicMaterial({
    map: holoTextureL.texture,
    transparent: true
  });
  holoPlaneL = new THREE.Mesh(planeGeoL, planeMatL);

  var planeGeoR = planeGeoL.clone();
  var planeMatR = new THREE.MeshBasicMaterial({
    map: holoTextureR.texture,
    transparent: true
  });
  holoPlaneR = new THREE.Mesh(planeGeoR, planeMatR);

  holoScreenContainer = new THREE.Object3D();
  dolly.add( holoScreenContainer );

  if (vrHMD) {
    var eyeParamsL = vrHMD.getEyeParameters( 'left' );
    var eyeParamsR = vrHMD.getEyeParameters( 'right' );

    var eyeTranslationL = new THREE.Vector3();
    var eyeTranslationR = new THREE.Vector3();

    eyeTranslationL.fromArray( eyeParamsL.offset );
    eyeTranslationR.fromArray( eyeParamsR.offset );

    holoPlaneL.translateOnAxis(eyeTranslationR, 1);
    holoPlaneR.translateOnAxis(eyeTranslationL, 1);
  }

  holoPlaneL.layers.disable(0);
  //holoPlaneL.layers.disable(1);
  //holoPlaneL.layers.disable(2);
  holoPlaneR.layers.disable(0);
  //holoPlaneR.layers.disable(1);
  //holoPlaneR.layers.disable(2);

  holoPlaneL.layers.enable(1);
  holoPlaneR.layers.enable(2);

  holoScreenContainer.add( holoPlaneL );
  holoScreenContainer.add( holoPlaneR );


  moveHoloScreen( 0.5 ); // todo: set right distance
}

// todo: update with FOV changes
function moveHoloScreen(distance) {
  holoScreenContainer.position.set(0,0, -distance);
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
  //mouseControls = new THREE.MouseControls(camera);

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
      case 84:/*T*/
        renderHolograms = !renderHolograms;
        holoScreenContainer.visible = renderHolograms;
        break;
    }
  }, false);
}

function setupUI() {
  var holoBtn = document.getElementById('holo-btn');
  var fullBtn = document.getElementById('full-btn');
  var incBtn = document.getElementById('inc-btn');
  var decBtn = document.getElementById('dec-btn');
  var toggleBtn = document.getElementById('toggle-btn');

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
  toggleBtn.addEventListener('click', function(){
    renderHolograms = !renderHolograms;
    holoScreenContainer.visible = renderHolograms;
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
  //mouseControls.update(dt);
  controls.update();
  //holoControls.update();

  //updateFOV(dt);
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
  //renderer.clear();

  if (renderHolograms) {
    renderHolo();
  }

  effect.render(scene, camera);
}

function renderHolo() {
  renderer.clearTarget(holoTextureL);
  renderer.render(holoScene, camera, holoTextureL); // change to holoCamera, with dolly usage

  renderer.clearTarget(holoTextureR);
  renderer.render(holoScene, camera, holoTextureR);
}

