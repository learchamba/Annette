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
var oldPos = [];
var ecartArcLigne = [];
var ellipseCliquee = 0;
var niveauZoom =1;
var initialPosStage;
var preDragPosStage;
var canvas;
var ctx;
var Parse;
var video;
var nbFrame;
var chargementVideo = false;
var hauteurInference = 270;
var largeurInference = 480;
var rapportImageInference;
var ecartPointsImportants = 10;
var lignesSuppr = [];
var mousedwn = true;
var ellipseFinished = false;
var ellipseTmp = undefined;
var cliqueDroit = false;

var modeCanvas = 0;
/*
* 0 : mode libre
* 1 : ajout ligne
* 2 : ajout ellipse
* 3 : ajout d'une zone polygonale fermée
* 4 : Correction
* 5 : Suppression d'annotation
* */

var selected = [];
var listeImages = [];
var listeMasques = [];

window.onload = init;

//Inits
function init() {
    btnMasquer = document.getElementById('btnMasquer');
    imageMasque = document.getElementById('imageMasque');
    btnChargement = document.getElementById('btnChargement');
    divImgPrinc = document.getElementById('divImagePrincipale');
    imageCourante = document.getElementById('imageCourante');

    /*
     censé empêcher l'anti aliasing sur l'image de base,
     ne change rien à part décaler la stage
    */
    // imageCourante.style = imageCourante.style + " image-rendering: optimizeSpeed; image-rendering: -moz-crisp-edges; image-rendering: -o-crisp-edges; image-rendering: -webkit-optimize-contrast; image-rendering: pixelated; image-rendering: optimize-contrast; -ms-interpolation-mode: nearest-neighbor; "

    document.getElementById('btnDefileHaut').addEventListener('click',defileHaut);
    document.getElementById('btnDefileBas').addEventListener('click',defileBas);
    document.getElementById('btnSupprImage').addEventListener('click',supprImages);
    document.getElementById('btnChargeVideo').addEventListener('click', extractFromVideo);
    document.getElementById('btnCorrection').addEventListener('click', function () {
        if(modeCanvas === 4){
            modeCanvas = 0;
            document.getElementById('btnCorrection').className = "btn btn-outline-dark btn-rounded btn-lg";
            if(niveauZoom != 1)
                stage.draggable(true);
            for(var i = 0; i < layer.getChildren().length; ++i) {
                layer.getChildren()[i].draggable(false);
            }
            ellipseCliquee = 0;
            var trns = layer.getChildren(function (node) {
                return node.getClassName() === 'Transformer';
            })[0];
            if(trns){
                trns.destroy();
            }
            layer.draw();

        }else{
            boutonsOff();
            modeCanvas = 4;
            document.getElementById('btnCorrection').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
            stage.draggable(false);
            let circles = getAllDots();
            for(var i = 0; i < circles.length; ++i) {
                circles[i].draggable(true);
            }
        }
    });

    document.getElementById('btnAjoutLigne').addEventListener('click',function(){
        if(modeCanvas === 1){
            modeCanvas = 0;
            document.getElementById('btnAjoutLigne').className = "btn btn-outline-dark btn-rounded btn-lg";
        }else{
            modeCanvas = 1;
            boutonsOff();
            document.getElementById('btnAjoutLigne').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
        }
    }, false);

    document.getElementById('btnAjoutEllipse').addEventListener('click',function(){
        if(modeCanvas === 2){
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
        if(modeCanvas === 3){
            modeCanvas = 0;
            document.getElementById('btnAjoutZoneFermee').className = "btn btn-outline-dark btn-rounded btn-lg";
        }else{
            modeCanvas = 3;
            boutonsOff();
            document.getElementById('btnAjoutZoneFermee').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
        }
    }, false);


    document.getElementById('btnSupprAnnotation').addEventListener(('click'), function () {
        if(modeCanvas === 5)  {
            modeCanvas = 0;
            document.getElementById('btnSupprAnnotation').className = "btn btn-outline-dark btn-rounded btn-lg";
        }
        else {
            boutonsOff();
            modeCanvas = 5;
            document.getElementById('btnSupprAnnotation').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
        }
    });

    document.getElementById('btnValider').addEventListener(('click'), function () {
        // $("body").append("<a href='" + stage.toDataURL() + "' id='DLCanvas' download='annotation" + indiceImageCourante + ".jpg'>");
        maskArcs();
        var y = document.getElementById("DLCanvas");
        var wantType = "image/bmp";
        // let data = layer.getContext().getImageData();
        // data = realiasing(data);
        // layer.getContext().putImageData(data);
        layer.filters([Konva.Filters.Threshold]);
        layer.threshold(1);
        layer.draw();
        var dataUri = stage.toCanvas().toDataURL(wantType);
        if (dataUri.indexOf(wantType) < 0) {
            y.href = stage.toDataURL('image/png');
            y.download = 'annotation' + indiceImageCourante + '.png'
        } else {
            y.href = dataUri;
            y.download = 'annotation' + indiceImageCourante + '.bmp'
        }
        y.addEventListener('change', downloadimage, false);
        annotationsStockees = [];
        y.click();
        showArcs();
    });

    document.getElementById('btnZoomPlus').addEventListener(('click'), function () {
        if(niveauZoom <8) {
            niveauZoom*=2;
            var layerBkg = stage.getLayers()[0];
            layerBkg.scale({x: niveauZoom, y: niveauZoom});
            layer.scale({x: niveauZoom, y: niveauZoom});
            if(modeCanvas != 4)
                stage.draggable(true);


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
            if(niveauZoom === 1) {
                stage.draggable(false);
            }
            imageCourante.scale
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
        // layerBkgrd.getContext().imageSmoothingEnabled = false;
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

        stage.on('mousedown', function(e) {
            if(modeCanvas == 4) {
                if(e.target.getClassName() !== 'Arc') {
                    let clickPos = stage.getPointerPosition();
                    let x = (clickPos.x  - stage.x()) / niveauZoom;
                    let y = (clickPos.y  - stage.y()) / niveauZoom;
                    let allCircles = getAllDots();
                    let founded = false;
                    for(let i = 0; !founded && i < allCircles.length; ++i) {
                        if(distance([x, y], [allCircles[i].x(), allCircles[i].y()]) < allCircles[i].outerRadius()) {
                            allCircles[i].startDrag();
                            founded = true;
                        }
                    }
                }
            }
        });

        stage.on('contextmenu', function (e) {
            cliqueDroit = true;
            e.evt.preventDefault();
            switch(modeCanvas) {
                case 1:
                case 3:
                    nbPoints = 0;
                    break;
                case 4:
                    let clickPos = stage.getPointerPosition();
                    clickPos.x = (clickPos.x  - stage.x()) / niveauZoom;
                    clickPos.y = (clickPos.y  - stage.y()) / niveauZoom;
                    let allCircles = getAllDots();
                    let founded = false;
                    for(let i = 0; !founded && i < allCircles.length; ++i) {
                        if(distance([clickPos.x, clickPos.y], [allCircles[i].x(), allCircles[i].y()]) < allCircles[i].outerRadius()) {
                            e.target = allCircles[i];
                            founded = true;
                        }
                    }
                    if(e.target.getClassName() === "Arc") {
                        e.target.destroy();
                        let id = e.target.attrs['id'];
                        let ligne = parseInt(id.split('-')[0]);
                        let points = parseInt(id.split('-')[1]);
                        let lines = layer.getChildren(function(node){
                            return node.getClassName() === 'Line';
                        });
                        decaleIDCercles(-1, points, ligne);

                        lines[ligne].points().splice(2*points, 2);
                        layer.draw();
                    } else if(e.target.getClassName() === "Line") {
                        if(e.target.closed()) {
                            let line = e.target;
                            let idLigne = line.attrs['id'];
                            let clickPos = stage.getPointerPosition();
                            clickPos.x = (clickPos.x  - stage.x()) / niveauZoom;
                            clickPos.y = (clickPos.y  - stage.y()) / niveauZoom;
                            let deleted = false;
                            let i = 0;
                            let pts = line.points();
                            while(!deleted && i < pts.length - 3) {
                                let v1 = [pts[i] - clickPos.x, pts[i + 1] - clickPos.y];
                                let v2 = [pts[i + 2] - clickPos.x, pts[i + 3] - clickPos.y];
                                let angle = getAngle(v1, v2);
                                if(sontEnvironEgalesProportionnelles(angle, 180)) {
                                    let newPointsDeb = pts.slice(i + 2);
                                    line.points(newPointsDeb.concat(line.points().slice(0, i + 2)));
                                    line.closed(false);
                                    let circles = getDots(idLigne);
                                    for(let j = circles.length - 1; j >= 0; --j) {
                                        circles[j].destroy();
                                    }
                                    for(let j = 0; j < line.points().length; j += 2) {
                                        let idCercle = idLigne + '-' + j / 2;
                                        createDot(line.points()[j], line.points()[j + 1], idCercle);
                                    }
                                    deleted = true;
                                } else {
                                    i += 2;
                                }
                            }

                            if(line.closed() && !deleted && i == pts.length - 2) {
                                let v1 = [pts[pts.length - 2] - clickPos.x, pts[pts.length - 1] - clickPos.y];
                                let v2 = [pts[0] - clickPos.x, pts[1] - clickPos.y];
                                let angle = getAngle(v1, v2);
                                if(sontEnvironEgalesProportionnelles(angle, 180)) {
                                    line.closed(false);
                                    layer.draw();
                                }
                            }
                            /*
                             Ouverture de la figure fermée en coupant les points
                             à l'endroit de la section de la ligne et en les
                             concaténant à l'autre bout
                            */
                        } else {
                            clickPos.x = (clickPos.x  - stage.x())/ niveauZoom;
                            clickPos.y = (clickPos.y  - stage.y())/ niveauZoom;
                            let deleted = false;
                            let i = 0;
                            let pts = e.target.points();
                            while(!deleted && i < pts.length - 3) {
                                let a = (pts[i+1] - pts[i+3]) / (pts[i] - pts[i+2]);
                                let b = pts[i+1] - a * pts[i];

                                if(sontEnvironEgales(clickPos.y, a*clickPos.x + b)) {
                                    let prodScal1 = pts[i] * clickPos.y - pts[i + 1] * clickPos.x;
                                    let prodScal2 = pts[i + 2] * clickPos.y - pts[i + 3] * clickPos.x;
                                    if(prodScal1 * prodScal2 < 0) {
                                        if(i + 3 == pts.length - 1) {
                                            e.target.points().pop();
                                            e.target.points().pop();
                                            let circles = getDots(e.target.attrs['id']);
                                            circles[circles.length - 1].destroy();
                                        } if(i == 0) {
                                            e.target.points().shift();
                                            e.target.points().shift();
                                            let circles = getDots(e.target.attrs['id']);
                                            circles[0].destroy();
                                        } else {
                                            let pointsLigne1 = pts.slice(0, i+2);
                                            let pointsLigne2 = pts.slice(i+2);
                                            modeCanvas = 5;
                                            e.target.fire('click');
                                            document.getElementById('btnCorrection').click();

                                            let poly = creerLigne([pointsLigne1[0],pointsLigne1[1]]);
                                            nbPoints = 0;
                                            let idCircle = poly.attrs['id'] + '-' + nbPoints;
                                            ++nbPoints;
                                            createDot(pointsLigne1[0], pointsLigne1[1], idCircle);
                                            layer.add(poly);
                                            for(let j = 2; j < pointsLigne1.length; ++j) {
                                                let x = pointsLigne1[j];
                                                let y = pointsLigne1[++j];
                                                poly.points(poly.points().concat([x, y]));

                                                let idCircle = poly.attrs['id'] + '-' + nbPoints;
                                                ++nbPoints;
                                                createDot(x,y,idCircle);
                                            }
                                            layer.draw();

                                            poly = creerLigne([pointsLigne2[0],pointsLigne2[1]]);
                                            nbPoints = 0;
                                            idCircle = poly.attrs['id'] + '-' + nbPoints;
                                            ++nbPoints;
                                            createDot(pointsLigne2[0], pointsLigne2[1], idCircle);
                                            layer.add(poly);
                                            for(let j = 2; j < pointsLigne2.length; ++j) {
                                                let x = pointsLigne2[j];
                                                let y = pointsLigne2[++j];
                                                poly.points(poly.points().concat([x, y]));

                                                let idCircle = poly.attrs['id'] + '-' + nbPoints;
                                                ++nbPoints;
                                                createDot(x,y,idCircle);
                                            }
                                        }
                                        layer.draw();
                                        deleted = true;
                                    }
                                }
                                i+=2;
                            }
                        }
                    }
                    break;
                default:
                    console.log("Pas de clique droit dans ce mode.");
            }
        });

        var scaleBy = 1.05;

        stage.dragBoundFunc(function (pos) {
            var newX;
            var newY;
            if(pos.x > 0) {
                newX = 0;
            } else {
                if(pos.x < -stage.width()*(niveauZoom-1)) {
                    newX = -stage.width()*(niveauZoom-1);
                } else {
                    newX = pos.x;
                }
            }

            if(pos.y > 0) {
                newY = 0;
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

        stage.on('wheel', (e) => {
            e.evt.preventDefault();
            var oldScale = stage.scaleX();
            var pointer = stage.getPointerPosition();
            var mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
            };
            var newScale =
            e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            if(newScale >= 1 && newScale <= 8){
                niveauZoom = newScale;
                if(newScale == 1) {
                    stage.draggable(false);
                } else {
                    stage.draggable(true);
                }
            }
            stage.scale({ x: niveauZoom, y: niveauZoom });
            var newPos = {
            x: pointer.x - mousePointTo.x * niveauZoom,
            y: pointer.y - mousePointTo.y * niveauZoom,
            };
            if(oldScale > newScale) {
                let newX;
                let newY;
                let pos = newPos;
                if(pos.x > 0) {
                    newX = 0;
                } else {
                    if(pos.x < -stage.width()*(niveauZoom - 1)) {
                        newX = -stage.width()*(niveauZoom - 1);
                    }
                }
                if(newX != undefined) {
                    stage.x(newX);
                } else {
                    stage.x(newPos.x);
                }
                if(pos.y > 0) {
                    newY = 0;
                } else {
                    if(pos.y < -stage.height()*(niveauZoom - 1)) {
                        newY = -stage.height()*(niveauZoom - 1);
                    }
                }
                if(newY != undefined) {
                    stage.y(newY);
                } else {
                    stage.y(newPos.y);
                }
            } else {
                stage.position(newPos);
            }
            stage.batchDraw();
        });

    }, false);



    for(var i = 1; i<5; ++i) {
        document.getElementById("imageL"+i).addEventListener('dblclick', function (e) {
            document.getElementById('imageCourante').src = e.target.src;
            indiceImageCourante = debutListe + parseInt(e.target.id.charAt(e.target.id.length-1));
            nbElem = 0;

            chargerMasque();
        });
        document.getElementById("imageL"+i).addEventListener('click',
            function (e) {
                var indiceFic = parseInt(e.target.id.charAt(e.target.id.length-1));
                if(indiceFic <= listeImages.length) {
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
    initRaccourcis();
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
        if(ellipseTmp != undefined && pointsEllipse.length === 2) {
            ellipseTmp = undefined;
            ellipseFinished = true;
        }
        switch(modeCanvas) {
            case 3:
            case 1:
            if(nbPoints === 0) {

                ptsLigne = [];
                ptsLigne.push(x);
                ptsLigne.push(y);
                poly = creerLigne(ptsLigne);
                layer.add(poly);
                layer.draw();
            }
            else {
                poly.points(poly.points().concat([x, y]));
            }
            var idCircle = poly.attrs['id'] + '-' + nbPoints;
            nbPoints++;
            createDot(x,y,idCircle);


            break;
            case 2:
            while(pointsEllipse.length > 1
                && pointsEllipse[0][0] == pointsEllipse[1][0]
                && pointsEllipse[0][1] == pointsEllipse[1][1]) {
                    pointsEllipse.splice(1,1);
                }
                pointsEllipse.push([x,y]);
                ellipseFinished = false;

                if(pointsEllipse.length === 1) {
                    // Abscisse, ordonnée, rayon abscisse, rayon ordonnée, rotation, début, fin
                    var centreX = pointsEllipse[0][0];
                    var centreY = pointsEllipse[0][1];
                    var rayX = 2;//distance(pointsEllipse[0], pointsEllipse[1]);
                    var rayY = rayX;

                    var elli = new Konva.Ellipse({
                        x:centreX,
                        y:centreY,
                        radiusX:rayX,
                        radiusY:rayY,
                        stroke: 'blue',
                        strokeWidth: 1,
                    });
                    ellipseTmp = elli;
                    layer.add(elli);

                    stage.on('mousemove', function() {
                        if(ellipseTmp != undefined) {
                            if(pointsEllipse.length == 1) {
                                let clickPos = stage.getPointerPosition();
                                clickPos.x = (clickPos.x  - stage.x()) / niveauZoom;
                                clickPos.y = (clickPos.y  - stage.y()) / niveauZoom;
                                ellipseTmp.radiusY(distance(pointsEllipse[0], [clickPos.x, clickPos.y]));
                                ellipseTmp.radiusX(distance(pointsEllipse[0], [clickPos.x, clickPos.y]));
                                layer.draw();

                            } else if(pointsEllipse.length == 2) {
                                let clickPos = stage.getPointerPosition();
                                clickPos.x = (clickPos.x  - stage.x()) / niveauZoom;
                                clickPos.y = (clickPos.y  - stage.y()) / niveauZoom;
                                ellipseTmp.radiusY(distance(pointsEllipse[0], [clickPos.x, clickPos.y]));
                                layer.draw();
                                modeCanvas = 0;
                                document.getElementById('btnAjoutEllipse').className =
                                "btn btn-outline-dark btn-rounded btn-lg";
                            }
                        }
                    });

                    elli.on('dblclick', function () {
                        if(modeCanvas === 4) {
                            if(ellipseCliquee) {
                                ellipseCliquee = 0;
                                var trns = layer.getChildren(function (node) {
                                    return node.getClassName() === 'Transformer';
                                })[0];
                                trns.destroy();
                                layer.draw();
                                this.draggable(false);
                            } else {
                                ellipseCliquee = 1;
                                this.draggable(true);

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
                    elli.on('click', function () {
                        if( modeCanvas === 5) {
                            this.destroy();
                            layer.draw();
                            boutonsOff();
                            modeCanvas = 0;
                        }
                    });
                }
                break;
            case 4:

                break;

            default:
            var pos = findPos(this);
            var x = e.pageX - pos.x -20;
            var y = e.pageY - pos.y-20;
            var coord = "x=" + x + ", y=" + y;
        }
    }, false);

}

function initRaccourcis() {
    /* Raccourcis existants
    * c : mode correction
    * s : mode suppression
    * m : masquer les annotations
    * ctrl + s : valider l'annotation
    * ctrl + z : annuler la dernière annotation
    */

    let isC = false;
    $(document).keyup(function (e) {
        if(e.which == 67)
        isC=false;
    }).keydown(function (e) {
        if(e.which == 67)  {
            document.getElementById('btnCorrection').click();
            return false;
        }
    });


    let isS = false;
    $(document).keyup(function (e) {
        if(e.which == 83)
        isS=false;
    }).keydown(function (e) {
        if(e.which == 83)  {
            document.getElementById('btnSupprAnnotation').click();
            return false;
        }
    });

    let isM = false;
    $(document).keyup(function (e) {
        if(e.which == 77)
        isM=false;
    }).keydown(function (e) {
        if(e.which == 77)  {
            document.getElementById('btnMasquer').click();
            return false;
        }
    });

    let isCtrl = false;
    $(document).keyup(function (e) {
        if(e.which == 17)
        isCtrl=false;
    }).keydown(function (e) {
        if(e.which == 17)
        isCtrl=true;
        if(e.which == 83 && isCtrl == true) {
            document.getElementById('btnValider').click();
            document.getElementById('btnSupprAnnotation').click();
            return false;
        }
    });

    isCtrl = false;
    $(document).keyup(function (e) {
        if(e.which == 17)
        isCtrl=false;
    }).keydown(function (e) {
        if(e.which == 17)
        isCtrl=true;
        if(e.which == 90 && isCtrl == true) {
            document.getElementById('btnAnnuler').click();
            return false;
        }
    });
}

function boutonsOff() {
    document.getElementById('btnAjoutLigne').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnAjoutZoneFermee').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnAjoutEllipse').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnSupprImage').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnCorrection').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnSupprAnnotation').className = "btn btn-outline-dark btn-rounded btn-lg";

    if(modeCanvas === 0 && niveauZoom != 1) {
        stage.draggable(true);
    }

    if(modeCanvas === 4) {
        for(var i = 0; i < layer.getChildren().length; ++i) {
            layer.getChildren()[i].draggable(false);
        }
        ellipseCliquee = 0;
        var trns = layer.getChildren(function (node) {
            return node.getClassName() === 'Transformer';
        })[0];
        if(trns){
            trns.destroy();
        }
        layer.draw();
    }
    nbPoints = 0;
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


//Gestion des images
function afficheListeImages() {
    indiceImages = 1;
    indiceListe = debutListe;
    intervalIDLoadImage = setInterval(asyncLoadImage, 100);
}

function asyncLoadImage() {
    if(indiceListe === debutListe + 4 || indiceListe === listeImages.length) {
        clearInterval(intervalIDLoadImage);
    } else {
        if(!chargementVideo) {
            var fr = new FileReader();
            fr.onload = imageHandler;
            var filename = listeImages[indiceListe];
            fr.readAsDataURL(filename);
        } else {
            document.getElementById('imageL' + indiceImages).src=listeImages[indiceListe];
            indiceImages++;
        }
        ++indiceListe;
    }
}

function defileHaut() {
    var id;
    var idSuiv = "imageL1";
    if(debutListe < listeImages.length - 4) {
        for ( let i = 2; i<5; i++) {
            id=idSuiv;
            idSuiv = "imageL"+i;
            document.getElementById(id).src = document.getElementById(idSuiv).src;
        }
        if(!chargementVideo) {
            var fr = new FileReader();
            fr.onload = imageHandler;
            var filename = listeImages[debutListe + 4];
            indiceImages = 4;
            fr.readAsDataURL(filename);
        } else {
            document.getElementById('imageL4').src=listeImages[debutListe + 4];
        }
        debutListe++;
    }
}

function defileBas() {
    var id="imageL4";
    var idPrec;
    if(debutListe <= listeImages.length - 4 && debutListe > 0) {
        debutListe--;
        for ( let i = 3; i>0; i--) {
            idPrec=id;
            id = "imageL"+i;
            document.getElementById(idPrec).src = document.getElementById(id).src;
        }
        if(!chargementVideo) {
            var fr = new FileReader();
            fr.onload = imageHandler;
            var filename = listeImages[debutListe];
            indiceImages = 1;
            fr.readAsDataURL(filename);
        } else {
            document.getElementById('imageL1').src=listeImages[debutListe];
        }
    }
}

function downloadimage() {
    document.getElementById("DLCanvas").remove();
    nbPoints = 0;
}

function isBlack(pixel) {
    let ret = true;
    if(pixel[0] != 0) {
        ret = false;
    } else if(pixel[1] != 0) {
        ret = false;
    } else if(pixel[2] != 0) {
        ret = false;
    }
    return ret;
}

function isRed(pixel) {
    let ret = true;
    if(pixel[0] != 255) {
        ret = false;
    } else if(pixel[1] != 0) {
        ret = false;
    } else if(pixel[2] != 0) {
        ret = false;
    }
    return ret;
}

function load1Picture() {

    $("body").append("<input type='file' id='explorerChargement' accept='image/*' multiple>");
    input = document.getElementById('explorerChargement');

    var y = document.getElementById("explorerChargement");
    y.addEventListener('change', loadimage, false);
    input.click();
}

function imageHandler(e2) {
    var idImg = 'imageL'+indiceImages;
    document.getElementById(idImg).src = e2.target.result;
    ++indiceImages;
}

function loadimage(e1) {
    for(var i = 0; i < e1.target.files.length; ++i) {
        listeImages.push(e1.target.files[i]);
    }
    afficheListeImages();
    document.getElementById("explorerChargement").remove();
}

function realiasing(data) {
    let width = imageCourante.width;
    for(let i = 0; i < imageCourante.height; ++i) {
        for(let j = 0; j < width; ++j) {
            let indice = (i * width + j) * 4;
            if(!isBlack(data.slice(indice, 3))) {
                if(!isRed(data.slice(indice, 3))) {
                    for(let k = 0; k < 4; ++k) {
                        data[indice + k] = 255;
                    }
                } else {
                    data[indice] = 255;
                    data[indice + 1] = 0;
                    data[indice + 2] = 0;
                    data[indice + 3] = 255;
                }
            }
        }
    }
    return data;
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


//Utils
function distance(pt1, pt2) {
    var x = pt1[0] - pt2[0];
    var y = pt1[1] - pt2[1];
    return Math.sqrt(x * x + y * y);
}

function enleverDoublons(tab) {
    for(let i = 0; i < tab.length; ++i) {
        let temp = tab[i];
        for(let j = i + 1; j < tab.length; ++j) {
            if(typeof(temp) == 'number') {
                if(temp == tab[j]) {
                    tab.splice(j, 1);
                    --j;
                }
            } else {
                let doublons = true;
                for(let k = 0; doublons && k < temp.length; ++k) {
                    if(temp[k] != tab[j][k]) {
                        doublons = false;
                    }
                }
                if(doublons) {
                    tab.splice(j, 1);
                    --j;
                }
            }
        }
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

function getAngle(v1, v2) {
    let angle = Math.atan2(v2[1], v2[0]) - Math.atan2(v1[1], v1[0]);
    if(angle < 0) {
        angle += 2 * Math.PI;
    }
    angle = angle * 180 / Math.PI;
    console.log(angle);
    return angle;
}

function insererEnPos(tab, elem, pos) {
    var deb = tab.slice(0,pos);
    var fin = tab.slice(pos, tab.length);
    deb.push(elem);
    return deb.concat(fin);
}

function sontEnvironEgales(val1, val2) {
    let ret = false;
    let erreur = 1;
    if(val1 <= val2 + erreur && val1 >= val2 - erreur) {
        ret = true;
    }
    return ret;
}

function sontEnvironEgalesProportionnelles(val1, val2) {
    let ret = false;
    let erreur = 3 * val1 / 100; //3% de la valeur à comparer
    if(val1 <= val2 + erreur && val1 >= val2 - erreur) {
        ret = true;
    }
    return ret;
}

function sontVoisins(p1, p2, angle) {
    var ret  = false;
    if(sontEnvironEgales(p1[0], p2[0]) && sontEnvironEgales(p1[1], p2[1])) {
        ret = true;
    }
    return ret;
}

function dotProduct(v1, v2) {
    return (v1[0] * v2[0] + v1[1] * v2[1]) * Math.cos(angle);
}

//Gestion de la vidéo
function computeFrame() {
    var modulo = 22;
    if(nbFrame%modulo === modulo-1) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        var dataurl = imagedata_to_image(ctx.getImageData(0,0,canvas.width, canvas.height)).src;
        listeImages.push(dataurl);
    }
    nbFrame++;
}

function extractFromVideo() {
    $("body").append("<input type='file' id='explorerChargementVideo' accept='video/*'>");



    input = document.getElementById('explorerChargementVideo');

    var y = document.getElementById("explorerChargementVideo");
    y.addEventListener('change', loadVideo, false);
    input.click();
    chargementVideo = true;



}

function imagedata_to_image(imagedata) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    ctx.putImageData(imagedata, 0, 0);

    var image = new Image();
    image.src = canvas.toDataURL();
    return image;
}

function loadVideo(e1) {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    var periodeExtract;
    var vid = e1.target.files[0];

    video = document.createElement('video');
    video.id = 'video';
    video.src = vid;
    video.autoplay = true;
    video.muted = true;

    video.addEventListener('play', function () {
        setTimeout(function () {timerCallback();}, 0);
    });
    video.onended = function () {
        afficheListeImages();
    };
    var fr = new FileReader();
    fr.onload = videoHandler;
    nbFrame =0;
    fr.readAsDataURL(vid);
}

function timerCallback() {
    if (this.video.paused || this.video.ended) {
        return;
    }
    computeFrame();
    setTimeout(function () {timerCallback();}, 0);
}

function videoHandler(e2) {
    video.src = e2.target.result;
    video.muted = true;
    video.playbackRate = 32;
    video.play(true);
    document.getElementById("explorerChargementVideo").remove();
}

//Gestion du masque
function concatAnnotations(ptsAnnot) {
    var k = 0;
    while(k < ptsAnnot.length) {
        var l = k+1;
        while ( l < ptsAnnot.length) {
            if(sontVoisins(ptsAnnot[k][0], ptsAnnot[l][0])) {
                ptsAnnot[k] = ptsAnnot[l].reverse().concat(ptsAnnot[k]);
                ptsAnnot.splice(l, 1);
            } else if(sontVoisins(ptsAnnot[k][0], ptsAnnot[l][ptsAnnot[l].length-1])) {
                ptsAnnot[k] = ptsAnnot[l].concat(ptsAnnot[k]);
                // ptsAnnot[k] = ptsAnnot[k].reverse().concat(ptsAnnot[l].reverse());
                ptsAnnot.splice(l, 1);
            } else if(sontVoisins(ptsAnnot[k][ptsAnnot[k].length-1], ptsAnnot[l][0])) {
                ptsAnnot[k] = ptsAnnot[k].concat(ptsAnnot[l]);
                ptsAnnot.splice(l, 1);
            } else if(sontVoisins(ptsAnnot[k][ptsAnnot[k].length-1], ptsAnnot[l][ptsAnnot[l].length-1])) {
                ptsAnnot[k] = ptsAnnot[k].concat(ptsAnnot[l].reverse());
                ptsAnnot.splice(l, 1);
            } else {
                ++l;
            }
        }
        ++k;
    }
    return ptsAnnot;
}

function chargerMasque() {

    $("body").append("<input type='file' id='explorerMasque' accept='image/*' multiple>");
    var inputTmp = document.getElementById('explorerMasque');

    var y = document.getElementById("explorerMasque");
    y.addEventListener('change', function (e1) {
        var fr = new FileReader();
        fr.onload = masqueHandler;
        fr.readAsDataURL(e1.target.files[0]);

    }, false);
    inputTmp.click();

    // var filename = 'E:/Important/Etudes/ISIMA/ZZ3/Stage/Application/masqueTestNB.png';
}

function getExtremitesLigne(data, i, j) {
    let k = j;
    while(data[(i*largeurInference+(k+1))*4] != 0) {
        k+=1;
    }
    return[[i,j], [i,k]];
}

function isBlack(data, i ,j, canvas) {
    ret = true;
    let indice = (i * canvas.width + j) * 4;
    if(data[indice] != 0) {
        //R
        ret = false;
    } else if(data[indice+1] != 0) {
        //G
        ret = false;
    } else if(data[indice+2] != 0) {
        //B
        ret = false;
    }
    return ret;
}

function masqueHandler(e2) {
    $("body").append("<canvas id='canvasMasque' style='visibility: visible' width='" + largeurInference + "' height='" + hauteurInference + "'>")
    var canvas = document.getElementById('canvasMasque');
    rapportImageInference = imageCourante.width / largeurInference;
    var img = new Image(largeurInference, hauteurInference);
    img.src = e2.target.result;
    canvas.height = img.height;
    canvas.width = img.width;
    ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var data = ctx.getImageData(0,0,canvas.width, canvas.height).data;
    var ptsAnnotations = [];
    var k;

    ecartPointsImportants = parseInt(document.getElementById('inputCoef').value);


    if(data.find(element => element == 255)) {
        for (var i = 0; i < canvas.height; ++i) {
            for (var j = 0; j < canvas.width; ++j) {
                if (!isBlack(data, i, j, canvas) != 0) {
                    let place = false;
                    let ligne = getExtremitesLigne(data, i, j);
                    j = ligne[1][1] + 1;
                    let k = 0;
                    let longeurPtsAnnot = ptsAnnotations.length;
                    while(!place && k < longeurPtsAnnot) {
                        let longueurPtsAnnotK = ptsAnnotations[k].length;
                        if(ligne[0][0]-1 == ptsAnnotations[k][0][0] || ligne[0][0]-1 == ptsAnnotations[k][longueurPtsAnnotK-1][0]) {
                            if(ligne[0][1] == ptsAnnotations[k][0][1] && ligne[1][1] == ptsAnnotations[k][longueurPtsAnnotK-1][1]) {
                                //ligne de fermeture de la forme
                                ptsAnnotations[k] = ligne.reverse().concat(ptsAnnotations[k]);
                                // ptsAnnotations[k] = ptsAnnotations[k].concat(ligne);
                                place = true;
                            } else if(ligne[1][0] -1 == ptsAnnotations[k][0][0]
                                && ligne[0][1] < ptsAnnotations[k][0][1] //deb2 < deb 1
                                && ligne[1][1] >= ptsAnnotations[k][0][1] - 1 // fin2 >= deb1 -1
                                && ligne[1][1]+1 <= ptsAnnotations[k][1][1]) { // fin2 < fin 1
                                //debut de l'annotation entre le début et la fin de la ligne a ajouter
                                ptsAnnotations[k] = ligne.concat(ptsAnnotations[k]);
                                place = true;
                            } else if(ligne[1][0] -1 == ptsAnnotations[k][longueurPtsAnnotK - 1][0]
                                && ligne[0][1] > ptsAnnotations[k][0][1] //deb2 > deb1
                                && ligne[0][1]-1 <= ptsAnnotations[k][longueurPtsAnnotK - 2][1] //deb2-1 <= fin1
                                && ligne[1][1] > ptsAnnotations[k][longueurPtsAnnotK - 1][1]) { // fin2 >= fin1
                                //fin  de l'annotation entre le début et la fin de la ligne a ajouter
                                ptsAnnotations[k] = ptsAnnotations[k].concat(ligne);
                                place = true;
                            } else if(ligne[1][0] -1 == ptsAnnotations[k][0][0]
                                && sontEnvironEgales(ligne[1][1], ptsAnnotations[k][0][1])) {
                                //ligne au début de l'annotation
                                ptsAnnotations[k] = ligne.concat(ptsAnnotations[k]);
                                place = true;
                            } else if(ligne[1][0] -1 == ptsAnnotations[k][longueurPtsAnnotK - 1][0]
                                && ligne[1][1] + 1 >= ptsAnnotations[k][longueurPtsAnnotK - 1][1]
                                && ligne[0][1] - 1 <= ptsAnnotations[k][longueurPtsAnnotK - 1][1]) {
                                //ligne à la fin de l'annotation
                                ptsAnnotations[k] = ptsAnnotations[k].concat(ligne);
                                place = true;
                            } else if(ligne[1][0] -1 == ptsAnnotations[k][longueurPtsAnnotK - 1][0]
                                && ligne[1][1] + 1 >= ptsAnnotations[k][longueurPtsAnnotK - 2][1]
                                && ligne[0][1] - 1 <= ptsAnnotations[k][longueurPtsAnnotK - 1][1]) {
                                //fin de ligne au début de la fin de l'annotation
                                ptsAnnotations[k] = ptsAnnotations[k].concat(ligne.reverse());
                                place = true;
                            } else if(ligne[1][0] -1 == ptsAnnotations[k][0][0]
                                && ligne[0][1] - 1 <=  ptsAnnotations[k][1][1]
                                && ligne[0][1] >=  ptsAnnotations[k][0][1]) {
                                //début de ligne à la fin du début de l'annotation
                                ptsAnnotations[k] = ligne.concat(ptsAnnotations[k]);
                                place = true;
                            } else if (ligne[1][0] -1 == ptsAnnotations[k][0][0]
                                && ligne[0][1] == ptsAnnotations[k][0][1]
                                && ligne[1][1] == ptsAnnotations[k][1][1]) {
                                //ligne égale au début de l'annotations
                                ptsAnnotations[k] = ligne.concat(ptsAnnotations[k]);
                                place = true;
                            } else {
                                let tmp = j-1;
                                // console.log("i : " + i + " j : " + tmp);
                                ++k;
                            }
                            if(place) {
                                concatAnnotations(ptsAnnotations);
                            }
                        } else {
                            ++k;
                        }
                    }
                    if(!place) {
                        ptsAnnotations.push(ligne);
                    }
                }
            }
        }
        document.getElementById('canvasMasque').remove();

        var bonsPoints;
        for (i = 0; i < ptsAnnotations.length; ++i) {
            if(ptsAnnotations[i].length > ecartPointsImportants){
                bonsPoints = pointsImportants(ptsAnnotations[i]);
                if (distance(bonsPoints[0], bonsPoints[bonsPoints.length - 1]) < 5) {
                    modeCanvas = 3;
                    bonsPoints.pop();
                } else
                    modeCanvas = 1;

                for(let j = 0; j < bonsPoints.length; ++j) {
                    bonsPoints[j][0] = bonsPoints[j][0] * rapportImageInference;// + 1;
                    bonsPoints[j][1] = bonsPoints[j][1] * rapportImageInference;// + 1;
                }

                let x = bonsPoints[0][1];
                let y = bonsPoints[0][0];
                let poly = creerLigne([x,y]);
                layer.add(poly);
                nbPoints = 0;
                let idCircle = poly.attrs['id'] + '-' + nbPoints;
                nbPoints++;
                createDot(x,y,idCircle);
                for(let j = 1; j<bonsPoints.length;++j) {
                    let x = bonsPoints[j][1];
                    let y = bonsPoints[j][0];
                    poly.points(poly.points().concat([x, y]));

                    let idCircle = poly.attrs['id']+'-'+nbPoints;
                    nbPoints++;
                    createDot(x,y,idCircle);
                }
                layer.draw();
                modeCanvas = 0;
            }
        }
    } else {
        alert("Erreur de chargement du masque")
    }
    document.getElementById('explorerMasque').remove();

}

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

function pointsImportants(ligne) {
    var ptsAnnot = ligne;
    var points = [ptsAnnot[0]];
    var last = ptsAnnot.length-1;
    let ecartPente = 0.2;

    for(let i = 1; i < ptsAnnot.length-1; ++i) {
        if(ptsAnnot[i][0] == ptsAnnot[i-1][0] && ptsAnnot[i][1] == ptsAnnot[i-1][1]) {
            ptsAnnot.splice(i--, 1);
        }
    }
    last = ptsAnnot.length-1;
    for(var i = ecartPointsImportants; i < last-ecartPointsImportants; i+=ecartPointsImportants) {
        if (!(ptsAnnot[i][0] - ptsAnnot[i-ecartPointsImportants][0] == ptsAnnot[i+ecartPointsImportants][0] - ptsAnnot[i][0]
            && ptsAnnot[i][1] - ptsAnnot[i-ecartPointsImportants][1] == ptsAnnot[i+ecartPointsImportants][1] - ptsAnnot[i][1])) {
                //S'il y a un écart
                // let rapportI = ptsAnnot[i][0] - ptsAnnot[i-ecartPointsImportants][0] / ptsAnnot[i+ecartPointsImportants][0] - ptsAnnot[i][0];
                // let rapportJ = ptsAnnot[i][1] - ptsAnnot[i-ecartPointsImportants][1] / ptsAnnot[i+ecartPointsImportants][1] - ptsAnnot[i][1]);
                let penteDeb = ptsAnnot[i][0] - ptsAnnot[i - ecartPointsImportants][0] / ptsAnnot[i][1] - ptsAnnot[i - ecartPointsImportants][1];
                let penteFin = ptsAnnot[i + ecartPointsImportants][0] - ptsAnnot[i][0] / ptsAnnot[i + ecartPointsImportants][1] - ptsAnnot[i][1];
                if(penteDeb / penteFin < 1 - ecartPente){
                    if(!pointsEgaux(points[points.length-1], ptsAnnot[i - Math.round(ecartPointsImportants/2)])) {
                        points.push(ptsAnnot[i - Math.round(ecartPointsImportants/2)]);
                    }
                }
                points.push(ptsAnnot[i]);
                if (penteDeb / penteFin > 1 + ecartPente) {
                    points.push(ptsAnnot[i + Math.round(ecartPointsImportants/2)]);
                }
            }
        }
        points.push(ptsAnnot[last]);
        return points;
    }

function pointsEgaux(pt1, pt2) {
    ret = false;
    if(pt1[0] == pt2[0] && pt1[1] == pt2[1])
    ret = true;
    return ret;
}

//Création d'annotation
function afficherCercle(cercle) {
    console.log('id : ' + cercle.attrs['id']);
    console.log('zIndex : ' + cercle.zIndex());
}

function annulerAnnotation() {
    if(modeCanvas != 4) {
        var children = layer.getChildren();
        var last = children[children.length - 1];
        if(last.getClassName() === 'Arc') {
            var lines = layer.getChildren(function (node) {
                return node.getClassName() === 'Line'
            });
            var line = lines[lines.length - 1];
            line.points().pop();
            line.points().pop();
            children.pop();
            if (line.points().length === 2 && modeCanvas != 1 && modeCanvas != 3) {
                children.pop();
                children.pop();
            }
        } else {
            children.pop();
        }
        layer.draw();
    }
}

function createDot(x, y, idCircle) {
    var circle = new Konva.Arc({
        x: x,
        y: y,
        outerRadius: 4,
        innerRadius: 4,
        angle: 360,
        stroke: 'red',
        strokeWidth: 2,
        id: idCircle,
    });
    if(modeCanvas == 4) {
        circle.draggable(true);
    }
    circle.attrs['x'] = x;
    circle.attrs['y'] = y;
    circle.on('dragstart', function () {
        oldPos[0] =  this.x();
        oldPos[1] =  this.y();
    });
    circle.on('dragmove', function () {
        let diffX = this.x() - oldPos[0];
        let diffY = this.y() - oldPos[1];
        let id = this.attrs['id'];
        let ligne = parseInt(id.split('-')[0]);
        let points = parseInt(id.split('-')[1]);
        let lines = layer.getChildren(function(node){
            return node.getClassName() === 'Line';
        });
        lines[ligne].points()[2*points] += diffX;
        lines[ligne].points()[2*points+1] += diffY;
        oldPos[0] = this.x();
        oldPos[1] = this.y();
    });
    circle.on('click', function (e) {
        if(e.evt.button == 0) {
            if( modeCanvas === 5) {
                this.destroy();
                let id = this.attrs['id'];
                let ligne = parseInt(id.split('-')[0]);
                let points = parseInt(id.split('-')[1]);
                let lines = layer.getChildren(function(node){
                    return node.getClassName() === 'Line';
                });

                lines[ligne].points().splice(2*points, 2);
                decaleIDCercles(1, id, ligne);
                layer.draw();
                boutonsOff();
                modeCanvas = 0;
            } else {
                afficherCercle(this);
            }
        }
    });
    circle.on('contextMenu', function (e) {
        e.preventDefault();
        if( modeCanvas === 4) {
            this.destroy();
            let id = this.attrs['id'];
            let ligne = parseInt(id.split('-')[0]);
            let points = parseInt(id.split('-')[1]);
            let lines = layer.getChildren(function(node){
                return node.getClassName() === 'Line';
            });

            lines[ligne].points().splice(2*points, 2);
            decaleIDCercles(1, id, ligne);
            layer.draw();
        }

    });
    layer.add(circle);
    layer.draw();

    return circle;
}

function creerLigne(ptsLigne) {
    var poly = new Konva.Line({
        points: ptsLigne,
        stroke: 'red',
        strokeWidth: 3,
        id: nbElem,
    });
    ++nbElem;
    poly.on('dragstart', function () {
        // let pos = stage.getPointerPosition();
        oldPos[0] =  this.x();
        oldPos[1] =  this.y();
        // this.fire('dragend');
    });
    poly.on('dragend', function () {
        let circles = layer.getChildren(function(node){
            return node.getClassName() === 'Arc';
        });
        let idLigne = this.attrs['id'];
        // let pos = stage.getPointerPosition();
        let diffX = this.x() - oldPos[0];
        let diffY = this.y() - oldPos[1];
        circles = circles.filter(circle => circle.attrs['id'].split('-')[0] == idLigne);
        for(let i = 0; i < circles.length; ++i) {
            circles[i].x(circles[i].x() + diffX);
            circles[i].y(circles[i].y() + diffY);
        }
        layer.draw();
    });
    poly.on('mousedown', function (e) {
        if(e.evt.button == 0) {
            if(modeCanvas == 4) {
                let idLigne = this.attrs['id'];
                let clickPos = stage.getPointerPosition();
                clickPos.x = (clickPos.x  - stage.x()) / niveauZoom;
                clickPos.y = (clickPos.y  - stage.y()) / niveauZoom;
                let added = false;
                let i = 0;
                let pts = this.points();
                while(!added && i < pts.length - 3) {
                    let v1 = [pts[i] - clickPos.x, pts[i + 1] - clickPos.y];
                    let v2 = [pts[i + 2] - clickPos.x, pts[i + 3] - clickPos.y];
                    let angle = getAngle(v1, v2);
                    if(sontEnvironEgalesProportionnelles(angle, 180)) {
                        let circles = getDots(idLigne);
                        let zInd = circles[(i + 2) / 2].zIndex();
                        let newPoints = this.points().slice(0, i + 2);
                        newPoints.push(clickPos.x);
                        newPoints.push(clickPos.y);
                        newPoints = newPoints.concat(this.points().slice(i + 2));
                        this.points(newPoints);
                        let idPoint = idLigne + '-' + (i + 2) / 2;
                        console.log('Décalage :');
                        decaleIDCercles(1, (i + 2) / 2, idLigne);
                        var dot = createDot(clickPos.x, clickPos.y, idPoint);
                        dot.zIndex(zInd);
                        added = true;
                        layer.draw();
                    }
                    i+=2;
                }
                if(this.closed() && !added && i == pts.length - 2) {
                    let v1 = [pts[pts.length - 2] - clickPos.x, pts[pts.length - 1] - clickPos.y];
                    let v2 = [pts[0] - clickPos.x, pts[1] - clickPos.y];
                    let angle = getAngle(v1, v2);
                    if(sontEnvironEgalesProportionnelles(angle, 180)) {
                        let circles = getDots(idLigne);
                        let zInd = circles[circles.length - 1].zIndex() + 1;
                        this.points().push(clickPos.x);
                        this.points().push(clickPos.y);
                        let idPoint = idLigne + '-' + circles.length;
                        var dot = createDot(clickPos.x, clickPos.y, idPoint);
                        dot.zIndex(zInd);
                        added = true;
                        layer.draw();
                    }
                }
                if(dot != undefined) {
                    mousedwn = true;
                    dot.startDrag();
                }
            }
        }
    });
    poly.on('mouseup', function () {
        mousedwn = false;
        cliqueDroit = false;
    })
    poly.on('click', function () {
        switch (modeCanvas) {
            case 5:
                let circles = layer.getChildren(function(node){
                    return node.getClassName() === 'Arc';
                });
                let idLigne = this.attrs['id'];
                circles = circles.filter(circle => circle.attrs['id'].split('-')[0] == idLigne);
                for(let i = circles.length-1; i >= 0; --i) {
                    circles[i].destroy();
                }
                this.destroy();
                layer.draw();
                boutonsOff();
                modeCanvas = 0;
                majIdAnnotations(idLigne);
                --nbElem;
                break;
            default:
                console.log(this.zIndex());

        }

    });
    if(modeCanvas == 3) {
        let sel = document.getElementById('selectFill');
        poly.closed(true);
        console.log(sel.value);
        poly.fill(sel.value);
    }
    return poly;
}

function decaleIDCercles(sens, indice, idLigne) {
    /*
        sens = 1 => on ajoute un à chaque partie cercle des id
        sens = -1 => on retire un à chaque partie cercle des id
    */
    let circles = layer.getChildren(function(node){
        return node.getClassName() === 'Arc' && node.attrs['id'].split('-')[0] == idLigne;
    });
    // console.log(circles.length);
    // for (let m = 0; m < circles.length; ++m) {
    //     console.log(circles[m].attrs['id']);
    // }
    if(sens == -1) {
        for(let i = indice; i < circles.length; ++i) {
            afficherCercle(circles[i]);
            let id = circles[i].attrs['id'].split('-');
            let modif = parseInt(id[1]) - 1;
            // if(i % 2 == 0)
                circles[i].zIndex(circles[i].zIndex() - 1);
            circles[i].attrs['id'] = id[0] + '-' + (modif.toString());
            afficherCercle(circles[i]);
        }
    } else {
        for(let i = indice; i < circles.length; ++i) {
            afficherCercle(circles[i]);
            let id = circles[i].attrs['id'].split('-');
            let modif = parseInt(id[1]) + 1;
            // if(i % 2 == 1)
                circles[i].zIndex(circles[i].zIndex() + 1);
            circles[i].attrs['id'] = id[0] + '-' + (modif.toString());
            afficherCercle(circles[i]);
        }
    }
    // console.log(circles.length);
    // for (let m = 0; m < circles.length; ++m) {
    //     console.log(circles[m].attrs['id']);
    // }
}

function getAllDots() {
    /*
    Retourne tous les cercles sur la stage
    */
    let circles = layer.getChildren(function(node){
        return node.getClassName() === 'Arc';
    });
    return circles;

}

function getDot(indicePoint, idLigne) {
    /*
    Retourne le point spécifié
    */
    let circles = layer.getChildren(function(node){
        return node.getClassName() === 'Arc' && node.attrs['id'].split('-')[0] == idLigne;
    });
    return circles[indicePoint];
}

function getDots(idLigne) {
    /*
    Retourne tous les cercles associés à une ligne
    */
    let circles = layer.getChildren(function(node){
        return node.getClassName() === 'Arc' && node.attrs['id'].split('-')[0] == idLigne;
    });
    return circles;
}

function majIdAnnotations(id) {
    let lignes = layer.getChildren(function(node){
        return node.getClassName() === 'Line';
    });
    for(let i = id; i < lignes.length; ++i) {
        let idTmp = lignes[i].attrs['id'];
        let cercles = layer.getChildren(function(node){
            return node.getClassName() === 'Arc' && node.attrs['id'].split('-')[0] == idTmp;
        });
        for(let i = 0; i < cercles.length; ++i) {
            let idCercleTmp = cercles[i].attrs['id'].split('-');
            let idCercle = cercles[i].attrs['id']
            idCercle = (parseInt(idCercleTmp[0]) - 1).toString() + '-' + idCercleTmp[1];
            cercles[i].attrs['id'] = idCercle;
        }
        idTmp = (parseInt(idTmp) - 1).toString();
        lignes[i].attrs['id'] = idTmp;
    }
}
