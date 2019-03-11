const Discord  = require("discord.js");
const client   = new Discord.Client();
const https    = require('https');

const config   = require("./config.json");

var cmd        = require('node-cmd');
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '', 
  database: 'tipbot', 
});
 
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  console.log('connected as id ' + connection.threadId);
});

const runningPlatform = process.platform
console.log(runningPlatform);

client.on('ready', () => {
    console.log("Servers:")
    client.guilds.forEach((guild) => {
        console.log(" - " + guild.name)

        guild.channels.forEach((channel) => {
            console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
        })
    })
});

client.on('message', (message) => {
    if(message.author.bot) return;
    
    if(message.content.indexOf(config.prefix) !== 0) return;
    
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const helpCommandData = `\`\`\`Use '+' as prefix for every command to initiate the bot

tip deposit <amnt>:: Deposit currency into your discord wallet  

tip balance:: Displays your current balance

rain:: Randomly awards currency to active people in the server

tip <amnt> to <user>:: Tip someone through the Discord Bot

tip withdraw <address>:: Allows you to withdraw currency to any compatible address you want - Be sure to write your address correctly, otherwise you'll lose your funds!

help:: Returns the help page.

rules:: Get all the rules of a server

netstats: :  Display current network stats

mnstats <address>: :  Display masternode stats of the given address

mynode reg <address>: :   Register your masternode address for personal notification upon downtime

mynode: :  Get DM about your master node stats

mynode rm <address>: : Remove your registered masternnode address from discord server\`\`\``;

    if(command === 'ping')
    {
        message.channel.send('Pong')
    }

    else if(command === 'help')
    {
        message.channel.send(helpCommandData);
    }


    else if(command === 'tip' && args[0] === 'myaddress')
    {
        connection.query('SELECT * FROM deposits where discord_id = ?', [message.author.id], function(error, result, fields){
            message.channel.send(`<@${message.author.id}>, your address is - ${result[0].wallet_address}`);
        });
    }


    else if(command === 'tip' && args[0] === 'deposit')
    {
        var depositAmount = parseFloat(args[1]);
        if(isNaN(depositAmount))
        {
            return;
        }
        var newUser = {
            discord_id: message.author.id.toString(), 
            balance: 0,
        };
        connection.query('INSERT IGNORE INTO users SET ?', newUser, function(error1, result1, fields1){
            getNewAddress(message.author.id, function(walletAddress){
                var newDeposit = {
                    discord_id: message.author.id.toString(), 
                    wallet_address: walletAddress, 
                    anticipated_amount: depositAmount, 
                    deposit: 0, 
                    timestamp: Date.now(), 
                };
                connection.query('INSERT INTO deposits SET ?', newDeposit, function (error2, result2, fields2){
                    if (error2) throw error2;
                    message.channel.send(`${message.author.toString()}, Please deposit exactly ${args[1]} TWINS to ${walletAddress} within 60 minutes. Please deposit EXACTLY ${args[1]} TWINS otherwise your deposit will be invalid, and you will lose your coins!`);
                    message.channel.send(`${message.author.toString()}, Please wait 1-5 minutes after your deposit for your balance to update`);
                });
            });
        });        
    }



    else if(command === 'tip' && args[1] === 'to')
    {
        connection.query('SELECT * FROM users WHERE discord_id = ?', [message.author.id.toString()], function(error, result, field){
            if(!error && result && result.length >= 0)
            {
                var tipAmount = parseFloat(args[0]);
                if(tipAmount > result[0].balance)
                {
                    message.channel.send('Sorry!, You don\'t have enough balance to fund this!')
                    return;
                }

                var newUser = {
                    discord_id: args[2].substr(2, 18), 
                    balance: tipAmount
                };

                var newTip = {
                    sender: message.author.id.toString(), 
                    receiver: newUser.discord_id, 
                    amount: tipAmount, 
                    timestamp: Date.now()
                };

                connection.query('INSERT INTO tips SET ?', [newTip], function(tipError, tipResult, tipFields){
                    if(tipError) return;
                    connection.query('INSERT INTO users SET ? ON DUPLICATE KEY UPDATE balance = balance + ?', [newUser, tipAmount], function(error1, result1, field1){
                        if(error1) return;
                        connection.query('UPDATE users SET balance = balance - ? WHERE discord_id = ?', [tipAmount, newTip.sender], function(error2, result2, field2){
                            if(error2) return;
                            message.channel.send(`Hurrah...! <@${newUser.discord_id}> you have recieved ${tipAmount} twins from <@${message.author.id}>.  The balance can be withdrawn using "+tip withdraw <address>". You can check your balance using "+tip balance"`)
                        });
                    });
                });
            }
        });
    }


    else if(command === 'tip' && args[0] === 'balance')
    {
        message.channel.send('Your balance has been sent to you');
        connection.query('SELECT balance FROM users where discord_id = ?', [message.author.id], function(error, result, fields){
            message.author.send(`Your current balance: ${result[0].balance} TWINS`)
        });
    }


    else if(command === 'tip' && args[0] === 'withdraw')
    {
        var requestedAmount = parseFloat(args[1]);
        connection.query('SELECT * FROM users where discord_id ?', [message.author.id.toString()], function(error, result, fields){
            if(result && result[0].balance >= requestedAmount)
            {
                withdrawFund(requestedAmount, function(status){
                    if(status.status === 'success')
                    {
                        message.channel.send(`Your funds has been successfully withdrawn from your Discord wallet`);
                    }
                });
            }
            else
            {
                message.channel.send(`Sorry!, There is no funds left in your discord balance to withdraw.`);
            }
        });
    }


    else if(command === 'mnstats')
    {
        mnstats(args[0], function(stats){
            if(stats.err)
            {
                message.channel.send(stats.err);
            }
            else
            {
                var lastSeen = new Date(stats.lastseen * 1000), lastpaid = new Date(stats.lastpaid * 1000);

                lastSeen = lastSeen.getDate() + '/' + (lastSeen.getMonth() + 1) + '/' + lastSeen.getFullYear();
                lastpaid = lastpaid.getDate() + '/' + (lastpaid.getMonth() + 1) + '/' + lastpaid.getFullYear();

                stats = `\`\`\`
Status: ${stats.status} 
Address: ${stats.addr} 
version: ${stats.version} 
Lastseen: ${lastSeen} 
IP Address: ${stats.ipaddr} 
Active time: ${(stats.activetime/1000/60).toFixed(2)} hrs 
Last paid: ${lastpaid} 
                \`\`\``;

                message.channel.send(stats);
            }
        })
    }
});

