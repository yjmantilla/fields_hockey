function Entity(label='None'){
    return {label:label,components:{}}
}

// Components
function Position(x=0,y=0){
    return {Position:{x:x,y:y}}
}

function Velocity(vx=0,vy=0,minv=1,maxv=10){
    return {Velocity:{x:vx,y:vy,minv:minv,maxv:maxv}}
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

function TrackScore(){
    return {'TrackScore':{'value':0}}
}

function Scoreable(){
    return {'Scoreable':true}
}
function keyControllable(keys){ //keys = string. first letter is left , second letter is right
    return {'keyControllable':{'keys':keys}}
}
// Utils

function add_components(entity,components){
    components.forEach(element => {
        if (entity.components.hasOwnProperty(Object.keys(element)[0])){
            delete_components(entity,[Object.keys(element)[0]])
        }
        entity.components = Object.assign({}, entity.components, element);
    });
    return entity
}

function delete_components(entity,components){
    components.forEach(elem =>{
        if (entity.components.hasOwnProperty(elem)){
            delete entity.components[elem]
        }
    });
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

const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

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

        velocity.x += delta*acceleration.x;
        velocity.y += delta*acceleration.y;
        signx=Math.sign(velocity.x)
        signy=Math.sign(velocity.y)
        velocity.x = signx*Math.min(item.components.Velocity.maxv,Math.abs(velocity.x))
        velocity.y = signy*Math.min(item.components.Velocity.maxv,Math.abs(velocity.y))
        position.x += velocity.x * delta //+ 0.5*delta*delta*acceleration.x;
        position.y += velocity.y * delta //+ 0.5*delta*delta*acceleration.y;
        //The order of update matters here, I put position after velocity clipper
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
            speed = item.components.Botsify.speed
            if (speed==='global'){
                speed = reality['striker-speed']
            }
            if (Math.abs(relativepos[1]) <= reality.height/2){ //go towards puck, maybe only if puck velocity is towards you???
            item.components.Velocity.x = Math.sign(relativepos[0])*speed
            }
            else{ //go towards center
                relativepos = relative_position(reality.get_centerx(),reality.get_centery(),ref.x,ref.y)
                item.components.Velocity.x = Math.sign(relativepos[0])*speed
            }
        });
    }
}

function keyControlSystem(item,reality){
    query = "keyControllable" in item.components && "Position" in item.components && "Velocity" in item.components
    if (query){
        keys = item.components.keyControllable.keys.toUpperCase()
        if(keyIsDown(keys.charCodeAt(0))){
            dir = -1
        }
        else if(keyIsDown(keys.charCodeAt(1))){
            dir = 1
        }
        else{
            dir =0
        }
        item.components.Velocity.x = dir*reality['striker-speed']
    }
}

function ReturnSystem(item,Reality,entities){
    query = "Returnable" in item.components && "Position" in item.components && "Velocity" in item.components
    if (query){
        pos = item.components.Position
        out_x = pos.x < Reality.offset_x - Reality.border || pos.x > Reality.width + Reality.border
        out_y = pos.y < Reality.offset_y - Reality.border || pos.y > Reality.height + Reality.border
        if (out_x || out_y){

            query = 'Scoreable' in item.components
            if (query){
                //get striker closer to scoreable (so that it will count against it) --> -1
                //or get the one furthest.. --> +1
                ScoreTrackersDistances = []
                ScoreTrackersIndexes = []
                Reality.Strikers.forEach(elem =>{
                    scoreitem = entities[elem]
                    if ('Position' in scoreitem.components){
                        pos_score=scoreitem.components.Position
                        ScoreTrackersDistances.push(squared_distance(pos.x,pos.y,pos_score.x,pos_score.y))
                        ScoreTrackersIndexes.push(elem)
                    }
                });
                // As there are maximum two Strikers to use the implemented logic, just use ifs to search the max
                if (ScoreTrackersDistances[0]>ScoreTrackersDistances[1]){
                    entities[ScoreTrackersIndexes[0]].components.TrackScore.value +=1
                }
                else{
                    entities[ScoreTrackersIndexes[1]].components.TrackScore.value +=1
                }
            }

            item.components.Position.x = random_handler(item.components.Returnable.Position.x,Reality.offset_x,Reality.width)
            item.components.Position.y = random_handler(item.components.Returnable.Position.y,Reality.offset_y,Reality.height)
            item.components.Velocity.x = random_handler(item.components.Returnable.Velocity.x,item.components.Velocity.minv ,item.components.Velocity.maxv)
            item.components.Velocity.y = random_handler(item.components.Returnable.Velocity.y,item.components.Velocity.minv ,item.components.Velocity.maxv)

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
            if (Reality.no_action_radii**2<squared_distance(influx,influy,exertx,exerty))
                {
                item.components.Acceleration.x+= dummyAcceleration*Math.cos(dummyAngle)
                item.components.Acceleration.y+= dummyAcceleration*Math.sin(dummyAngle)
                }
            else{
                Entities[exerter_idx].components.Position.x = random_handler(exerter.components.Returnable.Position.x,Reality.offset_x,Reality.width)
                Entities[exerter_idx].components.Position.y = random_handler(exerter.components.Returnable.Position.y,Reality.offset_y,Reality.height)
                Entities[exerter_idx].components.Velocity.x = random_handler(exerter.components.Returnable.Velocity.x,exerter.components.Velocity.minv,exerter.components.Velocity.maxv)
                Entities[exerter_idx].components.Velocity.y = random_handler(exerter.components.Returnable.Velocity.y,exerter.components.Velocity.minv,exerter.components.Velocity.maxv)
            }
            }
            signx=Math.sign(item.components.Acceleration.x)
            signy=Math.sign(item.components.Acceleration.y)
            item.components.Acceleration.x = signx*Math.min(Math.abs(item.components.Acceleration.x),Reality['max-accel'])
            item.components.Acceleration.y = signy*Math.min(Math.abs(item.components.Acceleration.y),Reality['max-accel'])
        }
    
        }

