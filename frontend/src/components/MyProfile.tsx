import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "./Button";
import { Card } from "./Card";

interface SpotifyData {
  topArtists: any[];
  topTracks: any[];
  topGenres: any[];
}

function MyProfile() {
  const [token, setToken] = useState<string | null>(null);
  const [spotifyData, setSpotifyData] = useState<SpotifyData | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      exchangeCodeForToken(code);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchSpotifyData();
    }
  }, [token]);

  const fetchSpotifyData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const timeRange = 'short_term';

      const [artistsResponse, tracksResponse] = await Promise.all([
        axios.get('https://api.spotify.com/v1/me/top/artists', {
          headers,
          params: { time_range: timeRange, limit: 5 }
        }),
        axios.get('https://api.spotify.com/v1/me/top/tracks', {
          headers,
          params: { time_range: timeRange, limit: 10 }
        })
      ]);

      const topArtists = artistsResponse.data.items;
      const topTracks = tracksResponse.data.items;
      const topGenres = [...new Set(topArtists.flatMap((artist: any) => artist.genres))].slice(0, 5);
      console.log(topArtists, topTracks, topGenres);

      setSpotifyData({ topArtists, topTracks, topGenres });
    } catch (error) {
      console.error('Error fetching Spotify data:', error);
    }
  };

  const handleConnectSpotify = () => {
    const clientId = '763cf123f695453587e85a6a1349066f';
    const redirectUri = encodeURIComponent('http://localhost:5173/profile');
    const scopes = encodeURIComponent('user-read-private user-read-email user-top-read');
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;
    
    window.location.href = spotifyAuthUrl;
  };

  const exchangeCodeForToken = async (code: string) => {
    const clientId = '763cf123f695453587e85a6a1349066f';
    const redirectUri = 'http://localhost:5173/profile';
    const tokenEndpoint = 'https://accounts.spotify.com/api/token';

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: 'dde1e833e77e44f396a302ba14b8fa58'
    });

    try {
      const response = await axios.post(tokenEndpoint, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      setToken(response.data.access_token);
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  };

  return (
    <div className="flex flex-1">
      <main className="flex-1 p-8">
        <Card className="bg-gray-800 h-full flex flex-col items-center justify-center text-center p-8 rounded-lg">
          {!token ? (
            <>
              <p className="text-gray-400 mb-6">
                Easily connect your Spotify account to start tracking your music
                journey. Analyze your listening habits and unlock personalized insights.
              </p>
              <Button 
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-2 rounded-full flex items-center justify-center"
                onClick={handleConnectSpotify}
              >
                <img src="src/assets/spotify-icon.svg" alt="Spotify" className="w-5 h-5 mr-2" />
                <span>Link your Spotify Profile</span>
              </Button>
            </>
          ) : spotifyData ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Spotify Data</h2>
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Top 5 Artists</h3>
                  <ul className="list-disc list-inside">
                    {spotifyData.topArtists.map(artist => <li key={artist.id}>{artist.name}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Top 10 Tracks</h3>
                  <ul className="list-disc list-inside">
                    {spotifyData.topTracks.map(track => <li key={track.id}>{track.name} by {track.artists[0].name}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Top 5 Genres</h3>
                  <ul className="list-disc list-inside">
                    {spotifyData.topGenres.map(genre => <li key={genre}>{genre}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Loading Spotify data...</p>
          )}
        </Card>
      </main>

      <aside className="w-80 p-4">
        <Card className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-4 mb-4">
            <img src="/avatar.png" alt="User Avatar" className="w-16 h-16 rounded-full" />
            <div>
              <h2 className="text-xl font-semibold">James C.</h2>
              <p className="text-gray-400">james_c@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center text-gray-400">
            <img src="src/assets/spotify-icon.svg" alt="Spotify" className="w-5 h-5 mr-2 inline-block" />
            <span>Spotify: {token ? 'Connected' : '--'}</span>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Share Profile
          </Button>
        </Card>
      </aside>
    </div>
  );
}

export default MyProfile;