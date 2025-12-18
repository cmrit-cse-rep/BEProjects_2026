from django.db import models

# Create your models here.

class User(models.Model):
    name = models.CharField(max_length=30, null=True)
    contact = models.CharField(max_length=30, null=True)
    email = models.CharField(max_length=30, null=True)
    password = models.CharField(max_length=30, null=True)
    address = models.TextField(null=True)
    is_enabled = models.IntegerField(default=1)
    created_date = models.DateTimeField(null=True)
    updated_date = models.DateTimeField(null=True)

    class Meta:
        db_table = "users"

class Station(models.Model):
    name = models.CharField(max_length=30, null=True)
    contact = models.CharField(max_length=30, null=True)
    email = models.CharField(max_length=30, null=True)
    latitude  = models.CharField(max_length=30, null=True)
    longitude = models.CharField(max_length=30, null=True)
    address = models.TextField(null=True)
    is_enabled = models.IntegerField(default=1)
    created_date = models.DateTimeField(null=True)
    updated_date = models.DateTimeField(null=True)

    class Meta:
        db_table = "stations"

class Vehicle(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=30, null=True)
    model_no = models.CharField(max_length=30, null=True)
    registration_no = models.CharField(max_length=30, null=True)
    chassi_no  = models.CharField(max_length=30, null=True)
    engine_no = models.CharField(max_length=30, null=True)
    battery_capacity = models.CharField(max_length=30, null=True)
    is_enabled = models.IntegerField(default=1)
    created_date = models.DateTimeField(null=True)
    updated_date = models.DateTimeField(null=True)

    class Meta:
        db_table = "vehicles"


class Battery(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=30, null=True)

    class Meta:
        db_table = "battery"