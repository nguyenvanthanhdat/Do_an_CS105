import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';
// import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

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
// const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// affine controls
var afControls = new TransformControls(camera, renderer.domElement)
afControls.addEventListener('change', () => {
    renderer.render(scene, camera)
})
afControls.addEventListener('dragging-changed', (event) => {
    if (event.value) {
        controls.enabled = false
    } else {
        controls.enabled = true
    }
})
scene.add(afControls)

// Material
const objectMaterial = getMaterial("standard", "rgb(255, 255, 255)");
const planeMaterial = new THREE.MeshStandardMaterial( {
    roughness: 0.8,
    color: 0xffffff,
    metalness: 0.2,
    bumpScale: 0.0005
} );

textureLoader.load( 'textures/hardwood2_diffuse.jpg', function ( map ) {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 4;
    map.repeat.set( 10, 24 );
    map.colorSpace = THREE.SRGBColorSpace;
    planeMaterial.map = map;
    planeMaterial.needsUpdate = true;
} );

const teapotSize = 2;

// Create plane 
var plane = getPlane(planeMaterial, 50);
plane.rotation.x = Math.PI / 2;
scene.add(plane);

// Create Spot Light
var light1 = getDirectionalLight(1, "rgb(255, 220, 180)");
light1.position.set(-5, 10, -5);
var light2 = getDirectionalLight(1, "rgb(255, 220, 180)");
light2.position.set(5, 10, 5);
scene.add(light1);
scene.add(light2);

var object = undefined;
var prePosition = { x: 0, y: 0, z: 0 };
var preRotation = { x: 0, y: 0, z: 0 };

// var textGeo = getTextGeometry();
// console.log(textGeo)
// var textObject =  new THREE.Mesh( textGeo, objectMaterial );
// textObject.position.y = 6;
// scene.add(textObject);

const settings = {
    light: "Directional",
    geometry: "Box",
    method: "Solid",
    animation: false,
    affine: {
        mode: 'none',
    },
    reset: function () {
        resetPosition();
    },
    animation: {
        play: false,
        type: 'go up and down',
        speed: 1
    }
};

const textureSettings = {
    texture: 'Crate',
    repeat: { x: 1, y: 1 },
    anisotropy: 4,
    colorSpace: 'Linear',
  };

