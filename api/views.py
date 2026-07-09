from django.http import JsonResponse


def api_home(request):
    return JsonResponse({
        "message": "Welcome to ProMatDB API",
        "version": "1.0"
    })