function add_components(entity,components){
    components.forEach(element => {
        entity.components = Object.assign({}, entity.components, element);
    });
    return entity
}
function Entity(label='None'){
    return {label:label,components:{}}
}

// Components
function Position(x=0,y=0){
    return {Position:{x:x,y:y}}
}

function Velocity(vx=0,vy=0){
    return {Velocity:{x:vx,y:vy}}
}

function Acceleration(ax=0,ay=0){
    return {Acceleration:{x:ax,y:ay}}
}

function Appearance(shape='ellipse',dimx=1,dimy=1,color="#FF0000"){
    return {Appearance:{shape:shape,x:dimx,y:dimy,color:color}}
}

// Reality Params

var Reality = {
    timedelta:1,
    background:0,
}
var Entities = []

// Systems
function RenderSystem(item){
    query = "Appearance" in item.components && "Position" in item.components
    if (query){
        let appearance = item.components.Appearance
        let position = item.components.Position

        if (appearance.shape == 'ellipse'){
            push(); 
            noStroke();
            ellipseMode(CENTER);
            fill(appearance.color);
            ellipse(position.x, position.y, Math.sqrt(appearance.x**2+appearance.y**2));
            pop();
            }
        
        if (appearance.shape == "rect"){

            push(); 
            noStroke();
            rectMode(RADIUS);
            fill(appearance.color);
            rect(position.x, position.y, appearance.x,appearance.y);
            pop();
        }
        
    }
}

function MoveSystem(item,delta){

    query = "Velocity" in item.components && "Position" in item.components
    if (query){
        let velocity = item.components.Velocity
        let position = item.components.Position

        if  ("Acceleration" in item.components){var acceleration = item.components.Acceleration;}
        else {var acceleration={x:0,y:0}}

        position.x += velocity.x * delta + 0.5*delta*delta*acceleration.x;
        position.y += velocity.y * delta + 0.5*delta*delta*acceleration.y;
        velocity.x += delta*acceleration.x;
        velocity.y += delta*acceleration.y;
    }


}



function setup() {
    createCanvas(windowWidth, windowHeight);
    background(Reality.background);
    Reality[width]=width // maybe later do some wall-based metrics?
    Reality[height]=height
    Reality['centerx']=function(){return width/2}
    Reality['centery']=function(){return height/2}
    Reality['wall-border-ratio']=1/32
    Reality['puck-dim']=1/32*Math.min(width,height)

    // Puck
    Entities.push(add_components(Entity(label='Puck'),[Position(x=Reality.centerx(),y=Reality.centery()),Velocity(1,1),Acceleration(0,0),Appearance(shape='ellipse',x=Reality['puck-dim'],y=Reality['puck-dim'],color='#00FF00')]))

    // Walls
    Entities.push(add_components(Entity(label='Up'),[Position(x=Reality.centerx(),y=0),Appearance(shape='rect',x=width/2,y=height*Reality['wall-border-ratio'],color='#FFFF00')]))

  }

  function draw() {
    background(Reality.background); // commenting this will leave a trail for every moving object
  
    Entities.forEach(item=>{
        RenderSystem(item);
        MoveSystem(item,Reality.timedelta);
    });

  }
  