// GUI
function guiInit() {
    var gui = new GUI();

    var p = gui.addFolder("Camera");
    p.add(camera, 'fov', 1, 90).name("Field of view").step( 1 ).onChange(function() { camera.updateProjectionMatrix(); });

    var l1 = gui.addFolder("Light 1");
    // l1.add(settings,'light', ["Directional", "Spot", "Point", "Ambient"]).onChange(function(change) {
    //     const lightPos = {  x: light1.position.x, 
    //                         y: light1.position.y,
    //                         z: light1.position.z };
    //     switch (change) {
    //         case "Directional":
    //             light1 = getDirectionalLight(1, "rgb(255, 220, 180)");
    //             break;
    //         case "Spot":
    //             light1 = getSpotLight(1, "rgb(255, 220, 180)");
    //             break;
    //         case "Point":
    //             light1 = getPointLight(1, "rgb(255, 220, 180)");
    //             break;
    //         case "Ambient":
    //             light1 = getAmbientLight(1, "rgb(255, 220, 180)");
    //             break;
    //         default:
    //             break;
    //     }

    //     light1.position.set( lightPos.x, lightPos.y, lightPos.z);
    //     light1.updateWorldMatrix();
    //     // scene.add(light1);
    // })
    l1.add(light1, "intensity", 0, 10);
    l1.add(light1.position, "x", -20, 20);
    l1.add(light1.position, "y", -20, 20);
    l1.add(light1.position, "z", -20, 20);
    l1.addColor({ 'color': light1.color.getHex() }, 'color').onChange(function (value) {
        if (typeof value === 'string') { value = value.replace('#', '0x') }
        light1.color.setHex(value);
    });

    var l2 = gui.addFolder("Light 2");
    l2.add(light2, "intensity", 0, 10);
    l2.add(light2.position, "x", -20, 20);
    l2.add(light2.position, "y", -20, 20);
    l2.add(light2.position, "z", -20, 20);
    l2.addColor({ 'color': light2.color.getHex() }, 'color').onChange(function (value) {
        if (typeof value === 'string') { value = value.replace('#', '0x') }
        light2.color.setHex(value);
    });

    gui.add(settings, 'geometry', [ "Box", "Sphere", "Cylinder", "Cone", "Wheel", "Teapot", "Tube", "Capsule" ]).onChange(function (geometry) {
        scene.remove(object);
        object.geometry = getObject(geometry);
        scene.add(object);

        object.position.y = getPosition(geometry);
    });

    gui.add(settings, 'method', [ "Point", "Line", "Solid" ]).onChange(function (method) {
        scene.remove(object);
        var geometry = object.geometry;
        var px = object.position.x;
        var py = object.position.y;
        var pz = object.position.z;
        var rx = object.rotation.x;
        var ry = object.rotation.y;
        var rz = object.rotation.z;
        
        object = getMethod(method, objectMaterial);
        object.geometry = geometry;
        scene.add(object);
        object.position.x = px;
        object.position.y = py;
        object.position.z = pz;
        object.rotation.x = rx;
        object.rotation.y = ry;
        object.rotation.z = rz;
    });
    
    const textureFolder = gui.addFolder('Texture');
    textureFolder.add(textureSettings, 'texture', ['Crate', 'Earth Day', 'Earth Night', 'Moon', 'UV Grid']).onFinishChange(function (textureName) {
        const texturePath = getTexturePath(textureName);
        textureLoader.load(texturePath, function (map) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = textureSettings.anisotropy;
        map.repeat.set(textureSettings.repeat.x, textureSettings.repeat.y);
        map.colorSpace = textureSettings.colorSpace;
        object.material.map = map;
        object.material.needsUpdate = true;
        });
    });
    textureFolder.add(textureSettings.repeat, 'x', 0, 50).step(1).onChange(function (value) {
        objectMaterial.map.repeat.x = value;
        objectMaterial.map.needsUpdate = true;
    });
    textureFolder.add(textureSettings.repeat, 'y', 0, 50).step(1).onChange(function (value) {
        objectMaterial.map.repeat.y = value;
        objectMaterial.map.needsUpdate = true;
    });
    textureFolder.add(textureSettings, 'anisotropy', 0, 16).step(1).onChange(function (value) {
        objectMaterial.map.anisotropy = value;
        objectMaterial.map.needsUpdate = true;
    });
    textureFolder.add(textureSettings, 'colorSpace', ['SRGB', 'Linear']).onChange(function (value) {
        objectMaterial.map.colorSpace = value === 'SRGB' ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
        objectMaterial.map.needsUpdate = true;
    });

    // Affine
    let f = gui.addFolder('Affine Transformation')
    f.add(settings.affine, 'mode', ['none', 'translate', 'rotate', 'scale']).onChange(() => {
        if (settings.affine.mode === 'none') {
            afControls.detach()
        } else {
            afControls.setMode(settings.affine.mode)
            afControls.attach(object)
        }

    })

    // Reset position
    gui.add(settings, 'reset').name("Reset Position");

    // animation
    let a = gui.addFolder('Animation')
    a.add(settings.animation, 'play', false).onChange(function (play) {
        if (play) {
            if (settings.affine.mode !== 'none') {
                settings.affine.mode = 'none';
                afControls.detach();
            }
            prePosition.x = object.position.x;
            prePosition.y = object.position.y;
            prePosition.z = object.position.z;
            preRotation.x = object.rotation.x;
            preRotation.y = object.rotation.y;
            preRotation.z = object.rotation.z;
        }
        if (!play) {
            object.position.x = prePosition.x;
            object.position.y = prePosition.y;
            object.position.z = prePosition.z;
            object.rotation.x = preRotation.x;
            object.rotation.y = preRotation.y;
            object.rotation.z = preRotation.z;
        }
    });
    a.add(settings.animation, 'speed')
    a.add(settings.animation, 'type', ['go up and down', 'go left and right', 'go forward and backward', 'rotate x', 'rotate y', 'rotate z', 'go around clockwise', 'go around counterclockwise'])
}

function init() {
    object = getMethod(settings.method, objectMaterial);
    object.geometry = getObject(settings.geometry);
    object.position.y = getPosition(settings.geometry);

    const texture = new THREE.TextureLoader().load(getTexturePath(textureSettings.texture))
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = textureSettings.anisotropy;
    texture.repeat.set(textureSettings.repeat.x, textureSettings.repeat.y);
    texture.colorSpace = textureSettings.colorSpace === 'SRGB' ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
    object.material.map = texture;
    object.material.needsUpdate = true;

    scene.add(object);
    prePosition.x = object.position.x;
    prePosition.y = object.position.y;
    prePosition.z = object.position.z;
    preRotation.x = object.rotation.x;
    preRotation.y = object.rotation.y;
    preRotation.z = object.rotation.z;

    // scene.add(wireframe);
    object.visible = !settings.wireframe
}

function animate() {
	requestAnimationFrame( animate );

    if (settings.animation.play) {
        const speed = settings.animation.speed / 1000;
        switch (settings.animation.type) {
            case 'go up and down':
                object.position.y = prePosition.y + Math.sin(performance.now() * speed) * 0.5
                break
            case 'go left and right':
                object.position.x = prePosition.x + Math.sin(performance.now() * speed) * 0.5
                break
            case 'go forward and backward':
                object.position.z = prePosition.z + Math.sin(performance.now() * speed) * 0.5
                break
            case 'rotate y':
                object.rotation.y = preRotation.y + performance.now() * speed
                break
            case 'rotate x':
                object.rotation.x = preRotation.x + performance.now() * speed
                break
            case 'rotate z':
                object.rotation.z = preRotation.z + performance.now() * speed
                break
            case 'go around counterclockwise':
                object.position.x = prePosition.x + Math.sin(performance.now() * speed) * 0.5
                object.position.z = prePosition.z + Math.cos(performance.now() * speed) * 0.5
                break
            case 'go around clockwise':
                object.position.x = prePosition.x + Math.cos(performance.now() * speed) * 0.5
                object.position.z = prePosition.z + Math.sin(performance.now() * speed) * 0.5
                break
            default:
                break
        }
    }

	renderer.render( scene, camera );
}

