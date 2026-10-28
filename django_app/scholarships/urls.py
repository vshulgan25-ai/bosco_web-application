from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("scholars/", views.scholars, name="scholars"),
    path("register/", views.register, name="register"),
    path("login/", views.SiteLoginView.as_view(), name="login"),
    path("logout/", views.SiteLogoutView.as_view(), name="logout"),
    # учень
    path("profile/", views.profile, name="profile"),
    path("apply/", views.apply, name="apply"),
    path("applications/", views.my_applications, name="my_applications"),
    path("cabinet/", views.dashboard, name="dashboard"),
    # панель адміністратора
    path("panel/", views.panel_home, name="panel_home"),
    path("panel/applications/", views.panel_applications, name="panel_applications"),
    path("panel/applications/<int:pk>/", views.PanelApplicationDetailView.as_view(), name="panel_application_detail"),
    path("panel/applications/export.csv", views.panel_export, name="panel_export"),
]
