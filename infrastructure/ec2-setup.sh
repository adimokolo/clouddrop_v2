#!/bin/bash
# CloudDrop EC2 Bootstrap Script
# Run on a fresh Ubuntu 22.04 EC2 instance

set -euo pipefail
echo "🚀 Setting up CloudDrop on EC2..."

# Update system
sudo apt-get update -y && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Install AWS CLI
sudo apt-get install -y awscli

# Setup deployment directory
sudo mkdir -p /opt/clouddrop
sudo chown $USER:$USER /opt/clouddrop

# Configure CloudWatch logging
sudo apt-get install -y awslogs
cat > /etc/awslogs/awslogs.conf << 'EOF'
[general]
state_file = /var/lib/awslogs/agent-state

[/opt/clouddrop/logs]
file = /opt/clouddrop/logs/*.log
log_group_name = /clouddrop/application
log_stream_name = {instance_id}
datetime_format = %Y-%m-%dT%H:%M:%S
EOF

sudo systemctl enable awslogsd
sudo systemctl start awslogsd

echo "✅ EC2 setup complete!"
echo "Next steps:"
echo "  1. Set environment variables in /opt/clouddrop/.env"
echo "  2. Copy docker-compose.yml to /opt/clouddrop/"
echo "  3. Run: cd /opt/clouddrop && docker compose up -d"
