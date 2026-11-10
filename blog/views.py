from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from .serializers import UserRegisterSerializer, PostSerializer, CommentSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Post, Comment


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "message": "User registered successfully",
                "token": token.key,
                "user_id": user.id,
                "username": user.username
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "user_id": user.id,
                "username": user.username
            }, status=status.HTTP_200_OK)
        return Response({
            "error": "Invalid username or password"
        }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({
            "message": "Logged out successfully"
        }, status=status.HTTP_200_OK)



# ==============================================================
# ১. ব্লগের সব পোস্ট দেখা (GET) এবং নতুন পোস্ট তৈরি করা (POST)
# ==============================================================

class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser] #ছবি ও টেক্সট ডেটা গ্রহণ করার জন্য পার্সার ক্লাস ব্যবহার করা হয়েছে

# নতুন পোস্ট সেভ করার সময় লগইন করা ইউজারকে লেখক বানানোর মেথড:

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)



# ==============================================================
# ২. নির্দিষ্ট একটি পোস্টের বিস্তারিত ও কমেন্ট দেখা (GET)
# ==============================================================
class PostDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_200_OK)