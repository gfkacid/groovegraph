// This function fetches the top 5 artists for a given Spotify user and returns a formatted string

const spotifyApiUrl = "https://api.spotify.com/v1";

// Main function to be executed by Chainlink Functions
function getTopArtists(spotifyAccountId) {
  // Spotify API credentials (you'll need to securely provide these)
  const clientId = "763cf123f695453587e85a6a1349066f";
  const clientSecret = "dde1e833e77e44f396a302ba14b8fa58";

  // Get access token
  const accessToken = await getSpotifyAccessToken(clientId, clientSecret);

  // Fetch top artists
  const topArtists = await fetchTopArtists(accessToken, spotifyAccountId);

  // Format the result string
  const result = formatResultString(spotifyAccountId, topArtists);

  return result;
}

async function getSpotifyAccessToken(clientId, clientSecret) {
  const response = await Functions.makeHttpRequest({
    url: "https://accounts.spotify.com/api/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
    },
    data: "grant_type=client_credentials",
  });

  if (response.error) {
    throw Error("Failed to get access token");
  }

  return response.data.access_token;
}

async function fetchTopArtists(accessToken, userId) {
  const response = await Functions.makeHttpRequest({
    url: `${spotifyApiUrl}/me/top/artists`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      time_range: "short_term",
      limit: 5,
    },
  });

  if (response.error) {
    throw Error("Failed to fetch top artists");
  }

  return response.data.items.map(artist => artist.id);
}

function formatResultString(userId, artistIds) {
  return [userId, ...artistIds].join(",");
}

return getTopArtists(args[0]);