from django.urls import path
from .auth_views import csrf, login_view, logout_view, session
urlpatterns = [path("csrf/", csrf), path("session/", session), path("login/", login_view), path("logout/", logout_view)]
