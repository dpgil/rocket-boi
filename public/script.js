/* -------------- BEGIN sets up stage and game rendering -------------- */
// aliases
var Container = PIXI.Container,
	autoDetectRenderer = PIXI.autoDetectRenderer,
	loader = PIXI.loader,
	resources = PIXI.loader.resources,
	Sprite = PIXI.Sprite,
	Graphics = PIXI.Graphics,
	Text = PIXI.Text;

// create the renderer
var renderer = autoDetectRenderer(800, 600, {backgroundColor : 0x808b96});
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
// current level
var level = 0;
// main player sprite
var player;
// text sprite displayed to the user
var message;
// list of obstacles blocking the player
var obstacles = [];
// keeps track of the game state
var gameOver = true;

// number of obstacles to dodge per level
var obstacleLimit = [50];

// keep track of key presses
var keyPressed = [];
/* -------------- END game variables -------------- */


/* -------------- BEGIN constants -------------- */
// keycodes
var WCODE = 87;
var ACODE = 65;
var SCODE = 83;
var DCODE = 68;
var SPACE = 32;

// player movement
var MAXVEL = 5;
var MINVEL = -5;
var ACCELERATION = 0.5;
var DECELERATION = 0.25;
/* -------------- END constants -------------- */


/* -------------- BEGIN functions -------------- */
function setup() {
	console.log("Starting main menu");

	// show main menu "press space to play"
	createText("Press space to play");

	// set game state to over 
	// waiting at the menu is not playing
	gameOver = true;

	// kick off game loop
	gameLoop();
}

function gameLoop() {
	// loop the game 60 times a second
	requestAnimationFrame(gameLoop);

	// handles user input
	play();

	// renders the content on the screen
	renderer.render(stage);
}

function play() {
	// game is over, waiting for user to press space to play again
	if (gameOver) {
		// start the game over
		if (keyPressed[SPACE]) {
			// start level 1
			startGame();
		}
	// game is not over, continue letting user move the player
	} else {
		// handle player movement
		updatePlayer();
	}
}

function clearScreen() {
	// remove message and player
	stage.removeChild(message);
	stage.removeChild(player);

	// remove all obstacles
	obstacles.forEach(function(obstacle) {
		stage.removeChild(obstacle);
	});
	obstacles = [];
}

function createPlayer() {
	// makes player a red squares
	player = new Graphics();

	// fills in the color
	player.beginFill(0xC0392B);
	player.drawRect(0, 0, 64, 64);
	player.endFill();

	// puts player in the middle of the screen
	player.x = renderer.width / 2;
	player.y = renderer.height / 2;

	// player begins stationary
	player.xv = 0;
	player.yv = 0;

	// add player to screen
	stage.addChild(player);
}

function startGame() {
	console.log("Starting game at level 1");

	// clears the screen
	clearScreen();

	// creates the player
	createPlayer();

	// starts at level 1
	level = 1;

	// updates the game state
	gameOver = false;
}

function updatePlayer() {
	// W
	if (keyPressed[WCODE]) {
		// accelerate in the negative y direction
		if (player.yv > MINVEL) {
			player.yv -= ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!keyPressed[SCODE] && player.yv < 0) {
			player.yv += DECELERATION;
		}
	}

	// A
	if (keyPressed[ACODE]) {
		// accelerate in the negative x direction
		if (player.xv > MINVEL) {
			player.xv -= ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!keyPressed[DCODE] && player.xv < 0) {
			player.xv += DECELERATION;
		}
	}

	// S
	if (keyPressed[SCODE]) {
		// accelerate in the positive y direction
		if (player.yv < MAXVEL) {
			player.yv += ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!keyPressed[WCODE] && player.yv > 0) {
			player.yv -= DECELERATION;
		}
	}

	// D
	if (keyPressed[DCODE]) {
		// accelerate in the positive x direction
		if (player.xv < MAXVEL) {
			player.xv += ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!keyPressed[ACODE] && player.xv > 0) {
			player.xv -= DECELERATION;
		}
	}

	// updates velocities
	player.x += player.xv;
	player.y += player.yv;
}

