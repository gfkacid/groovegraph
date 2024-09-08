import React from 'react';

function Content() {
  return (
    <div className="py-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to GrooveGraph</h1>
      <p className="text-muted-text mb-4">
        Connect your Spotify account and build your music identity on the blockchain.
      </p>
      <button className="py-2 px-4 bg-spotify-action text-white rounded-lg hover:bg-opacity-90 transition-colors">
        Connect Spotify
      </button>
    </div>
  );
}

export default Content;