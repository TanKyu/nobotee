/*-------------------------
nobotee
an in-browser plug.dj bot
written specifically for plug.dj/beats-2-45

@mxew
--------------------------*/

if (typeof(nobotee) == "undefined") {
	var nobotee = {
		firetrucks: {},
		media: null,
		dj: null,
		commands: {},
		theme: null,
		skiptime:false,
		defaults:{
			autovt:true,
			time_lmt:true,
			mode:"notifications",
			cmmds:true
		},
		started:false
	};
}

nobotee.version = "0.01.4";

// Redefine all nobotee functions, overwritting any code on reload..
nobotee.start = function() {
	console.log("nobotee version "+this.version+" starting..");
	nobotee.started = true;
	nobotee.storage.restore();
	nobotee.init();
};

nobotee.init = function(){
	console.log("nobotee init..");
	var self = this;
	self.ui.init();
	self.api.init();
};

nobotee.ui = {
	self: this,
	init: function() {
		 if (!$("#nobotee").length) {
			console.log("nobotee building ui..");
			nobotee.ui.build();
		 }
	},
	build: function(){
		$( "body" ).prepend("<style>ul.nbscr{margin:0; padding:0; list-style-type:none;} .nb_on{color:green;} .nb_off{color:red;} .nb_btnrow{border-top:1px dotted #ccc; margin-top:8px; padding-top:8px;} .nb_btnrow:first-child{padding-top:0;border-top:none;} #nbsc_mode{color:#888;} li.nb_nt{padding:2px;} li.nb_nt:nth-child(even){background-color:#000073;} #nb_buttons{padding-left:2px; padding-right:2px;} #nb_screen{height:70px; border-bottom:1px solid #00f; background-color:#00f; color:#eee; overflow-y:scroll;} #nobotee h2{padding-left:2px;font-size:12px; color:#fff; display:block; background-color:#444; margin:0; font-weight:700;} #nobotee{z-index:9; font-family:helvetica,arial,sans-serif; left:2px; font-size:12px;height:232px; position:absolute; color:#000; top:55px; width:188px; background-color:#fff;}</style><div id='nobotee'></div>");
		$( "#nobotee" ).append("<div id='nb_contents'><h2>nobotee "+nobotee.version+"</h2></div>");
		$( "#nb_contents" ).append("<div id='nb_screen'><ul class='nbscr' id='nbscr'></ul></div>");
	
		if (nobotee.defaults.time_lmt){
			var t_limit = "<span class='nb_on' id='nbsc_tmlmt'>on</span>";
		} else {
			var t_limit = "<span class='nb_off' id='nbsc_tmlmt'>off</span>";
		}	if (nobotee.defaults.autovt){
			var a_vote = "<span class='nb_on' id='nbsc_autovt'>on</span>";
		} else {
			var a_vote = "<span class='nb_off' id='nbsc_autovt'>off</span>";
		}	if (nobotee.defaults.cmmds){
			var c_mnds = "<span class='nb_on' id='nbsc_cmmds'>on</span>";
		} else {
			var c_mnds = "<span class='nb_off' id='nbsc_cmmds'>off</span>";
		}

		$( "#nb_contents" ).append("<div id='nb_buttons'><div class='nb_btnrow'><button onclick='nobotee.buttons.clear_sc()'>clear</button> &nbsp; <button onclick='nobotee.buttons.toggle_mode()'>mode</button> <span id='nbsc_mode'>"+nobotee.defaults.mode+"</span></div><div class='nb_btnrow'><button onclick='nobotee.buttons.toggle_time_lmt()'>time lmt</button> "+t_limit+" &nbsp; <button onclick='nobotee.buttons.toggle_auto_vote()'>auto vote</button> "+a_vote+"</div> <div class='nb_btnrow'><button onclick='nobotee.buttons.toggle_cmmnds()'>chat commands</button> "+c_mnds+"</div></div>");
		console.log("nobotee ui built");
	},
	destroy: function(){
		$("#nobotee").remove();
	}
};

