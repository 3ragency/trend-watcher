#!/usr/bin/env python3
"""
YouTube Transcript Scraper
Fetches transcription/subtitles from YouTube videos
"""

import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
    CouldNotRetrieveTranscript
)

def extract_video_id(video_url_or_id):
    """
    Extract video ID from YouTube URL or return as-is if already an ID
    
    Args:
        video_url_or_id: YouTube video URL or video ID
        
    Returns:
        Video ID string
    """
    if "youtube.com" in video_url_or_id or "youtu.be" in video_url_or_id:
        # Extract ID from URL
        if "v=" in video_url_or_id:
            return video_url_or_id.split("v=")[1].split("&")[0]
        elif "youtu.be/" in video_url_or_id:
            return video_url_or_id.split("youtu.be/")[1].split("?")[0]
    return video_url_or_id

def get_transcript(video_id, languages=['ru', 'en']):
    """
    Get transcript for a YouTube video
    
    Args:
        video_id: YouTube video ID
        languages: List of preferred languages (default: ['ru', 'en'])
        
    Returns:
        Dictionary with transcript data
    """
    try:
        # Use the simplified API
        api = YouTubeTranscriptApi()
        fetched = api.fetch(video_id, languages=languages)
        
        # Format the transcript
        transcript_entries = []
        full_text = []
        
        for entry in fetched.snippets:
            transcript_entries.append({
                "text": entry.text,
                "start": round(entry.start, 2),
                "duration": round(entry.duration, 2)
            })
            full_text.append(entry.text)
        
        return {
            "success": True,
            "video_id": video_id,
            "language": fetched.language_code,
            "language_name": fetched.language,
            "type": "auto" if fetched.is_generated else "manual",
            "transcript": transcript_entries,
            "full_text": " ".join(full_text),
            "total_entries": len(transcript_entries)
        }
        
    except TranscriptsDisabled:
        return {
            "success": False,
            "error": "Transcripts are disabled for this video",
            "error_code": "TRANSCRIPTS_DISABLED"
        }
    except NoTranscriptFound:
        return {
            "success": False,
            "error": f"No transcript found in the requested languages: {', '.join(languages)}",
            "error_code": "NO_TRANSCRIPT_FOUND"
        }
    except VideoUnavailable:
        return {
            "success": False,
            "error": "Video is unavailable",
            "error_code": "VIDEO_UNAVAILABLE"
        }
    except CouldNotRetrieveTranscript as e:
        return {
            "success": False,
            "error": f"Could not retrieve transcript: {str(e)}",
            "error_code": "COULD_NOT_RETRIEVE"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "UNKNOWN_ERROR"
        }

def get_available_transcripts(video_id):
    """
    List all available transcripts for a video
    
    Args:
        video_id: YouTube video ID
        
    Returns:
        Dictionary with available transcripts
    """
    try:
        # Get transcript list
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        
        available_transcripts = []
        for transcript in transcript_list._manually_created_transcripts.values():
            available_transcripts.append({
                "language": transcript.language,
                "language_code": transcript.language_code,
                "is_generated": False,
                "is_translatable": transcript.is_translatable
            })
        
        for transcript in transcript_list._generated_transcripts.values():
            available_transcripts.append({
                "language": transcript.language,
                "language_code": transcript.language_code,
                "is_generated": True,
                "is_translatable": transcript.is_translatable
            })
        
        return {
            "success": True,
            "video_id": video_id,
            "transcripts": available_transcripts,
            "total": len(available_transcripts)
        }
        
    except VideoUnavailable:
        return {
            "success": False,
            "error": "Video is unavailable",
            "error_code": "VIDEO_UNAVAILABLE"
        }
    except TranscriptsDisabled:
        return {
            "success": False,
            "error": "Transcripts are disabled for this video",
            "error_code": "TRANSCRIPTS_DISABLED"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "UNKNOWN_ERROR"
        }

def main():
    """Main function to handle CLI arguments"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Video ID or URL is required",
            "error_code": "MISSING_VIDEO_ID"
        }))
        sys.exit(1)
    
    video_url_or_id = sys.argv[1]
    video_id = extract_video_id(video_url_or_id)
    
    # Check if we want to list available transcripts
    if len(sys.argv) > 2 and sys.argv[2] == "--list":
        result = get_available_transcripts(video_id)
    else:
        # Get languages if provided
        languages = ['ru', 'en']  # Default
        if len(sys.argv) > 2:
            languages = sys.argv[2].split(',')
        
        result = get_transcript(video_id, languages)
    
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result["success"] else 1)

if __name__ == "__main__":
    main()
