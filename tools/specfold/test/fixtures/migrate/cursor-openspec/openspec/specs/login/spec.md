# login Specification

## Purpose
Defines how a user logs in with an email address.

## Requirements

### Requirement: Email login
The service SHALL accept a login only for an address containing `@`.

#### Scenario: Valid address
- **WHEN** a user logs in with `ana@example.com`
- **THEN** the login succeeds
