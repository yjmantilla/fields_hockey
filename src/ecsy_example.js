//import { World, System, Component, TagComponent, Types } from "https://ecsy.io/build/ecsy.module.js";


const NUM_ELEMENTS = 50;
const SPEED_MULTIPLIER = 0.3;
const BASE_CHARGE = 10;
const MAX_ACCEL = 2;
const MAX_VEL = 0.5;
// Initialize canvas
var canvas = document.querySelector("canvas");
var canvasWidth = canvas.width = window.innerWidth;
var canvasHeight = canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");

var SHAPE_SIZE
var SHAPE_HALF_SIZE
var WALL_BORDER
var RESCALE_ENTITIES = false;

function rescale(){
    canvasWidth = canvas.width = window.innerWidth*0.95;
    canvasHeight = canvas.height = window.innerHeight*0.95;
    var minDim = Math.max.apply(null, [canvas.width,canvas.height])
    WALL_BORDER = minDim*0.01; // 3% of minimum dimension
    SHAPE_SIZE = minDim*0.03//minDim*0.05;
    SHAPE_HALF_SIZE = SHAPE_SIZE / 2;

    //walls = {positiveX:width-borderOffset,negativeX:0+borderOffset,positiveY:height-borderOffset,negativeY:0+borderOffset,restitution:walls.restitution,width:borderOffset}
    //puck.radius = minDim * 0.03;
  }

rescale()
// Event handler to resize the canvas when the document view is changed
window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    //rescale(); //costly to maintain for now...
    RESCALE_ENTITIES = true;
}

function get_walls(){
    var wp = [{x:0,y:canvasHeight-WALL_BORDER},
    {x:0,y:0},
    {x:0,y:0},
    {x:canvasWidth-WALL_BORDER,y:0}
    ];

    var ws = [{width:canvasWidth,height:WALL_BORDER},
        {width:canvasWidth,height:WALL_BORDER},
        {width:WALL_BORDER,height:canvasHeight},
        {width:WALL_BORDER,height:canvasHeight}
        ];
    return [wp,ws];
};

//----------------------
// Components
//----------------------

// Velocity component
class Velocity extends Component {}

Velocity.schema = {
  x: { type: Types.Number },
  y: { type: Types.Number }
};

// Position component
class Position extends Component {}

Position.schema = {
  x: { type: Types.Number },
  y: { type: Types.Number }
};

class Acceleration extends Component {}

Acceleration.schema = {
    x: {type: Types.Number},
    y: {type: Types.Number}
}

// Shape component
class Shape extends Component {}

Shape.schema = {
  primitive: { type: Types.String, default: 'box' },
  width: {type: Types.Number, default:SHAPE_SIZE},
  height: {type: Types.Number, default:SHAPE_SIZE},
  color: {type: Types.String, default: '#ffffff'}
};

class Field extends Component{}

Field.schema = {
  charge : {type: Types.Number, default: 1}
};

// Renderable component
class Renderable extends TagComponent {}

class Collisionable extends Component {}
Collisionable.schema = {
    restitution: {type: Types.Number, default:1}
}
class Bounceable extends TagComponent{};

class Accelerable extends TagComponent{};
//----------------------
// Systems
//----------------------

// MovableSystem
class MovableSystem extends System {
  // This method will get called on every frame by default
  execute(delta, time) {
    // Iterate through all the entities on the query
    this.queries.moving.results.forEach(entity => {
      var velocity = entity.getMutableComponent(Velocity);
      var position = entity.getMutableComponent(Position);
      var acceleration = entity.getMutableComponent(Acceleration);
      position.x += velocity.x * delta + 0.5*delta*delta*acceleration.x;
      position.y += velocity.y * delta + 0.5*delta*delta*acceleration.y;
      velocity.x += delta*acceleration.x;
      velocity.y += delta*acceleration.y;
      if (Math.abs(velocity.x) > MAX_VEL){velocity.x=MAX_VEL*Math.sign(velocity.x)}
      if (Math.abs(velocity.y) > MAX_VEL){velocity.y=MAX_VEL*Math.sign(velocity.y)}
      //   if (position.x > canvasWidth + SHAPE_HALF_SIZE) position.x = - SHAPE_HALF_SIZE;
    //   if (position.x < - SHAPE_HALF_SIZE) position.x = canvasWidth + SHAPE_HALF_SIZE;
    //   if (position.y > canvasHeight + SHAPE_HALF_SIZE) position.y = - SHAPE_HALF_SIZE;
    //   if (position.y < - SHAPE_HALF_SIZE) position.y = canvasHeight + SHAPE_HALF_SIZE;
    });
  }
}

// Define a query of entities that have "Velocity" and "Position" components
MovableSystem.queries = {
  moving: {
    components: [Velocity, Position, Acceleration]
  }
}

