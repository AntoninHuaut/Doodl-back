# Doodl-back

## Présentation
Doodl est un jeu où un joueur a pour but de faire deviner un mot aux autres joueurs en le dessinant.  
Les joueurs doivent le deviner le plus rapidement possible pour gagner le plus de points.  
Le dessinateur a à sa disposition une palette d'outils : pinceau de plusieurs couleurs et de différentes tailles, une taille et un pot de peinture. 

Accueil TODO

Création personnage TODO

Lobby TODO

L'interface de jeu se découpe en 4 parties : sur une même rangée, on retrouve la liste des joueurs, le canvas et le chat. Sur la partie inférieure se trouve la palette d'outils.  
C'est grâce au chat que les joueurs peuvent proposer un mot, il sert aussi à communiquer avec les autres joueurs.  

Room/Round/Mode de jeu simple TODO (+ explication évolution possible)

Panel Admin TODO

## Architecture
Le projet Doodl est séparé en deux parties : un backend en Deno/TypeScript et un frontend en React/TypeScript.  
Le backend possède un serveur web permettant de servir le front, possède quelques routes d'API REST.  
Cependant, la majorité des échanges avec le frontend se fait aux niveaux des websockets. En effet, le serveur et les clients communiquent durant les parties en temps réel.
Nous avons instauré une structure d'échange avec des canaux pour organiser ces derniers.  

TODO ENV file

### Liste des canaux :  
**PING / PONG** : permet de maintenir la connexion WebSocket en vie et d'éliminer les WebSockets mortes.  
**INIT** : permet d'initialiser le joueur lors de sa connexion au serveur  
**CHAT** : envoie d'un message au serveur/client  
**DRAW** : envoie d'un dessin au serveur/client  
**INFO** : contient les informations de la room, et du round s'il est lancé.  
**CONFIG** : permet de changer la configuration de la room (Admin de la room)  
**START** : lance la partie (Admin de la room)  
**CHOOSE_WORD** : permet de choisir le mot à dessiner parmi une liste proposée  
**GUESS** : informe les joueurs qu'un joueur à deviner le mot  
**KICK** : demande l'exclusion d'un joueur (Admin Doodl)  

