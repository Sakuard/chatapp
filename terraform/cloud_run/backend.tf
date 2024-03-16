terraform {
    required_version = "~> 1.7"
    backend "gcs" {
        credentials = "/tmp/credentials.json"
        bucket      = "future-grove-410413-terraform-test-cloud_run_bucket"
    }
}