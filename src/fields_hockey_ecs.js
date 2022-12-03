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

function Appearance(shape='circle',dimx=1,dimy=1,color="#FF0000"){
    return {Appearance:{shape:shape,x:dimx,y:dimy,color:color}}
}


function Botsify(speed=3){
    return {"Botsify":{speed:speed}}
}

function Collides(mode){//mode= 'noclip' or 'bounce'
    return {"Collides":mode}
}

function Collisionable(){
    return {"Collisionable":true}
}

// Utils

function add_components(entity,components){
    components.forEach(element => {
        entity.components = Object.assign({}, entity.components, element);
    });
    return entity
}

function radiusFromXY(x,y){
    return Math.sqrt(x**2+y**2)
}

function cornerFromRadius(cx,cy,rx,ry){
    //rect RADIUS mode to rect CORNER mode
    corner = [cx-rx,cy-ry]
    wh = [2*rx,2*ry]
    return [corner,wh]
}

function collectItems(entities,query){
    var match = []
    entities.forEach((item, index) => {
        if (eval(query)){
            match.push(index)
        }
    });
    return match
}

function relative_position(x,y,refx,refy){
    return [x-refx,y-refy]
}

function out_of_box(x,y,upperleft,downright){
    if (x < upperleft[0] || x > downright[0] || y < upperleft[1] || y > downright[1]){
        return true
    }
    else{
        return false
    }
}

