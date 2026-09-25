from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Bookmark, Article

bookmarks_bp = Blueprint("bookmarks", __name__, url_prefix="/api")

@bookmarks_bp.route("/bookmarks", methods=["GET"])
@jwt_required()
def get_user_bookmarks():
    user_id = get_jwt_identity()
    user_bookmarks = Bookmark.query.filter_by(user_id=user_id).order_by(Bookmark.created_at.desc()).all()
    articles = [b.article.to_dict(current_user_id=user_id) for b in user_bookmarks if b.article]
    return jsonify(articles), 200

@bookmarks_bp.route("/articles/<int:article_id>/bookmark", methods=["POST"])
@jwt_required()
def toggle_bookmark(article_id):
    user_id = get_jwt_identity()
    article = Article.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404

    existing = Bookmark.query.filter_by(article_id=article_id, user_id=user_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        bookmarked = False
    else:
        new_bm = Bookmark(article_id=article_id, user_id=user_id)
        db.session.add(new_bm)
        db.session.commit()
        bookmarked = True

    return jsonify({
        "is_bookmarked": bookmarked,
        "message": "Saved to bookmarks" if bookmarked else "Removed from bookmarks"
    }), 200

@bookmarks_bp.route("/articles/<int:article_id>/bookmark", methods=["DELETE"])
@jwt_required()
def delete_bookmark(article_id):
    user_id = get_jwt_identity()
    existing = Bookmark.query.filter_by(article_id=article_id, user_id=user_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()

    return jsonify({
        "is_bookmarked": False,
        "message": "Removed from bookmarks"
    }), 200
