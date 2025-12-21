let characters = [];
let targetCharacter = null;
const maxGuesses = 6;
let currentGuess = 0;
let gameOver = false;

// Charger les personnages
async function loadCharacters() {
  try {
    const response = await fetch("/api/characters");
    characters = await response.json();
    console.log("Données des personnages chargées :", characters); // Log pour débogage
    startNewGame();
  } catch (error) {
    console.error("Error loading characters:", error);
  }
}

function updateGuessCounter() {
  const remainingGuesses = maxGuesses - currentGuess;
  console.log('Mise à jour du compteur :', { maxGuesses, currentGuess, remainingGuesses });
  document.getElementById("remaining-guesses").textContent = remainingGuesses;
}

function startNewGame() {
  if (!characters || characters.length === 0) {
    console.error('Aucun personnage chargé pour démarrer une nouvelle partie');
    return;
  }
  
  try {
    // Sélectionner un nouveau personnage cible
    targetCharacter = characters[Math.floor(Math.random() * characters.length)];
    
    // Réinitialiser les variables de jeu
    currentGuess = 0;
    gameOver = false;
    
    // Réinitialiser l'interface
    const guessesContainer = document.querySelector(".guesses");
    const hintsContainer = document.querySelector(".hints");
    
    if (guessesContainer) guessesContainer.innerHTML = "";
    if (hintsContainer) hintsContainer.innerHTML = "";
    
    const guessInput = document.getElementById("guess-input");
    const guessBtn = document.getElementById("guess-btn");
    const suggestionsContainer = document.getElementById('suggestions');
    
    if (guessInput) {
      guessInput.value = "";
      guessInput.disabled = false;
      guessInput.focus();
    }
    
    if (guessBtn) {
      guessBtn.disabled = false;
    }
    
    if (suggestionsContainer) {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';
    }
    
    // Réinitialiser le compteur de tentatives
    updateGuessCounter();
    
    console.log('Nouvelle partie commencée. Personnage cible:', targetCharacter?.name || 'inconnu');
    
    // Forcer le rafraîchissement de l'UI
    setTimeout(() => {
      if (guessInput) guessInput.focus();
    }, 50);
    
  } catch (error) {
    console.error('Erreur lors du démarrage d\'une nouvelle partie:', error);
  }
}

// Vérifier la supposition
function checkGuess() {
  if (gameOver) return;

  const guessInput = document.getElementById("guess-input");
  const guess = guessInput.value.trim();

  if (!guess) return;

  // Liste des personnages déjà devinés
  const guessedCharacters = Array.from(document.querySelectorAll('.guess')).map(guess => 
    guess.querySelector('.character-image').alt
  );

  // Vérifier si le personnage a déjà été deviné
  if (guessedCharacters.includes(guess)) {
    alert("Vous avez déjà deviné ce personnage !");
    return;
  }

  // Recherche exacte du personnage (nom ou aka)
  let guessedCharacter = characters.find(char => 
    char.name.toLowerCase() === guess.toLowerCase() || 
    (char.aka && char.aka.toLowerCase().split(',').some(aka => 
      aka.trim().toLowerCase() === guess.toLowerCase()
    ))
  );

  // Si pas trouvé, essayer une recherche partielle plus stricte
  if (!guessedCharacter) {
    // Vérifier si l'utilisateur a tapé un nom partiel qui correspond à plusieurs personnages
    const matchingCharacters = characters.filter(char => 
      char.name.toLowerCase().includes(guess.toLowerCase()) ||
      (char.aka && char.aka.toLowerCase().split(',').some(aka => 
        aka.trim().toLowerCase().includes(guess.toLowerCase())
      ))
    );

    if (matchingCharacters.length === 1) {
      guessedCharacter = matchingCharacters[0];
    }
  }

  // Incrémenter le compteur de tentatives avant de vérifier si le jeu est terminé
  currentGuess++;
  updateGuessCounter();

  const result = compareCharacters(guessedCharacter, targetCharacter);
  displayGuess(guessedCharacter, result);

  // Vérifier si le joueur a gagné ou perdu
  const isCorrect = JSON.stringify(guessedCharacter) === JSON.stringify(targetCharacter);
  const isLastGuess = currentGuess >= maxGuesses;

  if (isCorrect || isLastGuess) {
    gameOver = true;
    const guessInput = document.getElementById("guess-input");
    const guessBtn = document.getElementById("guess-btn");
    
    if (guessInput) guessInput.disabled = true;
    if (guessBtn) guessBtn.disabled = true;
    
    showEndGameModal(isCorrect);
  }

  // Effacer le champ de saisie
  guessInput.value = "";
}

