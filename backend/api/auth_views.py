from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request): return JsonResponse({"csrfToken": get_token(request)})

@api_view(["GET"])
@permission_classes([AllowAny])
def session(request):
    return JsonResponse({"authenticated": request.user.is_authenticated, "user": ({"id": request.user.id, "username": request.user.get_username()} if request.user.is_authenticated else None)})

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    user = authenticate(request, username=str(request.data.get("username") or "").strip(), password=request.data.get("password") or "")
    if user is None: return JsonResponse({"error": "Invalid credentials."}, status=400)
    login(request, user)
    return JsonResponse({"authenticated": True, "user": {"id": user.id, "username": user.get_username()}})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return JsonResponse({"authenticated": False})
