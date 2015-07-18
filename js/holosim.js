'use strict';

// HOLOSIM

var clock = new THREE.Clock();

var renderer;

var camera;
var scene, holoScene;

var cube, holoCube;

var controls;
var mouseControls;

var renderWidth, renderHeight;

var renderHolograms = true;

init();

function init() {
	scene = new THREE.Scene();
	holoScene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth/window.innerHeight, 0.1, 1000 );

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

function setupControls() {
	mouseControls = new THREE.MouseControls(camera);
}

function animate() {
	requestAnimationFrame( animate );

	var dt = clock.getDelta();

	update( dt );
	render( dt );
}

function update(dt) {
	mouseControls.update(dt);
}

function render(dt) {
	renderer.clear();

	renderer.render(scene, camera);

	if (renderHolograms) {
		renderHolo();

		// reset
		renderer.setViewport( 0, 0, renderWidth, renderHeight );
		renderer.setScissor( 0, 0, renderWidth, renderHeight );
		renderer.enableScissorTest( false );
	}
}

// TODO: calc FOV
// HoloLens estimate: 30deg x 17.5deg
// Max theoretical with current display tech: ~47deg
function renderHolo(hFOV, vHOV) {
	crop( renderWidth*0.25,renderHeight*0.25, renderWidth*0.5, renderHeight*0.5 );

	renderer.render(holoScene, camera);
}

function crop( x, y, w, h ) {
	renderer.setViewport( x, y, w, h );
	renderer.setScissor( x, y, w, h );
	renderer.enableScissorTest( true );
}