from django.shortcuts import render
from Smart_EV_App.models import *
from django.utils import timezone
from django.utils.timezone import get_fixed_timezone
from django.http import JsonResponse
from django.core.files.storage import default_storage
import os
from django.core.files.base import ContentFile
import shutil
from django.db.models import Q

# Create your views here.

utc_now = timezone.now()

# Convert UTC time to Indian Standard Time (IST)
ist_now = utc_now.astimezone(timezone.get_fixed_timezone(330))  # UTC+5:30 for Indian Standard Time

# Format the datetime as a string if needed
formatted_time = ist_now.strftime('%Y-%m-%d %H:%M:%S')


def save_user(request):
    if request.method == 'POST':
        fullname = request.POST['name']
        contactNo = request.POST['contact']
        emailId = request.POST['email']
        address = request.POST['address']
        password = request.POST['password']

        user = User.objects.filter(
            Q(email=emailId) | Q(contact=contactNo)
        ).first()

        has_error = False
        error = ''

        if user != None and user.email == emailId:
            has_error = True
            error = 'Duplicate email'

        if user != None and user.contact == contactNo:
            has_error = True
            error = 'Duplicate contact number'

        if has_error:
            response_data = {'status': 'NOT OK', 'message': error}
            return JsonResponse(response_data)

        user = User(name=fullname, contact=contactNo, email=emailId,
                    address=address, password=password)
        user.save()

        response_data = {'status': 'OK', 'message': 'Registration successfully...'}
        return JsonResponse(response_data)

def user_login(request):
    if request.method == 'POST':
        contact = request.POST['contact']
        password = request.POST['password']
        user = User.objects.filter(contact = contact, password = password).first()

        if user != None:
            data = {
                    'id' : user.id,
                    'name' : user.name,
                    'contact' : user.contact,
                    'email' : user.email,
                }
            response_data = {'data' : data, 'status': 'OK', 'message': 'Login successfully...'}
            return JsonResponse(response_data)
        else:
            response_data = {'status': 'NOT OK', 'message': 'Invalid Credentials...'}
            return JsonResponse(response_data)
        
      
def get_stations(request):
    if request.method == 'GET':
        stations = Station.objects.filter(is_enabled = 1).order_by('-created_date').values()
        data = list(stations)
        print(data)
        return JsonResponse(data, safe=False)
    

def save_vehical(request):
    if request.method == 'POST':
        user_id = request.POST['user_id']
        company = request.POST['company']
        model = request.POST['model']
        reg = request.POST['reg']
        chassi = request.POST['chassi']
        engine = request.POST['engine']
        battery = request.POST['battery']
        
        vehicle = Vehicle(user_id = user_id, company_name = company, model_no = model, registration_no = reg, chassi_no = chassi, engine_no = engine, battery_capacity = battery)
        vehicle.save()
           
        response_data = {'status': 'OK', 'message': 'Vehicle added successfully...'}
        return JsonResponse(response_data)

def get_battery_status(request):
    result = Battery.objects.latest('id')
    if result != None:
        response_data = {
                'id' : result.id, # type: ignore
                'user_id' : result.user_id, # type: ignore
                'status' : result.status, # type: ignore
            }
        # response_data = {'data' : data, 'status': 'OK'}
        # print(response_data)
        return JsonResponse(response_data)
    else:
        response_data = {'status': 'Not OK'}
        return JsonResponse(response_data)