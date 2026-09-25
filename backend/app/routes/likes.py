from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Like, Article

likes_bp = Blueprint("likes", __name__, url_prefix="/api/articles")

@likes_bp.route("/<int:article_id>/like", methods=["POST"])
@jwt_required()
def toggle_like(article_id):
    user_id = get_jwt_identity()
    article = Article.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404

    existing = Like.query.filter_by(article_id=article_id, user_id=user_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        liked = False
    else:
        new_like = Like(article_id=article_id, user_id=user_id)
        db.session.add(new_like)
        db.session.commit()
        liked = True

    count = Like.query.filter_by(article_id=article_id).count()
    return jsonify({
        "is_liked": liked,
        "like_count": count,
        "message": "Liked" if liked else "Unliked"
    }), 200

@likes_bp.route("/<int:article_id>/like", methods=["DELETE"])
@jwt_required()
def delete_like(article_id):
    user_id = get_jwt_identity()
    existing = Like.query.filter_by(article_id=article_id, user_id=user_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()

    count = Like.query.filter_by(article_id=article_id).count()
    return jsonify({
        "is_liked": False,
        "like_count": count,
        "message": "Unliked"
    }), 200
