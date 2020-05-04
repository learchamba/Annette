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

var selected = [];
var listeImages = [];

window.onload = init;


function masquerMasque() {

    if (masqueVisible) {
        masqueVisible = false;
        imageMasque.style.visibility = 'hidden';
    } else {
        masqueVisible = true;
        imageMasque.style.visibility = 'visible';
    }
}

function init() {
    btnMasquer = document.getElementById('btnMasquer');
    imageMasque = document.getElementById('imageMasque');
    btnChargement = document.getElementById('btnChargement');
    divImgPrinc = document.getElementById('divImagePrincipale');

    document.getElementById('btnDefileHaut').addEventListener('click',defileHaut);
    document.getElementById('btnDefileBas').addEventListener('click',defileBas);
    document.getElementById('btnSupprImage').addEventListener('click',supprImages);

    btnMasquer.addEventListener('click', masquerMasque);
    btnChargement.addEventListener('click', load1Picture);

    for(var i = 1; i<5; ++i) {
        document.getElementById("imageL"+i).addEventListener('dblclick', function (e) {
            document.getElementById('imageCourante').src = e.target.src;
        });


        document.getElementById("imageL"+i).addEventListener('click',
            function (e) {
                console.log("click");
                var indiceFic = parseInt(e.target.id.charAt(e.target.id.length-1));
                if(indiceFic<=listeImages.length) {
                    indiceFic += debutListe - 1;
                    if (!e.target.className.includes("thumbnail")) {
                        e.target.className = "img-fluid img-thumbnail";
                        selected.push(listeImages[indiceFic]);
                    } else {
                        e.target.className = "img-fluid";
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
}

function asyncLoadImage() {
    var fr = new FileReader();
    fr.onload = imageHandler;
    var filename = listeImages[indiceListe];
    fr.readAsDataURL(filename);
    if(indiceListe == debutListe + 3 || indiceListe == listeImages.length) {
        clearInterval(intervalIDLoadImage);
    }
    ++indiceListe;
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
    console.log("init");
    if(debutListe <= listeImages.length - 4 && debutListe > 0) {
        console.log("if");
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