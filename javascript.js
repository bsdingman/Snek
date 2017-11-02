/*
	Bryan Dingman
	Lab 6
	Make a game using jQuery (And other stuffs)
*/

///////////////////////////////////////////////////////
//	GLOBAL VARS!
///////////////////////////////////////////////////////
// Key codes
const KEY_ENTER = 13;
const KEY_ESCAPE = 27;
const KEY_SPACE = 32;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;

// Settings
const EASY_LENGTH = 1;
const MEDIUM_LENGTH = 5;
const HARD_LENGTH = 10;
const EASY_SPEED = 100;
const MEDIUM_SPEED = 80;
const HARD_SPEED = 60;
const POINT_PER = 20;

// The height and width of the pieces
const PIECE_H = 20;
const PIECE_W = 20;

// How far away does each piece get placed
const STEP = PIECE_W + 1;

// Generic vars for the game
var gameStarted = false;
var settings = {};
var paused = false;
var score = 0;
var mainLoop;


///////////////////////////////////////////////////////
//	OBJECTS!
///////////////////////////////////////////////////////
/*
	The game area that all the magic happens.
	Thx to W3Schools for the template, modified to use jQuery

	Methods:
		create()
		clear()
*/
var gameArea = 
{
	// Width and height so we can use them later
	canvasW: 0,
	canvasH: 0,
	
	// The actual canvas
	canvas: $("<canvas width='" + window.innerWidth + "' height='" + (window.innerHeight - 250) + "'></canvas>"),

	// creates the canvas and saves some attributes
	create: function() 
	{
		this.context = this.canvas.get(0).getContext("2d");
		this.canvasW = this.canvas.get(0).width;
		this.canvasH = this.canvas.get(0).height;
		this.canvas.appendTo("body");
	},

	// Removes all elements from the canvas
	clear : function() 
	{
		this.context.clearRect(0, 0, this.canvasW, this.canvasH);
	}
};

