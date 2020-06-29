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
    // Parse = require('parse');


    document.getElementById('btnDefileHaut').addEventListener('click',defileHaut);
    document.getElementById('btnDefileBas').addEventListener('click',defileBas);
    document.getElementById('btnSupprImage').addEventListener('click',supprImages);
    document.getElementById('btnChargeVideo').addEventListener('click', extractFromVideo);
    document.getElementById('btnCorrectionn').addEventListener('click', function () {
        if(modeCanvas === 4){
            modeCanvas = 0;
            document.getElementById('btnCorrectionn').className = "btn btn-outline-dark btn-rounded btn-lg";
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
            document.getElementById('btnCorrectionn').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
            stage.draggable(false);
            for(var i = 0; i < layer.getChildren().length; ++i) {
                layer.getChildren()[i].draggable(true);
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
        y.href = stage.toDataURL();
        showArcs();
        y.download = 'annotation' + indiceImageCourante + '.png'

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
            if(modeCanvas != 4)
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
            if(niveauZoom === 1) {
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

function imageHandler(e2) {
    var idImg = 'imageL'+indiceImages;
    document.getElementById(idImg).src = e2.target.result;
    ++indiceImages;
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
                if(nbPoints === 0) {

                    ptsLigne = [];
                    ptsLigne.push(x);
                    ptsLigne.push(y);
                    poly = creerLigne(ptsLigne);
                    layer.add(poly);
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

                if(pointsEllipse.length === 3) {
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
                        if(modeCanvas === 4) {
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
                    elli.on('click', function () {
                        if( modeCanvas === 5) {
                            this.destroy();
                            layer.draw();
                            boutonsOff();
                            modeCanvas = 0;
                        }
                    });
                    layer.draw();
                    modeCanvas = 0;
                    document.getElementById('btnAjoutEllipse').className =
                        "btn btn-outline-dark btn-rounded btn-lg";
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
            document.getElementById('btnCorrectionn').click();
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

function boutonsOff() {
    document.getElementById('btnAjoutLigne').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnAjoutZoneFermee').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnAjoutEllipse').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnSupprImage').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnCorrectionn').className = "btn btn-outline-dark btn-rounded btn-lg";
    document.getElementById('btnSupprAnnotation').className = "btn btn-outline-dark btn-rounded btn-lg";

    if(modeCanvas === 4) {
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

function extractFromVideo() {
    $("body").append("<input type='file' id='explorerChargementVideo' accept='video/*'>");



    input = document.getElementById('explorerChargementVideo');

    var y = document.getElementById("explorerChargementVideo");
    y.addEventListener('change', loadVideo, false);
    input.click();
    chargementVideo = true;



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

function videoHandler(e2) {
    video.src = e2.target.result;
    video.muted = true;
    video.playbackRate = 32;
    video.play(true);
    document.getElementById("explorerChargementVideo").remove();
}

function timerCallback() {
    if (this.video.paused || this.video.ended) {
        return;
    }
    computeFrame();
    setTimeout(function () {timerCallback();}, 0);
}

function computeFrame() {
    var modulo = 22;
    if(nbFrame%modulo === modulo-1) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        var dataurl = imagedata_to_image(ctx.getImageData(0,0,canvas.width, canvas.height)).src;
        listeImages.push(dataurl);
    }
    nbFrame++;
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

//Gestion du masque
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

function masqueHandler(e2) {
    $("body").append("<canvas id='canvasMasque' style='visibility: visible' width='" + largeurInference + "' height='" + hauteurInference + "'>")
    var canvas = document.getElementById('canvasMasque');
    rapportImageInference = imageCourante.width / largeurInference;
    var img = new Image(largeurInference, hauteurInference);
    img.src = e2.target.result;
    // img.height = hauteurInference;
    // img.width = largeurInference;
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
                                console.log("i : " + i + " j : " + tmp);
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
                    bonsPoints[j][0] = bonsPoints[j][0] * rapportImageInference;
                    bonsPoints[j][1] = bonsPoints[j][1] * rapportImageInference;
                }

                let x = bonsPoints[0][1];
                let y = bonsPoints[0][0];
                let poly = creerLigne([x,y]);
                nbPoints = 0;
                let idCircle = poly.attrs['id']+'-'+nbPoints;
                nbPoints++;
                createDot(x,y,idCircle);
                layer.add(poly);
                for(let j = 1; j<bonsPoints.length;++j) {
                    let x = bonsPoints[j][1];
                    let y = bonsPoints[j][0];
                    poly.points(poly.points().concat([x, y]));

                    let idCircle = poly.attrs['id']+'-'+nbPoints;
                    nbPoints++;
                    createDot(x,y,idCircle);
                }
                layer.draw();
            }
        }
    } else {
        alert("Erreur de chargement du masque")
    }
    document.getElementById('explorerMasque').remove();

}

function sontVoisins(p1, p2) {
    var ret  = false;
    if(sontEnvironEgales(p1[0], p2[0]) && sontEnvironEgales(p1[1], p2[1])) {
        ret = true;
    }
    return ret;
}

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

function sontEnvironEgales(val1, val2) {
    var ret = false;
    if(val1 <= val2 + 1 && val1 >= val2-1) {
        ret = true;
    }
    return ret;
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

//Création d'annotation
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
        let diffLigne = 0;
        for(let i = 0; i < lignesSuppr.length; ++i) {
            if(lignesSuppr[i] < ligne) {
                ++diffLigne;
            }
        }
        ligne -= diffLigne;
        lines[ligne].points()[2*points] += diffX;
        lines[ligne].points()[2*points+1] += diffY;
        oldPos[0] = this.x();
        oldPos[1] = this.y();
    });
    circle.on('click', function () {
        if( modeCanvas === 5) {
            this.destroy();
            let id = this.attrs['id'];
            let ligne = parseInt(id.split('-')[0]);
            let points = parseInt(id.split('-')[1]);
            let lines = layer.getChildren(function(node){
                return node.getClassName() === 'Line';
            });

            lines[ligne].points().splice(2*points, 2);
            layer.draw();
            boutonsOff();
            modeCanvas = 0;
        }
    });
    layer.add(circle);
    layer.draw();
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
    poly.on('click', function () {
        if( modeCanvas === 5) {
            let circles = layer.getChildren(function(node){
                return node.getClassName() === 'Arc';
            });
            let idLigne = this.attrs['id'];
            circles = circles.filter(circle => circle.attrs['id'].split('-')[0] == idLigne);
            for(let i = circles.length-1; i >= 0; --i) {
                circles[i].destroy();
            }
            lignesSuppr.push(idLigne);
            this.destroy();
            layer.draw();
            boutonsOff();
            modeCanvas = 0;
        }
    });
    if(modeCanvas == 3) {
        poly.closed(true);
    }
    return poly;
}

function insererEnPos(tab, elem, pos) {
    var deb = tab.slice(0,pos);
    var fin = tab.slice(pos, tab.length);
    deb.push(elem);
    return deb.concat(fin);
}

function creerMultiligne(ligne, nbLigne) {
    /*
    * Cree et renvoie une liste correspondant à une ligne sur plusieurs rangées de pixels
    * sans les pixels du milieu et du bas
    * */
    var ml = [];

    for(let j = nbLigne-1; j > 0; --j) {
        ml.push([ligne[0][0]+j, ligne[0][1]]);
    }
    ml = ml.concat(ligne);
    let last = ligne.length-1;
    for(let j = 1; j < nbLigne; ++j) {
        ml.push([ligne[last][0]+j, ligne[last][1]]);
    }
    return ml;
}

function getNbLignes(ligne, canvas, data) {
    var multiLigne = true;
    var nbLigne = 1;
    var ligneDeb = ligne[0][0];
    var colonneDeb = ligne[0][1];
    while (multiLigne) {
        var l2 = colonneDeb;
        if (data.data[((ligneDeb + nbLigne) * canvas.width + colonneDeb - 1) * 4] === 0 &&
            data.data[((ligneDeb + nbLigne) * canvas.width + colonneDeb + ligne.length - 1) * 4] === 0) {
            while (multiLigne && l2 < ligne.length - 1 + colonneDeb) {
                if (data.data[((ligneDeb + nbLigne) * canvas.width + l2) * 4] === 0) {
                    multiLigne = false;
                }
                ++l2;
            }
            if (multiLigne) {
                if (data.data[((ligneDeb + nbLigne) * canvas.width + l2 ) * 4] === 0) {
                    ++nbLigne;
                }
            }
        } else {
            multiLigne = false;
        }

    }
    return nbLigne;
}

function getCoins(ligne) {
    var largeur = ligne[ligne.length-1][1] - ligne[0][1];
    var hauteur = (ligne.length-largeur)/2;
    return [ligne[0], ligne[hauteur], ligne[hauteur+largeur], ligne[ligne.length-1]];
}

function lignesVoisines(ligne1, ligne2) {
    var coins1 = getCoins(ligne1);
    var coins2 = getCoins(ligne2);

    var ret = -1;

    for(let i = 0; i < 4; ++i) {
        for(let j = 0; j<4; ++j) {
            if(sontVoisins(coins1[i], coins2[j])) {
                ret = 4*i+j;
            }
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

function pointsEgaux(pt1, pt2) {
    ret = false;
    if(pt1[0] == pt2[0] && pt1[1] == pt2[1])
        ret = true;
    return ret;
}

class Ligne {

    constructor(pts) {
        this.points = pts;
        this.largeur = pts[pts.length-1][1] - pts[0][1] + 1;
        this.hauteur = (pts.length - this.largeur) / 2;
        // this.longueur = this.points.length;
        // this.largeur = this.points[this.longueur-1][1] - this.points[0][1];
        this.coins = this.initCoins();
    }

    getTypeVoisinage(ligne2) {
        var ret = 15
        let place = false;
        if(ligne2.hauteur != 0) {
            for (let i = 0; !place && i < this.getCoins().length; ++i) {
                for (let j = 0; !place &&  j < ligne2.getCoins().length; ++j) {
                    if (ligne2.getCoins()[j][0] - this.getCoins()[i][0] <= 1 && Math.abs(ligne2.getCoins()[j][1] - this.getCoins()[i][1]) <= 1) {
                        place = true;
                        ret = 6*i + j;
                    }
                }
            }
        } else {
            ret = 0;
        }
        return ret;
    }

    getDeb() {
        return this.points[0];
    }

    getFin() {
        return this.points[this.points.length-1];
    }

    getPoints() {
        return this.points;
    }

    ajoutPointsFin(points) {
        this.points = this.points.concat(points);
    }

    ajoutPointsTete(points) {
        this.points = points.concat(this.points);
    }

    ajoutPointFin(pt) {
        this.points.push(pt);
    }

    ajoutPointTete(pt) {
        this.points.unshift(pt);
    }

    retirerPointTete() {
        this.points.shift();
    }

    retirerPointFin() {
        this.points.pop();
    }

    getCoins() {
        return this.coins;
    }

    setCoins(coins) {
        this.coins = coins;
    }

    retirerHauteurFin() {
        while(this.getFin()[1] == this.points[this.points.length-2][1]) {
            this.retirerPointFin();
        }
    }

    retirerHauteurDebut() {
        while(this.getDeb()[1] == this.points[1][1]) {
            this.retirerPointTete();
        }
    }


    initCoins() {
        // var hauteur = Math.abs((this.hauteur - this.largeur)/2);
        return [this.points[0], this.points[this.hauteur], this.points[this.hauteur + this.largeur],
            this.points[this.points.length - 1]];
    }

    merge(ligne2) {
        /*
        * Suivant la position de ligne2 par rapport à l'objet, ajoute un certain nombre de points à cet objet et modifie
        * ses coins pour garder que 3 coins pour chaque bout de ligne (donc 6 en tout)
        * */
        let coins = [];
        let coins2 = ligne2.getCoins();
        let voisinage = this.getTypeVoisinage(ligne2);
        let pts2 = [];
        let ret = true;
        switch (voisinage) {
            //ligne2 dessous à gauche
            case 2 :
                //debut ligne2 en bas a gauche de this a 4 coins
                if(this.getCoins().length == 4) {
                    if (coins2.length == 4) {
                        coins.push(coins2[3]);
                        coins.push(coins2[0]);
                        coins.push(coins2[1]);
                        this.ajoutPointsTete(ligne2.getPoints().slice(0, ligne2.hauteur + ligne2.largeur));
                    } else {
                        coins.push(coins2[0]);
                        coins.push(coins2[1]);
                        coins.push(coins2[2]);
                        ligne2.retirerHauteurDebut()
                        while (ligne2.getDeb()[1] == ligne2.getPoints()[1][1]) {
                            ligne2.retirerPointTete();
                        }
                        this.ajoutPointsTete(ligne2.getPoints());
                    }
                    coins.concat(this.getCoins().slice(this.getCoins().length - 3));
                    this.setCoins(coins);
                } else {
                    //debut de ligne2 en bas a droite du debut de this
                    if (coins2.length == 4) {
                        coins.push(coins2[3]);
                        coins.push(coins2[0]);
                        coins.push(coins2[1]);
                        // this.ajoutPointsTete(ligne2.getPoints().slice(0, ligne2.hauteur + ligne2.largeur));
                        let ptsTemp = [];
                        let i = 0;
                        while (ligne2.getPoints()[i][0] == ligne2.getPoints()[++i][0]) {
                            ptsTemp.push(ligne2.getPoints()[i]);
                        }
                        while (ligne2.getPoints()[i++][1] == this.getDeb()[1]) {
                            ptsTemp.push(ligne2.getPoints()[i]);
                        }
                        this.ajoutPointsTete(ptsTemp);
                    } else {
                        coins = coins2.slice(3);
                        ligne2.retirerHauteurDebut();
                        let val = this.getPoints()[0][1];
                        while (ligne2.getDeb()[1] != val) {
                            ligne2.retirerPointTete();
                        }
                        this.ajoutPointsTete(ligne2.getPoints());
                    }
                    coins.concat(this.getCoins().slice(0, 3));
                    this.setCoins(coins);
                }
                break;
            case 4 :
                if(this.getCoins()[0][0] == this.getCoins()[1][0]) {
                    //fin de ligne2 en bas a droite du debut de this
                    coins = ligne2.getCoins().slice(0,3);
                    coins = coins.concat(this.getCoins().slice(this.getCoins().length-3));
                    ligne2.retirerHauteurFin();
                    while (ligne2.getFin()[1] != this.getFin()[1] && ligne2.getFin()[1] == ligne2.getPoints()[ligne2.getPoints().length - 2][1]) {
                        ligne2.retirerPointFin();
                    }
                    while(ligne2.getFin()[1] != this.getDeb()[1]) {
                        this.ajoutPointTete([this.getDeb()[0], this.getDeb()[1]+1])
                    }
                    this.ajoutPointsTete(ligne2.getPoints());


                } else {
                    //fin ligne2 en bas a gauche de this a 4 coins
                    coins.push(ligne2.getCoins()[3]);
                    coins.push(ligne2.getCoins()[0]);
                    coins.push(ligne2.getCoins()[1]);
                    coins = coins.concat(this.getCoins().slice(1));

                    ligne2.retirerHauteurFin();
                    this.ajoutPointsTete(ligne2.getPoints());
                }
                this.setCoins(coins);
                break;
            case 8 :
                //debut ligne2 en bas a gauche du deb de this
                if(coins2.length == 4) {
                    coins.push(coins2[3]);
                    coins.push(coins2[0]);
                    coins.push(coins2[1]);
                } else {
                    coins = coins.concat(coins2.slice(coins2.length-3))
                }

                ligne2.retirerHauteurFin();
                this.ajoutPointsTete(ligne2.getPoints());
                break;
            case 10 :
                //fin ligne2 en bas a gauche du deb de this
                coins.push(ligne2.getCoins()[3]);
                coins.push(ligne2.getCoins()[0]);
                coins.push(ligne2.getCoins()[1]);
                coins = coins.concat(this.getCoins().slice(this.getCoins().length-3));
                ligne2.retirerHauteurFin();
                this.ajoutPointsTete(ligne2.getPoints());
                this.setCoins(coins);
                break;
            case 32 :
                //debut ligne2 en bas a gauche de la fin de this
                coins = this.getCoins().slice(0,3);
                if(coins2.length == 4) {
                    coins.push(coins2[3]);
                    coins.push(coins2[0]);
                    coins.push(coins2[1]);
                    this.ajoutPointsTete(ligne2.getPoints().slice(0,ligne2.hauteur+ ligne2.largeur));
                } else {
                    coins.push(coins2[0]);
                    coins.push(coins2[1]);
                    coins.push(coins2[2]);
                    ligne2.retirerHauteurDebut()
                    while(ligne2.getDeb()[1] == ligne2.getPoints()[1][1]) {
                        ligne2.retirerPointTete();
                    }
                    this.ajoutPointsTete(ligne2.getPoints());
                }
                this.setCoins(coins);

                break;
            case 34 :
                //fin ligne2 en bas a gauche de la fin de this
                coins = coins.concat(this.getCoins().slice(0,3));
                if(coins2.length == 4) {
                    coins.push(coins2[0]);
                    coins.push(coins2[1]);
                    coins.push(coins2[3]);
                } else {
                    coins = coins.concat(ligne2.getCoins().slice(ligne2.getCoins().length-3));
                }
                //ferme la forme pour revenir au coin de la ligne a ajouter
                let ptsTemps = [];
                while(this.getFin()[1] != ligne2.getPoints()[ligne2.length - ligne2.hauteur][1]) {
                    ptsTemps.push([this.getFin()[0],this.getFin()[1]-1]);
                }
                this.ajoutPointsFin(ptsTemps);
                //Ajout des points de la nouvelle ligne (coin 0 a coin 2, a l'envers)
                this.ajoutPointsFin(ligne2.getPoints().slice(0, ligne2.length - ligne2.hauteur).reverse());

                break;
            case 7 :
                //debut ligne 2 sous this a 4 coins
                coins = this.getCoins().slice(this.getCoins().length-3);
                if(coins2.length == 4) {
                    coins.push(coins2[2]);
                    coins.push(coins2[3]);
                    coins.push(coins2[0]);
                } else {
                    coins = coins.concat(coins2.slice(coins2.length-3));
                }
                ligne2.retirerHauteurDebut();
                this.ajoutPointsTete(ligne2.getPoints());
                this.setCoins(coins);
                break;
            case 9 :
                //fin ligne 2 sous this a 4 coins
                coins = coins2.slice(0,3);
                coins = coins.concat(this.getCoins().slice(this.getCoins().length-3));

                ligne2.retirerHauteurFin()
                while(ligne2.getFin()[1] == ligne2.getPoints()[ligne2.getPoints().length-2][1]) {
                    ligne2.retirerPointFin();
                }
                this.ajoutPointsTete(ligne2.getPoints());
                this.setCoins(coins);
                break;
            case 31 :
                //debut ligne 2 sous la fin de this
                coins = coins2.slice(0,3);
                coins = coins.concat(this.getCoins().slice(this.getCoins().length-3));

                this.retirerHauteurFin();
                while(this.getFin()[1] == this.getPoints()[this.getPoints().length-2][1]) {
                    this.retirerPointFin();
                }

                ligne2.retirerHauteurDebut();
                while(ligne2.getDeb()[0] - this.getDeb()[0] > 1) {
                    this.ajoutPointTete([this.getDeb()[0] + 1, this.getDeb()[1]]);
                }
                this.setCoins(coins);
                break;
            case 37 :
                //fin ligne 2 sous la fin de this
                coins = this.getCoins().slice(0,3);
                coins = coins.concat(coins2.slice(0,3));

                ligne2.retirerHauteurFin();
                while(ligne2.getFin()[1] == ligne2.getPoints()[ligne2.getPoints().length-2][1]) {
                    ligne2.retirerPointFin();
                }
                this.ajoutPointsFin(ligne2.getPoints());
                this.setCoins(coins);
                break;

            case 1:
                if(this.getCoins().length == 4) {
                    //ajout sous la première ligne
                    coins = this.getCoins().slice(0,3);
                    if(coins2.length == 4) {
                        coins.push(coins2[2]);
                        coins.push(coins2[3]);
                        coins.push(coins2[0]);
                    } else {
                        coins = coins.concat(coins2.slice(3))
                    }
                    let ptsTemps = [ligne2.getPoints()[0]];
                    let i = 0;
                    while(ptsTemps[0][0]-1 != this.getDeb()[0]) {
                        ptsTemps.unshift(ligne2.getPoints()[++i]);
                    }
                    this.ajoutPointsTete(ptsTemps);
                    let incr = 1;
                    if(ligne2.getFin()[1] < this.getFin()[1]) {
                        incr = -1;
                    }
                    while(ligne2.getFin()[1] != this.getFin()[1]) {
                        this.ajoutPointFin([this.getFin()[0], this.getFin()[1] + incr]);
                    }
                    this.ajoutPointsFin(ligne2.getPoints().slice(ligne2.hauteur+ligne2.largeur));
                } else {
                    //ajout a droite du debut de this
                    coins = this.getCoins().slice(3);
                    if(coins2.length == 4) {
                        coins.push(coins2[2]);
                        coins.push(coins2[3]);
                        coins.push(coins2[0]);
                    } else {
                        coins = coins.concat(coins2.slice(3))
                    }


                    while (this.getPoints()[0][1] != ligne2[0][1]) {
                        this.ajoutPointTete([this.getPoints()[0][0], this.getPoints()[0][1] + 1])
                    }
                    ligne2.retirerHauteurDebut();
                    this.ajoutPointsTete(ligne2.getPoints());
                }
                this.setCoins(coins);
                break;
            case 3:
                if(this.getCoins().length == 4) {
                //ajout fin ligne2 en bas a droite de la premiere ligne
                    ligne2.retirerHauteurFin();
                    while(ligne2.getFin()[1]!=ligne2.getPoints()[ligne2.getPoints().length-2][1]) {
                        ligne2.retirerPointFin();
                    }
                    coins = coins2.slice(0,3);
                    coins = coins.concat(coins.slice(1));

                } else {
                //ajout fin de ligne2 a gauche du debut de this
                    coins = coins2.slice(0,3).concat(this.getCoins().slice(3));
                    ligne2.retirerHauteurFin();
                    while(ligne2.getFin()[0] == ligne2.getPoints()[ligne2.getPoints().length-2][0]) {
                        ligne2.retirerPointFin();
                    }
                    this.ajoutPointsTete(ligne2.getPoints());
                }
                this.setCoins(coins);
                break;

            case 20 :
                coins = this.getCoins().slice(0,3);
                if(coins2.length == 4) {
                    coins.push(coins2[2]);
                    coins.push(coins2[3]);
                    coins.push(coins2[0]);
                    let ptsTemp = ligne2.getPoints().slice(0, ligne2.hauteur);
                    let incr = 1
                    if(ligne2.getDeb()[1] < this.getDeb()[1]) {
                        ptsTemp = ptsTemp.concat(ligne2.getPoints().slice(ligne2.hauteur, ligne2.hauteur - ligne2.getDeb()[1] + this.getDeb()[1]))
                    } else {
                        while(this.getDeb()[1] != ligne2.getDeb()[0]) {
                            this.ajoutPointTete([this.getDeb()[0], this.getDeb()[1] + 1])
                        }
                    }
                    this.ajoutPointsTete(ptsTemp);

                } else {
                    ligne2.retirerHauteurDebut();
                    while (ligne2.getDeb()[1] < this.getDeb()[1]) {
                        ligne2.retirerPointTete();
                    }
                    this.ajoutPointsTete(ligne2.getPoints());
                    coins = coins.concat(coins2.slice(3));
                }
                this.setCoins(coins);
                break;
            case 24 :
                coins = coins2.slice(0,3);
                coins.push(this.getCoins()[1]);
                coins.push(this.getCoins()[2]);
                coins.push(this.getCoins()[3]);

                ligne2.retirerHauteurFin();
                while (ligne2.getFin()[1] != this.getFin()[1] && ligne2.getFin()[1] == ligne2.getPoints()[ligne2.getPoints().length - 2][1]) {
                    ligne2.retirerPointFin();
                }
                while(ligne2.getFin()[1] != this.getDeb()[1]) {
                    this.ajoutPointTete([this.getDeb()[0], this.getDeb()[1]+1])
                }
                this.ajoutPointsTete(ligne2.getPoints());
                this.setCoins(coins);



                break;
            case 26 :
                coins = this.getPoints().slice(0,3).concat(coins2.slice(3));
                ligne2.retirerHauteurDebut();
                while(ligne2.getDeb()[0] == ligne2.getPoints()[1][0]) {
                    ligne2.retirerPointTete();
                }
                this.ajoutPointsFin(ligne2.getPoints());
                this.setCoins(coins);
                break;
            case 28 :
                coins = this.getPoints().slice(0,3).concat(coins2.slice(0,3));
                ligne2.retirerHauteurFin();
                this.ajoutPointsFin(ligne2.getPoints().reverse());
                this.setCoins(coins);
                break;
            case 19 :
                //debut de ligne2 dessous à droite de this a 4 coins
                coins.push(this.getCoins()[0]);
                coins.push(this.getCoins()[1]);
                coins.push(this.getCoins()[2]);
                if(ligne2.getCoins().length == 6) {
                    coins.concat(ligne2.getCoins().slice(3));
                }
                else {
                    coins.push(ligne2.getCoins()[2]);
                    coins.push(ligne2.getCoins()[3]);
                    coins.push(ligne2.getCoins()[0]);
                }
                ligne2.retirerHauteurDebut();
                this.ajoutPointsFin(ligne2.getPoints());
                this.setCoins(coins);
                break;
            case 21 :
                //fin de ligne2 dessous à droite de this a 4 coins
                this.ajoutPointsFin(ligne2.getPoints());
                coins = this.getCoins().slice(0,3);
                coins.push(coins2[3]);
                coins.push(coins2[0]);
                coins.push(coins2[1]);
                ligne2.retirerHauteurFin();
                while(ligne2.getFin()[0] != ligne2.getPoints()[ligne2.getPoints().length-2][0]) {
                    ligne2.retirerPointFin();
                }
                this.ajoutPointsFin(ligne2.getPoints().reverse());
                this.setCoins(coins);
                break;

            case 25 :
                //debut de ligne2 dessous à droite de la fin de this
                coins = this.getPoints().slice(0,3);
                if(ligne2.getCoins().length == 6) {
                    coins.concat(ligne2.getCoins().slice(3));
                }
                else {
                    coins.push(ligne2.getCoins()[2]);
                    coins.push(ligne2.getCoins()[3]);
                    coins.push(ligne2.getCoins()[0]);
                }
                ligne2.retirerHauteurDebut();
                this.ajoutPointsFin(ligne2.getPoints());
                this.setCoins(coins);
                break;
            case 27 :
                //fin de ligne2 dessous à droite de la fin de this
                coins = this.getPoints().slice(0,3);
                coins.concat(ligne2.getCoins().slice(3));
                while(ligne2.getFin()[0] == ligne2.getPoints()[ligne2.getPoints().length-2][0]) {
                    this.retirerPointTete();
                }
                while(ligne2.getFin()[1] == ligne2.getPoints()[ligne2.getPoints().length-2][1]) {
                    this.retirerPointTete();
                }
                this.ajoutPointsFin(ligne2.getPoints());
                this.setCoins(coins);
                break;
                break;
            //ligne2 appartient à this
            case 0 : // 0*6+0
            case 35 : // 5*6+5
                break;
            default :
                ret = false;
                break;
        }
        return ret;
    }
}
