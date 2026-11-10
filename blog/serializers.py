from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

# কমেন্টের জন্য সিরিয়ালাইজার:

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')   

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_username', 'text', 'created_at']
        read_only_fields = ['author']


# ব্লগ পোস্টের জন্য সিরিয়ালাইজার:
class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')  # Author এর username প্রদর্শন করার জন্য
    comments = CommentSerializer(many=True, read_only=True)  # পোস্টের সাথে সম্পর্কিত কমেন্টগুলোও প্রদর্শন করা হবে

    class Meta:
        model = Post
        fields = ['id', 
                  'title', 
                  'content', 
                  'author', 
                  'author_username', 
                  'image',
                  'comments',
                  'created_at']
        read_only_fields = ['author']  # Author কে read-only করা হয়েছে, যাতে এটি স্বয়ংক্রিয়ভাবে সেট হয়