from django.urls import path
from .views import (PostListCreateView, 
                    RegisterView, 
                    LoginView, 
                    LogoutView, 
                    PostDetailView,
                    CommentCreateView,
                    CommentDeleteView
                    )

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    # ব্লগ পোস্টের রুট 
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail-update-delete'),

    # ৩. কমেন্ট সিস্টেম
    path('posts/<int:post_id>/comments/', CommentCreateView.as_view(), name='comment-create'),
    path('comments/<int:pk>/', CommentDeleteView.as_view(), name='comment-delete'),
]