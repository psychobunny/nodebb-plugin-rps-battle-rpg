(function(module) {
	"use strict";
	var db = module.parent.require('./database');

	// todo needs to be moved into lang files after figuring out a simple verb system so I don't have to write new descriptions for each spell.
	var RPG = {},
		spells = {
			"attack": [
				{
					"name": "Slam",
					"offend": "<span style='color: purple'>%1 slams %2 with a greataxe</span>",
					"defend": "%1 counters with a <span style='color: purple'>deadly slam of a greataxe</span> on %2's head!",
					"draw": "%1 and %2 lock their weapons in melee."
				}
			],
			"cast": [
				{
					"name": "Fireball",
					"offend": "%1 casts a <span style='color: red'>giant fireball</span> at %2",
					"defend": "%1 counters by <span style='color: red'>enflaming %2 from head to toe!</span>",
					"draw": "%1's fireball engulfs %2's fire attack, causing no harm to either caster."
				}
			],
			"stealth": [
				{
					"name": "Shoot Arrow",
					"offend": "<span style='color: blue'>%1 shoots an arrow at %2</span>",
					"defend": "%1 <span style='color: blue'>enters stealth and shoots an arrow</span> directly at the heart of %2!",
					"draw": "%1 entered stealth and so did %2..."
				}
			]
		}



	RPG.parse = function (chatData, callback) {
		var myUID = parseInt(chatData.myuid, 10),
			fromUID = parseInt(chatData.fromuid, 10),
			toUID = parseInt(chatData.toUserData.uid, 10),
			fromUsername = chatData.myUserData.username,
			toUsername = chatData.toUserData.username,
			fromLevel = 0, // later.
			toLevel = 0,
			fromMove = chatData.message.trim().slice(1);

		if (!chatData.isNew || fromMove !== 'attack' && fromMove !== 'stealth' && fromMove !== 'cast') {
			callback(false, chatData);
			return;
		}


		db.get('uid:' + fromUID + ':battles:' + toUID, function(err, toMove) {
			if (toMove === null) {
				// no active turn
				chatData.parsedMessage = "<i>" + fromUsername + " prepares an attack against " + toUsername + "</i>";
				db.set('uid:' + toUID + ':battles:' + myUID, fromMove);
			} else {
				if (fromMove === toMove) {
					var message = spells[fromMove][fromLevel]['draw'];
					chatData.parsedMessage = message.replace('%1', fromUsername).replace('%2', toUsername) + ' <b>Draw!</b>';
				} else {
					var youLose = fromMove === 'cast' && toMove === 'attack' || fromMove === 'attack' && toMove === 'stealth' || fromMove === 'stealth' && toMove === 'cast';

					var fromAbility = spells[fromMove][fromLevel][youLose ? 'offend' : 'defend'],
						toAbility = spells[toMove][toLevel][!youLose ? 'offend' : 'defend'],
						fromMessage = fromAbility.replace('%1', fromUsername).replace('%2', toUsername),
						toMessage = toAbility.replace('%1', toUsername).replace('%2', fromUsername);

					if (youLose) {
						chatData.parsedMessage = fromMessage + ', but ' + toMessage + ' <b>' + chatData.toUserData.username + ' wins!</b>';
					} else {
						chatData.parsedMessage = toMessage + ', but ' + fromMessage + ' <b>' + chatData.myUserData.username + ' wins!</b>';
					}
				}


				db.delete('uid:' + myUID + ':battles:' + toUID);
				db.delete('uid:' + toUID + ':battles:' + myUID);
			}

			callback(err, chatData);
		});
		

		
	};

	module.exports = RPG;
}(module));