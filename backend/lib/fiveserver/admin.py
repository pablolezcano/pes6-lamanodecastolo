from twisted.web import static, server, resource
from twisted.internet import reactor, defer
from twisted.words.xish import domish
from xml.sax.saxutils import escape
from fiveserver import log
from fiveserver.model.lobby import MatchState, Match, Match6
from fiveserver.model import util
from Crypto.Cipher import Blowfish
import binascii

import os
import urllib
import sys
import hashlib
import json
import json
from datetime import datetime
import yaml
import uuid

import base64
base64.decodestring = base64.decodebytes

try: import psutil
except ImportError:
    try:
        import commands
    except ImportError:
        import subprocess as commands


XML_HEADER = """<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/xsl/style.xsl"?>
"""

fsroot = os.environ.get('FSROOT','.')
XSL_FILE=fsroot+"""/%(XslFile)s"""


class XslResource(resource.Resource):
    isLeaf = True

    def __init__(self, adminConfig):
        resource.Resource.__init__(self)
        self.xsl = open(XSL_FILE % dict(adminConfig)).read()
        self.lastModified = datetime.utcnow()
        self.etag = hashlib.md5(self.xsl.encode('utf-8')).hexdigest()

    def _sameContent(self, request):
        etag = request.requestHeaders.getRawHeaders('If-None-Match')
        if not etag:
            etag = request.requestHeaders.getRawHeaders('if-none-match')
        if etag:
            return etag[0] == self.etag
        return False

    def render_HEAD(self, request):
        request.setHeader('ETag', self.etag)
        if self._sameContent(request):
            request.setResponseCode(304)
        return b''

    def render_GET(self, request):
        request.setHeader('Content-Type','text/xml')
        request.setHeader('ETag', self.etag)
        if self._sameContent(request):
            request.setResponseCode(304)
            return b''
        return self.xsl.encode('utf-8')


class BaseXmlResource(resource.Resource):

    def __init__(self, adminConfig, config, authenticated=True):
        resource.Resource.__init__(self)
        self.adminConfig = adminConfig
        self.config = config
        self.authenticated = authenticated
        self.xsl = open(XSL_FILE % dict(adminConfig)).read()
        self.username = adminConfig.AdminUser
        self.password = adminConfig.AdminPassword

    def _makeNonAdminURI(self, request, path):
        return 'http://%s:%d%s' % (
                request.getRequestHostname().decode('utf-8'),
                self.adminConfig.FiveserverWebPort, path)

    def render(self, request):
        # Check for JSON request
        is_json = request.args.get(b'format') == [b'json'] or \
           b'application/json' in (request.getHeader(b'accept') or b'')

        if is_json:
            if hasattr(self, 'render_JSON'):
                return self.render_JSON(request)

        if not self.authenticated:
            return resource.Resource.render(self, request)
        username, password = request.getUser(), request.getPassword()
        if username:
            username = username.decode('utf-8')
        if password:
            password = password.decode('utf-8')
        if username in [None,b'']:
            # NEVER send WWW-authenticate for JSON requests or generally to avoid popup
            # if not is_json:
            #    request.setHeader('WWW-authenticate',
            #        'Basic realm="fiveserver"')
            request.setResponseCode(401)
            return b''
        elif username==self.username and password==self.password:
            return resource.Resource.render(self, request)
        else:
            request.setResponseCode(403)
            request.setHeader('Content-Type', 'text/plain')
            return b'Not authorized'

    def renderError(self, error, request, responseCode=500):
        request.setHeader('Content-Type', 'text/xml')
        request.setResponseCode(responseCode)
        log.msg('SERVER ERROR: %s' % str(error.value))
        request.write((
            '%s<error text="server error" href="/home">'
            '<details>%s</details>'
            '</error>' % (XML_HEADER, str(error.value))
        ).encode('utf-8'))
        request.finish()


class AdminRootResource(BaseXmlResource):
    def __init__(self, adminConfig, config, authenticated=True):
        BaseXmlResource.__init__(self, adminConfig, config, authenticated)
        self.putChild(b'announcements', AnnouncementsResource(adminConfig, config, authenticated))
        self.putChild(b'lobbies', LobbiesResource(adminConfig, config, authenticated))

    def render_GET(self, request):
        request.setHeader('Content-Type','text/xml')
        return ('%s<adminService version="1.0">\
                <server version="%s" ip="%s"/>\
                <log href="/log"/>\
                <biglog href="/log?n=5000"/>\
                <users href="/users"/>\
                <profiles href="/profiles"/>\
                <onlineUsers href="/users/online"/>\
                <stats href="/stats"/>\
                <userlock href="/userlock"/>\
                <userkill href="/userkill"/>\
                <maxusers value="%d" href="/maxusers"/>\
                <debug enabled="%s" href="/debug"/>\
                <storeSettings enabled="%s" href="/settings"/>\
                <roster href="/roster"/>\
                <banned href="/banned"/>\
                <server-ip href="/server-ip"/>\
                <processInfo href="/ps"/>\
                </adminService>' % (
                        XML_HEADER, 
                        self.config.VERSION,
                        self.config.serverIP_wan,
                        self.config.serverConfig.Debug,
                        self.config.isStoreSettingsEnabled())).encode('utf-8')

    def render_JSON(self, request):
        request.setHeader('Content-Type', 'application/json')
        data = {
            'service': 'admin',
            'version': '1.0',
            'server': {
                'version': self.config.VERSION,
                'ip': self.config.serverIP_wan,
                'maxUsers': self.config.serverConfig.MaxUsers,
                'debug': self.config.serverConfig.Debug,
                'storeSettings': self.config.isStoreSettingsEnabled()
            },
            'links': {
                'log': '/log',
                'users': '/users',
                'profiles': '/profiles',
                'onlineUsers': '/users/online',
                'stats': '/stats',
                'banned': '/banned',
                'processInfo': '/ps'
            }
        }
        return json.dumps(data).encode('utf-8')


class StatsRootResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/xml')
        return ('%s<statsService version="1.0">\
                <server version="%s" ip="%s"/>\
                <users href="/users"/>\
                <profiles href="/profiles"/>\
                <onlineUsers href="/users/online"/>\
                <stats href="/stats"/>\
                <processInfo href="/ps"/>\
                </statsService>' % (
                        XML_HEADER, 
                        self.config.VERSION,
                        self.config.serverIP_wan)).encode('utf-8')

    def render_JSON(self, request):
        request.setHeader('Content-Type', 'application/json')
        data = {
            'service': 'stats',
            'version': '1.0',
            'server': {
                'version': self.config.VERSION,
                'ip': self.config.serverIP_wan
            },
            'links': {
                'users': '/users',
                'profiles': '/profiles',
                'onlineUsers': '/users/online',
                'stats': '/stats',
                'processInfo': '/ps'
            }
        }
        return json.dumps(data).encode('utf-8')


