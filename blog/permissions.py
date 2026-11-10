from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    কাস্টম পারমিশন: 
    যে কেউ পোস্ট পড়তে পারবে (GET, HEAD, OPTIONS)।
    কিন্তু এডিট (PUT/PATCH) বা ডিলিট (DELETE) করতে হলে 
    অবশ্যই ওই পোস্টের মূল লেখক হতে হবে।
    """
    def has_object_permission(self, request, view, obj):
        # ১. যদি রিকোয়েস্টটি শুধু পড়ার জন্য হয় (GET):
        if request.method in permissions.SAFE_METHODS:
            return True

        # ২. যদি রিকোয়েস্টটি এডিট বা ডিলিট হয়:
        # পোস্টের লেখক (obj.author) এবং লগইন করা ইউজার (request.user) এক কি না যাচাই করো:
        return obj.author == request.user