/*
	Our snek object
	Methods:
		update()
		create()
		move()
		spawnFud()
		detect_hitfud()
		detect_hitself()
		detect_hitwall()
		setup()
*/
var snek = 
{
	// The head object
	head: {},

	// An array of objects that are the body pieces
	body: [],

	// The fud object
	fud: null,

	// Which direction we are going
	direction: "right",
	
	/*
		Updates the game board and snake 
	*/
	update: function()
	{
		// Don't update if we are paused!
		if (paused) return;
		
		// Clear the game area. 
		gameArea.clear();

		// updates the score
		updateScore();
		
		// Spawn the body
		snek.move();

		// Check if we hit ourself or the wall
		var end = snek.detect_hitself() || snek.detect_hitwall();

		// Don't finish processing if this is the case
		if (end)
		{
			gameOver();
			return;
		}

		// Check if we hit the fud
		snek.detect_hitfud();

		// Spawn the fud
		snek.spawnFud();
	},
	
	/*
		creates the initial snek head and body
	*/
	create: function()
	{
		// Create the snek head
		snek.head = new component(PIECE_W, PIECE_H, "#00b300", gameArea.canvasW / 2, gameArea.canvasH / 2);

		// create the body pieces
		for (var i = 0; i < settings.start_length; i++) 
		{
			snek.body.push(new component(PIECE_W, PIECE_H, "#00ff00", snek.head.obj_x - (STEP * i), snek.head.obj_y));
		}
	},
	
	/*
		Move function
		Adds the old head to the body pieces
		Creates a new head
		Remove the tail
		Creates all the body parts
	*/
	move: function()
	{
		var x, y;
		
		// Determine which direction we need to go
		switch (snek.direction)
		{
			case "right":
				x = snek.head.obj_x + STEP;
				y = snek.head.obj_y;
				break;
			
			case "left":
				x = snek.head.obj_x - STEP;
				y = snek.head.obj_y;
				break;
			
			case "up":
				x = snek.head.obj_x;
				y = snek.head.obj_y - STEP;
				break;
			
			case "down":
				x = snek.head.obj_x;
				y = snek.head.obj_y + STEP;
				break;
			
			default:
				return;
		}

		// Add the head to the body
		snek.body.unshift(snek.head);

		// Create a new head
		snek.head = new component(PIECE_W, PIECE_H, "#00b300", x, y);

		// Remove the last body piece
		snek.body.pop();

		// Create the body pieces 
		for (var i = 0; i < snek.body.length; i++) 
		{
			var bodyPiece = snek.body[i];
			var newBodyPiece = new component(PIECE_W, PIECE_H, "#00ff00", bodyPiece.obj_x, bodyPiece.obj_y);
		}
	},
	
	/*
		Recreates or spawns a new fud
	*/
	spawnFud: function()
	{
		// we have one, just recreate it
		if (snek.fud != null)
		{
			snek.fud = new component(PIECE_W, PIECE_H, "#ff0000", snek.fud.obj_x, snek.fud.obj_y);
		}
		else
		{
			// Pick a random location in our canvas
			var x = Math.floor(Math.random() * gameArea.canvasW);
			var y = Math.floor(Math.random() * gameArea.canvasH);

			// Create fake "Margins"
			if (x > (gameArea.canvasW - (PIECE_W * 3)))
				x = gameArea.canvasW - (PIECE_W * 3);
			
			if (x < (PIECE_W * 3))
				x = PIECE_W * 3;
			
			if (y > (gameArea.canvasH - (PIECE_W * 3)))
				y = gameArea.canvasH - (PIECE_W * 3);
			
			if (y < (PIECE_W * 3))
				y = PIECE_W * 3;

			// create the fud piece
			snek.fud = new component(PIECE_W, PIECE_H, "#ff0000", x, y);
		}
	},

	/*
		Detect if the snake head has hit a fud piece
	*/
	detect_hitfud: function()
	{
		if (intersectsWith(snek.head, snek.fud))
		{
			// Set it to null so we will spawn a new fud 
			snek.fud = null;

			// Hacky, but basically we are keeping the "move" function from removing the tail piece so we end up with an extra ACTUAL body part
			snek.body.push({});

			// Add some points!
			score += POINT_PER;
		}
	},

	/*
		Detect if we hit ourself (Why are you hitting yourself?)
	*/
	detect_hitself: function ()
	{
		// Loop through all the body parts
		for (var i = 0; i < snek.body.length; i++) 
		{
			// If we intersect, just exit the function
			if (intersectsWith(snek.head, snek.body[i])) return true;
		}

		return false;
	},

	/*
		Detect if we have hit the wall
	*/
	detect_hitwall: function()
	{
		// Top 
		// Bottom
		// Left
		// Right
		if (intersectsWith(snek.head, {obj_x: 0, obj_y: -1, obj_w: gameArea.canvasW, obj_h: 0}) ||
			intersectsWith(snek.head, {obj_x: 0, obj_y: gameArea.canvasH, obj_w: gameArea.canvasW, obj_h: 0}) ||
			intersectsWith(snek.head, {obj_x: -20, obj_y: 0, obj_w: 0, obj_h: gameArea.canvasH}) ||
			intersectsWith(snek.head, {obj_x: gameArea.canvasW, obj_y: 0, obj_w: 0, obj_h: gameArea.canvasH}))
		{
			return true;
		}

		return false;
	},

	/*
		Set up our snek
	*/	
	setup: function()
	{
		// Create the initial snek
		snek.create();
		
		// Spawn our first fud pellet
		snek.spawnFud();

		// Loop the game!
		mainLoop = setInterval(snek.update, settings.speed);
	}
};


///////////////////////////////////////////////////////
//	FUNCTIONS!
///////////////////////////////////////////////////////

/*
	Initializes the game board and adds the title to the canvas
*/
function initializeGame() 
{
	// Create the game area
	gameArea.create();
	
	// Creates the title for the game
	createTitle();
}

/*
	Creates our friendly, Start Game title and centers it to the canvas
*/
function createTitle()
{
	var context = gameArea.context;
	context.font = "30px Consolas";
	context.fillStyle = "#00ff00";
	context.textAlign = "center";
	context.fillText("Start Game", gameArea.canvasW / 2, gameArea.canvasH / 2);
}

/*
	Creates and updates the score at the top right while in game
*/
function updateScore()
{
	var context = gameArea.context;
	context.font = "15px Consolas";
	context.fillStyle = "#00ff00";
	context.textAlign = "right";
	context.fillText("Score: " + score, gameArea.canvasW - 50, 25);
}

/*
	The workhorse of our GUI, creates squares and rectanges!
	Thx to W3Schools for the template, modified to return an object
*/
function component(width, height, color, x, y) 
{
	var context = gameArea.context;
	context.fillStyle = color;
	context.fillRect(x, y, width, height);

	return {
		obj_x: x,
		obj_y: y,
		obj_w: width,
		obj_h: height
	};
}

