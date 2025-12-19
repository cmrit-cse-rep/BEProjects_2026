from flask import Flask, render_template, url_for, request
import sqlite3
#from A_Recognition import analyse
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/userlog', methods=['GET', 'POST'])
def userlog():
    if request.method == 'POST':

        connection = sqlite3.connect('user_data.db')
        cursor = connection.cursor()

        name = request.form['name']
        password = request.form['password']

        query = "SELECT name, password FROM user WHERE name = '"+name+"' AND password= '"+password+"'"
        cursor.execute(query)

        result = cursor.fetchall()

        if len(result) == 0:
            return render_template('index.html', msg='Sorry, Incorrect Credentials Provided,  Try Again')
        else:
            return render_template('userlog.html')

    return render_template('index.html')


@app.route('/userreg', methods=['GET', 'POST'])
def userreg():
    if request.method == 'POST':

        connection = sqlite3.connect('user_data.db')
        cursor = connection.cursor()

        name = request.form['name']
        password = request.form['password']
        mobile = request.form['phone']
        email = request.form['email']
        
        print(name, mobile, email, password)

        command = """CREATE TABLE IF NOT EXISTS user(name TEXT, password TEXT, mobile TEXT, email TEXT)"""
        cursor.execute(command)

        cursor.execute("INSERT INTO user VALUES ('"+name+"', '"+password+"', '"+mobile+"', '"+email+"')")
        connection.commit()

        return render_template('index.html', msg='Successfully Registered')
    
    return render_template('index.html')





@app.route('/Live1', methods=['GET', 'POST'])
def Live1():
    if request.method == 'POST':
        
        fileName=request.form['filename1']
        if fileName:
            print(f"readed file {fileName}")
            
            f = open('temp.txt', 'w')
            f.write('static/testvandalism/'+fileName)
            f.close()
        else:
            f = open('temp.txt', 'w')
            f.write('0')
            f.close()
        
        os.system('python vandalism.py')
        return render_template('userlog.html')
    return render_template('userlog.html')


@app.route('/Live2', methods=['GET', 'POST'])
def Live2():
    if request.method == 'POST':
        
        fileName=request.form['filename2']
        if fileName:
            print(f"readed file {fileName}")
            
            f = open('temp.txt', 'w')
            f.write('static/testcrowd_pushing/'+fileName)
            f.close()
        else:
            f = open('temp.txt', 'w')
            f.write('0')
            f.close()
        
        os.system('python crowd_pushing.py')
        return render_template('userlog.html')
    return render_template('userlog.html')


@app.route('/Live3', methods=['GET', 'POST'])
def Live3():
    if request.method == 'POST':
        
        fileName=request.form['filename3']
        if fileName:
            print(f"readed file {fileName}")
            
            f = open('temp.txt', 'w')
            f.write('static/testlarge_crowd/'+fileName)
            f.close()
        else:
            f = open('temp.txt', 'w')
            f.write('0')
            f.close()
        
        os.system('python large_crowd.py')
        return render_template('userlog.html')
    return render_template('userlog.html')


@app.route('/Live4', methods=['GET', 'POST'])
def Live4():
    if request.method == 'POST':
        
        fileName=request.form['filename4']
        if fileName:
            print(f"readed file {fileName}")
            
            f = open('temp.txt', 'w')
            f.write('static/testshop/'+fileName)
            f.close()
        else:
            f = open('temp.txt', 'w')
            f.write('0')
            f.close()
        
        os.system('python Shop_lifting.py')
        return render_template('userlog.html')
    return render_template('userlog.html')


@app.route('/Live5', methods=['GET', 'POST'])
def Live5():
    if request.method == 'POST':
        
        fileName=request.form['filename5']
        if fileName:
            print(f"readed file {fileName}")
            
            f = open('temp.txt', 'w')
            f.write('static/testfight/'+fileName)
            f.close()
        else:
            f = open('temp.txt', 'w')
            f.write('0')
            f.close()
        
        os.system('python fighting.py')
        return render_template('userlog.html')
    return render_template('userlog.html')



@app.route('/Live6', methods=['GET', 'POST'])
def Live6():
    if request.method == 'POST':
        
        fileName=request.form['filename6']
        if fileName:
            print(f"readed file {fileName}")
            
            f = open('temp.txt', 'w')
            f.write('static/testfire/'+fileName)
            f.close()
        else:
            f = open('temp.txt', 'w')
            f.write('0')
            f.close()
        
        os.system('python fire_detection.py')
        return render_template('userlog.html')
    return render_template('userlog.html')



@app.route('/Live7', methods=['GET', 'POST'])
def Live7():
    if request.method == 'POST':
        
        fileName=request.form['filename7']
        if fileName:
            print(f"readed file {fileName}")
            
            f = open('temp.txt', 'w')
            f.write('static/testaccident/'+fileName)
            f.close()
        else:
            f = open('temp.txt', 'w')
            f.write('0')
            f.close()
        
        os.system('python Accidents_detection.py')
        return render_template('userlog.html')
    return render_template('userlog.html')


@app.route('/Live8', methods=['GET', 'POST'])
def Live8():
    if request.method == 'POST':

        fileName=request.form['filename8']
        if fileName:
            print(f"readed file {fileName}")
            
            f = open('temp.txt', 'w')
            f.write('static/testweapon/'+fileName)
            f.close()
        else:
            f = open('temp.txt', 'w')
            f.write('0')
            f.close()

        os.system('python weapon_detection.py')
        return render_template('userlog.html')
    return render_template('userlog.html')


@app.route('/Live9', methods=['GET', 'POST'])
def Live9():
    if request.method == 'POST':

        fileName=request.form['filename8']
        if fileName:
            print(f"readed file {fileName}")
            
            f = open('temp.txt', 'w')
            f.write('static/testemotion/'+fileName)
            f.close()
        else:
            f = open('temp.txt', 'w')
            f.write('0')
            f.close()

        os.system('python combine.py')
        return render_template('userlog.html')
    return render_template('userlog.html')




    



if __name__ == "__main__":
   
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
