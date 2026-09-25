from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Article, Category, Comment, Like
from app.utils.auth import admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required()
def get_admin_stats():
    total_users = User.query.count()
    total_articles = Article.query.count()
    published_articles = Article.query.filter_by(status="published").count()
    draft_articles = Article.query.filter_by(status="draft").count()
    total_comments = Comment.query.count()
    total_categories = Category.query.count()
    total_likes = Like.query.count()
    total_views = sum(a.views for a in Article.query.all())

    category_dist = [
        {"name": c.name, "count": len(c.articles)}
        for c in Category.query.all()
    ]

    top_articles = [
        {
            "id": a.id,
            "title": a.title,
            "views": a.views,
            "status": a.status,
            "likes": len(a.likes)
        }
        for a in Article.query.order_by(Article.views.desc()).limit(5).all()
    ]

    return jsonify({
        "totalUsers": total_users,
        "totalArticles": total_articles,
        "publishedArticles": published_articles,
        "draftArticles": draft_articles,
        "totalComments": total_comments,
        "totalCategories": total_categories,
        "totalLikes": total_likes,
        "totalViews": total_views,
        "categoryDistribution": category_dist,
        "topArticles": top_articles
    }), 200

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@admin_required()
def get_all_users():
    users = User.query.order_by(User.created_at.desc()).all()
    res = []
    for u in users:
        d = u.to_dict()
        d["comments_count"] = len(u.comments)
        d["bookmarks_count"] = len(u.bookmarks)
        d["articles_count"] = len(u.articles)
        res.append(d)
    return jsonify(res), 200

@admin_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@jwt_required()
@admin_required()
def update_user_role(user_id):
    current_admin_id = get_jwt_identity()
    if current_admin_id == user_id:
        return jsonify({"error": "Cannot change your own role"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    new_role = data.get("role")
    if new_role not in ["user", "admin"]:
        return jsonify({"error": "Role must be 'user' or 'admin'"}), 400

    user.role = new_role
    db.session.commit()
    return jsonify({"message": f"User role updated to {new_role}", "user": user.to_dict()}), 200

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@admin_required()
def delete_user(user_id):
    current_admin_id = get_jwt_identity()
    if current_admin_id == user_id:
        return jsonify({"error": "Cannot delete your own account"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200

@admin_bp.route("/comments", methods=["GET"])
@jwt_required()
@admin_required()
def get_all_comments():
    comments = Comment.query.order_by(Comment.created_at.desc()).all()
    res = []
    for c in comments:
        cd = c.to_dict()
        cd["article_title"] = c.article.title if c.article else "Deleted Article"
        cd["article_slug"] = c.article.slug if c.article else "#"
        res.append(cd)
    return jsonify(res), 200