/*
	Starts the game
	Pulls the settings and checks to make sure any custom settings are valid
*/
function startGame()
{
	$("#speed").css("background-color", "");
	$("#length").css("background-color", "");

	switch ($("#difficulty_preset option:selected").val())
	{
		// For easy, medium, and hard, just get the values since they are disabled
		case "easy":
		case "medium":
		case "hard":
			settings = {
				start_length: $("#length").val(),
				speed: $("#speed").val()
			};
			break;
		// Custom, we need to check some stuff
		case "custom":
			// Get the speed text and parse an int from it
			var speed = parseInt($("#speed").val());

			// Check to make sure it's a valid it, if not, don't start and set the text box to red
			if (isNaN(speed) || speed <= 0)
			{
				$("#speed").css("background-color", "#ff0000");
				return;
			}

			// Repeat for length
			var length = parseInt($("#length").val());
			if (isNaN(length) || length <= 0)
			{
				$("#length").css("background-color", "#ff0000");
				return;
			}
				
			// save the settings
			settings = {
				start_length: length,
				speed: speed
			};	
			break;
		default:
			return;
	}

	// Remember that we have started
	gameStarted = true;
	gameArea.clear();
	
	// Create the snek and spawn the fud
	snek.setup();
}

/*
	Resets variables and the game
	Displays the start Game title
*/
function resetGame()
{
	// Reset these variables
	gameStarted = false;
	paused = false;
	score = 0;
	snek.body = [];
	snek.direction = "right";

	// Reinitialize the play field
	gameArea.clear();
	clearInterval(mainLoop);
	createTitle();
}

/*
	GAME OVER!!!
	Stop looping
	Display the score
	and reset some variables so we can just start again
*/
function gameOver()
{
	clearInterval(mainLoop);
	gameArea.clear();

	// Display the total points
	var context = gameArea.context;
	context.font = "30px Consolas";
	context.fillStyle = "#00ff00";
	context.textAlign = "center";
	context.fillText("GAME OVER", gameArea.canvasW / 2, gameArea.canvasH / 2);
	context.fillText("Score: " + score, gameArea.canvasW / 2, gameArea.canvasH / 2 + 30);

	gameStarted = false;
	paused = false;
	score = 0;
	snek.body = [];
	snek.direction = "right";
}

/*
	Checks to see if two rectangle objects intersects
*/
function intersectsWith(r1, r2)
{
	return !(r2.obj_x > (r1.obj_x + r1.obj_w) || (r2.obj_x + r2.obj_w) < r1.obj_x || r2.obj_y > (r1.obj_y + r1.obj_h) || (r2.obj_y + r2.obj_h) < r1.obj_y);
}

/////////////////////////////////////////////////
//	JQUERY
/////////////////////////////////////////////////
// Wait until the HTML is ready
$(document).ready(function()
{
	// Add an EH to the settings difficulty dropdown
	$("#difficulty_preset").change(function()
	{
		// Reset the color in case we had a bad option
		$("#speed").css("background-color", "");
		$("#length").css("background-color", "");

		// Change based on what is selected
		switch ($("#difficulty_preset option:selected").val())
		{
			case "easy":
				// Disable the textboxes
				$("#speed").prop("disabled", true);
				$("#length").prop("disabled", true);

				// Set the values to our const
				$("#speed").val(EASY_SPEED);
				$("#length").val(EASY_LENGTH);
				break;
			case "medium":
				// Disable the textboxes
				$("#speed").prop("disabled", true);
				$("#length").prop("disabled", true);

				// Set the values to our const
				$("#speed").val(MEDIUM_SPEED);
				$("#length").val(MEDIUM_LENGTH);
				break;
			case "hard":
				// Disable the textboxes
				$("#speed").prop("disabled", true);
				$("#length").prop("disabled", true);

				// Set the values to our const
				$("#speed").val(HARD_SPEED);
				$("#length").val(HARD_LENGTH);
				break;
			case "custom":
				// Enable the textboxes
				$("#speed").prop("disabled", false);
				$("#length").prop("disabled", false);
				break;
			default:
				return;
		}
	});

	// Default to easy and force the event to fire
	$("#difficulty_preset").val("easy").change();

	// The main key handler for the game.
	$("body").keyup(function(event)
	{
		switch(event.which)
		{
			case KEY_ENTER:
				if (gameStarted) break;
				startGame();
				break;
				
			case KEY_ESCAPE:
				if (!gameStarted) break;
				resetGame();
				break;
			
			case KEY_SPACE:
				if (!gameStarted) break;
				paused = !paused;
				break;
				
			case KEY_LEFT:
				if (!gameStarted) break;
				snek.direction = "left";
				break;
			
			case KEY_UP:
				if (!gameStarted) break;
				snek.direction= "up";
				break;
			
			case KEY_RIGHT:
				if (!gameStarted) break;
				snek.direction = "right";
				break;
			
			case KEY_DOWN:
				if (!gameStarted) break;
				snek.direction = "down";
				break;	
				
			default:
				break;
		}
	});

	// remove the "Submit on enter", since it's annoying
	$("#speed").keypress(function(e) { if (e.which == 13) e.preventDefault(); });
	$("#length").keypress(function(e) { if (e.which == 13) e.preventDefault(); });

	// Initialize the game!
	initializeGame();
});