nobotee.scr ={
	init: function(){
		if (nobotee.defaults.mode == "notifications"){
			nobotee.scr.updt("defaults loaded.<br/> nobotee v"+nobotee.version+" is a go.",1);
		} else if (nobotee.defaults.mode == "cmmd_list"){
			nobotee.scr.gen_list();
		} else if (nobotee.defaults.mode == "song_length"){
			nobotee.scr.song_length();
		}
	},
	updt: function(txt,num){
		if ((nobotee.defaults.mode == "notifications") && (num == 1)){
			$( "#nbscr" ).append("<li class='nb_nt'>"+txt+"</li>");
			$('#nb_screen').scrollTop($('#nb_screen')[0].scrollHeight);
		}

	},
	clear: function(){
		$( "#nbscr" ).empty();
	},
	mode: function(mode){
		nobotee.defaults.mode = mode;
		$( "#nbsc_mode" ).replaceWith( "<span id='nbsc_mode'>"+mode+"</span>" );
		nobotee.scr.clear();
		if (mode == "cmmd_list"){
			nobotee.scr.gen_list();
		} else if (mode == "song_length"){
			nobotee.scr.song_length();
		}
		nobotee.storage.save();

	},
	gen_list: function(){
		//TODO: automate this
		var the_list = "public commands<br/>------<br/>*help<br/>*limit<br/>*theme<br/>*idle [username]<br/>*lastchatted [username]<br/>*points [username]<br/>*joindates<br/>*suggest [topic idea]<br/>*songlink<br/>(plus gdoc commands)<br/>------------<br/>bouncer+ commands<br/>------<br/>*togglelimit<br/>*toggleautovote<br/>*settheme<br/>*notheme<br/>*gdoc";
		$( "#nbscr" ).html("<li class='nb_nt'>"+the_list+"</li>");
	},
	song_length: function(){
		var length = Math.round(nobotee.media.duration);
		var dj = nobotee.dj.username;
		if (length > 320) {
		   var descrip = "WAY TOO LONG. SKIPPING REQUIRED.";
		} else if ((length > 183) && (length <= 320)) {
			var descrip = "TOO LONG. No action required.";
		} else if ((length > 120) && (length <= 183)) {
			var descrip = "Ok.";
		} else if ((length > 60) && (length <= 120)) {
		   	var descrip = "Perfect!";
		} else if (length <= 60) {
			var descrip = "BONUSSS!";
		}
		var report = "DJ: "+dj+"<br/>LENGTH: "+nobotee.secondsToTime(length)+"<br/>"+descrip;
		$( "#nbscr" ).html("<li class='nb_nt'>"+report+"</li>");
	}
};

nobotee.buttons ={
	clear_sc: function(){
		nobotee.scr.clear();
	},
	toggle_mode: function(){
		if (nobotee.defaults.mode == "notifications"){
			nobotee.scr.mode("song_length");
		} else if (nobotee.defaults.mode == "song_length"){
			nobotee.scr.mode("cmmd_list");
		} else if (nobotee.defaults.mode == "cmmd_list"){
			nobotee.scr.mode("notifications");
		}
		nobotee.storage.save();
	},
	toggle_time_lmt: function(){
		if (nobotee.defaults.time_lmt){
		nobotee.defaults.time_lmt = false;
		$( "#nbsc_tmlmt" ).replaceWith( "<span class='nb_off' id='nbsc_tmlmt'>off</span>" );
		} else {
		nobotee.defaults.time_lmt = true;
		$( "#nbsc_tmlmt" ).replaceWith( "<span class='nb_on' id='nbsc_tmlmt'>on</span>" );
		}
		nobotee.storage.save();
	},
	toggle_auto_vote: function(){
		if (nobotee.defaults.autovt){
		nobotee.defaults.autovt = false;
		$( "#nbsc_autovt" ).replaceWith( "<span class='nb_off' id='nbsc_autovt'>off</span>" );
		} else {
		nobotee.defaults.autovt = true;
		$( "#nbsc_autovt" ).replaceWith( "<span class='nb_on' id='nbsc_autovt'>on</span>" );
		}
		nobotee.storage.save();
	},
	toggle_cmmnds: function(){
		if (nobotee.defaults.cmmds){
		nobotee.defaults.cmmds = false;
		$( "#nbsc_cmmds" ).replaceWith( "<span class='nb_off' id='nbsc_cmmds'>off</span>" );
		} else {
		nobotee.defaults.cmmds = true;
		$( "#nbsc_cmmds" ).replaceWith( "<span class='nb_on' id='nbsc_cmmds'>on</span>" );
		}
		nobotee.storage.save();
	}
};

