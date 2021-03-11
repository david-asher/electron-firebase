

Content Security Policy
    removed inline scripts, inline styles from html files (jquery, bootstrap, and fontawesome )
    index.html moved third party libraries to local files
    static hosted folder use Content-Security-Policy header

app-config.json
    added ContentSecurityPolicy parameter
    added hostPort parameter

webserver.js 
    removed body-parser as independent npm module
    app security check fix for referrer in header
    Content-Security-Policy header

windows.js
    webPreferences: now specifying contextIsolation and enableRemoteModule

