# TWINS-Tip
TWINS Cryptocurrency Discord Tipping and MN Stats Bot

<h2>Requirements</h2>
<ul>
	<li>Windows or linux with MYSQL server and nodejs installed.</li>
	<li>TWINS Daemon "twinsd" must be running.</li>
</ul>

<h2>Installation Instructions</h2>
<ul>
	<li>Do an npm install.</li>
	<li>Import the "tipbot.sql" file from the db folder.</li>
	<li>Create a bot and enter the bot token in the config.json file.</li>
	<li>At 438th and 448th line in the index.js file change the path that locates to "twins-cli" based on which location your twins/daemon folder is located.</li>
	<li>Run the index.js file.</li>
</ul>

<h2>Tipping Bot features:</h2>
<ul>
			<li>+tip deposit (amnt)::  Deposit TWINS into your discord wallet</li> 
			<li>+tip balance::  Displays your current balance</li>
			<li>+tip (amnt) to (@user)::  Tip someone through the Discord Bot</li>
			<li>+tip withdraw::  Allows you to withdraw currency to any compatible address you want - Be sure to write your address correctly, 				otherwise you'll lose your funds</li>
</ul>

<h2>Masternode Monitoring:</h2>
<ul>
			<li>+mnstats (address):: Display masternode stats of the given address</li>
			<li>+netstats::  Display current network stats</li>
			<li>+mynode reg (address):: Register your masternode address for personal notification upon downtime</li>
			<li>+mynode:: Get DM about your master node stats</li>
			<li>+mynode rm (address):: Remove your registered masternnode address from discord server</li>
</ul>

<p>And many more features to be implemented...</p>

<h3>Information</h3>
<ul>
	<li>Deposit time limit and withdraw fees can be modified by changing the values in the constant.json file.</li>
</ul>

<h1>Screenshots:</h1>

<img src = "https://res.cloudinary.com/dfvhjjpj1/image/upload/v1552330031/WhatsApp_Image_2019-03-12_at_00.10.00.jpg">
<br>
<img src = "https://res.cloudinary.com/dfvhjjpj1/image/upload/v1552330366/WhatsApp_Image_2019-03-12_at_00.22.25.jpg">
<br>
<img src = "https://res.cloudinary.com/dfvhjjpj1/image/upload/v1552330030/WhatsApp_Image_2019-03-12_at_00.12.42.jpg">
<br>
<img src = "https://res.cloudinary.com/dfvhjjpj1/image/upload/v1552330030/WhatsApp_Image_2019-03-12_at_00.15.06.jpg">
<br>
<img src = "https://res.cloudinary.com/dfvhjjpj1/image/upload/v1552330102/WhatsApp_Image_2019-03-12_at_00.16.40.jpg">
<br>
<img src = "https://res.cloudinary.com/dfvhjjpj1/image/upload/v1552330345/Capture.png">
