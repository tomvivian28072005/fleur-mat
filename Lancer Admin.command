#!/bin/bash
cd "$(dirname "$0")"
echo "Mise à jour du projet..."
git pull
cd admin
npm run dev
