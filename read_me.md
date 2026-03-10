# Notes about the application

### Development vs Production

**Current Development Setup:**

* The application runs entirely over HTTP, which is typical for local development but should be addressed for production
* Faster iteration without auth setup
* Easy role switching for testing
* No SSL certificate management needed
* Clear TODOs indicate this is temporary

**Before Production:**

* Implement real authentication (JWT/OAuth/SAML)
* Remove hardcoded users
* Add HTTPS/TLS
* Add proper authorization checks
* Remove demo mode bypasses
* Ensure `DATABASE_URL` is set via secure environment variables (never hardcoded)
