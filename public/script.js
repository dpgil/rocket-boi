/* -------------- BEGIN sets up stage and game rendering -------------- */
// aliases
var Container = PIXI.Container,
	autoDetectRenderer = PIXI.autoDetectRenderer,
	loader = PIXI.loader,
	resources = PIXI.loader.resources,
	Sprite = PIXI.Sprite,
	Text = PIXI.Text;

// create the renderer
var renderer = autoDetectRenderer(800, 600, {backgroundColor : 0x1099bb});
renderer.view.style.position = "absolute";
renderer.view.style.display = "block";
renderer.autoResize = true;
renderer.resize(window.innerWidth, window.innerHeight);

// create the stage
var stage = new Container();

// add canvas to the html
document.body.appendChild(renderer.view);

/* -------------- END sets up stage and game rendering -------------- */


/* -------------- BEGIN game variables -------------- */
// player
var player;

// keep track of key presses
var keyPressed = [];
/* -------------- END game variables -------------- */


/* -------------- BEGIN main menu -------------- */
var mainMenu = {
	playing : false,
	message : "",
	setup : function() {
		console.log("Starting main menu");

		//mainMenu.addPlayer();
		mainMenu.addText();

		mainMenu.playing = true;
		mainMenu.gameLoop();
	},
	addText : function() {
		mainMenu.message = new Text(
			"Press space to play",
			{fontFamily: "Arial", fontSize: 64, fill: "white"}
		);

		// center the text
		mainMenu.message.anchor.x = 0.5;
		mainMenu.message.anchor.y = 0.5;

		mainMenu.message.x = renderer.width / 2;
		mainMenu.message.y = renderer.height / 2;

		stage.addChild(mainMenu.message);
	},
	play : function() {
		// next level
		if (keyPressed[32]) {
			mainMenu.nextLevel();
		}
	},
	nextLevel : function() {
		mainMenu.clear();
		level1.setup();
	},
	clear : function() {
		mainMenu.playing = false;
		stage.removeChild(mainMenu.message);
	},
	gameLoop : function() {
		if (mainMenu.playing) {
			// loop this function at 60 frames per second
			requestAnimationFrame(mainMenu.gameLoop);

			// game logic
			mainMenu.play();

			// render the stage to see the animation
			renderer.render(stage);
		}
	}
}
/* -------------- END main menu -------------- */


/* -------------- BEGIN level 1 -------------- */
var level1 = {
	playing : false,
	obstacles : [],
	setup : function() {
		console.log("Starting level 1");

		// adds player to game
		level1.addPlayer();

		// render the stage
		renderer.render(stage);

		// kick off the game loop
		level1.playing = true;
		level1.gameLoop();

		//level1.addObstacle();
		// start spawning obstacles, random amount of time between 0.5s - 1.5s
		var rand = Math.floor(Math.random() * (1000) + 500);
		setTimeout(level1.spawnObstacle, rand);
	},
	spawnObstacle : function() {
		level1.addObstacle();

		var rand = Math.floor(Math.random() * (1000) + 500);
		console.log("Spawning obstacle in " + rand + "\n");
		setTimeout(level1.spawnObstacle, rand);
	},
	addObstacle : function() {
		// random x
		var rx = Math.floor(Math.random() * renderer.width);

		// generate the sprite
		var obstacle = new Sprite(
			loader.resources["img/eagle.png"].texture
		);

		obstacle.speed = 5;
		obstacle.moveUp = function() {
			obstacle.y -= obstacle.speed;
		}

		obstacle.width = 50;
		obstacle.height = 100;
		obstacle.anchor.x = 0.5;
		obstacle.anchor.y = 1;
		obstacle.x = rx;
		obstacle.y = renderer.height;
		level1.obstacles.push(obstacle);
		stage.addChild(obstacle);
	},
	updateObstacles : function() {
		level1.obstacles.forEach(function(e) {
			if (e.y < 0) {
				var index = level1.obstacles.indexOf(e);
				level1.obstacles.splice(index,1);
				stage.removeChild(e);
			} else {
				e.moveUp();
			}
		});
	},
	addPlayer : function() {
		// creates player sprite
		player = new Sprite(
			loader.resources["img/pigeon.png"].texture
		);

		// preset movement values
		player.speed = 5;
		player.angularV = 0.1;

		// movement functions
		player.moveRight = function() {
			player.x += player.speed;
		}
		player.moveLeft = function() {
			player.x -= player.speed;
		}
		player.moveUp = function() {
			player.y -= player.speed;
		}
		player.moveDown = function() {
			player.y += player.speed;
		}
		player.rotateCW = function() {
			player.rotation += player.angularV;
			if (player.rotation > 6.28) {
				player.rotation -= 6.28;
			}
		}
		player.rotateCC = function() {
			player.rotation -= player.angularV;
			if (player.rotation < 0) {
				player.rotation += 6.28;
			}
		}

		// changes player size
		player.width = 100;
		player.height = 125;
		// makes player center in the middle of the picture
		player.anchor.x = 0.5;
		player.anchor.y = 0.5;
		// sets player's starting position
		player.x = renderer.width / 2;
		player.y = renderer.height / 2;

		// adds player to the stage
		stage.addChild(player);
	},
	nextLevel : function() {
		level1.clear();
		//level2.setup();
	},
	clear : function() {
		level1.playing = false;
		stage.removeChild(player);
		//remove everything
	},
	gameLoop : function() {
		if (level1.playing) {
			// loop this function at 60 frames per second
			requestAnimationFrame(level1.gameLoop);

			level1.updateObstacles();
			// game logic
			//level1.play();

			// render the stage to see the animation
			renderer.render(stage);
		}
	}

}
/* -------------- END level 1 -------------- */


// load images and starts the game
loader
	.add(["img/pigeon.png", "img/eagle.png"])
	.on("progress", loadProgressHandler)
	.load(mainMenu.setup);


// progress handler
function loadProgressHandler(loader, resource) {
	// display file url being loaded
	console.log("loading: " + resource.url);

	// display percentage of files loaded
	console.log("progress: " + loader.progress + "%");
}

// key up
window.onkeyup = function(e) {
	keyPressed[e.keyCode] = false;
}

// key down
window.onkeydown = function(e) {
	keyPressed[e.keyCode] = true;
}

onmousemove = function(e) {
	if (level1.playing) {
		player.x = e.clientX;
		player.y = e.clientY;
	}
}