class UsersResource(BaseXmlResource):

    def render_GET(self, request):
        def _renderUsers(results, offset, limit):
            total, records = results
            users = domish.Element((None,'users'))
            users['href'] = '/home'
            users['total'] = str(total)
            for usr in records:
                e = users.addElement('user')
                e['username'] = usr.username
                if usr.nonce is not None:
                    e['locked'] = 'yes'
                    e['href'] = self._makeNonAdminURI(
                        request, '/modifyUser/%s' % usr.nonce)
            next = users.addElement('next')
            next['href'] = '/users?offset=%s&limit=%s' % (
                offset+limit, limit)
            request.setHeader('Content-Type','text/xml')
            request.write(('%s%s' % (
                XML_HEADER, users.toXml())).encode('utf-8'))
            request.finish()
        try: offset = int(request.args['offset'][0])
        except: offset = 0
        try: limit = int(request.args['limit'][0])
        except: limit = 30
        d.addCallback(_renderUsers, offset, limit)
        d.addErrback(self.renderError, request)
        return server.NOT_DONE_YET

    def render_JSON(self, request):
        def _renderUsersJSON(results, offset, limit):
            total, records = results
            users_list = []
            for usr in records:
                user_data = {
                    'username': usr.username,
                    'locked': usr.nonce is not None
                }
                if usr.nonce:
                    user_data['nonce'] = usr.nonce
                users_list.append(user_data)
            
            data = {
                'total': total,
                'offset': offset,
                'limit': limit,
                'users': users_list,
                'next': '/users?offset=%s&limit=%s' % (offset+limit, limit)
            }
            request.setHeader('Content-Type', 'application/json')
            request.write(json.dumps(data).encode('utf-8'))
            request.finish()

        try: offset = int(request.args.get(b'offset', [b'0'])[0])
        except: offset = 0
        try: limit = int(request.args.get(b'limit', [b'30'])[0])
        except: limit = 30
        
        d = self.config.userData.browse(offset=offset, limit=limit)
        d.addCallback(_renderUsersJSON, offset, limit)
        d.addErrback(self.renderError, request)
        return server.NOT_DONE_YET


class UsersOnlineResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/xml')
        users = domish.Element((None,'users'))
        users['count'] = str(len(self.config.onlineUsers))
        users['href'] = '/home'
        keys = list(self.config.onlineUsers.keys())
        keys.sort()
        for key in keys:
            usr = self.config.onlineUsers[key]
            e = users.addElement('user')
            try: e['username'] = usr.username
            except AttributeError:
                e['key'] = usr.key
            try: usr.state.lobbyId
            except AttributeError:
                pass
            else:
                if usr.state.lobbyId!=None:
                    try: lobby = self.config.getLobbies()[usr.state.lobbyId]
                    except IndexError:
                        pass
                    else:
                        e['lobby'] = util.toUnicode(lobby.name)
            try: e['profile'] = util.toUnicode(usr.profile.name)
            except AttributeError: pass
            try: e['ip'] = usr.lobbyConnection.addr.host
            except AttributeError: pass
        return ('%s%s' % (XML_HEADER, users.toXml())).encode('utf-8')

    def render_JSON(self, request):
        request.setHeader('Content-Type', 'application/json')
        users_list = []
        keys = list(self.config.onlineUsers.keys())
        keys.sort()
        for key in keys:
            usr = self.config.onlineUsers[key]
            user_data = {}
            try: user_data['username'] = usr.username
            except AttributeError:
                user_data['key'] = usr.key
            
            try: usr.state.lobbyId
            except AttributeError: pass
            else:
                if usr.state.lobbyId is not None:
                    try: lobby = self.config.getLobbies()[usr.state.lobbyId]
                    except IndexError: pass
                    else:
                        user_data['lobby'] = util.toUnicode(lobby.name)
            
            try: user_data['profile'] = util.toUnicode(usr.profile.name)
            except AttributeError: pass
            
            try: user_data['ip'] = usr.lobbyConnection.addr.host
            except AttributeError: pass
            
            users_list.append(user_data)

        data = {
            'count': len(self.config.onlineUsers),
            'users': users_list
        }
        return json.dumps(data).encode('utf-8')


class ProfilesResource(BaseXmlResource):
    isLeaf = True

    def render_GET(self, request):
        is_json = request.args.get(b'format') == [b'json'] or \
                  b'application/json' in request.getHeader(b'accept') or b''
        
        if is_json:
            request.setHeader('Content-Type', 'application/json')
        else:
            request.setHeader('Content-Type', 'text/xml')

        if request.path in [b'/profiles',b'/profiles/']:
            # render list of profiles
            def _renderProfiles(results, offset, limit):
                total, records = results
                if is_json:
                    profiles_list = []
                    for profile in records:
                        profiles_list.append({
                            'name': util.toUnicode(profile.name),
                            'id': profile.id,
                            'href': '/profiles/%s' % profile.id
                        })
                    data = {
                        'total': total,
                        'offset': offset,
                        'limit': limit,
                        'profiles': profiles_list,
                        'next': '/profiles?offset=%s&limit=%s' % (offset+limit, limit)
                    }
                    request.write(json.dumps(data).encode('utf-8'))
                else:
                    profiles = domish.Element((None,'profiles'))
                    profiles['href'] = '/home'
                    profiles['total'] = str(total)
                    for profile in records:
                        e = profiles.addElement('profile')
                        e['name'] = util.toUnicode(profile.name)
                        e['href'] = '/profiles/%s' % profile.id
                    next = profiles.addElement('next')
                    next['href'] = '/profiles?offset=%s&limit=%s' % (
                        offset+limit, limit)
                    request.write(('%s%s' % (
                        XML_HEADER, profiles.toXml())).encode('utf-8'))
                request.finish()
            try: offset = int(request.args['offset'][0])
            except: offset = 0
            try: limit = int(request.args['limit'][0])
            except: limit = 30
            d = self.config.profileData.browse(offset=offset, limit=limit)
            d.addCallback(_renderProfiles, offset, limit)
            d.addErrback(self.renderError, request)
            return server.NOT_DONE_YET

        else:
            # specific profile
            def _renderProfileInfo(x):
                profile, stats = x
                if is_json:
                    games = stats.wins + stats.draws + stats.losses
                    if games > 0:
                        winPct = stats.wins/float(games)
                        avglscr = stats.goals_scored/float(games)
                        avglcon = stats.goals_allowed/float(games)
                    else:
                        winPct = 0.0
                        avglscr = 0.0
                        avglcon = 0.0
                    
                    data = {
                        'id': profile.id,
                        'name': util.toUnicode(profile.name),
                        'rank': profile.rank,
                        'favPlayer': profile.favPlayer,
                        'favPlayerId': profile.favPlayer & 0x0000ffff,
                        'favPlayerTeamId': (profile.favPlayer >> 16) & 0x0000ffff,
                        'favTeam': profile.favTeam,
                        'points': profile.points,
                        'division': self.config.ratingMath.getDivision(profile.points),
                        'disconnects': profile.disconnects,
                        'playTime': profile.playTime,
                        'stats': {
                            'games': games,
                            'wins': stats.wins,
                            'draws': stats.draws,
                            'losses': stats.losses,
                            'goalsScored': stats.goals_scored,
                            'goalsAllowed': stats.goals_allowed,
                            'winningStreakCurrent': stats.streak_current,
                            'winningStreakBest': stats.streak_best,
                            'winningPct': float('%0.1f' % (winPct*100.0)),
                            'goalsScoredAverage': float('%0.2f' % avglscr),
                            'goalsAllowedAverage': float('%0.2f' % avglcon)
                        }
                    }
                    request.write(json.dumps(data).encode('utf-8'))
                else:
                    root = domish.Element((None, 'profile'))
                    root['href'] = '/profiles'
                    root['name'] = util.toUnicode(profile.name)
                    root['id'] = str(profile.id)
                    root.addElement('rank').addContent(str(profile.rank))
                    root.addElement('favPlayer').addContent(str(profile.favPlayer))
                    root.addElement('favPlayerId').addContent(
                        str(profile.favPlayer & 0x0000ffff))
                    root.addElement('favPlayerTeamId').addContent(
                        str((profile.favPlayer >> 16) & 0x0000ffff))
                    root.addElement('favTeam').addContent(str(profile.favTeam))
                    root.addElement('points').addContent(str(profile.points))
                    root.addElement('division').addContent(
                        str(self.config.ratingMath.getDivision(profile.points)))
                    root.addElement('disconnects').addContent(
                        str(profile.disconnects))
                    root.addElement('playTime').addContent(str(profile.playTime))
                    games = stats.wins + stats.draws + stats.losses
                    root.addElement('games').addContent(str(games))
                    root.addElement('wins').addContent(str(stats.wins))
                    root.addElement('draws').addContent(str(stats.draws))
                    root.addElement('losses').addContent(str(stats.losses))
                    root.addElement('goalsScored').addContent(
                        str(stats.goals_scored))
                    root.addElement('goalsAllowed').addContent(
                        str(stats.goals_allowed))
                    root.addElement('winningStreakCurrent').addContent(
                        str(stats.streak_current))
                    root.addElement('winningStreakBest').addContent(
                        str(stats.streak_best))
                    if games>0: 
                        winPct = stats.wins/float(games)
                        avglscr = stats.goals_scored/float(games)
                        avglcon = stats.goals_allowed/float(games)
                    else:
                        winPct = 0.0
                        avglscr = 0.0
                        avglcon = 0.0
                    root.addElement('winningPct').addContent(
                        '%0.1f%%' % (winPct*100.0))
                    root.addElement('goalsScoredAverage').addContent(
                        '%0.2f' % avglscr)
                    root.addElement('goalsAllowedAverage').addContent(
                        '%0.2f' % avglcon)
                    request.write(('%s%s' % (
                        XML_HEADER, root.toXml())).encode('utf-8'))
                request.finish()
            profile_name = request.path.split(b'/')[-1].decode('utf-8')
            try: 
                profile_id = int(profile_name)
                d = self.config.profileLogic.getFullProfileInfoById(
                    profile_id)
            except ValueError:
                d = self.config.profileLogic.getFullProfileInfoByName(
                    profile_name)
            d.addCallback(_renderProfileInfo)
            d.addErrback(self.renderError, request)
            return server.NOT_DONE_YET


class StatsResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/xml')
        root = domish.Element((None,'stats'))
        root['playerCount'] = str(len(self.config.onlineUsers))
        root['href'] = '/home'
        lobbiesElem = root.addElement('lobbies')
        lobbiesElem['count'] = str(len(self.config.lobbies))
        for lobby in self.config.lobbies:
            lobbyElem = lobbiesElem.addElement('lobby')
            lobbyElem['type'] = lobby.typeStr
            lobbyElem['showMatches'] = str(lobby.showMatches)
            lobbyElem['checkRosterHash'] = str(lobby.checkRosterHash)
            lobbyElem['name'] = util.toUnicode(lobby.name)
            lobbyElem['playerCount'] = str(len(lobby.players))
            lobbyElem['roomCount'] = str(len(lobby.rooms))
            m = len([room.match for room in lobby.rooms.values() 
                if room is not None and room.match is not None])
            lobbyElem['matchesInProgress'] = str(m)
            for usr in lobby.players.values():
                userElem = lobbyElem.addElement('user')
                userElem['profile'] = util.toUnicode(usr.profile.name)
                try: userElem['ip'] = usr.lobbyConnection.addr.host
                except AttributeError: pass
            if m>0 and lobby.showMatches:
                matchesElem = lobbyElem.addElement('matches')
                matchRooms = [room for room in lobby.rooms.values()
                    if room is not None and room.match is not None]
                matchRooms.sort()
                for room in matchRooms:
                    matchElem = matchesElem.addElement('match')
                    matchElem['roomName'] = util.toUnicode(room.name)
                    matchElem['matchTime'] = str(room.matchTime)
                    matchElem['score'] = '%d:%d' % (
                        room.match.score_home, room.match.score_away)
                    matchElem['homeTeamId'] = str(room.match.home_team_id)
                    matchElem['awayTeamId'] = str(room.match.away_team_id)
                    if isinstance(room.match, Match):
                        if room.match.home_profile:
                            matchElem['homeProfile'] = util.toUnicode(
                                room.match.home_profile.name)
                        if room.match.away_profile:
                            matchElem['awayProfile'] = util.toUnicode(
                                room.match.away_profile.name)
                    elif isinstance(room.match, Match6):
                        matchElem['clock'] = str(room.match.clock)
                        matchElem['state'] = MatchState.stateText.get(
                            room.match.state, 'Unknown')
                        homeTeam = matchElem.addElement('homeTeam')
                        p = homeTeam.addElement('profile')
                        p['name'] = util.toUnicode(
                            room.teamSelection.home_captain.name)
                        for prf in room.teamSelection.home_more_players:
                            p = homeTeam.addElement('profile')
                            p['name'] = util.toUnicode(prf.name)
                        awayTeam = matchElem.addElement('awayTeam')
                        p = awayTeam.addElement('profile')
                        p['name'] = util.toUnicode(
                            room.teamSelection.away_captain.name)
                        for prf in room.teamSelection.away_more_players:
                            p = awayTeam.addElement('profile')
                            p['name'] = util.toUnicode(prf.name)

        return ('%s%s' % (XML_HEADER, root.toXml())).encode('utf-8')

    def render_JSON(self, request):
        request.setHeader('Content-Type', 'application/json')
        lobbies_data = []
        for lobby in self.config.lobbies:
            lobby_dict = {
                'name': util.toUnicode(lobby.name),
                'type': lobby.typeStr,
                'showMatches': lobby.showMatches,
                'checkRosterHash': lobby.checkRosterHash,
                'playerCount': len(lobby.players),
                'roomCount': len(lobby.rooms),
                'matchesInProgress': 0,
                'users': [],
                'matches': []
            }
            
            # Count matches
            m = len([room.match for room in lobby.rooms.values() 
                if room is not None and room.match is not None])
            lobby_dict['matchesInProgress'] = m

            # Users
            for usr in lobby.players.values():
                user_data = {'profile': util.toUnicode(usr.profile.name)}
                try: user_data['ip'] = usr.lobbyConnection.addr.host
                except AttributeError: pass
                lobby_dict['users'].append(user_data)

            # Matches
            if m > 0 and lobby.showMatches:
                matchRooms = [room for room in lobby.rooms.values()
                    if room is not None and room.match is not None]
                matchRooms.sort()
                for room in matchRooms:
                    match_data = {
                        'roomName': util.toUnicode(room.name),
                        'matchTime': room.matchTime,
                        'score': '%d:%d' % (room.match.score_home, room.match.score_away),
                        'homeTeamId': room.match.home_team_id,
                        'awayTeamId': room.match.away_team_id
                    }
                    if isinstance(room.match, Match):
                        if room.match.home_profile:
                            match_data['homeProfile'] = util.toUnicode(room.match.home_profile.name)
                        if room.match.away_profile:
                            match_data['awayProfile'] = util.toUnicode(room.match.away_profile.name)
                    elif isinstance(room.match, Match6):
                        match_data['clock'] = room.match.clock
                        match_data['state'] = MatchState.stateText.get(room.match.state, 'Unknown')
                        
                        # Home Team
                        home_players = [util.toUnicode(room.teamSelection.home_captain.name)]
                        for prf in room.teamSelection.home_more_players:
                            home_players.append(util.toUnicode(prf.name))
                        match_data['homeTeam'] = home_players

                        # Away Team
                        away_players = [util.toUnicode(room.teamSelection.away_captain.name)]
                        for prf in room.teamSelection.away_more_players:
                            away_players.append(util.toUnicode(prf.name))
                        match_data['awayTeam'] = away_players
                    
                    lobby_dict['matches'].append(match_data)
            
            lobbies_data.append(lobby_dict)

        data = {
            'playerCount': len(self.config.onlineUsers),
            'lobbies': lobbies_data
        }
        return json.dumps(data).encode('utf-8')


class UserLockResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/html')
        return b'''<html><head><title>FiveServer Admin Service</title>
</head><body>
<h3>Enter the username to lock:</h3>
<form name='userlockForm' action='/userlock' method='POST'>
<input name='username' value='' type='text' size='40'/>
<input name='lock' value='lock' type='submit'/>
</form>
</body></html>'''

    def render_POST(self, request):
        is_json = request.args.get(b'format') == [b'json'] or \
                  b'application/json' in (request.getHeader(b'accept') or b'')
        
        def _lockUser(results):
            def _locked(nonce):
                if is_json:
                    request.setHeader('Content-Type', 'application/json')
                    request.write(json.dumps({
                        'success': True,
                        'username': username,
                        'nonce': nonce
                    }).encode('utf-8'))
                else:
                    request.write(('''%s<userLocked username="%s" href="/home">
<unlock href="%s"/></userLocked>''' % (
                        XML_HEADER, username, 
                        self._makeNonAdminURI(
                            request, '/modifyUser/%s' % nonce))
                    ).encode('utf-8'))
                request.finish()
            def _error(error):
                request.setResponseCode(500)
                log.msg('SERVER ERROR: %s' % str(error.value))
                if is_json:
                    request.setHeader('Content-Type', 'application/json')
                    request.write(json.dumps({'success': False, 'error': 'server error'}).encode('utf-8'))
                else:
                    request.write(('%s<error text="server error"/>' % XML_HEADER).encode('utf-8'))
                request.finish()
            if not results:
                request.setResponseCode(404)
                if is_json:
                    request.setHeader('Content-Type', 'application/json')
                    request.write(json.dumps({'success': False, 'error': 'unknown username'}).encode('utf-8'))
                else:
                    request.write((
                        '%s<error text="unknown username"/>' % XML_HEADER).encode('utf-8'))
                request.finish()
                return
            d = self.config.lockUser(username)
            d.addCallback(_locked)
            d.addErrback(_error)
            return d
        
        if is_json:
            request.setHeader('Content-Type', 'application/json')
        else:
            request.setHeader('Content-Type','text/xml')
        try: username = request.args[b'username'][0].decode('utf-8')
        except KeyError:
            request.setResponseCode(400)
            if is_json:
                return json.dumps({'success': False, 'error': 'username parameter missing'}).encode('utf-8')
            return ('%s<error '
                    'text="username parameter missing"/>' % XML_HEADER).encode('utf-8')
        d = self.config.userData.findByUsername(username)
        d.addCallback(_lockUser)
        d.addErrback(self.renderError, request)
        return server.NOT_DONE_YET


class UserKillResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/html')
        return b'''<html><head><title>FiveServer Admin Service</title>
</head><body>
<h3>Enter the username to delete:</h3>
<p>NOTE: you may be able to restore this user later.</p>
<form name='userkillForm' action='/userkill' method='POST'>
<input name='username' value='' type='text' size='40'/>
<input name='kill' value='delete' type='submit'/>
</form>
</body></html>'''

    def render_POST(self, request):
        is_json = request.args.get(b'format') == [b'json'] or \
                  b'application/json' in (request.getHeader(b'accept') or b'')
        
        def _deleteUser(results):
            def _deleted(nonce):
                if is_json:
                    request.setHeader('Content-Type', 'application/json')
                    request.write(json.dumps({
                        'success': True,
                        'username': username,
                        'deleted': True
                    }).encode('utf-8'))
                else:
                    request.write((
                        '%s<userDeleted username="%s" href="/home"/>' % (
                        XML_HEADER, username)
                    ).encode('utf-8'))
                request.finish()
            def _error(error):
                request.setResponseCode(500)
                log.msg('SERVER ERROR: %s' % str(error.value))
                if is_json:
                    request.setHeader('Content-Type', 'application/json')
                    request.write(json.dumps({'success': False, 'error': 'server error'}).encode('utf-8'))
                else:
                    request.write(('%s<error text="server error"/>' % XML_HEADER).encode('utf-8'))
                request.finish()
            if not results:
                request.setResponseCode(404)
                if is_json:
                    request.setHeader('Content-Type', 'application/json')
                    request.write(json.dumps({'success': False, 'error': 'unknown username'}).encode('utf-8'))
                else:
                    request.write((
                        '%s<error text="unknown username"/>' % XML_HEADER).encode('utf-8'))
                request.finish()
                return
            d = self.config.deleteUser(username)
            d.addCallback(_deleted)
            d.addErrback(_error)
            return d
        
        if is_json:
            request.setHeader('Content-Type', 'application/json')
        else:
            request.setHeader('Content-Type','text/xml')
        try: username = request.args[b'username'][0].decode('utf-8')
        except KeyError:
            request.setResponseCode(400)
            if is_json:
                return json.dumps({'success': False, 'error': 'username parameter missing'}).encode('utf-8')
            return ('%s<error '
                    'text="username parameter missing"/>' % XML_HEADER).encode('utf-8')
        d = self.config.userData.findByUsername(username)
        d.addCallback(_deleteUser)
        d.addErrback(self.renderError, request)
        return server.NOT_DONE_YET


class LogResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/plain')
        logFile = fsroot + "/" + self.adminConfig.FiveserverLogFile
        if os.path.exists(logFile):
            logFile = open(logFile)
            logLines = logFile.readlines()
            logFile.close()
            try: n = int(request.args[b'n'][0])
            except: n = 30
            n = min(len(logLines),n)
            n = max(10,min(5000,n))  # keep n sane: [10,5000]
            request.write(b'Last %d lines of the log:\r\n' % n)
            request.write(b'===========================================\r\n')
            for line in logLines[-n:]:
                request.write(line.encode('utf-8'))
            return b''
        else:
            request.setHeader('Content-Type','text/xml')
            return ('%s<error text="no log file available"/>' % XML_HEADER).encode('utf-8')

    def render_JSON(self, request):
        request.setHeader('Content-Type', 'application/json')
        logFile = fsroot + "/" + self.adminConfig.FiveserverLogFile
        if os.path.exists(logFile):
            try: n = int(request.args.get(b'n', [b'30'])[0])
            except: n = 30
            n = max(10, min(5000, n))
            
            with open(logFile, 'r') as f:
                lines = f.readlines()
                last_lines = lines[-n:]
            
            data = {
                'lines': [line.strip() for line in last_lines]
            }
            return json.dumps(data).encode('utf-8')
        else:
            return json.dumps({'error': 'no log file available', 'lines': []}).encode('utf-8')


class DebugResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/html')
        return ('''<html><head><title>FiveServer Admin Service</title>
</head><body>
<h3>Set debug value: (currently: %s)</h3>
<form name='debugForm' action='/debug' method='POST'>
<input name='debug' value='' type='text' size='40'/>
<input name='set' value='set' type='submit'/>
</form>
</body></html>''' % self.config.serverConfig.Debug).encode('utf-8')

    def render_POST(self, request):
        is_json = request.args.get(b'format') == [b'json'] or \
                  b'application/json' in (request.getHeader(b'accept') or b'')
        
        try: debugStr = request.args[b'debug'][0].lower()
        except KeyError: debugStr = ''
        if debugStr in [b'0',b'false',b'no']:
            self.config.serverConfig.Debug = False
        elif debugStr in [b'1',b'true',b'yes']:
            self.config.serverConfig.Debug = True
        log.setDebug(self.config.serverConfig.Debug)
        
        if is_json:
            request.setHeader('Content-Type', 'application/json')
            return json.dumps({'debug': self.config.serverConfig.Debug}).encode('utf-8')
        else:
            request.setHeader('Content-Type','text/xml')
            return ('%s<debug enabled="%s" href="/home"/>' % (
                    XML_HEADER, self.config.serverConfig.Debug)).encode('utf-8')


class MaxUsersResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/html')
        return ('''<html><head><title>FiveServer Admin Service</title>
</head><body>
<h3>Set MaxUsers value: (currently: %s)</h3>
<form name='maxUsersForm' action='/maxusers' method='POST'>
<input name='maxusers' value='' type='text' size='40'/>
<input name='set' value='set' type='submit'/>
</form>
</body></html>''' % self.config.serverConfig.MaxUsers).encode('utf-8')

    def render_POST(self, request):
        is_json = request.args.get(b'format') == [b'json'] or \
                  b'application/json' in (request.getHeader(b'accept') or b'')
        
        try: 
            maxusers = int(request.args[b'maxusers'][0])
        except (KeyError, ValueError): 
            maxusers = self.config.serverConfig.MaxUsers
        if maxusers not in range(1001):
            maxusers = self.config.serverConfig.MaxUsers
            
        self.config.serverConfig.MaxUsers = maxusers
        
        if is_json:
            request.setHeader('Content-Type', 'application/json')
            return json.dumps({'maxUsers': self.config.serverConfig.MaxUsers}).encode('utf-8')
        else:
            request.setHeader('Content-Type','text/xml')
            return ('%s<maxUsers value="%s" href="/home"/>' % (
                    XML_HEADER, self.config.serverConfig.MaxUsers)).encode('utf-8')


class StoreSettingsResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/html')
        return ('''<html><head><title>FiveServer Admin Service</title>
</head><body>
<h3>Set store-settings flag value: (currently: %s)</h3>
<form name='settingsForm' action='/settings' method='POST'>
<input name='store' value='' type='text' size='40'/>
<input name='set' value='set' type='submit'/>
</form>
</body></html>''' % self.config.isStoreSettingsEnabled()).encode('utf-8')

    def render_POST(self, request):
        is_json = request.args.get(b'format') == [b'json'] or \
                  b'application/json' in (request.getHeader(b'accept') or b'')
        
        try: storeStr = request.args[b'store'][0].lower()
        except KeyError: storeStr = ''
        if storeStr in [b'0',b'false',b'no']:
            self.config.serverConfig.StoreSettings = False
        elif storeStr in [b'1',b'true',b'yes']:
            self.config.serverConfig.StoreSettings = True
        
        if is_json:
            request.setHeader('Content-Type', 'application/json')
            return json.dumps({'storeSettings': self.config.serverConfig.StoreSettings}).encode('utf-8')
        else:
            request.setHeader('Content-Type','text/xml')
            return ('%s<storeSettings enabled="%s" href="/home"/>' % (
                    XML_HEADER, self.config.serverConfig.StoreSettings)).encode('utf-8')


class BannedResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/xml')
        banned = domish.Element((None,'banned'))
        banned['href'] = '/home'
        li = banned.addElement('list')
        entries = list(self.config.bannedList.Banned)
        entries.sort()
        for entry in entries:
            e = li.addElement('entry')
            e['href'] = '/ban-remove?entry=%s' % urllib.parse.quote(entry.encode('utf-8'), safe='')
            e['spec'] = entry
            #e.addContent(entry)
        banned.addElement('add')['href'] = '/ban-add'
        banned.addElement('add')['href'] = '/ban-add'
        return ('%s%s' % (XML_HEADER, banned.toXml())).encode('utf-8')

    def render_JSON(self, request):
        request.setHeader('Content-Type', 'application/json')
        entries = list(self.config.bannedList.Banned)
        entries.sort()
        data = {
            'banned': entries,
            'count': len(entries)
        }
        return json.dumps(data).encode('utf-8')


class BanAddResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/html')
        try: entry = request.args[b'entry'][0]
        except KeyError: entry = ''
        return ('''<html><head><title>FiveServer Admin Service</title>
<style>span.ip {color:#800;}</style>
</head><body>
<h3>New entry to add to the banned list:</h3>
<p>
<form name='banForm' action='/ban-add' method='POST'>
<input name='entry' value='%(entry)s' type='text' size='40'/>
<input name='add' value='add' type='submit'/>
</form>
</p>
<p>
<br />
You can either use specific IP or a network, with or without mask 
(specified as bits).<br />Here are some examples:
</p>
<p>
<span class="ip">75.120.4.205</span> 
- bans just this one IP<br />
<span class="ip">75.120.4</span>
- bans all IPs in network, specified by 24-bit address: 
75.120.4.1 - 75.120.4.255<br />
<span class="ip">75.120.4/24</span>
- same as above<br />
<span class="ip">75.120.4/22</span>
- bans all IPs in network, specified by 22-bit address: 
75.120.4.1 - 75.120.7.255<br />
<span class="ip">192.168</span>
- bans all IPs in network, specified by 16-bit address: 
192.168.0.1 - 192.168.255.255<br />
<span class="ip">192.168.</span>
- same as above<br />
<span class="ip">192.168.0.0/16</span>
- same as above
</p>
</body></html>''' % {'entry':entry}).encode('utf-8')

    def render_POST(self, request):
        is_json = request.args.get(b'format') == [b'json'] or \
                  b'application/json' in (request.getHeader(b'accept') or b'')
        
        if is_json:
            request.setHeader('Content-Type', 'application/json')
        else:
            request.setHeader('Content-Type','text/xml')
        
        try: entry = request.args[b'entry'][0]
        except KeyError: entry = b''
        entry = entry.decode('utf-8')
        try:
            try: entryIndex = self.config.bannedList.Banned.index(entry)
            except ValueError:
                if entry.strip()!='':
                    self.config.bannedList.Banned.append(entry)
                    self.config.bannedList.save()
                    self.config.makeFastBannedList()
            
            if is_json:
                return json.dumps({'success': True, 'entry': entry}).encode('utf-8')
            else:
                return ('%s<actionAccepted href="/banned" />' % XML_HEADER).encode('utf-8')
        except Exception as info:
            request.setResponseCode(500)
            log.msg('SERVER ERROR: %s' % info)
            if is_json:
                return json.dumps({'success': False, 'error': 'server error'}).encode('utf-8')
            else:
                return ('%s<error text="server error"/>' % XML_HEADER).encode('utf-8')


class BanRemoveResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/html')
        try: entry = request.args[b'entry'][0]
        except KeyError: entry = b''
        entry = entry.decode('utf-8')
        return ('''<html><head><title>FiveServer Admin Service</title>
</head><body>
<h3>Remove this entry from the banned list:</h3>
<form name='banForm' action='/ban-remove' method='POST'>
<input name='entry' value='%(entry)s' type='text' size='40'/>
<input name='remove' value='remove' type='submit'/>
</form>
</body></html>''' % {'entry':entry}).encode('utf-8')

    def render_POST(self, request):
        is_json = request.args.get(b'format') == [b'json'] or \
                  b'application/json' in (request.getHeader(b'accept') or b'')
        
        if is_json:
            request.setHeader('Content-Type', 'application/json')
        else:
            request.setHeader('Content-Type','text/xml')
        
        try: entry = request.args[b'entry'][0]
        except KeyError: entry = b''
        entry = entry.decode('utf-8')
        try:
            try: entryIndex = self.config.bannedList.Banned.index(entry)
            except ValueError:
                pass
            else:
                del self.config.bannedList.Banned[entryIndex]
                self.config.bannedList.save()
                self.config.makeFastBannedList()
            
            if is_json:
                return json.dumps({'success': True, 'entry': entry}).encode('utf-8')
            else:
                return ('%s<actionAccepted href="/banned" />' % XML_HEADER).encode('utf-8')
        except Exception as info:
            request.setResponseCode(500)
            log.msg('SERVER ERROR: %s' % info)
            if is_json:
                return json.dumps({'success': False, 'error': 'server error'}).encode('utf-8')
            else:
                return ('%s<error text="server error"/>' % XML_HEADER).encode('utf-8')


class ServerIpResource(BaseXmlResource):
    
    def render_GET(self, request):
        request.setHeader('Content-Type','text/html')
        return ('''<html><head><title>FiveServer Admin Service</title>
</head><body>
<h3>Current server IP is: %(ip)s</h3>
<form name='ipRequeryForm' action='/server-ip' method='POST'>
<input name='requery' value='requery' type='submit'/>
</form>
</body></html>''' % {'ip':self.config.serverIP_wan}).encode('utf-8')

    def render_POST(self, request):
        self.config.setIP(resetTime=False)
        request.setHeader('Content-Type','text/xml')
        return ('%s<serverIP-requery started="true" href="/home"/>' % (
                XML_HEADER)).encode('utf-8')


class RosterResource(BaseXmlResource):

    def render_GET(self, request):
        request.setHeader('Content-Type','text/html')
        try: enforceHash = self.config.serverConfig.Roster['enforceHash']
        except: enforceHash = False
        try: compareHash = self.config.serverConfig.Roster['compareHash']
        except: compareHash = False
        return ('''<html><head><title>FiveServer Admin Service</title>
</head><body>
<h3>Edit roster-verification settings</h3>
<form name='rosterSettingsForm' action='/roster' method='POST'>
<table>
<tr>
<td>enforce hash:</td>
<td><input name='enforceHash' value='%(enforceHash)s' type='text' size='10'/>
</td></tr>
<tr>
<td>compare hash:</td>
<td><input name='compareHash' value='%(compareHash)s' type='text' size='10'/>
</td></tr>
</table>
<input name='submit' value='submit' type='submit'/>
</form>
</body></html>''' % {
'enforceHash':enforceHash,
'compareHash':compareHash}).encode('utf-8')

    def render_POST(self, request):
        try: 
            enforceHash = request.args[b'enforceHash'][0].lower() in [
                b'1',b'true']
            compareHash = request.args[b'compareHash'][0].lower() in [
                b'1',b'true']
            self.config.serverConfig.Roster = {
                'enforceHash':enforceHash,
                'compareHash':compareHash}
            request.setHeader('Content-Type','text/xml')
            return ('%s<result text="roster settings changed" '
                    'href="/home"/>' % XML_HEADER).encode('utf-8')
        except IndexError:
            request.setHeader('Content-Type','text/xml')
            return ('%s<error text="missing or incorrect parameters" '
                    'href="/home"/>' % XML_HEADER).encode('utf-8')


class ProcessInfoResource(BaseXmlResource):

    def render_GET(self, request):
        def writeInfo(p, request):
            if p is None:
                class Process:
                    def __init__(self,pid):
                        self.pid = pid
                        status,output = commands.getstatusoutput(
                                'ps -o %%cpu,rss %s' % self.pid)
                        cpu, rss = output.split()[-2:]
                        self.cpu = float(cpu)
                        self.rss = int(rss)
                    def get_memory_info(self):
                        return (self.rss*1024,0)
                    def get_cpu_percent(self):
                        return self.cpu
                p = Process(os.getpid())
            request.setHeader('Content-Type','text/xml')
            procInfo = domish.Element((None,'processInfo'))
            procInfo['href'] = '/home'
            procInfo['pid'] = str(p.pid)
            uptime = procInfo.addElement('uptime')
            uptime['since'] = str(self.config.startDatetime)
            uptime['up'] = str(datetime.now() - self.config.startDatetime)
            stats = procInfo.addElement('stats')
            stats['cpu'] = '%0.1f%%' % p.get_cpu_percent()
            stats['mem'] = '%0.1fM' % (
                    p.get_memory_info()[0]/1024.0/1024)
            extra = procInfo.addElement('info')
            extra['cmdline'] = ' '.join(sys.argv)
            request.write(XML_HEADER.encode('utf-8'))
            request.write(procInfo.toXml().encode('utf-8'))
            request.write(procInfo.toXml().encode('utf-8'))
            request.finish()
        
        is_json = request.args.get(b'format') == [b'json'] or \
                  b'application/json' in request.getHeader(b'accept') or b''

        if is_json:
            def writeJsonInfo(p, request):
                if p is None:
                    class Process:
                        def __init__(self,pid):
                            self.pid = pid
                            status,output = commands.getstatusoutput(
                                    'ps -o %%cpu,rss %s' % self.pid)
                            cpu, rss = output.split()[-2:]
                            self.cpu = float(cpu)
                            self.rss = int(rss)
                        def get_memory_info(self):
                            return (self.rss*1024,0)
                        def get_cpu_percent(self):
                            return self.cpu
                    p = Process(os.getpid())
                
                request.setHeader('Content-Type', 'application/json')
                data = {
                    'pid': p.pid,
                    'uptime': {
                        'since': str(self.config.startDatetime),
                        'up': str(datetime.now() - self.config.startDatetime)
                    },
                    'stats': {
                        'cpu': p.get_cpu_percent(),
                        'mem': p.get_memory_info()[0]/1024.0/1024
                    },
                    'cmdline': ' '.join(sys.argv)
                }
                request.write(json.dumps(data).encode('utf-8'))
                request.finish()
            
            try: self.process
            except AttributeError:
                if 'psutil' in sys.modules:
                    self.process = psutil.Process(os.getpid())
                else:
                    self.process = None
            
            if self.process:
                d = defer.maybeDeferred(self.process.get_cpu_percent, interval=0.1)
                d.addCallback(lambda x: writeJsonInfo(self.process, request))
            else:
                writeJsonInfo(None, request)
            return server.NOT_DONE_YET

        try: self.process
        except AttributeError:
            try: self.process = psutil.Process(os.getpid())
            except NameError:
                self.process = None
        d = defer.Deferred()
        d.addCallback(writeInfo, request)
        reactor.callLater(0.1, d.callback, self.process)
        return server.NOT_DONE_YET


