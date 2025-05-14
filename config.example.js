module.exports = {
    "parallelBrowserCount": 1,
    "globalConnectConfig": {
        "delays": {
            "hideCookies": 500,
            "hidePopups": 10,
            "cloudFlare": {
                "timeout": 60000,
                "maxAttempts": 600,
                "delay": 10,
                "finalDelay": 1000,
                "urlCheckTimeout": 1000,
            },
            "initialLoadTimeoutDelay": 500,
            "secondaryLoadTimeoutAttempts": 15,
            "secondaryLoadTimeoutDelay": 50,
        },
        "headless": false,
        "customConfig": {
            // MacOS Brave Path
            "chromePath": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
            // for Linux change to '/usr/bin/brave-browser'
            // for Windows change to 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
        }
    },
    "websites": {
        "janitorai.com": {
            "enabled": true,
            "connectConfig": {
                "turnstile": true,
                "headless": false
            },
            "minFinalDelay": 5000
        },
        "character.ai": {
            "enabled": true,
            "connectConfig": {
                "turnstile": false
            },
            "minFinalDelay": 1000
        },
        "crushon.ai": {
            "enabled": true,
            "connectConfig": {
                "turnstile": true,
                "headless": false
            },
            "minFinalDelay": 1000
        },
        "createporn.com": {
            "enabled": true,
            "connectConfig": {
                "turnstile": true
            },
            "minFinalDelay": 1000
        },
        "aichattings.com": {
            "enabled": true,
            "connectConfig": {
                "turnstile": true
            },
            "minFinalDelay": 1000
        }
    }
}
