// Graphics variables
var container, stats;
var camera, controls, scene, renderer;
var textureLoader;
var clock = new THREE.Clock();

var uniTime;

// Physics variables
var cubeSize = 20;
var gravityConstant = -10;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var softBodySolver;
var physicsWorld;
var rigidBodies = [];
var margin = 0.05;
var hinge;
var rope;
var transformAux1 = new Ammo.btTransform();

var armMovement = 0;

//fps cam
var raycaster;
var objects = [];

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

init();
animate();

function init() {

    initGraphics();

    initPhysics();

    initObjects();

    initInput();

}

function initGraphics() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.2, 2000 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );
    scene.fog = new THREE.Fog( 0x010101, 0, 750 );

    initControl();

    var sphere = new THREE.SphereBufferGeometry( 2.5, 16, 8 );
    light = new THREE.PointLight(0x00ff00);
    light.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) ) );
    light.position.set(250, 20, 100);
    scene.add(light);

    lightR = new THREE.PointLight(0xff0000);
    lightR.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xff0000 } ) ) );
    lightR.position.set(-250, 20, -100);
    scene.add(lightR);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;

    container.innerHTML = "";

    document.body.appendChild( renderer.domElement );

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );

    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function initControl()
{
    controls = new THREE.PointerLockControls( camera );

    var blocker = document.querySelector( '#a' );
    var instructions = document.querySelector( '#b' );

    instructions.addEventListener( 'click', function () {
        console.log("click");
        controls.lock();
    }, false );

    controls.addEventListener( 'lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    } );
    
    controls.addEventListener( 'unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    } );

    scene.add( controls.getObject() );

    var onKeyDown = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if ( canJump === true ) velocity.y += 350;
                canJump = false;
                break;
        }
    };
    var onKeyUp = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
}

function initPhysics() {

    // Physics configuration

    collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    softBodySolver = new Ammo.btDefaultSoftBodySolver();
    physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver );
    physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
    physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );

}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function initObjects()
{
    var pos = new THREE.Vector3();
    var quat = new THREE.Quaternion();

    // Ground
    pos.set( 0, 0, 0 );
    quat.set( 0, 0, 0, 1 );

    uniTime = THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        { diffuse: { type: 'c', value: new THREE.Color(0xff00ff) } },
        { "u_time": { value: 1.0 } }
    ]);

    THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        { diffuse: { type: 'c', value: new THREE.Color(0xff00ff) } }
    ])

    var ground = createParalellepiped( 1000, 1, 1000, 0, pos, quat, new THREE.ShaderMaterial( { 

        uniforms: uniTime,
        vertexShader: document.getElementById( 'vertexShader' ).innerText,
        fragmentShader: document.getElementById( 'floorFrag' ).innerText,
        lights: true
     } )
    );
    
    pos.set( 0, -16.6, 0 );
    var platf = createParalellepiped( 50, 50, 50, 0, pos, quat, new THREE.ShaderMaterial( { 

        uniforms: uniTime,
        vertexShader: document.getElementById( 'vertexShader' ).innerText,
        fragmentShader: document.getElementById( 'platformFrag' ).innerText,
     } )
    );


    for (var i = 0; i < 500; i++) 
    {
        createObjects();
    }

}

function createObjects() {

    var pos = new THREE.Vector3();
    var quat = new THREE.Quaternion();

    // Wall
    var brickMass = 10;
    var brickLength = cubeSize;
    var brickDepth = cubeSize;
    var brickHeight = cubeSize;
    var numBricksLength = cubeSize;
    var z0 = - numBricksLength * brickLength * 0.5;
    
    pos.set( 0, brickHeight * 0.5 + 10, z0 );
    quat.set( 0, 0, 0, 1 );
    pos.y = getRandomInt(500) + 100;
    pos.x = getRandomInt(1000) - 500;
    pos.z = getRandomInt(1000) - 500;
    quat.y = getRandomInt(100) / 100;
    var brickLengthCurrent = brickLength;
    var brickMassCurrent = brickMass;

    var brick = createParalellepiped( brickDepth, brickHeight, brickLengthCurrent, brickMassCurrent, pos, quat, createMaterial() );
    brick.castShadow = true;
    brick.receiveShadow = true;
}

function createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {

    var threeObject = new THREE.Mesh( new THREE.BoxBufferGeometry( sx, sy, sz, 1, 1, 1 ), material );
    var shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
    shape.setMargin( margin );

    createRigidBody( threeObject, shape, mass, pos, quat );

    return threeObject;

}

function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

    threeObject.position.copy( pos );
    threeObject.quaternion.copy( quat );

    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    var motionState = new Ammo.btDefaultMotionState( transform );

    var localInertia = new Ammo.btVector3( 0, 0, 0 );
    physicsShape.calculateLocalInertia( mass, localInertia );

    var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
    var body = new Ammo.btRigidBody( rbInfo );

    threeObject.userData.physicsBody = body;

    scene.add( threeObject );
    objects.push(threeObject);

    if ( mass > 0 ) {

        rigidBodies.push( threeObject );

        // Disable deactivation
        body.setActivationState( 4 );

    }

    physicsWorld.addRigidBody( body );

}

function createMaterial() {

    return new THREE.ShaderMaterial( { 
        uniforms: uniTime,
        vertexShader: document.getElementById( 'vertexShader' ).innerText,
        fragmentShader: document.getElementById( 'boxFrag' ).innerText,
     } )

}

function initInput() {

    window.addEventListener( 'keydown', function ( event ) {

        switch ( event.keyCode ) {

            // Q
            case 81:
                armMovement = 1;
                break;

            // A
            case 65:
                armMovement = - 1;
                break;

        }

    }, false );

    window.addEventListener( 'keyup', function () {

        armMovement = 0;

    }, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    //if ( controls.isLocked === true ) {
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;
        var intersections = raycaster.intersectObjects( objects );
        var onObject = intersections.length > 0;
        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveLeft ) - Number( moveRight );
        direction.normalize(); // this ensures consistent movements in all directions
        if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;
        if ( onObject === true ) {
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;
        }
        controls.getObject().translateX( velocity.x * delta );
        controls.getObject().translateY( velocity.y * delta );
        controls.getObject().translateZ( velocity.z * delta );
        if ( controls.getObject().position.y < 10 ) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }
        prevTime = time;
    //}


    render();
    stats.update();

}

function render() {

    var deltaTime = clock.getDelta();

    uniTime["u_time"].value += deltaTime/2;

    updatePhysics( deltaTime );

    renderer.render( scene, camera );

}

function updatePhysics( deltaTime ) {

    // Step world
    physicsWorld.stepSimulation( deltaTime, 10 );

    // Update rigid bodies
    for ( var i = 0, il = rigidBodies.length; i < il; i ++ ) {

        var objThree = rigidBodies[ i ];
        var objPhys = objThree.userData.physicsBody;
        var ms = objPhys.getMotionState();
        if ( ms ) {

            ms.getWorldTransform( transformAux1 );
            var p = transformAux1.getOrigin();
            var q = transformAux1.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

        }
    }
}
