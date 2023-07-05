#!/bin/bash

# Check if directory is supplied
if [ -z "$1" ]
  then
    echo "No directory supplied"
    exit 1
fi

# Set up the directory
DIR="$1"

# Ensure systemd user directory exists
mkdir -p ~/.config/systemd/user

# Define service
cat << EOF > ~/.config/systemd/user/http_python.service
[Unit]
Description=HTTP Python
After=network.target

[Service]
ExecStart=/usr/bin/python3 -m http.server 8080
WorkingDirectory=${DIR}
Restart=always

[Install]
WantedBy=default.target
EOF

# Enable linger for this user
sudo loginctl enable-linger $(whoami)

# Reload systemctl daemon to recognize new service
systemctl --user daemon-reload

# Enable and start the new service
systemctl --user enable --now http_python
