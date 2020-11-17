PIXI.Renderer.registerPlugin('tilemap', pixi_tilemap.TileRenderer);
var renderer = PIXI.autoDetectRenderer({ width: 800, height: 600 });
document.body.appendChild(renderer.view);

var stage, tilemap;

var loader = new PIXI.Loader();
loader.add('atlas', 'public/basic/atlas.json');
loader.add('button', 'public/basic/button.png');
loader.load(function (loader, resources) {
    //first parameter means z-layer, which is not used yet
    //second parameter is list of textures for layers
    stage = new PIXI.Container();
    tilemap = new PIXI.tilemap.CompositeRectTileLayer();
    stage.addChild(tilemap);

    animate();

    var frame = 0;
    buildTilemap(frame++);

    var pic = new PIXI.Sprite(resources['button'].texture);
    pic.position.set(200, 100);
    stage.addChild(pic);
    // ==== Old way to build animations: Rebuild tilemap every frame
    function animRebuild() {
        buildTilemap(frame++)
    }

    // ==== New way: animate shader
    function animShader() {
        // animate X frames
        renderer.plugins.tilemap.tileAnim[0] = frame;
        // animate Y frames
        renderer.plugins.tilemap.tileAnim[1] = frame;
        frame++;
    }

    setInterval(animShader, 400);
});

function buildTilemap(frame) {
    //Clear everything, like a PIXI.Graphics
    tilemap.clear();
    var resources = loader.resources;

    var size = 32;
    // if you are too lazy, just specify filename and pixi will find it in cache
    for (var i = 0; i < 7; i++)
        for (var j = 0; j < 5; j++) {
            tilemap.addFrame("grass.png", i * size, j * size);
            if (i % 2 == 1 && j % 2 == 1)
                tilemap.addFrame("tough.png", i * size, j * size);
        }

    // if you are lawful citizen, please use textures from
    var textures = resources.atlas.textures;
    tilemap.addFrame(textures["brick.png"], 2 * size, 2 * size);
    tilemap.addFrame(textures["brick_wall.png"], 2 * size, 3 * size);

    //chest will be animated!
    //old way: animate on rebuild
    // tilemap.addFrame(textures[frame % 2 == 0 ? "chest.png" : "red_chest.png"], 4 * size, 4 * size);

    // new way: animate on shader: 2 frames , X offset is 32 , "red_chest" is exactly 34 pixels right in the atlas
    tilemap.addFrame(textures["chest.png"], 4 * size, 4 * size).tileAnimX(34, 2);

    // button does not appear in the atlas, but tilemap wont surrender, it will create second layer for special for buttons
    // buttons will appear above everything
    tilemap.addFrame(resources.button.texture, 6 * size, 2 * size);
    // if you want rotations:
    // https://pixijs.io/examples-v4/#/textures/texture-rotate.js
    // textures should have frame, orig and trim to do that
    // canvas in pixi-tilemap does not work with rotate!!!!
    let origTex = textures["chest.png"];
    for (let i = 0; i < 8; i++) {
        const frame = origTex.frame.clone();
        const orig = origTex.orig.clone();
        const trim = origTex.orig.clone();
        const rotate = i * 2;
        if (rotate % 4 == 2) {
            orig.width = frame.height;
            orig.height = frame.width;
        }
        const tmpTex = new PIXI.Texture(origTex.baseTexture, frame, orig, trim, rotate);
        // Swap W and H in orig if you rotate%4 is not 0
        tilemap.addFrame(tmpTex, i % 4 * size, (i >> 2) * size + 5 * size);
        // rotate is also last parameter in addFrame
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(stage);
}
