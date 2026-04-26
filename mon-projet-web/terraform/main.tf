terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

locals {
  common_tags = {
    Name        = "${var.project_name}-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }

  image_prefix = var.dockerhub_username != "" ? "${var.dockerhub_username}/" : ""

  app_user_data = <<-EOT
    #!/bin/bash
    set -euxo pipefail

    dnf update -y
    dnf install -y docker
    systemctl enable --now docker
    usermod -aG docker ec2-user

    mkdir -p /opt/mon-projet-web

    cat > /opt/mon-projet-web/nginx.conf <<'NGINXCONF'
    events {}
    http {
      upstream auth_upstream { server auth-service:3001; }
      upstream product_upstream { server product-service:8000; }
      upstream chat_upstream { server chat-service:3003; }
      upstream frontend_upstream { server frontend:80; }

      server {
        listen 80;

        location /api/auth/ {
          proxy_pass http://auth_upstream/;
        }

        location /api/products/ {
          proxy_pass http://product_upstream/;
        }

        location /api/chat/ {
          proxy_pass http://chat_upstream/;
        }

        location /socket.io/ {
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header Host $host;
          proxy_pass http://chat_upstream/socket.io/;
        }

        location / {
          proxy_pass http://frontend_upstream/;
        }
      }
    }
    NGINXCONF

    cat > /opt/mon-projet-web/docker-compose.yml <<'COMPOSE'
    services:
      redis:
        image: redis:7-alpine
        restart: unless-stopped

      auth-service:
        image: ${local.image_prefix}auth-service:${var.image_tag}
        restart: unless-stopped
        environment:
          PORT: 3001
          JWT_SECRET: "${var.jwt_secret}"
        depends_on:
          - redis

      product-service:
        image: ${local.image_prefix}product-service:${var.image_tag}
        restart: unless-stopped
        environment:
          PORT: 8000

      chat-service:
        image: ${local.image_prefix}chat-service:${var.image_tag}
        restart: unless-stopped
        environment:
          PORT: 3003
          REDIS_URL: redis://redis:6379
        depends_on:
          - redis

      frontend:
        image: ${local.image_prefix}frontend:${var.image_tag}
        restart: unless-stopped
        depends_on:
          - auth-service
          - product-service
          - chat-service

      gateway:
        image: nginx:1.27-alpine
        restart: unless-stopped
        ports:
          - "80:80"
        volumes:
          - /opt/mon-projet-web/nginx.conf:/etc/nginx/nginx.conf:ro
        depends_on:
          - frontend
          - auth-service
          - product-service
          - chat-service
    COMPOSE

    if [ -n "${var.dockerhub_username}" ] && [ -n "${var.dockerhub_token}" ]; then
      echo "${var.dockerhub_token}" | docker login -u "${var.dockerhub_username}" --password-stdin
    fi

    cd /opt/mon-projet-web
    docker compose pull
    docker compose up -d
  EOT
}

resource "aws_security_group" "app_sg" {
  name_prefix = "${var.project_name}-${var.environment}-sg-"
  description = "Security group for ${var.project_name} ${var.environment}"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.http_allowed_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_instance" "app_server" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  subnet_id     = data.aws_subnets.default.ids[0]
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.app_sg.id]

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
    encrypted   = true
  }

  user_data                   = local.app_user_data
  user_data_replace_on_change = true

  tags = local.common_tags
}

output "instance_id" {
  description = "ID de l'instance EC2"
  value       = aws_instance.app_server.id
}

output "public_ip" {
  description = "IP publique de l'instance EC2"
  value       = aws_instance.app_server.public_ip
}

output "public_dns" {
  description = "DNS public de l'instance EC2"
  value       = aws_instance.app_server.public_dns
}

output "security_group_id" {
  description = "ID du security group associe"
  value       = aws_security_group.app_sg.id
}

output "application_url" {
  description = "URL HTTP d'acces a l'application"
  value       = "http://${aws_instance.app_server.public_dns}"
}
