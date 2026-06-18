"""
Lightweight NLP engine for FAQ intent matching.

Approach
--------
For a small/medium FAQ knowledge base, a full ML/LLM pipeline is overkill.
Instead we build a TF-IDF vector space over each FAQ's question + keywords
(plus the question text repeated for extra weight) and match incoming user
messages against it using cosine similarity. This gives "fuzzy" keyword
matching that tolerates rewording, plurals, etc., while staying fast,
dependency-light, and fully explainable.

If the best match's similarity score falls below
Config.NLP_CONFIDENCE_THRESHOLD, the message is treated as "unknown" and
escalated to a human agent.

This module is intentionally isolated so it can later be swapped for a
spaCy/Dialogflow/OpenAI-based engine without touching the rest of the app -
just keep the same `match(message, faqs)` -> (faq_or_none, confidence) shape.
"""

import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from spellchecker import SpellChecker

_spell = SpellChecker()


def _correct_spelling(text):
    """
    Correct obvious single-word typos (e.g. 'oreder' -> 'order').
    Only replaces a word when the spellchecker is confident; leaves
    short tokens, digits, and words that look like order IDs untouched.
    """
    words = text.split()
    corrected = []
    for word in words:
        clean = re.sub(r"[^a-zA-Z]", "", word)
        if len(clean) <= 2 or not clean.isalpha():
            corrected.append(word)
            continue
        candidate = _spell.correction(clean.lower())
        if candidate and candidate != clean.lower():
            corrected.append(candidate)
        else:
            corrected.append(word)
    return " ".join(corrected)


# A handful of small-talk intents that don't belong in the FAQ table but are
# common enough to handle directly.
SMALL_TALK = {
    "greeting": {
        "patterns": ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
        "response": "Hi there! 👋 I'm your virtual support assistant. Ask me about your order, "
        "refunds, your account, or any technical issue, and I'll do my best to help.",
    },
    "thanks": {
        "patterns": ["thanks", "thank you", "thx", "appreciate it", "cheers"],
        "response": "You're welcome! Is there anything else I can help you with?",
    },
    "goodbye": {
        "patterns": ["bye", "goodbye", "see you", "talk later"],
        "response": "Goodbye! Have a great day. Feel free to come back if you need anything else.",
    },
}


def _normalize(text):
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def detect_small_talk(message):
    """Return a canned response for greetings/thanks/goodbyes, or None."""
    norm = _normalize(message)
    for intent in SMALL_TALK.values():
        for pattern in intent["patterns"]:
            if norm == pattern or norm.startswith(pattern + " ") or norm.endswith(" " + pattern):
                return intent["response"]
    return None


def _faq_corpus_text(faq):
    """Combine question + keywords (and a repeat of the question for weight)."""
    keywords = faq.keywords or ""
    return f"{faq.question} {faq.question} {keywords}"


def match(message, faqs, threshold):
    """
    Match `message` against a list of FAQ model instances.

    Applies spell correction first, then TF-IDF cosine similarity.

    Returns a tuple: (best_faq_or_none, confidence_score, category)
        - best_faq_or_none: the FAQ with the highest similarity, or None if
          there are no FAQs at all or none clear the threshold.
        - confidence_score: float between 0 and 1.
        - category: the matched FAQ's category, or "general" if escalating.
    """
    if not faqs:
        return None, 0.0, "general"

    # Apply spell correction before vectorising
    corrected = _correct_spelling(message)

    corpus = [_faq_corpus_text(f) for f in faqs]
    corpus.append(corrected)

    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
    except ValueError:
        # Happens if the message is *only* stop words / punctuation.
        return None, 0.0, "general"

    query_vec = tfidf_matrix[-1]
    faq_vecs = tfidf_matrix[:-1]

    similarities = cosine_similarity(query_vec, faq_vecs).flatten()
    best_idx = int(similarities.argmax())
    best_score = float(similarities[best_idx])

    if best_score < threshold:
        return None, best_score, "general"

    best_faq = faqs[best_idx]
    return best_faq, best_score, best_faq.category