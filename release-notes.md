

# Release 1.4.0 (May 2021)

## localsecrets
* new module and API for saving data in encrypted storage

## post-install build stability

# Release 1.2.0 (April 2021)

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
