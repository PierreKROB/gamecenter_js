import logger from '../../config/logger';

// Structure pour suivre les parties de morpion en cours
const ticTacToeGames = new Map();

/**
 * Utilitaire pour imprimer l'état actuel des parties
 */
const logGamesState = () => {
  logger.info(`Current TicTacToe games: ${ticTacToeGames.size}`);
  
  if (ticTacToeGames.size === 0) {
    logger.info('No active TicTacToe games');
    return;
  }
  
  for (const [gameId, game] of ticTacToeGames.entries()) {
    logger.info(`Game ${gameId}: status=${game.status}, players=${game.players.length}`);
  }
};

/**
 * Nettoyage des parties inactives ou abandonnées
 */
const cleanupStaleGames = () => {
  const threshold = Date.now() - (30 * 60 * 1000); // 30 minutes
  let cleanedCount = 0;
  
  for (const [gameId, game] of ticTacToeGames.entries()) {
    // Supprimer les parties en attente depuis plus de 30 minutes
    if (game.created && game.created < threshold && game.status === 'waiting') {
      ticTacToeGames.delete(gameId);
      cleanedCount++;
    }
    
    // Supprimer les parties terminées depuis plus de 10 minutes
    if (game.status === 'finished' && game.finished && game.finished < (Date.now() - 10 * 60 * 1000)) {
      ticTacToeGames.delete(gameId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.info(`Cleaned up ${cleanedCount} stale TicTacToe games`);
  }
};

// Exécuter un nettoyage périodique
setInterval(cleanupStaleGames, 10 * 60 * 1000); // Toutes les 10 minutes

/**
 * Configuration des gestionnaires d'événements pour le jeu de morpion
 * @param {SocketIO.Socket} socket - Socket de connexion
 * @param {SocketIO.Namespace} gamesNamespace - Namespace des jeux
 */
const setupTicTacToe = (socket, gamesNamespace) => {
  const user = socket.user;

  // Rejoindre une salle d'attente pour le morpion
  socket.on('joinTicTacToeLobby', () => {
    try {
      // Quitter les autres salles sauf celle de connexion
      Array.from(socket.rooms)
        .filter(room => room !== socket.id)
        .forEach(room => {
          logger.info(`User ${user.userName} leaving room ${room} to join lobby`);
          socket.leave(room);
        });
  
      // Rejoindre le lobby
      socket.join('ticTacToeLobby');
  
      // Annoncer le nombre de joueurs dans le lobby
      const lobbyUsers = Array.from(gamesNamespace.adapter.rooms.get('ticTacToeLobby') || []);
      logger.info(`Lobby users count: ${lobbyUsers.length}`);
  
      gamesNamespace.to('ticTacToeLobby').emit('lobbyUpdate', {
        players: lobbyUsers.length
      });
      
      // Envoyer la liste des parties en attente au joueur qui vient de rejoindre
      const availableGames = [];
      for (const [gameId, game] of ticTacToeGames.entries()) {
        if (game.status === 'waiting') {
          availableGames.push({
            gameId,
            creator: game.creatorName
          });
        }
      }
      
      logger.info(`Sending ${availableGames.length} available games to ${user.userName}`);
      
      // Envoyer uniquement au joueur qui rejoint
      socket.emit('availableGames', { games: availableGames });
      
      logger.info(`User ${user.userName} joined TicTacToe lobby`);
    } catch (error) {
      logger.error(`Error in joinTicTacToeLobby for user ${user.userName}:`, error);
      socket.emit('gameError', { message: 'Failed to join lobby' });
    }
  });
  
  // Créer une nouvelle partie de morpion
  socket.on('createTicTacToeGame', async () => {
    try {
      // Générer un ID unique pour la partie
      const timestamp = Date.now();
      const gameId = `ttt-${timestamp}-${user.id}`;
      
      logger.info(`User ${user.userName} attempting to create a new TicTacToe game: ${gameId}`);
      
      // Vérifier si le joueur n'a pas déjà une partie en attente
      for (const [existingId, game] of ticTacToeGames.entries()) {
        if (game.status === 'waiting' && game.creator === user.id) {
          logger.warn(`User ${user.userName} already has a waiting game: ${existingId}`);
          return socket.emit('gameError', { message: 'You already have a game waiting for players' });
        }
      }
      
      // Quitter les autres salles (dont le lobby) sauf celle de connexion
      Array.from(socket.rooms)
        .filter(room => room !== socket.id)
        .forEach(room => {
          logger.info(`User ${user.userName} leaving room ${room} to create game ${gameId}`);
          socket.leave(room);
        });
      
      // Créer une nouvelle partie
      ticTacToeGames.set(gameId, {
        id: gameId,
        creator: user.id,
        creatorName: user.userName,
        board: Array(9).fill(null),
        currentTurn: user.id,
        players: [
          {
            id: user.id,
            name: user.userName,
            symbol: 'X'
          }
        ],
        status: 'waiting', // waiting, playing, finished
        created: timestamp
      });
      
      // Rejoindre la salle de jeu
      socket.join(gameId);
      logger.info(`User ${user.userName} has joined room ${gameId}`);
      
      // Informer le créateur
      socket.emit('gameCreated', {
        gameId,
        game: ticTacToeGames.get(gameId)
      });
      
      // Vérifier que le socket est bien dans la salle du lobby avant d'annoncer
      if (gamesNamespace.adapter.rooms.get('ticTacToeLobby')?.size > 0) {
        // Annoncer la nouvelle partie dans le lobby
        gamesNamespace.to('ticTacToeLobby').emit('newGameAvailable', {
          gameId,
          creator: user.userName
        });
      }
      
      logger.info(`User ${user.userName} created TicTacToe game: ${gameId}`);
      
      // Planifier un nettoyage automatique des parties abandonnées
      setTimeout(() => {
        const game = ticTacToeGames.get(gameId);
        if (game && game.status === 'waiting') {
          ticTacToeGames.delete(gameId);
          logger.info(`Automatically removed stale game: ${gameId}`);
          gamesNamespace.to('ticTacToeLobby').emit('gameRemoved', { gameId });
        }
      }, 30 * 60 * 1000); // 30 minutes
    } catch (error) {
      logger.error(`Error creating game for user ${user.userName}:`, error);
      socket.emit('gameError', { message: 'An error occurred while creating the game' });
    }
  });
  
  // Rejoindre une partie existante
  socket.on('joinTicTacToeGame', async (data) => {
    try {
      if (!data || !data.gameId) {
        logger.error(`Invalid join game request from ${user.userName}: Missing gameId`);
        return socket.emit('gameError', { message: 'Game ID is required' });
      }

      const gameId = data.gameId.toString().trim();
      
      logger.info(`User ${user.userName} attempting to join game with ID: ${gameId}`);
      logger.info(`Available games: ${Array.from(ticTacToeGames.keys()).join(', ')}`);
      
      const game = ticTacToeGames.get(gameId);
      
      if (!game) {
        logger.error(`Game not found for ID: ${gameId}`);
        return socket.emit('gameError', { message: 'Game not found' });
      }
      
      if (game.status !== 'waiting') {
        logger.error(`Game ${gameId} already started or finished, status: ${game.status}`);
        return socket.emit('gameError', { message: 'Game already started or finished' });
      }
      
      if (game.players.length >= 2) {
        logger.error(`Game ${gameId} is full`);
        return socket.emit('gameError', { message: 'Game is full' });
      }

      // Vérifier si le joueur est déjà dans la partie
      if (game.players.some(p => p.id === user.id)) {
        logger.error(`User ${user.userName} is already in game ${gameId}`);
        return socket.emit('gameError', { message: 'You are already in this game' });
      }
      
      // Quitter les autres salles (dont le lobby) sauf celle de connexion
      Array.from(socket.rooms)
        .filter(room => room !== socket.id)
        .forEach(room => {
          logger.info(`User ${user.userName} leaving room ${room} to join game ${gameId}`);
          socket.leave(room);
        });
      
      // Ajouter le joueur à la partie
      game.players.push({
        id: user.id,
        name: user.userName,
        symbol: 'O'
      });
      
      // Mettre à jour le statut de la partie
      game.status = 'playing';
      
      // Rejoindre la salle de jeu
      socket.join(gameId);
      logger.info(`User ${user.userName} has joined room ${gameId}`);
      
      // Informer tous les joueurs que la partie commence
      gamesNamespace.to(gameId).emit('gameStarted', { game });
      
      // Retirer la partie de la liste des parties disponibles
      gamesNamespace.to('ticTacToeLobby').emit('gameRemoved', { gameId });
      
      logger.info(`User ${user.userName} joined TicTacToe game: ${gameId}`);
    } catch (error) {
      logger.error(`Error joining game for user ${user.userName}:`, error);
      socket.emit('gameError', { message: 'An error occurred while joining the game' });
    }
  });
  
  // Gérer un coup joué
  socket.on('playTicTacToeMove', async (data) => {
    try {
      if (!data || typeof data !== 'object') {
        logger.error(`Invalid move data from user ${user.userName}: data is not an object`);
        return socket.emit('gameError', { message: 'Invalid move data' });
      }
      
      const { gameId, position } = data;
      
      if (!gameId) {
        logger.error(`Move attempt without gameId from user ${user.userName}`);
        return socket.emit('gameError', { message: 'Game ID is required' });
      }
      
      if (position === undefined || position === null) {
        logger.error(`Move attempt without position from user ${user.userName} in game ${gameId}`);
        return socket.emit('gameError', { message: 'Position is required' });
      }

      logger.info(`User ${user.userName} attempting to play move at position ${position} in game: ${gameId}`);
      
      const game = ticTacToeGames.get(gameId);
      
      if (!game) {
        logger.error(`Game not found for move: ${gameId}`);
        return socket.emit('gameError', { message: 'Game not found' });
      }
      
      if (game.status !== 'playing') {
        logger.error(`Game ${gameId} not in playing state, current status: ${game.status}`);
        return socket.emit('gameError', { message: 'Game not in playing state' });
      }
      
      if (game.currentTurn !== user.id) {
        logger.error(`Not ${user.userName}'s turn in game ${gameId}. Current turn: ${game.currentTurn}`);
        return socket.emit('gameError', { message: 'Not your turn' });
      }
      
      if (position < 0 || position > 8 || game.board[position] !== null) {
        logger.error(`Invalid move at position ${position} in game ${gameId}`);
        return socket.emit('gameError', { message: 'Invalid move' });
      }
      
      // Vérifier que le joueur est bien dans la partie
      const playerInfo = game.players.find(p => p.id === user.id);
      if (!playerInfo) {
        logger.error(`User ${user.userName} is not a player in game ${gameId}`);
        return socket.emit('gameError', { message: 'You are not a player in this game' });
      }
      
      // Identifier le symbole du joueur
      const playerSymbol = playerInfo.symbol;
      
      // Mettre à jour le plateau
      game.board[position] = playerSymbol;
      
      // Vérifier si la partie est gagnée
      const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Lignes
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colonnes
        [0, 4, 8], [2, 4, 6]             // Diagonales
      ];
      
      let isWin = false;
      for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
          isWin = true;
          break;
        }
      }
      
      // Vérifier si match nul (plateau plein)
      const isDraw = !game.board.includes(null) && !isWin;
      
      // Mettre à jour le statut de la partie
      if (isWin) {
        game.status = 'finished';
        game.winner = user.id;
        game.finished = Date.now();
        gamesNamespace.to(gameId).emit('gameWon', { 
          game,
          winner: user.userName,
          winnerSymbol: playerSymbol
        });
        logger.info(`User ${user.userName} won TicTacToe game: ${gameId}`);
      } else if (isDraw) {
        game.status = 'finished';
        game.finished = Date.now();
        gamesNamespace.to(gameId).emit('gameDraw', { game });
        logger.info(`TicTacToe game ended in draw: ${gameId}`);
      } else {
        // Changer le tour
        const opponent = game.players.find(p => p.id !== user.id);
        if (!opponent) {
          logger.error(`No opponent found in game ${gameId}`);
          return socket.emit('gameError', { message: 'Game error: No opponent found' });
        }
        
        game.currentTurn = opponent.id;
        
        // Informer de la mise à jour du plateau
        gamesNamespace.to(gameId).emit('boardUpdated', { 
          game,
          lastMove: {
            position,
            symbol: playerSymbol,
            player: user.userName
          }
        });
        logger.info(`User ${user.userName} played move at position ${position} in game: ${gameId}`);
      }
    } catch (error) {
      logger.error(`Error processing move for user ${user.userName}:`, error);
      socket.emit('gameError', { message: 'An error occurred while processing your move' });
    }
  });
  
  // Quitter une partie
  socket.on('leaveTicTacToeGame', async ({ gameId }) => {
    try {
      if (!gameId) {
        logger.error(`Leave game request without gameId from user ${user.userName}`);
        return socket.emit('gameError', { message: 'Game ID is required' });
      }

      logger.info(`User ${user.userName} attempting to leave game with ID: ${gameId}`);
      
      const game = ticTacToeGames.get(gameId);
      
      if (!game) {
        logger.error(`Game not found when leaving: ${gameId}`);
        return socket.emit('gameError', { message: 'Game not found' });
      }
      
      // Vérifier que le joueur est bien dans la partie
      const playerIndex = game.players.findIndex(p => p.id === user.id);
      if (playerIndex === -1) {
        logger.error(`User ${user.userName} tried to leave game ${gameId} but is not a player`);
        return socket.emit('gameError', { message: 'You are not a player in this game' });
      }

      // Quitter la salle socket
      socket.leave(gameId);
      logger.info(`User ${user.userName} left socket room for game ${gameId}`);
      
      // Informer l'autre joueur
      socket.to(gameId).emit('playerLeft', { 
        player: user.userName,
        game 
      });
      
      // Si la partie était en cours, déclarer l'autre joueur gagnant
      if (game.status === 'playing') {
        game.status = 'finished';
        game.finished = Date.now();
        const opponent = game.players.find(p => p.id !== user.id);
        
        if (opponent) {
          game.winner = opponent.id;
          gamesNamespace.to(gameId).emit('gameWon', { 
            game,
            winner: opponent.name,
            winnerSymbol: opponent.symbol,
            byForfeit: true
          });
          logger.info(`User ${opponent.name} won TicTacToe game by forfeit: ${gameId}`);
        }
      }
      
      // Vérifier si la salle est vide - utiliser adapter.rooms pour vérifier correctement
      const room = gamesNamespace.adapter.rooms.get(gameId);
      if (!room || room.size === 0) {
        // Tous les joueurs ont quitté, supprimer la partie
        ticTacToeGames.delete(gameId);
        logger.info(`TicTacToe game removed: ${gameId}`);
        
        // Annoncer la suppression au lobby
        gamesNamespace.to('ticTacToeLobby').emit('gameRemoved', { gameId });
      }
      
      logger.info(`User ${user.userName} left TicTacToe game: ${gameId}`);

      // Redonner une confirmation au joueur
      socket.emit('leaveGameSuccess', { gameId });
    } catch (error) {
      logger.error(`Error leaving game for user ${user.userName}:`, error);
      socket.emit('gameError', { message: 'An error occurred while leaving the game' });
    }
  });
  
  // Gérer la déconnexion par rapport aux parties de morpion
  socket.on('disconnect', (reason) => {
    try {
      logger.info(`User ${user.userName} disconnected from games namespace. Reason: ${reason}`);
      
      // Quitter le lobby s'il y était
      socket.leave('ticTacToeLobby');
      
      // Log de débogage pour voir les jeux actifs
      logGamesState();
      
      // Trouver toutes les parties où le joueur était présent
      for (const [gameId, game] of ticTacToeGames.entries()) {
        if (game.players.some(p => p.id === user.id)) {
          logger.info(`Found disconnected user ${user.userName} in game ${gameId}, status: ${game.status}`);
          
          // Informer l'autre joueur
          socket.to(gameId).emit('playerLeft', { 
            player: user.userName,
            game,
            reason: 'disconnected'
          });
          
          // Si la partie était en cours, déclarer l'autre joueur gagnant
          if (game.status === 'playing') {
            game.status = 'finished';
            game.finished = Date.now();
            const opponent = game.players.find(p => p.id !== user.id);
            
            if (opponent) {
              game.winner = opponent.id;
              logger.info(`Setting winner to ${opponent.name} (${opponent.id}) in game ${gameId}`);
              
              try {
                gamesNamespace.to(gameId).emit('gameWon', { 
                  game,
                  winner: opponent.name,
                  winnerSymbol: opponent.symbol,
                  byForfeit: true,
                  reason: 'opponent_disconnected'
                });
                logger.info(`User ${opponent.name} won TicTacToe game by forfeit (disconnect): ${gameId}`);
              } catch (emitError) {
                logger.error(`Error emitting gameWon event: ${emitError.message}`);
              }
            }
          }
          
          // Vérifier si la salle est vide
          const room = gamesNamespace.adapter.rooms.get(gameId);
          if (!room || room.size === 0) {
            // Supprimer la partie si tous les joueurs sont déconnectés
            ticTacToeGames.delete(gameId);
            logger.info(`TicTacToe game removed after disconnect: ${gameId}`);
            
            // Annoncer la suppression au lobby
            try {
              gamesNamespace.to('ticTacToeLobby').emit('gameRemoved', { gameId });
            } catch (emitError) {
              logger.error(`Error emitting gameRemoved event: ${emitError.message}`);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Error handling disconnect for user ${user?.userName || 'unknown'}:`, error);
    }
  });
};

export {
  setupTicTacToe,
  ticTacToeGames
};