// utility functions

function createText(s) {
	// take a string and display it on the screen
	message = new Text(s, {fontFamily: "Arial", fontSize: 64, fill: "white"});
	
	// set text anchor to its center
	message.anchor.x = 0.5;
	message.anchor.y = 0.5;

	// set text position
	message.x = renderer.width / 2;
	message.y = renderer.height / 2;

	// add message to the stage
	stage.addChild(message);
}

function hitTestRectangle(r1, r2) {
	//Define the variables we'll need to calculate
	var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

	//hit will determine whether there's a collision
	hit = false;

	//Find the center points of each sprite
	r1.centerX = r1.x + r1.width / 2;
	r1.centerY = r1.y + r1.height / 2;
	r2.centerX = r2.x + r2.width / 2;
	r2.centerY = r2.y + r2.height / 2;

	//Find the half-widths and half-heights of each sprite
	r1.halfWidth = r1.width / 2;
	r1.halfHeight = r1.height / 2;
	r2.halfWidth = r2.width / 2;
	r2.halfHeight = r2.height / 2;

	//Calculate the distance vector between the sprites
	vx = r1.centerX - r2.centerX;
	vy = r1.centerY - r2.centerY;

	//Figure out the combined half-widths and half-heights
	combinedHalfWidths = r1.halfWidth + r2.halfWidth;
	combinedHalfHeights = r1.halfHeight + r2.halfHeight;

	//Check for a collision on the x axis
	if (Math.abs(vx) < combinedHalfWidths) {
		//A collision might be occuring. Check for a collision on the y axis
		if (Math.abs(vy) < combinedHalfHeights) {
			//There's definitely a collision happening
			hit = true;
		} else {
			// There's no collision on the y axis
			hit = false;
		}
	} else {
		// There's no collision on the x axis
		hit = false;
	}

	//`hit` will be either `true` or `false`
	return hit;
}

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

// load images and starts the game
loader
	.add(["img/pigeon.png", "img/eagle.png"])
	.on("progress", loadProgressHandler)
	.load(setup);