class UserAccountResource(resource.Resource):
    isLeaf = True

    def __init__(self, adminConfig, config):
        resource.Resource.__init__(self)
        self.config = config
        self.cipher = Blowfish.new(binascii.a2b_hex(config.cipherKey), Blowfish.MODE_ECB)

    def render_GET(self, request):
        # Log headers for debugging
        log.msg('UserAccountResource: Request headers: %s' % request.requestHeaders)
        
        username, password = request.getUser(), request.getPassword()
        
        if not username or not password:
            # NEVER send WWW-authenticate to avoid browser popup
            # request.setHeader('WWW-authenticate', 'Basic realm="fiveserver"')
            request.setResponseCode(401)
            return b'Unauthorized'

        username = username.decode('utf-8')
        password = password.decode('utf-8')

        def _auth(results):
            if not results:
                log.msg('UserAccountResource: User %s not found' % username)
                # NEVER send WWW-authenticate
                # request.setHeader('WWW-authenticate', 'Basic realm="fiveserver"')
                request.setResponseCode(401)
                request.write(b'Unauthorized')
                request.finish()
                return

            usr = results[0]
            
            # Verify password
            # Client JS logic:
            # 1. Serial strips non-alphanumeric
            # 2. Serial padded with \0 to 36 chars
            # 3. Hash = md5(serial + username + '-' + password)
            
            # Reconstruct serial padding
            s_serial = usr.serial
            # Ensure no dashes (client removes them)
            s_serial = s_serial.replace('-', '').replace(' ', '')
            # Pad with null bytes to length 36
            while len(s_serial) < 36:
                s_serial += '\0'
                
            s = s_serial + usr.username + '-' + password
            
            m = hashlib.md5()
            m.update(s.encode('utf-8'))
            client_hash_hex = m.hexdigest()
            
            # Encrypt like register.py
            client_hash_bytes = client_hash_hex.encode('utf-8')
            encrypted = self.cipher.encrypt(binascii.a2b_hex(client_hash_bytes))
            encrypted_hex = binascii.b2a_hex(encrypted).decode('utf-8')
            
            
            if encrypted_hex != usr.hash:
                log.msg('UserAccountResource: Password mismatch for user %s' % username)
                # Debug info
                log.msg('Debug: Calculated hash: %s, Stored hash: %s' % (encrypted_hex, usr.hash))
                
                # NEVER send WWW-authenticate
                # request.setHeader('WWW-authenticate', 'Basic realm="fiveserver"')
                request.setResponseCode(401)
                request.write(b'Unauthorized')
                request.finish()
                return

            # Auth success! Fetch profiles to get stats
            d2 = self.config.profileData.getByUserId(usr.id)
            d2.addCallback(_gotProfiles, usr)
            d2.addErrback(self.renderError, request)

        def _gotProfiles(profiles, usr):
            # Construct response
            response = {
                'username': usr.username,
                'serial': usr.serial,
                'profiles': []
            }
            
            if not profiles:
                _sendResponse(response)
                return

            # Process all profiles (basic info)
            for p in profiles:
                response['profiles'].append({
                    'name': util.toUnicode(p.name),
                    'id': p.id,
                    'rank': p.rank,
                    'points': p.points,
                    'rating': p.rating,
                    'disconnects': p.disconnects,
                    'seconds_played': int(p.playTime.total_seconds())
                })
            
            # Get detailed stats only for the first profile (for now)
            main_profile = profiles[0]
            response['profile'] = response['profiles'][0]
            
            # Chain deferreds to get streaks and match stats
            d_streaks = _getStreaks(main_profile.id)
            d_streaks.addCallback(_gotStreaks, main_profile.id, response)
            d_streaks.addErrback(self.renderError, request)

        def _getStreaks(profile_id):
            sql = 'SELECT wins, best FROM streaks WHERE profile_id = %s'
            return self.config.matchData.dbController.dbRead(0, sql, profile_id)

        def _gotStreaks(rows, profile_id, response):
            streaks = {'current': 0, 'best': 0}
            if rows:
                streaks['current'] = rows[0][0]
                streaks['best'] = rows[0][1]
            
            response['streaks'] = streaks
            
            # Now get match stats
            sql = """
                SELECT 
                    COUNT(*) as played,
                    SUM(CASE 
                        WHEN (mp.home = 1 AND m.score_home > m.score_away) OR (mp.home = 0 AND m.score_away > m.score_home) THEN 1 
                        ELSE 0 
                    END) as won,
                    SUM(CASE 
                        WHEN m.score_home = m.score_away THEN 1 
                        ELSE 0 
                    END) as drawn,
                    SUM(CASE 
                        WHEN (mp.home = 1 AND m.score_home < m.score_away) OR (mp.home = 0 AND m.score_away < m.score_home) THEN 1 
                        ELSE 0 
                    END) as lost,
                    SUM(CASE WHEN mp.home = 1 THEN m.score_home ELSE m.score_away END) as goals_for,
                    SUM(CASE WHEN mp.home = 1 THEN m.score_away ELSE m.score_home END) as goals_against
                FROM matches_played mp
                JOIN matches m ON mp.match_id = m.id
                WHERE mp.profile_id = %s
            """
            d_stats = self.config.matchData.dbController.dbRead(0, sql, profile_id)
            d_stats.addCallback(_gotMatchStats, response)
            return d_stats

        def _gotMatchStats(rows, response):
            stats = {
                'played': 0, 'won': 0, 'drawn': 0, 'lost': 0,
                'goals_for': 0, 'goals_against': 0
            }
            
            if rows and rows[0][0] > 0:
                row = rows[0]
                stats['played'] = int(row[0] or 0)
                stats['won'] = int(row[1] or 0)
                stats['drawn'] = int(row[2] or 0)
                stats['lost'] = int(row[3] or 0)
                stats['goals_for'] = int(row[4] or 0)
                stats['goals_against'] = int(row[5] or 0)
            
            response['stats'] = stats
            _sendResponse(response)

        def _sendResponse(response):
            request.setHeader('Content-Type', 'application/json')
            request.write(json.dumps(response).encode('utf-8'))
            request.finish()

        d = self.config.userData.findByUsername(username)
        d.addCallback(_auth)
        d.addErrback(self.renderError, request)
        return server.NOT_DONE_YET

    def renderError(self, error, request):
        log.msg('ERROR in UserAccountResource: %s' % error)
        request.setResponseCode(500)
        request.write(b'Internal Server Error')
        request.finish()