function randint(min,max){
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// Reality Params



var Reality = {
    timedelta:1,
    background:0,
    maxvel:10,
    minvel:3
}
var Entities = []

// Systems
function RenderSystem(item){
    query = "Appearance" in item.components && "Position" in item.components
    if (query){
        let appearance = item.components.Appearance
        let position = item.components.Position

        if (appearance.shape == 'circle'){
            push(); 
            noStroke();
            ellipseMode(CENTER);
            fill(appearance.color);
            ellipse(position.x, position.y, radiusFromXY(appearance.x,appearance.y));
            pop();
            }
        
        if (appearance.shape == "rect"){

            push(); 
            noStroke();
            fill(appearance.color);
            corners = cornerFromRadius(position.x, position.y, appearance.x,appearance.y)
            rectMode(CORNER);
            rect(corners[0][0], corners[0][1], corners[1][0], corners[1][1]);
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


function CollisionSystem(item,index,reality,entities)
    {
    query = "Collides" in item.components && "Position" in item.components && "Velocity" in item.components && "Appearance" in item.components
    if (query)
        {
        var velocity = item.components.Velocity
        var appearance = item.components.Appearance
        var position = item.components.Position
        var collisionMode = item.components.Collides
        for (var i = 0; i < reality.Collisionables.length; i++) 
            {   
                if (i==index){ //avoid self interaction
                    continue
                }
                var collisionable = entities[reality.Collisionables[i]]
                bx =  collisionable.components.Position.x
                by =  collisionable.components.Position.y
                brx = collisionable.components.Appearance.x
                bry = collisionable.components.Appearance.y
                blabel = collisionable.label
                corners = cornerFromRadius(bx,by,brx,bry)
                if (appearance.shape == 'circle')
                {
                    hit = collideRectCircle(corners[0][0], corners[0][1], corners[1][0], corners[1][1], position.x, position.y, radiusFromXY(appearance.x,appearance.y));
                }
                if (appearance.shape=='rect'){
                    itemcorners = cornerFromRadius(position.x,position.y,appearance.x,appearance.y)
                    hit = collideRectRect(corners[0][0], corners[0][1], corners[1][0], corners[1][1],itemcorners[0][0], itemcorners[0][1], itemcorners[1][0], itemcorners[1][1])
                }
                if (hit)
                {   
                    if (collisionMode.includes('bounce')){
                    if (blabel.includes("Up")){
                        velocity.y =Math.abs(velocity.y)
                    }
                    if (blabel.includes("Down")){
                        velocity.y =-1*Math.abs(velocity.y)
                    }
                    if (blabel.includes("Left")){
                        velocity.x = Math.abs(velocity.x)
                    }
                    if (blabel.includes("Right")){
                        velocity.x = -1*Math.abs(velocity.x)
                    }
                    }

                    if (collisionMode.includes('noclip')){
                        if (blabel.includes("-L") && Math.sign(velocity.x)<0 ){
                            velocity.x = 0
                        }
                        if (blabel.includes("-R") && Math.sign(velocity.x)>0){
                            velocity.x = 0
                        }
                        }
    
                }
            }
        }
    }

function BotSystem(item,reality,entities){

    query = "Botsify" in item.components && "Position" in item.components && "Velocity" in item.components
    if (query){
        var ref = item.components.Position
        reality.Pucks.forEach(puckidx =>{
            var puck = entities[puckidx].components.Position
            relativeXpos = relative_position(puck.x,puck.y,ref.x,ref.y)[0]
            // Should it take into account velocity or momemtum???
            item.components.Velocity.x = Math.sign(relativeXpos)*item.components.Botsify.speed
        });
    }
}



function setup() {
    createCanvas(windowWidth, windowHeight);
    background(Reality.background);
    Reality[width]=width // maybe later do some wall-based metrics?
    Reality[height]=height
    Reality['centerx']=function(){return width/2}
    Reality['centery']=function(){return height/2}
    Reality['wall-border-ratio']=1/64
    Reality['puck-dim']=1/32*Math.min(width,height)
    Reality['goal'] = 1/3
    Reality['striker-dim']=1/6
    // Puck
    Entities.push(add_components(Entity(label='Puck'),[Collides('bounce'),Position(x=Reality.centerx(),y=Reality.centery()),Velocity(randint(-1,1)*randint(Reality.minvel,Reality.maxvel),randint(-1,1)*randint(Reality.minvel,Reality.maxvel)),Acceleration(0,0),Appearance(shape='circle',x=Reality['puck-dim'],y=Reality['puck-dim'],color='#00FF00')]))

    GAP = Reality['goal']
    NOGAP = Reality['striker-dim']
    // Walls
    Entities.push(add_components(Entity(label='Wall_Up-L'),  [Collisionable(),Position(x=width*GAP/2,y=0),Appearance(shape='rect',x=width*GAP/2,y=height*Reality['wall-border-ratio'],color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Up-R'),  [Collisionable(),Position(x=width-width*GAP/2,y=0),Appearance(shape='rect',x=width*GAP/2,y=height*Reality['wall-border-ratio'],color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Left'),  [Collisionable(),Position(x=0,y=Reality.centery()),Appearance(shape='rect',x=width*Reality["wall-border-ratio"],y=height/2,color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Right'), [Collisionable(),Position(x=width,y=Reality.centery()),Appearance(shape='rect',x=width*Reality["wall-border-ratio"],y=height/2,color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Down-L'),[Collisionable(),Position(x=width*GAP/2,y=height),Appearance(shape='rect',x=width*GAP/2,y=height*Reality['wall-border-ratio'],color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Down-R'),[Collisionable(),Position(x=width-width*GAP/2,y=height),Appearance(shape='rect',x=width*GAP/2,y=height*Reality['wall-border-ratio'],color='#FFFF00')]))

    // Strikers
    Entities.push(add_components(Entity(label='Striker_Down'),[Collides('noclip'),Botsify(1), Collisionable(),Position(x=width/2,y=height),Velocity(0,0),Appearance(shape='rect',x=width*NOGAP/2,y=height*Reality['wall-border-ratio'],color='#FF00FF')]))
    Entities.push(add_components(Entity(label='Striker_Up'),  [Collides('noclip'),Botsify(1), Collisionable(),Position(x=width/2,y=0),Velocity(0,0),Appearance(shape='rect',x=width*NOGAP/2,y=height*Reality['wall-border-ratio'],color='#FF00FF')]))
    
    Reality.Collisionables = collectItems(Entities,'"Collisionable" in item.components')
    Reality.Pucks = collectItems(Entities,'item.label.includes("Puck")')
}

  function draw() {
    background(Reality.background); // commenting this will leave a trail for every moving object
  
    Entities.forEach((item,index) =>{
        RenderSystem(item);
        MoveSystem(item,Reality.timedelta);
        BotSystem(item,Reality,Entities);
        CollisionSystem(item,index,Reality,Entities);
        //PlayerControlSystem()
    });

  }
  