client.login(config.token);

setInterval(function(){
    connection.query('SELECT * FROM deposits WHERE deposit = ?', [0],function(error, result, fields){
        for(var i = 0; i < result.length; i++)
        {
            var curDeposit = result[i];
            getRequest(`https://explorer.win.win/ext/getaddress/${result[i].wallet_address}`, function(data){
                data = JSON.parse(data);
                if(data.error && data.error === 'address not found.')
                {

                }
                else
                {
                    connection.query('UPDATE deposits SET deposit = ? WHERE wallet_address = ? ', [data.received, curDeposit.wallet_address], function(error2, result2, fields2){
                        connection.query(`UPDATE users SET balance = balance + ${data.received} WHERE discord_id = ?`, [curDeposit.discord_id], function(error3, result3, fields3){
                        });
                    });
                }
            });
        }
    });
    
}, 5000)

function getNewAddress(userid, callback)
{
    cmd.get(
        `cd twins/Twins-windows/daemon && twins-cli getnewaddress ${userid}`,
        function(err, data, stderr){
            callback(data);
        }
    );
}

function withdrawFund(amount, callback) 
{
    callback({
        status: 'success', 
    });
}

function mnstats(addr, callback){
    getRequest('https://explorer.win.win/api/listmasternodes', function(data) {
        data = data.replace(/([A-Za-z0-9_]+): /g, `"$1": `);
        data = JSON.parse(data);
        for(var i = 0; i < data.length; i++)
        {
            if(data[i].addr === addr)
            {
                callback(data[i]);
                return;
            }
        }
        callback({
            err: "unknown address"
        });
    })
};

function getRequest(URL, callback)
{
    https.get(URL, (resp) => {
        let data = '';

        resp.on('data', (chunck) => {
            data += chunck;
        });

        resp.on('end', () => {
            callback(data);
        });
    }).on('error', (err) => {
        console.log(err);
    })
}