//Start everything from here
//48
function init() {
	var scene = new THREE.Scene();
	scene.background = new THREE.Color(0xe0e0e0);

	var camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth/window.innerHeight,
		0.1,
		5096
	);

    //Set camera position
	camera.position.set(0, 7.5, 0);
	camera.rotation.set(0, 0, 0);

    //Use this renderer for everything
	var renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	var clock = new THREE.Clock(true);
	var mouse = new THREE.Vector2();

	// Arrow array to hold all arrows
	var arrows = [];
    
    //Makes the arrows
	var init_arrow = function(direction, force) {
        //Stuff to make the arrow
		var geometry = new THREE.BoxBufferGeometry(0.25, 0.25, 3);
        
		var material = new THREE.MeshBasicMaterial({
			color: 0xa6ea15
		});

		// Initialize arrow
		var arrow = new THREE.Mesh(geometry, material);
		arrow.position.set(0, 7, 0);
		arrow.mass = GUIControls.ArrowMass;
		arrow.force = new THREE.Vector3(0, GUIControls.ArrowForce, 0);
		
		// Assume force was applied for 1 second
		arrow.velocity = direction.multiplyScalar(1 * force / arrow.mass);
		arrow.hasCollided = false;

		// Debug. Bounding box of arrow
		// var arrow_helper = new THREE.BoxHelper(arrow, 0xff0000);
		// scene.add(arrow_helper);

		arrows.push(arrow);
		scene.add(arrow);

		console.log("Spawned an arrow!");

		return arrow;
	};

	// Dummy array to hold dummies
	var dummies = [];
    
    //Makes the dummies
	var init_dummy = function(position) {
		var geometry = new THREE.BoxBufferGeometry(3, 6, 0.5);
		var material = new THREE.MeshBasicMaterial({
			color: 0x686868
		});
		
		var dummy = new THREE.Mesh(geometry, material);
		dummy.geometry.computeBoundingBox();
		dummy.mass = 1;
		dummy.force = new THREE.Vector3();
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
	var timeLastClick;
	var raycaster = new THREE.Raycaster();
	var raycast = function(evt) {
		// Center of screen is origin for raycasting
		mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
		mouse.y = - (evt.clientY / window.innerHeight) * 2 + 1;
		
		// Update raycaster
		raycaster.setFromCamera(mouse, camera);

		// Save time now for arrow's force
		timeLastClick = Date.now();
	};
	var shootArrow = function(evt) {
		// Get time difference
		let timeDiff = Date.now() - timeLastClick;

		// 1000 is to convert into seconds
		let force_coeff = 25;
		let force = force_coeff * timeDiff / 1000;

		// Get ray's direction
		let ray_direction = raycaster.ray.direction.clone();

		// Spawn an arrow
		init_arrow(ray_direction, force);
	};
	renderer.domElement.addEventListener("mousedown", raycast, false);
	renderer.domElement.addEventListener("mouseup", shootArrow, false);


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

        if(GUIControls.letFly){
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
                    arrow.force.set(0, 0, 0);
                    arrow.velocity.set(0, 0, 0);
                }

                // Acceleration -> velocity
                var arrow_accel = arrow.force.clone().divideScalar(arrow.mass);
                arrow.velocity.add(arrow_accel.multiplyScalar(deltaTime));

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
                        arrow.force.set(0, 0, 0);
                        arrow.velocity.set(0, 0, 0);

                        // Set to to has collided
                        arrow.hasCollided = true;
                        dummy.hasCollided = true;
                    }
                }
            }
		  console.log(arrows.length);
	   }
    }
	
    var GUIControls = new function(){
        this.letFly = true;
        this.ArrowMass = 1;
        this.ArrowForce = -5;
    }
    
    var GUI = new dat.GUI();
    GUI.add(GUIControls, "letFly", true, false);
    GUI.add(GUIControls, "ArrowMass", 1, 100);
    GUI.add(GUIControls, "ArrowForce", -100, -1);
    
	var gameLoop = function() {
		requestAnimationFrame(gameLoop);
		update();
		render();
	}

    var render = function() {
		renderer.render(scene, camera);
	}

	gameLoop();
}

window.onload = init;