// Comparer les personnages
function compareCharacters(guess, target) {
  console.log('Comparaison des personnages :', { guess, target });
  return {
    name:
      guess.name === target.name
        ? "correct"
        : guess.name.toLowerCase() === target.aka?.toLowerCase() ||
          guess.aka?.toLowerCase() === target.name.toLowerCase()
        ? "partial"
        : "incorrect",
    role: guess.role === target.role ? "correct" : "incorrect",
    gender: guess.gender === target.gender ? "correct" : "incorrect",
    hair: guess.hair === target.hair ? "correct" : "incorrect",
    location:
      guess.location === target.location
        ? "correct"
        : "incorrect",
    affiliation:
      guess.affiliation === target.affiliation ? "correct" : "incorrect",
  };
}

function displayGuess(character, result) {
  console.log('Affichage du personnage :', { character, result });
  const guessElement = document.createElement("div");
  guessElement.className = "guess";
  
  // Stocker le nom exact du personnage et son AKA pour éviter les conflits
  guessElement.dataset.characterName = character.name;
  if (character.aka) {
    guessElement.dataset.characterAka = character.aka;
  }

  const imageContainer = document.createElement("div");
  imageContainer.className = "character-image-container";
  const image = document.createElement("img");
  image.src = character.image || "/images/characters/default.webp";
  image.alt = character.name;
  image.className = "character-image";
  image.loading = "lazy";
  imageContainer.appendChild(image);
  guessElement.appendChild(imageContainer);

  const properties = [
    "name",
    "role",
    "gender",
    "hair",
    "location",
    "affiliation",
  ];

  properties.forEach((prop, index) => {
    const tile = document.createElement("div");
    tile.className = `character-tile ${result[prop]}`;
    const propertyValue = character[prop] || "N/A";
    tile.textContent = `${index + 1}. ${propertyValue}`;
    guessElement.appendChild(tile);
  });

  document.querySelector(".guesses").appendChild(guessElement);
}

// Fonction pour afficher les suggestions
function showSuggestions(matches) {
  const suggestionsContainer = document.getElementById('suggestions');
  if (!suggestionsContainer) {
    console.error('Élément suggestions non trouvé dans le DOM');
    return;
  }
  
  suggestionsContainer.innerHTML = '';
  
  if (!matches || matches.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }
  
  // Afficher les 20 premières correspondances
  matches.slice(0, 20).forEach((character) => {
    if (!character) return;
    
    const suggestion = document.createElement('div');
    suggestion.className = 'suggestion-item';
    
    // Créer un conteneur pour l'image et le nom
    const suggestionContent = document.createElement('div');
    suggestionContent.className = 'suggestion-content';
    
    // Ajouter l'image du personnage
    const charImage = document.createElement('img');
    charImage.src = character.image || 'images/characters/default.webp';
    charImage.alt = character.name;
    charImage.className = 'suggestion-image';
    
    // Ajouter le nom du personnage
    const nameSpan = document.createElement('span');
    nameSpan.textContent = character.name;
    
    // Assembler les éléments
    suggestionContent.appendChild(charImage);
    suggestionContent.appendChild(nameSpan);
    suggestion.appendChild(suggestionContent);
    
    // Gestion du clic sur une suggestion
    suggestion.addEventListener('click', (e) => {
      e.stopPropagation();
      const guessInput = document.getElementById('guess-input');
      if (guessInput) {
        guessInput.value = character.name;
        suggestionsContainer.style.display = 'none';
        checkGuess();
      }
    });
    
    suggestionsContainer.appendChild(suggestion);
  });
  
  suggestionsContainer.style.display = 'block';
}

// Fonction pour mettre en surbrillance la suggestion sélectionnée avec les flèches
function highlightSuggestion(direction) {
  const suggestions = document.querySelectorAll('.suggestion-item');
  if (suggestions.length === 0) return;
  
  let currentIndex = -1;
  suggestions.forEach((suggestion, index) => {
    if (suggestion.classList.contains('highlighted')) {
      suggestion.classList.remove('highlighted');
      currentIndex = index;
    }
  });
  
  if (direction === 'down') {
    currentIndex = (currentIndex + 1) % suggestions.length;
  } else if (direction === 'up') {
    currentIndex = (currentIndex - 1 + suggestions.length) % suggestions.length;
  } else {
    return;
  }
  
  suggestions[currentIndex].classList.add('highlighted');
  suggestions[currentIndex].scrollIntoView({ block: 'nearest' });
  
  // Mettre à jour l'input avec la suggestion sélectionnée
  document.getElementById('guess-input').value = suggestions[currentIndex].textContent;
}

