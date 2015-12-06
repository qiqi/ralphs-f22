"use strict";
var gamejs = require('gamejs');

gamejs.preload(["F22T.png", "grass.jpg"]);

function SpriteObject(worldSize, center, angle, image, rotation=0, scale=1) {
    this.worldSize = worldSize;
    this.center = center;
    this.angle = angle;
    this.image = gamejs.image.load(image).rotate(rotation);
    var imageSize = this.image.getSize();
    this.image = this.image.scale([imageSize[0] * scale, imageSize[1] * scale])
    return this;
};

SpriteObject.prototype.turn = function(angle) {
    this.angle += angle
};

SpriteObject.prototype.advance = function(distance) {
    this.center[0] += distance * Math.cos(this.angle * Math.PI / 180);
    this.center[1] += distance * Math.sin(this.angle * Math.PI / 180);
    for (var i = 0; i <= 1; ++ i) {
        if (this.center[i] > this.worldSize[i] / 2)
            this.center[i] -= this.worldSize[i];
        else if (this.center[i] > this.worldSize[i] / 2)
            this.center[i] += this.worldSize[i];
    }
};

SpriteObject.prototype.blit = function(display, viewCtr) {
    var img = this.image.rotate(this.angle);
    var imgSize = img.getSize();
    var scrSize = display.getSize();
    var x = this.center[0] - viewCtr[0] + (scrSize[0] - imgSize[0]) / 2;
    var y = this.center[1] - viewCtr[1] + (scrSize[1] - imgSize[1]) / 2;
    display.blit(img, [x, y]);
};

function blitBackground(screen, viewCtr) {
    var image = gamejs.image.load('grass.jpg');
    var imgSize = image.getSize();
    var scrSize = screen.getSize();

    var x0 = Math.round(viewCtr[0] - scrSize[0] / 2);
    var x1 = Math.round(viewCtr[0] + scrSize[0] / 2);
    var y0 = Math.round(viewCtr[1] - scrSize[1] / 2);
    var y1 = Math.round(viewCtr[1] + scrSize[1] / 2);
    for (var i = Math.floor(x0 / imgSize[0]) - 1;
             i < Math.floor(x1 / imgSize[0]) + 1; ++ i) {
        for (var j = Math.floor(y0 / imgSize[1]) - 1;
                 j < Math.floor(y1 / imgSize[1]) + 1; ++ j) {
            var x = i * imgSize[0] - x0;
            var y = j * imgSize[1] - y0;
            screen.blit(image, [x, y]);
        }
    }
}

function main() {

   var display = gamejs.display.getSurface();

   var worldSize = [10000, 10000];

   var airplane = new SpriteObject(worldSize, [0, 0], 0, 'F22T.png');
   airplane.turningL = false;
   airplane.turningR = false;
   airplane.thrust = false;
   airplane.firing = false;

   airplane.update = function(msDuration) {
       if (this.turningL)
           airplane.turn(-0.1 * msDuration);
       if (this.turningR)
           airplane.turn(+0.1 * msDuration);
       if (this.thrust)
           airplane.advance(1 * msDuration);
       else
           airplane.advance(0.5 * msDuration);
   };

   gamejs.event.onKeyDown(function(event) {
       if (event.key == gamejs.event.K_LEFT)
           airplane.turningL = true;
       else if (event.key == gamejs.event.K_RIGHT)
           airplane.turningR = true;
   });
   gamejs.event.onKeyUp(function(event) {
       if (event.key == gamejs.event.K_LEFT)
           airplane.turningL = false;
       else if (event.key == gamejs.event.K_RIGHT)
           airplane.turningR = false;
   });

   gamejs.onTick(function(msDuration) {
      airplane.update(msDuration);

      var viewCtr = airplane.center;
      blitBackground(display, viewCtr);
      airplane.blit(display, viewCtr);
   });

   gamejs.event.onDisplayResize(function(event) {
   });
};

// call main after all resources have finished loading
gamejs.ready(main);
