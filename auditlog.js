const Discord = require('discord.js');
const bot = new Discord.Client();

var fs = require('fs');

const settings = require('./settings.js');

bot.on("ready", function () {
    console.log(`Currently on: ${bot.user.tag}\nThis AuditLog program was created by Kotori#4236. If you have any questions, DM me! ^-^`);
    loadJSON(); //Load the guild channel ids onto a map
});

bot.on("messageDelete", function (message) {
    const content = message.content;
    const author = message.author;
    const guild = message.guild; //create a guild constant because message will cease to exist soon. 

    guild.fetchAuditLogs().then(log => {
        const entry = log.entries.first();

        if (entry.executor != author) {
            const executor = message.guild.member(entry.executor);
            var auditMessage = executor.user.tag + " deleted " + author.tag + "'s message: `" + content + "`.";
            sendMessage(auditMessage, guild);
        }
    });
});

bot.on("messageUpdate", function (oldMessage, newMessage) {
    var auditMessage = newMessage.author.tag + " edited a message with previous content: `" + oldMessage.content + "`."
    sendMessage(auditMessage, newMessage.guild) 

});

bot.on("channelCreate", function (channel) {
    channel.guild.fetchAuditLogs().then(log => {
        const entry = log.entries.first();
        const executor = channel.guild.member(entry.executor);

        auditMessage = executor.user.tag + " CREATED a " + channel.type.toLowerCase() + " channel named " + channel.toString() + ".";
        sendMessage(auditMessage, channel.guild);

    });
});

bot.on()

bot.on("channelDelete", function (deletedChannel) {
    const type = deletedChannel.type;
    const name = deletedChannel.name;
    const guild = deletedChannel.guild;
    deletedChannel.guild.fetchAuditLogs().then(log => {
        const entry = log.entries.first();
        const executor = guild.member(entry.executor);
        var auditMessage = executor.user.tag + " DELETED a " + type.toLowerCase() + " channel previously named #" + name + ".";
        sendMessage(auditMessage, guild);
    }).catch(err => console.log(err));
});

//fix this
bot.on("channelPinsUpdate", function (channel, time, packet) {

});


//fix
bot.on("channelUpdate", function (oldChannel, newChannel) {
    newChannel.guild.fetchAuditLogs().then(log => {
        const entry = log.entries.first();
        channel.guild.fetchMember(entry.executor).then(executor => {
            auditMessage = executor.user.tag + " UPDATED a " + channel.type.toLowerCase() + " channel named " + channel + ".";
            sendMessage(auditMessage, channel.guild);
        }).catch(err => console.log(err));
    });
});

bot.on("voiceStateUpdate", function (oldGuildMember, newGuildMember, data) {




    newGuildMember.guild.fetchAuditLogs().then(log => {
        var message = "null";
        const entry = log.entries.first();

        fs.writeFile("./GuildAuditLogsEntryJSON.json", JSON.stringify(entry, null, "\t"), function (err) {
            console.log(err);
        })

        if (entry.executor == entry.target)
            return;


        if (oldGuildMember.channel && newGuildMember.channel) {
            if (oldGuildMember.channel == newGuildMember.channel) {
                if (oldGuildMember.serverDeaf && !newGuildMember.serverDeaf) {
                    message = entry.target.tag + " was server undeafened by " + entry.executor.tag + ".";
                    sendMessage(message, newGuildMember.guild);


                } else if (!oldGuildMember.serverDeaf && newGuildMember.serverDeaf) {
                    message = entry.target.tag + " was server deafened by " + entry.executor.tag + ".";
                    sendMessage(message, newGuildMember.guild);

                } else if (!oldGuildMember.serverMute && newGuildMember.serverMute) {
                    message = entry.target.tag + " was server muted by " + entry.executor.tag + ".";
                    sendMessage(message, newGuildMember.guild);

                } else if (oldGuildMember.serverMute && !newGuildMember.serverMute) {
                    message = entry.target.tag + " was server unmuted by " + entry.executor.tag + ".";
                    sendMessage(message, newGuildMember.guild);
                }

            } else {
                message = entry.target.tag + " was forcibly moved " + oldGuildMember.channel.type.toLowerCase() +
                    " channels from " + oldGuildMember.channel.toString() +
                    " to " + newGuildMember.channel.toString() + " by " + entry.executor.tag + ".";
                sendMessage(message, newGuildMember.guild);
            }

        }
    })



})



function sendMessage(message, guildOrChannel) {
    for (let [mappedGuild, mappedChannel] of settings.map) {
        if (guildOrChannel.guild) {
            if (guildOrChannel.guild == mappedGuild) {
                mappedChannel.send(message);
            }
        } else if (guildOrChannel == mappedGuild) {
            mappedChannel.send(message)

        }
    }
}

function loadJSON() {
    console.log("Loading servers onto the program...");
    //Load the file in sync so the configuration takes effect and we have no undefined errors.
    var stream = fs.readFileSync(settings.serverspath);
    if (!stream) {
        //Create file if one was already not made. 
        fs.createWriteStream(settings.serverspath)
    }
    //Parse the JSON file and read it here.
    var json = JSON.parse(stream);

    for (let i = 0; i < Object.keys(json.servers).length; i++) {
        //Place JSON raw data into a map.
        if (!bot.guilds.get(json.servers[i].guildID) || !bot.guilds.get(json.servers[i].guildID).channels.get(json.servers[i].channelID)) {
            console.log("There was an error reading the JSON object. Specifically in index: " + i);
            continue;
        }
        settings.map.set(bot.guilds.get(json.servers[i].guildID), bot.guilds.get(json.servers[i].guildID).channels.get(json.servers[i].channelID));
        console.log("Loaded guild: " + bot.guilds.get(json.servers[i].guildID).name + " on channel: " + bot.guilds.get(json.servers[i].guildID).channels.get(json.servers[i].channelID).name);
    }

    console.log("All guilds/channels are loaded!");
}

bot.login(settings.token);