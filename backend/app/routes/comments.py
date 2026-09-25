from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Comment, Article, User

comments_bp = Blueprint("comments", __name__, url_prefix="/api")

@comments_bp.route("/articles/<int:article_id>/comments", methods=["GET"])
def get_article_comments(article_id):
    comments = Comment.query.filter_by(article_id=article_id).order_by(Comment.created_at.desc()).all()
    return jsonify([c.to_dict() for c in comments]), 200

@comments_bp.route("/articles/<int:article_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(article_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    text = data.get("comment", "").strip()

    if not text:
        return jsonify({"error": "Comment text cannot be empty"}), 400

    article = Article.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404

    comment = Comment(
        article_id=article_id,
        user_id=user_id,
        comment=text
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify({"message": "Comment posted", "comment": comment.to_dict()}), 201

@comments_bp.route("/comments/<int:comment_id>", methods=["DELETE"])
@jwt_required()
def delete_comment(comment_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    comment = Comment.query.get(comment_id)

    if not comment:
        return jsonify({"error": "Comment not found"}), 404

    if comment.user_id != user_id and (not user or user.role != "admin"):
        return jsonify({"error": "Unauthorized to delete this comment"}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Comment deleted"}), 200
