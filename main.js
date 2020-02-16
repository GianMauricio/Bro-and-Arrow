function init() {
	var scene = new THREE.Scene();
	scene.background = new THREE.Color(0xe0e0e0);

	var camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth/window.innerHeight,
		0.1,
		5096
	);

	camera.position.set(0, 7.5, 0);
	camera.rotation.set(0, 0, 0);

	var renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	var clock = new THREE.Clock(true);

	var mouse = new THREE.Vector2();

	// Arrow
	var arrows = [];
	var init_arrow = function(velocity) {
		var geometry = new THREE.BoxBufferGeometry(0.25, 0.25, 3);
		var material = new THREE.MeshBasicMaterial({
			color: 0xa6ea15
		});

		var arrow = new THREE.Mesh(geometry, material);
		arrow.position.set(0, 7, 0);
		arrow.acceleration = new THREE.Vector3(0, -5, 0);
		arrow.velocity = velocity;
		arrow.hasCollided = false;

		// Debug
		// var arrow_helper = new THREE.BoxHelper(arrow, 0xff0000);
		// scene.add(arrow_helper);

		arrows.push(arrow);
		scene.add(arrow);

		console.log("Spawned an arrow!");

		return arrow;
	};
	
	// Dummy
	var dummies = [];
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

		dummies.push(dummy);
		scene.add(dummy);

		return dummy;
	};
	
	// Shoot arrow
	var raycaster = new THREE.Raycaster();
	var raycast = function(evt) {
		// Center of screen is origin for raycasting
		mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
		mouse.y = - (evt.clientY / window.innerHeight) * 2 + 1;
		
		// Update raycaster
		raycaster.setFromCamera(mouse, camera);
		
		// Get ray's direction
		var ray_direction = raycaster.ray.direction.clone();
		
		// Spawn an arrow
		init_arrow(ray_direction.multiplyScalar(15));
	}
	renderer.domElement.addEventListener("mousedown", raycast, false);


	// Initialize starting scene objects
	init_dummy(new THREE.Vector3(5, 5, -30));


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

		// Update for the dummies
		for(var i=0; i<dummies.length; i++) {
			let dummy = dummies[i];

			// Acceleration -> velocity
			dummy.velocity.multiplyScalar(1 - (dummy.friction * deltaTime));
	
			// Velocity -> position
			dummy.position.add(dummy.velocity.clone().multiplyScalar(deltaTime));
		}

		// Update for the arrows
		for(var i=0; i<arrows.length; i++) {
			let arrow = arrows[i];

			// Stop arrow when it hits the "ground"
			if(arrow.position.getComponent(1) <= 0) {
				arrow.acceleration.set(0, 0, 0);
				arrow.velocity.set(0, 0, 0);
			}

			// Acceleration -> velocity
			arrow.velocity.add(arrow.acceleration.clone().multiplyScalar(deltaTime));

			// Velocity -> position
			arrow.position.add(arrow.velocity.clone().multiplyScalar(deltaTime));

			// Velocity -> rotation
			if(!arrow.velocity.equals(zeroVector)) {
				arrow.lookAt(arrow.position.clone().add(arrow.velocity));
			}

			// Check if colliding with any of the dummies
			for(var j=0; j<dummies.length; j++) {
				let dummy = dummies[j];

				// If colliding with a dummy
				if(!arrow.hasCollided && isColliding(arrow, dummy)) {
					// Remove from arrows list
					arrows.splice(arrows.indexOf(arrow), 1);
		
					// Attach to dummy
					dummy.attach(arrow);
					scene.remove(arrow);
		
					// Transfer arrow physics stats to dummy
					dummy.velocity.setZ(arrow.velocity.getComponent(2));
					arrow.acceleration.set(0, 0, 0);
					arrow.velocity.set(0, 0, 0);
		
					// Set to to has collided
					arrow.hasCollided = true;
					dummy.hasCollided = true;
				}
			}
		}

		console.log(arrows.length);
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