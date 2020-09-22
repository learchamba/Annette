// import * from "./onnx.ts";

var btnLoad;
var btnMask;
var canvas;
var loadVideo = false;
var clickAdd = 0; //left click
var clickDelete = 1; //wheel click
var clickDrag = 2; // right click
var clickType;
var constructMode;
var createDot;
var ctx;
var currentCircle;
var listBeginning = 0;
var deletedDot = false;
var minVisibleDistance;
var divMainImg;
var dragged;
var gapImportantPoints = 10;
var ellipseClicked = 0;
var ellipseFinished = false;
var ellipseTmp = undefined;
var firstPointAdded = false;
var inferenceHeight = 270;
var idEllipse;
var currentPicture;
var currentPictureIndex;
var picturesIndex;
var listIndex;
var initialPosStage;
var input;
var intervalIDLoadImage;
var isCircleDragged = false;
var inferenceWidth = 480;
var layer;
var layerBkgrd;
var pictureList = [];
var longClick = 500;
var isMaskVisible = true;
var leftMouseDown = false;
var mousedwn = true;
var nbElem;
var nbFrame;
var nbPoints = 0;
var newLineBool;
var newLine;
var correctionLine = false;
var zoomLevel = 1;
var oldPos = [];
var oldPosStage = [];
var pictureScroll = 0;
var pointsEllipse;
var pointCreated;
var poly;
var linePoints;
var xPictureInferenceRatio;
var yPictureInferenceRatio;
var ratioX;
var ratioY;
var readyToMerge;
var backgroundRect;
var blackRect;
var selected = [];
var stage;
var tmpDot = false;
var video;


var modeCanvas = 0;
/*
* 0 : mode libre
* 1 : ajout ligne
* 2 : ajout ellipse
* 3 : ajout d'une zone polygonale fermée
* 4 : Correction
* 5 : Suppression d'annotation
* */


window.onload = init;

