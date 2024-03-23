provider "google" {
  credentials = "${file("/tmp/credentials.json")}"
  project = var.project
  region  = var.location
}

resource "google_artifact_registry_repository" "terraform_repo" {
  location      = var.location
  repository_id = format("%s-%s", var.project, var.repo)
  description   = "example docker repository"
  format        = "DOCKER"
}

resource "google_storage_bucket" "static" {
 name          = format("%s-%s-%s", var.project, var.repo, var.cloud_run_bucket)
 location      = var.location
 storage_class = "STANDARD"

 uniform_bucket_level_access = true
}