class AnnouncementsResource(BaseXmlResource):
    def __init__(self, adminConfig, config, authenticated=True):
        BaseXmlResource.__init__(self, adminConfig, config, authenticated)
        self.fsroot = os.environ.get('FSROOT', '.')
        self.filepath = os.path.join(self.fsroot, 'etc', 'data', 'announcements.json')
        # Ensure directory exists
        dirname = os.path.dirname(self.filepath)
        if not os.path.exists(dirname):
            os.makedirs(dirname)
        # Create file if not exists
        if not os.path.exists(self.filepath):
            with open(self.filepath, 'w') as f:
                json.dump([], f)

    def _read_announcements(self):
        try:
            with open(self.filepath, 'r') as f:
                return json.load(f)
        except:
            return []

    def _save_announcements(self, data):
        with open(self.filepath, 'w') as f:
            json.dump(data, f, indent=4)

    def render_GET(self, request):
        request.setHeader('Content-Type', 'application/json')
        data = self._read_announcements()
        return json.dumps(data).encode('utf-8')

    def render_POST(self, request):
        request.setHeader('Content-Type', 'application/json')
        try:
            content = request.content.read()
            new_announcement = json.loads(content)
            
            # Validate
            if 'title' not in new_announcement or 'message' not in new_announcement:
                request.setResponseCode(400)
                return json.dumps({'error': 'Missing title or message'}).encode('utf-8')

            announcements = self._read_announcements()
            
            # Add metadata
            new_announcement['id'] = str(uuid.uuid4())
            new_announcement['createdAt'] = datetime.now().isoformat()
            new_announcement['active'] = True
            if 'type' not in new_announcement:
                new_announcement['type'] = 'info'

            announcements.insert(0, new_announcement) # Add to top
            self._save_announcements(announcements)
            
            return json.dumps(announcements).encode('utf-8')
        except Exception as e:
            log.msg('Error creating announcement: %s' % str(e))
            request.setResponseCode(500)
            return json.dumps({'error': str(e)}).encode('utf-8')

    def getChild(self, path, request):
        # Handle DELETE /api/admin/announcements/<id>
        return AnnouncementDetailResource(self.adminConfig, self.config, self.authenticated, path.decode('utf-8'), self)


class AnnouncementDetailResource(BaseXmlResource):
    def __init__(self, adminConfig, config, authenticated, announcement_id, parent):
        BaseXmlResource.__init__(self, adminConfig, config, authenticated)
        self.announcement_id = announcement_id
        self.parent = parent

    def render_DELETE(self, request):
        request.setHeader('Content-Type', 'application/json')
        try:
            announcements = self.parent._read_announcements()
            announcements = [a for a in announcements if a['id'] != self.announcement_id]
            self.parent._save_announcements(announcements)
            return json.dumps({'success': True}).encode('utf-8')
        except Exception as e:
            request.setResponseCode(500)
            return json.dumps({'error': str(e)}).encode('utf-8')


class PublicAnnouncementsResource(BaseXmlResource):
    def __init__(self, adminConfig, config):
        BaseXmlResource.__init__(self, adminConfig, config, authenticated=False)
        self.fsroot = os.environ.get('FSROOT', '.')
        self.filepath = os.path.join(self.fsroot, 'etc', 'data', 'announcements.json')

    def render_GET(self, request):
        request.setHeader('Content-Type', 'application/json')
        try:
            with open(self.filepath, 'r') as f:
                data = json.load(f)
            return json.dumps(data).encode('utf-8')
        except:
            return json.dumps([]).encode('utf-8')


class LobbiesResource(BaseXmlResource):
    def render_GET(self, request):
        request.setHeader('Content-Type', 'application/json')
        # Get lobbies from config
        lobbies_config = self.config.serverConfig.Lobbies
        return json.dumps(lobbies_config).encode('utf-8')

    def render_POST(self, request):
        request.setHeader('Content-Type', 'application/json')
        try:
            content = request.content.read()
            new_lobbies = json.loads(content)
            
            # Update config in memory
            self.config.serverConfig.Lobbies = new_lobbies
            
            # Save to file
            self.config.serverConfig.save()
            
            # Note: This requires server restart to apply fully, 
            # but we save it for persistence.
            # Ideally we would trigger a reload here.
            
            return json.dumps({'success': True, 'message': 'Configuration saved. Restart required to apply changes.'}).encode('utf-8')
        except Exception as e:
            log.msg('Error saving lobbies: %s' % str(e))
            request.setResponseCode(500)
            return json.dumps({'error': str(e)}).encode('utf-8')



class MatchHistoryResource(BaseXmlResource):
    """Resource to get match history"""
    
    def __init__(self, adminConfig, config):
        BaseXmlResource.__init__(self, adminConfig, config, authenticated=False)
    
    def render_GET(self, request):
        request.setHeader('Content-Type', 'application/json')
        
        def _renderMatches(results):
            matches_list = []
            for row in results:
                match_id, score_home, score_away, team_id_home, team_id_away, played_on = row
                # Get players for this match
                d2 = self._getPlayersForMatch(match_id)
                d2.addCallback(_addPlayersToMatch, match_id, score_home, score_away, 
                              team_id_home, team_id_away, played_on, matches_list)
                d2.addErrback(lambda err: log.msg('Error getting players: %s' % err))
            
            # Wait a bit for all player queries to complete
            from twisted.internet import reactor
            reactor.callLater(0.5, lambda: _finishResponse(request, matches_list))
        
        def _addPlayersToMatch(players, match_id, score_home, score_away, 
                              team_id_home, team_id_away, played_on, matches_list):
            home_player = 'Unknown'
            away_player = 'Unknown'
            
            for row in players:
                profile_id, profile_name, is_home = row
                if is_home:
                    home_player = profile_name
                else:
                    away_player = profile_name
            
            matches_list.append({
                'id': match_id,
                'homePlayer': home_player,
                'awayPlayer': away_player,
                'scoreHome': score_home,
                'scoreAway': score_away,
                'homeTeamId': team_id_home,
                'awayTeamId': team_id_away,
                'playedOn': played_on.isoformat() if played_on else None
            })
        
        def _finishResponse(request, matches_list):
            # Sort by date descending
            matches_list.sort(key=lambda x: x['playedOn'] or '', reverse=True)
            
            data = {
                'matches': matches_list,
                'total': len(matches_list)
            }
            request.write(json.dumps(data).encode('utf-8'))
            request.finish()
        
        # Get recent matches (limit to 100)
        try:
            limit = int(request.args.get(b'limit', [b'100'])[0])
        except:
            limit = 100
        
        sql = ('SELECT id, score_home, score_away, team_id_home, team_id_away, played_on '
               'FROM matches ORDER BY played_on DESC LIMIT %s')
        d = self.config.matchData.dbController.dbRead(0, sql, limit)
        d.addCallback(_renderMatches)
        d.addErrback(self.renderError, request)
        return server.NOT_DONE_YET
    
    @defer.inlineCallbacks
    def _getPlayersForMatch(self, match_id):
        sql = ('SELECT mp.profile_id, p.name, mp.home '
               'FROM matches_played mp '
               'JOIN profiles p ON mp.profile_id = p.id '
               'WHERE mp.match_id = %s')
        rows = yield self.config.matchData.dbController.dbRead(0, sql, match_id)
        defer.returnValue(rows)
