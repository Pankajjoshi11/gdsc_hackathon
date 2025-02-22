import random

# Placeholder function – Replace with your AI model
def generate_response(prompt: str) -> str:
    responses = [
        f"Based on your query '{prompt}', I suggest visiting Paris! 🇫🇷",
        f"Your request '{prompt}' sounds perfect for a trip to Tokyo! 🇯🇵",
        f"How about a relaxing vacation in Bali? 🌴 {prompt}",
    ]
    return random.choice(responses)
