const Discord   = require("discord.js");
const client    = new Discord.Client();
const https     = require('https');

const config    = require('./config.json');
const constants = require('./constants.json');

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '', 
    database: 'tipbot', 
    multipleStatements: true
});

var RpcClient = require('bitcoind-rpc');

var RpcConfig = {
    protocol: 'http',
    user: 'twins',
    pass: 'hailtwins',
    host: '127.0.0.1',
    port: '37817',
};

var rpc = new RpcClient(RpcConfig);
 
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

tip <amnt> to <user>:: Tip someone through the Discord Bot

tip withdraw <address>:: Allows you to withdraw currency to any compatible address you want - Be sure to write your address correctly, otherwise you'll lose your funds!(current withdraw fees 0.01 TWINS)

help:: Returns the help page.

netstats:: Display current network stats

mnstats <address>:: Display masternode stats of the given address

mynode reg <address>:: Register your masternode address for personal notification upon downtime

mynode:: Get DM about your master node stats

mynode rm <address>:: Remove your registered masternnode address from discord server\`\`\``;

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
        connection.query('SELECT * FROM deposits where discord_id = ? AND deposit = 0 order by timestamp desc', [message.author.id], function(error, result, fields){
            if(error)
            {
                message.channel.send(constants.UNKNOWN_ERROR);
            }
            else if(result == undefined || result.size < 1)
            {
                message.channel.send('You do not have any pending deposits');
            }
            else
            {
                message.channel.send(`<@${message.author.id}>, your address is - ${result[0].wallet_address}`);
            }
        });
    }


    else if(command === 'tip' && args[0] === 'deposit')
    {
        var depositAmount = parseFloat(args[1]);

        connection.query('SELECT * FROM deposits WHERE discord_id = ? AND deposit = 0', [message.author.id], function(error, result, fields) {
            if(error)
            {
                message.channel.send(constants.UNKNOWN_ERROR);
                return;
            }
            if(result && result.length > 0)
            {
                message.channel.send('You already have a pending deposit request. Complete that to request another deposit address.');
            }
            else
            {
                if(isNaN(depositAmount) || depositAmount <= 0)
                {
                    message.channel.send('Please enter a valid deposit amount');
                    return;
                }
                var newUser = {
                    discord_id: message.author.id.toString(), 
                    balance: 0,
                };
                connection.beginTransaction(function(err) {
                    if(err) { throw err; }
                    connection.query('INSERT IGNORE INTO users SET ?', newUser, function(error){
                        if( error )
                        {
                            message.channel.send(constants.UNKNOWN_ERROR);
                            return connection.rollback(function() {
                                throw error;
                            });
                        }
                        getNewAddress(function(ret){
                            if(ret.err)
                            {
                                message.channel.send(constants.UNKNOWN_ERROR);
                            }
                            else
                            {
                                var walletAddress = ret.result;
                                var newDeposit = {
                                    discord_id: message.author.id.toString(), 
                                    wallet_address: walletAddress, 
                                    anticipated_amount: depositAmount, 
                                    deposit: 0, 
                                    timestamp: Date.now(), 
                                };

                                connection.query('INSERT INTO deposits SET ?', newDeposit, function (error2){
                                    if ( error2 )
                                    {
                                        message.channel.send(constants.UNKNOWN_ERROR);
                                        return connection.rollback(function() {
                                            throw error2;
                                        });
                                    }
                                    connection.commit(function(err) {
                                        if(err) {
                                            message.channel.send(constants.UNKNOWN_ERROR);
                                            return connection.rollback(function() {
                                                throw err;
                                            });
                                        }
                                    })
                                    message.channel.send(`${message.author.toString()}, Please deposit exactly ${args[1]} TWINS to ${walletAddress} within 20 minutes. Please deposit EXACTLY ${args[1]} TWINS otherwise your deposit will be invalid, and you will lose your coins!`);
                                    message.channel.send(`${message.author.toString()}, Please wait 1-5 minutes after your deposit for your balance to update`);
                                });
                            }
                        });
                    }); 
                });
            }
        });
    }


    else if(command === 'tip' && args[1] === 'to')
    {
        connection.query('SELECT * FROM users WHERE discord_id = ?', [message.author.id.toString()], function(error, result, field){
            if(message.mentions && message.mentions.users && message.mentions.users.length > 0)
            {
                if(!error && result && result.length > 0)
                {
                    var tipAmount = parseFloat(args[0]);
                    if(isNaN(tipAmount) || tipAmount > result[0].balance)
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
    
                    connection.beginTransaction(function(err) {
                        if (err) { throw err; }
                        connection.query(
                            'INSERT INTO tips SET ?; INSERT INTO users SET ? ON DUPLICATE KEY UPDATE balance = balance + ?; UPDATE users SET balance = balance - ? WHERE discord_id = ?;', 
                            [newTip, newUser, tipAmount, tipAmount, newTip.sender], 
                            function(error, result, fields) {
                                if(error) 
                                {
                                    message.channel.send(constants.UNKNOWN_ERROR);
                                    return connection.rollback(function() {
                                        throw error;
                                    });
                                }
                                connection.commit(function(err) {
                                    if(err)
                                    {
                                        message.channel.send(constants.UNKNOWN_ERROR);
                                        return connection.rollback(function() {
                                            throw err;
                                        });
                                    }
                                    message.channel.send(`Hurrah...! <@${newUser.discord_id}> you have recieved ${tipAmount} twins from <@${message.author.id}>.  The balance can be withdrawn using "+tip withdraw <address>". You can check your balance using "+tip balance"`);
                                });
                            }
                        );
                    });
                }
                else
                {
                    message.channel.send(constants.UNKNOWN_ERROR);
                }
            }
            else
            {
                message.channel.send(constants.MENTIONED_USERNAME_UNKNOWN)
            }
        });
    }


    else if(command === 'tip' && args[0] === 'balance')
    {
        connection.query('SELECT balance FROM users where discord_id = ?', [message.author.id], function(error, result, fields){
            if(typeof result != undefined && result.length > 0)
            {
                message.channel.send('Your balance has been sent to you');
                message.author.send(`Your current balance: ${result[0].balance} TWINS`);
            }
            else
            {
                message.channel.send('You must deposit or receive a tip to have a balance');
            } 
        });
    }


    else if(command === 'tip' && args[0] === 'withdraw')
    {
        connection.beginTransaction(function(err) {
            if(err) { throw err; }
            connection.query('SELECT * FROM users where discord_id = ?', [message.author.id.toString()], function(error, result, fields){
                if(typeof result != undefined && result.length > 0)
                {
                    var newWithdraw = {
                        discord_id: message.author.id.toString(), 
                        amount: result[0].balance, 
                        timestamp: Date.now()
                    }
                    
                    if(result[0].balance > 0) 
                    {
                        var amountToSend = result[0].balance - constants.withdraw_fees;
                        if(amountToSend > 0)
                        {
                            connection.query('UPDATE users set balance = 0 where discord_id = ?', [message.author.id.toString()], function(error1, result1, fields1){
                                if ( error1 )
                                {
                                    message.channel.send(constants.UNKNOWN_ERROR);
                                    return connection.rollback(function() {
                                        throw error1;
                                    });
                                }
                                if(!error1)
                                {
                                    connection.query('INSERT INTO withdraw SET ?', [newWithdraw], function(error2, result2, fields2){
                                        if ( error2 )
                                        {
                                            message.channel.send(constants.UNKNOWN_ERROR);
                                            return connection.rollback(function() {
                                                throw error2;
                                            });
                                        }
                                        if(!error2)
                                        {
                                            withdrawFund(amountToSend, args[1], function(status){
                                                console.log(status);
                                                if(status.err)
                                                {
                                                    return connection.rollback(function() {
                                                        message.channel.send(constants.UNKNOWN_ERROR);

                                                    });
                                                }
                                                else
                                                {
                                                    connection.commit(function(err) {
                                                        if(err) {
                                                            message.channel.send(constants.UNKNOWN_ERROR);
                                                            return connection.rollback(function() {
                                                                throw err;
                                                            });
                                                        }
                                                        message.channel.send(`Your funds has been successfully withdrawn from your Discord wallet`);
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            }); 
                        }
                        else
                        {
                            message.channel.send('Your balance is too low to withdraw')
                        }
                    }
                    else
                    {
                        message.channel.send(`Sorry!, There is no funds left in your discord balance to withdraw.`);
                    }
                }
                else
                {
                    message.channel.send(`Sorry!, There is no funds left in your discord balance to withdraw.`);
                }
            });
        });
        
    }


    else if(command === 'mnstats')
    {
        mnstats([{addr: args[0]}], function(stats){
            if(stats.length == 0)
            {
                message.channel.send('Unknown address');
            }
            else
            {
                message.channel.send(mnstatsMessage(stats[0]));
            }
        });
    }


    else if(command == 'netstats')
    {
        connection.query('SELECT * FROM net_stats', function(error, result, fields) {
            netstats = result[0]
            message.channel.send(`\`\`\`
Difficulty: ${netstats.difficulty} 
Masternodes Count: ${netstats.masternodecount} 
Block Count: ${netstats.blockcount} 
NetworK Hash: ${(netstats.networkhashps / Math.pow(1000, 3)).toFixed(4)} GH/s
Active wallets count: ${netstats.activewalletscount} 
Supply: ${netstats.moneysupply} TWINS
                            \`\`\``);
        });
    }


    else if(command === 'mynode')
    {
        if(args[0] === 'reg')
        {
            mnstats([{addr: args[1]}], function(stats) {
                if(stats.length == 0)
                {
                    message.channel.send('It seems like your Masternode is offline(turn it on and try again) or the address is invalid. ');
                }
                else
                {
                    stats = {
                        rank: stats[0].rank,
                        network: stats[0].network, 
                        status: stats[0].status,
                        addr: stats[0].addr,
                        version: stats[0].version,
                        lastseen: stats[0].lastseen,
                        ipaddr: stats[0].ipaddr,
                        activetime: stats[0].activetime,
                        lastpaid: stats[0].lastpaid,
                        discord_id: message.author.id.toString()
                    };
                
                    connection.query('INSERT IGNORE INTO registered_mns SET ?', [stats], function(error, result, fields) {
                        message.channel.send('Your Masternode has been registered successfully for discord notifications');
                    });
                }
            });
        }

        else if(args[0] === 'rm')
        {
            connection.query('DELETE FROM registered_mns WHERE discord_id = ? AND addr = ?', [message.author.id.toString(), args[1]], function(error, result, fields) {
                if(!error && result && result.affectedRows > 0)
                {
                    message.channel.send('The requested Masternode has been removed and you will not receive any personal notifications. ');
                }
                else if(error)
                {
                    message.channel.send('Unexpected error occured. Please try again later');
                }
                else
                {
                    message.channel.send('It seems like something is not right with your request. ');
                }
            });
        }

        else if(args.length == 0)
        {
            connection.query('SELECT * FROM registered_mns WHERE discord_id = ?', [message.author.id.toString()], function(error, result, fields) {
                if(!error && result.length > 0)
                {
                    mnstats(result, function(stats) {
                        if(stats.length == 0)
                        {

                        }

                        message.channel.send('Your MN vitals have been sent to you');

                        var statsToPutInDB = [];
                        
                        for(var i = 0; i < stats.length; i++)
                        {
                            
                            statsToPutInDB.push({
                                rank: stats[i].rank,
                                network: stats[i].network, 
                                status: stats[i].status,
                                addr: stats[i].addr,
                                version: stats[i].version,
                                lastseen: stats[i].lastseen,
                                ipaddr: stats[i].ipaddr,
                                activetime: stats[i].activetime,
                                lastpaid: stats[i].lastpaid,
                                discord_id: message.author.id.toString()
                            });

                            message.author.send(mnstatsMessage(statsToPutInDB[i]));

                            connection.query('UPDATE registered_mns SET ? WHERE discord_id = ?', [statsToPutInDB[i], statsToPutInDB[i].discord_id], function(error, result, fields) {

                            });
                        }
                    });
                }
            });
        } 
    } 
});

client.login(config.token);

netstats();

setInterval(function(){
    connection.query('SELECT * FROM deposits WHERE deposit = ?', [0],function(error, result, fields){
        for(var i = 0; i < result.length; i++)
        {
            var curDeposit = result[i];
            rpc.getReceivedByAddress(result[i].wallet_address, 1, function(err, ret) {
                if(err) { throw err };
                if(curDeposit.anticipated_amount === ret.result)
                {
                    connection.query('UPDATE deposits SET deposit = ? WHERE wallet_address = ? ', [ret.result, curDeposit.wallet_address], function(error2, result2, fields2){
                        connection.query(`UPDATE users SET balance = balance + ${ret.result} WHERE discord_id = ?`, [curDeposit.discord_id], function(error3, result3, fields3){
                        });
                    });
                }
            });
        }
    });
    
}, 5000)

setInterval(function() {
    var addrs = [];
    getRequest('https://explorer.win.win/api/listmasternodes', 0, function(data, key) {
        if(data) 
        {
            try {
                data = JSON.parse(data);
            } catch (err) {

                return err;
            }
            for(var i = 0; i < data.length; i++)
            {
                addrs.push(data[i].addr);
            }

            connection.query('SELECT * FROM registered_mns WHERE addr NOT IN (?) AND notified = 0', [addrs], function(error, result, fields) {
                for(var i = 0; i < result.length; i++)
                {
                    client.users.get(result[i].discord_id).send('Your MN went offline just a while ago!!')
                }
                connection.query('UPDATE registered_mns SET is_online = 0, notified = 1 WHERE addr NOT IN (?) AND notified = 0', [addrs], function(error1, result1, fields1) {

                });
            });

            connection.query('UPDATE registered_mns SET is_online = 1, notified = 0 WHERE addr IN (?) AND is_online = 0', [addrs], function(error, result, fields) {

            });
        } 
    });
}, 5000);

setInterval(function() {
    connection.query(`DELETE FROM deposits WHERE deposit = 0 AND timestamp <= ${Date.now() - constants.deposit_time_limit}`, [], function(err, res, fields) {

    })
}, 60000)

function mnstatsMessage(stats)
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

    return stats;
}

function getNewAddress(callback)
{
    rpc.getnewaddress(function (err, ret) {
        err ? callback({err: 1, result: err}) : callback({err: 0, result: ret.result});
    });
}

function withdrawFund(amount, sendToAddress, callback) 
{
    rpc.sendToAddress(sendToAddress, amount, '', '', function(err, ret) {
        err ? callback({err: 1, result: err}) : callback({err: 0, result: ret});
    });
}

function netstats()
{
    var urls = {
        difficulty: "https://explorer.win.win/api/getdifficulty", 
        masternodecount: "https://explorer.win.win/api/getmasternodecount", 
        blockcount: "https://explorer.win.win/api/getblockcount", 
        networkhashps: "https://explorer.win.win/api/getnetworkhashps", 
        activewalletscount: "https://explorer.win.win/ext/getactivewalletscount", 
        moneysupply: "https://explorer.win.win/ext/getmoneysupply", 
    };

    var netstats = {
        difficulty: "", 
        masternodecount: "",  
        blockcount: "", 
        networkhashps: "",  
        activewalletscount: "", 
        moneysupply: "", 
    };
    var completed_requests = 0;

    for(var key in urls)
    {
        getRequest(urls[key], key, function(data, key_name) {

            completed_requests++;

            if(key_name === 'blockcount' || key_name === 'networkhashps')
            {
                netstats[key_name] = parseInt(data);
            }
            else if(key_name === 'difficulty' || key_name === 'moneysupply')
            {
                netstats[key_name] = parseFloat(data);
            }
            else
            {
                data = JSON.parse(data);
                if(key_name === 'activewalletscount')
                {
                    netstats[key_name] = data.active_wallets_count;
                }
                else
                {
                    netstats[key_name] = data.total;
                }
            }
            
            if(completed_requests == 6)
            {
                connection.query('UPDATE net_stats SET ?', [netstats], function(error, result, fields) {
                });
            }
        });
    }
}

function mnstats(addresses, callback){
    getRequest('https://explorer.win.win/api/listmasternodes', 0, function(data, key = 0) {

        /* data = data.replace(/([A-Za-z0-9_]+): /g, `"$1": `);  */ // Handy when the JSON.parse throws an error

        data = JSON.parse(data);

        var stats = [];

        for(var i = 0; i < addresses.length; i++)
        {
            for(var j = 0; j < data.length; j++)
            {
                if(addresses[i].addr == data[j].addr)
                {
                    stats.push(data[j]);
                    if(stats.length == addresses.length)
                    {
                        callback(stats);
                        return;
                    }
                }
            }
        }
        callback(stats);
    })
};

function getRequest(URL, key = 0, callback)
{
    https.get(URL, (resp) => {
        let data = '';

        resp.on('data', (chunck) => {
            data += chunck;
        });

        resp.on('end', () => {
            callback(data, key);
        });
    }).on('error', (err) => {

    })
}