var btnMasquer;
var btnChargement;
var imageMasque;
var masqueVisible = true;
var input;
var intervalIDLoadImage;
var debutListe = 0;
var indiceListe;
var indiceImages;
var divImgPrinc;
var imageCourante;
var nbPoints =0;
var indiceImageCourante;
var pointsEllipse;
var annotationsStockees;
var stage;
var ptsLigne;
var poly;
var layer;
var nbElem;
var oldPos;
var ellipseCliquee = 0;
var niveauZoom =1;
var initialPosStage;
var preDragPosStage;

var modeCanvas = 0;
/*
* 0 : mode libre
* 1 : ajout ligne
* 2 : ajout ellipse
* 3 : zone polygonale fermée
* 4 : Correction
* */

var selected = [];
var listeImages = [];

window.onload = init;


function masquerMasque() {

    if (masqueVisible) {
        masqueVisible = false;
        document.getElementById('divCanvas').style.visibility = 'hidden';
        document.getElementById('imageCourante').style.visibility = 'visible';
        document.getElementById('btnMasquer').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
    } else {
        masqueVisible = true;
        document.getElementById('divCanvas').style.visibility = 'visible';
        document.getElementById('imageCourante').style.visibility = 'hidden';
        document.getElementById('btnMasquer').className = "btn btn-outline-dark btn-rounded btn-lg";
    }
}

