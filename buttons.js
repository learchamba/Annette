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
    document.getElementById('btnDefileHaut').addEventListener('click',defileHaut);
    document.getElementById('btnDefileBas').addEventListener('click',defileBas);
    divImgPrinc = document.getElementById('divImagePrincipale');

    btnMasquer.addEventListener('click', masquerMasque);
    btnChargement.addEventListener('click', load1Picture);
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
    document.getElementById(idImg).addEventListener('dblclick', function (e) {document.getElementById('imageCourante').src = e.target.src;});
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
    console.log(debutListe);
    console.log(listeImages.length);
    if(debutListe < listeImages.length - 4) {
        console.log('inH');
        debutListe++;
        afficheListeImages();
    }
}

function defileBas() {
    console.log('out');
    if(debutListe > 0) {
        console.log('in');
        debutListe--;
        afficheListeImages();
    }
}