init();
guiInit();
animate();

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
        case "Point":
            selectedMethod = new THREE.Points(undefined, new THREE.PointsMaterial({ color: 0xFFFFFF ,
                                                                                    size: 3,
                                                                                    blending: THREE.AdditiveBlending,
                                                                                    transparent: true,
                                                                                    sizeAttenuation: false
                                                                                }));
            break;
        case "Line":
            selectedMethod = new THREE.Line(undefined, material);
            break;
        case "Solid":
            selectedMethod = new THREE.Mesh(undefined, material);
            break;
    }
    selectedMethod.castShadow = true;
    return selectedMethod;
}

function getObject(objectName) {
    switch (objectName) {
        case "Sphere":
            return getSphere(2);
        case "Box":
            return getBox(3, 3, 3);;
        case "Cylinder":
            return getCylinder(2, 2, 6);
        case "Cone":
            return getCone(5, 5)
        case "Wheel":
            return getWheel(2, 0.8, 16);
        case "Teapot":
            return getTeapot(teapotSize);
        case "Tube":
            return getTube(3, 20, 1, 8);
        case "Capsule":
            return getCapsule(2, 2, 8, 16);
        default:
            break;
    }
}

function getPosition(geometry) {
    switch(geometry) {
        case "Sphere":
            return object.geometry.parameters.radius;
        case "Box":
            return object.geometry.parameters.height/2;
        case "Cylinder":
            return object.geometry.parameters.height/2;
        case "Cone":
            return object.geometry.parameters.height/2;
        case "Wheel":
            return object.geometry.parameters.radius + object.geometry.parameters.tube;
        case "Teapot":
            return teapotSize;
        case "Tube":
            return 2;
        case "Capsule":
            return 4;
    }
}

function getTexturePath(name) {
    switch (name) {
        case 'Crate':
            return 'textures/crate.gif';
        case 'Earth Day':
            return 'textures/earth_atmos.jpg';
        case 'Earth Night':
            return 'textures/earth_lights.png';
        case 'Moon':
            return 'textures/moon.jpg';
        case 'UV Grid':
            return 'textures/uv_grid.jpg';
        default:
            return;
    }
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
    var geometry = new TeapotGeometry( size, 15, true, 
                                       true, true, true, true);
    return geometry;
}

function getTube(size, tubularSegments, radius ,radialSegments) {
    class CustomSinCurve extends THREE.Curve {

        constructor( scale = 1 ) {
            super();
            this.scale = scale;
        }
    
        getPoint( t, optionalTarget = new THREE.Vector3() ) {
    
            const tx = Math.sin( 2 * Math.PI * t );
            const ty = 0;
            const tz = t * 4 - 1.5;
    
            return optionalTarget.set( tx, ty, tz ).multiplyScalar( this.scale );
        }
    }
    
    const path = new CustomSinCurve( size );
    var geometry = new THREE.TubeGeometry( path, tubularSegments, radius, radialSegments, false );
    return geometry;
}

function getCapsule(radius, length, capSegments, radialSegments) {
    const geometry = new THREE.CapsuleGeometry( radius, length, capSegments, radialSegments )
    return geometry;
}

// function getTextGeometry() {
//     const loader = new FontLoader();
//     var font;
//     loader.load( 'fonts/helvetiker_regular.typeface.json', function ( response ) {
//         font = response;
//     } );
//     const geometry = new TextGeometry( 'Hello!', {
//         font: font,
//         size: 70,
//         height: 5,
//         curveSegments: 4,
//         bevelEnabled: true,
//         bevelThickness: 2,
//         bevelSize: 1.5,
//         // bevelOffset: 0,
//         // bevelSegments: 5
//     } );
//     geometry.computeBoundingBox();
//     return geometry;
// }

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

function getDirectionalLight(intensity, color) {
    var light = new THREE.DirectionalLight(color, intensity);
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

function getPointLight(intensity) {
    var light = new THREE.PointLight(0xffffff, intensity);
    light.castShadow = true;

    return light;
}

function resetPosition() {
    object.position.x = 0;
    object.position.y = getPosition(settings.geometry);
    object.position.z = 0;

    object.rotation.x = 0;
    object.rotation.x = 0;
    object.rotation.x = 0;

    object.scale.x = 1;
    object.scale.y = 1;
    object.scale.z = 1;
}