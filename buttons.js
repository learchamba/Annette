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

var modeCanvas = 0;
/*
* 0 : mode libre
* 1 : ajout ligne
*
* */
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
    document.getElementById('btnAjoutLigne').addEventListener('click',function(){if(modeCanvas){modeCanvas = 0;}else{modeCanvas = 1;}}, false);

    btnMasquer.addEventListener('click', masquerMasque);
    btnChargement.addEventListener('click', load1Picture);

    initCanvas();

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
    var store = document.getElementById(name);
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

    canvas.addEventListener('click',function(e) {
        switch(modeCanvas) {
            case 1:
                var pos = findPos(this);
                var x = e.pageX - pos.x;
                var y = e.pageY - pos.y;
                if(nbPoints == 0) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    nbPoints = 1;
                }
                else {
                    ctx.lineTo(x,y);
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
                ctx.lineWidth = 2;
                ctx.strokeStyle = "blue";
                ctx.stroke();
                nbPoints = 0;
                break;
            default:
                console.log("bla");
        }
    })
}