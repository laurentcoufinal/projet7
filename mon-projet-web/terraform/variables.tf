variable "aws_region" {
  description = "Region AWS cible"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nom du projet pour les tags et noms de ressources"
  type        = string
  default     = "mon-projet-web"
}

variable "environment" {
  description = "Nom de l'environnement (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "instance_type" {
  description = "Type d'instance EC2"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Nom de la key pair EC2 existante pour SSH (null pour desactiver)"
  type        = string
  default     = null
}

variable "ssh_allowed_cidr" {
  description = "CIDR autorise pour SSH (22)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "http_allowed_cidr" {
  description = "CIDR autorise pour HTTP (80)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "root_volume_size" {
  description = "Taille du disque root en Go"
  type        = number
  default     = 20
}

variable "dockerhub_username" {
  description = "Nom d'utilisateur DockerHub proprietaire des images"
  type        = string
  default     = ""
}

variable "dockerhub_token" {
  description = "Token DockerHub (utile si images privees)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "image_tag" {
  description = "Tag des images Docker a deployer"
  type        = string
  default     = "latest"
}

variable "jwt_secret" {
  description = "Secret JWT injecte dans auth-service"
  type        = string
  default     = "dev-secret-change-me"
  sensitive   = true
}
