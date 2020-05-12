class Talker {
	constructor(guildID) {
		this.talkerID = [];
		this.guildID = guildID;
	}
}

class LevelSystem {
	constructor(client, db, options) {
		this.client = client;
		this.db = db;
		this.talkedRecently = [];
		this.cooldown = options.cooldown||60;
		this.xpmin = options.xpmin||10;
		this.xpmax = options.xpmax||20;
		this.lvlupXp = options.lvlupXp||500;
		client.on('message', async msg => {
			if (msg.author.bot) return undefined;
			if (!this.talkedRecently.find(g => g.guildID === msg.guild.id)) {
				let talkerGuild = new Talker(msg.guild.id);
				this.talkedRecently.push(talkerGuild);
			}
			let talker = this.talkedRecently.find(g => g.guildID === msg.guild.id).talkerID;
			if (talker.every(id => id !== msg.author.id)) {
				this.talkedRecently.find(g => g.guildID === msg.guild.id).talkerID.push(msg.author.id);
				var xp = randomXP(this.xpmin, this.xpmax);
				var point = xp, level = 0;
				try {
					await this.db.run(`CREATE TABLE IF NOT EXISTS '${msg.guild.id}' (id VARCHAR(30) PRIMARY KEY, point INTEGER NULL, level INTEGER NULL)`);
					this.db.get(`SELECT * FROM '${msg.guild.id}' WHERE id = '${msg.author.id}'`, (err, row) => {
						if (err) return console.log(err);
						if (row) {
							point += row.point;
							level = (point >= this.lvlupXp) ? Math.floor(point/this.lvlupXp) : 0;
						}
						this.db.run(`INSERT INTO '${msg.guild.id}' (id, point, level) VALUES ('${msg.author.id}', ${point}, ${level}) ON CONFLICT(id) DO UPDATE SET point = ${point}, level = ${level}`);
					});
				} catch (error) {
					return console.log(error);
				}
				setTimeout(() => {
					this.talkedRecently.find(g => g.guildID === msg.guild.id).talkerID = this.talkedRecently.find(g => g.guildID === msg.guild.id).talkerID.filter(id => id !== msg.author.id);
				}, 1000*this.cooldown)
			}
		});
	}
}

function randomXP(xpmin, xpmax) {
	return Math.floor(Math.random() * (xpmax - xpmin + 1)) + xpmin;
}

module.exports = LevelSystem;
