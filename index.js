const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const fetch = require('node-fetch');
const Discord = require('discord.js-selfbot-v13');
const figlet = require('figlet');
const moment = require('moment');

// Function to install missing modules (chalk removed)
function installModules() {
    const requiredModules = [
        'discord.js-selfbot-v13',
        'figlet',
        'moment',
        'node-fetch'
    ];

    requiredModules.forEach(module => {
        try {
            require.resolve(module);
        } catch (err) {
            console.log(`Installing missing module: ${module}`);
            try {
                execSync(`npm install ${module}`, { stdio: 'inherit' });
            } catch (installError) {
                console.error(`Failed to install ${module}:`, installError);
            }
        }
    });
}

// Logging
function log(message, type = 'info') {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const prefix = {
        info: '[INFO]',
        success: '[SUCCESS]',
        error: '[ERROR]',
        warning: '[WARNING]'
    }[type] || '[LOG]';

    console.log(`${prefix} ${timestamp} → ${message}`);
}

// Set RPC
function setRichPresence(client, rpcState) {
    try {
        const activity = new Discord.RichPresence(client)
            .setType(rpcState.type)
            .setName(rpcState.name)
            .setDetails(rpcState.details)
            .setState(rpcState.state);

        if (rpcState.type === 'STREAMING' && rpcState.url) {
            activity.setURL(rpcState.url);
        }

        if (rpcState.timestamps) {
            activity.setStartTimestamp(rpcState.timestamps.start);
        }

        if (rpcState.assets) {
            activity
                .setAssetsLargeImage(rpcState.assets.largeImage)
                .setAssetsLargeText(rpcState.assets.largeText)
                .setAssetsSmallImage(rpcState.assets.smallImage)
                .setAssetsSmallText(rpcState.assets.smallText);
        }

        client.user.setActivity(activity);
        log(`Set RPC to ${rpcState.name}`, 'info');
    } catch (error) {
        log(`RPC Update Error: ${error.message}`, 'error');
    }
}

// Replace with your token URL (raw plain text)
const TOKEN_URL = 'https://voidy-script.neocities.org/gamepage';

// Fetch token
async function fetchTokenFromWeb() {
    try {
        const res = await fetch(TOKEN_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const token = (await res.text()).trim();
        if (!token) throw new Error("Empty token received.");
        return token;
    } catch (err) {
        log(`Failed to fetch token: ${err.message}`, 'error');
        process.exit(1);
    }
}

// Main
async function main() {
    installModules();

    const token = await fetchTokenFromWeb();

    const client = new Discord.Client({
        checkUpdate: false,
        autoRedeemNitro: true,
        captchaService: 'capmonster.cloud',
        syncStatus: true
    });

    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
        console.error('config.json file not found!');
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    client.on('ready', async () => {
        console.clear();
        console.log(
            figlet.textSync('Onyx RPC', {
                font: 'Slant',
                horizontalLayout: 'default',
                verticalLayout: 'default'
            })
        );

        log(`Successfully Authenticated`, 'success');
        log(`Logged in as ${client.user.tag}`, 'info');
        log(`User ID: ${client.user.id}`, 'info');
        log(`Made by Onyx`, 'info');

        client.user.setStatus(config.status.type);
        setRichPresence(client, config.rpcState);
    });

    client.on('error', (error) => {
        log(`Client Connection Error: ${error.message}`, 'error');
    });

    process.on('unhandledRejection', (reason, promise) => {
        log(`Unhandled System Rejection: ${reason}`, 'warning');
    });

    process.on('SIGINT', () => {
        log('Selfbot shutting down gracefully', 'warning');
        client.destroy();
        process.exit(0);
    });

    client.login(token);
}

main();
