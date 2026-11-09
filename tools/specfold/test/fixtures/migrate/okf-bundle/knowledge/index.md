---
okf_version: "0.2"
---

# Knowledge Base

The OKF bundle for this homelab. Each `.md` file is one concept. The fleet runs k3s on three hosts, managed by Ansible, with Argo CD deploying the apps.

# Architecture

* [System overview](architecture/overview.md) - layers and boundaries
* [ADR-0001: k3s](architecture/adr-0001-k3s.md) - k3s as the orchestration layer

# Apps

* [Argo CD](apps/argocd.md) - GitOps deployment
