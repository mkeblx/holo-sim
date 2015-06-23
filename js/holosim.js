'use strict';

// HOLOSIM

var renderer;

var camera;
var scene, holoScene;

var cube, holoCube;

init();

function init() {
	scene = new THREE.Scene();
	holoScene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth/window.innerHeight, 0.1, 1000 );

	renderer = new THREE.WebGLRenderer({

	});
	renderer.autoClear = false;
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	setupWorld();

	render();
}

function setupWorld() {
	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

	cube = new THREE.Mesh( geometry, material );
	scene.add( cube );

	cube.position.set(0,0,-5);
}

function render() {
	requestAnimationFrame( render );

	cube.rotation.x += 0.03;
	cube.rotation.y += 0.03;

	renderer.render(scene, camera);

	renderer.render(holoScene, camera);
}
