#!/usr/bin/env python3
"""
Instagram Scraper using Instaloader
Scrapes profile data and recent posts from Instagram profiles
"""

import sys
import json
import instaloader
from datetime import datetime

def scrape_instagram_profile(username, limit=30, ig_username=None, ig_password=None):
    """
    Scrape Instagram profile and recent posts
    
    Args:
        username: Instagram username to scrape (without @)
        limit: Maximum number of posts to fetch
        ig_username: Instagram account username for login (optional)
        ig_password: Instagram account password for login (optional)
        
    Returns:
        Dictionary with profile data and posts
    """
    try:
        # Initialize Instaloader
        L = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            quiet=True
        )
        
        # Try to load existing session first
        session_loaded = False
        if ig_username:
            try:
                session_file = f".instagram_session_{ig_username}"
                L.load_session_from_file(ig_username, session_file)
                session_loaded = True
                # Test if session is still valid
                try:
                    L.test_login()
                except Exception:
                    # Session expired, need to re-login
                    session_loaded = False
            except FileNotFoundError:
                # No session file exists yet
                pass
            except Exception as e:
                # Other errors loading session
                pass
        
        # Login if credentials provided and session not loaded
        if ig_username and ig_password and not session_loaded:
            try:
                L.login(ig_username, ig_password)
                # Save session for future use
                L.save_session_to_file(f".instagram_session_{ig_username}")
            except instaloader.exceptions.BadCredentialsException:
                return {
                    "success": False,
                    "error": "Invalid Instagram credentials",
                    "error_code": "BAD_CREDENTIALS"
                }
            except instaloader.exceptions.TwoFactorAuthRequiredException:
                return {
                    "success": False,
                    "error": "Two-factor authentication required",
                    "error_code": "2FA_REQUIRED"
                }
            except Exception as e:
                # Continue without login if it fails
                pass
        
        # Load profile
        profile = instaloader.Profile.from_username(L.context, username)
        
        # Extract profile data
        profile_data = {
            "username": profile.username,
            "full_name": profile.full_name,
            "biography": profile.biography,
            "followers": profile.followers,
            "following": profile.followees,
            "is_verified": profile.is_verified,
            "is_private": profile.is_private,
            "profile_pic_url": profile.profile_pic_url,
            "external_url": profile.external_url,
            "mediacount": profile.mediacount
        }
        
        # Extract recent posts
        posts = []
        post_count = 0
        
        for post in profile.get_posts():
            if post_count >= limit:
                break
                
            post_data = {
                "shortcode": post.shortcode,
                "url": f"https://www.instagram.com/p/{post.shortcode}/",
                "caption": post.caption if post.caption else "",
                "date": post.date_utc.isoformat(),
                "likes": post.likes,
                "comments": post.comments,
                "is_video": post.is_video,
                "video_view_count": post.video_view_count if post.is_video else 0,
                "typename": post.typename,
                "thumbnail_url": post.url
            }
            
            posts.append(post_data)
            post_count += 1
        
        result = {
            "success": True,
            "profile": profile_data,
            "posts": posts,
            "total_posts": len(posts)
        }
        
        return result
        
    except instaloader.exceptions.ProfileNotExistsException:
        return {
            "success": False,
            "error": "Profile does not exist",
            "error_code": "PROFILE_NOT_FOUND"
        }
    except instaloader.exceptions.PrivateProfileNotFollowedException:
        return {
            "success": False,
            "error": "Profile is private",
            "error_code": "PRIVATE_PROFILE"
        }
    except instaloader.exceptions.LoginRequiredException:
        return {
            "success": False,
            "error": "Login required for this operation",
            "error_code": "LOGIN_REQUIRED"
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
            "error": "Username is required",
            "error_code": "MISSING_USERNAME"
        }))
        sys.exit(1)
    
    username = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    ig_username = sys.argv[3] if len(sys.argv) > 3 else None
    ig_password = sys.argv[4] if len(sys.argv) > 4 else None
    
    result = scrape_instagram_profile(username, limit, ig_username, ig_password)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    sys.exit(0 if result["success"] else 1)

if __name__ == "__main__":
    main()
