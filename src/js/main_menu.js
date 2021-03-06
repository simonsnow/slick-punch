function menuBackIfClickWaiting() {
	if(clickWaiting) {
		clickWaiting = false;
		menuBack();
	}
}

function menuBack() { // used by both Enter key or mouse clicking
	if(windowState.credits){
  		windowState.mainMenu = true;
  		windowState.credits = false;
  	}
  	if(windowState.help){
  		windowState.mainMenu = true;
  		windowState.help = false;
  	}
  	if(windowState.sound){
  		windowState.mainMenu = true;
  		windowState.sound = false;
  	}
}

function mouseClickedInside(leftX, topY, wid, hei) {
	if(mouseY > topY && mouseY < topY + hei && mouseX > leftX && mouseX < leftX + wid) {
		if(clickWaiting) {
			clickWaiting = false;
			return true;
		}
	}
	return false;
}

// Anchor positions are from center of top button
mainMenu = {
	titleFont: "40px Tahoma",
    buttonFont: "40px pinscher",
    textColor : "black",
	fontOverhangRatio: 4/5, // Currently 4/5 is correct for "Tahoma" font. Change if font changes
	
	//Must initialize these after the canvas has been set up
	buttonProperties: {},
	buttons: [],
	sliders: [],
	
	initialize: function() {
		this.buttonProperties = {
			padding: 4,
			anchorX: canvas.width/2  - 5,
			anchorY: canvas.height/2  + 30,
			verticalSpacing: 2,
		};
		// Buttons are also given a "bounds" property further down
		this.buttons = [
			{
				txt: "[P]lay",
				onClick: startGame,
			},
			{
				txt: "[H]elp",
				onClick: openHelp,
			},
			{
				txt: "[C]redits",
				onClick: openCredits,
			},
			{
				txt: "[S]ound",
				onClick: setSoundSystem,
			},
		];
		
		this.sliders = [
			{
				txt : "Music Volume",
				// handlePosition : musicVolume,
				onSlide : function(volume){
					musicVolume = volume;
					localStorage.setItem("musicVolume", musicVolume);
					if(gameOverMusic.isPlaying) {
						gameOverMusic.pauseSound();
						gameOverMusic.loopSong();
					} else {
						deepdarkMusic.pauseSound();
	  					deepdarkMusic.loopSong();
	  				}
				},
			},
			{
				txt : "Effects Volume",
				// handlePosition : effectsVolume,
				onSlide : function(volume){
					soundVolume = volume;
					localStorage.setItem("effectsVolume", soundVolume);
				},
			},
		]
		this.setButtonBounds();
		this.setupSliders();
	},
	
	// Size the buttons based on the text length and font size
	setButtonBounds: function(){
		var prop = this.buttonProperties;
		var height = getFontWeight(this.buttonFont) + prop.padding * 2; // Height is the same for all buttons
		
		for(var i = 0; i < this.buttons.length; i++) {
			var bounds = {};
			
			bounds.width = getTextWidth(this.buttons[i].txt, this.buttonFont) + prop.padding * 2;
			bounds.height = height;
			
			bounds.x = prop.anchorX - (bounds.width/2);
			bounds.y = prop.anchorY - (height * this.fontOverhangRatio) + ((height + prop.verticalSpacing) * i);

			this.buttons[i].bounds = bounds;
		}
	},
	
	//Slider variables live here
	setupSliders: function(){
		var sliderSpacing = 60;
		
		for(var i = 0; i < this.sliders.length; i++){
			this.sliders[i].spacing = 5;
			this.sliders[i].width = 200;
			this.sliders[i].height = 10;
			this.sliders[i].x = canvas.width/2  - 5 - this.sliders[i].width/2;
			this.sliders[i].y = 120 + (i + 1) * sliderSpacing;
			this.sliders[i].handleWidth = 30;
			this.sliders[i].handleHeight = 30;
			this.sliders[i].handleY = this.sliders[i].y - this.sliders[i].handleHeight/2 + this.sliders[i].height/2;
			this.sliders[i].handlePosition = 1.0;
			this.sliders[i].getHandleX = function() {
				return this.x + this.handlePosition * (this.width - this.handleWidth);
			};
			// this.sliders[i].onSlide(this.sliders[i].handlePosition);
			//this.sliders[i].active = false;
		}
	},
	
	checkButtons: function() {
		for(var i = 0; i < this.buttons.length; i++){
			var bounds = this.buttons[i].bounds;
			if(mouseClickedInside(bounds.x, bounds.y, bounds.width, bounds.height)) {
				this.buttons[i].onClick();
			}
		}
		
		var sliders = this.sliders;
		for(var i = 0; i < sliders.length; i++){
			sliders[i].active = (mouseClickedInside(sliders[i].x, sliders[i].y, sliders[i].width, sliders[i].height));
		}
	},
	
	handleSliders: function() {
		sliders = this.sliders;
		for(i = 0; i < sliders.length; i++) {
			if( sliders[i].active && mouseX > sliders[i].x && mouseX < sliders[i].x + sliders[i].width &&
				mouseY > sliders[i].y && mouseY < sliders[i].y + sliders[i].height) {
				clickWaiting = false; // blocks clicking on slider going back
				var handleX = mouseX - sliders[i].handleWidth/2;
				
				handleX = clamp(handleX, sliders[i].x, sliders[i].x + sliders[i].width - sliders[i].handleWidth);
				
				sliders[i].handlePosition = (handleX - sliders[i].x)/(sliders[i].width - sliders[i].handleWidth);
				sliders[i].onSlide(sliders[i].handlePosition);
			}
		}
	},
	
	releaseSliders: function() {
		for(i = 0; i < this.sliders.length; i++) {
			if(this.sliders[i].txt === "Effects Volume" && this.sliders[i].active) {
				regularShotSound.play();
			}
			this.sliders[i].active = false;
		}
	},
	
	drawButtons: function(opacity) {
		var prop = this.buttonProperties;
		
		for (var i = 0; i < this.buttons.length; i++) {
			var bounds = this.buttons[i].bounds;
			
			var fontOverhangAdjustment = (bounds.height - prop.padding * 2) * this.fontOverhangRatio;
			var posX = bounds.x + prop.padding;
			var posY = bounds.y + prop.padding + fontOverhangAdjustment;
			
			colorText(this.buttons[i].txt, posX, posY, this.textColor, this.buttonFont, "left", opacity);
			
			if(debug) { // draw bounds for buttons in semi-transparent colors
				var colors = ["red", "green", "blue", "aqua", "fuchaia", "yellow"];
				
				var tempAlpha = canvasContext.globalAlpha;
				canvasContext.globalAlpha = 0.2;
				
				colorRect(bounds.x, bounds.y, bounds.width, bounds.height, colors[i]);
				
				canvasContext.globalAlpha = tempAlpha;
			}
		}
	},

	drawSliders: function(opacity = 1){
		var sliders = this.sliders;
		for(var i = 0; i < sliders.length; i++) {
			colorRect(sliders[i].x, sliders[i].y, sliders[i].width, sliders[i].height, "white");
			colorRect(sliders[i].getHandleX(), sliders[i].handleY, sliders[i].handleWidth, sliders[i].handleHeight, "purple");
			
			var txtX = sliders[i].x + sliders[i].width/2;
			var txtY = sliders[i].y  - sliders[i].spacing;
			colorText(sliders[i].txt, txtX, txtY, this.textColor, this.buttonFont, "center", opacity);
		}
	}
};

var clamp = function(n, min, max) {
  return Math.min(Math.max(n, min), max);
};
