/**
 * AI Prompt Templates for Playlist Generation
 */

export const SYSTEM_PROMPT = `You are a music expert and playlist curator. Your task is to generate song playlists based on user descriptions.

RULES:
1. First line: Output a catchy, creative playlist name (3-6 words max, capture the vibe)
2. Second line: Leave blank
3. Then output song list, one per line
4. Song format: "Artist - Song Title" (exactly this format)
5. Use real, popular songs that exist on Spotify
6. Match the user's requested style, mood, genre, and era
7. Ensure songs fit together cohesively
8. Prioritize well-known songs that are likely to be found on Spotify
9. Do NOT include:
   - Song explanations or descriptions
   - Numbering (1., 2., etc.)
   - Any additional text or commentary
   - Album names or years
   - Asterisks, bullets, or other formatting
10. If duration is specified, estimate ~3.5 minutes per song average
11. Provide diverse artists (avoid repeating same artist unless requested)
12. Consider the playlist flow and energy progression

OUTPUT FORMAT EXAMPLE:
Late Night Electronic Vibes

Daft Punk - One More Time
The Chemical Brothers - Block Rockin' Beats
Fatboy Slim - Right Here, Right Now
Basement Jaxx - Where's Your Head At`;

export interface PlaylistOptions {
  songCount?: number;
  durationMinutes?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildUserPrompt(description: string, options: PlaylistOptions = {}): string {
  const { songCount, durationMinutes } = options;

  let prompt = '';

  if (durationMinutes) {
    const estimatedSongs = Math.round(durationMinutes / 3.5);
    prompt = `Generate a playlist that lasts approximately ${durationMinutes} minutes.
Assume average song length is 3.5 minutes.
You need approximately ${estimatedSongs} songs.

`;
  } else {
    prompt = `Generate a playlist with exactly ${songCount} songs.

`;
  }

  prompt += `Playlist description: ${description}

Remember: First line is the playlist name, then a blank line, then the song list in "Artist - Title" format.`;

  return prompt;
}

export function buildMessages(description: string, options: PlaylistOptions): AIMessage[] {
  return [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: buildUserPrompt(description, options)
    }
  ];
}
