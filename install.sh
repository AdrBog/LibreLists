#!/bin/bash

REPO_URL="https://github.com/AdrBog/LibreLists.git"
PROJECT_DIR="LibreLists"
VENV_DIR="venv"
REQUIRED_PACKAGES="flask flask-cors python-magic"

error_exit() {
    echo "Error: $1"
    exit 1
}

echo "Cloning the repository from $REPO_URL..."
git clone "$REPO_URL" || error_exit "Failed to clone the repository."

cd "$PROJECT_DIR" || error_exit "Failed to change directory to $PROJECT_DIR."

echo "Creating a virtual environment in $VENV_DIR..."
python -m venv "$VENV_DIR" || error_exit "Failed to create a virtual environment."

echo "Activating the virtual environment..."
source "$VENV_DIR/bin/activate" || error_exit "Failed to activate the virtual environment."

echo "Installing required packages: $REQUIRED_PACKAGES..."
pip install $REQUIRED_PACKAGES || error_exit "Failed to install required packages."

echo "Installation completed successfully!"
echo "To run the Flask app, follow these instructions:"
echo "1. Ensure the virtual environment is activated by running: source $VENV_DIR/bin/activate"
echo "2. Start the Flask app with the command: flask run"
echo "3. Open your web browser and go to: http://127.0.0.1:5000"