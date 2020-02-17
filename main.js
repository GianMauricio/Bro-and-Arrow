//Start everything from here
//48
function init() {
	var scene = new THREE.Scene();
	scene.background = new THREE.Color(0x646490);

	var camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth/window.innerHeight,
		0.1,
		5096
	);

    //Set camera position
	camera.position.set(0, 7.5, 0);
	camera.rotation.set(0, 0, 0);
    
    var Miss = 0;
    var Hit = 0;
    var Accuracy = 0.0;
    var Score = 10;
    var TargetWorth = 20;
    var DummyWorth = 10;
    var aTargetWorth = 50;
    var aDummyWorth = -20;

    //Use this renderer for everything
	var renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	var clock = new THREE.Clock(true);
	var mouse = new THREE.Vector2();

	// Arrow array to hold all arrows
	var arrows = [];
    
    //Makes the arrows
	var init_arrow = function(direction, Sforce) {
        //Stuff to make the arrow
		var geometry = new THREE.BoxBufferGeometry(0.25, 0.25, 3);
		var material = new THREE.MeshBasicMaterial({
			color: 0xa6ea15
		});

		// Initialize arrow
		var arrow = new THREE.Mesh(geometry, material);
		arrow.position.set(0, 7, 0);
		arrow.mass = GUIControls.ArrowMass;
		arrow.force = new THREE.Vector3(0, -5, 0);
        arrow.onGround = false;
		
		// Assume force was applied for 1 second
		arrow.velocity = direction.multiplyScalar(GUIControls.ArrowForce * Sforce / arrow.mass);
		arrow.hasCollided = false;
        arrow.logMiss = false;

		// Debug. Bounding box of arrow
		// var arrow_helper = new THREE.BoxHelper(arrow, 0xff0000);
		// scene.add(arrow_helper);

		arrows.push(arrow);
		scene.add(arrow);

		//console.log("Spawned an arrow!");

		return arrow;
	};

	// Dummy array to hold dummies
	var dummies = [];
    
    //Makes the dummies
	var init_dummy = function(position, type) {
        
        if(type == "Dummy"){
          var geometry = new THREE.BoxBufferGeometry(3, 6, 0.5);
		  var material = new THREE.MeshBasicMaterial({
			 color: 0x686868
		  });
        }
        
        if(type == "Target"){
          var geometry = new THREE.BoxBufferGeometry(2, 2, 2);
		  var material = new THREE.MeshBasicMaterial({
			 color: 0x349934
		  });
        }
        
        if(type == "Wall"){
            var geometry = new THREE.BoxBufferGeometry(10, 5, 0.5);
		  var material = new THREE.MeshBasicMaterial({
			 color: 0x343499
		  });
        }
		
		
		var dummy = new THREE.Mesh(geometry, material);
		dummy.geometry.computeBoundingBox();
		dummy.mass = 1;
		dummy.force = new THREE.Vector3();
		dummy.friction = 5;
		dummy.velocity = new THREE.Vector3();
		dummy.position.copy(position);
		dummy.hasCollided = false;
        dummy.Type = type;

		// Debug
		var dummy_helper = new THREE.BoxHelper(dummy, 0xff0000);
		// scene.add(dummy_helper);

		dummies.push(dummy);
		scene.add(dummy);

		return dummy;
	};
    
    var showStats = function(evt) {
        if(evt.keyCode == 32){
            console.log("Hits: ");
            console.log(Hit);

            console.log("Miss: ");
            console.log(Miss);

            console.log("Overall Accuracy: ");
            console.log((Hit/(Hit+Miss)) * 100);

            console.log("Score: ");
            console.log(Score);
        }
        
        else if(evt.keyCode == 81){
            if(GUIControls.AppleMode){
                console.log("Shoot grey boxes for", aDummyWorth);
                console.log("Shoot green boxes for", aTargetWorth);
                //console.log("Avoid shooting blue walls, they are worth nothing");
            }
            
            else{
                console.log("Shoot grey boxes for", DummyWorth);
                console.log("Shoot green boxes for", TargetWorth);
                //console.log("Avoid shooting blue walls, they are worth nothing");
            }
        }
        
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
		let timeDiff = Date.now() - timeLastClick; /*TF is the let command???? oh it's like typedef*/

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
    document.addEventListener("keydown", showStats, false);


	// Initialize starting scene objects
	init_dummy(new THREE.Vector3(5, 5, -30), "Dummy");
    init_dummy(new THREE.Vector3(0, 5, -20), "Dummy");
    init_dummy(new THREE.Vector3(-5, 5, -10), "Dummy");
    
    init_dummy(new THREE.Vector3(5, 9, -30), "Target");
    init_dummy(new THREE.Vector3(0, 9, -20), "Target");
    init_dummy(new THREE.Vector3(-5, 9, -10), "Target");
    
    init_dummy(new THREE.Vector3(5, 9, -25), "Wall");

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

        if(GUIControls.letMove){
            // Update for the dummies
            for(var i=0; i<dummies.length; i++) {
                let dummy = dummies[i];

                // Acceleration -> velocity
                dummy.velocity.multiplyScalar(1 - (GUIControls.Friction * deltaTime));
                
                //Move dummy
                if(dummy.Type == "Wall"){
                    if(dummy.velocity.x < 10){
                        dummy.velocity.add(new THREE.Vector3(5, 0, 0));
                    }
                    
                    else if(dummy.velocity.x > 10){
                        dummy.velocity.add(new THREE.Vector3(-5, 0, 0));
                    }
                    
                }

                // Velocity -> position
                dummy.position.add(dummy.velocity.clone().multiplyScalar(deltaTime));
            }
        }
        
        if(GUIControls.letFly){
            // Update for the arrows
            for(var i=0; i<arrows.length; i++) {
                let arrow = arrows[i];
                //Force -> Acceleration
                var arrow_accel = arrow.force.clone().divideScalar(GUIControls.ArrowMass);
                
                //Gravity -> Acceleration
                var grav_arrow_accel = new THREE.Vector3(0, GUIControls.Gravity / arrow.mass, 0);
                
                // Acceleration -> velocity
                arrow.velocity.add(arrow_accel.multiplyScalar(deltaTime));
                arrow.velocity.add(grav_arrow_accel.multiplyScalar(deltaTime));
                
                if(!arrow.onGround){
                    // Velocity -> position
                    arrow.position.add(arrow.velocity.clone().multiplyScalar(deltaTime));
                    
                    // Velocity -> rotation
                    if(!arrow.velocity.equals(zeroVector)) {
                        arrow.lookAt(arrow.position.clone().add(arrow.velocity));
                    }
                }
                
                // Stop arrow when it hits the "ground"
                if(arrow.position.getComponent(1) <= 0) {
                    arrow.onGround = true;
                    if(!arrow.logMiss){
                        Miss = Miss + 1;
                        arrow.logMiss = true;
                    }
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
                        Hit = Hit + 1;
                        
                        if(GUIControls.AppleMode){
                            if(dummy.Type == "Target"){
                                Score += aTargetWorth;
                            }
                            
                            if(dummy.Type == "Dummy"){
                                Score += aDummyWorth;
                            }
                        }
                        
                        else{
                            if(dummy.Type == "Target"){
                                Score += TargetWorth;
                            }
                            
                            if(dummy.Type == "Dummy"){
                                Score += DummyWorth;
                            }
                        }
                    }
                }
            }
            //console.log(arrows.length);
	   }
    }
	
    var GUIControls = new function(){
        this.letFly = true;
        this.ArrowMass = 1;
        this.ArrowForce = 1;
        
        this.letMove = true;
        this.DummyMass = 1;
        
        this.Gravity = -9.8;
        this.Friction = 5;
        
        this.AppleMode = false;
    }
    
    var GUI = new dat.GUI();
    var Folder1 = GUI.addFolder("Arrows");
    var Folder2 = GUI.addFolder("Dummies");
    var Folder3 = GUI.addFolder("GodForces");
    var Folder4 = GUI.addFolder("GameMode");
    Folder1.add(GUIControls, "letFly", true, false);
    Folder1.add(GUIControls, "ArrowMass", 1, 100);
    Folder1.add(GUIControls, "ArrowForce", 1, 10);
    
    Folder2.add(GUIControls, "letMove", true, false);
    Folder2.add(GUIControls, "DummyMass", 1, 100);
    
    Folder3.add(GUIControls, "Gravity", -20, 20);
    Folder3.add(GUIControls, "Friction", -10, 10);
    
    Folder4.add(GUIControls, "AppleMode", true, false);
    
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