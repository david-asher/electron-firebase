

Content Security Policy
    static hosted folder uses Content-Security-Policy header

app-config.json
    added ContentSecurityPolicy parameter
    added hostPort parameter

webserver.js 
    removed body-parser as independent npm module
    app security check fix for referrer in header
    Content-Security-Policy header

windows.js
    webPreferences: now specifying contextIsolation and enableRemoteModule

TO DO:
* move parameters to content-security-policy.json
* separate modal window code in index.html
