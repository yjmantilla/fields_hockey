var puck;
var walls;
var scores = [0,0];
var borderOffset;
function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  puck = new Particle(createVector(0,0),width/30);
  puck.velocity = randomnVector();
  walls = {positiveX:width-borderOffset,negativeX:0+borderOffset,positiveY:height-borderOffset,negativeY:0+borderOffset,restitution:-1,width:30}
  rescale();
  centerItem(puck.position,walls);
}

function draw() { 
  background(0); // commenting this will leave a trail for every moving object

  puck.update();
  puck.show();
  collideItemWithWalls(puck.position,puck.velocity,puck.radius,walls,walls.restitution)
  drawWalls(walls,walls.width); // so that objects dont superpose walls
}

class Particle {
  constructor(p , r , c = color('white') , v = createVector(0,0) , a = createVector(0,0) , m = 1) {
    this.radius = r;
    this.color = c;
    // p5.Vectors
    this.position = p;
    this.velocity = v;
    this.acceleration = a;
    this.mass = m;
    
  }

  show() {
    push()
    stroke(0);
    strokeWeight(2);
    ellipseMode(CENTER);
    fill(this.color);
    circle(this.position.x, this.position.y, 2*this.radius);
    pop()
  }

  update() {
    // Velocity changes according to acceleration
    this.velocity.add(this.acceleration);
    // position changes by velocity
    this.position.add(this.velocity);
    // We must clear acceleration each frame
    this.acceleration.mult(0);
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  rescale();
}

function rescale(){
  minDim = min([width,height])
  borderOffset = minDim*0.03; // 10% of minimum dimension
  walls = {positiveX:width-borderOffset,negativeX:0+borderOffset,positiveY:height-borderOffset,negativeY:0+borderOffset,restitution:walls.restitution,width:borderOffset}
  puck.radius = minDim * 0.03;
}

function collideItemWithWalls(position,velocity,hitBox,walls,restitution){
  if (position.x + hitBox > walls.positiveX) {
    position.x = walls.positiveX - hitBox;
    velocity.x *= restitution; // restitution should be negative
  } else if (position.x - hitBox < walls.negativeX) {
    position.x = walls.negativeX + hitBox;
    velocity.x *= restitution;
  }

  if (position.y + hitBox > walls.positiveY) {
    this.y = walls.positiveY - hitBox;
    velocity.y *= restitution;
  } else if (position.y - hitBox < walls.negativeY) {
    position.y = walls.negativeY + hitBox;
    velocity.y *= restitution;
  }
}

function centerItem(position,walls){
  position.x = 0.5*(walls.positiveX + walls.negativeX);
  position.y = 0.5*(walls.positiveY + walls.negativeY);
}

function randomPositionWithinWalls(position,hitBox,walls){
  position.x = random(walls.negativeX+hitBox,walls.positiveX - hitBox);
  position.y = random(walls.negativeY+hitBox,walls.positiveY - hitBox);
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    centerItem(puck.position,walls);
  } else if (keyCode === RIGHT_ARROW) {
    centerItem(puck.position,walls);
  }
  else if (keyCode === UP_ARROW){
    randomPositionWithinWalls(puck.position,puck.radius,walls);
  }
  else if (keyCode === DOWN_ARROW){
    randomPositionWithinWalls(puck.position,puck.radius,walls);
  }
  else if (keyCode === 107){
    puck.velocity = randomnVector();
  }
  else if (keyCode === 109){
    puck.velocity = randomnVector();
  }
}

function randomnVector(scale=10){
  return p5.Vector.random2D().mult(random(scale));
}

function drawWalls(walls,weight=3,c=color('yellow')){
  push()
  stroke(c);
  strokeWeight(weight);
  //-
  line(walls.negativeX, walls.negativeY, walls.positiveX, walls.negativeY);
  //_
  line(walls.negativeX, walls.positiveY, walls.positiveX, walls.positiveY);
  //|-
  line(walls.negativeX, walls.negativeY, walls.negativeX, walls.positiveY);
  //-|
  line(walls.positiveX, walls.negativeY, walls.positiveX, walls.positiveY);
  pop()
}

// function checkItemOutsideBoundaries(position,walls,boundaryOffset){

//   if 
// }