/**
 * Shared functions between client and server
 *
 * Created by pb on 24/11/2014.
 */

var _ = _ ? _ : require('underscore')
    , moment = moment ? moment : require('moment');

Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};

var soundbounceShared = {

    MAX_CHAT_HISTORY: 150,
  /*  MAX_CHAT_VOTE_HISTORY:100,*/

    // makes sure the correct song is at the top of the playlist, starts playing new adds, and removes played songs
    updatePlaylist: function (room) {
        var done = false;
        while (!done) {
            done = true;

            if(room==null)
                return;

            // if we're out of tracks, bail
            if (_.isEmpty(room.tracks))
            {
                room.currentTrackStartedAt = null;
                return;
            }


            // now we have at least one track on list
            // check if the top track is playing (probably a new add to a blank playlist if its not, so start it)
            if (!room.currentTrackStartedAt) {
                // set top track to play
                room.currentTrackStartedAt = new Date();
                room.currentTrackPosition = 0;
                return;
            }

            // if we get here we have a track currently "playing"
            var nowPlaying = room.tracks[0];
            var startedAt = moment(new Date(room.currentTrackStartedAt));
            var now = moment();

            // how far in are we?
            var msPlayed = moment.duration(now - startedAt).asMilliseconds();


            // the top song has finished
            if (msPlayed > nowPlaying.length) {
                // remove the top playin track after setting the next track to start exactly after this one

                //  console.log(room.name+" track " + nowPlaying.name+" stopped.");
                if (room.tracks.length > 1) {
                    // not last track so set start time
                    room.currentTrackStartedAt = startedAt.add(nowPlaying.length, "ms");
                }
                else {
                    // last track, we're done
                    room.currentTrackStartedAt = null;
                }

                // reset position, remove top track
                room.currentTrackPosition = 0;
                room.tracks.shift();

                // and loop around, update again
                done = false;
            }
            else {
                //    console.log(room.name+" currently ", msPlayed, "ms into track " + nowPlaying.name);
                room.currentTrackPosition = msPlayed;
            }
        }
    },

    // shared code when adding to a room
    addTrackToRoom: function (room, track, user) {

        this.updatePlaylist(room);

        var insertIndex = 0;
        if (track.insertAfter) {

            for (var i = 0; i < room.tracks.length; i++) {
                if (room.tracks[i].id == track.insertAfter) {
                    insertIndex = i + 1;
                }
            }
        }

       // console.log("inserting " + track.name + " (" + track.id + ") at index ", insertIndex, " insertafter=" + track.insertAfter);

        if (room.tracks.length > 0 && insertIndex == 0) {
            // you can't insert above the playing track, even if it has more votes.
            insertIndex = 1;
        }

        if(String(user.id)!="1") {
            this.addChatToRoom(room, {type: "add", timestamp: new Date(), user: user, track: track});
        }

        room.tracks.splice(insertIndex, 0, track);
    },

    addChatToRoom: function (room, chat){

        room.chat.push(chat);

        if(room.chat.length>this.MAX_CHAT_HISTORY)
        {
            // remove from the start of the array
            room.chat.shift( room.chat.length - this.MAX_CHAT_HISTORY);

        }
    },

    // voting chat is shared
    addVoteChat: function (room, track, user)
    {
        this.addChatToRoom(room,{type:"vote", timestamp: new Date(), user: user, track: track} );
    }

};


try {
    // doesn't export on client, only server
    module.exports = soundbounceShared;
}catch(e){}