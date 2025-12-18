# read_serial_data.py
from django.core.management.base import BaseCommand
import serial
import re
from Smart_EV_App.models import Battery, User



class Command(BaseCommand):
    help = 'Reads data from a serial port'

    def add_arguments(self, parser):
        parser.add_argument('--port', type=str, help='Serial port name', required=True)

    def handle(self, *args, **options):
        port = options['port']

        try: 
            ser = serial.Serial(
                port=port,
                baudrate=9600,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
                timeout=5
            )

            if ser.isOpen():
                self.stdout.write(self.style.SUCCESS("Serial port is open."))
            else:
                self.stdout.write(self.style.ERROR("Failed to open serial port."))
                return

            while True:
                data = ser.readline().decode().strip()

                if data:
                    if data.startswith("Smart EV Monitoring System"):
                        continue

                    # self.stdout.write(self.style.SUCCESS(f"Received data: {data}"))
                    start_index = data.find(":") + 1
                    voltage_value = data[start_index:].strip()
                    battery_percentage = round(float(voltage_value) / 6.30 * 100, 1)

                    self.stdout.write(self.style.SUCCESS(f"Battery Percentage: {battery_percentage}"))

                    res = User.objects.first() 
                    if res:
                        Battery.objects.create(user_id = res.id, status = battery_percentage)
                    else:
                        self.stdout.write(self.style.WARNING("No user found. Exiting loop."))
                        break
        
                else:
                    self.stdout.write(self.style.WARNING("No data received."))

                # Additional processing logic can be added here

        except serial.SerialException as e:
            self.stdout.write(self.style.ERROR(f"Serial port error: {e}"))

        finally:
            if 'ser' in locals() and ser.isOpen():
                ser.close()
                self.stdout.write(self.style.SUCCESS("Serial port closed."))