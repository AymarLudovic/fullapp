// Sélectionner le bouton par son ID
const brandedButton = document.getElementById('toggle-button');

// Sélectionner l'élément create-store-container
const createStoreContainer = document.querySelector('.create-store-container');

// Variable pour suivre l'état du bouton toggle
let isToggleClicked = false;

// Ajouter un écouteur d'événement au clic sur le bouton toggle
brandedButton.addEventListener('click', function() {
  // Inverser l'état du bouton toggle
  isToggleClicked = !isToggleClicked;

  // Retirer ou ajouter la classe 'hide' en fonction de l'état du bouton toggle
  if (isToggleClicked) {
    createStoreContainer.classList.remove('hide');
  } else {
    createStoreContainer.classList.add('hide');
  }
});

// Ajouter un écouteur d'événement au clic sur la fenêtre
window.addEventListener('click', function(event) {
  // Vérifier si le bouton toggle a été cliqué
  if (!isToggleClicked) {
    // Ajouter la classe 'hide' à create-store-container
    createStoreContainer.classList.add('hide');
  }
});
