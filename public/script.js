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
    console.log("Character data loaded:", characters); // Debug log
    startNewGame();
  } catch (error) {
    // Error loading characters
  }
}

function updateGuessCounter() {
  const remainingGuesses = maxGuesses - currentGuess;
  console.log('Counter update:', { maxGuesses, currentGuess, remainingGuesses });
  document.getElementById("remaining-guesses").textContent = remainingGuesses;
}

function startNewGame() {
  if (!characters || characters.length === 0) {
    return;
  }
  
  try {
    // Select a new target character
    targetCharacter = characters[Math.floor(Math.random() * characters.length)];
    
    // Reset game variables
    currentGuess = 0;
    gameOver = false;
    
    // Reset interface
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
    
    // Reset guess counter
    updateGuessCounter();
    
    console.log('New game started. Target character:', targetCharacter?.name || 'unknown');
    
    // Force UI refresh
    setTimeout(() => {
      if (guessInput) guessInput.focus();
    }, 50);
    
  } catch (error) {
    // Error starting new game
  }
}

// Check guess
function checkGuess() {
  if (gameOver) return;

  const guessInput = document.getElementById("guess-input");
  const guess = guessInput.value.trim();

  if (!guess) return;

  // List of already guessed characters
  const guessedCharacters = Array.from(document.querySelectorAll('.guess')).map(guess => 
    guess.querySelector('.character-image').alt
  );

  // Vérifier si le personnage a déjà été deviné
  if (guessedCharacters.includes(guess)) {
    alert("You already guessed this character!");
    return;
  }

  // Exact character search (name or aka)
  let guessedCharacter = characters.find(char => 
    char.name.toLowerCase() === guess.toLowerCase() || 
    (char.aka && char.aka.toLowerCase().split(',').some(aka => 
      aka.trim().toLowerCase() === guess.toLowerCase()
    ))
  );

  // If not found, try stricter partial search
  if (!guessedCharacter) {
    // Check if user typed partial name matching multiple characters
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

  // Increment guess counter before checking if game is over
  currentGuess++;
  updateGuessCounter();

  const result = compareCharacters(guessedCharacter, targetCharacter);
  displayGuess(guessedCharacter, result);

  // Check if player won or lost
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

  // Clear input field
  guessInput.value = "";
}

// Compare characters
function compareCharacters(guess, target) {
  console.log('Character comparison:', { guess, target });
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
  console.log('Displaying character:', { character, result });
  const guessElement = document.createElement("div");
  guessElement.className = "guess";
  
  // Store exact character name and AKA to avoid conflicts
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

// Function to display suggestions
function showSuggestions(matches) {
  const suggestionsContainer = document.getElementById('suggestions');
  if (!suggestionsContainer) {
    return;
  }
  
  suggestionsContainer.innerHTML = '';
  
  if (!matches || matches.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }
  
  // Display first 20 matches
  matches.slice(0, 20).forEach((character) => {
    if (!character) return;
    
    const suggestion = document.createElement('div');
    suggestion.className = 'suggestion-item';
    
    // Create container for image and name
    const suggestionContent = document.createElement('div');
    suggestionContent.className = 'suggestion-content';
    
    // Add character image
    const charImage = document.createElement('img');
    charImage.src = character.image || 'images/characters/default.webp';
    charImage.alt = character.name;
    charImage.className = 'suggestion-image';
    
    // Add character name
    const nameSpan = document.createElement('span');
    nameSpan.textContent = character.name;
    
    // Assemble elements
    suggestionContent.appendChild(charImage);
    suggestionContent.appendChild(nameSpan);
    suggestion.appendChild(suggestionContent);
    
    // Handle suggestion click
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

// Function to highlight selected suggestion with arrow keys
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
  
  // Update input with selected suggestion
  document.getElementById('guess-input').value = suggestions[currentIndex].textContent;
}

// Display end game modal
function showEndGameModal(isWin) {
  const modal = document.getElementById('endGameModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalImage = document.getElementById('modalCharacterImage');
  
  if (isWin) {
    modalTitle.textContent = 'Congratulations!';
    modalMessage.textContent = `You found ${targetCharacter.name} in ${currentGuess} guess(es)!`;
  } else {
    modalTitle.textContent = 'Game Over';
    modalMessage.textContent = `Too bad! The character was ${targetCharacter.name}`;
  }
  
  modalImage.src = targetCharacter.image;
  modal.style.display = 'flex';
}

// Function to initialize play again button
function initPlayAgainButton() {
  const playAgainBtn = document.getElementById('playAgainBtn');
  if (playAgainBtn) {
    // Remove all existing listeners
    const newPlayAgainBtn = playAgainBtn.cloneNode(true);
    playAgainBtn.parentNode.replaceChild(newPlayAgainBtn, playAgainBtn);
    
    // Add new listener
    newPlayAgainBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Play Again button clicked');
      
      // Close modal
      const modal = document.getElementById('endGameModal');
      if (modal) {
        modal.style.display = 'none';
      }
      
      // Reset game
      try {
        startNewGame();
      } catch (error) {
        // Error resetting game
        window.location.reload();
      }
    });
    
    return newPlayAgainBtn;
  } else {
    // Play Again button not found
  }
  return null;
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
  // Initialize play again button
  initPlayAgainButton();
  
  // Load characters and start new game
  loadCharacters();
  
  // Event handler for search field
  const guessInput = document.getElementById('guess-input');
  const suggestionsContainer = document.getElementById('suggestions');
  
  if (guessInput) {
    // Handle search input
    guessInput.addEventListener('input', handleSearchInput);
    
    // Handle Enter key
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
  
  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    const suggestionsContainer = document.getElementById('suggestions');
    if (suggestionsContainer && !e.target.closest('.search-container')) {
      suggestionsContainer.style.display = 'none';
    }
  });
});

// Function to handle search
function handleSearchInput(e) {
  // Check if game is in progress
  if (gameOver) {
    console.log('Game is over, search is disabled');
    return;
  }
  
  if (!characters || characters.length === 0) {
    return;
  }
  
  const input = e.target.value.trim().toLowerCase();
  const suggestionsContainer = document.getElementById('suggestions');
  
  if (!suggestionsContainer) {
    return;
  }
  
  if (input.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }
  
  console.log('Searching for:', input);
  
  // Get names and AKA of already guessed characters
  const guessedCharacters = [];
  document.querySelectorAll('.guess').forEach(guess => {
    // Get exact guessed character name
    const guessCharacterName = guess.dataset.characterName;
    const guessCharacterAka = guess.dataset.characterAka;
    
    if (guessCharacterName) {
      guessedCharacters.push({
        name: guessCharacterName,
        aka: guessCharacterAka
      });
    } else {
      // Fallback if dataset doesn't exist (old format)
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

  // Filter characters matching search
  const matches = characters.filter(character => {
    if (!character?.name) return false;
    
    // Check if character has already been guessed
    const isAlreadyGuessed = guessedCharacters.some(guessed => 
      guessed.name === character.name || 
      (guessed.aka && character.aka && 
       guessed.aka.split(',').some(aka => aka.trim() === character.name) ||
       character.aka.split(',').some(aka => aka.trim() === guessed.name)
      )
    );
    
    if (isAlreadyGuessed) return false;
    
    // Check if name or alias matches search
    const nameMatch = character.name.toLowerCase().includes(input);
    const akaMatch = character.aka?.toLowerCase().includes(input) || false;
    
    return nameMatch || akaMatch;
  });
  
  console.log('Matches found:', matches);
  showSuggestions(matches);
}