function ShowScoreSystem(item){
    query = "TrackScore" in item.components && 'Appearance' in item.components && 'Position' in item.components
    if (query){
        var appearance = item.components.Appearance
        var position = item.components.Position
        var score = item.components.TrackScore.value
        itemcorners = cornerFromRadius(position.x,position.y,appearance.x,appearance.y)
        //text(score.toString(),itemcorners[0][0], itemcorners[0][1], itemcorners[1][0], itemcorners[1][1])
        textSize(average([appearance.dimx,appearance.dimy]))
        text(score.toString(),position.x,position.y)
    }
}

// Reality Params

var Reality = {}
var Entities = []

function populate(Reality,Entities=[]){
    // Puck
    Entities.push(add_components(Entity(label='Puck'),[Scoreable(),InfluencedByField(-1,1),Collides('bounce'),Returnable(x=Reality.get_centerx(),y=Reality.get_centery(),vx='random',vy='random'),Position(x=Reality.get_centerx(),y=Reality.get_centery()),Velocity(randsign()*randint(Reality.minvel,Reality.maxvel),randsign()*randint(Reality.minvel,Reality.maxvel),Reality.minvel,Reality.maxvel),Acceleration(0,0),Appearance(shape='circle',x=Reality['puck-dim'],y=Reality['puck-dim'],color='#00FF00')]))

    // Walls
    Entities.push(add_components(Entity(label='Wall_Up-L'),  [Collisionable(),Position(x=Reality.offset_x+Reality.width*GAP/2,y=Reality.offset_y),Appearance(shape='rect',x=Reality.width*GAP/2,y=Reality.height*Reality['wall-border-ratio'],color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Up-R'),  [Collisionable(),Position(x=Reality.width-Reality.width*GAP/2,y=Reality.offset_y),Appearance(shape='rect',x=Reality.width*GAP/2,y=Reality.height*Reality['wall-border-ratio'],color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Right'), [Collisionable(),Position(x=Reality.width,y=Reality.get_centery()),Appearance(shape='rect',x=Reality.width*Reality["wall-border-ratio"],y=Reality.height/2,color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Left'),  [Collisionable(),Position(x=Reality.offset_x,y=Reality.get_centery()),Appearance(shape='rect',x=Reality.width*Reality["wall-border-ratio"],y=Reality.height/2,color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Down-L'),[Collisionable(),Position(x=Reality.offset_x+Reality.width*GAP/2,y=Reality.offset_y+Reality.height),Appearance(shape='rect',x=Reality.width*GAP/2,y=Reality.height*Reality['wall-border-ratio'],color='#FFFF00')]))
    Entities.push(add_components(Entity(label='Wall_Down-R'),[Collisionable(),Position(x=Reality.width-Reality.width*GAP/2,y=Reality.offset_y+Reality.height),Appearance(shape='rect',x=Reality.width*GAP/2,y=Reality.height*Reality['wall-border-ratio'],color='#FFFF00')]))

    // Strikers
    Entities.push(add_components(Entity(label='Striker_Down'),[TrackScore(),Botsify(speed="global"),Collides('noclip'), Collisionable(),Position(x=Reality.offset_x+Reality.width/2,y=Reality.offset_y+Reality.height),Velocity(0,0,Reality.minvel,Reality.maxvel),Appearance(shape='rect',x=Reality.width*NOGAP/2,y=Reality.height*Reality['wall-border-ratio'],color='#FF00FF')]))
    Entities.push(add_components(Entity(label='Striker_Up'),  [TrackScore(),Botsify(speed="global"),Collides('noclip'), Collisionable(),Position(x=Reality.offset_x+Reality.width/2,y=Reality.offset_y),Velocity(0,0,Reality.minvel,Reality.maxvel),Appearance(shape='rect',x=Reality.width*NOGAP/2,y=Reality.height*Reality['wall-border-ratio'],color='#FF00FF')]))
    
    // Interactors // Accelerators
    //TODO: Interactors of different sizes and field intensity proportional to the size
    // Should interactors return to the center
    NUM_ATTRACTORS = Math.floor(Reality['field-cardinality']*Reality['field-balance'])
    for (var i = 0; i < NUM_ATTRACTORS; i++){
    Entities.push(add_components(Entity(label='Interactor'),[InfluencedByField( 1,Reality.between_interactors_interaction),Returnable(x='random',y='random',vx='random',vy='random'),ExertsField( 1,Reality.FieldIntensity),Collides('bounce'),Position(x=Reality.randpos()[0],y=Reality.randpos()[1]),Velocity(randsign()*randint(Reality.interactor_min_vel,Reality.interactor_max_vel),randsign()*randint(Reality.interactor_min_vel,Reality.interactor_max_vel),Reality.interactor_min_vel,Reality.interactor_max_vel),Acceleration(0,0),Appearance(shape='circle',x=Reality.interactor_size_k*Reality['puck-dim'],y=Reality.interactor_size_k*Reality['puck-dim'],color='#FF0000')]))
    }
    NUM_REPULSORS = Math.ceil(Reality['field-cardinality']*(1-Reality['field-balance']))
    for (var i = 0; i < NUM_REPULSORS; i++){
    Entities.push(add_components(Entity(label='Interactor'),[InfluencedByField(-1,Reality.between_interactors_interaction),Returnable(x='random',y='random',vx='random',vy='random'),ExertsField(-1,Reality.FieldIntensity),Collides('bounce'),Position(x=Reality.randpos()[0],y=Reality.randpos()[1]),Velocity(randsign()*randint(Reality.interactor_min_vel,Reality.interactor_max_vel),randsign()*randint(Reality.interactor_min_vel,Reality.interactor_max_vel),Reality.interactor_min_vel,Reality.interactor_max_vel),Acceleration(0,0),Appearance(shape='circle',x=Reality.interactor_size_k*Reality['puck-dim'],y=Reality.interactor_size_k*Reality['puck-dim'],color='#0000FF' )]))
        }
}

function collector(Reality,Entities){
Reality.Collisionables = collectItems(Entities,'"Collisionable" in item.components')
Reality.Pucks = collectItems(Entities,'item.label.includes("Puck")')
Reality.Exerters = collectItems(Entities,'"ExertsField" in item.components')
Reality.Influenceds = collectItems(Entities,'"InfluencedByField" in item.components')
Reality.Strikers = collectItems(Entities,'"TrackScore" in item.components')
}

function restart(){
    Entities=[];populate(Reality,Entities),collector(Reality,Entities)
    return Reality,Entities
}
function toggle_pause(){
    Reality.pause=!Reality.pause
}
function config(Reality={},Entities=[]){
    
    Reality.background=0
    Reality.timedelta=1
    Reality.scale_x=0.9
    Reality.scale_y=0.9
    Reality['width']=function(){return width*Reality.scale_x}() // maybe later do some wall-based metrics?
    Reality['height']=function(){return height*Reality.scale_y}()
    Reality['offset_x']=function(){return Reality.width*(1-Reality.scale_x)/2}()
    Reality['offset_y']=function(){return Reality.height*(1-Reality.scale_y)/2}()
    Reality['get_centerx']=function(){return Reality.offset_x + Reality.width/2}
    Reality['get_centery']=function(){return Reality.offset_y + Reality.height/2}
    Reality['wall-border-ratio']=1/64
    Reality['puck-dim']=1/32*Math.min(Reality.width,Reality.height)
    Reality['non-goal'] = 1/5
    Reality['striker-dim']=1/6
    Reality['field-balance']=0.5 // Balance between attractors and repulsors
    Reality['field-cardinality']= 4//total number of attractors + repulsors
    Reality['border']=100//1/3*Math.min(Reality.width,Reality.height)
    Reality['max-accel']=1
    Reality.maxvel=Math.min(Reality.width,Reality.height)*Reality["wall-border-ratio"]
    Reality.minvel=Reality.maxvel*0.3
    Reality['striker-speed']=Reality.maxvel*0.6
    Reality['FieldIntensity']=5000
    Reality.no_action_radii=10
    Reality.randpos=function(){return [randint(Reality.offset_x,Reality.width),randint(Reality.offset_y,Reality.height)]} // Maybe add offset to avoid wall clipping, using the wall border or the radius of particles
    Reality.striker_up_control = 'cpu'
    Reality.striker_down_control = 'cpu'
    GAP = Reality['non-goal']
    NOGAP = Reality['striker-dim']
    Reality.interactor_vel_k=1;//interactor initial velocity modifier
    Reality.interactor_max_vel = Reality.maxvel*Reality.interactor_vel_k
    Reality.interactor_min_vel = Reality.minvel*Reality.interactor_vel_k
    Reality.interactor_size_k = 1.3
    Reality.between_interactors_interaction = 1;//interactor-interactor interactions boolean
    Reality['foo_restart']=function(){restart()};
    Reality.pause = false
    Reality.foo_toggle_pause = function(){toggle_pause()};
    return Reality,Entities
}

function handle_strikers_control(){
    console.log('handle_strikers_control')
    stkup = collectItems(Entities,'"label" in item && item.label === "Striker_Up"')[0]
    stkdw = collectItems(Entities,'"label" in item && item.label === "Striker_Down"')[0]
    if (Reality.striker_up_control.includes('cpu')){
        console.log('to bot')
        delete_components(Entities[stkup],["keyControllable"])
        add_components(Entities[stkup],[Botsify(speed="global")])
    }
    else{
        console.log('to ad')
        delete_components(Entities[stkup],["Botsify"])
        add_components(Entities[stkup],[keyControllable("ad")])
    }
    if (Reality.striker_down_control.includes('cpu')){
        console.log('to bot')
        delete_components(Entities[stkdw],["keyControllable"])
        add_components(Entities[stkdw],[Botsify(speed="global")])
    }
    else{
        console.log('to jl')
        delete_components(Entities[stkdw],["Botsify"])
        add_components(Entities[stkdw],[keyControllable("jl")])
    }

}
explanation_str="Description:\nSo, imagine ping-pong (or air-hockey) but with charged particles... In other words, a game-field with attraction-repulsion fields inside. This is sort of what is happening here.\n\nInstructions:\n0.The ping-pong ball is the green one. Red and Blue circles just attract and repel respectively.\n1.Click on 'Open Controls' to edit gameplay.\n2.For Human Playing Click on 'Strikers' and choose anything besides cpu for each side.\n3.You can experiment by clicking on 'Attractors and Repulsors' and then click on 'Repopulate with settings'.\n4.Enjoy!"
window.alert(explanation_str)

function setup() {
    createCanvas(windowWidth, windowHeight);
    config(Reality,Entities)
    background(Reality.background);

    
    populate(Reality,Entities)
    collector(Reality,Entities)
    let gui = new dat.GUI({ autoPlace: true, width: width/4 });
    var InteractorFolder = gui.addFolder('Attractors and Repulsors');
    InteractorFolder.add(Reality,'FieldIntensity',100,100000).name('Max Field Intensity');
    InteractorFolder.add(Reality,'field-cardinality',0,100).name('Number of Attractors + Repulsors')
    InteractorFolder.add(Reality,'field-balance',0,1).name('Ratio of Attractors (Repulsors Ratio = 1 - this)').step(0.1)
    var StrikersFolder = gui.addFolder('Strikers');
    var striker_up_control_option=StrikersFolder.add(Reality,'striker_up_control',['cpu','A/D on keyboard']).name('Top Striker Control').setValue("cpu")
    var striker_down_control_option=StrikersFolder.add(Reality,'striker_down_control',['cpu','J/L on keyboard']).name('Bottom Striker Control').setValue("cpu")
    striker_up_control_option.onChange(handle_strikers_control)
    striker_down_control_option.onChange(handle_strikers_control)
    gui.add(Reality,'foo_toggle_pause').name('Pause/Unpause')
    gui.add(Reality,'foo_restart').name('Repopulate with settings')
}

  function draw() {

    
    if (!Reality.pause){
    background(Reality.background); // commenting this will leave a trail for every moving object

    Entities.forEach((item,index) =>{
        RenderSystem(item);
        keyControlSystem(item,Reality)
        BotSystem(item,Reality,Entities);
        CollisionSystem(item,index,Reality,Entities);//Must be after Control and bots for collisions against walls work
        MoveSystem(item,Reality.timedelta,Reality);
        ReturnSystem(item,Reality,Entities)
        FieldSystem(item,index,Reality,Entities)
        ShowScoreSystem(item)
    });
    }
  }
  