// Afficher la modale de fin de partie
function showEndGameModal(isWin) {
  const modal = document.getElementById('endGameModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalImage = document.getElementById('modalCharacterImage');
  
  if (isWin) {
    modalTitle.textContent = 'Félicitations !';
    modalMessage.textContent = `Vous avez trouvé ${targetCharacter.name} en ${currentGuess} essai(s) !`;
  } else {
    modalTitle.textContent = 'Partie terminée';
    modalMessage.textContent = `Dommage ! Le personnage était ${targetCharacter.name}`;
  }
  
  modalImage.src = targetCharacter.image;
  modal.style.display = 'flex';
}

// Fonction pour initialiser le bouton Rejouer
function initPlayAgainButton() {
  const playAgainBtn = document.getElementById('playAgainBtn');
  if (playAgainBtn) {
    // Supprimer tous les écouteurs existants
    const newPlayAgainBtn = playAgainBtn.cloneNode(true);
    playAgainBtn.parentNode.replaceChild(newPlayAgainBtn, playAgainBtn);
    
    // Ajouter le nouvel écouteur
    newPlayAgainBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Bouton Rejouer cliqué');
      
      // Fermer la modale
      const modal = document.getElementById('endGameModal');
      if (modal) {
        modal.style.display = 'none';
      }
      
      // Réinitialiser le jeu
      try {
        startNewGame();
      } catch (error) {
        console.error('Erreur lors de la réinitialisation du jeu:', error);
        // En cas d'erreur, recharger la page
        window.location.reload();
      }
    });
    
    return newPlayAgainBtn;
  } else {
    console.error('Bouton Rejouer non trouvé dans le DOM');
  }
  return null;
}

// Initialisation du jeu
document.addEventListener('DOMContentLoaded', () => {
  // Initialiser le bouton Rejouer
  initPlayAgainButton();
  
  // Charger les personnages et démarrer une nouvelle partie
  loadCharacters();
  
  // Gestionnaire d'événement pour le champ de recherche
  const guessInput = document.getElementById('guess-input');
  const suggestionsContainer = document.getElementById('suggestions');
  
  if (guessInput) {
    // Gestion de la saisie dans le champ de recherche
    guessInput.addEventListener('input', handleSearchInput);
    
    // Gestion de la touche Entrée
    guessInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const highlighted = document.querySelector('.suggestion-item.highlighted');
        if (highlighted) {
          e.preventDefault();
          guessInput.value = highlighted.textContent.trim();
          if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
          }
        }
        checkGuess();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        highlightSuggestion(e.key === 'ArrowDown' ? 'down' : 'up');
      } else if (e.key === 'Escape') {
        if (suggestionsContainer) {
          suggestionsContainer.style.display = 'none';
        }
      }
    });
  }
  
  // Cacher les suggestions quand on clique en dehors
  document.addEventListener('click', (e) => {
    const suggestionsContainer = document.getElementById('suggestions');
    if (suggestionsContainer && !e.target.closest('.search-container')) {
      suggestionsContainer.style.display = 'none';
    }
  });
});

// Fonction pour gérer la recherche
function handleSearchInput(e) {
  // Vérifier si le jeu est en cours
  if (gameOver) {
    console.log('La partie est terminée, la recherche est désactivée');
    return;
  }
  
  if (!characters || characters.length === 0) {
    console.error('Aucun personnage chargé pour la recherche');
    return;
  }
  
  const input = e.target.value.trim().toLowerCase();
  const suggestionsContainer = document.getElementById('suggestions');
  
  if (!suggestionsContainer) {
    console.error('Élément suggestions non trouvé dans le DOM');
    return;
  }
  
  if (input.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }
  
  console.log('Recherche pour:', input);
  
  // Récupérer les noms et AKA des personnages déjà devinés
  const guessedCharacters = [];
  document.querySelectorAll('.guess').forEach(guess => {
    // Récupérer le nom exact du personnage deviné
    const guessCharacterName = guess.dataset.characterName;
    const guessCharacterAka = guess.dataset.characterAka;
    
    if (guessCharacterName) {
      guessedCharacters.push({
        name: guessCharacterName,
        aka: guessCharacterAka
      });
    } else {
      // Fallback si le dataset n'existe pas (ancien format)
      const nameElement = guess.querySelector('.character-tile');
      if (nameElement) {
        const nameText = nameElement.textContent.replace(/^\d+\.\s*/, '').trim();
        guessedCharacters.push({
          name: nameText,
          aka: null
        });
      }
    }
  });

  // Filtrer les personnages qui correspondent à la recherche
  const matches = characters.filter(character => {
    if (!character?.name) return false;
    
    // Vérifier si le personnage a déjà été deviné
    const isAlreadyGuessed = guessedCharacters.some(guessed => 
      guessed.name === character.name || 
      (guessed.aka && character.aka && 
       guessed.aka.split(',').some(aka => aka.trim() === character.name) ||
       character.aka.split(',').some(aka => aka.trim() === guessed.name)
      )
    );
    
    if (isAlreadyGuessed) return false;
    
    // Vérifier si le nom ou l'alias correspond à la recherche
    const nameMatch = character.name.toLowerCase().includes(input);
    const akaMatch = character.aka?.toLowerCase().includes(input) || false;
    
    return nameMatch || akaMatch;
  });
  
  console.log('Correspondances trouvées:', matches);
  showSuggestions(matches);
}
