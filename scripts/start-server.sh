#!/usr/bin/env bash
app_dir='/Users/fagathe/workspace/perso/sf-p05-design-system'
app_host='dev.design-system.fagathe-dev.fr'
port='9150'

# Le script de démarrage de base de données est supprimé.
# SQLite se gère tout seul au moment où PHP lit/écrit dans le fichier.

cd $app_dir
echo 'cd api dir'

echo 'ouvrir le projet sur vscode'
code .

bin/console c:c -n

echo "open http://${app_host}:${port} in browser"

# lance le serveur interne de php
php -S $app_host:$port -t public

# La ligne "trap" de fin est également supprimée, il n'y a plus de service à éteindre.