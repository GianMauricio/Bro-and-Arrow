function init() {
	// Initialize threejs stuff
	var scene, camera, renderer, clock;

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xe0e0e0);

	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth/window.innerHeight,
		0.1,
		5096
	);

	camera.position.set(0, 7.5, 0);
	camera.rotation.set(0, 0, 0);

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	clock = new THREE.Clock(true);

	// Arrow
	var init_arrow = function(acceleration, velocity) {
		var geometry = new THREE.BoxBufferGeometry(0.25, 0.25, 3);
		var material = new THREE.MeshBasicMaterial({
			color: 0xa6ea15
		});

		var arrow = new THREE.Mesh(geometry, material);
		arrow.position.set(0, 5, 0);
		arrow.acceleration = acceleration;
		arrow.velocity = velocity;
		arrow.hasCollided = false;

		// Debug
		// var arrow_helper = new THREE.BoxHelper(arrow, 0xff0000);
		// scene.add(arrow_helper);

		return arrow;
	};

	// Dummy
	var init_dummy = function(position) {
		var geometry = new THREE.BoxBufferGeometry(3, 6, 0.5);
		var material = new THREE.MeshBasicMaterial({
			color: 0x686868
		});

		var dummy = new THREE.Mesh(geometry, material);
		dummy.geometry.computeBoundingBox();
		dummy.friction = 5;
		dummy.velocity = new THREE.Vector3();
		dummy.position.copy(position);
		dummy.hasCollided = false;

		// Debug
		var dummy_helper = new THREE.BoxHelper(dummy, 0xff0000);
		// scene.add(dummy_helper);
		
		return dummy;
	};

	// Initialize scene objects
	var arrow = init_arrow(new THREE.Vector3(0, -3, 0), new THREE.Vector3(4, 3, -20));
	scene.add(arrow);
	var dummy = init_dummy(new THREE.Vector3(5, 5, -30));
	scene.add(dummy);

	var isColliding = function(arrow, dummy) {
		// Tip of the arrow
		var arrow_sphere = new THREE.Sphere(new THREE.Vector3, 0.2);
		var dummy_box = dummy.geometry.boundingBox.clone();

		arrow_sphere.applyMatrix4(arrow.matrixWorld);
		dummy_box.applyMatrix4(dummy.matrixWorld);

		return arrow_sphere.intersectsBox(dummy_box);
	}

	var update = function() {
		var zeroVector = new THREE.Vector3();
		var deltaTime = clock.getDelta();

		// Stop arrow when it hits the "ground"
		if(arrow.position.getComponent(1) <= 0) {
			arrow.acceleration.set(0, 0, 0);
			arrow.velocity.set(0, 0, 0);
		}

		// Acceleration -> velocity
		arrow.velocity.add(arrow.acceleration.clone().multiplyScalar(deltaTime));
		dummy.velocity.multiplyScalar(1 - ((dummy.friction) * deltaTime));

		// Velocity -> position
		arrow.position.add(arrow.velocity.clone().multiplyScalar(deltaTime));
		dummy.position.add(dummy.velocity.clone().multiplyScalar(deltaTime));

		// Velocity -> rotation
		if(!arrow.velocity.equals(zeroVector)) {
			arrow.lookAt(arrow.position.clone().add(arrow.velocity));
		}

		if(!arrow.hasCollided && isColliding(arrow, dummy)) {
			// Attach to dummy
			dummy.attach(arrow);
			scene.remove(arrow);

			dummy.velocity.copy(arrow.velocity);
			arrow.acceleration.set(0, 0, 0);
			arrow.velocity.set(0, 0, 0);

			arrow.hasCollided = true;
			dummy.hasCollided = true;
		}
	}
	
	var render = function() {
		renderer.render(scene, camera);
	}
	
	var gameLoop = function() {
		requestAnimationFrame(gameLoop);
		update();
		render();
	}

	gameLoop();
}

window.onload = init;