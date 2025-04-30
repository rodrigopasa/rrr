#!/bin/sh
set -e

# Verifica se o servidor está respondendo na porta 5000
wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Se chegou até aqui, o healthcheck passou
exit 0