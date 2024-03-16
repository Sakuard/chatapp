terraform {
    required_version = "~> 1.7"
    backend "gcs" {
        credentials = "/tmp/credentials.json"
        bucket      = "imposing-quasar-341914-chat-backend-cloud_run_bucket"
    }
}