function init() {
    btnMasquer = document.getElementById('btnMasquer');
    imageMasque = document.getElementById('imageMasque');
    btnChargement = document.getElementById('btnChargement');
    divImgPrinc = document.getElementById('divImagePrincipale');
    imageCourante = document.getElementById('imageCourante');

    document.getElementById('btnDefileHaut').addEventListener('click',defileHaut);
    document.getElementById('btnDefileBas').addEventListener('click',defileBas);
    document.getElementById('btnSupprImage').addEventListener('click',supprImages);
    document.getElementById('btnCorrectionn').addEventListener('click', function () {
        if(modeCanvas == 4){
            modeCanvas = 0;
            document.getElementById('btnCorrectionn').className = "btn btn-outline-dark btn-rounded btn-lg";
            if(niveauZoom != 1)
                stage.draggable(true);
            for(var shape in layer.getChildren()) {
                shape.draggable(false);
            }
            ellipseCliquee = 0;
            var trns = layer.getChildren(function (node) {
                return node.getClassName() === 'Transformer';
            })[0];
            trns.destroy();
            layer.draw();

        }else{
            boutonsOff();
            modeCanvas = 4;
            document.getElementById('btnCorrectionn').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
            stage.draggable(false);
            for(var i = 0; i < layer.getChildren().length; ++i) {
                layer.getChildren()[i].draggable(true);
            }
        }
    });
    document.getElementById('btnAjoutLigne').addEventListener('click',function(){
        if(modeCanvas == 1){
            modeCanvas = 0;
            document.getElementById('btnAjoutLigne').className = "btn btn-outline-dark btn-rounded btn-lg";
        }else{
            modeCanvas = 1;
            boutonsOff();
            document.getElementById('btnAjoutLigne').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
        }
    }, false);
    document.getElementById('btnAjoutEllipse').addEventListener('click',function(){
        if(modeCanvas == 2){
            modeCanvas = 0;
            document.getElementById('btnAjoutEllipse').className = "btn btn-outline-dark btn-rounded btn-lg";
        }else{
            modeCanvas = 2;
            boutonsOff();
            document.getElementById('btnAjoutEllipse').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
            pointsEllipse = [];
        }
    }, false);
    document.getElementById('btnAjoutZoneFermee').addEventListener('click',function(){
        if(modeCanvas == 3){
            modeCanvas = 0;
            document.getElementById('btnAjoutZoneFermee').className = "btn btn-outline-dark btn-rounded btn-lg";
        }else{
            modeCanvas = 3;
            boutonsOff();
            document.getElementById('btnAjoutZoneFermee').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
        }
    }, false);
    document.getElementById('btnValider').addEventListener(('click'), function () {
        // $("body").append("<a href='" + stage.toDataURL() + "' id='DLCanvas' download='annotation" + indiceImageCourante + ".jpg'>");
        maskArcs();
        var y = document.getElementById("DLCanvas");
        y.href = stage.toDataURL();
        showArcs();
        y.download = 'annotation' + indiceImageCourante + '.jpg'

        y.addEventListener('change', downloadimage, false);
        annotationsStockees = [];
        y.click();
    });

    document.getElementById('btnZoomPlus').addEventListener(('click'), function () {
        if(niveauZoom <8) {
            niveauZoom*=2;
            var layerBkg = stage.getLayers()[0];
            layerBkg.scale({x: niveauZoom, y: niveauZoom});
            layer.scale({x: niveauZoom, y: niveauZoom});
            stage.draggable(true);
            stage.dragBoundFunc(function (pos) {
                var newX;
                var newY;
                if(pos.x > 0) {
                    newX =0;
                } else {
                    if(pos.x < -stage.width()*(niveauZoom-1)) {
                        newX = -stage.width()*(niveauZoom-1);
                    } else {
                        newX = pos.x;
                    }
                }

                if(pos.y > 0) {
                    newY =0;
                } else {
                    if(pos.y < -stage.height()*(niveauZoom-1)) {
                        newY = -stage.height()*(niveauZoom-1);
                    } else {
                        newY = pos.y;
                    }
                }

                return {
                    x: newX,
                    y: newY,
                };
            });

            layerBkg.draw();
            layer.draw();
        }
    });

    document.getElementById('btnZoomMoins').addEventListener(('click'), function () {
        if(niveauZoom > 1) {
            niveauZoom/=2;
            var layerBkg = stage.getLayers()[0];
            layerBkg.scale({x: niveauZoom, y: niveauZoom});
            layer.scale({x: niveauZoom, y: niveauZoom});
            stage.x(initialPosStage[0]);
            stage.y(initialPosStage[1]);
            layerBkg.draw();
            layer.draw();
            if(niveauZoom == 1) {
                stage.draggable(false);
            }
        }
    });

    btnMasquer.addEventListener('click', masquerMasque);
    btnChargement.addEventListener('click', load1Picture);

    initCanvas();
    document.getElementById('btnAnnuler').addEventListener('click', annulerAnnotation);

    imageCourante.addEventListener('load', function () {
        var canvasWidth = this.clientWidth;
        var canvasHeight = this.clientHeight;
        stage = new Konva.Stage({
            container: 'divCanvas',
            width: canvasWidth,
            height: canvasHeight
        });
        initialPosStage = [stage.x(), stage.y()];
        var layerBkgrd = new Konva.Layer();
        var imgBkgrd = new Image();
        imgBkgrd.src = this.src;
            var rect = new Konva.Rect( {
                x: 0,
                y: 0,
                width: canvasWidth,
                height: canvasHeight,
                fillPatternImage:imgBkgrd,
                fillPatternRepeat: 'no-repeat',
                fillPatternScaleX: canvasWidth/imgBkgrd.width,
                fillPatternScaleY: canvasHeight/imgBkgrd.height,
                id: 'imgBackground',
            });
        layerBkgrd.add(rect);
        stage.add(layerBkgrd);
        layerBkgrd.draw();
        layer = new Konva.Layer();
        stage.add(layer);

    }, false);



    for(var i = 1; i<5; ++i) {
        document.getElementById("imageL"+i).addEventListener('dblclick', function (e) {
            document.getElementById('imageCourante').src = e.target.src;
            indiceImageCourante = debutListe + parseInt(e.target.id.charAt(e.target.id.length-1));
        });
        document.getElementById("imageL"+i).addEventListener('click',
            function (e) {
                var indiceFic = parseInt(e.target.id.charAt(e.target.id.length-1));
                if(indiceFic<=listeImages.length) {
                    indiceFic += debutListe - 1;
                    if (!e.target.className.includes("thumbnail")) {
                        e.target.className = "img-fluid img-thumbnail";
                        selected.push(listeImages[indiceFic]);
                    } else {
                        e.target.className = "img-fluid border";
                        selected.splice(selected.indexOf(listeImages[indiceFic]), 1);
                    }
                }
            });
    }
    nbElem = 0;
}

function load1Picture() {

    $("body").append("<input type='file' id='explorerChargement' accept='image/*' multiple>");
    input = document.getElementById('explorerChargement');

    var y = document.getElementById("explorerChargement");
    y.addEventListener('change', loadimage, false);
    input.click();
}

function imageHandler(e2)
{
    var idImg = 'imageL'+indiceImages;
    document.getElementById(idImg).src = e2.target.result;
    ++indiceImages;
}

function loadimage(e1)
{
    for(var i = 0; i < e1.target.files.length; ++i) {
        listeImages.push(e1.target.files[i]);
    }
    afficheListeImages();
    document.getElementById("explorerChargement").remove();
}

