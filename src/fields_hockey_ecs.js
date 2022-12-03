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

function ExertsField(polarity,intensity=1){
    return {"ExertsField":{"Polarity":polarity,"Intensity":intensity}}
}

function InfluencedByField(polarity=1,intensity=1){
    return {"InfluencedByField":{"Polarity":polarity,"Intensity":intensity}}
}

function Returnable(x,y,vx,vy){
    return {'Returnable':{'Position':{'x':x,'y':y},'Velocity':{'x':vx,'y':vy}}}
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

function randsign(){
    return random([-1,1])
}

function random_handler(val,minval,maxval){
    if (val == 'random'){
        return randsign()*randint(minval,maxval)
    }
    else {
        return val
    }

}

function squared_distance(x,y,refx,refy){
    dist2 = (x-refx)**2 + (y-refy)**2
    return Math.max(dist2,1) // Avoid zero denominator
}

function angle_between(x,y,refx,refy){
    return Math.atan2(y-refy,x-refx)
}
// Reality Params

var Reality = {}
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

function MoveSystem(item,delta,Reality){

    query = "Velocity" in item.components && "Position" in item.components
    if (query){
        let velocity = item.components.Velocity
        let position = item.components.Position

        if  ("Acceleration" in item.components){var acceleration = item.components.Acceleration;}
        else {var acceleration={x:0,y:0}}

        position.x += velocity.x * delta //+ 0.5*delta*delta*acceleration.x;
        position.y += velocity.y * delta //+ 0.5*delta*delta*acceleration.y;
        velocity.x += delta*acceleration.x;
        velocity.y += delta*acceleration.y;

        velocity.x = Math.min(Reality['maxvel'],velocity.x)
        velocity.y = Math.min(Reality['maxvel'],velocity.y)
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
                if (reality.Collisionables[i]==index){ //avoid self interaction
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
            relativepos = relative_position(puck.x,puck.y,ref.x,ref.y)
            // Should it take into account velocity or momemtum???
            if (Math.abs(relativepos[1]) <= reality.height/2){ //go towards puck, maybe only if puck velocity is towards you???
            item.components.Velocity.x = Math.sign(relativepos[0])*item.components.Botsify.speed
            }
            else{ //go towards center
                relativepos = relative_position(reality.get_centerx(),reality.get_centery(),ref.x,ref.y)
                item.components.Velocity.x = Math.sign(relativepos[0])*item.components.Botsify.speed
            }
        });
    }
}

function ReturnSystem(item,Reality){
    query = "Returnable" in item.components && "Position" in item.components && "Velocity" in item.components
    if (query){
        out_x = item.components.Position.x < Reality.originx - Reality.border || item.components.Position.x > Reality.width + Reality.border
        out_y = item.components.Position.y < Reality.originy - Reality.border || item.components.Position.y > Reality.height + Reality.border
        if (out_x || out_y){
            item.components.Position.x = random_handler(item.components.Returnable.Position.x,Reality.originx,Reality.width)
            item.components.Position.y = random_handler(item.components.Returnable.Position.y,Reality.originy,Reality.height)
            item.components.Velocity.x = random_handler(item.components.Returnable.Velocity.x,Reality.minvel ,Reality.maxvel)
            item.components.Velocity.y = random_handler(item.components.Returnable.Velocity.y,Reality.minvel ,Reality.maxvel)
        }
    }
}

function FieldSystem(item,index,Reality,Entities){
    query = "Acceleration" in item.components && "InfluencedByField" in item.components
    if (query){
        
        /* Clear Previous acceleration to recalculate it, the acceleration is constant in a given timeStep */
        item.components.Acceleration.x = 0
        item.components.Acceleration.y = 0

        /*
        * Now we add to the drag acceleration in each component the contribution of each accelerator present on the game
        * This is done for each accelerator using the formula:
        * a = m/r^2, and this is decomposed in its components using the sin and cosine functions given the angle of the accelerator to the puck.
        * We iterate this procedure over all accelerators adding all of them to each component of the acceleration of the puck.
        */
        
        for (var i = 0; i < Reality.Exerters.length; i++){
            exerter_idx = Reality.Exerters[i]
            exerter = Entities[exerter_idx]
            if (index == exerter_idx){
                continue;
            }
            exertx= exerter.components.Position.x
            exerty= exerter.components.Position.y
            influx= item.components.Position.x
            influy= item.components.Position.y
    
            var intensity = exerter.components.ExertsField.Intensity*item.components.InfluencedByField.Intensity
            var polarity = exerter.components.ExertsField.Polarity*item.components.InfluencedByField.Polarity
            var dummyAcceleration =  intensity*polarity/squared_distance(influx,influy,exertx,exerty)
            var dummyAngle = angle_between(influx,influy,exertx,exerty);
    
            item.components.Acceleration.x+= dummyAcceleration*Math.cos(dummyAngle)
            item.components.Acceleration.y+= dummyAcceleration*Math.sin(dummyAngle)
            }

            item.components.Acceleration.x = Math.min(item.components.Acceleration.x,Reality['max-accel'])
            item.components.Acceleration.y = Math.min(item.components.Acceleration.y,Reality['max-accel'])
        }
    
        }



