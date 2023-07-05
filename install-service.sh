#!/bin/bash

# Set up the directory
DIR="${HOME}/.local/lib/proxy-validator"

# Ensure systemd user directory exists
mkdir -p ~/.config/systemd/user

# Define service
cat << EOF > ~/.config/systemd/user/proxy-validator.service
[Unit]
Description=HTTP Python

[Service]
ExecStart=${DIR}/start.sh
WorkingDirectory=${DIR}
EOF

# Define timer
cat << EOF > ~/.config/systemd/user/proxy-validator.timer
[Unit]
Description=Run proxy-validator every 12 hours

[Timer]
OnCalendar=*-*-* 0/12:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Enable linger for this user
sudo loginctl enable-linger $(whoami)

# Reload systemctl daemon to recognize new service
systemctl --user daemon-reload

# Enable and start the new timer
systemctl --user enable --now proxy-validator.timer