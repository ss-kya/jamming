const clientId = '8161908c85024e719e0e841635a0a16c';
const redirectUri = 'http://localhost:3000/';

let accessToken;

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        } 

        // Check for access token match
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        // Check access token and expiration time in the URL
        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
            // Clear parameters, and get a new access token when it expires
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`
            window.location = accessUrl;
        }
    },

    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, 
        { headers: {
            Authorization: `Bearer ${accessToken}`
            }
        }).then(response => {
            return response.json();
        }).then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            }
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        });
    },

    savePlaylist(name, trackUris) {
        if (!name || !trackUris.length) {
            return;
        }

        // Access token set to the current user's access token
        const accessToken = Spotify.getAccessToken();
        // Header set to an object with an Authorization parameter conainting user's access token
        const headers = { Authorization: `Bearer ${accessToken}` };
        let userId;

        // Convert response to JSON, and save it to user's ID variable
        return fetch('https://api.spotify.com/v1/me', { headers: headers }
        ).then(response => response.json()
        ).then(jsonResponse => {
            userId = jsonResponse.id;
            return fetch(`http://api.spotify.com/v1/users/${userId}/playlists`, 
            {
                headers: headers, 
                method: 'POST',
                body: JSON.stringify({ name: name})
            }).then(response => response.json()
            ).then(jsonResponse => {
                const playlistId = jsonResponse.id;
                return fetch(`http://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, 
                {
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({ uris: trackUris})
                })
            })

        })
    }
}


export default Spotify;