
# Release 1.1.0 (April 2021)

## Content Security Policy
* CSP is now applied to all HTML pages
* The policies are configured in the config/content-security-profile.json file

## updates
* package.json dependencies, as of April 2021

## module changes

### app-config.json
* added hostPort parameter

### webserver.js 
* removed body-parser as independent npm module
* app security check fix for referrer in header
* Content-Security-Policy header

### windows.js
* webPreferences: now specifying contextIsolation and enableRemoteModule