/* -------------- END functions -------------- */


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
var gameOverMenu = {
	playing : false,
	message : "",
	setup : function() {
		console.log("Starting main menu");

		//gameOverMenu.addPlayer();
		gameOverMenu.addText();

		gameOverMenu.playing = true;
		gameOverMenu.gameLoop();
	},
	addText : function() {
		gameOverMenu.message = new Text(
			"Game over! Press space to play again",
			{fontFamily: "Arial", fontSize: 64, fill: "white"}
		);

		// center the text
		gameOverMenu.message.anchor.x = 0.5;
		gameOverMenu.message.anchor.y = 0.5;

		gameOverMenu.message.x = renderer.width / 2;
		gameOverMenu.message.y = renderer.height / 2;

		stage.addChild(gameOverMenu.message);
	},
	play : function() {
		// next level
		if (keyPressed[32]) {
			gameOverMenu.nextLevel();
		}
	},
	nextLevel : function() {
		gameOverMenu.clear();
		level1.setup();
	},
	clear : function() {
		gameOverMenu.playing = false;
		stage.removeChild(gameOverMenu.message);
		stage.removeChild(player);
	},
	gameLoop : function() {
		if (gameOverMenu.playing) {
			// loop this function at 60 frames per second
			requestAnimationFrame(gameOverMenu.gameLoop);

			// game logic
			gameOverMenu.play();

			// render the stage to see the animation
			renderer.render(stage);
		}
	}
}
var level1 = {
	playing : false,
	obstacles : [],
	message : "",
	velInc : 0.5,
	velDec : 0.25,
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

		if (level1.playing) {
			setTimeout(level1.spawnObstacle, rand);
		}
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

		obstacle.width = 100;
		obstacle.height = 50;
		obstacle.anchor.x = 0.5;
		obstacle.anchor.y = 1;
		obstacle.x = rx;
		obstacle.y = renderer.height + obstacle.height;
		level1.obstacles.push(obstacle);
		stage.addChild(obstacle);
	},
	updateObstacles : function() {
		level1.obstacles.forEach(function(obstacle) {
			// player hit an eagle
			if (hitTestRectangle(player, obstacle)) {
				level1.gameOver();
			// check if the obstacle has left the screen
			} else if (obstacle.y < 0) {
				var index = level1.obstacles.indexOf(obstacle);
				level1.obstacles.splice(index,1);
				stage.removeChild(obstacle);
			} else {
				obstacle.moveUp();
			}
		});
	},
	addPlayer : function() {
		// creates player sprite
		player = new Sprite(
			loader.resources["img/pigeon.png"].texture
		);

		// preset movement values
		player.maxspeed = 5;
		player.xvel = 0;
		player.yvel = 0;
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
	play : function() {
		// w
		if (keyPressed[87]) {
			//player.moveUp();
			if (player.yvel > -5) {
				player.yvel -= level1.velInc;
			}
		} else {
			// slowing down because the key was let go of
			if (!keyPressed[83] && player.yvel < 0) {
				player.yvel += level1.velDec;
			}
		}
		// a
		if (keyPressed[65]) {
			//player.moveLeft();
			if (player.xvel > -5) {
				player.xvel -= level1.velInc;
			} 
		} else {
			if (!keyPressed[68] && player.xvel < 0) {
				player.xvel += level1.velDec;
			}
		}
		// s
		if (keyPressed[83]) {
			//player.moveDown();
			if (player.yvel < 5) {
				player.yvel += level1.velInc;
			}
		} else {
			if (!keyPressed[87] && player.yvel > 0) {
				player.yvel -= level1.velDec;
			}
		}
		// d
		if (keyPressed[68]) {
			//player.moveRight();
			if (player.xvel < 5) {
				player.xvel += level1.velInc;
			}
		} else {
			if (!keyPressed[65] && player.xvel > 0) {
				player.xvel -= level1.velDec;
			}
		}

		player.x += player.xvel;
		player.y += player.yvel;
	},
	gameOver : function() {
		level1.playing = false;

		level1.message = new Text(
			"Game over! Press space to play again",
			{fontFamily: "Arial", fontSize: 64, fill: "white"}
		);

		// center the text
		level1.message.anchor.x = 0.5;
		level1.message.anchor.y = 0.5;

		level1.message.x = renderer.width / 2;
		level1.message.y = renderer.height / 2;

		stage.addChild(level1.message);
	},
	nextLevel : function() {
		level1.clear();
		//level2.setup();
	},
	clear : function() {
		level1.playing = false;
		stage.removeChild(player);

		//remove everything
		level1.obstacles.forEach(function(obstacle) {
			stage.removeChild(obstacle);
		});
		level1.obstacles = [];
		stage.removeChild(level1.message);
		level1.message = "";
	},
	gameLoop : function() {
		if (level1.playing) {
			// loop this function at 60 frames per second
			requestAnimationFrame(level1.gameLoop);

			level1.updateObstacles();
			// game logic
			level1.play();

			// render the stage to see the animation
			renderer.render(stage);
		} else {
			level1.endGameLoop();
		}
	},
	endGameLoop : function() {
		if (!level1.playing) {
			requestAnimationFrame(level1.endGameLoop);

			if (keyPressed[32]) {
				level1.clear();
				level1.setup();
			}

			renderer.render(stage);
		}
	}

}

/* -------------- END level 1 -------------- */



//onmousemove = function(e) {
//	if (level1.playing) {
//		player.x = e.clientX;
//		player.y = e.clientY;
//	}
//}