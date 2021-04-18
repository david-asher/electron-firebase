
# Release 1.1.0 (April 2021)

## Content Security Policy
* applied to all HTML pages
* configured in config/content-security-profile.json file
* static hosted web folders use Content-Security-Policy header on HTML pages

## updates
* package.json dependencies

## module changes

### app-config.json
* added hostPort parameter

### webserver.js 
* removed body-parser as independent npm module
* app security check fix for referrer in header
* Content-Security-Policy header

### windows.js
* webPreferences: now specifying contextIsolation and enableRemoteModule

## tested OS support
* Windows 10 Build 19041.928

TO DO:
* update copyright notices
* Linux 
* Mac 