function asyncLoadImage() {
    if(indiceListe == debutListe + 4 || indiceListe == listeImages.length) {
        clearInterval(intervalIDLoadImage);
    } else {
        var fr = new FileReader();
        fr.onload = imageHandler;
        var filename = listeImages[indiceListe];
        fr.readAsDataURL(filename);
        ++indiceListe;
    }
}

function afficheListeImages() {
    indiceImages = 1;
    indiceListe = debutListe;
    intervalIDLoadImage = setInterval(asyncLoadImage, 100);
}

function defileHaut() {
    var id;
    var idSuiv = "imageL1";
    if(debutListe < listeImages.length - 4) {
        for (var i = 2; i<5; i++) {
            id=idSuiv;
            idSuiv = "imageL"+i;
            document.getElementById(id).src = document.getElementById(idSuiv).src;
        }
        var fr = new FileReader();
        fr.onload = imageHandler;
        var filename = listeImages[debutListe+4];
        indiceImages = 4;
        fr.readAsDataURL(filename);
        debutListe++;
    }
}

function defileBas() {
    var id="imageL4";
    var idPrec;
    if(debutListe <= listeImages.length - 4 && debutListe > 0) {
        debutListe--;
        for (var i = 3; i>0; i--) {
            idPrec=id;
            id = "imageL"+i;
            document.getElementById(idPrec).src = document.getElementById(id).src;
        }
        var fr = new FileReader();
        fr.onload = imageHandler;
        var filename = listeImages[debutListe];
        indiceImages = 1;
        fr.readAsDataURL(filename);
    }
}

function supprImages() {

    while(selected.length != 0){
        listeImages.splice(listeImages.indexOf(selected.shift()),1);
    }
    afficheListeImages();
    for(var i=1;i<5;++i) {
        var id = "imageL"+i;
        document.getElementById(id).className = "img-fluid";
    }
}

function findPos(obj) {
    var curleft = 0, curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}

function initCanvas() {

    var divCanvas = document.getElementById('divCanvas');

    divCanvas.addEventListener('click',function(e) {
        var pos = findPos(this);
        var x = e.pageX - pos.x-20;
        var y = e.pageY - pos.y-20;
        x -= stage.x();
        y -= stage.y();
        x = x/niveauZoom;
        y = y/niveauZoom;
        switch(modeCanvas) {
            case 3:
            case 1:
                if(nbPoints == 0) {

                    ptsLigne = [];
                    ptsLigne.push(x);
                    ptsLigne.push(y);
                    poly = new Konva.Line({
                        points: ptsLigne,
                        stroke: 'blue',
                        strokeWidth: 1,
                        // draggable: true,
                        id: nbElem,
                    });
                    poly.on('dragend', function () {
                        var circles = layer.getChildren(function(node){
                            return node.getClassName() === 'Arc';
                        });
                        var idLigne = this.attrs['id'];
                        var diffX = this.attrs['x']  - oldPos[0];
                        var diffY = this.attrs['y'] - oldPos[1];

                        this.attrs['x'] = oldPos[0];
                        this.attrs['y'] = oldPos[1];
                        circles = circles.filter(circle => circle.attrs['id'].split('-')[0] == idLigne);

                        while(circles.length != 0) {
                            circles.shift().destroy();
                        }
                        for(i = 0; i< this.points().length; ++i) {
                            var idCircle = this.attrs['id']+'-'+i;
                            createDot(this.points()[i]+diffX, this.points()[++i]+diffY, idCircle);
                        }
                        layer.draw();
                    });
                    poly.on('dragstart', function () {
                        oldPos = [this.x(), this.y()];
                    });
                    nbElem++;
                    layer.add(poly);


                    if(modeCanvas == 3) {
                        poly.closed(true);
                    }
                }
                else {
                    poly.points(poly.points().concat([x, y]));
                }
                var idCircle = poly.attrs['id']+'-'+nbPoints;
                nbPoints++;
                createDot(x,y,idCircle);




                break;
            case 2:
                pointsEllipse.push([x,y]);

                if(pointsEllipse.length == 3) {
                    // Abscisse, ordonnée, rayon abscisse, rayon ordonnée, rotation, début, fin
                    var centreX = pointsEllipse[0][0];
                    var centreY = pointsEllipse[0][1];
                    var rayX = distance(pointsEllipse[0], pointsEllipse[1]);
                    var rayY = distance(pointsEllipse[0],pointsEllipse[2]);

                    var elli = new Konva.Ellipse({
                        x:centreX,
                        y:centreY,
                        radiusX:rayX,
                        radiusY:rayY,
                        stroke: 'blue',
                        strokeWidth: 1,
                        // draggable: true,
                    });
                    layer.add(elli);

                    elli.on('dblclick', function () {
                        if(modeCanvas == 4) {
                            if(ellipseCliquee) {
                                ellipseCliquee = 0;
                                var trns = layer.getChildren(function (node) {
                                    return node.getClassName() === 'Transformer';
                                })[0];
                                trns.destroy();
                                layer.draw();
                            } else {
                                ellipseCliquee = 1;
                                var tr = new Konva.Transformer({
                                    boundBoxFunc: function (oldBoundBox, newBoundBox) {
                                        // "boundBox" is an object with
                                        // x, y, width, height and rotation properties
                                        // transformer tool will try to fit nodes into that box

                                        // the logic is simple, if new width is too big
                                        // we will return previous state
                                        if (Math.abs(newBoundBox.width) > 800) {
                                            return oldBoundBox;
                                        }

                                        return newBoundBox;
                                    },
                                });

                                layer.add(tr);
                                tr.attachTo(elli);
                                layer.draw();
                            }
                        }

                    });
                    layer.draw();
                    modeCanvas = 0;
                    document.getElementById('btnAjoutEllipse').className = "btn btn-outline-dark btn-rounded btn-lg";
                }
                break;
            default:
                var pos = findPos(this);
                var x = e.pageX - pos.x -20;
                var y = e.pageY - pos.y-20;
                var coord = "x=" + x + ", y=" + y;
                console.log(coord);
        }
    }, false);


    divCanvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        switch(modeCanvas) {
            case 1:
                nbPoints = 0;
                break;
            case 3:
                nbPoints = 0;
                break;
            default:
                console.log("bla");
        }
    })
}

