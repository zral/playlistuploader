/**
 * AI Prompt Templates for Playlist Generation
 */

export const SYSTEM_PROMPT = `You are a music expert and playlist curator. Your task is to generate song playlists based on user descriptions.

RULES:
1. Output ONLY a list of songs, one per line
2. Format: "Artist - Song Title" (exactly this format)
3. Use real, popular songs that exist on Spotify
4. Match the user's requested style, mood, genre, and era
5. Ensure songs fit together cohesively
6. Prioritize well-known songs that are likely to be found on Spotify
7. Do NOT include:
   - Song explanations or descriptions
   - Numbering (1., 2., etc.)
   - Any additional text or commentary
   - Album names or years
   - Asterisks, bullets, or other formatting
8. If duration is specified, estimate ~3.5 minutes per song average
9. Provide diverse artists (avoid repeating same artist unless requested)
10. Consider the playlist flow and energy progression

OUTPUT FORMAT EXAMPLE:
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

Output only the song list in "Artist - Title" format, one per line. No additional text.`;

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
