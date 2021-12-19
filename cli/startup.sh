#!/bin/bash

CLI_PATH="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"

if [ ! -d "$CLI_PATH/venv" ]; then
  echo "Python venv is not exist. Please install virtualenv and then retry."
  exit 1
fi

source $CLI_PATH/venv/bin/activate
python3 $CLI_PATH/src/hedge.py $@
deactivate