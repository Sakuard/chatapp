terraform {
    required_version = "~> 1.7"
    backend "gcs" {
        credentials = "/tmp/credentials.json"
        bucket      = "chat-backend-bucket"
    }
}