function setup() {
    createCanvas(windowWidth, windowHeight);
    Reality.background=0
    background(Reality.background);
    Reality.timedelta=1
    Reality.maxvel=5
    Reality.minvel=3

    Reality.originx = 0
    Reality.originy = 0
    Reality['width']=width // maybe later do some wall-based metrics?
    Reality['height']=height
    Reality['get_centerx']=function(){return width/2}
    Reality['get_centery']=function(){return height/2}
    Reality['wall-border-ratio']=1/64
    Reality['puck-dim']=1/32*Math.min(width,height)
    Reality['non-goal'] = 1/5
    Reality['striker-dim']=1/6
    Reality['striker-speed']=Reality.maxvel*0.6
    Reality['field-balance']=0.5 // Balance between attractors and repulsors
    Reality['field-cardinality']= 11//total number of attractors + repulsors
    Reality['border']=100//1/3*Math.min(width,height)
    Reality['max-accel']=1
    Reality['FieldIntensity']=500
    Reality.randpos=function(){return [randint(0,Reality.width),randint(0,Reality.height)]} // Maybe add offset to avoid wall clipping, using the wall border or the radius of particles
    // Puck
    Entities.push(add_components(Entity(label='Puck'),[InfluencedByField(-1,1),Collides('bounce'),Returnable(x=Reality.get_centerx(),y=Reality.get_centery(),vx='random',vy='random'),Position(x=Reality.get_centerx(),y=Reality.get_centery()),Velocity(randsign()*randint(Reality.minvel,Reality.maxvel),randsign()*randint(Reality.minvel,Reality.maxvel)),Acceleration(0,0),Appearance(shape='circle',x=Reality['puck-dim'],y=Reality['puck-dim'],color='#00FF00')]))

    GAP = Reality['non-goal']
    NOGAP = Reality['striker-dim']

    k=1;//interactor initial velocity modifier
    K=1; //interactor-interactor interactions boolean
    // Walls
    Entities.push(add_components(Entity(label='Wall_Up-L'),  [Collisionable(),Position(x=width*GAP/2,y=0),Appearance(shape='rect',x=width*GAP/2,y=height*Reality['wall-border-ratio'],color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Up-R'),  [Collisionable(),Position(x=width-width*GAP/2,y=0),Appearance(shape='rect',x=width*GAP/2,y=height*Reality['wall-border-ratio'],color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Right'), [Collisionable(),Position(x=width,y=Reality.get_centery()),Appearance(shape='rect',x=width*Reality["wall-border-ratio"],y=height/2,color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Left'),  [Collisionable(),Position(x=0,y=Reality.get_centery()),Appearance(shape='rect',x=width*Reality["wall-border-ratio"],y=height/2,color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Down-L'),[Collisionable(),Position(x=width*GAP/2,y=height),Appearance(shape='rect',x=width*GAP/2,y=height*Reality['wall-border-ratio'],color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Down-R'),[Collisionable(),Position(x=width-width*GAP/2,y=height),Appearance(shape='rect',x=width*GAP/2,y=height*Reality['wall-border-ratio'],color='#FFFF00')]))

    // Strikers
    Entities.push(add_components(Entity(label='Striker_Down'),[Collides('noclip'),Botsify(Reality['striker-speed']), Collisionable(),Position(x=width/2,y=height),Velocity(0,0),Appearance(shape='rect',x=width*NOGAP/2,y=height*Reality['wall-border-ratio'],color='#FF00FF')]))
    Entities.push(add_components(Entity(label='Striker_Up'),  [Collides('noclip'),Botsify(Reality['striker-speed']), Collisionable(),Position(x=width/2,y=0),Velocity(0,0),Appearance(shape='rect',x=width*NOGAP/2,y=height*Reality['wall-border-ratio'],color='#FF00FF')]))
    
    // Interactors // Accelerators
    // Should interactors return to the center
    NUM_ATTRACTORS = Math.floor(Reality['field-cardinality']*Reality['field-balance'])
    for (var i = 0; i < NUM_ATTRACTORS; i++){
    Entities.push(add_components(Entity(label='Interactor'),[InfluencedByField(1,K),Returnable(x='random',y='random',vx='random',vy='random'),ExertsField(1,Reality.FieldIntensity),Collides('bounce'),Position(x=Reality.randpos()[0],y=Reality.randpos()[1]),Velocity(k*randsign()*randint(Reality.minvel,Reality.maxvel),k*randsign()*randint(Reality.minvel,Reality.maxvel)),Acceleration(0,0),Appearance(shape='circle',x=1.3*Reality['puck-dim'],y=1.3*Reality['puck-dim'],color='#FF0000')]))
    }
    NUM_REPULSORS = Math.floor(Reality['field-cardinality']*(1-Reality['field-balance']))
    for (var i = 0; i < NUM_REPULSORS; i++){
        Entities.push(add_components(Entity(label='Interactor'),[InfluencedByField(-1,K),Returnable(x='random',y='random',vx='random',vy='random'),ExertsField(-1,Reality.FieldIntensity),Collides('bounce'),Position(x=Reality.randpos()[0],y=Reality.randpos()[1]),Velocity(k*randsign()*randint(Reality.minvel,Reality.maxvel),k*randsign()*randint(Reality.minvel,Reality.maxvel)),Acceleration(0,0),Appearance(shape='circle',x=1.3*Reality['puck-dim'],y=1.3*Reality['puck-dim'],color='#0000FF' )]))
        }
    
    Reality.Collisionables = collectItems(Entities,'"Collisionable" in item.components')
    Reality.Pucks = collectItems(Entities,'item.label.includes("Puck")')
    Reality.Exerters = collectItems(Entities,'"ExertsField" in item.components')
    Reality.Influenceds = collectItems(Entities,'"InfluencedByField" in item.components')
}

  function draw() {
    background(Reality.background); // commenting this will leave a trail for every moving object
    Entities.forEach((item,index) =>{
        RenderSystem(item);
        MoveSystem(item,Reality.timedelta,Reality);
        BotSystem(item,Reality,Entities);
        CollisionSystem(item,index,Reality,Entities);
        ReturnSystem(item,Reality)
        FieldSystem(item,index,Reality,Entities)
        //PlayerControlSystem()
    });

  }
  