//Inits
function init() {
    btnMask = document.getElementById('btnMasquer');
    btnLoad = document.getElementById('btnChargement');
    divMainImg = document.getElementById('divImagePrincipale');
    currentPicture = document.getElementById('imageCourante');

    document.getElementById('btnDefileHaut').addEventListener('click',defileHaut);
    document.getElementById('btnDefileBas').addEventListener('click',defileBas);
    document.getElementById('btnSupprImage').addEventListener('click',supprImages);
    document.getElementById('btnChargeVideo').addEventListener('click', extractFromVideo);
    document.getElementById('btnCorrection').addEventListener('click', function () {
        if(modeCanvas === 4){
            modeCanvas = 0;
            document.getElementById('btnCorrection').className = "btn btn-outline-dark btn-rounded btn-lg";
            if(zoomLevel != 1)
                stage.draggable(true);
            for(var i = 0; i < layer.getChildren().length; ++i) {
                layer.getChildren()[i].draggable(false);
            }
            ellipseClicked = 0;
            var trns = layer.getChildren(function (node) {
                return node.getClassName() === 'Transformer';
            })[0];
            if(trns){
                trns.destroy();
            }
            layer.draw();

        } else {
            boutonsOff();
            modeCanvas = 4;
            document.getElementById('btnCorrection').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
            let circles = getAllDots();
            for(var i = 0; i < circles.length; ++i) {
                circles[i].draggable(true);
            }
            resetCorrection();
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
        maskArcs();
        var y = document.getElementById("DLCanvas");
        let nomImage = pictureList[currentPictureIndex - 1].name.split('.')[0];
        killTransformers();
        ratioY = currentPicture.naturalHeight / currentPicture.height;
        ratioX = currentPicture.naturalWidth / currentPicture.width;
        xPictureInferenceRatio = currentPicture.width / inferenceWidth;
        yPictureInferenceRatio = currentPicture.height / inferenceHeight;

        let cptInput = 0;
        let nomFicText;
        let nomFicMasque;
        let nomFicImage;
        let texte;
        let maskData;
        let annotatedImageData;

        let inputTextuel = document.getElementById('CBJSON');
        if(inputTextuel.checked) {
            ++cptInput;
            let lines = getAllLines();
            if(lines.length != 0) {
                texte = serializeLines(lines);

            }
            let ellipses = getAllEllipses();
            if(ellipses.length != 0) {
                if(lines.length != 0) {
                    texte += ",\n";
                }
                texte += serializeEllipses(ellipses);
            }
            nomFicText = "annotationTexte-" + nomImage + ".JSON"
        }
        layer.draw();

        let inputImage = document.getElementById('CBimage');
        if(inputImage.checked) {
            ++cptInput;
            y.href = stage.toDataURL();
            annotatedImageData = y.href;
            nomFicImage = 'imageAnnotee-' + nomImage + '.png';
            y.download = nomFicImage;
            y.addEventListener('change', downloadimage, false);
        }
        let inputMasque = document.getElementById('CBmasque');
        if(inputMasque.checked) {
            ++cptInput;
            prepareMask();

            y.href = stage.toDataURL();
            nomFicMasque = 'masque-' + nomImage + '.png';
            y.download = nomFicMasque;
            y.addEventListener('change', downloadimage, false);
            maskData = y.href;
            setMaskToNormal();
        }
        if(cptInput > 1) {
            var zip = new JSZip();
            if(inputImage.checked) {
                let imgData = annotatedImageData;
                imgData = imgData.substr(22); //retire le texte au début de l'URL
                imgData = atob(imgData); //conversion en binaire

                zip.file(nomFicImage, imgData, {binary: true});
            }
            if(inputTextuel.checked) {
                zip.file(nomFicText, texte);
            }
            if(inputMasque.checked) {
                maskData = y.href;
                maskData = maskData.substr(22); //retire le texte au début de l'URL
                maskData = atob(maskData); //conversion en binaire
                zip.file(nomFicMasque, maskData, {binary: true});
            }

            zip.generateAsync({type:"blob"})
            .then(function(content) {
                saveAs(content, nomImage + ".zip");
            });
        } else {
            if(inputImage.checked) {
                y.click();
            } else if(inputTextuel.checked) {
                let blob = new Blob([texte], { type: "text/plain;charset=utf-8" });
                saveAs(blob, nomFicText);
            } else if(inputMasque.checked) {
                y.click();
            }
        }

        showArcs();

    });

    document.getElementById('btnZoomPlus').addEventListener(('click'), function () {
        if(zoomLevel <8) {
            zoomLevel*=2;
            var layerBkg = stage.getLayers()[0];
            layerBkg.scale({x: zoomLevel, y: zoomLevel});
            layer.scale({x: zoomLevel, y: zoomLevel});
            if(modeCanvas != 4)
                stage.draggable(true);


            layerBkg.draw();
            layer.draw();
        }
    });

    document.getElementById('btnZoomMoins').addEventListener(('click'), function () {
        if(zoomLevel > 1) {
            zoomLevel/=2;
            var layerBkg = stage.getLayers()[0];
            layerBkg.scale({x: zoomLevel, y: zoomLevel});
            layer.scale({x: zoomLevel, y: zoomLevel});
            stage.x(initialPosStage[0]);
            stage.y(initialPosStage[1]);
            layerBkg.draw();
            layer.draw();
            if(zoomLevel === 1) {
                stage.draggable(false);
            }
            currentPicture.scale
        }
    });

    btnMask.addEventListener('click', masquerMasque);
    btnLoad.addEventListener('click', load1Picture);

    initCanvas();
    document.getElementById('btnAnnuler').addEventListener('click', cancelAnnotation);

    currentPicture.addEventListener('load', function () {
        var canvasWidth = this.clientWidth;
        var canvasHeight = this.clientHeight;
        stage = new Konva.Stage({
            container: 'divCanvas',
            width: canvasWidth,
            height: canvasHeight
        });
        initialPosStage = [stage.x(), stage.y()];
        layerBkgrd = new Konva.Layer();
        var imgBkgrd = new Image();
        imgBkgrd.src = './fondNoir.png';
        blackRect = new Konva.Rect( {
                x: 0,
                y: 0,
                width: canvasWidth,
                height: canvasHeight,
                fillPatternImage:imgBkgrd,
                fillPatternRepeat: 'no-repeat',
                fillPatternScaleX: canvasWidth/imgBkgrd.width,
                fillPatternScaleY: canvasHeight/imgBkgrd.height,
                id: 'imgNoire',
            });
        layerBkgrd.add(blackRect);

        imgBkgrd = new Image();
        imgBkgrd.src = this.src;
        backgroundRect = new Konva.Rect( {
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
        layerBkgrd.add(backgroundRect);
        stage.add(layerBkgrd);
        layerBkgrd.draw();
        layer = new Konva.Layer();
        stage.add(layer);

        stage.on('dragstart', function (e) {
            if(clickType == clickDrag) {
                oldPosStage = [stage.x()/zoomLevel, stage.y()/zoomLevel];
                dragged = true;
            } else {
                stage.stopDrag();
            }
        });

        stage.on('dragend', function (e) {
            let newPos = [stage.x()/zoomLevel, stage.y()/zoomLevel];
            if(distance(oldPosStage,newPos) < 3) {
                dragged = false;
            } else {
                dragged = true;
            }
        });

        stage.on('mousedown', function(e) {

                clickType = e.evt.button;
                pointCreated = false;
                switch (clickType) {
                    case clickAdd:
                        break;
                    case clickDelete:
                        switch(modeCanvas) {
                            case 1:
                            case 3:
                                nbPoints = 0;
                                break;
                            case 4:
                                let clickPos = getCLickPos();
                                if(e.target.getClassName() === "Arc") {
                                    deleteDot(e.target);
                                } else if(e.target.getClassName() === "Line") {
                                    if(deletedDot) {
                                        deletedDot = false;
                                    } else {
                                        if(e.target.closed()) {
                                            let line = e.target;
                                            let idLigne = line.attrs['id'];
                                            let clickPos = getCLickPos();
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
                                                    deleteDots(idLigne);
                                                    remakeDots(idLigne);
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
                                            let deleted = false;
                                            let i = 0;
                                            let pts = e.target.points();
                                            while(!deleted && i < pts.length - 3) {
                                                let v1 = [pts[i] - clickPos.x, pts[i + 1] - clickPos.y];
                                                let v2 = [pts[i + 2] - clickPos.x, pts[i + 3] - clickPos.y];
                                                let angle = getAngle(v1, v2);
                                                if(sontEnvironEgalesProportionnelles(angle, 180)) {
                                                    if(i + 3 == pts.length - 1) {
                                                        e.target.points().pop();
                                                        e.target.points().pop();
                                                    } else if(i == 0) {
                                                        e.target.points().shift();
                                                        e.target.points().shift();
                                                    } else {
                                                        let pointsLigne1 = pts.slice(0, i+2);
                                                        let pointsLigne2 = pts.slice(i+2);
                                                        e.target.points(pointsLigne1);

                                                        if(pointsLigne2.length > 2) {
                                                            let poly = createLine([pointsLigne2[0],pointsLigne2[1]]);
                                                            poly.points(pointsLigne2);
                                                            layer.add(poly);
                                                            remakeDots(poly.attrs['id']);
                                                        }
                                                    }
                                                    remakeDots(e.target.attrs['id']);
                                                    if(e.target.points().length <= 2) {
                                                        deleteDots(e.target.attrs['id']);
                                                        e.target.destroy();
                                                    }

                                                    layer.draw();
                                                    deleted = true;
                                                    tmpDot = false;
                                                }
                                                i+=2;
                                            }
                                        }
                                        nbPoints = 0;
                                    }
                                } else {
                                    let circle = findCircle(clickPos);
                                    if(circle != undefined) {
                                        deleteDot(circle);
                                        tmpDot = false;
                                    } else {
                                        if(tmpDot && poly.points().length <= 4) {
                                            deleteDots(poly.attrs['id']);
                                            poly.destroy();
                                            layer.draw();
                                        }
                                        resetCorrection();
                                    }
                                }
                                break;
                            default:
                                console.log("Pas de clique milieu dans ce mode.");
                                let test = stage.getPointerPosition();
                                test.x = (test.x  - stage.x()) / zoomLevel;
                                test.y = (test.y  - stage.y()) / zoomLevel;
                                console.log(test);
                        }
                        break;
                    case clickDrag :
                        if(!leftMouseDown && modeCanvas == 4) {
                            if(e.target.getClassName() !== 'Arc') {
                                let clickPos = getCLickPos();
                                let circle = findCircle(clickPos);
                                if(!tmpDot && circle != undefined){
                                    circle.startDrag();
                                    stage.draggable(false);
                                } else if(zoomLevel > 1) {
                                    stage.draggable(true);
                                    stage.startDrag();
                                }
                            }
                        }
                        break;
                    default:

                }
            });

        stage.on('contextmenu', function (e) {
            e.evt.preventDefault();
        });

        var scaleBy = 1.05;

        stage.dragBoundFunc(function (pos) {
            /* limits the movements of the stage in its area*/
            var newX;
            var newY;
            if(pos.x > 0) {
                newX = 0;
            } else {
                if(pos.x < -stage.width()*(zoomLevel-1)) {
                    newX = -stage.width()*(zoomLevel-1);
                } else {
                    newX = pos.x;
                }
            }

            if(pos.y > 0) {
                newY = 0;
            } else {
                if(pos.y < -stage.height()*(zoomLevel-1)) {
                    newY = -stage.height()*(zoomLevel-1);
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
                zoomLevel = newScale;
                if(newScale == 1) {
                    stage.draggable(false);
                } else {
                    stage.draggable(true);
                }
            }
            stage.scale({ x: zoomLevel, y: zoomLevel });
            var newPos = {
            x: pointer.x - mousePointTo.x * zoomLevel,
            y: pointer.y - mousePointTo.y * zoomLevel,
            };
            if(oldScale > newScale) {
                let newX;
                let newY;
                let pos = newPos;
                if(pos.x > 0) {
                    newX = 0;
                } else {
                    if(pos.x < -stage.width()*(zoomLevel - 1)) {
                        newX = -stage.width()*(zoomLevel - 1);
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
                    if(pos.y < -stage.height()*(zoomLevel - 1)) {
                        newY = -stage.height()*(zoomLevel - 1);
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
        zoomLevel = 1;

    }, false);

    // Annotation button event
    // document.getElementById('btnAnnot1').addEventListener('click', annotationImagePrincipale);


    for(var i = 1; i<5; ++i) {
        document.getElementById("imageL"+i).addEventListener('dblclick', function (e) {
            document.getElementById('imageCourante').src = e.target.src;
            currentPictureIndex = listBeginning + parseInt(e.target.id.charAt(e.target.id.length-1));
            document.getElementById('nomImageCourante').innerHTML = pictureList[currentPictureIndex - 1].name;
            nbElem = 0;

            chargerMasque();
        });
        document.getElementById("imageL"+i).addEventListener('click',
            function (e) {
                var indiceFic = parseInt(e.target.id.charAt(e.target.id.length-1));
                if(indiceFic <= pictureList.length) {
                    indiceFic += listBeginning - 1;
                    if (!e.target.className.includes("thumbnail")) {
                        e.target.className = "img-fluid img-thumbnail";
                        selected.push(pictureList[indiceFic]);
                    } else {
                        e.target.className = "img-fluid border";
                        selected.splice(selected.indexOf(pictureList[indiceFic]), 1);
                    }
                }
            });

        document.getElementById("imageL"+i).onwheel = function (e) {
                e.preventDefault();
                pictureScroll += (e.deltaY/Math.abs(e.deltaY)) * 0.4;
                if(pictureScroll > 1){
                    pictureScroll = 0;
                    if(listBeginning < pictureList.length - 4) {
                        ++listBeginning;
                        afficheListeImages();
                    }
                } else if(pictureScroll < 0) {
                    pictureScroll = 1;
                    if(listBeginning > 0) {
                        --listBeginning;
                        afficheListeImages();
                    }
                }
            };
    }
    nbElem = 0;
    initRaccourcis();
}

function initCanvas() {

    var divCanvas = document.getElementById('divCanvas');
    divCanvas.addEventListener('click',function(e) {
        let clickPos = getCLickPos();
        if(clickType == clickAdd) {
            if(ellipseTmp != undefined && pointsEllipse.length === 3) {
                ellipseTmp = undefined;
                ellipseFinished = true;
            }
            switch(modeCanvas) {
                case 3:
                case 1:
                    if(nbPoints === 0) {
                        linePoints = [];
                        linePoints.push(x);
                        linePoints.push(y);
                        poly = createLine(linePoints);
                        layer.add(poly);
                        layer.draw();
                        createDot = true;
                        newLineBool = true;
                    } else {
                        if(createDot) {
                            poly.points(poly.points().concat([x, y]));
                        }
                    }
                    nbPoints++;
                    if(createDot) {
                        let idCircle = poly.attrs['id'] + '-' + nbPoints;
                        create1Dot(x,y,idCircle);
                    } else {
                        createDot = true;
                        if(newLineBool){
                            nbPoints = 0;
                        } else {
                            nbPoints--;
                        }
                    }
                    break;
                case 2:
                    while(pointsEllipse.length > 1
                        && pointsEllipse[0][0] == pointsEllipse[1][0]
                        && pointsEllipse[0][1] == pointsEllipse[1][1]) {
                            pointsEllipse.splice(1,1);
                        }
                    pointsEllipse.push([clickPos.x,clickPos.y]);
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
                                    let clickPos = getCLickPos();
                                    ellipseTmp.radiusY(distance(pointsEllipse[0], [clickPos.x, clickPos.y]));
                                    ellipseTmp.radiusX(distance(pointsEllipse[0], [clickPos.x, clickPos.y]));
                                    layer.draw();

                                } else if(pointsEllipse.length == 2) {
                                    let clickPos = getCLickPos();
                                    ellipseTmp.radiusY(clickPos.y - pointsEllipse[0][1]);
                                    layer.draw();
                                    modeCanvas = 0;
                                    document.getElementById('btnAjoutEllipse').className =
                                    "btn btn-outline-dark btn-rounded btn-lg";
                                } else if(pointsEllipse.length == 3) {
                                    let clickPos = getCLickPos();
                                    //vertical vector
                                    let v1 = [0, 90];
                                    //vector between the center of the ellipse and the pointer
                                    let v2 = [clickPos.x - ellipseTmp.x, clickPos.y - ellipseTmp.y];
                                    let angle = getAngle(v1, v2);
                                    ellipseTmp.rotation(angle);
                                    layer.draw();
                                }

                            }
                        });

                        elli.on('dblclick', function () {
                            if(modeCanvas === 4) {
                                if(ellipseClicked) {
                                    ellipseClicked = 0;
                                    var trns = layer.getChildren(function (node) {
                                        return node.getClassName() === 'Transformer';
                                    })[0];
                                    trns.destroy();
                                    layer.draw();
                                    this.draggable(false);
                                } else {
                                    ellipseClicked = 1;
                                    this.draggable(true);
                                    idEllipse = this.attrs['id'];

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
                        elli.on('transform', function (e) {
                            let tmpX = this.scaleX();
                            let tmpY = this.scaleY();
                            let trans = layer.getChildren(function(node) {return node.getClassName() === 'Transformer';})[0];
                            trans.scaleX(1);
                            trans.scaleY(1);
                            this.scaleX(1);
                            this.scaleY(1);
                            this.radiusX(this.radiusX() * tmpX);
                            this.radiusY(this.radiusY() * tmpY);
                            layer.draw();
                        })
                    }
                    break;
                case 4:
                    if(!dragged) {
                        let circle;
                        let idCircle;
                        let circles = findSeveralCircles(clickPos);
                        let x = clickPos.x;
                        let y = clickPos.y;
                        switch (circles.length) {
                            case 0:
                                pointCreated = true;
                                if(nbPoints === 0) {
                                    linePoints = [x,y];
                                    poly = createLine(linePoints);
                                    layer.add(poly);
                                    remakeDots(poly.attrs['id']);
                                    layer.draw();
                                    createDot = true;
                                    newLineBool = true;
                                    correctionLine = true;
                                    readyToMerge = true;
                                    isCircleDragged = false;
                                    constructMode = true;
                                    createTempDot(poly.attrs['id']);
                                } else {
                                    if(createDot) {
                                        createTempDot(poly.attrs['id']);
                                    }
                                }
                                nbPoints++;
                                if(createDot) {
                                    if(!isCircleDragged) {
                                        let idCircle = poly.attrs['id'] + '-' + (poly.points().length / 2 - 1).toString();
                                        create1Dot(x,y,idCircle);
                                    } else {
                                        isCircleDragged = false;
                                    }
                                } else {
                                    createDot = true;
                                    if(newLineBool){
                                        nbPoints = 0;
                                    } else {
                                        nbPoints--;
                                    }
                                }
                                break;
                            case 1:
                                circle = circles[0];
                                idCircle = circle.attrs['id'].split('-');
                                if((!pointCreated || tmpDot) && idCircle[1] == 0 || idCircle[1] == getLine(idCircle[0]).getPoints().length / 2 - 1) {
                                    circle.stopDrag();
                                    lineFusion(circle);
                                }
                                break;
                            case 2:
                                let firstCircle = circles[0];
                                let secondCircle = circles[1];
                                let firstID = firstCircle.attrs['id'].split('-');
                                let secondID = secondCircle.attrs['id'].split('-');
                                let firstLine = getLine(firstID[0])
                                if(firstID[0] == secondID[0]) {
                                    firstLine.points().pop();
                                    firstLine.points().pop();
                                    firstLine.closed(true);
                                    remakeDots(firstID[0]);
                                } else {
                                    let secondLine = getLine(secondID[0]);
                                    if(firstID[1] == 0) {
                                        invertLinePoints(firstLine)
                                    }
                                    secondLine.points().pop();
                                    secondLine.points().pop();
                                    invertLinePoints(secondLine);
                                    concatLines(firstLine, secondLine);
                                    deleteDots(firstID[0]);
                                    firstLine.destroy();
                                    remakeDots(secondID[0]);
                                }
                                tmpDot = false;

                                break;
                            default:

                        }
                    } else {
                        dragged = false;
                    }
                    break;

                default:
                var pos = findPos(this);
                var x = e.pageX - pos.x -20;
                var y = e.pageY - pos.y-20;
                var coord = "x=" + x + ", y=" + y;
            }
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

    let isL = false;
    $(document).keyup(function (e) {
        if(e.which == 76)
        isL=false;
    }).keydown(function (e) {
        if(e.which == 76)  {
            document.getElementById('btnAjoutLigne').click();
            return false;
        }
    });

    let isM = false;
    $(document).keyup(function (e) {
        if(e.which == 77)
        isM=false;
    }).keydown(function (e) {
        if(e.which == 77)  {
            document.getElementById('btnMask').click();
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

    if( (modeCanvas === 0 || modeCanvas === 4) && zoomLevel != 1) {
        stage.draggable(true);
    }

    if(modeCanvas === 4) {
        for(var i = 0; i < layer.getChildren().length; ++i) {
            layer.getChildren()[i].draggable(false);
        }
        ellipseClicked = 0;
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

function prepareMask() {
    let lines = getAllLines();
    let ellipses = getAllEllipses();
    maskArcs();
    stage.height(270);
    stage.width(480);
    backgroundRect.hide();

    for(let i = 0; i < lines.length; ++i) {
        lines[i].stroke('white');
        lines[i].strokeWidth(1);
        for(let j = 0; j < lines[i].points().length; ++j) {
            lines[i].points()[j] = lines[i].points()[j] / xPictureInferenceRatio;
            lines[i].points()[++j] = lines[i].points()[j] / yPictureInferenceRatio;
        }
    }

    for(let i = 0; i < ellipses.length; ++i) {
        ellipses[i].stroke('white');
        ellipses[i].strokeWidth(1);
        ellipses[i].x(ellipses[i].x() / xPictureInferenceRatio);
        ellipses[i].y(ellipses[i].y() / yPictureInferenceRatio);
        ellipses[i].radiusX(ellipses[i].radiusX() / xPictureInferenceRatio);
        ellipses[i].radiusY(ellipses[i].radiusY() / xPictureInferenceRatio);
    }
}

function setMaskToNormal() {
    let lines = getAllLines();
    let ellipses = getAllEllipses();
    showArcs();

    stage.height(currentPicture.height);
    stage.width(currentPicture.width);

    for(let i = 0; i < lines.length; ++i) {
        lines[i].stroke('blue');
        lines[i].strokeWidth(3);
        for(let j = 0; j < lines[i].points().length; ++j) {
            lines[i].points()[j] = lines[i].points()[j] * xPictureInferenceRatio;
            lines[i].points()[++j] = lines[i].points()[j] * yPictureInferenceRatio;
        }
    }
    for(let i = 0; i < ellipses.length; ++i) {
        ellipses[i].stroke('blue');
        ellipses[i].strokeWidth(1);
        ellipses[i].x(ellipses[i].x() * xPictureInferenceRatio);
        ellipses[i].y(ellipses[i].y() * yPictureInferenceRatio);
        ellipses[i].radiusX(ellipses[i].radiusX() * xPictureInferenceRatio);
        ellipses[i].radiusY(ellipses[i].radiusY() * xPictureInferenceRatio);
    }
    backgroundRect.show();
    layerBkgrd.draw();
    layer.draw();
}

//Gestion des images
function afficheListeImages() {
    picturesIndex = 1;
    listIndex = listBeginning;
    intervalIDLoadImage = setInterval(asyncLoadImage, 100);
}

function asyncLoadImage() {
    if(listIndex === listBeginning + 4 || listIndex === pictureList.length) {
        clearInterval(intervalIDLoadImage);
    } else {
        if(!loadVideo) {
            var fr = new FileReader();
            fr.onload = imageHandler;
            var filename = pictureList[listIndex];
            fr.readAsDataURL(filename);
        } else {
            document.getElementById('imageL' + picturesIndex).src=pictureList[listIndex];
            picturesIndex++;
        }
        ++listIndex;
    }
}

function defileHaut() {
    var id;
    var idSuiv = "imageL1";
    if(listBeginning < pictureList.length - 4) {
        for ( let i = 2; i<5; i++) {
            id=idSuiv;
            idSuiv = "imageL"+i;
            document.getElementById(id).src = document.getElementById(idSuiv).src;
        }
        if(!loadVideo) {
            var fr = new FileReader();
            fr.onload = imageHandler;
            var filename = pictureList[listBeginning + 4];
            picturesIndex = 4;
            fr.readAsDataURL(filename);
        } else {
            document.getElementById('imageL4').src=pictureList[listBeginning + 4];
        }
        listBeginning++;
    }
}

function defileBas() {
    var id="imageL4";
    var idPrec;
    if(listBeginning <= pictureList.length - 4 && listBeginning > 0) {
        listBeginning--;
        for ( let i = 3; i>0; i--) {
            idPrec=id;
            id = "imageL"+i;
            document.getElementById(idPrec).src = document.getElementById(id).src;
        }
        if(!loadVideo) {
            var fr = new FileReader();
            fr.onload = imageHandler;
            var filename = pictureList[listBeginning];
            picturesIndex = 1;
            fr.readAsDataURL(filename);
        } else {
            document.getElementById('imageL1').src=pictureList[listBeginning];
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

function imageHandler(e2) {
    var idImg = 'imageL'+picturesIndex;
    document.getElementById(idImg).src = e2.target.result;
    ++picturesIndex;
}

function killTransformers() {
    var trns = layer.getChildren(function (node) {
        return node.getClassName() === 'Transformer';
    })[0];
    if(trns){
        trns.destroy();
    }
}

function load1Picture() {

    $("body").append("<input type='file' id='explorerChargement' accept='image/*' multiple>");
    input = document.getElementById('explorerChargement');

    var y = document.getElementById("explorerChargement");
    y.addEventListener('change', loadimage, false);
    input.click();
}

function loadimage(e1) {
    for(var i = 0; i < e1.target.files.length; ++i) {
        pictureList.push(e1.target.files[i]);
    }
    afficheListeImages();
    document.getElementById("explorerChargement").remove();
}

function realiasing(data) {
    let width = currentPicture.width;
    for(let i = 0; i < currentPicture.height; ++i) {
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
        pictureList.splice(pictureList.indexOf(selected.shift()),1);
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
    /*works everywhere on the document, not only the stage*/
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
    return angle;
}

function insererEnPos(tab, elem, pos) {
    var deb = tab.slice(0,pos);
    var fin = tab.slice(pos, tab.length);
    deb.push(elem);
    return deb.concat(fin);
}

function sontEnvironEgales(val1, val2, erreur) {
    let ret = false;
    if(val1 <= val2 + erreur && val1 >= val2 - erreur) {
        ret = true;
    }
    return ret;
}

function sontEnvironEgalesProportionnelles(val1, val2) {
    let ret = false;
    let erreur = 4 * val1 / 100; //4% de la valeur à comparer
    if(val1 <= val2 + erreur && val1 >= val2 - erreur) {
        ret = true;
    }
    return ret;
}

function sontVoisins(p1, p2, angle) {
    var ret  = false;
    if(sontEnvironEgales(p1[0], p2[0], 1) && sontEnvironEgales(p1[1], p2[1], 1)) {
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
        pictureList.push(dataurl);
    }
    nbFrame++;
}

function extractFromVideo() {
    $("body").append("<input type='file' id='explorerloadVideo' accept='video/*'>");
    input = document.getElementById('explorerloadVideo');
    var y = document.getElementById("explorerloadVideo");
    y.addEventListener('change', loadVideo, false);
    input.click();
    loadVideo = true;
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
    document.getElementById("explorerloadVideo").remove();
}

//Gestion des masques d'inférence
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
}

function concatAnnotations(ptsAnnot) {
    var k = 0;
    while(k < ptsAnnot.length) {
        var l = k+1;
        while ( l < ptsAnnot.length) {
            if(voisinageDebDeb(ptsAnnot[k], ptsAnnot[l])) {
                ptsAnnot[k] = ptsAnnot[l].reverse().concat(ptsAnnot[k]);
                ptsAnnot.splice(l, 1);
            } else if(voisinageDebFin(ptsAnnot[k], ptsAnnot[l])) {
                ptsAnnot[k] = ptsAnnot[l].concat(ptsAnnot[k]);
                ptsAnnot.splice(l, 1);
            } else if(voisinageDebFin(ptsAnnot[l], ptsAnnot[k])) {
                ptsAnnot[k] = ptsAnnot[k].concat(ptsAnnot[l]);
                ptsAnnot.splice(l, 1);
            } else if(voisinageFinFin(ptsAnnot[k], ptsAnnot[l])) {
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

function voisinageDebDeb(annot1, annot2) {
    let ret = false;
    if(annot1[1][0] <= annot2[1][0] + 1 && annot1[1][0] >= annot2[1][0] - 1) {
        if(sontVoisins(annot1[0], annot2[0])) {
            ret = true;
        } else if(sontVoisins(annot1[1], annot2[0])) {
            ret = true;
        } else if(sontVoisins(annot1[0], annot2[1])) {
            ret = true;
        } else if(sontVoisins(annot1[1], annot2[1])) {
            ret = true;
        }
    }
    return ret;
}

function voisinageDebFin(annot1, annot2) {
    let ret = false;
    let last = annot2.length-1;
    if(annot1[1][0] <= annot2[last][0] + 1 && annot1[1][0] >= annot2[last][0] - 1) {
        if(sontVoisins(annot1[0], annot2[last])) {
            ret = true;
        } else if(sontVoisins(annot1[1], annot2[last])) {
            ret = true;
        } else if(sontVoisins(annot1[0], annot2[--last])) {
            ret = true;
        } else if(sontVoisins(annot1[1], annot2[last])) {
            ret = true;
        }
    }
    return ret;
}

function voisinageFinFin(annot1, annot2) {
    let ret = false;
    let last1 = annot1.length-1;
    let last2 = annot2.length-1;
    if(annot1[last1][0] <= annot2[last2][0] + 1 && annot1[last1][0] >= annot2[last2][0] - 1) {
        if(sontVoisins(annot1[last1], annot2[last2])) {
            ret = true;
        } else if(sontVoisins(annot1[last1 - 1], annot2[last2])) {
            ret = true;
        } else if(sontVoisins(annot1[last1], annot2[--last2])) {
            ret = true;
        } else if(sontVoisins(annot1[last1 - 1], annot2[last2])) {
            ret = true;
        }
    }
    return ret;
}

function getExtremitesLigne(data, i, j) {
    let k = j;
    while(data[(i*inferenceWidth+(k+1))*4] != 0) {
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
    $("body").append("<canvas id='canvasMasque' style='visibility: visible' width='" + inferenceWidth + "' height='" + inferenceHeight + "'>")
    var canvas = document.getElementById('canvasMasque');
    xPictureInferenceRatio = currentPicture.width / inferenceWidth;
    yPictureInferenceRatio = currentPicture.height / inferenceHeight;
    var img = new Image(inferenceWidth, inferenceHeight);
    img.src = e2.target.result;
    canvas.height = img.height;
    canvas.width = img.width;
    ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    // 2.6 est un coefficient calculé pour obtenir une bonne valeur de
    // minVisibleDistance pour les images testées, le coefficient permet de garder
    // cette valeur pour toutes les images
    minVisibleDistance = currentPicture.width / inferenceWidth * 2.6;
    var data = ctx.getImageData(0,0,canvas.width, canvas.height).data;
    var ptsAnnotations = [];
    var k;

    gapImportantPoints = parseInt(document.getElementById('inputCoef').value);
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
                                && sontEnvironEgales(ligne[1][1], ptsAnnotations[k][0][1], 1)) {//ligne au début de l'annotation
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
            if(ptsAnnotations[i].length > gapImportantPoints || distance(ptsAnnotations[i][0], ptsAnnotations[i][ptsAnnotations[i].length - 1]) > minVisibleDistance){
                bonsPoints = pointsImportants(ptsAnnotations[i]);
                if (distance(bonsPoints[0], bonsPoints[bonsPoints.length - 1]) < 5) {
                    modeCanvas = 3;
                    bonsPoints.pop();
                } else {
                    modeCanvas = 1;
                }

                for(let j = 0; j < bonsPoints.length; ++j) {
                    bonsPoints[j][0] = bonsPoints[j][0] * yPictureInferenceRatio;// + 1;
                    bonsPoints[j][1] = bonsPoints[j][1] * xPictureInferenceRatio;// + 1;
                }

                let x = bonsPoints[0][1];
                let y = bonsPoints[0][0];
                let poly = createLine([x,y]);
                layer.add(poly);
                nbPoints = 0;
                let idCircle = poly.attrs['id'] + '-' + nbPoints;
                nbPoints++;
                create1Dot(x,y,idCircle);
                for(let j = 1; j<bonsPoints.length;++j) {
                    let x = bonsPoints[j][1];
                    let y = bonsPoints[j][0];
                    poly.points(poly.points().concat([x, y]));

                    let idCircle = poly.attrs['id']+'-'+nbPoints;
                    nbPoints++;
                    create1Dot(x,y,idCircle);
                }
                layer.draw();
                modeCanvas = 0;
                btnCorrection.click();
            }
        }
    } else {
        alert("Erreur de chargement du masque")
    }
    document.getElementById('explorerMasque').remove();
    // console.log(performance.now() - startTime);
}

function masquerMasque() {

    if (isMaskVisible) {
        isMaskVisible = false;
        layer.hide();
        document.getElementById('btnMask').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
    } else {
        isMaskVisible = true;
        layer.show();
        document.getElementById('btnMask').className = "btn btn-outline-dark btn-rounded btn-lg";
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
    for(var i = gapImportantPoints; i < last-gapImportantPoints; i+=gapImportantPoints) {
        if (!(ptsAnnot[i][0] - ptsAnnot[i-gapImportantPoints][0] == ptsAnnot[i+gapImportantPoints][0] - ptsAnnot[i][0]
            && ptsAnnot[i][1] - ptsAnnot[i-gapImportantPoints][1] == ptsAnnot[i+gapImportantPoints][1] - ptsAnnot[i][1])) {
                //S'il y a un écart
                let penteDeb = ptsAnnot[i][0] - ptsAnnot[i - gapImportantPoints][0] / ptsAnnot[i][1] - ptsAnnot[i - gapImportantPoints][1];
                let penteFin = ptsAnnot[i + gapImportantPoints][0] - ptsAnnot[i][0] / ptsAnnot[i + gapImportantPoints][1] - ptsAnnot[i][1];
                if(penteDeb / penteFin < 1 - ecartPente){
                    if(!pointsEgaux(points[points.length-1], ptsAnnot[i - Math.round(gapImportantPoints/2)])) {
                        points.push(ptsAnnot[i - Math.round(gapImportantPoints/2)]);
                    }
                }
                points.push(ptsAnnot[i]);
                if (penteDeb / penteFin > 1 + ecartPente) {
                    points.push(ptsAnnot[i + Math.round(gapImportantPoints/2)]);
                }
            }
        }
        points.push(ptsAnnot[last]);
        return points;
    }

function pointsEgaux(pt1, pt2) {
    ret = false;
    if(pt1[0] == pt2[0] && pt1[1] == pt2[1]) {
        ret = true;
    }
    return ret;
}

//Debug
function displayCircle(cercle) {
    console.log('id : ' + cercle.attrs['id']);
    console.log('zIndex : ' + cercle.zIndex());
    console.log('Position : x ' + cercle.x() + ' y ' + cercle.y());
}

function displayLine(line) {
    console.log('id : ' + line.attrs['id']);
    console.log('zIndex : ' + line.zIndex());
    let message = "Points : "
    for(i = 0; i < line.points().length; ++i) {
        message += 'x ' + line.points()[i] + ' y ' + line.points()[++i] + ' | ';
    }
    console.log(message);

}

function displayConstructionVariables() {
    console.log("tmpDot : " + tmpDot);
    console.log("nbPoints : " + nbPoints);
    console.log("newLineBool : " + newLineBool);
    console.log("createDot : " + createDot);
    console.log("poly exists : " + (poly != undefined));
    console.log("correctionLine : " + correctionLine);
    console.log("readyToMerge : " + readyToMerge);
    console.log("constructMode : " + constructMode);
    console.log("firstPointAdded : " + firstPointAdded);
}

//Création et modification d'annotation
function cancelAnnotation() {
    if(modeCanvas == 1 || modeCanvas == 3) {
        var children = layer.getChildren();
        var last = children[children.length - 1];
        if(last.getClassName() === 'Arc') {
            var lines = layer.getChildren(function (node) {
                return node.getClassName() === 'Line'
            });
            var line = lines[lines.length - 1];
            line.points().pop();
            line.points().pop();
            let idCercle = last.attrs['id'].split('-')[1];
            let idLine = last.attrs['id'].split('-')[0];
            children.pop();
            if (line.points().length === 2 && modeCanvas != 1 && modeCanvas != 3) {
                children.pop();
                children.pop();
            } else {
                nbPoints--;
                shiftCirclesID(1, idCercle, idLine);
            }
        } else if(last.getClassName() === 'Line'){ //dernier children est une ligne
            children.pop();
        }
        layer.draw();
    }
}

function concatLines(line1, line2) {
    //makes line2 have line1's points and then its own

    //This first solution takes time and is asynchronous,
    //that causes some issues
    //line2.points(line1.points().concat(line2.points()));
    let points1 = line1.points();
    let points2 = line2.points();
    line2.points(points1);
    for(let i = 0; i < points2.length; ++i) {
        line2.points().push(points2[i]);
    }

}

function create1Dot(x, y, idCircle) {
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
        if(clickType == clickDrag) {
            this.stroke('green');
            oldPos[0] =  this.x();
            oldPos[1] =  this.y();
            isCircleDragged = true;
        } else {
            this.stopDrag();
        }
    });
    circle.on('mousedown', function (e) {
        clickType = e.evt.button;
        this.stroke('green');
        layer.draw();
        this.startDrag();
    });
    circle.on('dragmove', function (e) {
            createDot = false;
            newLineBool = false;
            nbPoints = 0;
            let diffX = this.x() - oldPos[0];
            let diffY = this.y() - oldPos[1];
            let id = this.attrs['id'];
            let ligne = parseInt(id.split('-')[0]);
            let points = parseInt(id.split('-')[1]);
            let line = getLine(ligne);
            line.points()[2*points] += diffX;
            line.points()[2*points+1] += diffY;
            oldPos[0] = this.x();
            oldPos[1] = this.y();
    });

    circle.on('dragend', function () {
        this.stroke('red');
        layer.draw();
        if(tmpDot && clickType == clickDrag) {
            this.startDrag();
        } else if(!(sontEnvironEgalesProportionnelles(oldPos[0], this.x())
                && sontEnvironEgalesProportionnelles(oldPos[1], this.y()))) {
            createDot = false;
            newLineBool = false;
            poly = undefined;
            nbPoints = 0;
            isCircleDragged = false;
            dragged = true;
        }
    });
    circle.on('click', function (e) {
        clickType = e.evt.button;
        switch(clickType) {
            case clickAdd:
                if( modeCanvas === 5) {
                    deleteDot(this);
                } else {
                    displayCircle(this);
                }
                break;
            case clickDelete:
                if( modeCanvas === 4) {
                    deleteDot(this);
                }
                break;
        }
    });
    circle.on('contextMenu', function (e) {
        e.preventDefault();
    });
    layer.add(circle);
    layer.draw();

    return circle;
}

function createTempDot(idLine) {
    let clickPos = getCLickPos();
    let line = getLine(idLine);
    poly = line;
    line.points().push(clickPos.x);
    line.points().push(clickPos.y);
    //destroy all the dots of the line to easily find the currently dragged dot
    // and create the new dot at the same time, it's overkill but isn't that
    // heavy for the app
    remakeDots(idLine);
    let dot = getDot((line.points().length / 2 - 1).toString(), idLine);
    currentCircle = dot;
    clickType = clickDrag; //trick not to stop the drag
    tmpDot = true;
    dot.startDrag();
    ++nbPoints;
}

function createLine(linePoints) {
    var poly = new Konva.Line({
        points: linePoints,
        stroke: 'blue',
        strokeWidth: 3,
        id: nbElem,
    });
    ++nbElem;

    poly.on('dragstart', function () {
        oldPos[0] =  this.x();
        oldPos[1] =  this.y();
    });
    poly.on('dragend', function () {
        let circles = getAllDots();
        let idLigne = this.attrs['id'];
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
        clickType = e.evt.button;
        let clickPos = getCLickPos();
        let circle;
        let idCircle;
        circle = findCircle(clickPos);
        switch (clickType) {
            //Left click
            case clickAdd:
                leftMouseDown = true;
                switch (modeCanvas) {
                    case 0:
                        displayLine(this);
                        break;
                    case 1:
                        if(circle != undefined) {
                            idCircle = findCircle(clickPos).attrs['id'].split('-');
                            if(idCircle[1] == 0 || idCircle[1] == getLine(idCircle[0]).getPoints().length / 2 - 1) {
                                lineFusion(dot);
                            }
                        }
                        break;
                    case 4:
                        if(layer.getChildren(function(node) {return node.isDragging() && node.getClassName() === 'Arc'}).length == 0) {
                            if(circle == undefined) {
                                let idLigne = this.attrs['id'];
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
                                        remakeDots(idLigne);
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
                                        remakeDots(idLigne);
                                        added = true;
                                        layer.draw();
                                    }
                                }
                                let dot = findCircle(clickPos);
                                if(dot != undefined) {
                                    mousedwn = true;
                                    clickType = clickDrag;
                                    dot.stroke('green');
                                    layer.draw();
                                    dot.startDrag();
                                }
                            }
                        }
                        break;
                    default:
                        break;

                }
                break;
            // Mouse wheel click
            case clickDelete :
                switch (modeCanvas) {
                    case 4:
                        if(circle != undefined) {
                            deleteDot(circle);
                            deletedDot = true;
                        }
                        break;
                    default:

                }
                break;
            //Right click
            case clickDrag:
                switch (modeCanvas) {
                    case 4:
                    if(!leftMouseDown && layer.getChildren(function(node) {return node.isDragging() && node.getClassName() === 'Arc'}).length == 0) {
                        if(circle != undefined) {
                            stage.stopDrag();
                            circle.stroke('green');
                            layer.draw();
                            circle.startDrag();
                        } else {
                            stage.draggable(false);
                            let idLigne = this.attrs['id'];
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
                                    remakeDots(idLigne);
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
                                    remakeDots(idLigne);
                                    added = true;
                                    layer.draw();
                                }
                            }
                            let dot = findCircle(clickPos);
                            if(dot != undefined) {
                                mousedwn = true;
                                clickType = clickDrag;
                                dot.stroke('green');
                                layer.draw();
                                dot.startDrag();
                            }
                        }
                    }


                        break;
                    default:
                }
                break;
            default:
        }
    });
    poly.on('click', function () {
        switch (modeCanvas) {
            case 5:
                let idLigne = this.attrs['id'];
                deleteDots(idLigne);
                this.destroy();
                layer.draw();
                boutonsOff();
                modeCanvas = 0;
                updateAnnotationsID(idLigne);
                --nbElem;
                break;
            default:
        }

    });

    poly.on('mouseup', function() {
        stopAllDrag();
        leftMouseDown = false;
    });

    if(modeCanvas == 3) {
        let sel = document.getElementById('selectFill');
        poly.closed(true);
        poly.fill(sel.value);
    }
    return poly;
}

function shiftCirclesID(sens, indice, idLigne) {
    /*
        sens = 1 => on ajoute un à chaque partie cercle des id
        sens = -1 => on retire un à chaque partie cercle des id
    */
    let circles = getDots(idLigne);
    if(sens == -1) {
        for(let i = indice; i < circles.length; ++i) {
            displayCircle(circles[i]);
            let id = circles[i].attrs['id'].split('-');
            let modif = parseInt(id[1]) - 1;
            circles[i].zIndex(circles[i].zIndex() - 1);
            circles[i].attrs['id'] = id[0] + '-' + (modif.toString());
            displayCircle(circles[i]);
        }
    } else {
        for(let i = indice; i < circles.length; ++i) {
            displayCircle(circles[i]);
            let id = circles[i].attrs['id'].split('-');
            let modif = parseInt(id[1]) + 1;
            circles[i].zIndex(circles[i].zIndex() + 1);
            circles[i].attrs['id'] = id[0] + '-' + (modif.toString());
            displayCircle(circles[i]);
        }
    }
}

function shiftCirclesIdNTimes(sens, indice, idLigne, n) {
    //works only to move existing dots to the end
    let dots = getDots(idLigne);
    if(sens > 0) {
        for(let i = 0; i < dots.length; ++i) {
            let id = dots[i].attrs['id'].split('-');
            let modif = parseInt(id[1]) + n;
            dots[i].zIndex(dots[i].zIndex() + n);
            dots[i].attrs['id'] = id[0] + '-' + (modif.toString());

        }
    } else {
        for(let i = 0; i < dots.length; ++i) {
            let id = dots[i].attrs['id'].split('-');
            let modif = parseInt(id[1]) - n;
            dots[i].zIndex(dots[i].zIndex() - n);
            dots[i].attrs['id'] = id[0] + '-' + (modif.toString());

        }
    }
}

function deleteDot(dot) {
    let id = dot.attrs['id'];
    let lineID = parseInt(id.split('-')[0]);
    let pointID = parseInt(id.split('-')[1]);
    let line = getLine(lineID);
    line.points().splice(2*pointID, 2);
    if(line.closed() && line.points().length == 4) {
        line.closed(false);
    }
    if(line.points().length == 2) {
        deleteDots(lineID);
        line.destroy();
    } else {
        remakeDots(lineID);
    }
    layer.draw();
}

function deleteDots(idLine) {
    let dots = getDots(idLine);
    for(let i = 0; i < dots.length; ++i) {
        dots[i].destroy();
    }
}

function findCircle(clickPos) {
    let allCircles = getAllDots();
    let founded = false;
    let res = undefined;
    for(let i = 0; !founded && i < allCircles.length; ++i) {
        if(distance([clickPos.x, clickPos.y], [allCircles[i].x(), allCircles[i].y()]) < allCircles[i].outerRadius()) {
            res = allCircles[i];
            founded = true;
        }
    }
    return res;
}

function findSeveralCircles(clickPos) {
    let allCircles = getAllDots();
    let founded = false;
    let res = [];
    for(let i = 0; !founded && i < allCircles.length; ++i) {
        if(distance([clickPos.x, clickPos.y], [allCircles[i].x(), allCircles[i].y()]) < allCircles[i].outerRadius()) {
            res.push(allCircles[i]);
        }
    }
    return res;
}

function findOtherCircle(idCircle, clickPos) {
    let allCircles = layer.getChildren(function (node) {
        return node.getClassName() === 'Arc' && node.attrs['id'] != idCircle;
    });
    let founded = false;
    let res = undefined;
    for(let i = 0; !founded && i < allCircles.length; ++i) {
        if(distance([clickPos.x, clickPos.y], [allCircles[i].x(), allCircles[i].y()]) < allCircles[i].outerRadius()) {
            res = allCircles[i];
            founded = true;
        }
    }
    return res;
}

function invertLinePoints(line) {
    let invertedPoints = [];
    for(let i = line.points().length - 2; i >= 0; i -= 3) {
        invertedPoints.push(line.points()[i++]); //ajout x
        invertedPoints.push(line.points()[i]); // ajout y
    }
    line.points(invertedPoints);
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

function getAllEllipses() {
    /*
    Retourne tous les cercles sur la stage
    */
    let ellipses = layer.getChildren(function(node){
        return node.getClassName() === 'Ellipse';
    });
    return ellipses;
}

function getAllLines() {
    /*
    Retourne tous les cercles sur la stage
    */
    let lines = layer.getChildren(function(node){
        return node.getClassName() === 'Line';
    });
    return lines;
}

function getCLickPos() {
    let clickPos = stage.getPointerPosition();
    clickPos.x = (clickPos.x  - stage.x()) / zoomLevel;
    clickPos.y = (clickPos.y  - stage.y()) / zoomLevel;
    return clickPos;
}

function getDot(idPoint, idLigne) {
    /*
    Retourne le point spécifié
    */
    let circles = layer.getChildren(function(node){
        return node.getClassName() === 'Arc'
        && node.attrs['id'].split('-')[0] == idLigne
        && node.attrs['id'].split('-')[1] == idPoint;
    });
    return circles[0];
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

function getLine(idLigne) {
    /*
    Retourne tous les cercles associés à une ligne
    */
    let line = layer.getChildren(function(node){
        return node.getClassName() === 'Line' && node.attrs['id'] == idLigne;
    });
    return line[0];
}

function lineFusion(dot) {
    let clickPos = getCLickPos();
    circle = findCircle(clickPos);
    let idPoint = circle.attrs['id'];
    newLine = getLine(idPoint.split('-')[0]);
    createDot = false;
    if(nbPoints != 0 ) {
        if(idPoint.split('-')[0] != poly.attrs['id']) {
            //If the point doesn't belong to the selected line
            if(idPoint.split('-')[1] != newLine.points().length / 2 - 1) {
                //If the selected dot is not the end of the line
                invertLinePoints(newLine);
            }
            if(correctionLine) {
                //if a new line has been created, the order of the points has to change
                invertLinePoints(poly);
                correctionLine = false;
            }

            concatLines(newLine, poly);
            let lineTmp = poly;
            let idTmp = lineTmp.attrs['id'];
            let changingID = newLine.attrs['id'];
            poly = newLine;
            deleteDots(idTmp);
            deleteDots(changingID);
            if(poly.attrs['id'] > lineTmp.attrs['id']) {
                changingID = lineTmp.attrs['id'];
            }
            poly.attrs['id'] = changingID;
            lineTmp.destroy();
            remakeDots(poly.attrs['id']);
            layer.draw();


        } else {
            if(!constructMode) {
                poly.closed(true);
                layer.draw();
            }
        }
        resetCorrection();
    } else {
        if(idPoint.split('-')[1] != newLine.points().length / 2 - 1) {
            //If the point is the beginning of the line, we invert the
            //line to make the point the end
            invertLinePoints(newLine);
        }
        poly = newLine;
        isCircleDragged = false;
        newLineBool = false;
        readyToMerge = true;
        createDot = true;
        correctionLine = true;
        constructMode = true;
        remakeDots(poly.attrs['id']);
        nbPoints = poly.points().length / 2 - 1;
        createTempDot(poly.attrs['id']);
    }
}

function updateAnnotationsID(id) {
    let lignes = getAllLines();
    for(let i = id; i < lignes.length; ++i) {
        let idTmp = lignes[i].attrs['id'];
        let cercles = getDots(idTmp);
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

function remakeDots(idLine) {
    let line = getLine(idLine);
    deleteDots(idLine);
    for(let i = 0; i < line.points().length; ++i) {
        let x = line.points()[i];
        let numCircle = i /2;
        let y = line.points()[++i];
        let id = idLine + '-' + numCircle.toString();
        create1Dot(x, y, id);
    }
}

function resetCorrection() {
    if(tmpDot) {
        poly.points().pop();
        poly.points().pop();
        remakeDots(poly.attrs['id']);
        tmpDot = false;
    }
    nbPoints = 0;
    newLineBool = true;
    createDot = false;
    poly = undefined;
    correctionLine = false;
    readyToMerge = false;
    constructMode = false;
    firstPointAdded = false;
}

function stopAllDrag() {
    let elem = layer.getChildren(function(node){
        return node.isDragging();
    });
    for(i = 0; i < elem.length; ++i) {
        elem[i].stopDrag();
        elem[i].stroke('red');
    }
    stage.stopDrag();

}

//Gestion de l'export textuel
function serializeEllipse(elli) {
    let deb = "\t\t{\n"
    let center = "\t\t\t\"center\" : [" + elli.x().toString() + ", " + elli.y().toString() + "],\n";
    let radX = "\t\t\t\"radiusX\" : " + elli.radiusX().toString() + ",\n";
    let radY = "\t\t\t\"radiusY\" : " + elli.radiusY().toString() + ",\n";
    let rotation = "\t\t\t\"rotation\" : " + elli.rotation().toString() + "\n";
    let fin = "\t\t}";
    let ret = deb + center + radX + radY + rotation + fin;
    return ret;
}

function serializeEllipses(ellipses) {
    let str = "{\n\t\"ellipses\" : [\n";
    for(let i = 0; i < ellipses.length - 1; ++i) {
        str += serializeEllipse(ellipses[i]) + ',\n';
    }
    str += serializeEllipse(ellipses[ellipses.length - 1]) + '\n';
    str += "\t]\n}"
    return str;
}

function serializeLine(line) {
    let deb = "\t\t{\n"
    let closed = "\t\t\t\"closed\" : " + line.closed().toString() + ",\n";
    let points = "\t\t\t\"points\" : [";
    for(let i = 0; i < line.points().length - 2; ++i) {
        points += (line.points()[i] * ratioX).toString() + ", ";
        points += (line.points()[++i] * ratioY).toString() + ", ";
    }
    points += (line.points()[line.points().length - 2] * ratioX).toString() + ", ";
    points += (line.points()[line.points().length - 1] * ratioY).toString() + "]\n ";
    let fin = "\t\t}";
    let ret = deb + closed + points + fin;
    return ret;
}

function serializeLines(lines) {
    let str = "{\n\t\"lines\" : [\n";
    for(let i = 0; i < lines.length - 1; ++i) {
        str += serializeLine(lines[i]) + ',\n';
    }
    str += serializeLine(lines[lines.length-1]) + '\n';
    str += "\t]\n}"
    return str;
}

//Gestion du réseau onnx
// function annotationImagePrincipale() {
    // runExample();
    // const myOnnxSession = new onnx.InferenceSession();
    // // load the ONNX model file
    // myOnnxSession.loadModel("./ipcai_baseline_CP30.onnx").then(() => {
    //     // generate model input
    //     let canvas = document.getElementById('canvasRedimmension');
    //     let ctx = canvas.getContext();
    //     currentPicture.getContext();
    //     // canvas.src = document.getElementById('imageCourante').src;
    //     ctx.drawImage(currentPicture, 0, 0, inferenceWidth, inferenceHeight);
    //
    //     /*
    //      ajout de deux lignes noires à la fin de l'image pour le fonctionnement
    //      du réseau utilisé
    //     */
    //     let imgdata = ctx.getImageData();
    //     for(let i = 0; i < 2 * 4 * inferenceWidth; ++i) {
    //         imgdata.push(0);
    //     }
    //     /*conversion en float32 pour le fonctionnement du réseau*/
    //     let imgdataFloat32 = [];
    //     imgdata.forEach((element, i) => {
    //         imgdataFloat32.push(element / 255.0);
    //     });
    //     let tnsr = new Tensor(imgdataFloat32, 'float32')
    //     let tensorTab = new ReadonlyArray(tnsr);
    //     const inferenceInputs = getInputs();
    //     // execute the model
    //     myOnnxSession.run(tnsr).then((output) => {
    //         // consume the output
    //         const outputTensor = output.values().next().value;
    //         console.log(`model output tensor: ${outputTensor.data}.`);
    //     });
    // });
// }
//
//
// async function runExample() {
//   // Create an ONNX inference session with WebGL backend.
//   const session = new onnx.InferenceSession({ backendHint: 'webgl' });
//
//   // Load an ONNX model. This model is Resnet50 that takes a 1*3*224*224 image and classifies it.
//   await session.loadModel("./resnet50_8.onnx");
//
//   // Load image.
//   // const width = 480;
//   // const height = 270;
//
//   let canvas = document.getElementById('canvasRedimmension');
//   let ctx = canvas.getContext();
//   currentPicture.getContext();
//   // canvas.src = document.getElementById('imageCourante').src;
//   ctx.drawImage(currentPicture, 0, 0, inferenceWidth, inferenceHeight);
//
//   const imageLoader = new ImageLoader(480, 270);
//   let imgDtTmp = await imageLoader.getImageData(ctx.toDataURL()); //Fonctionne avec une dataURL
//   // let imgDtTmp = oldImageData;
//   for(let i = 270*480*4; i < imgDtTmp.data.length; ++i) {
//       imgDtTmp.data[i] = 0;
//       imgDtTmp.data[++i] = 0;
//       imgDtTmp.data[++i] = 0;
//   }
//   imgDtTmp.height = 272;
//
//   const imageData = imgDtTmp;
//
//   // Preprocess the image data to match input dimension requirement, which is 1*3*224*224.
//   /*
//    imageSize = 224, declaration non-trouvée
//    erreur si la valeur est modifiée avec le modèle
//    test, peut-être pas avec un autre.
//   */
//   const width = imageSize;
//   const height = imageSize;
//   const preprocessedData = preprocess(imageData.data, width, height);
//
//   const inputTensor = new onnx.Tensor(preprocessedData, 'float32', [1, 3, width, height]);
//   // Run model with Tensor inputs and get the result.
//   const outputMap = await session.run([inputTensor]);
//   const outputData = outputMap.values().next().value.data;
//
//   // Render the output result in html.
//   printMatches(outputData);
// }
//
// /**
//  * Preprocess raw image data to match Resnet50 requirement.
//  */
// function preprocess(data, width, height) {
//   const dataFromImage = ndarray(new Float32Array(data), [width, height, 4]);
//   const dataProcessed = ndarray(new Float32Array(width * height * 3), [1, 3, height, width]);
//
//   // Normalize 0-255 to (-1)-1
//   ndarray.ops.divseq(dataFromImage, 128.0);
//   ndarray.ops.subseq(dataFromImage, 1.0);
//
//   // Realign imageData from [224*224*4] to the correct dimension [1*3*224*224].
//   ndarray.ops.assign(dataProcessed.pick(0, 0, null, null), dataFromImage.pick(null, null, 2));
//   ndarray.ops.assign(dataProcessed.pick(0, 1, null, null), dataFromImage.pick(null, null, 1));
//   ndarray.ops.assign(dataProcessed.pick(0, 2, null, null), dataFromImage.pick(null, null, 0));
//
//   return dataProcessed.data;
// }
//
// /**
//  * Utility function to post-process Resnet50 output. Find top k ImageNet classes with highest probability.
//  */
// function imagenetClassesTopK(classProbabilities, k) {
//   if (!k) { k = 5; }
//   const probs = Array.from(classProbabilities);
//   const probsIndices = probs.map(
//     function (prob, index) {
//       return [prob, index];
//     }
//   );
//   const sorted = probsIndices.sort(
//     function (a, b) {
//       if (a[0] < b[0]) {
//         return -1;
//       }
//       if (a[0] > b[0]) {
//         return 1;
//       }
//       return 0;
//     }
//   ).reverse();
//   const topK = sorted.slice(0, k).map(function (probIndex) {
//     const iClass = imagenetClasses[probIndex[1]];
//     return {
//       id: iClass[0],
//       index: parseInt(probIndex[1], 10),
//       name: iClass[1].replace(/_/g, ' '),
//       probability: probIndex[0]
//     };
//   });
//   return topK;
// }
//
// /**
//  * Render Resnet50 output to Html.
//  */
// function printMatches(data) {
//   let outputClasses = [];
//   if (!data || data.length === 0) {
//     const empty = [];
//     for (let i = 0; i < 5; i++) {
//       empty.push({ name: '-', probability: 0, index: 0 });
//     }
//     outputClasses = empty;
//   } else {
//     outputClasses = imagenetClassesTopK(data, 5);
//   }
//   const predictions = document.getElementById('predictions');
//   predictions.innerHTML = '';
//   const results = [];
//   for (let i of [0, 1, 2, 3, 4]) {
//     results.push(`${outputClasses[i].name}: ${Math.round(100 * outputClasses[i].probability)}%`);
//   }
//   predictions.innerHTML = results.join('<br/>');
// }
