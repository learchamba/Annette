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
var canvas;
var ctx;
var imageCourante;
var nbPoints =0;
var indiceImageCourante;
var pointsEllipse;
var annotationsStockees;
var annotationLigne;
var debutLigne;

var modeCanvas = 0;
/*
* 0 : mode libre
* 1 : ajout ligne
* 2 : ajout ellipse
* 3 : zone polygonale fermée
*
* */
var currentPath;


var selected = [];
var listeImages = [];

window.onload = init;


function masquerMasque() {

    if (masqueVisible) {
        masqueVisible = false;
        canvas.style.visibility = 'hidden';
    } else {
        masqueVisible = true;
        canvas.style.visibility = 'visible';
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
    document.getElementById('btnAjoutLigne').addEventListener('click',function(){
        if(modeCanvas == 1){
            modeCanvas = 0;
            document.getElementById('btnAjoutLigne').className = "btn btn-outline-dark btn-rounded btn-lg";
        }else{
            modeCanvas = 1;
            document.getElementById('btnAjoutLigne').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
        }
    }, false);
    document.getElementById('btnAjoutEllipse').addEventListener('click',function(){
        if(modeCanvas == 2){
            modeCanvas = 0;
            document.getElementById('btnAjoutEllipse').className = "btn btn-outline-dark btn-rounded btn-lg";
        }else{
            modeCanvas = 2;
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
            document.getElementById('btnAjoutZoneFermee').className = "btn btn-outline-dark btn-rounded btn-lg btn-secondary";
        }
    }, false);
    document.getElementById('btnValider').addEventListener(('click'), function () {
        $("body").append("<a href='" + canvas.toDataURL() + "' id='DLCanvas' download='annotation" + indiceImageCourante + ".jpg'>");
        var y = document.getElementById("DLCanvas");
        y.addEventListener('change', downloadimage, false);
        annotationsStockees = [];
        y.click();
    });


    btnMasquer.addEventListener('click', masquerMasque);
    btnChargement.addEventListener('click', load1Picture);

    initCanvas();
    document.getElementById('btnAnnuler').addEventListener('click', annulerAnnotation);

    imageCourante.addEventListener('load', function () {
        canvasWidth = this.clientWidth;
        canvasHeight = this.clientHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        ctx.drawImage(this, 0, 0, canvasWidth, canvasHeight);
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
    var name = 'divImageL'+indiceImages;
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
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    annotationsStockees = [];

    canvas.addEventListener('click',function(e) {
        switch(modeCanvas) {
            case 3:
            case 1:
                var pos = findPos(this);
                var x = e.pageX - pos.x;
                var y = e.pageY - pos.y;
                if(nbPoints == 0) {
                    ctx.beginPath();
                    ctx.moveTo(x,y);
                    nbPoints = 1;

                    if(modeCanvas == 3) {
                        debutLigne = [x, y];
                        annotationsStockees.push([3]);
                    } else {
                        annotationsStockees.push([1]);
                    }
                }
                else {
                    if(modeCanvas == 3) {
                        if(distance(debutLigne, [x,y]) < 15) {
                            x = debutLigne[0];
                            y = debutLigne[1];
                            modeCanvas = 0;
                        }
                    }
                    ctx.lineTo(x,y);
                    configCtx();
                    ctx.stroke();
                    ctx.save();
                }
                annotationsStockees[annotationsStockees.length-1].push([x,y]);
                break;
            case 2:
                var pos = findPos(this);
                var x = e.pageX - pos.x;
                var y = e.pageY - pos.y;
                pointsEllipse.push([x,y]);

                if(pointsEllipse.length == 3) {
                    // Abscisse, ordonnée, rayon abscisse, rayon ordonnée, rotation, début, fin
                    configCtx();
                    var centreX = pointsEllipse[0][0];
                    var centreY = pointsEllipse[0][1];
                    var rayX = distance(pointsEllipse[0], pointsEllipse[1]);
                    var rayY = distance(pointsEllipse[0],pointsEllipse[2]);
                    var rotation = 0;
                    var debut = 0;
                    var fin = 2*Math.PI;
                    ctx.moveTo(centreX + rayX, centreY);
                    ctx.ellipse(centreX, centreY, rayX, rayY, rotation, debut, fin);
                    ctx.stroke();
                    annotationsStockees.push([2, centreX, centreY, rayX, rayY, rotation, debut, fin]);
                    modeCanvas = 0;
                    document.getElementById('btnAjoutEllipse').className = "btn btn-outline-dark btn-rounded btn-lg";
                }
                break;
            default:
                var pos = findPos(this);
                var x = e.pageX - pos.x;
                var y = e.pageY - pos.y;
                var coord = "x=" + x + ", y=" + y;
                console.log(coord);
        }
    }, false);

    canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        switch(modeCanvas) {
            case 1:
                currentPath = new Path2D();
                nbPoints = 0;
                annotationsStockees.push(annotationLigne);
                break;
            case 3:
                ctx.closePath();
                ctx.stroke();
                annotationsStockees[annotationsStockees.length-1].push(debutLigne);
                break;
            default:
                console.log("bla");
        }
    })
}

function downloadimage() {
    document.getElementById("DLCanvas").remove();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentPath = new Path2D();
    nbPoints = 0;
}

function distance(pt1, pt2) {
    var x = pt1[0] - pt2[0];
    var y = pt1[1] - pt2[1];
    return Math.sqrt(x*x+y*y);
}


function annulerAnnotation() {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.beginPath();
    for(var i = 0 ; i<annotationsStockees.length-1; ++i) {
        switch(annotationsStockees[i][0]) {
            case 3 :
            case 1 :
                ctx.moveTo(annotationsStockees[i][1][0], annotationsStockees[i][1][1]);
                for(var j = 2; j < annotationsStockees[i].length; ++j) {
                    ctx.lineTo(annotationsStockees[i][j][0], annotationsStockees[i][j][1]);
                }
                break;
            case 2 :
                ctx.ellipse(annotationsStockees[i][1],annotationsStockees[i][2],annotationsStockees[i][3],annotationsStockees[i][4],annotationsStockees[i][5],annotationsStockees[i][6],annotationsStockees[i][7]);
                break;

        }
    }
    var lenAnnot = annotationsStockees.length-1;
    if(annotationsStockees[lenAnnot] && annotationsStockees[lenAnnot][0] == 1 || annotationsStockees[lenAnnot][0] == 3) {
        annotationsStockees[lenAnnot].pop();
        ctx.moveTo(annotationsStockees[lenAnnot][1][0], annotationsStockees[lenAnnot][1][1]);
        for(var j = 2; j < annotationsStockees[lenAnnot].length; ++j) {
            ctx.lineTo(annotationsStockees[lenAnnot][j][0], annotationsStockees[lenAnnot][j][1]);
        }
    } else {
        annotationsStockees.pop();
    }

    configCtx();
    ctx.stroke();
}

function configCtx() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'blue';
}