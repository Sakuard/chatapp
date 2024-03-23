provider "google" {
  credentials = "${file("/tmp/credentials.json")}"
  project = var.project
  region  = var.location
}

resource "google_cloud_run_v2_service" "chat-app" {
  name     = format("%s-%s-%s", var.project, var.repo, "chat-app")
  location = var.location
  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      ports { 
        container_port = 80
      }
      image = format("%s:%s", var.image, var.image_tag)
    }
  }
}

resource "google_cloud_run_service_iam_member" "run_all_users" {
  service  = google_cloud_run_v2_service.chat-app.name
  location = google_cloud_run_v2_service.chat-app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
