from server.services.spotify import get_recommendations

def recommend_songs_by_emotion(access_token: str, emotion: str):
    return get_recommendations(access_token, emotion)