function downloadimage() {
    document.getElementById("DLCanvas").remove();
    nbPoints = 0;
}

function distance(pt1, pt2) {
    var x = pt1[0] - pt2[0];
    var y = pt1[1] - pt2[1];
    return Math.sqrt(x*x+y*y);
}


function annulerAnnotation() {
    if(modeCanvas != 4) {
        var children = layer.getChildren();
        var last = children[children.length - 1];
        if (last.getClassName() == 'Arc') {
            var lines = layer.getChildren(function (node) {
                return node.getClassName() === 'Line'
            });
            var line = lines[lines.length - 1];
            line.points().pop();
            line.points().pop();
            children.pop();
            if (line.points().length == 2 && modeCanvas != 1 && modeCanvas != 3) {
                children.pop();
                children.pop();
            }
        } else {
            children.pop();
        }
        layer.draw();
    }
}


function boutonsOff() {
    document.getElementById('btnAjoutLigne').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnAjoutZoneFermee').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnAjoutEllipse').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnSupprImage').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnCorrectionn').className = "btn btn-outline-dark btn-rounded btn-lg";
    nbPoints = 0;
}

function createDot(x, y, idCircle) {
    var circle = new Konva.Arc({
        x: x,
        y: y,
        outerRadius: 4,
        angle: 360,
        stroke: 'red',
        strokeWidth: 2,
        id: idCircle,
    });
    circle.on('dragmove', function () {
        boutonsOff();
        var pos = stage.getPointerPosition();
        var posx =  pos.x;
        var posy =  pos.y;
        posx -= stage.x();
        posy -= stage.y();
        posx = posx/niveauZoom;
        posy = posy/niveauZoom;

        var id = this.attrs['id'];

        var ligne = parseInt(id.split('-')[0]);
        var points = parseInt(id.split('-')[1]);
        var lines = layer.getChildren(function(node){
            return node.getClassName() === 'Line';
        });
        lines[ligne].points()[2*points] = posx;
        lines[ligne].points()[2*points+1] = posy;
    });
    layer.add(circle);
    layer.draw();
}

function maskArcs() {
    var arcs = layer.getChildren(function (node) {
        return node.getClassName() === 'Arc';
    });

    arcs.hide();
}

function showArcs() {
    var arcs = layer.getChildren(function (node) {
        return node.getClassName() === 'Arc';
    });

    arcs.show();
    layer.draw();
}


function extractFromVideo() {

    var canvas = document.getElementById('canvas');


}