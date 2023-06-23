import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xffffff, 0.01); // Create fog for scene.

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.set(-15, 7, 10);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor("rgb(120, 120, 120)");
// renderer.useLegacyLights = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.minDistance = 1;
controls.maxDistance = 90;
const loader = new GLTFLoader();

// Create plane 
const planeMaterial = new THREE.MeshStandardMaterial( {
    roughness: 0.8,
    color: 0xffffff,
    metalness: 0.2,
    bumpScale: 0.0005
} );
var plane = getPlane(planeMaterial, 50);
plane.rotation.x = Math.PI / 2;
scene.add(plane);

// Create Spot Light
var light1 = getSpotLight(1, "rgb(255, 220, 180)");
light1.position.set(-5, 10, -5);
var light2 = getSpotLight(1, "rgb(255, 220, 180)");
light2.position.set(5, 10, 5);
scene.add(light1);
scene.add(light2);

// Material
var objectMaterial = getMaterial("standard", "rgb(255, 255, 255)");

//Method
var point = getMethod('point', objectMaterial);
var line = getMethod('line', objectMaterial);
var solid = getMethod('solid', objectMaterial);

// Objects
var sphere = getSphere(2);
var box = getBox(3, 3, 3);
var cylinder = getCylinder(2, 2, 6);
var cone = getCone(5, 5, objectMaterial);
var wheel = getWheel(2, 0.8, 16, objectMaterial);
const teapotSize = 2;
var teapot = getTeapot(teapotSize, objectMaterial);

var object = undefined;

// GUI
var gui = new GUI();

var folder1 = gui.addFolder("Light 1");
folder1.add(light1, "intensity", 0, 10);
folder1.add(light1.position, "x", -20, 20);
folder1.add(light1.position, "y", -20, 20);
folder1.add(light1.position, "z", -20, 20); 
folder1.addColor({ 'color': light1.color.getHex() }, 'color').onChange(function (value) {
    if (typeof value === 'string') { value = value.replace('#', '0x') }
    light1.color.setHex(value);
});

var folder2 = gui.addFolder("Light 2");
folder2.add(light2, "intensity", 0, 10);
folder2.add(light2.position, "x", -20, 20);
folder2.add(light2.position, "y", -20, 20);
folder2.add(light2.position, "z", -20, 20);
folder2.addColor({ 'color': light2.color.getHex() }, 'color').onChange(function (value) {
    if (typeof value === 'string') { value = value.replace('#', '0x') }
    light2.color.setHex(value);
});

const params = {
    geometry: sphere,
    method: solid
};

gui.add(params, 'object', { sphere, box, cylinder, cone, wheel, teapot }).onChange(function (geometry) {
    scene.remove(object);
    object.geometry = geometry;
    scene.add(object);

    object.position.y = getPosition(geometry);
});

gui.add(params, 'method', { point, line, solid }).onChange(function (method) {
    scene.remove(object);
    var geometry = object.geometry;
    object = method;
    object.geometry = geometry;
    scene.add(object);

    object.position.y = getPosition(geometry);
});

function init() {
    object = solid;
    object.geometry = sphere;
    object.position.y = object.geometry.parameters.radius;
    scene.add(object);

    // scene.add(wireframe);
    object.visible = !params.wireframe
}

function animate() {
	requestAnimationFrame( animate );

	// plane.rotation.z += 0.01;
	// plane.rotation.y += 0.01;

	renderer.render( scene, camera );
}

init();
animate();

function getPosition(geometry) {
    switch(geometry) {
        case sphere:
            return object.geometry.parameters.radius;
        case box:
            return object.geometry.parameters.height/2;
        case cylinder:
            return object.geometry.parameters.height/2;
        case cone:
            return object.geometry.parameters.height/2;
        case wheel:
            return object.geometry.parameters.radius + object.geometry.parameters.tube;
        case teapot:
            return teapotSize;
    }
}

function getMaterial(type, color) {
    var selectedMaterial;
    var materialColor = { color: color === undefined ? "rgb(255, 255, 255)" : color };
    switch (type) {
        case "basic":
            selectedMaterial = new THREE.MeshBasicMaterial(materialColor);
            break;
        case "lambert":
            selectedMaterial = new THREE.MeshLambertMaterial(materialColor);
            break;
        case "phong":
            selectedMaterial = new THREE.MeshPhongMaterial(materialColor);
            break;
        case "standard":
            selectedMaterial = new THREE.MeshStandardMaterial(materialColor);
            break;
        case "toon":
            selectedMaterial = new THREE.MeshToonMaterial(materialColor);
            break;
        default:
            selectedMaterial = new THREE.MeshBasicMaterial(materialColor);
            break;
    }
    return selectedMaterial;
}

function getMethod(method, material) {
    var selectedMethod;
    switch (method) {
        case "point":
            selectedMethod = new THREE.Points(undefined, new THREE.PointsMaterial({ color: 0xFFFFFF ,
                                                                                    size: 3,
                                                                                    blending: THREE.AdditiveBlending,
                                                                                    transparent: true,
                                                                                    sizeAttenuation: false
                                                                                }));
            break;
        case "line":
            selectedMethod = new THREE.Line(undefined, material);
            break;
        case "solid":
            selectedMethod = new THREE.Mesh(undefined, material);
            break;
    }
    selectedMethod.castShadow = true;
    return selectedMethod;
}

function getPlane(material, size) {
    var geometry = new THREE.PlaneGeometry(size, size);
    material.side = THREE.DoubleSide;
    var obj = new THREE.Mesh(geometry, material);
    obj.receiveShadow = true;

    return obj;
}

function getBox(width, height, depth) {
    var geoBox = new THREE.BoxGeometry(width, height, depth);
    return geoBox;
}

function getSphere(size) {
    var geometry = new THREE.SphereGeometry(size, 24, 24);
    return geometry;
}

function getCone(radius, height) {
    var geometry = new THREE.ConeGeometry(radius, height, 32);
    return geometry;
}

function getCylinder(radiusTop, radiusBottom, height) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    return geometry;
}

function getWheel(radius, tube, radialSegments) {
    var geometry = new THREE.TorusGeometry(radius, tube, radialSegments, 32);
    return geometry;
}

function getTeapot(size) {
    var geometry = new TeapotGeometry( size,
        15,
        true,
        true,
        true,
        false,
        true);
    return geometry;
}

function getPointLight(intensity) {
    var light = new THREE.PointLight(0xffffff, intensity);
    light.castShadow = true;

    return light;
}

// Lights
function getSpotLight(intensity, color) {
    var light = new THREE.SpotLight(color, intensity);
    light.castShadow = true;

    //Set up shadow properties for the light
    light.shadow.bias = 0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    return light;
}

function getDirectionalLight(intensity) {
    var light = new THREE.DirectionalLight(0xffffff, intensity);
    light.castShadow = true;

    light.shadow.camera.left = -10;
    light.shadow.camera.bottom = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;

    return light;
}

function getAmbientLight(intensity) {
    var light = new THREE.AmbientLight("rgb(100, 30, 50)", intensity);
    light.castShadow = true;

    return light;
}