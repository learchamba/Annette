// import * from "./onnx.ts";

var btnMasquer;
var btnChargement;
var canvas;
var chargementVideo = false;
var clickType;
var constructMode;
var createDot;
var ctx;
var currentCircle;
var debutListe = 0;
var deletedDot = false;
var distanceVisibleMin;
var divImgPrinc;
var dragged;
var ecartPointsImportants = 10;
var ellipseCliquee = 0;
var ellipseFinished = false;
var ellipseTmp = undefined;
var firstPointAdded = false;
var hauteurInference = 270;
var idEllipse;
var imageCourante;
var imageMasque;
var indiceImageCourante;
var indiceImages;
var indiceListe;
var initialPosStage;
var input;
var intervalIDLoadImage;
var isCircleDragged = false;
var largeurInference = 480;
var layer;
var layerBkgrd;
var listeImages = [];
var longClick = 500;
var masqueVisible = true;
var mousedwn = true;
var nbElem;
var nbFrame;
var nbPoints = 0;
var newLineBool;// = true;
var newLine;
var correctionLine = false;
var niveauZoom = 1;
var oldPos = [];
var oldPosStage = [];
var pictureScroll = 0;
var pointsEllipse;
var pointCreated;
var poly;
var ptsLigne;
var rapportImageInferenceX;
var rapportImageInferenceY;
var ratioX;
var ratioY;
var readyToMerge;
var rectFond;
var rectNoir;
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

        } else {
            boutonsOff();
            modeCanvas = 4;
            document.getElementById('btnCorrection').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
            // stage.draggable(false);
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
        // $("body").append("<a href='" + stage.toDataURL() + "' id='DLCanvas' download='annotation" + indiceImageCourante + ".jpg'>");
        maskArcs();
        var y = document.getElementById("DLCanvas");
        let nomImage = listeImages[indiceImageCourante - 1].name.split('.')[0];
        killTransformers();
        ratioY = imageCourante.naturalHeight / imageCourante.height;
        ratioX = imageCourante.naturalWidth / imageCourante.width;
        rapportImageInferenceX = imageCourante.width / largeurInference;
        rapportImageInferenceY = imageCourante.height / hauteurInference;

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
            // let image = new Konva.Image();
            // image.image(stage.toImage({callback(img){
            //     image.image(img);
            // }}));
            // image.cache();
            // // image.filters([Konva.Filters.Threshold]);
            // var OpacityFilter = function (imageData) {
            //
            //   var nPixels = imageData.data.length;
            //   for (var i = 0; i < nPixels; i += 1) {
            //     if(imageData.data[i] != 0 && imageData.data[i] != 255){
            //         if(imageData.data[i] > 128) {
            //             imageData.data[i] = 255;
            //         } else {
            //             imageData.data[i] = 0;
            //         }
            //         console.log(i);
            //     }
            //   }
            // };
            // image.filters[OpacityFilter];
            // // image.threshold(0.5);
            // y.href = image.toDataURL();

            y.href = stage.toDataURL();
            nomFicMasque = 'masque-' + nomImage + '.png';
            y.download = nomFicMasque;
            y.addEventListener('change', downloadimage, false);
            maskData = y.href;
            setMaskToNormal();


            // setTimeout(function(){}, 5000);
            // image.filters([Konva.Filters.Threshold]);
            // image.threshold(0.5);
            // y.href = image.toDataURL();
            //
            // // y.href = stage.toDataURL();
            // nomFicMasque = 'masque-' + nomImage + '.png';
            // y.download = nomFicMasque;
            // y.addEventListener('change', downloadimage, false);
            // maskData = y.href;
            // setMaskToNormal();
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
        layerBkgrd = new Konva.Layer();
        // layerBkgrd.getContext().imageSmoothingEnabled = false;
        var imgBkgrd = new Image();
        imgBkgrd.src = './fondNoir.png';
        rectNoir = new Konva.Rect( {
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
        layerBkgrd.add(rectNoir);

        imgBkgrd = new Image();
        imgBkgrd.src = this.src;
        rectFond = new Konva.Rect( {
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
        layerBkgrd.add(rectFond);
        stage.add(layerBkgrd);
        layerBkgrd.draw();
        layer = new Konva.Layer();
        stage.add(layer);

        // stage.on('mouseup', function () {
        //     console.log('mouseup stage');
        // });

        stage.on('dragstart', function (e) {
            // createDot = false;
            if(clickType == 2) {
                oldPosStage = [stage.x()/niveauZoom, stage.y()/niveauZoom];
                dragged = true;
            } else {
                stage.stopDrag();
            }
        });
        // stage.on('dragmove', function (e) {
        //     // createDot = false;
        // });
        stage.on('dragend', function (e) {
            let newPos = [stage.x()/niveauZoom, stage.y()/niveauZoom];
            if(distance(oldPosStage,newPos) < 3) {
                dragged = false;
            } else {
                dragged = true;
            }
            if(tmpDot) {
                let circle = findCircle(getCLickPos());
                // if(circle != undefined) {
                //     circle.startDrag();
                // }
            }
        });

        stage.on('mousedown', function(e) {

                clickType = e.evt.button;
                pointCreated = false;
                switch (clickType) {
                    case 0:
                        // if(modeCanvas == 4 && !readyToMerge) {
                        //     startTime = Date.now();
                        //     dragged = false;
                        //     if(e.target.getClassName() !== 'Arc') {
                        //         let clickPos = stage.getPointerPosition();
                        //         clickPos.x = (clickPos.x  - stage.x()) / niveauZoom;
                        //         clickPos.y = (clickPos.y  - stage.y()) / niveauZoom;
                        //         let circle = findCircle(clickPos);
                        //         if(circle != undefined){
                        //             circle.startDrag();
                        //             stage.draggable(false);
                        //         }
                        //     }
                        // }
                        break;
                    case 1:
                        switch(modeCanvas) {
                            case 1:
                            case 3:
                                nbPoints = 0;
                                break;
                            case 4:
                                let clickPos = getCLickPos();
                                if(e.target.getClassName() === "Arc") {
                                    deleteDot(e.target);
                                    // e.target.destroy();
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
                                                    // let circles = getDots(idLigne);
                                                    // // for(let j = circles.length - 1; j >= 0; --j) {
                                                    // //     circles[j].destroy();
                                                    // // }
                                                    //
                                                    // for(let j = 0; j < line.points().length; j += 2) {
                                                    //     let idCercle = idLigne + '-' + j / 2;
                                                    //     create1Dot(line.points()[j], line.points()[j + 1], idCercle);
                                                    // }
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
                                            // clickPos.x = (clickPos.x  - stage.x())/ niveauZoom;
                                            // clickPos.y = (clickPos.y  - stage.y())/ niveauZoom;
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
                                                        // let circles = getDots(e.target.attrs['id']);
                                                        // circles[circles.length - 1].destroy();
                                                    } if(i == 0) {
                                                        e.target.points().shift();
                                                        e.target.points().shift();
                                                        // let circles = getDots(e.target.attrs['id']);
                                                        // circles[0].destroy();
                                                    } else {
                                                        let pointsLigne1 = pts.slice(0, i+2);
                                                        let pointsLigne2 = pts.slice(i+2);

                                                        e.target.points(pointsLigne1);
                                                        remakeDots(e.target.attrs['id']);

                                                        // modeCanvas = 5;
                                                        // e.target.fire('click');
                                                        // document.getElementById('btnCorrection').click();
                                                        //
                                                        // let poly = creerLigne([pointsLigne1[0],pointsLigne1[1]]);
                                                        // poly.points(pointsLigne1);
                                                        // nbPoints = 0;
                                                        // let idCircle = poly.attrs['id'] + '-' + nbPoints;
                                                        // ++nbPoints;
                                                        // create1Dot(pointsLigne1[0], pointsLigne1[1], idCircle);
                                                        // layer.add(poly);
                                                        // for(let j = 2; j < pointsLigne1.length; ++j) {
                                                        //     let x = pointsLigne1[j];
                                                        //     let y = pointsLigne1[++j];
                                                        //     poly.points(poly.points().concat([x, y]));
                                                        //
                                                        //     let idCircle = poly.attrs['id'] + '-' + nbPoints;
                                                        //     ++nbPoints;
                                                        //     create1Dot(x,y,idCircle);
                                                        // }
                                                        // layer.draw();

                                                        let poly = creerLigne([pointsLigne2[0],pointsLigne2[1]]);
                                                        poly.points(pointsLigne2);
                                                        layer.add(poly);
                                                        remakeDots(poly.attrs['id']);
                                                        // nbPoints = 0;
                                                        // idCircle = poly.attrs['id'] + '-' + nbPoints;
                                                        // ++nbPoints;
                                                        // create1Dot(pointsLigne2[0], pointsLigne2[1], idCircle);
                                                        // layer.add(poly);
                                                        // for(let j = 2; j < pointsLigne2.length; ++j) {
                                                        //     let x = pointsLigne2[j];
                                                        //     let y = pointsLigne2[++j];
                                                        //     poly.points(poly.points().concat([x, y]));
                                                        //
                                                        //     let idCircle = poly.attrs['id'] + '-' + nbPoints;
                                                        //     ++nbPoints;
                                                        //     create1Dot(x,y,idCircle);
                                                        // }

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
                                test.x = (test.x  - stage.x()) / niveauZoom;
                                test.y = (test.y  - stage.y()) / niveauZoom;
                                console.log(test);
                        }
                        break;
                    case 2 :
                        if(modeCanvas == 4) {
                            if(e.target.getClassName() !== 'Arc') {
                                // if(dragged) {
                                //         dragged = false;
                                // } else {
                                    let clickPos = getCLickPos();
                                    let circle = findCircle(clickPos);
                                    if(!tmpDot && circle != undefined){
                                        circle.startDrag();
                                        stage.draggable(false);
                                    } else if(niveauZoom > 1) {
                                        // if(circle != undefined) {
                                        //     circle.stopDrag();
                                        // }
                                        stage.draggable(true);
                                        stage.startDrag();
                                    }
                                // }
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
        // modeCanvas = 0;
        // btnCorrection.click();
        niveauZoom = 1;

    }, false);

    // Annotation button event
    // document.getElementById('btnAnnot1').addEventListener('click', annotationImagePrincipale);


    for(var i = 1; i<5; ++i) {
        document.getElementById("imageL"+i).addEventListener('dblclick', function (e) {
            document.getElementById('imageCourante').src = e.target.src;
            indiceImageCourante = debutListe + parseInt(e.target.id.charAt(e.target.id.length-1));
            document.getElementById('nomImageCourante').innerHTML = listeImages[indiceImageCourante - 1].name;
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

        document.getElementById("imageL"+i).onwheel = function (e) {
                e.preventDefault();
                pictureScroll += (e.deltaY/Math.abs(e.deltaY)) * 0.4;
                if(pictureScroll > 1){
                    pictureScroll = 0;
                    if(debutListe < listeImages.length - 4) {
                        ++debutListe;
                        afficheListeImages();
                    }
                } else if(pictureScroll < 0) {
                    pictureScroll = 1;
                    if(debutListe > 0) {
                        --debutListe;
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
        if(clickType == 0) {
            if(ellipseTmp != undefined && pointsEllipse.length === 2) {
                ellipseTmp = undefined;
                ellipseFinished = true;
            }
            switch(modeCanvas) {
                case 3:
                // case 4:
                case 1:
                //if point present à cet endroit
                // let circle = findCircle(clickPos);
                // if(circle == undefined) {
                    if(nbPoints === 0) {

                        ptsLigne = [];
                        ptsLigne.push(x);
                        ptsLigne.push(y);
                        poly = creerLigne(ptsLigne);
                        layer.add(poly);
                        layer.draw();
                        createDot = true;
                        newLineBool = true;
                    }
                    else {
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
                // } else {




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
                                    ellipseTmp.radiusY(clickPos.y - pointsEllipse[0][1]);
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
                                    ptsLigne = [x,y];
                                    poly = creerLigne(ptsLigne);
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

    if( (modeCanvas === 0 || modeCanvas === 4) && niveauZoom != 1) {
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

function prepareMask() {
    let lines = getAllLines();
    let ellipses = getAllEllipses();
    maskArcs();

    stage.height(270);
    stage.width(480);

    // let rect = layerBkgrd.getChildren(function(node) {return node.attrs['id'].includes('imgBackground');});
    rectFond.hide();
    // rectNoir.show();

    for(let i = 0; i < lines.length; ++i) {
        lines[i].stroke('white');
        lines[i].strokeWidth(1);
        for(let j = 0; j < lines[i].points().length; ++j) {
            lines[i].points()[j] = lines[i].points()[j] / rapportImageInferenceX;
            lines[i].points()[++j] = lines[i].points()[j] / rapportImageInferenceY;
        }
    }

    for(let i = 0; i < ellipses.length; ++i) {
        ellipses[i].stroke('white');
        ellipses[i].strokeWidth(1);
        ellipses[i].x(ellipses[i].x() / rapportImageInferenceX);
        ellipses[i].y(ellipses[i].y() / rapportImageInferenceY);
        ellipses[i].radiusX(ellipses[i].radiusX() / rapportImageInferenceX);
        ellipses[i].radiusY(ellipses[i].radiusY() / rapportImageInferenceX);
    }
}

function setMaskToNormal() {
    let lines = getAllLines();
    let ellipses = getAllEllipses();
    showArcs();

    stage.height(imageCourante.height);
    stage.width(imageCourante.width);

    for(let i = 0; i < lines.length; ++i) {
        lines[i].stroke('blue');
        lines[i].strokeWidth(3);
        for(let j = 0; j < lines[i].points().length; ++j) {
            lines[i].points()[j] = lines[i].points()[j] * rapportImageInferenceX;
            lines[i].points()[++j] = lines[i].points()[j] * rapportImageInferenceY;
        }
    }

    for(let i = 0; i < ellipses.length; ++i) {
        ellipses[i].stroke('blue');
        ellipses[i].strokeWidth(1);
        ellipses[i].x(ellipses[i].x() * rapportImageInferenceX);
        ellipses[i].y(ellipses[i].y() * rapportImageInferenceY);
        ellipses[i].radiusX(ellipses[i].radiusX() * rapportImageInferenceX);
        ellipses[i].radiusY(ellipses[i].radiusY() * rapportImageInferenceX);
    }

    // let rect = layerBkgrd.getChildren(function(node) {return node.attrs['id'].includes('imgBackground');});
    // rectNoir.hide();
    rectFond.show();
    layerBkgrd.draw();


    // rect = layerBkgrd.getChildren(function(node) {return node.attrs['id'].includes('imgNoire');});
    // rect.hide();

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

function imageHandler(e2) {
    var idImg = 'imageL'+indiceImages;
    document.getElementById(idImg).src = e2.target.result;
    ++indiceImages;
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
    let erreur = 4 * val1 / 100; //3% de la valeur à comparer
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

    // var filename = 'E:/Important/Etudes/ISIMA/ZZ3/Stage/Application/masqueTestNB.png';
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
                // ptsAnnot[k] = ptsAnnot[k].reverse().concat(ptsAnnot[l].reverse());
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
    rapportImageInferenceX = imageCourante.width / largeurInference;
    rapportImageInferenceY = imageCourante.height / hauteurInference;
    var img = new Image(largeurInference, hauteurInference);
    img.src = e2.target.result;
    canvas.height = img.height;
    canvas.width = img.width;
    ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    // 2.6 est un coefficient calculé pour obtenir une bonne valeur de
    // distanceVisibleMin pour les images testées, le coefficient permet de garder
    // cette valeur pour toutes les images
    distanceVisibleMin = imageCourante.width / largeurInference * 2.6;
    var data = ctx.getImageData(0,0,canvas.width, canvas.height).data;
    var ptsAnnotations = [];
    var k;

    ecartPointsImportants = parseInt(document.getElementById('inputCoef').value);

    // let startTime = performance.now();
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
            if(ptsAnnotations[i].length > ecartPointsImportants || distance(ptsAnnotations[i][0], ptsAnnotations[i][ptsAnnotations[i].length - 1]) > distanceVisibleMin){
                bonsPoints = pointsImportants(ptsAnnotations[i]);
                if (distance(bonsPoints[0], bonsPoints[bonsPoints.length - 1]) < 5) {
                    modeCanvas = 3;
                    bonsPoints.pop();
                } else {
                    modeCanvas = 1;
                }

                for(let j = 0; j < bonsPoints.length; ++j) {
                    bonsPoints[j][0] = bonsPoints[j][0] * rapportImageInferenceY;// + 1;
                    bonsPoints[j][1] = bonsPoints[j][1] * rapportImageInferenceX;// + 1;
                }

                let x = bonsPoints[0][1];
                let y = bonsPoints[0][0];
                let poly = creerLigne([x,y]);
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

    if (masqueVisible) {
        masqueVisible = false;
        // document.getElementById('divCanvas').style.visibility = 'hidden';
        // document.getElementById('imageCourante').style.visibility = 'visible';
        layer.hide();
        document.getElementById('btnMasquer').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
    } else {
        masqueVisible = true;
        // document.getElementById('divCanvas').style.visibility = 'visible';
        // document.getElementById('imageCourante').style.visibility = 'hidden';
        layer.show();
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

//Debug
function afficherCercle(cercle) {
    console.log('id : ' + cercle.attrs['id']);
    console.log('zIndex : ' + cercle.zIndex());
    console.log('Position : x ' + cercle.x() + ' y ' + cercle.y());
}

function afficherLigne(line) {
    console.log('id : ' + line.attrs['id']);
    console.log('zIndex : ' + line.zIndex());
    let message = "Points : "
    for(i = 0; i < line.points().length; ++i) {
        message += 'x ' + line.points()[i] + ' y ' + line.points()[++i] + ' | ';
    }
    console.log(message);

}

function afficherVarConstr() {
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
            let idCercle = last.attrs['id'].split('-')[1];
            let idLine = last.attrs['id'].split('-')[0];
            children.pop();
            if (line.points().length === 2 && modeCanvas != 1 && modeCanvas != 3) {
                children.pop();
                children.pop();
            } else {
                nbPoints--;
                decaleIDCercles(1, idCercle, idLine);

            }
        } else if(last.getClassName() === 'Line'){ //dernier children est une ligne
            children.pop();
        }
        layer.draw();
    }
}

function concatLines(line1, line2) {
    //makes line2 have line1's points and then its own

    //The first solution takes time and is asynchronous,
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
        if(clickType == 2) {
            oldPos[0] =  this.x();
            oldPos[1] =  this.y();
            isCircleDragged = true;
        } else {
            this.stopDrag();
        }
    });

    // circle.on('mouseup', function () {
    //     console.log('mouseup arc');
    // });
    circle.on('mousedown', function (e) {
        clickType = e.evt.button;
        this.startDrag();
    });
    circle.on('dragmove', function (e) {
        // if(e.evt.button == 1) {
            createDot = false;
            newLineBool = false;
            // poly = undefined;
            // if(!tmpDot) {
                nbPoints = 0;
            // }
            let diffX = this.x() - oldPos[0];
            let diffY = this.y() - oldPos[1];
            let id = this.attrs['id'];
            let ligne = parseInt(id.split('-')[0]);
            let points = parseInt(id.split('-')[1]);
            // let lines = layer.getChildren(function(node){
            //     return node.getClassName() === 'Line';
            // });
            let line = getLine(ligne);
            line.points()[2*points] += diffX;
            line.points()[2*points+1] += diffY;
            oldPos[0] = this.x();
            oldPos[1] = this.y();
        // } else {
        //     this.stopDrag();
        // }
    });

    circle.on('dragend', function () {
        if(tmpDot && clickType == 2) {
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
            case 0:
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
                break;
            case 1:
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
    clickType = 2; //trick not to stop the drag
    tmpDot = true;
    dot.startDrag();
    ++nbPoints;
}

function creerLigne(ptsLigne) {
    var poly = new Konva.Line({
        points: ptsLigne,
        stroke: 'blue',
        strokeWidth: 3,
        id: nbElem,
    });
    ++nbElem;

    // poly.on('mouseup', function () {
    //     console.log('mouseup poly');
    // });
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
        clickType = e.evt.button;
        let clickPos = getCLickPos();
        let circle;
        let idCircle;
        circle = findCircle(clickPos);
        switch (clickType) {
            //Left click
            case 0:
                switch (modeCanvas) {
                    case 0:
                        afficherLigne(this);
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
                            if(circle != undefined) {

                            } else {

                                let idLigne = this.attrs['id'];
                                let added = false;
                                let i = 0;
                                let pts = this.points();
                                while(!added && i < pts.length - 3) {
                                    let v1 = [pts[i] - clickPos.x, pts[i + 1] - clickPos.y];
                                    let v2 = [pts[i + 2] - clickPos.x, pts[i + 3] - clickPos.y];
                                    // console.log(v1, v2);
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
                                        // console.log('Décalage :');
                                        remakeDots(idLigne);
                                        // decaleIDCercles(1, (i + 2) / 2, idLigne);
                                        // var dot = create1Dot(clickPos.x, clickPos.y, idPoint);
                                        // dot.zIndex(zInd);
                                        // var dot = getDot(idLigne, idPoint.split('-')[1]);
                                        added = true;
                                        layer.draw();
                                    }
                                    i+=2;
                                }
                                if(this.closed() && !added && i == pts.length - 2) {
                                    let v1 = [pts[pts.length - 2] - clickPos.x, pts[pts.length - 1] - clickPos.y];
                                    let angle = getAngle(v1, v2);
                                    let v2 = [pts[0] - clickPos.x, pts[1] - clickPos.y];
                                    if(sontEnvironEgalesProportionnelles(angle, 180)) {
                                        let circles = getDots(idLigne);
                                        let zInd = circles[circles.length - 1].zIndex() + 1;
                                        this.points().push(clickPos.x);
                                        this.points().push(clickPos.y);
                                        let idPoint = idLigne + '-' + circles.length;
                                        remakeDots(idLigne);
                                        // var dot = create1Dot(clickPos.x, clickPos.y, idPoint);
                                        // dot.zIndex(zInd);
                                        // var dot = getDot(idLigne, idPoint.split('-')[1]);
                                        added = true;
                                        layer.draw();
                                    }
                                }
                                let dot = findCircle(clickPos);
                                if(dot != undefined) {
                                    mousedwn = true;
                                    clickType = 2;
                                    dot.startDrag();
                                }
                                // }
                            }
                        }
                        break;
                    default:
                        break;

                }
                break;
            // Mouse wheel click
            case 1 :
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
            case 2:
                switch (modeCanvas) {
                    case 4:
                    if(layer.getChildren(function(node) {return node.isDragging() && node.getClassName() === 'Arc'}).length == 0) {
                        if(circle != undefined) {
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
                                // console.log(v1, v2);
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
                                    // console.log('Décalage :');
                                    remakeDots(idLigne);
                                    // decaleIDCercles(1, (i + 2) / 2, idLigne);
                                    // var dot = create1Dot(clickPos.x, clickPos.y, idPoint);
                                    // dot.zIndex(zInd);
                                    // var dot = getDot(idLigne, idPoint.split('-')[1]);
                                    added = true;
                                    layer.draw();
                                }
                                i+=2;
                            }
                            if(this.closed() && !added && i == pts.length - 2) {
                                let v1 = [pts[pts.length - 2] - clickPos.x, pts[pts.length - 1] - clickPos.y];
                                let angle = getAngle(v1, v2);
                                let v2 = [pts[0] - clickPos.x, pts[1] - clickPos.y];
                                if(sontEnvironEgalesProportionnelles(angle, 180)) {
                                    let circles = getDots(idLigne);
                                    let zInd = circles[circles.length - 1].zIndex() + 1;
                                    this.points().push(clickPos.x);
                                    this.points().push(clickPos.y);
                                    let idPoint = idLigne + '-' + circles.length;
                                    remakeDots(idLigne);
                                    // var dot = create1Dot(clickPos.x, clickPos.y, idPoint);
                                    // dot.zIndex(zInd);
                                    // var dot = getDot(idLigne, idPoint.split('-')[1]);
                                    added = true;
                                    layer.draw();
                                }
                            }
                            let dot = findCircle(clickPos);
                            if(dot != undefined) {
                                mousedwn = true;
                                clickType = 2;
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
                majIdAnnotations(idLigne);
                --nbElem;
                break;
            default:
                // console.log(this.zIndex());

        }

    });

    if(modeCanvas == 3) {
        let sel = document.getElementById('selectFill');
        poly.closed(true);
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
}

function decaleIDCerclesNTimes(sens, indice, idLigne, n) {
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
    // let lines = layer.getChildren(function(node){
    //     return node.getClassName() === 'Line';
    // });
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
            // if(allCircles[i].attrs['id'] != currentCircle.attrs['id']) {
                res = allCircles[i];
                founded = true;
            // }
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
            // if(allCircles[i].attrs['id'] != currentCircle.attrs['id']) {
                res.push(allCircles[i]);
                // founded = true;
            // }
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
    clickPos.x = (clickPos.x  - stage.x()) / niveauZoom;
    clickPos.y = (clickPos.y  - stage.y()) / niveauZoom;

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
                // deleteDots(poly.attrs['id']);
                changingID = lineTmp.attrs['id'];
            }
            poly.attrs['id'] = changingID;
            // console.log("id ligne : " + changingID);
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

//Gestion de l'export textuel
function serializeEllipse(elli) {
    let deb = "\t\t{\n"
    let center = "\t\t\t\"center\" : [" + elli.x().toString() + ", " + elli.y().toString() + "],\n";
    let radX = "\t\t\t\"radiusX\" : " + elli.radiusX().toString() + ",\n";
    let radY = "\t\t\t\"radiusY\" : " + elli.radiusY().toString() + ",\n";
    let rotation = "\t\t\t\"rotation\" : " + elli.rotation().toString() + "\n";
    let fin = "\t\t}";
    let ret = deb + center + radX + radY + rotation + fin;
    // console.log(ret);
    return ret;
}

function serializeEllipses(ellipses) {
    let str = "{\n\t\"ellipses\" : [\n";
    for(let i = 0; i < ellipses.length - 1; ++i) {
        str += serializeEllipse(ellipses[i]) + ',\n';
    }
    str += serializeEllipse(ellipses[ellipses.length - 1]) + '\n';
    str += "\t]\n}"
    // console.log(str);
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
    // console.log(str);
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
    //     imageCourante.getContext();
    //     // canvas.src = document.getElementById('imageCourante').src;
    //     ctx.drawImage(imageCourante, 0, 0, largeurInference, hauteurInference);
    //
    //     /*
    //      ajout de deux lignes noires à la fin de l'image pour le fonctionnement
    //      du réseau utilisé
    //     */
    //     let imgdata = ctx.getImageData();
    //     for(let i = 0; i < 2 * 4 * largeurInference; ++i) {
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
//   imageCourante.getContext();
//   // canvas.src = document.getElementById('imageCourante').src;
//   ctx.drawImage(imageCourante, 0, 0, largeurInference, hauteurInference);
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
