const { ok } = require('assert');
const Discord = require('discord.js');
var moment = require('moment');
var moment = require('moment-timezone');
moment.locale("fr-FR")
let state = {
    bda:"",
    bdc:"",
    bds:"",
    pole_com:""
};
let lastState = {};
let roles = { //roles id
    bda: "779030237744463872",
    bdc: "555291106179284993",
    bds: "555290729350692865",
    pole_com: "555288913753931796"
};
const client = new Discord.Client();
const { prefix, token } = require('./config.json');
let guild = client.guilds.cache.get('788453466048561203' +
    '788453466048561203'); //server id

function log(texttolog) {
    let date = new Date();
    let timestamp = moment.tz("Europe/Paris").locale("fr-FR").format("DD/MM/YYYY HH:mm");
    console.log(timestamp + ' [LOG] ' + texttolog);
    let fs = require('fs');
    try {
        fs.appendFileSync('./logs.txt', '\n' + timestamp + ' [LOG] ' + texttolog, 'utf8');
    } catch (err) {
        console.error(err)
    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

/*
    *=========================================================================
    *
    *=========================================================================
 */

function setFutureReunion(bureau, momentDateandTimeObject, force) {
    let fs = require('fs');
    if (getFutureReunion(bureau) == false) { //si aucune réunion n'est programmée
        try {
            let day = momentDateandTimeObject.date();
            let month = (momentDateandTimeObject.month() + 1);
            let year = momentDateandTimeObject.year();
            let hours = momentDateandTimeObject.hours();
            let minutes = momentDateandTimeObject.minutes();
            fs.writeFileSync('./bureaux/' + bureau.toLowerCase() + '.txt', day + '/' + month + '/' + year + ' ' + hours + ':' + minutes, 'utf8');
            return true;
        } catch (err) {
            log(err)
        }
    } else { //si une réunion est déjà programmée
        if (force) {
            try {
                let day = momentDateandTimeObject.date();
                let month = (momentDateandTimeObject.month() + 1);
                let year = momentDateandTimeObject.year();
                let hours = momentDateandTimeObject.hours();
                let minutes = momentDateandTimeObject.minutes();
                fs.writeFileSync('./bureaux/' + bureau.toLowerCase() + '.txt', day + '/' + month + '/' + year + ' ' + hours + ':' + minutes, 'utf8');
                return true;
            } catch (err) {
                log(err);
            }
        } else {
            return false;
        }
        return false;
    }
}

function resetReunion(bureau) {
    let fs = require('fs');
    try {
        fs.writeFileSync('./bureaux/' + bureau.toLowerCase() + '.txt', '', 'utf8');
        return true;
    } catch (err) {
        log(err)
    }
}

function getFutureReunion(bureau) {
    let fs = require('fs');
    try {
        return fs.readFileSync('./bureaux/' + bureau.toLowerCase() + '.txt', 'utf8');
    } catch (err) {
        log(err);
    }
}

function getFutureReunionInLetters(bureau) {
    if (getFutureReunion(bureau) != false) {
        date_and_time_str = getFutureReunion(bureau);
        let saved_reu_Object = moment.utc(date_and_time_str, "DD/MM/YYYY HH:mm");
        return saved_reu_Object.format('dddd') + ' ' + saved_reu_Object.date() + ' ' + saved_reu_Object.format('MMMM') + ' ' + saved_reu_Object.year() + ' à ' + saved_reu_Object.hours() + ':' + saved_reu_Object.minutes();
    }
}

function CheckReunion(bureau) {
    let momentsavedDateObject = moment(getFutureReunion(bureau), "DD/MM/YYYY HH:mm");
    let now = moment.tz("Europe/Paris");
    if (!momentsavedDateObject.isValid()) {
        //aucune réunion n'est programmé pour ce bureau
    } else {
        let minutes_of_difference = momentsavedDateObject.diff(now, 'minutes');
        if (minutes_of_difference < 10080 && minutes_of_difference > 1440) { //Il reste moins d'1 semaine
            state[bureau] = "moins d'une semaine";
        } else if (minutes_of_difference < 1440 && minutes_of_difference > 60) { //Il reste moins d'1 journée
            state[bureau] = "moins d'une journée";
        } else if (minutes_of_difference < 60 && minutes_of_difference > 5) { //Il reste moins d'1 heure
            state[bureau] = "moins d'une heure";
        } else if (minutes_of_difference < 5) { //Il reste moins de 5 minutes
            state[bureau] = "moins de 5 minutes";
            resetReunion(bureau);
        } else { //Il reste plus d'1 semaine
            state[bureau] = "plus d'une semaine";
        }
        if (state[bureau] != lastState[bureau]) {
            if(state[bureau]!="plus d'une semaine"){
                log('Réunion ' + bureau + ' dans ' + state[bureau]);
                let bureauIdForMention = roles[bureau];
                client.channels.cache.find(c => c.name === 'rappels_' + bureau.toLowerCase()).send('<@&' + bureauIdForMention + "> Il reste " + state[bureau] + " avant la prochaine réunion du " + bureau);
                lastState[bureau] = state[bureau];
            }
        }
    }
}

function testDate(str) {
    let Date = moment(str, "DD/MM/YYYY");
    if (Date.isValid()) {
        return true;
    } else {
        return false;
    }
}

function testTime(str) {
    var Time = moment(str, "HH:mm");
    if (Time.isValid()) {
        return true;
    } else {
        return false;
    }
}

client.once('ready', () => {
    log(`Logged in as ${client.user.tag}!`);
    log('READY !');
    client.user.setPresence({
        status: 'online',
        activity: {
            name: 'Les membres du BDE',
            type: 'LISTENING'
        }
    });
    CheckReunion('bda');
    CheckReunion('bdc');
    CheckReunion('bds');
    CheckReunion('pole_com');
    var interval = setInterval(function() {
        CheckReunion('bda');
        CheckReunion('bdc');
        CheckReunion('bds');
        CheckReunion('pole_com');
    }, 60 * 1000 /* S * mS */ );
});

client.login(token);

client.on('message', message => {
    if (message.author.bot || !message.content.includes(prefix)||message.channel.type == 'dm') return; //ignore les messages des bots et ceux qui n'inclut pas le préfixe
    const args = message.content.slice(prefix.length).trim().split(' ');
    const command = args.shift().toLowerCase();
    const nickname = message.guild.member(message.author).displayName;
    if (message.content.startsWith(prefix + 'reu')) { //la commande est !reu
        if (testDate(args[1])) { //si une bonne date est entrée
            if (testTime(args[2])) { //si une bonne heure est entrée
                if (args[0].toLowerCase() == 'bda' || args[0].toLowerCase() == 'bdc' || args[0].toLowerCase() == 'bds' || args[0].toLowerCase() == 'pole_com') {
                    let momentDateandTimeObject = moment.utc(args[1] + ' ' + args[2], "DD/MM/YYYY HH:mm");
                    if (setFutureReunion(args[0].toLowerCase(), momentDateandTimeObject, false) == true) { //La réunion a bien été enregistrée et aucune réunion n'était programmée
                        log('Réunion ' + args[0].toLowerCase() + ' enregistrée par ' + nickname + ' !');
                        let bureauIdForMention = roles[args[0].toLowerCase()];
                        client.channels.cache.find(c => c.name === 'rappels_' + args[0].toLowerCase()).send('Nouvelle réunion <@&' + bureauIdForMention + '> programmée pour le ' + momentDateandTimeObject.format('dddd') + ' ' + momentDateandTimeObject.date() + ' ' + momentDateandTimeObject.format('MMMM') + ' ' + momentDateandTimeObject.year() + ' à ' + momentDateandTimeObject.hours() + ':' + momentDateandTimeObject.minutes());
                    } else { //Une réunion était déjà programmée
                        if (args[3] == 'force') { //Si force
                            setFutureReunion(args[0].toLowerCase(), momentDateandTimeObject, true);
                            log('Réunion ' + args[0].toLowerCase() + ' enregistrée avec force par ' + nickname + ' !');
                            let bureauIdForMention = roles[args[0].toLowerCase()];
                            client.channels.cache.find(c => c.name === 'rappels_' + args[0].toLowerCase()).send('Nouvelle réunion <@&' + bureauIdForMention + '> programmée de force pour le ' + momentDateandTimeObject.format('dddd') + ' ' + momentDateandTimeObject.date() + ' ' + momentDateandTimeObject.format('MMMM') + ' ' + momentDateandTimeObject.year() + ' à ' + momentDateandTimeObject.hours() + ':' + momentDateandTimeObject.minutes());
                        } else {
                            message.reply("Une réunion est déjà programmée pour le " + args[0] + " !\nVeuillez réessayer !");
                        }
                    }
                } else {
                    message.reply("Ce bureau (" + args[0].toLowerCase() + ") n'existe pas !\nVeuillez réessayer !");
                    log("Mauvais nom de bureau rentré (" + args[0].toLowerCase() + ") par " + nickname + " !")
                }
            } else { //Si mauvaise heure entrée
                log("Mauvaise heure entrée : " + args[2] + ' par ' + nickname);
                message.reply("Mauvaise heure entrée : " + args[2] + "\nVeuillez réessayer s'il vous plait !");
            }
        } else { //Si mauvaise date entrée
            log("Mauvaise date entrée : " + args[1] + ' par ' + nickname);
            message.reply("Mauvaise date entrée : " + args[1] + "\nVeuillez réessayer s'il vous plait !");
        }
    } else //La commande n'est pas !reu
    if (message.content.startsWith(prefix + 'liste_reu')) { //Si la commande est !liste_reu
        if (args[0].toLowerCase() == 'bda' || args[0].toLowerCase() == 'bdc' || args[0].toLowerCase() == 'bds' || args[0].toLowerCase() == 'pole_com') {
            if (getFutureReunion(args[0].toLowerCase()) != false) { //Si une réunion est programmée
                message.reply('La prochaine réunion du ' + args[0].toLowerCase() + ' se déroulera le ' + getFutureReunionInLetters(args[0].toLowerCase()) + ' !');
            } else { //Si aucune réunion n'est programmée
                message.reply("Aucune réunion n'est prévu pour le " + args[0].toLowerCase() + " pour le moment !");
            }
        } else {
            message.reply("Ce bureau (" + args[0].toLowerCase() + ") n'existe pas !\nVeuillez réessayer !");
            log("Mauvais nom de bureau rentré (" + args[0].toLowerCase() + ") par " + nickname + " !")
        }
    } else //la commande n'est pas !liste_reu
    if (message.content.startsWith(prefix + 'reset')) { //la commande est !reset
        if (args[0].toLowerCase() == 'bda' || args[0].toLowerCase() == 'bdc' || args[0].toLowerCase() == 'bds' || args[0].toLowerCase() == 'pole_com') {
            resetReunion(args[0].toLowerCase());
            message.reply("J'ai retiré la prochaine réunion du " + args[0].toLowerCase() + " !");
            log("La réunion du " + args[0].toLowerCase() + " a été supprimée manuellement par " + nickname + " !")
        } else if (args[0].toLowerCase() == 'all') {
            resetReunion('bda');
            resetReunion('bdc');
            resetReunion('bds');
            resetReunion('pole_com');
            message.reply("J'ai retiré les prochaines réunions de tout les bureaux !");
            log("Les réunions de tout les bureaux ont été supprimées manuellement par " + nickname + " !")
        } else {
            message.reply("Ce bureau (" + args[0].toLowerCase() + ") n'existe pas !\nVeuillez réessayer !");
            log("Mauvais nom de bureau rentré (" + args[0].toLowerCase() + ") par " + nickname + " !")
        }
    }else //la commande n'est pas !reset
    if (message.content.startsWith(prefix + 'help')) { //la commande est !help
        let help1 = "\n__**Pour programmer une réunion**__ faire \n\`\`\`yaml\n !reu <nom bu bureau> JJ/MM/AAAA hh:mm <force>\n\`\`\` ou \n\`\`\`yaml\n !reunion <nom bu bureau> JJ/MM/AAAA hh:mm <force>\n\`\`\` avec \n\`\`\`yaml\n <nom du bureau>\n\`\`\` étant soit \"bda\" soit \"bdc\" soit \"bds\" soit \"pole_com\" et \n\`\`\`yaml\n JJ/MM/AAAA\n\`\`\` étant la date de la réunion, par exemple pour le 5 novembre 2040, écrire \"05/11/2040\" et \n\`\`\`yaml\n hh:mm\n\`\`\` étant l'heure de la réunion, par exemple pour 12:00, écrire \"12:00\" et \n\`\`\`yaml\n <force>\n\`\`\` est une option permettant de mettre à jour une réunion déjà existante, par exemple si une réunion est définie pour le bda par erreur à 23:48 au lieu de 12:00 ou un mauvais jour, par exemple le 25/12/2020 au lieu du 12/01/2021, il suffit de rajouter \"force\" après la nouvelle commande pour modifier la réunion, dans cet exemple cela donnera \n\`\`\`yaml\n !reu bda 12/01/2020 12:00 force \n\`\`\` cela modifiera la date et l'heure par la nouvelle date et la nouvelle heure mais cela ne changera pas le bureau, si c'est le bureau qui n'est pas correct, il faudra d'abord supprimer la réunion du bureau à qui n'était pas destinée la réunion en faisant \n\`\`\`yaml\n !reset <nom du bureau>\n\`\`\` puis créer ou forcer une mise à jour de la réunion du bon bureau";
        let help2 = "\n__**Pour connaitre la date et l'heure de la prochaine réunion**__ faire \n\`\`\`yaml\n !liste_reu <nom du bureau>\n\`\`\` ou \n\`\`\`yaml\n !liste_reunion <nom du bureau>\n\`\`\` et cela renverra la date et l'heure de la prochaine réunion du bureau concerné";
        let help3 = "\n__**Pour retirer la prochaine réunion du bureau**__ faire \n\`\`\`yaml\n !reset <nom du bureau>\n\`\`\` ou \n\`\`\`yaml\n !reset all\n\`\`\` pour retirer les réunions de tout les bureaux d'un seul coup";
        let helpmessage = help1 + help2 + help3;
        message.reply("Voici la page d'aide !"+helpmessage);
    }
});

client.on('message', message => {
    if(!message.author.bot && message.channel.type == 'dm' && !message.content.startsWith(prefix + 'help')){
        message.reply("Je ne réponds pas aux messages privés, je ne réponds que sur le serveur discord du BDE... :wink:");
    }else if (message.content.startsWith(prefix + 'help')) { //la commande est !help
        let help1 = "\n__**Pour programmer une réunion**__ faire \n\`\`\`yaml\n !reu <nom bu bureau> JJ/MM/AAAA hh:mm <force>\n\`\`\` ou \n\`\`\`yaml\n !reunion <nom bu bureau> JJ/MM/AAAA hh:mm <force>\n\`\`\` avec \n\`\`\`yaml\n <nom du bureau>\n\`\`\` étant soit \"bda\" soit \"bdc\" soit \"bds\" soit \"pole_com\" et \n\`\`\`yaml\n JJ/MM/AAAA\n\`\`\` étant la date de la réunion, par exemple pour le 5 novembre 2040, écrire \"05/11/2040\" et \n\`\`\`yaml\n hh:mm\n\`\`\` étant l'heure de la réunion, par exemple pour 12:00, écrire \"12:00\" et \n\`\`\`yaml\n <force>\n\`\`\` est une option permettant de mettre à jour une réunion déjà existante, par exemple si une réunion est définie pour le bda par erreur à 23:48 au lieu de 12:00 ou un mauvais jour, par exemple le 25/12/2020 au lieu du 12/01/2021, il suffit de rajouter \"force\" après la nouvelle commande pour modifier la réunion, dans cet exemple cela donnera \n\`\`\`yaml\n !reu bda 12/01/2020 12:00 force \n\`\`\` cela modifiera la date et l'heure par la nouvelle date et la nouvelle heure mais cela ne changera pas le bureau, si c'est le bureau qui n'est pas correct, il faudra d'abord supprimer la réunion du bureau à qui n'était pas destinée la réunion en faisant \n\`\`\`yaml\n !reset <nom du bureau>\n\`\`\` puis créer ou forcer une mise à jour de la réunion du bon bureau";
        let help2 = "\n__**Pour connaitre la date et l'heure de la prochaine réunion**__ faire \n\`\`\`yaml\n !liste_reu <nom du bureau>\n\`\`\` ou \n\`\`\`yaml\n !liste_reunion <nom du bureau>\n\`\`\` et cela renverra la date et l'heure de la prochaine réunion du bureau concerné";
        let help3 = "\n__**Pour retirer la prochaine réunion du bureau**__ faire \n\`\`\`yaml\n !reset <nom du bureau>\n\`\`\` ou \n\`\`\`yaml\n !reset all\n\`\`\` pour retirer les réunions de tout les bureaux d'un seul coup";
        let helpmessage = help1 + help2 + help3;
        message.reply("Voici la page d'aide !"+helpmessage);
    }
});