class CollisionSystem extends System{
    // Iterate through all the entities on the query
    execute(delta,time) {
        let entities = this.queries.entities.results;
        for (var i = 0; i < entities.length; i++) {
          let entity = entities[i];
            if (entity.hasComponent(Bounceable)) {
                var entityVelocity = entity.getMutableComponent(Velocity);
                var entityPosition = entity.getComponent(Position);
                var entityShape = entity.getComponent(Shape)
                for (var j = 0; j < entities.length; j++) {
                    if (j==i){continue;}
                    let entityB = entities[j];
                    if (entityB.hasComponent(Collisionable)){
                        var otherPosition = entityB.getComponent(Position);
                        var otherShape = entityB.getComponent(Shape)
                        var restitution = entityB.getComponent(Collisionable).restitution;
                        var rect = {x:otherPosition.x,
                                y:otherPosition.y,
                                w:otherShape.width,
                                h:otherShape.height};
                        if (entityShape.primitive ==='box'){
                            //an equivalent circle for the box
                            var circ = {
                                x : entityPosition.x+entityShape.width/2,
                                y : entityPosition.y+entityShape.width/2,
                                r : entityShape.width/2
                            }    
                            var collides = this.RectCircleColliding(circ,rect)
                        }//this.contains(rect,circ);}
                        else
                        {
                            var circ = {
                                x : entityPosition.x,
                                y : entityPosition.y,
                                r : entityShape.width/2
                            }
    
                            var collides = this.RectCircleColliding(circ,rect);
                        }
                        if (collides){
                            if (rect.w > rect.h)
                            {
                                if (rect.y > canvasHeight/2 && entityVelocity.y > 0)
                                {
                                    entityVelocity.y = -1*entityVelocity.y;
                                }
                                if (rect.y < canvasHeight/2 && entityVelocity.y < 0)
                                {
                                    entityVelocity.y = -1*entityVelocity.y;
                                }
                            }
                            else {
                                if (rect.x > canvasWidth/2 && entityVelocity.x > 0)
                                {
                                    entityVelocity.x = -1*entityVelocity.x;
                                }
                                if (rect.x < canvasWidth/2 && entityVelocity.x < 0)
                                {
                                    entityVelocity.x = -1*entityVelocity.x;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    RectCircleColliding(circle,rect){
        var distX = Math.abs(circle.x - rect.x-rect.w/2);
        var distY = Math.abs(circle.y - rect.y-rect.h/2);
        if (distX > (rect.w/2 + circle.r)) { return false; }
        if (distY > (rect.h/2 + circle.r)) { return false; }
    
        if (distX <= (rect.w/2)) { return true; } 
        if (distY <= (rect.h/2)) { return true; }
    
        var dx=distX-rect.w/2;
        var dy=distY-rect.h/2;
        return (dx*dx+dy*dy<=(circle.r*circle.r));
    }

    contains(targetA, targetB) {
        return !(targetB.x > (targetA.x + targetA.w) || 
                 (targetB.x + targetB.w) < targetA.x || 
                 targetB.y > (targetA.x + targetA.h) ||
                 (targetB.y + targetB.h) < targetA.y);
      }
}


CollisionSystem.queries = {
    entities: { components: [Position] },
  };

  
class AccelerationSystem extends System {
  execute(delta,time){
    var fields = this.queries.fields.results;
    var accelerables = this.queries.accelerables.results;
    for (var i = 0; i < accelerables.length; i++){
      var entity = accelerables[i];
      var acceleration = entity.getMutableComponent(Acceleration);
      acceleration.x = 0;
      acceleration.y = 0;
      //maybe put viscosity here...
      for (var j=0; j < fields.length;j++){
        let field = fields[j];
        if (entity.id == field.id){
          continue;
        }
        else{
          var fieldPosition = field.getComponent(Position);
          var entityPosition = entity.getComponent(Position);
          var fieldCharge = field.getComponent(Field).charge;
          var r2 = this.squaredDistance(entityPosition,fieldPosition);
          var angle = this.angleBetween(entityPosition,fieldPosition);
          var baseAcceleration = fieldCharge/r2;
          acceleration.x = acceleration.x +baseAcceleration*Math.cos(angle);
          acceleration.y = acceleration.y + baseAcceleration*Math.sin(angle);
          
        }
        if (Math.abs(acceleration.x ) > MAX_ACCEL){acceleration.x = MAX_ACCEL*Math.sign(acceleration.x);}
        if (Math.abs(acceleration.y ) > MAX_ACCEL){acceleration.y = MAX_ACCEL*Math.sign(acceleration.y);}
      }
    }
  }
  squaredDistance(entityPosition,fieldPosition){
    var x_diff_squared = (entityPosition.x - fieldPosition.x)**2;
    var y_diff_squared = (entityPosition.y - fieldPosition.y)**2;
    return x_diff_squared + y_diff_squared;
  }
  angleBetween(entityPosition, fieldPosition){
    return Math.atan2(fieldPosition.y-entityPosition.y,fieldPosition.x-entityPosition.x);
  }
}


AccelerationSystem.queries = {
  accelerables: { components: [Accelerable,Position,Acceleration] },
  fields: {components:[Field,Position]}
};
// RendererSystem
class RendererSystem extends System {
  // This method will get called on every frame by default
  execute(delta, time) {
    // Background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    if (RESCALE_ENTITIES){
        RESCALE_ENTITIES = false;
    }
    // Iterate through all the entities on the query
    this.queries.renderables.results.forEach(entity => {
      var shape = entity.getComponent(Shape);
      var position = entity.getComponent(Position);
      switch (shape.primitive){
        case 'box':
            this.drawBox(position,shape);
            break;
        case 'circle':
            this.drawCircle(position,shape);
            break;
        case 'rectangle':
            this.drawRectangle(position,shape);
            break;
        default:
            break;
      } 
    });
  }
  
  drawCircle(position,shape) {
    ctx.beginPath();
    ctx.arc(position.x, position.y, shape.width/2, 0, 2 * Math.PI, false);
    ctx.fillStyle= shape.color;
    ctx.fill();
    // ctx.lineWidth = 2;
    // ctx.strokeStyle = "#0b845b";
    // ctx.stroke();          
  }
  
  drawBox(position,shape) {
    ctx.beginPath();
    ctx.rect(position.x, position.y, shape.width, shape.height);
    ctx.fillStyle= shape.color;
    ctx.fill();
    // ctx.lineWidth = 2;
    // ctx.strokeStyle = "#ffffff";
    // ctx.stroke();                      
  }

  drawRectangle(position,shape) {
    ctx.beginPath();
    ctx.rect(position.x, position.y, shape.width, shape.height);
    ctx.fillStyle= shape.color;
    ctx.fill();
    // ctx.lineWidth = 2;
    // ctx.strokeStyle = "#ffffff";
    // ctx.stroke();                      
  }

}

// Define a query of entities that have "Renderable" and "Shape" components
RendererSystem.queries = {
  renderables: { components: [Renderable, Shape] }
}

// Create world and register the components and systems on it
var world = new World();
world
  .registerComponent(Velocity)
  .registerComponent(Position)
  .registerComponent(Acceleration)
  .registerComponent(Shape)
  .registerComponent(Renderable)
  .registerComponent(Collisionable)
  .registerComponent(Bounceable)
  .registerComponent(Field)
  .registerComponent(Accelerable)
  .registerSystem(AccelerationSystem)
  .registerSystem(MovableSystem)
  .registerSystem(RendererSystem)
  .registerSystem(CollisionSystem);

// Some helper functions when creating the components
function getRandomVelocity() {
  return {
    x: SPEED_MULTIPLIER * (2 * Math.random() - 1), 
    y: SPEED_MULTIPLIER * (2 * Math.random() - 1)
  };
}
  
function getRandomPosition() {
  return { 
    x: Math.random() * canvasWidth, 
    y: Math.random() * canvasHeight
  };
}

function getRandomColor(){
    return Math.random() >= 0.5 ? '#00ff00' : '#0000ff';
}

function getRandomShape() {
   return Math.random() >= 0.5 ? 'circle' : 'box';
  }

function colorFromCharge(charge){
  if (charge < 0){
    return "#0000ff";
  }
  else
  {
    return "#ff0000";
  }

}
function getRandomSign(){
  return Math.random() < 0.5 ? -1 : 1;
}
// Create movable system
for (let i = 0; i < NUM_ELEMENTS; i++) {
    var charge = getRandomSign()
    world
        .createEntity()
        .addComponent(Velocity, getRandomVelocity())
        .addComponent(Acceleration, {x:0,y:0})
        .addComponent(Field,{charge:BASE_CHARGE*charge})
        .addComponent(Shape, {primitive:'box',color:colorFromCharge(charge)})
        .addComponent(Position, getRandomPosition())
        .addComponent(Renderable)
        .addComponent(Bounceable)
}

// Create Puck

world
    .createEntity('puck')
    .addComponent(Velocity, getRandomVelocity())
    .addComponent(Acceleration, {x:0,y:0})
    .addComponent(Shape, {primitive:'circle',color:'#00ff00'})
    .addComponent(Position, getRandomPosition())
    .addComponent(Renderable)
    .addComponent(Collisionable)
    .addComponent(Bounceable)
    .addComponent(Accelerable);

var WALLS;
var WALLS_POSITIONS
var WALL_SIZES

rescale();
WALLS = get_walls();
WALLS_POSITIONS = WALLS[0];
WALL_SIZES = WALLS[1];

for (let i = 0; i < WALLS_POSITIONS.length; ++i){
    world
        .createEntity()
        .addComponent(Shape, {primitive:'rectangle',width:WALL_SIZES[i].width,height:WALL_SIZES[i].height,color:'#ffff00'})
        .addComponent(Position, {x:WALLS_POSITIONS[i].x,y:WALLS_POSITIONS[i].y})
        .addComponent(Renderable)
        .addComponent(Collisionable);
}

// Run!
function run() {
  // Compute delta and elapsed time
  var time = performance.now();
  var delta = time - lastTime;

  // Run all the systems
  world.execute(delta, time);

  lastTime = time;
  requestAnimationFrame(run);
}

var lastTime = performance.now();
run();