nobotee.api = {
	self:this,
	init:function() {
		console.log("nobotee setting up event listeners..");
		nobotee.api.populate_media();
		nobotee.commands = nobotee.api.get_commands();
		API.on(API.CHAT, nobotee.api.newchat);
		API.on(API.DJ_ADVANCE, nobotee.api.newsong);
		API.on(API.USER_JOIN, nobotee.api.newuser);
		API.on(API.USER_LEAVE, nobotee.api.newexit);
		API.on(API.VOTE_UPDATE, nobotee.api.newvote);
		API.on(API.CURATE_UPDATE, nobotee.api.newheart);
		nobotee.scr.init();
	},
	populate_media: function(){
		var media1 = API.getMedia();
		var dj1 = API.getDJ();
		nobotee.media = media1;
		nobotee.dj = dj1;
		nobotee.timer.entered = Date.now();
	},
	woot: function(){
		$("#woot").click();
	},
	newchat: function(data){
		var name = data.from;
		var id = data.fromID;
		var msg = data.message;
		var lan = data.language;
		nobotee.timer.justSaw(id,true);
		var matches = data.message.match(/^(?:[!*#\/])(\w+)\s*(.*)/);
		if (matches && nobotee.defaults.cmmds) {
			var command = matches[1];
			var args = matches[2];
			if ((nobotee.commands[command]) && (command !== "gdoc")){
				nobotee.talk(nobotee.commands[command]);
			} else if (command == "help"){
				nobotee.talk("help");
			} else if (command == "points"){
				if (args){
					var response = nobotee.api.pointslook(args);
				} else {
					var response = nobotee.api.pointslook(name);
				}
				nobotee.talk(response);
			}else if (command == "theme"){
				if (nobotee.theme){
					nobotee.talk("current theme is '"+nobotee.theme+"'");
				} else {
					nobotee.talk("there is no theme at the moment");
				}
			} else if (command == "songlink"){
				nobotee.api.song_link(name);
			} else if (command == "joindates"){
				var oldest = nobotee.api.oldest_account();
				nobotee.talk(oldest.guy.username+" is the oldest with a joindate of "+oldest.date);
			} else if (command == "idle"){
				if (args){
					nobotee.timer.idleCheck(args);
				} else {
					nobotee.timer.djCheck();
				}
			} else if (command == "lastchatted"){
				if (args){
					nobotee.timer.idleCheck(args,true);
				} else {
					nobotee.timer.djCheck(true);
				}
			} else if ((command == "suggest") && (args)){
				if (!nobotee.themevote.active){
					nobotee.themevote.go(args,name);
				} else {
					nobotee.talk("we are already voting for '"+nobotee.themevote.params.votingfor+"'. let's wait for that to finish first.");
				}
			} else if (command == "limit"){
				if (nobotee.defaults.time_lmt){
					nobotee.talk("there is a limit to song length. try to keep it under 2:45.");
				} else {
					nobotee.talk("there is no limit to song length at this time.");
				}
			//moderator commands
			} else if (API.hasPermission(id, API.ROLE.BOUNCER)){
				if (command == "togglelimit"){
					if (nobotee.defaults.time_lmt){
						nobotee.defaults.time_lmt = false;
						nobotee.talk("the song length limit is now off");
						$( "#nbsc_tmlmt" ).replaceWith( "<span class='nb_off' id='nbsc_tmlmt'>off</span>" );
					} else {
						nobotee.defaults.time_lmt = true;
						nobotee.talk("the song length limit is now on");
						$( "#nbsc_tmlmt" ).replaceWith( "<span class='nb_on' id='nbsc_tmlmt'>on</span>" );
					}
					nobotee.storage.save();
				} else if (command == "toggleautovote"){
					if (nobotee.defaults.autovt){
						nobotee.defaults.autovt = false;
						nobotee.talk("autovote is now off");
						$( "#nbsc_autovt" ).replaceWith( "<span class='nb_off' id='nbsc_autovt'>off</span>" );
					} else {
						nobotee.defaults.autovt = true;
						nobotee.talk("autovote has been activated");
						$( "#nbsc_autovt" ).replaceWith( "<span class='nb_on' id='nbsc_autovt'>on</span>" );
					}
					nobotee.storage.save();
				} else if (command == "settheme"){
					if (args){
						nobotee.theme = args;
						nobotee.talk("the theme has been set to "+args);
						nobotee.storage.save();
					}
				} else if (command == "notheme"){
					nobotee.theme = null;
					nobotee.talk("there is no theme");
					nobotee.storage.save();
				} else if (command == "gdoc"){
					nobotee.commands = nobotee.api.get_commands();
					nobotee.talk("google doc commands have been reloaded.");
				}
			} 

		//end of commands
		} else if (msg == "1" && nobotee.themevote.active){
			nobotee.themevote.params.votes[id] = 1;
		}  else if ((msg == ":fire:") && (nobotee.defaults.cmmds)){
			nobotee.api.firetruck(id);
		}

	},
	newsong: function(data){
		nobotee.media = data.media;
		nobotee.dj = data.dj;
		nobotee.firetrucks = {};
		nobotee.skiptime = false;
		if (nobotee.defaults.autovt){
			nobotee.api.woot();
		}
		if (nobotee.defaults.mode == "song_length") nobotee.scr.song_length();
		if (nobotee.defaults.time_lmt){
			var length = data.media.duration;
			var dj = data.dj.username;
			var song = data.media.title;
			if (length > 320) {
			 	nobotee.talk(nobotee.atmessage(dj)+", your song is wayy too long. Please skip.");
			 	nobotee.skiptime = true;
			 	setTimeout(function () {
     				if (nobotee.skiptime == true) {
      					 API.moderateForceSkip();
      					 nobotee.scr.updt(dj+" played '"+song+"' and was skipped due to song time limit.",1);
    				 }
   				}, 5000);
			} else if ((length > 183) && (length <= 320)) {
				nobotee.talk(nobotee.atmessage(dj)+", TOO LONG!");
			} else if ((length > 120) && (length <= 183)) {
				//
			} else if ((length > 60) && (length <= 120)) {
			   //
			} else if (length <= 60) {
				nobotee.talk(nobotee.atmessage(dj)+", BONUS :sparkles:");
			}
		}
	},
	newuser: function(data){
		nobotee.timer.justSaw(data.id);
	},
	newexit: function(data){
		//
	},
	newvote: function(data){
		nobotee.timer.justSaw(data.user.id);
	},
	newheart: function(data){
		nobotee.timer.justSaw(data.user.id);
	},
	get_commands: function(){
		var commands = {};
        $.ajax({
            dataType: "jsonp",
            url: "https://spreadsheets.google.com/feeds/list/1gu2gsY690NYpd9q5ewX9HO21HVacgukME-H9tPJX-WQ/od6/public/values?alt=json-in-script", 
            success:  function (data){
                for (var command in data.feed.entry){
                    commands[data.feed.entry[command].gsx$command.$t] = data.feed.entry[command].gsx$response.$t;
                }
            }
        });
        return commands;
	},
	song_link: function(name){
		var data = nobotee.media;
		if (data.format == 1){
			nobotee.talk(nobotee.atmessage(name)+" https://www.youtube.com/watch?v="+data.cid);
		} else if (data.format == 2) {
			$.ajax({
           		dataType: "jsonp",
            	url: "https://api.soundcloud.com/tracks/"+data.cid+".json?client_id=27028829630d95b0f9d362951de3ba2c", 
            	success:  function (response){
                	nobotee.talk(nobotee.atmessage(name)+" "+response.permalink_url);
            	}
       		});
		}

	},
	firetruck: function(id){
		console.log("fired");
		if (!nobotee.firetrucks[id]){
			nobotee.firetrucks[id] = 1;
		}
		var thelength = nobotee.themevote.size(nobotee.firetrucks);
		var trucks = "";
		var i;
		for (i = 0; i < thelength; ++i) {
    		trucks += ":fire_engine: ";
		}
		nobotee.talk(trucks);
	},
	oldest_account: function(){
		var users = API.getUsers();
		var oldest_guy = users[0];
		var oldest_time = Date.parse(oldest_guy.dateJoined);
		var i;
		for (i = 0; i < users.length; ++i) {
			var thetime = Date.parse(users[i].dateJoined);
    		if (thetime < oldest_time){
    			oldest_time = thetime;
    			oldest_guy = users[i];
    		}
		}
		var d = new Date(oldest_guy.dateJoined);
		var formatted_joindate = nobotee.formatdate(d, true);
		var obj = {
			guy: oldest_guy,
			date: formatted_joindate
		};
		return obj;
	},
	pointslook: function(username){
		var usr = nobotee.getobj(username);
		if (usr){
			var total_points = usr.listenerPoints + usr.curatorPoints + usr.djPoints;
			var dj_per = Math.round((usr.djPoints / total_points) * 100);
			var lis_per = Math.round((usr.listenerPoints / total_points) * 100);
			var cur_per = Math.round((usr.curatorPoints / total_points) * 100);
			var str = username+": "+dj_per+"% from djing, "+lis_per+"% from voting, and "+cur_per+"% from snags";
		} else {
			var str = "that user does not appear to be here";
		}	
		return str;
	}
};

nobotee.timer = {
	entered: null,
	lastSeen: {},
	lastChatted: {},
	getTime : function (userId,chat) {
		if (chat){
			var last = nobotee.timer.lastChatted[userId];
		} else {
			var last = nobotee.timer.lastSeen[userId];
		}
  		var age_ms = Date.now() - last;
  		var age_s = Math.floor(age_ms / 1000);
  		return age_s;
	},
	defaultTime: function (){
		var last = nobotee.timer.entered;
		var age_ms = Date.now() - last;
  		var age_s = Math.floor(age_ms / 1000);
  		return age_s;
	},
	justSaw : function (uid,chat) {
		var rightNow = Date.now();
  		nobotee.timer.lastSeen[uid] = rightNow;
  		if (chat) nobotee.timer.lastChatted[uid] = rightNow;
	},
	idleCheck: function(username,chat){
		var id = nobotee.getid(username);
		if (id){
			if (chat){
				if (nobotee.timer.lastChatted[id]){
					var scnds = nobotee.timer.getTime(id,true);
					var aprox = "";
				} else {
					var scnds = nobotee.timer.defaultTime();
					var aprox = "> ";
				}
			} else {
				if (nobotee.timer.lastSeen[id]){
					var scnds = nobotee.timer.getTime(id);
					var aprox = "";
				} else {
					var scnds = nobotee.timer.defaultTime();
					var aprox = "> ";
				}
			}
			var final_time = nobotee.secondsToTime(scnds);
			nobotee.talk(username+": "+aprox+""+final_time);
		} else {
			nobotee.talk("that user does not appear to be here");
		}
	},
	djCheck: function(chat){
		var id = nobotee.dj.id;
		if(chat){
			if (nobotee.timer.lastChatted[id]){
				var scnds = nobotee.timer.getTime(id,true);
				var aprox = "";
			} else {
				var scnds = nobotee.timer.defaultTime();
				var aprox = "> ";
			}
		} else {
			if (nobotee.timer.lastSeen[id]){
				var scnds = nobotee.timer.getTime(id);
				var aprox = "";
			} else {
				var scnds = nobotee.timer.defaultTime();
				var aprox = "> ";
			}
		}
		var final_time = nobotee.secondsToTime(scnds);
		nobotee.talk(nobotee.dj.username+": "+aprox+""+final_time);
	},
};

nobotee.talk= function(txt){
	API.sendChat(txt);
};

nobotee.getid = function(username){
		var i;
		var users = API.getUsers();
		var id = null;
		for (i = 0; i < users.length; ++i) {
    		if (username == users[i].username){
    			id = users[i].id;
    			break;
    		}
		}
		return id;
};

nobotee.getobj = function(username){
		var i;
		var users = API.getUsers();
		var obj = null;
		for (i = 0; i < users.length; ++i) {
    		if (username == users[i].username){
    			obj = users[i];
    			break;
    		}
		}
		return obj;
};

nobotee.atmessage = function (username) {
	if (typeof username !== "undefined") { 
		if (username.substring(0, 1).match(/^\@$/)){
  			var atname = username;
 		 } else {
 			var atname = "@"+username;
 		 }
  		return atname;
	}
};

nobotee.secondsToTime = function(secs) {
	var hours = Math.floor(secs / (60 * 60));
	var divisor_for_minutes = secs % (60 * 60);
	var minutes = Math.floor(divisor_for_minutes / 60);
	var divisor_for_seconds = divisor_for_minutes % 60;
	var seconds = Math.ceil(divisor_for_seconds);
	return minutes + "m " + seconds+"secs";
};

nobotee.formatdate = function(d,include_time){
	var offset1 = d.getTimezoneOffset() / 60;
	var offset = - offset1;
	var month = d.getMonth() + 1;
	var day = d.getDate();
	var year = d.getFullYear();
	var hours = d.getHours() + 1;
	var minutes = d.getMinutes() + 1;
	if (minutes <= 9) minutes = "0" + minutes;
	if (hours >= 13){ var ampm = "pm"; var newhours = hours - 12; } else { var ampm = "am"; var newhours = hours;}
	var str = month+"/"+day+"/"+year;
	if (include_time) str += " @ "+newhours+":"+minutes+""+ampm+" (UTC"+offset+")"
	return str;
}

nobotee.themevote  = {
	active: false,
	params: null,
	go: function(txt,name){
		nobotee.themevote.active = true;
		var usrs = API.getUsers();
		var requiredVotes = Math.floor((usrs.length - 1) / 2);
			if (requiredVotes > 4) {
				requiredVotes = 4;
			} else if (requiredVotes < 1){
				requiredVotes = 1;
			}
		nobotee.talk(name+" wants to change the theme to '"+txt+"'. needs "+requiredVotes+" vote(s) to change. say 1 to vote yes.");	
		nobotee.themevote.params = {
			votes: {},
			guy: name,
			required: requiredVotes,
			votingfor: txt
		};
		setTimeout(function() {
				nobotee.themevote.end();
			}, 30 * 1000);
	},
	size: function(obj) {
		var size = 0;
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	},
	end: function() {
		var votes = nobotee.themevote.size(nobotee.themevote.params.votes);

		if (votes >= nobotee.themevote.params.required) {
			nobotee.theme = nobotee.themevote.params.votingfor;
			nobotee.talk(votes + " vote(s). the theme is now '" + nobotee.theme + "'!");
			nobotee.storage.save();
			nobotee.scr.updt("theme was changed to '"+nobotee.theme+"' due to a vote started by "+nobotee.themevote.params.guy,1);
		} else if (nobotee.theme) {
			nobotee.talk("sorry. we're staying with '" + nobotee.theme + "'");
		} else {
			nobotee.talk("sorry. not enough votes to set theme.");
		}

		nobotee.themevote.params = null;
		nobotee.themevote.active = false;
	}
};

nobotee.storage = {
	save: function(){
		var save_file = {
			defaults: nobotee.defaults,
			theme: nobotee.theme
		};
		var preferences = JSON.stringify(save_file);
		localStorage["nobotee"] = preferences;
	},
	restore: function(){
		var favorite = localStorage["nobotee"];
 		 if (!favorite) {
    		return;
 		 }
 		 var preferences = JSON.parse(favorite);
 		 nobotee.defaults = preferences.defaults;
 		 nobotee.theme = preferences.theme;
	}
};

if (!nobotee.started) {
	nobotee.start();
} else {
	nobotee.scr.updt("nobotee is already running.",1);
}